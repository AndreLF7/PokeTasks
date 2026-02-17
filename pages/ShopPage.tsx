
import React from 'react';
import { useUser } from '../contexts/UserContext';
import { 
  PRICE_POKEBALL, 
  PRICE_GREATBALL, 
  PRICE_ULTRABALL,
  getTranslatedBallName 
} from '../constants';
import { BallType } from '../types';

interface ShopItemProps {
  type: BallType;
  price: number;
  icon: string;
  count: number;
  onBuy: (type: BallType) => void;
  canAfford: boolean;
}

const ShopItem: React.FC<ShopItemProps> = ({ type, price, icon, count, onBuy, canAfford }) => {
  const ballName = getTranslatedBallName(type);
  
  return (
    <div className="bg-slate-800 rounded-xl shadow-lg p-6 border-t-4 border-blue-500 flex flex-col items-center text-center transition-transform hover:scale-105">
      <img src={icon} alt={ballName} className="w-24 h-24 mb-4 object-contain" />
      <h3 className="text-xl font-bold text-yellow-400 mb-2">{ballName}</h3>
      <div className="flex items-center justify-center space-x-2 mb-4 bg-slate-700 py-1 px-3 rounded-full">
        <span className="text-lg font-semibold text-slate-100">{price}</span>
        <span className="text-yellow-400 text-sm">Task Coins</span>
      </div>
      <p className="text-xs text-slate-400 mb-6">No seu inventário: <span className="text-slate-200">{count}</span></p>
      <button
        onClick={() => onBuy(type)}
        disabled={!canAfford}
        className={`w-full py-3 rounded-lg font-bold transition-colors shadow-md 
          ${canAfford ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-slate-600 text-slate-400 cursor-not-allowed opacity-50'}`}
      >
        {canAfford ? 'Comprar' : 'Coins Insuficientes'}
      </button>
    </div>
  );
};

const ShopPage: React.FC = () => {
  const { currentUser, buyBall } = useUser();

  if (!currentUser) return null;

  const currentCoins = currentUser.taskCoins || 0;

  const items: { type: BallType; price: number; icon: string; count: number }[] = [
    {
      type: 'poke',
      price: PRICE_POKEBALL,
      icon: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png",
      count: currentUser.pokeBalls,
    },
    {
      type: 'great',
      price: PRICE_GREATBALL,
      icon: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png",
      count: currentUser.greatBalls,
    },
    {
      type: 'ultra',
      price: PRICE_ULTRABALL,
      icon: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png",
      count: currentUser.ultraBalls,
    }
  ];

  return (
    <div className="space-y-8">
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 p-8 rounded-2xl shadow-2xl text-center relative overflow-hidden">
        {/* Mart background pattern effect */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="flex flex-wrap justify-around">
            {Array.from({ length: 20 }).map((_, i) => (
              <img key={i} src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" className="w-12 h-12 m-4" alt="" />
            ))}
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black text-white mb-2 relative z-10">Loja Pokémon</h1>
        <p className="text-blue-100 text-lg md:text-xl relative z-10">Troque suas Task Coins por itens essenciais!</p>
        
        <div className="mt-6 inline-flex items-center bg-slate-900/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-yellow-500/30 relative z-10">
          <span className="text-2xl mr-3" role="img" aria-label="Coins">🪙</span>
          <span className="text-3xl font-bold text-yellow-400">{currentCoins}</span>
          <span className="ml-2 text-slate-300 font-medium">Task Coins</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        {items.map((item) => (
          <ShopItem
            key={item.type}
            {...item}
            onBuy={buyBall}
            canAfford={currentCoins >= item.price}
          />
        ))}
      </div>

      <div className="mt-12 p-6 bg-slate-800/50 rounded-xl border border-slate-700 text-center">
        <p className="text-slate-400 text-sm">
          A Loja Pokémon é abastecida regularmente. Novos itens podem ser adicionados conforme você sobe de nível!
        </p>
      </div>
    </div>
  );
};

export default ShopPage;
