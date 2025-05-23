import React, { useState, useMemo, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import PokemonCard from '../components/PokemonCard';
import { CaughtPokemon, SortOption, TradeOffer, BallType, TradeOfferInput } from '../types';
import { TRADE_OFFERS, getTranslatedBallName }
from '../constants';
import Modal from '../components/Modal';

const MyPokemonPage: React.FC = () => {
  const { currentUser, releasePokemon, tradePokemon: executeTradeContext } = useUser();
  const [sortOption, setSortOption] = useState<SortOption>(SortOption.DATE_DESC);
  
  const [pokemonToRelease, setPokemonToRelease] = useState<CaughtPokemon | null>(null);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);

  const [isTradeMode, setIsTradeMode] = useState(false);
  const [selectedPokemonIds, setSelectedPokemonIds] = useState<string[]>([]);
  const [tradeToConfirm, setTradeToConfirm] = useState<TradeOffer | null>(null);
  const [isTradeConfirmModalOpen, setIsTradeConfirmModalOpen] = useState(false);
  const [tradeStatusMessage, setTradeStatusMessage] = useState<string | null>(null);


  const sortedPokemon = useMemo(() => {
    if (!currentUser) return [];
    const pokemonList = [...currentUser.caughtPokemon];
    switch (sortOption) {
      case SortOption.ID_ASC:
        return pokemonList.sort((a, b) => a.id - b.id);
      case SortOption.ID_DESC:
        return pokemonList.sort((a, b) => b.id - b.id);
      case SortOption.NAME_ASC:
        return pokemonList.sort((a, b) => a.name.localeCompare(b.name));
      case SortOption.NAME_DESC:
        return pokemonList.sort((a, b) => b.name.localeCompare(a.name));
      case SortOption.DATE_ASC:
        return pokemonList.sort((a, b) => new Date(a.caughtDate).getTime() - new Date(b.caughtDate).getTime());
      case SortOption.DATE_DESC:
      default:
        return pokemonList.sort((a, b) => new Date(b.caughtDate).getTime() - new Date(a.caughtDate).getTime());
    }
  }, [currentUser, sortOption]);

  const selectedPokemonDetails = useMemo(() => {
    if (!currentUser) return [];
    return currentUser.caughtPokemon.filter(p => selectedPokemonIds.includes(p.instanceId));
  }, [currentUser, selectedPokemonIds]);

  const selectedPokemonCountsByType = useMemo(() => {
    const counts: Record<string, number> = { poke: 0, great: 0, ultra: 0, master: 0 }; // Use string for BallType keys
    selectedPokemonDetails.forEach(p => {
      counts[p.caughtWithBallType] = (counts[p.caughtWithBallType] || 0) + 1;
    });
    return counts;
  }, [selectedPokemonDetails]);

  useEffect(() => {
    if (tradeStatusMessage) {
      const timer = setTimeout(() => setTradeStatusMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [tradeStatusMessage]);

  if (!currentUser) return <p className="text-center text-xl py-10">Carregando Pokémon do Treinador...</p>;

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value as SortOption);
  };

  // Release Pokemon Logic
  const handleOpenReleaseModal = (pokemon: CaughtPokemon) => {
    if (isTradeMode) return; 
    setPokemonToRelease(pokemon);
    setIsReleaseModalOpen(true);
  };

  const handleConfirmRelease = () => {
    if (pokemonToRelease) {
      releasePokemon(pokemonToRelease.instanceId);
      setTradeStatusMessage(`${pokemonToRelease.name} foi liberado.`);
    }
    setIsReleaseModalOpen(false);
    setPokemonToRelease(null);
  };

  const handleCancelRelease = () => {
    setIsReleaseModalOpen(false);
    setPokemonToRelease(null);
  };

  // Trade Pokemon Logic
  const toggleTradeMode = () => {
    setIsTradeMode(!isTradeMode);
    setSelectedPokemonIds([]); 
  };

  const handlePokemonSelectForTrade = (instanceId: string) => {
    if (!isTradeMode) return;
    setSelectedPokemonIds(prev =>
      prev.includes(instanceId) ? prev.filter(id => id !== instanceId) : [...prev, instanceId]
    );
  };

  const canExecuteTradeOffer = (offer: TradeOffer): boolean => {
    const totalSelectedCount = selectedPokemonIds.length;
    const totalRequiredCount = offer.inputPokemon.reduce((sum, req) => sum + req.count, 0);

    if (totalSelectedCount !== totalRequiredCount) return false;

    for (const requirement of offer.inputPokemon) {
      if ((selectedPokemonCountsByType[requirement.ballType] || 0) !== requirement.count) {
        return false;
      }
    }
    return true;
  };

  const handleOpenTradeConfirmModal = (offer: TradeOffer) => {
    if (!canExecuteTradeOffer(offer)) return;
    setTradeToConfirm(offer);
    setIsTradeConfirmModalOpen(true);
  };

  const handleConfirmTrade = () => {
    if (tradeToConfirm && currentUser) {
      const success = executeTradeContext(selectedPokemonIds, tradeToConfirm.id);
      if (success) {
        setTradeStatusMessage(`Troca bem-sucedida! Você recebeu ${tradeToConfirm.outputBall.count} ${getTranslatedBallName(tradeToConfirm.outputBall.type, tradeToConfirm.outputBall.count > 1)}.`);
        setSelectedPokemonIds([]); 
      } else {
        setTradeStatusMessage("Troca falhou. Verifique as condições e sua seleção.");
      }
    }
    setIsTradeConfirmModalOpen(false);
    setTradeToConfirm(null);
  };
  
  const handleCancelTrade = () => {
    setIsTradeConfirmModalOpen(false);
    setTradeToConfirm(null);
  };

  const formatTradeRequirements = (inputs: TradeOfferInput[]): string => {
    return inputs.map(input => `${input.count} Pokémon (capturado com ${getTranslatedBallName(input.ballType)})`).join(', ');
  };
  
  const formatSelectedTradePokemon = (inputs: TradeOfferInput[]): string => {
    let details = "";
    inputs.forEach(input => {
        const matchingSelected = selectedPokemonDetails.filter(p => p.caughtWithBallType === input.ballType);
        if (matchingSelected.length > 0) {
            if (details !== "") details += "; ";
            details += `${getTranslatedBallName(input.ballType)}: ${matchingSelected.slice(0, 5).map(p => p.name).join(', ')}${matchingSelected.length > 5 ? '...' : ''} (${matchingSelected.length} no total)`;
        }
    });
    return details || "Nenhum correspondendo aos requisitos";
  };


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-bold text-yellow-400">Minha Coleção de Pokémon</h1>
          <p className="text-slate-300 text-lg">
            {isTradeMode ? "Selecione Pokémon para trocar." : "Todos os Pokémon que você capturou!"}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          {!isTradeMode && (
            <div>
              <label htmlFor="sort-pokemon" className="block text-sm font-medium text-slate-400 mb-1">Ordenar por:</label>
              <select
                id="sort-pokemon"
                value={sortOption}
                onChange={handleSortChange}
                className="bg-slate-700 border border-slate-600 text-slate-100 rounded-lg p-2 focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value={SortOption.DATE_DESC}>Data de Captura (Mais Recentes)</option>
                <option value={SortOption.DATE_ASC}>Data de Captura (Mais Antigos)</option>
                <option value={SortOption.ID_ASC}>ID (Crescente)</option>
                <option value={SortOption.ID_DESC}>ID (Decrescente)</option>
                <option value={SortOption.NAME_ASC}>Nome (A-Z)</option>
                <option value={SortOption.NAME_DESC}>Nome (Z-A)</option>
              </select>
            </div>
          )}
          <button
            onClick={toggleTradeMode}
            className={`py-2 px-4 rounded-lg font-semibold transition-colors
              ${isTradeMode ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
          >
            {isTradeMode ? 'Sair do Modo de Troca' : 'Entrar no Modo de Troca'}
          </button>
        </div>
      </div>

      {tradeStatusMessage && (
        <div className={`mb-4 p-3 rounded-lg ${tradeStatusMessage.includes("falhou") ? 'bg-red-500' : 'bg-blue-500'} text-white text-center transition-opacity duration-300`}>
          {tradeStatusMessage}
        </div>
      )}

      {isTradeMode && (
        <div className="p-6 bg-slate-800 rounded-xl shadow-lg space-y-6">
          <h2 className="text-2xl font-bold text-yellow-400">Posto de Troca Pokémon</h2>
          <div className="p-4 bg-slate-700 rounded-lg">
            <h3 className="text-lg font-semibold text-slate-200 mb-2">Selecionados para Troca ({selectedPokemonIds.length} no total):</h3>
            {selectedPokemonIds.length === 0 ? (
              <p className="text-slate-400">Nenhum Pokémon selecionado. Clique nos Pokémon abaixo para selecioná-los para uma troca.</p>
            ) : (
              <ul className="list-disc list-inside text-slate-300">
                {Object.entries(selectedPokemonCountsByType)
                  .filter(([_, count]) => count > 0)
                  .map(([ballType, count]) => (
                    <li key={ballType}>{getTranslatedBallName(ballType as BallType)}: {count as number}</li>
                ))}
              </ul>
            )}
            {selectedPokemonIds.length > 0 && (
                <button 
                    onClick={() => setSelectedPokemonIds([])}
                    className="mt-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold py-1 px-3 rounded"
                >
                    Limpar Seleção
                </button>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-slate-200">Trocas Disponíveis:</h3>
            {TRADE_OFFERS.map(offer => {
              const canTrade = canExecuteTradeOffer(offer);
              return (
                <div key={offer.id} className="p-4 bg-slate-700 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div>
                    <p className="font-semibold text-slate-100">{offer.description}</p>
                    <p className="text-xs text-slate-400">
                      Requer: {formatTradeRequirements(offer.inputPokemon)}
                    </p>
                    <p className="text-xs text-slate-400">
                      Resulta em: {offer.outputBall.count} {getTranslatedBallName(offer.outputBall.type, offer.outputBall.count > 1)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenTradeConfirmModal(offer)}
                    disabled={!canTrade}
                    className={`py-2 px-4 rounded-md font-semibold transition-colors
                      ${canTrade ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-slate-600 text-slate-400 cursor-not-allowed'}`}
                  >
                    Realizar Troca
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {sortedPokemon.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {sortedPokemon.map(pokemon => (
            <PokemonCard 
              key={pokemon.instanceId} 
              pokemon={pokemon} 
              showDate={true} 
              onRelease={isTradeMode ? undefined : () => handleOpenReleaseModal(pokemon)}
              isTradeMode={isTradeMode}
              isSelected={selectedPokemonIds.includes(pokemon.instanceId)}
              onSelect={handlePokemonSelectForTrade}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 px-6 bg-slate-800 rounded-lg shadow">
          <img 
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/premier-ball.png" 
            alt="Premier Ball Vazia" 
            className="mx-auto mb-4 rounded-md w-24 h-24 filter grayscale opacity-60" 
          />
          <p className="text-xl text-slate-400">Sua coleção de Pokémon está vazia.</p>
          <p className="text-slate-500">Complete hábitos para ganhar Poké Bolas e capturar alguns Pokémon!</p>
        </div>
      )}

      <Modal isOpen={isReleaseModalOpen} onClose={handleCancelRelease} title="Confirmar Liberação">
        {pokemonToRelease && (
          <div className="text-center">
            <p className="text-lg text-slate-300 mb-4">
              Tem certeza que deseja liberar este {pokemonToRelease.name}? Esta ação não pode ser desfeita.
            </p>
            <img 
              src={pokemonToRelease.spriteUrl} 
              alt={pokemonToRelease.name} 
              className="w-24 h-24 object-contain mx-auto mb-4"
            />
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={handleConfirmRelease}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Sim, Liberar
              </button>
              <button
                onClick={handleCancelRelease}
                className="bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isTradeConfirmModalOpen} onClose={handleCancelTrade} title="Confirmar Troca">
        {tradeToConfirm && (
          <div className="text-center">
            <p className="text-lg text-slate-300 mb-2">
              Tem certeza que deseja trocar:
            </p>
            <div className="text-md text-slate-200 mb-1 text-left px-4 py-2 bg-slate-700 rounded">
              <strong className="block text-center mb-2">Pokémon Necessários:</strong>
              {tradeToConfirm.inputPokemon.map((req, index) => (
                <p key={index}>{req.count}x Pokémon de {getTranslatedBallName(req.ballType)}</p>
              ))}
            </div>
             <p className="text-sm text-slate-400 my-2 text-left px-4">
                <strong className="block text-center mb-1">Detalhes Selecionados Atualmente:</strong>
                {formatSelectedTradePokemon(tradeToConfirm.inputPokemon)}
            </p>
            <p className="text-lg text-slate-300 mb-4">
              Por: <span className="font-semibold text-yellow-300">{tradeToConfirm.outputBall.count} {getTranslatedBallName(tradeToConfirm.outputBall.type, tradeToConfirm.outputBall.count > 1)}</span>?
            </p>
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={handleConfirmTrade}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Confirmar Troca
              </button>
              <button
                onClick={handleCancelTrade}
                className="bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyPokemonPage;