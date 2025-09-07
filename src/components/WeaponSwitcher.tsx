import { Button } from './ui/button';
import { WeaponUpgrade } from '../lib/game-types';
import { getWeaponDisplayName } from '../lib/weapon-system';
import { ChevronLeft, ChevronRight } from '@phosphor-icons/react';

interface WeaponSwitcherProps {
  weapons: WeaponUpgrade[];
  activeIndex: number;
  onSwitchWeapon: (index: number) => void;
}

export function WeaponSwitcher({ weapons, activeIndex, onSwitchWeapon }: WeaponSwitcherProps) {
  if (weapons.length <= 1) {
    return null; // Don't show switcher if only one weapon
  }

  const switchToPrevious = () => {
    const newIndex = activeIndex === 0 ? weapons.length - 1 : activeIndex - 1;
    onSwitchWeapon(newIndex);
  };

  const switchToNext = () => {
    const newIndex = activeIndex === weapons.length - 1 ? 0 : activeIndex + 1;
    onSwitchWeapon(newIndex);
  };

  return (
    <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-primary/30 rounded-lg p-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={switchToPrevious}
        className="h-8 w-8 p-0 hover:bg-primary/20"
      >
        <ChevronLeft size={16} />
      </Button>
      
      <div className="text-sm font-medium text-foreground min-w-[120px] text-center">
        {getWeaponDisplayName(weapons[activeIndex].type)}
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={switchToNext}
        className="h-8 w-8 p-0 hover:bg-primary/20"
      >
        <ChevronRight size={16} />
      </Button>
    </div>
  );
}