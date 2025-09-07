import { GameState, getChargeLevel } from '../lib/game-types';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Heart, Trophy, Target, Lightning, Shield, ArrowsOut, Skull, Crosshair, Rocket, Zap, Fire, Thermometer } from '@phosphor-icons/react';
import { getWeaponDisplayName, getWeaponDescription } from '../lib/weapon-system';

interface GameUIProps {
  gameState: GameState;
}

export function GameUI({ gameState }: GameUIProps) {
  return (
    <div className="flex flex-col gap-4 w-full max-w-xs">
      <Card className="p-4 bg-card/80 backdrop-blur-sm border-primary/30">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="text-accent" size={20} />
          <h3 className="text-lg font-bold text-accent">Score</h3>
        </div>
        <div className="text-2xl font-bold text-primary">
          {gameState.score.toLocaleString()}
        </div>
      </Card>

      <Card className="p-4 bg-card/80 backdrop-blur-sm border-primary/30">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="text-destructive" size={20} />
          <h3 className="text-lg font-bold text-foreground">Lives</h3>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: gameState.player.lives }).map((_, i) => (
            <Heart key={i} className="text-destructive" size={24} weight="fill" />
          ))}
          {Array.from({ length: Math.max(0, 3 - gameState.player.lives) }).map((_, i) => (
            <Heart key={`empty-${i}`} className="text-muted-foreground" size={24} />
          ))}
        </div>
      </Card>

      <Card className="p-4 bg-card/80 backdrop-blur-sm border-primary/30">
        <div className="flex items-center gap-2 mb-3">
          <Target className="text-secondary" size={20} />
          <h3 className="text-lg font-bold text-foreground">Level</h3>
        </div>
        <div className="text-xl font-bold text-secondary">
          {gameState.level}
        </div>
      </Card>

      <Card className="p-4 bg-card/80 backdrop-blur-sm border-primary/30">
        <div className="flex items-center gap-2 mb-3">
          <Target className="text-accent" size={20} />
          <h3 className="text-lg font-bold text-foreground">Enemies</h3>
        </div>
        <div className="space-y-1">
          <div className="text-lg text-muted-foreground">
            {gameState.enemies.filter(e => e.active && e.type === 'basic').length} basic
          </div>
          {gameState.bossActive && (
            <div className="flex items-center gap-2">
              <Skull className="text-destructive" size={16} />
              <span className="text-sm text-destructive font-bold animate-pulse">
                BOSS ACTIVE
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Weapon Status */}
      <Card className="p-4 bg-card/80 backdrop-blur-sm border-primary/30">
        <div className="flex items-center gap-2 mb-3">
          <Crosshair className="text-primary" size={20} />
          <h3 className="text-lg font-bold text-foreground">Weapon</h3>
        </div>
        <div className="space-y-2">
          {(() => {
            const currentWeapon = gameState.player.weaponSystem.weaponSlots[gameState.player.weaponSystem.activeWeaponIndex] || gameState.player.currentWeapon;
            return (
              <>
                <div className="flex items-center gap-2">
                  {currentWeapon.type === 'laserCannon' && <Zap className="text-cyan-400" size={16} />}
                  {currentWeapon.type === 'plasmaBeam' && <Lightning className="text-purple-400" size={16} />}
                  {currentWeapon.type === 'homingMissiles' && <Rocket className="text-orange-400" size={16} />}
                  {currentWeapon.type === 'railgun' && <Target className="text-blue-400" size={16} />}
                  {currentWeapon.type === 'shotgun' && <Crosshair className="text-red-400" size={16} />}
                  {currentWeapon.type === 'chaingun' && <Fire className="text-yellow-500" size={16} />}
                  {currentWeapon.type === 'basic' && <Target className="text-gray-400" size={16} />}
                  <span className="text-sm font-medium text-foreground">
                    {getWeaponDisplayName(currentWeapon.type)}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Level {currentWeapon.level}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {getWeaponDescription(currentWeapon.type)}
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="text-muted-foreground">DMG:</span>
                  <span className="text-destructive font-medium">{currentWeapon.damage.toFixed(1)}</span>
                  <span className="text-muted-foreground">SPD:</span>
                  <span className="text-accent font-medium">{currentWeapon.speed}</span>
                  <span className="text-muted-foreground">ENERGY:</span>
                  <span className="text-secondary font-medium">{currentWeapon.energyCost || 5}</span>
                </div>
              </>
            );
          })()}
          
          {/* Energy Bar */}
          <div className="space-y-1 pt-2 border-t border-muted/30">
            <div className="flex items-center gap-2 text-xs">
              <Lightning 
                className={gameState.player.weaponSystem.energy < 20 ? "text-destructive animate-pulse" : "text-blue-400"} 
                size={12} 
              />
              <span className="text-muted-foreground">Energy:</span>
              <span className={gameState.player.weaponSystem.energy < 20 ? "text-destructive font-bold" : "text-blue-400"}>
                {Math.round(gameState.player.weaponSystem.energy)}%
              </span>
            </div>
            <div className="w-full bg-muted/30 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  gameState.player.weaponSystem.energy < 20 
                    ? "bg-destructive animate-pulse" 
                    : "bg-blue-400"
                }`}
                style={{ width: `${gameState.player.weaponSystem.energy}%` }}
              />
            </div>
          </div>
          
          {/* Heat Bar */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <Thermometer 
                className={gameState.player.weaponSystem.isOverheated ? "text-destructive animate-pulse" : "text-orange-400"} 
                size={12} 
              />
              <span className="text-muted-foreground">Heat:</span>
              <span className={gameState.player.weaponSystem.isOverheated ? "text-destructive font-bold" : "text-orange-400"}>
                {Math.round(gameState.player.weaponSystem.heat)}%
              </span>
            </div>
            <div className="w-full bg-muted/30 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  gameState.player.weaponSystem.isOverheated 
                    ? "bg-destructive animate-pulse" 
                    : gameState.player.weaponSystem.heat > 70 
                      ? "bg-orange-500" 
                      : "bg-orange-400"
                }`}
                  style={{ width: `${gameState.player.weaponSystem.heat}%` }}
                />
              </div>
            </div>
            
            {/* Charge Bar - show when charging or when charge level > 0 */}
            {gameState.player.weaponSystem.chargeLevel > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <Lightning 
                    className={(() => {
                      const chargeData = getChargeLevel(gameState.player.weaponSystem.chargeLevel);
                      const isDecaying = gameState.player.weaponSystem.lastChargeRelease > 0 && 
                                        (Date.now() - gameState.player.weaponSystem.lastChargeRelease) > gameState.player.weaponSystem.chargeDecayDelay;
                      
                      if (isDecaying) {
                        // Show decay animation with darker colors
                        if (chargeData.level >= 4) return "text-accent/70 animate-pulse";
                        if (chargeData.level >= 3) return "text-secondary/70 animate-pulse";
                        if (chargeData.level >= 2) return "text-primary/70";
                        if (chargeData.level >= 1) return "text-cyan-400/70";
                        return "text-muted-foreground/70";
                      } else {
                        // Normal charge colors
                        if (chargeData.level >= 4) return "text-accent animate-pulse";
                        if (chargeData.level >= 3) return "text-secondary animate-pulse";
                        if (chargeData.level >= 2) return "text-primary";
                        if (chargeData.level >= 1) return "text-cyan-400";
                        return "text-muted-foreground";
                      }
                    })()} 
                    size={12} 
                  />
                  <span className="text-muted-foreground">Charge:</span>
                  <span className={(() => {
                    const chargeData = getChargeLevel(gameState.player.weaponSystem.chargeLevel);
                    const isDecaying = gameState.player.weaponSystem.lastChargeRelease > 0 && 
                                      (Date.now() - gameState.player.weaponSystem.lastChargeRelease) > gameState.player.weaponSystem.chargeDecayDelay;
                    
                    if (isDecaying) {
                      // Show decay colors
                      if (chargeData.level >= 4) return "text-accent/70 font-bold";
                      if (chargeData.level >= 3) return "text-secondary/70 font-bold";
                      if (chargeData.level >= 2) return "text-primary/70 font-bold";
                      if (chargeData.level >= 1) return "text-cyan-400/70 font-bold";
                      return "text-muted-foreground/70";
                    } else {
                      // Normal charge colors
                      if (chargeData.level >= 4) return "text-accent font-bold";
                      if (chargeData.level >= 3) return "text-secondary font-bold";
                      if (chargeData.level >= 2) return "text-primary font-bold";
                      if (chargeData.level >= 1) return "text-cyan-400 font-bold";
                      return "text-muted-foreground";
                    }
                  })()}>
                    {Math.round(gameState.player.weaponSystem.chargeLevel)}%
                  </span>
                  {(() => {
                    const chargeData = getChargeLevel(gameState.player.weaponSystem.chargeLevel);
                    const isDecaying = gameState.player.weaponSystem.lastChargeRelease > 0 && 
                                      (Date.now() - gameState.player.weaponSystem.lastChargeRelease) > gameState.player.weaponSystem.chargeDecayDelay;
                    
                    if (isDecaying) {
                      return <span className="text-destructive text-xs animate-pulse">DECAYING</span>;
                    } else {
                      if (chargeData.level >= 4) return <span className="text-accent text-xs font-bold animate-pulse">MAX POWER!</span>;
                      if (chargeData.level >= 3) return <span className="text-secondary text-xs font-bold animate-pulse">SUPERCHARGED!</span>;
                      if (chargeData.level >= 2) return <span className="text-primary text-xs font-bold">OVERCHARGED!</span>;
                      if (chargeData.level >= 1) return <span className="text-cyan-400 text-xs font-bold">CHARGED!</span>;
                      return null;
                    }
                  })()}
                  {/* Show charge preservation upgrade indicator */}
                  {gameState.campaignProgress?.shipUpgrades.chargePreservation > 0 && (
                    <span className="text-yellow-400 text-xs">
                      +{gameState.campaignProgress.shipUpgrades.chargePreservation} PRESERVE
                    </span>
                  )}
                </div>
                <div className="w-full bg-muted/30 rounded-full h-2 relative overflow-hidden">
                  {/* Background charge level markers */}
                  <div className="absolute inset-0 flex">
                    <div className="w-1/4 border-r border-muted-foreground/20"></div>
                    <div className="w-1/4 border-r border-muted-foreground/30"></div>
                    <div className="w-1/4 border-r border-muted-foreground/40"></div>
                    <div className="w-1/4"></div>
                  </div>
                  
                  {/* Charge bar with level-based colors and decay indication */}
                  <div 
                    className={`h-2 rounded-full transition-all duration-200 relative ${(() => {
                      const chargeData = getChargeLevel(gameState.player.weaponSystem.chargeLevel);
                      const isDecaying = gameState.player.weaponSystem.lastChargeRelease > 0 && 
                                        (Date.now() - gameState.player.weaponSystem.lastChargeRelease) > gameState.player.weaponSystem.chargeDecayDelay;
                      
                      if (isDecaying) {
                        // Decay state colors - dimmed
                        if (chargeData.level >= 4) return "bg-accent/50 animate-pulse shadow-sm";
                        if (chargeData.level >= 3) return "bg-secondary/50 animate-pulse shadow-sm";
                        if (chargeData.level >= 2) return "bg-primary/50 shadow-sm";
                        if (chargeData.level >= 1) return "bg-cyan-400/50 shadow-sm";
                        return "bg-muted-foreground/50";
                      } else {
                        // Normal charge state colors
                        if (chargeData.level >= 4) return "bg-accent animate-pulse shadow-lg shadow-accent/50";
                        if (chargeData.level >= 3) return "bg-secondary animate-pulse shadow-lg shadow-secondary/50";
                        if (chargeData.level >= 2) return "bg-primary shadow-md shadow-primary/30";
                        if (chargeData.level >= 1) return "bg-cyan-400 shadow-md shadow-cyan-400/30";
                        return "bg-muted-foreground";
                      }
                    })()}`}
                    style={{ width: `${gameState.player.weaponSystem.chargeLevel}%` }}
                  >
                    {/* Shimmering effect for high charge levels (disabled when decaying) */}
                    {getChargeLevel(gameState.player.weaponSystem.chargeLevel).level >= 3 && 
                     !(gameState.player.weaponSystem.lastChargeRelease > 0 && 
                       (Date.now() - gameState.player.weaponSystem.lastChargeRelease) > gameState.player.weaponSystem.chargeDecayDelay) && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Overheated Warning */}
            {gameState.player.weaponSystem.isOverheated && (
              <div className="flex items-center gap-2 text-xs animate-pulse">
                <Fire className="text-destructive" size={12} />
                <span className="text-destructive font-bold">OVERHEATED!</span>
                <span className="text-muted-foreground">
                  {Math.ceil(gameState.player.weaponSystem.overheatCooldown / 1000)}s
                </span>
              </div>
            )}
          </div>
      </Card>

      {/* Power-ups Status */}
      <Card className="p-4 bg-card/80 backdrop-blur-sm border-accent/30">
        <div className="flex items-center gap-2 mb-3">
          <Lightning className="text-accent" size={20} />
          <h3 className="text-lg font-bold text-foreground">Power-ups</h3>
        </div>
        <div className="space-y-2">
          {gameState.player.powerUps.rapidFire > 0 && (
            <div className="flex items-center gap-2">
              <Lightning className="text-orange-400" size={16} />
              <span className="text-sm text-orange-400 font-medium">Rapid Fire</span>
              <Badge variant="secondary" className="text-xs">
                {Math.ceil(gameState.player.powerUps.rapidFire / 1000)}s
              </Badge>
            </div>
          )}
          {gameState.player.powerUps.shield > 0 && (
            <div className="flex items-center gap-2">
              <Shield className="text-blue-400" size={16} />
              <span className="text-sm text-blue-400 font-medium">Shield</span>
              <Badge variant="secondary" className="text-xs">
                {Math.ceil(gameState.player.powerUps.shield / 1000)}s
              </Badge>
            </div>
          )}
          {gameState.player.powerUps.multiShot > 0 && (
            <div className="flex items-center gap-2">
              <ArrowsOut className="text-green-400" size={16} />
              <span className="text-sm text-green-400 font-medium">Multi-shot</span>
              <Badge variant="secondary" className="text-xs">
                {Math.ceil(gameState.player.powerUps.multiShot / 1000)}s
              </Badge>
            </div>
          )}
          {gameState.player.powerUps.rapidFire === 0 && 
           gameState.player.powerUps.shield === 0 && 
           gameState.player.powerUps.multiShot === 0 && (
            <div className="text-sm text-muted-foreground">
              Collect power-ups for upgrades!
            </div>
          )}
        </div>
      </Card>

      {/* Mission Objectives (Campaign Mode Only) */}
      {gameState.gameMode === 'campaign' && gameState.currentMission && (
        <Card className="p-4 bg-card/80 backdrop-blur-sm border-accent/30">
          <div className="flex items-center gap-2 mb-3">
            <Target className="text-accent" size={20} />
            <h3 className="text-lg font-bold text-foreground">Objectives</h3>
          </div>
          <div className="space-y-2">
            {gameState.currentMission.objectives.map((objective) => {
              const completed = objective.current >= objective.target;
              const progress = Math.min((objective.current / objective.target) * 100, 100);
              
              return (
                <div key={objective.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      completed ? 'bg-green-400' : objective.required ? 'bg-primary' : 'bg-muted-foreground'
                    }`} />
                    <span className={`text-xs font-medium ${
                      completed ? 'text-green-400' : 'text-foreground'
                    }`}>
                      {objective.description}
                    </span>
                    {!objective.required && (
                      <Badge variant="outline" className="text-xs">
                        Bonus
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex-1 bg-muted/30 rounded-full h-1">
                      <div 
                        className={`h-1 rounded-full transition-all duration-300 ${
                          completed ? 'bg-green-400' : 'bg-primary'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground whitespace-nowrap">
                      {Math.min(objective.current, objective.target)}/{objective.target}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Mission Timer */}
          {gameState.missionProgress && (
            <div className="mt-3 pt-3 border-t border-muted/30">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Mission Time:</span>
                <span className="font-medium text-foreground">
                  {Math.floor(gameState.missionProgress.timeElapsed / 60000)}:
                  {Math.floor((gameState.missionProgress.timeElapsed % 60000) / 1000).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-muted">
        <h4 className="font-bold text-sm text-muted-foreground mb-2">Controls</h4>
        <div className="text-xs text-muted-foreground space-y-1">
          <div>WASD / Arrow Keys: Move</div>
          <div>Space: Shoot</div>
          <div>C (Hold): Charge Weapon</div>
          <div>P: Pause</div>
        </div>
      </div>
    </div>
  );
}