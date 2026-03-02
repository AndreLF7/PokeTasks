
import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { 
  PRICE_POKEBALL, 
  PRICE_GREATBALL, 
  PRICE_ULTRABALL,
  PRICE_ACTIVATE_POKEMON,
  getTranslatedBallName,
  TEST_USER_USERNAME,
  ELIGIBLE_FOR_ACTIVATION
} from '../constants';
import { BallType, CaughtPokemon } from '../types';
import Modal from '../components/Modal';

interface ShopItemProps {
  type: BallType | 'activation';
  nameOverride?: string;
  price: number;
  icon: string;
  count?: number;
  onBuy: (type: any) => void;
  canAfford: boolean;
  description?: string;
}

const ShopItem: React.FC<ShopItemProps> = ({ type, nameOverride, price, icon, count, onBuy, canAfford, description }) => {
  const ballName = nameOverride || getTranslatedBallName(type as BallType);
  
  return (
    <div className="bg-slate-800 rounded-xl shadow-lg p-6 border-t-4 border-blue-500 flex flex-col items-center text-center transition-transform hover:scale-105">
      <img src={icon} alt={ballName} className="w-24 h-24 mb-4 object-contain" />
      <h3 className="text-xl font-bold text-yellow-400 mb-2">{ballName}</h3>
      <div className="flex items-center justify-center space-x-2 mb-4 bg-slate-700 py-1 px-3 rounded-full">
        <span className="text-lg font-semibold text-slate-100">{price}</span>
        <span className="text-yellow-400 text-sm">PokéCoins</span>
      </div>
      {description && <p className="text-xs text-slate-400 mb-4 px-2 line-clamp-2">{description}</p>}
      {count !== undefined && <p className="text-xs text-slate-400 mb-6 mt-auto">No seu inventário: <span className="text-slate-200">{count}</span></p>}
      <button
        onClick={() => onBuy(type)}
        disabled={!canAfford}
        className={`w-full py-3 rounded-lg font-bold transition-colors shadow-md mt-auto
          ${canAfford ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-slate-600 text-slate-400 cursor-not-allowed opacity-50'}`}
      >
        {canAfford ? 'Comprar' : 'Coins Insuficientes'}
      </button>
    </div>
  );
};

const ShopPage: React.FC = () => {
  const { currentUser, buyBall, activatePokemon } = useUser();
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!currentUser) return null;

  const isTestUser = currentUser.username === TEST_USER_USERNAME;
  const currentCoins = currentUser.taskCoins || 0;

  // Use override if Testmon
  const getPrice = (base: number) => isTestUser ? 0 : base;

  const eligiblePokemon = currentUser.caughtPokemon.filter(p => ELIGIBLE_FOR_ACTIVATION.includes(p.id) && !p.isActive);

  const handleBuy = (type: any) => {
    if (type === 'activation') {
      if (eligiblePokemon.length === 0) {
        alert("Você não possui nenhum Pokémon elegível (Bulbasaur, Charmander, Squirtle ou Pikachu) que já não esteja ativo!");
        return;
      }
      setIsActivationModalOpen(true);
    } else {
      buyBall(type as BallType);
    }
  };

  const handleConfirmActivation = async (instanceId: string) => {
    setIsProcessing(true);
    const success = await activatePokemon(instanceId);
    setIsProcessing(false);
    if (success) {
      setIsActivationModalOpen(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 p-8 rounded-2xl shadow-2xl text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="flex flex-wrap justify-around">
            {Array.from({ length: 20 }).map((_, i) => (
              <img key={i} src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" className="w-12 h-12 m-4" alt="" />
            ))}
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black text-white mb-2 relative z-10">Loja Pokémon</h1>
        <p className="text-blue-100 text-lg md:text-xl relative z-10">Troque suas PokéCoins por itens essenciais!</p>
        
        <div className="mt-6 inline-flex items-center bg-slate-900/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-yellow-500/30 relative z-10">
          <span className="text-2xl mr-3" role="img" aria-label="Coins">🪙</span>
          <span className="text-3xl font-bold text-yellow-400">{currentCoins}</span>
          <span className="ml-2 text-slate-300 font-medium">PokéCoins</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
        <ShopItem
          type="poke"
          price={getPrice(PRICE_POKEBALL)}
          icon="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
          count={currentUser.pokeBalls}
          onBuy={handleBuy}
          canAfford={currentCoins >= getPrice(PRICE_POKEBALL)}
        />
        <ShopItem
          type="great"
          price={getPrice(PRICE_GREATBALL)}
          icon="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png"
          count={currentUser.greatBalls}
          onBuy={handleBuy}
          canAfford={currentCoins >= getPrice(PRICE_GREATBALL)}
        />
        <ShopItem
          type="ultra"
          price={getPrice(PRICE_ULTRABALL)}
          icon="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png"
          count={currentUser.ultraBalls}
          onBuy={handleBuy}
          canAfford={currentCoins >= getPrice(PRICE_ULTRABALL)}
        />
        <ShopItem
          type="activation"
          nameOverride="Ativar Pokémon"
          price={getPrice(PRICE_ACTIVATE_POKEMON)}
          icon="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rare-candy.png"
          description="Torne um inicial jogável com status exclusivos!"
          onBuy={handleBuy}
          canAfford={currentCoins >= getPrice(PRICE_ACTIVATE_POKEMON)}
        />
      </div>

      <Modal isOpen={isActivationModalOpen} onClose={() => !isProcessing && setIsActivationModalOpen(false)} title="Escolha o Pokémon para Ativar">
        <div className="space-y-4">
          <p className="text-slate-400 text-sm text-center">
            Selecione um dos seus Pokémon elegíveis. Ele receberá status aleatórios permanentes e ficará bloqueado para trocas.
          </p>
          <div className="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto p-2">
            {eligiblePokemon.map(p => (
              <button
                key={p.instanceId}
                disabled={isProcessing}
                onClick={() => handleConfirmActivation(p.instanceId)}
                className="bg-slate-700 hover:bg-slate-600 p-3 rounded-lg flex flex-col items-center transition-colors border border-slate-600"
              >
                <img src={p.spriteUrl} alt={p.name} className="w-16 h-16 object-contain" />
                <span className="text-yellow-400 font-bold text-sm">{p.name}</span>
                <span className="text-slate-400 text-xs">{p.isShiny ? '✨ Shiny' : ''}</span>
              </button>
            ))}
          </div>
          {eligiblePokemon.length === 0 && <p className="text-center text-red-400">Nenhum Pokémon elegível encontrado.</p>}
          <button
            onClick={() => setIsActivationModalOpen(false)}
            className="w-full py-2 bg-slate-600 hover:bg-slate-500 rounded text-white font-semibold transition-colors mt-2"
          >
            Cancelar
          </button>
        </div>
      </Modal>

      <div className="mt-12 p-6 bg-slate-800/50 rounded-xl border border-slate-700 text-center">
        <p className="text-slate-400 text-sm">
          A Loja Pokémon é abastecida regularmente. Novos itens podem ser adicionados conforme você sobe de nível!
        </p>
      </div>
    </div>
  );
};

export default ShopPage;
