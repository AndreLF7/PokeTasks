
import React, { useState, useEffect } from 'react';
import { PokemonBase } from '../types';
import { POKEMON_API_SPRITE_URL, POKEMON_API_SHINY_SPRITE_URL } from '../constants';

interface PokedexEntryProps {
  pokemon: PokemonBase;
  isNormalCaught: boolean;
  isShinyCaught: boolean;
}

const PokedexEntry: React.FC<PokedexEntryProps> = ({ pokemon, isNormalCaught, isShinyCaught }) => {
  // Default to showing shiny if only shiny is caught, otherwise normal (if caught)
  const [viewingShinySprite, setViewingShinySprite] = useState(isShinyCaught && !isNormalCaught);

  useEffect(() => {
    // If shiny status changes (e.g. last shiny released), and we were viewing shiny, reset
    if (!isShinyCaught && viewingShinySprite) {
      setViewingShinySprite(false);
    }
    // If only shiny is caught, ensure we view shiny by default
    if (isShinyCaught && !isNormalCaught && !viewingShinySprite) {
        setViewingShinySprite(true);
    }
    // If normal is caught and shiny isn't, ensure we view normal
    if (isNormalCaught && !isShinyCaught && viewingShinySprite) {
        setViewingShinySprite(false);
    }
  }, [isShinyCaught, isNormalCaught, viewingShinySprite]);


  const normalSpriteUrl = POKEMON_API_SPRITE_URL(pokemon.id);
  const shinySpriteUrl = POKEMON_API_SHINY_SPRITE_URL(pokemon.id);

  let displaySpriteUrl = normalSpriteUrl;
  let currentViewIsCaught = false;
  let displayName = "???";

  if (viewingShinySprite && isShinyCaught) {
    displaySpriteUrl = shinySpriteUrl;
    currentViewIsCaught = true;
    displayName = pokemon.name;
  } else if (!viewingShinySprite && isNormalCaught) {
    displaySpriteUrl = normalSpriteUrl;
    currentViewIsCaught = true;
    displayName = pokemon.name;
  } else if (!viewingShinySprite && !isNormalCaught) { // Viewing normal, but normal not caught (could be shiny is caught or neither)
    displaySpriteUrl = normalSpriteUrl; // Show normal silhouette
    currentViewIsCaught = false;
    displayName = "???";
  } else if (viewingShinySprite && !isShinyCaught) { // Trying to view shiny, but shiny not caught (should not happen if button is hidden)
    displaySpriteUrl = shinySpriteUrl; // Show shiny silhouette
    currentViewIsCaught = false;
    displayName = "???";
  }
  
  const overallIsCaught = isNormalCaught || isShinyCaught;

  const toggleShinyView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isShinyCaught) { // Only allow toggle if shiny is actually caught
      setViewingShinySprite(!viewingShinySprite);
    }
  };
  
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // If shiny sprite fails, try to show normal sprite if it's caught
    if (viewingShinySprite && isShinyCaught && e.currentTarget.src === shinySpriteUrl) {
      if (isNormalCaught) {
        e.currentTarget.src = normalSpriteUrl; // Fallback to normal if shiny fails and normal is caught
      } else {
        // If normal isn't caught either, it will remain a broken image or you can set a generic placeholder
        // For now, let it be, or apply pokemon-silhouette if it's not already
      }
    }
    // If normal sprite fails (less likely but possible for Pokedex entries)
    // No specific fallback here, it will show browser's broken image icon.
  };

  return (
    <div 
      className={`bg-slate-800 rounded-xl shadow-lg p-4 flex flex-col items-center text-center transition-all duration-300 relative ${overallIsCaught ? 'border-2 border-yellow-400' : 'border-2 border-slate-700'}`}
    >
      {isShinyCaught && ( // Show toggle button only if a shiny version has been caught
        <button
          onClick={toggleShinyView}
          title={viewingShinySprite ? "Mostrar normal" : "Mostrar Shiny"}
          className="absolute top-2 right-2 text-2xl z-10 p-1 bg-slate-700 rounded-full hover:bg-slate-600 transition-colors"
          aria-label={viewingShinySprite ? "Ver forma normal" : "Ver forma Shiny"}
        >
          ✨
        </button>
      )}
      <img
        key={displaySpriteUrl} // Add key to force re-render on src change if needed
        src={displaySpriteUrl}
        alt={currentViewIsCaught ? `${displayName}${viewingShinySprite && isShinyCaught ? " (Shiny)" : ""}` : displayName}
        className={`w-24 h-24 md:w-32 md:h-32 object-contain mb-2 ${!currentViewIsCaught ? 'pokemon-silhouette' : ''}`}
        loading="lazy"
        onError={handleImageError}
      />
      <h3 className={`text-lg font-semibold capitalize ${currentViewIsCaught ? (viewingShinySprite && isShinyCaught ? 'text-yellow-300' : 'text-yellow-400') : 'text-slate-500'}`}>
        {displayName}
        {currentViewIsCaught && viewingShinySprite && isShinyCaught && <span className="text-sm"> (Shiny)</span>}
      </h3>
      <p className={`text-sm ${currentViewIsCaught ? 'text-slate-300' : 'text-slate-600'}`}>
        #{String(pokemon.id).padStart(3, '0')}
      </p>
    </div>
  );
};

export default PokedexEntry;