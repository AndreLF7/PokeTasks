
export interface Habit {
  id: string;
  text: string;
  completedToday: boolean;
  rewardClaimedToday: boolean; 
  totalCompletions: number; 
}

export interface ProgressionHabit {
  id: string; 
  mainHabitId: string; 
  text: string;
  completedToday: boolean;
  totalCompletions: number;
}

export type PeriodicHabitType = 'weekly' | 'monthly' | 'annual';

export interface PeriodicHabit {
  id: string;
  text: string;
  period: PeriodicHabitType;
  isCompleted: boolean;
  currentPeriodStartDate: string; 
  createdAt: string; 
}

export interface PokemonBase {
  id: number;
  name: string;
}

export type BallType = 'poke' | 'great' | 'ultra' | 'master';

export interface CaughtPokemon extends PokemonBase {
  instanceId: string; 
  caughtDate: string; 
  spriteUrl: string;
  caughtWithBallType: BallType; 
  isShiny: boolean; 
  isActive?: boolean; // Flag to indicate if it's currently an Active Playable Pokemon
}

export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  accuracy: number;
  agility: number;
}

export interface PlayablePokemon {
  instanceId: string; // Links to the CaughtPokemon instanceId
  id: number;
  name: string;
  spriteUrl: string;
  isShiny: boolean;
  stats: PokemonStats;
  activatedAt: string;
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
  lastRewardGrantedDate?: string; 
  lastCompletionResetDate: string; 
  createdAt: string; 
  updatedAt: string; 
}

export interface SharedHabitDisplayInfo {
  id: string;
  partnerUsername: string; 
  habitText: string;
  status: SharedHabitStatus; 
  isCurrentUserCreator: boolean;
}

export interface UserProfile {
  username: string;
  password?: string; 
  habits: Habit[];
  progressionHabits: ProgressionHabit[]; 
  periodicHabits: PeriodicHabit[]; 
  caughtPokemon: CaughtPokemon[];
  activePokemon: PlayablePokemon[]; // New field for Playable Pokemon instances
  pokeBalls: number;
  greatBalls: number;
  ultraBalls: number;
  masterBalls: number; 
  taskCoins: number; 
  dailyCompletions: number;
  lastResetDate: string; 
  shinyCaughtPokemonIds: number[]; 
  
  dailyStreak: number; 
  lastStreakUpdateDate: string; 
  lastStreakDayClaimedForReward: number; 

  fiveHabitStreak: number;
  lastFiveHabitStreakUpdateDate: string;
  lastFiveHabitStreakDayClaimedForReward: number;

  tenHabitStreak: number;
  lastTenHabitStreakUpdateDate: string;
  lastTenHabitStreakDayClaimedForReward: number;
  
  experiencePoints: number; 
  shareHabitsPublicly?: boolean; 
  lastLevelRewardClaimed: number; 
  maxHabitSlots: number; 
  avatarId?: string; 
  boostedHabitId?: string | null; 

  sharedHabitStreaks: Record<string, number>; 
  lastSharedHabitCompletionResetDate: string; 
  captureCounts: Record<number, number>; 
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
  inputPokemon: TradeOfferInput[]; 
  outputBall: {
    type: BallType;
    count: number;
  };
}

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
  gymLeaderId?: string; 
}
