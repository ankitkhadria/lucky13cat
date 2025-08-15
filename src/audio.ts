// Minimal bytebeat and WebAudio synthesis for game sounds
export class Audio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isEnabled: boolean = false;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
      this.isEnabled = true;
    } catch (e) {
      console.warn('Audio not available');
      this.isEnabled = false;
    }
  }

  private async resumeContext(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  // Generate bytebeat pattern buffer
  private generateBytebeat(formula: (t: number) => number, duration: number, sampleRate: number = 8000): AudioBuffer | null {
    if (!this.ctx) return null;

    const length = duration * sampleRate;
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i;
      const sample = formula(t) & 255; // Keep in byte range
      data[i] = (sample - 128) / 128; // Normalize to [-1, 1]
    }

    return buffer;
  }

  // Play a bytebeat pattern
  private playBytebeat(formula: (t: number) => number, duration: number = 0.3): void {
    if (!this.ctx || !this.masterGain || !this.isEnabled) return;

    this.resumeContext();

    const buffer = this.generateBytebeat(formula, duration);
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(this.masterGain);
    
    // Envelope to avoid clicks
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1, this.ctx.currentTime + 0.01);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration - 0.01);
    
    source.start();
    source.stop(this.ctx.currentTime + duration);
  }

  // Simple oscillator for sustained sounds
  private playTone(freq: number, duration: number, type: OscillatorType = 'triangle'): void {
    if (!this.ctx || !this.masterGain || !this.isEnabled) return;

    this.resumeContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // Game sound effects
  playDash(): void {
    // Fast whoosh sound
    this.playBytebeat(t => (t >> 2) ^ (t << 1) & (t >> 8), 0.15);
  }

  playShard(): void {
    // Sparkly collect sound
    this.playBytebeat(t => (t * 5 & t >> 7) | (t * 3 & t >> 10), 0.25);
  }

  playLuck(): void {
    // Magical chime
    this.playTone(800, 0.2, 'sine');
    setTimeout(() => this.playTone(1200, 0.15, 'sine'), 100);
  }

  playMeow(): void {
    // Cat meow approximation
    this.playBytebeat(t => (t >> 3) * ((t >> 12) | t) & 127, 0.4);
  }

  playHit(): void {
    // Impact sound
    this.playBytebeat(t => (t * ((t >> 9) | (t >> 13))) & 255, 0.2);
  }

  playStep(): void {
    // Soft footstep
    this.playBytebeat(t => (t >> 4) & (t >> 7) & 64, 0.1);
  }

  // Ambient background pad (looped)
  private ambientSource: AudioBufferSource | null = null;
  
  startAmbient(): void {
    if (!this.ctx || !this.masterGain || !this.isEnabled || this.ambientSource) return;

    this.resumeContext();

    // Generate a longer ambient buffer that can loop
    const buffer = this.generateBytebeat(
      t => ((t >> 7) & (t >> 12)) * (Math.sin(t / 1000) * 32 + 32), 
      4.0, 
      11025
    );
    
    if (!buffer) return;

    this.ambientSource = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    
    this.ambientSource.buffer = buffer;
    this.ambientSource.loop = true;
    this.ambientSource.connect(gain);
    gain.connect(this.masterGain);
    gain.gain.value = 0.1; // Very quiet ambient
    
    this.ambientSource.start();
  }

  stopAmbient(): void {
    if (this.ambientSource) {
      this.ambientSource.stop();
      this.ambientSource = null;
    }
  }

  // Enable audio after user interaction
  enable(): void {
    this.isEnabled = true;
    this.resumeContext();
  }

  disable(): void {
    this.isEnabled = false;
    this.stopAmbient();
  }
}