import { WeaponType, WeaponUpgrade, Projectile, Enemy, getChargeLevel } from './game-types';
import { getAudioSystem } from './audio-system';

// Import GAME_CONFIG directly to avoid circular dependency
const GAME_CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  PROJECTILE_SIZE: 4,
  WEAPON_UPGRADES: {
    basic: {
      damage: 1,
      speed: 8,
      cooldown: 200, // Increased from 150 to slow down initial firing rate
      energyCost: 5,
    },
    laserCannon: {
      damage: 2,
      speed: 12,
      cooldown: 120,
      special: 'piercing' as const,
      energyCost: 8,
    },
    plasmaBeam: {
      damage: 3,
      speed: 10,
      cooldown: 100,
      special: 'explosive' as const,
      energyCost: 12,
    },
    homingMissiles: {
      damage: 4,
      speed: 6,
      cooldown: 200,
      special: 'tracking' as const,
      energyCost: 15,
    },
    railgun: {
      damage: 8,
      speed: 20,
      cooldown: 800,
      special: 'charging' as const,
      chargeMultiplier: 3.0,
      energyCost: 25,
    },
    shotgun: {
      damage: 1.5,
      speed: 10,
      cooldown: 300,
      special: 'spreading' as const,
      projectileCount: 5,
      spreadAngle: 30,
      energyCost: 18,
    },
    chaingun: {
      damage: 0.8,
      speed: 12,
      cooldown: 80,
      special: 'ricocheting' as const,
      energyCost: 6,
    },
    ionCannon: {
      damage: 5,
      speed: 8,
      cooldown: 400,
      special: 'disruptive' as const,
      energyCost: 20,
    },
    quantumRifle: {
      damage: 6,
      speed: 15,
      cooldown: 250,
      special: 'quantum' as const,
      energyCost: 22,
    },
    fusionTorpedo: {
      damage: 12,
      speed: 4,
      cooldown: 1200,
      special: 'fusion' as const,
      energyCost: 40,
    },
  },
} as const;

export function createWeaponUpgrade(type: WeaponType, level: number = 1): WeaponUpgrade {
  const baseWeapon = GAME_CONFIG.WEAPON_UPGRADES[type];
  const levelMultiplier = 1 + (level - 1) * 0.3; // 30% damage increase per level
  
  return {
    type,
    level,
    damage: baseWeapon.damage * levelMultiplier,
    speed: baseWeapon.speed,
    cooldown: Math.max(30, baseWeapon.cooldown - (level - 1) * 15),
    special: baseWeapon.special,
    chargeMultiplier: baseWeapon.chargeMultiplier,
    projectileCount: baseWeapon.projectileCount,
    spreadAngle: baseWeapon.spreadAngle,
    energyCost: baseWeapon.energyCost,
  };
}

export function createWeaponProjectile(
  x: number, 
  y: number, 
  weapon: WeaponUpgrade, 
  isPlayerProjectile: boolean = true,
  targetEnemy?: Enemy,
  chargeLevel: number = 0
): Projectile[] {
  const projectiles: Projectile[] = [];
  
  switch (weapon.type) {
    case 'basic':
      projectiles.push(createBasicProjectile(x, y, weapon, isPlayerProjectile, chargeLevel));
      break;
      
    case 'laserCannon':
      projectiles.push(createLaserProjectile(x, y, weapon, isPlayerProjectile, chargeLevel));
      break;
      
    case 'plasmaBeam':
      projectiles.push(createPlasmaProjectile(x, y, weapon, isPlayerProjectile, chargeLevel));
      break;
      
    case 'homingMissiles':
      projectiles.push(createHomingProjectile(x, y, weapon, isPlayerProjectile, targetEnemy, chargeLevel));
      break;
      
    case 'railgun':
      projectiles.push(createRailgunProjectile(x, y, weapon, isPlayerProjectile, chargeLevel));
      break;
      
    case 'shotgun':
      projectiles.push(...createShotgunProjectiles(x, y, weapon, isPlayerProjectile));
      break;
      
    case 'chaingun':
      projectiles.push(createChaingunProjectile(x, y, weapon, isPlayerProjectile));
      break;
      
    case 'ionCannon':
      projectiles.push(createIonProjectile(x, y, weapon, isPlayerProjectile));
      break;
      
    case 'quantumRifle':
      projectiles.push(createQuantumProjectile(x, y, weapon, isPlayerProjectile));
      break;
      
    case 'fusionTorpedo':
      projectiles.push(createFusionProjectile(x, y, weapon, isPlayerProjectile));
      break;
  }
  
  return projectiles;
}

