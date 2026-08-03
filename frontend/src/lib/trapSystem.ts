// Advanced Trap System inspired by Level Devil
// Provides unpredictable, troll-like trap behavior

import { Trap, Platform } from '@/types/game';
import { soundManager } from './soundManager';

export interface TrapBehavior {
  shouldActivate: (trap: Trap, playerX: number, playerY: number, gameTime: number) => boolean;
  update: (trap: Trap, deltaTime: number, playerX?: number, playerY?: number) => Trap;
  isSafe: (trap: Trap, x: number, y: number, width: number, height: number) => boolean;
}

// Default spike behavior
const defaultSpikeBehavior: TrapBehavior = {
  shouldActivate: () => true, // Always active
  update: (trap) => trap, // No updates needed
  isSafe: (trap, x, y, width, height) => {
    if (!trap.active) return true;
    const trapWidth = trap.w || 30;
    return !(x < trap.x + trapWidth && x + width > trap.x && 
             y < trap.y + 20 && y + height > trap.y);
  }
};

// Trap behavior implementations
const trapBehaviors: Record<string, TrapBehavior> = {
  // Standard spike - always active
  spike: defaultSpikeBehavior,
  
  // Moving spike - moves back and forth
  moving_spike: {
    shouldActivate: () => true,
    update: (trap, deltaTime) => {
      const newTrap = { ...trap };
      if (trap.range) {
        const originalX = trap.originalX || trap.x;
        newTrap.x += (trap.direction || 1) * 2;
        if (newTrap.x > originalX + trap.range || newTrap.x < originalX - trap.range) {
          newTrap.direction = -(trap.direction || 1);
        }
      }
      return newTrap;
    },
    isSafe: defaultSpikeBehavior.isSafe
  },
  
  // Moving exit - moves back and forth
  moving_exit: {
    shouldActivate: () => true,
    update: (trap, deltaTime) => {
      const newTrap = { ...trap };
      const originalX = trap.originalX || trap.x;
      const range = trap.range || 100;
      newTrap.x += (trap.direction || 1) * 1.5;
      if (newTrap.x > originalX + range || newTrap.x < originalX - range) {
        newTrap.direction = -(trap.direction || 1);
      }
      return newTrap;
    },
    isSafe: () => true // Exit is safe, just moves
  },
  
  // Fake floor - collapses when stepped on
  fake_floor: {
    shouldActivate: (trap, playerX, playerY) => {
      const trapWidth = trap.w || 80;
      return playerX >= trap.x && playerX <= trap.x + trapWidth && 
             Math.abs(playerY - trap.y) < 50;
    },
    update: (trap, deltaTime, playerX, playerY) => {
      const newTrap = { ...trap };
      if (trap.triggered && typeof trap.triggered === 'number') {
        const collapseTime = trap.collapseTimer || 500;
        const elapsed = Date.now() - trap.triggered;
        if (elapsed > collapseTime) {
          newTrap.active = true; // Floor has collapsed
        }
      }
      return newTrap;
    },
    isSafe: (trap, x, y, width, height) => {
      if (!trap.active) return true;
      const trapWidth = trap.w || 80;
      return !(x < trap.x + trapWidth && x + width > trap.x && 
               y < trap.y + 10 && y + height > trap.y);
    }
  },

  // Delayed collapse - platform collapses after a delay
  delayed_collapse: {
    shouldActivate: (trap, playerX, playerY) => {
      const trapWidth = trap.w || 100;
      return playerX >= trap.x && playerX <= trap.x + trapWidth && 
             Math.abs(playerY - trap.y) < 50;
    },
    update: (trap, deltaTime, playerX, playerY) => {
      const newTrap = { ...trap };
      if (trap.triggered && typeof trap.triggered === 'number') {
        const delay = trap.delay || (1000 + Math.random() * 2000); // 1-3 seconds
        const elapsed = Date.now() - trap.triggered;
        if (elapsed > delay && !newTrap.active) {
          newTrap.active = true;
          soundManager.play('trap');
        }
      }
      return newTrap;
    },
    isSafe: (trap, x, y, width, height) => {
      if (!trap.active) return true;
      const trapWidth = trap.w || 100;
      return !(x < trap.x + trapWidth && x + width > trap.x && 
               y < trap.y + 20 && y + height > trap.y);
    }
  },

  // Invisible trigger - activates when player passes through
  invisible_trigger: {
    shouldActivate: (trap, playerX, playerY) => {
      const triggerWidth = trap.w || 50;
      const triggerHeight = trap.h || 100;
      return playerX >= trap.x && playerX <= trap.x + triggerWidth &&
             playerY >= trap.y && playerY <= trap.y + triggerHeight;
    },
    update: (trap, deltaTime, playerX, playerY) => {
      const newTrap = { ...trap };
      if (trap.triggered && !newTrap.active) {
        // Activate after a random delay
        const delay = trap.delay || (Math.random() * 500);
        if (typeof trap.triggered === 'number' && Date.now() - trap.triggered > delay) {
          newTrap.active = true;
          soundManager.play('trap');
        }
      }
      return newTrap;
    },
    isSafe: (trap, x, y, width, height) => {
      if (!trap.active) return true;
      const trapWidth = trap.w || 30;
      return !(x < trap.x + trapWidth && x + width > trap.x && 
               y < trap.y + 20 && y + height > trap.y);
    }
  },

  // Reverse platform - moves in opposite direction
  reverse_platform: {
    shouldActivate: () => true, // Always active
    update: (trap, deltaTime) => {
      const newTrap = { ...trap };
      const originalX = trap.originalX || trap.x;
      const range = trap.range || 200;
      const speed = (trap.direction || -1) * 3; // Reverse direction
      
      newTrap.x += speed;
      
      if (newTrap.x > originalX + range || newTrap.x < originalX - range) {
        newTrap.direction = -(newTrap.direction || -1);
      }
      
      return newTrap;
    },
    isSafe: () => true // Platform itself is safe, but movement is deceptive
  },

  // Moving wall - blocks path unpredictably
  moving_wall: {
    shouldActivate: () => true,
    update: (trap, deltaTime, playerX) => {
      const newTrap = { ...trap };
      const originalX = trap.originalX || trap.x;
      const range = trap.range || 300;
      const speed = (trap.direction || 1) * 2;
      
      // Change direction based on player position (unpredictable)
      if (playerX !== undefined) {
        const distance = playerX - newTrap.x;
        if (Math.abs(distance) < 100 && Math.random() < 0.01) {
          newTrap.direction = distance > 0 ? 1 : -1;
        }
      }
      
      newTrap.x += (newTrap.direction || 1) * speed;
      
      if (newTrap.x > originalX + range || newTrap.x < originalX - range) {
        newTrap.direction = -(newTrap.direction || 1);
      }
      
      return newTrap;
    },
    isSafe: (trap, x, y, width, height) => {
      const wallWidth = trap.w || 40;
      const wallHeight = trap.h || 200;
      return !(x < trap.x + wallWidth && x + width > trap.x && 
               y < trap.y + wallHeight && y + height > trap.y);
    }
  },

  // Teleport hazard - appears at different locations
  teleport_hazard: {
    shouldActivate: (trap, playerX, playerY) => {
      const distance = Math.sqrt(
        Math.pow(playerX - trap.x, 2) + Math.pow(playerY - trap.y, 2)
      );
      return distance < 150;
    },
    update: (trap, deltaTime, playerX, playerY) => {
      const newTrap = { ...trap };
      
      // Teleport to new location unpredictably
      if (trap.teleportTarget && Math.random() < 0.003) {
        newTrap.x = trap.teleportTarget.x;
        newTrap.y = trap.teleportTarget.y;
        newTrap.active = true;
        soundManager.play('trap');
      }
      
      // Deactivate after a time
      if (newTrap.active && typeof newTrap.lastActivation === 'number') {
        if (Date.now() - newTrap.lastActivation > 2000) {
          newTrap.active = false;
        }
      }
      
      return newTrap;
    },
    isSafe: (trap, x, y, width, height) => {
      if (!trap.active) return true;
      const trapWidth = trap.w || 30;
      return !(x < trap.x + trapWidth && x + width > trap.x && 
               y < trap.y + 20 && y + height > trap.y);
    }
  },

  // Compound trap - multiple traps triggered together
  compound_trap: {
    shouldActivate: (trap, playerX, playerY) => {
      if (!trap.compoundTraps) return false;
      return trap.compoundTraps.some(subTrap => {
        const subTrapWidth = subTrap.w || 50;
        return playerX >= subTrap.x && playerX <= subTrap.x + subTrapWidth &&
               Math.abs(playerY - subTrap.y) < 50;
      });
    },
    update: (trap, deltaTime, playerX, playerY) => {
      const newTrap = { ...trap };
      if (newTrap.compoundTraps) {
        newTrap.compoundTraps = newTrap.compoundTraps.map(subTrap => {
          const behavior = trapBehaviors[subTrap.type] || trapBehaviors.spike;
          return behavior.update(subTrap, deltaTime, playerX, playerY);
        });
        
        // Activate all if any is triggered
        if (newTrap.compoundTraps.some(t => t.active)) {
          newTrap.active = true;
          soundManager.play('trap');
        }
      }
      return newTrap;
    },
    isSafe: (trap, x, y, width, height) => {
      if (!trap.active || !trap.compoundTraps) return true;
      return trap.compoundTraps.every(subTrap => {
        const behavior = trapBehaviors[subTrap.type] || trapBehaviors.spike;
        return behavior.isSafe(subTrap, x, y, width, height);
      });
    }
  },

  // Surprise spike - unpredictable activation
  surprise_spike: {
    shouldActivate: (trap, playerX, playerY) => {
      const distance = Math.abs(playerX - trap.x);
      if (distance < 150) {
        // Unpredictable activation based on multiple factors
        const baseChance = (150 - distance) / 150 * 0.02;
        const timeFactor = (Date.now() % 10000) / 10000; // Time-based variation
        const seedFactor = (trap.behaviorSeed || 0) % 100 / 100;
        const activationChance = baseChance * (1 + timeFactor * 0.5 + seedFactor * 0.3);
        return Math.random() < activationChance;
      }
      return false;
    },
    update: (trap, deltaTime, playerX, playerY) => {
      const newTrap = { ...trap };
      if (trap.triggered && typeof trap.triggered === 'number') {
        const activeTime = Date.now() - trap.triggered;
        if (activeTime > 2000) {
          newTrap.active = false;
          newTrap.triggered = false;
        }
      }
      return newTrap;
    },
    isSafe: (trap, x, y, width, height) => {
      if (!trap.active) return true;
      const trapWidth = trap.w || 30;
      return !(x < trap.x + trapWidth && x + width > trap.x && 
               y < trap.y + 20 && y + height > trap.y);
    }
  },

  // Switch trap - activates when player steps on switch, triggers linked traps
  switch_trap: {
    shouldActivate: (trap, playerX, playerY) => {
      const switchWidth = trap.w || 40;
      const switchHeight = trap.h || 20;
      return playerX >= trap.x && playerX <= trap.x + switchWidth &&
             playerY >= trap.y && playerY <= trap.y + switchHeight;
    },
    update: (trap, deltaTime, playerX, playerY) => {
      const newTrap = { ...trap };
      if (trap.triggered && !newTrap.active) {
        newTrap.active = true;
        soundManager.play('trap');
      }
      return newTrap;
    },
    isSafe: () => true // Switch itself is safe, but triggers other traps
  },

  // Point trigger trap - activates when player passes specific (x,y) point
  point_trigger: {
    shouldActivate: (trap, playerX, playerY) => {
      if (!trap.triggerPoint) return false;
      const triggerRadius = 30;
      const distance = Math.sqrt(
        Math.pow(playerX - trap.triggerPoint.x, 2) + 
        Math.pow(playerY - trap.triggerPoint.y, 2)
      );
      return distance < triggerRadius;
    },
    update: (trap, deltaTime, playerX, playerY) => {
      const newTrap = { ...trap };
      if (trap.triggered && !newTrap.active) {
        newTrap.active = true;
        soundManager.play('trap');
      }
      return newTrap;
    },
    isSafe: (trap, x, y, width, height) => {
      if (!trap.active) return true;
      const trapWidth = trap.w || 30;
      return !(x < trap.x + trapWidth && x + width > trap.x && 
               y < trap.y + 20 && y + height > trap.y);
    }
  },

  // Land moving trap - platform that moves horizontally/vertically
  land_moving: {
    shouldActivate: () => true,
    update: (trap, deltaTime) => {
      const newTrap = { ...trap };
      const moveSpeed = trap.moveSpeed || 2;
      const pattern = trap.movePattern || 'horizontal';
      const originalX = trap.originalX || trap.x;
      const originalY = trap.originalY || trap.y;
      const range = trap.range || 200;

      if (pattern === 'horizontal') {
        newTrap.x += (trap.direction || 1) * moveSpeed;
        if (newTrap.x > originalX + range || newTrap.x < originalX - range) {
          newTrap.direction = -(trap.direction || 1);
        }
      } else if (pattern === 'vertical') {
        newTrap.y += (trap.direction || 1) * moveSpeed;
        if (newTrap.y > originalY + range || newTrap.y < originalY - range) {
          newTrap.direction = -(trap.direction || 1);
        }
      } else if (pattern === 'circular') {
        const angle = (Date.now() / 1000) * (trap.direction || 1);
        newTrap.x = originalX + Math.cos(angle) * range;
        newTrap.y = originalY + Math.sin(angle) * range;
      } else if (pattern === 'zigzag') {
        newTrap.x += (trap.direction || 1) * moveSpeed;
        newTrap.y = originalY + Math.sin((newTrap.x - originalX) / 50) * 50;
        if (newTrap.x > originalX + range || newTrap.x < originalX - range) {
          newTrap.direction = -(trap.direction || 1);
        }
      }

      return newTrap;
    },
    isSafe: () => true // Platform is safe, but movement is deceptive
  },

  // Spike moving trap - moving spike that follows patterns
  spike_moving: {
    shouldActivate: () => true,
    update: (trap, deltaTime) => {
      const newTrap = { ...trap };
      const moveSpeed = trap.moveSpeed || 3;
      const pattern = trap.movePattern || 'horizontal';
      const originalX = trap.originalX || trap.x;
      const originalY = trap.originalY || trap.y;
      const range = trap.range || 150;

      if (pattern === 'horizontal') {
        newTrap.x += (trap.direction || 1) * moveSpeed;
        if (newTrap.x > originalX + range || newTrap.x < originalX - range) {
          newTrap.direction = -(trap.direction || 1);
        }
      } else if (pattern === 'vertical') {
        newTrap.y += (trap.direction || 1) * moveSpeed;
        if (newTrap.y > originalY + range || newTrap.y < originalY - range) {
          newTrap.direction = -(trap.direction || 1);
        }
      } else if (pattern === 'circular') {
        const angle = (Date.now() / 1000) * (trap.direction || 1);
        newTrap.x = originalX + Math.cos(angle) * range;
        newTrap.y = originalY + Math.sin(angle) * range;
      } else if (pattern === 'zigzag') {
        newTrap.x += (trap.direction || 1) * moveSpeed;
        newTrap.y = originalY + Math.sin((newTrap.x - originalX) / 30) * 30;
        if (newTrap.x > originalX + range || newTrap.x < originalX - range) {
          newTrap.direction = -(trap.direction || 1);
        }
      }

      return newTrap;
    },
    isSafe: defaultSpikeBehavior.isSafe
  },

  // Wall moving trap - moving wall that blocks path
  wall_moving: {
    shouldActivate: () => true,
    update: (trap, deltaTime, playerX) => {
      const newTrap = { ...trap };
      const moveSpeed = trap.moveSpeed || 2.5;
      const pattern = trap.movePattern || 'horizontal';
      const originalX = trap.originalX || trap.x;
      const originalY = trap.originalY || trap.y;
      const range = trap.range || 300;

      // Change direction based on player position (unpredictable)
      if (playerX !== undefined && Math.random() < 0.01) {
        const distance = playerX - newTrap.x;
        if (Math.abs(distance) < 150) {
          newTrap.direction = distance > 0 ? 1 : -1;
        }
      }

      if (pattern === 'horizontal') {
        newTrap.x += (newTrap.direction || 1) * moveSpeed;
        if (newTrap.x > originalX + range || newTrap.x < originalX - range) {
          newTrap.direction = -(newTrap.direction || 1);
        }
      } else if (pattern === 'vertical') {
        newTrap.y += (newTrap.direction || 1) * moveSpeed;
        if (newTrap.y > originalY + range || newTrap.y < originalY - range) {
          newTrap.direction = -(newTrap.direction || 1);
        }
      }

      return newTrap;
    },
    isSafe: (trap, x, y, width, height) => {
      const wallWidth = trap.w || 40;
      const wallHeight = trap.h || 200;
      return !(x < trap.x + wallWidth && x + width > trap.x && 
               y < trap.y + wallHeight && y + height > trap.y);
    }
  }
};

