import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { SectorMap, SpaceSector, getAdjacentSectors } from '../lib/space-sector-system';
import { MapPin, Star, Lightning, Shield, Warning, Coins, Wrench, Cpu, Package } from '@phosphor-icons/react';

interface SectorMapUIProps {
  sectorMap: SectorMap;
  onMoveTo: (coordinates: { x: number; y: number }) => void;
  onCloseMap: () => void;
  playerResources?: {
    credits: number;
    technology: number;
    experience: number;
  };
}

export function SectorMapUI({ sectorMap, onMoveTo, onCloseMap, playerResources }: SectorMapUIProps) {
  const { currentSector, discoveredSectors, playerPosition, explorationRange } = sectorMap;
  
  // Calculate map boundaries
  const sectors = Array.from(discoveredSectors.values());
  const minX = Math.min(...sectors.map(s => s.coordinates.x)) - 1;
  const maxX = Math.max(...sectors.map(s => s.coordinates.x)) + 1;
  const minY = Math.min(...sectors.map(s => s.coordinates.y)) - 1;
  const maxY = Math.max(...sectors.map(s => s.coordinates.y)) + 1;
  
  const getSectorTypeColor = (type: SpaceSector['type']) => {
    const colors = {
      empty: 'bg-slate-700 border-slate-600',
      asteroid: 'bg-amber-700 border-amber-600',
      nebula: 'bg-purple-700 border-purple-600',
      debris: 'bg-gray-700 border-gray-600',
      patrol: 'bg-blue-700 border-blue-600',
      trading: 'bg-green-700 border-green-600',
      research: 'bg-cyan-700 border-cyan-600',
      pirate: 'bg-red-700 border-red-600',
      ancient: 'bg-indigo-700 border-indigo-600',
      unstable: 'bg-pink-700 border-pink-600'
    };
    return colors[type] || colors.empty;
  };
  
  const getSectorIcon = (type: SpaceSector['type']) => {
    const icons = {
      empty: Star,
      asteroid: Package,
      nebula: Lightning,
      debris: Wrench,
      patrol: Shield,
      trading: Coins,
      research: Cpu,
      pirate: Warning,
      ancient: Star,
      unstable: Lightning
    };
    const Icon = icons[type] || Star;
    return <Icon size={16} />;
  };
  
  const getHostilityColor = (level: number) => {
    if (level <= 2) return 'text-green-400';
    if (level <= 5) return 'text-yellow-400';
    if (level <= 7) return 'text-orange-400';
    return 'text-red-400';
  };
  
  const canMoveTo = (coordinates: { x: number; y: number }) => {
    const distance = Math.abs(coordinates.x - playerPosition.x) + Math.abs(coordinates.y - playerPosition.y);
    return distance <= 1; // Can only move to adjacent sectors
  };
  
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Sector Map</h1>
            <p className="text-muted-foreground">
              Current Location: {currentSector.name} ({playerPosition.x}, {playerPosition.y})
            </p>
          </div>
          
          {playerResources && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Coins className="text-yellow-400" size={20} />
                <span className="text-foreground font-semibold">{playerResources.credits}</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="text-cyan-400" size={20} />
                <span className="text-foreground font-semibold">{playerResources.technology}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="text-accent" size={20} />
                <span className="text-foreground font-semibold">{playerResources.experience}</span>
              </div>
            </div>
          )}
          
          <Button onClick={onCloseMap} variant="outline">
            Return to Game
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Grid */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Galaxy Map</CardTitle>
                <CardDescription>Click on adjacent sectors to travel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-1 p-4 bg-slate-900 rounded-lg overflow-auto max-h-96">
                  {Array.from({ length: maxY - minY + 1 }, (_, rowIndex) => {
                    const y = maxY - rowIndex; // Flip Y axis for natural map orientation
                    return (
                      <div key={y} className="flex gap-1">
                        {Array.from({ length: maxX - minX + 1 }, (_, colIndex) => {
                          const x = minX + colIndex;
                          const sectorId = `${x},${y}`;
                          const sector = discoveredSectors.get(sectorId);
                          const isPlayerLocation = x === playerPosition.x && y === playerPosition.y;
                          const isAdjacent = canMoveTo({ x, y });
                          
                          if (!sector) {
                            return (
                              <div
                                key={x}
                                className="w-12 h-12 bg-slate-800 border border-slate-700 rounded flex items-center justify-center text-xs text-slate-500"
                              >
                                ?
                              </div>
                            );
                          }
                          
                          return (
                            <button
                              key={x}
                              onClick={() => isAdjacent && !isPlayerLocation ? onMoveTo({ x, y }) : undefined}
                              disabled={!isAdjacent || isPlayerLocation}
                              className={`
                                w-12 h-12 border-2 rounded flex items-center justify-center text-xs relative
                                transition-all duration-200 hover:scale-105
                                ${getSectorTypeColor(sector.type)}
                                ${isPlayerLocation ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : ''}
                                ${isAdjacent && !isPlayerLocation ? 'cursor-pointer hover:brightness-125' : ''}
                                ${!isAdjacent && !isPlayerLocation ? 'opacity-60' : ''}
                              `}
                              title={`${sector.name} (${x}, ${y}) - ${sector.type}`}
                            >
                              {getSectorIcon(sector.type)}
                              {isPlayerLocation && (
                                <MapPin className="absolute -top-1 -right-1 text-accent" size={12} />
                              )}
                              {sector.events.length > 0 && !sector.events.every(e => e.triggered) && (
                                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full" />
                              )}
                              {sector.anomalies.length > 0 && (
                                <div className="absolute -top-1 -left-1 w-2 h-2 bg-purple-400 rounded-full" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-slate-700 border border-slate-600 rounded"></div>
                    <span>Empty</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-700 border border-amber-600 rounded"></div>
                    <span>Asteroid</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-700 border border-purple-600 rounded"></div>
                    <span>Nebula</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-700 border border-green-600 rounded"></div>
                    <span>Trading</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-700 border border-red-600 rounded"></div>
                    <span>Pirate</span>
                  </div>
                </div>
                
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span>Active Events</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Anomalies</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Current Sector Info */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getSectorIcon(currentSector.type)}
                  {currentSector.name}
                </CardTitle>
                <CardDescription>
                  {currentSector.type.charAt(0).toUpperCase() + currentSector.type.slice(1)} Sector
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Hostility Level</span>
                    <span className={`text-sm font-bold ${getHostilityColor(currentSector.hostileLevel)}`}>
                      {currentSector.hostileLevel}/10
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        currentSector.hostileLevel <= 2 ? 'bg-green-500' :
                        currentSector.hostileLevel <= 5 ? 'bg-yellow-500' :
                        currentSector.hostileLevel <= 7 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(currentSector.hostileLevel / 10) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <span className="text-sm font-medium">Difficulty</span>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 10 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < currentSector.difficulty ? 'bg-orange-400' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                {(currentSector.resources.minerals > 0 || 
                  currentSector.resources.energy > 0 || 
                  currentSector.resources.technology > 0 || 
                  currentSector.resources.salvage > 0) && (
                  <div>
                    <span className="text-sm font-medium mb-2 block">Available Resources</span>
                    <div className="space-y-1">
                      {currentSector.resources.minerals > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-amber-400">Minerals</span>
                          <span>{currentSector.resources.minerals}</span>
                        </div>
                      )}
                      {currentSector.resources.energy > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-blue-400">Energy</span>
                          <span>{currentSector.resources.energy}</span>
                        </div>
                      )}
                      {currentSector.resources.technology > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-cyan-400">Technology</span>
                          <span>{currentSector.resources.technology}</span>
                        </div>
                      )}
                      {currentSector.resources.salvage > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Salvage</span>
                          <span>{currentSector.resources.salvage}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {currentSector.hazards.length > 0 && (
                  <div>
                    <span className="text-sm font-medium mb-2 block">Active Hazards</span>
                    <div className="space-y-1">
                      {currentSector.hazards.map((hazard, index) => (
                        <Badge key={index} variant="destructive" className="text-xs">
                          {hazard.type.replace('_', ' ')} (Level {hazard.intensity})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {currentSector.anomalies.length > 0 && (
                  <div>
                    <span className="text-sm font-medium mb-2 block">Anomalies Detected</span>
                    <div className="space-y-1">
                      {currentSector.anomalies.map((anomaly) => (
                        <Badge key={anomaly.id} variant="secondary" className="text-xs">
                          {anomaly.type.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {currentSector.events.some(e => !e.triggered) && (
                  <div>
                    <span className="text-sm font-medium mb-2 block">Pending Events</span>
                    <div className="space-y-1">
                      {currentSector.events
                        .filter(e => !e.triggered)
                        .map((event) => (
                          <Badge key={event.id} variant="default" className="text-xs">
                            {event.type.replace('_', ' ')}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Navigation */}
            <Card>
              <CardHeader>
                <CardTitle>Navigation</CardTitle>
                <CardDescription>Adjacent sectors you can travel to</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getAdjacentSectors(playerPosition).map((coords) => {
                    const sectorId = `${coords.x},${coords.y}`;
                    const sector = discoveredSectors.get(sectorId);
                    
                    if (!sector) return null;
                    
                    return (
                      <Button
                        key={sectorId}
                        onClick={() => onMoveTo(coords)}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                      >
                        <div className="flex items-center gap-2">
                          {getSectorIcon(sector.type)}
                          <div className="text-left">
                            <div className="font-medium text-xs">{sector.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {sector.type} • Hostility {sector.hostileLevel}
                            </div>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}