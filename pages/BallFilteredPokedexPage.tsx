
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import {
  POKEMON_MASTER_LIST,
  POKEBALL_WEIGHTED_POOL,
  GREATBALL_WEIGHTED_POOL,
  ULTRABALL_WEIGHTED_POOL,
  MASTERBALL_WEIGHTED_POOL,
  getTranslatedBallName,
  WeightedPokemonEntry
} from '../constants';
import PokedexEntry from '../components/PokedexEntry';
import { PokemonBase, BallType } from '../types';

const BallFilteredPokedexPage: React.FC = () => {
  const { ballType } = useParams<{ ballType?: string }>();
  const { currentUser } = useUser();

  if (!currentUser) return <p className="text-center text-xl py-10">Carregando dados da Pokédex...</p>;
  if (!ballType || !['poke', 'great', 'ultra', 'master'].includes(ballType)) {
    return (
      <div className="text-center text-xl py-10">
        <p className="text-red-400">Tipo de Pokédex inválido.</p>
        <Link to="/pokedex" className="mt-4 inline-block bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold py-2 px-4 rounded-lg">
          Voltar para Pokédex Principal
        </Link>
      </div>
    );
  }

  const validBallType = ballType as BallType;

  let currentPool: WeightedPokemonEntry[] = [];
  let pageTitleSuffix = "";

  switch (validBallType) {
    case 'poke':
      currentPool = POKEBALL_WEIGHTED_POOL;
      pageTitleSuffix = getTranslatedBallName('poke') + " Dex";
      break;
    case 'great':
      currentPool = GREATBALL_WEIGHTED_POOL;
      pageTitleSuffix = getTranslatedBallName('great') + " Dex";
      break;
    case 'ultra':
      currentPool = ULTRABALL_WEIGHTED_POOL;
      pageTitleSuffix = getTranslatedBallName('ultra') + " Dex";
      break;
    case 'master':
      currentPool = MASTERBALL_WEIGHTED_POOL;
      pageTitleSuffix = getTranslatedBallName('master') + " Dex";
      break;
    default:
      // Should not happen due to check above
      return <p className="text-red-400 text-center py-10">Tipo de Bola Inválido.</p>;
  }
  
  const uniquePokemonIdsInPool = Array.from(new Set(currentPool.map(entry => entry.id)));
  const pokemonListForBallDex: PokemonBase[] = uniquePokemonIdsInPool
    .map(id => POKEMON_MASTER_LIST.find(p => p.id === id))
    .filter((p): p is PokemonBase => p !== undefined)
    .sort((a,b) => a.id - b.id);


  const caughtPokemonIds = new Set(currentUser.caughtPokemon.map(p => p.id));
  
  const totalCaughtInThisDex = pokemonListForBallDex.filter(p => caughtPokemonIds.has(p.id)).length;
  const totalPokemonInThisDex = pokemonListForBallDex.length;
  
  const shinyCaughtInThisDex = pokemonListForBallDex.filter(p => currentUser.shinyCaughtPokemonIds.includes(p.id)).length;


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-yellow-400">{pageTitleSuffix}</h1>
        <p className="text-slate-300 text-lg">Pokémon que podem ser capturados com uma {getTranslatedBallName(validBallType)}.</p>
        <p className="text-slate-100 text-xl font-semibold mt-2">
          Progresso neste Dex: <span className="text-yellow-400">{totalCaughtInThisDex}</span> / {totalPokemonInThisDex} capturados
        </p>
        {currentUser.shinyCaughtPokemonIds.length > 0 && (
            <p className="text-slate-100 text-lg font-semibold mt-1">
            Progresso Shiny neste Dex: <span className="text-yellow-300">{shinyCaughtInThisDex}</span> / {totalPokemonInThisDex} shinies capturados
            </p>
        )}
         <Link to="/pokedex" className="mt-4 inline-block text-yellow-500 hover:text-yellow-400 hover:underline">
          &larr; Voltar para Pokédex Global
        </Link>
      </div>

      {pokemonListForBallDex.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {pokemonListForBallDex.map(pokemon => {
            const isNormalCaught = currentUser.caughtPokemon.some(p => p.id === pokemon.id && !p.isShiny);
            const isShinyVersionCaught = currentUser.shinyCaughtPokemonIds.includes(pokemon.id);
            return (
              <PokedexEntry
                key={`${validBallType}-${pokemon.id}`}
                pokemon={pokemon}
                isNormalCaught={isNormalCaught}
                isShinyCaught={isShinyVersionCaught}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 px-6 bg-slate-800 rounded-lg shadow">
            <img 
                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" 
                alt="Poké Ball" 
                className="mx-auto mb-4 rounded-md w-24 h-24 filter grayscale opacity-60" 
            />
            <p className="text-xl text-slate-400">Nenhum Pokémon definido para este tipo de bola no momento.</p>
        </div>
      )}
    </div>
  );
};

export default BallFilteredPokedexPage;
