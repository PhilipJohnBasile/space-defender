# Space Defender - Product Requirements Document

## Core Purpose & Success
- **Mission Statement**: Create an engaging retro-style arcade space shooter with arcade, campaign, and infinite exploration modes that delivers classic gaming thrills with modern progression mechanics, procedural content, and extensive weapon customization
- **Success Indicators**: Player engagement through progressive difficulty, mission completion, ship upgrades, weapon mastery, procedural exploration, and high score pursuit
- **Experience Qualities**: Fast-paced, nostalgic, empowering, strategic, customizable, explorative

## Project Classification & Approach
- **Complexity Level**: Complex Application (advanced functionality with persistent progression, story missions, procedural generation, and advanced weapon systems)
- **Primary User Activity**: Interactive gaming with real-time action, strategic decision-making, weapon customization, campaign progression, and infinite exploration

## Essential Features

### Game Modes
- **Arcade Mode**: Classic endless survival with waves of enemies and boss encounters
- **Campaign Mode**: Story-driven missions with specific objectives and progression
- **Exploration Mode**: NEW - Infinite procedurally generated space sectors with random events, resources, and hazards
- **Mode Selection**: Clear menu interface for choosing between arcade, campaign, and exploration experiences

### Procedural Space Exploration System (NEW)
- **Infinite Sectors**: Procedurally generated space regions with unique characteristics
- **Sector Types**: 10 distinct sector types (empty, asteroid, nebula, debris, patrol, trading, research, pirate, ancient, unstable)
- **Random Events**: Dynamic encounters including merchants, derelicts, anomalies, ambushes, and discoveries
- **Space Hazards**: Environmental challenges like radiation storms, gravity wells, and energy fields
- **Resource Collection**: Gather minerals, energy, technology, and salvage from different sectors
- **Space Anomalies**: Mysterious phenomena with beneficial, neutral, or harmful effects
- **Sector Map Interface**: Interactive galaxy map showing discovered sectors and travel options
- **Event Dialog System**: Choice-driven encounters with consequences and rewards
- **Sector Progression**: Difficulty and hostility increase with distance from starting point

### Interactive Space Events (NEW)
- **Event Types**: 12 different encounter types (discovery, merchant, ambush, derelict, etc.)
- **Choice Consequences**: Player decisions affect outcomes with success/failure chances
- **Dynamic Storytelling**: Procedurally generated narrative events based on sector type and player status
- **Risk vs Reward**: Meaningful decisions with potential benefits and dangers
- **Resource Trading**: Opportunities to exchange resources and upgrade equipment

### Advanced Weapon System (ENHANCED)
- **10 Unique Weapon Types**: From basic blasters to fusion torpedoes
  - **Tier 1**: Basic Blaster (starter weapon)
  - **Tier 2**: Laser Cannon (piercing), Chain Gun (ricocheting), Plasma Shotgun (spreading)
  - **Tier 3**: Plasma Beam (explosive), Homing Missiles (tracking), Ion Cannon (disruptive)
  - **Tier 4**: Railgun (chargeable), Quantum Rifle (phase-shifting)
  - **Tier 5**: Fusion Torpedo (massive area damage)
- **Weapon Upgrade System**: 5-level progression for each weapon with increased damage, reduced cooldown
- **Special Abilities**: Each weapon has unique mechanics (piercing, homing, charging, etc.)
- **Weapon Slots**: Multiple weapon loadouts with quick switching (Q/E keys)
- **Energy Management**: Weapons consume energy that regenerates over time
- **Heat System**: Weapons generate heat and can overheat, requiring strategic usage
- **Weapon-Specific Charging**: NEW - Unique charge animations and sound effects for different weapon types
- **Tactical Charge Decay System**: NEW - Charged weapons lose power over time for strategic timing gameplay
  - **Decay Mechanics**: Charge level decreases at 20% per second after 1.5s delay when not actively charging
  - **Visual Feedback**: UI shows decay state with dimmed colors and "DECAYING" indicator
  - **Audio Feedback**: Subtle decay sound when charge fully dissipates
  - **Strategic Timing**: Players must balance charge buildup with optimal firing timing
  - **Risk vs Reward**: Higher charge levels provide more damage but risk losing charge if not used quickly
