
import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { MAX_HABITS } from '../constants';

const HabitInput: React.FC = () => {
  const [habitText, setHabitText] = useState('');
  const { currentUser, addHabit } = useUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (habitText.trim() && currentUser && currentUser.habits.length < MAX_HABITS) {
      addHabit(habitText.trim());
      setHabitText('');
    } else if (currentUser && currentUser.habits.length >= MAX_HABITS) {
      alert(`Você pode acompanhar até ${MAX_HABITS} hábitos.`);
    }
  };

  if (!currentUser || currentUser.habits.length >= MAX_HABITS) {
    return (
      <div className="my-4 p-3 bg-slate-700 rounded-lg text-center text-slate-400">
        Você atingiu o máximo de {MAX_HABITS} hábitos. Concentre-se nestes por enquanto!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="my-6 flex gap-3 items-center">
      <input
        type="text"
        value={habitText}
        onChange={(e) => setHabitText(e.target.value)}
        placeholder="Insira um novo hábito diário (Ex: Beber 8 copos de água)"
        className="flex-grow p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none placeholder-slate-400"
      />
      <button
        type="submit"
        className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md"
        disabled={!habitText.trim()}
      >
        Adicionar Hábito
      </button>
    </form>
  );
};

export default HabitInput;