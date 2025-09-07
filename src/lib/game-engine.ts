import { GameState, Player, Enemy, Projectile, PowerUp, Particle, Controls, GAME_CONFIG, PowerUpType, StarLayer, Star, EnemyType, WeaponType, GameMode, Mission, getChargeLevel, CampaignProgress } from './game-types';
import { getAudioSystem } from './audio-system';
import { 
  createWeaponUpgrade, 
  createWeaponProjectile, 
  updateProjectile, 
  handleProjectileCollision, 
  findClosestEnemy,
  upgradeWeapon,
  playWeaponSound
} from './weapon-system';
import { updateMissionObjectives, checkMissionComplete } from './campaign-system';
import { createSectorMap, triggerSectorEvent, applyAnomalyEffect } from './space-sector-system';

export function createStarLayers(): StarLayer[] {
  const layers: StarLayer[] = [];
  
  // Background layer - large, slow, dim stars
  layers.push({
    stars: generateStars(30, 0.3, 1.5, 3),
    speed: 0.3,
    color: 'oklch(0.5 0.05 200)',
    density: 30
  });
  
  // Middle layer - medium stars
  layers.push({
    stars: generateStars(60, 0.8, 1, 2),
    speed: 0.8,
    color: 'oklch(0.7 0.08 200)',
    density: 60
  });
  
  // Foreground layer - small, fast, bright stars
  layers.push({
    stars: generateStars(40, 1.5, 0.5, 1.5),
    speed: 1.5,
    color: 'oklch(0.9 0.1 200)',
    density: 40
  });
  
  // Shooting star layer - rare, fast streaks
  layers.push({
    stars: generateShootingStars(3),
    speed: 4.0,
    color: 'oklch(0.95 0.15 180)',
    density: 3
  });
  
  return layers;
}

function generateShootingStars(count: number): Star[] {
  const stars: Star[] = [];
  
  for (let i = 0; i < count; i++) {
    // Ensure shooting star size is always positive
    const starSize = Math.max(0.5, 1 + Math.random() * 2);
    
    stars.push({
      x: Math.random() * GAME_CONFIG.CANVAS_WIDTH,
      y: -50 - Math.random() * GAME_CONFIG.CANVAS_HEIGHT, // Start above screen
      size: starSize,
      brightness: 0.8 + Math.random() * 0.2,
      speed: 3 + Math.random() * 2,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.05 + Math.random() * 0.05
    });
  }
  
  return stars;
}

function generateStars(count: number, speed: number, minSize: number, maxSize: number): Star[] {
  const stars: Star[] = [];
  
  for (let i = 0; i < count; i++) {
    // Ensure star size is always positive
    const starSize = Math.max(0.1, minSize + Math.random() * (maxSize - minSize));
    
    stars.push({
      x: Math.random() * GAME_CONFIG.CANVAS_WIDTH,
      y: Math.random() * GAME_CONFIG.CANVAS_HEIGHT,
      size: starSize,
      brightness: 0.3 + Math.random() * 0.7,
      speed: speed * (0.8 + Math.random() * 0.4), // Add some variation
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.02 + Math.random() * 0.03
    });
  }
  
  return stars;
}

export function updateStarLayers(starLayers: StarLayer[], deltaTime: number): StarLayer[] {
  return starLayers.map(layer => ({
    ...layer,
    stars: layer.stars.map(star => {
      let newY = star.y + star.speed * (deltaTime / 16); // Normalize to ~60fps
      let newTwinklePhase = star.twinklePhase + star.twinkleSpeed * (deltaTime / 16);
      
      // Wrap around when star goes off screen
      if (newY > GAME_CONFIG.CANVAS_HEIGHT + 10) {
        newY = -10;
        // Respawn at random x position
        return {
          ...star,
          x: Math.random() * GAME_CONFIG.CANVAS_WIDTH,
          y: newY,
          twinklePhase: newTwinklePhase
        };
      }
      
      return {
        ...star,
        y: newY,
        twinklePhase: newTwinklePhase
      };
    })
  }));
}

// Particle system for explosion effects (optimized for performance)
export function createExplosionParticles(x: number, y: number, count: number = 8, size: number = 1): Particle[] {
  const particles: Particle[] = [];
  
  // Reduce particle count for better performance
  const actualCount = Math.min(count, 8); // Cap at 8 particles maximum
  
  for (let i = 0; i < actualCount; i++) {
    const angle = (i / actualCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const speed = 2 + Math.random() * 3; // Slightly reduced speed
    const particleSize = Math.max(1, (2 + Math.random() * 2) * Math.max(0.1, size)); // Reduced size variance
    const life = 600 + Math.random() * 300; // Slightly reduced lifetime
    
    // Different particle types for variety
    const types = ['explosion', 'spark', 'debris'] as const;
    const type = types[Math.floor(Math.random() * types.length)];
    
    // Color based on type
    let color;
    switch (type) {
      case 'explosion':
        color = `oklch(${0.7 + Math.random() * 0.2} 0.3 ${Math.random() * 60})`;
        break;
      case 'spark':
        color = `oklch(${0.8 + Math.random() * 0.2} 0.2 ${180 + Math.random() * 60})`;
        break;
      case 'debris':
        color = `oklch(${0.4 + Math.random() * 0.3} 0.1 ${Math.random() * 360})`;
        break;
    }
    
    particles.push({
      id: `particle_${Date.now()}_${i}`,
      position: { 
        x: x + (Math.random() - 0.5) * 8, // Reduced spread
        y: y + (Math.random() - 0.5) * 8 
      },
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
      },
      size: particleSize,
      life: life,
      maxLife: life,
      color: color,
      type: type
    });
  }
  
  return particles;
}

// Create trail particles for player ship (optimized for performance)
export function createTrailParticles(x: number, y: number, powerUpActive: boolean = false): Particle[] {
  const particles: Particle[] = [];
  const particleCount = powerUpActive ? 2 : 1; // Reduced from 3:2 for performance
  
  for (let i = 0; i < particleCount; i++) {
    const offsetX = (Math.random() - 0.5) * 6; // Reduced spread
    const offsetY = Math.random() * 4 + 4; // Reduced trail length
    const particleSize = Math.max(1, 1 + Math.random()); // Reduced max size
    const life = 200 + Math.random() * 100; // Shorter-lived for performance
    
    // Color based on whether power-ups are active
    let color;
    if (powerUpActive) {
      // More vibrant trail when power-ups are active
      color = `oklch(${0.8 + Math.random() * 0.15} 0.25 ${60 + Math.random() * 40})`;
    } else {
      // Standard blue/cyan engine trail
      color = `oklch(${0.7 + Math.random() * 0.2} 0.2 ${180 + Math.random() * 40})`;
    }
    
    particles.push({
      id: `trail_${Date.now()}_${i}`,
      position: { 
        x: x + offsetX, 
        y: y + offsetY 
      },
      velocity: {
        x: (Math.random() - 0.5) * 0.3, // Reduced sideways movement
        y: 1 + Math.random() * 0.5 // Reduced backwards drift
      },
      size: particleSize,
      life: life,
      maxLife: life,
      color: color,
      type: 'trail'
    });
  }
  
  return particles;
}

export function updateParticles(particles: Particle[], deltaTime: number): Particle[] {
  return particles
    .map(particle => {
      const newLife = particle.life - deltaTime;
      
      // Update position
      const newPosition = {
        x: particle.position.x + particle.velocity.x * (deltaTime / 16),
        y: particle.position.y + particle.velocity.y * (deltaTime / 16)
      };
      
      // Apply gravity and drag based on particle type
      let newVelocity = { ...particle.velocity };
      
      switch (particle.type) {
        case 'explosion':
          // Explosion particles slow down quickly
          newVelocity.x *= 0.98;
          newVelocity.y *= 0.98;
          newVelocity.y += 0.1; // Slight gravity
          break;
        case 'spark':
          // Sparks have more linear motion but fade quickly
          newVelocity.x *= 0.995;
          newVelocity.y *= 0.995;
          break;
        case 'debris':
          // Debris falls with gravity
          newVelocity.y += 0.2;
          newVelocity.x *= 0.99;
          break;
        case 'trail':
          // Trail particles fade and slow down gradually
          newVelocity.x *= 0.99;
          newVelocity.y *= 0.98;
          newVelocity.y += 0.05; // Very slight gravity
          break;
      }
      
      return {
        ...particle,
        position: newPosition,
        velocity: newVelocity,
        life: newLife
      };
    })
    .filter(particle => particle.life > 0); // Remove dead particles
}

