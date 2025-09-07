import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Play, ArrowClockwise, Crosshair, Zap, Lightning, Rocket, MapTrifold } from '@phosphor-icons/react';
import { VolumeControl } from './VolumeControl';

interface MenuScreenProps {
  onStartGame: () => void;
  onCampaignMode: () => void;
  onExplorationMode: () => void;
  highScore: number;
}

export function MenuScreen({ onStartGame, onCampaignMode, onExplorationMode, highScore }: MenuScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="text-center mb-8">
        <h1 className="text-6xl font-black text-primary mb-4 tracking-wider">
          SPACE
        </h1>
        <h1 className="text-6xl font-black text-accent mb-6 tracking-wider">
          DEFENDER
        </h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          Defend Earth from alien invaders in this retro arcade shooter
        </p>
      </div>

      <Card className="p-8 bg-card/80 backdrop-blur-sm border-primary/30 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-sm text-muted-foreground mb-2">High Score</div>
          <div className="text-3xl font-bold text-accent">
            {highScore.toLocaleString()}
          </div>
        </div>

        <Button 
          onClick={onStartGame}
          className="w-full mb-3 bg-primary hover:bg-primary/80 text-primary-foreground font-bold py-3 text-lg"
          size="lg"
        >
          <Play className="mr-2" size={20} weight="fill" />
          ARCADE MODE
        </Button>

        <Button 
          onClick={onCampaignMode}
          className="w-full mb-3 bg-accent hover:bg-accent/80 text-accent-foreground font-bold py-3 text-lg"
          size="lg"
        >
          <MapTrifold className="mr-2" size={20} weight="fill" />
          CAMPAIGN MODE
        </Button>

        <Button 
          onClick={onExplorationMode}
          className="w-full mb-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold py-3 text-lg"
          size="lg"
        >
          <Rocket className="mr-2" size={20} weight="fill" />
          EXPLORATION MODE
        </Button>

        <div className="flex items-center justify-center mb-4 p-3 bg-muted/30 rounded-lg">
          <div className="text-sm text-muted-foreground mr-3">Audio:</div>
          <VolumeControl />
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <div className="mb-2 font-semibold">How to Play:</div>
          <div className="space-y-1 text-xs">
            <div>• Use WASD or Arrow Keys to move</div>
            <div>• Press Space to shoot</div>
            <div>• Destroy enemies to earn points</div>
            <div>• Collect power-ups for upgrades</div>
            <div>• Upgrade your weapons for more power</div>
            <div>• Avoid enemy ships to survive</div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-muted/30">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Available Weapons:</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Crosshair className="text-yellow-400" size={12} />
              <span>Basic Blaster</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="text-cyan-400" size={12} />
              <span>Laser Cannon</span>
            </div>
            <div className="flex items-center gap-1">
              <Lightning className="text-purple-400" size={12} />
              <span>Plasma Beam</span>
            </div>
            <div className="flex items-center gap-1">
              <Rocket className="text-orange-400" size={12} />
              <span>Homing Missiles</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground/80 mt-2">
            Collect hexagonal weapon upgrades to unlock advanced arsenal
          </div>
        </div>
      </Card>

      <div className="mt-8 text-center">
        <div className="text-xs text-muted-foreground/60">
          A retro arcade experience • Built with React & Canvas
        </div>
      </div>
    </div>
  );
}