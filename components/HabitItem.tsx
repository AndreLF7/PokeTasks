
import React from 'react';
import { Habit } from '../types';
// Removed useUser import as direct context usage is shifted to parent (HabitsPage)

interface HabitItemProps {
  habit: Habit;
  onAttemptComplete: (habitId: string) => void; // Callback to open confirmation modal
  onDelete: (habitId: string) => void; // Callback for deleting
}

const HabitItem: React.FC<HabitItemProps> = ({ habit, onAttemptComplete, onDelete }) => {
  const handleCheckboxChange = () => {
    if (!habit.completedToday) {
      onAttemptComplete(habit.id);
    }
  };

  return (
    <li className="flex items-center justify-between bg-slate-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <input
          type="checkbox"
          id={`habit-${habit.id}`}
          checked={habit.completedToday}
          onChange={handleCheckboxChange}
          disabled={habit.completedToday} // Disable checkbox if habit is confirmed completed
          className={`h-6 w-6 text-yellow-500 bg-slate-700 border-slate-600 rounded focus:ring-yellow-500 focus:ring-offset-slate-800 ${habit.completedToday ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        />
        <label
          htmlFor={`habit-${habit.id}`} // Still useful for accessibility even if checkbox is sometimes disabled
          className={`ml-3 text-lg ${habit.completedToday ? 'line-through text-slate-500 cursor-not-allowed' : 'text-slate-200 cursor-pointer'}`}
        >
          {habit.text}
        </label>
      </div>
      <button
        onClick={() => onDelete(habit.id)}
        className="text-red-500 hover:text-red-400 font-semibold py-1 px-3 rounded-md hover:bg-red-500 hover:bg-opacity-20 transition-colors"
        title="Excluir hábito"
      >
        ✕
      </button>
    </li>
  );
};

export default HabitItem;