# Nine Lives: Shadow Alley

A JS13kGames entry featuring a nimble **black cat** sneaking through candlelit alleys to collect starlight shards while dodging lantern cones and guard dogs. The twist: you have **nine lives** and a **luck meter** that flips game rules when activated, embracing classic black-cat superstition.

## Game Concept

Navigate shadow-filled procedural levels as a black cat, staying hidden in darkness while collecting glowing starlight shards. Use your nine lives wisely and charge your luck meter to temporarily invert the rules of the world - making light heal instead of harm, putting dogs to sleep, and making you invulnerable to detection.

## Controls

### Keyboard
- **Arrow Keys / WASD**: Move the cat
- **Shift**: Dash (short cooldown, brief invulnerability)
- **Space**: Activate Luck (when charged)
- **Z**: Meow (stuns nearby enemies)
- **P**: Pause/Resume
- **C**: Toggle high contrast mode
- **R**: Restart (game over screen)
- **N**: New seed (game over screen)

### Touch/Mobile
- **Swipe/Drag**: Move in direction
- **Tap on cat**: Quick movement
- **Bottom-right buttons**: Luck (L) and Meow (M)

## Build Instructions

Requires Node.js 18+ (no global dependencies needed):

```bash
# Install dependencies
npm install

# Development server with hot reload
npm run dev

# Production build + zip + size check
npm run release

# Individual commands
npm run build    # Build optimized HTML
npm run zip      # Create game.zip
npm run size     # Verify ≤13KB limit
npm run clean    # Remove dist/
```

## Technical Implementation

### Compression Pipeline
1. **esbuild**: Bundle TypeScript → JavaScript 
2. **Terser**: Aggressive minification with property mangling
3. **Manual optimization**: Pattern replacement, boolean literals, math shortcuts
4. **HTML minification**: Inline everything into single file
5. **ZIP compression**: Final deflate compression

### Code Golf Techniques
- Parametric sprite rendering (no images)
- Bitmap font from function data
- WebAudio bytebeat synthesis (no audio files)
- Fixed-point math where possible
- Property mangling for compression
- Seeded PRNG for deterministic levels

### Procedural Assets
- **Graphics**: All sprites drawn with `fillRect()`, paths, and math functions
- **Levels**: Seeded room generation with corridors and shadow zones  
- **Audio**: Square wave bytebeat patterns and simple envelopes
- **Font**: 4×6 pixel bitmap font encoded as hex constants

## Game Features

- ✅ **Theme Compliance**: Black cat central to all mechanics and narrative
- ✅ **Size**: Final zip ≤ 13,312 bytes (enforced by build script)
- ✅ **Offline**: No external assets, fonts, libraries, or network calls
- ✅ **Cross-platform**: Keyboard + touch, 60fps on modest hardware  
- ✅ **Procedural**: Seeded random generation for replayability
- ✅ **Accessibility**: High contrast toggle, reduced motion options

### Core Mechanics
- **Stealth System**: Hide in shadows, avoid light cones
- **Nine Lives**: Multiple chances with visual life counter
- **Luck Meter**: Collect clovers to charge, activate to flip rules
- **Dash Ability**: Quick movement with brief invulnerability
- **Meow Stun**: Area effect to disable nearby threats

## JS13kGames Compliance

- ✅ **13KB Limit**: Automated size checking ensures compliance
- ✅ **Offline Playable**: Works via `file://` protocol
- ✅ **Theme**: "Black Cat" integrated into core gameplay mechanics
- ✅ **No External Resources**: Everything procedurally generated
- ✅ **Browser Compatible**: ES2020, Canvas 2D, WebAudio APIs only

## Development Notes

### Seed System
- Levels generated from numeric seed in URL hash
- Deterministic playback for sharing challenges
- Random seed generation for variety

### Performance Optimizations  
- Fixed timestep game loop (60fps)
- Object pooling for particles
- Minimal allocations in update loop
- Efficient collision detection
- Canvas operation batching

### Audio Synthesis
Bytebeat formulas generate all sound effects:
- **Dash**: `(t >> 2) ^ (t << 1) & (t >> 8)`
- **Collect**: `(t * 5 & t >> 7) | (t * 3 & t >> 10)`
- **Ambient**: `((t >> 7) & (t >> 12)) * (sin(t/1000) * 32 + 32)`

## Post-Mortem

**What Worked Well:**
- Aggressive compression achieved <8KB final size with room to spare
- Procedural generation provides variety within size constraints
- Black cat theme naturally fits stealth mechanics
- Bytebeat audio adds atmosphere without file overhead

**Lessons Learned:**
- TypeScript helps during development but requires careful build optimization
- Manual compression passes after Terser yield significant gains
- Parameterized drawing functions compress better than sprite data
- Fixed timestep ensures consistent gameplay across devices

**Size Distribution:**
- Game logic: ~60%
- Sprite rendering: ~25% 
- Audio synthesis: ~10%
- UI/Font system: ~5%
