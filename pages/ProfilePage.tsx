
import React from 'react';
import { useUser } from '../contexts/UserContext';
import {
    POKEMON_MASTER_LIST,
    LEVEL_THRESHOLDS,
    MAX_PLAYER_LEVEL,
} from '../constants';

interface LevelInfo {
  level: number;
  xpToNextLevelDisplay: string;
  currentXPInLevelDisplay: number; // XP accumulated within the current level's range
  totalXPForThisLevelSpanDisplay: number; // Total XP required to pass the current level
  xpProgressPercent: number;
  isMaxLevel: boolean;
}

// Function to calculate player level and XP progress
const calculatePlayerLevelInfo = (totalXP: number): LevelInfo => {
  let currentLevel = 1;
  // LEVEL_THRESHOLDS[0] is 0 XP (for level 1 start)
  // LEVEL_THRESHOLDS[i] is the XP required to reach level i+1.
  // So, if totalXP >= LEVEL_THRESHOLDS[i], player is at least level i+1.

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
    
    xpProgressPercent = totalXPForThisLevelSpanDisplay > 0 ? (currentXPInLevelDisplay / totalXPForThisLevelSpanDisplay) * 100 : 100;
    xpProgressPercent = Math.max(0, Math.min(xpProgressPercent, 100));
  } else {
    currentXPInLevelDisplay = totalXP - xpForCurrentLevelStart;
    totalXPForThisLevelSpanDisplay = currentXPInLevelDisplay; // Or could be 0, effectively making progress bar full.
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


const ProfilePage: React.FC = () => {
  const { currentUser } = useUser();

  if (!currentUser) {
    return (
      <div className="text-center py-10">
        <p className="text-2xl text-yellow-400">Carregando perfil do treinador...</p>
      </div>
    );
  }

  const { username, caughtPokemon, pokeBalls, greatBalls, ultraBalls, masterBalls, habits, experiencePoints, dailyStreak, dailyCompletions } = currentUser;
  
  const totalPokemonCaught = caughtPokemon.length;
  const uniquePokemonSpeciesCaught = new Set(caughtPokemon.map(p => p.id)).size;
  const totalHabits = habits.length;
  const totalLifetimeCompletions = habits.reduce((sum, h) => sum + (h.totalCompletions || 0), 0);

  const levelInfo = calculatePlayerLevelInfo(experiencePoints);


  return (
    <div className="space-y-8 p-4 sm:p-6 md:p-8 bg-slate-900 min-h-screen">
      <header className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-yellow-400">Perfil do Treinador</h1>
        <p className="text-2xl sm:text-3xl text-slate-200 mt-2">{username}</p>
      </header>

      {/* XP and Level Section */}
      <section aria-labelledby="xp-level-heading" className="bg-slate-800 p-6 rounded-xl shadow-2xl">
        <h2 id="xp-level-heading" className="text-2xl sm:text-3xl font-semibold text-yellow-300 mb-4">Nível de Treinador: <span className="text-white">{levelInfo.level}</span></h2>
        <div className="mb-2">
          <div className="flex justify-between text-sm text-slate-300 mb-1" aria-live="polite">
            <span>XP Atual: {experiencePoints.toLocaleString('pt-BR')}</span>
            {!levelInfo.isMaxLevel ? (
              <span>Próximo Nível em: {levelInfo.xpToNextLevelDisplay} XP</span>
            ) : (
              <span className="text-green-400 font-semibold">Nível Máximo Alcançado!</span>
            )}
          </div>
          <div className="w-full bg-slate-700 rounded-full h-6 sm:h-8 relative overflow-hidden border-2 border-slate-600">
            <div
              className="bg-gradient-to-r from-yellow-400 to-amber-500 h-full rounded-full transition-all duration-500 ease-out flex items-center justify-center"
              style={{ width: `${levelInfo.xpProgressPercent}%` }}
              role="progressbar"
              aria-valuenow={levelInfo.xpProgressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progresso de XP: ${levelInfo.xpProgressPercent.toFixed(1)}%`}
              title={`${levelInfo.xpProgressPercent.toFixed(1)}% para o próximo nível`}
            >
                <span className="text-xs sm:text-sm font-bold text-slate-800 px-2" aria-hidden="true">
                  {levelInfo.isMaxLevel ? "MAX XP" : `${levelInfo.currentXPInLevelDisplay.toLocaleString('pt-BR')} / ${levelInfo.totalXPForThisLevelSpanDisplay.toLocaleString('pt-BR')} XP`}
                </span>
            </div>
          </div>
        </div>
         {levelInfo.isMaxLevel && <p className="text-sm text-green-400 text-center mt-2">Parabéns por alcançar o nível máximo!</p>}
      </section>

      {/* General Stats Section */}
      <section aria-labelledby="general-stats-heading" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <h2 id="general-stats-heading" className="sr-only">Estatísticas Gerais</h2>
        {/* Pokémon Stats */}
        <div className="bg-slate-800 p-6 rounded-xl shadow-xl hover:shadow-2xl transition-shadow">
          <h3 className="text-xl font-semibold text-yellow-400 mb-3">Estatísticas Pokémon</h3>
          <ul className="space-y-2 text-slate-300">
            <li><strong className="text-slate-100">Total Capturados:</strong> {totalPokemonCaught}</li>
            <li><strong className="text-slate-100">Espécies Únicas:</strong> {uniquePokemonSpeciesCaught} / {POKEMON_MASTER_LIST.length}</li>
          </ul>
        </div>

        {/* Ball Inventory */}
        <div className="bg-slate-800 p-6 rounded-xl shadow-xl hover:shadow-2xl transition-shadow">
          <h3 className="text-xl font-semibold text-yellow-400 mb-3">Inventário de Bolas</h3>
          <ul className="space-y-2 text-slate-300">
            <li><strong className="text-slate-100">Poké Bolas:</strong> {pokeBalls}</li>
            <li><strong className="text-slate-100">Great Balls:</strong> {greatBalls}</li>
            <li><strong className="text-slate-100">Ultra Balls:</strong> {ultraBalls}</li>
            <li><strong className="text-slate-100">Master Balls:</strong> {masterBalls}</li>
          </ul>
        </div>
        
        {/* Habit Stats */}
        <div className="bg-slate-800 p-6 rounded-xl shadow-xl hover:shadow-2xl transition-shadow">
          <h3 className="text-xl font-semibold text-yellow-400 mb-3">Estatísticas de Hábitos</h3>
          <ul className="space-y-2 text-slate-300">
            <li><strong className="text-slate-100">Hábitos Ativos:</strong> {totalHabits}</li>
            <li><strong className="text-slate-100">Conclusões de Hoje:</strong> {dailyCompletions}</li>
            <li><strong className="text-slate-100">Sequência Diária:</strong> {dailyStreak} dias</li>
            <li><strong className="text-slate-100">Conclusões Totais (Vida):</strong> {totalLifetimeCompletions}</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
