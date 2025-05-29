
export interface Habit {
  id: string;
  text: string;
  completedToday: boolean;
  rewardClaimedToday: boolean; // Signifies rewards for this completion have been processed
  totalCompletions: number; // Added to track total times this habit was confirmed
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

export interface UserProfile {
  username: string;
  habits: Habit[];
  caughtPokemon: CaughtPokemon[];
  pokeBalls: number;
  greatBalls: number;
  ultraBalls: number;
  masterBalls: number; // Added Master Balls
  dailyCompletions: number;
  lastResetDate: string; // YYYY-MM-DD (local)
  shinyCaughtPokemonIds: number[]; // Added to track unique shiny species caught
  dailyStreak: number; // Added for habit streak
  lastStreakUpdateDate: string; // Added for habit streak (YYYY-MM-DD local)
  completionHistory: { date: string; count: number }[]; // Added for daily completion log
  experiencePoints: number; // Added for player XP
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
}