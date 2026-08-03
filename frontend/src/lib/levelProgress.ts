// Level Progress and Unlocking System
// Tracks which levels are completed and unlocks next level
// Per-player progression with persistent time logs for leaderboards

const STORAGE_KEY_PREFIX = 'shadowRunner_progress_';
const TIME_LOGS_KEY = 'shadowRunner_timeLogs'; // Never reset - used for leaderboard

export interface LevelProgress {
  completedLevels: number[];
  highestUnlockedLevel: number;
  completionTimes: Record<number, number>; // Level number -> time in seconds
  playerName: string;
}

export interface TimeLogs {
  [playerName: string]: {
    [levelNumber: number]: number[]; // Array of completion times in seconds
  };
}

// Get storage key for a specific player
function getStorageKey(playerName?: string): string {
  let name = playerName || localStorage.getItem('playerName') || 'guest';
  // Normalize to lowercase for consistency
  name = name.toLowerCase().trim();
  const key = STORAGE_KEY_PREFIX + name;
  console.log('[STORAGE] getStorageKey - input=%s, normalized=%s, key=%s', playerName, name, key);
  return key;
}

// Find all stored player keys in localStorage
function getAllStoredPlayerKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
      keys.push(key);
    }
  }
  console.log('[STORAGE] Found stored player keys:', keys);
  return keys;
}

// Migrate old storage keys to new normalized format
function migrateOldStorageKeys(): void {
  const allKeys = getAllStoredPlayerKeys();
  
  for (const oldKey of allKeys) {
    // Extract player name from old key
    const playerName = oldKey.substring(STORAGE_KEY_PREFIX.length);
    const normalizedName = playerName.toLowerCase().trim();
    const newKey = STORAGE_KEY_PREFIX + normalizedName;
    
    // If the key is not already normalized, copy the data
    if (oldKey !== newKey) {
      const data = localStorage.getItem(oldKey);
      if (data) {
        console.log('[STORAGE] Migrating %s -> %s', oldKey, newKey);
        localStorage.setItem(newKey, data);
        // Keep old key for compatibility
      }
    }
  }
}

// Get time logs (never reset between sessions)
function getTimeLogs(): TimeLogs {
  try {
    const stored = localStorage.getItem(TIME_LOGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading time logs:', error);
  }
  return {};
}

// Save time logs
function saveTimeLogs(timeLogs: TimeLogs): void {
  try {
    localStorage.setItem(TIME_LOGS_KEY, JSON.stringify(timeLogs));
  } catch (error) {
    console.error('Error saving time logs:', error);
  }
}

export function getLevelProgress(playerName?: string): LevelProgress {
  // Run migration on first call
  migrateOldStorageKeys();
  
  const key = getStorageKey(playerName);
  const currentPlayerName = playerName || localStorage.getItem('playerName');
  
  console.log('[PROGRESS] getLevelProgress - playerName=%s, currentPlayerName=%s, key=%s', playerName, currentPlayerName, key);
  
  // Debug: Show all localStorage keys
  console.log('[PROGRESS] Current localStorage keys:', Object.keys(localStorage).filter(k => k.startsWith(STORAGE_KEY_PREFIX)));
  
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('[PROGRESS] ✓ Found stored progress: completed=%d levels, unlocked up to level %d', 
        parsed.completedLevels.length, parsed.highestUnlockedLevel);
      
      // Ensure highestUnlockedLevel is at least 1
      if (parsed.highestUnlockedLevel < 1) {
        parsed.highestUnlockedLevel = 1;
      }
      return parsed;
    } else {
      console.log('[PROGRESS] ✗ No stored progress found for key: %s', key);
      console.log('[PROGRESS] Available keys in localStorage:');
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_KEY_PREFIX)) {
          console.log('[PROGRESS]   - %s', k);
        }
      }
    }
  } catch (error) {
    console.error('[PROGRESS] Error reading level progress:', error);
  }
  
  // Default: Only level 1 is unlocked
  console.log('[PROGRESS] Returning default progress (level 1 only)');
  return {
    completedLevels: [],
    highestUnlockedLevel: 1,
    completionTimes: {},
    playerName: currentPlayerName || 'guest',
  };
}

export function isLevelUnlocked(levelNumber: number, playerName?: string): boolean {
  const progress = getLevelProgress(playerName);
  return levelNumber <= progress.highestUnlockedLevel;
}

export function completeLevel(levelNumber: number, timeSeconds: number, playerName?: string): void {
  const key = getStorageKey(playerName);
  const progress = getLevelProgress(playerName);
  
  const storedPlayerName = localStorage.getItem('playerName');
  console.log('[SAVE] completeLevel - level=%d, time=%.1fs, playerName=%s, storedName=%s, key=%s', 
    levelNumber, timeSeconds, playerName, storedPlayerName, key);
  
  // Add to completed levels if not already there
  if (!progress.completedLevels.includes(levelNumber)) {
    progress.completedLevels.push(levelNumber);
    progress.completedLevels.sort((a, b) => a - b);
  }
  
  // Record completion time
  progress.completionTimes[levelNumber] = timeSeconds;
  
  // Unlock next level
  const nextLevel = levelNumber + 1;
  if (nextLevel > progress.highestUnlockedLevel && nextLevel <= 16) {
    progress.highestUnlockedLevel = nextLevel;
    console.log('[SAVE] ✓ Unlocked level %d', nextLevel);
  }
  
  // Save to localStorage
  try {
    const data = JSON.stringify(progress);
    localStorage.setItem(key, data);
    console.log('[SAVE] ✓ Saved to localStorage - key=%s, data length=%d bytes', key, data.length);
    console.log('[SAVE] ✓ Progress: %d levels completed, unlocked up to level %d', 
      progress.completedLevels.length, progress.highestUnlockedLevel);
  } catch (error) {
    console.error('[SAVE] ✗ Error saving level progress:', error);
  }
  
  // Add to persistent time logs (for leaderboard)
  const timeLogs = getTimeLogs();
  const playerKey = playerName || storedPlayerName || 'guest';
  if (!timeLogs[playerKey]) {
    timeLogs[playerKey] = {};
  }
  if (!timeLogs[playerKey][levelNumber]) {
    timeLogs[playerKey][levelNumber] = [];
  }
  timeLogs[playerKey][levelNumber].push(timeSeconds);
  saveTimeLogs(timeLogs);
  console.log('[SAVE] ✓ Time log saved for player: %s', playerKey);
}

// Reset progress for current player (when logging out)
export function resetProgress(playerName?: string): void {
  const key = getStorageKey(playerName);
  localStorage.removeItem(key);
}

// Get completed levels for a player
export function getCompletedLevels(playerName?: string): number[] {
  return getLevelProgress(playerName).completedLevels;
}

// Get highest unlocked level for a player
export function getHighestUnlockedLevel(playerName?: string): number {
  return getLevelProgress(playerName).highestUnlockedLevel;
}

// Get all time logs for leaderboard (never reset)
export function getAllTimeLogs(): TimeLogs {
  return getTimeLogs();
}

// Get time logs for a specific player
export function getPlayerTimeLogs(playerName: string): Record<number, number[]> {
  const timeLogs = getTimeLogs();
  return timeLogs[playerName] || {};
}

// Get best time for a level
export function getBestTime(levelNumber: number, playerName?: string): number | null {
  const key = playerName || localStorage.getItem('playerName') || 'guest';
  const timeLogs = getTimeLogs();
  const levelTimes = timeLogs[key]?.[levelNumber];
  if (!levelTimes || levelTimes.length === 0) return null;
  return Math.min(...levelTimes);
}
