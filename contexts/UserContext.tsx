
import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import { UserProfile, Habit, CaughtPokemon, BallType, TradeOffer, GymLeader, SharedHabitDisplayInfo, SharedHabit } from '../types'; // Added SharedHabit types
import {
  POKEMON_MASTER_LIST,
  POKEMON_API_SPRITE_URL,
  POKEMON_API_SHINY_SPRITE_URL,
  SHINY_CHANCE,
  INITIAL_MAX_HABIT_SLOTS,
  POKEBALL_WEIGHTED_POOL,
  GREATBALL_WEIGHTED_POOL,
  ULTRABALL_WEIGHTED_POOL,
  MASTERBALL_WEIGHTED_POOL,
  TRADE_OFFERS,
  getTranslatedBallName,
  XP_PER_HABIT_COMPLETION,
  XP_FROM_POKEBALL,
  XP_FROM_GREATBALL,
  XP_FROM_ULTRABALL,
  XP_FROM_MASTERBALL,
  PIKACHU_1ST_GEN_NAME,
  PIKACHU_1ST_GEN_SPRITE_URL,
  GYM_LEADERS,
  LEVEL_THRESHOLDS,
  MAX_PLAYER_LEVEL,
  MIN_LEVEL_FOR_SHARED_HABITS,
  DEFAULT_AVATAR_ID,
  MIN_LEVEL_FOR_BOOSTED_HABIT, // Added
  BOOSTED_HABIT_XP_MULTIPLIER, // Added
  BOOSTED_HABIT_POKEBALL_REWARD, // Added
  NORMAL_HABIT_POKEBALL_REWARD, // Added
} from '../constants';
import type { WeightedPokemonEntry } from '../constants';

const XP_PER_SHARED_HABIT_JOINT_COMPLETION = 20; 
const POKEBALLS_PER_SHARED_HABIT_JOINT_COMPLETION = 1;

interface LevelInfo {
  level: number;
  xpToNextLevelDisplay: string;
  currentXPInLevelDisplay: number;
  totalXPForThisLevelSpanDisplay: number;
  xpProgressPercent: number;
  isMaxLevel: boolean;
}

interface SharedHabitsState {
  active: SharedHabit[]; 
  pendingInvitationsReceived: SharedHabit[]; 
  pendingInvitationsSent: SharedHabit[]; 
  isLoading: boolean;
  error: string | null;
}

interface UserContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  login: (username: string, password?: string) => Promise<{ success: boolean; message?: string }>; // Added password
  logout: () => void;
  addHabit: (text: string) => void;
  confirmHabitCompletion: (habitId: string) => void;
  deleteHabit: (habitId: string) => void;
  catchFromPokeBall: () => CaughtPokemon | null;
  catchFromGreatBall: () => CaughtPokemon | null;
  catchFromUltraBall: () => CaughtPokemon | null;
  catchFromMasterBall: () => CaughtPokemon | null;
  releasePokemon: (instanceId: string) => void;
  tradePokemon: (selectedInstanceIds: string[], tradeId: string) => boolean;
  updateUserProfile: (profile: UserProfile) => void;
  saveProfileToCloud: () => Promise<{ success: boolean; message: string }>;
  loadProfileFromCloud: (usernameToLoad?: string) => Promise<{ success: boolean; message: string }>;
  toggleShareHabitsPublicly: () => void;
  selectAvatar: (avatarId: string) => void;
  claimStreakRewards: () => void;
  claimLevelRewards: () => void;
  toastMessage: { id: string, text: string, type: 'info' | 'success' | 'error', leaderImageUrl?: string } | null;
  clearToastMessage: () => void;
  setToastMessage: (text: string, type?: 'info' | 'success' | 'error', leaderImageUrl?: string) => void; 
  calculatePlayerLevelInfo: (totalXP: number) => LevelInfo;
  toggleHabitBoost: (habitId: string) => void; // Added for habit boost

  sharedHabitsData: SharedHabitsState;
  fetchSharedHabitsData: () => Promise<void>;
  sendSharedHabitInvitation: (targetUsername: string, habitText: string) => Promise<{ success: boolean; message?: string }>;
  respondToSharedHabitInvitation: (sharedHabitId: string, response: 'accept' | 'decline') => Promise<{ success: boolean; message?: string }>;
  completeSharedHabit: (sharedHabitId: string) => Promise<{ success: boolean; message?: string }>;
  cancelSentSharedHabitRequest: (sharedHabitId: string) => Promise<{ success: boolean; message?: string }>;
  deleteSharedHabit: (sharedHabitId: string) => Promise<{ success: boolean; message?: string }>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const generateInstanceId = (): string => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
const MAX_HISTORY_ENTRIES = 60;

const parseLocalDateStr = (dateStr: string): Date => {
  return new Date(Number(dateStr.substring(0,4)), Number(dateStr.substring(5,7))-1, Number(dateStr.substring(8,10)));
};

const formatDateToLocalStr = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const calculatePlayerLevelInfoInternal = (totalXP: number): LevelInfo => {
  let currentLevel = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      currentLevel = i + 1;
    } else {
      break;
    }
  }
  currentLevel = Math.min(currentLevel, MAX_PLAYER_LEVEL);

  const isMaxLevel = currentLevel === MAX_PLAYER_LEVEL;
  const xpForCurrentLevelStart = LEVEL_THRESHOLDS[currentLevel - 1];

  let xpToNextLevelDisplay = "N/A";
  let currentXPInLevelDisplay = 0;
  let totalXPForThisLevelSpanDisplay = 0;
  let xpProgressPercent = 100;

  if (!isMaxLevel) {
    const xpForNextLevelStart = LEVEL_THRESHOLDS[currentLevel];
    totalXPForThisLevelSpanDisplay = xpForNextLevelStart - xpForCurrentLevelStart;
    currentXPInLevelDisplay = totalXP - xpForCurrentLevelStart;
    const xpRemainingForNextLevel = totalXPForThisLevelSpanDisplay - currentXPInLevelDisplay;
    xpToNextLevelDisplay = xpRemainingForNextLevel.toLocaleString('pt-BR');
    xpProgressPercent = totalXPForThisLevelSpanDisplay > 0 ? (currentXPInLevelDisplay / totalXPForThisLevelSpanDisplay) * 100 : 0;
    xpProgressPercent = Math.max(0, Math.min(xpProgressPercent, 100));
  } else {
    currentXPInLevelDisplay = totalXP - xpForCurrentLevelStart;
    totalXPForThisLevelSpanDisplay = currentXPInLevelDisplay; 
    xpProgressPercent = 100;
    xpToNextLevelDisplay = "MAX";
  }

  return {
    level: currentLevel,
    xpToNextLevelDisplay,
    currentXPInLevelDisplay,
    totalXPForThisLevelSpanDisplay,
    xpProgressPercent,
    isMaxLevel,
  };
};


