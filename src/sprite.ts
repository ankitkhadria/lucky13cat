// Parametric sprite rendering - all graphics drawn with code
import { colorToHex, fastSin, fastCos } from './util.js';

// Color palette for compression efficiency
export const COLORS = {
  BLACK: 0x000000,
  WHITE: 0xFFFFFF,
  SHADOW: 0x1a1a2e,
  NIGHT: 0x16213e,
  CANDLE: 0xffd700,
  CYAN: 0x00ffff,
  PURPLE: 0x9d4edd,
  GRAY: 0x666666
};

export class Sprite {
  static drawCat(ctx: CanvasRenderingContext2D, x: number, y: number, 
                 facing: number = 1, crouched: boolean = false, lives: number = 9): void {
    const scale = crouched ? 0.8 : 1;
    const w = 6 * scale;
    const h = 8 * scale;
    
    ctx.save();
    ctx.translate(x, y);
    if (facing < 0) ctx.scale(-1, 1);
    
    // Body (black)
    ctx.fillStyle = colorToHex(COLORS.BLACK);
    ctx.fillRect(-w/2, -h/2, w, h);
    
    // Eyes (cyan glow)
    ctx.fillStyle = colorToHex(COLORS.CYAN);
    ctx.fillRect(-2, -3, 1, 1);
    ctx.fillRect(1, -3, 1, 1);
    
    // Tail
    const tailX = -w/2 - 3;
    const tailY = Math.sin(Date.now() * 0.005) * 2;
    ctx.fillRect(tailX, tailY, 3, 1);
    
    // Life indicator (tiny hearts above)
    if (lives > 0) {
      ctx.fillStyle = colorToHex(COLORS.WHITE);
      for (let i = 0; i < Math.min(lives, 9); i++) {
        const lx = -8 + i * 2;
        ctx.fillRect(lx, -h/2 - 3, 1, 1);
      }
    }
    
    ctx.restore();
  }

  static drawDog(ctx: CanvasRenderingContext2D, x: number, y: number, 
                 facing: number = 1, alerted: boolean = false): void {
    ctx.save();
    ctx.translate(x, y);
    if (facing < 0) ctx.scale(-1, 1);
    
    // Body (gray)
    ctx.fillStyle = colorToHex(alerted ? COLORS.WHITE : COLORS.GRAY);
    ctx.fillRect(-4, -4, 8, 6);
    
    // Snout
    ctx.fillRect(4, -1, 3, 2);
    
    // Eyes (red when alerted)
    ctx.fillStyle = colorToHex(alerted ? 0xff0000 : COLORS.BLACK);
    ctx.fillRect(1, -2, 1, 1);
    ctx.fillRect(3, -2, 1, 1);
    
    // Legs
    ctx.fillStyle = colorToHex(COLORS.GRAY);
    ctx.fillRect(-3, 2, 1, 3);
    ctx.fillRect(-1, 2, 1, 3);
    ctx.fillRect(1, 2, 1, 3);
    ctx.fillRect(3, 2, 1, 3);
    
    ctx.restore();
  }

  static drawLantern(ctx: CanvasRenderingContext2D, x: number, y: number, 
                     radius: number, angle: number): void {
    ctx.save();
    ctx.translate(x, y);
    
    // Lantern post
    ctx.fillStyle = colorToHex(COLORS.GRAY);
    ctx.fillRect(-1, -6, 2, 12);
    
    // Lantern housing
    ctx.fillStyle = colorToHex(COLORS.CANDLE);
    ctx.fillRect(-3, -8, 6, 4);
    
    // Light cone
    ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, angle - Math.PI/6, angle + Math.PI/6);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }

  static drawShard(ctx: CanvasRenderingContext2D, x: number, y: number, 
                   time: number = 0): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time * 0.01);
    
    // Sparkly star shape
    ctx.fillStyle = colorToHex(COLORS.CYAN);
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const radius = (i % 2) ? 2 : 4;
      const px = fastCos(angle) * radius;
      const py = fastSin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    
    // Glow effect
    ctx.shadowColor = colorToHex(COLORS.CYAN);
    ctx.shadowBlur = 3;
    ctx.fill();
    
    ctx.restore();
  }

  static drawClover(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.translate(x, y);
    
    // Four-leaf clover shape
    ctx.fillStyle = '#00ff00';
    
    // Four leaves
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 2);
      ctx.beginPath();
      ctx.arc(0, -2, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    
    // Stem
    ctx.fillRect(-0.5, 0, 1, 4);
    
    ctx.restore();
  }

  static drawParticle(ctx: CanvasRenderingContext2D, x: number, y: number, 
                      size: number, color: number, alpha: number = 1): void {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = colorToHex(color);
    ctx.fillRect(x - size/2, y - size/2, size, size);
    ctx.restore();
  }

  static drawTile(ctx: CanvasRenderingContext2D, x: number, y: number, 
                  tileSize: number, type: number, inLight: boolean = false): void {
    let color: number;
    
    switch (type) {
      case 0: // Empty/floor
        color = inLight ? COLORS.GRAY : COLORS.SHADOW;
        break;
      case 1: // Wall
        color = COLORS.BLACK;
        break;
      case 2: // Shadow zone
        color = COLORS.SHADOW;
        break;
      default:
        color = COLORS.NIGHT;
    }
    
    ctx.fillStyle = colorToHex(color);
    ctx.fillRect(x, y, tileSize, tileSize);
    
    // Add subtle texture for walls
    if (type === 1) {
      ctx.fillStyle = colorToHex(COLORS.GRAY);
      ctx.fillRect(x, y, 1, tileSize);
      ctx.fillRect(x, y, tileSize, 1);
    }
  }

  static drawHealthBar(ctx: CanvasRenderingContext2D, x: number, y: number, 
                       width: number, height: number, ratio: number): void {
    // Background
    ctx.fillStyle = colorToHex(COLORS.BLACK);
    ctx.fillRect(x, y, width, height);
    
    // Fill
    const fillWidth = width * ratio;
    ctx.fillStyle = ratio > 0.5 ? '#00ff00' : ratio > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillRect(x, y, fillWidth, height);
    
    // Border
    ctx.strokeStyle = colorToHex(COLORS.WHITE);
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
  }

  static drawButton(ctx: CanvasRenderingContext2D, x: number, y: number, 
                    width: number, height: number, text: string, 
                    pressed: boolean = false): void {
    const offset = pressed ? 1 : 0;
    
    // Button background
    ctx.fillStyle = colorToHex(pressed ? COLORS.GRAY : COLORS.WHITE);
    ctx.fillRect(x + offset, y + offset, width, height);
    
    // Button shadow
    if (!pressed) {
      ctx.fillStyle = colorToHex(COLORS.BLACK);
      ctx.fillRect(x + 2, y + 2, width, height);
    }
    
    // Button text
    ctx.fillStyle = colorToHex(COLORS.BLACK);
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + width/2 + offset, y + height/2 + 3 + offset);
  }
}