- **Charge-Based Ship Skins**: NEW - Dynamic ship visual modifications based on weapon type and charge level
  - Ship hull color changes and glow effects based on equipped weapon
  - Progressive visual enhancements from charge level 1-4
  - Weapon-specific hull modifications (plasma channels, laser guides, electromagnetic fields)
  - Wing-mounted charge indicators and energy vent systems
  - Enhanced weapon tip effects and charging progress indicators
  - **Plasma Beam**: Unstable purple energy with swirling particle effects and chaotic audio
  - **Laser Cannon**: Precise blue focusing rings with geometric patterns and crystalline sounds
  - **Railgun**: Electric yellow arcs with lightning effects and crackling electrical audio
- **Weapon Purchasing**: Unlock new weapons with credits earned in campaign mode
- **Weapon Selection Interface**: Comprehensive arsenal management with stats and comparisons

### Campaign System
- **Story Missions**: 6 handcrafted missions with unique objectives and narratives
- **Mission Structure**: Each mission includes briefing, objectives, enemy waves, and rewards
- **Progression System**: Experience points, credits, and weapon unlocks through mission completion
- **Mission Types**: 
  - Tutorial missions for learning game mechanics
  - Survival missions with time-based objectives
  - Boss encounters with unique enemy ships
  - Combat missions with enemy elimination goals
- **Mission Briefings**: Immersive story context and objective explanations
- **Mission Completion**: Performance scoring with completion status and rewards

### Campaign Progression (NEW)
- **Player Leveling**: Experience-based progression with unlockable content
- **Ship Upgrades**: Purchasable improvements using earned credits
  - Armor upgrades for increased durability
  - Speed upgrades for enhanced maneuverability
  - Weapon upgrades for improved firepower
  - Shielding upgrades for energy protection
  - **Charge Preservation upgrades**: NEW - Reduces weapon charge decay speed for tactical advantage
    - Each level reduces decay rate by 15% (cumulative)
    - Level 5 provides 55% slower charge decay
    - Enables holding charged shots for extended periods
    - Tactical gameplay enhancement for strategic timing
- **Weapon Unlocking**: Sequential weapon access through mission completion
- **Save System**: Persistent campaign progress using KV storage
- **Mission Replay**: Ability to retry missions for better scores

### Mission Objectives System (NEW)
- **Objective Types**: Destroy enemies, survive time, collect power-ups, defeat bosses
- **Required vs Bonus**: Essential objectives vs optional challenges for extra rewards
- **Real-time Tracking**: Live progress display during missions
- **Performance Metrics**: Completion time, objectives achieved, and scoring

### Core Gameplay
- **Player Movement**: Smooth WASD/arrow key controls for ship navigation
- **Combat System**: Space bar shooting with collision detection
- **Enemy Waves**: Progressive spawning with increasing difficulty
- **Scoring System**: Points awarded for destroyed enemies with high score persistence

### Power-up System
- **Rapid Fire**: Increases shooting speed for faster enemy elimination
- **Shield**: Temporary protection from enemy collisions
- **Multi-shot**: Fires multiple projectiles simultaneously for area coverage
- **Weapon Upgrades**: Advanced weapons with unique characteristics and abilities
- **Visual Indicators**: Real-time power-up status display with countdown timers
- **Collection Mechanics**: Power-ups spawn randomly and fade if not collected

### Weapon Upgrade System (ENHANCED)
- **Basic Blaster**: Standard energy weapon with reliable damage output
- **Laser Cannon**: High-velocity piercing beam that cuts through multiple enemies
- **Plasma Beam**: Explosive plasma projectiles with area damage effects
- **Homing Missiles**: Smart missiles that lock onto and track enemy targets
- **Weapon Levels**: Each weapon can be upgraded up to level 3 for increased damage
- **Special Abilities**: Each weapon features unique mechanics (piercing, explosive, tracking)
- **Visual Effects**: Distinct projectile designs with particle trails and lighting
- **Sound Design**: Weapon-specific audio feedback for each firing type
- **Strategic Depth**: Players must choose between different weapon types based on situation

