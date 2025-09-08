import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Trophy, Star, ArrowRight, ArrowCounterClockwise, CheckCircle, XCircle } from '@phosphor-icons/react';
import { Mission } from '../lib/game-types';

interface MissionCompleteProps {
  mission: Mission;
  score: number;
  experienceGained: number;
  creditsGained: number;
  completionTime: number;
  objectivesCompleted: number;
  bonusObjectivesCompleted: number;
  onContinue: () => void;
  onRetry: () => void;
  onBackToCampaign: () => void;
}

export function MissionComplete({
  mission,
  score,
  experienceGained,
  creditsGained,
  completionTime,
  objectivesCompleted,
  bonusObjectivesCompleted,
  onContinue,
  onRetry,
  onBackToCampaign
}: MissionCompleteProps) {
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getPerformanceRating = (): { rating: string; stars: number; color: string } => {
    const requiredObjectives = mission.objectives.filter(obj => obj.required).length;
    const bonusObjectives = mission.objectives.filter(obj => !obj.required).length;
    
    if (objectivesCompleted === requiredObjectives + bonusObjectives && completionTime < 60000) {
      return { rating: 'Perfect', stars: 4, color: 'text-yellow-400' };
    } else if (objectivesCompleted === requiredObjectives + bonusObjectives) {
      return { rating: 'Excellent', stars: 3, color: 'text-primary' };
    } else if (objectivesCompleted === requiredObjectives && bonusObjectivesCompleted > 0) {
      return { rating: 'Good', stars: 2, color: 'text-accent' };
    } else if (objectivesCompleted === requiredObjectives) {
      return { rating: 'Complete', stars: 1, color: 'text-secondary' };
    } else {
      return { rating: 'Failed', stars: 0, color: 'text-destructive' };
    }
  };

  const performance = getPerformanceRating();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="text-accent mr-3" size={48} />
            <h1 className="text-4xl font-black text-primary tracking-wider">
              MISSION COMPLETE
            </h1>
          </div>
          <h2 className="text-2xl font-bold text-foreground">{mission.name}</h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 4 }, (_, i) => (
                    <Star
                      key={i}
                      size={20}
                      weight={i < performance.stars ? 'fill' : 'regular'}
                      className={i < performance.stars ? performance.color : 'text-gray-600'}
                    />
                  ))}
                </div>
                <span className={performance.color}>{performance.rating}</span>
              </CardTitle>
              <CardDescription>Mission Performance Summary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Score */}
              <div className="text-center p-6 bg-primary/10 rounded-lg border border-primary/30">
                <div className="text-3xl font-black text-primary mb-2">
                  {score.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Final Score</div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-card border border-border rounded-lg">
                  <div className="text-xl font-bold text-accent">
                    {formatTime(completionTime)}
                  </div>
                  <div className="text-xs text-muted-foreground">Completion Time</div>
                </div>
                <div className="text-center p-4 bg-card border border-border rounded-lg">
                  <div className="text-xl font-bold text-secondary">
                    {objectivesCompleted + bonusObjectivesCompleted}
                  </div>
                  <div className="text-xs text-muted-foreground">Objectives Complete</div>
                </div>
              </div>

              {/* Rewards */}
              <div>
                <h4 className="font-semibold text-foreground mb-3">Rewards Earned</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Experience</span>
                    <span className="font-bold text-accent">+{experienceGained} XP</span>
                  </div>
                  {creditsGained > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Credits</span>
                      <span className="font-bold text-primary">+{creditsGained}</span>
                    </div>
                  )}
                  {mission.rewards.weaponUpgrade && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Weapon Unlock</span>
                      <span className="font-bold text-secondary capitalize">
                        {mission.rewards.weaponUpgrade}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Objectives Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Mission Objectives</CardTitle>
              <CardDescription>Objective completion status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mission.objectives.map((objective) => {
                  const completed = objective.current >= objective.target;
                  
                  return (
                    <div 
                      key={objective.id}
                      className="flex items-start gap-3 p-3 bg-card border border-border rounded-lg"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {completed ? (
                          <CheckCircle className="text-green-500" size={20} />
                        ) : (
                          <XCircle className="text-red-500" size={20} />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium ${completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {objective.description}
                          </span>
                          {!objective.required && (
                            <Badge variant="outline" className="text-xs">
                              BONUS
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={Math.min((objective.current / objective.target) * 100, 100)} 
                            className="flex-1 h-2"
                          />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {Math.min(objective.current, objective.target)}/{objective.target}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
          <Button
            onClick={onRetry}
            variant="outline"
            size="lg"
            className="border-muted-foreground text-muted-foreground hover:bg-muted"
          >
            <ArrowCounterClockwise className="mr-2" size={16} />
            Retry Mission
          </Button>
          
          <Button
            onClick={onBackToCampaign}
            variant="outline"
            size="lg"
            className="border-primary text-primary hover:bg-primary/10"
          >
            Campaign Menu
          </Button>
          
          <Button
            onClick={onContinue}
            size="lg"
            className="bg-primary hover:bg-primary/90"
          >
            Continue
            <ArrowRight className="ml-2" size={16} />
          </Button>
        </div>

        {/* Personal Best */}
        {score > mission.bestScore && mission.bestScore > 0 && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/30 rounded-full">
              <Trophy className="text-accent" size={16} />
              <span className="text-sm font-medium text-accent">
                New Personal Best! Previous: {mission.bestScore.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}