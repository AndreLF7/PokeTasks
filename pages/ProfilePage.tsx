
import React, { useState, useMemo } from 'react';
import { useUser } from '../contexts/UserContext';
import Modal from '../components/Modal';
import {
    POKEMON_MASTER_LIST,
    AVATAR_OPTIONS,
    DEFAULT_AVATAR_ID,
    GYM_LEADERS,
    MIN_LEVEL_FOR_BOOSTED_HABIT,
    MIN_LEVEL_FOR_SHARED_HABITS,
    MIN_LEVEL_FOR_PROGRESSION_L1 // Added for progression info
} from '../constants';
import type { AvatarOption, GymLeader } from '../types';

// Pencil Icon SVG for edit indication
const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
  </svg>
);


const ProfilePage: React.FC = () => {
  const { currentUser, saveProfileToCloud, loadProfileFromCloud, claimLevelRewards, calculatePlayerLevelInfo, selectAvatar } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [cloudMessage, setCloudMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isReloadConfirmModalOpen, setIsReloadConfirmModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);


  if (!currentUser) {
    return (
      <div className="text-center py-10">
        <p className="text-2xl text-yellow-400">Carregando perfil do treinador...</p>
      </div>
    );
  }

  const { username, caughtPokemon, pokeBalls, greatBalls, ultraBalls, masterBalls, habits, experiencePoints, dailyStreak, dailyCompletions, lastLevelRewardClaimed, avatarId, taskCoins } = currentUser;

  const totalPokemonCaught = caughtPokemon.length;
  const uniquePokemonSpeciesCaught = new Set(caughtPokemon.map(p => p.id)).size;
  const totalHabits = habits.length;
  const totalLifetimeCompletions = habits.reduce((sum, h) => sum + (h.totalCompletions || 0), 0) + 
                                 currentUser.progressionHabits.reduce((sum, ph) => sum + (ph.totalCompletions || 0), 0);


  const levelInfo = calculatePlayerLevelInfo(experiencePoints);
  const canClaimLevelRewards = levelInfo.level > (lastLevelRewardClaimed || 1);

  const currentSelectedAvatarDetails = AVATAR_OPTIONS.find(av => av.id === (avatarId || DEFAULT_AVATAR_ID)) || AVATAR_OPTIONS[0];
  
  const caughtPokemonIdsSet = useMemo(() => new Set(currentUser.caughtPokemon.map(p => p.id)), [currentUser.caughtPokemon]);

  const isAvatarUnlocked = (avatarOpt: AvatarOption): boolean => {
    if (!avatarOpt.gymLeaderId) {
      return true; 
    }
    const leader = GYM_LEADERS.find(gl => gl.id === avatarOpt.gymLeaderId);
    if (!leader) {
      return false; 
    }
    return leader.pokemon.every(p => caughtPokemonIdsSet.has(p.id));
  };


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
    const result = await loadProfileFromCloud(); 
    setCloudMessage({ text: result.message, type: result.success ? 'success' : 'error' });
    setIsLoadingCloud(false);
    setTimeout(() => setCloudMessage(null), 5000);
  };
  
  const handleAvatarSelectionInModal = (avatarOpt: AvatarOption) => {
    if (isAvatarUnlocked(avatarOpt)) {
      selectAvatar(avatarOpt.id);
      setIsAvatarModalOpen(false); 
    }
  };


  return (
    <div className="space-y-8 p-4 sm:p-6 md:p-8 bg-slate-900 min-h-screen">
      <header className="text-center mb-10">
         <div 
          className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-4 group cursor-pointer"
          onClick={() => setIsAvatarModalOpen(true)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsAvatarModalOpen(true)}
          role="button"
          tabIndex={0}
          aria-label="Mudar avatar"
          title="Mudar Avatar"
        >
          {currentSelectedAvatarDetails && (
              <img 
                  src={currentSelectedAvatarDetails.profileImageUrl} 
                  alt={`${currentSelectedAvatarDetails.name} Avatar`} 
                  className="w-full h-full object-contain rounded-lg bg-slate-700 p-1 shadow-lg transition-transform group-hover:scale-105"
                  loading="lazy"
              />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-300 rounded-lg">
            <EditIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-yellow-400">{username}</h1>
      </header>

      <Modal isOpen={isAvatarModalOpen} onClose={() => setIsAvatarModalOpen(false)} title="Escolha seu Avatar">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-2 max-h-[60vh] overflow-y-auto">
          {AVATAR_OPTIONS.map((avatarOpt) => {
            const unlocked = isAvatarUnlocked(avatarOpt);
            const isSelected = (avatarId || DEFAULT_AVATAR_ID) === avatarOpt.id;
            const leaderForAvatar = avatarOpt.gymLeaderId ? GYM_LEADERS.find(l => l.id === avatarOpt.gymLeaderId) : null;
            const unlockConditionText = leaderForAvatar ? `Requer Pokémon do Líder ${leaderForAvatar.name}` : 'Desbloqueado';

            let avatarClasses = `p-2 rounded-lg transition-all duration-200 ease-in-out transform relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 `;
            if (unlocked) {
              avatarClasses += `cursor-pointer hover:scale-105 ${isSelected ? 'ring-yellow-400 bg-slate-600' : 'bg-slate-700/80 hover:bg-slate-700 focus:ring-yellow-500'}`;
            } else {
              avatarClasses += `cursor-not-allowed bg-slate-600 focus:ring-slate-500`;
            }

            return (
              <div
                key={avatarOpt.id}
                onClick={() => unlocked && handleAvatarSelectionInModal(avatarOpt)}
                onKeyDown={(e) => unlocked && (e.key === 'Enter' || e.key === ' ') && handleAvatarSelectionInModal(avatarOpt)}
                role="button"
                tabIndex={unlocked ? 0 : -1}
                aria-pressed={isSelected}
                aria-label={`Selecionar avatar ${avatarOpt.name}${!unlocked ? ' (Bloqueado)' : ''}`}
                className={avatarClasses}
                title={!unlocked ? `${avatarOpt.name} (Bloqueado - ${unlockConditionText})` : avatarOpt.name}
              >
                <img
                  src={avatarOpt.profileImageUrl}
                  alt="" 
                  className={`w-24 h-24 object-contain rounded-md mx-auto ${!unlocked ? 'filter grayscale opacity-60' : ''}`}
                  loading="lazy"
                  width="96"
                  height="96"
                />
                <p className={`text-center text-xs mt-1 truncate ${isSelected && unlocked ? 'text-yellow-300 font-semibold' : 'text-slate-300'}`}>
                  {avatarOpt.name}
                </p>
                {!unlocked && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center bg-black bg-opacity-50 p-2 rounded-full">
                    <span className="text-xl" role="img" aria-label="Bloqueado">🔒</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button
            onClick={() => setIsAvatarModalOpen(false)}
            className="mt-6 w-full bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
            Fechar
        </button>
      </Modal>

      <section aria-labelledby="cloud-sync-heading" className="bg-slate-800 p-6 rounded-xl shadow-2xl">
        <h2 id="cloud-sync-heading" className="text-2xl sm:text-3xl font-semibold text-yellow-300 mb-4 text-center">Sincronizar</h2>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

        <section aria-labelledby="level-rewards-info-heading" className="bg-slate-800 p-6 rounded-xl shadow-2xl">
            <h2 id="level-rewards-info-heading" className="text-2xl sm:text-3xl font-semibold text-yellow-300 mb-4">Recompensas por Nível</h2>
            <ul className="space-y-2 text-slate-300 text-sm sm:text-base">
                <li><strong className="text-slate-100">Nível {MIN_LEVEL_FOR_BOOSTED_HABIT}:</strong> Desbloqueia <strong className="text-yellow-200">Hábito em Foco</strong>.</li>
                <li><strong className="text-slate-100">Nível {MIN_LEVEL_FOR_SHARED_HABITS}:</strong> Desbloqueia <strong className="text-yellow-200">Encrenca em Dobro</strong>.</li>
                <li><strong className="text-slate-100">Nível {MIN_LEVEL_FOR_PROGRESSION_L1}:</strong> Desbloqueia <strong className="text-yellow-200">Progressão de Hábitos</strong> (5 espaços).</li>
                <li className="italic text-slate-400 mt-2">Outras recompensas como Pokébolas e itens são concedidas ao alcançar novos níveis.</li>
            </ul>
        </section>
      </div>


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
          <h3 className="text-xl font-semibold text-yellow-400 mb-3">Inventário</h3>
          <ul className="space-y-2 text-slate-300">
            <li><strong className="text-slate-100">Poké Bolas:</strong> {pokeBalls}</li>
            <li><strong className="text-slate-100">Great Balls:</strong> {greatBalls}</li>
            <li><strong className="text-slate-100">Ultra Balls:</strong> {ultraBalls}</li>
            <li><strong className="text-slate-100">Master Balls:</strong> {masterBalls}</li>
            <li><strong className="text-slate-100">Task Coins:</strong> {taskCoins || 0} 🪙</li>
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
