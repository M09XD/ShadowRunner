import { useState, useCallback, useRef, useEffect } from 'react';
import { GameState, Player, Shadow, Level, Trap, Position } from '@/types/game';
import { supabase } from '@/lib/supabase';
import { soundManager } from '@/lib/soundManager';
import { updateTraps, isPositionSafe, findSafePaths, resetSwitchStates } from '@/lib/trapSystem';
import { isLevelUnlocked, completeLevel, getHighestUnlockedLevel } from '@/lib/levelProgress';

const GRAVITY = 0.6;
const JUMP_FORCE = -14;
const MOVE_SPEED = 5;
const SHADOW_SPEED = 4;
const SHADOW_SPAWN_DELAY = 15000; // 15 seconds

// Generate procedural level for levels not in database
function generateProceduralLevel(levelNumber: number): Level {
  // BOSS LEVEL (Level 16) - Special arena
  if (levelNumber === 16) {
    const width = 2000;
    const height = 1200;
    
    // Boss arena has a simple layout with few platforms
    const platforms: Array<{ x: number; y: number; w: number; h: number }> = [
      { x: 0, y: 1100, w: 2000, h: 100 }, // Main floor
      { x: 200, y: 900, w: 300, h: 20 }, // Left elevated platform
      { x: 1500, y: 900, w: 300, h: 20 }, // Right elevated platform
      { x: 850, y: 700, w: 300, h: 20 }, // Center platform
    ];
    
    // Boss arena has NO traps - pure AI battle
    const traps: Trap[] = [];
    
    return {
      id: levelNumber,
      level_number: levelNumber,
      name: 'Level 16 - THE SHADOW',
      width,
      height,
      platforms,
      traps,
      exit_position: { x: 900, y: 450 },
      spawn_position: { x: 200, y: 900 },
    };
  }
  
  // Regular levels (1-15) - Structured design similar to hand-crafted levels
  // All levels have consistent base dimensions
  const width = 2400;
  const height = 1000;
  
  // Generate platforms in structured columns (similar to Level 1-6 design)
  const platforms: Array<{ x: number; y: number; w: number; h: number }> = [];
  
  // GROUND FLOOR - Always present for safety
  platforms.push({ x: 0, y: height - 80, w: width, h: 80 });
  
  // Create platforms in 5-7 vertical columns
  const numColumns = 5 + Math.floor(levelNumber / 4); // More columns at higher levels
  const columnWidth = width / numColumns;
  const platformHeights = [height - 200, height - 350, height - 500, height - 650];
  
  for (let col = 1; col < numColumns; col++) {
    const colX = columnWidth * col;
    
    // Add 2-3 platforms per column at different heights
    const platformsPerColumn = 2 + (levelNumber >= 10 ? 1 : 0);
    
    for (let p = 0; p < platformsPerColumn; p++) {
      const platformY = platformHeights[p % platformHeights.length];
      const platformWidth = 100 + Math.random() * 80;
      const offset = (Math.random() - 0.5) * 100;
      
      platforms.push({
        x: Math.max(0, Math.min(colX + offset, width - platformWidth)),
        y: Math.max(150, platformY + (Math.random() - 0.5) * 100),
        w: platformWidth,
        h: 20,
      });
    }
  }
  
  // Generate traps with increasing count and difficulty
  const traps: Trap[] = [];
  const switchIds: string[] = [];
  
  // Trap count increases with level: 3, 5, 7, 9, 11, 13, 15, 18, 21, 24, 27, 30, 33, 36, 39
  let trapCount: number;
  if (levelNumber <= 3) trapCount = 3;
  else if (levelNumber <= 6) trapCount = 5;
  else if (levelNumber <= 9) trapCount = 8;
  else if (levelNumber <= 12) trapCount = 12;
  else trapCount = 16;
  
  for (let i = 0; i < trapCount; i++) {
    const trapX = (width / trapCount) * (i + 0.5) + (Math.random() - 0.5) * 120;
    const trapY = height - 200 + (Math.random() - 0.5) * 400;
    
    // Determine available trap types based on level
    let trapTypes: Trap['type'][] = [];
    
    if (levelNumber <= 2) {
      trapTypes = ['spike', 'fake_floor'];
    } else if (levelNumber <= 4) {
      trapTypes = ['spike', 'moving_spike', 'fake_floor', 'delayed_collapse'];
    } else if (levelNumber <= 6) {
      trapTypes = ['spike', 'moving_spike', 'fake_floor', 'delayed_collapse', 'switch_trap', 'point_trigger'];
    } else if (levelNumber <= 9) {
      trapTypes = ['spike', 'moving_spike', 'surprise_spike', 'switch_trap', 'point_trigger', 'land_moving', 'wall_moving'];
    } else if (levelNumber <= 12) {
      trapTypes = ['spike', 'moving_spike', 'surprise_spike', 'switch_trap', 'point_trigger', 'land_moving', 'wall_moving', 'reverse_platform', 'teleport_hazard'];
    } else {
      trapTypes = ['spike', 'moving_spike', 'surprise_spike', 'switch_trap', 'point_trigger', 'land_moving', 'wall_moving', 'reverse_platform', 'teleport_hazard', 'compound_trap', 'invisible_trigger'];
    }
    
    const trapType = trapTypes[Math.floor(Math.random() * trapTypes.length)];
    
    const trap: Trap = {
      x: trapX,
      y: trapY,
      type: trapType,
      w: 30,
      range: 100 + (levelNumber - 1) * 10,
      active: ['spike', 'moving_spike', 'surprise_spike'].includes(trapType),
      triggered: false,
      originalX: trapX,
      originalY: trapY,
      direction: Math.random() > 0.5 ? 1 : -1,
      behaviorSeed: Math.floor(Math.random() * 1000),
    };
    
    // Trap-specific configurations
    if (trapType === 'switch_trap') {
      const switchId = `switch_${i}`;
      trap.switchId = switchId;
      switchIds.push(switchId);
      trap.w = 40;
      trap.h = 20;
      trap.active = false;
    } else if (trapType === 'point_trigger') {
      trap.triggerPoint = { x: trapX + 50, y: trapY + 50 };
      trap.active = false;
    } else if (trapType === 'land_moving') {
      trap.movePattern = ['horizontal', 'vertical'][Math.floor(Math.random() * 2)] as any;
      trap.moveSpeed = 1.5 + (levelNumber - 1) * 0.1;
      trap.w = 100 + (levelNumber - 1) * 5;
      trap.h = 20;
      trap.active = true;
    } else if (trapType === 'moving_spike') {
      trap.movePattern = ['horizontal', 'vertical', 'circular'][Math.floor(Math.random() * 3)] as any;
      trap.moveSpeed = 2 + (levelNumber - 1) * 0.15;
      trap.active = true;
    } else if (trapType === 'wall_moving') {
      trap.movePattern = Math.random() > 0.5 ? 'horizontal' : 'vertical' as any;
      trap.moveSpeed = 1.8 + (levelNumber - 1) * 0.12;
      trap.w = 40 + (levelNumber - 1) * 3;
      trap.h = 180;
      trap.active = true;
    } else if (trapType === 'reverse_platform') {
      trap.w = 100 + Math.random() * 50;
      trap.h = 20;
      trap.active = true;
    } else if (trapType === 'teleport_hazard') {
      trap.teleportTo = { x: Math.random() * width, y: Math.random() * (height - 300) };
      trap.w = 50;
      trap.h = 50;
      trap.active = true;
    } else if (trapType === 'compound_trap') {
      trap.compoundTraps = [];
      for (let j = 0; j < 2; j++) {
        trap.compoundTraps.push({
          x: trapX + j * 40,
          y: trapY,
          type: 'spike',
          w: 30,
          range: 100,
          active: true,
          triggered: false,
          originalX: trapX + j * 40,
          originalY: trapY,
          direction: 1,
          behaviorSeed: j,
        });
      }
      trap.active = false;
    }
    
    traps.push(trap);
  }
  
  return {
    id: levelNumber,
    level_number: levelNumber,
    name: `Level ${levelNumber}`,
    width,
    height,
    platforms,
    traps,
    exit_position: { x: width - 150, y: height - 250 },
    spawn_position: { 
      x: 100, 
      y: platforms.length > 1 ? platforms[1].y - 50 : platforms[0].y - 100
    },
  };
}


