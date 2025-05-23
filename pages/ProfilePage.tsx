
import React from 'react'; // Removed useState
import { useUser } from '../contexts/UserContext';
import { 
    POKEMON_MASTER_LIST, 
    XP_PER_LEVEL, 
    // REMOVED: AVAILABLE_AVATARS
} from '../constants';
// REMOVED: import Modal from '../components/Modal'; 

const ProfilePage: React.FC = () => {
  const { currentUser } = useUser(); // Removed updateAvatar

  // REMOVED: State for avatar modal and temp selection
  // const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  // const [tempSelectedAvatarId, setTempSelectedAvatarId] = useState<string>('');

  if (!currentUser) {
    return <p className="text-center text-xl py-10">Carregando perfil do treinador...</p>;
  }

  const currentLevel = Math.floor(currentUser.experiencePoints / XP_PER_LEVEL) + 1;
  const xpForNextLevel = currentLevel * XP_PER_LEVEL;
  const currentXPInLevel = currentUser.experiencePoints % XP_PER_LEVEL;
  const xpProgressPercent = xpForNextLevel > 0 ? (currentXPInLevel / XP_PER_LEVEL) * 100 : 0;
  
  const uniqueCaughtPokemonIds = new Set(currentUser.caughtPokemon.map(p => p.id));
  const pokedexProgress = uniqueCaughtPokemonIds.size;

  // REMOVED: currentAvatarDetails logic
  // REMOVED: Avatar modal handler functions

  return (
    <div className="space-y-10">
      <h1 className="text-4xl font-bold text-yellow-400 text-center">Perfil do Treinador</h1>

      <section className="bg-slate-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold text-yellow-300 mb-6 text-center">Informações do Treinador</h2>
        
        {/* REMOVED: Avatar display and change button */}
        {/* 
        <div className="flex flex-col items-center mb-6">
          <button
            onClick={handleAvatarImageClick}
            className="w-40 h-40 md:w-48 md:h-48 bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden border-4 border-yellow-400 shadow-md hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-opacity"
            aria-label="Mudar avatar"
            title="Clique para mudar o avatar"
          >
            {currentAvatarDetails.path ? (
              <img 
                src={currentAvatarDetails.path} 
                alt={`Avatar atual: ${currentAvatarDetails.name}`} 
                className="w-full h-full object-contain p-1" 
              />
            ) : (
              <svg className="w-24 h-24 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
              </svg>
            )}
          </button>
        </div>
        */}

        <p className="text-slate-200 text-xl text-center mb-2">Nome: <span className="font-bold text-white">{currentUser.username}</span></p>
        
        <div className="mt-4">
          <h3 className="text-xl font-semibold text-yellow-200 mb-1">Nível: <span className="text-white">{currentLevel}</span></h3>
          <p className="text-slate-400 text-sm">Experiência: {currentUser.experiencePoints} / {xpForNextLevel > 0 ? xpForNextLevel : XP_PER_LEVEL} XP</p>
          <div className="w-full bg-slate-700 rounded-full h-4 my-2 overflow-hidden border border-slate-600">
            <div 
              className="bg-green-500 h-4 rounded-full transition-all duration-500" 
              style={{ width: `${xpProgressPercent}%` }}
              role="progressbar"
              aria-valuenow={xpProgressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            ></div>
          </div>
        </div>

        <p className="text-slate-300 text-lg mt-4">
          Pokédex: <span className="font-semibold text-white">{pokedexProgress}</span> / {POKEMON_MASTER_LIST.length} Registrados
        </p>
      </section>

      {/* REMOVED: Avatar selection Modal */}
      
    </div>
  );
};

export default ProfilePage;