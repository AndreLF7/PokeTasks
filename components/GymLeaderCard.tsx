import React from 'react';
import { GymLeader } from '../types';
import { POKEMON_API_MINI_SPRITE_URL } from '../constants';

interface GymLeaderCardProps {
  leader: GymLeader;
  isUnlocked: boolean;
}

const GymLeaderCard: React.FC<GymLeaderCardProps> = ({ leader, isUnlocked }) => {
  const cardBg = isUnlocked ? 'bg-slate-700 border-yellow-400' : 'bg-slate-800 border-slate-600';
  const textColor = isUnlocked ? 'text-yellow-400' : 'text-slate-500';
  // Use 'pokemon-silhouette' class for the locked state image effect
  const imageClasses = `w-32 h-32 object-contain mb-3 rounded-md transition-all duration-300 ${isUnlocked ? '' : 'pokemon-silhouette'}`;

  return (
    <div className={`rounded-xl shadow-lg p-4 flex flex-col items-center text-center transition-all duration-300 border-2 ${cardBg} hover:shadow-xl`}>
      <img
        src={leader.silhouetteUrl} // This now points to the actual image URL
        alt={isUnlocked ? leader.name : `${leader.name} (Bloqueado)`}
        className={imageClasses}
        loading="lazy"
      />
      <h3 className={`text-xl font-bold capitalize mb-1 ${textColor}`}>
        {isUnlocked ? leader.name : '???'}
      </h3>
      {isUnlocked && (
        <p className="text-sm text-slate-300 mb-2">{leader.city}</p>
      )}

      {/* Badge display removed as per request */}
      {/* {isUnlocked && leader.badgeUrl && (
        <div className="mb-3 text-center">
          <img src={leader.badgeUrl} alt={leader.badgeName} className="w-16 h-16 mx-auto mb-1 object-contain" loading="lazy"/>
          <p className="text-xs text-slate-400">{leader.badgeName}</p>
        </div>
      )} */}

      <div className="mt-auto w-full pt-2 border-t border-slate-600">
        <h4 className={`text-sm font-semibold mb-2 ${isUnlocked ? 'text-slate-200' : 'text-slate-500'}`}>
          Pokémon Necessários:
        </h4>
        <div className="flex flex-wrap justify-center gap-2">
          {leader.pokemon.map(p => (
            <div key={p.id} className="flex flex-col items-center" title={p.name}>
              <img 
                src={POKEMON_API_MINI_SPRITE_URL(p.id)} 
                alt={p.name} 
                className={`w-8 h-8 ${isUnlocked ? '' : 'filter grayscale opacity-60'}`} 
                loading="lazy"
              />
              <span className={`text-xs ${isUnlocked ? 'text-slate-300' : 'text-slate-600'}`}>{isUnlocked ? p.name : '???'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GymLeaderCard;