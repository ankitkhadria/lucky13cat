// Procedural level generation with seeded randomness
import { RNG } from './rng.js';
import { clamp } from './util.js';

export interface Entity {
  x: number;
  y: number;
  type: number; // 0=shard, 1=clover, 2=dog, 3=lantern
  data: number[]; // Additional parameters
}

export interface Level {
  width: number;
  height: number;
  tiles: Uint8Array; // 0=floor, 1=wall, 2=shadow
  spawn: { x: number; y: number };
  entities: Entity[];
  seed: number;
}

export class LevelGenerator {
  private rng: RNG;
  
  constructor() {
    this.rng = new RNG();
  }

  generate(seed: number, difficulty: number = 0): Level {
    this.rng.reset(seed);
    
    const width = 32;
    const height = 18;
    const tiles = new Uint8Array(width * height);
    
    // Fill with floor initially
    tiles.fill(0);
    
    // Generate outer walls
    for (let x = 0; x < width; x++) {
      tiles[x] = 1; // Top wall
      tiles[(height - 1) * width + x] = 1; // Bottom wall
    }
    for (let y = 0; y < height; y++) {
      tiles[y * width] = 1; // Left wall
      tiles[y * width + (width - 1)] = 1; // Right wall
    }
    
    // Generate interior layout
    this.generateRooms(tiles, width, height);
    this.generateShadowZones(tiles, width, height);
    
    // Safe spawn area (top-left corner)
    const spawn = { x: 2, y: 2 };
    
    // Clear spawn area
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = spawn.x + dx;
        const ty = spawn.y + dy;
        if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
          tiles[ty * width + tx] = 0;
        }
      }
    }
    
    // Generate entities
    const entities = this.generateEntities(tiles, width, height, difficulty);
    
    return {
      width,
      height, 
      tiles,
      spawn,
      entities,
      seed
    };
  }

  private generateRooms(tiles: Uint8Array, width: number, height: number): void {
    // Generate 3-5 rectangular rooms
    const roomCount = this.rng.range(3, 5);
    
    for (let i = 0; i < roomCount; i++) {
      const roomW = this.rng.range(4, 8);
      const roomH = this.rng.range(3, 6);
      const roomX = this.rng.range(2, width - roomW - 2);
      const roomY = this.rng.range(2, height - roomH - 2);
      
      // Carve out room
      for (let y = roomY; y < roomY + roomH; y++) {
        for (let x = roomX; x < roomX + roomW; x++) {
          tiles[y * width + x] = 0;
        }
      }
      
      // Add some internal walls for complexity
      if (this.rng.bool(0.6)) {
        const wallX = roomX + this.rng.range(1, roomW - 2);
        for (let y = roomY + 1; y < roomY + roomH - 1; y++) {
          if (this.rng.bool(0.7)) {
            tiles[y * width + wallX] = 1;
          }
        }
      }
    }
    
    // Connect rooms with corridors
    this.generateCorridors(tiles, width, height);
  }

  private generateCorridors(tiles: Uint8Array, width: number, height: number): void {
    // Simple corridor generation - horizontal and vertical passes
    for (let pass = 0; pass < 3; pass++) {
      // Horizontal corridors
      for (let y = 3; y < height - 3; y += 3) {
        for (let x = 1; x < width - 1; x++) {
          if (this.rng.bool(0.3)) {
            tiles[y * width + x] = 0;
          }
        }
      }
      
      // Vertical corridors
      for (let x = 3; x < width - 3; x += 3) {
        for (let y = 1; y < height - 1; y++) {
          if (this.rng.bool(0.3)) {
            tiles[y * width + x] = 0;
          }
        }
      }
    }
  }

  private generateShadowZones(tiles: Uint8Array, width: number, height: number): void {
    // Add shadow zones (type 2) in corners and dead ends
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (tiles[idx] === 0) { // Only on floors
          // Count adjacent walls
          let wallCount = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                if (tiles[ny * width + nx] === 1) wallCount++;
              }
            }
          }
          
          // Create shadow zones in corners or near walls
          if (wallCount >= 5 || (wallCount >= 3 && this.rng.bool(0.4))) {
            tiles[idx] = 2; // Shadow zone
          }
        }
      }
    }
  }

  private generateEntities(tiles: Uint8Array, width: number, height: number, 
                          difficulty: number): Entity[] {
    const entities: Entity[] = [];
    
    // Generate starlight shards (collectibles)
    const shardCount = clamp(5 + Math.floor(difficulty * 3), 5, 12);
    for (let i = 0; i < shardCount; i++) {
      const pos = this.findFloorPosition(tiles, width, height);
      if (pos) {
        entities.push({
          x: pos.x,
          y: pos.y,
          type: 0, // Shard
          data: [this.rng.int(1000)] // Animation offset
        });
      }
    }
    
    // Generate clovers (luck charge)
    const cloverCount = clamp(2 + Math.floor(difficulty), 2, 5);
    for (let i = 0; i < cloverCount; i++) {
      const pos = this.findFloorPosition(tiles, width, height);
      if (pos) {
        entities.push({
          x: pos.x,
          y: pos.y,
          type: 1, // Clover
          data: []
        });
      }
    }
    
    // Generate patrolling dogs
    const dogCount = clamp(1 + Math.floor(difficulty * 2), 1, 4);
    for (let i = 0; i < dogCount; i++) {
      const pos = this.findFloorPosition(tiles, width, height);
      if (pos) {
        entities.push({
          x: pos.x,
          y: pos.y,
          type: 2, // Dog
          data: [
            this.rng.int(4), // Direction
            this.rng.range(60, 180), // Patrol timer
            0 // Alert state
          ]
        });
      }
    }
    
    // Generate lanterns (light sources)
    const lanternCount = clamp(3 + Math.floor(difficulty), 3, 8);
    for (let i = 0; i < lanternCount; i++) {
      const pos = this.findWallPosition(tiles, width, height);
      if (pos) {
        entities.push({
          x: pos.x,
          y: pos.y,
          type: 3, // Lantern
          data: [
            this.rng.range(40, 80), // Light radius
            this.rng.int(360), // Initial angle
            this.rng.range(1, 3) // Rotation speed
          ]
        });
      }
    }
    
    return entities;
  }

  private findFloorPosition(tiles: Uint8Array, width: number, height: number): 
    { x: number; y: number } | null {
    
    for (let attempts = 0; attempts < 50; attempts++) {
      const x = this.rng.range(2, width - 3);
      const y = this.rng.range(2, height - 3);
      const idx = y * width + x;
      
      if (tiles[idx] === 0 || tiles[idx] === 2) { // Floor or shadow
        // Check it's not too close to spawn
        if (Math.abs(x - 2) > 3 || Math.abs(y - 2) > 3) {
          return { x, y };
        }
      }
    }
    
    return null;
  }

  private findWallPosition(tiles: Uint8Array, width: number, height: number): 
    { x: number; y: number } | null {
    
    for (let attempts = 0; attempts < 50; attempts++) {
      const x = this.rng.range(1, width - 2);
      const y = this.rng.range(1, height - 2);
      const idx = y * width + x;
      
      if (tiles[idx] === 1) { // Wall
        // Check there's floor nearby for the light to illuminate
        let hasFloor = false;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nidx = ny * width + nx;
              if (tiles[nidx] === 0) {
                hasFloor = true;
                break;
              }
            }
          }
          if (hasFloor) break;
        }
        
        if (hasFloor) {
          return { x, y };
        }
      }
    }
    
    return null;
  }

  getTile(level: Level, x: number, y: number): number {
    if (x < 0 || x >= level.width || y < 0 || y >= level.height) {
      return 1; // Wall outside bounds
    }
    return level.tiles[y * level.width + x];
  }

  isFloor(level: Level, x: number, y: number): boolean {
    const tile = this.getTile(level, x, y);
    return tile === 0 || tile === 2; // Floor or shadow
  }

  isShadow(level: Level, x: number, y: number): boolean {
    return this.getTile(level, x, y) === 2;
  }
}