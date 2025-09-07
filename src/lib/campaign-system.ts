import { Mission, CampaignProgress, MissionObjective, GameState, WeaponType } from './game-types';
import { canAffordWeapon, getWeaponUnlockRequirement, getWeaponUpgradeCost, createWeaponUpgrade } from './weapon-system';

export const CAMPAIGN_MISSIONS: Mission[] = [
  {
    id: 'tutorial',
    name: 'First Contact',
    description: 'Learn the basics of space combat',
    story: 'Strange ships have appeared at the edge of our solar system. Command wants you to investigate and report back. This should be a simple reconnaissance mission...',
    objectives: [
      {
        id: 'destroy_5_enemies',
        type: 'destroyEnemies',
        target: 5,
        current: 0,
        description: 'Destroy 5 enemy fighters',
        required: true
      },
      {
        id: 'survive_30s',
        type: 'survivetime',
        target: 30000,
        current: 0,
        description: 'Survive for 30 seconds',
        required: true
      }
    ],
    enemyWaves: [
      { delay: 2000, enemyType: 'basic', count: 2 },
      { delay: 5000, enemyType: 'basic', count: 1 },
      { delay: 8000, enemyType: 'basic', count: 2 }
    ],
    rewards: {
      experience: 100,
      weaponUpgrade: 'laserCannon'
    },
    difficulty: 'easy',
    completed: false,
    bestScore: 0
  },
  {
    id: 'patrol_duty',
    name: 'Asteroid Patrol',
    description: 'Clear the asteroid belt of hostiles',
    story: 'Mining operations in the asteroid belt have been disrupted by enemy raiders. Patrol the area and eliminate any threats you encounter.',
    objectives: [
      {
        id: 'destroy_12_enemies',
        type: 'destroyEnemies',
        target: 12,
        current: 0,
        description: 'Eliminate 12 enemy raiders',
        required: true
      },
      {
        id: 'collect_powerups',
        type: 'collectPowerUps',
        target: 3,
        current: 0,
        description: 'Collect 3 power-ups',
        required: false
      }
    ],
    enemyWaves: [
      { delay: 1000, enemyType: 'basic', count: 3 },
      { delay: 4000, enemyType: 'basic', count: 2 },
      { delay: 7000, enemyType: 'basic', count: 4 },
      { delay: 12000, enemyType: 'basic', count: 3 }
    ],
    rewards: {
      experience: 200,
      credits: 150
    },
    unlockRequirement: 'tutorial',
    difficulty: 'easy',
    completed: false,
    bestScore: 0
  },
  {
    id: 'first_boss',
    name: 'The Destroyer',
    description: 'Face your first capital ship',
    story: 'Intelligence reports indicate a large enemy vessel is approaching Earth. This Destroyer-class ship poses a significant threat. You must engage and destroy it before it reaches our defensive perimeter.',
    objectives: [
      {
        id: 'defeat_destroyer',
        type: 'defeatBoss',
        target: 1,
        current: 0,
        description: 'Defeat the Destroyer',
        required: true
      },
      {
        id: 'no_deaths',
        type: 'survivetime',
        target: 999999,
        current: 0,
        description: 'Complete without losing a life',
        required: false
      }
    ],
    enemyWaves: [
      { delay: 3000, enemyType: 'basic', count: 2 },
      { delay: 8000, enemyType: 'boss', count: 1, bossType: 'destroyer' }
    ],
    rewards: {
      experience: 400,
      weaponUpgrade: 'plasmaBeam',
      credits: 300
    },
    unlockRequirement: 'patrol_duty',
    difficulty: 'medium',
    completed: false,
    bestScore: 0
  },
  {
    id: 'deep_space',
    name: 'Deep Space Reconnaissance',
    description: 'Venture into unknown territory',
    story: 'Our scouts have detected unusual energy readings from the outer rim. Command needs you to investigate this sector and report on any hostile activity.',
    objectives: [
      {
        id: 'survive_90s',
        type: 'survivetime',
        target: 90000,
        current: 0,
        description: 'Survive for 90 seconds',
        required: true
      },
      {
        id: 'destroy_20_enemies',
        type: 'destroyEnemies',
        target: 20,
        current: 0,
        description: 'Destroy 20 enemy scouts',
        required: true
      }
    ],
    enemyWaves: [
      { delay: 2000, enemyType: 'basic', count: 3 },
      { delay: 8000, enemyType: 'basic', count: 4 },
      { delay: 15000, enemyType: 'basic', count: 3 },
      { delay: 25000, enemyType: 'basic', count: 5 },
      { delay: 35000, enemyType: 'basic', count: 4 },
      { delay: 50000, enemyType: 'basic', count: 6 },
      { delay: 65000, enemyType: 'basic', count: 5 }
    ],
    duration: 90000,
    rewards: {
      experience: 350,
      credits: 250
    },
    unlockRequirement: 'first_boss',
    difficulty: 'medium',
    completed: false,
    bestScore: 0
  },
  {
    id: 'interceptor_challenge',
    name: 'Speed Demon',
    description: 'Face the fastest enemy ship',
    story: 'A new type of enemy vessel has been spotted - the Interceptor. This ship is incredibly fast and agile. Intel suggests it may be testing our defenses for a larger assault.',
    objectives: [
      {
        id: 'defeat_interceptor',
        type: 'defeatBoss',
        target: 1,
        current: 0,
        description: 'Defeat the Interceptor',
        required: true
      },
      {
        id: 'quick_victory',
        type: 'survivetime',
        target: 60000,
        current: 0,
        description: 'Complete mission in under 60 seconds',
        required: false
      }
    ],
    enemyWaves: [
      { delay: 5000, enemyType: 'basic', count: 3 },
      { delay: 12000, enemyType: 'boss', count: 1, bossType: 'interceptor' }
    ],
    rewards: {
      experience: 500,
      weaponUpgrade: 'homingMissiles',
      credits: 400
    },
    unlockRequirement: 'deep_space',
    difficulty: 'hard',
    completed: false,
    bestScore: 0
  },
  {
    id: 'titan_assault',
    name: 'Fortress Assault',
    description: 'Assault the enemy command ship',
    story: 'The enemy has deployed their most powerful vessel - the Titan. This massive fortress ship is heavily armored and poses the greatest threat we have ever faced. This is humanity\'s last stand.',
    objectives: [
      {
        id: 'defeat_titan',
        type: 'defeatBoss',
        target: 1,
        current: 0,
        description: 'Defeat the Titan',
        required: true
      },
      {
        id: 'destroy_escorts',
        type: 'destroyEnemies',
        target: 8,
        current: 0,
        description: 'Destroy 8 escort fighters',
        required: true
      }
    ],
    enemyWaves: [
      { delay: 3000, enemyType: 'basic', count: 4 },
      { delay: 8000, enemyType: 'basic', count: 4 },
      { delay: 15000, enemyType: 'boss', count: 1, bossType: 'titan' }
    ],
    rewards: {
      experience: 800,
      credits: 600
    },
    unlockRequirement: 'interceptor_challenge',
    difficulty: 'extreme',
    completed: false,
    bestScore: 0
  }
];

