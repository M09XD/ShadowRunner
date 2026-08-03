// Difficulty Scaling System for 15 levels + 1 boss level
// Inspired by Level Devil's progressive difficulty

export interface DifficultyConfig {
  level: number;
  trapCount: number;
  trapActivationSpeed: number;
  safeZoneSize: number;
  compoundTrapChance: number;
  shadowSpawnDelay: number;
  shadowSpeed: number;
  isBossLevel: boolean;
}

export const DIFFICULTY_CONFIGS: DifficultyConfig[] = [
  // Level 1-5: Learning phase
  { level: 1, trapCount: 5, trapActivationSpeed: 1.0, safeZoneSize: 200, compoundTrapChance: 0, shadowSpawnDelay: 20000, shadowSpeed: 3.5, isBossLevel: false },
  { level: 2, trapCount: 7, trapActivationSpeed: 1.1, safeZoneSize: 180, compoundTrapChance: 0.1, shadowSpawnDelay: 18000, shadowSpeed: 3.8, isBossLevel: false },
  { level: 3, trapCount: 9, trapActivationSpeed: 1.2, safeZoneSize: 160, compoundTrapChance: 0.15, shadowSpawnDelay: 16000, shadowSpeed: 4.0, isBossLevel: false },
  { level: 4, trapCount: 11, trapActivationSpeed: 1.3, safeZoneSize: 140, compoundTrapChance: 0.2, shadowSpawnDelay: 15000, shadowSpeed: 4.2, isBossLevel: false },
  { level: 5, trapCount: 13, trapActivationSpeed: 1.4, safeZoneSize: 120, compoundTrapChance: 0.25, shadowSpawnDelay: 14000, shadowSpeed: 4.5, isBossLevel: false },
  
  // Level 6-10: Intermediate phase
  { level: 6, trapCount: 15, trapActivationSpeed: 1.5, safeZoneSize: 100, compoundTrapChance: 0.3, shadowSpawnDelay: 13000, shadowSpeed: 4.8, isBossLevel: false },
  { level: 7, trapCount: 17, trapActivationSpeed: 1.6, safeZoneSize: 90, compoundTrapChance: 0.35, shadowSpawnDelay: 12000, shadowSpeed: 5.0, isBossLevel: false },
  { level: 8, trapCount: 19, trapActivationSpeed: 1.7, safeZoneSize: 80, compoundTrapChance: 0.4, shadowSpawnDelay: 11000, shadowSpeed: 5.2, isBossLevel: false },
  { level: 9, trapCount: 21, trapActivationSpeed: 1.8, safeZoneSize: 70, compoundTrapChance: 0.45, shadowSpawnDelay: 10000, shadowSpeed: 5.5, isBossLevel: false },
  { level: 10, trapCount: 23, trapActivationSpeed: 1.9, safeZoneSize: 60, compoundTrapChance: 0.5, shadowSpawnDelay: 9000, shadowSpeed: 5.8, isBossLevel: false },
  
  // Level 11-15: Expert phase
  { level: 11, trapCount: 25, trapActivationSpeed: 2.0, safeZoneSize: 50, compoundTrapChance: 0.55, shadowSpawnDelay: 8000, shadowSpeed: 6.0, isBossLevel: false },
  { level: 12, trapCount: 27, trapActivationSpeed: 2.1, safeZoneSize: 45, compoundTrapChance: 0.6, shadowSpawnDelay: 7000, shadowSpeed: 6.2, isBossLevel: false },
  { level: 13, trapCount: 29, trapActivationSpeed: 2.2, safeZoneSize: 40, compoundTrapChance: 0.65, shadowSpawnDelay: 6000, shadowSpeed: 6.5, isBossLevel: false },
  { level: 14, trapCount: 31, trapActivationSpeed: 2.3, safeZoneSize: 35, compoundTrapChance: 0.7, shadowSpawnDelay: 5000, shadowSpeed: 6.8, isBossLevel: false },
  { level: 15, trapCount: 33, trapActivationSpeed: 2.5, safeZoneSize: 30, compoundTrapChance: 0.75, shadowSpawnDelay: 4000, shadowSpeed: 7.0, isBossLevel: false },
  
  // Level 16: Final Boss
  { level: 16, trapCount: 0, trapActivationSpeed: 0, safeZoneSize: 0, compoundTrapChance: 0, shadowSpawnDelay: 0, shadowSpeed: 0, isBossLevel: true },
];

export function getDifficultyConfig(levelNumber: number): DifficultyConfig {
  const config = DIFFICULTY_CONFIGS.find(c => c.level === levelNumber);
  if (config) return config;
  
  // Fallback for levels beyond 16
  if (levelNumber > 16) {
    return DIFFICULTY_CONFIGS[DIFFICULTY_CONFIGS.length - 1];
  }
  
  // Default for levels below 1
  return DIFFICULTY_CONFIGS[0];
}

export function isBossLevel(levelNumber: number): boolean {
  return levelNumber === 16;
}