// Optimized particle update with better memory management and performance
function updateParticlesOptimized(particles: Particle[], deltaTime: number): Particle[] {
  const alive: Particle[] = [];
  const dtNormalized = deltaTime / 16;
  
  // If we have too many particles, aggressively cull the oldest ones
  let particlesToProcess = particles;
  if (particles.length > GAME_CONFIG.MAX_PARTICLES) {
    // Sort by life remaining and keep only the newer ones
    particlesToProcess = particles
      .sort((a, b) => (b.life / b.maxLife) - (a.life / a.maxLife))
      .slice(0, GAME_CONFIG.MAX_PARTICLES);
  }
  
  for (let i = 0; i < particlesToProcess.length; i++) {
    const particle = particlesToProcess[i];
    const newLife = particle.life - deltaTime;
    
    if (newLife <= 0) continue; // Skip dead particles
    
    // Update position (inline for performance)
    const newX = particle.position.x + particle.velocity.x * dtNormalized;
    const newY = particle.position.y + particle.velocity.y * dtNormalized;
    
    // Update velocity based on particle type (optimized)
    let velX = particle.velocity.x;
    let velY = particle.velocity.y;
    
    switch (particle.type) {
      case 'explosion':
        velX *= 0.98;
        velY = velY * 0.98 + 0.1;
        break;
      case 'spark':
        velX *= 0.995;
        velY *= 0.995;
        break;
      case 'debris':
        velX *= 0.99;
        velY += 0.2;
        break;
      case 'trail':
        velX *= 0.99;
        velY = velY * 0.98 + 0.05;
        break;
    }
    
    // Reuse object where possible
    alive.push({
      ...particle,
      position: { x: newX, y: newY },
      velocity: { x: velX, y: velY },
      life: newLife
    });
  }
  
  return alive;
}

// Screen shake system
export function triggerScreenShake(state: GameState, intensity: number, duration: number): GameState {
  return {
    ...state,
    screenShake: {
      intensity,
      duration,
      offsetX: 0,
      offsetY: 0,
    }
  };
}

export function updateScreenShake(state: GameState, deltaTime: number): GameState {
  if (state.screenShake.duration <= 0) {
    return {
      ...state,
      screenShake: {
        intensity: 0,
        duration: 0,
        offsetX: 0,
        offsetY: 0,
      }
    };
  }

  const newDuration = Math.max(0, state.screenShake.duration - deltaTime);
  const progress = newDuration / state.screenShake.duration;
  const currentIntensity = state.screenShake.intensity * progress;

  // Generate random offset based on current intensity
  const offsetX = (Math.random() - 0.5) * currentIntensity * 2;
  const offsetY = (Math.random() - 0.5) * currentIntensity * 2;

  return {
    ...state,
    screenShake: {
      ...state.screenShake,
      duration: newDuration,
      offsetX,
      offsetY,
    }
  };
}

export function createInitialGameState(gameMode: GameMode = 'arcade', mission?: Mission, campaignProgress?: CampaignProgress): GameState {
  const sectorMap = gameMode === 'exploration' ? createSectorMap() : undefined;
  
  // Calculate charge decay rate modifier based on campaign upgrades
  let chargeDecayRateMultiplier = 1.0;
  if (campaignProgress?.shipUpgrades.chargePreservation) {
    // Each level reduces decay rate by 15% (0.85 multiplier per level)
    chargeDecayRateMultiplier = Math.pow(0.85, campaignProgress.shipUpgrades.chargePreservation);
  }
  
  const modifiedChargeDecayRate = GAME_CONFIG.WEAPON_SYSTEM.CHARGE_DECAY_RATE * chargeDecayRateMultiplier;
  
  return {
    player: {
      id: 'player',
      position: { x: GAME_CONFIG.CANVAS_WIDTH / 2, y: GAME_CONFIG.CANVAS_HEIGHT - 50 },
      velocity: { x: 0, y: 0 },
      size: GAME_CONFIG.PLAYER_SIZE,
      active: true,
      lives: GAME_CONFIG.PLAYER_LIVES,
      invulnerable: false,
      invulnerabilityTime: 0,
      currentWeapon: createWeaponUpgrade('basic', 1),
      weaponLevel: 1,
      trailParticles: [],
      powerUps: {
        rapidFire: 0,
        shield: 0,
        multiShot: 0,
      },
      weaponSystem: {
        heat: 0,
        maxHeat: GAME_CONFIG.WEAPON_SYSTEM.MAX_HEAT,
        coolingRate: GAME_CONFIG.WEAPON_SYSTEM.COOLING_RATE,
        chargeLevel: 0,
        maxCharge: GAME_CONFIG.WEAPON_SYSTEM.MAX_CHARGE,
        chargingRate: GAME_CONFIG.WEAPON_SYSTEM.CHARGING_RATE,
        isOverheated: false,
        overheatCooldown: 0,
        lastChargeStart: 0,
        lastChargeRelease: 0,
        chargeDecayRate: modifiedChargeDecayRate,
        chargeDecayDelay: GAME_CONFIG.WEAPON_SYSTEM.CHARGE_DECAY_DELAY,
        energy: 100,
        maxEnergy: 100,
        energyRegenRate: 10, // 10 energy per second
        weaponSlots: [createWeaponUpgrade('basic', 1)],
        activeWeaponIndex: 0,
      },
    },
    enemies: [],
    projectiles: [],
    powerUps: [],
    particles: [],
    starLayers: createStarLayers(),
    score: 0,
    level: 1,
    gameStatus: 'menu',
    gameMode,
    currentMission: mission,
    missionProgress: mission ? {
      timeElapsed: 0,
      objectivesCompleted: 0,
      bonusObjectivesCompleted: 0
    } : undefined,
    lastEnemySpawn: 0,
    lastShot: 0,
    lastPowerUpSpawn: 0,
    lastBossSpawn: 0,
    bossActive: false,
    screenShake: {
      intensity: 0,
      duration: 0,
      offsetX: 0,
      offsetY: 0,
    },
    sectorMap,
    activeEvent: undefined,
    sectorEffects: [],
    campaignProgress: gameMode === 'campaign' ? campaignProgress : undefined,
  };
}

