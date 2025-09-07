import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { WeaponType, WeaponUpgrade } from '../lib/game-types';
import { 
  getWeaponDisplayName, 
  getWeaponDescription, 
  getWeaponTier,
  getWeaponUnlockRequirement,
  canAffordWeapon,
  getWeaponUpgradeCost,
  createWeaponUpgrade
} from '../lib/weapon-system';
import { 
  Zap, 
  Target, 
  Explosion, 
  RocketLaunch, 
  Lightning, 
  Crosshair, 
  Gauge, 
  Atom, 
  Sparkles, 
  Bomb 
} from '@phosphor-icons/react';

interface WeaponSelectorProps {
  playerLevel: number;
  playerCredits: number;
  currentWeapons: WeaponUpgrade[];
  onSelectWeapon: (weaponType: WeaponType) => void;
  onUpgradeWeapon: (weapon: WeaponUpgrade) => void;
  onPurchaseWeapon: (weaponType: WeaponType) => void;
}

const weaponIcons: Record<WeaponType, React.ReactNode> = {
  basic: <Zap size={24} />,
  laserCannon: <Lightning size={24} />,
  plasmaBeam: <Explosion size={24} />,
  homingMissiles: <RocketLaunch size={24} />,
  railgun: <Target size={24} />,
  shotgun: <Crosshair size={24} />,
  chaingun: <Gauge size={24} />,
  ionCannon: <Atom size={24} />,
  quantumRifle: <Sparkles size={24} />,
  fusionTorpedo: <Bomb size={24} />,
};

const tierColors = {
  1: 'text-gray-400 border-gray-400',
  2: 'text-green-400 border-green-400',
  3: 'text-blue-400 border-blue-400',
  4: 'text-purple-400 border-purple-400',
  5: 'text-yellow-400 border-yellow-400',
};