function createBasicProjectile(x: number, y: number, weapon: WeaponUpgrade, isPlayerProjectile: boolean, chargeLevel: number = 0): Projectile {
  // Get charge multiplier based on the new tier system
  const chargeData = getChargeLevel(chargeLevel);
  const chargeDamageMultiplier = chargeData.multiplier;
  const chargeSizeMultiplier = 1 + (chargeData.level * 0.15); // Size increases per level
  
  return {
    id: `projectile-${Date.now()}-${Math.random()}`,
    position: { x, y },
    velocity: { x: 0, y: -weapon.speed },
    size: GAME_CONFIG.PROJECTILE_SIZE * chargeSizeMultiplier,
    active: true,
    damage: weapon.damage * chargeDamageMultiplier,
    isPlayerProjectile,
    weaponType: weapon.type,
    chargeLevel,
    trailParticles: [],
  };
}

function createLaserProjectile(x: number, y: number, weapon: WeaponUpgrade, isPlayerProjectile: boolean, chargeLevel: number = 0): Projectile {
  const chargeData = getChargeLevel(chargeLevel);
  const chargeDamageMultiplier = chargeData.multiplier;
  const chargeSpeedMultiplier = 1 + (chargeData.level * 0.1); // Speed increases per level
  const chargeSizeMultiplier = 1 + (chargeData.level * 0.12);
  
  return {
    id: `projectile-${Date.now()}-${Math.random()}`,
    position: { x, y },
    velocity: { x: 0, y: -weapon.speed * chargeSpeedMultiplier },
    size: Math.max(1, GAME_CONFIG.PROJECTILE_SIZE * 0.8 * chargeSizeMultiplier),
    active: true,
    damage: weapon.damage * chargeDamageMultiplier,
    isPlayerProjectile,
    weaponType: weapon.type,
    special: 'piercing',
    chargeLevel,
    trailParticles: [],
  };
}

function createPlasmaProjectile(x: number, y: number, weapon: WeaponUpgrade, isPlayerProjectile: boolean, chargeLevel: number = 0): Projectile {
  const chargeData = getChargeLevel(chargeLevel);
  const chargeDamageMultiplier = chargeData.multiplier;
  const chargeSizeMultiplier = 1 + (chargeData.level * 0.25); // Plasma grows more dramatically
  
  return {
    id: `projectile-${Date.now()}-${Math.random()}`,
    position: { x, y },
    velocity: { x: 0, y: -weapon.speed },
    size: GAME_CONFIG.PROJECTILE_SIZE * 1.5 * chargeSizeMultiplier,
    active: true,
    damage: weapon.damage * chargeDamageMultiplier,
    isPlayerProjectile,
    weaponType: weapon.type,
    special: 'explosive',
    chargeLevel,
    trailParticles: [],
  };
}

function createHomingProjectile(x: number, y: number, weapon: WeaponUpgrade, isPlayerProjectile: boolean, targetEnemy?: Enemy, chargeLevel: number = 0): Projectile {
  const chargeData = getChargeLevel(chargeLevel);
  const chargeDamageMultiplier = chargeData.multiplier;
  const chargeSizeMultiplier = 1 + (chargeData.level * 0.2);
  
  if (targetEnemy) {
    return {
      id: `projectile-${Date.now()}-${Math.random()}`,
      position: { x, y },
      velocity: { x: 0, y: -weapon.speed },
      size: GAME_CONFIG.PROJECTILE_SIZE * 1.2 * chargeSizeMultiplier,
      active: true,
      damage: weapon.damage * chargeDamageMultiplier,
      isPlayerProjectile,
      weaponType: weapon.type,
      special: 'tracking',
      target: { x: targetEnemy.position.x, y: targetEnemy.position.y },
      chargeLevel,
      trailParticles: [],
    };
  } else {
    return createBasicProjectile(x, y, weapon, isPlayerProjectile, chargeLevel);
  }
}

