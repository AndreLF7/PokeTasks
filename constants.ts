
import { PokemonBase, TradeOffer, BallType, WeightedPokemonEntry, GymLeader, AvatarOption } from './types';

// FIX: Re-export WeightedPokemonEntry so other modules importing from constants.ts can access it
export type { WeightedPokemonEntry, GymLeader, AvatarOption };

export const INITIAL_MAX_HABIT_SLOTS = 10;
export const POKEMON_API_SPRITE_URL = (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
export const POKEMON_API_SHINY_SPRITE_URL = (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`;
export const POKEMON_API_MINI_SPRITE_URL = (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`; // For smaller sprites

export const SHINY_CHANCE = 0.001; // 0.1% chance

// XP and Level constants
export const XP_PER_HABIT_COMPLETION = 10; // XP for completing a habit (confirmed via ball use)

// XP granted for using a specific ball type
export const XP_FROM_POKEBALL = 5;
export const XP_FROM_GREATBALL = 15;
export const XP_FROM_ULTRABALL = 40;
export const XP_FROM_MASTERBALL = 100; // Master Balls grant significant XP

// Task Coin Rewards
export const TASK_COINS_FROM_POKEBALL = 1;
export const TASK_COINS_FROM_GREATBALL = 5;
export const TASK_COINS_FROM_ULTRABALL = 10;
export const TASK_COINS_FROM_MASTERBALL = 25;


// Total XP required to reach each level. Index + 1 = Level.
export const LEVEL_THRESHOLDS: number[] = [
  0,    // Start (Level 1)
  100,  // XP for Level 2
  300,  // XP for Level 3
  600,  // XP for Level 4
  1000, // XP for Level 5
  1500, // XP for Level 6
  2100, // XP for Level 7
  2800, // XP for Level 8
  3600, // XP for Level 9
  4500, // XP for Level 10
  5500, // XP for Level 11
  6600, // XP for Level 12
  7800, // XP for Level 13
  9100, // XP for Level 14
  10500, // XP for Level 15 (Example, can be extended)
];
export const MAX_PLAYER_LEVEL = LEVEL_THRESHOLDS.length;

// Shared Habit constants
export const MIN_LEVEL_FOR_SHARED_HABITS = 3;
export const MAX_SHARED_HABITS_PER_PARTNER = 1; // Enforced by logic, not just display

// Habit Boost constants
export const MIN_LEVEL_FOR_BOOSTED_HABIT = 2;
export const BOOSTED_HABIT_XP_MULTIPLIER = 2;
export const BOOSTED_HABIT_POKEBALL_REWARD = 2;
export const NORMAL_HABIT_POKEBALL_REWARD = 1;

// Habit Progression constants
export const MIN_LEVEL_FOR_PROGRESSION_L1 = 5;
export const PROGRESSION_SLOTS_L1 = 5;
export const MIN_LEVEL_FOR_PROGRESSION_L2 = 10;
export const PROGRESSION_SLOTS_L2 = 10;

// Periodic Habit constants
export const MIN_LEVEL_FOR_PERIODIC_HABITS = 7;
export const MAX_PERIODIC_HABITS_PER_TYPE = 2;
export const XP_REWARD_WEEKLY_HABIT = 50;
export const TASK_COINS_REWARD_WEEKLY_HABIT = 10;
export const XP_REWARD_MONTHLY_HABIT = 150;
export const TASK_COINS_REWARD_MONTHLY_HABIT = 25;
export const XP_REWARD_ANNUAL_HABIT = 500;
export const TASK_COINS_REWARD_ANNUAL_HABIT = 100;


// Special Pikachu (1st gen) constants
export const PIKACHU_1ST_GEN_NAME = "Pikachu (1st gen)";
export const PIKACHU_1ST_GEN_SPRITE_URL = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/transparent/25.png";


// Helper function for translated ball names
export const getTranslatedBallName = (type: BallType | null, plural: boolean = false): string => {
  if (!type) return '';
  switch (type) {
    case 'poke':
      return plural ? 'Poké Balls' : 'Poké Ball';
    case 'great':
      return 'Great Ball' + (plural ? 's' : ''); // Commonly kept in English
    case 'ultra':
      return 'Ultra Ball' + (plural ? 's' : ''); // Commonly kept in English
    case 'master':
      return 'Master Ball' + (plural ? 's' : ''); // Commonly kept in English
    default:
      // Should not happen with exhaustive BallType
      const exhaustiveCheck: never = type;
      return exhaustiveCheck;
  }
};


// Weighted pool for Poké Balls
export const POKEBALL_WEIGHTED_POOL: WeightedPokemonEntry[] = [
  { id: 1, weight: 5 },    // Bulbasaur
  { id: 4, weight: 5 },    // Charmander
  { id: 7, weight: 5 },    // Squirtle
  { id: 10, weight: 15 },  // Caterpie
  { id: 13, weight: 15 },  // Weedle
  { id: 16, weight: 15 },  // Pidgey
  { id: 19, weight: 15 },  // Rattata
  { id: 21, weight: 10 },  // Spearow
  { id: 23, weight: 10 },  // Ekans
  { id: 25, weight: 5 }, // Pikachu (Regular) - Weight changed back to 5
  // Removed: Pikachu (1st gen) direct entry
  { id: 27, weight: 10 },  // Sandshrew
  { id: 29, weight: 10 },  // Nidoran♀
  { id: 32, weight: 10 },  // Nidoran♂
  { id: 35, weight: 10 },  // Clefairy
  { id: 37, weight: 10 },  // Vulpix
  { id: 39, weight: 10 },  // Jigglypuff
  { id: 41, weight: 10 },  // Zubat
  { id: 43, weight: 10 },  // Oddish
  { id: 46, weight: 10 },  // Paras
  { id: 48, weight: 10 },  // Venonat
  { id: 50, weight: 10 },  // Diglett
  { id: 52, weight: 10 },  // Meowth
  { id: 54, weight: 10 },  // Psyduck
  { id: 56, weight: 10 },  // Mankey
  { id: 58, weight: 10 },  // Growlithe
  { id: 60, weight: 10 },  // Poliwag
  { id: 63, weight: 10 },  // Abra
  { id: 66, weight: 10 },  // Machop
  { id: 69, weight: 10 },  // Bellsprout
  { id: 72, weight: 10 },  // Tentacool
  { id: 74, weight: 10 },  // Geodude
  { id: 77, weight: 10 },  // Ponyta
  { id: 79, weight: 10 },  // Slowpoke
  { id: 81, weight: 10 },  // Magnemite
  { id: 84, weight: 10 },  // Doduo
  { id: 86, weight: 10 },  // Seel
  { id: 88, weight: 10 },  // Grimer
  { id: 90, weight: 10 },  // Shellder
  { id: 92, weight: 10 },  // Gastly
  { id: 96, weight: 10 },  // Drowzee
  { id: 98, weight: 10 },  // Krabby
  { id: 100, weight: 10 }, // Voltorb
  { id: 102, weight: 10 }, // Exeggcute
  { id: 104, weight: 10 }, // Cubone
  { id: 109, weight: 10 }, // Koffing
  { id: 111, weight: 10 }, // Rhyhorn
  { id: 116, weight: 10 }, // Horsea
  { id: 118, weight: 10 }, // Goldeen
  { id: 120, weight: 10 }, // Staryu
  { id: 129, weight: 20 }, // Magikarp
  { id: 133, weight: 5 },  // Eevee
  { id: 140, weight: 2 },  // Kabuto
  { id: 138, weight: 2 },  // Omanyte
  { id: 147, weight: 1 },  // Dratini

  // Added Evolved Pokémon with low weights
  { id: 5, weight: 0.5 },    // Charmeleon
  { id: 8, weight: 0.5 },    // Wartortle
  { id: 2, weight: 0.5 },    // Ivysaur
  { id: 26, weight: 0.1 },   // Raichu
  { id: 38, weight: 0.1 },   // Ninetales
  { id: 59, weight: 0.1 },   // Arcanine
  { id: 11, weight: 0.1 },   // Metapod
  { id: 14, weight: 0.1 },   // Kakuna
  { id: 17, weight: 0.1 },   // Pidgeotto
  { id: 20, weight: 0.1 },   // Raticate
  { id: 22, weight: 0.1 },   // Fearow
  { id: 24, weight: 0.1 },   // Arbok
  { id: 30, weight: 0.1 },   // Nidorina
  { id: 33, weight: 0.1 },   // Nidorino
  { id: 36, weight: 0.1 },   // Clefable
  { id: 40, weight: 0.1 },   // Wigglytuff
  { id: 61, weight: 0.1 },   // Poliwhirl
  { id: 64, weight: 0.1 },   // Kadabra
  { id: 67, weight: 0.1 },   // Machoke
  { id: 70, weight: 0.1 },   // Weepinbell
  { id: 75, weight: 0.1 },   // Graveler
];

export const GREATBALL_WEIGHTED_POOL: WeightedPokemonEntry[] = [
  { id: 5, weight: 5 },    // Charmeleon
  { id: 8, weight: 5 },    // Wartortle
  { id: 2, weight: 5 },    // Ivysaur
  { id: 141, weight: 5 },  // Kabutops
  { id: 139, weight: 5 },  // Omastar
  { id: 26, weight: 5 },   // Raichu
  { id: 38, weight: 5 },   // Ninetales
  { id: 59, weight: 5 },   // Arcanine
  { id: 134, weight: 5 },  // Vaporeon
  { id: 136, weight: 5 },  // Flareon
  { id: 135, weight: 5 },  // Jolteon
  { id: 148, weight: 1 },  // Dragonair
  { id: 126, weight: 5 },  // Magmar
  { id: 124, weight: 5 },  // Jynx
  { id: 123, weight: 5 },  // Scyther
  { id: 127, weight: 5 },  // Pinsir
  { id: 114, weight: 5 },  // Tangela
  { id: 115, weight: 5 },  // Kangaskhan
  { id: 11, weight: 25 },  // Metapod
  { id: 14, weight: 25 },  // Kakuna
  { id: 17, weight: 20 },  // Pidgeotto
  { id: 20, weight: 20 },  // Raticate
  { id: 22, weight: 20 },  // Fearow
  { id: 24, weight: 10 },  // Arbok
  { id: 28, weight: 10 },  // Sandslash
  { id: 30, weight: 20 },  // Nidorina
  { id: 33, weight: 20 },  // Nidorino
  { id: 36, weight: 10 },  // Clefable
  { id: 40, weight: 10 },  // Wigglytuff
  { id: 42, weight: 10 },  // Golbat
  { id: 44, weight: 10 },  // Gloom
  { id: 49, weight: 10 },  // Venomoth
  { id: 47, weight: 10 },  // Parasect
  { id: 51, weight: 10 },  // Dugtrio
  { id: 53, weight: 10 },  // Persian
  { id: 55, weight: 10 },  // Golduck
  { id: 57, weight: 10 },  // Primeape
  { id: 61, weight: 20 },  // Poliwhirl
  { id: 64, weight: 20 },  // Kadabra
  { id: 67, weight: 20 },  // Machoke
  { id: 70, weight: 20 },  // Weepinbell
  { id: 73, weight: 10 },  // Tentacruel
  { id: 75, weight: 20 },  // Graveler
  { id: 78, weight: 10 },  // Rapidash
  { id: 80, weight: 10 },  // Slowbro
  { id: 82, weight: 10 },  // Magneton
  { id: 83, weight: 10 },  // Farfetch'd
  { id: 85, weight: 10 },  // Dodrio
  { id: 87, weight: 10 },  // Dewgong
  { id: 89, weight: 10 },  // Muk
  { id: 91, weight: 10 },  // Cloyster
  { id: 93, weight: 20 },  // Haunter
  { id: 95, weight: 10 },  // Onix
  { id: 97, weight: 10 },  // Hypno
  { id: 99, weight: 10 },  // Kingler
  { id: 101, weight: 10 }, // Electrode
  { id: 103, weight: 10 }, // Exeggutor
  { id: 105, weight: 10 }, // Marowak
  { id: 106, weight: 10 }, // Hitmonlee
  { id: 107, weight: 10 }, // Hitmonchan
  { id: 108, weight: 10 }, // Lickitung
  { id: 110, weight: 10 }, // Weezing
  { id: 112, weight: 10 }, // Rhydon
  { id: 113, weight: 10 }, // Chansey
  { id: 117, weight: 10 }, // Seadra
  { id: 119, weight: 10 }, // Seaking
  { id: 121, weight: 10 }, // Starmie
  { id: 122, weight: 10 }, // Mr. Mime
  { id: 128, weight: 10 }, // Tauros
  { id: 131, weight: 10 }, // Lapras
  { id: 137, weight: 10 }, // Porygon
  { id: 142, weight: 5 },  // Aerodactyl
  { id: 143, weight: 5 },  // Snorlax
  { id: 125, weight: 10 }, // Electabuzz
  { id: 132, weight: 10 }, // Ditto

  // Added new Evolved Pokémon to Great Ball pool
  { id: 6, weight: 0.1 },    // Charizard
  { id: 3, weight: 0.1 },    // Venusaur
  { id: 9, weight: 0.1 },    // Blastoise
  { id: 15, weight: 0.5 },   // Beedrill
  { id: 12, weight: 0.5 },   // Butterfree
  { id: 18, weight: 0.5 },   // Pidgeot
  { id: 34, weight: 0.1 },   // Nidoking
  { id: 31, weight: 0.1 },   // Nidoqueen
  { id: 45, weight: 0.1 },   // Vileplume
  { id: 65, weight: 0.1 },   // Alakazam
  { id: 68, weight: 0.1 },   // Machamp
  { id: 94, weight: 0.1 },   // Gengar
  { id: 76, weight: 0.1 },   // Golem
  { id: 149, weight: 0.01 }, // Dragonite
  { id: 130, weight: 0.01 }, // Gyarados
  { id: 62, weight: 0.1 },   // Poliwrath
  { id: 71, weight: 0.1 },   // Victreebel
];

export const ULTRABALL_WEIGHTED_POOL: WeightedPokemonEntry[] = [
  { id: 6, weight: 5 },   // Charizard
  { id: 3, weight: 5 },   // Venusaur
  { id: 9, weight: 5 },   // Blastoise
  { id: 15, weight: 20 }, // Beedrill
  { id: 12, weight: 20 }, // Butterfree
  { id: 18, weight: 20 }, // Pidgeot
  { id: 34, weight: 15 }, // Nidoking
  { id: 31, weight: 15 }, // Nidoqueen
  { id: 45, weight: 10 }, // Vileplume
  { id: 65, weight: 10 }, // Alakazam
  { id: 68, weight: 10 }, // Machamp
  { id: 94, weight: 10 }, // Gengar
  { id: 76, weight: 10 }, // Golem
  { id: 149, weight: 1 }, // Dragonite
  { id: 130, weight: 3 }, // Gyarados
  { id: 62, weight: 10 },  // Poliwrath
  { id: 71, weight: 10 },  // Victreebel
];

export const MASTERBALL_WEIGHTED_POOL: WeightedPokemonEntry[] = [
  { id: 151, weight: 1 }, // Mew
  { id: 150, weight: 1 }, // Mewtwo
  { id: 146, weight: 5 }, // Moltres
  { id: 145, weight: 5 }, // Zapdos
  { id: 144, weight: 5 }, // Articuno
];

export const TRADE_OFFERS: TradeOffer[] = [
  {
    id: 'poke5_for_poke1',
    description: `5 Pokémon (${getTranslatedBallName('poke')}) por 1 ${getTranslatedBallName('poke')}`,
    inputPokemon: [{ ballType: 'poke', count: 5 }],
    outputBall: { type: 'poke', count: 1 },
  },
  {
    id: 'poke10_for_great1',
    description: `10 Pokémon (${getTranslatedBallName('poke')}) por 1 ${getTranslatedBallName('great')}`,
    inputPokemon: [{ ballType: 'poke', count: 10 }],
    outputBall: { type: 'great', count: 1 },
  },
  {
    id: 'great5_for_great1',
    description: `5 Pokémon (${getTranslatedBallName('great')}) por 1 ${getTranslatedBallName('great')}`,
    inputPokemon: [{ ballType: 'great', count: 5 }],
    outputBall: { type: 'great', count: 1 },
  },
  {
    id: 'great10_for_ultra1',
    description: `10 Pokémon (${getTranslatedBallName('great')}) por 1 ${getTranslatedBallName('ultra')}`,
    inputPokemon: [{ ballType: 'great', count: 10 }],
    outputBall: { type: 'ultra', count: 1 },
  },
  {
    id: 'ultra5_for_ultra1',
    description: `5 Pokémon (${getTranslatedBallName('ultra')}) por 1 ${getTranslatedBallName('ultra')}`,
    inputPokemon: [{ ballType: 'ultra', count: 5 }],
    outputBall: { type: 'ultra', count: 1 },
  },
  {
    id: 'multi_for_master1',
    description: `Troque Pokémon específicos por 1 ${getTranslatedBallName('master')}`,
    inputPokemon: [
      { ballType: 'poke', count: 25 },
      { ballType: 'great', count: 15 },
      { ballType: 'ultra', count: 10 },
    ],
    outputBall: { type: 'master', count: 1 },
  },
];


// POKEMON_MASTER_LIST includes all Pokémon from Gen 1 for the Pokedex
export const POKEMON_MASTER_LIST: PokemonBase[] = [
  { id: 1, name: 'Bulbasaur' }, { id: 2, name: 'Ivysaur' }, { id: 3, name: 'Venusaur' },
  { id: 4, name: 'Charmander' }, { id: 5, name: 'Charmeleon' }, { id: 6, name: 'Charizard' },
  { id: 7, name: 'Squirtle' }, { id: 8, name: 'Wartortle' }, { id: 9, name: 'Blastoise' },
  { id: 10, name: 'Caterpie' }, { id: 11, name: 'Metapod' }, { id: 12, name: 'Butterfree' },
  { id: 13, name: 'Weedle' }, { id: 14, name: 'Kakuna' }, { id: 15, name: 'Beedrill' },
  { id: 16, name: 'Pidgey' }, { id: 17, name: 'Pidgeotto' }, { id: 18, name: 'Pidgeot' },
  { id: 19, name: 'Rattata' }, { id: 20, name: 'Raticate' }, { id: 21, name: 'Spearow' },
  { id: 22, name: 'Fearow' }, { id: 23, name: 'Ekans' }, { id: 24, name: 'Arbok' },
  { id: 25, name: 'Pikachu' }, { id: 26, name: 'Raichu' }, { id: 27, name: 'Sandshrew' },
  { id: 28, name: 'Sandslash' }, { id: 29, name: 'Nidoran♀' }, { id: 30, name: 'Nidorina' },
  { id: 31, name: 'Nidoqueen' }, { id: 32, name: 'Nidoran♂' }, { id: 33, name: 'Nidorino' },
  { id: 34, name: 'Nidoking' }, { id: 35, name: 'Clefairy' }, { id: 36, name: 'Clefable' },
  { id: 37, name: 'Vulpix' }, { id: 38, name: 'Ninetales' }, { id: 39, name: 'Jigglypuff' },
  { id: 40, name: 'Wigglytuff' }, { id: 41, name: 'Zubat' }, { id: 42, name: 'Golbat' },
  { id: 43, name: 'Oddish' }, { id: 44, name: 'Gloom' }, { id: 45, name: 'Vileplume' },
  { id: 46, name: 'Paras' }, { id: 47, name: 'Parasect' }, { id: 48, name: 'Venonat' },
  { id: 49, name: 'Venomoth' }, { id: 50, name: 'Diglett' }, { id: 51, name: 'Dugtrio' },
  { id: 52, name: 'Meowth' }, { id: 53, name: 'Persian' }, { id: 54, name: 'Psyduck' },
  { id: 55, name: 'Golduck' }, { id: 56, name: 'Mankey' }, { id: 57, name: 'Primeape' },
  { id: 58, name: 'Growlithe' }, { id: 59, name: 'Arcanine' }, { id: 60, name: 'Poliwag' },
  { id: 61, name: 'Poliwhirl' }, { id: 62, name: 'Poliwrath' }, { id: 63, name: 'Abra' },
  { id: 64, name: 'Kadabra' }, { id: 65, name: 'Alakazam' }, { id: 66, name: 'Machop' },
  { id: 67, name: 'Machoke' }, { id: 68, name: 'Machamp' }, { id: 69, name: 'Bellsprout' },
  { id: 70, name: 'Weepinbell' }, { id: 71, name: 'Victreebel' }, { id: 72, name: 'Tentacool' },
  { id: 73, name: 'Tentacruel' }, { id: 74, name: 'Geodude' }, { id: 75, name: 'Graveler' },
  { id: 76, name: 'Golem' }, { id: 77, name: 'Ponyta' }, { id: 78, name: 'Rapidash' },
  { id: 79, name: 'Slowpoke' }, { id: 80, name: 'Slowbro' }, { id: 81, name: 'Magnemite' },
  { id: 82, name: 'Magneton' }, { id: 83, name: 'Farfetch\'d' }, { id: 84, name: 'Doduo' },
  { id: 85, name: 'Dodrio' }, { id: 86, name: 'Seel' }, { id: 87, name: 'Dewgong' },
  { id: 88, name: 'Grimer' }, { id: 89, name: 'Muk' }, { id: 90, name: 'Shellder' },
  { id: 91, name: 'Cloyster' }, { id: 92, name: 'Gastly' }, { id: 93, name: 'Haunter' },
  { id: 94, name: 'Gengar' }, { id: 95, name: 'Onix' }, { id: 96, name: 'Drowzee' },
  { id: 97, name: 'Hypno' }, { id: 98, name: 'Krabby' }, { id: 99, name: 'Kingler' },
  { id: 100, name: 'Voltorb' }, { id: 101, name: 'Electrode' }, { id: 102, name: 'Exeggcute' },
  { id: 103, name: 'Exeggutor' }, { id: 104, name: 'Cubone' }, { id: 105, name: 'Marowak' },
  { id: 106, name: 'Hitmonlee' }, { id: 107, name: 'Hitmonchan' }, { id: 108, name: 'Lickitung' },
  { id: 109, name: 'Koffing' }, { id: 110, name: 'Weezing' }, { id: 111, name: 'Rhyhorn' },
  { id: 112, name: 'Rhydon' }, { id: 113, name: 'Chansey' }, { id: 114, name: 'Tangela' },
  { id: 115, name: 'Kangaskhan' }, { id: 116, name: 'Horsea' }, { id: 117, name: 'Seadra' },
  { id: 118, name: 'Goldeen' }, { id: 119, name: 'Seaking' }, { id: 120, name: 'Staryu' },
  { id: 121, name: 'Starmie' }, { id: 122, name: 'Mr. Mime' }, { id: 123, name: 'Scyther' },
  { id: 124, name: 'Jynx' }, { id: 125, name: 'Electabuzz' }, { id: 126, name: 'Magmar' },
  { id: 127, name: 'Pinsir' }, { id: 128, name: 'Tauros' }, { id: 129, name: 'Magikarp' },
  { id: 130, name: 'Gyarados' }, { id: 131, name: 'Lapras' }, { id: 132, name: 'Ditto' },
  { id: 133, name: 'Eevee' }, { id: 134, name: 'Vaporeon' }, { id: 135, name: 'Jolteon' },
  { id: 136, name: 'Flareon' }, { id: 137, name: 'Porygon' }, { id: 138, name: 'Omanyte' },
  { id: 139, name: 'Omastar' }, { id: 140, name: 'Kabuto' }, { id: 141, name: 'Kabutops' },
  { id: 142, name: 'Aerodactyl' }, { id: 143, name: 'Snorlax' }, { id: 144, name: 'Articuno' },
  { id: 145, name: 'Zapdos' }, { id: 146, name: 'Moltres' }, { id: 147, name: 'Dratini' },
  { id: 148, name: 'Dragonair' }, { id: 149, name: 'Dragonite' }, { id: 150, name: 'Mewtwo' },
  { id: 151, name: 'Mew' }
];

const BROCK_IMG = 'https://play.pokemonshowdown.com/sprites/trainers/brock.png';
const MISTY_IMG = 'https://play.pokemonshowdown.com/sprites/trainers/misty.png';
const LTSURGE_IMG = 'https://play.pokemonshowdown.com/sprites/trainers/ltsurge.png';
const ERIKA_IMG = 'https://play.pokemonshowdown.com/sprites/trainers/erika.png';
const KOGA_IMG = 'https://play.pokemonshowdown.com/sprites/trainers/koga.png';
const SABRINA_IMG = 'https://play.pokemonshowdown.com/sprites/trainers/sabrina.png';
const BLAINE_IMG = 'https://play.pokemonshowdown.com/sprites/trainers/blaine.png';
const GIOVANNI_IMG = 'https://play.pokemonshowdown.com/sprites/trainers/giovanni.png';

const BOULDER_BADGE = 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/badge/boulder.png';
const CASCADE_BADGE = 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/badge/cascade.png';
const THUNDER_BADGE = 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/badge/thunder.png';
const RAINBOW_BADGE = 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/badge/rainbow.png';
const SOUL_BADGE = 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/badge/soul.png';
const MARSH_BADGE = 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/badge/marsh.png';
const VOLCANO_BADGE = 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/badge/volcano.png';
const EARTH_BADGE = 'https://raw.githubusercontent.com/msikma/pokesprite/master/items/badge/earth.png';


export const GYM_LEADERS: GymLeader[] = [
  {
    id: 'brock',
    name: 'Brock',
    city: 'Pewter City',
    badgeName: 'Boulder Badge',
    pokemon: [ { id: 74, name: 'Geodude' }, { id: 95, name: 'Onix' } ],
    imageUrl: BROCK_IMG,
    silhouetteUrl: BROCK_IMG, 
    badgeUrl: BOULDER_BADGE
  },
  {
    id: 'misty',
    name: 'Misty',
    city: 'Cerulean City',
    badgeName: 'Cascade Badge',
    pokemon: [ { id: 120, name: 'Staryu' }, { id: 121, name: 'Starmie' } ],
    imageUrl: MISTY_IMG,
    silhouetteUrl: MISTY_IMG,
    badgeUrl: CASCADE_BADGE
  },
  {
    id: 'lt_surge',
    name: 'Lt. Surge',
    city: 'Vermilion City',
    badgeName: 'Thunder Badge',
    pokemon: [ { id: 100, name: 'Voltorb' }, { id: 25, name: 'Pikachu' }, { id: 26, name: 'Raichu' } ],
    imageUrl: LTSURGE_IMG,
    silhouetteUrl: LTSURGE_IMG,
    badgeUrl: THUNDER_BADGE
  },
  {
    id: 'erika',
    name: 'Erika',
    city: 'Celadon City',
    badgeName: 'Rainbow Badge',
    pokemon: [ { id: 71, name: 'Victreebel' }, { id: 114, name: 'Tangela' }, { id: 45, name: 'Vileplume' } ],
    imageUrl: ERIKA_IMG,
    silhouetteUrl: ERIKA_IMG,
    badgeUrl: RAINBOW_BADGE
  },
  {
    id: 'koga',
    name: 'Koga',
    city: 'Fuchsia City',
    badgeName: 'Soul Badge',
    pokemon: [ { id: 109, name: 'Koffing' }, { id: 89, name: 'Muk' }, { id: 110, name: 'Weezing' } ],
    imageUrl: KOGA_IMG,
    silhouetteUrl: KOGA_IMG,
    badgeUrl: SOUL_BADGE
  },
  {
    id: 'sabrina',
    name: 'Sabrina',
    city: 'Saffron City',
    badgeName: 'Marsh Badge',
    pokemon: [ { id: 64, name: 'Kadabra' }, { id: 122, name: 'Mr. Mime' }, { id: 49, name: 'Venomoth' }, { id: 65, name: 'Alakazam' } ],
    imageUrl: SABRINA_IMG,
    silhouetteUrl: SABRINA_IMG,
    badgeUrl: MARSH_BADGE
  },
  {
    id: 'blaine',
    name: 'Blaine',
    city: 'Cinnabar Island',
    badgeName: 'Volcano Badge',
    pokemon: [ { id: 58, name: 'Growlithe' }, { id: 77, name: 'Ponyta' }, { id: 78, name: 'Rapidash' }, { id: 59, name: 'Arcanine' } ],
    imageUrl: BLAINE_IMG,
    silhouetteUrl: BLAINE_IMG,
    badgeUrl: VOLCANO_BADGE
  },
  {
    id: 'giovanni',
    name: 'Giovanni',
    city: 'Viridian City',
    badgeName: 'Earth Badge',
    pokemon: [ { id: 111, name: 'Rhyhorn' }, { id: 51, name: 'Dugtrio' }, { id: 31, name: 'Nidoqueen' }, { id: 34, name: 'Nidoking' }, { id: 112, name: 'Rhydon' } ],
    imageUrl: GIOVANNI_IMG,
    silhouetteUrl: GIOVANNI_IMG,
    badgeUrl: EARTH_BADGE
  }
];

export const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: 'red',
    name: 'Red',
    profileImageUrl: 'https://archives.bulbagarden.net/media/upload/8/83/FireRed_LeafGreen_Red.png',
    navbarSpriteUrl: 'https://archives.bulbagarden.net/media/upload/2/2c/VSRed_Masters.png',
  },
  {
    id: 'leaf',
    name: 'Leaf',
    profileImageUrl: 'https://archives.bulbagarden.net/media/upload/4/48/FireRed_LeafGreen_Leaf.png',
    navbarSpriteUrl: 'https://archives.bulbagarden.net/media/upload/6/65/VSLeaf_Masters.png',
  },
  {
    id: 'brock_avatar',
    name: 'Brock',
    profileImageUrl: 'https://archives.bulbagarden.net/media/upload/a/a6/Lets_Go_Pikachu_Eevee_Brock.png',
    navbarSpriteUrl: 'https://archives.bulbagarden.net/media/upload/7/75/VSBrock_Masters.png',
    gymLeaderId: 'brock',
  },
  {
    id: 'misty_avatar',
    name: 'Misty',
    profileImageUrl: 'https://archives.bulbagarden.net/media/upload/f/f6/Lets_Go_Pikachu_Eevee_Misty.png',
    navbarSpriteUrl: 'https://archives.bulbagarden.net/media/upload/0/05/VSMisty_Swimsuit_Masters.png',
    gymLeaderId: 'misty',
  },
  {
    id: 'lt_surge_avatar',
    name: 'Lt. Surge',
    profileImageUrl: 'https://archives.bulbagarden.net/media/upload/thumb/b/bc/Lets_Go_Pikachu_Eevee_Lt_Surge.png/739px-Lets_Go_Pikachu_Eevee_Lt_Surge.png',
    navbarSpriteUrl: 'https://archives.bulbagarden.net/media/upload/5/58/VSLt_Surge_Masters.png',
    gymLeaderId: 'lt_surge',
  },
  {
    id: 'erika_avatar',
    name: 'Erika',
    profileImageUrl: 'https://archives.bulbagarden.net/media/upload/4/47/Lets_Go_Pikachu_Eevee_Erika.png',
    navbarSpriteUrl: 'https://archives.bulbagarden.net/media/upload/8/86/VSErika_Palentines_2025_Masters.png',
    gymLeaderId: 'erika',
  },
  {
    id: 'koga_avatar',
    name: 'Koga',
    profileImageUrl: 'https://archives.bulbagarden.net/media/upload/f/f4/Lets_Go_Pikachu_Eevee_Koga.png',
    navbarSpriteUrl: 'https://archives.bulbagarden.net/media/upload/a/ad/VSKoga_Masters.png',
    gymLeaderId: 'koga',
  },
  {
    id: 'sabrina_avatar',
    name: 'Sabrina',
    profileImageUrl: 'https://archives.bulbagarden.net/media/upload/7/78/Lets_Go_Pikachu_Eevee_Sabrina.png',
    navbarSpriteUrl: 'https://archives.bulbagarden.net/media/upload/4/49/VSSabrina_Masters.png',
    gymLeaderId: 'sabrina',
  },
  {
    id: 'blaine_avatar',
    name: 'Blaine',
    profileImageUrl: 'https://archives.bulbagarden.net/media/upload/c/c8/Lets_Go_Pikachu_Eevee_Blaine.png',
    navbarSpriteUrl: 'https://archives.bulbagarden.net/media/upload/7/76/VSBlaine_Masters.png',
    gymLeaderId: 'blaine',
  },
  {
    id: 'giovanni_avatar',
    name: 'Giovanni',
    profileImageUrl: 'https://archives.bulbagarden.net/media/upload/0/03/USUM_Giovanni.png',
    navbarSpriteUrl: 'https://archives.bulbagarden.net/media/upload/c/cc/VSGiovanni_Classic_Masters.png',
    gymLeaderId: 'giovanni',
  },
];

export const DEFAULT_AVATAR_ID = 'red';
