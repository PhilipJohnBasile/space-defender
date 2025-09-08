import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { SectorEvent, EventChoice } from '../lib/space-sector-system';
import { 
  Star, 
  Warning, 
  ShoppingCart, 
  Sword, 
  Sparkle, 
  RadioButton, 
  Package, 
  Shield, 
  Skull, 
  Alien,
  CurrencyDollar,
  Crosshair
} from '@phosphor-icons/react';

interface EventDialogProps {
  event: SectorEvent;
  onMakeChoice: (choiceId: string) => void;
  onDismiss: () => void;
  playerResources?: {
    credits: number;
    health: number;
    weapons: string[];
  };
}

export function EventDialog({ event, onMakeChoice, onDismiss, playerResources }: EventDialogProps) {
  const getEventIcon = (type: SectorEvent['type']) => {
    const icons = {
      encounter: Sword,
      discovery: Sparkle,
      distress: Warning,
      merchant: ShoppingCart,
      ambush: Crosshair,
      anomaly: Star,
      derelict: Package,
      patrol: Shield,
      pirates: Skull,
      aliens: Alien,
      treasure: CurrencyDollar,
      trap: Warning
    };
    const Icon = icons[type] || Star;
    return <Icon size={24} className="text-primary" />;
  };

  const getEventTypeColor = (type: SectorEvent['type']) => {
    const colors = {
      encounter: 'border-blue-500',
      discovery: 'border-cyan-500',
      distress: 'border-yellow-500',
      merchant: 'border-green-500',
      ambush: 'border-red-500',
      anomaly: 'border-purple-500',
      derelict: 'border-gray-500',
      patrol: 'border-blue-600',
      pirates: 'border-red-600',
      aliens: 'border-indigo-500',
      treasure: 'border-yellow-600',
      trap: 'border-orange-500'
    };
    return colors[type] || 'border-muted';
  };

  const canAffordChoice = (choice: EventChoice) => {
    if (!choice.requirements || !playerResources) return true;
    
    return choice.requirements.every(req => {
      switch (req.type) {
        case 'resources':
          return playerResources.credits >= (req.value as number);
        case 'player_health':
          return playerResources.health >= (req.value as number);
        case 'weapons':
          return playerResources.weapons.includes(req.value as string);
        default:
          return true;
      }
    });
  };

  const getChoiceSuccessColor = (chance: number) => {
    if (chance >= 0.8) return 'text-green-400';
    if (chance >= 0.6) return 'text-yellow-400';
    if (chance >= 0.4) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <Card className={`w-full max-w-2xl border-2 ${getEventTypeColor(event.type)} bg-card/95 backdrop-blur-sm`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {getEventIcon(event.type)}
            <div>
              <div className="text-xl font-bold">
                {event.type.charAt(0).toUpperCase() + event.type.slice(1).replace('_', ' ')} Event
              </div>
              <Badge variant="outline" className="mt-1">
                Priority {event.priority}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Event Description */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-foreground leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Automatic Rewards/Consequences */}
          {(event.rewards.length > 0 || event.consequences.length > 0) && !event.choices && (
            <div className="space-y-3">
              {event.rewards.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-400 mb-2">Rewards</h4>
                  <div className="space-y-1">
                    {event.rewards.map((reward, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>{reward.description}</span>
                        <Badge variant="secondary" className="text-green-400">
                          +{reward.amount} {reward.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {event.consequences.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-400 mb-2">Consequences</h4>
                  <div className="space-y-1">
                    {event.consequences.map((consequence, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>{consequence.description}</span>
                        <Badge variant="destructive">
                          -{consequence.amount} {consequence.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Event Choices */}
          {event.choices && (
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Choose your response:</h4>
              
              {event.choices.map((choice) => {
                const canAfford = canAffordChoice(choice);
                const successChance = Math.round(choice.successChance * 100);
                
                return (
                  <Card 
                    key={choice.id} 
                    className={`transition-all duration-200 ${
                      canAfford 
                        ? 'hover:border-primary cursor-pointer hover:shadow-lg' 
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                    onClick={() => canAfford && onMakeChoice(choice.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <p className="font-medium text-foreground flex-1">
                          {choice.text}
                        </p>
                        <div className="flex items-center gap-2 ml-4">
                          <span className={`text-sm font-semibold ${getChoiceSuccessColor(choice.successChance)}`}>
                            {successChance}%
                          </span>
                          <RadioButton 
                            size={16} 
                            className={canAfford ? 'text-primary' : 'text-muted-foreground'} 
                          />
                        </div>
                      </div>
                      
                      {/* Choice Requirements */}
                      {choice.requirements && choice.requirements.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-muted-foreground mb-1">Requirements:</p>
                          <div className="flex flex-wrap gap-1">
                            {choice.requirements.map((req, index) => (
                              <Badge 
                                key={index} 
                                variant={canAfford ? "secondary" : "destructive"}
                                className="text-xs"
                              >
                                {req.type}: {req.operator} {req.value}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {/* Choice Rewards */}
                        {choice.rewards.length > 0 && (
                          <div>
                            <p className="font-medium text-green-400 mb-1">Potential Rewards:</p>
                            <div className="space-y-1">
                              {choice.rewards.map((reward, index) => (
                                <div key={index} className="flex items-center justify-between">
                                  <span className="text-muted-foreground">{reward.description}</span>
                                  <span className="text-green-400">+{reward.amount}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Choice Consequences */}
                        {choice.consequences.length > 0 && (
                          <div>
                            <p className="font-medium text-red-400 mb-1">Potential Risks:</p>
                            <div className="space-y-1">
                              {choice.consequences.map((consequence, index) => (
                                <div key={index} className="flex items-center justify-between">
                                  <span className="text-muted-foreground">{consequence.description}</span>
                                  <span className="text-red-400">-{consequence.amount}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            {!event.choices && (
              <Button onClick={onDismiss} className="min-w-24">
                Continue
              </Button>
            )}
            
            {event.choices && (
              <Button onClick={onDismiss} variant="outline">
                Ignore Event
              </Button>
            )}
          </div>
          
          {/* Player Resources Display */}
          {playerResources && (
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Current Resources:</p>
              <div className="flex items-center gap-4 text-xs">
                <span>Credits: <span className="text-yellow-400 font-semibold">{playerResources.credits}</span></span>
                <span>Health: <span className="text-green-400 font-semibold">{playerResources.health}</span></span>
                <span>Weapons: <span className="text-blue-400 font-semibold">{playerResources.weapons.length}</span></span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}