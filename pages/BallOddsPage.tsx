
import React from 'react';
import { Link } from 'react-router-dom';
import {
  POKEBALL_WEIGHTED_POOL,
  GREATBALL_WEIGHTED_POOL, // Changed from GREATBALL_POOL_IDS
  ULTRABALL_WEIGHTED_POOL,
  MASTERBALL_WEIGHTED_POOL, 
  POKEMON_MASTER_LIST,
  POKEMON_API_SPRITE_URL,
  WeightedPokemonEntry,
  getTranslatedBallName
} from '../constants';
import { PokemonBase, BallType } from '../types'; 
import { BallIcon } from './HabitsPage'; 

interface PokemonWithChance extends PokemonBase {
  spriteUrl: string;
  chance?: number; 
}

const getPokemonDetails = (id: number): PokemonBase | undefined => {
  return POKEMON_MASTER_LIST.find(p => p.id === id);
};

const BallOddsPage: React.FC = () => {
  const calculateChances = (pool: WeightedPokemonEntry[]): PokemonWithChance[] => {
    const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
    if (totalWeight === 0) {
        return pool.map(entry => {
            const details = getPokemonDetails(entry.id);
            return {
                id: entry.id,
                name: details?.name || `ID Desconhecido: ${entry.id}`,
                spriteUrl: POKEMON_API_SPRITE_URL(entry.id),
                chance: undefined
            };
        });
    }
    return pool.map(entry => {
      const details = getPokemonDetails(entry.id);
      return {
        id: entry.id,
        name: details?.name || `ID Desconhecido: ${entry.id}`,
        spriteUrl: POKEMON_API_SPRITE_URL(entry.id),
        chance: (entry.weight / totalWeight) * 100,
      };
    }).sort((a,b) => (b.chance ?? 0) - (a.chance ?? 0) || a.id - b.id); 
  };

  const pokeBallPokemon = calculateChances(POKEBALL_WEIGHTED_POOL);
  const greatBallPokemon = calculateChances(GREATBALL_WEIGHTED_POOL); // Use calculateChances for Great Ball
  const ultraBallPokemon = calculateChances(ULTRABALL_WEIGHTED_POOL);
  const masterBallPokemon = calculateChances(MASTERBALL_WEIGHTED_POOL);

  const PokemonDisplayCard: React.FC<{ pokemon: PokemonWithChance }> = ({ pokemon }) => (
    <div className="bg-slate-800 rounded-lg shadow-md p-3 flex flex-col items-center text-center">
      <img src={pokemon.spriteUrl} alt={pokemon.name} className="w-20 h-20 object-contain mb-2" loading="lazy"/>
      <p className="text-sm font-semibold text-yellow-300 capitalize">{pokemon.name}</p>
      <p className="text-xs text-slate-400">#{String(pokemon.id).padStart(3, '0')}</p>
      {pokemon.chance !== undefined && (
        <p className="text-xs text-slate-300 mt-1">{pokemon.chance.toFixed(2)}%</p>
      )}
    </div>
  );
  
  const SectionDisplay: React.FC<{title: string, ballType: BallType, description: string, subDescription: string, pokemonList: PokemonWithChance[]}> = 
    ({title, ballType, description, subDescription, pokemonList}) => (
    <section className={`p-6 ${ballType === 'master' ? 'bg-purple-900 bg-opacity-30 border-2 border-purple-500' : 'bg-slate-800'} rounded-xl shadow-lg`}>
        <div className="flex items-center mb-4">
            <BallIcon type={ballType} isButton={false} />
            <h2 className={`text-3xl font-semibold ml-3 ${ballType === 'master' ? 'text-purple-400' : 'text-yellow-400'}`}>{title}</h2>
        </div>
        <p className="text-slate-300 mb-1">{description}</p>
        <p className="text-slate-400 mb-6 text-sm">{subDescription}</p>
        {pokemonList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {pokemonList.map(p => <PokemonDisplayCard key={`${ballType}-${p.id}`} pokemon={p} />)}
            </div>
        ): (
            <p className="text-slate-500">Nenhum Pokémon definido para este tipo de bola.</p>
        )}
    </section>
  );


  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-yellow-400">Chances das Bolas & Grupos de Pokémon</h1>
        <Link
          to="/"
          className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          &larr; Voltar para Hábitos
        </Link>
      </div>

      <SectionDisplay
        title={`Grupo da ${getTranslatedBallName('poke')}`}
        ballType="poke"
        description="Concedida pela maioria das conclusões de hábitos diários."
        subDescription="Cada Pokémon tem uma chance baseada em seu peso atribuído."
        pokemonList={pokeBallPokemon}
      />
      
      <SectionDisplay
        title={`Grupo da ${getTranslatedBallName('great')}`}
        ballType="great"
        description="Concedida a cada 5ª conclusão de hábito diário."
        subDescription="Cada Pokémon neste grupo tem uma chance baseada em seu peso atribuído."
        pokemonList={greatBallPokemon}
      />

      <SectionDisplay
        title={`Grupo da ${getTranslatedBallName('ultra')}`}
        ballType="ultra"
        description="Concedida a cada 10ª conclusão de hábito diário."
        subDescription="Cada Pokémon tem uma chance baseada em seu peso atribuído. Melhores chances para Pokémon mais raros!"
        pokemonList={ultraBallPokemon}
      />
      
      <SectionDisplay
        title={`Grupo da ${getTranslatedBallName('master')}`}
        ballType="master"
        description="Obtível apenas através de uma troca especial. Garante a captura de um Pokémon lendário!"
        subDescription="Cada Pokémon tem uma chance baseada em seu peso atribuído."
        pokemonList={masterBallPokemon}
      />
    </div>
  );
};

export default BallOddsPage;