export const createInitialCampaignProgress = (): CampaignProgress => ({
  currentMission: 'tutorial',
  completedMissions: [],
  totalExperience: 0,
  playerLevel: 1,
  availableCredits: 500, // Start with some credits for the weapon system
  unlockedWeapons: ['basic'],
  weaponLevels: {
    basic: 1,
    laserCannon: 1,
    plasmaBeam: 1,
    homingMissiles: 1,
    railgun: 1,
    shotgun: 1,
    chaingun: 1,
    ionCannon: 1,
    quantumRifle: 1,
    fusionTorpedo: 1,
  },
  shipUpgrades: {
    armor: 0,
    speed: 0,
    weapons: 0,
    shielding: 0,
    chargePreservation: 0
  }
});

export const getMissionById = (id: string): Mission | undefined => {
  return CAMPAIGN_MISSIONS.find(mission => mission.id === id);
};

export const getAvailableMissions = (progress: CampaignProgress): Mission[] => {
  return CAMPAIGN_MISSIONS.filter(mission => {
    if (mission.completed) return false;
    if (!mission.unlockRequirement) return true;
    return progress.completedMissions.includes(mission.unlockRequirement);
  });
};

export const updateMissionObjectives = (
  mission: Mission, 
  gameState: GameState, 
  eventType: 'enemyDestroyed' | 'powerUpCollected' | 'bossDefeated' | 'timeUpdate'
): void => {
  if (!gameState.missionProgress) return;

  mission.objectives.forEach(objective => {
    switch (eventType) {
      case 'enemyDestroyed':
        if (objective.type === 'destroyEnemies') {
          objective.current = Math.min(objective.current + 1, objective.target);
        }
        break;
      case 'powerUpCollected':
        if (objective.type === 'collectPowerUps') {
          objective.current = Math.min(objective.current + 1, objective.target);
        }
        break;
      case 'bossDefeated':
        if (objective.type === 'defeatBoss') {
          objective.current = Math.min(objective.current + 1, objective.target);
        }
        break;
      case 'timeUpdate':
        if (objective.type === 'survivetime') {
          objective.current = gameState.missionProgress.timeElapsed;
        }
        break;
    }
  });
};

