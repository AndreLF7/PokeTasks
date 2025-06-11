
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import { AVATAR_OPTIONS, DEFAULT_AVATAR_ID } from '../constants'; // Import avatar constants

interface TrainerRankingInfo {
  username: string;
  uniquePokemonCount: number;
  rank?: number;
  avatarId?: string; // Added avatarId
}

const RankingPage: React.FC = () => {
  const [rankings, setRankings] = useState<TrainerRankingInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRankings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/trainers');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch rankings: ${response.status}`);
        }
        const data: TrainerRankingInfo[] = await response.json();
        
        const sortedData = data
          .sort((a, b) => b.uniquePokemonCount - a.uniquePokemonCount)
          .slice(0, 10) // Get top 10
          .map((trainer, index) => ({ ...trainer, rank: index + 1 }));

        setRankings(sortedData);
      } catch (err: any) {
        console.error("Error fetching rankings:", err);
        setError(err.message || 'An unknown error occurred while fetching rankings.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRankings();
  }, []);

  const getRankMedal = (rank?: number) => {
    if (rank === 1) return <span title="Ouro" role="img" aria-label="Medalha de Ouro" className="text-xl md:text-2xl">🥇</span>;
    if (rank === 2) return <span title="Prata" role="img" aria-label="Medalha de Prata" className="text-xl md:text-2xl">🥈</span>;
    if (rank === 3) return <span title="Bronze" role="img" aria-label="Medalha de Bronze" className="text-xl md:text-2xl">🥉</span>;
    return <span className="text-slate-400 font-semibold text-sm md:text-base">{rank}</span>;
  };

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-2xl text-yellow-400 animate-pulse">Carregando Ranking dos Treinadores...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 bg-red-900 bg-opacity-30 p-6 rounded-lg">
        <p className="text-2xl text-red-400">Erro ao Carregar Ranking</p>
        <p className="text-slate-300 mt-2">{error}</p>
        <button
          onClick={() => window.location.reload()} 
          className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-yellow-400">Ranking dos Treinadores</h1>
        <p className="text-slate-300 text-base sm:text-lg mt-2">Top 10 treinadores por espécies únicas de Pokémon capturadas.</p>
      </header>

      {rankings.length > 0 ? (
        <div className="bg-slate-800 shadow-2xl rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-700">
                <tr>
                  <th scope="col" className="px-3 py-2 md:px-6 md:py-4 text-center text-xs md:text-sm font-medium text-yellow-300 uppercase tracking-wider">
                    Rank
                  </th>
                  <th scope="col" className="px-3 py-2 md:px-6 md:py-4 text-left text-xs md:text-sm font-medium text-yellow-300 uppercase tracking-wider">
                    Treinador
                  </th>
                  <th scope="col" className="px-3 py-2 md:px-6 md:py-4 text-left text-xs md:text-sm font-medium text-yellow-300 uppercase tracking-wider">
                    Pokédex
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {rankings.map((trainer) => {
                  const trainerAvatar = AVATAR_OPTIONS.find(av => av.id === trainer.avatarId) || 
                                      AVATAR_OPTIONS.find(av => av.id === DEFAULT_AVATAR_ID) || 
                                      AVATAR_OPTIONS[0];
                  return (
                    <tr key={trainer.username} className="hover:bg-slate-750 transition-colors">
                      <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-sm md:text-base text-slate-200">
                        <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-600 mx-auto">
                           {getRankMedal(trainer.rank)}
                        </div>
                      </td>
                      <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-xs sm:text-sm md:text-base font-medium text-slate-100">
                        <div className="flex items-center space-x-2">
                          {trainerAvatar && (
                            <img 
                              src={trainerAvatar.navbarSpriteUrl} 
                              alt={`${trainer.username} avatar`} 
                              className="h-7 w-7 rounded-full object-contain bg-slate-700 p-0.5" 
                              loading="lazy"
                            />
                          )}
                          <Link 
                            to={`/trainer/${encodeURIComponent(trainer.username)}`} 
                            className="hover:text-yellow-400 hover:underline"
                            title={`Ver perfil de ${trainer.username}`}
                          >
                            {trainer.username}
                          </Link>
                        </div>
                      </td>
                      <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-xs sm:text-sm md:text-base text-green-400 font-semibold">
                        {trainer.uniquePokemonCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 px-6 bg-slate-800 rounded-lg shadow">
          <img 
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/132.png" // Ditto
            alt="Ditto Confuso" 
            className="mx-auto mb-4 rounded-md w-32 h-auto filter grayscale opacity-60" 
          />
          <p className="text-xl text-slate-400">Nenhum treinador encontrado no ranking ainda.</p>
          <p className="text-slate-500">Parece que a competição está apenas começando!</p>
        </div>
      )}
    </div>
  );
};

export default RankingPage;
