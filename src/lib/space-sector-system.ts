export interface SpaceSector {
  id: string;
  name: string;
  coordinates: { x: number; y: number };
  type: SectorType;
  difficulty: number;
  resources: SectorResources;
  hazards: SectorHazard[];
  events: SectorEvent[];
  discovered: boolean;
  explored: boolean;
  hostileLevel: number; // 0-10 scale
  starDensity: number; // Affects background rendering
  nebula?: NebulaData;
  anomalies: SpaceAnomaly[];
}

export type SectorType = 
  | 'empty'          // Basic space with minimal encounters
  | 'asteroid'       // Rich in minerals, asteroid hazards
  | 'nebula'         // Reduced visibility, energy effects
  | 'debris'         // Ship graveyard, salvage opportunities
  | 'patrol'         // Heavy enemy presence
  | 'trading'        // Merchant encounters, peaceful
  | 'research'       // Scientific stations, tech upgrades
  | 'pirate'         // Pirate bases, high hostility
  | 'ancient'        // Alien ruins, mysterious events
  | 'unstable';      // Space-time anomalies

export interface SectorResources {
  minerals: number;
  energy: number;
  technology: number;
  salvage: number;
}

export interface SectorHazard {
  type: HazardType;
  intensity: number; // 1-5 scale
  duration: number;  // How long it affects the player
  position?: { x: number; y: number }; // For localized hazards
}

export type HazardType = 
  | 'asteroids'      // Asteroid field navigation
  | 'radiation'      // Gradual shield/health drain
  | 'gravity'        // Affects ship movement
  | 'magnetic'       // Interferes with targeting
  | 'energy_storm'   // Weapons malfunction temporarily
  | 'ion_storm'      // Electronics interference
  | 'solar_flare'    // Sudden damage burst
  | 'dark_matter'    // Inverts controls temporarily
  | 'temporal'       // Time distortion effects
  | 'psychic';       // Alien influence on systems

export interface SectorEvent {
  id: string;
  type: EventType;
  priority: number; // Higher priority events trigger first
  conditions: EventCondition[];
  rewards: EventReward[];
  consequences: EventConsequence[];
  description: string;
  choices?: EventChoice[];
  triggered: boolean;
  repeatable: boolean;
}

export type EventType = 
  | 'encounter'      // Enemy or neutral ship encounter
  | 'discovery'      // Find something interesting
  | 'distress'       // Help request from other ships
  | 'merchant'       // Trading opportunity
  | 'ambush'         // Surprise attack
  | 'anomaly'        // Strange space phenomenon
  | 'derelict'       // Abandoned ship/station
  | 'patrol'         // Law enforcement encounter
  | 'pirates'        // Pirate encounter
  | 'aliens'         // Alien contact
  | 'treasure'       // Hidden cache discovery
  | 'trap';          // Dangerous situation

export interface EventCondition {
  type: 'player_health' | 'player_score' | 'sector_type' | 'random_chance' | 'resources' | 'weapons';
  operator: '>' | '<' | '=' | '>=' | '<=';
  value: number | string;
}

export interface EventReward {
  type: 'credits' | 'health' | 'weapons' | 'powerup' | 'experience' | 'technology' | 'map_data';
  amount: number;
  description: string;
}

export interface EventConsequence {
  type: 'damage' | 'weapon_loss' | 'resource_loss' | 'enemy_spawn' | 'hazard_add';
  amount: number;
  description: string;
}

export interface EventChoice {
  id: string;
  text: string;
  requirements?: EventCondition[];
  rewards: EventReward[];
  consequences: EventConsequence[];
  successChance: number; // 0-1 probability
}

export interface NebulaData {
  color: string;
  density: number; // Affects visibility
  energyEffect: number; // Positive/negative energy regeneration
  type: 'emission' | 'reflection' | 'dark' | 'plasma';
}

export interface SpaceAnomaly {
  id: string;
  type: AnomalyType;
  position: { x: number; y: number };
  radius: number;
  effect: AnomalyEffect;
  discovered: boolean;
}

