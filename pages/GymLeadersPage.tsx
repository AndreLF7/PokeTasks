
import React from 'react';
import { useUser } from '../contexts/UserContext';
import { GYM_LEADERS } from '../constants';
import type { GymLeader } from '../types';
import GymLeaderCard from '../components/GymLeaderCard';

const GymLeadersPage: React.FC = () => {
  const { currentUser } = useUser();

  if (!currentUser) {
    return <p className="text-center text-xl py-10 text-yellow-400">Carregando dados do treinador...</p>;
  }

  const caughtPokemonIds = new Set(currentUser.caughtPokemon.map(p => p.id));

  const checkLeaderUnlocked = (leader: GymLeader): boolean => {
    return leader.pokemon.every(p => caughtPokemonIds.has(p.id));
  };

  const unlockedLeadersCount = GYM_LEADERS.filter(leader => checkLeaderUnlocked(leader)).length;

  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold text-yellow-400">Líderes de Ginásio</h1>
        <p className="text-slate-300 text-lg mt-2">
          Encontre os líderes para desafiá-los!
        </p>
        <p className="text-slate-100 text-xl font-semibold mt-3">
            Líderes Encontrados: <span className="text-yellow-300">{unlockedLeadersCount}</span> / {GYM_LEADERS.length}
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {GYM_LEADERS.map(leader => (
          <GymLeaderCard
            key={leader.id}
            leader={leader}
            isUnlocked={checkLeaderUnlocked(leader)}
          />
        ))}
      </div>
    </div>
  );
};

export default GymLeadersPage;