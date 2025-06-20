
import React from 'react';
import { useUser } from '../contexts/UserContext';
import { Habit } from '../types'; // Import Habit type

const StatsPage: React.FC = () => {
  const { currentUser, claimStreakRewards } = useUser(); 

  if (!currentUser) {
    return <p className="text-center text-xl py-10">Carregando estatísticas do treinador...</p>;
  }

  const { 
    dailyStreak, 
    habits, 
    lastStreakDayClaimedForReward,
    fiveHabitStreak,
    lastFiveHabitStreakDayClaimedForReward,
    tenHabitStreak,
    lastTenHabitStreakDayClaimedForReward
  } = currentUser;

  const rankedHabits = [...habits].sort((a, b) => (b.totalCompletions || 0) - (a.totalCompletions || 0));

  const canClaimMainStreakRewards = dailyStreak > (lastStreakDayClaimedForReward || 0);
  const canClaimFiveHabitStreakRewards = (fiveHabitStreak || 0) > (lastFiveHabitStreakDayClaimedForReward || 0);
  const canClaimTenHabitStreakRewards = (tenHabitStreak || 0) > (lastTenHabitStreakDayClaimedForReward || 0);
  const anyRewardsClaimable = canClaimMainStreakRewards || canClaimFiveHabitStreakRewards || canClaimTenHabitStreakRewards;


  return (
    <div className="space-y-10">
      <h1 className="text-4xl font-bold text-yellow-400 text-center">Estatísticas de Hábitos & Sequências</h1>

      {/* Streaks Section */}
      <section className="bg-slate-800 p-6 rounded-xl shadow-lg text-center">
        <h2 className="text-3xl font-semibold text-yellow-300 mb-6">Suas Sequências</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Daily Streak */}
          <div className="bg-slate-700 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-yellow-200 mb-2">Sequência Diária</h3>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-5xl font-bold text-green-400">{dailyStreak}</span>
              <span className="text-lg text-slate-300">dias</span>
            </div>
            {dailyStreak === 0 && <p className="text-xs text-slate-400 mt-1">Complete um hábito!</p>}
            {canClaimMainStreakRewards && 
              <p className="text-xs text-green-300 mt-1">Recompensas disponíveis dos dias {(lastStreakDayClaimedForReward || 0) + 1} a {dailyStreak}.</p>
            }
          </div>

          {/* 5-Habit Streak */}
          <div className="bg-slate-700 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-yellow-200 mb-2">Sequência de 5 Hábitos</h3>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-5xl font-bold text-blue-400">{fiveHabitStreak || 0}</span>
              <span className="text-lg text-slate-300">dias</span>
            </div>
            {(fiveHabitStreak || 0) === 0 && <p className="text-xs text-slate-400 mt-1">Complete 5 hábitos num dia!</p>}
            {canClaimFiveHabitStreakRewards && 
              <p className="text-xs text-blue-300 mt-1">Recompensas disponíveis dos dias {(lastFiveHabitStreakDayClaimedForReward || 0) + 1} a {fiveHabitStreak}.</p>
            }
          </div>

          {/* 10-Habit Streak */}
          <div className="bg-slate-700 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-yellow-200 mb-2">Sequência de 10 Hábitos</h3>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-5xl font-bold text-purple-400">{tenHabitStreak || 0}</span>
              <span className="text-lg text-slate-300">dias</span>
            </div>
            {(tenHabitStreak || 0) === 0 && <p className="text-xs text-slate-400 mt-1">Complete 10 hábitos num dia!</p>}
            {canClaimTenHabitStreakRewards && 
              <p className="text-xs text-purple-300 mt-1">Recompensas disponíveis dos dias {(lastTenHabitStreakDayClaimedForReward || 0) + 1} a {tenHabitStreak}.</p>
            }
          </div>
        </div>
        
        {anyRewardsClaimable ? (
          <>
            <p className="text-sm text-slate-300 mb-3">
              Você tem recompensas de sequência pendentes! Clique abaixo para resgatá-las.
            </p>
            <button
              onClick={claimStreakRewards}
              className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-3 px-8 rounded-lg transition-colors shadow-md hover:shadow-lg text-lg"
              aria-label="Resgatar todas as recompensas de sequência disponíveis"
            >
              Resgatar Todas Recompensas de Sequência
            </button>
          </>
        ) : (
          <p className="text-sm text-slate-400">
            Você já resgatou todas as recompensas para suas sequências atuais. Mantenha as sequências para mais!
          </p>
        )}
         <p className="text-xs text-slate-500 mt-4">
            A Sequência Diária avança ao completar qualquer hábito. As Sequências de 5 e 10 Hábitos avançam ao completar 5 ou 10 hábitos distintos no mesmo dia, respectivamente.
        </p>
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
