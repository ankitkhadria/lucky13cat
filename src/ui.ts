// UI rendering with bitmap font and game screens
import { colorToHex } from './util.js';
import { COLORS } from './sprite.js';

// Minimal 4x6 bitmap font data (compressed)
const FONT_DATA = {
  ' ': 0x000000,
  '!': 0x084208,
  '"': 0xa00000,
  '#': 0x4f4f40,
  '$': 0x6a62a6,
  '%': 0x842108,
  '&': 0x4a4c52,
  "'": 0x800000,
  '(': 0x248442,
  ')': 0x842214,
  '*': 0x05d550,
  '+': 0x042108,
  ',': 0x000300,
  '-': 0x001c00,
  '.': 0x000200,
  '/': 0x020408,
  '0': 0x4aaa24,
  '1': 0x622222,
  '2': 0x4a1124,
  '3': 0x4a14a4,
  '4': 0x8aaa84,
  '5': 0xe21124,
  '6': 0x4a21a4,
  '7': 0xe11111,
  '8': 0x4a51a4,
  '9': 0x4a9144,
  ':': 0x020200,
  ';': 0x020300,
  '<': 0x024842,
  '=': 0x007700,
  '>': 0x821084,
  '?': 0x4a1044,
  '@': 0x4abba4,
  'A': 0x4aaaaa,
  'B': 0xeaa6aa,
  'C': 0x4a8884,
  'D': 0xeaaaaae,
  'E': 0xe88e88,
  'F': 0xe88e80,
  'G': 0x4a89a4,
  'H': 0xaaaaaa,
  'I': 0x711111,
  'J': 0x111194,
  'K': 0xaaccaa,
  'L': 0x888887,
  'M': 0xababab,
  'N': 0xaabbab,
  'O': 0x4aaaa4,
  'P': 0xeaae80,
  'Q': 0x4aaab5,
  'R': 0xeaaeaa,
  'S': 0x4a1124,
  'T': 0xe22222,
  'U': 0xaaaaa4,
  'V': 0xaaaaaa,
  'W': 0xababab,
  'X': 0xaa44aa,
  'Y': 0xaa4444,
  'Z': 0xe12487
};

