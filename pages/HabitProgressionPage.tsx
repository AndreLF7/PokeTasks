
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { Habit, ProgressionHabit } from '../types';
import Modal from '../components/Modal';
import { MIN_LEVEL_FOR_PROGRESSION_L1, MIN_LEVEL_FOR_PROGRESSION_L2, PROGRESSION_SLOTS_L1, PROGRESSION_SLOTS_L2 } from '../constants';

interface ProgressionHabitItemProps {
  progressionHabit: ProgressionHabit;
  mainHabitText: string;
  onAttemptComplete: (progressionHabitId: string) => void;
  onDelete: (progressionHabitId: string) => void;
}

const ProgressionHabitItem: React.FC<ProgressionHabitItemProps> = ({
  progressionHabit,
  mainHabitText,
  onAttemptComplete,
  onDelete,
}) => {
  const handleCheckboxChange = () => {
    if (!progressionHabit.completedToday) {
      onAttemptComplete(progressionHabit.id);
    }
  };

  return (
    <li className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-800 p-4 rounded-lg shadow hover:shadow-md transition-all duration-200 border border-purple-700">
      <div className="flex items-center flex-grow mb-2 sm:mb-0">
        <input
          type="checkbox"
          id={`progression-habit-${progressionHabit.id}`}
          checked={progressionHabit.completedToday}
          onChange={handleCheckboxChange}
          disabled={progressionHabit.completedToday}
          className={`h-6 w-6 text-purple-500 bg-slate-700 border-slate-600 rounded focus:ring-purple-500 focus:ring-offset-slate-800 ${progressionHabit.completedToday ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          aria-labelledby={`progression-habit-label-${progressionHabit.id}`}
        />
        <div className="ml-3 flex-grow">
            <label
            id={`progression-habit-label-${progressionHabit.id}`}
            htmlFor={`progression-habit-${progressionHabit.id}`}
            className={`text-lg ${progressionHabit.completedToday ? 'line-through text-slate-500 cursor-not-allowed' : 'text-slate-200 cursor-pointer'}`}
            >
            {progressionHabit.text}
            </label>
            <p className="text-xs text-slate-400 mt-1">
                Progressão de: <span className="italic">{mainHabitText}</span>
            </p>
        </div>
      </div>
      <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
        <button
          onClick={() => onDelete(progressionHabit.id)}
          className="text-red-500 hover:text-red-400 font-semibold py-1 px-3 rounded-md hover:bg-red-500 hover:bg-opacity-20 transition-colors"
          title="Excluir hábito de progressão"
        >
          ✕
        </button>
      </div>
    </li>
  );
};


const HabitProgressionPage: React.FC = () => {
  const { 
    currentUser, 
    addProgressionHabit, 
    confirmProgressionHabitCompletion, 
    deleteProgressionHabit,
    calculatePlayerLevelInfo,
    calculateMaxProgressionSlots,
    setToastMessage
  } = useUser();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMainHabitId, setSelectedMainHabitId] = useState<string>('');
  const [newProgressionText, setNewProgressionText] = useState('');
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [progressionHabitToConfirmId, setProgressionHabitToConfirmId] = useState<string | null>(null);

  if (!currentUser) return <p className="text-center text-xl py-10 text-yellow-400">Carregando...</p>;

  const playerLevel = calculatePlayerLevelInfo(currentUser.experiencePoints).level;
  const maxSlots = calculateMaxProgressionSlots(playerLevel);

  if (playerLevel < MIN_LEVEL_FOR_PROGRESSION_L1) {
    return (
      <div className="text-center py-10 px-6 bg-slate-800 rounded-lg shadow-xl">
        <h1 className="text-2xl font-bold text-yellow-400 mb-3">Progressão de Hábitos Bloqueada</h1>
        <p className="text-slate-300 text-lg">
          Você precisa alcançar o Nível {MIN_LEVEL_FOR_PROGRESSION_L1} para desbloquear esta funcionalidade.
        </p>
        <p className="text-slate-400 mt-2">Seu nível atual é: {playerLevel}.</p>
        <Link to="/" className="mt-6 inline-block bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-2 px-6 rounded-lg">
            Voltar para Hábitos
        </Link>
      </div>
    );
  }

  const handleOpenAddModal = () => {
    if (currentUser.progressionHabits.length >= maxSlots) {
        setToastMessage(`Você já usou todos os ${maxSlots} espaços de progressão disponíveis para o seu nível.`, "error");
        return;
    }
    if (currentUser.habits.length === 0) {
        setToastMessage("Você precisa ter hábitos principais antes de adicionar progressões.", "error");
        return;
    }
    setSelectedMainHabitId(currentUser.habits[0]?.id || '');
    setNewProgressionText('');
    setIsAddModalOpen(true);
  };

  const handleAddProgression = () => {
    if (!selectedMainHabitId || !newProgressionText.trim()) {
      setToastMessage("Por favor, selecione um hábito principal e descreva a progressão.", "error");
      return;
    }
    addProgressionHabit(selectedMainHabitId, newProgressionText.trim());
    setIsAddModalOpen(false);
  };
  
  const openConfirmModal = (id: string) => {
    setProgressionHabitToConfirmId(id);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmAction = () => {
    if (progressionHabitToConfirmId) {
      confirmProgressionHabitCompletion(progressionHabitToConfirmId);
    }
    setIsConfirmModalOpen(false);
    setProgressionHabitToConfirmId(null);
  };

  const handleCancelConfirmation = () => {
    setIsConfirmModalOpen(false);
    setProgressionHabitToConfirmId(null);
  };

  const getMainHabitText = (mainHabitId: string): string => {
    const mainHabit = currentUser.habits.find(h => h.id === mainHabitId);
    return mainHabit ? mainHabit.text : "Hábito Principal Removido";
  };
  
  const slotsLevelText = playerLevel < MIN_LEVEL_FOR_PROGRESSION_L2 
    ? ` (Próximo aumento no Nível ${MIN_LEVEL_FOR_PROGRESSION_L2} para ${PROGRESSION_SLOTS_L2} espaços)` 
    : '';


  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-purple-400">Progressão de Hábitos</h1>
          <p className="text-slate-300 text-base sm:text-lg mt-1">
            Defina metas avançadas para seus hábitos existentes. Concluí-las também conta para suas metas diárias e XP!
          </p>
          <p className="text-slate-400 text-sm mt-1">
            Espaços de Progressão: <span className="font-semibold text-white">{currentUser.progressionHabits.length} / {maxSlots}</span>{slotsLevelText}
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          disabled={currentUser.progressionHabits.length >= maxSlots || currentUser.habits.length === 0}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          aria-label="Adicionar novo hábito de progressão"
        >
          Adicionar Progressão
        </button>
      </header>

      {currentUser.progressionHabits.length > 0 ? (
        <ul className="space-y-3">
          {currentUser.progressionHabits.map(ph => (
            <ProgressionHabitItem
              key={ph.id}
              progressionHabit={ph}
              mainHabitText={getMainHabitText(ph.mainHabitId)}
              onAttemptComplete={openConfirmModal}
              onDelete={deleteProgressionHabit}
            />
          ))}
        </ul>
      ) : (
        <div className="text-center py-10 px-6 bg-slate-800 rounded-lg shadow">
          <img 
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/360.png" // Wynaut looking thoughtful
            alt="Wynaut Pensativo" 
            className="mx-auto mb-4 rounded-md w-40 h-auto filter grayscale opacity-70" />
          <p className="text-xl text-slate-400">Nenhum hábito de progressão adicionado.</p>
          <p className="text-slate-500">Clique em "Adicionar Progressão" para começar!</p>
        </div>
      )}
      
      <div className="mt-8 text-center">
        <Link
            to="/"
            className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-2 px-6 rounded-lg transition-colors"
        >
            &larr; Voltar para Hábitos Principais
        </Link>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Adicionar Hábito de Progressão">
        <form onSubmit={(e) => { e.preventDefault(); handleAddProgression(); }} className="space-y-4">
          <div>
            <label htmlFor="mainHabitId" className="block text-sm font-medium text-slate-300 mb-1">
              Hábito Principal para Progredir:
            </label>
            <select
              id="mainHabitId"
              value={selectedMainHabitId}
              onChange={(e) => setSelectedMainHabitId(e.target.value)}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:ring-purple-500 focus:border-purple-500"
              required
            >
              {currentUser.habits.map(habit => (
                <option key={habit.id} value={habit.id}>{habit.text}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="progressionText" className="block text-sm font-medium text-slate-300 mb-1">
              Texto da Progressão:
            </label>
            <input
              type="text"
              id="progressionText"
              value={newProgressionText}
              onChange={(e) => setNewProgressionText(e.target.value)}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Ex: Ler por 30 minutos"
              required
              maxLength={100}
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
              className="py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
            >
              Adicionar
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isConfirmModalOpen} onClose={handleCancelConfirmation} title="Confirmar Progressão">
        <div className="text-center">
          <p className="text-lg text-slate-300 mb-6">
            Confirmar conclusão? Isto contará para suas metas diárias.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={handleConfirmAction}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Confirmar
            </button>
            <button
              onClick={handleCancelConfirmation}
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

export default HabitProgressionPage;