### Weapon Charging & Overheating System (ENHANCED)
- **Balanced Firing Rate**: Fixed initial rapid-fire issue with proper cooldown implementation
  - Base weapon cooldown: 150ms for strategic pacing vs button mashing
  - Rapid Fire power-up: Reduces cooldown to 75ms (50% reduction) with 50ms minimum
  - Cooldown checking now properly implemented to prevent instant-fire exploits
- **Charging Mechanics**: Hold C key to charge weapons for enhanced damage (up to 2.5x multiplier)
- **Heat Management**: Each shot generates heat; weapons overheat at 100% heat level
- **Overheating Penalties**: 2-second cooldown period when weapons overheat completely
- **Heat Dissipation**: Weapons cool down automatically when not firing or charging
- **Weapon-Specific Heat**: Different weapons generate varying amounts of heat per shot
- **Visual Feedback**: Charging rings and heat indicators around player ship
- **Strategic Gameplay**: Players must balance offense with heat management
- **UI Integration**: Real-time heat and charge level displays in weapon status panel
- **Fully Charged Benefits**: 75%+ charge triggers special visual effects and damage bonus
- **Tactical Decision Making**: Choose between rapid fire vs. charged shots based on situation

### Boss Enemy System (ENHANCED - 6 UNIQUE TYPES)
- **Diverse Boss Fleet**: Six distinct boss types with unique characteristics and behaviors
  - **Destroyer Class**: Aggressive red hexagonal design with standard triple-shot pattern
  - **Interceptor Class**: Fast blue triangular ship with diving movement and rapid-fire bursts
  - **Titan Class**: Massive purple fortress with shield regeneration and wide spread attacks
  - **Phantom Class**: Ethereal green ship with teleportation and ethereal homing projectiles
  - **Vortex Class**: Cyan energy being with spiral movement and continuous laser barrages
  - **Guardian Class**: Giant orange octagonal defender with self-healing and defensive positioning
- **Advanced Movement Systems**: Eight distinct movement patterns beyond basic zigzag
  - Diving, teleporting, spiraling, weaving, fortress positioning, and energy-based motion
- **Special Boss Abilities**: Each boss type features unique supernatural powers
  - Shield regeneration (Titan), teleportation (Phantom), rapid-fire modes (Interceptor)
  - Self-healing capabilities (Guardian), energy manipulation (Vortex)
- **Adaptive Shooting Patterns**: Six different attack types for strategic variety
  - Triple shots, spread patterns, burst fire, homing projectiles, laser beams, defensive volleys
- **Visual Distinction**: Each boss has unique colors, shapes, and special effects
  - Type-specific glow colors, particle effects, and shape designs
- **Dynamic Difficulty Scaling**: Boss characteristics adapt based on game progression
  - Health ranges from 35-100 HP, points from 1000-2500, size variations for tactical differences
- **Shield Defense Systems**: Advanced bosses feature energy shields that absorb damage
  - Shields regenerate over time and provide temporary invulnerability
- **Enhanced Boss Introductions**: Threat warnings now display specific boss class information

#### Boss Intro Animations (NEW)
- **Dramatic Entrance**: Bosses enter with cinematic intro sequence
- **Warning System**: Screen overlay with threat level warnings and flashing alerts
- **Smooth Scaling**: Boss ships start oversized and settle into position
- **Oscillation Effect**: Horizontal movement during entrance for menacing presence
- **Game Pause**: Player input disabled during 3-second intro sequence
- **Status Indicators**: UI shows "WARNING: BOSS INCOMING" during animation

#### Boss Defeat Sequences (NEW)
- **Explosive Effects**: Screen flashing and particle-like explosion visuals
- **Defeat Animation**: Boss shaking, scaling, and pulsating before destruction
- **Victory Overlay**: "DESTROYER ELIMINATED" message with score bonus display
- **Smooth Transitions**: 2.5-second defeat sequence before returning to gameplay
- **Score Calculation**: Bonus points awarded after animation completes
- **Mission Continuity**: Clear indication that the mission proceeds after victory

