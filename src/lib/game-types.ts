export interface Position {
  x: number;
  y: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  speed: number;
  twinklePhase: number;
  twinkleSpeed: number;
}

export interface StarLayer {
  stars: Star[];
  speed: number;
  color: string;
  density: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface GameObject {
  id: string;
  position: Position;
  velocity: Velocity;
  size: number;
  active: boolean;
}

export type WeaponType = 'basic' | 'laserCannon' | 'plasmaBeam' | 'homingMissiles' | 'railgun' | 'shotgun' | 'chaingun' | 'ionCannon' | 'quantumRifle' | 'fusionTorpedo';

export interface WeaponUpgrade {
  type: WeaponType;
  level: number; // 1-5 upgrade levels
  damage: number;
  speed: number;
  cooldown: number;
  special?: 'piercing' | 'tracking' | 'explosive' | 'ricocheting' | 'spreading' | 'charging' | 'disruptive' | 'quantum' | 'fusion';
  chargeMultiplier?: number; // Damage multiplier when fully charged
  projectileCount?: number; // Number of projectiles fired per shot
  spreadAngle?: number; // Spread angle for multi-projectile weapons
  energyCost?: number; // Energy consumption per shot
}

export interface Player extends GameObject {
  lives: number;
  invulnerable: boolean;
  invulnerabilityTime: number;
  currentWeapon: WeaponUpgrade;
  weaponLevel: number; // Overall weapon upgrade level
  trailParticles: Array<{ x: number; y: number; age: number }>; // Ship engine trail
  powerUps: {
    rapidFire: number; // Time remaining in ms
    shield: number; // Time remaining in ms
    multiShot: number; // Time remaining in ms
  };
  weaponSystem: {
    heat: number; // Current heat level (0-100)
    maxHeat: number; // Maximum heat before overheating
    coolingRate: number; // Heat reduction per second
    chargeLevel: number; // Current charge level (0-100)
    maxCharge: number; // Maximum charge level
    chargingRate: number; // Charge increase per second while holding shoot
    isOverheated: boolean; // Whether weapon is currently overheated
    overheatCooldown: number; // Time remaining until weapon can be used again
    lastChargeStart: number; // Timestamp when charging started
    lastChargeRelease: number; // Timestamp when charge key was released
    chargeDecayRate: number; // Charge lost per second when not charging
    chargeDecayDelay: number; // Time to wait before charge starts decaying (ms)
    energy: number; // Current energy level (0-100)
    maxEnergy: number; // Maximum energy capacity
    energyRegenRate: number; // Energy regeneration per second
    weaponSlots: WeaponUpgrade[]; // Multiple weapon slots
    activeWeaponIndex: number; // Currently selected weapon
  };
}

export type EnemyType = 'basic' | 'boss';
export type BossState = 'intro' | 'active' | 'defeated';
export type BossType = 'destroyer' | 'interceptor' | 'titan' | 'phantom' | 'vortex' | 'guardian';

export interface Enemy extends GameObject {
  health: number;
  maxHealth: number;
  points: number;
  type: EnemyType;
  bossType?: BossType; // Specific boss variant
  lastShot?: number;
  movementPattern?: 'zigzag' | 'circle' | 'sweep' | 'spiral' | 'teleport' | 'fortress' | 'dive' | 'weave';
  movementPhase?: number;
  originalX?: number;
  bossState?: BossState;
  animationTime?: number;
  introComplete?: boolean;
  defeatAnimationStarted?: boolean;
  shootPattern?: 'triple' | 'spread' | 'burst' | 'homing' | 'laser' | 'shield';
  specialAbility?: 'shield' | 'teleport' | 'rapidFire' | 'heal' | 'summon';
  abilityTimer?: number;
  abilityActive?: boolean;
  teleportTimer?: number;
  shieldStrength?: number;
}

export interface Projectile extends GameObject {
  damage: number;
  isPlayerProjectile: boolean;
  weaponType?: WeaponType;
  special?: 'piercing' | 'tracking' | 'explosive' | 'ricocheting' | 'spreading' | 'charging' | 'disruptive' | 'quantum' | 'fusion';
  target?: { x: number; y: number }; // For homing missiles
  trailParticles?: Array<{ x: number; y: number; age: number }>; // For visual effects
  chargeLevel?: number; // For charged weapons
  bounceCount?: number; // For ricocheting projectiles
  maxBounces?: number; // Maximum number of bounces
  phaseShift?: number; // For quantum weapons
  fusionTimer?: number; // For fusion weapons
}

export type PowerUpType = 'rapidFire' | 'shield' | 'multiShot' | 'weaponUpgrade';

export interface PowerUp extends GameObject {
  type: PowerUpType;
  duration: number;
  weaponType?: WeaponType; // For weapon upgrade power-ups
}

export interface Particle {
  id: string;
  position: Position;
  velocity: Velocity;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  type: 'explosion' | 'spark' | 'debris' | 'trail';
}

export type GameMode = 'arcade' | 'campaign' | 'exploration';

export interface MissionObjective {
  id: string;
  type: 'destroyEnemies' | 'survivetime' | 'collectPowerUps' | 'defeatBoss' | 'protectTarget';
  target: number;
  current: number;
  description: string;
  required: boolean; // If false, it's a bonus objective
}

export interface Mission {
  id: string;
  name: string;
  description: string;
  story: string;
  objectives: MissionObjective[];
  enemyWaves: Array<{
    delay: number;
    enemyType: EnemyType;
    count: number;
    bossType?: BossType;
  }>;
  duration?: number; // For survival missions
  rewards: {
    experience: number;
    weaponUpgrade?: WeaponType;
    credits?: number;
  };
  unlockRequirement?: string; // Mission ID that must be completed first
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  completed: boolean;
  bestScore: number;
  completionTime?: number;
}

export interface CampaignProgress {
  currentMission: string;
  completedMissions: string[];
  totalExperience: number;
  playerLevel: number;
  availableCredits: number;
  unlockedWeapons: WeaponType[];
  weaponLevels: Record<WeaponType, number>; // Track individual weapon upgrade levels
  shipUpgrades: {
    armor: number; // 0-5 levels
    speed: number; // 0-5 levels
    weapons: number; // 0-5 levels
    shielding: number; // 0-5 levels
    chargePreservation: number; // 0-5 levels - reduces charge decay rate
  };
}

export interface GameState {
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  powerUps: PowerUp[];
  particles: Particle[];
  starLayers: StarLayer[];
  score: number;
  level: number;
  gameStatus: 'playing' | 'paused' | 'gameOver' | 'menu' | 'bossIntro' | 'bossDefeat' | 'campaignMenu' | 'missionBriefing' | 'missionComplete' | 'sectorMap' | 'eventDialog';
  gameMode: GameMode;
  currentMission?: Mission;
  missionProgress?: {
    timeElapsed: number;
    objectivesCompleted: number;
    bonusObjectivesCompleted: number;
  };
  lastEnemySpawn: number;
  lastShot: number;
  lastPowerUpSpawn: number;
  lastBossSpawn: number;
  lastTrailSpawn?: number; // For throttling trail particle generation
  lastEventTime?: number; // For throttling event triggering
  bossActive: boolean;
  bossAnimationTime?: number;
  defeatedBossScore?: number;
  screenShake: {
    intensity: number;
    duration: number;
    offsetX: number;
    offsetY: number;
  };
  sectorMap?: import('./space-sector-system').SectorMap;
  activeEvent?: import('./space-sector-system').SectorEvent;
  sectorEffects: SectorEffectState[];
  campaignProgress?: CampaignProgress; // Store campaign progress for upgrades display
}

export interface SectorEffectState {
  type: 'hazard' | 'anomaly' | 'nebula';
  sourceId: string;
  effect: any;
  duration: number;
  timeRemaining: number;
  active: boolean;
}

export interface Controls {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  shoot: boolean;
  charging: boolean; // Whether player is holding the charge button
}

export const GAME_CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  PLAYER_SPEED: 5,
  PROJECTILE_SPEED: 8,
  ENEMY_SPEED: 2,
  SHOOT_COOLDOWN: 150,
  RAPID_FIRE_COOLDOWN: 50,
  ENEMY_SPAWN_RATE: 1500,
  POWER_UP_SPAWN_RATE: 8000,
  BOSS_SPAWN_RATE: 20000, // 20 seconds
  PLAYER_SIZE: 20,
  ENEMY_SIZE: 18,
  BOSS_SIZE: 40,
  PROJECTILE_SIZE: 4,
  POWER_UP_SIZE: 16,
  PLAYER_LIVES: 3,
  INVULNERABILITY_TIME: 2000,
  POWER_UP_DURATION: 10000, // 10 seconds
  SHIELD_DURATION: 8000, // 8 seconds
  BOSS_HEALTH: 15,
  BOSS_POINTS: 500,
  BOSS_SHOOT_COOLDOWN: 800,
  BOSS_INTRO_DURATION: 3000, // 3 seconds
  BOSS_DEFEAT_DURATION: 2500, // 2.5 seconds
  
