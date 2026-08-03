import React, { useState, useEffect } from 'react';
import { LoginModal } from './LoginModal';
import { TutorialOverlay } from './TutorialOverlay';
// Assuming these imports exist in your project structure
import { getHighestUnlockedLevel, resetProgress } from '@/lib/levelProgress';

interface MainMenuProps {
  onStartGame: (level: number) => void;
  onShowLeaderboard: () => void;
  onShowSkinSelect: () => void;
  onShowProfile: () => void;
  currentSkin: number;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onShowLeaderboard,
  onShowSkinSelect,
  onShowProfile,
}) => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // LOGIC: Highest unlocked level state
  const [highestUnlockedLevel, setHighestUnlockedLevel] = useState<number>(1);

  // ------------------------------------------------------------------
  // LOGIC SECTION (Kept exactly as requested)
  // ------------------------------------------------------------------
  useEffect(() => {
    const updateUnlocked = () => {
      const currentPlayer = localStorage.getItem('playerName');
      // Get the highest level (returns 1 if player is null/guest)
      const highest = getHighestUnlockedLevel(currentPlayer);
      setHighestUnlockedLevel(highest);
    };
    
    updateUnlocked();
    const interval = setInterval(updateUnlocked, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    const storedPlayerName = localStorage.getItem('playerName');
    if (authToken && storedPlayerName) {
      setIsLoggedIn(true);
      setPlayerName(storedPlayerName);
    }
  }, []);

  const handleStartGame = (level: number) => {
    const hasPlayed = localStorage.getItem('shadowRunnerPlayed');
    if (!hasPlayed) {
      localStorage.setItem('shadowRunnerPlayed', 'true');
      setShowTutorial(true);
    } else {
      onStartGame(level);
    }
  };

  const handleTutorialClose = () => {
    setShowTutorial(false);
    onStartGame(1);
  };

  const handleLogin = (name: string) => {
    setPlayerName(name);
    setIsLoggedIn(true);
    setShowLoginModal(false);
    setHighestUnlockedLevel(getHighestUnlockedLevel(name));
  };

  const handleGuestLogin = () => {
    const guestName = `Survivor_${Math.floor(Math.random() * 999)}`;
    setPlayerName(guestName);
    setIsLoggedIn(true);
    setShowLoginModal(false);
    setHighestUnlockedLevel(1);
  };

  const handleLogout = () => {
    const currentPlayer = localStorage.getItem('playerName');
    if (currentPlayer) {
      resetProgress(currentPlayer);
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('playerName');
    setIsLoggedIn(false);
    setPlayerName(null);
    setHighestUnlockedLevel(1);
  };

  // ------------------------------------------------------------------
  // VISUALS & RENDERING
  // ------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden font-mono select-none">
      
      {/* GLOBAL STYLES FOR HORROR EFFECTS */}
      <style>{`
        @keyframes scanline {
          0% { background-position: 0% 0%; }
          100% { background-position: 0% 100%; }
        }
        @keyframes flicker {
          0% { opacity: 0.9; }
          5% { opacity: 0.5; }
          10% { opacity: 0.9; }
          100% { opacity: 0.9; }
        }
        @keyframes glitch {
          0% { clip-path: inset(40% 0 61% 0); transform: translate(-2px, 2px); }
          20% { clip-path: inset(92% 0 1% 0); transform: translate(0px); }
          40% { clip-path: inset(43% 0 1% 0); transform: translate(2px, -2px); }
          60% { clip-path: inset(25% 0 58% 0); transform: translate(2px, 2px); }
          80% { clip-path: inset(54% 0 7% 0); transform: translate(-2px, -2px); }
          100% { clip-path: inset(58% 0 43% 0); transform: translate(0); }
        }
        .crt-overlay {
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
          background-size: 100% 2px, 3px 100%;
          pointer-events: none;
        }
        .text-glitch:hover {
          animation: glitch 0.3s cubic-bezier(.25, .46, .45, .94) both infinite;
          color: #ff0000;
          text-shadow: 2px 0 #00fff9, -2px 0 #ff00c1;
        }
        .blood-pulse {
          box-shadow: 0 0 0 0 rgba(153, 27, 27, 0.7);
          animation: pulse-red 2s infinite;
        }
        @keyframes pulse-red {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(153, 27, 27, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(153, 27, 27, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(153, 27, 27, 0); }
        }
      `}</style>

      {/* Tutorial Overlay */}
      {showTutorial && <TutorialOverlay onClose={handleTutorialClose} />}

      {/* 1. BACKGROUND LAYERS */}
      {/* Moving Fog/Noise */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] animate-pulse" />
      
      {/* Red Ambient Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_60%,rgba(50,0,0,0.6)_100%)]" />

      {/* CRT Scanlines Overlay */}
      <div className="absolute inset-0 z-50 crt-overlay" />


      {/* 2. MAIN CONTENT */}
      <div className="relative z-10 text-center w-full max-w-4xl px-4">
        
        {/* Title Section */}
        <div className="mb-12 relative group">
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-white relative inline-block mix-blend-difference"
              style={{ fontFamily: '"Press Start 2P", monospace' }}>
            <span className="text-red-600 inline-block animate-[flicker_4s_infinite]">SHADOW</span>
            <span className="block text-4xl md:text-6xl text-gray-500 mt-2 tracking-[1rem] group-hover:tracking-[0.5rem] transition-all duration-500">RUNNER</span>
          </h1>
          <div className="text-red-900/60 text-sm mt-4 tracking-widest uppercase animate-pulse">
            // System Breach Detected // 
          </div>
        </div>

        {/* Login Status - Styled like a terminal readout */}
        {isLoggedIn && playerName && (
          <div className="mb-8 inline-flex items-center gap-4 bg-black/80 border-l-4 border-red-800 p-4 backdrop-blur-sm">
             <div className="text-left">
                <p className="text-xs text-gray-500 font-bold mb-1">SUBJECT_ID:</p>
                <p className="text-red-500 font-mono tracking-wider">{playerName}</p>
             </div>
             <div className="h-8 w-[1px] bg-red-900 mx-2"></div>
             <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-white hover:bg-red-900/50 px-3 py-1 rounded transition-colors uppercase border border-gray-800"
            >
               LOGOUT 
            </button>
          </div>
        )}

        {/* 3. MENU BUTTONS */}
        <div className="flex flex-col items-center gap-6">
          
          {/* PRIMARY ACTION: START */}
          <button
            onClick={() => handleStartGame(1)}
            className="group relative w-72 py-4 bg-black border-2 border-red-900/50 hover:border-red-600 text-white overflow-hidden transition-all duration-100 hover:scale-105"
          >
            <div className="absolute inset-0 bg-red-900/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <span className="relative z-10 font-bold tracking-widest text-glitch" style={{ fontFamily: '"Press Start 2P", monospace' }}>
              INITIATE
            </span>
          </button>

          {/* LEVEL GRID - THE CORE LOGIC */}
          <div className="w-full max-w-lg bg-black/50 p-6 border border-gray-900 backdrop-blur-md">
            <p className="text-gray-500 text-xs mb-4 text-left tracking-widest border-b border-gray-800 pb-2">
              LEVEL SELECTION :: MAX CLEARANCE LEVEL: {highestUnlockedLevel}
            </p>
            
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(level => {
                const unlocked = level <= highestUnlockedLevel;
                const isBoss = level === 16;
                
                return (
                  <button
                    key={level}
                    onClick={() => unlocked && onStartGame(level)}
                    disabled={!unlocked}
                    className={`
                      relative h-12 border transition-all duration-300 overflow-hidden
                      ${unlocked 
                        ? isBoss 
                          ? 'border-red-600 bg-red-950/30 hover:bg-red-900/50 text-red-500 blood-pulse' // Boss Style
                          : 'border-gray-600 bg-gray-900/50 hover:border-white hover:bg-gray-800 text-gray-300' // Unlocked Style
                        : 'border-gray-900 bg-black text-gray-800 cursor-not-allowed opacity-60' // Locked Style
                      }
                    `}
                    style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
                  >
                    {/* Hover Effect for Unlocked */}
                    {unlocked && (
                      <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity" />
                    )}
                    
                    {/* Text Content */}
                    <span className={`relative z-10 ${isBoss ? 'animate-pulse' : ''}`}>
                      {isBoss ? '☠' : level.toString().padStart(2, '0')}
                    </span>

                    {/* Lock Icon */}
                    {!unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                         <span className="text-[8px] text-red-900">ERR</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECONDARY ACTIONS */}
          <div className="flex flex-wrap justify-center gap-4 w-full max-w-lg">
            <button
              onClick={onShowSkinSelect}
              className="flex-1 py-3 border border-orange-900/30 text-orange-700 hover:text-orange-500 hover:border-orange-600 hover:bg-orange-950/20 transition-all text-xs"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              SKINS
            </button>
            
            <button
              onClick={() => !isLoggedIn ? setShowLoginModal(true) : onShowLeaderboard()}
              className="flex-1 py-3 border border-gray-800 text-gray-500 hover:text-white hover:border-gray-500 hover:bg-gray-900 transition-all text-xs"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              LEADERBOARD
            </button>

            {isLoggedIn && (
               <button
               onClick={onShowProfile}
               className="flex-1 py-3 border border-purple-900/30 text-purple-700 hover:text-purple-400 hover:border-purple-600 hover:bg-purple-950/20 transition-all text-xs"
               style={{ fontFamily: '"Press Start 2P", monospace' }}
             >
               PROFILE
             </button>
            )}
          </div>
          
          <button
            onClick={() => setShowTutorial(true)}
            className="text-[10px] text-gray-600 hover:text-red-500 underline decoration-red-900 underline-offset-4 hover:decoration-red-500 transition-all"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            SURVIVAL MANUAL
          </button>

        </div>

        {/* Controls Hint */}
        <div className="mt-16 text-gray-700 text-[10px] flex flex-col gap-2 opacity-50">
           <p className="tracking-widest">CONTROLS DETECTED</p>
           <div className="flex justify-center gap-8 font-mono">
              <span>[WASD] MOVE</span>
              <span>[SPACE] JUMP</span>
           </div>
        </div>
      </div>

      {/* Decorative Corner Borders */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-red-900/30" />
      <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-red-900/30" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-red-900/30" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-red-900/30" />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
        onGuestLogin={handleGuestLogin}
      />
    </div>
  );
};