
import React from 'react';
import { useUser } from '../contexts/UserContext';
import { Habit } from '../types'; // Import Habit type

const StatsPage: React.FC = () => {
  const { currentUser } = useUser();

  if (!currentUser) {
    return <p className="text-center text-xl py-10">Carregando estatísticas do treinador...</p>;
  }

  const { dailyStreak, completionHistory, habits } = currentUser;

  const rankedHabits = [...habits].sort((a, b) => (b.totalCompletions || 0) - (a.totalCompletions || 0));

  return (
    <div className="space-y-10">
      <h1 className="text-4xl font-bold text-yellow-400 text-center">Estatísticas de Hábitos</h1>

      {/* Daily Streak Section */}
      <section className="bg-slate-800 p-6 rounded-xl shadow-lg text-center">
        <h2 className="text-3xl font-semibold text-yellow-300 mb-3">Sua Sequência Atual</h2>
        <div className="flex items-center justify-center space-x-3">
          <span className="text-6xl font-bold text-green-400 animate-pulse">{dailyStreak}</span>
          <span className="text-2xl text-slate-300">dias consecutivos!</span>
        </div>
        {dailyStreak === 0 && <p className="text-slate-400 mt-2">Complete um hábito hoje para começar uma nova sequência!</p>}
        {dailyStreak > 0 && <p className="text-slate-400 mt-2">Continue assim, Treinador!</p>}
      </section>

      {/* Daily Completion History Section */}
      <section className="bg-slate-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold text-yellow-400 mb-4">Histórico de Conclusões Diárias (Últimos {completionHistory.length} dias)</h2>
        {completionHistory.length > 0 ? (
          <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {completionHistory.map((entry, index) => (
              <li key={index} className="bg-slate-700 p-3 rounded-md flex justify-between items-center">
                <span className="text-slate-300">{new Date(entry.date).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}:</span>
                <span className="font-semibold text-yellow-300">{entry.count} {entry.count === 1 ? 'hábito' : 'hábitos'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-400">Nenhum histórico de conclusão ainda. Complete alguns hábitos!</p>
        )}
      </section>

      {/* Habit Performance Ranking Section */}
      <section className="bg-slate-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold text-yellow-400 mb-4">Ranking de Hábitos (Mais Completados)</h2>
        {rankedHabits.length > 0 ? (
          <ol className="space-y-3">
            {rankedHabits.map((habit, index) => (
              <li key={habit.id} className="bg-slate-700 p-4 rounded-md flex justify-between items-center shadow">
                <div className="flex items-center">
                  <span className={`text-lg font-bold mr-3 ${
                    index === 0 ? 'text-yellow-400' : 
                    index === 1 ? 'text-slate-300' : 
                    index === 2 ? 'text-orange-400' : 'text-slate-400'
                  }`}>
                    #{index + 1}
                  </span>
                  <span className="text-slate-200 text-ellipsis overflow-hidden whitespace-nowrap max-w-xs sm:max-w-md md:max-w-lg" title={habit.text}>
                    {habit.text}
                  </span>
                </div>
                <span className="font-semibold text-green-400 bg-green-900 bg-opacity-50 px-3 py-1 rounded-full text-sm">
                  {habit.totalCompletions || 0} {habit.totalCompletions === 1 ? 'vez' : 'vezes'}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <div className="text-center py-6">
             <img 
                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/79.png" // Slowpoke
                alt="Slowpoke Confuso" 
                className="mx-auto mb-4 rounded-md w-32 h-auto filter grayscale opacity-60" 
            />
            <p className="text-slate-400">Nenhum hábito para classificar. Adicione e complete alguns hábitos!</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default StatsPage;
