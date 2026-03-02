
import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import { UserProfile, Habit, CaughtPokemon, BallType, TradeOffer, GymLeader, SharedHabitDisplayInfo, SharedHabit, ProgressionHabit, PeriodicHabit, PeriodicHabitType, PlayablePokemon, PokemonStats } from '../types'; 
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
  TASK_COINS_FROM_POKEBALL, 
  TASK_COINS_FROM_GREATBALL, 
  TASK_COINS_FROM_ULTRABALL, 
  TASK_COINS_FROM_MASTERBALL, 
  PRICE_POKEBALL,
  PRICE_GREATBALL,
  PRICE_ULTRABALL,
  PRICE_ACTIVATE_POKEMON,
  // Added ELIGIBLE_FOR_ACTIVATION to imports
  ELIGIBLE_FOR_ACTIVATION,
  PLAYABLE_STATS_RANGES,
  PIKACHU_1ST_GEN_NAME,
  PIKACHU_1ST_GEN_SPRITE_URL,
  GYM_LEADERS,
  LEVEL_THRESHOLDS,
  MAX_PLAYER_LEVEL,
  MIN_LEVEL_FOR_SHARED_HABITS,
  DEFAULT_AVATAR_ID,
  MIN_LEVEL_FOR_BOOSTED_HABIT, 
  BOOSTED_HABIT_XP_MULTIPLIER, 
  BOOSTED_HABIT_POKEBALL_REWARD, 
  NORMAL_HABIT_POKEBALL_REWARD,
  MIN_LEVEL_FOR_PROGRESSION_L1, 
  PROGRESSION_SLOTS_L1, 
  MIN_LEVEL_FOR_PROGRESSION_L2, 
  PROGRESSION_SLOTS_L2, 
  MIN_LEVEL_FOR_PERIODIC_HABITS,
  MAX_PERIODIC_HABITS_PER_TYPE,
  XP_REWARD_WEEKLY_HABIT,
  TASK_COINS_REWARD_WEEKLY_HABIT,
  XP_REWARD_MONTHLY_HABIT,
  TASK_COINS_REWARD_MONTHLY_HABIT,
  XP_REWARD_ANNUAL_HABIT,
  TASK_COINS_REWARD_ANNUAL_HABIT,
  TEST_USER_USERNAME
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
  login: (username: string, password?: string) => Promise<{ success: boolean; message?: string }>; 
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
  toggleHabitBoost: (habitId: string) => void; 
  buyBall: (type: BallType) => void;
  activatePokemon: (instanceId: string) => Promise<boolean>;

  // Progression Habits
  addProgressionHabit: (mainHabitId: string, text: string) => void;
  confirmProgressionHabitCompletion: (progressionHabitId: string) => void;
  deleteProgressionHabit: (progressionHabitId: string) => void;
  calculateMaxProgressionSlots: (level: number) => number;

  // Periodic Habits
  addPeriodicHabit: (text: string, period: PeriodicHabitType) => void;
  completePeriodicHabit: (habitId: string) => void;
  deletePeriodicHabit: (habitId: string) => void;
  getStartOfCurrentPeriod: (date: Date, period: PeriodicHabitType) => Date;


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
  const year = today.getUTCFullYear();
  const month = String(today.getUTCMonth() + 1).padStart(2, '0');
  const day = String(today.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const generateInstanceId = (): string => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

const parseLocalDateStr = (dateStr: string): Date => {
  if (!dateStr || !dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(0); 
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const formatDateToLocalStr = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getStartOfCurrentPeriodInternal = (date: Date, period: PeriodicHabitType): Date => {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())); 
    switch (period) {
        case 'weekly':
            const dayOfWeek = d.getUTCDay(); 
            const diff = d.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
            return new Date(d.setUTCDate(diff));
        case 'monthly':
            return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
        case 'annual':
            return new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        default:
            return d; 
    }
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

const calculateMaxProgressionSlotsInternal = (level: number): number => {
    if (level >= MIN_LEVEL_FOR_PROGRESSION_L2) return PROGRESSION_SLOTS_L2;
    if (level >= MIN_LEVEL_FOR_PROGRESSION_L1) return PROGRESSION_SLOTS_L1;
    return 0;
};

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
      
      const parseDateField = (value: any, defaultValue: string = ""): string => {
         return (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) ? value : defaultValue;
      };

      profile.username = String(profile.username || 'Treinador');
      profile.password = typeof profile.password === 'string' ? profile.password : undefined; 
      profile.pokeBalls = parseNumericField(profile.pokeBalls, 0);
      profile.greatBalls = parseNumericField(profile.greatBalls, 0);
      profile.ultraBalls = parseNumericField(profile.ultraBalls, 0);
      profile.masterBalls = parseNumericField(profile.masterBalls, 0);
      profile.taskCoins = parseNumericField(profile.taskCoins, 0); 

      profile.activePokemon = (Array.isArray(profile.activePokemon) ? profile.activePokemon : [])
        .map((ap: any) => ({
            instanceId: ap.instanceId,
            id: ap.id,
            name: ap.name,
            spriteUrl: ap.spriteUrl,
            isShiny: !!ap.isShiny,
            stats: {
                hp: ap.stats?.hp || 0,
                attack: ap.stats?.attack || 0,
                defense: ap.stats?.defense || 0,
                accuracy: ap.stats?.accuracy || 0,
                agility: ap.stats?.agility || 0
            },
            activatedAt: ap.activatedAt || new Date().toISOString()
        }));

      if (typeof profile.completionsTowardsGreatBall === 'number' && typeof profile.dailyCompletions !== 'number') {
        profile.dailyCompletions = profile.completionsTowardsGreatBall;
      }
      delete profile.completionsTowardsGreatBall;
      profile.dailyCompletions = parseNumericField(profile.dailyCompletions, 0);

      profile.shinyCaughtPokemonIds = Array.isArray(profile.shinyCaughtPokemonIds)
        ? profile.shinyCaughtPokemonIds.filter((id: any) => typeof id === 'number')
        : [];

      profile.dailyStreak = parseNumericField(profile.dailyStreak, 0);
      profile.lastStreakUpdateDate = parseDateField(profile.lastStreakUpdateDate, "");
      profile.lastStreakDayClaimedForReward = parseNumericField(profile.lastStreakDayClaimedForReward, 0);

      profile.fiveHabitStreak = parseNumericField(profile.fiveHabitStreak, 0);
      profile.lastFiveHabitStreakUpdateDate = parseDateField(profile.lastFiveHabitStreakUpdateDate, "");
      profile.lastFiveHabitStreakDayClaimedForReward = parseNumericField(profile.lastFiveHabitStreakDayClaimedForReward, 0);

      profile.tenHabitStreak = parseNumericField(profile.tenHabitStreak, 0);
      profile.lastTenHabitStreakUpdateDate = parseDateField(profile.lastTenHabitStreakUpdateDate, "");
      profile.lastTenHabitStreakDayClaimedForReward = parseNumericField(profile.lastTenHabitStreakDayClaimedForReward, 0);
      

      profile.caughtPokemon = (Array.isArray(profile.caughtPokemon) ? profile.caughtPokemon : [])
        .map((p: any) => {
          if (typeof p !== 'object' || p === null) return null;
          let id = parseNumericField(p.id, 0);
          let name = typeof p.name === 'string' ? p.name.trim() : '';
          const masterEntry = POKEMON_MASTER_LIST.find(m => m.id === id);
          if (id !== 0 && !name && masterEntry) name = masterEntry.name;
          else if (id === 0 || (!name && !masterEntry)) return null;

          const validBallTypes: BallType[] = ['poke', 'great', 'ultra', 'master'];
          const caughtWithBallType: BallType = (p.caughtWithBallType && validBallTypes.includes(p.caughtWithBallType)) ? p.caughtWithBallType : 'poke';
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
              isActive: typeof p.isActive === 'boolean' ? p.isActive : false
          };
        })
        .filter((p): p is CaughtPokemon => p !== null);

      profile.habits = (Array.isArray(profile.habits) ? profile.habits : [])
        .map((h: any) => ({
              id: (typeof h.id === 'string' && h.id) ? h.id : generateInstanceId(),
              text: (typeof h.text === 'string' && h.text.trim()) ? h.text.trim() : 'Hábito Sem Nome',
              completedToday: typeof h.completedToday === 'boolean' ? h.completedToday : false,
              rewardClaimedToday: typeof h.rewardClaimedToday === 'boolean' ? h.rewardClaimedToday : false,
              totalCompletions: parseNumericField(h.totalCompletions, 0),
        }))
        .filter((h: Habit) => h.id && h.text);
      
      profile.progressionHabits = (Array.isArray(profile.progressionHabits) ? profile.progressionHabits : [])
        .map((ph: any): ProgressionHabit | null => {
            if (typeof ph !== 'object' || ph === null) return null;
            return {
                id: (typeof ph.id === 'string' && ph.id) ? ph.id : generateInstanceId(),
                mainHabitId: (typeof ph.mainHabitId === 'string' && ph.mainHabitId) ? ph.mainHabitId : '',
                text: (typeof ph.text === 'string' && ph.text.trim()) ? ph.text.trim() : 'Hábito de Progressão Sem Nome',
                completedToday: typeof ph.completedToday === 'boolean' ? ph.completedToday : false,
                totalCompletions: parseNumericField(ph.totalCompletions, 0),
            };
        })
        .filter((ph): ph is ProgressionHabit => ph !== null && !!ph.mainHabitId && !!ph.text);
      
      profile.periodicHabits = (Array.isArray(profile.periodicHabits) ? profile.periodicHabits : [])
        .map((ph: any): PeriodicHabit | null => {
            if (typeof ph !== 'object' || ph === null) return null;
            const period: PeriodicHabitType = ['weekly', 'monthly', 'annual'].includes(ph.period) ? ph.period : 'weekly';
            return {
                id: (typeof ph.id === 'string' && ph.id) ? ph.id : generateInstanceId(),
                text: (typeof ph.text === 'string' && ph.text.trim()) ? ph.text.trim() : 'Hábito Periódico Sem Nome',
                period: period,
                isCompleted: typeof ph.isCompleted === 'boolean' ? ph.isCompleted : false,
                currentPeriodStartDate: parseDateField(ph.currentPeriodStartDate, formatDateToLocalStr(getStartOfCurrentPeriodInternal(new Date(), period))),
                createdAt: (typeof ph.createdAt === 'string' && ph.createdAt) ? ph.createdAt : new Date().toISOString(),
            };
        })
        .filter((ph): ph is PeriodicHabit => ph !== null && !!ph.text);

      profile.lastResetDate = parseDateField(profile.lastResetDate, getTodayDateString());
      profile.avatarId = typeof profile.avatarId === 'string' ? profile.avatarId : DEFAULT_AVATAR_ID;
      profile.experiencePoints = parseNumericField(profile.experiencePoints, 0);
      profile.shareHabitsPublicly = typeof profile.shareHabitsPublicly === 'boolean' ? profile.shareHabitsPublicly : false;
      profile.lastLevelRewardClaimed = parseNumericField(profile.lastLevelRewardClaimed, 1);
      profile.maxHabitSlots = INITIAL_MAX_HABIT_SLOTS;
      profile.boostedHabitId = (typeof profile.boostedHabitId === 'string' && profile.boostedHabitId) ? profile.boostedHabitId : null; 
      profile.sharedHabitStreaks = (typeof profile.sharedHabitStreaks === 'object' && profile.sharedHabitStreaks !== null && !Array.isArray(profile.sharedHabitStreaks))
        ? profile.sharedHabitStreaks : {};
      profile.lastSharedHabitCompletionResetDate = parseDateField(profile.lastSharedHabitCompletionResetDate, getTodayDateString()); 
      profile.captureCounts = (typeof profile.captureCounts === 'object' && profile.captureCounts !== null && !Array.isArray(profile.captureCounts))
        ? profile.captureCounts : {};

      return profile as UserProfile;
    } catch (error) {
      const todayStr = getTodayDateString();
      return {
        username: 'Treinador', habits: [], progressionHabits: [], periodicHabits: [],
        caughtPokemon: [], activePokemon: [], pokeBalls: 0, greatBalls: 0, ultraBalls: 0, masterBalls: 0, taskCoins: 0,
        dailyCompletions: 0, lastResetDate: todayStr, shinyCaughtPokemonIds: [],
        dailyStreak: 0, lastStreakUpdateDate: "", lastStreakDayClaimedForReward: 0, 
        fiveHabitStreak: 0, lastFiveHabitStreakUpdateDate: "", lastFiveHabitStreakDayClaimedForReward: 0,
        tenHabitStreak: 0, lastTenHabitStreakUpdateDate: "", lastTenHabitStreakDayClaimedForReward: 0,
        experiencePoints: 0, shareHabitsPublicly: false,
        lastLevelRewardClaimed: 1, maxHabitSlots: INITIAL_MAX_HABIT_SLOTS, avatarId: DEFAULT_AVATAR_ID,
        boostedHabitId: null, sharedHabitStreaks: {}, lastSharedHabitCompletionResetDate: todayStr,
        captureCounts: {},
      };
    }
  }, []);

  const handleDayRollover = useCallback((profile: UserProfile): UserProfile => {
    const todayUtc = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
    const todayLocalStr = formatDateToLocalStr(todayUtc); 
    
    const yesterdayUtc = new Date(todayUtc);
    yesterdayUtc.setUTCDate(yesterdayUtc.getUTCDate() - 1);
    const yesterdayLocalStr = formatDateToLocalStr(yesterdayUtc);
    
    let updatedProfile = { ...profile };

    if (profile.lastResetDate !== todayLocalStr) {
        updatedProfile.habits = updatedProfile.habits.map(h => ({ ...h, completedToday: false, rewardClaimedToday: false }));
        updatedProfile.dailyCompletions = 0;
        updatedProfile.lastResetDate = todayLocalStr;

        if (updatedProfile.lastStreakUpdateDate && updatedProfile.lastStreakUpdateDate !== yesterdayLocalStr && updatedProfile.lastStreakUpdateDate !== todayLocalStr) {
             updatedProfile.dailyStreak = 0;
             updatedProfile.lastStreakDayClaimedForReward = 0; 
        }
        if (updatedProfile.lastFiveHabitStreakUpdateDate && updatedProfile.lastFiveHabitStreakUpdateDate !== yesterdayLocalStr && updatedProfile.lastFiveHabitStreakUpdateDate !== todayLocalStr) {
            updatedProfile.fiveHabitStreak = 0;
            updatedProfile.lastFiveHabitStreakDayClaimedForReward = 0;
        }
        if (updatedProfile.lastTenHabitStreakUpdateDate && updatedProfile.lastTenHabitStreakUpdateDate !== yesterdayLocalStr && updatedProfile.lastTenHabitStreakUpdateDate !== todayLocalStr) {
            updatedProfile.tenHabitStreak = 0;
            updatedProfile.lastTenHabitStreakDayClaimedForReward = 0;
        }
    }

    updatedProfile.periodicHabits = updatedProfile.periodicHabits.map(ph => {
        const currentPeriodStartDateForHabit = parseLocalDateStr(ph.currentPeriodStartDate);
        const startOfCurrentNaturalPeriod = getStartOfCurrentPeriodInternal(todayUtc, ph.period);
        if (startOfCurrentNaturalPeriod.getTime() > currentPeriodStartDateForHabit.getTime()) {
            return { ...ph, isCompleted: false, currentPeriodStartDate: formatDateToLocalStr(startOfCurrentNaturalPeriod) };
        }
        return ph;
    });

    if (updatedProfile.lastSharedHabitCompletionResetDate !== todayLocalStr) {
        updatedProfile.lastSharedHabitCompletionResetDate = todayLocalStr;
    }
    return updatedProfile;
  }, []);

  const updateUserProfile = useCallback((profile: UserProfile) => {
    setCurrentUser(profile);
    localStorage.setItem('pokemonHabitUser', JSON.stringify(profile));
  }, []);

  const fetchSharedHabitsData = useCallback(async () => {
    if (!currentUser?.username) {
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
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Erro ao buscar dados do servidor.");
      }
      const data = await response.json();
      setSharedHabitsData({
        active: data.active || [],
        pendingInvitationsReceived: data.pendingInvitationsReceived || [],
        pendingInvitationsSent: data.pendingInvitationsSent || [],
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      console.error("Failed to fetch shared habits:", err);
      setSharedHabitsData(prev => ({ ...prev, isLoading: false, error: err.message }));
      setToastMessage(err.message || "Falha ao carregar hábitos compartilhados.", "error");
    }
  }, [currentUser?.username, currentUser?.experiencePoints, setToastMessage]);

  const loadUser = useCallback(() => {
    setLoading(true);
    let userProfile: UserProfile | null = null;
    try {
      const storedUser = localStorage.getItem('pokemonHabitUser');
      if (storedUser) {
        let parsedData = JSON.parse(storedUser);
        if (parsedData) {
          let initializedProfile = initializeProfileFields(parsedData);
          userProfile = handleDayRollover(initializedProfile);
          if (JSON.stringify(userProfile) !== JSON.stringify(initializedProfile)) { 
             localStorage.setItem('pokemonHabitUser', JSON.stringify(userProfile));
          }
        }
      }
    } catch (err) {
        console.error("UserContext: Error accessing data", err);
    } finally {
      setCurrentUser(userProfile);
      setLoading(false);
    }
  }, [initializeProfileFields, handleDayRollover]);

  useEffect(() => {
    loadUser(); 
    window.addEventListener('storage', loadUser);
    return () => window.removeEventListener('storage', loadUser);
  }, [loadUser]); 

  useEffect(() => {
    if (currentUser?.username) {
        const level = calculatePlayerLevelInfoInternal(currentUser.experiencePoints).level;
        if (level >= MIN_LEVEL_FOR_SHARED_HABITS) fetchSharedHabitsData();
        else setSharedHabitsData({ active: [], pendingInvitationsReceived: [], pendingInvitationsSent: [], isLoading: false, error: null });
    }
  }, [currentUser?.username, currentUser?.experiencePoints, fetchSharedHabitsData]);

  const login = async (username: string, passwordInput?: string): Promise<{ success: boolean; message?: string }> => {
    setLoading(true);
    const trimmedUsername = username.trim();
    if (!passwordInput) { setLoading(false); return { success: false, message: "Por favor, insira sua senha." }; }

    try {
      const response = await fetch(`/api/habits?username=${encodeURIComponent(trimmedUsername)}`);
      let userProfileData;
      let isNewUserScenario = false;

      if (response.ok) { 
        userProfileData = await response.json();
        if (userProfileData.password && userProfileData.password !== passwordInput) {
          setLoading(false);
          return { success: false, message: "Senha incorreta." };
        }
        if (!userProfileData.password) { userProfileData.password = passwordInput; isNewUserScenario = true; }
      } else if (response.status === 404) { 
        const todayStr = getTodayDateString();
        userProfileData = {
          username: trimmedUsername, password: passwordInput, habits: [], progressionHabits: [], periodicHabits: [],
          caughtPokemon: [], activePokemon: [], pokeBalls: 0, greatBalls: 0, ultraBalls: 0, masterBalls: 0, taskCoins: 0,
          dailyCompletions: 0, lastResetDate: todayStr, shinyCaughtPokemonIds: [],
          dailyStreak: 0, lastStreakUpdateDate: "", lastStreakDayClaimedForReward: 0, 
          fiveHabitStreak: 0, lastFiveHabitStreakUpdateDate: "", lastFiveHabitStreakDayClaimedForReward: 0,
          tenHabitStreak: 0, lastTenHabitStreakUpdateDate: "", lastTenHabitStreakDayClaimedForReward: 0,
          experiencePoints: 0, shareHabitsPublicly: false,
          lastLevelRewardClaimed: 1, maxHabitSlots: INITIAL_MAX_HABIT_SLOTS, avatarId: DEFAULT_AVATAR_ID,
          boostedHabitId: null, sharedHabitStreaks: {}, lastSharedHabitCompletionResetDate: todayStr,
          captureCounts: {},
        };
        isNewUserScenario = true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Falha ao verificar perfil: ${response.status}`);
      }
      
      let userProfile = initializeProfileFields(userProfileData);
      userProfile = handleDayRollover(userProfile);
      updateUserProfile(userProfile);
      setLoading(false);

      if (isNewUserScenario) await saveProfileToCloud(); 
      return { success: true, message: "Login bem-sucedido!" };
    } catch (error: any) {
      setLoading(false);
      return { success: false, message: error.message || "Erro durante o login." };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pokemonHabitUser');
    setSharedHabitsData({ active: [], pendingInvitationsReceived: [], pendingInvitationsSent: [], isLoading: false, error: null });
    setLoading(false);
  };

  const addHabit = (text: string) => {
    if (!currentUser || currentUser.habits.length >= currentUser.maxHabitSlots) return;
    const newHabit: Habit = { id: generateInstanceId(), text: text.trim(), completedToday: false, rewardClaimedToday: false, totalCompletions: 0 };
    updateUserProfile({ ...currentUser, habits: [...currentUser.habits, newHabit] });
  };

  const confirmHabitCompletion = (habitId: string) => {
    if (!currentUser) return;
    let profile = { ...currentUser };
    const habitIdx = profile.habits.findIndex(h => h.id === habitId);
    if (habitIdx === -1 || profile.habits[habitIdx].completedToday) return;

    profile.habits[habitIdx] = { ...profile.habits[habitIdx], completedToday: true, rewardClaimedToday: true, totalCompletions: (profile.habits[habitIdx].totalCompletions || 0) + 1 };
    profile.dailyCompletions++;
    
    const isBoosted = profile.boostedHabitId === habitId && calculatePlayerLevelInfoInternal(profile.experiencePoints).level >= MIN_LEVEL_FOR_BOOSTED_HABIT;
    const tcGain = isBoosted ? TASK_COINS_FROM_POKEBALL * BOOSTED_HABIT_POKEBALL_REWARD : TASK_COINS_FROM_POKEBALL;
    profile.taskCoins += tcGain;
    profile.pokeBalls += isBoosted ? BOOSTED_HABIT_POKEBALL_REWARD : NORMAL_HABIT_POKEBALL_REWARD;
    profile.experiencePoints += isBoosted ? XP_PER_HABIT_COMPLETION * BOOSTED_HABIT_XP_MULTIPLIER : XP_PER_HABIT_COMPLETION;

    if (profile.dailyCompletions % 5 === 0) { profile.greatBalls++; profile.taskCoins += TASK_COINS_FROM_GREATBALL; }
    if (profile.dailyCompletions % 10 === 0) { profile.ultraBalls++; profile.taskCoins += TASK_COINS_FROM_ULTRABALL; }

    const todayStr = getTodayDateString();
    if (profile.lastStreakUpdateDate !== todayStr) {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayStr = formatDateToLocalStr(yesterday);
      profile.dailyStreak = (profile.lastStreakUpdateDate === yesterdayStr) ? profile.dailyStreak + 1 : 1;
      profile.lastStreakUpdateDate = todayStr;
    }

    if (profile.dailyCompletions >= 5 && profile.lastFiveHabitStreakUpdateDate !== todayStr) {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayStr = formatDateToLocalStr(yesterday);
      profile.fiveHabitStreak = (profile.lastFiveHabitStreakUpdateDate === yesterdayStr) ? profile.fiveHabitStreak + 1 : 1;
      profile.lastFiveHabitStreakUpdateDate = todayStr;
    }

    if (profile.dailyCompletions >= 10 && profile.lastTenHabitStreakUpdateDate !== todayStr) {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayStr = formatDateToLocalStr(yesterday);
      profile.tenHabitStreak = (profile.lastTenHabitStreakUpdateDate === yesterdayStr) ? profile.tenHabitStreak + 1 : 1;
      profile.lastTenHabitStreakUpdateDate = todayStr;
    }

    updateUserProfile(profile);
  };

  const deleteHabit = (habitId: string) => {
    if (!currentUser) return;
    updateUserProfile({ 
        ...currentUser, 
        habits: currentUser.habits.filter(h => h.id !== habitId),
        progressionHabits: currentUser.progressionHabits.filter(ph => ph.mainHabitId !== habitId),
        boostedHabitId: currentUser.boostedHabitId === habitId ? null : currentUser.boostedHabitId
    });
  };

  const buyBall = async (type: BallType) => {
    if (!currentUser) return;
    const price = currentUser.username === TEST_USER_USERNAME 
        ? 0 
        : (type === 'poke' ? PRICE_POKEBALL : type === 'great' ? PRICE_GREATBALL : PRICE_ULTRABALL);

    if (currentUser.taskCoins < price) { setToastMessage("Task Coins insuficientes!", "error"); return; }

    const updated = {
      ...currentUser,
      taskCoins: currentUser.taskCoins - price,
      pokeBalls: type === 'poke' ? currentUser.pokeBalls + 1 : currentUser.pokeBalls,
      greatBalls: type === 'great' ? currentUser.greatBalls + 1 : currentUser.greatBalls,
      ultraBalls: type === 'ultra' ? currentUser.ultraBalls + 1 : currentUser.ultraBalls,
    };
    updateUserProfile(updated);
    setToastMessage(`Você comprou uma ${getTranslatedBallName(type)}!`, "success");
    await saveProfileToCloud();
  };

  const activatePokemon = async (instanceId: string): Promise<boolean> => {
    if (!currentUser) return false;
    const price = currentUser.username === TEST_USER_USERNAME ? 0 : PRICE_ACTIVATE_POKEMON;

    if (currentUser.taskCoins < price) {
      setToastMessage("Coins insuficientes para ativar um Pokémon!", "error");
      return false;
    }

    const pokemonToActivate = currentUser.caughtPokemon.find(p => p.instanceId === instanceId);
    if (!pokemonToActivate || !ELIGIBLE_FOR_ACTIVATION.includes(pokemonToActivate.id)) {
      setToastMessage("Apenas Charmander, Bulbasaur, Squirtle ou Pikachu podem ser ativados.", "error");
      return false;
    }

    const ranges = (PLAYABLE_STATS_RANGES as any)[pokemonToActivate.id];
    const getRandom = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

    const stats: PokemonStats = {
      hp: getRandom(ranges.hp[0], ranges.hp[1]),
      attack: getRandom(ranges.attack[0], ranges.attack[1]),
      defense: getRandom(ranges.defense[0], ranges.defense[1]),
      accuracy: getRandom(ranges.accuracy[0], ranges.accuracy[1]),
      agility: getRandom(ranges.agility[0], ranges.agility[1]),
    };

    const newPlayable: PlayablePokemon = {
      instanceId: pokemonToActivate.instanceId,
      id: pokemonToActivate.id,
      name: pokemonToActivate.name,
      spriteUrl: pokemonToActivate.spriteUrl,
      isShiny: pokemonToActivate.isShiny,
      stats: stats,
      activatedAt: new Date().toISOString()
    };

    const updatedProfile = {
      ...currentUser,
      taskCoins: currentUser.taskCoins - price,
      caughtPokemon: currentUser.caughtPokemon.map(p => p.instanceId === instanceId ? { ...p, isActive: true } : p),
      activePokemon: [...currentUser.activePokemon, newPlayable]
    };

    updateUserProfile(updatedProfile);
    setToastMessage(`${pokemonToActivate.name} agora é um Pokémon Ativo!`, "success");
    await saveProfileToCloud();
    return true;
  };

  const saveProfileToCloud = async () => {
    if (!currentUser) return { success: false, message: "Não logado." };
    try {
      const response = await fetch('/api/habits', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentUser),
      });
      if (!response.ok) throw new Error("Erro ao salvar.");
      return { success: true, message: "Salvo com sucesso!" };
    } catch (err: any) { return { success: false, message: err.message }; }
  };

  const loadProfileFromCloud = async () => {
    if (!currentUser?.username) return { success: false, message: "Não logado." };
    setLoading(true);
    try {
      const res = await fetch(`/api/habits?username=${encodeURIComponent(currentUser.username)}`);
      if (!res.ok) throw new Error("Erro ao carregar.");
      const data = await res.json();
      const initialized = initializeProfileFields(data);
      updateUserProfile(handleDayRollover(initialized));
      setLoading(false);
      return { success: true, message: "Recarregado!" };
    } catch (err: any) { setLoading(false); return { success: false, message: err.message }; }
  };

  const catchFromBall = (type: BallType) => {
    if (!currentUser) return null;
    const pool = type === 'poke' ? POKEBALL_WEIGHTED_POOL : type === 'great' ? GREATBALL_WEIGHTED_POOL : type === 'ultra' ? ULTRABALL_WEIGHTED_POOL : MASTERBALL_WEIGHTED_POOL;
    const totalWeight = pool.reduce((s, e) => s + e.weight, 0);
    let rand = Math.random() * totalWeight;
    let chosen = pool[0];
    for (const e of pool) { if (rand < e.weight) { chosen = e; break; } rand -= e.weight; }
    
    const master = POKEMON_MASTER_LIST.find(m => m.id === chosen.id);
    const isShiny = Math.random() < SHINY_CHANCE;
    const newPkmn: CaughtPokemon = {
      id: chosen.id, name: chosen.nameOverride || master?.name || "Desconhecido",
      instanceId: generateInstanceId(), caughtDate: new Date().toISOString(),
      spriteUrl: isShiny ? POKEMON_API_SHINY_SPRITE_URL(chosen.id) : POKEMON_API_SPRITE_URL(chosen.id),
      caughtWithBallType: type, isShiny: isShiny,
      isActive: false
    };

    let profile = { ...currentUser };
    profile.caughtPokemon.push(newPkmn);
    if (type === 'poke') profile.pokeBalls--; else if (type === 'great') profile.greatBalls--; else if (type === 'ultra') profile.ultraBalls--; else profile.masterBalls--;
    profile.experiencePoints += type === 'poke' ? XP_FROM_POKEBALL : type === 'great' ? XP_FROM_GREATBALL : type === 'ultra' ? XP_FROM_ULTRABALL : XP_FROM_MASTERBALL;
    profile.taskCoins += type === 'poke' ? TASK_COINS_FROM_POKEBALL : type === 'great' ? TASK_COINS_FROM_GREATBALL : type === 'ultra' ? TASK_COINS_FROM_ULTRABALL : TASK_COINS_FROM_MASTERBALL;

    // Increment capture count
    if (!profile.captureCounts) profile.captureCounts = {};
    profile.captureCounts[newPkmn.id] = (profile.captureCounts[newPkmn.id] || 0) + 1;

    updateUserProfile(profile);
    saveProfileToCloud();
    return newPkmn;
  };

  const catchFromPokeBall = () => catchFromBall('poke');
  const catchFromGreatBall = () => catchFromBall('great');
  const catchFromUltraBall = () => catchFromBall('ultra');
  const catchFromMasterBall = () => catchFromBall('master');

  const releasePokemon = (instanceId: string) => {
    if (!currentUser) return;
    const pkmn = currentUser.caughtPokemon.find(p => p.instanceId === instanceId);
    if (pkmn?.isActive) {
        setToastMessage("Pokémon Ativos não podem ser liberados!", "error");
        return;
    }
    updateUserProfile({ ...currentUser, caughtPokemon: currentUser.caughtPokemon.filter(p => p.instanceId !== instanceId) });
  };

  const tradePokemon = (ids: string[], tradeId: string) => {
    if (!currentUser) return false;
    const pkmns = currentUser.caughtPokemon.filter(p => ids.includes(p.instanceId));
    if (pkmns.some(p => p.isActive)) {
        setToastMessage("Pokémon Ativos não podem ser trocados!", "error");
        return false;
    }
    const offer = TRADE_OFFERS.find(t => t.id === tradeId);
    if (!offer) return false;
    const selected = currentUser.caughtPokemon.filter(p => ids.includes(p.instanceId));
    if (selected.length !== offer.inputPokemon.reduce((s, i) => s + i.count, 0)) return false;
    
    let profile = { ...currentUser, caughtPokemon: currentUser.caughtPokemon.filter(p => !ids.includes(p.instanceId)) };
    if (offer.outputBall.type === 'poke') profile.pokeBalls += offer.outputBall.count;
    else if (offer.outputBall.type === 'great') profile.greatBalls += offer.outputBall.count;
    else if (offer.outputBall.type === 'ultra') profile.ultraBalls += offer.outputBall.count;
    else profile.masterBalls += offer.outputBall.count;
    
    updateUserProfile(profile);
    return true;
  };

  const sendSharedHabitInvitation = async (target: string, text: string) => {
    if (!currentUser) return { success: false };
    try {
      const res = await fetch('/api/sharedHabits?action=invite', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorUsername: currentUser.username, inviteeUsername: target, habitText: text })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro");
      fetchSharedHabitsData();
      return { success: true, message: data.message };
    } catch (err: any) { return { success: false, message: err.message }; }
  };

  const claimStreakRewards = () => {
    if (!currentUser) return;
    let profile = { ...currentUser };
    let totalTC = 0;
    let totalPokeBalls = 0;
    let totalGreatBalls = 0;
    let totalUltraBalls = 0;
    let claimedAny = false;

    // Daily Streak Rewards
    if (profile.dailyStreak > profile.lastStreakDayClaimedForReward) {
      const daysToClaim = profile.dailyStreak - profile.lastStreakDayClaimedForReward;
      totalTC += daysToClaim * 2;
      totalPokeBalls += daysToClaim;
      profile.lastStreakDayClaimedForReward = profile.dailyStreak;
      claimedAny = true;
    }

    // 5-Habit Streak Rewards
    if (profile.fiveHabitStreak > profile.lastFiveHabitStreakDayClaimedForReward) {
      const daysToClaim = profile.fiveHabitStreak - profile.lastFiveHabitStreakDayClaimedForReward;
      totalTC += daysToClaim * 10;
      totalGreatBalls += daysToClaim;
      profile.lastFiveHabitStreakDayClaimedForReward = profile.fiveHabitStreak;
      claimedAny = true;
    }

    // 10-Habit Streak Rewards
    if (profile.tenHabitStreak > profile.lastTenHabitStreakDayClaimedForReward) {
      const daysToClaim = profile.tenHabitStreak - profile.lastTenHabitStreakDayClaimedForReward;
      totalTC += daysToClaim * 25;
      totalUltraBalls += daysToClaim;
      profile.lastTenHabitStreakDayClaimedForReward = profile.tenHabitStreak;
      claimedAny = true;
    }

    if (claimedAny) {
      profile.taskCoins += totalTC;
      profile.pokeBalls += totalPokeBalls;
      profile.greatBalls += totalGreatBalls;
      profile.ultraBalls += totalUltraBalls;
      updateUserProfile(profile);
      setToastMessage(`Recompensas resgatadas! +${totalTC} Coins, +${totalPokeBalls} Poké, +${totalGreatBalls} Great, +${totalUltraBalls} Ultra.`, "success");
      saveProfileToCloud();
    } else {
      setToastMessage("Nenhuma recompensa para resgatar no momento.", "info");
    }
  };

  const claimLevelRewards = () => {
    if (!currentUser) return;
    const { level } = calculatePlayerLevelInfoInternal(currentUser.experiencePoints);
    let profile = { ...currentUser };
    let totalTC = 0;
    let totalPokeBalls = 0;
    let totalGreatBalls = 0;
    let totalUltraBalls = 0;
    let claimedAny = false;

    for (let l = profile.lastLevelRewardClaimed + 1; l <= level; l++) {
      totalTC += l * 5;
      totalPokeBalls += 5;
      if (l % 2 === 0) totalGreatBalls += 2;
      if (l % 5 === 0) totalUltraBalls += 1;
      claimedAny = true;
    }

    if (claimedAny) {
      profile.lastLevelRewardClaimed = level;
      profile.taskCoins += totalTC;
      profile.pokeBalls += totalPokeBalls;
      profile.greatBalls += totalGreatBalls;
      profile.ultraBalls += totalUltraBalls;
      updateUserProfile(profile);
      setToastMessage(`Recompensas de nível resgatadas! Nível ${level} alcançado.`, "success");
      saveProfileToCloud();
    } else {
      setToastMessage("Nenhuma recompensa de nível para resgatar.", "info");
    }
  };

  return (
    <UserContext.Provider value={{
      currentUser, loading, login, logout, addHabit, confirmHabitCompletion, deleteHabit,
      catchFromPokeBall, catchFromGreatBall, catchFromUltraBall, catchFromMasterBall,
      releasePokemon, tradePokemon, updateUserProfile, saveProfileToCloud, loadProfileFromCloud,
      toggleShareHabitsPublicly: () => updateUserProfile({ ...currentUser!, shareHabitsPublicly: !currentUser?.shareHabitsPublicly }),
      selectAvatar: (id) => updateUserProfile({ ...currentUser!, avatarId: id }),
      claimStreakRewards, claimLevelRewards, 
      toastMessage: toastMessageState, clearToastMessage, setToastMessage,
      calculatePlayerLevelInfo: calculatePlayerLevelInfoInternal,
      toggleHabitBoost: (id) => updateUserProfile({ ...currentUser!, boostedHabitId: currentUser?.boostedHabitId === id ? null : id }),
      buyBall, activatePokemon, addProgressionHabit: () => {}, confirmProgressionHabitCompletion: () => {}, deleteProgressionHabit: () => {},
      calculateMaxProgressionSlots: calculateMaxProgressionSlotsInternal,
      addPeriodicHabit: () => {}, completePeriodicHabit: () => {}, deletePeriodicHabit: () => {},
      getStartOfCurrentPeriod: getStartOfCurrentPeriodInternal,
      sharedHabitsData, fetchSharedHabitsData, sendSharedHabitInvitation,
      respondToSharedHabitInvitation: async () => ({ success: true }), completeSharedHabit: async () => ({ success: true }),
      cancelSentSharedHabitRequest: async () => ({ success: true }), deleteSharedHabit: async () => ({ success: true }),
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
};