export function updateGameState(state: GameState, controls: Controls, deltaTime: number): GameState {
  try {
    const newState = { ...state };
    const currentTime = Date.now();
    
    // Cap deltaTime to prevent huge jumps that cause lag
    const cappedDeltaTime = Math.min(deltaTime, 32); // Max 32ms per frame (~30fps minimum)
    
    // Always update star layers for continuous parallax effect, even when paused
    newState.starLayers = updateStarLayers(newState.starLayers, cappedDeltaTime);
    
    // Always update particles for visual effects, even when paused (optimized)
    newState.particles = updateParticlesOptimized(newState.particles, cappedDeltaTime);
    
    // Update sector effects
    if (newState.sectorEffects.length > 0) {
      newState.sectorEffects = updateSectorEffects(newState.sectorEffects, cappedDeltaTime);
      applySectorEffectsToGameplay(newState, cappedDeltaTime);
    }
    
    // Always update screen shake, even when paused
    Object.assign(newState, updateScreenShake(newState, cappedDeltaTime));
    
    // Only validate objects occasionally to reduce overhead
    if (currentTime % 500 < cappedDeltaTime) { // Validate every ~500ms
      validateGameObjects(newState);
    }
    
    // Handle boss intro animation
    if (state.gameStatus === 'bossIntro') {
      newState.bossAnimationTime = (newState.bossAnimationTime || 0) + deltaTime;
    
    // Update boss position during intro
    const boss = newState.enemies.find(enemy => enemy.type === 'boss');
    if (boss) {
      // Update boss's individual animation time
      boss.animationTime = (boss.animationTime || 0) + deltaTime;
      updateBossIntroAnimation(boss, newState.bossAnimationTime);
      
      // Transition to playing after intro duration
      if (newState.bossAnimationTime >= GAME_CONFIG.BOSS_INTRO_DURATION) {
        newState.gameStatus = 'playing';
        boss.bossState = 'active';
        boss.introComplete = true;
      }
    }
    
    return newState;
  }
  
  // Handle boss defeat animation
  if (state.gameStatus === 'bossDefeat') {
    newState.bossAnimationTime = (newState.bossAnimationTime || 0) + deltaTime;
    
    // Update boss defeat animation
    const boss = newState.enemies.find(enemy => enemy.type === 'boss');
    if (boss) {
      updateBossDefeatAnimation(boss, newState.bossAnimationTime);
      
      // Add continuous explosion particles during defeat animation (limited)
      if (Math.random() < 0.2 && newState.particles.length < GAME_CONFIG.MAX_PARTICLES - 5) { // Reduced chance and limited
        const additionalParticles = createExplosionParticles(
          boss.position.x + (Math.random() - 0.5) * boss.size * 1.5,
          boss.position.y + (Math.random() - 0.5) * boss.size * 1.5,
          2, // Fewer particles per burst
          1.0 // Smaller particles
        );
        newState.particles.push(...additionalParticles);
      }
      
      // Clean up and return to playing after defeat animation
      if (newState.bossAnimationTime >= GAME_CONFIG.BOSS_DEFEAT_DURATION) {
        newState.gameStatus = 'playing';
        newState.enemies = newState.enemies.filter(enemy => enemy.type !== 'boss');
        newState.bossActive = false;
        newState.bossAnimationTime = undefined;
        
        // Award bonus score for boss defeat
        if (newState.defeatedBossScore) {
          newState.score += newState.defeatedBossScore;
          newState.defeatedBossScore = undefined;
        }
      }
    }
    
    return newState;
  }
  
  if (state.gameStatus !== 'playing') return newState;
  
  // Update mission progress if in campaign mode
  if (state.gameMode === 'campaign' && state.currentMission && state.missionProgress) {
    state.missionProgress.timeElapsed += deltaTime;
    updateMissionObjectives(state.currentMission, state, 'timeUpdate');
    
    // Check if mission is complete
    if (checkMissionComplete(state.currentMission)) {
      state.gameStatus = 'missionComplete';
    }
  }

  // Update player power-ups
  updatePlayerPowerUps(newState.player, cappedDeltaTime);

  // Update player
  newState.player = updatePlayer(newState.player, controls, cappedDeltaTime);

  // Create trail particles for player ship (throttled to reduce particle count)
  if (!newState.lastTrailSpawn || currentTime - newState.lastTrailSpawn > 50) { // Only every 50ms
    const powerUpActive = newState.player.powerUps.rapidFire > 0 || newState.player.powerUps.shield > 0 || newState.player.powerUps.multiShot > 0;
    const trailParticles = createTrailParticles(
      newState.player.position.x, 
      newState.player.position.y + newState.player.size * 0.5, 
      powerUpActive
    );
    
    // Only add particles if we haven't exceeded the limit
    if (newState.particles.length < GAME_CONFIG.MAX_PARTICLES) {
      newState.particles.push(...trailParticles);
    }
    newState.lastTrailSpawn = currentTime;
  }

  // Handle weapon system updates (charging, overheating, shooting)
  newState.player = updateWeaponSystem(newState.player, controls, currentTime, cappedDeltaTime);
  
  // Handle shooting with new weapon system
  const shootingResult = handleWeaponShooting(newState.player, controls, currentTime, newState.enemies, newState);
  if (shootingResult.canShoot && shootingResult.projectiles) {
    newState.projectiles.push(...shootingResult.projectiles);
    newState.lastShot = currentTime;
    newState.player = shootingResult.updatedPlayer;
  }

  // Spawn enemies
  if (state.gameMode === 'arcade') {
    // Original arcade mode spawning (only if no boss is active)
    if (!newState.bossActive && currentTime - newState.lastEnemySpawn > GAME_CONFIG.ENEMY_SPAWN_RATE / newState.level) {
      newState.enemies.push(createEnemy());
      newState.lastEnemySpawn = currentTime;
    }

    // Spawn boss enemies in arcade mode
    if (!newState.bossActive && currentTime - newState.lastBossSpawn > GAME_CONFIG.BOSS_SPAWN_RATE) {
      const boss = createBoss();
      newState.enemies.push(boss);
      newState.lastBossSpawn = currentTime;
      newState.bossActive = true;
      newState.gameStatus = 'bossIntro';
      newState.bossAnimationTime = 0;
      
      // Play boss intro sound
      getAudioSystem().playBossIntro();
    }
  } else if (state.gameMode === 'campaign' && state.currentMission && state.missionProgress) {
    // Mission-based spawning
    spawnMissionEnemies(newState, state.currentMission, state.missionProgress.timeElapsed, currentTime);
  }

  // Spawn power-ups
  if (currentTime - newState.lastPowerUpSpawn > GAME_CONFIG.POWER_UP_SPAWN_RATE) {
    newState.powerUps.push(createPowerUp());
    newState.lastPowerUpSpawn = currentTime;
  }

  // Update enemies
  newState.enemies = newState.enemies
    .map(enemy => updateEnemy(enemy, deltaTime, currentTime, newState.projectiles))
    .filter(enemy => enemy.active && enemy.position.y < GAME_CONFIG.CANVAS_HEIGHT + 50);

  // Check if boss is still active
  const bossExists = newState.enemies.some(enemy => enemy.type === 'boss');
  if (newState.bossActive && !bossExists) {
    newState.bossActive = false;
  }

  // Update projectiles with weapon system
  newState.projectiles = newState.projectiles
    .map(projectile => updateProjectile(projectile, deltaTime, newState.enemies))
    .filter(projectile => 
      projectile.active && 
      projectile.position.y > -10 && 
      projectile.position.y < GAME_CONFIG.CANVAS_HEIGHT + 10 &&
      projectile.position.x > -10 &&
      projectile.position.x < GAME_CONFIG.CANVAS_WIDTH + 10
    );

  // Update power-ups
  newState.powerUps = newState.powerUps
    .map(powerUp => updatePowerUp(powerUp, deltaTime))
    .filter(powerUp => powerUp.active && powerUp.position.y < GAME_CONFIG.CANVAS_HEIGHT + 50);

  // Handle collisions
  handleCollisions(newState);

  // Update invulnerability
  if (newState.player.invulnerable) {
    newState.player.invulnerabilityTime -= deltaTime;
    if (newState.player.invulnerabilityTime <= 0) {
      newState.player.invulnerable = false;
    }
  }

  // Check game over
  if (newState.player.lives <= 0) {
    newState.gameStatus = 'gameOver';
  }

  return newState;
  } catch (error) {
    console.error('Error in game state update:', error);
    // Return previous state to prevent crashes
    return state;
  }
}

// Validation function to prevent object corruption
function validateGameObjects(state: GameState): void {
  // Validate player size
  if (state.player.size <= 0 || !isFinite(state.player.size)) {
    console.warn('Invalid player size detected, resetting to default');
    state.player.size = GAME_CONFIG.PLAYER_SIZE;
  }
  
  // Validate enemy sizes
  state.enemies.forEach(enemy => {
    if (enemy.size <= 0 || !isFinite(enemy.size)) {
      console.warn('Invalid enemy size detected, resetting to default');
      enemy.size = enemy.type === 'boss' ? GAME_CONFIG.BOSS_SIZE : GAME_CONFIG.ENEMY_SIZE;
    }
  });
  
  // Validate particle sizes
  state.particles.forEach(particle => {
    if (particle.size <= 0 || !isFinite(particle.size)) {
      console.warn('Invalid particle size detected, removing particle');
      particle.life = 0; // Mark for removal
    }
  });
  
  // Validate projectile sizes
  state.projectiles.forEach(projectile => {
    if (projectile.size <= 0 || !isFinite(projectile.size)) {
      console.warn('Invalid projectile size detected, resetting to default');
      projectile.size = GAME_CONFIG.PROJECTILE_SIZE;
    }
  });
}

function updatePlayer(player: Player, controls: Controls, deltaTime: number): Player {
  const newPlayer = { ...player };
  
  // Movement
  if (controls.left) newPlayer.velocity.x = -GAME_CONFIG.PLAYER_SPEED;
  else if (controls.right) newPlayer.velocity.x = GAME_CONFIG.PLAYER_SPEED;
  else newPlayer.velocity.x = 0;

  if (controls.up) newPlayer.velocity.y = -GAME_CONFIG.PLAYER_SPEED;
  else if (controls.down) newPlayer.velocity.y = GAME_CONFIG.PLAYER_SPEED;
  else newPlayer.velocity.y = 0;

  // Apply movement
  newPlayer.position.x += newPlayer.velocity.x;
  newPlayer.position.y += newPlayer.velocity.y;

  // Boundary checking
  newPlayer.position.x = Math.max(newPlayer.size, Math.min(GAME_CONFIG.CANVAS_WIDTH - newPlayer.size, newPlayer.position.x));
  newPlayer.position.y = Math.max(newPlayer.size, Math.min(GAME_CONFIG.CANVAS_HEIGHT - newPlayer.size, newPlayer.position.y));

  return newPlayer;
}

function updatePlayerPowerUps(player: Player, deltaTime: number): void {
  // Decay power-up timers
  player.powerUps.rapidFire = Math.max(0, player.powerUps.rapidFire - deltaTime);
  player.powerUps.shield = Math.max(0, player.powerUps.shield - deltaTime);
  player.powerUps.multiShot = Math.max(0, player.powerUps.multiShot - deltaTime);
}

