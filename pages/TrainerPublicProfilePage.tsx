
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { UserProfile, CaughtPokemon, SortOption } from '../types';
import PokemonCard from '../components/PokemonCard';
import { LEVEL_THRESHOLDS, MAX_PLAYER_LEVEL } from '../constants';

interface LevelInfo {
  level: number;
  xpToNextLevelDisplay: string;
  currentXPInLevelDisplay: number;
  totalXPForThisLevelSpanDisplay: number;
  xpProgressPercent: number;
  isMaxLevel: boolean;
}

// Helper function to calculate player level (copied from ProfilePage.tsx)
const calculatePlayerLevelInfo = (totalXP: number): LevelInfo => {
  let currentLevel = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      currentLevel = i + 1;
    } else {
      break;
    }
  }
  currentLevel = Math.min(currentLevel, MAX_PLAYER_LEVEL);

  const isMaxLevel = currentLevel === MAX_PLAYER_LEVEL;
  const xpForCurrentLevelStart = LEVEL_THRESHOLDS[currentLevel - 1];

  let xpToNextLevelDisplay = "N/A";
  let currentXPInLevelDisplay = 0;
  let totalXPForThisLevelSpanDisplay = 0;
  let xpProgressPercent = 100;

  if (!isMaxLevel) {
    const xpForNextLevelStart = LEVEL_THRESHOLDS[currentLevel];
    totalXPForThisLevelSpanDisplay = xpForNextLevelStart - xpForCurrentLevelStart;
    currentXPInLevelDisplay = totalXP - xpForCurrentLevelStart;
    const xpRemainingForNextLevel = totalXPForThisLevelSpanDisplay - currentXPInLevelDisplay;
    xpToNextLevelDisplay = xpRemainingForNextLevel.toLocaleString('pt-BR');
    xpProgressPercent = totalXPForThisLevelSpanDisplay > 0 ? (currentXPInLevelDisplay / totalXPForThisLevelSpanDisplay) * 100 : 0;
    xpProgressPercent = Math.max(0, Math.min(xpProgressPercent, 100));
  } else {
    currentXPInLevelDisplay = totalXP - xpForCurrentLevelStart;
    totalXPForThisLevelSpanDisplay = currentXPInLevelDisplay; // For max level, the "span" is just the XP accumulated in this level
    xpProgressPercent = 100;
    xpToNextLevelDisplay = "MAX";
  }

  return {
    level: currentLevel,
    xpToNextLevelDisplay,
    currentXPInLevelDisplay,
    totalXPForThisLevelSpanDisplay,
    xpProgressPercent,
    isMaxLevel,
  };
};


const TrainerPublicProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [trainerProfile, setTrainerProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>(SortOption.DATE_DESC);
  const [habitsMessage, setHabitsMessage] = useState<string | null>(null);


  useEffect(() => {
    const fetchTrainerProfile = async () => {
      if (!username) {
        setError("Nome do treinador não especificado.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      setHabitsMessage(null);
      try {
        const response = await fetch(`/api/habits?username=${encodeURIComponent(username)}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Perfil do treinador "${username}" não encontrado.`);
          }
          const errorData = await response.json();
          throw new Error(errorData.error || `Falha ao carregar perfil: ${response.status}`);
        }
        const data: UserProfile = await response.json();
        setTrainerProfile(data);
      } catch (err: any) {
        console.error("Erro ao carregar perfil do treinador:", err);
        setError(err.message || 'Ocorreu um erro desconhecido.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrainerProfile();
  }, [username]);

  const sortedPokemon = useMemo(() => {
    if (!trainerProfile) return [];
    const pokemonList = [...trainerProfile.caughtPokemon]; // Create a shallow copy to sort
    switch (sortOption) {
      case SortOption.ID_ASC:
        return pokemonList.sort((a, b) => a.id - b.id);
      case SortOption.ID_DESC:
        return pokemonList.sort((a, b) => b.id - a.id); // Correct numeric descending sort
      case SortOption.NAME_ASC:
        return pokemonList.sort((a, b) => a.name.localeCompare(b.name));
      case SortOption.NAME_DESC:
        return pokemonList.sort((a, b) => b.name.localeCompare(a.name));
      case SortOption.DATE_ASC:
        return pokemonList.sort((a, b) => new Date(a.caughtDate).getTime() - new Date(b.caughtDate).getTime());
      case SortOption.DATE_DESC:
      default:
        return pokemonList.sort((a, b) => new Date(b.caughtDate).getTime() - new Date(a.caughtDate).getTime());
    }
  }, [trainerProfile, sortOption]);

  useEffect(() => {
    if (habitsMessage) {
      const timer = setTimeout(() => setHabitsMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [habitsMessage]);

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-2xl text-yellow-400 animate-pulse">Carregando perfil de {username || 'Treinador'}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 bg-red-900 bg-opacity-30 p-6 rounded-lg">
        <p className="text-2xl text-red-400">Erro ao Carregar Perfil</p>
        <p className="text-slate-300 mt-2">{error}</p>
        <Link
          to="/ranking"
          className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Voltar para o Ranking
        </Link>
      </div>
    );
  }

  if (!trainerProfile) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-slate-400">Perfil do treinador não pôde ser carregado.</p>
        <Link
          to="/ranking"
          className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Voltar para o Ranking
        </Link>
      </div>
    );
  }
  
  const levelInfo = calculatePlayerLevelInfo(trainerProfile.experiencePoints);

  return (
    <div className="space-y-8">
      <header className="text-center mb-6 md:mb-10">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-yellow-400">{trainerProfile.username}</h1>
        <p className="text-xl sm:text-2xl text-slate-300 mt-2">Nível do Treinador: <span className="font-semibold text-white">{levelInfo.level}</span></p>
        <div className="mt-3 max-w-md mx-auto">
            <div className="w-full bg-slate-700 rounded-full h-5 sm:h-6 relative overflow-hidden border border-slate-600">
                <div
                    className="bg-gradient-to-r from-yellow-400 to-amber-500 h-full rounded-full transition-all duration-500 ease-out flex items-center justify-center"
                    style={{ width: `${levelInfo.xpProgressPercent}%` }}
                    role="progressbar"
                    aria-valuenow={levelInfo.xpProgressPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    title={`${levelInfo.xpProgressPercent.toFixed(1)}%`}
                >
                    <span className="text-xs font-bold text-slate-800 px-1" aria-hidden="true">
                        {levelInfo.isMaxLevel ? "MAX" : `${levelInfo.xpProgressPercent.toFixed(0)}%`}
                    </span>
                </div>
            </div>
        </div>
      </header>
      
      <div className="text-center mb-6">
        {trainerProfile.habitsPubliclyVisible ? (
          <button
            onClick={() => navigate(`/trainer/${encodeURIComponent(username!)}/habits`)}
            className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-5 rounded-lg transition-colors shadow-md"
          >
            Ver Hábitos do Treinador
          </button>
        ) : (
          <button
            onClick={() => setHabitsMessage("Lamento mas o treinador não deseja divulgar seus hábitos.")}
            className="bg-slate-600 text-slate-400 font-semibold py-2 px-5 rounded-lg cursor-default shadow"
          >
            Ver Hábitos do Treinador (Privado)
          </button>
        )}
        {habitsMessage && (
            <p 
                className="text-center text-sm text-slate-300 bg-slate-700 p-2 rounded-md mt-3 max-w-sm mx-auto shadow"
                role="status"
            >
                {habitsMessage}
            </p>
        )}
      </div>


      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <h2 className="text-2xl lg:text-3xl font-bold text-yellow-300">Pokémon de {trainerProfile.username} ({sortedPokemon.length})</h2>
        <div className="w-full md:w-auto flex-grow-0">
            <label htmlFor="sort-pokemon" className="sr-only">Ordenar Pokémon:</label>
            <select
            id="sort-pokemon"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="w-full md:w-auto bg-slate-700 border border-slate-600 text-slate-100 rounded-lg p-2 focus:ring-yellow-500 focus:border-yellow-500"
            >
            <option value={SortOption.DATE_DESC}>Data de Captura (Mais Recentes)</option>
            <option value={SortOption.DATE_ASC}>Data de Captura (Mais Antigos)</option>
            <option value={SortOption.ID_ASC}>ID (Crescente)</option>
            <option value={SortOption.ID_DESC}>ID (Decrescente)</option>
            <option value={SortOption.NAME_ASC}>Nome (A-Z)</option>
            <option value={SortOption.NAME_DESC}>Nome (Z-A)</option>
            </select>
        </div>
      </div>

      {sortedPokemon.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {sortedPokemon.map(pokemon => (
            <PokemonCard 
              key={pokemon.instanceId} 
              pokemon={pokemon} 
              showDate={true} 
              // No onRelease, onSelect, or isTradeMode passed to make it view-only
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 px-6 bg-slate-800 rounded-lg shadow">
          <img 
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/empty-tm.png" 
            alt="Caixa de Pokémon Vazia" 
            className="mx-auto mb-4 rounded-md w-24 h-24 filter grayscale opacity-60" 
          />
          <p className="text-xl text-slate-400">{trainerProfile.username} ainda não capturou nenhum Pokémon.</p>
        </div>
      )}

      <div className="text-center mt-10">
        <Link
          to="/ranking"
          className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-3 px-6 rounded-lg transition-colors text-lg shadow-md hover:shadow-lg"
        >
          &larr; Voltar para o Ranking
        </Link>
      </div>
    </div>
  );
};

export default TrainerPublicProfilePage;