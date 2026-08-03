import React, { useState, useEffect } from 'react';
import { leaderboardAPI, playerAPI } from '@/lib/api';
import type { LeaderboardEntry, PlayerStats } from '@/types/api';
import { PLAYER_SKINS } from '@/types/game';

interface PlayerProfileProps {
  onBack: () => void;
  onLogout?: () => void;
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({ onBack, onLogout }) => {
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [levelRecords, setLevelRecords] = useState<Record<number, LeaderboardEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  useEffect(() => {
    const storedPlayerName = localStorage.getItem('playerName');
    const authToken = localStorage.getItem('authToken');
    
    if (storedPlayerName && authToken) {
      setPlayerName(storedPlayerName);
      loadPlayerData(storedPlayerName);
    } else {
      setLoading(false);
    }
  }, []);

  const loadPlayerData = async (name: string) => {
    try {
      setLoading(true);
      
      // Load player stats
      const statsResponse = await playerAPI.getStats(name);
      if (statsResponse.data) {
        setPlayerStats(statsResponse.data);
      }

      // Load player history (all level records)
      const historyResponse = await leaderboardAPI.getPlayerHistory(name);
      if (historyResponse.data) {
        // Group records by level
        const grouped: Record<number, LeaderboardEntry[]> = {};
        historyResponse.data.forEach(entry => {
          if (!grouped[entry.levelNumber]) {
            grouped[entry.levelNumber] = [];
          }
          grouped[entry.levelNumber].push(entry);
        });
        setLevelRecords(grouped);
      }
    } catch (error) {
      console.error('Error loading player data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!playerName) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-950 via-black to-purple-950 flex flex-col items-center justify-center">
        <div className="text-center">
          <h1
            className="text-3xl font-bold text-purple-400 mb-4"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            NOT LOGGED IN
          </h1>
          <p
            className="text-purple-300 mb-8"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}
          >
            Please log in to view your profile
          </p>
          <button
            onClick={onBack}
            className="px-8 py-3 bg-purple-800 hover:bg-purple-700 text-white rounded-lg border-2 border-purple-600 transition-all duration-200"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}
          >
            BACK TO MENU
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-black to-purple-950 flex flex-col items-center py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1
          className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          PLAYER PROFILE
        </h1>
        <p
          className="text-purple-300 mt-4"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '14px' }}
        >
          {playerName}
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <p className="text-purple-400 animate-pulse" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}>
            Loading...
          </p>
        </div>
      ) : (
        <>
          {/* Player Stats */}
          {playerStats && (
            <div className="w-full max-w-2xl mb-8 bg-purple-900/50 border-2 border-purple-700 rounded-lg p-6">
              <h2
                className="text-xl text-purple-300 mb-4"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                STATISTICS
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-purple-400 mb-2" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>
                    CURRENT LEVEL
                  </p>
                  <p className="text-white text-2xl" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                    {playerStats.currentLevel}
                  </p>
                </div>
                <div>
                  <p className="text-purple-400 mb-2" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>
                    TOTAL WINS
                  </p>
                  <p className="text-green-400 text-2xl" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                    {playerStats.totalWins}
                  </p>
                </div>
                <div>
                  <p className="text-purple-400 mb-2" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>
                    TOTAL LOSSES
                  </p>
                  <p className="text-red-400 text-2xl" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                    {playerStats.totalLosses}
                  </p>
                </div>
                <div>
                  <p className="text-purple-400 mb-2" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>
                    PLAY TIME
                  </p>
                  <p className="text-yellow-400 text-lg" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                    {Math.floor(playerStats.totalPlayTimeMs / 60000)}m
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Level Records */}
          <div className="w-full max-w-4xl">
            <h2
              className="text-2xl text-purple-300 mb-4 text-center"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              LEVEL RECORDS
            </h2>

            {/* Level Selector */}
            <div className="flex gap-2 mb-6 flex-wrap justify-center">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(level => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(selectedLevel === level ? null : level)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
                    selectedLevel === level
                      ? level === 16 ? 'bg-red-600 border-red-400 text-white' : 'bg-purple-600 border-purple-400 text-white'
                      : level === 16 ? 'bg-red-900/50 border-red-700 text-red-400 hover:border-red-500' : 'bg-purple-900/50 border-purple-700 text-purple-400 hover:border-purple-500'
                  }`}
                  style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
                >
                  {level === 16 ? 'BOSS' : `LEVEL ${level}`}
                  {levelRecords[level] && (
                    <span className="ml-2 text-xs">({levelRecords[level].length})</span>
                  )}
                </button>
              ))}
            </div>

            {/* Records for Selected Level */}
            {selectedLevel && levelRecords[selectedLevel] && levelRecords[selectedLevel].length > 0 ? (
              <div className="bg-black/50 border-2 border-purple-700 rounded-lg overflow-hidden">
                <div className="grid grid-cols-4 gap-4 p-4 bg-purple-900/50 border-b-2 border-purple-700">
                  <div className="text-purple-300" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>
                    #
                  </div>
                  <div className="text-purple-300" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>
                    TIME
                  </div>
                  <div className="text-purple-300" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>
                    RANK
                  </div>
                  <div className="text-purple-300" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}>
                    DATE
                  </div>
                </div>
                {levelRecords[selectedLevel]
                  .sort((a, b) => a.completionTimeMs - b.completionTimeMs)
                  .map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`grid grid-cols-4 gap-4 p-4 border-b border-purple-800/50 ${
                        entry.ranking === 1 ? 'bg-yellow-500/10' : entry.ranking === 2 ? 'bg-gray-400/10' : entry.ranking === 3 ? 'bg-orange-500/10' : ''
                      }`}
                    >
                      <div className="text-purple-400" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '11px' }}>
                        #{index + 1}
                      </div>
                      <div className="text-green-400" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '11px' }}>
                        {formatTime(entry.completionTimeMs)}
                      </div>
                      <div className={`${
                        entry.ranking === 1 ? 'text-yellow-400' : entry.ranking === 2 ? 'text-gray-300' : entry.ranking === 3 ? 'text-orange-400' : 'text-purple-300'
                      }`} style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '11px' }}>
                        {entry.ranking ? `#${entry.ranking}` : 'N/A'}
                      </div>
                      <div className="text-purple-400 text-xs" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                        {formatDate(entry.createdAt)}
                      </div>
                    </div>
                  ))}
              </div>
            ) : selectedLevel ? (
              <div className="p-8 text-center bg-black/50 border-2 border-purple-700 rounded-lg">
                <p className="text-purple-500" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}>
                  No records for Level {selectedLevel} yet
                </p>
              </div>
            ) : (
              <div className="p-8 text-center bg-black/50 border-2 border-purple-700 rounded-lg">
                <p className="text-purple-400" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}>
                  Select a level to view your records
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4 justify-center">
        <button
          onClick={onBack}
          className="px-8 py-3 bg-purple-800 hover:bg-purple-700 text-white rounded-lg border-2 border-purple-600 transition-all duration-200"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}
        >
          BACK TO MENU
        </button>
        {onLogout && (
          <button
            onClick={onLogout}
            className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white rounded-lg border-2 border-red-500 transition-all duration-200 hover:scale-105"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}
          >
            LOGOUT
          </button>
        )}
      </div>
    </div>
  );
};