function createPowerUp(): PowerUp {
  const types: PowerUpType[] = ['rapidFire', 'shield', 'multiShot', 'weaponUpgrade'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  let weaponType: WeaponType | undefined;
  if (type === 'weaponUpgrade') {
    const weaponTypes: WeaponType[] = ['laserCannon', 'plasmaBeam', 'homingMissiles'];
    weaponType = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
  }
  
  return {
    id: `powerup-${Date.now()}-${Math.random()}`,
    position: { 
      x: Math.random() * (GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.POWER_UP_SIZE * 2) + GAME_CONFIG.POWER_UP_SIZE,
      y: -GAME_CONFIG.POWER_UP_SIZE 
    },
    velocity: { x: 0, y: GAME_CONFIG.ENEMY_SPEED * 0.8 },
    size: GAME_CONFIG.POWER_UP_SIZE,
    active: true,
    type,
    duration: type === 'shield' ? GAME_CONFIG.SHIELD_DURATION : GAME_CONFIG.POWER_UP_DURATION,
    weaponType,
  };
}

function updatePowerUp(powerUp: PowerUp, deltaTime: number): PowerUp {
  return {
    ...powerUp,
    position: {
      x: powerUp.position.x + powerUp.velocity.x,
      y: powerUp.position.y + powerUp.velocity.y,
    },
  };
}

function createProjectile(x: number, y: number, isPlayerProjectile: boolean): Projectile {
  return {
    id: `projectile-${Date.now()}-${Math.random()}`,
    position: { x, y },
    velocity: { x: 0, y: isPlayerProjectile ? -GAME_CONFIG.PROJECTILE_SPEED : GAME_CONFIG.PROJECTILE_SPEED },
    size: GAME_CONFIG.PROJECTILE_SIZE,
    active: true,
    damage: 1,
    isPlayerProjectile,
    weaponType: 'basic',
  };
}

function spawnMissionEnemies(state: GameState, mission: Mission, timeElapsed: number, currentTime: number): void {
  // Check each enemy wave in the mission
  mission.enemyWaves.forEach(wave => {
    // Check if it's time to spawn this wave
    if (timeElapsed >= wave.delay && !wave.spawned) {
      // Mark wave as spawned to prevent duplicate spawning
      (wave as any).spawned = true;
      
      // Spawn the specified number of enemies
      for (let i = 0; i < wave.count; i++) {
        if (wave.enemyType === 'boss' && wave.bossType) {
          if (!state.bossActive) {
            const boss = createBossWithType(wave.bossType);
            state.enemies.push(boss);
            state.bossActive = true;
            state.gameStatus = 'bossIntro';
            state.bossAnimationTime = 0;
            
            // Play boss intro sound
            getAudioSystem().playBossIntro();
          }
        } else if (wave.enemyType === 'basic') {
          // Add slight delay between spawning multiple enemies in the same wave
          setTimeout(() => {
            if (state.gameStatus === 'playing') {
              state.enemies.push(createEnemy());
            }
          }, i * 500); // 500ms delay between each enemy
        }
      }
    }
  });
}

function createBossWithType(bossType: string): Enemy {
  const boss = createBoss();
  boss.bossType = bossType as any;
  return boss;
}

function createEnemy(): Enemy {
  return {
    id: `enemy-${Date.now()}-${Math.random()}`,
    position: { 
      x: Math.random() * (GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.ENEMY_SIZE * 2) + GAME_CONFIG.ENEMY_SIZE,
      y: -GAME_CONFIG.ENEMY_SIZE 
    },
    velocity: { x: 0, y: GAME_CONFIG.ENEMY_SPEED },
    size: GAME_CONFIG.ENEMY_SIZE,
    active: true,
    health: 1,
    maxHealth: 1,
    points: 100,
    type: 'basic',
  };
}

function createBoss(): Enemy {
  // Define different boss types with unique characteristics
  const bossTypes = [
    {
      type: 'destroyer' as const,
      health: 50,
      points: 1000,
      size: GAME_CONFIG.BOSS_SIZE,
      movementPattern: 'zigzag' as const,
      shootPattern: 'triple' as const,
      specialAbility: undefined,
      color: 'destructive' // Red/orange
    },
    {
      type: 'interceptor' as const,
      health: 35,
      points: 1200,
      size: GAME_CONFIG.BOSS_SIZE * 0.8,
      movementPattern: 'dive' as const,
      shootPattern: 'burst' as const,
      specialAbility: 'rapidFire' as const,
      color: 'primary' // Blue
    },
    {
      type: 'titan' as const,
      health: 80,
      points: 1500,
      size: GAME_CONFIG.BOSS_SIZE * 1.3,
      movementPattern: 'fortress' as const,
      shootPattern: 'spread' as const,
      specialAbility: 'shield' as const,
      color: 'secondary' // Purple
    },
    {
      type: 'phantom' as const,
      health: 40,
      points: 1800,
      size: GAME_CONFIG.BOSS_SIZE * 0.9,
      movementPattern: 'teleport' as const,
      shootPattern: 'homing' as const,
      specialAbility: 'teleport' as const,
      color: 'accent' // Green
    },
    {
      type: 'vortex' as const,
      health: 60,
      points: 2000,
      size: GAME_CONFIG.BOSS_SIZE * 1.1,
      movementPattern: 'spiral' as const,
      shootPattern: 'laser' as const,
      specialAbility: undefined,
      color: 'primary' // Blue
    },
    {
      type: 'guardian' as const,
      health: 100,
      points: 2500,
      size: GAME_CONFIG.BOSS_SIZE * 1.5,
      movementPattern: 'weave' as const,
      shootPattern: 'shield' as const,
      specialAbility: 'heal' as const,
      color: 'destructive' // Red
    },
    {
      type: 'dreadnought' as const,
      health: 120,
      points: 3000,
      size: GAME_CONFIG.BOSS_SIZE * 1.7,
      movementPattern: 'fortress' as const,
      shootPattern: 'barrage' as const,
      specialAbility: 'armor' as const,
      color: 'secondary' // Purple
    },
    {
      type: 'wraith' as const,
      health: 45,
      points: 2200,
      size: GAME_CONFIG.BOSS_SIZE * 0.7,
      movementPattern: 'phase' as const,
      shootPattern: 'snipe' as const,
      specialAbility: 'cloak' as const,
      color: 'accent' // Green
    },
    {
      type: 'leviathan' as const,
      health: 150,
      points: 4000,
      size: GAME_CONFIG.BOSS_SIZE * 2.0,
      movementPattern: 'serpentine' as const,
      shootPattern: 'omni' as const,
      specialAbility: 'rampage' as const,
      color: 'destructive' // Red
    },
    {
      type: 'nexus' as const,
      health: 90,
      points: 3500,
      size: GAME_CONFIG.BOSS_SIZE * 1.4,
      movementPattern: 'orbit' as const,
      shootPattern: 'swarm' as const,
      specialAbility: 'spawn' as const,
      color: 'primary' // Blue
    }
  ];
  
  const selectedBoss = bossTypes[Math.floor(Math.random() * bossTypes.length)];
  
  return {
    id: `boss-${Date.now()}-${Math.random()}`,
    position: { 
      x: GAME_CONFIG.CANVAS_WIDTH / 2,
      y: -selectedBoss.size * 2 // Start higher for intro animation
    },
    velocity: { x: 0, y: GAME_CONFIG.ENEMY_SPEED * 0.5 },
    size: selectedBoss.size,
    active: true,
    health: selectedBoss.health,
    maxHealth: selectedBoss.health,
    points: selectedBoss.points,
    type: 'boss',
    bossType: selectedBoss.type,
    lastShot: 0,
    movementPattern: selectedBoss.movementPattern,
    shootPattern: selectedBoss.shootPattern,
    specialAbility: selectedBoss.specialAbility,
    movementPhase: 0,
    originalX: GAME_CONFIG.CANVAS_WIDTH / 2,
    bossState: 'intro',
    animationTime: 0,
    introComplete: false,
    defeatAnimationStarted: false,
    abilityTimer: 0,
    abilityActive: false,
    teleportTimer: 0,
    shieldStrength: selectedBoss.specialAbility === 'shield' ? 10 : 0,
  };
}

function updateEnemy(enemy: Enemy, deltaTime: number, currentTime: number, projectiles: Projectile[]): Enemy {
  const updatedEnemy = { ...enemy };
  
  if (enemy.type === 'boss') {
    return updateBoss(updatedEnemy, deltaTime, currentTime, projectiles);
  }
  
  // Basic enemy movement
  return {
    ...updatedEnemy,
    position: {
      x: enemy.position.x + enemy.velocity.x,
      y: enemy.position.y + enemy.velocity.y,
    },
  };
}

function updateBoss(boss: Enemy, deltaTime: number, currentTime: number, projectiles: Projectile[]): Enemy {
  const updatedBoss = { ...boss };
  
  // Handle boss intro state - allow movement and shooting after intro animation starts
  if (boss.bossState === 'intro' && boss.animationTime && boss.animationTime > 500) {
    // Start attacking 0.5 seconds into intro animation for more immediate engagement
    updatedBoss.bossState = 'active';
  }
  
  // Only do normal movement and shooting when boss is active
  if (boss.bossState !== 'active') {
    return updatedBoss;
  }
  
  // Update movement phase and timers
  updatedBoss.movementPhase = (updatedBoss.movementPhase || 0) + deltaTime * 0.001;
  updatedBoss.abilityTimer = (updatedBoss.abilityTimer || 0) + deltaTime;
  updatedBoss.teleportTimer = (updatedBoss.teleportTimer || 0) + deltaTime;
  
  // Handle special abilities
  if (boss.specialAbility) {
    switch (boss.specialAbility) {
      case 'teleport':
        // Phantom boss teleports every 3 seconds
        if (updatedBoss.teleportTimer > 3000) {
          updatedBoss.position.x = Math.random() * (GAME_CONFIG.CANVAS_WIDTH - boss.size * 2) + boss.size;
          updatedBoss.position.y = 50 + Math.random() * 100; // Stay in upper area
          updatedBoss.teleportTimer = 0;
        }
        break;
        
      case 'shield':
        // Titan boss regenerates shield every 5 seconds
        if (updatedBoss.abilityTimer > 5000 && (updatedBoss.shieldStrength || 0) <= 0) {
          updatedBoss.shieldStrength = 10;
          updatedBoss.abilityTimer = 0;
        }
        break;
        
      case 'rapidFire':
        // Interceptor boss activates rapid fire mode every 4 seconds for 2 seconds
        updatedBoss.abilityActive = (updatedBoss.abilityTimer % 6000) < 2000;
        break;
        
      case 'heal':
        // Guardian boss heals every 8 seconds if below 50% health
        if (updatedBoss.abilityTimer > 8000 && boss.health < boss.maxHealth * 0.5) {
          updatedBoss.health = Math.min(boss.maxHealth, boss.health + 15);
          updatedBoss.abilityTimer = 0;
        }
        break;
    }
  }
  
  // Apply movement patterns
  switch (boss.movementPattern) {
    case 'zigzag':
      updatedBoss.position.x = (boss.originalX || GAME_CONFIG.CANVAS_WIDTH / 2) + 
        Math.sin(updatedBoss.movementPhase * 3) * 120;
      updatedBoss.position.y += boss.velocity.y;
      break;
      
    case 'circle':
      const radius = 80;
      const centerX = boss.originalX || GAME_CONFIG.CANVAS_WIDTH / 2;
      const centerY = Math.max(100, boss.position.y);
      updatedBoss.position.x = centerX + Math.cos(updatedBoss.movementPhase * 2) * radius;
      updatedBoss.position.y = centerY + Math.sin(updatedBoss.movementPhase * 2) * radius * 0.3;
      break;
      
    case 'sweep':
      const sweepRange = GAME_CONFIG.CANVAS_WIDTH - boss.size * 2;
      updatedBoss.position.x = boss.size + 
        (Math.sin(updatedBoss.movementPhase * 1.5) + 1) * 0.5 * sweepRange;
      updatedBoss.position.y += boss.velocity.y * 0.3;
      break;
      
    case 'spiral':
      // Vortex boss moves in expanding spiral
      const spiralRadius = 60 + Math.sin(updatedBoss.movementPhase * 0.5) * 40;
      const centerXSpiral = boss.originalX || GAME_CONFIG.CANVAS_WIDTH / 2;
      updatedBoss.position.x = centerXSpiral + Math.cos(updatedBoss.movementPhase * 4) * spiralRadius;
      updatedBoss.position.y = 120 + Math.sin(updatedBoss.movementPhase * 0.8) * 50;
      break;
      
    case 'dive':
      // Interceptor boss dives down and up
      const diveCenter = 120;
      const diveRange = 80;
      updatedBoss.position.y = diveCenter + Math.sin(updatedBoss.movementPhase * 2) * diveRange;
      updatedBoss.position.x = (boss.originalX || GAME_CONFIG.CANVAS_WIDTH / 2) + 
        Math.sin(updatedBoss.movementPhase * 1.5) * 100;
      break;
      
    case 'fortress':
      // Titan boss moves slowly, staying in defensive position
      updatedBoss.position.x = (boss.originalX || GAME_CONFIG.CANVAS_WIDTH / 2) + 
        Math.sin(updatedBoss.movementPhase * 0.8) * 60;
      updatedBoss.position.y = 100; // Stay high and defensive
      break;
      
    case 'weave':
      // Guardian boss weaves complex patterns
      const weaveX = Math.sin(updatedBoss.movementPhase * 2) * 100 + 
                    Math.sin(updatedBoss.movementPhase * 3.5) * 50;
      const weaveY = Math.sin(updatedBoss.movementPhase * 1.5) * 40;
      updatedBoss.position.x = (boss.originalX || GAME_CONFIG.CANVAS_WIDTH / 2) + weaveX;
      updatedBoss.position.y = 120 + weaveY;
      break;
      
    case 'teleport':
      // Phantom boss movement already handled in special ability
      break;
  }
  
  // Keep boss on screen
  updatedBoss.position.x = Math.max(boss.size, Math.min(GAME_CONFIG.CANVAS_WIDTH - boss.size, updatedBoss.position.x));
  updatedBoss.position.y = Math.max(50, Math.min(200, updatedBoss.position.y));
  
  // Boss shooting based on shoot pattern
  const isRapidFire = boss.specialAbility === 'rapidFire' && boss.abilityActive;
  const shootCooldown = isRapidFire ? GAME_CONFIG.BOSS_SHOOT_COOLDOWN * 0.3 : GAME_CONFIG.BOSS_SHOOT_COOLDOWN;
  
  if (currentTime - (boss.lastShot || 0) > shootCooldown) {
    const bossX = boss.position.x;
    const bossY = boss.position.y + boss.size;
    
    switch (boss.shootPattern) {
      case 'triple':
        // Standard triple shot
        projectiles.push(
          createProjectile(bossX - 15, bossY, false),
          createProjectile(bossX, bossY, false),
          createProjectile(bossX + 15, bossY, false)
        );
        break;
        
      case 'spread':
        // Wide spread shot
        for (let i = -2; i <= 2; i++) {
          const spreadProjectile = createProjectile(bossX + i * 12, bossY, false);
          spreadProjectile.velocity.x = i * 2; // Add horizontal spread
          projectiles.push(spreadProjectile);
        }
        break;
        
      case 'burst':
        // Rapid burst of projectiles
        for (let i = 0; i < 5; i++) {
          const burstProjectile = createProjectile(bossX + (i - 2) * 8, bossY, false);
          projectiles.push(burstProjectile);
        }
        break;
        
      case 'homing':
        // Slower homing projectiles (basic tracking)
        const homingProjectile = createProjectile(bossX, bossY, false);
        homingProjectile.velocity.y *= 0.7; // Slower for tracking
        projectiles.push(homingProjectile);
        break;
        
      case 'laser':
        // Continuous laser beam effect (rapid thin projectiles)
        for (let i = 0; i < 3; i++) {
          const laserProjectile = createProjectile(bossX, bossY + i * 10, false);
          laserProjectile.velocity.y *= 1.5; // Faster laser
          laserProjectile.size *= 0.6; // Thinner beam
          projectiles.push(laserProjectile);
        }
        break;
        
      case 'shield':
        // Defensive pattern - fewer but stronger projectiles
        projectiles.push(
          createProjectile(bossX - 20, bossY, false),
          createProjectile(bossX + 20, bossY, false)
        );
        break;
    }
    
    updatedBoss.lastShot = currentTime;
  }
  
  return updatedBoss;
}

// Remove the old updateProjectile function since it's now handled by weapon-system.ts

function handleCollisions(state: GameState): void {
  // Player projectiles vs enemies (with weapon system)
  state.projectiles.forEach(projectile => {
    if (!projectile.isPlayerProjectile || !projectile.active) return;
    
    state.enemies.forEach(enemy => {
      if (!enemy.active) return;
      
      if (checkCollision(projectile, enemy)) {
        // Handle weapon-specific collision behavior
        const collision = handleProjectileCollision(projectile, enemy);
        
        // Apply damage to primary target
        let actualDamage = collision.damage;
        
        // Handle boss shields
        if (enemy.type === 'boss' && enemy.shieldStrength && enemy.shieldStrength > 0) {
          const shieldAbsorbed = Math.min(actualDamage, enemy.shieldStrength);
          enemy.shieldStrength -= shieldAbsorbed;
          actualDamage -= shieldAbsorbed;
          
          // Visual effect for shield hit could be added here
          if (enemy.shieldStrength <= 0) {
            enemy.shieldStrength = 0;
          }
        }
        
        enemy.health -= actualDamage;
        
        // Handle explosive weapons - damage nearby enemies
        if (collision.explosionRadius && collision.explosionRadius > 0) {
          state.enemies.forEach(nearbyEnemy => {
            if (!nearbyEnemy.active || nearbyEnemy.id === enemy.id) return;
            
            const dx = nearbyEnemy.position.x - enemy.position.x;
            const dy = nearbyEnemy.position.y - enemy.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= collision.explosionRadius) {
              nearbyEnemy.health -= Math.floor(collision.damage * 0.6); // Reduced splash damage
              if (nearbyEnemy.health <= 0) {
                nearbyEnemy.active = false;
                state.score += nearbyEnemy.points;
                
                // Create explosion particles for splash damage kills (limited)
                if (state.particles.length < GAME_CONFIG.MAX_PARTICLES - 8) {
                  const splashExplosionParticles = createExplosionParticles(
                    nearbyEnemy.position.x, 
                    nearbyEnemy.position.y, 
                    6, // Reduced particles for splash kills
                    0.6 // Smaller particles for splash kills
                  );
                  state.particles.push(...splashExplosionParticles);
                }
                
                getAudioSystem().playExplosion();
              } else {
                // Play hit sound for damaged but not destroyed enemies
                getAudioSystem().playEnemyHit();
              }
            }
          });
          
          // Create visual explosion effect for plasma beams
          if (projectile.weaponType === 'plasmaBeam') {
            // Add explosion animation data to game state for rendering
            // This could be enhanced with a particle system in the future
          }
        }
        
        // Destroy projectile if needed (piercing weapons might not be destroyed)
        if (collision.destroyed) {
          projectile.active = false;
        } else {
          // For piercing weapons, reduce damage for subsequent hits
          projectile.damage = Math.max(1, Math.floor(projectile.damage * 0.8));
        }
        
        if (enemy.health <= 0) {
          if (enemy.type === 'boss' && !enemy.defeatAnimationStarted) {
            // Start boss defeat animation instead of immediate removal
            enemy.defeatAnimationStarted = true;
            enemy.bossState = 'defeated';
            state.gameStatus = 'bossDefeat';
            state.bossAnimationTime = 0;
            state.defeatedBossScore = enemy.points;
            
            // Update mission objectives if in campaign mode
            if (state.gameMode === 'campaign' && state.currentMission) {
              updateMissionObjectives(state.currentMission, state, 'bossDefeated');
            }
            
            // Create massive explosion particles for boss defeat (limited)
            if (state.particles.length < GAME_CONFIG.MAX_PARTICLES - 20) {
              const bossExplosionParticles = createExplosionParticles(
                enemy.position.x, 
                enemy.position.y, 
                18, // Reduced particles for boss explosion
                2.0 // Large particles for boss explosion
              );
              state.particles.push(...bossExplosionParticles);
            }
            
            // Trigger intense screen shake for boss destruction
            Object.assign(state, triggerScreenShake(
              state, 
              GAME_CONFIG.SCREEN_SHAKE.BOSS_DESTROY.intensity, 
              GAME_CONFIG.SCREEN_SHAKE.BOSS_DESTROY.duration
            ));
            
            // Play boss defeat sound
            getAudioSystem().playBossDefeat();
            return; // Don't set active false yet
          } else {
            enemy.active = false;
            state.score += enemy.points;
            
            // Update mission objectives if in campaign mode
            if (state.gameMode === 'campaign' && state.currentMission) {
              updateMissionObjectives(state.currentMission, state, 'enemyDestroyed');
            }
            
            // Create explosion particles when enemy is destroyed (limited)
            if (state.particles.length < GAME_CONFIG.MAX_PARTICLES - 10) {
              const explosionParticles = createExplosionParticles(
                enemy.position.x, 
                enemy.position.y, 
                enemy.type === 'boss' ? 15 : 8, // Reduced particles
                enemy.type === 'boss' ? 1.5 : 0.8 // Smaller particles
              );
              state.particles.push(...explosionParticles);
            }
            
            // Trigger screen shake for enemy destruction
            Object.assign(state, triggerScreenShake(
              state, 
              GAME_CONFIG.SCREEN_SHAKE.ENEMY_DESTROY.intensity, 
              GAME_CONFIG.SCREEN_SHAKE.ENEMY_DESTROY.duration
            ));
            
            // Play explosion sound for regular enemies
            getAudioSystem().playExplosion();
          }
        } else if (enemy.type === 'boss') {
          // Play hit sound for boss taking damage
          getAudioSystem().playEnemyHit();
        }
      }
    });
  });

  // Enemy projectiles vs player
  if (!state.player.invulnerable) {
    state.projectiles.forEach(projectile => {
      if (projectile.isPlayerProjectile || !projectile.active) return;
      
      if (checkCollision(state.player, projectile)) {
        projectile.active = false;
        
        // Shield power-up protects from damage
        if (state.player.powerUps.shield > 0) {
          return;
        }
        
        state.player.lives--;
        state.player.invulnerable = true;
        state.player.invulnerabilityTime = GAME_CONFIG.INVULNERABILITY_TIME;
        
        // Trigger screen shake when player is hit
        Object.assign(state, triggerScreenShake(
          state, 
          GAME_CONFIG.SCREEN_SHAKE.PLAYER_HIT.intensity, 
          GAME_CONFIG.SCREEN_SHAKE.PLAYER_HIT.duration
        ));
      }
    });
  }

  // Player vs power-ups
  state.powerUps.forEach(powerUp => {
    if (!powerUp.active) return;
    
    if (checkCollision(state.player, powerUp)) {
      powerUp.active = false;
      activatePowerUp(state.player, powerUp);
      
      // Update mission objectives if in campaign mode
      if (state.gameMode === 'campaign' && state.currentMission) {
        updateMissionObjectives(state.currentMission, state, 'powerUpCollected');
      }
      
      // Play power-up collection sound
      getAudioSystem().playPowerUp();
    }
  });

  // Enemies vs player (respecting shield power-up)
  if (!state.player.invulnerable) {
    state.enemies.forEach(enemy => {
      if (!enemy.active) return;
      
      if (checkCollision(state.player, enemy)) {
        enemy.active = false;
        
        // Play explosion sound when enemy hits player
        getAudioSystem().playExplosion();
        
        // Shield power-up protects from damage
        if (state.player.powerUps.shield > 0) {
          // Shield absorbs the hit but doesn't remove it immediately
          // This allows multiple hits to be absorbed during shield duration
          return;
        }
        
        state.player.lives--;
        state.player.invulnerable = true;
        state.player.invulnerabilityTime = GAME_CONFIG.INVULNERABILITY_TIME;
        
        // Trigger screen shake when player is hit
        Object.assign(state, triggerScreenShake(
          state, 
          GAME_CONFIG.SCREEN_SHAKE.PLAYER_HIT.intensity, 
          GAME_CONFIG.SCREEN_SHAKE.PLAYER_HIT.duration
        ));
      }
    });
  }
}

