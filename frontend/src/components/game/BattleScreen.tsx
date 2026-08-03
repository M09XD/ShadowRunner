import React, { useEffect, useRef } from 'react';
import { BattleState, MoveDetails } from '@/types/game';

interface BattleScreenProps {
  battleState: BattleState;
  onMoveSelect: (move: MoveDetails) => void;
  onBattleEnd: (playerWon: boolean) => void;
}

const typeColors: Record<string, string> = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC',
};

export const BattleScreen: React.FC<BattleScreenProps> = ({
  battleState,
  onMoveSelect,
  onBattleEnd,
}) => {
  const logRef = useRef<HTMLDivElement>(null);

  // Auto-scroll battle log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [battleState.battleLog]);

  // Handle battle end
  useEffect(() => {
    if (battleState.battleEnded && battleState.winner) {
      const timer = setTimeout(() => {
        onBattleEnd(battleState.winner === 'player');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [battleState.battleEnded, battleState.winner, onBattleEnd]);

  const playerHPPercent = (battleState.playerHP / battleState.playerMaxHP) * 100;
  const shadowHPPercent = (battleState.shadowHP / battleState.shadowMaxHP) * 100;

  const getHPColor = (percent: number) => {
    if (percent > 50) return 'bg-green-500';
    if (percent > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-purple-950 via-black to-purple-950 flex flex-col">
      {/* Battle Arena */}
      <div className="flex-1 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 to-black/50" />
        
        {/* Battle field pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-purple-800 to-transparent" />
        </div>

        {/* Shadow Pokemon (Top Right) */}
        <div className="absolute top-8 right-8 w-96">
          {/* HP Bar */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-3 border-2 border-gray-700 mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white uppercase" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}>
                {battleState.shadowPokemon?.name || 'Shadow'}
              </span>
              <span className="text-gray-400" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>
                Lv50
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>HP</span>
              <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
                <div
                  className={`h-full ${getHPColor(shadowHPPercent)} transition-all duration-500`}
                  style={{ width: `${shadowHPPercent}%` }}
                />
              </div>
            </div>
            <div className="text-right text-gray-400 mt-1" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}>
              {battleState.shadowHP}/{battleState.shadowMaxHP}
            </div>
          </div>

          {/* Shadow Pokemon Sprite */}
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-3xl animate-pulse" />
            <img
              src={battleState.shadowPokemon?.sprites.front_default || ''}
              alt={battleState.shadowPokemon?.name}
              className="w-48 h-48 ml-auto pixelated drop-shadow-[0_0_20px_rgba(255,0,0,0.5)]"
            />
          </div>
        </div>

        {/* Player Pokemon (Bottom Left) */}
        <div className="absolute bottom-32 left-8 w-96">
          {/* Player Pokemon Sprite */}
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-3xl" />
            <img
              src={battleState.playerPokemon?.sprites.back_default || ''}
              alt={battleState.playerPokemon?.name}
              className="w-56 h-56 pixelated drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]"
            />
          </div>

          {/* HP Bar */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-3 border-2 border-purple-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white uppercase" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}>
                {battleState.playerPokemon?.name || 'Pokemon'}
              </span>
              <span className="text-gray-400" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>
                Lv50
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>HP</span>
              <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
                <div
                  className={`h-full ${getHPColor(playerHPPercent)} transition-all duration-500`}
                  style={{ width: `${playerHPPercent}%` }}
                />
              </div>
            </div>
            <div className="text-right text-gray-400 mt-1" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}>
              {battleState.playerHP}/{battleState.playerMaxHP}
            </div>
          </div>
        </div>

        {/* Battle Log */}
        <div className="absolute top-8 left-8 w-80">
          <div
            ref={logRef}
            className="bg-black/80 border-2 border-purple-700 rounded-lg p-3 h-40 overflow-y-auto"
          >
            {battleState.battleLog.slice(-6).map((log, index) => (
              <p
                key={index}
                className="text-white mb-1"
                style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px' }}
              >
                {log}
              </p>
            ))}
          </div>
        </div>

        {/* Turn Indicator */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {battleState.isAnimating && (
            <div className="text-yellow-400 animate-bounce" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '14px' }}>
              {battleState.currentTurn === 'player' ? 'YOUR TURN' : 'SHADOW\'S TURN'}
            </div>
          )}
        </div>

        {/* Victory/Defeat Overlay */}
        {battleState.battleEnded && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className={`text-4xl ${battleState.winner === 'player' ? 'text-green-400' : 'text-red-500'} animate-pulse`}
                 style={{ fontFamily: '"Press Start 2P", monospace' }}>
              {battleState.winner === 'player' ? 'VICTORY!' : 'DEFEAT...'}
            </div>
          </div>
        )}
      </div>

      {/* Move Selection Panel */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-t-4 border-purple-700 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 gap-3">
            {battleState.playerMoves.map((move, index) => (
              <button
                key={index}
                onClick={() => onMoveSelect(move)}
                disabled={battleState.isAnimating || battleState.currentTurn !== 'player' || battleState.battleEnded}
                className="relative group p-4 rounded-lg border-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-102"
                style={{
                  backgroundColor: typeColors[move.type.name] || '#888',
                  borderColor: battleState.currentTurn === 'player' && !battleState.isAnimating ? '#fff' : 'transparent',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white uppercase font-bold"
                        style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '11px' }}>
                    {move.name.replace('-', ' ')}
                  </span>
                  <span className="text-white/80"
                        style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px' }}>
                    PP {move.pp}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-white/70 uppercase"
                        style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}>
                    {move.type.name}
                  </span>
                  <span className="text-white/70"
                        style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}>
                    PWR {move.power || '-'}
                  </span>
                </div>
                
                {/* Hover effect */}
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity" />
              </button>
            ))}
          </div>

          {/* Instructions */}
          <div className="mt-4 text-center">
            <p className="text-purple-400" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>
              {battleState.battleEnded
                ? 'Battle ended! Returning to game...'
                : battleState.currentTurn === 'player'
                ? 'Select a move to attack!'
                : 'Shadow is choosing a move...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
