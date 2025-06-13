
import React from 'react';
import { Habit } from '../types';

interface HabitItemProps {
  habit: Habit;
  onAttemptComplete: (habitId: string) => void;
  onDelete: (habitId: string) => void;
  isBoosted: boolean;
  canBoost: boolean;
  onToggleBoost: (habitId: string) => void;
  isAnyHabitBoosted: boolean; 
}

const HabitItem: React.FC<HabitItemProps> = ({ 
  habit, 
  onAttemptComplete, 
  onDelete,
  isBoosted,
  canBoost,
  onToggleBoost,
  isAnyHabitBoosted
}) => {
  const handleCheckboxChange = () => {
    if (!habit.completedToday) {
      onAttemptComplete(habit.id);
    }
  };

  const isFocoButtonDisabled = canBoost && isAnyHabitBoosted && !isBoosted;

  return (
    <li className={`flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-800 p-4 rounded-lg shadow hover:shadow-md transition-all duration-200 ${isBoosted ? 'border-2 border-yellow-400 ring-2 ring-yellow-400 ring-opacity-50' : ''}`}>
      <div className="flex items-center flex-grow mb-2 sm:mb-0">
        <input
          type="checkbox"
          id={`habit-${habit.id}`}
          checked={habit.completedToday}
          onChange={handleCheckboxChange}
          disabled={habit.completedToday}
          className={`h-6 w-6 text-yellow-500 bg-slate-700 border-slate-600 rounded focus:ring-yellow-500 focus:ring-offset-slate-800 ${habit.completedToday ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          aria-labelledby={`habit-label-${habit.id}`}
        />
        <label
          id={`habit-label-${habit.id}`}
          htmlFor={`habit-${habit.id}`}
          className={`ml-3 text-lg flex-grow ${habit.completedToday ? 'line-through text-slate-500 cursor-not-allowed' : 'text-slate-200 cursor-pointer'}`}
        >
          {habit.text}
          {isBoosted && <span className="ml-2 text-yellow-400" title="Hábito em Foco!">✨</span>}
        </label>
      </div>
      <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
        {canBoost && (
          <button
            onClick={() => onToggleBoost(habit.id)}
            disabled={isFocoButtonDisabled}
            className={`text-xs font-semibold py-1 px-2 rounded transition-colors
              ${isBoosted ? 'bg-yellow-500 hover:bg-yellow-600 text-slate-900' : 'bg-blue-500 hover:bg-blue-600 text-white'}
              ${isFocoButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title={isBoosted ? "Remover Foco deste hábito" : (isFocoButtonDisabled ? "Outro hábito já está em foco" : "Colocar este hábito em Foco")}
            aria-pressed={isBoosted}
          >
            {isBoosted ? 'Em Foco ✨' : 'Foco'}
          </button>
        )}
        <button
          onClick={() => onDelete(habit.id)}
          className="text-red-500 hover:text-red-400 font-semibold py-1 px-3 rounded-md hover:bg-red-500 hover:bg-opacity-20 transition-colors"
          title="Excluir hábito"
        >
          ✕
        </button>
      </div>
    </li>
  );
};

export default HabitItem;
