import React from 'react';
import { PLAYER_SKINS } from '@/types/game';

interface SkinSelectProps {
  currentSkin: number;
  onSelectSkin: (skinId: number) => void;
  onBack: () => void;
}

export const SkinSelect: React.FC<SkinSelectProps> = ({
  currentSkin,
  onSelectSkin,
  onBack,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-black to-purple-950 flex flex-col items-center py-8 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h1
          className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          SELECT SKIN
        </h1>
        <p
          className="text-purple-400 mt-4"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
        >
          Choose your runner's appearance
        </p>
      </div>

      {/* Skin Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl">
        {PLAYER_SKINS.map((skin) => (
          <button
            key={skin.id}
            onClick={() => onSelectSkin(skin.id)}
            className={`relative p-6 rounded-xl border-4 transition-all duration-300 ${
              currentSkin === skin.id
                ? 'border-yellow-400 bg-yellow-400/10 scale-105'
                : 'border-purple-700 bg-purple-900/30 hover:border-purple-500 hover:scale-102'
            }`}
          >
            {/* Selected indicator */}
            {currentSkin === skin.id && (
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}

            {/* Skin Preview */}
            <div className="flex flex-col items-center">
              {/* Character preview */}
              <div className="relative mb-4">
                {/* Glow effect */}
                <div
                  className="absolute inset-0 blur-xl opacity-50 rounded-full"
                  style={{ backgroundColor: skin.color }}
                />
                
                {/* Character body */}
                <div className="relative w-20 h-32">
                  {/* Head */}
                  <div
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full"
                    style={{
                      background: `linear-gradient(to bottom, ${skin.color}, ${skin.secondaryColor})`,
                    }}
                  >
                    {/* Eyes */}
                    <div className="absolute top-3 left-2 w-2 h-2 bg-white rounded-full" />
                    <div className="absolute top-3 right-2 w-2 h-2 bg-white rounded-full" />
                    <div className="absolute top-3.5 left-2.5 w-1 h-1 bg-black rounded-full" />
                    <div className="absolute top-3.5 right-2.5 w-1 h-1 bg-black rounded-full" />
                  </div>
                  
                  {/* Body */}
                  <div
                    className="absolute top-10 left-1/2 transform -translate-x-1/2 w-12 h-20 rounded-lg"
                    style={{
                      background: `linear-gradient(to bottom, ${skin.color}, ${skin.secondaryColor})`,
                    }}
                  />
                </div>
              </div>

              {/* Skin name */}
              <p
                className={`text-center ${currentSkin === skin.id ? 'text-yellow-400' : 'text-white'}`}
                style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}
              >
                {skin.name}
              </p>

              {/* Color swatches */}
              <div className="flex gap-2 mt-2">
                <div
                  className="w-6 h-6 rounded-full border-2 border-white/30"
                  style={{ backgroundColor: skin.color }}
                />
                <div
                  className="w-6 h-6 rounded-full border-2 border-white/30"
                  style={{ backgroundColor: skin.secondaryColor }}
                />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Current Selection Info */}
      <div className="mt-12 text-center">
        <p className="text-purple-400" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>
          SELECTED:
        </p>
        <p className="text-white mt-2" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '16px' }}>
          {PLAYER_SKINS[currentSkin].name}
        </p>
      </div>

      {/* Back Button */}
      <button
        onClick={onBack}
        className="mt-8 px-8 py-3 bg-purple-800 hover:bg-purple-700 text-white rounded-lg border-2 border-purple-600 transition-all duration-200"
        style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}
      >
        BACK TO MENU
      </button>
    </div>
  );
};