function createRailgunProjectile(x: number, y: number, weapon: WeaponUpgrade, isPlayerProjectile: boolean, chargeLevel: number): Projectile {
  const chargeData = getChargeLevel(chargeLevel);
  const chargeDamageMultiplier = chargeData.multiplier;
  const chargeSizeMultiplier = 1 + (chargeData.level * 0.3); // Railgun projectiles scale dramatically
  
  return {
    id: `projectile-${Date.now()}-${Math.random()}`,
    position: { x, y },
    velocity: { x: 0, y: -weapon.speed },
    size: GAME_CONFIG.PROJECTILE_SIZE * chargeSizeMultiplier,
    active: true,
    damage: weapon.damage * chargeDamageMultiplier,
    isPlayerProjectile,
    weaponType: weapon.type,
    special: 'charging',
    chargeLevel,
    trailParticles: [],
  };
}

function createShotgunProjectiles(x: number, y: number, weapon: WeaponUpgrade, isPlayerProjectile: boolean): Projectile[] {
  const projectiles: Projectile[] = [];
  const count = weapon.projectileCount || 5;
  const spread = weapon.spreadAngle || 30;
  const angleStep = spread / (count - 1);
  const startAngle = -spread / 2;
  
  for (let i = 0; i < count; i++) {
    const angle = (startAngle + angleStep * i) * (Math.PI / 180);
    const velocity = {
      x: Math.sin(angle) * weapon.speed,
      y: -Math.cos(angle) * weapon.speed
    };
    
    projectiles.push({
      id: `projectile-${Date.now()}-${Math.random()}-${i}`,
      position: { x, y },
      velocity,
      size: GAME_CONFIG.PROJECTILE_SIZE * 0.8,
      active: true,
      damage: weapon.damage,
      isPlayerProjectile,
      weaponType: weapon.type,
      special: 'spreading',
      trailParticles: [],
    });
  }
  
  return projectiles;
}

function createChaingunProjectile(x: number, y: number, weapon: WeaponUpgrade, isPlayerProjectile: boolean): Projectile {
  return {
    id: `projectile-${Date.now()}-${Math.random()}`,
    position: { x, y },
    velocity: { x: 0, y: -weapon.speed },
    size: GAME_CONFIG.PROJECTILE_SIZE * 0.9,
    active: true,
    damage: weapon.damage,
    isPlayerProjectile,
    weaponType: weapon.type,
    special: 'ricocheting',
    bounceCount: 0,
    maxBounces: 2,
    trailParticles: [],
  };
}

function createIonProjectile(x: number, y: number, weapon: WeaponUpgrade, isPlayerProjectile: boolean): Projectile {
  return {
    id: `projectile-${Date.now()}-${Math.random()}`,
    position: { x, y },
    velocity: { x: 0, y: -weapon.speed },
    size: GAME_CONFIG.PROJECTILE_SIZE * 1.3,
    active: true,
    damage: weapon.damage,
    isPlayerProjectile,
    weaponType: weapon.type,
    special: 'disruptive',
    trailParticles: [],
  };
}

function createQuantumProjectile(x: number, y: number, weapon: WeaponUpgrade, isPlayerProjectile: boolean): Projectile {
  return {
    id: `projectile-${Date.now()}-${Math.random()}`,
    position: { x, y },
    velocity: { x: 0, y: -weapon.speed },
    size: GAME_CONFIG.PROJECTILE_SIZE,
    active: true,
    damage: weapon.damage,
    isPlayerProjectile,
    weaponType: weapon.type,
    special: 'quantum',
    phaseShift: 0,
    trailParticles: [],
  };
}

function createFusionProjectile(x: number, y: number, weapon: WeaponUpgrade, isPlayerProjectile: boolean): Projectile {
  return {
    id: `projectile-${Date.now()}-${Math.random()}`,
    position: { x, y },
    velocity: { x: 0, y: -weapon.speed },
    size: GAME_CONFIG.PROJECTILE_SIZE * 2,
    active: true,
    damage: weapon.damage,
    isPlayerProjectile,
    weaponType: weapon.type,
    special: 'fusion',
    fusionTimer: 0,
    trailParticles: [],
  };
}

