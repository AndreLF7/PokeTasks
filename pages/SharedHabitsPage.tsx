
import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import Modal from '../components/Modal';
import { SharedHabitDisplayInfo, SharedHabit } from '../types';
import { MIN_LEVEL_FOR_SHARED_HABITS, MAX_SHARED_HABITS_PER_PARTNER } from '../constants';

const SharedHabitsPage: React.FC = () => {
  const { 
    currentUser, 
    calculatePlayerLevelInfo,
    // Placeholder functions - will be implemented later
    // sendSharedHabitInvitation, 
    // respondToSharedHabitInvitation, 
    // completeSharedHabit,
    // cancelSentSharedHabitRequest,
    // sharedHabitsData, // This will hold active, pending, sent habits
    setToastMessage 
  } = useUser();

  const [isLoading, setIsLoading] = useState(true); // For initial data load
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [inviteeUsername, setInviteeUsername] = useState('');
  const [habitText, setHabitText] = useState('');
  
  // Example state structure - this will be populated from sharedHabitsData from context
  const [activeSharedHabits, setActiveSharedHabits] = useState<SharedHabitDisplayInfo[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<SharedHabitDisplayInfo[]>([]);
  const [sentRequests, setSentRequests] = useState<SharedHabitDisplayInfo[]>([]);


  const playerLevel = currentUser ? calculatePlayerLevelInfo(currentUser.experiencePoints).level : 0;
  const canAccessSharedHabits = playerLevel >= MIN_LEVEL_FOR_SHARED_HABITS;

  useEffect(() => {
    if (!currentUser || !canAccessSharedHabits) {
      setIsLoading(false);
      return;
    }
    // TODO: Fetch shared habits data when context provides it
    // For now, simulate loading
    const timer = setTimeout(() => {
        // Example Data (replace with actual data from context later)
        // setActiveSharedHabits([
        //   { id: 'sh1', partnerUsername: 'AshTest', habitText: 'Correr 5km juntos', status: 'active', isCurrentUserCreator: true},
        // ]);
        // setPendingInvitations([
        //   { id: 'sh2', partnerUsername: 'MistyTest', habitText: 'Estudar TypeScript por 1h', status: 'pending_invitee_approval', isCurrentUserCreator: false },
        // ]);
        // setSentRequests([
        //    { id: 'sh3', partnerUsername: 'BrockTest', habitText: 'Cozinhar uma refeição saudável', status: 'pending_invitee_approval', isCurrentUserCreator: true },
        // ]);
        setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [currentUser, canAccessSharedHabits]);

  const handleOpenAddModal = () => {
    setInviteeUsername('');
    setHabitText('');
    setIsAddModalOpen(true);
  };

  const handleAddSharedHabit = async () => {
    if (!currentUser || !inviteeUsername.trim() || !habitText.trim()) {
      setToastMessage("Por favor, preencha o nome do treinador e a descrição do hábito.", "error");
      return;
    }
    if (inviteeUsername.trim().toLowerCase() === currentUser.username.toLowerCase()) {
      setToastMessage("Você não pode criar um hábito compartilhado consigo mesmo.", "error");
      return;
    }

    // TODO: Implement API call via context: sendSharedHabitInvitation(inviteeUsername, habitText)
    console.log(`Tentando convidar ${inviteeUsername} para o hábito: ${habitText}`);
    // Simulating API call
    // const result = await sendSharedHabitInvitation(inviteeUsername.trim(), habitText.trim());
    // if (result.success) {
    //   setToastMessage(`Convite enviado para ${inviteeUsername}!`, 'success');
    //   setIsAddModalOpen(false);
    //   // Refresh shared habits data
    // } else {
    //   setToastMessage(result.message || "Falha ao enviar convite.", 'error');
    // }
    setToastMessage(`Funcionalidade de convite ainda não implementada. Tentativa de convidar ${inviteeUsername}.`, 'info');
    setIsAddModalOpen(false); // Close modal for now
  };
  
  const handleRespondToInvitation = async (invitationId: string, response: 'accept' | 'decline') => {
    // TODO: Call context: respondToSharedHabitInvitation(invitationId, response)
    console.log(`Respondendo ao convite ${invitationId} com ${response}`);
    setToastMessage(`Funcionalidade de resposta ainda não implementada. Resposta: ${response}`, 'info');
    // Refresh data
  };

  const handleCompleteSharedHabit = async (sharedHabitId: string) => {
    // TODO: Call context: completeSharedHabit(sharedHabitId)
    // This will require a confirmation modal similar to personal habits
    console.log(`Completando hábito compartilhado ${sharedHabitId}`);
    setToastMessage('Funcionalidade de completar hábito compartilhado ainda não implementada.', 'info');
    // Refresh data
  };
  
  const handleCancelSentRequest = async (requestId: string) => {
    // TODO: Call context: cancelSentSharedHabitRequest(requestId)
    console.log(`Cancelando convite enviado ${requestId}`);
    setToastMessage('Funcionalidade de cancelar convite enviado ainda não implementada.', 'info');
    // Refresh data
  };


  if (!currentUser) {
    return <p className="text-center text-xl py-10 text-yellow-400">Carregando...</p>;
  }

  if (!canAccessSharedHabits) {
    return (
      <div className="text-center py-10 px-6 bg-slate-800 rounded-lg shadow-xl">
        <img 
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/79.png" // Slowpoke
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
  
  if (isLoading) {
    return <p className="text-center text-xl py-10 text-yellow-400 animate-pulse">Carregando seus hábitos compartilhados...</p>;
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
      
      {/* Active Shared Habits */}
      <section aria-labelledby="active-shared-habits-heading">
        <h2 id="active-shared-habits-heading" className="text-2xl font-semibold text-yellow-300 mb-3">Minhas Colaborações Ativas</h2>
        {activeSharedHabits.length > 0 ? (
          <ul className="space-y-3">
            {activeSharedHabits.map(habit => (
              <li key={habit.id} className="bg-slate-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                <p className="text-slate-200 font-medium">{habit.habitText}</p>
                <p className="text-sm text-slate-400">Com: <span className="font-semibold text-yellow-200">{habit.partnerUsername}</span></p>
                {/* TODO: Add completion status display and complete button */}
                 <p className="text-xs text-slate-500 mt-1">Sua conclusão: {currentUser?.username === habit.partnerUsername ? "N/A (Invited)" : "Pendente"}</p>
                 <p className="text-xs text-slate-500">Conclusão de {habit.partnerUsername}: Pendente</p>
                 <button 
                    onClick={() => handleCompleteSharedHabit(habit.id)}
                    className="mt-2 text-xs bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded disabled:opacity-50"
                    disabled={false /* TODO: Logic to disable if already completed by current user */}
                >
                    Marcar como Feito
                </button>
                 <p className="text-xs text-slate-500 mt-1">Sequência com {habit.partnerUsername}: {currentUser?.sharedHabitStreaks[habit.partnerUsername] || 0} dias</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-400 italic">Nenhum hábito compartilhado ativo no momento.</p>
        )}
      </section>

      {/* Pending Invitations (Received) */}
      <section aria-labelledby="pending-invitations-heading">
        <h2 id="pending-invitations-heading" className="text-2xl font-semibold text-yellow-300 mb-3">Convites Pendentes</h2>
        {pendingInvitations.length > 0 ? (
          <ul className="space-y-3">
            {pendingInvitations.map(invite => (
              <li key={invite.id} className="bg-slate-800 p-4 rounded-lg shadow">
                <p className="text-slate-200">{invite.habitText}</p>
                <p className="text-sm text-slate-400">De: <span className="font-semibold text-yellow-200">{invite.partnerUsername}</span></p>
                <div className="mt-2 space-x-2">
                  <button 
                    onClick={() => handleRespondToInvitation(invite.id, 'accept')}
                    className="text-xs bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded"
                    aria-label={`Aceitar convite de ${invite.partnerUsername} para o hábito ${invite.habitText}`}
                    >
                    Aceitar
                  </button>
                  <button 
                    onClick={() => handleRespondToInvitation(invite.id, 'decline')}
                    className="text-xs bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded"
                    aria-label={`Recusar convite de ${invite.partnerUsername} para o hábito ${invite.habitText}`}
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

      {/* Sent Requests (Pending Invitee Approval) */}
      <section aria-labelledby="sent-requests-heading">
        <h2 id="sent-requests-heading" className="text-2xl font-semibold text-yellow-300 mb-3">Convites Enviados</h2>
        {sentRequests.length > 0 ? (
          <ul className="space-y-3">
            {sentRequests.map(request => (
              <li key={request.id} className="bg-slate-800 p-4 rounded-lg shadow">
                <p className="text-slate-200">{request.habitText}</p>
                <p className="text-sm text-slate-400">Para: <span className="font-semibold text-yellow-200">{request.partnerUsername}</span> (Aguardando resposta)</p>
                 <button 
                    onClick={() => handleCancelSentRequest(request.id)}
                    className="mt-2 text-xs bg-gray-500 hover:bg-gray-600 text-white py-1 px-3 rounded"
                    aria-label={`Cancelar convite enviado para ${request.partnerUsername} sobre o hábito ${request.habitText}`}
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

      {/* Add Shared Habit Modal */}
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
              value={habitText}
              onChange={(e) => setHabitText(e.target.value)}
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
