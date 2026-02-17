
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { PeriodicHabit, PeriodicHabitType } from '../types';
import Modal from '../components/Modal';
import { MIN_LEVEL_FOR_PERIODIC_HABITS, MAX_PERIODIC_HABITS_PER_TYPE } from '../constants';

interface PeriodicHabitItemProps {
  habit: PeriodicHabit;
  onComplete: (habitId: string) => void;
  onDelete: (habitId: string) => void;
  isCompleting: boolean;
}

const PeriodicHabitItem: React.FC<PeriodicHabitItemProps> = ({ habit, onComplete, onDelete, isCompleting }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete(habit.id);
    setShowDeleteConfirm(false);
  };

  return (
    <li className={`p-4 rounded-lg shadow-md transition-all duration-200 border ${habit.isCompleted ? 'bg-green-800 border-green-700' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="flex-grow mb-3 sm:mb-0">
          <p className={`text-lg ${habit.isCompleted ? 'text-slate-400 line-through' : 'text-slate-100'}`}>{habit.text}</p>
          <p className="text-xs text-slate-500 mt-1">
            Adicionado em: {new Date(habit.createdAt).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center space-x-2 self-end sm:self-center">
          {!habit.isCompleted && (
            <button
              onClick={() => onComplete(habit.id)}
              disabled={isCompleting}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1.5 px-3 rounded-md text-sm transition-colors disabled:opacity-60"
              aria-label={`Completar hábito ${habit.text}`}
            >
              {isCompleting ? 'Completando...' : 'Completar'}
            </button>
          )}
          {habit.isCompleted && (
             <span className="text-green-300 font-semibold text-sm py-1.5 px-3">Concluído!</span>
          )}
          <button
            onClick={handleDeleteClick}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1.5 px-3 rounded-md text-sm transition-colors"
            aria-label={`Excluir hábito ${habit.text}`}
          >
            Excluir
          </button>
        </div>
      </div>
      {showDeleteConfirm && (
        <div className="mt-3 p-3 bg-slate-700 rounded-md text-center">
          <p className="text-sm text-slate-300 mb-2">Tem certeza que quer excluir este hábito?</p>
          <button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-2 rounded mr-2">Sim, Excluir</button>
          <button onClick={() => setShowDeleteConfirm(false)} className="bg-slate-500 hover:bg-slate-400 text-white text-xs py-1 px-2 rounded">Não</button>
        </div>
      )}
    </li>
  );
};

const PeriodicHabitsPage: React.FC = () => {
  const { 
    currentUser, 
    calculatePlayerLevelInfo, 
    addPeriodicHabit, 
    completePeriodicHabit, 
    deletePeriodicHabit,
    getStartOfCurrentPeriod,
    setToastMessage 
  } = useUser();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newHabitText, setNewHabitText] = useState('');
  const [currentPeriodTypeToAdd, setCurrentPeriodTypeToAdd] = useState<PeriodicHabitType | null>(null);
  const [isCompleting, setIsCompleting] = useState(false); // To prevent double clicks

  if (!currentUser) return <p className="text-center text-xl py-10 text-yellow-400">Carregando...</p>;

  const playerLevel = calculatePlayerLevelInfo(currentUser.experiencePoints).level;

  if (playerLevel < MIN_LEVEL_FOR_PERIODIC_HABITS) {
    return (
      <div className="text-center py-10 px-6 bg-slate-800 rounded-lg shadow-xl">
        <img 
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/54.png" // Psyduck
            alt="Psyduck Confuso" 
            className="mx-auto mb-6 rounded-full w-40 h-40 object-cover border-4 border-slate-700 shadow-lg" 
        />
        <h1 className="text-2xl font-bold text-yellow-400 mb-3">Hábitos Periódicos Bloqueados</h1>
        <p className="text-slate-300 text-lg">
          Você precisa alcançar o <strong className="text-white">Nível {MIN_LEVEL_FOR_PERIODIC_HABITS}</strong> para desbloquear esta funcionalidade.
        </p>
        <p className="text-slate-400 mt-2">Seu nível atual é: <strong className="text-white">{playerLevel}</strong>.</p>
        <Link to="/" className="mt-6 inline-block bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-2 px-6 rounded-lg">
            Voltar para Hábitos Diários
        </Link>
      </div>
    );
  }

  const openAddModal = (period: PeriodicHabitType) => {
    const existingCount = currentUser.periodicHabits.filter(h => h.period === period).length;
    if (existingCount >= MAX_PERIODIC_HABITS_PER_TYPE) {
      setToastMessage(`Você já atingiu o limite de ${MAX_PERIODIC_HABITS_PER_TYPE} hábitos para este período.`, 'error');
      return;
    }
    setCurrentPeriodTypeToAdd(period);
    setNewHabitText('');
    setIsAddModalOpen(true);
  };

  const handleAddHabit = () => {
    if (!newHabitText.trim() || !currentPeriodTypeToAdd) {
      setToastMessage("Por favor, insira a descrição do hábito.", 'error');
      return;
    }
    addPeriodicHabit(newHabitText, currentPeriodTypeToAdd);
    setIsAddModalOpen(false);
    setCurrentPeriodTypeToAdd(null);
  };
  
  const handleCompleteHabit = async (habitId: string) => {
    setIsCompleting(true);
    completePeriodicHabit(habitId); // This now handles toast internally for success
    // No need for separate toast here unless for specific error cases not covered by context
    setIsCompleting(false);
  };

  const getNextResetDateInfo = (period: PeriodicHabitType): string => {
    const todayUtc = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
    let nextResetDate = getStartOfCurrentPeriod(todayUtc, period);

    switch (period) {
        case 'weekly':
            nextResetDate.setUTCDate(nextResetDate.getUTCDate() + 7);
            return `Próximo reset em: ${nextResetDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}`;
        case 'monthly':
            nextResetDate.setUTCMonth(nextResetDate.getUTCMonth() + 1);
            nextResetDate.setUTCDate(1);
            return `Próximo reset em: ${nextResetDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}`;
        case 'annual':
            nextResetDate.setUTCFullYear(nextResetDate.getUTCFullYear() + 1);
            nextResetDate.setUTCMonth(0);
            nextResetDate.setUTCDate(1);
            return `Próximo reset em: ${nextResetDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`;
        default:
            return '';
    }
  };


  const renderHabitSection = (title: string, period: PeriodicHabitType, habits: PeriodicHabit[]) => {
    const canAddMore = habits.length < MAX_PERIODIC_HABITS_PER_TYPE;
    return (
      <section className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-yellow-300">{title}</h2>
          <button
            onClick={() => openAddModal(period)}
            disabled={!canAddMore}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1.5 px-3 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Adicionar ${title.toLowerCase()}`}
          >
            Adicionar Hábito
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-3">{getNextResetDateInfo(period)} ({habits.length}/{MAX_PERIODIC_HABITS_PER_TYPE} usados)</p>
        {habits.length > 0 ? (
          <ul className="space-y-3">
            {habits.map(h => (
              <PeriodicHabitItem 
                key={h.id} 
                habit={h} 
                onComplete={handleCompleteHabit}
                onDelete={deletePeriodicHabit}
                isCompleting={isCompleting}
              />
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 italic">Nenhum hábito {title.toLowerCase().split(' ')[0]} adicionado.</p>
        )}
      </section>
    );
  };

  const weeklyHabits = useMemo(() => currentUser.periodicHabits.filter(h => h.period === 'weekly'), [currentUser.periodicHabits]);
  const monthlyHabits = useMemo(() => currentUser.periodicHabits.filter(h => h.period === 'monthly'), [currentUser.periodicHabits]);
  const annualHabits = useMemo(() => currentUser.periodicHabits.filter(h => h.period === 'annual'), [currentUser.periodicHabits]);

  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-yellow-400">Hábitos Periódicos</h1>
        <p className="text-slate-300 text-base sm:text-lg mt-1">
          Defina e acompanhe seus objetivos de longo prazo. Completá-los rende Task Coins e XP!
        </p>
      </header>

      {renderHabitSection("Hábitos Semanais", 'weekly', weeklyHabits)}
      {renderHabitSection("Hábitos Mensais", 'monthly', monthlyHabits)}
      {renderHabitSection("Hábitos Anuais", 'annual', annualHabits)}

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={`Adicionar Hábito ${currentPeriodTypeToAdd === 'weekly' ? 'Semanal' : currentPeriodTypeToAdd === 'monthly' ? 'Mensal' : 'Anual'}`}>
        <form onSubmit={(e) => { e.preventDefault(); handleAddHabit(); }} className="space-y-4">
          <div>
            <label htmlFor="newHabitText" className="block text-sm font-medium text-slate-300 mb-1">
              Descrição do Hábito:
            </label>
            <input
              type="text"
              id="newHabitText"
              value={newHabitText}
              onChange={(e) => setNewHabitText(e.target.value)}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:ring-yellow-500 focus:border-yellow-500"
              placeholder="Ex: Ler um capítulo de livro"
              maxLength={150}
              required
            />
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
              Adicionar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PeriodicHabitsPage;
