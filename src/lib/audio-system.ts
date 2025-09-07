/**
 * Audio System for Space Defender
 * Uses Web Audio API to generate and play sound effects
 */

export type MusicTrack = 'menu' | 'gameplay' | 'boss' | 'victory';

export interface AudioSystem {
  playBossIntro: () => void;
  playExplosion: () => void;
  playBossDefeat: () => void;
  playEnemyHit: () => void;
  playShoot: () => void;
  playPowerUp: () => void;
  playChargeStart: (weaponType?: string) => void;
  playChargeLoop: (weaponType?: string) => void;
  stopChargeLoop: () => void;
  playChargeComplete: (weaponType?: string) => void;
  playChargeDecay: (weaponType?: string) => void;
  playChargedShot: (weaponType?: string) => void;
  startBackgroundMusic: () => void;
  stopBackgroundMusic: () => void;
  startAmbientSounds: () => void;
  stopAmbientSounds: () => void;
  playMusicTrack: (track: MusicTrack) => void;
  stopMusicTrack: () => void;
  setVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  setAmbientVolume: (volume: number) => void;
  updateMusicIntensity: (healthPercent: number, scoreMultiplier: number) => void;
  init: () => Promise<void>;
}

class WebAudioSystem implements AudioSystem {
  private audioContext: AudioContext | null = null;
  private volume = 0.3; // Default volume (30%)
  private musicVolume = 0.15; // Background music volume (15%)
  private ambientVolume = 0.2; // Ambient sounds volume (20%)
  private backgroundMusicGain: GainNode | null = null;
  private ambientSoundsGain: GainNode | null = null;
  private musicOscillators: OscillatorNode[] = [];
  private ambientOscillators: OscillatorNode[] = [];
  private isMusicPlaying = false;
  private isAmbientPlaying = false;
  private currentTrack: MusicTrack | null = null;
  private musicSources: AudioBufferSourceNode[] = [];
  private trackTimeouts: NodeJS.Timeout[] = [];
  
  // Dynamic mixing state
  private intensityGain: GainNode | null = null;
  private tensionGain: GainNode | null = null;
  private currentIntensity = 0.5; // 0-1 range
  private currentTension = 0.5; // 0-1 range
  private intensityLayers: Map<string, { oscillator: OscillatorNode, gain: GainNode }> = new Map();
  private mixingActive = false;
  
  // Charge sound state
  private chargeLoopOscillator: OscillatorNode | null = null;
  private chargeLoopGain: GainNode | null = null;
  private isChargeLoopPlaying = false;