// Global switch state - tracks which switches are activated
const switchStates = new Map<string, boolean>();

// Reset switch states (call when level loads/resets)
export function resetSwitchStates(): void {
  switchStates.clear();
}

// Main trap update function
export function updateTraps(
  traps: Trap[],
  deltaTime: number,
  playerX: number,
  playerY: number,
  gameTime: number
): Trap[] {
  // First pass: Update switches and point triggers
  const updatedTraps = traps.map(trap => {
    const behavior = trapBehaviors[trap.type] || trapBehaviors.spike;
    
    // Check if trap should activate
    if (!trap.triggered && behavior.shouldActivate(trap, playerX, playerY, gameTime)) {
      const newTrap = { ...trap, triggered: Date.now() };
      
      // Handle switch traps
      if (trap.type === 'switch_trap' && trap.switchId) {
        switchStates.set(trap.switchId, true);
        soundManager.play('trap');
      }
      
      // Handle point triggers
      if (trap.type === 'point_trigger') {
        newTrap.active = true;
        soundManager.play('trap');
      }
      
      // Handle surprise spikes
      if (trap.type === 'surprise_spike') {
        newTrap.active = true;
        soundManager.play('trap');
      }
      
      return behavior.update(newTrap, deltaTime, playerX, playerY);
    }
    
    // Update existing trap
    return behavior.update(trap, deltaTime, playerX, playerY);
  });
  
  // Second pass: Activate traps linked to switches
  return updatedTraps.map(trap => {
    // Check if this trap is linked to an activated switch
    if (trap.linkedTraps && trap.linkedTraps.length > 0) {
      const isLinkedToActivatedSwitch = trap.linkedTraps.some(switchId => 
        switchStates.get(switchId) === true
      );
      if (isLinkedToActivatedSwitch && !trap.active) {
        trap.active = true;
        soundManager.play('trap');
      }
    }
    return trap;
  });
}