export function updateProjectile(projectile: Projectile, deltaTime: number, enemies: Enemy[]): Projectile {
  const updated = { ...projectile };
  
  // Handle special projectile behaviors
  switch (projectile.special) {
    case 'tracking':
      if (projectile.target && projectile.weaponType === 'homingMissiles') {
        updateHomingProjectile(updated, enemies);
      }
      break;
      
    case 'ricocheting':
      updateRicochetingProjectile(updated, deltaTime);
      break;
      
    case 'quantum':
      updateQuantumProjectile(updated, deltaTime);
      break;
      
    case 'fusion':
      updateFusionProjectile(updated, deltaTime);
      break;
  }
  
  // Update trail particles for all weapons (moved outside special handling)
  if (updated.trailParticles) {
    updateTrailParticles(updated, deltaTime);
  }
  
  // Update position
  updated.position.x += updated.velocity.x * (deltaTime / 16);
  updated.position.y += updated.velocity.y * (deltaTime / 16);
  
  return updated;
}

function updateHomingProjectile(projectile: Projectile, enemies: Enemy[]): void {
  const targetEnemy = findClosestEnemy(projectile.position, enemies);
  
  if (targetEnemy) {
    projectile.target = { x: targetEnemy.position.x, y: targetEnemy.position.y };
    
    const dx = targetEnemy.position.x - projectile.position.x;
    const dy = targetEnemy.position.y - projectile.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const homingStrength = 0.3;
      const normalizedDx = dx / distance;
      const normalizedDy = dy / distance;
      
      projectile.velocity.x = projectile.velocity.x * (1 - homingStrength) + normalizedDx * Math.abs(projectile.velocity.y) * homingStrength;
      projectile.velocity.y = projectile.velocity.y * (1 - homingStrength) + normalizedDy * Math.abs(projectile.velocity.y) * homingStrength;
    }
  }
}

function updateRicochetingProjectile(projectile: Projectile, deltaTime: number): void {
  // Check for screen boundaries and ricochet
  const margin = 20;
  if (projectile.position.x <= margin || projectile.position.x >= GAME_CONFIG.CANVAS_WIDTH - margin) {
    if ((projectile.bounceCount || 0) < (projectile.maxBounces || 2)) {
      projectile.velocity.x *= -1;
      projectile.bounceCount = (projectile.bounceCount || 0) + 1;
      projectile.position.x = Math.max(margin, Math.min(GAME_CONFIG.CANVAS_WIDTH - margin, projectile.position.x));
    }
  }
}

function updateQuantumProjectile(projectile: Projectile, deltaTime: number): void {
  // Quantum projectiles phase in and out of reality
  projectile.phaseShift = (projectile.phaseShift || 0) + deltaTime * 0.01;
  
  // Occasionally teleport forward
  if (Math.random() < 0.02) {
    projectile.position.y -= 50;
  }
}

function updateFusionProjectile(projectile: Projectile, deltaTime: number): void {
  // Fusion projectiles grow in power over time
  projectile.fusionTimer = (projectile.fusionTimer || 0) + deltaTime;
  
  if (projectile.fusionTimer > 1000) {
    // After 1 second, increase damage and size
    projectile.damage *= 1.5;
    projectile.size *= 1.2;
    projectile.fusionTimer = 0;
  }
}

function updateTrailParticles(projectile: Projectile, deltaTime: number): void {
  if (!projectile.trailParticles) return;
  
  // Create weapon-specific trail variations
  switch (projectile.weaponType) {
    case 'laserCannon':
      createLaserTrail(projectile, deltaTime);
      break;
    case 'plasmaBeam':
      createPlasmaTrail(projectile, deltaTime);
      break;
    case 'railgun':
      createRailgunTrail(projectile, deltaTime);
      break;
    case 'homingMissiles':
      createMissileTrail(projectile, deltaTime);
      break;
    case 'chaingun':
      createChaingunTrail(projectile, deltaTime);
      break;
    case 'ionCannon':
      createIonTrail(projectile, deltaTime);
      break;
    case 'quantumRifle':
      createQuantumTrail(projectile, deltaTime);
      break;
    case 'fusionTorpedo':
      createFusionTrail(projectile, deltaTime);
      break;
    case 'shotgun':
      createShotgunTrail(projectile, deltaTime);
      break;
    default:
      createBasicTrail(projectile, deltaTime);
      break;
  }
  
  // Age and filter trail particles based on weapon type
  const maxAge = getTrailMaxAge(projectile.weaponType);
  const maxParticles = getTrailMaxParticles(projectile.weaponType);
  
  projectile.trailParticles = projectile.trailParticles
    .map(particle => ({ ...particle, age: particle.age + deltaTime }))
    .filter(particle => particle.age < maxAge);
  
  if (projectile.trailParticles.length > maxParticles) {
    projectile.trailParticles.splice(0, projectile.trailParticles.length - maxParticles);
  }
}

