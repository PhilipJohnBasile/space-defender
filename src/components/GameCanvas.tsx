import { useEffect, useRef } from 'react';
import { GameState, GAME_CONFIG } from '../lib/game-types';
import { renderGame } from '../lib/game-renderer';

interface GameCanvasProps {
  gameState: GameState;
}

export function GameCanvas({ gameState }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderGame(ctx, gameState);
  }, [gameState]);

  return (
    <canvas
      ref={canvasRef}
      width={GAME_CONFIG.CANVAS_WIDTH}
      height={GAME_CONFIG.CANVAS_HEIGHT}
      className="border border-primary rounded-lg shadow-lg shadow-primary/20"
      style={{
        background: 'radial-gradient(ellipse at center, oklch(0.15 0.05 240) 0%, oklch(0.1 0.02 240) 100%)',
      }}
    />
  );
}