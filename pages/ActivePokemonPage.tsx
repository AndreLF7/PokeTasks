
import React from 'react';
import { useUser } from '../contexts/UserContext';
import { PokemonStats } from '../types';

const StatBar: React.FC<{ label: string, value: number, max: number, color: string }> = ({ label, value, max, color }) => {
    const percentage = Math.min(100, (value / max) * 100);
    return (
        <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-bold uppercase">{label}</span>
                <span className="text-white font-mono font-bold">{value} / {max}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden border border-slate-600">
                <div 
                    className={`${color} h-full transition-all duration-1000 ease-out`} 
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

const ActivePokemonPage: React.FC = () => {
  const { currentUser } = useUser();

  if (!currentUser) return null;

  const { activePokemon } = currentUser;

  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold text-yellow-400">Pokémon Ativos</h1>
        <p className="text-slate-300 text-lg mt-2">Visualize os status permanentes dos seus Pokémon jogáveis.</p>
      </header>

      {activePokemon.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activePokemon.map((p) => (
            <div key={p.instanceId} className="bg-slate-800 rounded-2xl shadow-2xl border-2 border-blue-500 overflow-hidden group hover:border-blue-400 transition-colors">
              <div className="bg-blue-900/30 p-6 flex flex-col items-center relative">
                <div className="absolute top-2 right-2 bg-yellow-500 text-slate-900 text-[10px] font-black px-2 py-1 rounded-full uppercase">
                    Playable
                </div>
                <img 
                    src={p.spriteUrl} 
                    alt={p.name} 
                    className="w-40 h-40 object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] transform transition-transform group-hover:scale-110" 
                />
                <h3 className="text-2xl font-black text-yellow-400 mt-4 uppercase tracking-wider">
                    {p.name} {p.isShiny && '✨'}
                </h3>
                <p className="text-slate-400 text-[10px] font-mono mt-1">ID: {p.instanceId}</p>
                <p className="text-slate-500 text-[10px] font-mono">ATIVADO EM: {new Date(p.activatedAt).toLocaleDateString()}</p>
              </div>
              
              <div className="p-6 bg-slate-800/80">
                <StatBar label="HP" value={p.stats.hp} max={30} color="bg-red-500" />
                <StatBar label="Ataque" value={p.stats.attack} max={12} color="bg-orange-500" />
                <StatBar label="Defesa" value={p.stats.defense} max={12} color="bg-blue-400" />
                <StatBar label="Precisão" value={p.stats.accuracy} max={12} color="bg-green-500" />
                <StatBar label="Agilidade" value={p.stats.agility} max={12} color="bg-purple-500" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-800 rounded-2xl border-2 border-dashed border-slate-700">
          <img 
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rare-candy.png" 
            className="w-20 h-20 mx-auto mb-4 grayscale opacity-50" 
            alt="Sem pokémon"
          />
          <p className="text-xl text-slate-400">Você ainda não tem Pokémon Ativos.</p>
          <p className="text-slate-500 mt-2">Vá até a Loja e use o item "Ativar Pokémon" (1000 Task Coins).</p>
        </div>
      )}
    </div>
  );
};

export default ActivePokemonPage;