function createBasicTrail(projectile: Projectile, deltaTime: number): void {
  // Simple trail for basic weapons
  projectile.trailParticles!.push({
    x: projectile.position.x + (Math.random() - 0.5) * 2,
    y: projectile.position.y + (Math.random() - 0.5) * 2,
    age: 0,
  });
}

function createLaserTrail(projectile: Projectile, deltaTime: number): void {
  // Precise, straight laser trail with minimal spread
  projectile.trailParticles!.push({
    x: projectile.position.x + (Math.random() - 0.5) * 1,
    y: projectile.position.y + (Math.random() - 0.5) * 1,
    age: 0,
  });
  
  // Add occasional bright sparks
  if (Math.random() < 0.3) {
    projectile.trailParticles!.push({
      x: projectile.position.x + (Math.random() - 0.5) * 3,
      y: projectile.position.y + (Math.random() - 0.5) * 3,
      age: 0,
    });
  }
}

function createPlasmaTrail(projectile: Projectile, deltaTime: number): void {
  // Energetic plasma trail with more spread and intensity
  for (let i = 0; i < 2; i++) {
    projectile.trailParticles!.push({
      x: projectile.position.x + (Math.random() - 0.5) * 4,
      y: projectile.position.y + (Math.random() - 0.5) * 4,
      age: 0,
    });
  }
  
  // Add plasma energy bursts
  if (Math.random() < 0.4) {
    for (let i = 0; i < 3; i++) {
      projectile.trailParticles!.push({
        x: projectile.position.x + (Math.random() - 0.5) * 6,
        y: projectile.position.y + (Math.random() - 0.5) * 6,
        age: 0,
      });
    }
  }
}

function createRailgunTrail(projectile: Projectile, deltaTime: number): void {
  // High-energy electromagnetic trail with charge-based intensity
  const chargeLevel = projectile.chargeLevel || 0;
  const intensity = 1 + (chargeLevel / 100);
  
  for (let i = 0; i < Math.floor(2 * intensity); i++) {
    projectile.trailParticles!.push({
      x: projectile.position.x + (Math.random() - 0.5) * (2 * intensity),
      y: projectile.position.y + (Math.random() - 0.5) * (2 * intensity),
      age: 0,
    });
  }
  
  // Add electric arcs for charged shots
  if (chargeLevel > 50 && Math.random() < 0.5) {
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 5 + Math.random() * 5;
      projectile.trailParticles!.push({
        x: projectile.position.x + Math.cos(angle) * distance,
        y: projectile.position.y + Math.sin(angle) * distance,
        age: 0,
      });
    }
  }
}

function createMissileTrail(projectile: Projectile, deltaTime: number): void {
  // Exhaust trail that follows missile movement
  const exhaustOffset = 8; // Distance behind missile
  const trailX = projectile.position.x - (projectile.velocity.x / Math.abs(projectile.velocity.y)) * exhaustOffset;
  const trailY = projectile.position.y + exhaustOffset;
  
  // Main exhaust stream
  for (let i = 0; i < 3; i++) {
    projectile.trailParticles!.push({
      x: trailX + (Math.random() - 0.5) * 4,
      y: trailY + (Math.random() - 0.5) * 2,
      age: 0,
    });
  }
  
  // Secondary exhaust puffs
  if (Math.random() < 0.6) {
    for (let i = 0; i < 2; i++) {
      projectile.trailParticles!.push({
        x: trailX + (Math.random() - 0.5) * 6,
        y: trailY + Math.random() * 4,
        age: 0,
      });
    }
  }
}

