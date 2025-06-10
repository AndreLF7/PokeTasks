
import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
// import { MAX_HABITS } from '../constants'; // No longer needed directly

const HabitInput: React.FC = () => {
  const [habitText, setHabitText] = useState('');
  const { currentUser, addHabit } = useUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (habitText.trim() && currentUser.habits.length < currentUser.maxHabitSlots) {
      addHabit(habitText.trim());
      setHabitText('');
    } else if (currentUser.habits.length >= currentUser.maxHabitSlots) {
      alert(`Você pode acompanhar até ${currentUser.maxHabitSlots} hábitos.`);
    }
  };

  if (!currentUser || currentUser.habits.length >= currentUser.maxHabitSlots) {
    return (
      <div className="my-4 p-3 bg-slate-700 rounded-lg text-center text-slate-400">
        Você atingiu o máximo de {currentUser?.maxHabitSlots || 0} hábitos. Concentre-se nestes por enquanto ou suba de nível para mais espaços!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="my-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      <input
        type="text"
        value={habitText}
        onChange={(e) => setHabitText(e.target.value)}
        placeholder="Insira um novo hábito diário (Ex: Beber 8 copos de água)"
        className="flex-grow p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none placeholder-slate-400 w-full sm:w-auto"
      />
      <button
        type="submit"
        className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md w-full sm:w-auto"
        disabled={!habitText.trim()}
      >
        Adicionar Hábito
      </button>
    </form>
  );
};

export default HabitInput;