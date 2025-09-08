import { useEffect, useRef, useState } from 'react';
import { useLocalStorage } from './hooks/use-local-storage';
import { Button } from './components/ui/button';
import { GameCanvas } from './components/GameCanvas';
import { GameUI } from './components/GameUI';
import { MenuScreen } from './components/MenuScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { CampaignMenu } from './components/CampaignMenu';
import { MissionBriefing } from './components/MissionBriefing';
import { MissionComplete } from './components/MissionComplete';
import { SectorMapUI } from './components/SectorMapUI';
import { EventDialog } from './components/EventDialog';
import { VolumeControl } from './components/VolumeControl';
import { WeaponSwitcher } from './components/WeaponSwitcher';
import { useControls } from './hooks/use-controls';
import { createInitialGameState, updateGameState, checkSectorEvents, applySectorHazards } from './lib/game-engine';
import { GameState, Mission, CampaignProgress, WeaponType } from './lib/game-types';
import { moveTo, triggerSectorEvent } from './lib/space-sector-system';
import { Pause, Play } from '@phosphor-icons/react';
import { initializeAudio, getAudioSystem } from './lib/audio-system';
import { 
  createInitialCampaignProgress, 
  getMissionById, 
  calculateMissionScore, 
  updateCampaignProgress,
  upgradeShipComponent,
  purchaseWeapon,
  upgradeWeaponInCampaign
} from './lib/campaign-system';