export type AnomalyType = 
  | 'wormhole'       // Instant travel to distant sector
  | 'time_rift'      // Temporal effects
  | 'energy_well'    // Gravitational effects
  | 'quantum_field'  // Weapon enhancement
  | 'dark_zone'      // Sensors don't work
  | 'hyperspace'     // Faster travel
  | 'mirror'         // Duplicate enemies/items
  | 'void'           // Drains everything slowly
  | 'crystal'        // Technology enhancement
  | 'psionic';       // Mental effects

export interface AnomalyEffect {
  type: 'beneficial' | 'neutral' | 'harmful';
  magnitude: number;
  duration: number;
  description: string;
}

export interface SectorMap {
  currentSector: SpaceSector;
  discoveredSectors: Map<string, SpaceSector>;
  playerPosition: { x: number; y: number };
  explorationRange: number; // How far player can see
}

// Procedural generation functions
export function generateSectorName(type: SectorType, coordinates: { x: number; y: number }): string {
  const prefixes = {
    empty: ['Void', 'Deep', 'Silent', 'Distant', 'Cold'],
    asteroid: ['Rocky', 'Mineral', 'Boulder', 'Debris', 'Crater'],
    nebula: ['Misty', 'Glowing', 'Ethereal', 'Cosmic', 'Radiant'],
    debris: ['Wreck', 'Graveyard', 'Salvage', 'Ruin', 'Bones'],
    patrol: ['Guardian', 'Watch', 'Sentinel', 'Fortress', 'Shield'],
    trading: ['Market', 'Commerce', 'Trade', 'Exchange', 'Haven'],
    research: ['Science', 'Study', 'Discovery', 'Lab', 'Research'],
    pirate: ['Raider', 'Outlaw', 'Rogue', 'Bandit', 'Crimson'],
    ancient: ['Ancient', 'Forgotten', 'Lost', 'Mysterious', 'Primordial'],
    unstable: ['Chaos', 'Flux', 'Unstable', 'Shifting', 'Anomalous']
  };

  const suffixes = ['Sector', 'Zone', 'Region', 'Quadrant', 'System', 'Space', 'Field', 'Expanse'];
  
  const prefix = prefixes[type][Math.floor(Math.random() * prefixes[type].length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  const number = Math.abs(coordinates.x * 13 + coordinates.y * 17) % 999 + 1;
  
  return `${prefix} ${suffix} ${number.toString().padStart(3, '0')}`;
}

export function generateSector(coordinates: { x: number; y: number }, seed?: number): SpaceSector {
  // Use coordinates as seed for deterministic generation
  const rng = createSeededRandom(coordinates.x * 1000 + coordinates.y + (seed || 0));
  
  // Determine sector type based on distance from origin and randomness
  const distanceFromOrigin = Math.sqrt(coordinates.x * coordinates.x + coordinates.y * coordinates.y);
  const sectorType = determineSectorType(distanceFromOrigin, rng);
  
  const sector: SpaceSector = {
    id: `${coordinates.x},${coordinates.y}`,
    name: generateSectorName(sectorType, coordinates),
    coordinates,
    type: sectorType,
    difficulty: Math.min(10, Math.floor(distanceFromOrigin / 2) + Math.floor(rng() * 3)),
    resources: generateSectorResources(sectorType, rng),
    hazards: generateSectorHazards(sectorType, distanceFromOrigin, rng),
    events: generateSectorEvents(sectorType, distanceFromOrigin, rng),
    discovered: false,
    explored: false,
    hostileLevel: generateHostileLevel(sectorType, distanceFromOrigin, rng),
    starDensity: 0.3 + rng() * 0.7,
    nebula: sectorType === 'nebula' ? generateNebula(rng) : undefined,
    anomalies: generateAnomalies(sectorType, rng)
  };
  
  return sector;
}

function createSeededRandom(seed: number): () => number {
  let x = Math.sin(seed) * 10000;
  return () => {
    x = Math.sin(x) * 10000;
    return x - Math.floor(x);
  };
}

function determineSectorType(distance: number, rng: () => number): SectorType {
  const roll = rng();
  
  // Starting area (distance < 3) has safer sectors
  if (distance < 3) {
    if (roll < 0.4) return 'empty';
    if (roll < 0.6) return 'asteroid';
    if (roll < 0.8) return 'trading';
    return 'research';
  }
  
  // Mid-range (distance 3-10) introduces more variety
  if (distance < 10) {
    if (roll < 0.2) return 'empty';
    if (roll < 0.35) return 'asteroid';
    if (roll < 0.45) return 'nebula';
    if (roll < 0.55) return 'debris';
    if (roll < 0.7) return 'patrol';
    if (roll < 0.8) return 'trading';
    if (roll < 0.9) return 'research';
    return 'pirate';
  }
  
  // Far sectors (distance > 10) are more dangerous
  if (roll < 0.1) return 'empty';
  if (roll < 0.2) return 'asteroid';
  if (roll < 0.3) return 'nebula';
  if (roll < 0.4) return 'debris';
  if (roll < 0.5) return 'patrol';
  if (roll < 0.6) return 'pirate';
  if (roll < 0.7) return 'ancient';
  if (roll < 0.85) return 'unstable';
  return 'research';
}

function generateSectorResources(type: SectorType, rng: () => number): SectorResources {
  const base = { minerals: 0, energy: 0, technology: 0, salvage: 0 };
  
  switch (type) {
    case 'asteroid':
      base.minerals = 5 + Math.floor(rng() * 10);
      break;
    case 'nebula':
      base.energy = 3 + Math.floor(rng() * 8);
      break;
    case 'debris':
      base.salvage = 4 + Math.floor(rng() * 12);
      break;
    case 'research':
      base.technology = 3 + Math.floor(rng() * 7);
      break;
    case 'ancient':
      base.technology = 8 + Math.floor(rng() * 15);
      base.energy = 2 + Math.floor(rng() * 5);
      break;
    default:
      // Random small amounts for other sectors
      if (rng() < 0.3) base.minerals = Math.floor(rng() * 3);
      if (rng() < 0.3) base.energy = Math.floor(rng() * 3);
      if (rng() < 0.2) base.technology = Math.floor(rng() * 2);
      if (rng() < 0.2) base.salvage = Math.floor(rng() * 3);
  }
  
  return base;
}

function generateSectorHazards(type: SectorType, distance: number, rng: () => number): SectorHazard[] {
  const hazards: SectorHazard[] = [];
  const hazardChance = Math.min(0.8, distance * 0.1 + 0.2);
  
  if (rng() < hazardChance) {
    const hazardTypes: { [key in SectorType]: HazardType[] } = {
      empty: ['radiation', 'dark_matter'],
      asteroid: ['asteroids', 'gravity'],
      nebula: ['energy_storm', 'ion_storm'],
      debris: ['magnetic', 'radiation'],
      patrol: ['ion_storm'],
      trading: [],
      research: ['temporal', 'psychic'],
      pirate: ['magnetic', 'solar_flare'],
      ancient: ['psychic', 'temporal', 'dark_matter'],
      unstable: ['temporal', 'gravity', 'dark_matter', 'energy_storm']
    };
    
    const possibleHazards = hazardTypes[type];
    if (possibleHazards.length > 0) {
      const hazardType = possibleHazards[Math.floor(rng() * possibleHazards.length)];
      hazards.push({
        type: hazardType,
        intensity: Math.min(5, Math.floor(distance / 3) + Math.floor(rng() * 3) + 1),
        duration: 5000 + Math.floor(rng() * 10000), // 5-15 seconds
        position: rng() < 0.5 ? {
          x: rng() * 800,
          y: rng() * 600
        } : undefined
      });
    }
  }
  
  return hazards;
}

function generateSectorEvents(type: SectorType, distance: number, rng: () => number): SectorEvent[] {
  const events: SectorEvent[] = [];
  // Reduced event chance and made it less likely for starting sectors
  const baseChance = distance === 0 ? 0.1 : 0.4; // Very low chance for starting sector
  const eventChance = Math.min(0.6, distance * 0.05 + baseChance);
  
  if (rng() < eventChance) {
    const eventTypes: { [key in SectorType]: EventType[] } = {
      empty: ['discovery', 'anomaly'],
      asteroid: ['discovery', 'encounter', 'trap'],
      nebula: ['anomaly', 'discovery', 'aliens'],
      debris: ['derelict', 'discovery', 'treasure'],
      patrol: ['patrol', 'encounter'],
      trading: ['merchant', 'encounter'],
      research: ['discovery', 'encounter', 'anomaly'],
      pirate: ['pirates', 'ambush', 'treasure'],
      ancient: ['aliens', 'discovery', 'anomaly', 'treasure'],
      unstable: ['anomaly', 'trap', 'discovery']
    };
    
    const possibleEvents = eventTypes[type];
    const eventType = possibleEvents[Math.floor(rng() * possibleEvents.length)];
    
    events.push(generateSpecificEvent(eventType, distance, rng));
  }
  
  return events;
}

function generateSpecificEvent(type: EventType, distance: number, rng: () => number): SectorEvent {
  const baseEvent: SectorEvent = {
    id: `event_${Date.now()}_${Math.floor(rng() * 10000)}`,
    type,
    priority: Math.floor(rng() * 10),
    conditions: [],
    rewards: [],
    consequences: [],
    description: '',
    triggered: false,
    repeatable: false
  };
  
  switch (type) {
    case 'discovery':
      baseEvent.description = "Long-range sensors detect an unusual energy signature nearby.";
      baseEvent.conditions = [
        {
          type: 'random_chance',
          operator: '<',
          value: 0.25 // Reduced from 0.8 to prevent immediate spam
        }
      ];
      baseEvent.rewards = [{
        type: 'experience',
        amount: 10 + Math.floor(distance * 2),
        description: 'Scientific discovery'
      }];
      if (rng() < 0.4) {
        baseEvent.rewards.push({
          type: 'technology',
          amount: 1 + Math.floor(rng() * 3),
          description: 'Advanced technology fragment'
        });
      }
      break;
      
    case 'merchant':
      baseEvent.description = "A merchant vessel offers to trade resources for credits.";
      baseEvent.choices = [
        {
          id: 'trade_accept',
          text: 'Accept trade offer',
          rewards: [{
            type: 'powerup',
            amount: 1,
            description: 'Weapon upgrade'
          }],
          consequences: [{
            type: 'resource_loss',
            amount: 50,
            description: 'Credits spent'
          }],
          successChance: 1.0
        },
        {
          id: 'trade_decline',
          text: 'Decline and continue',
          rewards: [],
          consequences: [],
          successChance: 1.0
        }
      ];
      break;
      
    case 'ambush':
      baseEvent.description = "Warning! Multiple hostile signatures detected - it's a trap!";
      baseEvent.consequences = [{
        type: 'enemy_spawn',
        amount: 3 + Math.floor(distance / 2),
        description: 'Ambush fleet'
      }];
      baseEvent.rewards = [{
        type: 'credits',
        amount: 100 + Math.floor(distance * 20),
        description: 'Combat bonus'
      }];
      break;
      
    case 'derelict':
      baseEvent.description = "Sensors detect a derelict vessel floating in space.";
      baseEvent.choices = [
        {
          id: 'investigate',
          text: 'Board and investigate',
          rewards: [{
            type: 'credits',
            amount: 50 + Math.floor(rng() * 200),
            description: 'Salvaged materials'
          }],
          consequences: rng() < 0.3 ? [{
            type: 'damage',
            amount: 1,
            description: 'Booby trap damage'
          }] : [],
          successChance: 0.7
        },
        {
          id: 'scan_only',
          text: 'Scan from safe distance',
          rewards: [{
            type: 'map_data',
            amount: 1,
            description: 'Navigation data'
          }],
          consequences: [],
          successChance: 1.0
        }
      ];
      break;
      
    case 'anomaly':
      baseEvent.description = "Space-time readings are off the charts - there's something strange here.";
      baseEvent.rewards = [{
        type: 'experience',
        amount: 20 + Math.floor(distance * 3),
        description: 'Scientific analysis'
      }];
      if (rng() < 0.6) {
        baseEvent.consequences = [{
          type: 'hazard_add',
          amount: 1,
          description: 'Temporal distortion field'
        }];
      }
      break;
      
    default:
      baseEvent.description = "Something interesting happens in this sector.";
      baseEvent.rewards = [{
        type: 'experience',
        amount: 5 + Math.floor(distance),
        description: 'Exploration bonus'
      }];
  }
  
  return baseEvent;
}

function generateHostileLevel(type: SectorType, distance: number, rng: () => number): number {
  const baseHostility = {
    empty: 1,
    asteroid: 2,
    nebula: 2,
    debris: 3,
    patrol: 6,
    trading: 1,
    research: 2,
    pirate: 8,
    ancient: 4,
    unstable: 5
  };
  
  const base = baseHostility[type];
  const distanceBonus = Math.floor(distance / 3);
  const randomVariation = Math.floor(rng() * 3) - 1;
  
  return Math.max(0, Math.min(10, base + distanceBonus + randomVariation));
}

function generateNebula(rng: () => number): NebulaData {
  const types: NebulaData['type'][] = ['emission', 'reflection', 'dark', 'plasma'];
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#a8e6cf'];
  
  return {
    type: types[Math.floor(rng() * types.length)],
    color: colors[Math.floor(rng() * colors.length)],
    density: 0.3 + rng() * 0.7,
    energyEffect: (rng() - 0.5) * 2 // -1 to +1
  };
}

function generateAnomalies(type: SectorType, rng: () => number): SpaceAnomaly[] {
  const anomalies: SpaceAnomaly[] = [];
  
  // Higher chance of anomalies in certain sector types
  const anomalyChance = {
    empty: 0.1,
    asteroid: 0.15,
    nebula: 0.3,
    debris: 0.2,
    patrol: 0.05,
    trading: 0.05,
    research: 0.4,
    pirate: 0.1,
    ancient: 0.6,
    unstable: 0.8
  };
  
  if (rng() < anomalyChance[type]) {
    const anomalyTypes: AnomalyType[] = ['wormhole', 'time_rift', 'energy_well', 'quantum_field', 'dark_zone', 'hyperspace', 'mirror', 'void', 'crystal', 'psionic'];
    const anomalyType = anomalyTypes[Math.floor(rng() * anomalyTypes.length)];
    
    anomalies.push({
      id: `anomaly_${Date.now()}_${Math.floor(rng() * 10000)}`,
      type: anomalyType,
      position: {
        x: 100 + rng() * 600,
        y: 100 + rng() * 400
      },
      radius: 30 + rng() * 70,
      effect: generateAnomalyEffect(anomalyType, rng),
      discovered: false
    });
  }
  
  return anomalies;
}

function generateAnomalyEffect(type: AnomalyType, rng: () => number): AnomalyEffect {
  const effects: { [key in AnomalyType]: AnomalyEffect } = {
    wormhole: {
      type: 'beneficial',
      magnitude: 1,
      duration: 0,
      description: 'Instant travel to distant sector'
    },
    time_rift: {
      type: 'neutral',
      magnitude: 0.5,
      duration: 10000,
      description: 'Time moves differently here'
    },
    energy_well: {
      type: 'harmful',
      magnitude: 0.3,
      duration: 8000,
      description: 'Gravitational anomaly affects movement'
    },
    quantum_field: {
      type: 'beneficial',
      magnitude: 1.5,
      duration: 15000,
      description: 'Weapons operate with enhanced efficiency'
    },
    dark_zone: {
      type: 'harmful',
      magnitude: 0.8,
      duration: 12000,
      description: 'Sensors and targeting systems compromised'
    },
    hyperspace: {
      type: 'beneficial',
      magnitude: 2.0,
      duration: 10000,
      description: 'Enhanced propulsion systems'
    },
    mirror: {
      type: 'neutral',
      magnitude: 1.0,
      duration: 0,
      description: 'Reality seems duplicated'
    },
    void: {
      type: 'harmful',
      magnitude: 0.1,
      duration: 20000,
      description: 'Energy slowly drains away'
    },
    crystal: {
      type: 'beneficial',
      magnitude: 1.3,
      duration: 12000,
      description: 'Technology systems enhanced'
    },
    psionic: {
      type: 'harmful',
      magnitude: 0.7,
      duration: 8000,
      description: 'Mental interference affects control systems'
    }
  };
  
  return effects[type];
}

// Sector navigation and management functions
export function createSectorMap(startingCoordinates: { x: number; y: number } = { x: 0, y: 0 }): SectorMap {
  const startingSector = generateSector(startingCoordinates);
  startingSector.discovered = true;
  startingSector.explored = true;
  
  return {
    currentSector: startingSector,
    discoveredSectors: new Map([[startingSector.id, startingSector]]),
    playerPosition: startingCoordinates,
    explorationRange: 2
  };
}

export function moveTo(sectorMap: SectorMap, newCoordinates: { x: number; y: number }): SectorMap {
  const sectorId = `${newCoordinates.x},${newCoordinates.y}`;
  
  let targetSector = sectorMap.discoveredSectors.get(sectorId);
  if (!targetSector) {
    targetSector = generateSector(newCoordinates);
    targetSector.discovered = true;
  }
  targetSector.explored = true;
  
  const newDiscoveredSectors = new Map(sectorMap.discoveredSectors);
  newDiscoveredSectors.set(sectorId, targetSector);
  
  // Auto-discover adjacent sectors within exploration range
  for (let dx = -sectorMap.explorationRange; dx <= sectorMap.explorationRange; dx++) {
    for (let dy = -sectorMap.explorationRange; dy <= sectorMap.explorationRange; dy++) {
      if (dx === 0 && dy === 0) continue;
      
      const adjCoords = { x: newCoordinates.x + dx, y: newCoordinates.y + dy };
      const adjId = `${adjCoords.x},${adjCoords.y}`;
      
      if (!newDiscoveredSectors.has(adjId)) {
        const adjSector = generateSector(adjCoords);
        adjSector.discovered = true;
        newDiscoveredSectors.set(adjId, adjSector);
      }
    }
  }
  
  return {
    ...sectorMap,
    currentSector: targetSector,
    discoveredSectors: newDiscoveredSectors,
    playerPosition: newCoordinates
  };
}

export function getAdjacentSectors(coordinates: { x: number; y: number }): { x: number; y: number }[] {
  return [
    { x: coordinates.x - 1, y: coordinates.y },     // West
    { x: coordinates.x + 1, y: coordinates.y },     // East
    { x: coordinates.x, y: coordinates.y - 1 },     // North
    { x: coordinates.x, y: coordinates.y + 1 },     // South
    { x: coordinates.x - 1, y: coordinates.y - 1 }, // Northwest
    { x: coordinates.x + 1, y: coordinates.y - 1 }, // Northeast
    { x: coordinates.x - 1, y: coordinates.y + 1 }, // Southwest
    { x: coordinates.x + 1, y: coordinates.y + 1 }  // Southeast
  ];
}

export function triggerSectorEvent(sector: SpaceSector, eventId: string): SectorEvent | null {
  const event = sector.events.find(e => e.id === eventId && !e.triggered);
  if (event) {
    event.triggered = true;
    return event;
  }
  return null;
}

export function applyAnomalyEffect(anomaly: SpaceAnomaly, gameState: any): any {
  // This will be implemented in the game engine integration
  anomaly.discovered = true;
  return gameState;
}