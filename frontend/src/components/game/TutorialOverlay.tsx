import React, { useState } from 'react';

interface TutorialOverlayProps {
  onClose: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose }) => {
  const [page, setPage] = useState(0);

  const pages = [
    {
      title: 'WELCOME TO SHADOW RUNNER',
      content: [
        'Navigate through treacherous dungeons',
        'Reach the glowing green exit to complete each level',
        'Beware of deadly traps and the Shadow that hunts you',
      ],
      icon: (
        <svg className="w-24 h-24 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      ),
    },
    {
      title: 'CONTROLS',
      content: [
        'ARROW KEYS or WASD to move',
        'SPACE or UP ARROW to jump',
        'ESC to pause the game',
      ],
      icon: (
        <div className="flex gap-2">
          <div className="w-12 h-12 bg-purple-700 rounded border-2 border-purple-500 flex items-center justify-center text-white font-bold">W</div>
          <div className="w-12 h-12 bg-purple-700 rounded border-2 border-purple-500 flex items-center justify-center text-white font-bold">A</div>
          <div className="w-12 h-12 bg-purple-700 rounded border-2 border-purple-500 flex items-center justify-center text-white font-bold">S</div>
          <div className="w-12 h-12 bg-purple-700 rounded border-2 border-purple-500 flex items-center justify-center text-white font-bold">D</div>
        </div>
      ),
    },
    {
      title: 'THE SHADOW',
      content: [
        'The Shadow spawns 15 seconds after level start',
        'It will chase you relentlessly',
        'If caught, you must battle to survive!',
      ],
      icon: (
        <div className="relative w-24 h-32">
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-24 bg-black rounded-lg" />
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-black rounded-full">
            <div className="absolute top-4 left-2 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
            <div className="absolute top-4 right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
          </div>
        </div>
      ),
    },
    {
      title: 'POKEMON BATTLES',
      content: [
        'Select from ALL 1025 Pokemon!',
        'You have 10 seconds to choose',
        'Win to continue, lose to restart the level',
        'Turn order: Player → Shadow → repeat',
      ],
      icon: (
        <img
          src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"
          alt="Pikachu"
          className="w-24 h-24 pixelated"
        />
      ),
    },
    {
      title: 'TRAPS & HAZARDS',
      content: [
        'Spikes: Instant death on contact',
        'Fake Floors: They look solid but aren\'t!',
        'Moving Traps: Watch their patterns',
        'Surprise Spikes: Appear without warning',
      ],
      icon: (
        <svg className="w-24 h-24 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L4 20h16L12 2zm0 4l5.5 12h-11L12 6z" />
        </svg>
      ),
    },
  ];

  const currentPage = pages[page];

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="bg-gradient-to-b from-purple-900/90 to-black/90 border-4 border-purple-600 rounded-2xl p-8 max-w-lg w-full mx-4">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {pages.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                i === page ? 'bg-purple-400' : 'bg-purple-800'
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          {currentPage.icon}
        </div>

        {/* Title */}
        <h2
          className="text-xl text-purple-400 text-center mb-6"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          {currentPage.title}
        </h2>

        {/* Content */}
        <ul className="space-y-3 mb-8">
          {currentPage.content.map((item, i) => (
            <li
              key={i}
              className="text-white flex items-start gap-2"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
            >
              <span className="text-purple-400">•</span>
              {item}
            </li>
          ))}
        </ul>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 bg-purple-800 hover:bg-purple-700 disabled:bg-purple-900 disabled:opacity-50 text-white rounded-lg transition-colors"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
          >
            BACK
          </button>

          {page < pages.length - 1 ? (
            <button
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
            >
              NEXT
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
            >
              START GAME
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