function activatePowerUp(player: Player, powerUp: PowerUp): void {
  switch (powerUp.type) {
    case 'rapidFire':
      player.powerUps.rapidFire = Math.max(player.powerUps.rapidFire, powerUp.duration);
      break;
    case 'shield':
      player.powerUps.shield = Math.max(player.powerUps.shield, powerUp.duration);
      break;
    case 'multiShot':
      player.powerUps.multiShot = Math.max(player.powerUps.multiShot, powerUp.duration);
      break;
    case 'weaponUpgrade':
      if (powerUp.weaponType) {
        // Upgrade to the new weapon type or level up current weapon
        player.currentWeapon = upgradeWeapon(player.currentWeapon, powerUp.weaponType);
        player.weaponLevel = Math.max(player.weaponLevel, player.currentWeapon.level);
      }
      break;
  }
}

function checkCollision(obj1: { position: { x: number; y: number }; size: number; chargeLevel?: number }, obj2: { position: { x: number; y: number }; size: number }): boolean {
  const dx = obj1.position.x - obj2.position.x;
  const dy = obj1.position.y - obj2.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Use a more generous collision detection for charged projectiles
  // Check if obj1 is a charged projectile (has chargeLevel > 0) or has large size
  const isChargedProjectile = (obj1.chargeLevel && obj1.chargeLevel > 0) || obj1.size > 8;
  const collisionThreshold = isChargedProjectile ? 
    (obj1.size + obj2.size) * 0.8 : // More generous for charged shots
    (obj1.size + obj2.size) * 0.5;   // Standard collision
    
  return distance < collisionThreshold;
}

