
import React from 'react';
import { useUser } from '../contexts/UserContext';
import { POKEMON_MASTER_LIST } from '../constants';
import PokedexEntry from '../components/PokedexEntry';

const PokedexPage: React.FC = () => {
  const { currentUser } = useUser();

  if (!currentUser) return <p>Carregando dados da Pokédex...</p>;

  const caughtPokemonIds = new Set(currentUser.caughtPokemon.map(p => p.id));
  const totalCaught = caughtPokemonIds.size;
  const totalPokemon = POKEMON_MASTER_LIST.length;
  
  const shinyCaughtCount = currentUser.shinyCaughtPokemonIds.length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-yellow-400">Pokédex</h1>
        <p className="text-slate-300 text-lg">Descubra todos os Pokémon. Os Pokémon capturados são coloridos, os outros são silhuetas.</p>
        <p className="text-slate-100 text-xl font-semibold mt-2">
          Progresso: <span className="text-yellow-400">{totalCaught}</span> / {totalPokemon} capturados
        </p>
        {shinyCaughtCount > 0 && (
            <p className="text-slate-100 text-lg font-semibold mt-1">
            Progresso Shiny: <span className="text-yellow-300">{shinyCaughtCount}</span> / {totalPokemon} shinies capturados
            </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {POKEMON_MASTER_LIST.map(pokemon => {
          const isNormalCaught = currentUser.caughtPokemon.some(p => p.id === pokemon.id && !p.isShiny);
          const isShinyVersionCaught = currentUser.shinyCaughtPokemonIds.includes(pokemon.id);
          return (
            <PokedexEntry
              key={pokemon.id}
              pokemon={pokemon}
              isNormalCaught={isNormalCaught}
              isShinyCaught={isShinyVersionCaught}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PokedexPage;