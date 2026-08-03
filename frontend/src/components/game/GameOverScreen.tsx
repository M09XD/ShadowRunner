import React from 'react';

interface GameOverScreenProps {
  onRetry: () => void;
  onBackToMenu: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  onRetry,
  onBackToMenu,
}) => {
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      {/* Blood drip effect */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-red-900/50 to-transparent" />

      <div className="relative bg-gradient-to-b from-red-900/50 to-black/90 border-4 border-red-600 rounded-2xl p-12 max-w-lg text-center">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-red-500/10 blur-3xl rounded-2xl" />

        <div className="relative z-10">
          {/* Skull icon */}
          <div className="mb-6">
            <svg className="w-24 h-24 mx-auto text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 3.69 2.47 6.86 6 8.25V22h8v-1.75c3.53-1.39 6-4.56 6-8.25 0-5.52-4.48-10-10-10zm-2 15h-1v-2h1v2zm0-4h-1V9h1v4zm5 4h-1v-2h1v2zm0-4h-1V9h1v4z"/>
            </svg>
          </div>

          {/* Game Over text */}
          <h1
            className="text-5xl font-bold text-red-500 mb-4 animate-pulse"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            GAME OVER
          </h1>

          <p
            className="text-red-300 mb-8"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}
          >
            The Shadow has claimed you...
          </p>

          {/* Buttons */}
          <div className="space-y-4">
            <button
              onClick={onRetry}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white rounded-lg border-2 border-red-500 transition-all duration-200 hover:scale-105"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '14px' }}
            >
              TRY AGAIN
            </button>

            <button
              onClick={onBackToMenu}
              className="w-full py-4 bg-purple-800 hover:bg-purple-700 text-white rounded-lg border-2 border-purple-600 transition-all duration-200"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '14px' }}
            >
              BACK TO MENU
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
