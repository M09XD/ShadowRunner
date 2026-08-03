import React, { useState, useEffect } from 'react';
import { LeaderboardEntry, PLAYER_SKINS } from '@/types/game';
import { leaderboardAPI } from '@/lib/api';
import type { LeaderboardEntry as LeaderboardEntryAPI } from '@/types/api';

interface LeaderboardProps {
  onBack: () => void;
  currentLevel?: number;
  completionTime?: number;
  playerName?: string;
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

export const Leaderboard: React.FC<LeaderboardProps> = ({
  onBack,
  currentLevel,
  completionTime,
  playerName: initialPlayerName,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntryAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState(currentLevel || 1);
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(!!completionTime);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is logged in and set player name
  useEffect(() => {
    const storedPlayerName = localStorage.getItem('playerName');
    const authToken = localStorage.getItem('authToken');
    
    if (storedPlayerName && authToken) {
      setIsLoggedIn(true);
      setPlayerName(storedPlayerName);
    } else if (showSubmitForm) {
      // If not logged in and showing submit form, use guest name
      const guestName = getGuestName();
      setPlayerName(guestName);
      setIsLoggedIn(false);
    } else if (initialPlayerName) {
      setPlayerName(initialPlayerName);
    }
  }, [showSubmitForm, initialPlayerName]);

  // Fetch leaderboard entries
  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const response = await leaderboardAPI.getByLevel(selectedLevel);
        if (response.data) {
          setEntries(response.data);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
      setLoading(false);
    }

    fetchLeaderboard();
  }, [selectedLevel]);

  const handleSubmitScore = async () => {
    if (!playerName.trim() || !completionTime || !currentLevel) return;

    try {
      // Get current skin from game state or localStorage
      const playerStats = localStorage.getItem('playerStats');
      const skinId = playerStats ? JSON.parse(playerStats).selectedSkinId || 0 : 0;

      const response = await leaderboardAPI.submit({
        id: 0,
        playerName: playerName.trim(),
        levelNumber: currentLevel,
        completionTimeMs: completionTime,
        ranking: 0, // Will be calculated by backend
        skinId: skinId,
        createdAt: new Date().toISOString(),
      });

      if (response.data) {
        setSubmitted(true);
        setShowSubmitForm(false);
        // Refresh leaderboard
        const leaderboardResponse = await leaderboardAPI.getByLevel(currentLevel);
        if (leaderboardResponse.data) {
          setEntries(leaderboardResponse.data);
        }
      } else if (response.error) {
        console.error('Error submitting score:', response.error);
        alert('Failed to submit score: ' + response.error);
      }
    } catch (error) {
      console.error('Error submitting score:', error);
      alert('Failed to submit score. Please try again.');
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-black to-purple-950 flex flex-col items-center py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1
          className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-400"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          LEADERBOARD
        </h1>
      </div>

      {/* Submit Score Form */}
      {showSubmitForm && completionTime && !submitted && (
        <div className="w-full max-w-md mb-8 bg-purple-900/50 border-2 border-green-500 rounded-lg p-6">
          <h2
            className="text-xl text-green-400 mb-4 text-center"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            NEW RECORD!
          </h2>
          <p className="text-white text-center mb-4" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}>
            Level {currentLevel} - {formatTime(completionTime)}
          </p>
          {isLoggedIn ? (
            <div className="mb-4">
              <p className="text-purple-300 mb-2" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>
                SUBMITTING AS:
              </p>
              <p className="text-green-400 text-center" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}>
                {playerName}
              </p>
            </div>
          ) : (
            <div className="mb-4">
              <p className="text-purple-300 mb-2" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>
                PLAYING AS GUEST:
              </p>
              <p className="text-yellow-400 text-center" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}>
                {playerName}
              </p>
            </div>
          )}
          <button
            onClick={handleSubmitScore}
            disabled={!playerName.trim()}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg transition-all duration-200"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}
          >
            SUBMIT SCORE
          </button>
        </div>
      )}

      {/* Level Selector */}
      <div className="flex gap-2 mb-6 flex-wrap justify-center">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(level => (
          <button
            key={level}
            onClick={() => setSelectedLevel(level)}
            className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
              selectedLevel === level
                ? level === 16 ? 'bg-red-600 border-red-400 text-white' : 'bg-purple-600 border-purple-400 text-white'
                : level === 16 ? 'bg-red-900/50 border-red-700 text-red-400 hover:border-red-500' : 'bg-purple-900/50 border-purple-700 text-purple-400 hover:border-purple-500'
            }`}
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
          >
            {level === 16 ? 'BOSS' : `LEVEL ${level}`}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="w-full max-w-2xl bg-black/50 border-2 border-purple-700 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-purple-900/50 border-b-2 border-purple-700">
          <div className="text-purple-300" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>
            RANK
          </div>
          <div className="text-purple-300" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>
            PLAYER
          </div>
          <div className="text-purple-300" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>
            TIME
          </div>
          <div className="text-purple-300" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>
            SKIN
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-purple-400 animate-pulse" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}>
              Loading...
            </p>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-purple-500" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}>
              No records yet. Be the first!
            </p>
          </div>
        ) : (
          entries.map((entry, index) => (
            <div
              key={entry.id}
              className={`grid grid-cols-4 gap-4 p-4 border-b border-purple-800/50 ${
                entry.ranking === 1 ? 'bg-yellow-500/10' : entry.ranking === 2 ? 'bg-gray-400/10' : entry.ranking === 3 ? 'bg-orange-500/10' : ''
              }`}
            >
              <div className="flex items-center">
                <span
                  className={`${
                    entry.ranking === 1 ? 'text-yellow-400' : entry.ranking === 2 ? 'text-gray-300' : entry.ranking === 3 ? 'text-orange-400' : 'text-purple-400'
                  }`}
                  style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '14px' }}
                >
                  #{entry.ranking || index + 1}
                </span>
              </div>
              <div className="text-white truncate" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '11px' }}>
                {entry.playerName}
              </div>
              <div className="text-green-400" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '11px' }}>
                {formatTime(entry.completionTimeMs)}
              </div>
              <div className="flex items-center">
                <div
                  className="w-6 h-8 rounded"
                  style={{
                    background: `linear-gradient(to bottom, ${PLAYER_SKINS[entry.skinId || 0].color}, ${PLAYER_SKINS[entry.skinId || 0].secondaryColor})`,
                  }}
                />
              </div>
            </div>
          ))
        )}
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
