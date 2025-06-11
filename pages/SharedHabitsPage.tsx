
import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import Modal from '../components/Modal';
import { SharedHabit } from '../types'; // Use full SharedHabit type
import { MIN_LEVEL_FOR_SHARED_HABITS, MAX_SHARED_HABITS_PER_PARTNER } from '../constants';

const SharedHabitsPage: React.FC = () => {
  const { 
    currentUser, 
    calculatePlayerLevelInfo,
    sendSharedHabitInvitation, 
    respondToSharedHabitInvitation, 
    completeSharedHabit,
    cancelSentSharedHabitRequest,
    sharedHabitsData, // Use this from context
    fetchSharedHabitsData, // Use this from context
    setToastMessage 
  } = useUser();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [inviteeUsername, setInviteeUsername] = useState('');
  const [newSharedHabitText, setNewSharedHabitText] = useState(''); // Renamed for clarity

  const playerLevel = currentUser ? calculatePlayerLevelInfo(currentUser.experiencePoints).level : 0;
  const canAccessSharedHabits = playerLevel >= MIN_LEVEL_FOR_SHARED_HABITS;

  useEffect(() => {
    if (currentUser && canAccessSharedHabits) {
      fetchSharedHabitsData(); // Fetch data when component mounts or user/access changes
    }
  }, [currentUser, canAccessSharedHabits, fetchSharedHabitsData]);

  const handleOpenAddModal = () => {
    setInviteeUsername('');
    setNewSharedHabitText('');
    setIsAddModalOpen(true);
  };

  const handleAddSharedHabit = async () => {
    if (!currentUser || !inviteeUsername.trim() || !newSharedHabitText.trim()) {
      setToastMessage("Por favor, preencha o nome do treinador e a descrição do hábito.", "error");
      return;
    }
    if (inviteeUsername.trim().toLowerCase() === currentUser.username.toLowerCase()) {
      setToastMessage("Você não pode criar um hábito compartilhado consigo mesmo.", "error");
      return;
    }

    const result = await sendSharedHabitInvitation(inviteeUsername.trim(), newSharedHabitText.trim());
    if (result.success) {
      setToastMessage(result.message || `Convite enviado para ${inviteeUsername}!`, 'success');
      setIsAddModalOpen(false);
      // fetchSharedHabitsData is called within sendSharedHabitInvitation on success
    } else {
      setToastMessage(result.message || "Falha ao enviar convite.", 'error');
    }
  };
  
  const handleRespond = async (invitationId: string, response: 'accept' | 'decline') => {
    const result = await respondToSharedHabitInvitation(invitationId, response);
    if (result.success) {
        setToastMessage(result.message || "Resposta enviada!", "success");
    } else {
        setToastMessage(result.message || "Falha ao enviar resposta.", "error");
    }
    // Data is refreshed within respondToSharedHabitInvitation
  };

  const handleComplete = async (sharedHabitId: string) => {
    // TODO: Open confirmation modal first
    const result = await completeSharedHabit(sharedHabitId);
     if (result.success) {
        setToastMessage(result.message || "Hábito marcado como completo!", "success");
    } else {
        setToastMessage(result.message || "Falha ao marcar hábito.", "error");
    }
    // Data is refreshed within completeSharedHabit
  };
  
  const handleCancelRequest = async (requestId: string) => {
    const result = await cancelSentSharedHabitRequest(requestId);
    if (result.success) {
        setToastMessage(result.message || "Convite cancelado.", "success");
    } else {
        setToastMessage(result.message || "Falha ao cancelar convite.", "error");
    }
    // Data is refreshed within cancelSentSharedHabitRequest
  };


  if (!currentUser) {
    return <p className="text-center text-xl py-10 text-yellow-400">Carregando...</p>;
  }

  if (!canAccessSharedHabits) {
    return (
      <div className="text-center py-10 px-6 bg-slate-800 rounded-lg shadow-xl">
        <img 
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/79.png" 
            alt="Slowpoke Confuso" 
            className="mx-auto mb-6 rounded-full w-40 h-40 object-cover border-4 border-slate-700 shadow-lg" 
        />
        <h1 className="text-2xl font-bold text-yellow-400 mb-3">Hábitos Compartilhados Bloqueados</h1>
        <p className="text-slate-300 text-lg">
          Você precisa alcançar o <strong className="text-white">Nível {MIN_LEVEL_FOR_SHARED_HABITS}</strong> para desbloquear os hábitos compartilhados.
        </p>
        <p className="text-slate-400 mt-2">Seu nível atual é: <strong className="text-white">{playerLevel}</strong>.</p>
        <p className="text-slate-400 mt-4">Continue completando seus hábitos pessoais para ganhar XP e subir de nível!</p>
      </div>
    );
  }
  
  if (sharedHabitsData.isLoading) {
    return <p className="text-center text-xl py-10 text-yellow-400 animate-pulse">Carregando seus hábitos compartilhados...</p>;
  }
  
  if (sharedHabitsData.error) {
    return (
        <div className="text-center py-10 bg-red-800 bg-opacity-50 p-6 rounded-lg">
            <p className="text-xl text-red-300">Erro ao carregar Hábitos Compartilhados</p>
            <p className="text-slate-400 mt-2">{sharedHabitsData.error}</p>
            <button 
                onClick={() => fetchSharedHabitsData()}
                className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold py-2 px-4 rounded"
            >
                Tentar Novamente
            </button>
        </div>
    );
  }


  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-yellow-400">Hábitos Compartilhados</h1>
            <p className="text-slate-300 text-base sm:text-lg mt-1">Colabore com outros treinadores e ganhem recompensas juntos!</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors w-full sm:w-auto"
          aria-label="Adicionar novo hábito compartilhado"
        >
          Adicionar Hábito Compartilhado
        </button>
      </header>
      
      <section aria-labelledby="active-shared-habits-heading">
        <h2 id="active-shared-habits-heading" className="text-2xl font-semibold text-yellow-300 mb-3">Minhas Colaborações Ativas</h2>
        {sharedHabitsData.active.length > 0 ? (
          <ul className="space-y-3">
            {sharedHabitsData.active.map(habit => {
              const partnerUsername = habit.creatorUsername === currentUser.username ? habit.inviteeUsername : habit.creatorUsername;
              const amICreator = habit.creatorUsername === currentUser.username;
              const myCompletionStatus = amICreator ? habit.creatorCompletedToday : habit.inviteeCompletedToday;
              const partnerCompletionStatus = amICreator ? habit.inviteeCompletedToday : habit.creatorCompletedToday;

              return (
              <li key={habit.id} className="bg-slate-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                <p className="text-slate-200 font-medium">{habit.habitText}</p>
                <p className="text-sm text-slate-400">Com: <span className="font-semibold text-yellow-200">{partnerUsername}</span></p>
                <div className="mt-2 text-xs">
                    <p className={myCompletionStatus ? "text-green-400" : "text-slate-400"}>Sua conclusão hoje: {myCompletionStatus ? "Sim" : "Não"}</p>
                    <p className={partnerCompletionStatus ? "text-green-400" : "text-slate-400"}>Conclusão de {partnerUsername} hoje: {partnerCompletionStatus ? "Sim" : "Não"}</p>
                </div>
                 <button 
                    onClick={() => handleComplete(habit.id)}
                    className="mt-2 text-xs bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded disabled:opacity-50"
                    disabled={myCompletionStatus}
                    aria-label={`Marcar hábito '${habit.habitText}' como feito`}
                >
                    {myCompletionStatus ? "Feito Hoje!" : "Marcar como Feito"}
                </button>
                 <p className="text-xs text-slate-500 mt-1">Sequência com {partnerUsername}: {currentUser?.sharedHabitStreaks[partnerUsername] || 0} dias</p>
              </li>
            );
            })}
          </ul>
        ) : (
          <p className="text-slate-400 italic">Nenhum hábito compartilhado ativo no momento.</p>
        )}
      </section>

      <section aria-labelledby="pending-invitations-heading">
        <h2 id="pending-invitations-heading" className="text-2xl font-semibold text-yellow-300 mb-3">Convites Pendentes</h2>
        {sharedHabitsData.pendingInvitationsReceived.length > 0 ? (
          <ul className="space-y-3">
            {sharedHabitsData.pendingInvitationsReceived.map(invite => (
              <li key={invite.id} className="bg-slate-800 p-4 rounded-lg shadow">
                <p className="text-slate-200">{invite.habitText}</p>
                <p className="text-sm text-slate-400">De: <span className="font-semibold text-yellow-200">{invite.creatorUsername}</span></p>
                <div className="mt-2 space-x-2">
                  <button 
                    onClick={() => handleRespond(invite.id, 'accept')}
                    className="text-xs bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded"
                    aria-label={`Aceitar convite de ${invite.creatorUsername} para o hábito ${invite.habitText}`}
                    >
                    Aceitar
                  </button>
                  <button 
                    onClick={() => handleRespond(invite.id, 'decline')}
                    className="text-xs bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded"
                    aria-label={`Recusar convite de ${invite.creatorUsername} para o hábito ${invite.habitText}`}
                    >
                    Recusar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-400 italic">Nenhum convite pendente.</p>
        )}
      </section>

      <section aria-labelledby="sent-requests-heading">
        <h2 id="sent-requests-heading" className="text-2xl font-semibold text-yellow-300 mb-3">Convites Enviados</h2>
        {sharedHabitsData.pendingInvitationsSent.length > 0 ? (
          <ul className="space-y-3">
            {sharedHabitsData.pendingInvitationsSent.map(request => (
              <li key={request.id} className="bg-slate-800 p-4 rounded-lg shadow">
                <p className="text-slate-200">{request.habitText}</p>
                <p className="text-sm text-slate-400">Para: <span className="font-semibold text-yellow-200">{request.inviteeUsername}</span> (Aguardando resposta)</p>
                 <button 
                    onClick={() => handleCancelRequest(request.id)}
                    className="mt-2 text-xs bg-gray-500 hover:bg-gray-600 text-white py-1 px-3 rounded"
                    aria-label={`Cancelar convite enviado para ${request.inviteeUsername} sobre o hábito ${request.habitText}`}
                    >
                    Cancelar Convite
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-400 italic">Nenhum convite enviado pendente.</p>
        )}
      </section>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Convidar para Hábito Compartilhado">
        <form onSubmit={(e) => { e.preventDefault(); handleAddSharedHabit(); }} className="space-y-4">
          <div>
            <label htmlFor="inviteeUsername" className="block text-sm font-medium text-slate-300 mb-1">
              Nome do Treinador a Convidar:
            </label>
            <input
              type="text"
              id="inviteeUsername"
              value={inviteeUsername}
              onChange={(e) => setInviteeUsername(e.target.value)}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:ring-yellow-500 focus:border-yellow-500"
              placeholder="Ex: AshKetchum123"
              required
            />
          </div>
          <div>
            <label htmlFor="habitText" className="block text-sm font-medium text-slate-300 mb-1">
              Descrição do Hábito:
            </label>
            <input
              type="text"
              id="habitText"
              value={newSharedHabitText}
              onChange={(e) => setNewSharedHabitText(e.target.value)}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:ring-yellow-500 focus:border-yellow-500"
              placeholder="Ex: Treinar Pokémon por 30 minutos"
              required
              maxLength={100}
            />
             <p className="text-xs text-slate-400 mt-1">Máximo de {MAX_SHARED_HABITS_PER_PARTNER} hábito compartilhado por dupla de treinadores.</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="py-2 px-4 bg-slate-600 hover:bg-slate-500 text-white rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
            >
              Enviar Convite
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default SharedHabitsPage;