  // Performance settings
  MAX_PARTICLES: 150, // Limit total particles for performance
  
  // Screen shake effects
  SCREEN_SHAKE: {
    ENEMY_DESTROY: { intensity: 3, duration: 200 },
    BOSS_DESTROY: { intensity: 8, duration: 800 },
    PLAYER_HIT: { intensity: 5, duration: 400 },
  },
  
  // Weapon upgrade system
  WEAPON_UPGRADES: {
    basic: {
      damage: 1,
      speed: 8,
      cooldown: 200, // Increased from 150 for more deliberate shooting
    },
    laserCannon: {
      damage: 2,
      speed: 12,
      cooldown: 120,
      special: 'piercing' as const,
    },
    plasmaBeam: {
      damage: 3,
      speed: 10,
      cooldown: 100,
      special: 'explosive' as const,
    },
    homingMissiles: {
      damage: 4,
      speed: 6,
      cooldown: 200,
      special: 'tracking' as const,
    },
  },
  // Weapon charging and overheating system
  WEAPON_SYSTEM: {
    MAX_HEAT: 100,
    COOLING_RATE: 35, // Heat reduced per second (increased for better flow)
    MAX_CHARGE: 100,
    CHARGING_RATE: 60, // Charge gained per second (slightly increased)
    OVERHEAT_COOLDOWN: 1500, // 1.5 seconds cooldown when overheated (reduced)
    CHARGE_DECAY_RATE: 20, // Charge lost per second when not actively charging
    CHARGE_DECAY_DELAY: 1500, // Wait 1.5 seconds before charge starts decaying
    HEAT_PER_SHOT: {
      basic: 6, // Reduced from 8 to allow more sustained fire
      laserCannon: 10, // Reduced from 12
      plasmaBeam: 12, // Reduced from 15
      homingMissiles: 16, // Reduced from 20
    },
    // Multi-tier charge system with distinct levels
    CHARGE_LEVELS: {
      LEVEL_1: { threshold: 25, damageMultiplier: 1.3, name: 'Charged', heatMultiplier: 1.2 },
      LEVEL_2: { threshold: 50, damageMultiplier: 1.7, name: 'Overcharged', heatMultiplier: 1.4 },
      LEVEL_3: { threshold: 75, damageMultiplier: 2.2, name: 'Supercharged', heatMultiplier: 1.6 },
      LEVEL_4: { threshold: 100, damageMultiplier: 3.0, name: 'Maximum Power', heatMultiplier: 2.0 }
    },
    CHARGE_THRESHOLD: 25, // Minimum charge for any bonus effects (lowered)
  },
} as const;

