import React, { useRef, useEffect } from 'react';
import { GameState, Level, PLAYER_SKINS } from '@/types/game';

interface GameCanvasProps {
  gameState: GameState;
  levelData: Level | null;
}

const BACKGROUND_IMAGES = [
  'https://d64gsuwffb70l.cloudfront.net/69701ba07ca195b7b1a12f31_1768954894236_ca39ba21.jpg',
  'https://d64gsuwffb70l.cloudfront.net/69701ba07ca195b7b1a12f31_1768954897278_6f7fa8d7.jpg',
  'https://d64gsuwffb70l.cloudfront.net/69701ba07ca195b7b1a12f31_1768954904711_3a5bdb0a.jpg',
];

// Helper function to adjust color brightness
function adjustColorBrightness(color: string, factor: number): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const newR = Math.min(255, Math.floor(r * factor));
  const newG = Math.min(255, Math.floor(g * factor));
  const newB = Math.min(255, Math.floor(b * factor));
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, levelData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const shadowImageRef = useRef<HTMLImageElement | null>(null);

  // Load background image
  useEffect(() => {
    const bgIndex = (gameState.currentLevel - 1) % BACKGROUND_IMAGES.length;
    const img = new Image();
    img.src = BACKGROUND_IMAGES[bgIndex];
    img.onload = () => {
      bgImageRef.current = img;
    };

    // Load shadow image
    const shadowImg = new Image();
    shadowImg.src = 'https://d64gsuwffb70l.cloudfront.net/69701ba07ca195b7b1a12f31_1768954924027_50769303.jpg';
    shadowImg.onload = () => {
      shadowImageRef.current = shadowImg;
    };
  }, [gameState.currentLevel]);

  // Render game - CRITICAL FIX #4: Optimize for 60 FPS with requestAnimationFrame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !levelData) return;

    const ctx = canvas.getContext('2d', { alpha: false }); // Disable alpha for performance
    if (!ctx) return;

    let animationFrameId: number;
    let lastRenderTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    const render = (currentTime: number) => {
      // Throttle to 60 FPS
      if (currentTime - lastRenderTime < frameInterval) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      lastRenderTime = currentTime;
      const { player, shadow, traps, cameraX } = gameState;

      // Clear canvas
      ctx.fillStyle = '#0d0015';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw background
      if (bgImageRef.current) {
        const bgX = -(cameraX * 0.3) % canvas.width;
        ctx.globalAlpha = 0.4;
        ctx.drawImage(bgImageRef.current, bgX, 0, canvas.width, canvas.height);
        ctx.drawImage(bgImageRef.current, bgX + canvas.width, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
      }

      // Draw gradient overlay
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(26, 0, 51, 0.7)');
      gradient.addColorStop(1, 'rgba(13, 0, 21, 0.9)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(-cameraX, 0);

      // Draw platforms
      levelData.platforms.forEach(platform => {
        // Platform shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(platform.x + 5, platform.y + 5, platform.w, platform.h);

        // Platform gradient
        const platGradient = ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.h);
        platGradient.addColorStop(0, '#2d1b4e');
        platGradient.addColorStop(1, '#1a0f2e');
        ctx.fillStyle = platGradient;
        ctx.fillRect(platform.x, platform.y, platform.w, platform.h);

        // Platform top highlight
        ctx.fillStyle = '#4a2c7a';
        ctx.fillRect(platform.x, platform.y, platform.w, 4);

        // Platform edge
        ctx.strokeStyle = '#6b3fa0';
        ctx.lineWidth = 2;
        ctx.strokeRect(platform.x, platform.y, platform.w, platform.h);
      });

      // Draw traps - all types
      traps.forEach(trap => {
        // Spike traps (spike, moving_spike, surprise_spike, spike_moving)
        if (trap.type === 'spike' || trap.type === 'moving_spike' || trap.type === 'surprise_spike' || trap.type === 'spike_moving') {
          if (!trap.active && (trap.type === 'surprise_spike' || trap.type === 'spike_moving')) return; // Don't draw inactive surprise spikes
          
          const trapWidth = trap.w || 30;
          let fillColor = '#ff0033';
          if (trap.type === 'surprise_spike') fillColor = '#ff0066';
          if (trap.type === 'spike_moving') fillColor = '#ff3366';
          
          ctx.fillStyle = fillColor;
          ctx.beginPath();
          ctx.moveTo(trap.x, trap.y + 20);
          ctx.lineTo(trap.x + trapWidth / 2, trap.y);
          ctx.lineTo(trap.x + trapWidth, trap.y + 20);
          ctx.closePath();
          ctx.fill();

          // Glow effect
          ctx.shadowColor = fillColor;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        } 
        // Fake floor
        else if (trap.type === 'fake_floor') {
          const trapWidth = trap.w || 80;
          const opacity = trap.active ? 0.3 : 0.6;
          ctx.fillStyle = `rgba(45, 27, 78, ${opacity})`;
          ctx.fillRect(trap.x, trap.y, trapWidth, 10);
          ctx.setLineDash([5, 5]);
          ctx.strokeStyle = trap.active ? '#ff0000' : '#ff6600';
          ctx.strokeRect(trap.x, trap.y, trapWidth, 10);
          ctx.setLineDash([]);
        }
        // Delayed collapse platform
        else if (trap.type === 'delayed_collapse') {
          const trapWidth = trap.w || 100;
          const trapHeight = trap.h || 20;
          const warningColor = trap.triggered ? '#ff3300' : '#ffaa00';
          ctx.fillStyle = `rgba(45, 27, 78, ${trap.active ? 0.2 : 0.8})`;
          ctx.fillRect(trap.x, trap.y, trapWidth, trapHeight);
          ctx.strokeStyle = warningColor;
          ctx.lineWidth = 2;
          ctx.strokeRect(trap.x, trap.y, trapWidth, trapHeight);
          if (trap.triggered && !trap.active) {
            // Warning indicator
            ctx.fillStyle = warningColor;
            ctx.fillRect(trap.x + trapWidth / 2 - 5, trap.y - 10, 10, 10);
          }
        }
        // Invisible trigger (show when active)
        else if (trap.type === 'invisible_trigger') {
          if (trap.active) {
            const trapWidth = trap.w || 30;
            ctx.fillStyle = 'rgba(255, 0, 102, 0.7)';
            ctx.fillRect(trap.x, trap.y, trapWidth, trap.h || 100);
          }
        }
        // Reverse platform
        else if (trap.type === 'reverse_platform') {
          const trapWidth = trap.w || 150;
          const trapHeight = trap.h || 20;
          ctx.fillStyle = 'rgba(139, 0, 139, 0.7)';
          ctx.fillRect(trap.x, trap.y, trapWidth, trapHeight);
          ctx.strokeStyle = '#ff00ff';
          ctx.lineWidth = 2;
          ctx.strokeRect(trap.x, trap.y, trapWidth, trapHeight);
          // Direction indicator
          ctx.fillStyle = '#ff00ff';
          const arrowX = trap.direction === -1 ? trap.x + 10 : trap.x + trapWidth - 20;
          ctx.fillText(trap.direction === -1 ? '←' : '→', arrowX, trap.y + 15);
        }
        // Moving wall
        else if (trap.type === 'moving_wall') {
          const wallWidth = trap.w || 40;
          const wallHeight = trap.h || 200;
          ctx.fillStyle = 'rgba(139, 0, 0, 0.8)';
          ctx.fillRect(trap.x, trap.y, wallWidth, wallHeight);
          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 3;
          ctx.strokeRect(trap.x, trap.y, wallWidth, wallHeight);
        }
        // Teleport hazard
        else if (trap.type === 'teleport_hazard') {
          if (trap.active) {
            const trapWidth = trap.w || 30;
            ctx.fillStyle = '#ff00ff';
            ctx.beginPath();
            ctx.arc(trap.x + trapWidth / 2, trap.y + 10, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowColor = '#ff00ff';
            ctx.shadowBlur = 20;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
        // Switch trap
        else if (trap.type === 'switch_trap') {
          const switchWidth = trap.w || 40;
          const switchHeight = trap.h || 20;
          ctx.fillStyle = trap.active ? '#00ff00' : '#ffff00';
          ctx.fillRect(trap.x, trap.y, switchWidth, switchHeight);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(trap.x, trap.y, switchWidth, switchHeight);
        }
        // Point trigger (show when active)
        else if (trap.type === 'point_trigger') {
          if (trap.active && trap.triggerPoint) {
            ctx.fillStyle = '#ff00ff';
            ctx.beginPath();
            ctx.arc(trap.triggerPoint.x, trap.triggerPoint.y, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowColor = '#ff00ff';
            ctx.shadowBlur = 20;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
        // Land moving (moving platform)
        else if (trap.type === 'land_moving') {
          const trapWidth = trap.w || 150;
          const trapHeight = trap.h || 20;
          ctx.fillStyle = 'rgba(100, 50, 200, 0.8)';
          ctx.fillRect(trap.x, trap.y, trapWidth, trapHeight);
          ctx.strokeStyle = '#aa00ff';
          ctx.lineWidth = 2;
          ctx.strokeRect(trap.x, trap.y, trapWidth, trapHeight);
        }
        // Spike moving
        // else if (trap.type === 'spike_moveing') {
        //   const trapWidth = trap.w || 30;
        //   ctx.fillStyle = '#ff3366';
        //   ctx.beginPath();
        //   ctx.moveTo(trap.x, trap.y + 20);
        //   ctx.lineTo(trap.x + trapWidth / 2, trap.y);
        //   ctx.lineTo(trap.x + trapWidth, trap.y + 20);
        //   ctx.closePath();
        //   ctx.fill();
        //   ctx.shadowColor = '#ff3366';
        //   ctx.shadowBlur = 10;
        //   ctx.fill();
        //   ctx.shadowBlur = 0;
        // }
        // Wall moving
        else if (trap.type === 'wall_moving') {
          const wallWidth = trap.w || 40;
          const wallHeight = trap.h || 200;
          ctx.fillStyle = 'rgba(200, 0, 0, 0.9)';
          ctx.fillRect(trap.x, trap.y, wallWidth, wallHeight);
          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 3;
          ctx.strokeRect(trap.x, trap.y, wallWidth, wallHeight);
        }
        // Compound trap
        else if (trap.type === 'compound_trap' && trap.compoundTraps) {
          trap.compoundTraps.forEach(subTrap => {
            // Draw each sub-trap
            if (subTrap.type === 'spike' && subTrap.active) {
              const trapWidth = subTrap.w || 30;
              ctx.fillStyle = '#ff0066';
              ctx.beginPath();
              ctx.moveTo(subTrap.x, subTrap.y + 20);
              ctx.lineTo(subTrap.x + trapWidth / 2, subTrap.y);
              ctx.lineTo(subTrap.x + trapWidth, subTrap.y + 20);
              ctx.closePath();
              ctx.fill();
            } else if (subTrap.type === 'moving_spike' || subTrap.type === 'spike_moving') {
              const trapWidth = subTrap.w || 30;
              ctx.fillStyle = '#ff0066';
              ctx.beginPath();
              ctx.moveTo(subTrap.x, subTrap.y + 20);
              ctx.lineTo(subTrap.x + trapWidth / 2, subTrap.y);
              ctx.lineTo(subTrap.x + trapWidth, subTrap.y + 20);
              ctx.closePath();
              ctx.fill();
            }
          });
        }
      });

      // Draw exit
      const exitGradient = ctx.createRadialGradient(
        levelData.exit_position.x + 25, levelData.exit_position.y + 35, 5,
        levelData.exit_position.x + 25, levelData.exit_position.y + 35, 40
      );
      exitGradient.addColorStop(0, '#00ff88');
      exitGradient.addColorStop(0.5, '#00cc66');
      exitGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = exitGradient;
      ctx.fillRect(levelData.exit_position.x - 15, levelData.exit_position.y - 5, 80, 80);

      // Exit portal
      ctx.fillStyle = '#00ff88';
      ctx.beginPath();
      ctx.arc(levelData.exit_position.x + 25, levelData.exit_position.y + 35, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00ffaa';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw player
      const skin = PLAYER_SKINS[player.skinId] || PLAYER_SKINS[0];
      const time = Date.now() / 1000;
      const animSpeed = skin.animationSpeed || 1.0;
      
      // Player shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(player.x + player.width / 2, player.y + player.height + 5, player.width / 2, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Animated player body based on skin animation type
      let primaryColor = skin.color;
      let secondaryColor = skin.secondaryColor;
      let glowIntensity = 1.0;
      
      if (skin.animationType === 'pulse') {
        glowIntensity = 0.7 + Math.sin(time * animSpeed * 2) * 0.3;
      } else if (skin.animationType === 'glow') {
        glowIntensity = 0.8 + Math.sin(time * animSpeed * 3) * 0.2;
      } else if (skin.animationType === 'shimmer') {
        const shimmer = Math.sin(time * animSpeed * 4) * 0.3 + 0.7;
        primaryColor = adjustColorBrightness(skin.color, shimmer);
        secondaryColor = adjustColorBrightness(skin.secondaryColor, shimmer);
      } else if (skin.animationType === 'flicker') {
        glowIntensity = Math.random() > 0.3 ? 1.0 : 0.5;
      }
      
      // Apply glow effect if needed
      if (skin.animationType === 'glow' || skin.animationType === 'pulse') {
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 15 * glowIntensity;
      }
      
      const playerGradient = ctx.createLinearGradient(player.x, player.y, player.x + player.width, player.y + player.height);
      playerGradient.addColorStop(0, primaryColor);
      playerGradient.addColorStop(1, secondaryColor);
      ctx.fillStyle = playerGradient;
      
      // Body
      ctx.fillRect(player.x + 4, player.y + 16, player.width - 8, player.height - 16);
      
      // Head
      ctx.beginPath();
      ctx.arc(player.x + player.width / 2, player.y + 12, 12, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#ffffff';
      const eyeOffset = player.facingRight ? 3 : -3;
      ctx.beginPath();
      ctx.arc(player.x + player.width / 2 + eyeOffset - 4, player.y + 10, 3, 0, Math.PI * 2);
      ctx.arc(player.x + player.width / 2 + eyeOffset + 4, player.y + 10, 3, 0, Math.PI * 2);
      ctx.fill();

      // Pupils
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(player.x + player.width / 2 + eyeOffset - 4 + (player.facingRight ? 1 : -1), player.y + 10, 1.5, 0, Math.PI * 2);
      ctx.arc(player.x + player.width / 2 + eyeOffset + 4 + (player.facingRight ? 1 : -1), player.y + 10, 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Reset shadow blur
      ctx.shadowBlur = 0;

      // Draw Shadow enemy
      if (shadow.active) {
        // Shadow aura
        const shadowAura = ctx.createRadialGradient(
          shadow.x + shadow.width / 2, shadow.y + shadow.height / 2, 10,
          shadow.x + shadow.width / 2, shadow.y + shadow.height / 2, 60
        );
        shadowAura.addColorStop(0, 'rgba(255, 0, 0, 0.3)');
        shadowAura.addColorStop(1, 'transparent');
        ctx.fillStyle = shadowAura;
        ctx.fillRect(shadow.x - 30, shadow.y - 30, shadow.width + 60, shadow.height + 60);

        // Shadow body
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(shadow.x + 5, shadow.y + 20, shadow.width - 10, shadow.height - 20);
        
        // Shadow head
        ctx.beginPath();
        ctx.arc(shadow.x + shadow.width / 2, shadow.y + 15, 15, 0, Math.PI * 2);
        ctx.fill();

        // Glowing red eyes
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(shadow.x + shadow.width / 2 - 6, shadow.y + 12, 4, 0, Math.PI * 2);
        ctx.arc(shadow.x + shadow.width / 2 + 6, shadow.y + 12, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Tentacles
        const time = Date.now() / 200;
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        
        for (let i = 0; i < 4; i++) {
          const startX = shadow.x + shadow.width / 2 + (i - 1.5) * 10;
          const startY = shadow.y + shadow.height;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.quadraticCurveTo(
            startX + Math.sin(time + i) * 15,
            startY + 20,
            startX + Math.sin(time + i + 1) * 20,
            startY + 40
          );
          ctx.stroke();
        }
      }

      ctx.restore();

      // Continue animation loop
      animationFrameId = requestAnimationFrame(render);
    };

    // Start animation loop
    animationFrameId = requestAnimationFrame(render);

    // Cleanup
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [gameState, levelData]);

  return (
    <canvas
      ref={canvasRef}
      width={2000}
      height={1000}
      className="border-4 border-purple-900 rounded-lg shadow-2xl shadow-purple-900/50"
    />
  );
};
