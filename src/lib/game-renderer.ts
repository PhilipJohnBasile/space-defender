import { GameState, GAME_CONFIG, StarLayer, Particle, getChargeLevel } from './game-types';

// Safety wrapper for canvas arc operations to prevent negative radius errors
function safeArc(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, startAngle: number, endAngle: number): boolean {
  if (radius <= 0 || !isFinite(radius) || isNaN(radius)) {
    console.warn('Attempted to draw arc with invalid radius:', radius);
    return false;
  }
  
  if (!isFinite(x) || !isFinite(y) || isNaN(x) || isNaN(y)) {
    console.warn('Attempted to draw arc at invalid position:', x, y);
    return false;
  }
  
  try {
    ctx.arc(x, y, Math.max(0.1, radius), startAngle, endAngle);
    return true;
  } catch (error) {
    console.error('Canvas arc operation failed:', error, 'with parameters:', { x, y, radius, startAngle, endAngle });
    return false;
  }
}

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState): void {
  try {
    // Save the context state before applying screen shake
    ctx.save();
    
    // Apply screen shake offset
    if (state.screenShake.duration > 0) {
      ctx.translate(state.screenShake.offsetX, state.screenShake.offsetY);
    }
  
  // Clear canvas with space background
  ctx.fillStyle = 'oklch(0.1 0.02 240)';
  ctx.fillRect(
    -state.screenShake.offsetX, 
    -state.screenShake.offsetY, 
    GAME_CONFIG.CANVAS_WIDTH + Math.abs(state.screenShake.offsetX) * 2, 
    GAME_CONFIG.CANVAS_HEIGHT + Math.abs(state.screenShake.offsetY) * 2
  );

  // Draw parallax starfield
  drawStarfield(ctx, state.starLayers);

  // Handle boss intro overlay
  if (state.gameStatus === 'bossIntro') {
    drawBossIntroOverlay(ctx, state);
  }
  
  // Handle boss defeat overlay
  if (state.gameStatus === 'bossDefeat') {
    drawBossDefeatOverlay(ctx, state);
  }

  if (state.gameStatus === 'playing' || state.gameStatus === 'paused' || 
      state.gameStatus === 'bossIntro' || state.gameStatus === 'bossDefeat') {
    // Draw power-ups
    state.powerUps.forEach(powerUp => {
      if (powerUp.active) drawPowerUp(ctx, powerUp);
    });

    // Draw player (dimmed during boss animations)
    if (state.gameStatus === 'bossIntro' || state.gameStatus === 'bossDefeat') {
      ctx.globalAlpha = 0.7;
    }
    drawPlayer(ctx, state.player);
    ctx.globalAlpha = 1;

    // Draw enemies
    state.enemies.forEach(enemy => {
      if (enemy.active) drawEnemy(ctx, enemy);
    });

    // Draw projectiles
    state.projectiles.forEach(projectile => {
      if (projectile.active) drawProjectile(ctx, projectile);
    });

    // Draw particles (explosion effects)
    state.particles.forEach(particle => {
      drawParticle(ctx, particle);
    });
  }
  
  // Restore the context state
  ctx.restore();
  } catch (error) {
    console.error('Error in game rendering:', error);
    // Restore context state even if there's an error
    ctx.restore();
    
    // Draw a simple error message
    ctx.fillStyle = 'red';
    ctx.font = '20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Rendering Error - Please Restart', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2);
  }
}

function drawStarfield(ctx: CanvasRenderingContext2D, starLayers: StarLayer[]): void {
  // Draw distant nebula clouds first
  drawNebula(ctx);
  
  // Draw stars from back to front for proper parallax layering
  starLayers.forEach((layer, layerIndex) => {
    ctx.fillStyle = layer.color;
    
    layer.stars.forEach(star => {
      // Calculate twinkling brightness
      const twinkleBrightness = star.brightness * (0.7 + 0.3 * Math.sin(star.twinklePhase));
      ctx.globalAlpha = twinkleBrightness;
      
      // Special rendering for shooting stars (last layer)
      if (layerIndex === starLayers.length - 1) {
        drawShootingStar(ctx, star, twinkleBrightness);
      } else {
        // Ensure star size is positive to prevent canvas arc errors
        const safeSize = Math.max(0.1, star.size);
        
        ctx.beginPath();
        if (safeArc(ctx, star.x, star.y, safeSize, 0, Math.PI * 2)) {
          ctx.fill();
          
          // Add subtle glow for brighter stars
          if (twinkleBrightness > 0.7) {
            ctx.globalAlpha = (twinkleBrightness - 0.7) * 0.3;
            ctx.beginPath();
            if (safeArc(ctx, star.x, star.y, safeSize * 2, 0, Math.PI * 2)) {
              ctx.fill();
            }
          }
          
          // Add occasional bright flare for the brightest stars
          if (twinkleBrightness > 0.9 && safeSize > 2) {
            ctx.globalAlpha = 0.1;
            ctx.beginPath();
            if (safeArc(ctx, star.x, star.y, safeSize * 4, 0, Math.PI * 2)) {
              ctx.fill();
            }
          }
        }
      }
    });
    
    ctx.globalAlpha = 1;
  });
}

function drawShootingStar(ctx: CanvasRenderingContext2D, star: any, brightness: number): void {
  const trailLength = 30;
  // Ensure star size is positive to prevent canvas errors
  const safeSize = Math.max(0.1, star.size);
  
  // Draw shooting star trail
  const gradient = ctx.createLinearGradient(
    star.x, star.y - trailLength,
    star.x, star.y
  );
  gradient.addColorStop(0, 'transparent');
  gradient.addColorStop(1, `oklch(0.95 0.15 180 / ${brightness})`);
  
  ctx.strokeStyle = gradient;
  ctx.lineWidth = safeSize;
  ctx.beginPath();
  ctx.moveTo(star.x, star.y - trailLength);
  ctx.lineTo(star.x, star.y);
  ctx.stroke();
  
  // Draw bright head
  ctx.fillStyle = 'oklch(0.98 0.2 180)';
  ctx.beginPath();
  if (safeArc(ctx, star.x, star.y, safeSize * 1.5, 0, Math.PI * 2)) {
    ctx.fill();
  }
}