const initialPlayer: Player = {
  x: 50,
  y: 400,
  vx: 0,
  vy: 0,
  width: 32,
  height: 48,
  isJumping: false,
  isGrounded: false,
  facingRight: true,
  skinId: 0,
};

const initialShadow: Shadow = {
  x: 50,
  y: 400,
  vx: 0,
  vy: 0,
  width: 40,
  height: 56,
  active: false,
  spawnTime: 0,
};

const initialGameState: GameState = {
  currentLevel: 1,
  playerName: '',  // Will be set when level starts
  player: { ...initialPlayer },
  shadow: { ...initialShadow },
  traps: [],
  gameStatus: 'menu',
  timer: 0,
  startTime: 0,
  cameraX: 0,
};

export function useGameEngine() {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [levels, setLevels] = useState<Level[]>([]);
  const [currentLevelData, setCurrentLevelData] = useState<Level | null>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const isMountedRef = useRef(true); // CRITICAL FIX #14: Track mount status

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []);

  // Fetch levels from database
  useEffect(() => {
    async function fetchLevels() {
      try {
        // CRITICAL FIX #6: Add proper error handling for level loading
        const { data, error } = await supabase
          .from('level_layouts')
          .select('*')
          .order('level_number');
        
        if (error) {
          console.error('Failed to load levels:', error);
          return;
        }
        
        if (data && data.length > 0 && isMountedRef.current) {
          const parsedLevels = data.map(level => ({
            ...level,
            platforms: typeof level.platforms === 'string' ? JSON.parse(level.platforms) : level.platforms,
            traps: typeof level.traps === 'string' ? JSON.parse(level.traps) : level.traps,
            exit_position: typeof level.exit_position === 'string' ? JSON.parse(level.exit_position) : level.exit_position,
            spawn_position: typeof level.spawn_position === 'string' ? JSON.parse(level.spawn_position) : level.spawn_position,
          }));
          setLevels(parsedLevels);
        } else if (!data || data.length === 0) {
          console.warn('No levels loaded from database');
        }
      } catch (err) {
        console.error('Exception loading levels:', err);
      }
    }
    fetchLevels();
  }, []);

  const loadLevel = useCallback((levelNumber: number) => {
    // Check if level is unlocked - pass player name for proper check
    const playerName = localStorage.getItem('playerName') || 'guest';
    if (!isLevelUnlocked(levelNumber, playerName)) {
      console.warn(`Level ${levelNumber} is locked. Complete previous levels first.`);
      return;
    }
    
    // If level doesn't exist in database, generate it procedurally
    let level = levels.find(l => l.level_number === levelNumber);
    if (!level) {
      // Generate level procedurally for levels 7-16 (or any missing level)
      console.log(`Generating procedural level ${levelNumber}`);
      level = generateProceduralLevel(levelNumber);
    }
    
    if (!level) {
      console.error(`Failed to load or generate level ${levelNumber}`);
      return;
    }

    // Reset switch states for new level
    resetSwitchStates();
    
    setCurrentLevelData(level);
    
    // Initialize traps with additional properties - ALL traps reset on level load
    const initializedTraps = level.traps.map((trap: Trap) => {
      const baseTrap = {
        ...trap,
        triggered: false,
        originalX: trap.x,
        originalY: trap.y,
        direction: Math.random() > 0.5 ? 1 : -1, // Random initial direction
        behaviorSeed: Math.floor(Math.random() * 1000), // Random behavior seed
        lastActivation: undefined,
        activationTime: undefined,
        collapseTimer: undefined,
      };
      
      // Set initial active state based on trap type
      if (trap.type === 'spike' || trap.type === 'moving_spike' || trap.type === 'spike_moving') {
        baseTrap.active = true;
      } else if (trap.type === 'fake_floor' || trap.type === 'delayed_collapse') {
        baseTrap.active = false; // These activate when triggered
      } else if (trap.type === 'surprise_spike' || trap.type === 'invisible_trigger' || trap.type === 'teleport_hazard' || trap.type === 'point_trigger') {
        baseTrap.active = false; // Activate unpredictably
      } else if (trap.type === 'reverse_platform' || trap.type === 'moving_wall' || trap.type === 'wall_moving' || trap.type === 'land_moving') {
        baseTrap.active = true; // Always moving
      } else if (trap.type === 'switch_trap') {
        baseTrap.active = false; // Activates when stepped on
      } else if (trap.type === 'compound_trap') {
        baseTrap.active = false; // Activates when sub-traps activate
        if (trap.compoundTraps) {
          baseTrap.compoundTraps = trap.compoundTraps.map(subTrap => ({
            ...subTrap,
            triggered: false,
            active: subTrap.type === 'spike' || subTrap.type === 'moving_spike' || subTrap.type === 'spike_moving',
            originalX: subTrap.x,
            originalY: subTrap.y,
            direction: Math.random() > 0.5 ? 1 : -1,
            behaviorSeed: subTrap.type === 'surprise_spike' ? Math.floor(Math.random() * 1000) : undefined,
          }));
        }
      } else {
        baseTrap.active = false;
      }
      
      return baseTrap;
    });

    if (isMountedRef.current) {
      const playerName = localStorage.getItem('playerName') || 'guest';
      console.log('[GAME] loadLevel - Setting playerName in state: %s', playerName);
      setGameState(prev => ({
        ...prev,
        playerName,  // Store playerName in state
        currentLevel: levelNumber,
        player: {
          ...initialPlayer,
          x: level.spawn_position.x,
          y: level.spawn_position.y,
          skinId: prev.player.skinId,
        },
        shadow: {
          ...initialShadow,
          x: level.spawn_position.x,
          y: level.spawn_position.y,
          active: false,
          spawnTime: Date.now() + SHADOW_SPAWN_DELAY,
        },
        traps: initializedTraps,
        gameStatus: 'playing',
        startTime: Date.now(),
        timer: 0,
        cameraX: 0,
      }));
    }
  }, [levels]);

  const resetLevel = useCallback((keepTimer: boolean = false) => {
    if (!currentLevelData) return;

    // Reset switch states
    resetSwitchStates();

    // Reset ALL traps on death/respawn - same logic as loadLevel
    const initializedTraps = currentLevelData.traps.map((trap: Trap) => {
      const baseTrap = {
        ...trap,
        triggered: false,
        originalX: trap.x,
        originalY: trap.y,
        direction: Math.random() > 0.5 ? 1 : -1, // Random direction on reset
        behaviorSeed: Math.floor(Math.random() * 1000), // New random seed
        lastActivation: undefined,
        activationTime: undefined,
        collapseTimer: undefined,
      };
      
      // Reset active state
      if (trap.type === 'spike' || trap.type === 'moving_spike' || trap.type === 'spike_moving') {
        baseTrap.active = true;
      } else if (trap.type === 'fake_floor' || trap.type === 'delayed_collapse') {
        baseTrap.active = false;
      } else if (trap.type === 'surprise_spike' || trap.type === 'invisible_trigger' || trap.type === 'teleport_hazard' || trap.type === 'point_trigger') {
        baseTrap.active = false;
      } else if (trap.type === 'reverse_platform' || trap.type === 'moving_wall' || trap.type === 'wall_moving' || trap.type === 'land_moving') {
        baseTrap.active = true;
      } else if (trap.type === 'switch_trap') {
        baseTrap.active = false;
      } else if (trap.type === 'compound_trap') {
        baseTrap.active = false;
        if (trap.compoundTraps) {
          baseTrap.compoundTraps = trap.compoundTraps.map(subTrap => ({
            ...subTrap,
            triggered: false,
            active: subTrap.type === 'spike' || subTrap.type === 'moving_spike' || subTrap.type === 'spike_moving',
            originalX: subTrap.x,
            direction: Math.random() > 0.5 ? 1 : -1,
          }));
        }
      } else {
        baseTrap.active = false;
      }
      
      return baseTrap;
    });

    if (isMountedRef.current) {
      setGameState(prev => ({
        ...prev,
        player: {
          ...initialPlayer,
          x: currentLevelData.spawn_position.x,
          y: currentLevelData.spawn_position.y,
          skinId: prev.player.skinId,
        },
        shadow: {
          ...initialShadow,
          x: currentLevelData.spawn_position.x,
          y: currentLevelData.spawn_position.y,
          active: false,
          spawnTime: Date.now() + SHADOW_SPAWN_DELAY,
        },
        traps: initializedTraps,
        gameStatus: 'playing',
        startTime: keepTimer ? prev.startTime : Date.now(),
        timer: keepTimer ? prev.timer : 0,
        cameraX: 0,
      }));
    }
  }, [currentLevelData]);

  const checkPlatformCollision = useCallback((
    player: Player,
    platforms: { x: number; y: number; w: number; h: number }[],
    movingPlatforms?: Trap[]
  ): { grounded: boolean; newY: number; platformVelocity?: { x: number; y: number } } => {
    let grounded = false;
    let newY = player.y;
    let platformVelocity = { x: 0, y: 0 };

    // Check static platforms
    for (const platform of platforms) {
      // Check if player is above platform and falling
      if (
        player.x + player.width > platform.x &&
        player.x < platform.x + platform.w &&
        player.y + player.height <= platform.y + 10 &&
        player.y + player.height + player.vy >= platform.y
      ) {
        if (player.vy >= 0) {
          grounded = true;
          newY = platform.y - player.height;
        }
      }
    }

    // Check moving platforms (land_moving traps)
    if (movingPlatforms) {
      for (const trap of movingPlatforms) {
        if (trap.type === 'land_moving' && trap.active) {
          const platform = {
            x: trap.x,
            y: trap.y,
            w: trap.w || 150,
            h: trap.h || 20,
          };
          if (
            player.x + player.width > platform.x &&
            player.x < platform.x + platform.w &&
            player.y + player.height <= platform.y + 10 &&
            player.y + player.height + player.vy >= platform.y
          ) {
            if (player.vy >= 0) {
              grounded = true;
              newY = platform.y - player.height;
              // Calculate platform velocity for player movement
              const moveSpeed = trap.moveSpeed || 2;
              if (trap.movePattern === 'horizontal') {
                platformVelocity.x = (trap.direction || 1) * moveSpeed;
              } else if (trap.movePattern === 'vertical') {
                platformVelocity.y = (trap.direction || 1) * moveSpeed;
              } else if (trap.movePattern === 'zigzag') {
                platformVelocity.x = (trap.direction || 1) * moveSpeed;
                // Vertical component from zigzag pattern
                const zigzagY = Math.sin((trap.x - (trap.originalX || trap.x)) / 50) * 50;
                platformVelocity.y = zigzagY - (trap.originalY || trap.y);
              }
            }
          }
        }
      }
    }

    return { grounded, newY, platformVelocity };
  }, []);

  const checkTrapCollision = useCallback((
    player: Player,
    traps: Trap[]
  ): { hit: boolean; trapType: string | null } => {
    for (const trap of traps) {
      // Check if trap should be checked (active or special types)
      const shouldCheck = trap.active || 
                         trap.type === 'fake_floor' || 
                         trap.type === 'invisible_trigger' ||
                         trap.type === 'delayed_collapse';

      if (!shouldCheck) continue;

      const trapWidth = trap.w || 30;
      const trapHeight = trap.h || (trap.type === 'moving_wall' ? 200 : 20);

      // Collision detection
      if (
        player.x < trap.x + trapWidth &&
        player.x + player.width > trap.x &&
        player.y < trap.y + trapHeight &&
        player.y + player.height > trap.y
      ) {
        // Fake floor - player falls through
        if (trap.type === 'fake_floor' && trap.active) {
          return { hit: true, trapType: 'fake_floor' };
        }
        
        // Delayed collapse - kills when active
        if (trap.type === 'delayed_collapse' && trap.active) {
          return { hit: true, trapType: 'delayed_collapse' };
        }
        
        // Invisible trigger - activates trap
        if (trap.type === 'invisible_trigger' && !trap.triggered) {
          // Trigger will be handled by trap system
          continue;
        }
        
        // Moving wall - blocks player
        if (trap.type === 'moving_wall' || trap.type === 'wall_moving') {
          return { hit: true, trapType: 'moving_wall' };
        }
        
        // Teleport hazard - kills when active
        if (trap.type === 'teleport_hazard' && trap.active) {
          return { hit: true, trapType: 'teleport_hazard' };
        }
        
        // Spike moving - kills when active
        if (trap.type === 'spike_moving' && trap.active) {
          return { hit: true, trapType: 'spike_moving' };
        }
        
        // Point trigger - kills when active
        if (trap.type === 'point_trigger' && trap.active) {
          return { hit: true, trapType: 'point_trigger' };
        }
        
        // Switch trap is safe (just triggers other traps)
        if (trap.type === 'switch_trap') {
          continue;
        }
        
        // Land moving is safe (just a moving platform)
        if (trap.type === 'land_moving') {
          continue;
        }
        
        // Compound trap - check all sub-traps
        if (trap.type === 'compound_trap' && trap.compoundTraps) {
          for (const subTrap of trap.compoundTraps) {
            if (subTrap.active) {
              const subWidth = subTrap.w || 30;
              const subHeight = 20;
              if (
                player.x < subTrap.x + subWidth &&
                player.x + player.width > subTrap.x &&
                player.y < subTrap.y + subHeight &&
                player.y + player.height > subTrap.y
              ) {
                return { hit: true, trapType: 'compound_trap' };
              }
            }
          }
        }
        
        // Standard spike traps
        if (trap.type === 'spike' || trap.type === 'moving_spike' || trap.type === 'surprise_spike') {
          return { hit: true, trapType: trap.type };
        }
      }
    }
    return { hit: false, trapType: null };
  }, []);

  const checkExitCollision = useCallback((
    player: Player,
    exitPosition: Position
  ): boolean => {
    const exitWidth = 50;
    const exitHeight = 70;
    
    return (
      player.x < exitPosition.x + exitWidth &&
      player.x + player.width > exitPosition.x &&
      player.y < exitPosition.y + exitHeight &&
      player.y + player.height > exitPosition.y
    );
  }, []);

  const checkShadowCollision = useCallback((
    player: Player,
    shadow: Shadow
  ): boolean => {
    if (!shadow.active) return false;
    
    return (
      player.x < shadow.x + shadow.width &&
      player.x + player.width > shadow.x &&
      player.y < shadow.y + shadow.height &&
      player.y + player.height > shadow.y
    );
  }, []);

  // Trap update is now handled by trapSystem.ts
  const updateTrapsLocal = useCallback((traps: Trap[], deltaTime: number, playerX: number, playerY: number, gameTime: number): Trap[] => {
    return updateTraps(traps, deltaTime, playerX, playerY, gameTime);
  }, []);

  // Shadow path cache for knowing all safe paths
  const shadowPathCache = useRef<Map<number, Array<{ x: number; y: number }>[]>>(new Map());

  const updateShadow = useCallback((
    shadow: Shadow,
    player: Player,
    platforms: { x: number; y: number; w: number; h: number }[],
    traps: Trap[],
    exitPosition: Position,
    levelNumber: number
  ): Shadow => {
    if (!shadow.active) {
      if (Date.now() >= shadow.spawnTime) {
        // Pre-compute safe paths when shadow spawns
        if (!shadowPathCache.current.has(levelNumber)) {
          const safePaths = findSafePaths(
            platforms.map(p => ({ x: p.x, y: p.y, w: p.w, h: p.h })),
            traps,
            shadow.x,
            shadow.y,
            exitPosition.x,
            exitPosition.y
          );
          shadowPathCache.current.set(levelNumber, safePaths);
        }
        return { ...shadow, active: true };
      }
      return shadow;
    }

    const newShadow = { ...shadow };
    
    // Use pre-computed safe paths
    const safePaths = shadowPathCache.current.get(levelNumber) || [];
    
    // Find the best path to player that avoids all traps
    let targetX = player.x;
    let targetY = player.y;
    
    if (safePaths.length > 0) {
      // Find path segment closest to player
      let bestPath: Array<{ x: number; y: number }> | null = null;
      let minDistance = Infinity;
      
      for (const path of safePaths) {
        for (let i = 0; i < path.length - 1; i++) {
          const segmentStart = path[i];
          const segmentEnd = path[i + 1];
          const segmentMidX = (segmentStart.x + segmentEnd.x) / 2;
          const segmentMidY = (segmentStart.y + segmentEnd.y) / 2;
          
          const distance = Math.sqrt(
            Math.pow(player.x - segmentMidX, 2) + Math.pow(player.y - segmentMidY, 2)
          );
          
          if (distance < minDistance && isPositionSafe(traps, segmentMidX, segmentMidY, shadow.width, shadow.height)) {
            minDistance = distance;
            bestPath = path;
            targetX = segmentEnd.x;
            targetY = segmentEnd.y;
          }
        }
      }
    }
    
    const dx = targetX - shadow.x;
    const dy = targetY - shadow.y;
    
    // Check for traps in the path
    const trapsInPath = traps.filter(t => {
      if (!t.active) return false;
      const trapDx = t.x - shadow.x;
      const trapDy = Math.abs(t.y - shadow.y);
      const pathDx = targetX - shadow.x;
      return Math.abs(trapDx) < 150 && trapDy < 100 &&
             ((pathDx > 0 && trapDx > 0 && trapDx < pathDx) || 
              (pathDx < 0 && trapDx < 0 && trapDx > pathDx));
    });
    
    // Avoid traps by finding alternative safe path
    if (trapsInPath.length > 0) {
      // Find nearest safe platform
      const safePlatforms = platforms.filter(p => {
        const platformMidX = p.x + p.w / 2;
        const platformMidY = p.y;
        return isPositionSafe(traps, platformMidX, platformMidY, shadow.width, shadow.height);
      });
      
      if (safePlatforms.length > 0) {
        const nearestSafe = safePlatforms.reduce((closest, p) => {
          const dist = Math.sqrt(
            Math.pow(p.x + p.w / 2 - shadow.x, 2) + Math.pow(p.y - shadow.y, 2)
          );
          const closestDist = Math.sqrt(
            Math.pow(closest.x + closest.w / 2 - shadow.x, 2) + Math.pow(closest.y - shadow.y, 2)
          );
          return dist < closestDist ? p : closest;
        });
        
        targetX = nearestSafe.x + nearestSafe.w / 2;
        targetY = nearestSafe.y;
      }
    }
    
    // Move towards target
    const newDx = targetX - shadow.x;
    if (Math.abs(newDx) > 10) {
      newShadow.vx = newDx > 0 ? SHADOW_SPEED * 1.2 : -SHADOW_SPEED * 1.2;
    } else {
      newShadow.vx = 0;
    }
    
    // Apply gravity
    newShadow.vy += GRAVITY;
    
    // Check platform collision (including moving platforms)
    const { grounded, newY } = checkPlatformCollision(
      { ...newShadow, width: shadow.width, height: shadow.height } as Player,
      platforms,
      traps.filter(t => t.type === 'land_moving')
    );
    
    if (grounded) {
      newShadow.vy = 0;
      newShadow.y = newY;
      
      // Jump to reach target if needed
      const targetDy = targetY - shadow.y;
      if (targetDy < -30 || (Math.abs(newDx) < 150 && targetDy < -20)) {
        newShadow.vy = JUMP_FORCE * 1.2;
      }
    }
    
    newShadow.x += newShadow.vx;
    newShadow.y += newShadow.vy;
    
    // Keep shadow in bounds
    newShadow.x = Math.max(0, newShadow.x);
    
    return newShadow;
  }, [checkPlatformCollision]);

  // CRITICAL FIX #15: Memoized game loop to prevent closures over stale state
  const gameLoopCallback = useCallback((timestamp: number) => {
    if (!isMountedRef.current) return;
    
    setGameState(prev => {
      if (prev.gameStatus !== 'playing' || !currentLevelData) {
        return prev;
      }
      
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      const newPlayer = { ...prev.player };
      
      // Handle input
      if (keysPressed.current.has('ArrowLeft') || keysPressed.current.has('a')) {
        newPlayer.vx = -MOVE_SPEED;
        newPlayer.facingRight = false;
      } else if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('d')) {
        newPlayer.vx = MOVE_SPEED;
        newPlayer.facingRight = true;
      } else {
        newPlayer.vx = 0;
      }

      if ((keysPressed.current.has('ArrowUp') || keysPressed.current.has('w') || keysPressed.current.has(' ')) && newPlayer.isGrounded) {
        newPlayer.vy = JUMP_FORCE;
        newPlayer.isJumping = true;
        newPlayer.isGrounded = false;
      }

      // Apply gravity
      newPlayer.vy += GRAVITY;
      
      // Update position
      newPlayer.x += newPlayer.vx;
      newPlayer.y += newPlayer.vy;

      // Keep player in bounds
      newPlayer.x = Math.max(0, Math.min(newPlayer.x, currentLevelData.width - newPlayer.width));
      
      // Update traps FIRST (so moving platforms are in correct positions)
      const gameTime = Date.now() - prev.startTime;
      const newTraps = updateTrapsLocal(prev.traps, deltaTime, newPlayer.x, newPlayer.y, gameTime);
      
      // Check platform collision (including moving platforms) - AFTER trap update
      const { grounded, newY, platformVelocity } = checkPlatformCollision(newPlayer, currentLevelData.platforms, newTraps);
      if (grounded) {
        newPlayer.y = newY;
        newPlayer.vy = 0;
        newPlayer.isGrounded = true;
        newPlayer.isJumping = false;
        // Move player with moving platform
        if (platformVelocity) {
          newPlayer.x += platformVelocity.x;
          newPlayer.y += platformVelocity.y;
        }
      } else {
        newPlayer.isGrounded = false;
      }

      // Check if fallen off map
      if (newPlayer.y > currentLevelData.height + 100) {
        soundManager.play('death');
        return { ...prev, gameStatus: 'game_over' as const };
      }

      // Check trap collision with all trap types
      const trapCollision = checkTrapCollision(newPlayer, newTraps);
      if (trapCollision.hit) {
        // Fake floor doesn't kill immediately, but falling does
        if (trapCollision.trapType === 'fake_floor') {
          // Player falls through, will die when hitting bottom
        } else {
          soundManager.play('death');
          return { ...prev, gameStatus: 'game_over' as const };
        }
      }
      
      // Check if player fell through fake floor
      if (trapCollision.trapType === 'fake_floor' && newPlayer.y > currentLevelData.height + 100) {
        soundManager.play('death');
        return { ...prev, gameStatus: 'game_over' as const };
      }

      // Update shadow with perfect pathfinding (knows all safe paths)
      const newShadow = updateShadow(prev.shadow, newPlayer, currentLevelData.platforms, newTraps, currentLevelData.exit_position, prev.currentLevel);
      
      // Play shadow spawn sound
      if (newShadow.active && !prev.shadow.active) {
        soundManager.play('shadowSpawn');
      }

      // Check shadow collision - trigger battle
      if (checkShadowCollision(newPlayer, newShadow)) {
        return { ...prev, player: newPlayer, shadow: newShadow, gameStatus: 'pokemon_select' as const };
      }

      // Check exit collision
      if (checkExitCollision(newPlayer, currentLevelData.exit_position)) {
        soundManager.play('victory');
        // Mark level as completed with time tracking
        const timeSeconds = (Date.now() - prev.startTime) / 1000;
        const playerName = prev.playerName || localStorage.getItem('playerName') || 'guest';
        console.log('[GAME] Level completed - level=%d, time=%.1fs, playerName=%s', prev.currentLevel, timeSeconds, playerName);
        completeLevel(prev.currentLevel, timeSeconds, playerName);
        return { ...prev, player: newPlayer, gameStatus: 'victory' as const, timer: Date.now() - prev.startTime };
      }

      // Update camera
      const targetCameraX = Math.max(0, Math.min(
        newPlayer.x - 400,
        currentLevelData.width - 900
      ));

      return {
        ...prev,
        player: newPlayer,
        shadow: newShadow,
        traps: newTraps,
        timer: Date.now() - prev.startTime,
        cameraX: prev.cameraX + (targetCameraX - prev.cameraX) * 0.1,
      };
    });

    if (isMountedRef.current) {
      gameLoopRef.current = requestAnimationFrame(gameLoopCallback);
    }
  }, [currentLevelData, checkPlatformCollision, checkTrapCollision, checkExitCollision, checkShadowCollision, updateTrapsLocal, updateShadow]);

  // Start/stop game loop
  useEffect(() => {
    if (gameState.gameStatus === 'playing' && isMountedRef.current) {
      lastTimeRef.current = performance.now();
      gameLoopRef.current = requestAnimationFrame(gameLoopCallback);
    }
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.gameStatus, gameLoopCallback]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current.add(key);
      // Also add arrow keys as-is for compatibility
      if (e.key.startsWith('Arrow')) {
        keysPressed.current.add(e.key);
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current.delete(key);
      if (e.key.startsWith('Arrow')) {
        keysPressed.current.delete(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);


  const startGame = useCallback((levelNumber: number = 1) => {
    loadLevel(levelNumber);
  }, [loadLevel]);

  const setPlayerSkin = useCallback((skinId: number) => {
    if (isMountedRef.current) {
      setGameState(prev => ({
        ...prev,
        player: { ...prev.player, skinId },
      }));
    }
  }, []);

  const goToMenu = useCallback(() => {
    if (isMountedRef.current) {
      setGameState(prev => ({
        ...prev,
        gameStatus: 'menu',
      }));
    }
  }, []);

  const startBattle = useCallback(() => {
    if (isMountedRef.current) {
      setGameState(prev => ({
        ...prev,
        gameStatus: 'battle',
      }));
    }
  }, []);

  const endBattle = useCallback((playerWon: boolean) => {
    if (!isMountedRef.current) return;
    
    if (playerWon) {
      // Resume level at current state
      setGameState(prev => ({
        ...prev,
        gameStatus: 'playing',
        shadow: {
          ...prev.shadow,
          active: false,
          spawnTime: Date.now() + SHADOW_SPAWN_DELAY,
          x: currentLevelData?.spawn_position.x || 50,
          y: currentLevelData?.spawn_position.y || 400,
        },
      }));
    } else {
      // Reset level but keep timer
      resetLevel(true);
    }
  }, [currentLevelData, resetLevel]);

  const nextLevel = useCallback(() => {
    if (!isMountedRef.current) return;
    
    const nextLevelNum = gameState.currentLevel + 1;
    if (nextLevelNum <= 16) { // 15 normal levels + 1 boss level
      loadLevel(nextLevelNum);
    } else {
      // Game complete - show final leaderboard
      setGameState(prev => ({ ...prev, gameStatus: 'leaderboard' }));
    }
  }, [gameState.currentLevel, loadLevel]);

  const showLeaderboard = useCallback(() => {
    if (isMountedRef.current) {
      setGameState(prev => ({ ...prev, gameStatus: 'leaderboard' }));
    }
  }, []);

  const showSkinSelect = useCallback(() => {
    if (isMountedRef.current) {
      setGameState(prev => ({ ...prev, gameStatus: 'skin_select' }));
    }
  }, []);

  const showProfile = useCallback(() => {
    if (isMountedRef.current) {
      setGameState(prev => ({ ...prev, gameStatus: 'profile' }));
    }
  }, []);

  return {
    gameState,
    currentLevelData,
    levels,
    startGame,
    resetLevel,
    setPlayerSkin,
    goToMenu,
    startBattle,
    endBattle,
    nextLevel,
    showLeaderboard,
    showSkinSelect,
    showProfile,
  };
}