function createChaingunTrail(projectile: Projectile, deltaTime: number): void {
  // Rapid-fire trail with shell casings effect
  projectile.trailParticles!.push({
    x: projectile.position.x + (Math.random() - 0.5) * 3,
    y: projectile.position.y + (Math.random() - 0.5) * 3,
    age: 0,
  });
  
  // Add bullet trail segments for rapid fire feel
  if (Math.random() < 0.7) {
    projectile.trailParticles!.push({
      x: projectile.position.x + (Math.random() - 0.5) * 2,
      y: projectile.position.y + 2 + Math.random() * 2,
      age: 0,
    });
  }
}

function createIonTrail(projectile: Projectile, deltaTime: number): void {
  // Disruption field trail with energy distortions
  for (let i = 0; i < 2; i++) {
    projectile.trailParticles!.push({
      x: projectile.position.x + (Math.random() - 0.5) * 5,
      y: projectile.position.y + (Math.random() - 0.5) * 5,
      age: 0,
    });
  }
  
  // Add ion field distortions
  if (Math.random() < 0.5) {
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const radius = 3 + Math.random() * 3;
      projectile.trailParticles!.push({
        x: projectile.position.x + Math.cos(angle) * radius,
        y: projectile.position.y + Math.sin(angle) * radius,
        age: 0,
      });
    }
  }
}

function createQuantumTrail(projectile: Projectile, deltaTime: number): void {
  // Quantum phase trail with reality distortions
  const phaseShift = projectile.phaseShift || 0;
  const phaseMod = Math.sin(phaseShift) * 0.5 + 0.5;
  
  // Main quantum trail
  projectile.trailParticles!.push({
    x: projectile.position.x + (Math.random() - 0.5) * (3 + phaseMod * 4),
    y: projectile.position.y + (Math.random() - 0.5) * (3 + phaseMod * 4),
    age: 0,
  });
  
  // Phase distortion effects
  if (Math.random() < 0.4) {
    for (let i = 0; i < 4; i++) {
      const distortX = projectile.position.x + (Math.random() - 0.5) * 10;
      const distortY = projectile.position.y + (Math.random() - 0.5) * 10;
      projectile.trailParticles!.push({
        x: distortX,
        y: distortY,
        age: 0,
      });
    }
  }
  
  // Quantum tunneling echoes
  if (Math.random() < 0.2) {
    projectile.trailParticles!.push({
      x: projectile.position.x,
      y: projectile.position.y - 20,
      age: 0,
    });
  }
}

function createFusionTrail(projectile: Projectile, deltaTime: number): void {
  // Fusion reaction trail that grows over time
  const fusionTimer = projectile.fusionTimer || 0;
  const fusionIntensity = 1 + (fusionTimer / 1000);
  
  // Core fusion trail
  for (let i = 0; i < Math.floor(3 * fusionIntensity); i++) {
    projectile.trailParticles!.push({
      x: projectile.position.x + (Math.random() - 0.5) * (4 * fusionIntensity),
      y: projectile.position.y + (Math.random() - 0.5) * (4 * fusionIntensity),
      age: 0,
    });
  }
  
  // Fusion reaction bursts
  if (Math.random() < 0.3 * fusionIntensity) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 5 + Math.random() * (5 * fusionIntensity);
      projectile.trailParticles!.push({
        x: projectile.position.x + Math.cos(angle) * radius,
        y: projectile.position.y + Math.sin(angle) * radius,
        age: 0,
      });
    }
  }
}

function createShotgunTrail(projectile: Projectile, deltaTime: number): void {
  // Minimal trail for shotgun pellets to avoid overcrowding
  if (Math.random() < 0.5) {
    projectile.trailParticles!.push({
      x: projectile.position.x + (Math.random() - 0.5) * 2,
      y: projectile.position.y + (Math.random() - 0.5) * 2,
      age: 0,
    });
  }
}

function getTrailMaxAge(weaponType?: WeaponType): number {
  switch (weaponType) {
    case 'laserCannon': return 400;
    case 'plasmaBeam': return 600;
    case 'railgun': return 300;
    case 'homingMissiles': return 800;
    case 'chaingun': return 200;
    case 'ionCannon': return 500;
    case 'quantumRifle': return 700;
    case 'fusionTorpedo': return 1000;
    case 'shotgun': return 150;
    default: return 500;
  }
}

