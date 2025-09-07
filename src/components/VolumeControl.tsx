import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { VolumeX, Volume1, Volume2, Sliders } from '@phosphor-icons/react';
import { getAudioSystem } from '@/lib/audio-system';
import { useKV } from '@github/spark/hooks';

export function VolumeControl() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [effectsVolumeValue, setEffectsVolumeValue] = useKV('space-defender-effects-volume', '0.3');
  const [musicVolumeValue, setMusicVolumeValue] = useKV('space-defender-music-volume', '0.15');
  const [ambientVolumeValue, setAmbientVolumeValue] = useKV('space-defender-ambient-volume', '0.2');
  
  const effectsVolume = parseFloat(effectsVolumeValue || '0.3');
  const musicVolume = parseFloat(musicVolumeValue || '0.15');
  const ambientVolume = parseFloat(ambientVolumeValue || '0.2');
  
  const setEffectsVolume = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setEffectsVolumeValue(clampedVolume.toString());
    getAudioSystem().setVolume(clampedVolume);
  };

  const setMusicVolume = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setMusicVolumeValue(clampedVolume.toString());
    getAudioSystem().setMusicVolume(clampedVolume);
  };

  const setAmbientVolume = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setAmbientVolumeValue(clampedVolume.toString());
    getAudioSystem().setAmbientVolume(clampedVolume);
  };

  // Initialize audio system volumes on mount
  useEffect(() => {
    getAudioSystem().setVolume(effectsVolume);
    getAudioSystem().setMusicVolume(musicVolume);
    getAudioSystem().setAmbientVolume(ambientVolume);
  }, [effectsVolume, musicVolume, ambientVolume]);

  // Close advanced panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setShowAdvanced(false);
      }
    };

    if (showAdvanced) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAdvanced]);

  const masterVolume = Math.max(effectsVolume, musicVolume, ambientVolume);

  const toggleMute = () => {
    if (masterVolume === 0) {
      setEffectsVolume(0.3);
      setMusicVolume(0.15);
      setAmbientVolume(0.2);
    } else {
      setEffectsVolume(0);
      setMusicVolume(0);
      setAmbientVolume(0);
    }
  };

  const getVolumeIcon = () => {
    if (masterVolume === 0) return VolumeX;
    if (masterVolume < 0.5) return Volume1;
    return Volume2;
  };

  const VolumeIcon = getVolumeIcon();

  const VolumeSlider = ({ 
    label, 
    value, 
    onChange, 
    color = 'primary' 
  }: { 
    label: string; 
    value: number; 
    onChange: (value: number) => void;
    color?: string;
  }) => (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-12 text-muted-foreground">{label}:</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer slider slider-${color}`}
        aria-label={`${label} Volume`}
      />
      <span className="text-muted-foreground w-8 text-right">
        {Math.round(value * 100)}%
      </span>
    </div>
  );

  return (
    <div className="relative flex items-center gap-2" ref={panelRef}>
      <Button
        onClick={toggleMute}
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground p-2"
        aria-label={masterVolume === 0 ? 'Unmute' : 'Mute'}
      >
        <VolumeIcon size={18} />
      </Button>
      
      <Button
        onClick={() => setShowAdvanced(!showAdvanced)}
        variant="ghost"
        size="sm"
        className={`text-muted-foreground hover:text-foreground p-2 ${showAdvanced ? 'text-primary' : ''}`}
        aria-label="Audio Settings"
      >
        <Sliders size={18} />
      </Button>

      {showAdvanced && (
        <div className="absolute top-full right-0 mt-2 p-3 bg-card border border-border rounded-lg shadow-lg min-w-56 z-50">
          <div className="space-y-3">
            <div className="text-sm font-medium text-foreground mb-2">Audio Levels</div>
            <VolumeSlider 
              label="Effects" 
              value={effectsVolume} 
              onChange={setEffectsVolume}
              color="primary"
            />
            <VolumeSlider 
              label="Music" 
              value={musicVolume} 
              onChange={setMusicVolume}
              color="accent"
            />
            <VolumeSlider 
              label="Ambient" 
              value={ambientVolume} 
              onChange={setAmbientVolume}
              color="secondary"
            />
          </div>
        </div>
      )}
      
      {/* Custom CSS for slider styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: 2px solid hsl(var(--background));
        }
        
        .slider-accent::-webkit-slider-thumb {
          background: hsl(var(--accent));
        }
        
        .slider-secondary::-webkit-slider-thumb {
          background: hsl(var(--secondary));
        }
        
        .slider::-moz-range-thumb {
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: 2px solid hsl(var(--background));
        }
        
        .slider-accent::-moz-range-thumb {
          background: hsl(var(--accent));
        }
        
        .slider-secondary::-moz-range-thumb {
          background: hsl(var(--secondary));
        }
        
        .slider::-webkit-slider-track {
          height: 4px;
          border-radius: 2px;
          background: hsl(var(--muted));
        }
        
        .slider::-moz-range-track {
          height: 4px;
          border-radius: 2px;
          background: hsl(var(--muted));
          border: none;
        }
        `
      }} />
    </div>
  );
}