
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { UserProfile, Habit } from '../types';

const TrainerPublicHabitsPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [trainerProfile, setTrainerProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrainerProfile = async () => {
      if (!username) {
        setError("Nome do treinador não especificado.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/habits?username=${encodeURIComponent(username)}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Perfil do treinador "${username}" não encontrado.`);
          }
          const errorData = await response.json();
          throw new Error(errorData.error || `Falha ao carregar perfil: ${response.status}`);
        }
        const data: UserProfile = await response.json();
        setTrainerProfile(data);
      } catch (err: any) {
        console.error("Erro ao carregar perfil do treinador para hábitos:", err);
        setError(err.message || 'Ocorreu um erro desconhecido.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrainerProfile();
  }, [username]);

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-2xl text-yellow-400 animate-pulse">Carregando hábitos de {username || 'Treinador'}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 bg-red-900 bg-opacity-30 p-6 rounded-lg">
        <p className="text-2xl text-red-400">Erro ao Carregar Hábitos</p>
        <p className="text-slate-300 mt-2">{error}</p>
        <button
          onClick={() => navigate(username ? `/trainer/${encodeURIComponent(username)}` : '/ranking')}
          className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Voltar
        </button>
      </div>
    );
  }

  if (!trainerProfile) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-slate-400">Perfil do treinador não pôde ser carregado.</p>
        <button
          onClick={() => navigate(username ? `/trainer/${encodeURIComponent(username)}` : '/ranking')}
          className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Voltar
        </button>
      </div>
    );
  }

  if (!trainerProfile.habitsPubliclyVisible) {
    return (
      <div className="text-center py-10 bg-slate-800 p-6 rounded-lg shadow">
        <img 
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/95.png" // Onix
            alt="Onix Bloqueando" 
            className="mx-auto mb-4 rounded-md w-32 h-auto filter grayscale opacity-70" 
        />
        <p className="text-xl text-slate-300">Lamento, mas o treinador <span className="font-semibold text-yellow-400">{trainerProfile.username}</span> não deseja divulgar seus hábitos.</p>
        <Link
          to={`/trainer/${encodeURIComponent(trainerProfile.username)}`}
          className="mt-6 inline-block bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-2 px-6 rounded-lg transition-colors"
        >
          Voltar ao Perfil de {trainerProfile.username}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="text-center mb-6 md:mb-10">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-yellow-400">Hábitos de {trainerProfile.username}</h1>
      </header>

      {trainerProfile.habits && trainerProfile.habits.length > 0 ? (
        <div className="bg-slate-800 shadow-xl rounded-lg p-4 sm:p-6">
          <ul className="space-y-3">
            {trainerProfile.habits.map((habit: Habit) => (
              <li key={habit.id} className="bg-slate-700 p-3 sm:p-4 rounded-md shadow">
                <p className="text-slate-200 text-base sm:text-lg">{habit.text}</p>
                {/* Note: completedToday status is not shown as it's private daily progress */}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-10 px-6 bg-slate-800 rounded-lg shadow">
           <img 
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/129.png" // Magikarp
            alt="Magikarp Parecendo Confuso" 
            className="mx-auto mb-4 rounded-md w-32 h-auto filter grayscale opacity-60" 
          />
          <p className="text-xl text-slate-400">{trainerProfile.username} não adicionou nenhum hábito ainda.</p>
        </div>
      )}

      <div className="text-center mt-10">
        <Link
          to={`/trainer/${encodeURIComponent(trainerProfile.username)}`}
          className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-3 px-6 rounded-lg transition-colors text-lg shadow-md hover:shadow-lg"
        >
          &larr; Voltar ao Perfil de {trainerProfile.username}
        </Link>
      </div>
    </div>
  );
};

export default TrainerPublicHabitsPage;