function getTrailMaxParticles(weaponType?: WeaponType): number {
  switch (weaponType) {
    case 'laserCannon': return 6;
    case 'plasmaBeam': return 12;
    case 'railgun': return 10;
    case 'homingMissiles': return 15;
    case 'chaingun': return 5;
    case 'ionCannon': return 18;
    case 'quantumRifle': return 16;
    case 'fusionTorpedo': return 20;
    case 'shotgun': return 3;
    default: return 8;
  }
}

export function handleProjectileCollision(projectile: Projectile, target: Enemy): { destroyed: boolean; damage: number; explosionRadius?: number; specialEffects?: string[] } {
  let damage = projectile.damage;
  let destroyed = true;
  let explosionRadius = 0;
  const specialEffects: string[] = [];
  
  switch (projectile.weaponType) {
    case 'laserCannon':
      if (projectile.special === 'piercing') {
        destroyed = false;
        damage *= 0.8; // Slight damage reduction after each hit
      }
      break;
      
    case 'plasmaBeam':
      if (projectile.special === 'explosive') {
        explosionRadius = 40;
        damage *= 1.2;
        specialEffects.push('explosion');
      }
      break;
      
    case 'homingMissiles':
      damage *= 1.1;
      specialEffects.push('missile_impact');
      break;
      
    case 'railgun':
      // Charged railgun shots pierce and deal massive damage
      destroyed = false;
      damage *= 1 + (projectile.chargeLevel || 0) / 50;
      specialEffects.push('railgun_pierce');
      break;
      
    case 'shotgun':
      // Individual pellets deal less damage but there are many
      damage *= 0.9;
      break;
      
    case 'chaingun':
      // Ricochet to nearby enemies
      if ((projectile.bounceCount || 0) < (projectile.maxBounces || 2)) {
        destroyed = false;
        specialEffects.push('ricochet');
      }
      break;
      
    case 'ionCannon':
      // Disruptive effect - slows enemies and disrupts shields
      damage *= 1.3;
      specialEffects.push('ion_disruption');
      explosionRadius = 30;
      break;
      
    case 'quantumRifle':
      // Quantum shots have a chance to ignore armor
      if (Math.random() < 0.3) {
        damage *= 2;
        specialEffects.push('quantum_bypass');
      }
      break;
      
    case 'fusionTorpedo':
      // Massive area damage
      explosionRadius = 80;
      damage *= 1.5;
      specialEffects.push('fusion_explosion');
      break;
  }
  
  return { destroyed, damage, explosionRadius, specialEffects };
}

export function findClosestEnemy(position: { x: number; y: number }, enemies: Enemy[]): Enemy | null {
  let closest = null;
  let closestDistance = Infinity;
  
  enemies.forEach(enemy => {
    if (!enemy.active) return;
    
    const dx = enemy.position.x - position.x;
    const dy = enemy.position.y - position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < closestDistance) {
      closestDistance = distance;
      closest = enemy;
    }
  });
  
  return closest;
}

export function upgradeWeapon(currentWeapon: WeaponUpgrade, newType?: WeaponType): WeaponUpgrade {
  // If upgrading to a new weapon type
  if (newType && newType !== currentWeapon.type) {
    return createWeaponUpgrade(newType, 1);
  }
  
  // If upgrading current weapon level (max level 5)
  const newLevel = Math.min(currentWeapon.level + 1, 5);
  return createWeaponUpgrade(currentWeapon.type, newLevel);
}

export function getWeaponTier(weaponType: WeaponType): number {
  const tiers: Record<WeaponType, number> = {
    basic: 1,
    laserCannon: 2,
    chaingun: 2,
    shotgun: 2,
    plasmaBeam: 3,
    homingMissiles: 3,
    ionCannon: 3,
    railgun: 4,
    quantumRifle: 4,
    fusionTorpedo: 5,
  };
  return tiers[weaponType] || 1;
}