  async init(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context if it's suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create master gain nodes for music and ambient sounds
      this.backgroundMusicGain = this.audioContext.createGain();
      this.ambientSoundsGain = this.audioContext.createGain();
      
      // Create gain nodes for dynamic mixing
      this.intensityGain = this.audioContext.createGain();
      this.tensionGain = this.audioContext.createGain();
      
      this.backgroundMusicGain.gain.setValueAtTime(this.musicVolume, this.audioContext.currentTime);
      this.ambientSoundsGain.gain.setValueAtTime(this.ambientVolume, this.audioContext.currentTime);
      
      // Set initial mixing values
      this.intensityGain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
      this.tensionGain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
      
      // Connect the chain: music -> intensity -> tension -> background -> destination
      this.intensityGain.connect(this.tensionGain);
      this.tensionGain.connect(this.backgroundMusicGain);
      this.backgroundMusicGain.connect(this.audioContext.destination);
      this.ambientSoundsGain.connect(this.audioContext.destination);
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.backgroundMusicGain && this.audioContext) {
      this.backgroundMusicGain.gain.setValueAtTime(this.musicVolume, this.audioContext.currentTime);
    }
  }

  setAmbientVolume(volume: number): void {
    this.ambientVolume = Math.max(0, Math.min(1, volume));
    if (this.ambientSoundsGain && this.audioContext) {
      this.ambientSoundsGain.gain.setValueAtTime(this.ambientVolume, this.audioContext.currentTime);
    }
  }

  updateMusicIntensity(healthPercent: number, scoreMultiplier: number): void {
    if (!this.audioContext || !this.intensityGain || !this.tensionGain || !this.isMusicPlaying) return;

    const now = this.audioContext.currentTime;
    const transitionTime = 0.5; // Smooth 500ms transitions

    // Calculate intensity based on score multiplier (higher score = more intensity)
    // Score multiplier ranges from 1.0 to higher values
    const intensity = Math.min(1, Math.max(0.2, (scoreMultiplier - 1) * 0.3 + 0.5));
    
    // Calculate tension based on low health (lower health = more tension)
    // Health ranges from 0-1, invert it for tension
    const tension = Math.min(1, Math.max(0.2, 1.2 - healthPercent));

    // Smooth transitions to avoid jarring changes
    if (Math.abs(intensity - this.currentIntensity) > 0.05) {
      this.currentIntensity = intensity;
      
      // Intensity affects volume and brightness of high-frequency content
      const intensityLevel = 0.3 + (intensity * 0.7); // Range: 0.3 to 1.0
      this.intensityGain.gain.linearRampToValueAtTime(intensityLevel, now + transitionTime);
      
      // Add dynamic intensity layers for gameplay and boss tracks
      if (this.currentTrack === 'gameplay' || this.currentTrack === 'boss') {
        this.addIntensityLayer(intensity);
      }
    }

    if (Math.abs(tension - this.currentTension) > 0.05) {
      this.currentTension = tension;
      
      // Tension affects tempo and dissonance
      const tensionLevel = 0.4 + (tension * 0.6); // Range: 0.4 to 1.0
      this.tensionGain.gain.linearRampToValueAtTime(tensionLevel, now + transitionTime);
      
      // Add tension effects for low health
      if (this.currentTrack === 'gameplay' && tension > 0.7) {
        this.addTensionEffect(tension);
      }
    }
  }

  private addIntensityLayer(intensity: number): void {
    if (!this.audioContext || !this.intensityGain) return;

    const now = this.audioContext.currentTime;
    const layerKey = `intensity-${Date.now()}`;

    // Create intensity layer - high energy percussion-like sounds
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200 + intensity * 400, now);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300 + intensity * 1000, now);
    filter.Q.setValueAtTime(5, now);

    const volume = intensity * 0.08; // Subtle layer
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.1);
    gainNode.gain.linearRampToValueAtTime(volume * 0.7, now + 2);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 4);

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.intensityGain);

    oscillator.start(now);
    oscillator.stop(now + 4);

    this.intensityLayers.set(layerKey, { oscillator, gain: gainNode });
    this.musicOscillators.push(oscillator);

    // Clean up after the layer ends
    setTimeout(() => {
      this.intensityLayers.delete(layerKey);
    }, 4000);
  }

  private addTensionEffect(tension: number): void {
    if (!this.audioContext || !this.tensionGain) return;

    const now = this.audioContext.currentTime;

    // Create tension effect - dissonant, anxiety-inducing sounds
    const oscillator1 = this.audioContext.createOscillator();
    const oscillator2 = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    // Create beating effect with slightly detuned frequencies
    const baseFreq = 150 + tension * 200;
    oscillator1.type = 'triangle';
    oscillator2.type = 'triangle';
    oscillator1.frequency.setValueAtTime(baseFreq, now);
    oscillator2.frequency.setValueAtTime(baseFreq * 1.03, now); // Slight detune for beating

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.setValueAtTime(2, now);

    const volume = tension * 0.06; // Very subtle but noticeable
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.5);
    gainNode.gain.linearRampToValueAtTime(volume * 0.5, now + 3);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 5);

    // Create merger to combine oscillators
    const merger = this.audioContext.createChannelMerger(2);
    oscillator1.connect(merger, 0, 0);
    oscillator2.connect(merger, 0, 1);
    merger.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.tensionGain);

    oscillator1.start(now);
    oscillator2.start(now);
    oscillator1.stop(now + 5);
    oscillator2.stop(now + 5);

    this.musicOscillators.push(oscillator1, oscillator2);
  }

  playBossIntro(): void {
    if (!this.audioContext) return;

    // Dramatic boss intro sound - deep rumbling with rising pitch
    const now = this.audioContext.currentTime;
    const duration = 2.5;

    // Create oscillators for layered effect
    const oscillator1 = this.audioContext.createOscillator();
    const oscillator2 = this.audioContext.createOscillator();
    const oscillator3 = this.audioContext.createOscillator();

    // Create gain nodes for volume control
    const gainNode1 = this.audioContext.createGain();
    const gainNode2 = this.audioContext.createGain();
    const gainNode3 = this.audioContext.createGain();
    const masterGain = this.audioContext.createGain();

    // Low rumble
    oscillator1.type = 'sawtooth';
    oscillator1.frequency.setValueAtTime(40, now);
    oscillator1.frequency.exponentialRampToValueAtTime(80, now + duration);

    // Mid-range drone
    oscillator2.type = 'square';
    oscillator2.frequency.setValueAtTime(120, now);
    oscillator2.frequency.exponentialRampToValueAtTime(200, now + duration);

    // High frequency accent
    oscillator3.type = 'sine';
    oscillator3.frequency.setValueAtTime(800, now);
    oscillator3.frequency.exponentialRampToValueAtTime(1200, now + duration);

    // Volume envelopes
    gainNode1.gain.setValueAtTime(0, now);
    gainNode1.gain.linearRampToValueAtTime(0.4, now + 0.1);
    gainNode1.gain.exponentialRampToValueAtTime(0.1, now + duration);

    gainNode2.gain.setValueAtTime(0, now);
    gainNode2.gain.linearRampToValueAtTime(0.2, now + 0.2);
    gainNode2.gain.exponentialRampToValueAtTime(0.05, now + duration);

    gainNode3.gain.setValueAtTime(0, now);
    gainNode3.gain.linearRampToValueAtTime(0.1, now + 0.5);
    gainNode3.gain.exponentialRampToValueAtTime(0.02, now + duration);

    masterGain.gain.setValueAtTime(this.volume, now);

    // Connect the audio graph
    oscillator1.connect(gainNode1);
    oscillator2.connect(gainNode2);
    oscillator3.connect(gainNode3);
    gainNode1.connect(masterGain);
    gainNode2.connect(masterGain);
    gainNode3.connect(masterGain);
    masterGain.connect(this.audioContext.destination);

    // Start and stop
    oscillator1.start(now);
    oscillator2.start(now);
    oscillator3.start(now);
    oscillator1.stop(now + duration);
    oscillator2.stop(now + duration);
    oscillator3.stop(now + duration);
  }

  playExplosion(): void {
    if (!this.audioContext) return;

    // Sharp explosion sound with noise burst
    const now = this.audioContext.currentTime;
    const duration = 0.8;

    // Create noise buffer for explosion texture
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = buffer.getChannelData(0);

    // Generate white noise with exponential decay
    for (let i = 0; i < bufferSize; i++) {
      const decay = Math.exp(-i / (bufferSize * 0.3));
      output[i] = (Math.random() * 2 - 1) * decay;
    }

    // Create buffer source
    const noiseSource = this.audioContext.createBufferSource();
    noiseSource.buffer = buffer;

    // Create low-pass filter for explosion character
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + duration);

    // Create gain for volume envelope
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(this.volume * 0.8, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Connect and play
    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    noiseSource.start(now);
    noiseSource.stop(now + duration);
  }

  playBossDefeat(): void {
    if (!this.audioContext) return;

    // Epic boss defeat sound - triumphant and explosive
    const now = this.audioContext.currentTime;
    const duration = 3.0;

    // Multiple oscillators for rich harmonic content
    const oscillators: OscillatorNode[] = [];
    const gainNodes: GainNode[] = [];

    // Frequencies for a triumphant chord (C major with extensions)
    const frequencies = [130.81, 164.81, 196.00, 261.63, 329.63, 392.00];
    
    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.type = index < 3 ? 'sawtooth' : 'square';
      oscillator.frequency.setValueAtTime(freq, now);
      
      // Slight frequency modulation for richness
      oscillator.frequency.linearRampToValueAtTime(freq * 1.02, now + duration * 0.5);
      oscillator.frequency.linearRampToValueAtTime(freq, now + duration);

      // Staggered volume envelope
      const delay = index * 0.1;
      const volume = (1 - index * 0.15) * this.volume * 0.3;
      
      gainNode.gain.setValueAtTime(0, now + delay);
      gainNode.gain.linearRampToValueAtTime(volume, now + delay + 0.2);
      gainNode.gain.linearRampToValueAtTime(volume * 0.7, now + duration * 0.8);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillators.push(oscillator);
      gainNodes.push(gainNode);

      oscillator.start(now + delay);
      oscillator.stop(now + duration);
    });

    // Add explosion texture at the beginning
    setTimeout(() => this.playExplosion(), 100);
  }

  playEnemyHit(): void {
    if (!this.audioContext) return;

    // Quick hit sound for regular enemies
    const now = this.audioContext.currentTime;
    const duration = 0.2;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.exponentialRampToValueAtTime(200, now + duration);

    gainNode.gain.setValueAtTime(this.volume * 0.4, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  playShoot(): void {
    if (!this.audioContext) return;

    // Quick laser shot sound
    const now = this.audioContext.currentTime;
    const duration = 0.1;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(600, now);
    oscillator.frequency.exponentialRampToValueAtTime(1200, now + duration * 0.3);
    oscillator.frequency.exponentialRampToValueAtTime(400, now + duration);

    gainNode.gain.setValueAtTime(this.volume * 0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  playPowerUp(): void {
    if (!this.audioContext) return;

    // Pleasant power-up collection sound
    const now = this.audioContext.currentTime;
    const duration = 0.6;

    // Create ascending arpeggio
    const frequencies = [440, 550, 660, 880]; // A major chord progression
    
    frequencies.forEach((freq, index) => {
      const delay = index * 0.1;
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, now + delay);

      gainNode.gain.setValueAtTime(0, now + delay);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, now + delay + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.3);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.start(now + delay);
      oscillator.stop(now + delay + 0.3);
    });
  }

  playMusicTrack(track: MusicTrack): void {
    // Stop current track if playing
    this.stopMusicTrack();
    
    if (!this.audioContext || !this.backgroundMusicGain) return;
    
    this.currentTrack = track;
    this.isMusicPlaying = true;
    
    switch (track) {
      case 'menu':
        this.playMenuMusic();
        break;
      case 'gameplay':
        this.playGameplayMusic();
        break;
      case 'boss':
        this.playBossMusic();
        break;
      case 'victory':
        this.playVictoryMusic();
        break;
    }
  }

  stopMusicTrack(): void {
    if (!this.audioContext || !this.isMusicPlaying) return;

    const now = this.audioContext.currentTime;
    const fadeTime = 1.5;

    // Clear all timeouts
    this.trackTimeouts.forEach(timeout => clearTimeout(timeout));
    this.trackTimeouts = [];

    // Stop all music oscillators
    this.musicOscillators.forEach(osc => {
      try {
        osc.stop(now + fadeTime);
      } catch (e) {
        // Oscillator might already be stopped
      }
    });

    // Stop all music sources
    this.musicSources.forEach(source => {
      try {
        source.stop(now + fadeTime);
      } catch (e) {
        // Source might already be stopped
      }
    });

    // Fade out the master gain
    if (this.backgroundMusicGain) {
      this.backgroundMusicGain.gain.linearRampToValueAtTime(0, now + fadeTime);
      
      // Reset gain after fade
      setTimeout(() => {
        if (this.backgroundMusicGain && this.audioContext) {
          this.backgroundMusicGain.gain.setValueAtTime(this.musicVolume, this.audioContext.currentTime);
        }
      }, fadeTime * 1000 + 100);
    }

    this.musicOscillators = [];
    this.musicSources = [];
    this.isMusicPlaying = false;
    this.currentTrack = null;
  }

  private playMenuMusic(): void {
    if (!this.audioContext || !this.backgroundMusicGain) return;

    const now = this.audioContext.currentTime;

    // Gentle, welcoming menu music - ambient and calming
    const createMenuLayer = (frequency: number, type: OscillatorType, gainLevel: number, delay: number = 0) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();
      const filter = this.audioContext!.createBiquadFilter();
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now + delay);
      
      // Subtle frequency modulation for organic feel
      const lfo = this.audioContext!.createOscillator();
      const lfoGain = this.audioContext!.createGain();
      
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.1 + Math.random() * 0.3, now);
      lfoGain.gain.setValueAtTime(frequency * 0.005, now);
      
      lfo.connect(lfoGain);
      lfoGain.connect(oscillator.frequency);
      lfo.start(now);
      
      // Warm low-pass filter
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(0.7, now);
      
      gainNode.gain.setValueAtTime(0, now + delay);
      gainNode.gain.linearRampToValueAtTime(gainLevel, now + delay + 2);
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.intensityGain!);
      
      oscillator.start(now + delay);
      this.musicOscillators.push(oscillator, lfo);
      
      return oscillator;
    };

    // Warm, inviting chord progression - C major add9
    createMenuLayer(130.81, 'sine', 0.15, 0);      // C3
    createMenuLayer(164.81, 'triangle', 0.12, 0.5); // E3
    createMenuLayer(196.00, 'sine', 0.10, 1.0);     // G3
    createMenuLayer(293.66, 'triangle', 0.08, 1.5); // D4
    createMenuLayer(523.25, 'sine', 0.06, 2.0);     // C5

    // Add gentle arpeggiation
    const arpeggiateFrequencies = [261.63, 329.63, 392.00, 493.88]; // C4, E4, G4, B4
    arpeggiateFrequencies.forEach((freq, index) => {
      const timeout = setTimeout(() => {
        if (!this.isMusicPlaying || this.currentTrack !== 'menu') return;
        
        const arpOsc = this.audioContext!.createOscillator();
        const arpGain = this.audioContext!.createGain();
        
        arpOsc.type = 'sine';
        arpOsc.frequency.setValueAtTime(freq, this.audioContext!.currentTime);
        
        arpGain.gain.setValueAtTime(0, this.audioContext!.currentTime);
        arpGain.gain.linearRampToValueAtTime(0.08, this.audioContext!.currentTime + 0.1);
        arpGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + 2);
        
        arpOsc.connect(arpGain);
        arpGain.connect(this.intensityGain!);
        
        arpOsc.start(this.audioContext!.currentTime);
        arpOsc.stop(this.audioContext!.currentTime + 2);
        
        this.musicOscillators.push(arpOsc);
      }, 3000 + index * 1500); // Start arpeggiation after 3 seconds, then every 1.5 seconds
      
      this.trackTimeouts.push(timeout);
    });
  }

  private playGameplayMusic(): void {
    if (!this.audioContext || !this.backgroundMusicGain) return;

    const now = this.audioContext.currentTime;

    // Tense, focused gameplay music - minor key with driving rhythm
    const createGameplayLayer = (frequency: number, type: OscillatorType, gainLevel: number, rhythmic: boolean = false) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      
      if (rhythmic) {
        // Add rhythmic pulsing for tension
        const pulseOsc = this.audioContext!.createOscillator();
        const pulseGain = this.audioContext!.createGain();
        
        pulseOsc.type = 'sine';
        pulseOsc.frequency.setValueAtTime(2, now); // 2 Hz pulse
        pulseGain.gain.setValueAtTime(gainLevel * 0.3, now);
        
        pulseOsc.connect(pulseGain);
        pulseGain.connect(gainNode.gain);
        pulseOsc.start(now);
        
        this.musicOscillators.push(pulseOsc);
      }
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(gainLevel, now + 1.5);
      
      oscillator.connect(gainNode);
      gainNode.connect(this.intensityGain!);
      
      oscillator.start(now);
      this.musicOscillators.push(oscillator);
      
      return oscillator;
    };

    // A minor chord with tension - creates focus and urgency
    createGameplayLayer(110.00, 'sawtooth', 0.12, true);  // A2 with pulse
    createGameplayLayer(130.81, 'triangle', 0.10);        // C3
    createGameplayLayer(164.81, 'sawtooth', 0.08);        // E3
    createGameplayLayer(220.00, 'triangle', 0.06);        // A3
    createGameplayLayer(440.00, 'sine', 0.04);            // A4

    // Add subtle bass line movement
    const bassFrequencies = [110.00, 123.47, 130.81, 146.83]; // A, B, C, D
    let bassIndex = 0;
    
    const createBassMovement = () => {
      if (!this.isMusicPlaying || this.currentTrack !== 'gameplay') return;
      
      const bassOsc = this.audioContext!.createOscillator();
      const bassGain = this.audioContext!.createGain();
      
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassFrequencies[bassIndex], this.audioContext!.currentTime);
      
      bassGain.gain.setValueAtTime(0, this.audioContext!.currentTime);
      bassGain.gain.linearRampToValueAtTime(0.15, this.audioContext!.currentTime + 0.1);
      bassGain.gain.linearRampToValueAtTime(0.05, this.audioContext!.currentTime + 1.5);
      bassGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + 2);
      
      bassOsc.connect(bassGain);
      bassGain.connect(this.intensityGain!);
      
      bassOsc.start(this.audioContext!.currentTime);
      bassOsc.stop(this.audioContext!.currentTime + 2);
      
      this.musicOscillators.push(bassOsc);
      
      bassIndex = (bassIndex + 1) % bassFrequencies.length;
      
      const timeout = setTimeout(createBassMovement, 2000);
      this.trackTimeouts.push(timeout);
    };
    
    const timeout = setTimeout(createBassMovement, 2000);
    this.trackTimeouts.push(timeout);
  }

  private playBossMusic(): void {
    if (!this.audioContext || !this.backgroundMusicGain) return;

    const now = this.audioContext.currentTime;

    // Intense, dramatic boss battle music - dissonant and powerful
    const createBossLayer = (frequency: number, type: OscillatorType, gainLevel: number, aggressive: boolean = false) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();
      const filter = this.audioContext!.createBiquadFilter();
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      
      if (aggressive) {
        // Add distortion-like filtering
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(frequency * 2, now);
        filter.Q.setValueAtTime(10, now);
        
        // Aggressive tremolo
        const tremoloOsc = this.audioContext!.createOscillator();
        const tremoloGain = this.audioContext!.createGain();
        
        tremoloOsc.type = 'square';
        tremoloOsc.frequency.setValueAtTime(8, now); // Fast tremolo
        tremoloGain.gain.setValueAtTime(gainLevel * 0.5, now);
        
        tremoloOsc.connect(tremoloGain);
        tremoloGain.connect(gainNode.gain);
        tremoloOsc.start(now);
        
        this.musicOscillators.push(tremoloOsc);
      } else {
        // Subtle low-pass for depth
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.Q.setValueAtTime(0.7, now);
      }
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(gainLevel, now + 1);
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.intensityGain!);
      
      oscillator.start(now);
      this.musicOscillators.push(oscillator);
      
      return oscillator;
    };

    // Dissonant, powerful chord - Dm with added tension
    createBossLayer(73.42, 'sawtooth', 0.18, true);   // D2 with aggression
    createBossLayer(87.31, 'square', 0.15, true);     // F2 with aggression
    createBossLayer(110.00, 'sawtooth', 0.12, false); // A2
    createBossLayer(146.83, 'triangle', 0.10, false); // D3
    createBossLayer(174.61, 'square', 0.08, true);    // F3 with aggression
    createBossLayer(293.66, 'sine', 0.06, false);     // D4

    // Add dramatic percussive hits
    const createPercussiveHit = () => {
      if (!this.isMusicPlaying || this.currentTrack !== 'boss') return;
      
      const hitOsc = this.audioContext!.createOscillator();
      const hitGain = this.audioContext!.createGain();
      const hitFilter = this.audioContext!.createBiquadFilter();
      
      hitOsc.type = 'sawtooth';
      hitOsc.frequency.setValueAtTime(60, this.audioContext!.currentTime);
      hitOsc.frequency.exponentialRampToValueAtTime(30, this.audioContext!.currentTime + 0.3);
      
      hitFilter.type = 'lowpass';
      hitFilter.frequency.setValueAtTime(200, this.audioContext!.currentTime);
      
      hitGain.gain.setValueAtTime(0.25, this.audioContext!.currentTime);
      hitGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + 0.3);
      
      hitOsc.connect(hitFilter);
      hitFilter.connect(hitGain);
      hitGain.connect(this.intensityGain!);
      
      hitOsc.start(this.audioContext!.currentTime);
      hitOsc.stop(this.audioContext!.currentTime + 0.3);
      
      this.musicOscillators.push(hitOsc);
      
      const timeout = setTimeout(createPercussiveHit, 1500 + Math.random() * 1000);
      this.trackTimeouts.push(timeout);
    };
    
    const timeout = setTimeout(createPercussiveHit, 1000);
    this.trackTimeouts.push(timeout);
  }

  private playVictoryMusic(): void {
    if (!this.audioContext || !this.backgroundMusicGain) return;

    const now = this.audioContext.currentTime;

    // Triumphant victory music - major key, ascending themes
    const createVictoryLayer = (frequency: number, type: OscillatorType, gainLevel: number, delay: number = 0) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();
      const filter = this.audioContext!.createBiquadFilter();
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now + delay);
      
      // Bright filter for triumphant sound
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(200, now);
      filter.Q.setValueAtTime(0.5, now);
      
      gainNode.gain.setValueAtTime(0, now + delay);
      gainNode.gain.linearRampToValueAtTime(gainLevel, now + delay + 0.5);
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.intensityGain!);
      
      oscillator.start(now + delay);
      this.musicOscillators.push(oscillator);
      
      return oscillator;
    };

    // C Major chord with triumphant extensions
    createVictoryLayer(130.81, 'triangle', 0.15, 0);   // C3
    createVictoryLayer(164.81, 'sine', 0.12, 0.2);     // E3
    createVictoryLayer(196.00, 'triangle', 0.10, 0.4); // G3
    createVictoryLayer(261.63, 'sine', 0.08, 0.6);     // C4
    createVictoryLayer(329.63, 'triangle', 0.06, 0.8); // E4
    createVictoryLayer(523.25, 'sine', 0.04, 1.0);     // C5

    // Add celebratory ascending melody
    const melodyFrequencies = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
    melodyFrequencies.forEach((freq, index) => {
      const timeout = setTimeout(() => {
        if (!this.isMusicPlaying || this.currentTrack !== 'victory') return;
        
        const melodyOsc = this.audioContext!.createOscillator();
        const melodyGain = this.audioContext!.createGain();
        
        melodyOsc.type = 'sine';
        melodyOsc.frequency.setValueAtTime(freq, this.audioContext!.currentTime);
        
        melodyGain.gain.setValueAtTime(0, this.audioContext!.currentTime);
        melodyGain.gain.linearRampToValueAtTime(0.12, this.audioContext!.currentTime + 0.05);
        melodyGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + 0.8);
        
        melodyOsc.connect(melodyGain);
        melodyGain.connect(this.intensityGain!);
        
        melodyOsc.start(this.audioContext!.currentTime);
        melodyOsc.stop(this.audioContext!.currentTime + 0.8);
        
        this.musicOscillators.push(melodyOsc);
      }, 1500 + index * 200);
      
      this.trackTimeouts.push(timeout);
    });
  }

  startBackgroundMusic(): void {
    // Use the new system - default to gameplay music for backward compatibility
    this.playMusicTrack('gameplay');
  }

  stopBackgroundMusic(): void {
    // Use the new system
    this.stopMusicTrack();
  }

  startAmbientSounds(): void {
    if (!this.audioContext || !this.ambientSoundsGain || this.isAmbientPlaying) return;

    this.isAmbientPlaying = true;
    const now = this.audioContext.currentTime;

    // Create random space ambient sounds
    const createAmbientSource = () => {
      if (!this.audioContext || !this.ambientSoundsGain || !this.isAmbientPlaying) return;

      // Random frequency for space-like sounds
      const frequency = 100 + Math.random() * 400;
      const duration = 2 + Math.random() * 4;
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      
      oscillator.type = Math.random() > 0.5 ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency, now);
      
      // Slow frequency drift
      oscillator.frequency.linearRampToValueAtTime(
        frequency + (Math.random() - 0.5) * 100, 
        this.audioContext.currentTime + duration
      );
      
      // Low-pass filter for atmospheric effect
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800 + Math.random() * 1200, this.audioContext.currentTime);
      filter.Q.setValueAtTime(0.5, this.audioContext.currentTime);
      
      // Volume envelope
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.1, this.audioContext.currentTime + 1);
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.ambientSoundsGain);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
      
      // Schedule next ambient sound
      const nextDelay = 3000 + Math.random() * 7000; // 3-10 seconds
      setTimeout(createAmbientSource, nextDelay);
    };

    // Start creating ambient sounds
    createAmbientSource();
    
    // Also add a continuous subtle space wind
    const windOsc = this.audioContext.createOscillator();
    const windGain = this.audioContext.createGain();
    const windFilter = this.audioContext.createBiquadFilter();
    
    windOsc.type = 'sawtooth';
    windOsc.frequency.setValueAtTime(30, now);
    
    windFilter.type = 'highpass';
    windFilter.frequency.setValueAtTime(200, now);
    
    windGain.gain.setValueAtTime(0, now);
    windGain.gain.linearRampToValueAtTime(0.03, now + 2);
    
    windOsc.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.ambientSoundsGain);
    
    windOsc.start(now);
    this.ambientOscillators.push(windOsc);
  }

  stopAmbientSounds(): void {
    if (!this.audioContext || !this.isAmbientPlaying) return;

    const now = this.audioContext.currentTime;
    const fadeTime = 1;

    // Stop all ambient oscillators
    this.ambientOscillators.forEach(osc => {
      try {
        osc.stop(now + fadeTime);
      } catch (e) {
        // Oscillator might already be stopped
      }
    });

    // Fade out the master ambient gain
    if (this.ambientSoundsGain) {
      this.ambientSoundsGain.gain.linearRampToValueAtTime(0, now + fadeTime);
      
      // Reset gain after fade
      setTimeout(() => {
        if (this.ambientSoundsGain && this.audioContext) {
          this.ambientSoundsGain.gain.setValueAtTime(this.ambientVolume, this.audioContext.currentTime);
        }
      }, fadeTime * 1000 + 100);
    }

    this.ambientOscillators = [];
    this.isAmbientPlaying = false;
  }

  playChargeStart(weaponType?: string): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const duration = 0.3;

    switch (weaponType) {
      case 'plasmaBeam':
        this.playPlasmaChargeStart(now, duration);
        break;
      case 'laserCannon':
        this.playLaserChargeStart(now, duration);
        break;
      case 'railgun':
        this.playRailgunChargeStart(now, duration);
        break;
      default:
        this.playDefaultChargeStart(now, duration);
        break;
    }
  }

  private playPlasmaChargeStart(now: number, duration: number): void {
    if (!this.audioContext) return;

    // Unstable plasma ignition sound
    const oscillator1 = this.audioContext.createOscillator();
    const oscillator2 = this.audioContext.createOscillator();
    const gainNode1 = this.audioContext.createGain();
    const gainNode2 = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    oscillator1.type = 'sawtooth';
    oscillator1.frequency.setValueAtTime(300, now);
    oscillator1.frequency.exponentialRampToValueAtTime(600, now + duration);

    // Add unstable modulation
    oscillator2.type = 'triangle';
    oscillator2.frequency.setValueAtTime(150, now);
    oscillator2.frequency.exponentialRampToValueAtTime(300, now + duration);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.setValueAtTime(3, now);

    gainNode1.gain.setValueAtTime(0, now);
    gainNode1.gain.linearRampToValueAtTime(this.volume * 0.25, now + 0.1);
    gainNode1.gain.exponentialRampToValueAtTime(0.001, now + duration);

    gainNode2.gain.setValueAtTime(0, now);
    gainNode2.gain.linearRampToValueAtTime(this.volume * 0.15, now + 0.05);
    gainNode2.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator1.connect(filter);
    filter.connect(gainNode1);
    gainNode1.connect(this.audioContext.destination);

    oscillator2.connect(gainNode2);
    gainNode2.connect(this.audioContext.destination);

    oscillator1.start(now);
    oscillator2.start(now);
    oscillator1.stop(now + duration);
    oscillator2.stop(now + duration);
  }

  private playLaserChargeStart(now: number, duration: number): void {
    if (!this.audioContext) return;

    // Precise, focused laser charging sound
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, now);
    oscillator.frequency.exponentialRampToValueAtTime(1200, now + duration);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(400, now);
    filter.Q.setValueAtTime(1, now);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, now + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  private playRailgunChargeStart(now: number, duration: number): void {
    if (!this.audioContext) return;

    // Electric buildup sound for railgun
    const oscillator1 = this.audioContext.createOscillator();
    const oscillator2 = this.audioContext.createOscillator();
    const gainNode1 = this.audioContext.createGain();
    const gainNode2 = this.audioContext.createGain();

    oscillator1.type = 'square';
    oscillator1.frequency.setValueAtTime(100, now);
    oscillator1.frequency.exponentialRampToValueAtTime(400, now + duration);

    oscillator2.type = 'sawtooth';
    oscillator2.frequency.setValueAtTime(200, now);
    oscillator2.frequency.exponentialRampToValueAtTime(800, now + duration);

    gainNode1.gain.setValueAtTime(0, now);
    gainNode1.gain.linearRampToValueAtTime(this.volume * 0.2, now + 0.1);
    gainNode1.gain.exponentialRampToValueAtTime(0.001, now + duration);

    gainNode2.gain.setValueAtTime(0, now);
    gainNode2.gain.linearRampToValueAtTime(this.volume * 0.15, now + 0.05);
    gainNode2.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator1.connect(gainNode1);
    gainNode1.connect(this.audioContext.destination);

    oscillator2.connect(gainNode2);
    gainNode2.connect(this.audioContext.destination);

    oscillator1.start(now);
    oscillator2.start(now);
    oscillator1.stop(now + duration);
    oscillator2.stop(now + duration);
  }

  private playDefaultChargeStart(now: number, duration: number): void {
    if (!this.audioContext) return;

    // Default charge start sound
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.exponentialRampToValueAtTime(800, now + duration);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, now + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  playChargeLoop(weaponType?: string): void {
    if (!this.audioContext || this.isChargeLoopPlaying) return;

    this.isChargeLoopPlaying = true;
    const now = this.audioContext.currentTime;

    switch (weaponType) {
      case 'plasmaBeam':
        this.createPlasmaChargeLoop(now);
        break;
      case 'laserCannon':
        this.createLaserChargeLoop(now);
        break;
      case 'railgun':
        this.createRailgunChargeLoop(now);
        break;
      default:
        this.createDefaultChargeLoop(now);
        break;
    }
  }

  private createPlasmaChargeLoop(now: number): void {
    if (!this.audioContext) return;

    // Unstable plasma energy loop with chaotic frequency modulation
    this.chargeLoopOscillator = this.audioContext.createOscillator();
    this.chargeLoopGain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();

    this.chargeLoopOscillator.type = 'sawtooth';
    this.chargeLoopOscillator.frequency.setValueAtTime(250, now);

    // Chaotic modulation for plasma instability
    lfo.type = 'triangle';
    lfo.frequency.setValueAtTime(8, now);
    lfoGain.gain.setValueAtTime(50, now);

    lfo.connect(lfoGain);
    lfoGain.connect(this.chargeLoopOscillator.frequency);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    filter.Q.setValueAtTime(4, now);

    this.chargeLoopGain.gain.setValueAtTime(0, now);
    this.chargeLoopGain.gain.linearRampToValueAtTime(this.volume * 0.2, now + 0.2);

    this.chargeLoopOscillator.connect(filter);
    filter.connect(this.chargeLoopGain);
    this.chargeLoopGain.connect(this.audioContext.destination);

    this.chargeLoopOscillator.start(now);
    lfo.start(now);
  }

  private createLaserChargeLoop(now: number): void {
    if (!this.audioContext) return;

    // Precise, focused laser charging loop
    this.chargeLoopOscillator = this.audioContext.createOscillator();
    this.chargeLoopGain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    this.chargeLoopOscillator.type = 'sine';
    this.chargeLoopOscillator.frequency.setValueAtTime(800, now);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(600, now);
    filter.Q.setValueAtTime(2, now);

    this.chargeLoopGain.gain.setValueAtTime(0, now);
    this.chargeLoopGain.gain.linearRampToValueAtTime(this.volume * 0.25, now + 0.2);

    this.chargeLoopOscillator.connect(filter);
    filter.connect(this.chargeLoopGain);
    this.chargeLoopGain.connect(this.audioContext.destination);

    this.chargeLoopOscillator.start(now);

    // Smooth frequency rise for laser focusing
    const modulateFreq = () => {
      if (!this.isChargeLoopPlaying || !this.chargeLoopOscillator || !this.audioContext) return;
      
      const currentTime = this.audioContext.currentTime;
      const targetFreq = 800 + (currentTime - now) * 100;
      
      this.chargeLoopOscillator.frequency.setValueAtTime(Math.min(targetFreq, 1400), currentTime);
      setTimeout(modulateFreq, 100);
    };
    
    modulateFreq();
  }

  private createRailgunChargeLoop(now: number): void {
    if (!this.audioContext) return;

    // Electric buildup loop with crackling effects
    this.chargeLoopOscillator = this.audioContext.createOscillator();
    this.chargeLoopGain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    const noiseOsc = this.audioContext.createOscillator();
    const noiseGain = this.audioContext.createGain();

    this.chargeLoopOscillator.type = 'square';
    this.chargeLoopOscillator.frequency.setValueAtTime(150, now);

    // Add electrical noise/crackling
    noiseOsc.type = 'sawtooth';
    noiseOsc.frequency.setValueAtTime(50, now);
    noiseGain.gain.setValueAtTime(this.volume * 0.1, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(3, now);

    this.chargeLoopGain.gain.setValueAtTime(0, now);
    this.chargeLoopGain.gain.linearRampToValueAtTime(this.volume * 0.3, now + 0.2);

    this.chargeLoopOscillator.connect(filter);
    filter.connect(this.chargeLoopGain);
    this.chargeLoopGain.connect(this.audioContext.destination);

    noiseOsc.connect(noiseGain);
    noiseGain.connect(this.audioContext.destination);

    this.chargeLoopOscillator.start(now);
    noiseOsc.start(now);

    // Electric buildup modulation
    const modulateElectric = () => {
      if (!this.isChargeLoopPlaying || !this.chargeLoopOscillator || !this.audioContext) return;
      
      const currentTime = this.audioContext.currentTime;
      const intensity = (currentTime - now) * 200;
      const baseFreq = 150 + intensity;
      
      this.chargeLoopOscillator.frequency.setValueAtTime(Math.min(baseFreq, 800), currentTime);
      setTimeout(modulateElectric, 50);
    };
    
    modulateElectric();
  }

  private createDefaultChargeLoop(now: number): void {
    if (!this.audioContext) return;

    // Default charge loop
    this.chargeLoopOscillator = this.audioContext.createOscillator();
    this.chargeLoopGain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    this.chargeLoopOscillator.type = 'sawtooth';
    this.chargeLoopOscillator.frequency.setValueAtTime(200, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.Q.setValueAtTime(2, now);

    this.chargeLoopGain.gain.setValueAtTime(0, now);
    this.chargeLoopGain.gain.linearRampToValueAtTime(this.volume * 0.25, now + 0.2);

    this.chargeLoopOscillator.connect(filter);
    filter.connect(this.chargeLoopGain);
    this.chargeLoopGain.connect(this.audioContext.destination);

    this.chargeLoopOscillator.start(now);

    // Default frequency modulation
    const modulateFreq = () => {
      if (!this.isChargeLoopPlaying || !this.chargeLoopOscillator || !this.audioContext) return;
      
      const currentTime = this.audioContext.currentTime;
      const freq = 200 + Math.sin(currentTime * 8) * 100 + (currentTime - now) * 50;
      
      this.chargeLoopOscillator.frequency.setValueAtTime(Math.min(freq, 1200), currentTime);
      setTimeout(modulateFreq, 50);
    };
    
    modulateFreq();
  }

  stopChargeLoop(): void {
    if (!this.audioContext || !this.isChargeLoopPlaying) return;

    this.isChargeLoopPlaying = false;
    const now = this.audioContext.currentTime;

    if (this.chargeLoopGain) {
      this.chargeLoopGain.gain.linearRampToValueAtTime(0, now + 0.1);
    }

    if (this.chargeLoopOscillator) {
      this.chargeLoopOscillator.stop(now + 0.1);
      this.chargeLoopOscillator = null;
    }

    this.chargeLoopGain = null;
  }

  playChargeComplete(weaponType?: string): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const duration = 0.4;

    switch (weaponType) {
      case 'plasmaBeam':
        this.playPlasmaChargeComplete(now, duration);
        break;
      case 'laserCannon':
        this.playLaserChargeComplete(now, duration);
        break;
      case 'railgun':
        this.playRailgunChargeComplete(now, duration);
        break;
      default:
        this.playDefaultChargeComplete(now, duration);
        break;
    }
  }

  private playPlasmaChargeComplete(now: number, duration: number): void {
    if (!this.audioContext) return;

    // Unstable plasma ready sound with chaotic harmonics
    for (let i = 0; i < 4; i++) {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();

      oscillator.type = i % 2 === 0 ? 'sawtooth' : 'triangle';
      const baseFreq = 600 + (i * 200) + Math.random() * 100;
      oscillator.frequency.setValueAtTime(baseFreq, now);
      oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, now + 0.1);
      oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + duration);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800 + i * 200, now);
      filter.Q.setValueAtTime(3, now);

      const volume = this.volume * (0.15 - i * 0.03);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start(now + i * 0.02);
      oscillator.stop(now + duration);
    }
  }

  private playLaserChargeComplete(now: number, duration: number): void {
    if (!this.audioContext) return;

    // Pure, crystalline laser ready sound
    for (let i = 0; i < 3; i++) {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();

      oscillator.type = 'sine';
      const baseFreq = 1000 + (i * 500);
      oscillator.frequency.setValueAtTime(baseFreq, now);
      oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, now + 0.1);
      oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, now + duration);

      filter.type = 'highpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(1, now);

      const volume = this.volume * (0.2 - i * 0.05);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start(now + i * 0.03);
      oscillator.stop(now + duration);
    }
  }

  private playRailgunChargeComplete(now: number, duration: number): void {
    if (!this.audioContext) return;

    // Electric discharge ready sound
    for (let i = 0; i < 5; i++) {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = i < 3 ? 'square' : 'sawtooth';
      const baseFreq = 400 + (i * 300);
      oscillator.frequency.setValueAtTime(baseFreq, now);
      oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, now + 0.08);
      oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + duration);

      const volume = this.volume * (0.18 - i * 0.02);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start(now + i * 0.015);
      oscillator.stop(now + duration);
    }
  }

  private playDefaultChargeComplete(now: number, duration: number): void {
    if (!this.audioContext) return;

    // Default multi-layered completion sound
    for (let i = 0; i < 3; i++) {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = i === 0 ? 'sine' : i === 1 ? 'triangle' : 'square';
      const baseFreq = 800 + (i * 400);
      oscillator.frequency.setValueAtTime(baseFreq, now);
      oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.1);
      oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, now + duration);

      const volume = this.volume * (0.2 - i * 0.05);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start(now + i * 0.02);
      oscillator.stop(now + duration);
    }
  }

  playChargedShot(weaponType?: string): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const duration = 0.6;

    switch (weaponType) {
      case 'plasmaBeam':
        this.playPlasmaChargedShot(now, duration);
        break;
      case 'laserCannon':
        this.playLaserChargedShot(now, duration);
        break;
      case 'railgun':
        this.playRailgunChargedShot(now, duration);
        break;
      default:
        this.playDefaultChargedShot(now, duration);
        break;
    }
  }

  private playPlasmaChargedShot(now: number, duration: number): void {
    if (!this.audioContext) return;

    // Chaotic plasma discharge with unstable harmonics
    const oscillator1 = this.audioContext.createOscillator();
    const oscillator2 = this.audioContext.createOscillator();
    const noise = this.audioContext.createOscillator();
    
    const gainNode1 = this.audioContext.createGain();
    const gainNode2 = this.audioContext.createGain();
    const noiseGain = this.audioContext.createGain();
    
    const filter1 = this.audioContext.createBiquadFilter();
    const filter2 = this.audioContext.createBiquadFilter();

    // Main plasma beam
    oscillator1.type = 'sawtooth';
    oscillator1.frequency.setValueAtTime(600, now);
    oscillator1.frequency.exponentialRampToValueAtTime(150, now + duration);

    // Unstable harmonic layer
    oscillator2.type = 'triangle';
    oscillator2.frequency.setValueAtTime(1200, now);
    oscillator2.frequency.exponentialRampToValueAtTime(300, now + duration);

    // Plasma crackling noise
    noise.type = 'sawtooth';
    noise.frequency.setValueAtTime(200, now);

    filter1.type = 'bandpass';
    filter1.frequency.setValueAtTime(800, now);
    filter1.frequency.exponentialRampToValueAtTime(200, now + duration);
    filter1.Q.setValueAtTime(4, now);

    filter2.type = 'lowpass';
    filter2.frequency.setValueAtTime(1500, now);
    filter2.Q.setValueAtTime(2, now);

    gainNode1.gain.setValueAtTime(this.volume * 0.35, now);
    gainNode1.gain.exponentialRampToValueAtTime(0.001, now + duration);

    gainNode2.gain.setValueAtTime(this.volume * 0.2, now);
    gainNode2.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.8);

    noiseGain.gain.setValueAtTime(this.volume * 0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    oscillator1.connect(filter1);
    filter1.connect(gainNode1);
    gainNode1.connect(this.audioContext.destination);

    oscillator2.connect(filter2);
    filter2.connect(gainNode2);
    gainNode2.connect(this.audioContext.destination);

    noise.connect(noiseGain);
    noiseGain.connect(this.audioContext.destination);

    oscillator1.start(now);
    oscillator2.start(now);
    noise.start(now);
    
    oscillator1.stop(now + duration);
    oscillator2.stop(now + duration);
    noise.stop(now + 0.2);
  }

  private playLaserChargedShot(now: number, duration: number): void {
    if (!this.audioContext) return;

    // Focused, intense laser beam
    const oscillator1 = this.audioContext.createOscillator();
    const oscillator2 = this.audioContext.createOscillator();
    
    const gainNode1 = this.audioContext.createGain();
    const gainNode2 = this.audioContext.createGain();
    
    const filter1 = this.audioContext.createBiquadFilter();
    const filter2 = this.audioContext.createBiquadFilter();

    // Main laser beam
    oscillator1.type = 'sine';
    oscillator1.frequency.setValueAtTime(1200, now);
    oscillator1.frequency.exponentialRampToValueAtTime(400, now + duration);

    // Focused harmonic
    oscillator2.type = 'triangle';
    oscillator2.frequency.setValueAtTime(2400, now);
    oscillator2.frequency.exponentialRampToValueAtTime(800, now + duration);

    filter1.type = 'highpass';
    filter1.frequency.setValueAtTime(600, now);
    filter1.Q.setValueAtTime(1, now);

    filter2.type = 'bandpass';
    filter2.frequency.setValueAtTime(1500, now);
    filter2.frequency.exponentialRampToValueAtTime(600, now + duration);
    filter2.Q.setValueAtTime(2, now);

    gainNode1.gain.setValueAtTime(this.volume * 0.4, now);
    gainNode1.gain.exponentialRampToValueAtTime(0.001, now + duration);

    gainNode2.gain.setValueAtTime(this.volume * 0.25, now);
    gainNode2.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.7);

    oscillator1.connect(filter1);
    filter1.connect(gainNode1);
    gainNode1.connect(this.audioContext.destination);

    oscillator2.connect(filter2);
    filter2.connect(gainNode2);
    gainNode2.connect(this.audioContext.destination);

    oscillator1.start(now);
    oscillator2.start(now);
    
    oscillator1.stop(now + duration);
    oscillator2.stop(now + duration);
  }

  private playRailgunChargedShot(now: number, duration: number): void {
    if (!this.audioContext) return;

    // Massive electric discharge
    const oscillator1 = this.audioContext.createOscillator();
    const oscillator2 = this.audioContext.createOscillator();
    const oscillator3 = this.audioContext.createOscillator();
    
    const gainNode1 = this.audioContext.createGain();
    const gainNode2 = this.audioContext.createGain();
    const gainNode3 = this.audioContext.createGain();
    
    const filter1 = this.audioContext.createBiquadFilter();

    // Main electric blast
    oscillator1.type = 'square';
    oscillator1.frequency.setValueAtTime(300, now);
    oscillator1.frequency.exponentialRampToValueAtTime(50, now + duration);

    // Electric harmonic
    oscillator2.type = 'sawtooth';
    oscillator2.frequency.setValueAtTime(600, now);
    oscillator2.frequency.exponentialRampToValueAtTime(100, now + duration);

    // High frequency crackle
    oscillator3.type = 'square';
    oscillator3.frequency.setValueAtTime(1500, now);
    oscillator3.frequency.exponentialRampToValueAtTime(200, now + duration * 0.3);

    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(2000, now);
    filter1.frequency.exponentialRampToValueAtTime(300, now + duration);
    filter1.Q.setValueAtTime(3, now);

    gainNode1.gain.setValueAtTime(this.volume * 0.5, now);
    gainNode1.gain.exponentialRampToValueAtTime(0.001, now + duration);

    gainNode2.gain.setValueAtTime(this.volume * 0.3, now);
    gainNode2.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.8);

    gainNode3.gain.setValueAtTime(this.volume * 0.2, now);
    gainNode3.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.3);

    oscillator1.connect(filter1);
    filter1.connect(gainNode1);
    gainNode1.connect(this.audioContext.destination);

    oscillator2.connect(gainNode2);
    gainNode2.connect(this.audioContext.destination);

    oscillator3.connect(gainNode3);
    gainNode3.connect(this.audioContext.destination);

    oscillator1.start(now);
    oscillator2.start(now);
    oscillator3.start(now);
    
    oscillator1.stop(now + duration);
    oscillator2.stop(now + duration);
    oscillator3.stop(now + duration * 0.3);
  }

  private playDefaultChargedShot(now: number, duration: number): void {
    if (!this.audioContext) return;

    // Default charged shot sound
    const oscillator1 = this.audioContext.createOscillator();
    const oscillator2 = this.audioContext.createOscillator();
    const noise = this.audioContext.createOscillator();
    
    const gainNode1 = this.audioContext.createGain();
    const gainNode2 = this.audioContext.createGain();
    const noiseGain = this.audioContext.createGain();
    
    const filter1 = this.audioContext.createBiquadFilter();
    const filter2 = this.audioContext.createBiquadFilter();

    oscillator1.type = 'sawtooth';
    oscillator1.frequency.setValueAtTime(800, now);
    oscillator1.frequency.exponentialRampToValueAtTime(200, now + duration);

    oscillator2.type = 'square';
    oscillator2.frequency.setValueAtTime(1600, now);
    oscillator2.frequency.exponentialRampToValueAtTime(400, now + duration);

    noise.type = 'sawtooth';
    noise.frequency.setValueAtTime(100, now);

    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(2000, now);
    filter1.frequency.exponentialRampToValueAtTime(500, now + duration);

    filter2.type = 'bandpass';
    filter2.frequency.setValueAtTime(1000, now);
    filter2.Q.setValueAtTime(3, now);

    gainNode1.gain.setValueAtTime(this.volume * 0.4, now);
    gainNode1.gain.exponentialRampToValueAtTime(0.001, now + duration);

    gainNode2.gain.setValueAtTime(this.volume * 0.2, now);
    gainNode2.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.7);

    noiseGain.gain.setValueAtTime(this.volume * 0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    oscillator1.connect(filter1);
    filter1.connect(gainNode1);
    gainNode1.connect(this.audioContext.destination);

    oscillator2.connect(filter2);
    filter2.connect(gainNode2);
    gainNode2.connect(this.audioContext.destination);

    noise.connect(noiseGain);
    noiseGain.connect(this.audioContext.destination);

    oscillator1.start(now);
    oscillator2.start(now);
    noise.start(now);
    
    oscillator1.stop(now + duration);
    oscillator2.stop(now + duration);
    noise.stop(now + 0.1);
  }

  playChargeDecay(weaponType?: string): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const duration = 0.4;

    // Create a subtle downward sweep to indicate charge loss
    const oscillator1 = this.audioContext.createOscillator();
    const oscillator2 = this.audioContext.createOscillator();
    
    const gainNode1 = this.audioContext.createGain();
    const gainNode2 = this.audioContext.createGain();
    
    const filter = this.audioContext.createBiquadFilter();

    // Main decay tone - downward sweep
    oscillator1.type = 'sine';
    oscillator1.frequency.setValueAtTime(400, now);
    oscillator1.frequency.exponentialRampToValueAtTime(150, now + duration);

    // Harmonic layer for texture
    oscillator2.type = 'triangle';
    oscillator2.frequency.setValueAtTime(200, now);
    oscillator2.frequency.exponentialRampToValueAtTime(75, now + duration);

    // Low-pass filter for muffled effect
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + duration);

    // Gentle volume envelope for subtle feedback
    gainNode1.gain.setValueAtTime(this.volume * 0.15, now);
    gainNode1.gain.exponentialRampToValueAtTime(0.001, now + duration);

    gainNode2.gain.setValueAtTime(this.volume * 0.08, now);
    gainNode2.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Connect audio graph
    oscillator1.connect(filter);
    filter.connect(gainNode1);
    gainNode1.connect(this.audioContext.destination);

    oscillator2.connect(gainNode2);
    gainNode2.connect(this.audioContext.destination);

    // Play the decay sound
    oscillator1.start(now);
    oscillator2.start(now);
    
    oscillator1.stop(now + duration);
    oscillator2.stop(now + duration);
  }
}

// Singleton instance
let audioSystem: AudioSystem | null = null;

export function getAudioSystem(): AudioSystem {
  if (!audioSystem) {
    audioSystem = new WebAudioSystem();
  }
  return audioSystem;
}

// Initialize audio on first user interaction
let audioInitialized = false;

export async function initializeAudio(): Promise<void> {
  if (audioInitialized) return;
  
  try {
    await getAudioSystem().init();
    audioInitialized = true;
  } catch (error) {
    console.warn('Failed to initialize audio:', error);
  }
}

// Auto-initialize on user interaction
if (typeof window !== 'undefined') {
  const initOnInteraction = () => {
    initializeAudio();
    // Remove listeners after first interaction
    window.removeEventListener('click', initOnInteraction);
    window.removeEventListener('keydown', initOnInteraction);
    window.removeEventListener('touchstart', initOnInteraction);
  };

  window.addEventListener('click', initOnInteraction);
  window.addEventListener('keydown', initOnInteraction);
  window.addEventListener('touchstart', initOnInteraction);
}