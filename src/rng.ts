// Tiny mulberry32 PRNG for seeded generation
export class RNG {
  private seed: number;

  constructor(seed: number = 12345) {
    this.seed = seed;
  }

  // Generate next random number [0, 1)
  next(): number {
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  // Random integer [0, max)
  int(max: number): number {
    return Math.floor(this.next() * max);
  }

  // Random integer [min, max]
  range(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  // Random boolean with probability
  bool(prob: number = 0.5): boolean {
    return this.next() < prob;
  }

  // Reset with new seed
  reset(seed: number): void {
    this.seed = seed;
  }
}