function updateBossIntroAnimation(boss: Enemy, animationTime: number): void {
  const progress = Math.min(animationTime / GAME_CONFIG.BOSS_INTRO_DURATION, 1);
  
  // Dramatic entrance from top with easing
  const easeOutQuart = 1 - Math.pow(1 - progress, 4);
  const targetY = 80; // Final position
  boss.position.y = -GAME_CONFIG.BOSS_SIZE * 2 + (targetY + GAME_CONFIG.BOSS_SIZE * 2) * easeOutQuart;
  
  // Horizontal oscillation during intro
  const oscillation = Math.sin(animationTime * 0.008) * 20;
  boss.position.x = boss.originalX! + oscillation;
  
  // Scale effect - starts large then settles (ensure scale is always positive)
  const scaleProgress = Math.min(progress * 1.5, 1);
  const scale = Math.max(0.3, 1.5 - 0.5 * easeOutQuart); // Minimum scale of 0.3 to prevent negative/tiny sizes
  boss.size = Math.max(10, GAME_CONFIG.BOSS_SIZE * scale); // Ensure minimum size of 10
}

function updateBossDefeatAnimation(boss: Enemy, animationTime: number): void {
  const progress = Math.min(animationTime / GAME_CONFIG.BOSS_DEFEAT_DURATION, 1);
  
  // Explosive shaking effect
  const shakeIntensity = (1 - progress) * 15;
  boss.position.x = boss.originalX! + (Math.random() - 0.5) * shakeIntensity;
  boss.position.y += (Math.random() - 0.5) * shakeIntensity;
  
  // Scaling and fading effect - ensure pulsate is never negative
  const pulsate = Math.max(0.3, 1 + Math.sin(animationTime * 0.02) * 0.3 * (1 - progress));
  boss.size = Math.max(10, GAME_CONFIG.BOSS_SIZE * pulsate); // Ensure minimum size
  
  // Move slowly upward as it "explodes"
  if (progress > 0.7) {
    boss.position.y -= 2;
  }
}

