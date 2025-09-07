import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ArrowLeft, Play, Star, Trophy, Bolt, Shield, Rocket, Target, ShoppingCart, Lightning } from '@phosphor-icons/react';
import { Mission, CampaignProgress, WeaponType } from '../lib/game-types';
import { getAvailableMissions, getShipUpgradeCost, CAMPAIGN_MISSIONS } from '../lib/campaign-system';
import { WeaponSelector } from './WeaponSelector';
import { createWeaponUpgrade, getWeaponDisplayName } from '../lib/weapon-system';

interface CampaignMenuProps {
  campaignProgress: CampaignProgress;
  onStartMission: (mission: Mission) => void;
  onUpgradeShip: (component: keyof CampaignProgress['shipUpgrades']) => void;
  onPurchaseWeapon?: (weaponType: WeaponType) => void;
  onUpgradeWeapon?: (weaponType: WeaponType) => void;
  onBackToMenu: () => void;
}

export function CampaignMenu({ 
  campaignProgress, 
  onStartMission, 
  onUpgradeShip, 
  onPurchaseWeapon = () => {},
  onUpgradeWeapon = () => {},
  onBackToMenu 
}: CampaignMenuProps) {
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [activeTab, setActiveTab] = useState<'missions' | 'upgrades' | 'weapons'>('missions');
  
  const availableMissions = getAvailableMissions(campaignProgress);
  const completedMissions = CAMPAIGN_MISSIONS.filter(m => m.completed);
  
  const getDifficultyColor = (difficulty: Mission['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-orange-500';
      case 'extreme': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getDifficultyStars = (difficulty: Mission['difficulty']) => {
    const count = { easy: 1, medium: 2, hard: 3, extreme: 4 }[difficulty];
    return Array.from({ length: 4 }, (_, i) => (
      <Star
        key={i}
        size={12}
        weight={i < count ? 'fill' : 'regular'}
        className={i < count ? 'text-yellow-400' : 'text-gray-600'}
      />
    ));
  };

  const getUpgradeDisplayName = (component: string) => {
    switch (component) {
      case 'armor': return 'Armor';
      case 'speed': return 'Speed';
      case 'weapons': return 'Weapons';
      case 'shielding': return 'Shielding';
      case 'chargePreservation': return 'Charge Preservation';
      default: return component;
    }
  };

  const UpgradeIcon = ({ type }: { type: keyof CampaignProgress['shipUpgrades'] }) => {
    switch (type) {
      case 'armor': return <Shield size={20} className="text-blue-400" />;
      case 'speed': return <Rocket size={20} className="text-green-400" />;
      case 'weapons': return <Bolt size={20} className="text-red-400" />;
      case 'shielding': return <Target size={20} className="text-purple-400" />;
      case 'chargePreservation': return <Lightning size={20} className="text-yellow-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={onBackToMenu}
            variant="outline"
            className="border-muted-foreground text-muted-foreground hover:bg-muted"
          >
            <ArrowLeft className="mr-2" size={16} />
            Back to Menu
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl font-black text-primary mb-2 tracking-wider">
              CAMPAIGN MODE
            </h1>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div>Level {campaignProgress.playerLevel}</div>
              <div>Experience: {campaignProgress.totalExperience}</div>
              <div>Credits: {campaignProgress.availableCredits}</div>
              <div>Missions Completed: {completedMissions.length}/{CAMPAIGN_MISSIONS.length}</div>
            </div>
          </div>
          
          <div className="w-32" /> {/* Spacer for centering */}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Campaign Progress</span>
            <span className="text-sm text-muted-foreground">
              {Math.round((completedMissions.length / CAMPAIGN_MISSIONS.length) * 100)}%
            </span>
          </div>
          <Progress 
            value={(completedMissions.length / CAMPAIGN_MISSIONS.length) * 100} 
            className="h-2"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setActiveTab('missions')}
            variant={activeTab === 'missions' ? 'default' : 'outline'}
            className="flex-1"
          >
            Missions
          </Button>
          <Button
            onClick={() => setActiveTab('upgrades')}
            variant={activeTab === 'upgrades' ? 'default' : 'outline'}
            className="flex-1"
          >
            Ship Upgrades
          </Button>
          <Button
            onClick={() => setActiveTab('weapons')}
            variant={activeTab === 'weapons' ? 'default' : 'outline'}
            className="flex-1"
          >
            Weapons
          </Button>
        </div>

        {activeTab === 'missions' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Mission List */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground mb-4">Available Missions</h2>
              
              {availableMissions.map((mission) => (
                <Card 
                  key={mission.id}
                  className={`cursor-pointer transition-all hover:bg-card/80 ${
                    selectedMission?.id === mission.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedMission(mission)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{mission.name}</CardTitle>
                        <CardDescription className="mt-1">{mission.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {getDifficultyStars(mission.difficulty)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className={getDifficultyColor(mission.difficulty)}>
                        {mission.difficulty.toUpperCase()}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        Reward: {mission.rewards.experience} XP
                        {mission.rewards.credits && `, ${mission.rewards.credits} Credits`}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Completed Missions */}
              {completedMissions.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-foreground mb-4">Completed Missions</h3>
                  <div className="space-y-2">
                    {completedMissions.map((mission) => (
                      <div 
                        key={mission.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-muted"
                      >
                        <div className="flex items-center gap-3">
                          <Trophy className="text-accent" size={16} />
                          <span className="font-medium">{mission.name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Best Score: {mission.bestScore.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mission Details */}
            <div>
              {selectedMission ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {selectedMission.name}
                      <div className="flex items-center gap-1">
                        {getDifficultyStars(selectedMission.difficulty)}
                      </div>
                    </CardTitle>
                    <CardDescription>{selectedMission.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Mission Briefing</h4>
                      <p className="text-sm text-muted-foreground italic">
                        "{selectedMission.story}"
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Objectives</h4>
                      <div className="space-y-2">
                        {selectedMission.objectives.map((objective) => (
                          <div key={objective.id} className="flex items-center gap-2 text-sm">
                            <div className={`w-2 h-2 rounded-full ${
                              objective.required ? 'bg-primary' : 'bg-muted-foreground'
                            }`} />
                            <span className={objective.required ? 'text-foreground' : 'text-muted-foreground'}>
                              {objective.description}
                              {!objective.required && ' (Bonus)'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Rewards</h4>
                      <div className="space-y-1 text-sm">
                        <div>Experience: {selectedMission.rewards.experience} XP</div>
                        {selectedMission.rewards.credits && (
                          <div>Credits: {selectedMission.rewards.credits}</div>
                        )}
                        {selectedMission.rewards.weaponUpgrade && (
                          <div>Unlock: {selectedMission.rewards.weaponUpgrade} weapon</div>
                        )}
                      </div>
                    </div>

                    <Button 
                      onClick={() => onStartMission(selectedMission)}
                      className="w-full"
                      size="lg"
                    >
                      <Play className="mr-2" size={16} />
                      Start Mission
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">
                      Select a mission to view details and objectives
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === 'upgrades' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-foreground mb-6">Ship Upgrades</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {Object.entries(campaignProgress.shipUpgrades).map(([component, level]) => {
                const cost = getShipUpgradeCost(level);
                const canAfford = campaignProgress.availableCredits >= cost;
                const maxLevel = level >= 5;
                
                return (
                  <Card key={component}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <UpgradeIcon type={component as keyof CampaignProgress['shipUpgrades']} />
                        {getUpgradeDisplayName(component)}
                      </CardTitle>
                      <CardDescription>
                        {component === 'armor' && 'Increases ship durability and damage resistance'}
                        {component === 'speed' && 'Improves ship maneuverability and acceleration'}
                        {component === 'weapons' && 'Enhances weapon damage and firing rate'}
                        {component === 'shielding' && 'Provides energy shields and faster regeneration'}
                        {component === 'chargePreservation' && 'Reduces weapon charge decay rate for longer tactical holding'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Level {level}/5</span>
                            {!maxLevel && (
                              <span className="text-sm text-muted-foreground">
                                Next: {cost} Credits
                              </span>
                            )}
                          </div>
                          <Progress value={(level / 5) * 100} className="h-2" />
                        </div>
                        
                        <Button
                          onClick={() => onUpgradeShip(component as keyof CampaignProgress['shipUpgrades'])}
                          disabled={!canAfford || maxLevel}
                          className="w-full"
                          variant={canAfford && !maxLevel ? 'default' : 'outline'}
                        >
                          {maxLevel ? 'MAX LEVEL' : 
                           canAfford ? `Upgrade (${cost} Credits)` : 
                           'Insufficient Credits'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Unlocked Weapons */}
            <div className="mt-8">
              <h3 className="text-lg font-bold text-foreground mb-4">Unlocked Weapons</h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                {campaignProgress.unlockedWeapons.map((weapon) => (
                  <Card key={weapon}>
                    <CardContent className="p-4 text-center">
                      <div className="text-lg font-semibold capitalize">{getWeaponDisplayName(weapon)}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Level {campaignProgress.weaponLevels[weapon] || 1}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'weapons' && (
          <div className="max-w-6xl mx-auto">
            <WeaponSelector
              playerLevel={campaignProgress.playerLevel}
              playerCredits={campaignProgress.availableCredits}
              currentWeapons={campaignProgress.unlockedWeapons.map(type => 
                createWeaponUpgrade(type, campaignProgress.weaponLevels[type] || 1)
              )}
              onSelectWeapon={(weaponType) => {
                // Weapon selection is handled in the game state
                console.log('Selected weapon:', weaponType);
              }}
              onUpgradeWeapon={(weapon) => onUpgradeWeapon(weapon.type)}
              onPurchaseWeapon={onPurchaseWeapon}
            />
          </div>
        )}
      </div>
    </div>
  );
}