function App() {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [highScoreValue, setHighScoreValue] = useLocalStorage('space-defender-high-score', '0');
  const [campaignProgressValue, setCampaignProgressValue] = useLocalStorage('space-defender-campaign', JSON.stringify(createInitialCampaignProgress()));
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  
  const highScore = parseInt(highScoreValue || '0', 10);
  const setHighScore = (score: number) => setHighScoreValue(score.toString());
  
  const campaignProgress: CampaignProgress = JSON.parse(campaignProgressValue || JSON.stringify(createInitialCampaignProgress()));
  const setCampaignProgress = (progress: CampaignProgress) => setCampaignProgressValue(JSON.stringify(progress));
  
  const controls = useControls();
  const gameLoopRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  const lastWeaponSwitchRef = useRef<number>(0);

  const startGame = () => {
    const arcadeState = createInitialGameState('arcade');
    arcadeState.gameStatus = 'playing';
    setGameState(arcadeState);
    
    // Initialize audio when game starts
    initializeAudio().then(() => {
      // Start gameplay music and ambient sounds
      const audioSystem = getAudioSystem();
      audioSystem.playMusicTrack('gameplay');
      audioSystem.startAmbientSounds();
    }).catch((error) => {
      console.warn('Failed to initialize audio:', error);
      // Game can still function without audio
    });
  };

  const startExplorationMode = () => {
    // Create exploration state with a delay buffer to prevent immediate events
    const explorationState = createInitialGameState('exploration');
    explorationState.lastEventTime = Date.now(); // Set to current time to prevent immediate events
    
    setGameState({ 
      ...explorationState, 
      gameStatus: 'playing' 
    });
    
    // Initialize audio for exploration
    initializeAudio().then(() => {
      const audioSystem = getAudioSystem();
      audioSystem.playMusicTrack('gameplay');
      audioSystem.startAmbientSounds();
    }).catch((error) => {
      console.warn('Failed to initialize audio:', error);
    });
  };

  const openSectorMap = () => {
    if (gameState.gameMode === 'exploration' && gameState.sectorMap) {
      setGameState(prev => ({ ...prev, gameStatus: 'sectorMap' }));
    }
  };

  const moveToSector = (coordinates: { x: number; y: number }) => {
    if (gameState.sectorMap) {
      const newSectorMap = moveTo(gameState.sectorMap, coordinates);
      let newState = { 
        ...gameState, 
        sectorMap: newSectorMap,
        gameStatus: 'playing' as const
      };
      
      // Apply sector hazards when entering a new sector
      newState = applySectorHazards(newState);
      setGameState(newState);
    }
  };

  const handleEventChoice = (choiceId: string) => {
    if (gameState.activeEvent && gameState.sectorMap) {
      const event = gameState.activeEvent;
      const choice = event.choices?.find(c => c.id === choiceId);
      
      if (choice) {
        setGameState(prev => {
          // Apply choice consequences and rewards
          const newGameState = { ...prev };
          
          // Roll for success
          const success = Math.random() < choice.successChance;
          
          if (success) {
            // Apply rewards
            choice.rewards.forEach(reward => {
              switch (reward.type) {
                case 'credits':
                  newGameState.score += reward.amount;
                  break;
                case 'health':
                  newGameState.player = {
                    ...newGameState.player,
                    lives: Math.min(3, newGameState.player.lives + reward.amount)
                  };
                  break;
                case 'experience':
                  newGameState.score += reward.amount * 10;
                  break;
                case 'powerup':
                  // Add a random power-up
                  // This would be implemented by spawning a power-up
                  break;
              }
            });
          } else {
            // Apply consequences
            choice.consequences.forEach(consequence => {
              switch (consequence.type) {
                case 'damage':
                  if (!newGameState.player.invulnerable && newGameState.player.powerUps.shield <= 0) {
                    newGameState.player = {
                      ...newGameState.player,
                      lives: Math.max(0, newGameState.player.lives - consequence.amount)
                    };
                  }
                  break;
                case 'resource_loss':
                  newGameState.score = Math.max(0, newGameState.score - consequence.amount);
                  break;
              }
            });
          }
          
          // Mark event as triggered
          if (newGameState.sectorMap) {
            const currentSector = newGameState.sectorMap.currentSector;
            const eventIndex = currentSector.events.findIndex(e => e.id === event.id);
            if (eventIndex !== -1) {
              newGameState.sectorMap = {
                ...newGameState.sectorMap,
                currentSector: {
                  ...currentSector,
                  events: currentSector.events.map((e, index) => 
                    index === eventIndex ? { ...e, triggered: true } : e
                  )
                }
              };
            }
          }
          
          return {
            ...newGameState,
            activeEvent: undefined,
            gameStatus: 'playing',
            lastEventTime: Date.now()
          };
        });
      }
    }
  };

  const dismissEvent = () => {
    setGameState(prev => {
      if (!prev.activeEvent) return { ...prev, gameStatus: 'playing' };
      
      const event = prev.activeEvent;
      console.log('Dismissing event:', event.type, 'Has choices:', !!event.choices);
      
      const newState = { ...prev };
      
      // Apply automatic rewards for events without choices
      if (!event.choices && event.rewards.length > 0) {
        event.rewards.forEach(reward => {
          switch (reward.type) {
            case 'credits':
              newState.score += reward.amount;
              break;
            case 'health':
              newState.player = {
                ...newState.player,
                lives: Math.min(3, newState.player.lives + reward.amount)
              };
              break;
            case 'experience':
              newState.score += reward.amount * 10;
              break;
            case 'powerup':
              // Add a random power-up effect
              break;
          }
        });
      }
      
      // Apply automatic consequences for events without choices
      if (!event.choices && event.consequences.length > 0) {
        event.consequences.forEach(consequence => {
          switch (consequence.type) {
            case 'damage':
              if (!newState.player.invulnerable && newState.player.powerUps.shield <= 0) {
                newState.player = {
                  ...newState.player,
                  lives: Math.max(0, newState.player.lives - consequence.amount)
                };
              }
              break;
            case 'resource_loss':
              newState.score = Math.max(0, newState.score - consequence.amount);
              break;
          }
        });
      }
      
      // Mark event as triggered
      if (newState.sectorMap) {
        const currentSector = newState.sectorMap.currentSector;
        const eventIndex = currentSector.events.findIndex(e => e.id === event.id);
        if (eventIndex !== -1) {
          newState.sectorMap = {
            ...newState.sectorMap,
            currentSector: {
              ...currentSector,
              events: currentSector.events.map((e, index) => 
                index === eventIndex ? { ...e, triggered: true } : e
              )
            }
          };
        }
      }
      
      return {
        ...newState,
        activeEvent: undefined,
        gameStatus: 'playing',
        lastEventTime: Date.now()
      };
    });
  };

  const startCampaignMode = () => {
    setGameState(prev => ({ ...prev, gameStatus: 'campaignMenu' }));
  };

  const startMission = (mission: Mission) => {
    setSelectedMission(mission);
    setGameState(prev => ({ ...prev, gameStatus: 'missionBriefing' }));
  };

  const launchMission = () => {
    if (selectedMission) {
      // Create initial game state for campaign mode with campaign upgrades
      const newGameState = createInitialGameState('campaign', selectedMission, campaignProgress);
      // Set status to playing immediately to prevent flash
      setGameState({ ...newGameState, gameStatus: 'playing' });
      
      // Initialize audio for mission
      initializeAudio().then(() => {
        const audioSystem = getAudioSystem();
        audioSystem.playMusicTrack('gameplay');
        audioSystem.startAmbientSounds();
      }).catch((error) => {
        console.warn('Failed to initialize audio:', error);
      });
    }
  };

  const upgradeCampaignShip = (component: keyof CampaignProgress['shipUpgrades']) => {
    const newProgress = upgradeShipComponent(campaignProgress, component);
    if (newProgress) {
      setCampaignProgress(newProgress);
    }
  };

  const purchaseCampaignWeapon = (weaponType: WeaponType) => {
    const newProgress = purchaseWeapon(campaignProgress, weaponType);
    if (newProgress) {
      setCampaignProgress(newProgress);
    }
  };

  const upgradeCampaignWeapon = (weaponType: WeaponType) => {
    const newProgress = upgradeWeaponInCampaign(campaignProgress, weaponType);
    if (newProgress) {
      setCampaignProgress(newProgress);
    }
  };

  const switchWeapon = (index: number) => {
    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        weaponSystem: {
          ...prev.player.weaponSystem,
          activeWeaponIndex: index
        }
      }
    }));
  };

  const completeMission = () => {
    if (selectedMission && gameState.gameMode === 'campaign') {
      const missionScore = calculateMissionScore(selectedMission, gameState);
      const newProgress = updateCampaignProgress(campaignProgress, selectedMission, missionScore);
      setCampaignProgress(newProgress);
      setGameState(prev => ({ ...prev, gameStatus: 'campaignMenu' }));
      setSelectedMission(null);
    }
  };

  const retryMission = () => {
    if (selectedMission) {
      launchMission();
    }
  };

  const pauseGame = () => {
    setGameState(prev => ({ ...prev, gameStatus: 'paused' }));
  };

  const resumeGame = () => {
    setGameState(prev => ({ ...prev, gameStatus: 'playing' }));
  };

  const goToMainMenu = () => {
    // Stop background audio
    const audioSystem = getAudioSystem();
    audioSystem.stopMusicTrack();
    audioSystem.stopAmbientSounds();
    setGameState(createInitialGameState());
  };

  const restartGame = () => {
    startGame();
  };

  // Handle pause key and weapon switching
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const now = Date.now();
      
      if (event.code === 'KeyP') {
        event.preventDefault();
        // Don't allow pausing during boss animations
        if (gameState.gameStatus === 'bossIntro' || gameState.gameStatus === 'bossDefeat') {
          return;
        }
        if (gameState.gameStatus === 'playing') {
          pauseGame();
        } else if (gameState.gameStatus === 'paused') {
          resumeGame();
        }
      }
      
      // Open sector map in exploration mode
      if (event.code === 'KeyM' && gameState.gameMode === 'exploration' && gameState.gameStatus === 'playing') {
        event.preventDefault();
        openSectorMap();
      }
      
      // Handle weapon switching with debouncing
      if ((event.code === 'KeyQ' || event.code === 'KeyE') && 
          gameState.gameStatus === 'playing' &&
          now - lastWeaponSwitchRef.current > 200) { // 200ms debounce
        
        lastWeaponSwitchRef.current = now;
        const weapons = gameState.player.weaponSystem.weaponSlots;
        const currentIndex = gameState.player.weaponSystem.activeWeaponIndex;
        
        if (weapons.length > 1) {
          let newIndex;
          if (event.code === 'KeyQ') {
            // Previous weapon
            newIndex = currentIndex === 0 ? weapons.length - 1 : currentIndex - 1;
          } else {
            // Next weapon
            newIndex = (currentIndex + 1) % weapons.length;
          }
          switchWeapon(newIndex);
        }
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.gameStatus, gameState.gameMode]);

  // Game loop
  useEffect(() => {
    if (gameState.gameStatus === 'menu' || gameState.gameStatus === 'gameOver' || 
        gameState.gameStatus === 'campaignMenu' || gameState.gameStatus === 'missionBriefing' ||
        gameState.gameStatus === 'missionComplete' || gameState.gameStatus === 'eventDialog' ||
        gameState.gameStatus === 'sectorMap') {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      return;
    }

    let lastFrameTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    const gameLoop = (currentTime: number) => {
      // Throttle to target FPS
      if (currentTime - lastFrameTime < frameInterval) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }
      
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;
      lastFrameTime = currentTime;

      setGameState(prevState => {
        let newState = updateGameState(prevState, controls, deltaTime);
        
        // Check for sector events in exploration mode
        if (newState.gameMode === 'exploration' && newState.gameStatus === 'playing') {
          newState = checkSectorEvents(newState);
        }
        
        // Check for mission completion
        if (newState.gameMode === 'campaign' && newState.gameStatus === 'missionComplete') {
          // Mission completed, don't continue the loop
          return { ...newState, gameStatus: 'missionComplete' };
        }
        
        return newState;
      });
      
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.gameStatus, controls]);

  // Dynamic music mixing based on health and score
  useEffect(() => {
    if (gameState.gameStatus === 'playing' || gameState.gameStatus === 'bossIntro' || gameState.gameStatus === 'bossDefeat') {
      const audioSystem = getAudioSystem();
      
      // Calculate health percentage (assuming player starts with 3 lives)
      const healthPercent = gameState.player.lives / 3;
      
      // Calculate score multiplier (higher scores increase intensity)
      const scoreMultiplier = Math.max(1, gameState.score / 1000); // Every 1000 points = 1x multiplier
      
      // Update music intensity
      audioSystem.updateMusicIntensity(healthPercent, scoreMultiplier);
    }
  }, [gameState.player.lives, gameState.score, gameState.gameStatus]);

  // Update high score and stop audio on game over
  useEffect(() => {
    if (gameState.gameStatus === 'gameOver') {
      // Stop background audio
      const audioSystem = getAudioSystem();
      audioSystem.stopMusicTrack();
      audioSystem.stopAmbientSounds();
      
      if (gameState.score > highScore) {
        setHighScore(gameState.score);
      }
    }
  }, [gameState.gameStatus, gameState.score, highScore, setHighScoreValue]);

  // Handle music track changes based on game status
  useEffect(() => {
    const audioSystem = getAudioSystem();
    
    if (gameState.gameStatus === 'menu') {
      // Start menu music when entering menu
      initializeAudio().then(() => {
        audioSystem.playMusicTrack('menu');
      }).catch((error) => {
        console.warn('Failed to initialize menu audio:', error);
      });
    } else if (gameState.gameStatus === 'playing') {
      // Switch to gameplay music when resuming
      audioSystem.playMusicTrack('gameplay');
    } else if (gameState.gameStatus === 'bossIntro') {
      // Switch to boss music when boss appears
      audioSystem.playMusicTrack('boss');
    } else if (gameState.gameStatus === 'bossDefeat') {
      // Play victory music when boss is defeated
      audioSystem.playMusicTrack('victory');
      
      // Switch back to gameplay music after victory sequence
      const timeout = setTimeout(() => {
        if (gameState.gameStatus === 'playing') {
          audioSystem.playMusicTrack('gameplay');
        }
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [gameState.gameStatus]);

  if (gameState.gameStatus === 'menu') {
    return <MenuScreen onStartGame={startGame} onCampaignMode={startCampaignMode} onExplorationMode={startExplorationMode} highScore={highScore} />;
  }

  if (gameState.gameStatus === 'sectorMap' && gameState.sectorMap) {
    return (
      <SectorMapUI
        sectorMap={gameState.sectorMap}
        onMoveTo={moveToSector}
        onCloseMap={() => setGameState(prev => ({ ...prev, gameStatus: 'playing' }))}
        playerResources={{
          credits: gameState.score,
          technology: 0, // Could be tracked separately
          experience: Math.floor(gameState.score / 100)
        }}
      />
    );
  }

  if (gameState.gameStatus === 'eventDialog' && gameState.activeEvent) {
    return (
      <EventDialog
        event={gameState.activeEvent}
        onMakeChoice={handleEventChoice}
        onDismiss={dismissEvent}
        playerResources={{
          credits: gameState.score,
          health: gameState.player.lives,
          weapons: gameState.player.weaponSystem.weaponSlots.map(w => w.type)
        }}
      />
    );
  }

  if (gameState.gameStatus === 'campaignMenu') {
    return (
      <CampaignMenu
        campaignProgress={campaignProgress}
        onStartMission={startMission}
        onUpgradeShip={upgradeCampaignShip}
        onPurchaseWeapon={purchaseCampaignWeapon}
        onUpgradeWeapon={upgradeCampaignWeapon}
        onBackToMenu={goToMainMenu}
      />
    );
  }

  if (gameState.gameStatus === 'missionBriefing' && selectedMission) {
    return (
      <MissionBriefing
        mission={selectedMission}
        onStartMission={launchMission}
        onBack={() => setGameState(prev => ({ ...prev, gameStatus: 'campaignMenu' }))}
      />
    );
  }

  if (gameState.gameStatus === 'missionComplete' && selectedMission && gameState.missionProgress) {
    const missionScore = calculateMissionScore(selectedMission, gameState);
    return (
      <MissionComplete
        mission={selectedMission}
        score={missionScore}
        experienceGained={selectedMission.rewards.experience}
        creditsGained={selectedMission.rewards.credits || 0}
        completionTime={gameState.missionProgress.timeElapsed}
        objectivesCompleted={selectedMission.objectives.filter(obj => obj.required && obj.current >= obj.target).length}
        bonusObjectivesCompleted={selectedMission.objectives.filter(obj => !obj.required && obj.current >= obj.target).length}
        onContinue={completeMission}
        onRetry={retryMission}
        onBackToCampaign={() => setGameState(prev => ({ ...prev, gameStatus: 'campaignMenu' }))}
      />
    );
  }

  if (gameState.gameStatus === 'gameOver') {
    return (
      <GameOverScreen 
        score={gameState.score}
        highScore={highScore}
        onRestart={restartGame}
        onMainMenu={goToMainMenu}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-black text-primary mb-2 tracking-wider">
            SPACE DEFENDER
          </h1>
          <div className="flex items-center justify-center gap-4">
            {gameState.gameStatus === 'playing' && (
              <Button
                onClick={pauseGame}
                variant="outline"
                size="sm"
                className="border-primary text-primary hover:bg-primary/10"
              >
                <Pause className="mr-2" size={16} />
                Pause
              </Button>
            )}
            {gameState.gameStatus === 'paused' && (
              <div className="flex items-center gap-4">
                <div className="text-xl font-bold text-accent animate-pulse">PAUSED</div>
                <Button
                  onClick={resumeGame}
                  variant="outline"
                  size="sm"
                  className="border-accent text-accent hover:bg-accent/10"
                >
                  <Play className="mr-2" size={16} />
                  Resume
                </Button>
              </div>
            )}
            {gameState.gameStatus === 'bossIntro' && (
              <div className="text-xl font-bold text-destructive animate-pulse">WARNING: BOSS INCOMING</div>
            )}
            {gameState.gameStatus === 'bossDefeat' && (
              <div className="text-xl font-bold text-accent animate-pulse">BOSS DEFEATED!</div>
            )}
            {(gameState.gameStatus === 'playing' || gameState.gameStatus === 'paused') && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={goToMainMenu}
                  variant="outline"
                  size="sm"
                  className="border-muted-foreground text-muted-foreground hover:bg-muted"
                >
                  Main Menu
                </Button>
                {gameState.gameMode === 'exploration' && gameState.gameStatus === 'playing' && (
                  <Button
                    onClick={openSectorMap}
                    variant="outline"
                    size="sm"
                    className="border-secondary text-secondary hover:bg-secondary/10"
                  >
                    Sector Map (M)
                  </Button>
                )}
                <VolumeControl />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8">
          <GameUI gameState={gameState} />
          
          <div className="flex-shrink-0">
            <GameCanvas gameState={gameState} />
          </div>
          
          <div className="w-full max-w-xs lg:order-first">
            <div className="text-center lg:text-left mb-4">
              <h3 className="text-lg font-bold text-foreground mb-2">Mission Briefing</h3>
              {gameState.gameMode === 'exploration' ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Explore infinite space sectors! Each sector contains unique challenges, 
                    resources, and mysterious events. Travel between sectors to discover 
                    ancient artifacts, trade with merchants, and survive cosmic hazards.
                  </p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><span className="text-primary">WASD/Arrows:</span> Move</p>
                    <p><span className="text-primary">Space:</span> Fire</p>
                    <p><span className="text-primary">C (Hold):</span> Charge weapon</p>
                    <p><span className="text-secondary">Note:</span> Charge decays after 1.5s</p>
                    <p><span className="text-primary">Q/E:</span> Switch weapons</p>
                    <p><span className="text-primary">M:</span> Sector Map</p>
                    <p><span className="text-primary">P:</span> Pause</p>
                  </div>
                  {gameState.sectorMap && (
                    <div className="mt-3 p-3 bg-secondary/10 rounded-lg border border-secondary/30">
                      <h4 className="font-bold text-secondary mb-1">Current Sector</h4>
                      <p className="text-xs text-muted-foreground">
                        {gameState.sectorMap.currentSector.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Type: {gameState.sectorMap.currentSector.type} • 
                        Hostility: {gameState.sectorMap.currentSector.hostileLevel}/10
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Earth is under attack! Pilot your fighter through waves of alien invaders. 
                    Use precise movements and rapid fire to defend humanity's last hope.
                  </p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><span className="text-primary">WASD/Arrows:</span> Move</p>
                    <p><span className="text-primary">Space:</span> Fire</p>
                    <p><span className="text-primary">C (Hold):</span> Charge weapon</p>
                    <p><span className="text-secondary">Note:</span> Charge decays after 1.5s{gameState.campaignProgress?.shipUpgrades.chargePreservation ? ` (${Math.round((1 - Math.pow(0.85, gameState.campaignProgress.shipUpgrades.chargePreservation)) * 100)}% slower decay)` : ''}</p>
                    <p><span className="text-primary">Q/E:</span> Switch weapons</p>
                    <p><span className="text-primary">P:</span> Pause</p>
                    {gameState.campaignProgress?.shipUpgrades.chargePreservation > 0 && (
                      <p><span className="text-yellow-400">⚡ Charge Preservation:</span> Level {gameState.campaignProgress.shipUpgrades.chargePreservation}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Weapon Switcher */}
            {gameState.gameStatus === 'playing' && gameState.player.weaponSystem.weaponSlots.length > 1 && (
              <div className="mb-4">
                <WeaponSwitcher
                  weapons={gameState.player.weaponSystem.weaponSlots}
                  activeIndex={gameState.player.weaponSystem.activeWeaponIndex}
                  onSwitchWeapon={switchWeapon}
                />
              </div>
            )}
            
            {gameState.gameStatus === 'paused' && (
              <div className="p-4 bg-accent/10 rounded-lg border border-accent/30">
                <h4 className="font-bold text-accent mb-2">Game Paused</h4>
                <p className="text-sm text-muted-foreground">
                  Press P or click Resume to continue your mission.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;