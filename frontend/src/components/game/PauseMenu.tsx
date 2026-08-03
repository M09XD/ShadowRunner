import React from 'react';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onBackToMenu: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRestart,
  onBackToMenu,
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gradient-to-b from-purple-900/90 to-black/90 border-4 border-purple-600 rounded-2xl p-8 max-w-md text-center">
        <h1
          className="text-3xl font-bold text-purple-400 mb-8"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          PAUSED
        </h1>

        <div className="space-y-4">
          <button
            onClick={onResume}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white rounded-lg border-2 border-green-500 transition-all duration-200 hover:scale-105"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '14px' }}
          >
            RESUME
          </button>

          <button
            onClick={onRestart}
            className="w-full py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white rounded-lg border-2 border-yellow-500 transition-all duration-200 hover:scale-105"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '14px' }}
          >
            RESTART LEVEL
          </button>

          <button
            onClick={onBackToMenu}
            className="w-full py-4 bg-purple-800 hover:bg-purple-700 text-white rounded-lg border-2 border-purple-600 transition-all duration-200"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '14px' }}
          >
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
