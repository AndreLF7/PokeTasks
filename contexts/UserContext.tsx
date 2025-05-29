
import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import { UserProfile, Habit, CaughtPokemon, BallType, TradeOffer } from '../types';
import {
  POKEMON_MASTER_LIST,
  POKEMON_API_SPRITE_URL,
  POKEMON_API_SHINY_SPRITE_URL,
  SHINY_CHANCE,
  MAX_HABITS,
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
} from '../constants';
import type { WeightedPokemonEntry } from '../constants'; // Changed to type-only import

interface UserContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  login: (username: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  addHabit: (text: string) => void;
  confirmHabitCompletion: (habitId: string) => void; // Renamed from toggleHabit
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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Generates YYYY-MM-DD string based on the client's local timezone
const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const generateInstanceId = (): string => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
const MAX_HISTORY_ENTRIES = 60; // Cap for completion history

// Helper to parse YYYY-MM-DD string into a local Date object
const parseLocalDateStr = (dateStr: string): Date => {
  return new Date(Number(dateStr.substring(0,4)), Number(dateStr.substring(5,7))-1, Number(dateStr.substring(8,10)));
};

// Helper to format a Date object into local YYYY-MM-DD string
const formatDateToLocalStr = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};


interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const initializeProfileFields = useCallback((profileInput: any): UserProfile => {
    try {
      const profile = (typeof profileInput === 'object' && profileInput !== null) ? { ...profileInput } : {};

      const parseNumericField = (value: any, defaultValue: number = 0): number => {
        const num = Number(value);
        return isNaN(num) || !isFinite(num) ? defaultValue : num;
      };

      profile.username = String(profile.username || 'Treinador');
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
              return null;
          }

          const validBallTypes: BallType[] = ['poke', 'great', 'ultra', 'master'];
          const caughtWithBallType: BallType = (p.caughtWithBallType && validBallTypes.includes(p.caughtWithBallType))
                                            ? p.caughtWithBallType
                                            : 'poke';
          const isShiny = typeof p.isShiny === 'boolean' ? p.isShiny : false;
          const spriteUrl = isShiny ? POKEMON_API_SHINY_SPRITE_URL(id) : POKEMON_API_SPRITE_URL(id);


          return {
              id: id,
              name: name,
              spriteUrl: (typeof p.spriteUrl === 'string' && p.spriteUrl) ? p.spriteUrl : spriteUrl,
              caughtDate: (typeof p.caughtDate === 'string' && p.caughtDate) ? p.caughtDate : new Date().toISOString(), // Caught date still ISO UTC
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
              // pendingRewardConfirmation removed
              totalCompletions: parseNumericField(h.totalCompletions, 0),
          };
        })
        .filter((h: Habit) => h.id && h.text);

      profile.lastResetDate = (typeof profile.lastResetDate === 'string' && profile.lastResetDate.match(/^\d{4}-\d{2}-\d{2}$/))
        ? profile.lastResetDate
        : getTodayDateString(); // Use local today

      delete profile.avatar;

      profile.experiencePoints = parseNumericField(profile.experiencePoints, 0);

      return profile as UserProfile;
    } catch (error) {
      console.error("UserContext: CRITICAL - Unhandled error in initializeProfileFields. Returning default profile.", error, "Input data:", profileInput);

      return {
        username: 'Treinador',
        habits: [],
        caughtPokemon: [],
        pokeBalls: 0,
        greatBalls: 0,
        ultraBalls: 0,
        masterBalls: 0,
        dailyCompletions: 0,
        lastResetDate: getTodayDateString(), // Use local today
        shinyCaughtPokemonIds: [],
        dailyStreak: 0,
        lastStreakUpdateDate: "",
        completionHistory: [],
        experiencePoints: 0,
      };
    }
  }, []);

  const handleDayRollover = useCallback((profile: UserProfile): UserProfile => {
    const todayLocalStr = getTodayDateString();
    if (profile.lastResetDate === todayLocalStr) {
      return profile;
    }

    console.log(`Performing day rollover from ${profile.lastResetDate} to ${todayLocalStr}`);
    let updatedProfile = { ...profile };
    const previousDayCompletions = updatedProfile.dailyCompletions;
    const previousDayCompletionDateStr = updatedProfile.lastResetDate; // This is a local YYYY-MM-DD string

    // Update completion history
    let newHistory = [{ date: previousDayCompletionDateStr, count: previousDayCompletions }, ...updatedProfile.completionHistory];
    if (newHistory.length > MAX_HISTORY_ENTRIES) {
      newHistory = newHistory.slice(0, MAX_HISTORY_ENTRIES);
    }
    updatedProfile.completionHistory = newHistory;

    // Update daily streak
    if (previousDayCompletions > 0) {
        const prevCompletionDate = parseLocalDateStr(previousDayCompletionDateStr);
        const dayBeforePrevCompletionDate = new Date(prevCompletionDate);
        dayBeforePrevCompletionDate.setDate(prevCompletionDate.getDate() - 1);
        const dayBeforePrevCompletionDateStr = formatDateToLocalStr(dayBeforePrevCompletionDate);

        if (updatedProfile.lastStreakUpdateDate === dayBeforePrevCompletionDateStr) {
            updatedProfile.dailyStreak = (updatedProfile.dailyStreak || 0) + 1;
        } else {
            updatedProfile.dailyStreak = 1; // Started a new streak
        }
        updatedProfile.lastStreakUpdateDate = previousDayCompletionDateStr;
    } else { // previousDayCompletions === 0
        const todayDate = parseLocalDateStr(todayLocalStr);
        const prevResetDate = parseLocalDateStr(previousDayCompletionDateStr);
        
        const diffTime = todayDate.getTime() - prevResetDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Number of full 24h periods based on local dates

        if (diffDays > 1) { // If more than one day passed since last reset and no completions on that last reset day
            updatedProfile.dailyStreak = 0; // Streak broken
        }
        // If diffDays is 1, and previousDayCompletions was 0, streak is also 0.
        // If lastStreakUpdateDate was yesterday and completions were 0, it means streak was already 0.
        // Or, if it was a valid streak, it just means they missed previousDayCompletionDateStr
        if (previousDayCompletions === 0) {
             updatedProfile.dailyStreak = 0;
        }
        updatedProfile.lastStreakUpdateDate = previousDayCompletionDateStr; // Record this day as the last update attempt
    }


    updatedProfile.habits = updatedProfile.habits.map(h => ({
      ...h,
      completedToday: false,
      rewardClaimedToday: false,
      // pendingRewardConfirmation removed
    }));
    updatedProfile.dailyCompletions = 0;
    updatedProfile.lastResetDate = todayLocalStr;

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
          // Check if day rollover actually changed anything before re-saving
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
    const intervalId = setInterval(() => {
      if (currentUser) {
        const todayLocalStr = getTodayDateString();
        if (currentUser.lastResetDate !== todayLocalStr) {
          console.log("UserContext: Interval detected day change. Performing rollover.");
          const updatedProfile = handleDayRollover({ ...currentUser });
          updateUserProfile(updatedProfile);
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [currentUser, handleDayRollover, updateUserProfile]);


  const login = async (username: string): Promise<{ success: boolean; message?: string }> => {
    setLoading(true);
    const trimmedUsername = username.trim();
    try {
      const response = await fetch(`/api/habits?username=${encodeURIComponent(trimmedUsername)}`);
      
      if (response.ok) {
        const cloudData = await response.json();
        let userProfile = initializeProfileFields(cloudData);
        userProfile = handleDayRollover(userProfile);

        localStorage.setItem('pokemonHabitUser', JSON.stringify(userProfile));
        const storedUsersData = localStorage.getItem('allPokemonHabitUsers');
        const storedUsers = storedUsersData ? JSON.parse(storedUsersData) : {};
        storedUsers[userProfile.username] = userProfile;
        localStorage.setItem('allPokemonHabitUsers', JSON.stringify(storedUsers));
        
        setCurrentUser(userProfile);
        setLoading(false);
        return { success: true, message: "Perfil carregado da nuvem." };
      } else if (response.status === 404) {
        console.log("UserContext: Profile not found in cloud for", trimmedUsername, ". Creating new local profile.");
        const storedUsersString = localStorage.getItem('allPokemonHabitUsers');
        const storedUsers = storedUsersString ? JSON.parse(storedUsersString) : {};
        let userProfileData = storedUsers[trimmedUsername];

        if (!userProfileData) {
          userProfileData = {
            username: trimmedUsername,
            habits: [], caughtPokemon: [], pokeBalls: 0, greatBalls: 0, ultraBalls: 0, masterBalls: 0,
            dailyCompletions: 0, lastResetDate: getTodayDateString(), shinyCaughtPokemonIds: [],
            dailyStreak: 0, lastStreakUpdateDate: "", completionHistory: [],
            experiencePoints: 0,
          };
        } else {
          userProfileData.username = trimmedUsername;
        }
        
        let userProfile = initializeProfileFields(userProfileData);
        userProfile = handleDayRollover(userProfile);

        storedUsers[userProfile.username] = userProfile;
        localStorage.setItem('allPokemonHabitUsers', JSON.stringify(storedUsers));
        localStorage.setItem('pokemonHabitUser', JSON.stringify(userProfile));
        setCurrentUser(userProfile);
        setLoading(false);
        return { success: true, message: "Novo perfil local criado." };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Falha ao verificar perfil na nuvem: ${response.status}`);
      }
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
        // Ensure the profile is up-to-date with any pending day rollover before saving to 'allPokemonHabitUsers'
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
    setLoading(false);
  };

  const addHabit = (text: string) => {
    if (!currentUser || currentUser.habits.length >= MAX_HABITS) return;
    const newHabit: Habit = {
      id: generateInstanceId(), text: text.trim(),
      completedToday: false, rewardClaimedToday: false, 
      totalCompletions: 0,
    };
    updateUserProfile({ ...currentUser, habits: [...currentUser.habits, newHabit] });
  };

  const confirmHabitCompletion = (habitId: string) => {
    if (!currentUser) return;

    const habitIndex = currentUser.habits.findIndex(h => h.id === habitId);
    if (habitIndex === -1) return;

    const habitToConfirm = currentUser.habits[habitIndex];
    if (habitToConfirm.completedToday) return; // Already completed and confirmed

    const updatedHabits = [...currentUser.habits];
    updatedHabits[habitIndex] = {
      ...habitToConfirm,
      completedToday: true,
      rewardClaimedToday: true, // Rewards processed upon this confirmation
      totalCompletions: (habitToConfirm.totalCompletions || 0) + 1,
    };

    let newDailyCompletions = currentUser.dailyCompletions + 1;
    let newPokeBalls = currentUser.pokeBalls + 1;
    let newGreatBalls = currentUser.greatBalls;
    let newUltraBalls = currentUser.ultraBalls;
    let newExperiencePoints = currentUser.experiencePoints + XP_PER_HABIT_COMPLETION;

    if (newDailyCompletions % 5 === 0) newGreatBalls++;
    if (newDailyCompletions % 10 === 0) newUltraBalls++;
    
    updateUserProfile({
      ...currentUser,
      habits: updatedHabits,
      dailyCompletions: newDailyCompletions,
      pokeBalls: newPokeBalls,
      greatBalls: newGreatBalls,
      ultraBalls: newUltraBalls,
      experiencePoints: newExperiencePoints,
    });
  };

  const deleteHabit = (habitId: string) => {
    if (!currentUser) return;
    // If habit was completedToday, its contribution to dailyCompletions and awarded balls are NOT reverted.
    // This is simpler and generally fine. If strict reversal is needed, more complex logic would be required.
    updateUserProfile({ ...currentUser, habits: currentUser.habits.filter(h => h.id !== habitId) });
  };

  const _catchPokemonFromPool = (pool: number[] | WeightedPokemonEntry[], ballUsed: BallType): CaughtPokemon | null => {
    if (!pool || pool.length === 0) return null;
    let randomPokemonId: number | undefined;

    if (typeof pool[0] === 'object' && pool[0] !== null && 'weight' in pool[0]) {
      const weightedPool = pool as WeightedPokemonEntry[];
      const totalWeight = weightedPool.reduce((sum, entry) => sum + entry.weight, 0);
      if (totalWeight <= 0) randomPokemonId = weightedPool[Math.floor(Math.random() * weightedPool.length)]?.id;
      else {
        let randomValue = Math.random() * totalWeight;
        for (const entry of weightedPool) {
          if (randomValue < entry.weight) { randomPokemonId = entry.id; break; }
          randomValue -= entry.weight;
        }
        if (randomPokemonId === undefined && weightedPool.length > 0) {
             randomPokemonId = weightedPool[Math.floor(Math.random() * weightedPool.length)].id;
        }
      }
    } else {
      const idPool = pool as number[];
      if (idPool.length > 0) randomPokemonId = idPool[Math.floor(Math.random() * idPool.length)];
    }

    if (randomPokemonId === undefined) {
        const fallback = POKEMON_MASTER_LIST.find(p => p.id === 129); // Magikarp
        return fallback ? { ...fallback, instanceId: generateInstanceId(), caughtDate: new Date().toISOString(), spriteUrl: POKEMON_API_SPRITE_URL(fallback.id), caughtWithBallType: ballUsed, name: `Erro: Grupo Vazio`, isShiny: false } : null;
    }

    const pokemonDetails = POKEMON_MASTER_LIST.find(p => p.id === randomPokemonId);
    if (!pokemonDetails) {
        const fallback = POKEMON_MASTER_LIST.find(p => p.id === 1); // Bulbasaur
        return fallback ? { ...fallback, instanceId: generateInstanceId(), caughtDate: new Date().toISOString(), spriteUrl: POKEMON_API_SPRITE_URL(fallback.id), caughtWithBallType: ballUsed, name: `Erro: ID ${randomPokemonId} Inválido`, isShiny: false } : null;
    }

    const isShiny = Math.random() < SHINY_CHANCE;
    const spriteUrl = isShiny ? POKEMON_API_SHINY_SPRITE_URL(pokemonDetails.id) : POKEMON_API_SPRITE_URL(pokemonDetails.id);

    return {
      ...pokemonDetails,
      instanceId: generateInstanceId(),
      caughtDate: new Date().toISOString(),
      spriteUrl: spriteUrl,
      caughtWithBallType: ballUsed,
      isShiny: isShiny,
    };
  }

  const handlePokemonCatchInternal = (newPokemon: CaughtPokemon | null, profileAfterBallSpent: UserProfile) : UserProfile => {
    if (!newPokemon) return profileAfterBallSpent;

    let updatedShinyIds = profileAfterBallSpent.shinyCaughtPokemonIds;
    if (newPokemon.isShiny && !profileAfterBallSpent.shinyCaughtPokemonIds.includes(newPokemon.id)) {
      updatedShinyIds = [...profileAfterBallSpent.shinyCaughtPokemonIds, newPokemon.id];
    }

    return {
      ...profileAfterBallSpent,
      caughtPokemon: [...profileAfterBallSpent.caughtPokemon, newPokemon],
      shinyCaughtPokemonIds: updatedShinyIds,
    };
  };

  const catchFromPokeBall = (): CaughtPokemon | null => {
    if (!currentUser || currentUser.pokeBalls <= 0) return null;
    const newPokemon = _catchPokemonFromPool(POKEBALL_WEIGHTED_POOL, 'poke');

    const profileWithBallSpentAndXP: UserProfile = {
      ...currentUser,
      pokeBalls: currentUser.pokeBalls - 1,
      experiencePoints: currentUser.experiencePoints + XP_FROM_POKEBALL,
    };

    const finalProfile = handlePokemonCatchInternal(newPokemon, profileWithBallSpentAndXP);
    updateUserProfile(finalProfile);
    return newPokemon;
  };

  const catchFromGreatBall = (): CaughtPokemon | null => {
    if (!currentUser || currentUser.greatBalls <= 0) return null;
    const newPokemon = _catchPokemonFromPool(GREATBALL_WEIGHTED_POOL, 'great');

    const profileWithBallSpentAndXP: UserProfile = {
      ...currentUser,
      greatBalls: currentUser.greatBalls - 1,
      experiencePoints: currentUser.experiencePoints + XP_FROM_GREATBALL,
    };
    const finalProfile = handlePokemonCatchInternal(newPokemon, profileWithBallSpentAndXP);
    updateUserProfile(finalProfile);
    return newPokemon;
  };

  const catchFromUltraBall = (): CaughtPokemon | null => {
    if (!currentUser || currentUser.ultraBalls <= 0) return null;
    const newPokemon = _catchPokemonFromPool(ULTRABALL_WEIGHTED_POOL, 'ultra');
    
    const profileWithBallSpentAndXP: UserProfile = {
      ...currentUser,
      ultraBalls: currentUser.ultraBalls - 1,
      experiencePoints: currentUser.experiencePoints + XP_FROM_ULTRABALL,
    };
    const finalProfile = handlePokemonCatchInternal(newPokemon, profileWithBallSpentAndXP);
    updateUserProfile(finalProfile);
    return newPokemon;
  };

  const catchFromMasterBall = (): CaughtPokemon | null => {
    if (!currentUser || currentUser.masterBalls <= 0) return null;
    const newPokemon = _catchPokemonFromPool(MASTERBALL_WEIGHTED_POOL, 'master');

    const profileWithBallSpentAndXP: UserProfile = {
      ...currentUser,
      masterBalls: currentUser.masterBalls - 1,
      experiencePoints: currentUser.experiencePoints + XP_FROM_MASTERBALL,
    };
    const finalProfile = handlePokemonCatchInternal(newPokemon, profileWithBallSpentAndXP);
    updateUserProfile(finalProfile);
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
      ...currentUser,
      caughtPokemon: updatedCaughtPokemon,
      shinyCaughtPokemonIds: updatedShinyCaughtIds
    });
  };

  const tradePokemon = (selectedInstanceIds: string[], tradeId: string): boolean => {
    if (!currentUser) return false;
    const tradeOffer = TRADE_OFFERS.find(t => t.id === tradeId);
    if (!tradeOffer) {
      console.error("ID de troca inválido:", tradeId);
      return false;
    }

    const pokemonToTrade = currentUser.caughtPokemon.filter(p => selectedInstanceIds.includes(p.instanceId));

    const totalRequiredCount = tradeOffer.inputPokemon.reduce((sum, req) => sum + req.count, 0);
    if (pokemonToTrade.length !== totalRequiredCount) {
      console.error("Número total incorreto de Pokémon selecionados para troca. Esperado:", totalRequiredCount, "Recebido:", pokemonToTrade.length);
      return false;
    }

    for (const required of tradeOffer.inputPokemon) {
      const countOfThisTypeSelected = pokemonToTrade.filter(p => p.caughtWithBallType === required.ballType).length;
      if (countOfThisTypeSelected !== required.count) {
        console.error(`Número incorreto de Pokémon capturados com ${getTranslatedBallName(required.ballType)}. Esperado: ${required.count}, Recebido: ${countOfThisTypeSelected}`);
        return false;
      }
    }

    const remainingPokemon = currentUser.caughtPokemon.filter(p => !selectedInstanceIds.includes(p.instanceId));
    let newPokeBalls = currentUser.pokeBalls;
    let newGreatBalls = currentUser.greatBalls;
    let newUltraBalls = currentUser.ultraBalls;
    let newMasterBalls = currentUser.masterBalls;

    if (tradeOffer.outputBall.type === 'poke') {
      newPokeBalls += tradeOffer.outputBall.count;
    } else if (tradeOffer.outputBall.type === 'great') {
      newGreatBalls += tradeOffer.outputBall.count;
    } else if (tradeOffer.outputBall.type === 'ultra') {
      newUltraBalls += tradeOffer.outputBall.count;
    } else if (tradeOffer.outputBall.type === 'master') {
      newMasterBalls += tradeOffer.outputBall.count;
    }

    updateUserProfile({
      ...currentUser,
      caughtPokemon: remainingPokemon,
      pokeBalls: newPokeBalls,
      greatBalls: newGreatBalls,
      ultraBalls: newUltraBalls,
      masterBalls: newMasterBalls,
    });

    return true;
  };

  const saveProfileToCloud = async (): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      return { success: false, message: "Nenhum usuário logado para salvar." };
    }
    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentUser),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      return { success: true, message: data.message || "Perfil salvo na nuvem com sucesso!" };
    } catch (error: any) {
      console.error("UserContext: Falha ao salvar perfil na nuvem:", error);
      return { success: false, message: error.message || "Erro ao salvar perfil na nuvem." };
    }
  };

  const loadProfileFromCloud = async (usernameToLoad?: string): Promise<{ success: boolean; message: string }> => {
    const effectiveUsername = usernameToLoad || currentUser?.username;
    if (!effectiveUsername) {
      return { success: false, message: "Nome de usuário não encontrado para carregar o perfil." };
    }
    setLoading(true); // Indicate loading state
    try {
      const response = await fetch(`/api/habits?username=${encodeURIComponent(effectiveUsername)}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
            setLoading(false);
            return { success: false, message: "Nenhum perfil encontrado na nuvem para este usuário." };
        }
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      localStorage.setItem('pokemonHabitUser', JSON.stringify(data));

      const storedUsersData = localStorage.getItem('allPokemonHabitUsers');
      const storedUsers = storedUsersData ? JSON.parse(storedUsersData) : {};
      storedUsers[data.username] = data; // Save raw cloud data
      localStorage.setItem('allPokemonHabitUsers', JSON.stringify(storedUsers));

      let userProfile = initializeProfileFields(data);
      userProfile = handleDayRollover(userProfile); // Process day rollover for the loaded data
      setCurrentUser(userProfile);
      setLoading(false);

      return { success: true, message: "Perfil carregado da nuvem com sucesso!" };

    } catch (error: any) {
      console.error("UserContext: Falha ao carregar perfil da nuvem:", error);
      setLoading(false);
      return { success: false, message: error.message || "Erro ao carregar perfil da nuvem." };
    }
  };

  return (
    <UserContext.Provider value={{
      currentUser,
      loading,
      login,
      logout,
      addHabit,
      confirmHabitCompletion,
      deleteHabit,
      catchFromPokeBall,
      catchFromGreatBall,
      catchFromUltraBall,
      catchFromMasterBall,
      releasePokemon,
      tradePokemon,
      updateUserProfile,
      saveProfileToCloud,
      loadProfileFromCloud,
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