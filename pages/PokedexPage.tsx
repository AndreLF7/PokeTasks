
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { POKEMON_MASTER_LIST, getTranslatedBallName } from '../constants';
import PokedexEntry from '../components/PokedexEntry';
import { BallType } from '../types';

const PokedexPage: React.FC = () => {
  const { currentUser } = useUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  if (!currentUser) return <p className="text-center text-xl py-10">Carregando dados da Pokédex...</p>;

  const caughtPokemonIds = new Set(currentUser.caughtPokemon.map(p => p.id));
  const totalCaught = caughtPokemonIds.size;
  const totalPokemon = POKEMON_MASTER_LIST.length;
  
  const shinyCaughtCount = currentUser.shinyCaughtPokemonIds.length;

  const ballDexOptions: { label: string; type: BallType; path: string }[] = [
    { label: getTranslatedBallName('poke') + " Dex", type: 'poke', path: '/pokedex/poke' },
    { label: getTranslatedBallName('great') + " Dex", type: 'great', path: '/pokedex/great' },
    { label: getTranslatedBallName('ultra') + " Dex", type: 'ultra', path: '/pokedex/ultra' },
    { label: getTranslatedBallName('master') + " Dex", type: 'master', path: '/pokedex/master' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-yellow-400">Pokédex</h1>
        <p className="text-slate-300 text-lg">Descubra todos os Pokémon. Os Pokémon capturados são coloridos, os outros são silhuetas.</p>
        
        <div className="flex items-center mt-2 space-x-3">
            <p className="text-slate-100 text-xl font-semibold">
            Progresso: <span className="text-yellow-400">{totalCaught}</span> / {totalPokemon} capturados
            </p>
            <div className="relative inline-block text-left" ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-1 px-3 rounded-md text-sm transition-colors shadow inline-flex items-center"
                    aria-haspopup="true"
                    aria-expanded={isDropdownOpen}
                    id="ball-dex-filter-button"
                >
                    Filtrar por Bola
                    <svg className={`w-3 h-3 ml-1.5 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                {isDropdownOpen && (
                    <div 
                    className="origin-top-left absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-slate-700 ring-1 ring-black ring-opacity-5 z-20"
                    role="menu" 
                    aria-orientation="vertical" 
                    aria-labelledby="ball-dex-filter-button"
                    >
                    <div className="py-1" role="none">
                        {ballDexOptions.map(option => (
                        <Link
                            key={option.type}
                            to={option.path}
                            className="block px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-600 hover:text-yellow-300 rounded-md mx-1 my-0.5 transition-colors"
                            role="menuitem"
                            onClick={() => setIsDropdownOpen(false)} 
                        >
                            {option.label}
                        </Link>
                        ))}
                    </div>
                    </div>
                )}
            </div>
        </div>

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