// Weapon system update functions
function updateWeaponSystem(player: Player, controls: Controls, currentTime: number, deltaTime: number): Player {
  const updated = { ...player };
  const weaponSystem = { ...updated.weaponSystem };
  
  // Handle overheat cooldown
  if (weaponSystem.isOverheated) {
    weaponSystem.overheatCooldown -= deltaTime;
    if (weaponSystem.overheatCooldown <= 0) {
      weaponSystem.isOverheated = false;
      weaponSystem.heat = 0; // Reset heat when cooldown finishes
    }
  }
  
  // Handle cooling when not overheated
  if (!weaponSystem.isOverheated && !controls.shoot && !controls.charging) {
    weaponSystem.heat = Math.max(0, weaponSystem.heat - (weaponSystem.coolingRate * deltaTime / 1000));
  }
  
  // Regenerate energy over time
  weaponSystem.energy = Math.min(weaponSystem.maxEnergy, weaponSystem.energy + (weaponSystem.energyRegenRate * deltaTime / 1000));
  
  // Handle charging - charge builds up while holding C, decays after release with delay
  const audioSystem = getAudioSystem();
  const currentWeapon = weaponSystem.weaponSlots[weaponSystem.activeWeaponIndex] || weaponSystem.weaponSlots[0];
  const weaponType = currentWeapon?.type;
  
  if (controls.charging && !weaponSystem.isOverheated) {
    if (weaponSystem.lastChargeStart === 0) {
      weaponSystem.lastChargeStart = currentTime;
      // Play weapon-specific charge start sound
      audioSystem.playChargeStart(weaponType);
      audioSystem.playChargeLoop(weaponType);
    }
    
    // Reset charge release timer when actively charging
    weaponSystem.lastChargeRelease = 0;
    
    const previousChargeLevel = weaponSystem.chargeLevel;
    weaponSystem.chargeLevel = Math.min(
      weaponSystem.maxCharge, 
      weaponSystem.chargeLevel + (weaponSystem.chargingRate * deltaTime / 1000)
    );
    
    // Play charge complete sound when reaching different charge levels
    const previousChargeData = getChargeLevel(previousChargeLevel);
    const currentChargeData = getChargeLevel(weaponSystem.chargeLevel);
    
    if (previousChargeData.level < currentChargeData.level && currentChargeData.level > 0) {
      audioSystem.stopChargeLoop();
      audioSystem.playChargeComplete(weaponType);
      
      // Visual feedback for charge level reached
      if (currentChargeData.level === 4) {
        // Maximum charge reached - play special effect
        audioSystem.playChargeComplete(weaponType);
      }
    }
  } else if (weaponSystem.lastChargeStart > 0 && !controls.charging) {
    // Player released charge key - start decay timer
    if (weaponSystem.lastChargeRelease === 0) {
      weaponSystem.lastChargeRelease = currentTime;
      audioSystem.stopChargeLoop();
    }
    
    // Apply charge decay after delay
    const timeSinceRelease = currentTime - weaponSystem.lastChargeRelease;
    if (timeSinceRelease > weaponSystem.chargeDecayDelay && weaponSystem.chargeLevel > 0) {
      const previousChargeLevel = weaponSystem.chargeLevel;
      weaponSystem.chargeLevel = Math.max(0, weaponSystem.chargeLevel - (weaponSystem.chargeDecayRate * deltaTime / 1000));
      
      // Play audio feedback when charge decays across levels
      const previousChargeData = getChargeLevel(previousChargeLevel);
      const currentChargeData = getChargeLevel(weaponSystem.chargeLevel);
      
      if (previousChargeData.level > currentChargeData.level && currentChargeData.level >= 0) {
        // Subtle audio feedback for charge level loss
        if (currentChargeData.level === 0) {
          // Charge fully decayed
          audioSystem.playChargeDecay(weaponType);
        }
      }
    }
  }
  // Note: Charge level is maintained when C is released, only reset when shooting
  
  updated.weaponSystem = weaponSystem;
  return updated;
}

interface ShootingResult {
  canShoot: boolean;
  projectiles?: Projectile[];
  updatedPlayer: Player;
}

function handleWeaponShooting(player: Player, controls: Controls, currentTime: number, enemies: Enemy[], gameState: GameState): ShootingResult {
  const updated = { ...player };
  const weaponSystem = { ...updated.weaponSystem };
  
  // Can't shoot if overheated
  if (weaponSystem.isOverheated) {
    return { canShoot: false, updatedPlayer: updated };
  }
  
  // Get current weapon from slots
  const currentWeapon = weaponSystem.weaponSlots[weaponSystem.activeWeaponIndex] || weaponSystem.weaponSlots[0];
  if (!currentWeapon) {
    return { canShoot: false, updatedPlayer: updated };
  }
  
  // Check energy cost
  const energyCost = currentWeapon.energyCost || 5;
  if (weaponSystem.energy < energyCost) {
    return { canShoot: false, updatedPlayer: updated };
  }
  const baseShootCooldown = player.powerUps.rapidFire > 0 ? 
    Math.max(50, currentWeapon.cooldown * 0.5) : currentWeapon.cooldown;
  
  // Check shooting cooldown - this was missing!
  if (currentTime - gameState.lastShot < baseShootCooldown) {
    return { canShoot: false, updatedPlayer: updated };
  }
  
  // Check if shooting (either normal shot or charged shot with space bar)
  const shouldShoot = controls.shoot;
  
  if (shouldShoot) {
    const playerX = player.position.x;
    const playerY = player.position.y - player.size;
    
    // Calculate shot properties based on charge level using new tier system
    const chargeData = getChargeLevel(weaponSystem.chargeLevel);
    const chargeMultiplier = chargeData.multiplier;
    const heatGenerated = GAME_CONFIG.WEAPON_SYSTEM.HEAT_PER_SHOT[currentWeapon.type] * chargeData.heatMultiplier;
    
    // Create enhanced weapon for charged shots
    const enhancedWeapon = chargeData.level > 0 ? {
      ...currentWeapon,
      damage: Math.round(currentWeapon.damage * chargeMultiplier)
    } : currentWeapon;
    
    // Find target for homing missiles
    const targetEnemy = currentWeapon.type === 'homingMissiles' ? 
      findClosestEnemy(player.position, enemies) : undefined;
    
    let projectiles: Projectile[] = [];
    
    if (player.powerUps.multiShot > 0) {
      // Multi-shot: fire multiple projectiles
      const projectiles1 = createWeaponProjectile(playerX - 15, playerY, enhancedWeapon, true, targetEnemy, weaponSystem.chargeLevel);
      const projectiles2 = createWeaponProjectile(playerX, playerY, enhancedWeapon, true, targetEnemy, weaponSystem.chargeLevel);
      const projectiles3 = createWeaponProjectile(playerX + 15, playerY, enhancedWeapon, true, targetEnemy, weaponSystem.chargeLevel);
      projectiles.push(...projectiles1, ...projectiles2, ...projectiles3);
    } else {
      // Normal shot
      const weaponProjectiles = createWeaponProjectile(playerX, playerY, enhancedWeapon, true, targetEnemy, weaponSystem.chargeLevel);
      projectiles.push(...weaponProjectiles);
    }
    
    // Consume energy
    weaponSystem.energy = Math.max(0, weaponSystem.energy - energyCost);
    
    // Add heat and check for overheat
    weaponSystem.heat += heatGenerated;
    if (weaponSystem.heat >= weaponSystem.maxHeat) {
      weaponSystem.isOverheated = true;
      weaponSystem.overheatCooldown = GAME_CONFIG.WEAPON_SYSTEM.OVERHEAT_COOLDOWN;
      weaponSystem.heat = weaponSystem.maxHeat; // Cap at max
    }
    
    // Check if shot was fully charged before resetting
    const isFullyCharged = weaponSystem.chargeLevel >= 100;
    
    // Reset charge level after shooting
    weaponSystem.chargeLevel = 0;
    weaponSystem.lastChargeStart = 0;
    weaponSystem.lastChargeRelease = 0;
    
    // Stop any charge sounds
    const audioSystem = getAudioSystem();
    audioSystem.stopChargeLoop();
    
    updated.weaponSystem = weaponSystem;
    
    // Play appropriate shooting sound
    if (isFullyCharged) {
      audioSystem.playChargedShot(currentWeapon.type);
    } else {
      playWeaponSound(currentWeapon.type);
    }
    
    return {
      canShoot: true,
      projectiles,
      updatedPlayer: updated
    };
  }
  
  return { canShoot: false, updatedPlayer: updated };
}

