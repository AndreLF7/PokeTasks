
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import HabitInput from '../components/HabitInput';
import HabitItem from '../components/HabitItem';
import { CaughtPokemon, BallType } from '../types';
import Modal from '../components/Modal';
import PokemonCard from '../components/PokemonCard';
import { getTranslatedBallName } from '../constants';

const BallIcon: React.FC<{ type: BallType; onClick?: () => void; isButton?: boolean }> = ({ type, onClick, isButton = true }) => {
  let spriteUrl = "";
  const translatedName = getTranslatedBallName(type);

  switch (type) {
    case 'poke':
      spriteUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";
      break;
    case 'great':
      spriteUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png";
      break;
    case 'ultra':
      spriteUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png";
      break;
    case 'master':
      spriteUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png";
      break;
  }

  if (isButton && onClick) {
    return (
      <img
        src={spriteUrl}
        alt={translatedName}
        className="w-12 h-12 pokeball-icon"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
        aria-label={`Usar ${translatedName}`}
      />
    );
  }
  return (
    <img
      src={spriteUrl}
      alt={translatedName}
      className="w-12 h-12"
    />
  );
};

const HabitsPage: React.FC = () => {
  const { currentUser, catchFromPokeBall, catchFromGreatBall, catchFromUltraBall, catchFromMasterBall } = useUser();
  const [revealedPokemon, setRevealedPokemon] = useState<CaughtPokemon | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ballUsed, setBallUsed] = useState<BallType | null>(null);
  const [timeLeftForReset, setTimeLeftForReset] = useState<string>("Calculando...");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setDate(now.getDate() + 1);
      midnight.setHours(0, 0, 0, 0);

      const diff = midnight.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeftForReset("00:00:00"); // Or "Reiniciando..."
        // The context interval should handle the actual reset.
        // Optionally, trigger a check here if needed, but avoid duplicate logic.
        return;
      }

      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeftForReset(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    calculateTimeLeft(); // Initial calculation
    const timerId = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timerId);
  }, []);


  const handleBallClick = (type: BallType) => {
    if (!currentUser) return;
    let caught: CaughtPokemon | null = null;

    // Check if there's any habit with pendingRewardConfirmation
    const hasPendingReward = currentUser.habits.some(h => h.pendingRewardConfirmation);
    if (!hasPendingReward && (type === 'poke' || type === 'great' || type === 'ultra' || type === 'master')) {
        // Allow using balls even if no specific habit reward is pending,
        // IF the intent is that balls can be used "freely" once obtained.
        // For now, this only proceeds if a ball is to be used.
        // The `confirmNextPendingReward` in UserContext will only confirm if a habit IS pending.
    }


    if (type === 'poke' && currentUser.pokeBalls > 0) {
      caught = catchFromPokeBall();
    } else if (type === 'great' && currentUser.greatBalls > 0) {
      caught = catchFromGreatBall();
    } else if (type === 'ultra' && currentUser.ultraBalls > 0) {
      caught = catchFromUltraBall();
    } else if (type === 'master' && currentUser.masterBalls > 0) {
      caught = catchFromMasterBall();
    }


    if (caught) {
      setRevealedPokemon(caught);
      setBallUsed(type);
      setIsModalOpen(true);
    } else if (
        (type === 'poke' && currentUser.pokeBalls === 0) ||
        (type === 'great' && currentUser.greatBalls === 0) ||
        (type === 'ultra' && currentUser.ultraBalls === 0) ||
        (type === 'master' && currentUser.masterBalls === 0)
    ) {
        // alert(`Você não tem ${getTranslatedBallName(type, true)} suficientes.`);
        // This case is handled by the UI not showing balls if count is 0.
        // If somehow clicked, this is a fallback.
    } else if (!hasPendingReward && (type === 'poke' || type === 'great' || type === 'ultra')) {
      // This alert might be too intrusive if balls can be used freely.
      // For now, we assume a pending reward is preferred to consume a ball.
      // If no specific habit is pending, using a ball might not link to a habit completion XP.
      // The UserContext's confirmNextPendingReward will handle this gracefully.
      // alert("Complete um hábito primeiro para designar a recompensa!");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setRevealedPokemon(null);
    setBallUsed(null);
  };

  if (!currentUser) return <p className="text-center text-xl py-10">Carregando dados do usuário...</p>;

  const { habits, pokeBalls, greatBalls, ultraBalls, masterBalls, dailyCompletions } = currentUser;
  const hasAnyPendingReward = habits.some(h => h.pendingRewardConfirmation);


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-yellow-400 mb-2">Hábitos Diários</h1>
        <p className="text-slate-300 text-lg">Complete hábitos para ganhar recompensas!</p>
        <ul className="text-slate-400 text-sm list-disc list-inside mt-1">
            <li>{getTranslatedBallName('poke')}: Concedida por cada conclusão.</li>
            <li>{getTranslatedBallName('great')}: Também concedida a cada 5ª conclusão.</li>
            <li>{getTranslatedBallName('ultra')}: Também concedida a cada 10ª conclusão.</li>
            <li>{getTranslatedBallName('master')}: Disponível apenas através de trocas especiais.</li>
        </ul>
        <div className="flex items-center mt-1">
            <p className="text-slate-400 text-md">
            Conclusões de Hoje: <span className="font-semibold text-yellow-300">{dailyCompletions}</span>.
            </p>
            <Link
                to="/stats"
                className="ml-4 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-1 px-3 rounded-md transition-colors shadow"
                title="Ver Estatísticas de Hábitos"
            >
                Ver Estatísticas
            </Link>
        </div>
        <p className="text-slate-400 text-sm mt-1">Marcações e contagem de conclusões são reiniciadas diariamente à meia-noite.</p>
        <p className="text-slate-400 text-sm mt-1 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tempo para reiniciar: <span className="font-semibold text-yellow-300 ml-1">{timeLeftForReset}</span>
        </p>
      </div>

      <HabitInput />

      {habits.length > 0 ? (
        <ul className="space-y-3">
          {habits.map(habit => (
            <HabitItem key={habit.id} habit={habit} />
          ))}
        </ul>
      ) : (
        <div className="text-center py-10 px-6 bg-slate-800 rounded-lg shadow">
          <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png" alt="Snorlax Dormindo" className="mx-auto mb-4 rounded-md w-40 h-auto filter grayscale opacity-70" />
          <p className="text-xl text-slate-400">Nenhum hábito adicionado ainda.</p>
          <p className="text-slate-500">Hora de definir algumas metas, Treinador!</p>
        </div>
      )}
      
      {(!hasAnyPendingReward && (pokeBalls > 0 || greatBalls > 0 || ultraBalls > 0 || masterBalls > 0)) && (
        <p className="text-center text-sm text-yellow-200 bg-slate-700 p-2 rounded-md">
          Você tem bolas não resgatadas! Complete um novo hábito ou use uma bola diretamente.
        </p>
      )}

      {(pokeBalls > 0 || greatBalls > 0 || ultraBalls > 0 || masterBalls > 0) && (
        <div className="mt-10 p-6 bg-slate-800 rounded-xl shadow-lg">
          {pokeBalls > 0 && (
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-yellow-400 mb-3">Suas {getTranslatedBallName('poke', true)}: <span className="text-white">{pokeBalls}</span></h2>
              <div className="flex flex-wrap gap-4 items-center justify-start">
                {Array.from({ length: pokeBalls }).map((_, index) => (
                  <BallIcon key={`poke-${index}`} type="poke" onClick={() => handleBallClick('poke')} />
                ))}
              </div>
            </div>
          )}
          
          {greatBalls > 0 && (
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-yellow-400 mb-3">Suas {getTranslatedBallName('great', true)}: <span className="text-white">{greatBalls}</span></h2>
              <div className="flex flex-wrap gap-4 items-center justify-start">
                {Array.from({ length: greatBalls }).map((_, index) => (
                  <BallIcon key={`great-${index}`} type="great" onClick={() => handleBallClick('great')} />
                ))}
              </div>
            </div>
          )}

          {ultraBalls > 0 && (
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-yellow-400 mb-3">Suas {getTranslatedBallName('ultra', true)}: <span className="text-white">{ultraBalls}</span></h2>
              <div className="flex flex-wrap gap-4 items-center justify-start">
                {Array.from({ length: ultraBalls }).map((_, index) => (
                  <BallIcon key={`ultra-${index}`} type="ultra" onClick={() => handleBallClick('ultra')} />
                ))}
              </div>
            </div>
          )}

          {masterBalls > 0 && (
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-purple-400 mb-3">Suas {getTranslatedBallName('master', true)}: <span className="text-white">{masterBalls}</span></h2>
              <div className="flex flex-wrap gap-4 items-center justify-start">
                {Array.from({ length: masterBalls }).map((_, index) => (
                  <BallIcon key={`master-${index}`} type="master" onClick={() => handleBallClick('master')} />
                ))}
              </div>
            </div>
          )}
           <p className="text-sm text-slate-400 mt-4 text-center">
            {hasAnyPendingReward ? "Clique em uma Bola para usar sua recompensa pendente e tentar capturar um Pokémon!" : "Clique em uma Bola para capturar um Pokémon!"}
            </p>
        </div>
      )}
      
      <div className="mt-6 text-center">
        <Link
          to="/ball-odds"
          className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md"
        >
          Chances de Captura
        </Link>
      </div>
      
      <Modal isOpen={isModalOpen} onClose={closeModal} title="Parabéns!">
        {revealedPokemon && (
          <div className="text-center">
            <p className="text-lg text-slate-300 mb-1">Você usou uma {getTranslatedBallName(ballUsed)} e capturou um...</p>
            {revealedPokemon.isShiny && (
              <p className="text-xl font-bold text-yellow-300 my-2 animate-pulse">É um Pokémon Shiny! ✨</p>
            )}
            <PokemonCard pokemon={revealedPokemon} />
            <button 
              onClick={closeModal} 
              className="mt-6 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-2 px-6 rounded-lg transition-colors"
            >
              Incrível!
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HabitsPage;
export { BallIcon };
