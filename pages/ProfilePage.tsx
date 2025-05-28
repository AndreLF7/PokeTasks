
import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import Modal from '../components/Modal'; // Import Modal
import {
    POKEMON_MASTER_LIST,
    LEVEL_THRESHOLDS,
    MAX_PLAYER_LEVEL,
} from '../constants';

interface LevelInfo {
  level: number;
  xpToNextLevelDisplay: string;
  currentXPInLevelDisplay: number;
  totalXPForThisLevelSpanDisplay: number;
  xpProgressPercent: number;
  isMaxLevel: boolean;
}

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
    xpProgressPercent = totalXPForThisLevelSpanDisplay > 0 ? (currentXPInLevelDisplay / totalXPForThisLevelSpanDisplay) * 100 : 100;
    xpProgressPercent = Math.max(0, Math.min(xpProgressPercent, 100));
  } else {
    currentXPInLevelDisplay = totalXP - xpForCurrentLevelStart;
    totalXPForThisLevelSpanDisplay = currentXPInLevelDisplay;
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
  const { currentUser, saveProfileToCloud, loadProfileFromCloud } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [cloudMessage, setCloudMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isReloadConfirmModalOpen, setIsReloadConfirmModalOpen] = useState(false);


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

  const handleSaveToCloud = async () => {
    setIsSaving(true);
    setCloudMessage(null);
    const result = await saveProfileToCloud();
    setCloudMessage({ text: result.message, type: result.success ? 'success' : 'error' });
    setIsSaving(false);
    setTimeout(() => setCloudMessage(null), 5000);
  };

  const openReloadConfirmModal = () => {
    setIsReloadConfirmModalOpen(true);
  };

  const closeReloadConfirmModal = () => {
    setIsReloadConfirmModalOpen(false);
  };

  const handleConfirmReloadFromCloud = async () => {
    closeReloadConfirmModal();
    setIsLoadingCloud(true);
    setCloudMessage(null);
    const result = await loadProfileFromCloud(); // Uses current user's username by default
    setCloudMessage({ text: result.message, type: result.success ? 'success' : 'error' });
    setIsLoadingCloud(false);
    setTimeout(() => setCloudMessage(null), 5000);
  };


  return (
    <div className="space-y-8 p-4 sm:p-6 md:p-8 bg-slate-900 min-h-screen">
      <header className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-yellow-400">Perfil do Treinador</h1>
        <p className="text-2xl sm:text-3xl text-slate-200 mt-2">{username}</p>
      </header>

      {/* Cloud Sync Section */}
      <section aria-labelledby="cloud-sync-heading" className="bg-slate-800 p-6 rounded-xl shadow-2xl">
        <h2 id="cloud-sync-heading" className="text-2xl sm:text-3xl font-semibold text-yellow-300 mb-4 text-center">Sincronização com a Nuvem</h2>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <button
            onClick={handleSaveToCloud}
            disabled={isSaving || isLoadingCloud}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            aria-live="polite"
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            onClick={openReloadConfirmModal}
            disabled={isSaving || isLoadingCloud}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            aria-live="polite"
          >
            {isLoadingCloud ? 'Recarregando...' : 'Recarregar informações de Treinador'}
          </button>
        </div>
        {cloudMessage && (
          <p className={`mt-4 text-center text-sm p-3 rounded-md ${cloudMessage.type === 'success' ? 'bg-green-700 text-green-100' : 'bg-red-700 text-red-100'}`}
             role="alert"
          >
            {cloudMessage.text}
          </p>
        )}
         <p className="text-xs text-slate-400 mt-3 text-center">
            Salvar seus dados na nuvem permite acessá-los em outros dispositivos. Recarregar da nuvem substituirá seus dados locais não salvos.
        </p>
      </section>

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
        <div className="bg-slate-800 p-6 rounded-xl shadow-xl hover:shadow-2xl transition-shadow">
          <h3 className="text-xl font-semibold text-yellow-400 mb-3">Estatísticas Pokémon</h3>
          <ul className="space-y-2 text-slate-300">
            <li><strong className="text-slate-100">Total Capturados:</strong> {totalPokemonCaught}</li>
            <li><strong className="text-slate-100">Espécies Únicas:</strong> {uniquePokemonSpeciesCaught} / {POKEMON_MASTER_LIST.length}</li>
          </ul>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl shadow-xl hover:shadow-2xl transition-shadow">
          <h3 className="text-xl font-semibold text-yellow-400 mb-3">Inventário de Bolas</h3>
          <ul className="space-y-2 text-slate-300">
            <li><strong className="text-slate-100">Poké Bolas:</strong> {pokeBalls}</li>
            <li><strong className="text-slate-100">Great Balls:</strong> {greatBalls}</li>
            <li><strong className="text-slate-100">Ultra Balls:</strong> {ultraBalls}</li>
            <li><strong className="text-slate-100">Master Balls:</strong> {masterBalls}</li>
          </ul>
        </div>

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

      {/* Confirmation Modal for Reload */}
      <Modal isOpen={isReloadConfirmModalOpen} onClose={closeReloadConfirmModal} title="Confirmar Recarga">
        <div className="text-center">
          <p className="text-lg text-slate-300 mb-6">
            ATENÇÃO! Se você recarregar as informações de treinador, perderá tudo que não foi salvo até aqui. Tem certeza que deseja prosseguir?
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={handleConfirmReloadFromCloud}
              className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Prosseguir
            </button>
            <button
              onClick={closeReloadConfirmModal}
              className="bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProfilePage;