// Check if a position is safe from all traps
export function isPositionSafe(
  traps: Trap[],
  x: number,
  y: number,
  width: number,
  height: number
): boolean {
  return traps.every(trap => {
    const behavior = trapBehaviors[trap.type] || trapBehaviors.spike;
    return behavior.isSafe(trap, x, y, width, height);
  });
}

// Find all safe paths through a level (for shadow AI)
export function findSafePaths(
  platforms: Platform[],
  traps: Trap[],
  startX: number,
  startY: number,
  endX: number,
  endY: number
): Array<{ x: number; y: number }>[] {
  // Simple pathfinding: find platforms that form a safe path
  const paths: Array<{ x: number; y: number }>[] = [];
  
  // Start from spawn
  const startPlatform = platforms.find(p => 
    startX >= p.x && startX <= p.x + p.w &&
    Math.abs(startY - p.y) < 50
  );
  
  if (!startPlatform) return paths;
  
  // BFS to find safe paths
  const queue: Array<{ platform: Platform; path: Array<{ x: number; y: number }> }> = [
    { platform: startPlatform, path: [{ x: startX, y: startY }] }
  ];
  const visited = new Set<number>();
  
  while (queue.length > 0) {
    const { platform, path } = queue.shift()!;
    const platformId = platform.x * 10000 + platform.y;
    
    if (visited.has(platformId)) continue;
    visited.add(platformId);
    
    // Check if we reached the end
    if (Math.abs(platform.x - endX) < 200) {
      paths.push([...path, { x: endX, y: endY }]);
      continue;
    }
    
    // Find adjacent safe platforms
    const adjacentPlatforms = platforms.filter(p => {
      const distance = Math.sqrt(
        Math.pow((p.x + p.w / 2) - (platform.x + platform.w / 2), 2) +
        Math.pow(p.y - platform.y, 2)
      );
      
      // Check if path between platforms is safe
      const midX = (platform.x + platform.w / 2 + p.x + p.w / 2) / 2;
      const midY = (platform.y + p.y) / 2;
      
      return distance < 300 && 
             distance > 50 &&
             isPositionSafe(traps, midX, midY, 32, 48);
    });
    
    for (const nextPlatform of adjacentPlatforms) {
      const nextPath = [...path, { 
        x: nextPlatform.x + nextPlatform.w / 2, 
        y: nextPlatform.y 
      }];
      queue.push({ platform: nextPlatform, path: nextPath });
    }
  }
  
  return paths;
}