export const checkMissionComplete = (mission: Mission): boolean => {
  return mission.objectives
    .filter(obj => obj.required)
    .every(obj => obj.current >= obj.target);
};

export const calculateMissionScore = (mission: Mission, gameState: GameState): number => {
  if (!gameState.missionProgress) return 0;
  
  let score = gameState.score;
  
  // Bonus for completing objectives
  const completedObjectives = mission.objectives.filter(obj => obj.current >= obj.target);
  score += completedObjectives.length * 100;
  
  // Time bonus for quick completion
  if (gameState.missionProgress.timeElapsed < 60000) {
    score += 500;
  } else if (gameState.missionProgress.timeElapsed < 120000) {
    score += 250;
  }
  
  // Difficulty multiplier
  const difficultyMultiplier = {
    easy: 1,
    medium: 1.25,
    hard: 1.5,
    extreme: 2
  };
  
  return Math.floor(score * difficultyMultiplier[mission.difficulty]);
};

export const updateCampaignProgress = (
  progress: CampaignProgress, 
  mission: Mission, 
  missionScore: number
): CampaignProgress => {
  const newProgress = { ...progress };
  
  // Mark mission as completed
  if (!newProgress.completedMissions.includes(mission.id)) {
    newProgress.completedMissions.push(mission.id);
  }
  
  // Update mission data
  mission.completed = true;
  mission.bestScore = Math.max(mission.bestScore, missionScore);
  
  // Add experience and credits
  newProgress.totalExperience += mission.rewards.experience;
  newProgress.availableCredits += mission.rewards.credits || 0;
  
  // Unlock weapon
  if (mission.rewards.weaponUpgrade && !newProgress.unlockedWeapons.includes(mission.rewards.weaponUpgrade)) {
    newProgress.unlockedWeapons.push(mission.rewards.weaponUpgrade);
  }
  
  // Level up calculation
  const newLevel = Math.floor(newProgress.totalExperience / 500) + 1;
  newProgress.playerLevel = newLevel;
  
  // Update current mission to next available
  const availableMissions = getAvailableMissions(newProgress);
  if (availableMissions.length > 0) {
    newProgress.currentMission = availableMissions[0].id;
  }
  
  return newProgress;
};

export const getShipUpgradeCost = (currentLevel: number): number => {
  return 100 + (currentLevel * 50);
};

export const upgradeShipComponent = (
  progress: CampaignProgress, 
  component: keyof CampaignProgress['shipUpgrades']
): CampaignProgress | null => {
  const cost = getShipUpgradeCost(progress.shipUpgrades[component]);
  
  if (progress.availableCredits < cost || progress.shipUpgrades[component] >= 5) {
    return null;
  }
  
  const newProgress = { ...progress };
  newProgress.availableCredits -= cost;
  newProgress.shipUpgrades[component]++;
  
  return newProgress;
};

export const purchaseWeapon = (
  progress: CampaignProgress,
  weaponType: WeaponType
): CampaignProgress | null => {
  if (!canAffordWeapon(weaponType, progress.availableCredits, progress.playerLevel)) {
    return null;
  }
  
  if (progress.unlockedWeapons.includes(weaponType)) {
    return null; // Already owned
  }
  
  const cost = getWeaponUnlockRequirement(weaponType).credits;
  const newProgress = { ...progress };
  newProgress.availableCredits -= cost;
  newProgress.unlockedWeapons.push(weaponType);
  
  return newProgress;
};

export const upgradeWeaponInCampaign = (
  progress: CampaignProgress,
  weaponType: WeaponType
): CampaignProgress | null => {
  if (!progress.unlockedWeapons.includes(weaponType)) {
    return null; // Don't own weapon
  }
  
  const currentLevel = progress.weaponLevels[weaponType] || 1;
  if (currentLevel >= 5) {
    return null; // Max level
  }
  
  const weapon = createWeaponUpgrade(weaponType, currentLevel);
  const cost = getWeaponUpgradeCost(weapon);
  
  if (progress.availableCredits < cost) {
    return null; // Can't afford
  }
  
  const newProgress = { ...progress };
  newProgress.availableCredits -= cost;
  newProgress.weaponLevels[weaponType] = currentLevel + 1;
  
  return newProgress;
};