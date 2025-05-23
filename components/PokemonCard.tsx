import React from 'react';
import { CaughtPokemon, BallType } from '../types'; 
import { getTranslatedBallName } from '../constants';

interface PokemonCardProps {
  pokemon: CaughtPokemon;
  showDate?: boolean;
  onRelease?: (instanceId: string) => void;
  isTradeMode?: boolean; 
  isSelected?: boolean; 
  onSelect?: (instanceId: string) => void; 
}

const getBallIconMini = (ballType: BallType) => {
  switch (ballType) {
    case 'poke':
      return "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";
    case 'great':
      return "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png";
    case 'ultra':
      return "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png";
    case 'master':
      return "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png";
    default:
      return "";
  }
};

const PokemonCard: React.FC<PokemonCardProps> = ({ 
  pokemon, 
  showDate = false, 
  onRelease,
  isTradeMode = false,
  isSelected = false,
  onSelect
}) => {
  const cardClasses = [
    "bg-slate-800 rounded-xl shadow-lg p-4 flex flex-col items-center text-center relative transition-all duration-200",
    isTradeMode ? "cursor-pointer hover:shadow-xl" : "transform hover:scale-105 hover:shadow-xl",
    isSelected ? "ring-4 ring-yellow-500 ring-inset" : "ring-2 ring-transparent",
  ].join(" ");

  const handleCardClick = () => {
    if (isTradeMode && onSelect) {
      onSelect(pokemon.instanceId);
    }
  };

  const translatedBallName = getTranslatedBallName(pokemon.caughtWithBallType);

  return (
    <div className={cardClasses} onClick={handleCardClick} role={isTradeMode ? "button" : undefined} tabIndex={isTradeMode ? 0 : undefined}
      onKeyDown={isTradeMode ? (e) => (e.key === 'Enter' || e.key === ' ') && handleCardClick() : undefined}
      aria-pressed={isTradeMode ? isSelected : undefined}
    >
      {onRelease && !isTradeMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onRelease(pokemon.instanceId); }}
          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center transition-colors z-10"
          aria-label={`Liberar ${pokemon.name}`}
          title={`Liberar ${pokemon.name}`}
        >
          ✕
        </button>
      )}
      {isTradeMode && isSelected && (
         <div className="absolute top-2 left-2 bg-yellow-500 text-slate-900 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center z-10">
           ✓
         </div>
      )}
      <img
        src={pokemon.spriteUrl}
        alt={pokemon.isShiny ? `${pokemon.name} (Shiny)` : pokemon.name}
        className="w-32 h-32 object-contain mb-2 pointer-events-none" 
        loading="lazy"
      />
      <h3 className="text-lg font-bold text-yellow-400 capitalize flex items-center justify-center">
        {pokemon.name}
        {pokemon.isShiny && <span className="ml-2 text-xl" title="Shiny Pokémon!">✨</span>}
      </h3>
      <p className="text-sm text-slate-400">#{String(pokemon.id).padStart(3, '0')}</p>
      {showDate && <p className="text-xs text-slate-500 mt-1">Capturado em: {new Date(pokemon.caughtDate).toLocaleDateString('pt-BR')}</p>}
      <div className="mt-1 flex items-center justify-center" title={`Capturado com ${translatedBallName}`}>
        <img src={getBallIconMini(pokemon.caughtWithBallType)} alt={translatedBallName} className="w-4 h-4 mr-1"/>
        <span className="text-xs text-slate-500">{translatedBallName}</span>
      </div>
    </div>
  );
};

export default PokemonCard;