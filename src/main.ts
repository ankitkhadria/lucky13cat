// Main game loop and state management
import { RNG } from './rng.js';
import { Input, InputState } from './input.js';
import { Audio } from './audio.js';
import { UI } from './ui.js';
import { Sprite, COLORS } from './sprite.js';
import { LevelGenerator, Level, Entity } from './level.js';
import { clamp, dist2, Pool } from './util.js';

// Game states
enum GameState {
  LOADING,
  TITLE,
  PLAYING,
  PAUSED,
  GAME_OVER
}

// Particle system
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number;
  size: number;
}

// Player state
interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: number;
  lives: number;
  luck: number;
  luckActive: boolean;
  luckTimer: number;
  dashCooldown: number;
  invulnerable: number;
  inLight: boolean;
  crouched: boolean;
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private input: Input;
  private audio: Audio;
  private ui: UI;
  private levelGen: LevelGenerator;
  private rng: RNG;
  
  private state: GameState = GameState.LOADING;
  private level: Level | null = null;
  private player: Player;
  private entities: Entity[] = [];
  private particles: Particle[] = [];
  private particlePool: Pool<Particle>;
  
  private gameTime: number = 0;
  private score: number = 0;
  private shardsCollected: number = 0;
  private difficulty: number = 0;
  private seed: number;
  private highContrast: boolean = false;
  
  private readonly TILE_SIZE = 10;
  private readonly CANVAS_WIDTH = 320;
  private readonly CANVAS_HEIGHT = 180;
  
  private lastTime: number = 0;
  private accumulator: number = 0;
  private readonly FIXED_TIMESTEP = 1000 / 60; // 60 FPS

  constructor() {
    this.setupCanvas();
    this.input = new Input(this.canvas);
    this.audio = new Audio();
    this.ui = new UI(this.canvas, this.ctx);
    this.levelGen = new LevelGenerator();
    this.rng = new RNG();
    
    this.seed = this.getSeedFromURL() || Math.floor(Math.random() * 1000000);
    this.rng.reset(this.seed);
    
    this.player = this.createPlayer();
    this.particlePool = new Pool(() => this.createParticle(), 50);
    
    this.setupEventListeners();
    this.initialize();
  }

  private setupCanvas(): void {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.CANVAS_WIDTH;
    this.canvas.height = this.CANVAS_HEIGHT;
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.objectFit = 'contain';
    this.canvas.style.backgroundColor = '#000';
    this.canvas.style.imageRendering = 'pixelated';
    
    document.body.appendChild(this.canvas);
    
    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
  }

  private getSeedFromURL(): number | null {
    const hash = window.location.hash.slice(1);
    const parsed = parseInt(hash, 10);
    return isNaN(parsed) ? null : parsed;
  }

  private setSeedInURL(seed: number): void {
    window.location.hash = seed.toString();
  }

  private setupEventListeners(): void {
    // Pause when page loses focus
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === GameState.PLAYING) {
        this.state = GameState.PAUSED;
      }
    });

    // Enable audio on first user interaction
    document.addEventListener('click', () => this.audio.enable(), { once: true });
    document.addEventListener('keydown', () => this.audio.enable(), { once: true });
    document.addEventListener('touchstart', () => this.audio.enable(), { once: true });
  }

  private async initialize(): Promise<void> {
    // Simulate loading time
    await new Promise(resolve => setTimeout(resolve, 500));
    this.state = GameState.TITLE;
    this.setSeedInURL(this.seed);
    this.startGameLoop();
  }

  private createPlayer(): Player {
    return {
      x: 2, y: 2, vx: 0, vy: 0, facing: 1,
      lives: 9, luck: 0, luckActive: false, luckTimer: 0,
      dashCooldown: 0, invulnerable: 0, inLight: false, crouched: false
    };
  }

  private createParticle(): Particle {
    return {
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 1, color: COLORS.WHITE, size: 1
    };
  }

  private startGame(): void {
    this.level = this.levelGen.generate(this.seed, this.difficulty);
    this.player = this.createPlayer();
    this.player.x = this.level.spawn.x;
    this.player.y = this.level.spawn.y;
    this.entities = [...this.level.entities];
    this.particles = [];
    this.gameTime = 0;
    this.score = 0;
    this.shardsCollected = 0;
    this.state = GameState.PLAYING;
    this.audio.startAmbient();
  }

  private startGameLoop(): void {
    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - this.lastTime;
      this.lastTime = currentTime;
      
      this.accumulator += deltaTime;
      
      // Fixed timestep updates
      while (this.accumulator >= this.FIXED_TIMESTEP) {
        this.update(this.FIXED_TIMESTEP / 1000);
        this.accumulator -= this.FIXED_TIMESTEP;
      }
      
      this.render();
      requestAnimationFrame(gameLoop);
    };
    
    requestAnimationFrame(gameLoop);
  }

  private update(dt: number): void {
    this.input.update();
    
    switch (this.state) {
      case GameState.TITLE:
        this.updateTitle();
        break;
      case GameState.PLAYING:
        this.updateGame(dt);
        break;
      case GameState.PAUSED:
        this.updatePaused();
        break;
      case GameState.GAME_OVER:
        this.updateGameOver();
        break;
    }
    
    this.updateParticles(dt);
  }

  private updateTitle(): void {
    // Any key to start
    if (this.input.state.left || this.input.state.right || this.input.state.up || 
        this.input.state.down || this.input.state.dash || this.input.state.luck || 
        this.input.state.meow) {
      this.startGame();
    }
  }

  private updateGame(dt: number): void {
    if (!this.level) return;
    
    this.gameTime += dt;
    
    // Check for pause and contrast toggles - simplified for now
    // These would need proper key state tracking to avoid repeated triggers
    
    this.updatePlayer(dt);
    this.updateEntities(dt);
    this.checkCollisions();
    this.checkWinCondition();
  }

  private updatePlayer(dt: number): void {
    if (!this.level) return;
    
    const state = this.input.state;
    const speed = 60; // pixels per second
    const dashSpeed = 120;
    
    // Update timers
    this.player.dashCooldown = Math.max(0, this.player.dashCooldown - dt);
    this.player.invulnerable = Math.max(0, this.player.invulnerable - dt);
    this.player.luckTimer = Math.max(0, this.player.luckTimer - dt);
    
    if (this.player.luckTimer <= 0) {
      this.player.luckActive = false;
    }
    
    // Movement
    let targetVx = 0;
    let targetVy = 0;
    
    if (state.left) targetVx = -speed;
    if (state.right) targetVx = speed;
    if (state.up) targetVy = -speed;
    if (state.down) targetVy = speed;
    
    // Normalize diagonal movement
    if (targetVx !== 0 && targetVy !== 0) {
      targetVx *= 0.707;
      targetVy *= 0.707;
    }
    
    // Dash
    if (state.dash && this.player.dashCooldown <= 0 && (targetVx !== 0 || targetVy !== 0)) {
      targetVx = targetVx > 0 ? dashSpeed : targetVx < 0 ? -dashSpeed : 0;
      targetVy = targetVy > 0 ? dashSpeed : targetVy < 0 ? -dashSpeed : 0;
      this.player.dashCooldown = 1.0; // 1 second cooldown
      this.player.invulnerable = 0.3; // Brief invulnerability
      this.audio.playDash();
      this.spawnDashParticles();
    }
    
    this.player.vx = targetVx;
    this.player.vy = targetVy;
    
    // Update facing direction
    if (this.player.vx > 0) this.player.facing = 1;
    else if (this.player.vx < 0) this.player.facing = -1;
    
    // Crouch in shadows for stealth
    this.player.crouched = this.levelGen.isShadow(this.level, 
      Math.floor(this.player.x), Math.floor(this.player.y));
    
    // Apply movement with collision
    this.movePlayerWithCollision(dt);
    
    // Check if in light
    this.player.inLight = this.isPlayerInLight();
    
    // Luck ability
    if (state.luck && this.player.luck >= 1.0 && this.player.luckTimer <= 0) {
      this.activateLuck();
    }
    
    // Meow ability
    if (state.meow) {
      this.audio.playMeow();
      this.stunNearbyEnemies();
    }
  }

  private movePlayerWithCollision(dt: number): void {
    if (!this.level) return;
    
    const newX = this.player.x + this.player.vx * dt;
    const newY = this.player.y + this.player.vy * dt;
    
    // Check X collision
    if (this.levelGen.isFloor(this.level, Math.floor(newX), Math.floor(this.player.y))) {
      this.player.x = newX;
    } else {
      this.player.vx = 0;
    }
    
    // Check Y collision
    if (this.levelGen.isFloor(this.level, Math.floor(this.player.x), Math.floor(newY))) {
      this.player.y = newY;
    } else {
      this.player.vy = 0;
    }
    
    // Play footstep sounds occasionally
    if ((this.player.vx !== 0 || this.player.vy !== 0) && Math.random() < 0.02) {
      this.audio.playStep();
    }
  }

  private isPlayerInLight(): boolean {
    // Check if player is illuminated by any lantern
    for (const entity of this.entities) {
      if (entity.type === 3) { // Lantern
        const dx = this.player.x - entity.x;
        const dy = this.player.y - entity.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const radius = entity.data[0] || 50;
        
        if (dist < radius / this.TILE_SIZE) {
          // Check if within light cone
          const angle = Math.atan2(dy, dx);
          const lanternAngle = ((entity.data[1] || 0) * Math.PI) / 180;
          const angleDiff = Math.abs(angle - lanternAngle);
          
          if (angleDiff < Math.PI / 6 || angleDiff > 2 * Math.PI - Math.PI / 6) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private activateLuck(): void {
    this.player.luck = 0;
    this.player.luckActive = true;
    this.player.luckTimer = 5.0; // 5 seconds
    this.audio.playLuck();
    this.spawnLuckParticles();
  }

  private stunNearbyEnemies(): void {
    const stunRadius = 3;
    for (const entity of this.entities) {
      if (entity.type === 2) { // Dog
        const dx = this.player.x - entity.x;
        const dy = this.player.y - entity.y;
        if (Math.sqrt(dx * dx + dy * dy) < stunRadius) {
          entity.data[2] = 60; // Stun for 1 second at 60fps
        }
      }
    }
  }

  private updateEntities(dt: number): void {
    if (!this.level) return;
    
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      
      switch (entity.type) {
        case 2: // Dog
          this.updateDog(entity, dt);
          break;
        case 3: // Lantern
          this.updateLantern(entity, dt);
          break;
      }
    }
  }

  private updateDog(dog: Entity, dt: number): void {
    if (!this.level) return;
    
    // Decrease stun timer
    if (dog.data[2] > 0) {
      dog.data[2]--;
      return;
    }
    
    // Simple patrol AI
    dog.data[1]--; // Patrol timer
    
    if (dog.data[1] <= 0) {
      dog.data[0] = Math.floor(Math.random() * 4); // New direction
      dog.data[1] = 60 + Math.floor(Math.random() * 120); // Reset timer
    }
    
    // Move based on direction
    const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    const [dx, dy] = directions[dog.data[0]];
    const newX = dog.x + dx * dt * 20; // Slow movement
    const newY = dog.y + dy * dt * 20;
    
    if (this.levelGen.isFloor(this.level, Math.floor(newX), Math.floor(newY))) {
      dog.x = newX;
      dog.y = newY;
    } else {
      // Hit wall, change direction
      dog.data[0] = Math.floor(Math.random() * 4);
      dog.data[1] = 60;
    }
    
    // Check if player is nearby and visible
    const playerDist = dist2(dog.x, dog.y, this.player.x, this.player.y);
    const alertRange = this.player.luckActive ? 0.5 : (this.player.inLight ? 4 : 2);
    
    if (playerDist < alertRange * alertRange && !this.player.crouched) {
      // Alert state - chase player
      dog.data[2] = 1; // Mark as alerted
      const chaseSpeed = 40;
      const dirX = this.player.x - dog.x;
      const dirY = this.player.y - dog.y;
      const dist = Math.sqrt(dirX * dirX + dirY * dirY);
      
      if (dist > 0) {
        dog.x += (dirX / dist) * chaseSpeed * dt;
        dog.y += (dirY / dist) * chaseSpeed * dt;
      }
    } else {
      dog.data[2] = 0; // Not alerted
    }
  }

  private updateLantern(lantern: Entity, dt: number): void {
    // Rotate light cone
    lantern.data[1] += lantern.data[2] * dt * 30; // Rotation speed
    if (lantern.data[1] >= 360) lantern.data[1] -= 360;
  }

  private checkCollisions(): void {
    if (!this.level) return;
    
    // Check entity collisions
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      const dx = this.player.x - entity.x;
      const dy = this.player.y - entity.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      switch (entity.type) {
        case 0: // Shard
          if (dist < 0.7) {
            this.collectShard(i);
          }
          break;
        case 1: // Clover
          if (dist < 0.7) {
            this.collectClover(i);
          }
          break;
        case 2: // Dog
          if (dist < 0.8 && this.player.invulnerable <= 0) {
            this.hitPlayer();
          }
          break;
      }
    }
  }

  private collectShard(index: number): void {
    this.entities.splice(index, 1);
    this.shardsCollected++;
    this.score += 100;
    this.audio.playShard();
    this.spawnCollectParticles(this.player.x, this.player.y, COLORS.CYAN);
  }

  private collectClover(index: number): void {
    this.entities.splice(index, 1);
    this.player.luck = Math.min(1.0, this.player.luck + 0.2);
    this.score += 50;
    this.spawnCollectParticles(this.player.x, this.player.y, 0x00ff00);
  }

  private hitPlayer(): void {
    if (this.player.luckActive) return; // Luck protects from damage
    
    this.player.lives--;
    this.player.invulnerable = 2.0; // 2 seconds of invulnerability
    this.audio.playHit();
    this.spawnHitParticles();
    
    if (this.player.lives <= 0) {
      this.gameOver(false);
    }
  }

  private checkWinCondition(): void {
    // Win when all shards are collected
    const remainingShards = this.entities.filter(e => e.type === 0).length;
    if (remainingShards === 0) {
      this.gameOver(true);
    }
  }

  private gameOver(won: boolean): void {
    this.state = GameState.GAME_OVER;
    this.audio.stopAmbient();
    
    // Calculate final score
    this.score += this.player.lives * 200; // Bonus for remaining lives
    this.score += Math.max(0, 300 - Math.floor(this.gameTime)) * 10; // Time bonus
  }

  private updatePaused(): void {
    // Simple unpause - needs proper key tracking in real implementation
    if (this.input.state.luck || this.input.state.meow) {
      this.state = GameState.PLAYING;
    }
  }

  private updateGameOver(): void {
    // Simple restart - needs proper key tracking in real implementation  
    if (this.input.state.dash) {
      // Restart with same seed
      this.startGame();
    } else if (this.input.state.luck) {
      // New seed
      this.seed = Math.floor(Math.random() * 1000000);
      this.rng.reset(this.seed);
      this.setSeedInURL(this.seed);
      this.difficulty = Math.min(this.difficulty + 0.5, 5); // Increase difficulty
      this.startGame();
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      
      if (p.life <= 0) {
        this.particlePool.release(p);
        this.particles.splice(i, 1);
      }
    }
  }

  private spawnDashParticles(): void {
    for (let i = 0; i < 8; i++) {
      const p = this.particlePool.get();
      p.x = this.player.x + (Math.random() - 0.5) * 2;
      p.y = this.player.y + (Math.random() - 0.5) * 2;
      p.vx = (Math.random() - 0.5) * 100;
      p.vy = (Math.random() - 0.5) * 100;
      p.life = p.maxLife = 0.3;
      p.color = COLORS.WHITE;
      p.size = 2;
      this.particles.push(p);
    }
  }

  private spawnLuckParticles(): void {
    for (let i = 0; i < 12; i++) {
      const p = this.particlePool.get();
      p.x = this.player.x;
      p.y = this.player.y;
      p.vx = Math.cos(i * Math.PI / 6) * 50;
      p.vy = Math.sin(i * Math.PI / 6) * 50;
      p.life = p.maxLife = 0.5;
      p.color = COLORS.CANDLE;
      p.size = 3;
      this.particles.push(p);
    }
  }

  private spawnCollectParticles(x: number, y: number, color: number): void {
    for (let i = 0; i < 6; i++) {
      const p = this.particlePool.get();
      p.x = x;
      p.y = y;
      p.vx = (Math.random() - 0.5) * 60;
      p.vy = (Math.random() - 0.5) * 60;
      p.life = p.maxLife = 0.4;
      p.color = color;
      p.size = 2;
      this.particles.push(p);
    }
  }

  private spawnHitParticles(): void {
    for (let i = 0; i < 10; i++) {
      const p = this.particlePool.get();
      p.x = this.player.x + (Math.random() - 0.5) * 3;
      p.y = this.player.y + (Math.random() - 0.5) * 3;
      p.vx = (Math.random() - 0.5) * 80;
      p.vy = (Math.random() - 0.5) * 80;
      p.life = p.maxLife = 0.6;
      p.color = 0xff0000;
      p.size = 1;
      this.particles.push(p);
    }
  }

  private render(): void {
    this.ui.clear(this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    
    switch (this.state) {
      case GameState.LOADING:
        this.ui.drawLoadingScreen(this.CANVAS_WIDTH, this.CANVAS_HEIGHT, 1.0);
        break;
      case GameState.TITLE:
        this.ui.drawTitleScreen(this.CANVAS_WIDTH, this.CANVAS_HEIGHT, this.seed);
        break;
      case GameState.PLAYING:
        this.renderGame();
        break;
      case GameState.PAUSED:
        this.renderGame();
        this.ui.drawPauseScreen(this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
        break;
      case GameState.GAME_OVER:
        this.renderGame();
        this.ui.drawGameOverScreen(this.CANVAS_WIDTH, this.CANVAS_HEIGHT, 
          this.score, this.gameTime, this.seed, this.shardsCollected > 0);
        break;
    }
    
    // Touch UI overlay
    this.input.drawTouchUI(this.ctx, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    
    // Accessibility options
    if (this.state === GameState.PLAYING) {
      this.ui.drawAccessibilityToggle(this.CANVAS_WIDTH, this.CANVAS_HEIGHT, this.highContrast);
    }
  }

  private renderGame(): void {
    if (!this.level) return;
    
    const offsetX = this.CANVAS_WIDTH / 2 - this.player.x * this.TILE_SIZE;
    const offsetY = this.CANVAS_HEIGHT / 2 - this.player.y * this.TILE_SIZE;
    
    this.ctx.save();
    this.ctx.translate(offsetX, offsetY);
    
    // Render level tiles
    this.renderLevel();
    
    // Render entities
    this.renderEntities();
    
    // Render player
    this.renderPlayer();
    
    // Render particles
    this.renderParticles();
    
    this.ctx.restore();
    
    // Render HUD
    this.ui.drawHUD(this.CANVAS_WIDTH, this.CANVAS_HEIGHT, 
      this.player.lives, this.player.luck, this.shardsCollected, this.gameTime);
  }

  private renderLevel(): void {
    if (!this.level) return;
    
    for (let y = 0; y < this.level.height; y++) {
      for (let x = 0; x < this.level.width; x++) {
        const tileType = this.levelGen.getTile(this.level, x, y);
        const inLight = this.isTileInLight(x, y);
        
        Sprite.drawTile(this.ctx, x * this.TILE_SIZE, y * this.TILE_SIZE, 
          this.TILE_SIZE, tileType, inLight);
      }
    }
  }

  private isTileInLight(tileX: number, tileY: number): boolean {
    // Check if tile is illuminated by any lantern
    for (const entity of this.entities) {
      if (entity.type === 3) { // Lantern
        const dx = (tileX + 0.5) - entity.x;
        const dy = (tileY + 0.5) - entity.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const radius = (entity.data[0] || 50) / this.TILE_SIZE;
        
        if (dist < radius) {
          const angle = Math.atan2(dy, dx);
          const lanternAngle = ((entity.data[1] || 0) * Math.PI) / 180;
          const angleDiff = Math.abs(angle - lanternAngle);
          
          if (angleDiff < Math.PI / 6 || angleDiff > 2 * Math.PI - Math.PI / 6) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private renderEntities(): void {
    for (const entity of this.entities) {
      const x = entity.x * this.TILE_SIZE;
      const y = entity.y * this.TILE_SIZE;
      
      switch (entity.type) {
        case 0: // Shard
          Sprite.drawShard(this.ctx, x, y, Date.now() + (entity.data[0] || 0));
          break;
        case 1: // Clover
          Sprite.drawClover(this.ctx, x, y);
          break;
        case 2: // Dog
          const alerted = entity.data[2] === 1;
          Sprite.drawDog(this.ctx, x, y, 1, alerted);
          break;
        case 3: // Lantern
          const radius = entity.data[0] || 50;
          const angle = ((entity.data[1] || 0) * Math.PI) / 180;
          Sprite.drawLantern(this.ctx, x, y, radius, angle);
          break;
      }
    }
  }

  private renderPlayer(): void {
    const x = this.player.x * this.TILE_SIZE;
    const y = this.player.y * this.TILE_SIZE;
    
    // Flicker when invulnerable
    if (this.player.invulnerable > 0 && Math.floor(Date.now() / 100) % 2) {
      return;
    }
    
    Sprite.drawCat(this.ctx, x, y, this.player.facing, 
      this.player.crouched, this.player.lives);
    
    // Luck aura when active
    if (this.player.luckActive) {
      this.ctx.save();
      this.ctx.globalAlpha = 0.3;
      this.ctx.fillStyle = '#ffd700';
      this.ctx.beginPath();
      this.ctx.arc(x, y, 15, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  private renderParticles(): void {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      Sprite.drawParticle(this.ctx, p.x * this.TILE_SIZE, p.y * this.TILE_SIZE, 
        p.size, p.color, alpha);
    }
  }
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});