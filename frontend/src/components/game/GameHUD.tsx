import React, { useState } from 'react';
import { GameState, Level } from '@/types/game';

interface GameHUDProps {
  gameState: GameState;
  levelData: Level | null;
  onPause: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  masterVolume?: number;
  onVolumeChange?: (volume: number) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  gameState,
  levelData,
  onPause,
  isMuted = false,
  onToggleMute,
  masterVolume = 0.5,
  onVolumeChange,
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = levelData
    ? Math.min(100, (gameState.player.x / (levelData.exit_position.x - 50)) * 100)
    : 0;

  const shadowTimeRemaining = Math.max(0, Math.ceil((gameState.shadow.spawnTime - Date.now()) / 1000));

  return (
    <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none">
      <div className="flex items-start justify-between">
        {/* Left side - Level info */}
        <div className="pointer-events-auto">
          <div className="bg-black/70 rounded-lg p-3 border-2 border-purple-700">
            <p className="text-purple-400" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>
              LEVEL {gameState.currentLevel}
            </p>
            <p className="text-white mt-1" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}>
              {levelData?.name || 'Unknown'}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mt-2 bg-black/70 rounded-lg p-2 border-2 border-purple-700">
            <div className="flex items-center gap-2">
              <span className="text-purple-400" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}>
                PROGRESS
              </span>
              <div className="w-32 h-3 bg-purple-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-green-400" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}>
                {Math.floor(progressPercent)}%
              </span>
            </div>
          </div>
        </div>

        {/* Center - Shadow warning */}
        {!gameState.shadow.active && shadowTimeRemaining <= 10 && (
          <div className={`bg-black/70 rounded-lg p-3 border-2 ${shadowTimeRemaining <= 5 ? 'border-red-500 animate-pulse' : 'border-yellow-500'}`}>
            <p className={`${shadowTimeRemaining <= 5 ? 'text-red-500' : 'text-yellow-400'}`}
               style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>
              SHADOW IN {shadowTimeRemaining}s
            </p>
          </div>
        )}

        {gameState.shadow.active && (
          <div className="bg-black/70 rounded-lg p-3 border-2 border-red-500 animate-pulse">
            <p className="text-red-500" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>
              SHADOW HUNTING
            </p>
          </div>
        )}

        {/* Right side - Timer, audio controls, and menu */}
        <div className="pointer-events-auto">
          <div className="bg-black/70 rounded-lg p-3 border-2 border-red-600">
            <p className="text-red-400" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}>
              TIME
            </p>
            <p className="text-white text-xl" style={{ fontFamily: '"Press Start 2P", monospace' }}>
              {formatTime(gameState.timer)}
            </p>
          </div>

          {/* Audio controls */}
          <div className="mt-2 flex gap-2">
            <button
              onClick={onToggleMute}
              className="p-2 bg-purple-800 hover:bg-purple-700 text-white rounded-lg border-2 border-purple-600 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                className="p-2 bg-purple-800 hover:bg-purple-700 text-white rounded-lg border-2 border-purple-600 transition-colors"
                title="Volume"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </button>
              
              {showVolumeSlider && (
                <div className="absolute right-0 top-12 bg-black/90 rounded-lg p-3 border-2 border-purple-600 z-50">
                  <p className="text-purple-400 mb-2" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}>
                    VOLUME
                  </p>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={masterVolume}
                    onChange={(e) => onVolumeChange?.(parseFloat(e.target.value))}
                    className="w-24 accent-purple-500"
                  />
                  <p className="text-white text-center mt-1" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}>
                    {Math.round(masterVolume * 100)}%
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onPause}
            className="mt-2 w-full py-2 bg-purple-800 hover:bg-purple-700 text-white rounded-lg border-2 border-purple-600 transition-colors"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
          >
            MENU
          </button>
        </div>
      </div>

      {/* Bottom controls hint */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-black/50 rounded-lg px-4 py-2 border border-purple-700/50">
          <p className="text-purple-500" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}>
            WASD / ARROWS to move • SPACE to jump
          </p>
        </div>
      </div>
    </div>
  );
};
