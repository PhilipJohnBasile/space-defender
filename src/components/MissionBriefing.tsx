import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Play, Star } from '@phosphor-icons/react';
import { Mission } from '../lib/game-types';

interface MissionBriefingProps {
  mission: Mission;
  onStartMission: () => void;
  onBack: () => void;
}

export function MissionBriefing({ mission, onStartMission, onBack }: MissionBriefingProps) {
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
        size={16}
        weight={i < count ? 'fill' : 'regular'}
        className={i < count ? 'text-yellow-400' : 'text-gray-600'}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={onBack}
            variant="outline"
            className="border-muted-foreground text-muted-foreground hover:bg-muted"
          >
            <ArrowLeft className="mr-2" size={16} />
            Back
          </Button>
          
          <h1 className="text-4xl font-black text-primary tracking-wider">
            MISSION BRIEFING
          </h1>
          
          <div className="w-20" /> {/* Spacer */}
        </div>

        {/* Mission Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{mission.name}</CardTitle>
                <CardDescription className="text-lg">{mission.description}</CardDescription>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Badge variant="secondary" className={getDifficultyColor(mission.difficulty)}>
                  {mission.difficulty.toUpperCase()}
                </Badge>
                <div className="flex items-center gap-1">
                  {getDifficultyStars(mission.difficulty)}
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Story */}
            <div className="p-6 bg-muted/30 rounded-lg border border-muted">
              <h3 className="text-xl font-bold text-accent mb-4">Mission Intel</h3>
              <p className="text-foreground italic leading-relaxed">
                "{mission.story}"
              </p>
            </div>

            {/* Objectives */}
            <div>
              <h3 className="text-xl font-bold text-foreground mb-4">Mission Objectives</h3>
              <div className="space-y-3">
                {mission.objectives.map((objective, index) => (
                  <div 
                    key={objective.id} 
                    className="flex items-start gap-4 p-4 bg-card border border-border rounded-lg"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">
                          {objective.description}
                        </span>
                        {!objective.required && (
                          <Badge variant="outline" className="text-xs">
                            BONUS
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {objective.type === 'destroyEnemies' && 'Eliminate enemy forces'}
                        {objective.type === 'survivetime' && 'Stay alive for the specified duration'}
                        {objective.type === 'collectPowerUps' && 'Gather power-up items'}
                        {objective.type === 'defeatBoss' && 'Destroy the capital ship'}
                        {objective.type === 'protectTarget' && 'Defend the specified target'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">
                        Target: {objective.target}
                      </div>
                      {objective.required ? (
                        <div className="text-xs text-primary">REQUIRED</div>
                      ) : (
                        <div className="text-xs text-muted-foreground">OPTIONAL</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rewards */}
            <div>
              <h3 className="text-xl font-bold text-foreground mb-4">Mission Rewards</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 bg-card border border-border rounded-lg text-center">
                  <div className="text-2xl font-bold text-accent mb-1">
                    {mission.rewards.experience}
                  </div>
                  <div className="text-sm text-muted-foreground">Experience Points</div>
                </div>
                
                {mission.rewards.credits && (
                  <div className="p-4 bg-card border border-border rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {mission.rewards.credits}
                    </div>
                    <div className="text-sm text-muted-foreground">Credits</div>
                  </div>
                )}
                
                {mission.rewards.weaponUpgrade && (
                  <div className="p-4 bg-card border border-border rounded-lg text-center">
                    <div className="text-lg font-bold text-secondary mb-1 capitalize">
                      {mission.rewards.weaponUpgrade}
                    </div>
                    <div className="text-sm text-muted-foreground">Weapon Unlock</div>
                  </div>
                )}
              </div>
            </div>

            {/* Warning for difficulty */}
            {(mission.difficulty === 'hard' || mission.difficulty === 'extreme') && (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <h4 className="font-bold text-destructive mb-2">⚠️ High Difficulty Warning</h4>
                <p className="text-sm text-destructive/80">
                  This is a {mission.difficulty} mission. Expect heavy resistance and challenging objectives. 
                  Make sure your ship is properly upgraded before attempting this mission.
                </p>
              </div>
            )}

            {/* Start Mission Button */}
            <div className="pt-4">
              <Button 
                onClick={onStartMission}
                size="lg"
                className="w-full text-lg font-bold"
              >
                <Play className="mr-3" size={20} />
                Launch Mission
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}