export class UI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  // Draw single character using bitmap font
  drawChar(x: number, y: number, char: string, color: number = COLORS.WHITE, scale: number = 1): void {
    const data = FONT_DATA[char.toUpperCase()] || FONT_DATA[' '];
    this.ctx.fillStyle = colorToHex(color);
    
    for (let py = 0; py < 6; py++) {
      for (let px = 0; px < 4; px++) {
        const bit = (data >> ((5 - py) * 4 + (3 - px))) & 1;
        if (bit) {
          this.ctx.fillRect(
            x + px * scale,
            y + py * scale,
            scale,
            scale
          );
        }
      }
    }
  }

  // Draw text string
  drawText(x: number, y: number, text: string, color: number = COLORS.WHITE, 
           scale: number = 1, centered: boolean = false): void {
    const chars = text.toUpperCase();
    const totalWidth = chars.length * 4 * scale;
    
    let startX = x;
    if (centered) {
      startX = x - totalWidth / 2;
    }
    
    for (let i = 0; i < chars.length; i++) {
      this.drawChar(startX + i * 4 * scale, y, chars[i], color, scale);
    }
  }

  // Draw title screen
  drawTitleScreen(width: number, height: number, seed: number): void {
    // Clear screen with night background
    this.ctx.fillStyle = colorToHex(COLORS.NIGHT);
    this.ctx.fillRect(0, 0, width, height);
    
    // Title
    this.drawText(width / 2, 30, 'NINE LIVES', COLORS.CANDLE, 2, true);
    this.drawText(width / 2, 50, 'SHADOW ALLEY', COLORS.WHITE, 1, true);
    
    // Cat silhouette
    this.ctx.fillStyle = colorToHex(COLORS.BLACK);
    this.ctx.fillRect(width / 2 - 10, 70, 20, 15);
    this.ctx.fillStyle = colorToHex(COLORS.CYAN);
    this.ctx.fillRect(width / 2 - 6, 75, 2, 2);
    this.ctx.fillRect(width / 2 + 4, 75, 2, 2);
    
    // Instructions
    this.drawText(width / 2, 110, 'ARROWS: MOVE', COLORS.WHITE, 1, true);
    this.drawText(width / 2, 120, 'SHIFT: DASH', COLORS.WHITE, 1, true);
    this.drawText(width / 2, 130, 'SPACE: LUCK', COLORS.CANDLE, 1, true);
    this.drawText(width / 2, 140, 'Z: MEOW', COLORS.WHITE, 1, true);
    
    this.drawText(width / 2, 160, 'STAY IN SHADOWS', COLORS.PURPLE, 1, true);
    this.drawText(width / 2, 170, 'COLLECT STARLIGHT', COLORS.CYAN, 1, true);
    
    // Seed display
    this.drawText(width / 2, 190, `SEED: ${seed}`, COLORS.GRAY, 1, true);
    
    // Start prompt
    const blink = Math.floor(Date.now() / 500) % 2;
    if (blink) {
      this.drawText(width / 2, 210, 'PRESS ANY KEY', COLORS.WHITE, 1, true);
    }
  }

  // Draw game HUD
  drawHUD(width: number, height: number, lives: number, luck: number, 
          shards: number, time: number): void {
    // Lives display (top left)
    this.drawText(5, 5, `LIVES: ${lives}`, COLORS.WHITE);
    
    // Luck meter (top center)
    const luckWidth = 80;
    const luckHeight = 6;
    const luckX = (width - luckWidth) / 2;
    const luckY = 5;
    
    this.ctx.fillStyle = colorToHex(COLORS.BLACK);
    this.ctx.fillRect(luckX, luckY, luckWidth, luckHeight);
    
    this.ctx.fillStyle = colorToHex(COLORS.CANDLE);
    this.ctx.fillRect(luckX, luckY, luckWidth * luck, luckHeight);
    
    this.ctx.strokeStyle = colorToHex(COLORS.WHITE);
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(luckX, luckY, luckWidth, luckHeight);
    
    this.drawText(luckX - 25, 5, 'LUCK', COLORS.WHITE);
    
    // Shards collected (top right)
    this.drawText(width - 60, 5, `SHARDS: ${shards}`, COLORS.CYAN);
    
    // Time (bottom right)
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    this.drawText(width - 50, height - 15, 
      `${minutes}:${seconds.toString().padStart(2, '0')}`, COLORS.WHITE);
  }

  // Draw game over screen
  drawGameOverScreen(width: number, height: number, score: number, 
                     time: number, seed: number, won: boolean): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, width, height);
    
    // Title
    const title = won ? 'VICTORY!' : 'GAME OVER';
    const titleColor = won ? COLORS.CANDLE : COLORS.WHITE;
    this.drawText(width / 2, 60, title, titleColor, 2, true);
    
    // Cat icon
    this.ctx.fillStyle = colorToHex(COLORS.BLACK);
    this.ctx.fillRect(width / 2 - 8, 80, 16, 12);
    this.ctx.fillStyle = colorToHex(won ? COLORS.CANDLE : COLORS.CYAN);
    this.ctx.fillRect(width / 2 - 4, 85, 2, 2);
    this.ctx.fillRect(width / 2 + 2, 85, 2, 2);
    
    // Score
    this.drawText(width / 2, 110, `SCORE: ${score}`, COLORS.WHITE, 1, true);
    
    // Time
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    this.drawText(width / 2, 125, 
      `TIME: ${minutes}:${seconds.toString().padStart(2, '0')}`, COLORS.WHITE, 1, true);
    
    // Seed
    this.drawText(width / 2, 140, `SEED: ${seed}`, COLORS.GRAY, 1, true);
    
    // Restart prompt
    const blink = Math.floor(Date.now() / 500) % 2;
    if (blink) {
      this.drawText(width / 2, 170, 'PRESS R TO RESTART', COLORS.WHITE, 1, true);
      this.drawText(width / 2, 185, 'PRESS N FOR NEW SEED', COLORS.WHITE, 1, true);
    }
  }

  // Draw pause screen
  drawPauseScreen(width: number, height: number): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, width, height);
    
    this.drawText(width / 2, height / 2, 'PAUSED', COLORS.WHITE, 2, true);
    this.drawText(width / 2, height / 2 + 20, 'PRESS P TO RESUME', COLORS.WHITE, 1, true);
  }

  // Draw loading screen
  drawLoadingScreen(width: number, height: number, progress: number): void {
    this.ctx.fillStyle = colorToHex(COLORS.NIGHT);
    this.ctx.fillRect(0, 0, width, height);
    
    this.drawText(width / 2, height / 2 - 20, 'LOADING...', COLORS.WHITE, 1, true);
    
    // Progress bar
    const barWidth = 100;
    const barHeight = 6;
    const barX = (width - barWidth) / 2;
    const barY = height / 2;
    
    this.ctx.fillStyle = colorToHex(COLORS.BLACK);
    this.ctx.fillRect(barX, barY, barWidth, barHeight);
    
    this.ctx.fillStyle = colorToHex(COLORS.CANDLE);
    this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    
    this.ctx.strokeStyle = colorToHex(COLORS.WHITE);
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);
  }

  // Draw accessibility options
  drawAccessibilityToggle(width: number, height: number, highContrast: boolean): void {
    const text = highContrast ? 'HIGH CONTRAST: ON' : 'HIGH CONTRAST: OFF';
    this.drawText(5, height - 25, text, COLORS.GRAY);
    this.drawText(5, height - 15, 'PRESS C TO TOGGLE', COLORS.GRAY);
  }

  // Clear screen with background color
  clear(width: number, height: number, color: number = COLORS.NIGHT): void {
    this.ctx.fillStyle = colorToHex(color);
    this.ctx.fillRect(0, 0, width, height);
  }
}