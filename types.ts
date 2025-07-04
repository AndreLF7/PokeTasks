
export interface Habit {
  id: string;
  text: string;
  completedToday: boolean;
  rewardClaimedToday: boolean; // Signifies rewards for this completion have been processed
  totalCompletions: number; // Added to track total times this habit was confirmed
}

export interface ProgressionHabit {
  id: string; // Unique ID for the progression habit
  mainHabitId: string; // ID of the main habit it's linked to
  text: string;
  completedToday: boolean;
  totalCompletions: number;
}

export interface PokemonBase {
  id: number;
  name: string;
}

export type BallType = 'poke' | 'great' | 'ultra' | 'master';

export interface CaughtPokemon extends PokemonBase {
  instanceId: string; // Unique identifier for this specific catch
  caughtDate: string; // ISO string
  spriteUrl: string;
  caughtWithBallType: BallType; // Added to track how the Pokemon was caught
  isShiny: boolean; // Added to track if the Pokemon is shiny
}

export type SharedHabitStatus = 'pending_creator_approval' | 'pending_invitee_approval' | 'active' | 'declined_creator' | 'declined_invitee' | 'cancelled_creator' | 'completed_both_today' | 'archived';

export interface SharedHabit {
  id: string;
  creatorUsername: string;
  inviteeUsername: string;
  habitText: string;
  status: SharedHabitStatus;
  creatorCompletedToday: boolean;
  inviteeCompletedToday: boolean;
  lastRewardGrantedDate?: string; // YYYY-MM-DD, set when joint reward is given for the day
  lastCompletionResetDate: string; // YYYY-MM-DD, when completion flags were last reset
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  // Streaks are stored directly on the UserProfile in a map for simplicity with their partner
}

// Simplified version for displaying invitations or requests in UI lists
export interface SharedHabitDisplayInfo {
  id: string;
  partnerUsername: string; // Either creator or invitee depending on context
  habitText: string;
  status: SharedHabitStatus; // To know if it's pending your action, or waiting for them
  isCurrentUserCreator: boolean;
}


export interface UserProfile {
  username: string;
  password?: string; // Added for password protection
  habits: Habit[];
  progressionHabits: ProgressionHabit[]; // Added for progression habits
  caughtPokemon: CaughtPokemon[];
  pokeBalls: number;
  greatBalls: number;
  ultraBalls: number;
  masterBalls: number; // Added Master Balls
  taskCoins: number; // Added for task coins
  dailyCompletions: number;
  lastResetDate: string; // YYYY-MM-DD (local)
  shinyCaughtPokemonIds: number[]; // Added to track unique shiny species caught
  
  dailyStreak: number; 
  lastStreakUpdateDate: string; 
  lastStreakDayClaimedForReward: number; 

  fiveHabitStreak: number;
  lastFiveHabitStreakUpdateDate: string;
  lastFiveHabitStreakDayClaimedForReward: number;

  tenHabitStreak: number;
  lastTenHabitStreakUpdateDate: string;
  lastTenHabitStreakDayClaimedForReward: number;
  
  completionHistory: { date: string; count: number }[]; // Added for daily completion log
  experiencePoints: number; // Added for player XP
  shareHabitsPublicly?: boolean; // Added for sharing habits preference
  lastLevelRewardClaimed: number; // Tracks the last level for which rewards were claimed
  maxHabitSlots: number; // Tracks the maximum number of habits the user can have
  avatarId?: string; // Added to store the selected avatar ID
  boostedHabitId?: string | null; // Added for habit boost feature

  // Fields for Shared Habits
  sharedHabitStreaks: Record<string, number>; // e.g., { "partnerUsername": 5 }
  lastSharedHabitCompletionResetDate: string; // YYYY-MM-DD, similar to lastResetDate but for shared habit completion flags if managed globally (though individual SharedHabit objects might also track their own reset)
}

export enum SortOption {
  ID_ASC = 'id_asc',
  ID_DESC = 'id_desc',
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
  DATE_ASC = 'date_asc',
  DATE_DESC = 'date_desc',
}

export interface TradeOfferInput {
  ballType: BallType;
  count: number;
}

export interface TradeOffer {
  id:string;
  description: string;
  inputPokemon: TradeOfferInput[]; // Changed to array to support multiple input types
  outputBall: {
    type: BallType;
    count: number;
  };
}

// FIX: Define and export WeightedPokemonEntry interface
export interface WeightedPokemonEntry {
  id: number;
  weight: number;
  nameOverride?: string;
  spriteOverrideUrl?: string;
}

export interface GymLeaderPokemon {
  id: number;
  name: string;
}

export interface GymLeader {
  id: string;
  name: string;
  city: string;
  badgeName: string;
  pokemon: GymLeaderPokemon[];
  imageUrl: string;
  silhouetteUrl: string;
  badgeUrl: string;
}

export interface AvatarOption {
  id: string;
  name: string;
  profileImageUrl: string;
  navbarSpriteUrl: string;
  gymLeaderId?: string; // Optional: Links avatar to a gym leader for unlock conditions
}
