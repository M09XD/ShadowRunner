export interface LevelLayout {
  id: number;
  levelNumber: number;
  name: string;
  width: number;
  height: number;
  platforms: string;
  traps: string;
  exitPosition: string;
  spawnPosition: string;
  description: string;
  difficulty: number;
}

export interface PlayerStats {
  id: number;
  playerName: string;
  currentLevel: number;
  totalWins: number;
  totalLosses: number;
  selectedSkinId: number;
  totalPlayTimeMs: number;
}

export interface LeaderboardEntry {
  id: number;
  playerName: string;
  levelNumber: number;
  completionTimeMs: number;
  ranking: number;
  skinId: number;
  createdAt: string;
}

export interface BattleResult {
  id: number;
  playerName: string;
  levelNumber: number;
  playerPokemonId: number;
  playerPokemonName: string;
  shadowPokemonId: number;
  shadowPokemonName: string;
  result: 'WIN' | 'LOSS';
  battleLog: string;
  battleDurationMs: number;
  createdAt: string;
}

export interface AITrainingData {
  id: number;
  playerName: string;
  pokemonId: number;
  pokemonName: string;
  moveUsed: string;
  moveCount: number;
  successRate: number;
  moveHistory: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  playerName: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  account?: Account;
  playerStats?: PlayerStats;
}

export interface Account {
  id: number;
  email: string;
  playerName: string;
  createdAt: string;
  updatedAt: string;
}
