
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
} from '../constants';
import type { WeightedPokemonEntry } from '../constants'; // Changed to type-only import

interface UserContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  login: (username: string) => void;
  logout: () => void;
  addHabit: (text: string) => void;
  toggleHabit: (habitId: string) => void;
  deleteHabit: (habitId: string) => void;
  catchFromPokeBall: () => CaughtPokemon | null;
  catchFromGreatBall: () => CaughtPokemon | null;
  catchFromUltraBall: () => CaughtPokemon | null;
  catchFromMasterBall: () => CaughtPokemon | null; 
  releasePokemon: (instanceId: string) => void;
  tradePokemon: (selectedInstanceIds: string[], tradeId: string) => boolean;
  updateUserProfile: (profile: UserProfile) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const getTodayDateString = (): string => new Date().toISOString().split('T')[0];
const generateInstanceId = (): string => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
const MAX_HISTORY_ENTRIES = 60; // Cap for completion history


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
      ).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());


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
              pendingRewardConfirmation: false,
              totalCompletions: 0,
            };
          }
          return {
              id: (typeof h.id === 'string' && h.id) ? h.id : generateInstanceId(),
              text: (typeof h.text === 'string' && h.text.trim()) ? h.text.trim() : 'Hábito Sem Nome',
              completedToday: typeof h.completedToday === 'boolean' ? h.completedToday : false,
              rewardClaimedToday: typeof h.rewardClaimedToday === 'boolean' ? h.rewardClaimedToday : false,
              pendingRewardConfirmation: typeof h.pendingRewardConfirmation === 'boolean' ? h.pendingRewardConfirmation : false,
              totalCompletions: parseNumericField(h.totalCompletions, 0),
          };
        })
        .filter((h: Habit) => h.id && h.text); 

      profile.lastResetDate = (typeof profile.lastResetDate === 'string' && profile.lastResetDate.match(/^\d{4}-\d{2}-\d{2}$/)) 
        ? profile.lastResetDate 
        : getTodayDateString();
      
      delete profile.avatar; // Remove avatar property if it exists from old data
      
      // Initialize experience points
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
        lastResetDate: getTodayDateString(),
        shinyCaughtPokemonIds: [],
        dailyStreak: 0,
        lastStreakUpdateDate: "",
        completionHistory: [],
        experiencePoints: 0,
      };
    }
  }, []);
  
  const handleDayRollover = useCallback((profile: UserProfile): UserProfile => {
    const today = getTodayDateString();
    if (profile.lastResetDate === today) {
      return profile; // No rollover needed
    }
  
    let updatedProfile = { ...profile };
    const previousDayCompletions = updatedProfile.dailyCompletions;
    const previousDayDate = updatedProfile.lastResetDate; 
  
    let newHistory = [{ date: previousDayDate, count: previousDayCompletions }, ...updatedProfile.completionHistory];
    if (newHistory.length > MAX_HISTORY_ENTRIES) {
      newHistory = newHistory.slice(0, MAX_HISTORY_ENTRIES);
    }
    updatedProfile.completionHistory = newHistory;
  
    if (previousDayCompletions > 0) {
      const prevDayDateObj = new Date(previousDayDate);
      const dayBeforePrevDayDateObj = new Date(prevDayDateObj);
      dayBeforePrevDayDateObj.setDate(prevDayDateObj.getDate() - 1);
      const dayBeforePrevDayStr = dayBeforePrevDayDateObj.toISOString().split('T')[0];
  
      if (updatedProfile.lastStreakUpdateDate === dayBeforePrevDayStr) {
        updatedProfile.dailyStreak = (updatedProfile.dailyStreak || 0) + 1;
      } else {
        updatedProfile.dailyStreak = 1; 
      }
      updatedProfile.lastStreakUpdateDate = previousDayDate;
    } else {
      updatedProfile.dailyStreak = 0;
      updatedProfile.lastStreakUpdateDate = previousDayDate; 
    }
  
    updatedProfile.habits = updatedProfile.habits.map(h => ({
      ...h,
      completedToday: false,
      rewardClaimedToday: false,
      pendingRewardConfirmation: false,
    }));
    updatedProfile.dailyCompletions = 0;
    updatedProfile.lastResetDate = today;
  
    return updatedProfile;
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

  const updateUserProfile = useCallback((profile: UserProfile) => {
    setCurrentUser(profile);
    try {
      localStorage.setItem('pokemonHabitUser', JSON.stringify(profile));
    } catch (error) {
      console.error("UserContext: Failed to save user profile to localStorage", error);
    }
  }, []);

  const login = (username: string) => {
    setLoading(true);
    try {
      const storedUsersString = localStorage.getItem('allPokemonHabitUsers');
      const storedUsers = storedUsersString ? JSON.parse(storedUsersString) : {};
      let userProfileData = storedUsers[username.trim()];

      if (!userProfileData) {
        userProfileData = {
          username: username.trim(), 
          habits: [], caughtPokemon: [], pokeBalls: 0, greatBalls: 0, ultraBalls: 0, masterBalls: 0,
          dailyCompletions: 0, lastResetDate: getTodayDateString(), shinyCaughtPokemonIds: [],
          dailyStreak: 0, lastStreakUpdateDate: "", completionHistory: [],
          experiencePoints: 0,
        };
      } else {
        userProfileData.username = username.trim(); 
      }
      
      let userProfile = initializeProfileFields(userProfileData);
      userProfile = handleDayRollover(userProfile); 

      storedUsers[userProfile.username] = userProfile; 
      localStorage.setItem('allPokemonHabitUsers', JSON.stringify(storedUsers));
      localStorage.setItem('pokemonHabitUser', JSON.stringify(userProfile)); 
      setCurrentUser(userProfile);
    } catch (error) {
      console.error("UserContext: Error during login:", error);
      setCurrentUser(null);
      localStorage.removeItem('pokemonHabitUser');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    if (currentUser) {
      try {
        const finalProfileToSave = handleDayRollover(initializeProfileFields(currentUser)); 
        
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
      completedToday: false, rewardClaimedToday: false, pendingRewardConfirmation: false,
      totalCompletions: 0,
    };
    updateUserProfile({ ...currentUser, habits: [...currentUser.habits, newHabit] });
  };

  const toggleHabit = (habitId: string) => {
    if (!currentUser) return;
  
    const habitIndex = currentUser.habits.findIndex(h => h.id === habitId);
    if (habitIndex === -1) return;
  
    const updatedHabits = [...currentUser.habits];
    const habitToToggle = { ...updatedHabits[habitIndex] };
  
    let newPokeBalls = currentUser.pokeBalls;
    let newGreatBalls = currentUser.greatBalls;
    let newUltraBalls = currentUser.ultraBalls;
    let newDailyCompletions = currentUser.dailyCompletions;
    const previousDailyCompletionsForTierCheck = currentUser.dailyCompletions;
  
    const isChecking = !habitToToggle.completedToday;
  
    if (isChecking) {
      habitToToggle.completedToday = true;
      if (!habitToToggle.rewardClaimedToday && !habitToToggle.pendingRewardConfirmation) {
        habitToToggle.pendingRewardConfirmation = true; 
        
        newDailyCompletions++;
        newPokeBalls++;
        if (newDailyCompletions % 5 === 0) newGreatBalls++;
        if (newDailyCompletions % 10 === 0) newUltraBalls++;
      }
    } else { 
      habitToToggle.completedToday = false;
      
      if (habitToToggle.pendingRewardConfirmation) {
        newDailyCompletions = Math.max(0, previousDailyCompletionsForTierCheck - 1);
        if (newPokeBalls > 0) newPokeBalls--;
        if (previousDailyCompletionsForTierCheck % 5 === 0 && newGreatBalls > 0) newGreatBalls--;
        if (previousDailyCompletionsForTierCheck % 10 === 0 && newUltraBalls > 0) newUltraBalls--;
        habitToToggle.pendingRewardConfirmation = false; 
      } else if (habitToToggle.rewardClaimedToday) {
        newDailyCompletions = Math.max(0, previousDailyCompletionsForTierCheck - 1);
         if (newPokeBalls > 0) newPokeBalls--; 
         if (previousDailyCompletionsForTierCheck % 5 === 0 && newGreatBalls > 0 && newDailyCompletions < previousDailyCompletionsForTierCheck) newGreatBalls--;
         if (previousDailyCompletionsForTierCheck % 10 === 0 && newUltraBalls > 0 && newDailyCompletions < previousDailyCompletionsForTierCheck) newUltraBalls--;
      }
    }
  
    updatedHabits[habitIndex] = habitToToggle;
    
    updateUserProfile({
      ...currentUser, 
      habits: updatedHabits, 
      pokeBalls: newPokeBalls, 
      greatBalls: newGreatBalls,
      ultraBalls: newUltraBalls, 
      dailyCompletions: newDailyCompletions,
    });
  };

  const deleteHabit = (habitId: string) => {
    if (!currentUser) return;
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
        if (randomPokemonId === undefined) randomPokemonId = weightedPool[weightedPool.length - 1]?.id;
      }
    } else { 
      const idPool = pool as number[];
      randomPokemonId = idPool[Math.floor(Math.random() * idPool.length)];
    }
    
    if (randomPokemonId === undefined) {
        const fallback = POKEMON_MASTER_LIST.find(p => p.id === 129); 
        return fallback ? { ...fallback, instanceId: generateInstanceId(), caughtDate: new Date().toISOString(), spriteUrl: POKEMON_API_SPRITE_URL(fallback.id), caughtWithBallType: ballUsed, name: `Erro: Problema no Grupo`, isShiny: false } : null;
    }

    const pokemonDetails = POKEMON_MASTER_LIST.find(p => p.id === randomPokemonId);
    if (!pokemonDetails) {
        const fallback = POKEMON_MASTER_LIST.find(p => p.id === 1); 
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
  
  const confirmNextPendingReward = (profile: UserProfile): UserProfile => {
    const habitsCopy = [...profile.habits];
    let newExperiencePoints = profile.experiencePoints;
    const habitToConfirmIndex = habitsCopy.findIndex(h => h.pendingRewardConfirmation);

    if (habitToConfirmIndex !== -1) {
      const confirmedHabit = { ...habitsCopy[habitToConfirmIndex] };
      confirmedHabit.pendingRewardConfirmation = false;
      confirmedHabit.rewardClaimedToday = true; 
      confirmedHabit.totalCompletions = (confirmedHabit.totalCompletions || 0) + 1;
      newExperiencePoints += XP_PER_HABIT_COMPLETION; // Award XP
      habitsCopy[habitToConfirmIndex] = confirmedHabit;
    }
    return { ...profile, habits: habitsCopy, experiencePoints: newExperiencePoints };
  };

  const catchFromPokeBall = (): CaughtPokemon | null => {
    if (!currentUser || currentUser.pokeBalls <= 0) return null;
    const newPokemon = _catchPokemonFromPool(POKEBALL_WEIGHTED_POOL, 'poke');
    
    const profileWithHabitConfirmed = confirmNextPendingReward(currentUser);
    const profileWithBallSpent: UserProfile = { 
      ...profileWithHabitConfirmed, 
      pokeBalls: profileWithHabitConfirmed.pokeBalls - 1,
    };
    
    const finalProfile = handlePokemonCatchInternal(newPokemon, profileWithBallSpent);
    updateUserProfile(finalProfile);
    return newPokemon;
  };

  const catchFromGreatBall = (): CaughtPokemon | null => {
    if (!currentUser || currentUser.greatBalls <= 0) return null;
    const newPokemon = _catchPokemonFromPool(GREATBALL_WEIGHTED_POOL, 'great'); 
    
    const profileWithHabitConfirmed = confirmNextPendingReward(currentUser);
    const profileWithBallSpent: UserProfile = { 
      ...profileWithHabitConfirmed, 
      greatBalls: profileWithHabitConfirmed.greatBalls - 1,
    };

    const finalProfile = handlePokemonCatchInternal(newPokemon, profileWithBallSpent);
    updateUserProfile(finalProfile);
    return newPokemon;
  };

  const catchFromUltraBall = (): CaughtPokemon | null => {
    if (!currentUser || currentUser.ultraBalls <= 0) return null;
    const newPokemon = _catchPokemonFromPool(ULTRABALL_WEIGHTED_POOL, 'ultra');
    
    const profileWithHabitConfirmed = confirmNextPendingReward(currentUser);
    const profileWithBallSpent: UserProfile = { 
      ...profileWithHabitConfirmed, 
      ultraBalls: profileWithHabitConfirmed.ultraBalls - 1,
    };
    
    const finalProfile = handlePokemonCatchInternal(newPokemon, profileWithBallSpent);
    updateUserProfile(finalProfile);
    return newPokemon;
  };

  const catchFromMasterBall = (): CaughtPokemon | null => {
    if (!currentUser || currentUser.masterBalls <= 0) return null;
    const newPokemon = _catchPokemonFromPool(MASTERBALL_WEIGHTED_POOL, 'master');

    const profileWithHabitConfirmed = confirmNextPendingReward(currentUser);
    const profileWithBallSpent: UserProfile = { 
      ...profileWithHabitConfirmed, 
      masterBalls: profileWithHabitConfirmed.masterBalls - 1,
    };

    const finalProfile = handlePokemonCatchInternal(newPokemon, profileWithBallSpent);
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
  
  return (
    <UserContext.Provider value={{ 
      currentUser, 
      loading, 
      login, 
      logout, 
      addHabit, 
      toggleHabit, 
      deleteHabit,
      catchFromPokeBall, 
      catchFromGreatBall, 
      catchFromUltraBall,
      catchFromMasterBall,
      releasePokemon,
      tradePokemon,
      updateUserProfile,
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