function drawNebula(ctx: CanvasRenderingContext2D): void {
  // Create subtle nebula clouds in the background
  const time = Date.now() * 0.0001;
  
  for (let i = 0; i < 3; i++) {
    const x = (i * 300 + Math.sin(time + i) * 50) % (GAME_CONFIG.CANVAS_WIDTH + 200) - 100;
    const y = (i * 200 + Math.cos(time * 0.7 + i) * 30) % (GAME_CONFIG.CANVAS_HEIGHT + 100) - 50;
    
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 120);
    gradient.addColorStop(0, 'oklch(0.2 0.1 250 / 0.05)');
    gradient.addColorStop(0.5, 'oklch(0.15 0.08 230 / 0.02)');
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    // Ensure radius is positive and use safety wrapper
    if (safeArc(ctx, x, y, 120, 0, Math.PI * 2)) {
      ctx.fill();
    }
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: any): void {
  const { x, y } = player.position;
  const size = player.size;
  
  // Weapon charging effect with weapon-specific animations
  if (player.weaponSystem && player.weaponSystem.chargeLevel > 0) {
    const chargePercent = player.weaponSystem.chargeLevel / 100;
    const chargeData = getChargeLevel(player.weaponSystem.chargeLevel);
    const isCharging = chargeData.level > 0;
    const currentWeapon = player.weaponSystem.weaponSlots[player.weaponSystem.activeWeaponIndex];
    const time = Date.now();
    
    drawWeaponSpecificChargeEffect(ctx, x, y, size, chargePercent, isCharging, currentWeapon, time, chargeData);
    
    // Draw ship modifications for high charge levels
    if (chargeData.level >= 3) {
      drawChargedShipModifications(ctx, x, y, size, chargeData, currentWeapon, time);
    }
    
    ctx.globalAlpha = 1;
  }
  
  // Weapon overheating effect
  if (player.weaponSystem && player.weaponSystem.isOverheated) {
    ctx.strokeStyle = 'oklch(0.7 0.35 15)'; // Red heat
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.02) * 0.3;
    ctx.beginPath();
    if (safeArc(ctx, x, y, size * 1.3, 0, Math.PI * 2)) {
      ctx.stroke();
    }
    
    // Heat shimmer particles
    ctx.fillStyle = 'oklch(0.8 0.3 15)';
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = size * 0.5 + Math.random() * size * 0.5;
      const particleX = x + Math.cos(angle) * distance;
      const particleY = y + Math.sin(angle) * distance;
      ctx.beginPath();
      if (safeArc(ctx, particleX, particleY, 1 + Math.random() * 2, 0, Math.PI * 2)) {
        ctx.fill();
      }
    }
    
    ctx.globalAlpha = 1;
  }
  
  // Shield effect
  if (player.powerUps.shield > 0) {
    ctx.strokeStyle = 'oklch(0.8 0.2 130)';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.01) * 0.2;
    ctx.beginPath();
    // Ensure shield radius is positive and use safety wrapper
    if (safeArc(ctx, x, y, size * 1.5, 0, Math.PI * 2)) {
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  
  // Flashing effect when invulnerable
  if (player.invulnerable && Math.floor(Date.now() / 100) % 2) {
    ctx.globalAlpha = 0.5;
  }
  
  // Draw player ship with charge-based visual modifications
  const isCharging = player.weaponSystem && player.weaponSystem.chargeLevel > 0;
  const chargePercent = isCharging ? player.weaponSystem.chargeLevel / 100 : 0;
  const chargeData = isCharging ? getChargeLevel(player.weaponSystem.chargeLevel) : { level: 0 };
  const currentWeapon = player.weaponSystem?.weaponSlots[player.weaponSystem.activeWeaponIndex];
  
  // Base ship colors that change with charge level
  let shipFillColor = 'oklch(0.7 0.2 200)';
  let shipStrokeColor = 'oklch(0.9 0.15 200)';
  let shipGlowIntensity = 0;
  
  if (isCharging && chargeData.level > 0) {
    // Weapon-specific ship skin changes
    switch (currentWeapon?.type) {
      case 'plasmaBeam':
        // Purple/magenta glow for plasma weapons
        const plasmaHue = 300 + (chargeData.level * 10);
        shipFillColor = `oklch(${0.7 + chargeData.level * 0.05} ${0.2 + chargeData.level * 0.08} ${plasmaHue})`;
        shipStrokeColor = `oklch(${0.9 + chargeData.level * 0.02} ${0.15 + chargeData.level * 0.1} ${plasmaHue})`;
        shipGlowIntensity = 5 + chargeData.level * 3;
        break;
        
      case 'laserCannon':
        // Blue/cyan glow for laser weapons
        const laserHue = 200 - (chargeData.level * 8);
        shipFillColor = `oklch(${0.7 + chargeData.level * 0.04} ${0.2 + chargeData.level * 0.06} ${laserHue})`;
        shipStrokeColor = `oklch(${0.9 + chargeData.level * 0.03} ${0.15 + chargeData.level * 0.08} ${laserHue})`;
        shipGlowIntensity = 4 + chargeData.level * 2;
        break;
        
      case 'railgun':
        // Electric green/yellow glow for railgun
        const railgunHue = 130 - (chargeData.level * 5);
        shipFillColor = `oklch(${0.7 + chargeData.level * 0.06} ${0.2 + chargeData.level * 0.1} ${railgunHue})`;
        shipStrokeColor = `oklch(${0.9 + chargeData.level * 0.03} ${0.15 + chargeData.level * 0.12} ${railgunHue})`;
        shipGlowIntensity = 6 + chargeData.level * 4;
        break;
        
      default:
        // Default charging glow
        const defaultHue = 200 + (chargeData.level * 5);
        shipFillColor = `oklch(${0.7 + chargeData.level * 0.03} ${0.2 + chargeData.level * 0.05} ${defaultHue})`;
        shipStrokeColor = `oklch(${0.9 + chargeData.level * 0.02} ${0.15 + chargeData.level * 0.07} ${defaultHue})`;
        shipGlowIntensity = 3 + chargeData.level * 2;
        break;
    }
    
    // Add ship glow effect when charging
    if (shipGlowIntensity > 0) {
      ctx.shadowColor = shipStrokeColor;
      ctx.shadowBlur = shipGlowIntensity + Math.sin(Date.now() * 0.01) * 2;
      
      // Pulsing intensity for higher charge levels
      if (chargeData.level >= 3) {
        ctx.shadowBlur += Math.sin(Date.now() * 0.02) * 3;
      }
      if (chargeData.level >= 4) {
        ctx.shadowBlur += Math.sin(Date.now() * 0.03) * 5;
        // Maximum charge adds ship hull modifications
        ctx.globalAlpha = 0.95 + Math.sin(Date.now() * 0.02) * 0.05;
      }
    }
  }
  
  ctx.fillStyle = shipFillColor;
  ctx.strokeStyle = shipStrokeColor;
  ctx.lineWidth = 2 + (chargeData.level > 0 ? chargeData.level * 0.5 : 0);
  
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x - size * 0.7, y + size * 0.7);
  ctx.lineTo(x + size * 0.7, y + size * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // Add charged ship hull modifications for high charge levels
  if (isCharging && chargeData.level >= 2) {
    // Weapon charging ports/vents on ship hull
    const ventCount = chargeData.level;
    const ventIntensity = 0.3 + chargeData.level * 0.15;
    
    ctx.fillStyle = shipStrokeColor;
    ctx.globalAlpha = ventIntensity + Math.sin(Date.now() * 0.015) * 0.2;
    
    for (let i = 0; i < ventCount; i++) {
      const ventAngle = (i * Math.PI * 2) / ventCount;
      const ventRadius = size * 0.4;
      const ventX = x + Math.cos(ventAngle) * ventRadius;
      const ventY = y + Math.sin(ventAngle) * ventRadius;
      const ventSize = 1 + chargeData.level * 0.5;
      
      ctx.beginPath();
      if (safeArc(ctx, ventX, ventY, ventSize, 0, Math.PI * 2)) {
        ctx.fill();
      }
    }
    
    // Wing-mounted charge indicators
    if (chargeData.level >= 3) {
      ctx.fillStyle = currentWeapon?.type === 'plasmaBeam' ? 
        `oklch(0.9 0.4 ${300 + chargeData.level * 8})` :
        currentWeapon?.type === 'laserCannon' ?
        `oklch(0.9 0.3 ${180 - chargeData.level * 5})` :
        currentWeapon?.type === 'railgun' ?
        `oklch(0.9 0.3 ${125 - chargeData.level * 3})` :
        `oklch(0.9 0.25 ${200 + chargeData.level * 5})`;
      
      ctx.globalAlpha = 0.7 + Math.sin(Date.now() * 0.02) * 0.3;
      
      // Left wing charge indicator
      ctx.beginPath();
      if (safeArc(ctx, x - size * 0.5, y + size * 0.1, 2 + chargeData.level * 0.5, 0, Math.PI * 2)) {
        ctx.fill();
      }
      
      // Right wing charge indicator
      ctx.beginPath();
      if (safeArc(ctx, x + size * 0.5, y + size * 0.1, 2 + chargeData.level * 0.5, 0, Math.PI * 2)) {
        ctx.fill();
      }
    }
  }
  
  // Enhanced weapon tip glow for maximum charge
  if (isCharging && chargeData.level >= 4) {
    const weaponTipColor = currentWeapon?.type === 'plasmaBeam' ? 
      `oklch(0.98 0.4 320)` :
      currentWeapon?.type === 'laserCannon' ?
      `oklch(0.98 0.35 180)` :
      currentWeapon?.type === 'railgun' ?
      `oklch(0.98 0.4 120)` :
      `oklch(0.98 0.3 200)`;
    
    ctx.fillStyle = weaponTipColor;
    ctx.globalAlpha = 0.8 + Math.sin(Date.now() * 0.025) * 0.2;
    ctx.shadowColor = weaponTipColor;
    ctx.shadowBlur = 8 + Math.sin(Date.now() * 0.02) * 4;
    
    // Main weapon tip energy buildup
    ctx.beginPath();
    if (safeArc(ctx, x, y - size * 0.8, 3 + Math.sin(Date.now() * 0.03) * 2, 0, Math.PI * 2)) {
      ctx.fill();
    }
    
    // Additional weapon tip sparks for railgun
    if (currentWeapon?.type === 'railgun') {
      ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.04) * 0.4;
      for (let i = 0; i < 3; i++) {
        const sparkAngle = Math.random() * Math.PI * 2;
        const sparkDistance = 2 + Math.random() * 3;
        const sparkX = x + Math.cos(sparkAngle) * sparkDistance;
        const sparkY = y - size * 0.8 + Math.sin(sparkAngle) * sparkDistance;
        
        ctx.beginPath();
        if (safeArc(ctx, sparkX, sparkY, 1, 0, Math.PI * 2)) {
          ctx.fill();
        }
      }
    }
  }
  
  // Weapon charging progress indicator on ship front
  if (isCharging && chargeData.level >= 1) {
    // Draw a small charging progress bar on the ship's nose
    const progressWidth = size * 0.6;
    const progressHeight = 2;
    const progressX = x - progressWidth / 2;
    const progressY = y - size * 1.1;
    
    // Background bar
    ctx.fillStyle = 'oklch(0.3 0.1 240)';
    ctx.globalAlpha = 0.7;
    ctx.fillRect(progressX, progressY, progressWidth, progressHeight);
    
    // Progress fill based on charge level
    const progressFillWidth = progressWidth * (chargePercent);
    const progressColor = currentWeapon?.type === 'plasmaBeam' ? 
      `oklch(0.8 0.3 ${300 + chargeData.level * 5})` :
      currentWeapon?.type === 'laserCannon' ?
      `oklch(0.8 0.25 ${190 - chargeData.level * 3})` :
      currentWeapon?.type === 'railgun' ?
      `oklch(0.8 0.3 ${130 - chargeData.level * 2})` :
      `oklch(0.8 0.2 ${200 + chargeData.level * 3})`;
    
    ctx.fillStyle = progressColor;
    ctx.globalAlpha = 0.8 + Math.sin(Date.now() * 0.02) * 0.2;
    ctx.fillRect(progressX, progressY, progressFillWidth, progressHeight);
    
    // Glow effect for the progress bar at high charge levels
    if (chargeData.level >= 3) {
      ctx.shadowColor = progressColor;
      ctx.shadowBlur = 3 + chargeData.level;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(progressX, progressY, progressFillWidth, progressHeight);
    }
  }
  
  // Clear shadow and alpha effects
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  
  // Engine glow (enhanced when rapid fire is active or charging)
  const isRapidFire = player.powerUps.rapidFire > 0;
  const isChargingEngine = isCharging && chargeData.level > 0;
  
  let engineGlowIntensity = 0.85;
  let engineGlowColor = 'oklch(0.85 0.15 85)';
  let engineGlowSize = size * 0.3;
  
  if (isRapidFire) {
    engineGlowIntensity = 0.9;
    engineGlowColor = 'oklch(0.9 0.2 60)';
  }
  
  if (isChargingEngine) {
    // Engine glow changes based on weapon type when charging
    switch (currentWeapon?.type) {
      case 'plasmaBeam':
        engineGlowColor = `oklch(0.85 ${0.15 + chargeData.level * 0.05} ${300 + chargeData.level * 8})`;
        break;
      case 'laserCannon':
        engineGlowColor = `oklch(0.85 ${0.15 + chargeData.level * 0.04} ${200 - chargeData.level * 5})`;
        break;
      case 'railgun':
        engineGlowColor = `oklch(0.85 ${0.15 + chargeData.level * 0.06} ${130 - chargeData.level * 3})`;
        break;
      default:
        engineGlowColor = `oklch(0.85 ${0.15 + chargeData.level * 0.03} ${200 + chargeData.level * 3})`;
        break;
    }
    
    engineGlowSize *= (1 + chargeData.level * 0.2);
    engineGlowIntensity = Math.min(0.95, 0.85 + chargeData.level * 0.025);
    
    // Add pulsing effect for high charge levels
    if (chargeData.level >= 3) {
      engineGlowIntensity += Math.sin(Date.now() * 0.02) * 0.1;
      engineGlowSize += Math.sin(Date.now() * 0.015) * (size * 0.1);
    }
  }
  
  ctx.fillStyle = engineGlowColor;
  ctx.globalAlpha = engineGlowIntensity;
  
  // Add glow effect for charged engines
  if (isChargingEngine && chargeData.level >= 2) {
    ctx.shadowColor = engineGlowColor;
    ctx.shadowBlur = 4 + chargeData.level * 2;
  }
  
  ctx.beginPath();
  // Ensure engine glow radius is positive and use safety wrapper
  if (safeArc(ctx, x, y + size * 0.5, Math.max(1, engineGlowSize), 0, Math.PI * 2)) {
    ctx.fill();
  }
  
  // Additional engine particles for maximum charge
  if (isChargingEngine && chargeData.level >= 4) {
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.03) * 0.3;
    
    for (let i = 0; i < 3; i++) {
      const particleAngle = Math.random() * Math.PI * 2;
      const particleDistance = size * (0.4 + Math.random() * 0.3);
      const particleX = x + Math.cos(particleAngle) * particleDistance;
      const particleY = y + size * 0.5 + Math.sin(particleAngle) * particleDistance * 0.5;
      
      ctx.fillStyle = engineGlowColor;
      ctx.beginPath();
      if (safeArc(ctx, particleX, particleY, 1 + Math.random() * 2, 0, Math.PI * 2)) {
        ctx.fill();
      }
    }
  }
  
  ctx.shadowBlur = 0;
  
  ctx.globalAlpha = 1;
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: any): void {
  const { x, y } = enemy.position;
  const size = enemy.size;
  
  if (enemy.type === 'boss') {
    drawBoss(ctx, enemy);
  } else {
    // Draw basic enemy ship (inverted triangle)
    ctx.fillStyle = 'oklch(0.6 0.25 320)';
    ctx.strokeStyle = 'oklch(0.8 0.2 320)';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(x, y + size);
    ctx.lineTo(x - size * 0.7, y - size * 0.7);
    ctx.lineTo(x + size * 0.7, y - size * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

function drawBoss(ctx: CanvasRenderingContext2D, boss: any): void {
  const { x, y } = boss.position;
  let size = boss.size;
  
  // Safety check to prevent negative or invalid sizes
  if (size <= 0 || !isFinite(size) || isNaN(size)) {
    console.warn('Invalid boss size detected:', size, 'resetting to default');
    size = GAME_CONFIG.BOSS_SIZE; // Reset to default size if corrupted
  }
  
  // Ensure minimum size to prevent rendering errors
  size = Math.max(10, size);
  
  // Special effects during defeat animation
  if (boss.bossState === 'defeated' && boss.defeatAnimationStarted) {
    // Explosive flashing effect
    const flashIntensity = Math.random();
    if (flashIntensity > 0.7) {
      ctx.globalAlpha = 0.3 + Math.random() * 0.7;
    }
    
    // Multiple overlapping explosion effects with safety checks
    const explosionColors = ['oklch(0.9 0.3 60)', 'oklch(0.8 0.4 30)', 'oklch(0.9 0.2 0)'];
    explosionColors.forEach((color, index) => {
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.6 - index * 0.2;
      ctx.beginPath();
      const explosionRadius = Math.max(2, size * (0.5 + Math.random() * 0.8)); // Increased minimum radius
      const explosionX = x + (Math.random() - 0.5) * Math.min(size, 50); // Limit explosion offset
      const explosionY = y + (Math.random() - 0.5) * Math.min(size, 50); // Limit explosion offset
      
      // Additional safety validation
      if (explosionRadius > 0 && isFinite(explosionRadius) && isFinite(explosionX) && isFinite(explosionY)) {
        if (safeArc(ctx, explosionX, explosionY, explosionRadius, 0, Math.PI * 2)) {
          ctx.fill();
        }
      }
    });
    
    ctx.globalAlpha = 1;
  }
  
  // Intro glowing effect
  if (boss.bossState === 'intro') {
    const pulseIntensity = 1 + Math.sin(Date.now() * 0.02) * 0.5;
    ctx.shadowColor = getBossGlowColor(boss.bossType);
    ctx.shadowBlur = 25 * pulseIntensity;
  } else {
    // Menacing glow effect
    ctx.shadowColor = getBossGlowColor(boss.bossType);
    ctx.shadowBlur = 15;
  }
  
  // Draw shield if active
  if (boss.shieldStrength && boss.shieldStrength > 0) {
    ctx.strokeStyle = 'oklch(0.8 0.3 200)';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.6 + (boss.shieldStrength / 10) * 0.4;
    ctx.beginPath();
    if (safeArc(ctx, x, y, size + 8, 0, Math.PI * 2)) {
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  
  // Draw boss body - different shapes for different types
  const bossColors = getBossColors(boss.bossType, boss.bossState);
  ctx.fillStyle = bossColors.body;
  ctx.strokeStyle = bossColors.outline;
  ctx.lineWidth = 3;
  
  drawBossShape(ctx, boss, x, y, size);
  
  // Boss core (pulsing) - different effects for different states
  let pulse: number;
  let coreColor: string;
  
  if (boss.bossState === 'defeated') {
    pulse = 0.3 + Math.sin(Date.now() * 0.03) * 0.7;
    coreColor = 'oklch(0.9 0.4 30)';
  } else if (boss.bossState === 'intro') {
    pulse = 0.5 + Math.sin(Date.now() * 0.015) * 0.5;
    coreColor = 'oklch(0.9 0.3 200)';
  } else {
    pulse = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
    coreColor = bossColors.core;
  }
  
  ctx.fillStyle = coreColor;
  ctx.beginPath();
  // Ensure boss core radius is positive and use safety wrapper
  if (safeArc(ctx, x, y, size * 0.3 * pulse, 0, Math.PI * 2)) {
    ctx.fill();
  }
  
  // Boss weapons (side cannons) - hidden during defeat
  if (boss.bossState !== 'defeated') {
    ctx.fillStyle = 'oklch(0.3 0.2 0)';
    ctx.beginPath();
    ctx.rect(x - size * 0.9, y - size * 0.2, size * 0.4, size * 0.4);
    ctx.rect(x + size * 0.5, y - size * 0.2, size * 0.4, size * 0.4);
    ctx.fill();
  }
  
  ctx.shadowBlur = 0;
  
  // Health bar (only when active)
  if (boss.bossState === 'active') {
    drawBossHealthBar(ctx, boss);
  }
}

function drawBossHealthBar(ctx: CanvasRenderingContext2D, boss: any): void {
  const barWidth = 120;
  const barHeight = 8;
  const barX = boss.position.x - barWidth / 2;
  const barY = boss.position.y - boss.size - 20;
  
  // Health bar background
  ctx.fillStyle = 'oklch(0.2 0 0)';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  
  // Health bar border
  ctx.strokeStyle = 'oklch(0.7 0.1 0)';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);
  
  // Health bar fill
  const healthPercent = boss.health / boss.maxHealth;
  const fillWidth = barWidth * healthPercent;
  
  // Color changes based on health
  let healthColor;
  if (healthPercent > 0.6) {
    healthColor = 'oklch(0.6 0.25 0)';
  } else if (healthPercent > 0.3) {
    healthColor = 'oklch(0.7 0.25 60)';
  } else {
    healthColor = 'oklch(0.7 0.3 0)';
  }
  
  ctx.fillStyle = healthColor;
  ctx.fillRect(barX, barY, fillWidth, barHeight);
  
  // Boss name
  ctx.fillStyle = 'oklch(0.9 0.1 0)';
  ctx.font = '12px Orbitron, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('DESTROYER CLASS', boss.position.x, barY - 5);
}

function drawPowerUp(ctx: CanvasRenderingContext2D, powerUp: any): void {
  const { x, y } = powerUp.position;
  const size = powerUp.size;
  const time = Date.now() * 0.005;
  
  // Pulsing glow effect
  ctx.globalAlpha = 0.8 + Math.sin(time * 2) * 0.2;
  
  // Different colors and shapes for different power-ups
  switch (powerUp.type) {
    case 'rapidFire':
      // Orange/yellow rapid fire icon
      ctx.fillStyle = 'oklch(0.75 0.15 60)';
      ctx.strokeStyle = 'oklch(0.9 0.1 60)';
      ctx.lineWidth = 2;
      
      // Draw lightning bolt shape
      ctx.beginPath();
      ctx.moveTo(x - size * 0.3, y - size * 0.7);
      ctx.lineTo(x + size * 0.2, y - size * 0.2);
      ctx.lineTo(x - size * 0.1, y - size * 0.2);
      ctx.lineTo(x + size * 0.3, y + size * 0.7);
      ctx.lineTo(x - size * 0.2, y + size * 0.2);
      ctx.lineTo(x + size * 0.1, y + size * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
      
    case 'shield':
      // Blue shield icon
      ctx.fillStyle = 'oklch(0.7 0.2 230)';
      ctx.strokeStyle = 'oklch(0.9 0.15 230)';
      ctx.lineWidth = 2;
      
      // Draw shield shape
      ctx.beginPath();
      ctx.moveTo(x, y - size * 0.8);
      ctx.quadraticCurveTo(x + size * 0.6, y - size * 0.3, x + size * 0.4, y + size * 0.2);
      ctx.quadraticCurveTo(x, y + size * 0.8, x - size * 0.4, y + size * 0.2);
      ctx.quadraticCurveTo(x - size * 0.6, y - size * 0.3, x, y - size * 0.8);
      ctx.fill();
      ctx.stroke();
      break;
      
    case 'multiShot':
      // Green multi-shot icon
      ctx.fillStyle = 'oklch(0.7 0.2 130)';
      ctx.strokeStyle = 'oklch(0.9 0.15 130)';
      ctx.lineWidth = 2;
      
      // Draw three arrows pointing up
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * size * 0.4, y - size * 0.5);
        ctx.lineTo(x + i * size * 0.4 - size * 0.2, y);
        ctx.lineTo(x + i * size * 0.4 - size * 0.1, y);
        ctx.lineTo(x + i * size * 0.4, y - size * 0.3);
        ctx.lineTo(x + i * size * 0.4 + size * 0.1, y);
        ctx.lineTo(x + i * size * 0.4 + size * 0.2, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      break;
      
    case 'weaponUpgrade':
      // Weapon upgrade - color depends on weapon type
      let weaponColor = 'oklch(0.8 0.2 200)'; // Default cyan
      let weaponSymbol = 'W'; // Default symbol
      
      switch (powerUp.weaponType) {
        case 'laserCannon':
          weaponColor = 'oklch(0.9 0.2 180)';
          weaponSymbol = 'L';
          break;
        case 'plasmaBeam':
          weaponColor = 'oklch(0.7 0.3 300)';
          weaponSymbol = 'P';
          break;
        case 'homingMissiles':
          weaponColor = 'oklch(0.8 0.2 50)';
          weaponSymbol = 'M';
          break;
      }
      
      ctx.fillStyle = weaponColor;
      ctx.strokeStyle = 'oklch(0.95 0.1 0)';
      ctx.lineWidth = 2;
      
      // Draw hexagonal weapon upgrade
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const pointX = x + Math.cos(angle) * size * 0.8;
        const pointY = y + Math.sin(angle) * size * 0.8;
        if (i === 0) ctx.moveTo(pointX, pointY);
        else ctx.lineTo(pointX, pointY);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Draw weapon symbol
      ctx.fillStyle = 'oklch(0.1 0 0)';
      ctx.font = `bold ${size}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(weaponSymbol, x, y);
      break;
  }
  
  // Outer glow ring
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const glowRadius = Math.max(1, size * 1.2 + Math.sin(time * 3) * 2);
  // Additional safety check for glow radius
  if (glowRadius > 0 && isFinite(glowRadius)) {
    if (safeArc(ctx, x, y, glowRadius, 0, Math.PI * 2)) {
      ctx.stroke();
    }
  }
  
  ctx.globalAlpha = 1;
}

function drawProjectile(ctx: CanvasRenderingContext2D, projectile: any): void {
  try {
    const { x, y } = projectile.position;
    const size = projectile.size;
    
    // Safety checks to prevent rendering errors
    if (!isFinite(x) || !isFinite(y) || isNaN(x) || isNaN(y)) {
      console.warn('Attempted to render projectile at invalid position:', x, y);
      return;
    }
    
    if (!isFinite(size) || isNaN(size) || size <= 0) {
      console.warn('Attempted to render projectile with invalid size:', size);
      return;
    }
    
    if (projectile.isPlayerProjectile) {
      // Draw weapon-specific projectiles
      switch (projectile.weaponType) {
      case 'laserCannon':
        drawLaserProjectile(ctx, projectile);
        break;
      case 'plasmaBeam':
        drawPlasmaProjectile(ctx, projectile);
        break;
      case 'railgun':
        drawRailgunProjectile(ctx, projectile);
        break;
      case 'homingMissiles':
        drawHomingMissile(ctx, projectile);
        break;
      case 'chaingun':
        drawChaingunProjectile(ctx, projectile);
        break;
      case 'ionCannon':
        drawIonProjectile(ctx, projectile);
        break;
      case 'quantumRifle':
        drawQuantumProjectile(ctx, projectile);
        break;
      case 'fusionTorpedo':
        drawFusionProjectile(ctx, projectile);
        break;
      case 'shotgun':
        drawShotgunProjectile(ctx, projectile);
        break;
      default:
        // Check if this is a charged shot - make it more visually distinct
        const chargeLevel = Math.max(0, projectile.chargeLevel || 0); // Ensure non-negative
        const chargeData = getChargeLevel(chargeLevel);
        const isCharged = chargeData.level > 0;
        const chargePercent = Math.max(0, Math.min(1, chargeLevel / 100)); // Clamp between 0 and 1
        
        if (isCharged) {
          // Define charge level flags
          const isFullyCharged = chargeData.level >= 4; // Max charge level (was 5, now 4)
          
          // Draw charged shot trail with enhanced effects based on charge level
          if (projectile.trailParticles && Array.isArray(projectile.trailParticles)) {
            projectile.trailParticles.forEach((particle: any, index: number) => {
              // Safety checks for particle properties
              if (!particle || !isFinite(particle.x) || !isFinite(particle.y) || isNaN(particle.x) || isNaN(particle.y)) {
                return; // Skip invalid particles
              }
              
              const age = Math.max(0, particle.age || 0);
              const alpha = Math.max(0, Math.min(1, (1 - age / 500) * 0.9));
              const trailSize = Math.max(0.1, size * (0.5 + alpha * 0.8) * (1 + chargePercent * 0.8));
              
              // Skip rendering if alpha is too low or trail size is invalid
              if (alpha < 0.05 || !isFinite(trailSize) || trailSize <= 0) {
                return;
              }
              
              // Multi-layered charged trail with color intensity based on charge level
              const baseHue = 130; // Base green
              const chargeHueShift = chargeData.level * 15; // Shift hue based on charge level
              const chargeHue = baseHue + chargeHueShift;
              const chargeIntensity = 0.3 + (chargeData.level * 0.15);
              
              // Outer energy field
              ctx.fillStyle = `oklch(0.8 ${chargeIntensity} ${chargeHue} / ${alpha * 0.6})`;
              ctx.shadowColor = `oklch(0.8 ${chargeIntensity} ${chargeHue} / ${alpha * 0.3})`;
              ctx.shadowBlur = 15 + chargeData.level * 5;
              ctx.beginPath();
              if (safeArc(ctx, particle.x, particle.y, trailSize * 1.5, 0, Math.PI * 2)) {
                ctx.fill();
              }
              
              // Main charged trail core
              ctx.fillStyle = `oklch(0.9 ${chargeIntensity + 0.1} ${chargeHue} / ${alpha})`;
              ctx.shadowBlur = 8;
              ctx.beginPath();
              if (safeArc(ctx, particle.x, particle.y, trailSize, 0, Math.PI * 2)) {
                ctx.fill();
              }
              
              // Energy sparks and crackling effects
              if (index % 2 === 0 && alpha > 0.4) {
                const sparkCount = isFullyCharged ? 4 : 2;
                for (let i = 0; i < sparkCount; i++) {
                  const sparkAngle = Math.random() * Math.PI * 2;
                  const sparkDistance = Math.max(0, trailSize * (0.8 + Math.random() * 0.4));
                  const sparkX = particle.x + Math.cos(sparkAngle) * sparkDistance;
                  const sparkY = particle.y + Math.sin(sparkAngle) * sparkDistance;
                  const sparkRadius = Math.max(0.1, trailSize * (0.2 + chargePercent * 0.3));
                  
                  // Safety check for spark position and size
                  if (!isFinite(sparkX) || !isFinite(sparkY) || !isFinite(sparkRadius)) {
                    continue;
                  }
                  
                  ctx.fillStyle = `oklch(0.95 0.3 ${chargeHue + 20} / ${alpha * 0.8})`;
                  ctx.shadowBlur = 4;
                  ctx.beginPath();
                  if (safeArc(ctx, sparkX, sparkY, sparkRadius, 0, Math.PI * 2)) {
                    ctx.fill();
                  }
                }
              }
              
              // Electric arc effects for fully charged shots
              if (isFullyCharged && index % 3 === 0 && alpha > 0.6) {
                ctx.strokeStyle = `oklch(0.98 0.4 ${chargeHue + 30} / ${alpha * 0.7})`;
                ctx.lineWidth = Math.max(1, 1 + chargePercent);
                ctx.shadowBlur = 12;
                
                for (let i = 0; i < 2; i++) {
                  const arcAngle = Math.random() * Math.PI * 2;
                  const arcRadius = Math.max(0, trailSize * (1.2 + chargePercent * 0.5));
                  const arcX = particle.x + Math.cos(arcAngle) * arcRadius;
                  const arcY = particle.y + Math.sin(arcAngle) * arcRadius;
                  
                  // Safety check for arc coordinates
                  if (!isFinite(arcX) || !isFinite(arcY) || !isFinite(arcRadius)) {
                    continue;
                  }
                  
                  ctx.beginPath();
                  ctx.moveTo(particle.x, particle.y);
                  ctx.quadraticCurveTo(
                    particle.x + Math.cos(arcAngle + Math.PI / 2) * arcRadius * 0.3,
                    particle.y + Math.sin(arcAngle + Math.PI / 2) * arcRadius * 0.3,
                    arcX,
                    arcY
                  );
                  ctx.stroke();
                }
              }
            });
          }
          
          // Main charged projectile with dramatic scaling and effects based on charge level
          const baseHue = 130;
          const chargeHueShift = Math.max(0, chargeData.level * 15); // Ensure positive
          const chargeHue = baseHue + chargeHueShift;
          const chargeIntensity = Math.max(0.1, Math.min(0.8, 0.3 + (chargeData.level * 0.15))); // Clamp intensity
          const projectileScale = Math.max(1, 1 + (chargeData.level * 0.4)); // Ensure >= 1
          // isFullyCharged already declared above
          
          // Outermost energy corona (level 3+ only)
          if (chargeData.level >= 3) {
            ctx.fillStyle = `oklch(0.7 ${chargeIntensity * 0.8} ${chargeHue})`;
            ctx.shadowColor = `oklch(0.9 ${chargeIntensity} ${chargeHue})`;
            ctx.shadowBlur = 25 + chargeData.level * 8;
            ctx.globalAlpha = 0.4 + chargeData.level * 0.1;
            ctx.beginPath();
            if (safeArc(ctx, x, y, size * projectileScale * 2, 0, Math.PI * 2)) {
              ctx.fill();
            }
          }
          
          // Outer energy aura - pulsing effect
          const pulseIntensity = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
          ctx.fillStyle = `oklch(0.85 ${chargeIntensity} ${chargeHue})`;
          ctx.shadowBlur = 20 + chargePercent * 15;
          ctx.globalAlpha = 0.7 * pulseIntensity;
          ctx.beginPath();
          if (safeArc(ctx, x, y, size * projectileScale * 1.6, 0, Math.PI * 2)) {
            ctx.fill();
          }
          
          // Main charged projectile core
          ctx.globalAlpha = 1;
          ctx.fillStyle = `oklch(0.92 ${chargeIntensity + 0.1} ${chargeHue})`;
          ctx.shadowBlur = 15 + chargeData.level * 3;
          ctx.beginPath();
          if (safeArc(ctx, x, y, size * projectileScale * 1.2, 0, Math.PI * 2)) {
            ctx.fill();
          }
          
          // Inner brilliant core with charge level scaling
          ctx.fillStyle = `oklch(0.98 ${Math.min(0.5, chargeIntensity + 0.2)} ${chargeHue})`;
          ctx.shadowBlur = 10 + chargeData.level * 2;
          ctx.beginPath();
          if (safeArc(ctx, x, y, size * projectileScale * 0.8, 0, Math.PI * 2)) {
            ctx.fill();
          }
          
          // Central white-hot core
          ctx.fillStyle = `oklch(1 ${Math.min(0.3, chargeIntensity * 0.6)} ${chargeHue})`;
          ctx.beginPath();
          if (safeArc(ctx, x, y, size * projectileScale * 0.4, 0, Math.PI * 2)) {
            ctx.fill();
          }
          
          // Rotating energy sparks around charged shot
          const sparkCount = Math.max(0, Math.floor(2 + chargePercent * 6)); // More sparks for higher charge
          for (let i = 0; i < sparkCount; i++) {
            const sparkAngle = (Date.now() * 0.015 + i * (Math.PI * 2) / sparkCount) % (Math.PI * 2);
            const sparkDistance = Math.max(0, size * projectileScale * (1.3 + Math.sin(Date.now() * 0.008 + i) * 0.4));
            const sparkX = x + Math.cos(sparkAngle) * sparkDistance;
            const sparkY = y + Math.sin(sparkAngle) * sparkDistance;
            
            const sparkSize = Math.max(0.1, (1 + chargePercent * 2) * (0.8 + Math.random() * 0.4));
            
            // Safety check for spark position and size
            if (!isFinite(sparkX) || !isFinite(sparkY) || !isFinite(sparkSize)) {
              continue;
            }
            
            ctx.fillStyle = `oklch(0.95 0.4 ${chargeHue + 20})`;
            ctx.globalAlpha = Math.max(0.1, Math.min(1, 0.6 + Math.sin(Date.now() * 0.02 + i) * 0.4));
            ctx.shadowBlur = 6;
            ctx.beginPath();
            if (safeArc(ctx, sparkX, sparkY, sparkSize, 0, Math.PI * 2)) {
              ctx.fill();
            }
          }
          
          // Electric discharge effects for fully charged shots
          if (isFullyCharged) {
            ctx.strokeStyle = `oklch(0.98 0.5 ${chargeHue + 40})`;
            ctx.lineWidth = Math.max(1, 1.5 + chargePercent);
            ctx.globalAlpha = 0.8;
            ctx.shadowBlur = 15;
            
            const arcCount = Math.max(0, 3 + Math.floor(chargePercent * 3));
            for (let i = 0; i < arcCount; i++) {
              const arcAngle = (Date.now() * 0.008 + i * Math.PI * 2 / arcCount) % (Math.PI * 2);
              const arcRadius = Math.max(0, size * projectileScale * (1.5 + Math.sin(Date.now() * 0.006 + i) * 0.5));
              const arcStartX = x + Math.cos(arcAngle) * arcRadius;
              const arcStartY = y + Math.sin(arcAngle) * arcRadius;
              const arcEndX = x + Math.cos(arcAngle + Math.PI) * arcRadius * 0.6;
              const arcEndY = y + Math.sin(arcAngle + Math.PI) * arcRadius * 0.6;
              
              // Safety check for arc coordinates
              if (!isFinite(arcStartX) || !isFinite(arcStartY) || !isFinite(arcEndX) || !isFinite(arcEndY)) {
                continue;
              }
              
              ctx.beginPath();
              ctx.moveTo(arcStartX, arcStartY);
              ctx.quadraticCurveTo(
                x + Math.cos(arcAngle + Math.PI / 2) * arcRadius * 0.4,
                y + Math.sin(arcAngle + Math.PI / 2) * arcRadius * 0.4,
                arcEndX,
                arcEndY
              );
              ctx.stroke();
            }
          }
          
          ctx.globalAlpha = 1;
        } else {
          // Draw basic projectile trail if it has trail particles
          if (projectile.trailParticles && Array.isArray(projectile.trailParticles)) {
            projectile.trailParticles.forEach((particle: any, index: number) => {
              // Safety checks for particle properties
              if (!particle || !isFinite(particle.x) || !isFinite(particle.y) || isNaN(particle.x) || isNaN(particle.y)) {
                return; // Skip invalid particles
              }
              
              const age = Math.max(0, particle.age || 0);
              const alpha = Math.max(0, Math.min(1, (1 - age / 500) * 0.6));
              const trailSize = Math.max(0.1, size * (0.3 + alpha * 0.4));
              
              // Skip rendering if alpha is too low or trail size is invalid
              if (alpha < 0.05 || !isFinite(trailSize) || trailSize <= 0) {
                return;
              }
              
              // Basic yellow trail
              ctx.fillStyle = `oklch(0.85 0.15 85 / ${alpha})`;
              ctx.shadowColor = `oklch(0.85 0.15 85 / ${alpha * 0.3})`;
              ctx.shadowBlur = 4;
              ctx.beginPath();
              if (safeArc(ctx, particle.x, particle.y, trailSize, 0, Math.PI * 2)) {
                ctx.fill();
              }
            });
          }
          
          // Regular basic projectile (yellow)
          ctx.fillStyle = 'oklch(0.85 0.15 85)';
          ctx.shadowColor = 'oklch(0.85 0.15 85)';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          if (safeArc(ctx, x, y, size, 0, Math.PI * 2)) {
            ctx.fill();
          }
        }
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        break;
    }
  } else {
    // Enemy projectile (red)
    ctx.fillStyle = 'oklch(0.6 0.25 0)';
    ctx.shadowColor = 'oklch(0.6 0.25 0)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    // Ensure enemy projectile radius is positive and use safety wrapper
    if (safeArc(ctx, x, y, size, 0, Math.PI * 2)) {
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
  } catch (error) {
    console.error('Error rendering projectile:', error);
    console.warn('Projectile data:', { position: { x, y }, size, chargeLevel: projectile.chargeLevel || 0 });
    // Skip rendering this projectile to prevent further errors
  }
}

function drawLaserProjectile(ctx: CanvasRenderingContext2D, projectile: any): void {
  const { x, y } = projectile.position;
  const size = projectile.size;
  const chargeLevel = projectile.chargeLevel || 0;
  const chargePercent = chargeLevel / 100;
  const isCharged = chargeLevel > 25;
  const isFullyCharged = chargePercent >= 0.75;
  
  // Draw laser trail particles with charge effects
  if (projectile.trailParticles) {
    projectile.trailParticles.forEach((particle: any, index: number) => {
      const alpha = (1 - particle.age / 400) * (isCharged ? 0.9 : 0.8);
      const trailSize = Math.max(0.1, size * (0.3 + alpha * 0.4) * (1 + chargePercent * 0.5));
      
      if (isCharged) {
        // Charged laser trail with enhanced effects
        const laserHue = 180 + chargePercent * 30; // Cyan to blue based on charge
        const laserIntensity = 0.25 + chargePercent * 0.3;
        
        // Outer laser field
        ctx.fillStyle = `oklch(0.85 ${laserIntensity} ${laserHue} / ${alpha * 0.7})`;
        ctx.shadowColor = `oklch(0.95 ${laserIntensity} ${laserHue} / ${alpha * 0.4})`;
        ctx.shadowBlur = 10 + chargePercent * 8;
        ctx.beginPath();
        if (safeArc(ctx, particle.x, particle.y, trailSize * 1.3, 0, Math.PI * 2)) {
          ctx.fill();
        }
        
        // Main charged laser trail
        ctx.fillStyle = `oklch(0.95 ${laserIntensity + 0.1} ${laserHue} / ${alpha})`;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        if (safeArc(ctx, particle.x, particle.y, trailSize, 0, Math.PI * 2)) {
          ctx.fill();
        }
        
        // Precision sparks for charged laser
        if (index % 2 === 0 && alpha > 0.5) {
          ctx.fillStyle = `oklch(1 ${Math.min(0.4, laserIntensity + 0.15)} ${laserHue + 10} / ${alpha * 0.8})`;
          ctx.shadowBlur = 4;
          ctx.beginPath();
          if (safeArc(ctx, particle.x, particle.y, trailSize * 0.6, 0, Math.PI * 2)) {
            ctx.fill();
          }
        }
        
        // Electric discharge for fully charged laser
        if (isFullyCharged && index % 3 === 0 && alpha > 0.6) {
          ctx.strokeStyle = `oklch(0.98 0.4 ${laserHue + 20} / ${alpha * 0.7})`;
          ctx.lineWidth = 0.8 + chargePercent;
          ctx.shadowBlur = 8;
          
          const sparkAngle = Math.random() * Math.PI * 2;
          const sparkLength = trailSize * (1 + chargePercent * 0.5);
          const sparkX = particle.x + Math.cos(sparkAngle) * sparkLength;
          const sparkY = particle.y + Math.sin(sparkAngle) * sparkLength;
          
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(sparkX, sparkY);
          ctx.stroke();
        }
      } else {
        // Standard laser trail
        ctx.fillStyle = `oklch(0.95 0.25 190 / ${alpha})`;
        ctx.shadowColor = `oklch(0.95 0.25 190 / ${alpha * 0.5})`;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        if (safeArc(ctx, particle.x, particle.y, trailSize, 0, Math.PI * 2)) {
          ctx.fill();
        }
        
        // Add precision sparks for some particles
        if (index % 2 === 0 && alpha > 0.5) {
          ctx.fillStyle = `oklch(1 0.15 200 / ${alpha * 0.7})`;
          ctx.shadowBlur = 3;
          ctx.beginPath();
          if (safeArc(ctx, particle.x, particle.y, trailSize * 0.5, 0, Math.PI * 2)) {
            ctx.fill();
          }
        }
      }
    });
  }
  
  if (isCharged) {
    // Charged laser beam with enhanced visuals
    const laserHue = 180 + chargePercent * 30;
    const laserIntensity = 0.25 + chargePercent * 0.3;
    const beamScale = 1 + chargePercent * 0.8;
    
    // Outer charged laser field
    if (chargePercent > 0.4) {
      ctx.fillStyle = `oklch(0.7 ${laserIntensity * 0.8} ${laserHue})`;
      ctx.shadowColor = `oklch(0.9 ${laserIntensity} ${laserHue})`;
      ctx.shadowBlur = 20 + chargePercent * 15;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.ellipse(x, y, Math.max(0.1, size * beamScale * 1.2), Math.max(0.1, size * beamScale * 3.5), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Main charged laser beam
    ctx.globalAlpha = 1;
    ctx.fillStyle = `oklch(0.9 ${laserIntensity + 0.1} ${laserHue})`;
    ctx.shadowColor = `oklch(0.95 ${laserIntensity + 0.1} ${laserHue})`;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.1, size * beamScale * 0.8), Math.max(0.1, size * beamScale * 2.8), 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner precision core
    ctx.fillStyle = `oklch(0.98 ${Math.min(0.3, laserIntensity + 0.2)} ${laserHue})`;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.1, size * beamScale * 0.4), Math.max(0.1, size * beamScale * 2.2), 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Central brilliant core
    ctx.fillStyle = `oklch(1 ${Math.min(0.2, laserIntensity * 0.7)} ${laserHue})`;
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.1, size * beamScale * 0.2), Math.max(0.1, size * beamScale * 1.8), 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Precision targeting effects for fully charged
    if (isFullyCharged) {
      ctx.strokeStyle = `oklch(0.98 0.4 ${laserHue + 30})`;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.8;
      ctx.shadowBlur = 10;
      
      // Draw targeting lines
      for (let i = 0; i < 4; i++) {
        const lineAngle = i * Math.PI / 2;
        const lineLength = size * beamScale * 2;
        const lineStartX = x + Math.cos(lineAngle) * lineLength;
        const lineStartY = y + Math.sin(lineAngle) * lineLength;
        const lineEndX = x + Math.cos(lineAngle + Math.PI) * lineLength;
        const lineEndY = y + Math.sin(lineAngle + Math.PI) * lineLength;
        
        ctx.beginPath();
        ctx.moveTo(lineStartX, lineStartY);
        ctx.lineTo(lineEndX, lineEndY);
        ctx.stroke();
      }
    }
    
    ctx.globalAlpha = 1;
  } else {
    // Standard laser beam - bright cyan
    ctx.fillStyle = 'oklch(0.9 0.2 180)';
    ctx.shadowColor = 'oklch(0.9 0.2 180)';
    ctx.shadowBlur = 12;
    
    // Draw elongated laser beam - ensure positive radii
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.1, size * 0.6), Math.max(0.1, size * 2), 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner core
    ctx.fillStyle = 'oklch(0.95 0.1 180)';
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.1, size * 0.3), Math.max(0.1, size * 1.5), 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.shadowBlur = 0;
}

function drawPlasmaProjectile(ctx: CanvasRenderingContext2D, projectile: any): void {
  const { x, y } = projectile.position;
  const size = projectile.size;
  const chargeLevel = projectile.chargeLevel || 0;
  const chargePercent = chargeLevel / 100;
  const isCharged = chargeLevel > 25;
  const isFullyCharged = chargePercent >= 0.75;
  
  // Draw plasma trail particles with enhanced charge effects
  if (projectile.trailParticles) {
    projectile.trailParticles.forEach((particle: any, index: number) => {
      const alpha = (1 - particle.age / 600) * (isCharged ? 0.85 : 0.7);
      const trailSize = Math.max(0.1, size * (0.2 + alpha * 0.6) * (1 + chargePercent * 0.8));
      
      if (isCharged) {
        // Charged plasma trail with enhanced effects
        const plasmaHue = 300 + chargePercent * 40; // Purple to pink based on charge
        const plasmaIntensity = 0.35 + chargePercent * 0.25;
        
        // Outer plasma field with charge scaling
        ctx.fillStyle = `oklch(0.7 ${plasmaIntensity} ${plasmaHue} / ${alpha * 0.8})`;
        ctx.shadowColor = `oklch(0.8 ${plasmaIntensity} ${plasmaHue} / ${alpha * 0.5})`;
        ctx.shadowBlur = 12 + chargePercent * 10;
        ctx.beginPath();
        if (safeArc(ctx, particle.x, particle.y, trailSize * 1.6, 0, Math.PI * 2)) {
          ctx.fill();
        }
        
        // Main charged plasma trail
        ctx.fillStyle = `oklch(0.8 ${plasmaIntensity + 0.1} ${plasmaHue} / ${alpha})`;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        if (safeArc(ctx, particle.x, particle.y, trailSize, 0, Math.PI * 2)) {
          ctx.fill();
        }
        
        // Enhanced energy burst effects for charged plasma
        if (index % 2 === 0 && alpha > 0.4) {
          ctx.fillStyle = `oklch(0.9 ${Math.min(0.4, plasmaIntensity + 0.15)} ${plasmaHue + 20} / ${alpha * 0.7})`;
          ctx.shadowBlur = 15;
          ctx.beginPath();
          if (safeArc(ctx, particle.x, particle.y, trailSize * (1.8 + chargePercent * 0.5), 0, Math.PI * 2)) {
            ctx.fill();
          }
        }
        
        // Plasma energy sparks with charge scaling
        if (index % 3 === 0) {
          const sparkCount = 1 + Math.floor(chargePercent * 3);
          for (let i = 0; i < sparkCount; i++) {
            const sparkX = particle.x + (Math.random() - 0.5) * (4 + chargePercent * 3);
            const sparkY = particle.y + (Math.random() - 0.5) * (4 + chargePercent * 3);
            ctx.fillStyle = `oklch(0.95 ${Math.min(0.5, plasmaIntensity + 0.2)} ${plasmaHue + 40} / ${alpha * 0.6})`;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            if (safeArc(ctx, sparkX, sparkY, trailSize * (0.4 + chargePercent * 0.3), 0, Math.PI * 2)) {
              ctx.fill();
            }
          }
        }
        
        // Plasma storm effects for fully charged
        if (isFullyCharged && index % 4 === 0 && alpha > 0.6) {
          ctx.fillStyle = `oklch(0.95 0.6 ${plasmaHue + 60} / ${alpha * 0.5})`;
          ctx.shadowBlur = 20;
          
          // Create plasma storm patterns
          for (let storm = 0; storm < 4; storm++) {
            const stormAngle = (Math.PI * 2 * storm / 4) + Math.sin(Date.now() * 0.01 + storm) * 0.8;
            const stormRadius = trailSize * (1.5 + Math.random() * 1);
            const stormX = particle.x + Math.cos(stormAngle) * stormRadius;
            const stormY = particle.y + Math.sin(stormAngle) * stormRadius;
            
            ctx.beginPath();
            if (safeArc(ctx, stormX, stormY, trailSize * 0.3, 0, Math.PI * 2)) {
              ctx.fill();
            }
          }
        }
      } else {
        // Standard plasma trail
        ctx.fillStyle = `oklch(0.75 0.35 300 / ${alpha})`;
        ctx.shadowColor = `oklch(0.75 0.35 300 / ${alpha * 0.4})`;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        if (safeArc(ctx, particle.x, particle.y, trailSize, 0, Math.PI * 2)) {
          ctx.fill();
        }
        
        // Add energy burst effects for some particles
        if (index % 3 === 0 && alpha > 0.4) {
          ctx.fillStyle = `oklch(0.85 0.25 320 / ${alpha * 0.6})`;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          if (safeArc(ctx, particle.x, particle.y, trailSize * 1.5, 0, Math.PI * 2)) {
            ctx.fill();
          }
        }
        
        // Plasma energy sparks
        if (index % 4 === 0) {
          ctx.fillStyle = `oklch(0.95 0.2 340 / ${alpha * 0.5})`;
          ctx.shadowBlur = 4;
          ctx.beginPath();
          if (safeArc(ctx, particle.x + (Math.random() - 0.5) * 3, particle.y + (Math.random() - 0.5) * 3, trailSize * 0.3, 0, Math.PI * 2)) {
            ctx.fill();
          }
        }
      }
    });
  }
  
  if (isCharged) {
    // Charged plasma projectile with dramatic effects
    const plasmaHue = 300 + chargePercent * 40;
    const plasmaIntensity = 0.35 + chargePercent * 0.25;
    const plasmaScale = 1 + chargePercent * 1.2;
    
    // Outermost plasma storm field (for highly charged shots)
    if (chargePercent > 0.5) {
      ctx.fillStyle = `oklch(0.6 ${plasmaIntensity * 0.7} ${plasmaHue})`;
      ctx.shadowColor = `oklch(0.8 ${plasmaIntensity} ${plasmaHue})`;
      ctx.shadowBlur = 30 + chargePercent * 20;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      if (safeArc(ctx, x, y, size * plasmaScale * 2.2, 0, Math.PI * 2)) {
        ctx.fill();
      }
    }
    
    // Outer plasma energy field - pulsing effect
    const pulseIntensity = 0.9 + Math.sin(Date.now() * 0.008) * 0.1;
    ctx.fillStyle = `oklch(0.75 ${plasmaIntensity} ${plasmaHue})`;
    ctx.shadowColor = `oklch(0.85 ${plasmaIntensity} ${plasmaHue})`;
    ctx.shadowBlur = 20 + chargePercent * 15;
    ctx.globalAlpha = 0.8 * pulseIntensity;
    ctx.beginPath();
    if (safeArc(ctx, x, y, size * plasmaScale * 1.6, 0, Math.PI * 2)) {
      ctx.fill();
    }
    
    // Main charged plasma core
    ctx.globalAlpha = 1;
    ctx.fillStyle = `oklch(0.85 ${plasmaIntensity + 0.1} ${plasmaHue + 20})`;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    if (safeArc(ctx, x, y, size * plasmaScale, 0, Math.PI * 2)) {
      ctx.fill();
    }
    
    // Inner energy core
    ctx.fillStyle = `oklch(0.92 ${Math.min(0.5, plasmaIntensity + 0.2)} ${plasmaHue + 40})`;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    if (safeArc(ctx, x, y, size * plasmaScale * 0.7, 0, Math.PI * 2)) {
      ctx.fill();
    }
    
    // Bright center with white-hot core
    ctx.fillStyle = `oklch(0.98 ${Math.min(0.3, plasmaIntensity * 0.8)} ${plasmaHue + 60})`;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    if (safeArc(ctx, x, y, size * plasmaScale * 0.4, 0, Math.PI * 2)) {
      ctx.fill();
    }
    
    // Rotating plasma vortex effects
    const vortexCount = Math.floor(3 + chargePercent * 4);
    for (let i = 0; i < vortexCount; i++) {
      const vortexAngle = (Date.now() * 0.01 + i * (Math.PI * 2) / vortexCount) % (Math.PI * 2);
      const vortexDistance = size * plasmaScale * (1.2 + Math.sin(Date.now() * 0.006 + i) * 0.3);
      const vortexX = x + Math.cos(vortexAngle) * vortexDistance;
      const vortexY = y + Math.sin(vortexAngle) * vortexDistance;
      
      const vortexSize = size * plasmaScale * (0.2 + chargePercent * 0.3);
      ctx.fillStyle = `oklch(0.9 0.4 ${plasmaHue + 30})`;
      ctx.globalAlpha = 0.7 + Math.sin(Date.now() * 0.012 + i) * 0.3;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      if (safeArc(ctx, vortexX, vortexY, vortexSize, 0, Math.PI * 2)) {
        ctx.fill();
      }
    }
    
    // Plasma lightning effects for fully charged
    if (isFullyCharged) {
      ctx.strokeStyle = `oklch(0.98 0.6 ${plasmaHue + 80})`;
      ctx.lineWidth = 1.5 + chargePercent;
      ctx.globalAlpha = 0.8;
      ctx.shadowBlur = 15;
      
      const lightningCount = 4 + Math.floor(chargePercent * 4);
      for (let i = 0; i < lightningCount; i++) {
        const lightningAngle = (Date.now() * 0.006 + i * Math.PI * 2 / lightningCount) % (Math.PI * 2);
        const lightningRadius = size * plasmaScale * (1.4 + Math.sin(Date.now() * 0.004 + i) * 0.6);
        const lightningStartX = x + Math.cos(lightningAngle) * lightningRadius;
        const lightningStartY = y + Math.sin(lightningAngle) * lightningRadius;
        const lightningEndX = x + Math.cos(lightningAngle + Math.PI) * lightningRadius * 0.5;
        const lightningEndY = y + Math.sin(lightningAngle + Math.PI) * lightningRadius * 0.5;
        
        ctx.beginPath();
        ctx.moveTo(lightningStartX, lightningStartY);
        ctx.quadraticCurveTo(
          x + Math.cos(lightningAngle + Math.PI / 2) * lightningRadius * 0.3,
          y + Math.sin(lightningAngle + Math.PI / 2) * lightningRadius * 0.3,
          lightningEndX,
          lightningEndY
        );
        ctx.stroke();
      }
    }
    
    ctx.globalAlpha = 1;
  } else {
    // Standard plasma energy field - purple/magenta
    ctx.fillStyle = 'oklch(0.7 0.3 300)';
    ctx.shadowColor = 'oklch(0.7 0.3 300)';
    ctx.shadowBlur = 15;
    
    // Outer plasma field
    ctx.beginPath();
    if (safeArc(ctx, x, y, size, 0, Math.PI * 2)) {
      ctx.fill();
    }
    
    // Inner energy core
    ctx.fillStyle = 'oklch(0.85 0.2 320)';
    ctx.beginPath();
    if (safeArc(ctx, x, y, size * 0.6, 0, Math.PI * 2)) {
      ctx.fill();
    }
    
    // Bright center
    ctx.fillStyle = 'oklch(0.95 0.1 340)';
    ctx.beginPath();
    if (safeArc(ctx, x, y, size * 0.3, 0, Math.PI * 2)) {
      ctx.fill();
    }
  }
  
  ctx.shadowBlur = 0;
}

function drawRailgunProjectile(ctx: CanvasRenderingContext2D, projectile: any): void {
  const { x, y } = projectile.position;
  const size = projectile.size;
  const chargeLevel = projectile.chargeLevel || 0;
  const chargePercent = chargeLevel / 100;
  const isFullyCharged = chargePercent >= 0.75;
  
  // Draw electromagnetic trail particles with enhanced effects
  if (projectile.trailParticles) {
    projectile.trailParticles.forEach((particle: any, index: number) => {
      const alpha = (1 - particle.age / 300) * 0.95;
      const trailSize = Math.max(0.1, size * (0.6 + alpha * 0.9) * (1 + chargePercent));
      
      // Multi-layered electromagnetic trail
      const baseHue = 210 + chargePercent * 30; // Blue to cyan based on charge
      
      // Outer electromagnetic field
      ctx.fillStyle = `oklch(0.8 0.4 ${baseHue} / ${alpha * 0.7})`;
      ctx.shadowColor = `oklch(0.9 0.35 ${baseHue} / ${alpha * 0.4})`;
      ctx.shadowBlur = 15 + chargePercent * 12;
      ctx.beginPath();
      if (safeArc(ctx, particle.x, particle.y, trailSize * 1.4, 0, Math.PI * 2)) {
        ctx.fill();
      }
      
      // Main electromagnetic trail
      ctx.fillStyle = `oklch(0.9 0.35 ${baseHue} / ${alpha})`;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      if (safeArc(ctx, particle.x, particle.y, trailSize, 0, Math.PI * 2)) {
        ctx.fill();
      }
      
      // Electric arc effects for charged shots
      if (chargeLevel > 25 && index % 2 === 0 && alpha > 0.5) {
        ctx.strokeStyle = `oklch(0.95 0.45 ${baseHue - 20} / ${alpha * 0.9})`;
        ctx.lineWidth = 1 + chargePercent * 1.5;
        ctx.shadowBlur = 18;
        
        // Draw electric arcs with more intensity for higher charge
        const arcCount = 1 + Math.floor(chargePercent * 3);
        for (let i = 0; i < arcCount; i++) {
          const arcAngle = Math.random() * Math.PI * 2;
          const arcRadius = trailSize * (1.3 + chargePercent * 0.8);
          const arcX = particle.x + Math.cos(arcAngle) * arcRadius;
          const arcY = particle.y + Math.sin(arcAngle) * arcRadius;
          
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.quadraticCurveTo(
            particle.x + Math.cos(arcAngle + Math.PI / 2) * arcRadius * 0.5,
            particle.y + Math.sin(arcAngle + Math.PI / 2) * arcRadius * 0.5,
            arcX,
            arcY
          );
          ctx.stroke();
        }
      }
      
      // Core energy particles with charge scaling
      if (index % 3 === 0) {
        ctx.fillStyle = `oklch(0.98 0.25 ${baseHue + 10} / ${alpha * 0.8})`;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        if (safeArc(ctx, particle.x, particle.y, trailSize * (0.4 + chargePercent * 0.3), 0, Math.PI * 2)) {
          ctx.fill();
        }
      }
      
      // Plasma discharge effects for highly charged shots
      if (isFullyCharged && index % 4 === 0 && alpha > 0.7) {
        ctx.fillStyle = `oklch(0.95 0.5 ${baseHue + 20} / ${alpha * 0.6})`;
        ctx.shadowBlur = 20;
        
        // Create branching discharge patterns
        for (let branch = 0; branch < 3; branch++) {
          const branchAngle = (Math.PI * 2 * branch / 3) + Math.sin(Date.now() * 0.01 + branch) * 0.5;
          const branchLength = trailSize * (1.5 + Math.random() * 0.5);
          const branchX = particle.x + Math.cos(branchAngle) * branchLength;
          const branchY = particle.y + Math.sin(branchAngle) * branchLength;
          
          ctx.beginPath();
          if (safeArc(ctx, branchX, branchY, trailSize * 0.2, 0, Math.PI * 2)) {
            ctx.fill();
          }
        }
      }
    });
  }
  
  // Railgun beam - bright electric blue with dramatic charge-based scaling
  const beamIntensity = 0.7 + chargePercent * 0.3;
  const beamHue = 210 + chargePercent * 30;
  const beamColor = `oklch(${beamIntensity} 0.35 ${beamHue})`;
  const beamScale = 1 + chargePercent * 1.5; // More dramatic scaling
  
  // Outer electromagnetic field (for charged shots)
  if (chargePercent > 0.3) {
    ctx.fillStyle = `oklch(0.6 0.3 ${beamHue})`;
    ctx.shadowColor = beamColor;
    ctx.shadowBlur = 30 + chargePercent * 25;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.1, size * beamScale * 0.8), Math.max(0.1, size * beamScale * 4), 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.fillStyle = beamColor;
  ctx.shadowColor = beamColor;
  ctx.shadowBlur = 25 + chargePercent * 20;
  ctx.globalAlpha = 1;
  
  // Main beam - elongated for railgun effect with charge scaling
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, size * beamScale * (0.5 + chargePercent * 0.4)), Math.max(0.1, size * beamScale * (3 + chargePercent * 2)), 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Electric arcs around charged railgun shots with more intensity
  if (chargeLevel > 25) {
    ctx.strokeStyle = `oklch(0.98 0.5 ${beamHue - 30})`;
    ctx.lineWidth = 1.5 + chargePercent * 2;
    ctx.globalAlpha = 0.7 + chargePercent * 0.3;
    
    const arcCount = Math.floor(2 + chargePercent * 5); // More arcs for higher charge
    for (let i = 0; i < arcCount; i++) {
      const arcAngle = (Date.now() * 0.012 + i * Math.PI * 2 / arcCount) % (Math.PI * 2);
      const arcRadius = size * beamScale * (1.4 + chargePercent * 1.2);
      const arcStartX = x + Math.cos(arcAngle) * arcRadius;
      const arcStartY = y + Math.sin(arcAngle) * arcRadius;
      const arcEndX = x + Math.cos(arcAngle + Math.PI) * arcRadius * 0.6;
      const arcEndY = y + Math.sin(arcAngle + Math.PI) * arcRadius * 0.6;
      
      ctx.beginPath();
      ctx.moveTo(arcStartX, arcStartY);
      ctx.quadraticCurveTo(
        x + Math.cos(arcAngle + Math.PI / 2) * arcRadius * 0.5,
        y + Math.sin(arcAngle + Math.PI / 2) * arcRadius * 0.5,
        arcEndX,
        arcEndY
      );
      ctx.stroke();
    }
    
    // Additional crackling effects for fully charged shots
    if (isFullyCharged) {
      ctx.strokeStyle = `oklch(1 0.4 ${beamHue + 20})`;
      ctx.lineWidth = 0.8;
      ctx.globalAlpha = 0.9;
      
      for (let i = 0; i < 8; i++) {
        const crackleAngle = Math.random() * Math.PI * 2;
        const crackleRadius1 = size * beamScale * (1 + Math.random() * 1.5);
        const crackleRadius2 = size * beamScale * (0.5 + Math.random() * 1);
        const crackleX1 = x + Math.cos(crackleAngle) * crackleRadius1;
        const crackleY1 = y + Math.sin(crackleAngle) * crackleRadius1;
        const crackleX2 = x + Math.cos(crackleAngle + Math.PI) * crackleRadius2;
        const crackleY2 = y + Math.sin(crackleAngle + Math.PI) * crackleRadius2;
        
        ctx.beginPath();
        ctx.moveTo(crackleX1, crackleY1);
        ctx.lineTo(crackleX2, crackleY2);
        ctx.stroke();
      }
    }
    
    ctx.globalAlpha = 1;
  }
  
  // Inner core - brilliant white center with charge scaling
  ctx.fillStyle = `oklch(0.99 ${Math.min(0.2, 0.1 + chargePercent * 0.1)} ${beamHue})`;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, size * beamScale * 0.25), Math.max(0.1, size * beamScale * (1.8 + chargePercent * 1)), 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.shadowBlur = 0;
}

function drawHomingMissile(ctx: CanvasRenderingContext2D, projectile: any): void {
  const { x, y } = projectile.position;
  const size = projectile.size;
  
  // Draw missile exhaust trail
  if (projectile.trailParticles) {
    projectile.trailParticles.forEach((particle: any, index: number) => {
      const alpha = (1 - particle.age / 800) * 0.8;
      const trailSize = Math.max(0.1, size * (0.2 + alpha * 0.5));
      
      // Main exhaust trail - orange/red gradient
      const exhaustHue = 30 + (index % 3) * 10; // Vary between orange and red
      ctx.fillStyle = `oklch(0.7 0.25 ${exhaustHue} / ${alpha})`;
      ctx.shadowColor = `oklch(0.7 0.25 ${exhaustHue} / ${alpha * 0.3})`;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      if (safeArc(ctx, particle.x, particle.y, trailSize, 0, Math.PI * 2)) {
        ctx.fill();
      }
      
      // Secondary exhaust puffs for some particles
      if (index % 4 === 0 && alpha > 0.4) {
        ctx.fillStyle = `oklch(0.8 0.2 ${exhaustHue + 20} / ${alpha * 0.6})`;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        if (safeArc(ctx, particle.x, particle.y, trailSize * 1.3, 0, Math.PI * 2)) {
          ctx.fill();
        }
      }
      
      // Hot core particles
      if (index % 5 === 0) {
        ctx.fillStyle = `oklch(0.95 0.15 ${exhaustHue - 10} / ${alpha * 0.5})`;
        ctx.shadowBlur = 3;
        ctx.beginPath();
        if (safeArc(ctx, particle.x, particle.y, trailSize * 0.5, 0, Math.PI * 2)) {
          ctx.fill();
        }
      }
      
      // Exhaust sparks
      if (index % 6 === 0 && Math.random() < 0.3) {
        ctx.fillStyle = `oklch(0.9 0.3 ${exhaustHue + 40} / ${alpha * 0.4})`;
        ctx.shadowBlur = 2;
        for (let i = 0; i < 2; i++) {
          const sparkX = particle.x + (Math.random() - 0.5) * 4;
          const sparkY = particle.y + Math.random() * 3;
          ctx.beginPath();
          if (safeArc(ctx, sparkX, sparkY, trailSize * 0.2, 0, Math.PI * 2)) {
            ctx.fill();
          }
        }
      }
    });
  }
  
  // Calculate missile orientation based on velocity
  const angle = Math.atan2(projectile.velocity.y, projectile.velocity.x) + Math.PI / 2;
  
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  
  // Missile body - metallic gray with orange tip
  ctx.fillStyle = 'oklch(0.5 0.05 240)';
  ctx.shadowColor = 'oklch(0.8 0.2 50)';
  ctx.shadowBlur = 8;
  
  // Main missile body - ensure positive radii
  ctx.beginPath();
  ctx.ellipse(0, 0, Math.max(0.1, size * 0.5), Math.max(0.1, size * 1.2), 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Warhead (bright orange tip) - ensure positive radii
  ctx.fillStyle = 'oklch(0.8 0.2 50)';
  ctx.beginPath();
  ctx.ellipse(0, -size * 0.8, Math.max(0.1, size * 0.3), Math.max(0.1, size * 0.5), 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Fins
  ctx.fillStyle = 'oklch(0.4 0.05 240)';
  ctx.beginPath();
  ctx.moveTo(-size * 0.3, size * 0.5);
  ctx.lineTo(-size * 0.6, size * 0.8);
  ctx.lineTo(-size * 0.2, size * 0.8);
  ctx.closePath();
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(size * 0.3, size * 0.5);
  ctx.lineTo(size * 0.6, size * 0.8);
  ctx.lineTo(size * 0.2, size * 0.8);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
  ctx.shadowBlur = 0;
}

function drawChaingunProjectile(ctx: CanvasRenderingContext2D, projectile: any): void {
  const { x, y } = projectile.position;
  const size = projectile.size;
  
  // Draw rapid-fire trail particles
  if (projectile.trailParticles) {
    projectile.trailParticles.forEach((particle: any, index: number) => {
      const alpha = (1 - particle.age / 200) * 0.7;
      const trailSize = Math.max(0.1, size * (0.3 + alpha * 0.4));
      
      // Bullet trail with metallic appearance
      ctx.fillStyle = `oklch(0.8 0.1 60 / ${alpha})`;
      ctx.shadowColor = `oklch(0.8 0.1 60 / ${alpha * 0.3})`;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      if (safeArc(ctx, particle.x, particle.y, trailSize, 0, Math.PI * 2)) {
        ctx.fill();
      }
      
      // Add muzzle flash remnants for some particles
      if (index % 3 === 0 && alpha > 0.5) {
        ctx.fillStyle = `oklch(0.9 0.2 50 / ${alpha * 0.5})`;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        if (safeArc(ctx, particle.x, particle.y, trailSize * 0.7, 0, Math.PI * 2)) {
          ctx.fill();
        }
      }
    });
  }
  
  // Chaingun projectile - metallic yellow with bullet appearance
  ctx.fillStyle = 'oklch(0.8 0.15 80)';
  ctx.shadowColor = 'oklch(0.8 0.15 80)';
  ctx.shadowBlur = 6;
  
  // Bullet-like shape
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, size * 0.7), Math.max(0.1, size * 1.2), 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Metallic shine
  ctx.fillStyle = 'oklch(0.95 0.05 80)';
  ctx.beginPath();
  if (safeArc(ctx, x - size * 0.2, y - size * 0.3, size * 0.3, 0, Math.PI * 2)) {
    ctx.fill();
  }
  
  ctx.shadowBlur = 0;
}

function drawIonProjectile(ctx: CanvasRenderingContext2D, projectile: any): void {
  const { x, y } = projectile.position;
  const size = projectile.size;
  
  // Draw ion disruption field trail
  if (projectile.trailParticles) {
    projectile.trailParticles.forEach((particle: any, index: number) => {
      const alpha = (1 - particle.age / 500) * 0.8;
      const trailSize = Math.max(0.1, size * (0.4 + alpha * 0.5));
      
      // Ion field disruption
      ctx.fillStyle = `oklch(0.6 0.4 270 / ${alpha})`;
      ctx.shadowColor = `oklch(0.6 0.4 270 / ${alpha * 0.4})`;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      if (safeArc(ctx, particle.x, particle.y, trailSize, 0, Math.PI * 2)) {
        ctx.fill();
      }
      
      // Ion field distortions (circular patterns)
      if (index % 6 === 0 && alpha > 0.3) {
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const radius = trailSize * (0.8 + Math.sin(Date.now() * 0.01 + i) * 0.2);
          const ionX = particle.x + Math.cos(angle) * radius;
          const ionY = particle.y + Math.sin(angle) * radius;
          
          ctx.fillStyle = `oklch(0.7 0.3 ${270 + i * 10} / ${alpha * 0.6})`;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          if (safeArc(ctx, ionX, ionY, trailSize * 0.2, 0, Math.PI * 2)) {
            ctx.fill();
          }
        }
      }
    });
  }
  
  // Ion cannon projectile - purple energy with disruption field
  ctx.fillStyle = 'oklch(0.6 0.4 270)';
  ctx.shadowColor = 'oklch(0.6 0.4 270)';
  ctx.shadowBlur = 20;
  
  // Main ion field
  ctx.beginPath();
  if (safeArc(ctx, x, y, size, 0, Math.PI * 2)) {
    ctx.fill();
  }
  
  // Inner disruption core
  ctx.fillStyle = 'oklch(0.8 0.3 280)';
  ctx.beginPath();
  if (safeArc(ctx, x, y, size * 0.6, 0, Math.PI * 2)) {
    ctx.fill();
  }
  
  // Disruption field rings
  ctx.strokeStyle = 'oklch(0.7 0.35 260)';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.7;
  for (let i = 1; i <= 3; i++) {
    const ringRadius = size * (1 + i * 0.3);
    ctx.beginPath();
    if (safeArc(ctx, x, y, ringRadius, 0, Math.PI * 2)) {
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  
  ctx.shadowBlur = 0;
}

function drawQuantumProjectile(ctx: CanvasRenderingContext2D, projectile: any): void {
  const { x, y } = projectile.position;
  const size = projectile.size;
  const phaseShift = projectile.phaseShift || 0;
  const phaseMod = Math.sin(phaseShift) * 0.5 + 0.5;
  
  // Draw quantum phase trail
  if (projectile.trailParticles) {
    projectile.trailParticles.forEach((particle: any, index: number) => {
      const alpha = (1 - particle.age / 700) * (0.6 + phaseMod * 0.4);
      const trailSize = Math.max(0.1, size * (0.3 + alpha * 0.5));
      
      // Quantum phase variations
      const phaseHue = 180 + Math.sin(phaseShift + index * 0.5) * 60;
      ctx.fillStyle = `oklch(0.8 0.3 ${phaseHue} / ${alpha})`;
      ctx.shadowColor = `oklch(0.8 0.3 ${phaseHue} / ${alpha * 0.3})`;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      if (safeArc(ctx, particle.x, particle.y, trailSize, 0, Math.PI * 2)) {
        ctx.fill();
      }
      
      // Phase distortion effects
      if (index % 4 === 0 && alpha > 0.4) {
        ctx.fillStyle = `oklch(0.9 0.2 ${phaseHue + 30} / ${alpha * 0.6})`;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        if (safeArc(ctx, particle.x + Math.sin(phaseShift) * 3, particle.y + Math.cos(phaseShift) * 3, trailSize * 0.8, 0, Math.PI * 2)) {
          ctx.fill();
        }
      }
      
      // Quantum tunneling echoes
      if (index % 8 === 0 && Math.random() < 0.3) {
        ctx.fillStyle = `oklch(0.95 0.15 ${phaseHue - 20} / ${alpha * 0.4})`;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        if (safeArc(ctx, particle.x, particle.y - 20, trailSize * 0.5, 0, Math.PI * 2)) {
          ctx.fill();
        }
      }
    });
  }
  
  // Quantum projectile with reality distortion
  const quantumHue = 180 + Math.sin(phaseShift) * 60;
  ctx.fillStyle = `oklch(0.8 0.3 ${quantumHue})`;
  ctx.shadowColor = `oklch(0.8 0.3 ${quantumHue})`;
  ctx.shadowBlur = 15;
  
  // Main quantum field with phase modulation
  ctx.globalAlpha = 0.7 + phaseMod * 0.3;
  ctx.beginPath();
  if (safeArc(ctx, x, y, size * (1 + phaseMod * 0.3), 0, Math.PI * 2)) {
    ctx.fill();
  }
  
  // Quantum core
  ctx.fillStyle = `oklch(0.95 0.2 ${quantumHue + 20})`;
  ctx.beginPath();
  if (safeArc(ctx, x, y, size * 0.5, 0, Math.PI * 2)) {
    ctx.fill();
  }
  
  // Phase distortion rings
  ctx.strokeStyle = `oklch(0.9 0.25 ${quantumHue - 30})`;
  ctx.lineWidth = 1;
  ctx.globalAlpha = phaseMod * 0.8;
  for (let i = 0; i < 3; i++) {
    const ringRadius = size * (1.5 + i * 0.5 + Math.sin(phaseShift + i) * 0.3);
    ctx.beginPath();
    if (safeArc(ctx, x + Math.sin(phaseShift) * 2, y + Math.cos(phaseShift) * 2, ringRadius, 0, Math.PI * 2)) {
      ctx.stroke();
    }
  }
  
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawFusionProjectile(ctx: CanvasRenderingContext2D, projectile: any): void {
  const { x, y } = projectile.position;
  const size = projectile.size;
  const fusionTimer = projectile.fusionTimer || 0;
  const fusionIntensity = 1 + (fusionTimer / 1000);
  
  // Draw fusion reaction trail
  if (projectile.trailParticles) {
    projectile.trailParticles.forEach((particle: any, index: number) => {
      const alpha = (1 - particle.age / 1000) * 0.9;
      const trailSize = Math.max(0.1, size * (0.3 + alpha * 0.7) * fusionIntensity);
      
      // Fusion reaction colors (white to yellow to orange)
      const reactionHue = 60 - (alpha * 30); // Transitions from white to orange
      ctx.fillStyle = `oklch(${0.9 - alpha * 0.2} 0.3 ${reactionHue} / ${alpha})`;
      ctx.shadowColor = `oklch(${0.9 - alpha * 0.2} 0.3 ${reactionHue} / ${alpha * 0.4})`;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      if (safeArc(ctx, particle.x, particle.y, trailSize, 0, Math.PI * 2)) {
        ctx.fill();
      }
      
      // Fusion reaction bursts
      if (index % 8 === 0 && alpha > 0.5) {
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const burstRadius = trailSize * (0.5 + Math.random() * 0.5);
          const burstX = particle.x + Math.cos(angle) * burstRadius;
          const burstY = particle.y + Math.sin(angle) * burstRadius;
          
          ctx.fillStyle = `oklch(0.95 0.2 ${reactionHue + 20} / ${alpha * 0.7})`;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          if (safeArc(ctx, burstX, burstY, trailSize * 0.3, 0, Math.PI * 2)) {
            ctx.fill();
          }
        }
      }
    });
  }
  
  // Fusion torpedo with growing energy
  ctx.fillStyle = `oklch(0.9 0.3 50)`;
  ctx.shadowColor = `oklch(0.9 0.3 50)`;
  ctx.shadowBlur = 25 * fusionIntensity;
  
  // Main fusion core
  ctx.beginPath();
  if (safeArc(ctx, x, y, size * fusionIntensity, 0, Math.PI * 2)) {
    ctx.fill();
  }
  
  // Inner fusion reaction
  ctx.fillStyle = `oklch(0.95 0.2 30)`;
  ctx.beginPath();
  if (safeArc(ctx, x, y, size * 0.6 * fusionIntensity, 0, Math.PI * 2)) {
    ctx.fill();
  }
  
  // Bright fusion center
  ctx.fillStyle = `oklch(0.98 0.1 10)`;
  ctx.beginPath();
  if (safeArc(ctx, x, y, size * 0.3 * fusionIntensity, 0, Math.PI * 2)) {
    ctx.fill();
  }
  
  // Fusion energy waves
  ctx.strokeStyle = `oklch(0.8 0.25 40)`;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.6;
  for (let i = 1; i <= 2; i++) {
    const waveRadius = size * (2 + i * 0.5) * fusionIntensity;
    ctx.beginPath();
    if (safeArc(ctx, x, y, waveRadius, 0, Math.PI * 2)) {
      ctx.stroke();
    }
  }
  
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawShotgunProjectile(ctx: CanvasRenderingContext2D, projectile: any): void {
  const { x, y } = projectile.position;
  const size = projectile.size;
  
  // Draw minimal shotgun pellet trail
  if (projectile.trailParticles) {
    projectile.trailParticles.forEach((particle: any, index: number) => {
      const alpha = (1 - particle.age / 150) * 0.6;
      const trailSize = Math.max(0.1, size * (0.3 + alpha * 0.3));
      
      // Simple pellet trail
      ctx.fillStyle = `oklch(0.7 0.1 40 / ${alpha})`;
      ctx.shadowColor = `oklch(0.7 0.1 40 / ${alpha * 0.3})`;
      ctx.shadowBlur = 3;
      ctx.beginPath();
      if (safeArc(ctx, particle.x, particle.y, trailSize, 0, Math.PI * 2)) {
        ctx.fill();
      }
    });
  }
  
  // Shotgun pellet - small metallic projectile
  ctx.fillStyle = 'oklch(0.7 0.1 40)';
  ctx.shadowColor = 'oklch(0.7 0.1 40)';
  ctx.shadowBlur = 4;
  
  // Small pellet
  ctx.beginPath();
  if (safeArc(ctx, x, y, size, 0, Math.PI * 2)) {
    ctx.fill();
  }
  
  // Metallic highlight
  ctx.fillStyle = 'oklch(0.9 0.05 40)';
  ctx.beginPath();
  if (safeArc(ctx, x - size * 0.3, y - size * 0.3, size * 0.4, 0, Math.PI * 2)) {
    ctx.fill();
  }
  
  ctx.shadowBlur = 0;
}

function drawBossIntroOverlay(ctx: CanvasRenderingContext2D, state: GameState): void {
  const animationTime = state.bossAnimationTime || 0;
  const progress = Math.min(animationTime / GAME_CONFIG.BOSS_INTRO_DURATION, 1);
  
  // Dark overlay that fades in then out
  const overlayAlpha = progress < 0.2 ? progress * 5 * 0.7 : 
                     progress > 0.8 ? (1 - progress) * 5 * 0.7 : 0.7;
  
  ctx.fillStyle = `rgba(0, 0, 0, ${overlayAlpha})`;
  ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
  
  // Warning text animation
  if (progress < 0.9) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Flashing warning effect
    const flash = Math.sin(animationTime * 0.02) > 0 ? 1 : 0.5;
    ctx.globalAlpha = flash;
    
    // Main warning text
    ctx.fillStyle = 'oklch(0.9 0.3 0)';
    ctx.font = 'bold 48px Orbitron, monospace';
    ctx.fillText('WARNING', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 - 60);
    
    // Find the boss for type-specific intro
    const boss = state.enemies.find(enemy => enemy.type === 'boss');
    const bossTypeName = getBossTypeName(boss?.bossType);
    
    // Subtitle with boss type
    ctx.fillStyle = 'oklch(0.8 0.2 30)';
    ctx.font = 'bold 24px Orbitron, monospace';
    ctx.fillText(`${bossTypeName} DETECTED`, GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 - 10);
    
    // Additional warning lines
    ctx.fillStyle = 'oklch(0.7 0.15 60)';
    ctx.font = '16px Orbitron, monospace';
    ctx.fillText('>>> THREAT LEVEL: MAXIMUM <<<', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 30);
    ctx.fillText('>>> ALL UNITS ENGAGE <<<', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 55);
    
    ctx.restore();
  }
}

// Helper function to get boss type display names
function getBossTypeName(bossType: string): string {
  switch (bossType) {
    case 'destroyer': return 'DESTROYER CLASS';
    case 'interceptor': return 'INTERCEPTOR CLASS';
    case 'titan': return 'TITAN CLASS';
    case 'phantom': return 'PHANTOM CLASS';
    case 'vortex': return 'VORTEX CLASS';
    case 'guardian': return 'GUARDIAN CLASS';
    default: return 'UNKNOWN CLASS';
  }
}

function drawBossDefeatOverlay(ctx: CanvasRenderingContext2D, state: GameState): void {
  const animationTime = state.bossAnimationTime || 0;
  const progress = Math.min(animationTime / GAME_CONFIG.BOSS_DEFEAT_DURATION, 1);
  
  // Screen flash effect
  if (progress < 0.3) {
    const flashIntensity = (0.3 - progress) / 0.3;
    ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity * 0.8})`;
    ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
  }
  
  // Victory text animation
  if (progress > 0.4) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const textProgress = (progress - 0.4) / 0.6;
    const textAlpha = Math.min(textProgress * 2, 1);
    
    // Main victory text
    ctx.globalAlpha = textAlpha;
    ctx.fillStyle = 'oklch(0.9 0.3 130)';
    ctx.font = 'bold 42px Orbitron, monospace';
    ctx.fillText('DESTROYER ELIMINATED', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 - 40);
    
    // Score bonus
    ctx.fillStyle = 'oklch(0.8 0.2 130)';
    ctx.font = 'bold 24px Orbitron, monospace';
    ctx.fillText(`+${GAME_CONFIG.BOSS_POINTS} POINTS`, GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 10);
    
    // Continue message
    if (progress > 0.7) {
      ctx.fillStyle = 'oklch(0.7 0.15 200)';
      ctx.font = '16px Orbitron, monospace';
      ctx.fillText('>>> MISSION CONTINUES <<<', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 50);
    }
    
    ctx.restore();
  }
}

function drawParticle(ctx: CanvasRenderingContext2D, particle: any): void {
  const { x, y } = particle.position;
  let size = particle.size;
  const lifePercent = particle.life / particle.maxLife;
  
  // Safety checks to prevent negative or zero sizes that could cause canvas errors
  if (size <= 0 || !isFinite(size) || isNaN(size)) {
    return; // Skip rendering this particle
  }
  
  // Ensure minimum size to prevent canvas arc errors
  size = Math.max(0.1, size);
  
  // Calculate alpha based on remaining life
  const alpha = Math.max(0, lifePercent * 0.9);
  
  // Skip rendering if particle is effectively invisible or very small
  if (alpha <= 0.02 || size < 0.5) {
    return;
  }
  
  // Set global alpha for the particle
  ctx.globalAlpha = alpha;
  
  // Different rendering based on particle type
  switch (particle.type) {
    case 'explosion':
      // Bright, round explosion particles
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      if (safeArc(ctx, x, y, size * lifePercent, 0, Math.PI * 2)) {
        ctx.fill();
      }
      break;
      
    case 'spark':
      // Simplified spark rendering - just a small circle
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      if (safeArc(ctx, x, y, size * lifePercent * 0.5, 0, Math.PI * 2)) {
        ctx.fill();
      }
      break;
      
    case 'debris':
      // Small debris pieces - simple rectangles
      ctx.fillStyle = particle.color;
      const debrisSize = Math.max(0.5, size * lifePercent);
      ctx.fillRect(x - debrisSize / 2, y - debrisSize / 2, debrisSize, debrisSize * 0.6);
      break;
      
    case 'trail':
      // Ship engine trail particles - soft circles without shadow for performance
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      const trailSize = Math.max(0.2, size * lifePercent * 0.8);
      if (safeArc(ctx, x, y, trailSize, 0, Math.PI * 2)) {
        ctx.fill();
      }
      break;
  }
  
  // Reset global alpha
  ctx.globalAlpha = 1;
}

// Helper functions for boss rendering
function getBossGlowColor(bossType: string): string {
  switch (bossType) {
    case 'destroyer': return 'oklch(0.8 0.4 0)';
    case 'interceptor': return 'oklch(0.7 0.3 220)';
    case 'titan': return 'oklch(0.6 0.3 280)';
    case 'phantom': return 'oklch(0.8 0.3 130)';
    case 'vortex': return 'oklch(0.7 0.4 200)';
    case 'guardian': return 'oklch(0.7 0.3 30)';
    default: return 'oklch(0.7 0.3 0)';
  }
}

function getBossColors(bossType: string, bossState: string) {
  const isDefeated = bossState === 'defeated';
  
  switch (bossType) {
    case 'destroyer':
      return {
        body: isDefeated ? 'oklch(0.3 0.15 0)' : 'oklch(0.4 0.25 0)',
        outline: isDefeated ? 'oklch(0.5 0.2 0)' : 'oklch(0.7 0.3 0)',
        core: 'oklch(0.8 0.3 0)'
      };
    case 'interceptor':
      return {
        body: isDefeated ? 'oklch(0.3 0.1 220)' : 'oklch(0.4 0.2 220)',
        outline: isDefeated ? 'oklch(0.5 0.15 220)' : 'oklch(0.7 0.25 220)',
        core: 'oklch(0.8 0.3 220)'
      };
    case 'titan':
      return {
        body: isDefeated ? 'oklch(0.3 0.1 280)' : 'oklch(0.4 0.2 280)',
        outline: isDefeated ? 'oklch(0.5 0.15 280)' : 'oklch(0.7 0.25 280)',
        core: 'oklch(0.8 0.3 280)'
      };
    case 'phantom':
      return {
        body: isDefeated ? 'oklch(0.3 0.1 130)' : 'oklch(0.4 0.2 130)',
        outline: isDefeated ? 'oklch(0.5 0.15 130)' : 'oklch(0.7 0.25 130)',
        core: 'oklch(0.8 0.3 130)'
      };
    case 'vortex':
      return {
        body: isDefeated ? 'oklch(0.3 0.1 200)' : 'oklch(0.4 0.2 200)',
        outline: isDefeated ? 'oklch(0.5 0.15 200)' : 'oklch(0.7 0.25 200)',
        core: 'oklch(0.8 0.3 200)'
      };
    case 'guardian':
      return {
        body: isDefeated ? 'oklch(0.3 0.1 30)' : 'oklch(0.4 0.2 30)',
        outline: isDefeated ? 'oklch(0.5 0.15 30)' : 'oklch(0.7 0.25 30)',
        core: 'oklch(0.8 0.3 30)'
      };
    default:
      return {
        body: isDefeated ? 'oklch(0.3 0.15 0)' : 'oklch(0.4 0.25 0)',
        outline: isDefeated ? 'oklch(0.5 0.2 0)' : 'oklch(0.7 0.3 0)',
        core: 'oklch(0.8 0.3 0)'
      };
  }
}

function drawBossShape(ctx: CanvasRenderingContext2D, boss: any, x: number, y: number, size: number): void {
  ctx.beginPath();
  
  switch (boss.bossType) {
    case 'destroyer':
      // Aggressive angular hexagon
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const px = x + Math.cos(angle) * size * 0.8;
        const py = y + Math.sin(angle) * size * 0.8;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
      
    case 'interceptor':
      // Sleek triangular design
      ctx.moveTo(x, y - size * 0.9);
      ctx.lineTo(x - size * 0.6, y + size * 0.4);
      ctx.lineTo(x - size * 0.2, y + size * 0.7);
      ctx.lineTo(x + size * 0.2, y + size * 0.7);
      ctx.lineTo(x + size * 0.6, y + size * 0.4);
      ctx.closePath();
      break;
      
    case 'titan':
      // Large rectangular fortress
      ctx.rect(x - size * 0.7, y - size * 0.7, size * 1.4, size * 1.4);
      break;
      
    case 'phantom':
      // Multiple overlapping circles for ethereal effect
      ctx.globalAlpha = 0.7;
      if (safeArc(ctx, x, y, size * 0.9, 0, Math.PI * 2)) {
        ctx.fill();
      }
      ctx.globalAlpha = 0.5;
      if (safeArc(ctx, x, y, size * 0.7, 0, Math.PI * 2)) {
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (safeArc(ctx, x, y, size * 0.5, 0, Math.PI * 2)) {
        // Don't close path, we'll do that after
      }
      return; // Skip the normal fill/stroke
      
    case 'vortex':
      // Circular with energy spikes
      if (safeArc(ctx, x, y, size * 0.8, 0, Math.PI * 2)) {
        // Add energy spikes
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          const spikeX = x + Math.cos(angle) * size * 1.2;
          const spikeY = y + Math.sin(angle) * size * 1.2;
          ctx.lineTo(spikeX, spikeY);
          ctx.lineTo(x + Math.cos(angle) * size * 0.8, y + Math.sin(angle) * size * 0.8);
        }
        ctx.closePath();
      }
      break;
      
    case 'guardian':
      // Octagonal armored design
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const px = x + Math.cos(angle) * size * 0.85;
        const py = y + Math.sin(angle) * size * 0.85;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
      
    default:
      // Default hexagon
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const px = x + Math.cos(angle) * size * 0.8;
        const py = y + Math.sin(angle) * size * 0.8;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
  }
  
  ctx.fill();
  ctx.stroke();
}

function drawWeaponSpecificChargeEffect(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  size: number, 
  chargePercent: number, 
  isCharging: boolean, 
  weapon: any, 
  time: number,
  chargeData: any
): void {
  switch (weapon.type) {
    case 'plasmaBeam':
      drawPlasmaChargeEffect(ctx, x, y, size, chargePercent, isCharging, time, chargeData);
      break;
      
    case 'laserCannon':
      drawLaserChargeEffect(ctx, x, y, size, chargePercent, isCharging, time, chargeData);
      break;
      
    case 'railgun':
      drawRailgunChargeEffect(ctx, x, y, size, chargePercent, isCharging, time, chargeData);
      break;
      
    default:
      drawDefaultChargeEffect(ctx, x, y, size, chargePercent, isCharging, time, chargeData);
      break;
  }
}

function drawChargedShipModifications(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  chargeData: any,
  weapon: any,
  time: number
): void {
  // Only draw modifications for charge level 3 and above
  if (chargeData.level < 3) return;
  
  const isMaxCharge = chargeData.level >= 4;
  
  switch (weapon.type) {
    case 'plasmaBeam':
      // Plasma weapon modifications - energy channels along ship hull
      ctx.strokeStyle = `oklch(0.9 0.4 ${310 + chargeData.level * 5})`;
      ctx.lineWidth = 1 + chargeData.level * 0.5;
      ctx.globalAlpha = 0.6 + chargeData.level * 0.1 + Math.sin(time * 0.02) * 0.2;
      
      // Energy channels on ship wings
      ctx.beginPath();
      ctx.moveTo(x - size * 0.5, y + size * 0.3);
      ctx.lineTo(x - size * 0.2, y - size * 0.3);
      ctx.moveTo(x + size * 0.5, y + size * 0.3);
      ctx.lineTo(x + size * 0.2, y - size * 0.3);
      ctx.stroke();
      
      if (isMaxCharge) {
        // Plasma overflow vents
        for (let i = 0; i < 4; i++) {
          const ventY = y + size * (0.2 - i * 0.15);
          ctx.fillStyle = `oklch(0.95 0.35 ${320 + i * 5})`;
          ctx.globalAlpha = 0.7 + Math.sin(time * 0.03 + i) * 0.3;
          ctx.beginPath();
          if (safeArc(ctx, x - size * 0.3, ventY, 1.5, 0, Math.PI * 2)) ctx.fill();
          if (safeArc(ctx, x + size * 0.3, ventY, 1.5, 0, Math.PI * 2)) ctx.fill();
        }
      }
      break;
      
    case 'laserCannon':
      // Laser weapon modifications - focusing lenses and precision guides
      ctx.strokeStyle = `oklch(0.95 0.3 ${180 - chargeData.level * 3})`;
      ctx.lineWidth = 0.8 + chargeData.level * 0.3;
      ctx.globalAlpha = 0.8 + Math.sin(time * 0.015) * 0.2;
      
      // Focusing guide lines
      ctx.beginPath();
      ctx.moveTo(x - size * 0.4, y - size * 0.6);
      ctx.lineTo(x, y - size * 0.9);
      ctx.lineTo(x + size * 0.4, y - size * 0.6);
      ctx.stroke();
      
      if (isMaxCharge) {
        // Precision targeting systems
        ctx.fillStyle = `oklch(0.98 0.25 170)`;
        ctx.globalAlpha = 0.9 + Math.sin(time * 0.025) * 0.1;
        
        const targetingPoints = 6;
        for (let i = 0; i < targetingPoints; i++) {
          const angle = (time * 0.01 + i * Math.PI * 2 / targetingPoints) % (Math.PI * 2);
          const radius = size * 0.8;
          const pointX = x + Math.cos(angle) * radius;
          const pointY = y + Math.sin(angle) * radius;
          
          ctx.beginPath();
          if (safeArc(ctx, pointX, pointY, 1, 0, Math.PI * 2)) ctx.fill();
        }
      }
      break;
      
    case 'railgun':
      // Railgun weapon modifications - electromagnetic field generators
      ctx.strokeStyle = `oklch(0.9 0.3 ${125 - chargeData.level * 2})`;
      ctx.lineWidth = 1.2 + chargeData.level * 0.4;
      ctx.globalAlpha = 0.7 + Math.sin(time * 0.025) * 0.3;
      
      // Electromagnetic field lines
      for (let field = 0; field < 3; field++) {
        const fieldRadius = size * (0.6 + field * 0.2);
        ctx.beginPath();
        ctx.arc(x, y, fieldRadius, Math.PI * 0.3, Math.PI * 0.7);
        ctx.arc(x, y, fieldRadius, Math.PI * 1.3, Math.PI * 1.7);
        ctx.stroke();
      }
      
      if (isMaxCharge) {
        // Electric discharge points
        for (let i = 0; i < 8; i++) {
          if (Math.random() < 0.4) continue; // Random sparking
          
          const sparkAngle = Math.random() * Math.PI * 2;
          const sparkRadius = size * (0.7 + Math.random() * 0.4);
          const sparkX = x + Math.cos(sparkAngle) * sparkRadius;
          const sparkY = y + Math.sin(sparkAngle) * sparkRadius;
          
          ctx.fillStyle = `oklch(0.98 0.4 ${120 + Math.random() * 20})`;
          ctx.globalAlpha = 0.6 + Math.random() * 0.4;
          ctx.beginPath();
          if (safeArc(ctx, sparkX, sparkY, 1 + Math.random(), 0, Math.PI * 2)) ctx.fill();
        }
      }
      break;
      
    default:
      // Default charge modifications - energy field enhancement
      ctx.strokeStyle = `oklch(0.85 0.2 ${200 + chargeData.level * 3})`;
      ctx.lineWidth = 1 + chargeData.level * 0.3;
      ctx.globalAlpha = 0.5 + chargeData.level * 0.1 + Math.sin(time * 0.02) * 0.15;
      
      // Basic energy field rings
      for (let ring = 0; ring < 2; ring++) {
        ctx.beginPath();
        if (safeArc(ctx, x, y, size * (0.9 + ring * 0.3), 0, Math.PI * 2)) {
          ctx.stroke();
        }
      }
      
      if (isMaxCharge) {
        // Simple energy points
        for (let i = 0; i < 4; i++) {
          const angle = i * Math.PI * 0.5 + time * 0.01;
          const pointX = x + Math.cos(angle) * size * 0.7;
          const pointY = y + Math.sin(angle) * size * 0.7;
          
          ctx.fillStyle = `oklch(0.9 0.25 ${210 + i * 5})`;
          ctx.globalAlpha = 0.6 + Math.sin(time * 0.02 + i) * 0.3;
          ctx.beginPath();
          if (safeArc(ctx, pointX, pointY, 1.5, 0, Math.PI * 2)) ctx.fill();
        }
      }
      break;
  }
  
  ctx.globalAlpha = 1;
}

function drawPlasmaChargeEffect(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  size: number, 
  chargePercent: number, 
  isCharging: boolean, 
  time: number,
  chargeData: any
): void {
  // Plasma weapons have purple/magenta energy with evolving colors per charge level
  const chargeColors = [
    'oklch(0.7 0.3 300)', // Level 1: Purple
    'oklch(0.75 0.35 310)', // Level 2: Magenta
    'oklch(0.8 0.4 320)', // Level 3: Hot pink
    'oklch(0.9 0.45 330)', // Level 4: Brilliant white-pink
  ];
  
  const currentColor = chargeColors[Math.min(chargeData.level - 1, 3)] || chargeColors[0];
  const unstableColor = chargeData.level >= 3 ? 'oklch(0.85 0.3 280)' : 'oklch(0.8 0.25 280)';
  
  // Unstable plasma field - more intense with higher charge levels
  if (chargePercent > 0.1) {
    const fieldCount = 4 + chargeData.level * 2;
    for (let i = 0; i < fieldCount; i++) {
      const swirl = time * (0.02 + chargeData.level * 0.005) + i * Math.PI / fieldCount;
      const radius = size * (0.8 + chargePercent * 0.6);
      const wobble = Math.sin(time * 0.03 + i) * size * (0.3 + chargeData.level * 0.1);
      
      const fieldX = x + Math.cos(swirl) * (radius + wobble);
      const fieldY = y + Math.sin(swirl) * (radius + wobble * 0.5);
      
      const fieldSize = (3 + chargeData.level * 2) + chargePercent * 4 + Math.sin(time * 0.025 + i) * 2;
      
      ctx.fillStyle = i % 2 === 0 ? currentColor : unstableColor;
      ctx.globalAlpha = 0.3 + chargeData.level * 0.1;
      
      ctx.beginPath();
      if (safeArc(ctx, fieldX, fieldY, Math.max(0.1, fieldSize), 0, Math.PI * 2)) {
        ctx.fill();
      }
    }
  }
  
  // Main plasma containment ring with level-based intensity
  ctx.strokeStyle = currentColor;
  ctx.lineWidth = 2 + chargeData.level * 1.5;
  ctx.globalAlpha = 0.5 + chargeData.level * 0.15;
  
  if (chargeData.level >= 4) {
    // Maximum power - extremely unstable
    ctx.globalAlpha = 0.8 + Math.sin(time * 0.05) * 0.2;
    ctx.lineWidth += Math.sin(time * 0.06) * 3;
  } else if (chargeData.level >= 3) {
    // Supercharged - unstable pulsing
    ctx.globalAlpha = 0.7 + Math.sin(time * 0.04) * 0.15;
    ctx.lineWidth += Math.sin(time * 0.04) * 2;
  }
  
  ctx.beginPath();
  const mainRadius = size * (1.2 + chargePercent * 0.8 + (chargeData.level >= 3 ? Math.sin(time * 0.02) * 0.2 : 0));
  if (safeArc(ctx, x, y, mainRadius, 0, Math.PI * 2)) {
    ctx.stroke();
  }
  
  // Plasma arcs based on charge level
  if (chargeData.level >= 2) {
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = 1 + chargeData.level * 0.5 + (chargeData.level >= 4 ? Math.sin(time * 0.04) * 1 : 0);
    ctx.globalAlpha = 0.6 + chargeData.level * 0.1;
    
    const arcCount = chargeData.level * 2;
    for (let i = 0; i < arcCount; i++) {
      const arcStart = (time * 0.01 + i * Math.PI / arcCount) % (Math.PI * 2);
      const arcLength = Math.PI / 6 + chargeData.level * Math.PI / 24 + Math.sin(time * 0.03 + i) * Math.PI / 12;
      const arcEnd = arcStart + arcLength;
      
      ctx.beginPath();
      if (safeArc(ctx, x, y, size * (1.1 + chargeData.level * 0.1), arcStart, arcEnd)) {
        ctx.stroke();
      }
    }
  }
  
  // Crackling plasma sparks
  if (chargeData.level >= 3) {
    for (let i = 0; i < 8; i++) {
      const sparkAngle = Math.random() * Math.PI * 2;
      const sparkDistance = size * (1.0 + Math.random() * 0.6);
      const sparkX = x + Math.cos(sparkAngle) * sparkDistance;
      const sparkY = y + Math.sin(sparkAngle) * sparkDistance;
      
      ctx.fillStyle = `oklch(${0.85 + Math.random() * 0.1} 0.3 ${290 + Math.random() * 40})`;
      ctx.globalAlpha = 0.4 + Math.random() * 0.4;
      ctx.beginPath();
      if (safeArc(ctx, sparkX, sparkY, 1 + Math.random() * 2, 0, Math.PI * 2)) {
        ctx.fill();
      }
    }
  }
}

function drawLaserChargeEffect(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  size: number, 
  chargePercent: number, 
  isCharging: boolean, 
  time: number,
  chargeData: any
): void {
  // Laser weapons have focused blue/cyan energy evolving to white with each level
  const chargeColors = [
    'oklch(0.8 0.25 200)', // Level 1: Cyan
    'oklch(0.85 0.3 190)', // Level 2: Bright cyan
    'oklch(0.9 0.35 180)', // Level 3: Light blue
    'oklch(0.95 0.4 170)', // Level 4: Brilliant white-blue
  ];
  
  const currentColor = chargeColors[Math.min(chargeData.level - 1, 3)] || chargeColors[0];
  const focusColor = chargeData.level >= 3 ? 'oklch(0.98 0.2 160)' : 'oklch(0.9 0.2 180)';
  
  // Focusing rings - more precise with higher charge levels
  const ringCount = 2 + chargeData.level;
  for (let ring = 0; ring < ringCount; ring++) {
    const ringRadius = size * (0.6 + ring * (0.3 / ringCount) + chargePercent * 0.4);
    const ringAlpha = (0.3 + chargeData.level * 0.1) - ring * 0.08;
    
    ctx.strokeStyle = ring === 0 ? focusColor : currentColor;
    ctx.lineWidth = 1 + chargeData.level * 0.5;
    ctx.globalAlpha = Math.max(0, ringAlpha);
    
    ctx.beginPath();
    if (safeArc(ctx, x, y, ringRadius, 0, Math.PI * 2)) {
      ctx.stroke();
    }
  }
  
  // Main laser charging ring with precise rotation
  const rotationSpeed = time * (0.02 + chargeData.level * 0.005);
  ctx.strokeStyle = currentColor;
  ctx.lineWidth = 2 + chargeData.level * 1;
  ctx.globalAlpha = 0.6 + chargeData.level * 0.1;
  
  if (chargeData.level >= 4) {
    ctx.globalAlpha = 0.95;
    // Maximum power shimmer
    ctx.shadowColor = currentColor;
    ctx.shadowBlur = 8 + Math.sin(time * 0.04) * 4;
  } else if (chargeData.level >= 3) {
    ctx.globalAlpha = 0.85;
    // Supercharged shimmer
    ctx.shadowColor = currentColor;
    ctx.shadowBlur = 5 + Math.sin(time * 0.03) * 3;
  }
  
  ctx.beginPath();
  const mainRadius = size * (1.1 + chargePercent * 0.6);
  if (safeArc(ctx, x, y, mainRadius, 0, Math.PI * 2)) {
    ctx.stroke();
  }
  
  ctx.shadowBlur = 0;
  
  // Laser focus points - more points at higher charge levels
  if (chargeData.level >= 2) {
    ctx.fillStyle = currentColor;
    ctx.globalAlpha = 0.7 + chargeData.level * 0.1;
    
    const pointCount = 4 + chargeData.level * 2;
    for (let i = 0; i < pointCount; i++) {
      const angle = rotationSpeed + i * (Math.PI * 2) / pointCount;
      const pointRadius = size * (1.0 + chargePercent * 0.5);
      const pointX = x + Math.cos(angle) * pointRadius;
      const pointY = y + Math.sin(angle) * pointRadius;
      
      const pointSize = 2 + chargeData.level * 0.8;
      
      ctx.beginPath();
      if (safeArc(ctx, pointX, pointY, pointSize, 0, Math.PI * 2)) {
        ctx.fill();
      }
      
      // Connecting lines for maximum charge level
      if (chargeData.level >= 4) {
        ctx.strokeStyle = focusColor;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(pointX, pointY);
        ctx.stroke();
      }
    }
  }
  
  // Central energy buildup for fully charged laser
  if (chargeData.level >= 4) {
    const fullChargeColor = 'oklch(0.98 0.4 160)';
    ctx.fillStyle = fullChargeColor;
    ctx.globalAlpha = 0.5 + Math.sin(time * 0.04) * 0.3;
    
    const coreSize = 3 + Math.sin(time * 0.035) * 2;
    ctx.beginPath();
    if (safeArc(ctx, x, y, coreSize, 0, Math.PI * 2)) {
      ctx.fill();
    }
  }
}

function drawRailgunChargeEffect(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  size: number, 
  chargePercent: number, 
  isCharging: boolean, 
  time: number,
  chargeData: any
): void {
  // Railgun has intense electrical charging with lightning-like effects
  const isFullyCharged = chargePercent >= 0.75;
  const baseColor = 'oklch(0.8 0.2 130)'; // Electric green/yellow
  const fullChargeColor = 'oklch(0.95 0.25 120)'; // Bright electric yellow
  const sparkColor = 'oklch(0.9 0.3 110)'; // Lightning white-yellow
  
  // Electric field buildup
  ctx.strokeStyle = isFullyCharged ? fullChargeColor : baseColor;
  ctx.lineWidth = 3 + chargePercent * 4;
  ctx.globalAlpha = 0.4 + chargePercent * 0.4;
  
  if (isFullyCharged) {
    ctx.globalAlpha = 0.8 + Math.sin(time * 0.05) * 0.2;
  }
  
  ctx.beginPath();
  const fieldRadius = size * (1.3 + chargePercent * 1.0);
  if (safeArc(ctx, x, y, fieldRadius, 0, Math.PI * 2)) {
    ctx.stroke();
  }
  
  // Electric arcs when charging
  if (chargePercent > 0.3) {
    ctx.strokeStyle = sparkColor;
    ctx.lineWidth = 1 + chargePercent;
    ctx.globalAlpha = 0.6 + chargePercent * 0.3;
    
    const numArcs = isFullyCharged ? 8 : Math.floor(chargePercent * 6);
    for (let i = 0; i < numArcs; i++) {
      const arcAngle = (time * 0.02 + i * Math.PI / 4) % (Math.PI * 2);
      const arcStartRadius = size * 0.7;
      const arcEndRadius = size * (1.1 + chargePercent * 0.5);
      
      const startX = x + Math.cos(arcAngle) * arcStartRadius;
      const startY = y + Math.sin(arcAngle) * arcStartRadius;
      const endX = x + Math.cos(arcAngle) * arcEndRadius;
      const endY = y + Math.sin(arcAngle) * arcEndRadius;
      
      // Jagged lightning path
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      
      const segments = 3;
      for (let seg = 1; seg <= segments; seg++) {
        const progress = seg / segments;
        const midX = startX + (endX - startX) * progress;
        const midY = startY + (endY - startY) * progress;
        
        // Add random jaggedness
        const jaggerX = midX + (Math.random() - 0.5) * size * 0.3;
        const jaggerY = midY + (Math.random() - 0.5) * size * 0.3;
        
        ctx.lineTo(jaggerX, jaggerY);
      }
      
      ctx.stroke();
    }
  }
  
  // Intense core when fully charged
  if (isFullyCharged) {
    // Pulsing electric core
    ctx.fillStyle = fullChargeColor;
    ctx.globalAlpha = 0.7 + Math.sin(time * 0.06) * 0.3;
    
    const coreSize = 4 + Math.sin(time * 0.04) * 3;
    ctx.beginPath();
    if (safeArc(ctx, x, y, coreSize, 0, Math.PI * 2)) {
      ctx.fill();
    }
    
    // Electric discharge sparks
    for (let i = 0; i < 12; i++) {
      if (Math.random() < 0.3) continue; // Random sparking
      
      const sparkAngle = Math.random() * Math.PI * 2;
      const sparkDistance = size * (1.2 + Math.random() * 0.8);
      const sparkX = x + Math.cos(sparkAngle) * sparkDistance;
      const sparkY = y + Math.sin(sparkAngle) * sparkDistance;
      
      ctx.fillStyle = sparkColor;
      ctx.globalAlpha = 0.7 + Math.random() * 0.3;
      ctx.beginPath();
      if (safeArc(ctx, sparkX, sparkY, 1 + Math.random() * 2, 0, Math.PI * 2)) {
        ctx.fill();
      }
    }
  }
}

function drawDefaultChargeEffect(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  size: number, 
  chargePercent: number, 
  isCharging: boolean, 
  time: number,
  chargeData: any
): void {
  // Default charge effect for basic and other weapons
  const isFullyCharged = chargePercent >= 0.75;
  const baseColor = 'oklch(0.8 0.25 200)';
  const fullChargeColor = 'oklch(0.9 0.3 130)';
  
  // Primary charging energy ring
  ctx.strokeStyle = isFullyCharged ? fullChargeColor : baseColor;
  ctx.lineWidth = 2 + chargePercent * 3;
  ctx.globalAlpha = 0.4 + chargePercent * 0.4;
  
  if (isFullyCharged) {
    ctx.globalAlpha = 0.8 + Math.sin(time * 0.02) * 0.2;
  }
  
  ctx.beginPath();
  if (safeArc(ctx, x, y, size * (1.2 + chargePercent * 0.8), 0, Math.PI * 2)) {
    ctx.stroke();
  }
  
  // Secondary charge ring when building up
  if (chargePercent > 0.3) {
    ctx.strokeStyle = isFullyCharged ? 'oklch(0.95 0.25 130)' : 'oklch(0.7 0.2 200)';
    ctx.lineWidth = 1 + chargePercent * 2;
    ctx.globalAlpha = 0.3 + chargePercent * 0.3;
    
    ctx.beginPath();
    if (safeArc(ctx, x, y, size * (0.8 + chargePercent * 0.4), 0, Math.PI * 2)) {
      ctx.stroke();
    }
  }
  
  // Inner energy particles for full charge
  if (isFullyCharged) {
    ctx.fillStyle = 'oklch(0.95 0.25 130)';
    for (let i = 0; i < 8; i++) {
      const angle = (time * 0.015 + i * Math.PI / 4) % (Math.PI * 2);
      const radius = size * (0.6 + Math.sin(time * 0.01 + i) * 0.2);
      const particleX = x + Math.cos(angle) * radius;
      const particleY = y + Math.sin(angle) * radius;
      ctx.beginPath();
      if (safeArc(ctx, particleX, particleY, 2 + Math.sin(time * 0.02 + i) * 1, 0, Math.PI * 2)) {
        ctx.fill();
      }
    }
  }
}