### Particle Explosion System (NEW)
- **Enemy Destruction Effects**: Colorful particle explosions when enemies are destroyed
- **Multi-type Particles**: Four distinct particle types for visual variety
  - **Explosion Particles**: Bright orange/yellow circular bursts that fade outward
  - **Spark Particles**: Linear cyan streaks that travel in direction of movement
  - **Debris Particles**: Gray angular pieces that tumble with gravity effects
  - **Trail Particles**: Ship engine trails that provide enhanced visual feedback
- **Scaled Effects**: Larger enemies create more and bigger particles
- **Boss Explosions**: Massive 25-particle bursts when boss enemies are defeated
- **Continuous Boss Effects**: Additional particle bursts during boss defeat animation
- **Splash Damage Particles**: Smaller explosion effects for secondary enemy kills
- **Physics Simulation**: Particles have velocity, gravity, drag, and rotation
- **Performance Optimized**: Particles automatically clean up after 800-1200ms lifespan
- **Always Active**: Particle animations continue even when game is paused for smooth visuals

### Player Ship Visual Enhancement (NEW)
- **Engine Trail Particles**: Continuous particle trail behind player ship for enhanced feedback
- **Dynamic Trail Effects**: Trail particles change color and intensity based on active power-ups
- **Power-up Visual Feedback**: 
  - Standard blue/cyan trail during normal operation
  - Enhanced golden/orange trail when power-ups are active
  - Increased particle count (3 vs 2) when power-ups are active
- **Smooth Trail Animation**: Particles fade naturally over 300-500ms for smooth visual flow
- **Performance Optimized**: Trail particles have shorter lifespan than explosion particles
- **Always Rendering**: Trail particles generated continuously during gameplay for responsive feel

### Screen Shake Effects (NEW)
- **Impact Feedback**: Camera shake effects provide tactile feedback for major game events
- **Intensity Tiers**: 
  - Basic enemy destruction: Light shake (3px intensity, 200ms duration)
  - Boss destruction: Intense shake (8px intensity, 800ms duration)
  - Player hit: Medium shake (5px intensity, 400ms duration)
- **Natural Physics**: Shake effects use random offset generation with smooth decay
- **Non-Intrusive**: Shake effects enhance immersion without interfering with gameplay visibility
- **Canvas Translation**: Screen shake implemented via canvas context transformation for smooth performance
- **Simultaneous Rendering**: Shake effects work alongside all other visual elements (particles, stars, etc.)

### Background Parallax System (NEW)
- **Multi-layer Starfield**: Three distinct layers of stars moving at different speeds
- **Parallax Scrolling**: Background stars move slower than foreground for depth
- **Twinkling Animation**: Stars pulse and twinkle with varying brightness
- **Nebula Clouds**: Subtle background nebula formations that drift slowly
- **Continuous Motion**: Starfield animation continues even during pause for ambiance

### Audio System (NEW)

#### Background Music
- **Atmospheric Space Music**: Layered ambient electronic soundscape for immersion
- **Multi-layer Composition**: Deep bass drones, mid-range harmonies, and ethereal high notes
- **Procedural Generation**: Web Audio API synthesis with subtle frequency modulation
- **Dynamic Mixing**: Smooth 3-second fade-in when starting, 2-second fade-out when ending
- **Continuous Playback**: Loops seamlessly throughout gameplay sessions

#### Ambient Space Sounds
- **Random Space Atmosphere**: Procedurally generated cosmic wind and distant hums
- **Frequency Variation**: Random pitch and filter modulation for organic feel
- **Scheduled Events**: Ambient sounds trigger every 3-10 seconds for natural spacing
- **Layered Environment**: Continuous subtle wind combined with intermittent space sounds
- **Immersive Design**: Low-pass filtering and careful volume levels to support focus

#### Sound Effects Enhancement
- **Expanded Effect Library**: Boss intros, explosions, enemy hits, shooting, power-ups
- **Boss Audio**: Dramatic rumbling intro sounds and triumphant defeat fanfares
- **Procedural Generation**: Real-time audio synthesis for consistent, lightweight sounds
- **Volume Management**: Separate volume controls for effects, music, and ambient sounds