// Sector Effects System
function updateSectorEffects(sectorEffects: import('./game-types').SectorEffectState[], deltaTime: number): import('./game-types').SectorEffectState[] {
  return sectorEffects
    .map(effect => ({
      ...effect,
      timeRemaining: Math.max(0, effect.timeRemaining - deltaTime),
      active: effect.timeRemaining > 0
    }))
    .filter(effect => effect.active);
}

function applySectorEffectsToGameplay(gameState: GameState, deltaTime: number): void {
  gameState.sectorEffects.forEach(effect => {
    if (!effect.active) return;
    
    switch (effect.type) {
      case 'hazard':
        applyHazardEffect(gameState, effect, deltaTime);
        break;
      case 'anomaly':
        applyAnomalyEffect(gameState, effect);
        break;
      case 'nebula':
        applyNebulaEffect(gameState, effect, deltaTime);
        break;
    }
  });
}

function applyHazardEffect(gameState: GameState, effect: import('./game-types').SectorEffectState, deltaTime: number): void {
  const hazard = effect.effect;
  const intensity = hazard.intensity / 5; // Normalize to 0-1 scale
  
  switch (hazard.type) {
    case 'radiation':
      // Gradual health drain
      if (Math.random() < intensity * 0.001 * deltaTime) {
        gameState.player.lives = Math.max(0, gameState.player.lives - 1);
      }
      break;
      
    case 'gravity':
      // Affects ship movement
      const gravityMultiplier = 1 - (intensity * 0.3);
      gameState.player.velocity.x *= gravityMultiplier;
      gameState.player.velocity.y *= gravityMultiplier;
      break;
      
    case 'magnetic':
      // Interferes with targeting - random projectile deviation
      gameState.projectiles.forEach(projectile => {
        if (projectile.owner === 'player' && Math.random() < intensity * 0.01) {
          projectile.velocity.x += (Math.random() - 0.5) * 2;
          projectile.velocity.y += (Math.random() - 0.5) * 2;
        }
      });
      break;
      
    case 'energy_storm':
      // Weapons malfunction temporarily
      if (Math.random() < intensity * 0.001 * deltaTime) {
        gameState.player.weaponSystem.isOverheated = true;
        gameState.player.weaponSystem.overheatCooldown = 1000;
      }
      break;
      
    case 'ion_storm':
      // Electronics interference - reduce energy regeneration
      gameState.player.weaponSystem.energyRegenRate *= (1 - intensity * 0.5);
      break;
      
    case 'solar_flare':
      // Sudden damage burst
      if (Math.random() < intensity * 0.0005 * deltaTime) {
        // Trigger screen shake for solar flare
        Object.assign(gameState, triggerScreenShake(gameState, 8, 500));
        
        if (!gameState.player.invulnerable && gameState.player.powerUps.shield <= 0) {
          gameState.player.lives = Math.max(0, gameState.player.lives - 1);
          gameState.player.invulnerable = true;
          gameState.player.invulnerabilityTime = GAME_CONFIG.INVULNERABILITY_TIME;
        }
      }
      break;
      
    case 'dark_matter':
      // Inverts controls temporarily (handled in control processing)
      // This effect is applied at the control level
      break;
      
    case 'temporal':
      // Time distortion effects - slow down everything
      const timeMultiplier = 1 - (intensity * 0.3);
      gameState.enemies.forEach(enemy => {
        enemy.velocity.x *= timeMultiplier;
        enemy.velocity.y *= timeMultiplier;
      });
      gameState.projectiles.forEach(projectile => {
        projectile.velocity.x *= timeMultiplier;
        projectile.velocity.y *= timeMultiplier;
      });
      break;
      
    case 'psychic':
      // Alien influence on systems - random weapon switching
      if (Math.random() < intensity * 0.001 * deltaTime && gameState.player.weaponSystem.weaponSlots.length > 1) {
        const randomIndex = Math.floor(Math.random() * gameState.player.weaponSystem.weaponSlots.length);
        gameState.player.weaponSystem.activeWeaponIndex = randomIndex;
      }
      break;
  }
}

function applyNebulaEffect(gameState: GameState, effect: import('./game-types').SectorEffectState, deltaTime: number): void {
  const nebula = effect.effect;
  
  // Affect energy regeneration
  if (nebula.energyEffect !== 0) {
    const energyChange = nebula.energyEffect * 5 * deltaTime / 1000; // 5 energy per second per effect unit
    gameState.player.weaponSystem.energy = Math.max(0, Math.min(
      gameState.player.weaponSystem.maxEnergy,
      gameState.player.weaponSystem.energy + energyChange
    ));
  }
  
  // Reduce visibility (affects targeting)
  if (nebula.density > 0.5) {
    gameState.projectiles.forEach(projectile => {
      if (projectile.owner === 'player' && projectile.homing && Math.random() < nebula.density * 0.1) {
        // Lose target lock in dense nebula
        projectile.homing = false;
      }
    });
  }
}

// Event triggering functions
export function checkSectorEvents(gameState: GameState): GameState {
  if (!gameState.sectorMap || gameState.activeEvent) return gameState;
  
  // Add a delay to prevent immediate triggering of events after starting exploration or moving
  const now = Date.now();
  const timeSinceLastEvent = now - (gameState.lastEventTime || 0);
  if (timeSinceLastEvent < 5000) { // 5 second cooldown to allow player to get oriented
    return gameState;
  }
  
  const currentSector = gameState.sectorMap.currentSector;
  const availableEvents = currentSector.events.filter(event => 
    !event.triggered && 
    checkEventConditions(event, gameState)
  );
  
  if (availableEvents.length > 0) {
    // Only trigger random chance events with reduced probability to prevent spam
    const randomEvents = availableEvents.filter(event => 
      event.conditions.some(c => c.type === 'random_chance')
    );
    
    const guaranteedEvents = availableEvents.filter(event => 
      !event.conditions.some(c => c.type === 'random_chance')
    );
    
    // Prefer guaranteed events over random ones
    let eventToTrigger;
    if (guaranteedEvents.length > 0) {
      eventToTrigger = guaranteedEvents.reduce((highest, current) => 
        current.priority > highest.priority ? current : highest
      );
    } else if (randomEvents.length > 0) {
      // Add an additional random check to reduce spam
      if (Math.random() < 0.3) { // Only 30% chance to trigger random events
        eventToTrigger = randomEvents.reduce((highest, current) => 
          current.priority > highest.priority ? current : highest
        );
      }
    }
    
    if (eventToTrigger) {
      console.log('Event triggered:', eventToTrigger.type, 'Has choices:', !!eventToTrigger.choices);
      
      return {
        ...gameState,
        activeEvent: eventToTrigger,
        gameStatus: 'eventDialog',
        lastEventTime: now
      };
    }
  }
  
  return gameState;
}

function checkEventConditions(event: import('./space-sector-system').SectorEvent, gameState: GameState): boolean {
  return event.conditions.every(condition => {
    switch (condition.type) {
      case 'player_health':
        return compareValues(gameState.player.lives, condition.operator, condition.value as number);
      case 'player_score':
        return compareValues(gameState.score, condition.operator, condition.value as number);
      case 'random_chance':
        return Math.random() < (condition.value as number);
      case 'sector_type':
        return gameState.sectorMap?.currentSector.type === condition.value;
      default:
        return true;
    }
  });
}

function compareValues(actual: number, operator: string, expected: number): boolean {
  switch (operator) {
    case '>': return actual > expected;
    case '<': return actual < expected;
    case '=': return actual === expected;
    case '>=': return actual >= expected;
    case '<=': return actual <= expected;
    default: return true;
  }
}

export function applySectorHazards(gameState: GameState): GameState {
  if (!gameState.sectorMap) return gameState;
  
  const currentSector = gameState.sectorMap.currentSector;
  const newSectorEffects = [...gameState.sectorEffects];
  
  currentSector.hazards.forEach(hazard => {
    // Add hazard as sector effect if not already active
    const existingEffect = newSectorEffects.find(effect => 
      effect.type === 'hazard' && effect.sourceId === hazard.type
    );
    
    if (!existingEffect) {
      newSectorEffects.push({
        type: 'hazard',
        sourceId: hazard.type,
        effect: hazard,
        duration: hazard.duration,
        timeRemaining: hazard.duration,
        active: true
      });
    }
  });
  
  return {
    ...gameState,
    sectorEffects: newSectorEffects
  };
}