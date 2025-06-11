
import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import Modal from '../components/Modal'; // Import Modal
import {
    POKEMON_MASTER_LIST,
    AVATAR_OPTIONS, // Import avatar options
    DEFAULT_AVATAR_ID, // Import default avatar ID
} from '../constants';
import type { AvatarOption } from '../types'; // Import AvatarOption type

// LevelInfo interface is now managed by UserContext

const ProfilePage: React.FC = () => {
  const { currentUser, saveProfileToCloud, loadProfileFromCloud, claimLevelRewards, calculatePlayerLevelInfo, selectAvatar } = useUser();
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

  const { username, caughtPokemon, pokeBalls, greatBalls, ultraBalls, masterBalls, habits, experiencePoints, dailyStreak, dailyCompletions, lastLevelRewardClaimed, avatarId } = currentUser;

  const totalPokemonCaught = caughtPokemon.length;
  const uniquePokemonSpeciesCaught = new Set(caughtPokemon.map(p => p.id)).size;
  const totalHabits = habits.length;
  const totalLifetimeCompletions = habits.reduce((sum, h) => sum + (h.totalCompletions || 0), 0);

  const levelInfo = calculatePlayerLevelInfo(experiencePoints);
  const canClaimLevelRewards = levelInfo.level > (lastLevelRewardClaimed || 1);

  const currentSelectedAvatar = AVATAR_OPTIONS.find(av => av.id === (avatarId || DEFAULT_AVATAR_ID)) || AVATAR_OPTIONS[0];


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
        {currentSelectedAvatar && (
            <img 
                src={currentSelectedAvatar.profileImageUrl} 
                alt={`${currentSelectedAvatar.name} Avatar`} 
                className="w-32 h-32 sm:w-40 sm:h-40 object-contain mx-auto mb-4 rounded-lg bg-slate-700 p-1 shadow-lg"
            />
        )}
        <h1 className="text-4xl sm:text-5xl font-bold text-yellow-400">{username}</h1>
      </header>

      {/* Avatar Selection Section */}
      <section aria-labelledby="avatar-selection-heading" className="bg-slate-800 p-6 rounded-xl shadow-2xl">
        <h2 id="avatar-selection-heading" className="text-2xl sm:text-3xl font-semibold text-yellow-300 mb-6 text-center">Escolha seu Avatar</h2>
        <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
          {AVATAR_OPTIONS.map((avatarOpt: AvatarOption) => (
            <div
              key={avatarOpt.id}
              onClick={() => selectAvatar(avatarOpt.id)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && selectAvatar(avatarOpt.id)}
              role="button"
              tabIndex={0}
              aria-pressed={(avatarId || DEFAULT_AVATAR_ID) === avatarOpt.id}
              aria-label={`Selecionar avatar ${avatarOpt.id}`}
              className={`p-2 rounded-lg cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-500 focus:ring-opacity-75
                ${(avatarId || DEFAULT_AVATAR_ID) === avatarOpt.id ? 'ring-4 ring-yellow-400 bg-slate-700' : 'bg-slate-700/50 hover:bg-slate-700'}`}
            >
              <img
                src={avatarOpt.profileImageUrl}
                alt="" // Alt text is now handled by aria-label on the div for screen readers
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-md"
                loading="lazy"
              />
              {/* Name display removed as per request */}
            </div>
          ))}
        </div>
      </section>


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
         
         {/* Level Rewards Button */}
        <div className="mt-6 text-center">
            <button
                onClick={claimLevelRewards}
                disabled={!canClaimLevelRewards}
                className={`font-bold py-3 px-6 rounded-lg transition-colors shadow-md w-full sm:w-auto
                    ${canClaimLevelRewards 
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-slate-900' 
                        : 'bg-slate-600 text-slate-400 cursor-not-allowed'}`}
                aria-live="polite"
                aria-disabled={!canClaimLevelRewards}
            >
                {canClaimLevelRewards ? "Resgatar Recompensas de Nível" : (levelInfo.isMaxLevel && !canClaimLevelRewards ? "Todas Recompensas de Nível Resgatadas" : "Nenhuma Recompensa de Nível Pendente")}
            </button>
            {canClaimLevelRewards && <p className="text-xs text-yellow-200 mt-2">Você tem recompensas de nível para resgatar!</p>}
        </div>
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
            <li><strong className="text-slate-100">Hábitos Ativos:</strong> {totalHabits} / {currentUser.maxHabitSlots}</li>
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
