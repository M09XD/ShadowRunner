import React, { useState, useEffect } from 'react';
import { LoginModal } from './LoginModal';
import { leaderboardAPI } from '@/lib/api';

interface VictoryScreenProps {
  levelNumber: number;
  completionTime: number;
  onNextLevel: () => void;
  onShowLeaderboard: () => void;
  onBackToMenu: () => void;
  isLastLevel: boolean;
}

// Helper to generate guest name
let guestCounter = 1;
function generateGuestName(): string {
  return `guest_${guestCounter++}`;
}

// Get stored guest name or generate new one
function getGuestName(): string {
  let guestName = localStorage.getItem('guestName');
  if (!guestName) {
    guestName = generateGuestName();
    localStorage.setItem('guestName', guestName);
  }
  return guestName;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  levelNumber,
  completionTime,
  onNextLevel,
  onShowLeaderboard,
  onBackToMenu,
  isLastLevel,
}) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    const playerName = localStorage.getItem('playerName');
    setIsLoggedIn(!!(authToken && playerName));
  }, []);

  // Auto-submit score if logged in
  useEffect(() => {
    if (isLoggedIn && !scoreSubmitted) {
      handleAutoSubmitScore();
    }
  }, [isLoggedIn, scoreSubmitted]);

  const handleAutoSubmitScore = async () => {
    const playerName = localStorage.getItem('playerName');
    if (!playerName) return;

    try {
      const playerStats = localStorage.getItem('playerStats');
      const skinId = playerStats ? JSON.parse(playerStats).selectedSkinId || 0 : 0;

      await leaderboardAPI.submit({
        id: 0,
        playerName: playerName,
        levelNumber: levelNumber,
        completionTimeMs: completionTime,
        ranking: 0,
        skinId: skinId,
        createdAt: new Date().toISOString(),
      });
      setScoreSubmitted(true);
    } catch (error) {
      console.error('Error auto-submitting score:', error);
    }
  };

  const handleSubmitScore = async () => {
    if (isLoggedIn) {
      // Already submitted automatically
      onShowLeaderboard();
      return;
    }

    // If not logged in, show login modal or submit as guest
    const guestName = getGuestName();
    try {
      const playerStats = localStorage.getItem('playerStats');
      const skinId = playerStats ? JSON.parse(playerStats).selectedSkinId || 0 : 0;

      await leaderboardAPI.submit({
        id: 0,
        playerName: guestName,
        levelNumber: levelNumber,
        completionTimeMs: completionTime,
        ranking: 0,
        skinId: skinId,
        createdAt: new Date().toISOString(),
      });
      onShowLeaderboard();
    } catch (error) {
      console.error('Error submitting score:', error);
      // Show login modal as fallback
      setShowLoginModal(true);
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      {/* Celebration particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: ['#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6'][Math.floor(Math.random() * 5)],
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative bg-gradient-to-b from-purple-900/90 to-black/90 border-4 border-green-500 rounded-2xl p-12 max-w-lg text-center">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-2xl" />

        <div className="relative z-10">
          {/* Victory text */}
          <h1
            className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-400 mb-4"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            {isLastLevel ? 'GAME COMPLETE!' : 'LEVEL CLEAR!'}
          </h1>

          {/* Level info */}
          <p
            className="text-purple-300 mb-8"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '14px' }}
          >
            Level {levelNumber} Completed
          </p>

          {/* Time */}
          <div className="bg-black/50 rounded-xl p-6 mb-8 border-2 border-purple-700">
            <p
              className="text-purple-400 mb-2"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}
            >
              COMPLETION TIME
            </p>
            <p
              className="text-4xl text-green-400"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              {formatTime(completionTime)}
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-4">
            {!isLastLevel && (
              <button
                onClick={onNextLevel}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white rounded-lg border-2 border-green-500 transition-all duration-200 hover:scale-105"
                style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '14px' }}
              >
                NEXT LEVEL
              </button>
            )}

            <button
              onClick={handleSubmitScore}
              className="w-full py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white rounded-lg border-2 border-yellow-500 transition-all duration-200 hover:scale-105"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '14px' }}
            >
              {isLoggedIn && scoreSubmitted ? 'VIEW LEADERBOARD' : 'SUBMIT SCORE'}
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

      {/* Login / Create Account Modal for submitting score */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={() => {
          setShowLoginModal(false);
          onShowLeaderboard();
        }}
        onGuestLogin={() => {
          setShowLoginModal(false);
          onShowLeaderboard();
        }}
      />
    </div>
  );
};
