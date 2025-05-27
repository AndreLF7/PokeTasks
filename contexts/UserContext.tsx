
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
import type { WeightedPokemonEntry } from '../constants';

// Define API base URL
const API_BASE_URL = 'PokesTasks/api/pokehabits.js'; 

interface UserContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  login: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  addHabit: (text: string) => Promise<void>;
  toggleHabit: (habitId: string) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  catchFromPokeBall: () => Promise<CaughtPokemon | null>;
  catchFromGreatBall: () => Promise<CaughtPokemon | null>;
  catchFromUltraBall: () => Promise<CaughtPokemon | null>;
  catchFromMasterBall: () => Promise<CaughtPokemon | null>; 
  releasePokemon: (instanceId: string) => Promise<void>;
  tradePokemon: (selectedInstanceIds: string[], tradeId: string) => Promise<boolean>;
  updateUserProfile: (profile: UserProfile) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const getTodayDateString = (): string => new Date().toISOString().split('T')[0];
const generateInstanceId = (): string => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
const MAX_HISTORY_ENTRIES = 60;


interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // --- API Helper Functions ---
  const fetchUserProfile = useCallback(async (username: string): Promise<UserProfile | null> => {
    try {
      // Assuming the backend expects username as a query parameter for GET
      const response = await fetch(`${API_BASE_URL}?username=${encodeURIComponent(username)}`);
      if (response.status === 404) {
        console.log(`UserContext: User ${username} not found on backend. A new profile will be used.`);
        return null; 
      }
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error fetching profile for ${username}: ${response.status} ${response.statusText} - ${errorText}`);
      }
      const data = await response.json();
      if (!data || typeof data.username !== 'string') { 
          console.error("UserContext: Fetched data is not a valid user profile.", data);
          throw new Error("Invalid profile data received from backend.");
      }
      return data as UserProfile;
    } catch (error) {
      console.error(`UserContext: Failed to fetch user profile for ${username}:`, error);
      throw error; 
    }
  }, []);

  const saveUserProfile = useCallback(async (profile: UserProfile): Promise<void> => {
    if (!profile || !profile.username) {
      console.error("UserContext: Attempted to save an invalid or null profile.", profile);
      return;
    }
    try {
      // Assuming the backend expects the profile in the body for POST
      const response = await fetch(API_BASE_URL, {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error saving profile for ${profile.username}: ${response.status} ${response.statusText} - ${errorText}`);
      }
      console.log(`UserContext: User profile for ${profile.username} saved successfully to backend.`);
    } catch (error) {
      console.error(`UserContext: Failed to save user profile for ${profile.username} to backend:`, error);
      throw error; 
    }
  }, []);


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
      
      delete profile.avatar;
      profile.experiencePoints = parseNumericField(profile.experiencePoints, 0);
      
      return profile as UserProfile;
    } catch (error) {
      console.error("UserContext: CRITICAL - Unhandled error in initializeProfileFields. Returning default profile.", error, "Input data:", profileInput);
      return {
        username: 'Treinador', habits: [], caughtPokemon: [], pokeBalls: 0, greatBalls: 0, ultraBalls: 0, masterBalls: 0, 
        dailyCompletions: 0, lastResetDate: getTodayDateString(), shinyCaughtPokemonIds: [],
        dailyStreak: 0, lastStreakUpdateDate: "", completionHistory: [], experiencePoints: 0,
      };
    }
  }, []);
  
  const handleDayRollover = useCallback((profile: UserProfile): UserProfile => {
    const today = getTodayDateString();
    if (profile.lastResetDate === today) return profile;
  
    console.log(`UserContext: Performing day rollover from ${profile.lastResetDate} to ${today}`);
    let updatedProfile = { ...profile };
    const previousDayCompletions = updatedProfile.dailyCompletions;
    const previousDayDate = updatedProfile.lastResetDate; 
  
    let newHistory = [{ date: previousDayDate, count: previousDayCompletions }, ...updatedProfile.completionHistory];
    if (newHistory.length > MAX_HISTORY_ENTRIES) newHistory = newHistory.slice(0, MAX_HISTORY_ENTRIES);
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
      const prevDayDateObj = new Date(previousDayDate);
      const todayDateObj = new Date(today); 
      const diffTime = Math.abs(todayDateObj.getTime() - prevDayDateObj.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 1 && updatedProfile.dailyStreak > 0) {
          const dayBeforePreviousDateObj = new Date(previousDayDate); 
          dayBeforePreviousDateObj.setDate(dayBeforePreviousDateObj.getDate() - 1);

          if (updatedProfile.lastStreakUpdateDate !== dayBeforePreviousDateObj.toISOString().split('T')[0]) {
              updatedProfile.dailyStreak = 0;
          }
      } else if (previousDayCompletions === 0 && diffDays === 1) { 
          updatedProfile.dailyStreak = 0;
      }
      updatedProfile.lastStreakUpdateDate = previousDayDate; 
    }
  
    updatedProfile.habits = updatedProfile.habits.map(h => ({
      ...h, completedToday: false, rewardClaimedToday: false, pendingRewardConfirmation: false,
    }));
    updatedProfile.dailyCompletions = 0;
    updatedProfile.lastResetDate = today;
  
    return updatedProfile;
  }, []);


  const updateUserProfileAndPersist = useCallback(async (profile: UserProfile) => {
    setCurrentUser(profile); 
    try {
      await saveUserProfile(profile);
    } catch (error) {
      console.error("UserContext: Failed to save user profile to backend via updateUserProfileAndPersist:", error);
    }
  }, [saveUserProfile]);


  const loadUser = useCallback(async () => {
    setLoading(true);
    let userProfileToSet: UserProfile | null = null;
    try {
      const storedUsername = localStorage.getItem('loggedInUsername');
      if (storedUsername) {
        const fetchedProfileData = await fetchUserProfile(storedUsername);
        if (fetchedProfileData) {
          let initializedProfile = initializeProfileFields(fetchedProfileData);
          userProfileToSet = handleDayRollover(initializedProfile);
          
          const profileChangedDuringLoad = 
            JSON.stringify(userProfileToSet) !== JSON.stringify(initializedProfile) || 
            JSON.stringify(initializedProfile) !== JSON.stringify(fetchedProfileData); 

          if (profileChangedDuringLoad) {
            console.log("UserContext: Profile changed during load/rollover, saving back to backend.");
            await saveUserProfile(userProfileToSet);
          }
        } else {
          localStorage.removeItem('loggedInUsername');
        }
      }
    } catch (error) {
      console.error("UserContext: Error during loadUser, clearing session.", error);
      localStorage.removeItem('loggedInUsername');
    } finally {
      setCurrentUser(userProfileToSet);
      setLoading(false);
    }
  }, [initializeProfileFields, handleDayRollover, fetchUserProfile, saveUserProfile]);


  useEffect(() => {
    loadUser();
  }, [loadUser]);
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (currentUser && currentUser.username) { 
        const today = getTodayDateString();
        if (currentUser.lastResetDate !== today) {
          console.log("UserContext: Interval detected day change. Performing rollover.");
          const updatedProfile = handleDayRollover({ ...currentUser });
          updateUserProfileAndPersist(updatedProfile).catch(e => { 
            console.error("UserContext: Failed to save profile during interval rollover", e);
          });
        }
      }
    }, 60000); 

    return () => clearInterval(intervalId);
  }, [currentUser, handleDayRollover, updateUserProfileAndPersist]);


  const login = async (usernameInput: string) => {
    setLoading(true);
    const username = usernameInput.trim();
    try {
      let userProfileData = await fetchUserProfile(username);

      if (!userProfileData) { 
        console.log(`UserContext: No profile for ${username} on backend, creating new local profile.`);
        userProfileData = {
          username: username, habits: [], caughtPokemon: [], pokeBalls: 0, greatBalls: 0, ultraBalls: 0, masterBalls: 0,
          dailyCompletions: 0, lastResetDate: getTodayDateString(), shinyCaughtPokemonIds: [],
          dailyStreak: 0, lastStreakUpdateDate: "", completionHistory: [], experiencePoints: 0,
        };
      }
      
      let userProfile = initializeProfileFields(userProfileData);
      userProfile = handleDayRollover(userProfile);

      await saveUserProfile(userProfile); 
      
      localStorage.setItem('loggedInUsername', userProfile.username); 
      setCurrentUser(userProfile);
    } catch (error) {
      console.error("UserContext: Error during login:", error);
      setCurrentUser(null); 
      localStorage.removeItem('loggedInUsername'); 
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (currentUser) {
      setLoading(true);
      try {
        const profileBeforeLogout = initializeProfileFields(currentUser);
        const finalProfileToSave = handleDayRollover(profileBeforeLogout);
        await saveUserProfile(finalProfileToSave); 
        console.log("UserContext: User data saved on logout.");
      } catch (error) {
        console.error("UserContext: Error saving user data to backend on logout:", error);
      }
    }
    setCurrentUser(null);
    localStorage.removeItem('loggedInUsername');
    setLoading(false); 
  };

  const addHabit = async (text: string) => {
    if (!currentUser || currentUser.habits.length >= MAX_HABITS) return;
    const newHabit: Habit = { 
      id: generateInstanceId(), text: text.trim(), 
      completedToday: false, rewardClaimedToday: false, pendingRewardConfirmation: false,
      totalCompletions: 0,
    };
    await updateUserProfileAndPersist({ ...currentUser, habits: [...currentUser.habits, newHabit] });
  };

  const toggleHabit = async (habitId: string) => {
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
        if (newDailyCompletions > 0 && newDailyCompletions % 5 === 0) newGreatBalls++;
        if (newDailyCompletions > 0 && newDailyCompletions % 10 === 0) newUltraBalls++;
      }
    } else { 
      habitToToggle.completedToday = false;
      if (habitToToggle.pendingRewardConfirmation) { 
        newDailyCompletions = Math.max(0, newDailyCompletions -1); 
        if (newPokeBalls > 0) newPokeBalls--;
        if (previousDailyCompletionsForTierCheck > 0 && previousDailyCompletionsForTierCheck % 5 === 0 && newGreatBalls > 0) newGreatBalls--;
        if (previousDailyCompletionsForTierCheck > 0 && previousDailyCompletionsForTierCheck % 10 === 0 && newUltraBalls > 0) newUltraBalls--;
        habitToToggle.pendingRewardConfirmation = false; 
      } else if (habitToToggle.rewardClaimedToday) { 
         newDailyCompletions = Math.max(0, newDailyCompletions -1);
      }
    }
  
    updatedHabits[habitIndex] = habitToToggle;
    
    await updateUserProfileAndPersist({
      ...currentUser, 
      habits: updatedHabits, 
      pokeBalls: newPokeBalls, 
      greatBalls: newGreatBalls,
      ultraBalls: newUltraBalls, 
      dailyCompletions: newDailyCompletions,
    });
  };

  const deleteHabit = async (habitId: string) => {
    if (!currentUser) return;
    const habitToDelete = currentUser.habits.find(h => h.id === habitId);
    let newDailyCompletions = currentUser.dailyCompletions;
    let newPokeBalls = currentUser.pokeBalls;
    let newGreatBalls = currentUser.greatBalls;
    let newUltraBalls = currentUser.ultraBalls;

    if (habitToDelete && habitToDelete.pendingRewardConfirmation) {
        newDailyCompletions = Math.max(0, currentUser.dailyCompletions - 1);
        if (newPokeBalls > 0) newPokeBalls--; 
        if (currentUser.dailyCompletions > 0 && currentUser.dailyCompletions % 5 === 0 && newGreatBalls > 0) newGreatBalls--;
        if (currentUser.dailyCompletions > 0 && currentUser.dailyCompletions % 10 === 0 && newUltraBalls > 0) newUltraBalls--;
    }

    const updatedHabits = currentUser.habits.filter(h => h.id !== habitId);
    await updateUserProfileAndPersist({ 
        ...currentUser, 
        habits: updatedHabits,
        dailyCompletions: newDailyCompletions,
        pokeBalls: newPokeBalls,
        greatBalls: newGreatBalls,
        ultraBalls: newUltraBalls,
    });
  };

  const _catchPokemonFromPool = (pool: WeightedPokemonEntry[], ballUsed: BallType): CaughtPokemon | null => {
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
      console.error("UserContext: Invalid Pokemon pool format. Expected WeightedPokemonEntry[]. Pool:", pool);
      return null;
    }
    
    if (randomPokemonId === undefined) {
        console.warn("UserContext: Could not determine a Pokemon from the pool. Defaulting to Magikarp.");
        randomPokemonId = 129; // Magikarp
    }

    const pokemonDetails = POKEMON_MASTER_LIST.find(p => p.id === randomPokemonId);
    if (!pokemonDetails) {
        console.error(`UserContext: Pokemon ID ${randomPokemonId} not found in POKEMON_MASTER_LIST. Defaulting to Bulbasaur.`);
        const fallbackDetails = POKEMON_MASTER_LIST.find(p => p.id === 1); // Bulbasaur
        if (!fallbackDetails) return null; 
         return { ...fallbackDetails, instanceId: generateInstanceId(), caughtDate: new Date().toISOString(), spriteUrl: POKEMON_API_SPRITE_URL(fallbackDetails.id), caughtWithBallType: ballUsed, name: `Erro: ID ${randomPokemonId} Inválido`, isShiny: false };
    }

    const isShiny = Math.random() < SHINY_CHANCE;
    const spriteUrl = isShiny ? POKEMON_API_SHINY_SPRITE_URL(pokemonDetails.id) : POKEMON_API_SPRITE_URL(pokemonDetails.id);

    return {
      ...pokemonDetails, instanceId: generateInstanceId(), caughtDate: new Date().toISOString(),
      spriteUrl: spriteUrl, caughtWithBallType: ballUsed, isShiny: isShiny,
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
      newExperiencePoints += XP_PER_HABIT_COMPLETION;
      habitsCopy[habitToConfirmIndex] = confirmedHabit;
      console.log(`UserContext: Habit "${confirmedHabit.text}" confirmed. XP +${XP_PER_HABIT_COMPLETION}.`);
    }
    return { ...profile, habits: habitsCopy, experiencePoints: newExperiencePoints };
  };

  const catchPokemonAndUpdateProfile = async (
    ballType: BallType, 
    pool: WeightedPokemonEntry[],
    xpFromBall: number
  ): Promise<CaughtPokemon | null> => {
    if (!currentUser) return null;
    
    let ballCountProperty: keyof UserProfile;
    switch (ballType) {
        case 'poke': ballCountProperty = 'pokeBalls'; break;
        case 'great': ballCountProperty = 'greatBalls'; break;
        case 'ultra': ballCountProperty = 'ultraBalls'; break;
        case 'master': ballCountProperty = 'masterBalls'; break;
        default: return null; 
    }

    if ((currentUser[ballCountProperty] as number) <= 0) return null;

    const newPokemon = _catchPokemonFromPool(pool, ballType);
    
    let profileAfterHabitConfirmed = confirmNextPendingReward(currentUser); 
    
    const profileWithBallSpentAndXP: UserProfile = { 
      ...profileAfterHabitConfirmed, 
      [ballCountProperty]: (profileAfterHabitConfirmed[ballCountProperty] as number) - 1,
      experiencePoints: profileAfterHabitConfirmed.experiencePoints + xpFromBall,
    };
    
    const finalProfile = handlePokemonCatchInternal(newPokemon, profileWithBallSpentAndXP);
    await updateUserProfileAndPersist(finalProfile);
    return newPokemon;
  };

  const catchFromPokeBall = (): Promise<CaughtPokemon | null> => catchPokemonAndUpdateProfile('poke', POKEBALL_WEIGHTED_POOL, XP_FROM_POKEBALL);
  const catchFromGreatBall = (): Promise<CaughtPokemon | null> => catchPokemonAndUpdateProfile('great', GREATBALL_WEIGHTED_POOL, XP_FROM_GREATBALL);
  const catchFromUltraBall = (): Promise<CaughtPokemon | null> => catchPokemonAndUpdateProfile('ultra', ULTRABALL_WEIGHTED_POOL, XP_FROM_ULTRABALL);
  const catchFromMasterBall = (): Promise<CaughtPokemon | null> => catchPokemonAndUpdateProfile('master', MASTERBALL_WEIGHTED_POOL, XP_FROM_MASTERBALL);


  const releasePokemon = async (instanceId: string) => {
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
    await updateUserProfileAndPersist({ 
      ...currentUser, caughtPokemon: updatedCaughtPokemon, shinyCaughtPokemonIds: updatedShinyCaughtIds 
    });
  };

  const tradePokemon = async (selectedInstanceIds: string[], tradeId: string): Promise<boolean> => {
    if (!currentUser) return false;
    const tradeOffer = TRADE_OFFERS.find(t => t.id === tradeId);
    if (!tradeOffer) {
      console.error("UserContext: Invalid trade ID:", tradeId);
      return false;
    }

    const pokemonToTrade = currentUser.caughtPokemon.filter(p => selectedInstanceIds.includes(p.instanceId));
    const totalRequiredCount = tradeOffer.inputPokemon.reduce((sum, req) => sum + req.count, 0);
    if (pokemonToTrade.length !== totalRequiredCount) {
      console.error("UserContext: Incorrect total number of Pokemon selected for trade.");
      return false;
    }

    for (const required of tradeOffer.inputPokemon) {
      const countOfThisTypeSelected = pokemonToTrade.filter(p => p.caughtWithBallType === required.ballType).length;
      if (countOfThisTypeSelected !== required.count) {
        console.error(`UserContext: Incorrect count for ${getTranslatedBallName(required.ballType)}.`);
        return false;
      }
    }

    const remainingPokemon = currentUser.caughtPokemon.filter(p => !selectedInstanceIds.includes(p.instanceId));
    let updatedProfile = { ...currentUser, caughtPokemon: remainingPokemon };

    if (tradeOffer.outputBall.type === 'poke') updatedProfile.pokeBalls += tradeOffer.outputBall.count;
    else if (tradeOffer.outputBall.type === 'great') updatedProfile.greatBalls += tradeOffer.outputBall.count;
    else if (tradeOffer.outputBall.type === 'ultra') updatedProfile.ultraBalls += tradeOffer.outputBall.count;
    else if (tradeOffer.outputBall.type === 'master') updatedProfile.masterBalls += tradeOffer.outputBall.count;
    
    await updateUserProfileAndPersist(updatedProfile);
    return true;
  };
  
  return (
    <UserContext.Provider value={{ 
      currentUser, loading, login, logout, addHabit, toggleHabit, deleteHabit,
      catchFromPokeBall, catchFromGreatBall, catchFromUltraBall, catchFromMasterBall,
      releasePokemon, tradePokemon,
      updateUserProfile: updateUserProfileAndPersist, 
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