// Helper function to get current charge level based on charge percentage
export function getChargeLevel(chargeLevel: number): { level: number; multiplier: number; name: string; heatMultiplier: number } {
  const levels = GAME_CONFIG.WEAPON_SYSTEM.CHARGE_LEVELS;
  
  if (chargeLevel >= levels.LEVEL_4.threshold) {
    return { level: 4, multiplier: levels.LEVEL_4.damageMultiplier, name: levels.LEVEL_4.name, heatMultiplier: levels.LEVEL_4.heatMultiplier };
  } else if (chargeLevel >= levels.LEVEL_3.threshold) {
    return { level: 3, multiplier: levels.LEVEL_3.damageMultiplier, name: levels.LEVEL_3.name, heatMultiplier: levels.LEVEL_3.heatMultiplier };
  } else if (chargeLevel >= levels.LEVEL_2.threshold) {
    return { level: 2, multiplier: levels.LEVEL_2.damageMultiplier, name: levels.LEVEL_2.name, heatMultiplier: levels.LEVEL_2.heatMultiplier };
  } else if (chargeLevel >= levels.LEVEL_1.threshold) {
    return { level: 1, multiplier: levels.LEVEL_1.damageMultiplier, name: levels.LEVEL_1.name, heatMultiplier: levels.LEVEL_1.heatMultiplier };
  } else {
    return { level: 0, multiplier: 1, name: 'Normal', heatMultiplier: 1 };
  }
}