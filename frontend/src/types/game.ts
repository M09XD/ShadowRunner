// Game Types for Shadow Runner

export interface Position {
  x: number;
  y: number;
}

export interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Trap {
  x: number;
  y: number;
  type: 'spike' | 'fake_floor' | 'moving_spike' | 'surprise_spike' | 'moving_exit' | 
        'delayed_collapse' | 'invisible_trigger' | 'reverse_platform' | 'moving_wall' | 
        'teleport_hazard' | 'compound_trap' | 'switch_trap' | 'point_trigger' | 
        'land_moving' | 'spike_moving' | 'wall_moving';
  w?: number;
  h?: number;
  range?: number;
  delay?: number;
  triggered?: boolean | number;
  active?: boolean;
  originalX?: number;
  originalY?: number;
  direction?: number;
  activationTime?: number;
  collapseTimer?: number;
  teleportTarget?: { x: number; y: number };
  compoundTraps?: Trap[];
  behaviorSeed?: number; // For randomization
  lastActivation?: number;
  activationPattern?: 'immediate' | 'delayed' | 'random' | 'proximity' | 'pattern';
  triggerPoint?: { x: number; y: number }; // For point trigger traps
  switchId?: string; // For switch traps
  linkedTraps?: string[]; // Traps linked to this switch
  moveSpeed?: number; // Speed for moving traps
  movePattern?: 'horizontal' | 'vertical' | 'circular' | 'zigzag';
}

export interface Level {
  id: number;
  level_number: number;
  name: string;
  width: number;
  height: number;
  platforms: Platform[];
  traps: Trap[];
  exit_position: Position;
  spawn_position: Position;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isJumping: boolean;
  isGrounded: boolean;
  facingRight: boolean;
  skinId: number;
}

export interface Shadow {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  active: boolean;
  spawnTime: number;
}

export interface GameState {
  currentLevel: number;
  playerName: string;  // Add player name to state
  player: Player;
  shadow: Shadow;
  traps: Trap[];
  gameStatus: 'menu' | 'playing' | 'battle' | 'pokemon_select' | 'paused' | 'victory' | 'game_over' | 'leaderboard' | 'skin_select' | 'profile';
  timer: number;
  startTime: number;
  cameraX: number;
}

// Pokemon Types
export interface PokemonStat {
  base_stat: number;
  stat: {
    name: string;
  };
}

export interface PokemonType {
  type: {
    name: string;
  };
}

export interface PokemonAbility {
  ability: {
    name: string;
  };
}

export interface PokemonMove {
  move: {
    name: string;
    url: string;
  };
}

export interface Pokemon {
  id: number;
  name: string;
  sprites: {
    front_default: string;
    back_default: string;
    other?: {
      'official-artwork'?: {
        front_default: string;
      };
    };
  };
  stats: PokemonStat[];
  types: PokemonType[];
  abilities: PokemonAbility[];
  moves: PokemonMove[];
  height: number;
  weight: number;
}

export interface MoveDetails {
  id: number;
  name: string;
  power: number | null;
  pp: number;
  accuracy: number | null;
  type: {
    name: string;
  };
  damage_class: {
    name: string;
  };
}

export interface BattleState {
  playerPokemon: Pokemon | null;
  shadowPokemon: Pokemon | null;
  playerHP: number;
  playerMaxHP: number;
  shadowHP: number;
  shadowMaxHP: number;
  playerMoves: MoveDetails[];
  shadowMoves: MoveDetails[];
  currentTurn: 'player' | 'shadow';
  battleLog: string[];
  isAnimating: boolean;
  battleEnded: boolean;
  winner: 'player' | 'shadow' | null;
}

export interface LeaderboardEntry {
  id: number;
  player_name: string;
  level_number: number;
  completion_time_ms: number;
  ranking: number;
  skin_id: number;
  created_at: string;
}

export interface PlayerSkin {
  id: number;
  name: string;
  color: string;
  secondaryColor: string;
  image?: string;
  animationType?: 'glow' | 'pulse' | 'shimmer' | 'flicker' | 'none';
  animationSpeed?: number;
}

export const PLAYER_SKINS: PlayerSkin[] = [
  { id: 0, name: 'Shadow', color: '#0a0a0a', secondaryColor: '#1a1a1a', animationType: 'flicker', animationSpeed: 0.5 },
  { id: 1, name: 'Crimson', color: '#dc2626', secondaryColor: '#7f1d1d', animationType: 'pulse', animationSpeed: 1.0 },
  { id: 2, name: 'Ocean', color: '#0ea5e9', secondaryColor: '#0369a1', animationType: 'shimmer', animationSpeed: 0.8 },
  { id: 3, name: 'Forest', color: '#22c55e', secondaryColor: '#166534', animationType: 'glow', animationSpeed: 0.6 },
  { id: 4, name: 'Royal', color: '#a855f7', secondaryColor: '#6b21a8', animationType: 'pulse', animationSpeed: 0.7 },
  { id: 5, name: 'Solar', color: '#f59e0b', secondaryColor: '#b45309', animationType: 'glow', animationSpeed: 1.2 },
  { id: 6, name: 'Blood', color: '#8b0000', secondaryColor: '#4b0000', animationType: 'pulse', animationSpeed: 1.5 },
  { id: 7, name: 'Void', color: '#000000', secondaryColor: '#1a0033', animationType: 'flicker', animationSpeed: 0.4 },
];

// Type effectiveness chart
export const TYPE_CHART: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

export function getTypeEffectiveness(attackType: string, defenderTypes: string[]): number {
  let multiplier = 1;
  for (const defType of defenderTypes) {
    const effectiveness = TYPE_CHART[attackType]?.[defType];
    if (effectiveness !== undefined) {
      multiplier *= effectiveness;
    }
  }
  return multiplier;
}

export function calculateDamage(
  attackerLevel: number,
  movePower: number,
  attackStat: number,
  defenseStat: number,
  typeEffectiveness: number,
  isStab: boolean
): number {
  const level = attackerLevel || 50;
  const power = movePower || 50;
  const stabBonus = isStab ? 1.5 : 1;
  const randomFactor = 0.85 + Math.random() * 0.15;
  
  const damage = Math.floor(
    ((((2 * level / 5 + 2) * power * (attackStat / defenseStat)) / 50) + 2) *
    typeEffectiveness *
    stabBonus *
    randomFactor
  );
  
  return Math.max(1, damage);
}