interface UserProviderProps {
  children: ReactNode;
}

const TEST_USER_USERNAME = "Testmon";

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessageState, setToastMessageState] = useState<UserContextType['toastMessage']>(null);
  
  const [sharedHabitsData, setSharedHabitsData] = useState<SharedHabitsState>({
    active: [],
    pendingInvitationsReceived: [],
    pendingInvitationsSent: [],
    isLoading: true,
    error: null,
  });

  const setToastMessage = useCallback((text: string, type: 'info' | 'success' | 'error' = 'info', leaderImageUrl?: string) => {
    setToastMessageState({ id: Date.now().toString(), text, type, leaderImageUrl });
  }, []);

  const clearToastMessage = useCallback(() => {
    setToastMessageState(null);
  }, []);


  const initializeProfileFields = useCallback((profileInput: any): UserProfile => {
    try {
      const profile = (typeof profileInput === 'object' && profileInput !== null) ? { ...profileInput } : {};

      const parseNumericField = (value: any, defaultValue: number = 0): number => {
        const num = Number(value);
        return isNaN(num) || !isFinite(num) ? defaultValue : num;
      };

      profile.username = String(profile.username || 'Treinador');
      profile.password = typeof profile.password === 'string' ? profile.password : undefined; // Initialize password
      profile.pokeBalls = parseNumericField(profile.pokeBalls, 0);
      profile.greatBalls = parseNumericField(profile.greatBalls, 0);
      profile.ultraBalls = parseNumericField(profile.ultraBalls, 0);
      profile.masterBalls = parseNumericField(profile.masterBalls, 0);

      if (typeof profile.completionsTowardsGreatBall === 'number' && typeof profile.dailyCompletions !== 'number') {
        profile.dailyCompletions = profile.completionsTowardsGreatBall;
      }
      delete profile.completionsTowardsGreatBall;
      profile.dailyCompletions = parseNumericField(profile.dailyCompletions, 0);

      profile.shinyCaughtPokemonIds = Array.isArray(profile.shinyCaughtPokemonIds)
        ? profile.shinyCaughtPokemonIds.filter((id: any) => typeof id === 'number')
        : [];

      profile.dailyStreak = parseNumericField(profile.dailyStreak, 0);
      profile.lastStreakUpdateDate = (typeof profile.lastStreakUpdateDate === 'string' && profile.lastStreakUpdateDate.match(/^\d{4}-\d{2}-\d{2}$/))
        ? profile.lastStreakUpdateDate
        : "";
      profile.lastStreakDayClaimedForReward = parseNumericField(profile.lastStreakDayClaimedForReward, 0);
      
      profile.completionHistory = (Array.isArray(profile.completionHistory)
        ? profile.completionHistory.filter((item: any) =>
            typeof item === 'object' && item !== null &&
            typeof item.date === 'string' && item.date.match(/^\d{4}-\d{2}-\d{2}$/) &&
            typeof item.count === 'number' && !isNaN(item.count)
          )
        : []
      ).sort((a: any, b: any) => parseLocalDateStr(b.date).getTime() - parseLocalDateStr(a.date).getTime());


      profile.caughtPokemon = (Array.isArray(profile.caughtPokemon) ? profile.caughtPokemon : [])
        .map((p: any) => {
          if (typeof p !== 'object' || p === null) {
            return null;
          }

          let id = 0;
          if (typeof p.id === 'number' && !isNaN(p.id)) {
              id = p.id;
          } else if (typeof p.id === 'string') {
              const parsedId = parseInt(p.id, 10);
              if (!isNaN(parsedId) && parsedId > 0) id = parsedId;
          }

          let name = typeof p.name === 'string' ? p.name.trim() : '';
          const masterEntry = POKEMON_MASTER_LIST.find(m => m.id === id);

          if (id !== 0 && !name && masterEntry) {
              name = masterEntry.name;
          } else if (id === 0 || (id !== 0 && !name && !masterEntry)) {
              if (id !== 0 && name && !masterEntry) {
                // Allow custom named Pokémon if spriteUrl is provided
              } else {
                 return null;
              }
          }

          const validBallTypes: BallType[] = ['poke', 'great', 'ultra', 'master'];
          const caughtWithBallType: BallType = (p.caughtWithBallType && validBallTypes.includes(p.caughtWithBallType))
                                            ? p.caughtWithBallType
                                            : 'poke';
          const isShiny = typeof p.isShiny === 'boolean' ? p.isShiny : false;
          
          let spriteUrl = p.spriteUrl;
          if (!spriteUrl) {
            const baseSpriteId = masterEntry ? masterEntry.id : id;
            spriteUrl = isShiny ? POKEMON_API_SHINY_SPRITE_URL(baseSpriteId) : POKEMON_API_SPRITE_URL(baseSpriteId);
          }

          return {
              id: id,
              name: name,
              spriteUrl: spriteUrl,
              caughtDate: (typeof p.caughtDate === 'string' && p.caughtDate) ? p.caughtDate : new Date().toISOString(),
              instanceId: (typeof p.instanceId === 'string' && p.instanceId) ? p.instanceId : generateInstanceId(),
              caughtWithBallType: caughtWithBallType,
              isShiny: isShiny,
          };
        })
        .filter((p: Partial<CaughtPokemon> | null): p is CaughtPokemon =>
          p !== null &&
          p.id !== undefined && p.id !== 0 &&
          !!p.name &&
          !!p.spriteUrl &&
          !!p.caughtDate &&
          !!p.instanceId &&
          !!p.caughtWithBallType &&
          typeof p.isShiny === 'boolean'
        );

      profile.habits = (Array.isArray(profile.habits) ? profile.habits : [])
        .map((h: any) => {
          if (typeof h !== 'object' || h === null) {
            return {
              id: generateInstanceId(),
              text: 'Hábito Recuperado',
              completedToday: false,
              rewardClaimedToday: false,
              totalCompletions: 0,
            };
          }
          return {
              id: (typeof h.id === 'string' && h.id) ? h.id : generateInstanceId(),
              text: (typeof h.text === 'string' && h.text.trim()) ? h.text.trim() : 'Hábito Sem Nome',
              completedToday: typeof h.completedToday === 'boolean' ? h.completedToday : false,
              rewardClaimedToday: typeof h.rewardClaimedToday === 'boolean' ? h.rewardClaimedToday : false,
              totalCompletions: parseNumericField(h.totalCompletions, 0),
          };
        })
        .filter((h: Habit) => h.id && h.text);

      profile.lastResetDate = (typeof profile.lastResetDate === 'string' && profile.lastResetDate.match(/^\d{4}-\d{2}-\d{2}$/))
        ? profile.lastResetDate
        : getTodayDateString();

      profile.avatarId = typeof profile.avatarId === 'string' ? profile.avatarId : DEFAULT_AVATAR_ID;

      profile.experiencePoints = parseNumericField(profile.experiencePoints, 0);
      profile.shareHabitsPublicly = typeof profile.shareHabitsPublicly === 'boolean' ? profile.shareHabitsPublicly : false;
      profile.lastLevelRewardClaimed = parseNumericField(profile.lastLevelRewardClaimed, 1);
      
      profile.maxHabitSlots = INITIAL_MAX_HABIT_SLOTS;
      profile.boostedHabitId = (typeof profile.boostedHabitId === 'string' && profile.boostedHabitId) ? profile.boostedHabitId : null; // Initialize boostedHabitId

      profile.sharedHabitStreaks = (typeof profile.sharedHabitStreaks === 'object' && profile.sharedHabitStreaks !== null && !Array.isArray(profile.sharedHabitStreaks))
        ? profile.sharedHabitStreaks
        : {};
      profile.lastSharedHabitCompletionResetDate = (typeof profile.lastSharedHabitCompletionResetDate === 'string' && profile.lastSharedHabitCompletionResetDate.match(/^\d{4}-\d{2}-\d{2}$/))
        ? profile.lastSharedHabitCompletionResetDate
        : getTodayDateString(); 

      return profile as UserProfile;
    } catch (error) {
      console.error("UserContext: CRITICAL - Unhandled error in initializeProfileFields. Returning default profile.", error, "Input data:", profileInput);
      return {
        username: 'Treinador', password: undefined, habits: [], caughtPokemon: [], pokeBalls: 0, greatBalls: 0, ultraBalls: 0, masterBalls: 0,
        dailyCompletions: 0, lastResetDate: getTodayDateString(), shinyCaughtPokemonIds: [],
        dailyStreak: 0, lastStreakUpdateDate: "", lastStreakDayClaimedForReward: 0, completionHistory: [],
        experiencePoints: 0, shareHabitsPublicly: false,
        lastLevelRewardClaimed: 1, maxHabitSlots: INITIAL_MAX_HABIT_SLOTS, avatarId: DEFAULT_AVATAR_ID,
        boostedHabitId: null,
        sharedHabitStreaks: {}, lastSharedHabitCompletionResetDate: getTodayDateString(),
      };
    }
  }, []);

  const handleDayRollover = useCallback((profile: UserProfile): UserProfile => {
    const todayLocalStr = getTodayDateString();
    let updatedProfile = { ...profile };

    if (profile.lastResetDate !== todayLocalStr) {
        const previousDayCompletions = updatedProfile.dailyCompletions;
        const previousDayCompletionDateStr = updatedProfile.lastResetDate;

        let newHistory = [{ date: previousDayCompletionDateStr, count: previousDayCompletions }, ...updatedProfile.completionHistory];
        if (newHistory.length > MAX_HISTORY_ENTRIES) {
        newHistory = newHistory.slice(0, MAX_HISTORY_ENTRIES);
        }
        updatedProfile.completionHistory = newHistory;

        updatedProfile.habits = updatedProfile.habits.map(h => ({
        ...h, completedToday: false, rewardClaimedToday: false,
        }));
        updatedProfile.dailyCompletions = 0;
        updatedProfile.lastResetDate = todayLocalStr;
    }

    if (updatedProfile.lastSharedHabitCompletionResetDate !== todayLocalStr) {
        updatedProfile.lastSharedHabitCompletionResetDate = todayLocalStr;
    }
    
    return updatedProfile;
  }, []);

  const updateUserProfile = useCallback((profile: UserProfile) => {
    setCurrentUser(profile);
    try {
      localStorage.setItem('pokemonHabitUser', JSON.stringify(profile));
    } catch (error) {
      console.error("UserContext: Failed to save user profile to localStorage", error);
    }
  }, []);

  const fetchSharedHabitsData = useCallback(async () => {
    if (!currentUser || !currentUser.username) {
        setSharedHabitsData({ active: [], pendingInvitationsReceived: [], pendingInvitationsSent: [], isLoading: false, error: null });
        return;
    }
    const playerLevelInfo = calculatePlayerLevelInfoInternal(currentUser.experiencePoints);
    if (playerLevelInfo.level < MIN_LEVEL_FOR_SHARED_HABITS) {
        setSharedHabitsData({ active: [], pendingInvitationsReceived: [], pendingInvitationsSent: [], isLoading: false, error: null });
        return;
    }

    setSharedHabitsData(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch(`/api/sharedHabits?username=${encodeURIComponent(currentUser.username)}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch shared habits data from server.");
      }
      setSharedHabitsData({
        active: data.active || [],
        pendingInvitationsReceived: data.pendingInvitationsReceived || [],
        pendingInvitationsSent: data.pendingInvitationsSent || [],
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      console.error("Failed to fetch shared habits:", err);
      setSharedHabitsData(prev => ({ ...prev, isLoading: false, error: err.message || "Falha ao carregar hábitos compartilhados" }));
      setToastMessage(err.message || "Falha ao carregar hábitos compartilhados.", "error");
    }
  }, [currentUser?.username, currentUser?.experiencePoints, setToastMessage]);


  const loadUser = useCallback(() => {
    setLoading(true);
    let userProfile: UserProfile | null = null;
    try {
      const storedUser = localStorage.getItem('pokemonHabitUser');
      if (storedUser) {
        let parsedData;
        try {
          parsedData = JSON.parse(storedUser);
        } catch (parseError) {
          console.error("UserContext: Failed to parse user from localStorage.", parseError);
          localStorage.removeItem('pokemonHabitUser');
          parsedData = null;
        }

        if (parsedData) {
          let initializedProfile = initializeProfileFields(parsedData);
          userProfile = handleDayRollover(initializedProfile);
          if (JSON.stringify(userProfile) !== JSON.stringify(initializedProfile)) {
             localStorage.setItem('pokemonHabitUser', JSON.stringify(userProfile));
          }
        }
      }
    } catch (storageAccessError) {
        console.error("UserContext: Error accessing localStorage", storageAccessError);
    } finally {
      setCurrentUser(userProfile);
      setLoading(false);
    }
  }, [initializeProfileFields, handleDayRollover]);

  useEffect(() => {
    loadUser(); 
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'pokemonHabitUser') {
        loadUser(); 
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadUser]); 

  useEffect(() => {
    if (currentUser && currentUser.username) {
        const playerLevelInfo = calculatePlayerLevelInfoInternal(currentUser.experiencePoints);
        if (playerLevelInfo.level >= MIN_LEVEL_FOR_SHARED_HABITS) {
            fetchSharedHabitsData();
        } else {
            setSharedHabitsData({ active: [], pendingInvitationsReceived: [], pendingInvitationsSent: [], isLoading: false, error: null });
        }
    }
  }, [currentUser?.username, currentUser?.experiencePoints, fetchSharedHabitsData]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (currentUser) {
        const todayLocalStr = getTodayDateString();
        let profileChangedByDayRollover = false;
        let tempProfile = { ...currentUser };

        if (currentUser.lastResetDate !== todayLocalStr) {
          tempProfile = handleDayRollover(tempProfile); 
          profileChangedByDayRollover = true;
        }
        
        if (currentUser.lastSharedHabitCompletionResetDate !== todayLocalStr) {
            if (calculatePlayerLevelInfoInternal(currentUser.experiencePoints).level >= MIN_LEVEL_FOR_SHARED_HABITS) {
                 fetchSharedHabitsData(); 
            }
            tempProfile.lastSharedHabitCompletionResetDate = todayLocalStr;
            if (!profileChangedByDayRollover) profileChangedByDayRollover = true;
        }

        if (profileChangedByDayRollover) {
            updateUserProfile(tempProfile);
        }
      }
    }, 60000); 
    return () => clearInterval(intervalId);
  }, [currentUser, handleDayRollover, updateUserProfile, fetchSharedHabitsData]);

  const login = async (username: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    setLoading(true);
    const trimmedUsername = username.trim();

    if (!password) {
      setLoading(false);
      return { success: false, message: "Por favor, insira sua senha." };
    }

    try {
      const response = await fetch(`/api/habits?username=${encodeURIComponent(trimmedUsername)}`);
      let userProfileData;
      let isNewUserScenario = false; // For setting password for the first time

      if (response.ok) { // User exists in cloud
        userProfileData = await response.json();
        if (userProfileData.password && userProfileData.password !== password) {
          setLoading(false);
          return { success: false, message: "Senha incorreta." };
        }
        if (!userProfileData.password) { // Existing user, first time setting password
          userProfileData.password = password;
          isNewUserScenario = true; // Will trigger save later
        }
      } else if (response.status === 404) { // User not in cloud
        const storedUsersString = localStorage.getItem('allPokemonHabitUsers');
        const storedUsers = storedUsersString ? JSON.parse(storedUsersString) : {};
        userProfileData = storedUsers[trimmedUsername];

        if (userProfileData) { // User exists locally
          if (userProfileData.password && userProfileData.password !== password) {
            setLoading(false);
            return { success: false, message: "Senha incorreta." };
          }
           if (!userProfileData.password) { // Existing local user, first time setting password
            userProfileData.password = password;
            isNewUserScenario = true;
          }
        } else { // Completely new user
          userProfileData = {
            username: trimmedUsername, password: password, habits: [], caughtPokemon: [], pokeBalls: 0, greatBalls: 0, ultraBalls: 0, masterBalls: 0,
            dailyCompletions: 0, lastResetDate: getTodayDateString(), shinyCaughtPokemonIds: [],
            dailyStreak: 0, lastStreakUpdateDate: "", lastStreakDayClaimedForReward: 0, completionHistory: [],
            experiencePoints: 0, shareHabitsPublicly: false,
            lastLevelRewardClaimed: 1, maxHabitSlots: INITIAL_MAX_HABIT_SLOTS, avatarId: DEFAULT_AVATAR_ID,
            boostedHabitId: null,
            sharedHabitStreaks: {}, lastSharedHabitCompletionResetDate: getTodayDateString(),
          };
          isNewUserScenario = true;
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Falha ao verificar perfil: ${response.status}`);
      }
      
      let userProfile = initializeProfileFields(userProfileData);
      userProfile = handleDayRollover(userProfile);

      localStorage.setItem('pokemonHabitUser', JSON.stringify(userProfile));
      const allUsersData = localStorage.getItem('allPokemonHabitUsers');
      const allUsers = allUsersData ? JSON.parse(allUsersData) : {};
      allUsers[userProfile.username] = userProfile;
      localStorage.setItem('allPokemonHabitUsers', JSON.stringify(allUsers));
      
      setCurrentUser(userProfile);
      setLoading(false);

      if (isNewUserScenario) { // Save new user or user with new password to cloud
        await saveProfileToCloud(); // Fire and forget for login flow, or handle result
        return { success: true, message: userProfileData.password ? "Login bem-sucedido!" : "Senha definida e login bem-sucedido!" };
      }
      return { success: true, message: "Login bem-sucedido!" };

    } catch (error: any) {
      console.error("UserContext: Error during login:", error);
      setCurrentUser(null);
      localStorage.removeItem('pokemonHabitUser');
      setLoading(false);
      return { success: false, message: error.message || "Ocorreu um erro durante o login." };
    }
  };


  const logout = () => {
    if (currentUser) {
      try {
        const profileBeforeLogout = initializeProfileFields(currentUser); 
        const finalProfileToSave = handleDayRollover(profileBeforeLogout);
        const storedUsersData = localStorage.getItem('allPokemonHabitUsers');
        const storedUsers = storedUsersData ? JSON.parse(storedUsersData) : {};
        storedUsers[finalProfileToSave.username] = finalProfileToSave;
        localStorage.setItem('allPokemonHabitUsers', JSON.stringify(storedUsers));
      } catch (error) {
        console.error("UserContext: Error saving user data on logout:", error);
      }
    }
    setCurrentUser(null);
    localStorage.removeItem('pokemonHabitUser');
    setSharedHabitsData({ active: [], pendingInvitationsReceived: [], pendingInvitationsSent: [], isLoading: false, error: null });
    setLoading(false);
  };

  const addHabit = (text: string) => {
    if (!currentUser || currentUser.habits.length >= currentUser.maxHabitSlots) return;
    const newHabit: Habit = {
      id: generateInstanceId(), text: text.trim(), completedToday: false, rewardClaimedToday: false, 
      totalCompletions: 0,
    };
    updateUserProfile({ ...currentUser, habits: [...currentUser.habits, newHabit] });
  };

  const confirmHabitCompletion = (habitId: string) => {
    if (!currentUser) return;

    const habitIndex = currentUser.habits.findIndex(h => h.id === habitId);
    if (habitIndex === -1) return;

    const habitToConfirm = currentUser.habits[habitIndex];
    if (habitToConfirm.completedToday) return;

    const updatedHabits = [...currentUser.habits];
    updatedHabits[habitIndex] = {
      ...habitToConfirm, completedToday: true, rewardClaimedToday: true,
      totalCompletions: (habitToConfirm.totalCompletions || 0) + 1,
    };

    let newDailyCompletions = currentUser.dailyCompletions + 1;
    let newPokeBalls = currentUser.pokeBalls;
    let newGreatBalls = currentUser.greatBalls;
    let newUltraBalls = currentUser.ultraBalls;
    let newExperiencePoints = currentUser.experiencePoints;

    const isBoosted = currentUser.boostedHabitId === habitId && calculatePlayerLevelInfoInternal(currentUser.experiencePoints).level >= MIN_LEVEL_FOR_BOOSTED_HABIT;

    if (isBoosted) {
      newPokeBalls += BOOSTED_HABIT_POKEBALL_REWARD;
      newExperiencePoints += XP_PER_HABIT_COMPLETION * BOOSTED_HABIT_XP_MULTIPLIER;
    } else {
      newPokeBalls += NORMAL_HABIT_POKEBALL_REWARD;
      newExperiencePoints += XP_PER_HABIT_COMPLETION;
    }

    if (newDailyCompletions % 5 === 0) newGreatBalls++;
    if (newDailyCompletions % 10 === 0) newUltraBalls++;
    
    const todayLocalStr = getTodayDateString();
    let newDailyStreak = currentUser.dailyStreak;
    let newLastStreakUpdateDate = currentUser.lastStreakUpdateDate;
    let newLastStreakDayClaimedForReward = currentUser.lastStreakDayClaimedForReward || 0;

    if (!newLastStreakUpdateDate || newLastStreakUpdateDate === "") {
      newDailyStreak = 1;
      newLastStreakUpdateDate = todayLocalStr;
      newLastStreakDayClaimedForReward = 0; 
    } else {
      const lastStreakDateObj = parseLocalDateStr(newLastStreakUpdateDate);
      if (todayLocalStr === newLastStreakUpdateDate) {
        if (newDailyStreak === 0) { 
            newDailyStreak = 1;
            newLastStreakDayClaimedForReward = 0; 
        }
      } else {
        const dayAfterLastStreakDateObj = new Date(lastStreakDateObj);
        dayAfterLastStreakDateObj.setDate(lastStreakDateObj.getDate() + 1);
        const dayAfterLastStreakDateStr = formatDateToLocalStr(dayAfterLastStreakDateObj);

        if (todayLocalStr === dayAfterLastStreakDateStr) {
          newDailyStreak = (currentUser.dailyStreak || 0) + 1;
          newLastStreakUpdateDate = todayLocalStr;
        } else { 
          newDailyStreak = 1;
          newLastStreakUpdateDate = todayLocalStr;
          newLastStreakDayClaimedForReward = 0; 
        }
      }
    }
    
    updateUserProfile({
      ...currentUser, 
      habits: updatedHabits, 
      dailyCompletions: newDailyCompletions,
      pokeBalls: newPokeBalls, 
      greatBalls: newGreatBalls, 
      ultraBalls: newUltraBalls,
      experiencePoints: newExperiencePoints,
      dailyStreak: newDailyStreak,
      lastStreakUpdateDate: newLastStreakUpdateDate,
      lastStreakDayClaimedForReward: newLastStreakDayClaimedForReward,
    });
  };

  const deleteHabit = (habitId: string) => {
    if (!currentUser) return;
    let updatedProfile = { ...currentUser, habits: currentUser.habits.filter(h => h.id !== habitId) };
    if (currentUser.boostedHabitId === habitId) {
      updatedProfile.boostedHabitId = null;
    }
    updateUserProfile(updatedProfile);
  };
  
  const toggleHabitBoost = (habitId: string) => {
    if (!currentUser) return;
    const playerLevel = calculatePlayerLevelInfoInternal(currentUser.experiencePoints).level;
    if (playerLevel < MIN_LEVEL_FOR_BOOSTED_HABIT) {
        setToastMessage(`Você precisa ser Nível ${MIN_LEVEL_FOR_BOOSTED_HABIT} para focar em um hábito.`, "error");
        return;
    }

    updateUserProfile({
        ...currentUser,
        boostedHabitId: currentUser.boostedHabitId === habitId ? null : habitId,
    });
  };

  const _isLeaderUnlocked = (leader: GymLeader, caughtPokemonIds: Set<number>): boolean => {
    return leader.pokemon.every(p => caughtPokemonIds.has(p.id));
  };

  const _catchPokemonFromPool = (pool: WeightedPokemonEntry[], ballUsed: BallType): CaughtPokemon | null => {
    if (!pool || pool.length === 0) return null;
    let chosenEntry: WeightedPokemonEntry | undefined;
    const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);

    if (totalWeight <= 0) { 
      chosenEntry = pool[Math.floor(Math.random() * pool.length)];
    } else {
      let randomValue = Math.random() * totalWeight;
      for (const entry of pool) {
        if (randomValue < entry.weight) {
          chosenEntry = entry;
          break;
        }
        randomValue -= entry.weight;
      }
      if (!chosenEntry && pool.length > 0) {
        chosenEntry = pool[pool.length -1];
      }
    }
    
    if (!chosenEntry) {
        const fallbackDetails = POKEMON_MASTER_LIST.find(p => p.id === 129); 
        if (!fallbackDetails) return null; 
        return { ...fallbackDetails, name: `Erro: Grupo Vazio`, instanceId: generateInstanceId(), caughtDate: new Date().toISOString(), spriteUrl: POKEMON_API_SPRITE_URL(fallbackDetails.id), caughtWithBallType: ballUsed, isShiny: false };
    }

    const pokemonBaseDetails = POKEMON_MASTER_LIST.find(p => p.id === chosenEntry!.id);
    if (!pokemonBaseDetails) {
        const fallbackDetails = POKEMON_MASTER_LIST.find(p => p.id === 1); 
        if (!fallbackDetails) return null; 
        return { ...fallbackDetails, name: `Erro: ID ${chosenEntry!.id} Inválido`, instanceId: generateInstanceId(), caughtDate: new Date().toISOString(), spriteUrl: POKEMON_API_SPRITE_URL(fallbackDetails.id), caughtWithBallType: ballUsed, isShiny: false };
    }

    let finalName = chosenEntry.nameOverride || pokemonBaseDetails.name;
    let finalSpriteUrl: string;
    let isShiny = false;

    if (chosenEntry.spriteOverrideUrl) {
        finalSpriteUrl = chosenEntry.spriteOverrideUrl;
        isShiny = false; 
    } else {
        isShiny = Math.random() < SHINY_CHANCE;
        finalSpriteUrl = isShiny ? POKEMON_API_SHINY_SPRITE_URL(pokemonBaseDetails.id) : POKEMON_API_SPRITE_URL(pokemonBaseDetails.id);
        if (pokemonBaseDetails.id === 25 && Math.random() < 0.01) {
            finalName = PIKACHU_1ST_GEN_NAME;
            finalSpriteUrl = PIKACHU_1ST_GEN_SPRITE_URL;
            isShiny = false;
        }
    }

    return {
      id: pokemonBaseDetails.id, name: finalName, instanceId: generateInstanceId(),
      caughtDate: new Date().toISOString(), spriteUrl: finalSpriteUrl,
      caughtWithBallType: ballUsed, isShiny: isShiny,
    };
  }

  const handlePokemonCatchInternal = (newPokemon: CaughtPokemon | null, profileBeforeCatch: UserProfile) : UserProfile => {
    if (!newPokemon) return profileBeforeCatch;
  
    const updatedProfile = { ...profileBeforeCatch };
    updatedProfile.caughtPokemon = [...updatedProfile.caughtPokemon, newPokemon];
  
    if (newPokemon.isShiny && !updatedProfile.shinyCaughtPokemonIds.includes(newPokemon.id)) {
      updatedProfile.shinyCaughtPokemonIds = [...updatedProfile.shinyCaughtPokemonIds, newPokemon.id];
    }
  
    const previouslyCaughtIds = new Set(profileBeforeCatch.caughtPokemon.map(p => p.id));
    const currentlyCaughtIds = new Set(updatedProfile.caughtPokemon.map(p => p.id));
  
    const previouslyUnlockedLeaders = GYM_LEADERS.filter(leader => 
      _isLeaderUnlocked(leader, previouslyCaughtIds)
    );
    const currentlyUnlockedLeaders = GYM_LEADERS.filter(leader =>
      _isLeaderUnlocked(leader, currentlyCaughtIds)
    );
  
    const newlyUnlockedLeader = currentlyUnlockedLeaders.find(
      currentLeader => !previouslyUnlockedLeaders.some(prevLeader => prevLeader.id === currentLeader.id)
    );
  
    if (newlyUnlockedLeader) {
      setToastMessage(`Líder ${newlyUnlockedLeader.name} foi desbloqueado!`, 'success', newlyUnlockedLeader.imageUrl);
    }
  
    return updatedProfile;
  };
  

  const saveProfileToCloud = async (): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: "Nenhum usuário logado para salvar." };
    try {
      const response = await fetch('/api/habits', {
        method: 'POST', headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify(currentUser),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP error! status: ${response.status}`);
      return { success: true, message: data.message || "Perfil salvo na nuvem com sucesso!" };
    } catch (error: any) {
      return { success: false, message: error.message || "Erro ao salvar perfil na nuvem." };
    }
  };

  const catchFromPokeBall = (): CaughtPokemon | null => {
    if (!currentUser || (currentUser.username !== TEST_USER_USERNAME && currentUser.pokeBalls <= 0)) return null;
    const newPokemon = _catchPokemonFromPool(POKEBALL_WEIGHTED_POOL, 'poke');
    const profileWithBallSpentAndXP: UserProfile = {
      ...currentUser, 
      pokeBalls: currentUser.username === TEST_USER_USERNAME ? currentUser.pokeBalls : currentUser.pokeBalls - 1,
      experiencePoints: currentUser.experiencePoints + XP_FROM_POKEBALL,
    };
    const finalProfile = handlePokemonCatchInternal(newPokemon, profileWithBallSpentAndXP);
    updateUserProfile(finalProfile);
    if (currentUser && currentUser.username !== TEST_USER_USERNAME) saveProfileToCloud();
    return newPokemon;
  };

  const catchFromGreatBall = (): CaughtPokemon | null => {
    if (!currentUser || (currentUser.username !== TEST_USER_USERNAME && currentUser.greatBalls <= 0)) return null;
    const newPokemon = _catchPokemonFromPool(GREATBALL_WEIGHTED_POOL, 'great');
    const profileWithBallSpentAndXP: UserProfile = {
      ...currentUser, 
      greatBalls: currentUser.username === TEST_USER_USERNAME ? currentUser.greatBalls : currentUser.greatBalls - 1,
      experiencePoints: currentUser.experiencePoints + XP_FROM_GREATBALL,
    };
    const finalProfile = handlePokemonCatchInternal(newPokemon, profileWithBallSpentAndXP);
    updateUserProfile(finalProfile);
    if (currentUser && currentUser.username !== TEST_USER_USERNAME) saveProfileToCloud();
    return newPokemon;
  };

  const catchFromUltraBall = (): CaughtPokemon | null => {
    if (!currentUser || (currentUser.username !== TEST_USER_USERNAME && currentUser.ultraBalls <= 0)) return null;
    const newPokemon = _catchPokemonFromPool(ULTRABALL_WEIGHTED_POOL, 'ultra');
    const profileWithBallSpentAndXP: UserProfile = {
      ...currentUser, 
      ultraBalls: currentUser.username === TEST_USER_USERNAME ? currentUser.ultraBalls : currentUser.ultraBalls - 1,
      experiencePoints: currentUser.experiencePoints + XP_FROM_ULTRABALL,
    };
    const finalProfile = handlePokemonCatchInternal(newPokemon, profileWithBallSpentAndXP);
    updateUserProfile(finalProfile);
    if (currentUser && currentUser.username !== TEST_USER_USERNAME) saveProfileToCloud();
    return newPokemon;
  };

  const catchFromMasterBall = (): CaughtPokemon | null => {
    if (!currentUser || currentUser.masterBalls <= 0) return null; 
    const newPokemon = _catchPokemonFromPool(MASTERBALL_WEIGHTED_POOL, 'master');
    const profileWithBallSpentAndXP: UserProfile = {
      ...currentUser, masterBalls: currentUser.masterBalls - 1,
      experiencePoints: currentUser.experiencePoints + XP_FROM_MASTERBALL,
    };
    const finalProfile = handlePokemonCatchInternal(newPokemon, profileWithBallSpentAndXP);
    updateUserProfile(finalProfile);
    if (currentUser && currentUser.username !== TEST_USER_USERNAME) saveProfileToCloud();
    return newPokemon;
  };

  const releasePokemon = (instanceId: string) => {
    if (!currentUser) return;
    const pokemonToRelease = currentUser.caughtPokemon.find(p => p.instanceId === instanceId);
    if (!pokemonToRelease) return;
    const updatedCaughtPokemon = currentUser.caughtPokemon.filter(p => p.instanceId !== instanceId);
    let updatedShinyCaughtIds = currentUser.shinyCaughtPokemonIds;

    if (pokemonToRelease.isShiny) {
      const isLastShinyOfSpecies = !updatedCaughtPokemon.some(p => p.id === pokemonToRelease.id && p.isShiny);
      if (isLastShinyOfSpecies) {
        updatedShinyCaughtIds = currentUser.shinyCaughtPokemonIds.filter(id => id !== pokemonToRelease.id);
      }
    }
    updateUserProfile({
      ...currentUser, caughtPokemon: updatedCaughtPokemon,
      shinyCaughtPokemonIds: updatedShinyCaughtIds
    });
  };

  const tradePokemon = (selectedInstanceIds: string[], tradeId: string): boolean => {
    if (!currentUser) return false;
    const tradeOffer = TRADE_OFFERS.find(t => t.id === tradeId);
    if (!tradeOffer) return false;

    const pokemonToTrade = currentUser.caughtPokemon.filter(p => selectedInstanceIds.includes(p.instanceId));
    const totalRequiredCount = tradeOffer.inputPokemon.reduce((sum, req) => sum + req.count, 0);
    if (pokemonToTrade.length !== totalRequiredCount) return false;

    for (const required of tradeOffer.inputPokemon) {
      const countOfThisTypeSelected = pokemonToTrade.filter(p => p.caughtWithBallType === required.ballType).length;
      if (countOfThisTypeSelected !== required.count) return false;
    }

    const remainingPokemon = currentUser.caughtPokemon.filter(p => !selectedInstanceIds.includes(p.instanceId));
    let newPokeBalls = currentUser.pokeBalls;
    let newGreatBalls = currentUser.greatBalls;
    let newUltraBalls = currentUser.ultraBalls;
    let newMasterBalls = currentUser.masterBalls;

    if (tradeOffer.outputBall.type === 'poke') newPokeBalls += tradeOffer.outputBall.count;
    else if (tradeOffer.outputBall.type === 'great') newGreatBalls += tradeOffer.outputBall.count;
    else if (tradeOffer.outputBall.type === 'ultra') newUltraBalls += tradeOffer.outputBall.count;
    else if (tradeOffer.outputBall.type === 'master') newMasterBalls += tradeOffer.outputBall.count;

    updateUserProfile({
      ...currentUser, caughtPokemon: remainingPokemon, pokeBalls: newPokeBalls,
      greatBalls: newGreatBalls, ultraBalls: newUltraBalls, masterBalls: newMasterBalls,
    });
    return true;
  };

  const loadProfileFromCloud = async (usernameToLoad?: string): Promise<{ success: boolean; message: string }> => {
    const effectiveUsername = usernameToLoad || currentUser?.username;
    if (!effectiveUsername) return { success: false, message: "Nome de usuário não encontrado." };
    setLoading(true);
    try {
      const response = await fetch(`/api/habits?username=${encodeURIComponent(effectiveUsername)}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
            setLoading(false);
            return { success: false, message: "Nenhum perfil encontrado na nuvem." };
        }
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      // Password from cloud should not overwrite local one unless explicitly changing password
      // For this load, we assume the user is already logged in or this is a fresh load where password will be handled by login.
      // So, we keep the existing currentUser.password if currentUser exists.
      const cloudProfile = initializeProfileFields(data);
      if (currentUser && currentUser.password && !cloudProfile.password) {
        cloudProfile.password = currentUser.password;
      }


      localStorage.setItem('pokemonHabitUser', JSON.stringify(cloudProfile));
      const storedUsersData = localStorage.getItem('allPokemonHabitUsers');
      const storedUsers = storedUsersData ? JSON.parse(storedUsersData) : {};
      storedUsers[cloudProfile.username] = cloudProfile; // Save the potentially password-updated profile
      localStorage.setItem('allPokemonHabitUsers', JSON.stringify(storedUsers));

      let userProfile = handleDayRollover(cloudProfile);
      setCurrentUser(userProfile);
      setLoading(false); 
      return { success: true, message: "Perfil carregado da nuvem!" };
    } catch (error: any) {
      setLoading(false);
      return { success: false, message: error.message || "Erro ao carregar perfil." };
    }
  };

  const toggleShareHabitsPublicly = () => {
    if (!currentUser) return;
    updateUserProfile({ ...currentUser, shareHabitsPublicly: !currentUser.shareHabitsPublicly, });
  };
  
  const selectAvatar = (avatarId: string) => {
    if (!currentUser) return;
    updateUserProfile({ ...currentUser, avatarId });
  };


  const claimStreakRewards = () => {
    if (!currentUser || currentUser.dailyStreak <= (currentUser.lastStreakDayClaimedForReward || 0)) {
      setToastMessage("Nenhuma recompensa de sequência para resgatar.", "info");
      return;
    }

    let pokeBallsAwarded = 0;
    let greatBallsAwarded = 0;
    let ultraBallsAwarded = 0;

    const startDay = (currentUser.lastStreakDayClaimedForReward || 0) + 1;
    for (let dayNum = startDay; dayNum <= currentUser.dailyStreak; dayNum++) {
      pokeBallsAwarded++;
      if (dayNum % 3 === 0) {
        greatBallsAwarded++;
      }
      if (dayNum % 5 === 0) {
        ultraBallsAwarded++;
      }
    }
    
    const updatedProfile = {
      ...currentUser,
      pokeBalls: currentUser.pokeBalls + pokeBallsAwarded,
      greatBalls: currentUser.greatBalls + greatBallsAwarded,
      ultraBalls: currentUser.ultraBalls + ultraBallsAwarded,
      lastStreakDayClaimedForReward: currentUser.dailyStreak,
    };
    updateUserProfile(updatedProfile);

    let rewardMessageParts: string[] = [];
    if (pokeBallsAwarded > 0) rewardMessageParts.push(`${pokeBallsAwarded} ${getTranslatedBallName('poke', pokeBallsAwarded > 1)}`);
    if (greatBallsAwarded > 0) rewardMessageParts.push(`${greatBallsAwarded} ${getTranslatedBallName('great', greatBallsAwarded > 1)}`);
    if (ultraBallsAwarded > 0) rewardMessageParts.push(`${ultraBallsAwarded} ${getTranslatedBallName('ultra', ultraBallsAwarded > 1)}`);
    
    if (rewardMessageParts.length > 0) {
      setToastMessage(`Recompensas da Sequência Resgatadas! Você ganhou: ${rewardMessageParts.join(', ')}.`, "success");
    } else {
       setToastMessage("Nenhuma recompensa de sequência adicional para hoje.", "info");
    }
  };

  const claimLevelRewards = useCallback(() => {
    if (!currentUser) return;

    const levelInfo = calculatePlayerLevelInfoInternal(currentUser.experiencePoints);
    const currentLevel = levelInfo.level;
    const lastClaimed = currentUser.lastLevelRewardClaimed || 1;

    if (currentLevel <= lastClaimed) {
      setToastMessage("Nenhuma recompensa de nível para resgatar.", "info");
      return;
    }

    let updatedProfile = { ...currentUser };
    let awardedUltraBalls = 0;
    let awardedGreatBalls = 0;

    for (let levelToClaim = lastClaimed + 1; levelToClaim <= currentLevel; levelToClaim++) {
      switch (levelToClaim) {
        case 2:
          updatedProfile.ultraBalls += 1;
          awardedUltraBalls += 1;
          break;
        case 3:
          updatedProfile.ultraBalls += 1;
          awardedUltraBalls += 1;
          break;
        case 4:
          updatedProfile.ultraBalls += 1;
          awardedUltraBalls += 1;
          updatedProfile.greatBalls += 3;
          awardedGreatBalls += 3;
          break;
        case 5:
          updatedProfile.ultraBalls += 3;
          awardedUltraBalls += 3;
          updatedProfile.greatBalls += 5;
          awardedGreatBalls += 5;
          break;
        default: 
          if (levelToClaim > 5) {
            updatedProfile.ultraBalls += 1;
            awardedUltraBalls += 1;
            updatedProfile.greatBalls += 1;
            awardedGreatBalls += 1;
          }
          break;
      }
    }
    updatedProfile.lastLevelRewardClaimed = currentLevel;
    updateUserProfile(updatedProfile);

    let rewardMessageParts: string[] = [];
    if (awardedUltraBalls > 0) rewardMessageParts.push(`${awardedUltraBalls} ${getTranslatedBallName('ultra', awardedUltraBalls > 1)}`);
    if (awardedGreatBalls > 0) rewardMessageParts.push(`${awardedGreatBalls} ${getTranslatedBallName('great', awardedGreatBalls > 1)}`);
    
    if (rewardMessageParts.length > 0) {
      setToastMessage(`Recompensas de Nível Resgatadas! Você ganhou: ${rewardMessageParts.join(', ')}.`, "success");
    } else {
      setToastMessage("Nenhuma recompensa de nível adicional para resgatar agora.", "info");
    }

  }, [currentUser, updateUserProfile, setToastMessage]);

  const sendSharedHabitInvitation = async (targetUsername: string, habitText: string): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser) return { success: false, message: "Usuário não logado." };

    try {
      const response = await fetch(`/api/sharedHabits?action=invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorUsername: currentUser.username,
          inviteeUsername: targetUsername,
          habitText: habitText,
        }),
      });
      
      const responseCloneForJson = response.clone();
      const responseCloneForText = response.clone();

      let data;
      try {
        data = await responseCloneForJson.json();
      } catch (jsonParseError: any) {
        const responseText = await responseCloneForText.text();
        console.error("sendSharedHabitInvitation: Failed to parse JSON response. Status:", response.status, "Raw Body:", responseText);
        throw new Error(`O servidor respondeu de forma inesperada (status: ${response.status}). Detalhe: ${jsonParseError.message}. Resposta: ${responseText.substring(0,200)}...`);
      }

      if (!response.ok) {
        console.error("sendSharedHabitInvitation: Server responded with error. Status:", response.status, "Data:", data);
        throw new Error(data.message || `Erro do servidor: ${response.status}`);
      }
      
      await fetchSharedHabitsData(); 
      return { success: true, message: data.message || "Convite enviado com sucesso!" };
    } catch (error: any) {
      console.error("Error sending shared habit invitation (outer catch):", error);
      return { success: false, message: error.message || "Falha ao enviar convite." };
    }
  };

  const respondToSharedHabitInvitation = async (sharedHabitId: string, responseStatus: 'accept' | 'decline'): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser) return { success: false, message: "Usuário não logado." };
    try {
      const apiResponse = await fetch(`/api/sharedHabits?action=respond&id=${sharedHabitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: responseStatus, responderUsername: currentUser.username })
      });
      const data = await apiResponse.json();
      if (!apiResponse.ok) throw new Error(data.message || 'Falha ao responder ao convite');
      await fetchSharedHabitsData();
      if (responseStatus === 'accept' && data.sharedHabit) {
           const updatedProfile = { ...currentUser };
           updateUserProfile(updatedProfile);
      }
      return { success: true, message: data.message };
    } catch (error: any) {
      console.error("Error responding to shared habit invitation:", error);
      return { success: false, message: error.message || "Falha ao responder ao convite." };
    }
  };

  const completeSharedHabit = async (sharedHabitId: string): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser) return { success: false, message: "Usuário não logado." };
    try {
      const apiResponse = await fetch(`/api/sharedHabits?action=complete&id=${sharedHabitId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameCompleting: currentUser.username })
      });
      const data = await apiResponse.json();
      if (!apiResponse.ok) throw new Error(data.message || 'Falha ao completar hábito compartilhado');
      
      await fetchSharedHabitsData(); 

      if (data.message && data.message.includes("Ambos completaram")) {
         updateUserProfile({
            ...currentUser,
            experiencePoints: currentUser.experiencePoints + XP_PER_SHARED_HABIT_JOINT_COMPLETION,
            pokeBalls: currentUser.pokeBalls + POKEBALLS_PER_SHARED_HABIT_JOINT_COMPLETION,
         });
         setToastMessage(`Recompensa da Encrenca em Dobro: ${POKEBALLS_PER_SHARED_HABIT_JOINT_COMPLETION} ${getTranslatedBallName('poke')} e ${XP_PER_SHARED_HABIT_JOINT_COMPLETION} XP obtidos!`, "success");
      } else if (data.message) {
        setToastMessage(data.message, "info");
      }

      return { success: true, message: data.message };
    } catch (error: any) {
      console.error("Error completing shared habit:", error);
      return { success: false, message: error.message || "Falha ao completar hábito." };
    }
  };
  
  const cancelSentSharedHabitRequest = async (sharedHabitId: string): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser) return { success: false, message: "Usuário não logado." };
    try {
      const apiResponse = await fetch(`/api/sharedHabits?action=cancel&id=${sharedHabitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellerUsername: currentUser.username }) 
      });
      const data = await apiResponse.json();
      if (!apiResponse.ok) throw new Error(data.message || 'Falha ao cancelar o convite.');
      await fetchSharedHabitsData();
      return { success: true, message: data.message };
    } catch (error: any) {
      console.error("Error canceling shared habit request:", error);
      return { success: false, message: error.message || "Falha ao cancelar o convite." };
    }
  };

  const deleteSharedHabit = async (sharedHabitId: string): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser) return { success: false, message: "Usuário não logado." };
    try {
      const apiResponse = await fetch(`/api/sharedHabits?action=delete&id=${sharedHabitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleterUsername: currentUser.username }) 
      });
      const data = await apiResponse.json();
      if (!apiResponse.ok) throw new Error(data.message || 'Falha ao excluir o hábito compartilhado.');
      await fetchSharedHabitsData();
      return { success: true, message: data.message };
    } catch (error: any) {
      console.error("Error deleting shared habit:", error);
      return { success: false, message: error.message || "Falha ao excluir o hábito compartilhado." };
    }
  };


  return (
    <UserContext.Provider value={{
      currentUser, loading, login, logout, addHabit, confirmHabitCompletion, deleteHabit,
      catchFromPokeBall, catchFromGreatBall, catchFromUltraBall, catchFromMasterBall,
      releasePokemon, tradePokemon, updateUserProfile, saveProfileToCloud, loadProfileFromCloud,
      toggleShareHabitsPublicly, selectAvatar, claimStreakRewards, claimLevelRewards, 
      toastMessage: toastMessageState, clearToastMessage, setToastMessage,
      calculatePlayerLevelInfo: calculatePlayerLevelInfoInternal,
      toggleHabitBoost, // Added
      sharedHabitsData, fetchSharedHabitsData, sendSharedHabitInvitation,
      respondToSharedHabitInvitation, completeSharedHabit, cancelSentSharedHabitRequest,
      deleteSharedHabit,
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
