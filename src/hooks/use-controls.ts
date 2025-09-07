import { useEffect, useState, useCallback } from 'react';
import { Controls } from '../lib/game-types';

export function useControls(): Controls {
  const [controls, setControls] = useState<Controls>({
    left: false,
    right: false,
    up: false,
    down: false,
    shoot: false,
    charging: false,
  });

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.code) {
      case 'ArrowLeft':
      case 'KeyA':
        setControls(prev => ({ ...prev, left: true }));
        event.preventDefault();
        break;
      case 'ArrowRight':
      case 'KeyD':
        setControls(prev => ({ ...prev, right: true }));
        event.preventDefault();
        break;
      case 'ArrowUp':
      case 'KeyW':
        setControls(prev => ({ ...prev, up: true }));
        event.preventDefault();
        break;
      case 'ArrowDown':
      case 'KeyS':
        setControls(prev => ({ ...prev, down: true }));
        event.preventDefault();
        break;
      case 'Space':
        setControls(prev => ({ ...prev, shoot: true }));
        event.preventDefault();
        break;
      case 'KeyC':
        setControls(prev => ({ ...prev, charging: true }));
        event.preventDefault();
        break;
    }
  }, []);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    switch (event.code) {
      case 'ArrowLeft':
      case 'KeyA':
        setControls(prev => ({ ...prev, left: false }));
        break;
      case 'ArrowRight':
      case 'KeyD':
        setControls(prev => ({ ...prev, right: false }));
        break;
      case 'ArrowUp':
      case 'KeyW':
        setControls(prev => ({ ...prev, up: false }));
        break;
      case 'ArrowDown':
      case 'KeyS':
        setControls(prev => ({ ...prev, down: false }));
        break;
      case 'Space':
        setControls(prev => ({ ...prev, shoot: false }));
        break;
      case 'KeyC':
        setControls(prev => ({ ...prev, charging: false }));
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return controls;
}