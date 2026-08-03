import { LevelLayout, PlayerStats, LeaderboardEntry, BattleResult, AITrainingData, LoginRequest, RegisterRequest, AuthResponse } from '../types/api';

// API Client for Shadow Runner Backend
const API_BASE_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL ||
  'http://localhost:8081/api/';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

class ApiClient {
  private baseUrl = API_BASE_URL;

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        return {
          error: errorData.message || errorData.error || `Request failed with status ${response.status}`,
          status: response.status,
        };
      }

      const data = await response.json();
      return {
        data,
        status: response.status,
      };
    } catch (error) {
      console.error('API Error:', error);
      const errorMessage = error instanceof TypeError && error.message.includes('fetch')
        ? 'Cannot connect to server. Make sure the backend is running on http://localhost:8081'
        : String(error);
      return {
        error: errorMessage,
        status: 500,
      };
    }
  }

  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      // CRITICAL FIX: Handle non-JSON responses and network errors
      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        return {
          error: errorData.message || errorData.error || `Request failed with status ${response.status}`,
          status: response.status,
        };
      }

      const data = await response.json();
      return {
        data,
        status: response.status,
      };
    } catch (error) {
      console.error('API Error:', error);
      // CRITICAL FIX: Provide more specific error messages
      const errorMessage = error instanceof TypeError && error.message.includes('fetch')
        ? 'Cannot connect to server. Make sure the backend is running on http://localhost:8081'
        : String(error);
      return {
        error: errorMessage,
        status: 500,
      };
    }
  }

  async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return {
        data,
        status: response.status,
      };
    } catch (error) {
      console.error('API Error:', error);
      return {
        error: String(error),
        status: 500,
      };
    }
  }
}

export const apiClient = new ApiClient();

// Level APIs
export const levelAPI = {
  getAll: () => apiClient.get<LevelLayout[]>('/levels'),
  getByNumber: (levelNumber: number) => apiClient.get<LevelLayout>(`/levels/${levelNumber}`),
  create: (data: LevelLayout) => apiClient.post<LevelLayout>('/levels', data),
  update: (levelNumber: number, data: LevelLayout) => apiClient.put<LevelLayout>(`/levels/${levelNumber}`, data),
};

// Leaderboard APIs
export const leaderboardAPI = {
  submit: (data: LeaderboardEntry) => apiClient.post<LeaderboardEntry>('/leaderboard', data),
  getByLevel: (levelNumber: number) => apiClient.get<LeaderboardEntry[]>(`/leaderboard/level/${levelNumber}`),
  getPlayerHistory: (playerName: string) => apiClient.get<LeaderboardEntry[]>(`/leaderboard/player/${playerName}`),
  getGlobal: () => apiClient.get<LeaderboardEntry[]>('/leaderboard/global'),
  getTop10: (levelNumber: number) => apiClient.get<LeaderboardEntry[]>(`/leaderboard/level/${levelNumber}/top10`),
};

// Player APIs
export const playerAPI = {
  getStats: (playerName: string) => apiClient.get<PlayerStats>(`/players/${playerName}`),
  create: (playerName: string) => apiClient.post<PlayerStats>(`/players/${playerName}`, {}),
  updateSkin: (playerName: string, skinId: number) =>
    apiClient.put<PlayerStats>(`/players/${playerName}/skin/${skinId}`, {}),
  updatePlayTime: (playerName: string, playTimeMs: number) =>
    apiClient.put<PlayerStats>(`/players/${playerName}/playtime/${playTimeMs}`, {}),
};

// Battle APIs
export const battleAPI = {
  record: (data: BattleResult) => apiClient.post<BattleResult>('/battles', data),
  getPlayerBattles: (playerName: string) => apiClient.get<BattleResult[]>(`/battles/player/${playerName}`),
  getPlayerBattlesByLevel: (playerName: string, levelNumber: number) =>
    apiClient.get<BattleResult[]>(`/battles/player/${playerName}/level/${levelNumber}`),
  getWinRate: (playerName: string) => apiClient.get<number>(`/battles/player/${playerName}/winrate`),
};

// AI APIs
export const aiAPI = {
  recordMove: (data: AITrainingData) => apiClient.post<AITrainingData>('/ai/record-move', data),
  predictMove: (playerName: string, pokemonId: number) =>
    apiClient.get<string>(`/ai/predict/${playerName}/${pokemonId}`),
  getCounterMove: (playerName: string, playerPokemonId: number, shadowPokemonId: number) =>
    apiClient.get<string>(`/ai/counter/${playerName}/${playerPokemonId}/${shadowPokemonId}`),
  getTrainingData: (playerName: string) => apiClient.get<AITrainingData[]>(`/ai/training-data/${playerName}`),
};

// Health APIs
export const healthAPI = {
  check: () => apiClient.get<string>('/health'),
  ready: () => apiClient.get<string>('/health/ready'),
};

// Auth APIs
export const authAPI = {
  register: (data: RegisterRequest) => apiClient.post<AuthResponse>('/auth/register', data),
  login: (data: LoginRequest) => apiClient.post<AuthResponse>('/auth/login', data),
  validateToken: (token: string) => apiClient.get<AuthResponse>(`/auth/validate?token=${token}`),
};