#### Audio Controls
- **Advanced Volume Panel**: Expandable audio settings with individual level controls
- **Three-tier Volume System**: 
  - Effects: Combat sounds and interactions (default 30%)
  - Music: Background music (default 15%)
  - Ambient: Space atmosphere (default 20%)
- **Visual Feedback**: Color-coded sliders and real-time percentage display
- **Persistent Settings**: Volume preferences saved across game sessions
- **Master Controls**: Quick mute/unmute functionality for all audio layers

#### Music Track System
- **Menu Music**: Welcoming, ambient C-major harmonies with gentle arpeggiation
- **Gameplay Music**: Tense A-minor progressions with rhythmic pulsing and bass movement  
- **Boss Battle Music**: Intense, dissonant D-minor chords with aggressive tremolo and percussive hits
- **Victory Music**: Triumphant C-major chord progressions with ascending celebratory melodies
- **Smart Transitions**: Automatic track switching based on game state with smooth fade transitions
- **Context-Aware**: Music adapts to boss introductions, defeats, and menu navigation

### User Interface & Navigation (ENHANCED)

#### Campaign Interface
- **Campaign Menu**: Mission selection with progress tracking and difficulty indicators
- **Mission Cards**: Visual mission representation with completion status and star ratings
- **Ship Upgrade Interface**: Credit-based upgrade system with visual component representation
- **Unlocked Weapons Display**: Visual showcase of available weapons with descriptions

#### Mission Interface
- **Mission Briefing Screen**: Story context, objectives breakdown, and reward preview
- **In-Game Objectives Tracker**: Real-time objective progress with completion indicators
- **Mission Timer**: Elapsed time display for performance tracking
- **Completion Screen**: Score breakdown, performance rating, and progression rewards

#### Enhanced Game UI
- **Dual Mode Support**: Adaptive interface for arcade vs campaign gameplay
- **Objective Progress Bars**: Visual progress tracking for mission-specific goals
- **Mission Context Display**: Current mission name and progress during campaign play
- **Campaign Progress Indicators**: Experience, level, and credits display

#### Dynamic Music Mixing (NEW)
- **Health-Based Tension**: Music becomes more tense and dissonant as player health decreases
- **Score-Based Intensity**: Higher scores trigger more energetic and layered musical elements
- **Real-time Adaptation**: Smooth 500ms transitions between intensity levels
- **Layered Effects**: Additional tension sounds and intensity layers added dynamically
- **Subtle Implementation**: Changes enhance immersion without being distracting
- **Multi-parameter System**: Independent control of intensity (score-driven) and tension (health-driven)
- **Procedural Elements**: Dynamic beat patterns and harmonic layers generated based on gameplay state

### Game States & Flow
- **Main Menu**: Title screen with high score display and instructions
- **Active Gameplay**: Real-time action with pause functionality
- **Game Over**: Score display with restart and menu options
- **Persistent Progress**: High score tracking across sessions

## Design Direction

### Visual Tone & Identity
- **Emotional Response**: Excitement, nostalgia, focus, empowerment through upgrades
- **Design Personality**: Retro-futuristic, clean, high-contrast
- **Visual Metaphors**: Classic arcade space combat with modern UI polish
- **Simplicity Spectrum**: Minimal interface that highlights the action

### Color Strategy
- **Color Scheme Type**: Analogous with accent highlights
- **Primary Color**: Cyan blue (oklch(0.7 0.2 200)) for player elements and UI
- **Secondary Colors**: Purple/magenta (oklch(0.6 0.25 320)) for enemies and danger
- **Accent Color**: Bright green (oklch(0.8 0.2 130)) for success states and power-ups
- **Power-up Colors**: 
  - Orange/yellow for rapid fire (speed/energy)
  - Blue for shield (protection/defense)  
  - Green for multi-shot (power/expansion)
- **Background**: Deep space blue (oklch(0.1 0.02 240)) for contrast

### Typography System
- **Font Pairing Strategy**: Single font family for consistency
- **Primary Font**: Orbitron - geometric, futuristic, high-tech aesthetic
- **Typography Hierarchy**: Large bold titles, medium stats, small UI text
- **Readability Focus**: High contrast white/cyan on dark backgrounds