export function WeaponSelector({
  playerLevel,
  playerCredits,
  currentWeapons,
  onSelectWeapon,
  onUpgradeWeapon,
  onPurchaseWeapon,
}: WeaponSelectorProps) {
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType>('basic');

  const allWeaponTypes: WeaponType[] = [
    'basic', 'laserCannon', 'chaingun', 'shotgun', 'plasmaBeam',
    'homingMissiles', 'ionCannon', 'railgun', 'quantumRifle', 'fusionTorpedo'
  ];

  const ownedWeapons = new Set(currentWeapons.map(w => w.type));
  const selectedWeaponData = currentWeapons.find(w => w.type === selectedWeapon);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Weapon Arsenal</h2>
        <p className="text-muted-foreground">
          Credits: <span className="text-accent font-bold">{playerCredits}</span> | 
          Level: <span className="text-primary font-bold">{playerLevel}</span>
        </p>
      </div>

      {/* Weapon Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {allWeaponTypes.map((weaponType) => {
          const tier = getWeaponTier(weaponType);
          const requirements = getWeaponUnlockRequirement(weaponType);
          const isOwned = ownedWeapons.has(weaponType);
          const canAfford = canAffordWeapon(weaponType, playerCredits, playerLevel);
          const isSelected = selectedWeapon === weaponType;
          const tierStyle = tierColors[tier as keyof typeof tierColors];

          return (
            <Card
              key={weaponType}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected ? 'ring-2 ring-primary' : ''
              } ${
                isOwned ? 'bg-card' : canAfford ? 'bg-muted/50' : 'bg-muted/20 opacity-60'
              }`}
              onClick={() => setSelectedWeapon(weaponType)}
            >
              <CardContent className="p-4 text-center">
                <div className={`mb-2 ${tierStyle}`}>
                  {weaponIcons[weaponType]}
                </div>
                <div className="text-sm font-semibold text-foreground mb-1">
                  {getWeaponDisplayName(weaponType)}
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs mb-2 ${tierStyle}`}
                >
                  Tier {tier}
                </Badge>
                {!isOwned && (
                  <div className="text-xs text-muted-foreground">
                    <div>Lvl {requirements.level}</div>
                    <div>{requirements.credits} credits</div>
                  </div>
                )}
                {isOwned && selectedWeaponData && selectedWeaponData.type === weaponType && (
                  <div className="text-xs text-accent">
                    Level {selectedWeaponData.level}/5
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Weapon Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-primary">
                {weaponIcons[selectedWeapon]}
              </div>
              <div>
                <CardTitle className="text-foreground">
                  {getWeaponDisplayName(selectedWeapon)}
                </CardTitle>
                <CardDescription>
                  {getWeaponDescription(selectedWeapon)}
                </CardDescription>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={tierColors[getWeaponTier(selectedWeapon) as keyof typeof tierColors]}
            >
              Tier {getWeaponTier(selectedWeapon)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedWeaponData ? (
            <>
              {/* Weapon Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Damage</div>
                  <div className="text-lg font-bold text-destructive">
                    {selectedWeaponData.damage.toFixed(1)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Fire Rate</div>
                  <div className="text-lg font-bold text-accent">
                    {(1000 / selectedWeaponData.cooldown).toFixed(1)}/s
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Speed</div>
                  <div className="text-lg font-bold text-primary">
                    {selectedWeaponData.speed}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Energy Cost</div>
                  <div className="text-lg font-bold text-secondary">
                    {selectedWeaponData.energyCost || 0}
                  </div>
                </div>
              </div>

              {/* Upgrade Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Upgrade Level</span>
                  <span className="text-foreground">{selectedWeaponData.level}/5</span>
                </div>
                <Progress value={(selectedWeaponData.level / 5) * 100} className="mb-2" />
              </div>

              {/* Special Abilities */}
              {selectedWeaponData.special && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Special Ability</div>
                  <Badge variant="secondary" className="capitalize">
                    {selectedWeaponData.special.replace(/([A-Z])/g, ' $1')}
                  </Badge>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => onSelectWeapon(selectedWeapon)}
                  className="flex-1"
                  variant="default"
                >
                  Equip Weapon
                </Button>
                {selectedWeaponData.level < 5 && (
                  <Button
                    onClick={() => onUpgradeWeapon(selectedWeaponData)}
                    variant="outline"
                    disabled={playerCredits < getWeaponUpgradeCost(selectedWeaponData)}
                  >
                    Upgrade ({getWeaponUpgradeCost(selectedWeaponData)} credits)
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Unlock Requirements */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Required Level</div>
                  <div className="text-lg font-bold text-primary">
                    {getWeaponUnlockRequirement(selectedWeapon).level}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Cost</div>
                  <div className="text-lg font-bold text-accent">
                    {getWeaponUnlockRequirement(selectedWeapon).credits} credits
                  </div>
                </div>
              </div>

              {/* Base Stats Preview */}
              <div>
                <div className="text-sm text-muted-foreground mb-2">Base Stats (Level 1)</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {(() => {
                    const previewWeapon = createWeaponUpgrade(selectedWeapon, 1);
                    return (
                      <>
                        <div>Damage: <span className="text-destructive">{previewWeapon.damage}</span></div>
                        <div>Fire Rate: <span className="text-accent">{(1000 / previewWeapon.cooldown).toFixed(1)}/s</span></div>
                        <div>Speed: <span className="text-primary">{previewWeapon.speed}</span></div>
                        <div>Energy: <span className="text-secondary">{previewWeapon.energyCost}</span></div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Purchase Button */}
              <Button
                onClick={() => onPurchaseWeapon(selectedWeapon)}
                className="w-full"
                disabled={!canAffordWeapon(selectedWeapon, playerCredits, playerLevel)}
              >
                {canAffordWeapon(selectedWeapon, playerCredits, playerLevel)
                  ? `Purchase for ${getWeaponUnlockRequirement(selectedWeapon).credits} credits`
                  : playerLevel < getWeaponUnlockRequirement(selectedWeapon).level
                  ? `Requires Level ${getWeaponUnlockRequirement(selectedWeapon).level}`
                  : 'Insufficient Credits'
                }
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}