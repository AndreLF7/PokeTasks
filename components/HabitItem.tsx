
import React from 'react';
import { Habit } from '../types';
import { useUser } from '../contexts/UserContext';

interface HabitItemProps {
  habit: Habit;
}

const HabitItem: React.FC<HabitItemProps> = ({ habit }) => {
  const { toggleHabit, deleteHabit } = useUser();

  return (
    <li className="flex items-center justify-between bg-slate-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <input
          type="checkbox"
          id={`habit-${habit.id}`}
          checked={habit.completedToday}
          onChange={() => toggleHabit(habit.id)}
          className="h-6 w-6 text-yellow-500 bg-slate-700 border-slate-600 rounded focus:ring-yellow-500 focus:ring-offset-slate-800 cursor-pointer"
        />
        <label
          htmlFor={`habit-${habit.id}`}
          className={`ml-3 text-lg ${habit.completedToday ? 'line-through text-slate-500' : 'text-slate-200'} cursor-pointer`}
        >
          {habit.text}
        </label>
      </div>
      <button
        onClick={() => deleteHabit(habit.id)}
        className="text-red-500 hover:text-red-400 font-semibold py-1 px-3 rounded-md hover:bg-red-500 hover:bg-opacity-20 transition-colors"
        title="Excluir hábito"
      >
        ✕
      </button>
    </li>
  );
};

export default HabitItem;