### Visual Hierarchy & Layout
- **Attention Direction**: Central game canvas with supporting UI panels
- **Game Canvas**: 800x600px fixed size for consistent experience
- **UI Layout**: Score/stats on left, power-up status prominently displayed
- **Responsive Approach**: Flexible container with fixed game area

### Power-up Visual System
- **Distinct Icons**: Lightning bolt (rapid fire), shield shape, triple arrows (multi-shot)
- **Color Coding**: Consistent colors matching power-up types
- **Animation**: Pulsing glow effects for collectible power-ups
- **Status Display**: Real-time countdown timers with clear remaining duration
- **Player Feedback**: Visual ship modifications when power-ups are active

### Animations & Effects
- **Player Ship**: Engine glow effects, enhanced when rapid fire active
- **Shield Effect**: Rotating energy barrier around ship
- **Power-ups**: Floating animation with pulsing glow
- **Projectiles**: Glowing trails and impact effects
- **UI**: Smooth transitions and subtle pulse animations

## Implementation Considerations

### Technical Architecture
- **Game Engine**: Custom TypeScript engine with Canvas 2D rendering
- **State Management**: React hooks with persistent storage for high scores
- **Performance**: 60fps game loop with efficient collision detection
- **Power-up Logic**: Timer-based system with stacking prevention

### Game Balance
- **Power-up Spawn Rate**: Every 8 seconds for strategic collection timing
- **Duration Balance**: 
  - Rapid Fire: 10 seconds (high utility, medium duration)
  - Shield: 8 seconds (high protection, shorter duration)
  - Multi-shot: 10 seconds (high damage, medium duration)
- **Difficulty Scaling**: Enemy spawn rate increases with level progression

### User Experience
- **Learning Curve**: Immediate playability with power-up discovery
- **Feedback Systems**: Visual and timing cues for all game states
- **Accessibility**: Clear visual indicators and keyboard-only controls

## Power-up Enhancement Details

### Rapid Fire Power-up
- **Function**: Reduces shooting cooldown from 150ms to 50ms
- **Visual**: Orange engine glow, faster projectile stream
- **Strategy**: Ideal for clearing dense enemy formations

### Shield Power-up  
- **Function**: Absorbs enemy collision damage without losing lives
- **Visual**: Animated blue energy shield around ship
- **Strategy**: Allows aggressive positioning and risk-taking

### Multi-shot Power-up
- **Function**: Fires 3 projectiles in spread pattern instead of 1
- **Visual**: Green ship accents, wider projectile coverage
- **Strategy**: Increases hit probability and area damage

### Collection & Stacking
- **Pickup Mechanic**: Touch-based collection with immediate activation
- **Stacking Logic**: Multiple same-type power-ups extend duration
- **Priority System**: All power-ups can be active simultaneously

## Audio System (NEW)

### Sound Effects Library
- **Boss Intro**: Dramatic rumbling sound with rising pitch and layered harmonics
- **Boss Defeat**: Triumphant chord progression with explosive texture
- **Enemy Explosions**: Sharp noise burst with filtered decay for impact
- **Enemy Hits**: Quick strike sounds for boss damage feedback
- **Player Shooting**: Crisp laser shot sounds with frequency sweep
- **Power-up Collection**: Pleasant ascending arpeggio for positive reinforcement

### Audio Implementation
- **Web Audio API**: Real-time sound synthesis for consistent performance
- **Volume Control**: User-adjustable volume slider with mute functionality
- **Audio Initialization**: Automatic setup on first user interaction
- **Persistent Settings**: Volume preferences saved across sessions
- **Performance**: Non-blocking audio that won't impact gameplay

### Audio Feedback Strategy
- **Boss Encounters**: Audio warns of incoming threats and celebrates victories
- **Combat Actions**: Every shot and hit provides immediate audio confirmation
- **Collection Events**: Power-ups reward players with satisfying collection sounds
- **Contextual Volume**: Different sound types balanced for optimal gameplay experience

This enhancement transforms Space Defender from a basic shooter into a strategic arcade experience where power-up timing and collection become key gameplay elements.