export function getWeaponUnlockRequirement(weaponType: WeaponType): { level: number; credits: number } {
  const requirements: Record<WeaponType, { level: number; credits: number }> = {
    basic: { level: 1, credits: 0 },
    laserCannon: { level: 3, credits: 500 },
    chaingun: { level: 3, credits: 600 },
    shotgun: { level: 4, credits: 700 },
    plasmaBeam: { level: 6, credits: 1000 },
    homingMissiles: { level: 7, credits: 1200 },
    ionCannon: { level: 8, credits: 1500 },
    railgun: { level: 10, credits: 2000 },
    quantumRifle: { level: 12, credits: 2500 },
    fusionTorpedo: { level: 15, credits: 5000 },
  };
  return requirements[weaponType] || { level: 1, credits: 0 };
}

export function getWeaponDisplayName(weaponType: WeaponType): string {
  switch (weaponType) {
    case 'basic':
      return 'Basic Blaster';
    case 'laserCannon':
      return 'Laser Cannon';
    case 'plasmaBeam':
      return 'Plasma Beam';
    case 'homingMissiles':
      return 'Homing Missiles';
    case 'railgun':
      return 'Railgun';
    case 'shotgun':
      return 'Plasma Shotgun';
    case 'chaingun':
      return 'Chain Gun';
    case 'ionCannon':
      return 'Ion Cannon';
    case 'quantumRifle':
      return 'Quantum Rifle';
    case 'fusionTorpedo':
      return 'Fusion Torpedo';
    default:
      return 'Unknown Weapon';
  }
}

export function getWeaponDescription(weaponType: WeaponType): string {
  switch (weaponType) {
    case 'basic':
      return 'Standard energy blaster with reliable damage output';
    case 'laserCannon':
      return 'High-velocity piercing beam that cuts through multiple enemies';
    case 'plasmaBeam':
      return 'Explosive plasma projectiles with area damage effects';
    case 'homingMissiles':
      return 'Smart missiles that lock onto and track enemy targets';
    case 'railgun':
      return 'Chargeable high-damage weapon that pierces all targets';
    case 'shotgun':
      return 'Spreads multiple projectiles in a wide arc for close combat';
    case 'chaingun':
      return 'Rapid-fire weapon with ricocheting projectiles';
    case 'ionCannon':
      return 'Disruptive energy weapon that slows enemies and pierces shields';
    case 'quantumRifle':
      return 'Advanced weapon with quantum tunneling technology';
    case 'fusionTorpedo':
      return 'Devastating slow-moving projectile with massive area damage';
    default:
      return 'Unknown weapon system';
  }
}

export function playWeaponSound(weaponType: WeaponType): void {
  const audioSystem = getAudioSystem();
  
  switch (weaponType) {
    case 'basic':
      audioSystem.playShoot();
      break;
    case 'laserCannon':
      audioSystem.playShoot(); // TODO: Add laser sound effect
      break;
    case 'plasmaBeam':
      audioSystem.playShoot(); // TODO: Add plasma sound effect
      break;
    case 'homingMissiles':
      audioSystem.playShoot(); // TODO: Add missile launch sound effect
      break;
    case 'railgun':
      audioSystem.playShoot(); // TODO: Add railgun charge/fire sound
      break;
    case 'shotgun':
      audioSystem.playShoot(); // TODO: Add shotgun blast sound
      break;
    case 'chaingun':
      audioSystem.playShoot(); // TODO: Add rapid fire sound
      break;
    case 'ionCannon':
      audioSystem.playShoot(); // TODO: Add ion discharge sound
      break;
    case 'quantumRifle':
      audioSystem.playShoot(); // TODO: Add quantum rifle sound
      break;
    case 'fusionTorpedo':
      audioSystem.playShoot(); // TODO: Add torpedo launch sound
      break;
  }
}

export function canAffordWeapon(weaponType: WeaponType, playerCredits: number, playerLevel: number): boolean {
  const requirements = getWeaponUnlockRequirement(weaponType);
  return playerLevel >= requirements.level && playerCredits >= requirements.credits;
}

export function getWeaponUpgradeCost(weapon: WeaponUpgrade): number {
  const baseCost = GAME_CONFIG.WEAPON_UPGRADES[weapon.type].energyCost || 10;
  return baseCost * weapon.level * 100; // Cost increases with level
}

export function createWeaponLoadout(): WeaponUpgrade[] {
  // Default loadout with basic weapon
  return [
    createWeaponUpgrade('basic', 1),
    // Additional slots unlocked through progression
  ];
}