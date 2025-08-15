// Utility functions for game math and helpers
export const clamp = (x: number, min: number, max: number): number => 
  Math.max(min, Math.min(max, x));

export const lerp = (a: number, b: number, t: number): number => 
  a + (b - a) * t;

export const dist = (x1: number, y1: number, x2: number, y2: number): number => 
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

export const dist2 = (x1: number, y1: number, x2: number, y2: number): number => 
  (x2 - x1) ** 2 + (y2 - y1) ** 2;

export const norm = (x: number, y: number): number => 
  Math.sqrt(x * x + y * y);

export const deg2rad = (deg: number): number => deg * Math.PI / 180;

export const rad2deg = (rad: number): number => rad * 180 / Math.PI;

// Fast sin/cos approximations for particle effects
export const fastSin = (x: number): number => {
  x = x % (2 * Math.PI);
  if (x < 0) x += 2 * Math.PI;
  if (x < Math.PI) return 4 * x * (Math.PI - x) / (Math.PI * Math.PI);
  x -= Math.PI;
  return -4 * x * (Math.PI - x) / (Math.PI * Math.PI);
};

export const fastCos = (x: number): number => fastSin(x + Math.PI / 2);

// Simple easing functions
export const easeOut = (t: number): number => 1 - (1 - t) ** 2;
export const easeIn = (t: number): number => t * t;
export const easeInOut = (t: number): number => 
  t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) ** 2;

// Color utilities (RGB888 packed as numbers)
export const rgb = (r: number, g: number, b: number): number => 
  (r << 16) | (g << 8) | b;

export const getRed = (color: number): number => (color >> 16) & 0xFF;
export const getGreen = (color: number): number => (color >> 8) & 0xFF;
export const getBlue = (color: number): number => color & 0xFF;

export const colorToHex = (color: number): string => 
  '#' + color.toString(16).padStart(6, '0');

// Simple object pooling for particles
export class Pool<T> {
  private items: T[] = [];
  private factory: () => T;

  constructor(factory: () => T, initialSize: number = 10) {
    this.factory = factory;
    for (let i = 0; i < initialSize; i++) {
      this.items.push(factory());
    }
  }

  get(): T {
    return this.items.pop() || this.factory();
  }

  release(item: T): void {
    this.items.push(item);
  }
}