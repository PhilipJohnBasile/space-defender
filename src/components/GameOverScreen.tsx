import { Button } from './ui/button';
import { Card } from './ui/card';
import { Trophy, ArrowClockwise, House } from '@phosphor-icons/react';

interface GameOverScreenProps {
  score: number;
  highScore: number;
  onRestart: () => void;
  onMainMenu: () => void;
}

export function GameOverScreen({ score, highScore, onRestart, onMainMenu }: GameOverScreenProps) {
  const isNewHighScore = score === highScore && score > 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black text-destructive mb-4 tracking-wider">
          GAME OVER
        </h1>
        {isNewHighScore && (
          <div className="text-2xl font-bold text-accent mb-4 animate-pulse">
            🎉 NEW HIGH SCORE! 🎉
          </div>
        )}
      </div>

      <Card className="p-8 bg-card/80 backdrop-blur-sm border-primary/30 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="text-accent" size={24} />
            <div className="text-lg text-muted-foreground">Final Score</div>
          </div>
          <div className="text-4xl font-bold text-primary mb-4">
            {score.toLocaleString()}
          </div>
          
          <div className="text-sm text-muted-foreground mb-2">High Score</div>
          <div className="text-2xl font-bold text-accent">
            {highScore.toLocaleString()}
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={onRestart}
            className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-bold py-3"
            size="lg"
          >
            <ArrowClockwise className="mr-2" size={20} />
            PLAY AGAIN
          </Button>

          <Button 
            onClick={onMainMenu}
            variant="outline"
            className="w-full border-primary text-primary hover:bg-primary/10 font-bold py-3"
            size="lg"
          >
            <House className="mr-2" size={20} />
            MAIN MENU
          </Button>
        </div>
      </Card>

      <div className="mt-8 text-center">
        <div className="text-xs text-muted-foreground/60">
          Thanks for playing Space Defender!
        </div>
      </div>
    </div>
  );
}