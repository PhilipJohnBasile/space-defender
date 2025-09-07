# Space Defender - Retro Arcade Game

An immersive browser-based space shooter that captures the excitement of classic arcade games with modern web technologies.

**Experience Qualities**:
1. **Nostalgic** - Evokes the golden age of arcade gaming with pixel-perfect aesthetics and satisfying sound feedback
2. **Responsive** - Lightning-fast controls and smooth 60fps gameplay that reacts instantly to player input
3. **Progressive** - Escalating difficulty that keeps players engaged with increasingly challenging enemy waves

**Complexity Level**: Light Application (multiple features with basic state)
The game features real-time gameplay mechanics, scoring systems, and progressive difficulty while maintaining focus on core shooting gameplay.

## Essential Features

**Spaceship Movement**
- Functionality: Player controls spaceship with keyboard (WASD/Arrow keys) within screen boundaries
- Purpose: Core interaction mechanism for dodging enemies and positioning for attacks
- Trigger: Keyboard input detection
- Progression: Key press → movement calculation → boundary check → position update → visual feedback
- Success criteria: Smooth 60fps movement with immediate response to input

**Laser Shooting**
- Functionality: Spacebar fires laser projectiles upward from spaceship position
- Purpose: Primary offensive mechanism to destroy enemies
- Trigger: Spacebar press with rate limiting
- Progression: Spacebar press → projectile creation → trajectory calculation → collision detection → cleanup
- Success criteria: Consistent firing rate with visible projectiles that accurately hit targets

**Enemy Spawning System**
- Functionality: Automated generation of enemy ships at random horizontal positions
- Purpose: Creates continuous challenge and scoring opportunities
- Trigger: Timer-based spawning with difficulty scaling
- Progression: Timer expires → position calculation → enemy creation → movement initialization → collision setup
- Success criteria: Enemies spawn at predictable intervals and move smoothly toward player

**Collision Detection**
- Functionality: Real-time detection between lasers/enemies and enemies/player
- Purpose: Determines scoring events and game over conditions
- Trigger: Frame-by-frame proximity calculations
- Progression: Position comparison → collision check → effect triggering → object cleanup → score/health update
- Success criteria: Accurate collision detection with no false positives or missed hits

**Score & Lives System**
- Functionality: Tracks player score from destroyed enemies and remaining lives from collisions
- Purpose: Provides progression feedback and game termination conditions
- Trigger: Successful enemy destruction or player collision
- Progression: Event detection → score calculation → display update → life check → continue/end game
- Success criteria: Accurate scoring with clear game over state

## Edge Case Handling

- **Rapid Fire Prevention**: Rate limiting prevents laser spam that could cause performance issues
- **Boundary Enforcement**: Ships cannot move outside visible game area to maintain consistent experience
- **Collision Overlap**: Multiple simultaneous collisions handled with single-frame resolution
- **Performance Degradation**: Entity cleanup prevents memory leaks during extended gameplay sessions
- **Pause State Management**: Game state freezing maintains consistency when window loses focus

## Design Direction

The design should feel nostalgic and authentic to 80s arcade cabinets while leveraging modern web capabilities for smooth performance. A dark space environment with bright neon accents creates dramatic contrast and emphasizes the retro-futuristic aesthetic.

## Color Selection

Triadic color scheme (cyan, magenta, yellow) creating vibrant contrast against deep space backgrounds while maintaining the classic arcade aesthetic.

- **Primary Color**: Electric Cyan (oklch(0.7 0.2 200)) - Represents technology and space, used for player ship and UI elements
- **Secondary Colors**: 
  - Deep Magenta (oklch(0.6 0.25 320)) for enemy ships and danger states
  - Bright Yellow (oklch(0.85 0.15 85)) for projectiles and score highlights
- **Accent Color**: Neon Green (oklch(0.8 0.2 130)) for power-ups and success states
- **Foreground/Background Pairings**:
  - Background (Space Black oklch(0.1 0.02 240)): Cyan text (oklch(0.9 0.1 200)) - Ratio 8.2:1 ✓
  - Primary (Electric Cyan oklch(0.7 0.2 200)): Black text (oklch(0.1 0 0)) - Ratio 6.1:1 ✓
  - Secondary (Deep Magenta oklch(0.6 0.25 320)): White text (oklch(0.95 0 0)) - Ratio 5.8:1 ✓
  - Accent (Neon Green oklch(0.8 0.2 130)): Black text (oklch(0.1 0 0)) - Ratio 7.3:1 ✓

## Font Selection

Typography should evoke classic computer terminals and arcade cabinets with monospace characteristics that emphasize the digital aesthetic.

- **Typographic Hierarchy**:
  - H1 (Game Title): Orbitron Bold/36px/wide letter spacing
  - H2 (Score Display): Orbitron Medium/24px/normal spacing  
  - Body (UI Text): Orbitron Regular/16px/normal spacing
  - Small (Instructions): Orbitron Light/12px/tight spacing

## Animations

Animations should feel snappy and game-like, emphasizing immediate feedback and arcade-style visual punch with subtle screen shake and particle effects.

- **Purposeful Meaning**: Motion communicates impact, progress, and energy through quick snappy transitions
- **Hierarchy of Movement**: Player actions get immediate feedback, enemy destruction creates satisfying explosions, background elements provide ambient motion

## Component Selection

- **Components**: Canvas-based game rendering with Card components for UI overlays, Button for controls, Badge for score display
- **Customizations**: Custom Canvas component for game rendering, particle system for effects, keyboard input handler
- **States**: Game states (playing, paused, game over), ship states (normal, hit, invincible), enemy states (spawning, active, destroyed)
- **Icon Selection**: Phosphor icons for pause/play controls, settings, and navigation
- **Spacing**: Consistent 16px padding for UI elements, 8px gaps between related items
- **Mobile**: Touch controls overlay on smaller screens, responsive UI scaling, portrait orientation optimization