// UI rendering with improved canvas fonts and enhanced storytelling
import { colorToHex } from './util.js';
import { COLORS } from './sprite.js';

export class UI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  // Draw text using canvas font rendering for better readability
  drawText(x: number, y: number, text: string, color: number = COLORS.WHITE, 
           size: number = 12, centered: boolean = false, font: string = 'monospace'): void {
    this.ctx.font = `${size}px ${font}`;
    this.ctx.fillStyle = colorToHex(color);
    this.ctx.textAlign = centered ? 'center' : 'left';
    this.ctx.fillText(text, x, y);
  }

  // Draw outlined text for better visibility
  drawOutlinedText(x: number, y: number, text: string, color: number = COLORS.WHITE,
                   outlineColor: number = COLORS.BLACK, size: number = 12, 
                   centered: boolean = false, font: string = 'monospace'): void {
    this.ctx.font = `${size}px ${font}`;
    this.ctx.textAlign = centered ? 'center' : 'left';
    
    // Draw outline
    this.ctx.strokeStyle = colorToHex(outlineColor);
    this.ctx.lineWidth = 2;
    this.ctx.strokeText(text, x, y);
    
    // Draw main text
    this.ctx.fillStyle = colorToHex(color);
    this.ctx.fillText(text, x, y);
  }

  // Draw enhanced title screen with story
  drawTitleScreen(width: number, height: number, seed: number): void {
    // Clear screen with night background
    this.ctx.fillStyle = colorToHex(COLORS.NIGHT);
    this.ctx.fillRect(0, 0, width, height);
    
    // Title
    this.drawOutlinedText(width / 2, 35, 'Nine Lives: Shadow Alley', COLORS.CANDLE, COLORS.BLACK, 16, true);
    
    // Cat silhouette - larger and more detailed
    this.ctx.fillStyle = colorToHex(COLORS.BLACK);
    this.ctx.fillRect(width / 2 - 12, 50, 24, 18);
    // Ears
    this.ctx.fillRect(width / 2 - 10, 45, 4, 8);
    this.ctx.fillRect(width / 2 + 6, 45, 4, 8);
    // Eyes
    this.ctx.fillStyle = colorToHex(COLORS.CYAN);
    this.ctx.fillRect(width / 2 - 7, 55, 2, 2);
    this.ctx.fillRect(width / 2 + 5, 55, 2, 2);
    // Tail
    this.ctx.fillStyle = colorToHex(COLORS.BLACK);
    const tailSway = 2 * Math.sin(Date.now() * 0.003);
    this.ctx.fillRect(width / 2 + 12, 60 + tailSway, 8, 3);
    
    // Story introduction
    this.drawText(width / 2, 85, 'You are Luna, a mystical black cat', COLORS.WHITE, 11, true);
    this.drawText(width / 2, 97, 'prowling the shadowy alleys at midnight.', COLORS.WHITE, 11, true);
    this.drawText(width / 2, 113, 'Ancient starlight shards have fallen', COLORS.CYAN, 10, true);
    this.drawText(width / 2, 125, 'from the celestial realm above.', COLORS.CYAN, 10, true);
    
    // Controls section
    this.drawText(width / 2, 145, 'Controls:', COLORS.CANDLE, 12, true);
    this.drawText(width / 2, 160, 'Arrow Keys - Move through shadows', COLORS.WHITE, 10, true);
    this.drawText(width / 2, 172, 'Shift - Shadow dash (brief invisibility)', COLORS.WHITE, 10, true);
    this.drawText(width / 2, 184, 'Space - Use luck magic when charged', COLORS.CANDLE, 10, true);
    this.drawText(width / 2, 196, 'Z - Meow (stuns nearby guards)', COLORS.WHITE, 10, true);
    
    // Mission
    this.drawText(width / 2, 216, 'Stay hidden in the darkness.', COLORS.PURPLE, 11, true);
    this.drawText(width / 2, 228, 'Avoid the light and guard dogs.', COLORS.PURPLE, 11, true);
    this.drawText(width / 2, 240, 'Collect all starlight shards to win!', COLORS.CYAN, 11, true);
    
    // Seed display
    this.drawText(width / 2, 260, `World Seed: ${seed}`, COLORS.GRAY, 9, true);
    
    // Start prompt with enhanced animation
    const blink = Math.floor(Date.now() / 600) % 2;
    if (blink) {
      this.drawOutlinedText(width / 2, 280, 'Press any key to begin your quest...', 
        COLORS.WHITE, COLORS.BLACK, 12, true);
    }
  }

  // Draw enhanced game HUD
  drawHUD(width: number, height: number, lives: number, luck: number, 
          shards: number, time: number): void {
    // Lives display with hearts (top left)
    this.drawText(8, 18, `Lives: ${lives}`, COLORS.WHITE, 11);
    
    // Draw life indicator hearts
    for (let i = 0; i < Math.min(lives, 9); i++) {
      const heartX = 8 + i * 12;
      this.ctx.fillStyle = colorToHex(COLORS.WHITE);
      this.ctx.fillRect(heartX, 22, 2, 2);
    }
    
    // Luck meter with better labeling (top center)
    const luckWidth = 100;
    const luckHeight = 8;
    const luckX = (width - luckWidth) / 2;
    const luckY = 8;
    
    this.drawText(luckX - 45, 18, 'Luck Magic', COLORS.CANDLE, 10);
    
    // Luck meter background
    this.ctx.fillStyle = colorToHex(COLORS.BLACK);
    this.ctx.fillRect(luckX, luckY, luckWidth, luckHeight);
    
    // Luck meter fill
    this.ctx.fillStyle = colorToHex(COLORS.CANDLE);
    this.ctx.fillRect(luckX, luckY, luckWidth * luck, luckHeight);
    
    // Luck meter border
    this.ctx.strokeStyle = colorToHex(COLORS.WHITE);
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(luckX, luckY, luckWidth, luckHeight);
    
    // Shards collected with better description (top right)
    this.drawText(width - 100, 18, `Starlight: ${shards}`, COLORS.CYAN, 11);
    
    // Time display with better formatting (bottom right)
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    this.drawText(width - 80, height - 8, 
      `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`, COLORS.WHITE, 10);
    
    // Status indicator (bottom left)
    this.drawText(8, height - 8, 'Luna the Shadow Cat', COLORS.GRAY, 9);
  }

  // Draw enhanced game over screen with story
  drawGameOverScreen(width: number, height: number, score: number, 
                     time: number, seed: number, won: boolean): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, width, height);
    
    if (won) {
      // Victory screen
      this.drawOutlinedText(width / 2, 50, 'Quest Complete!', COLORS.CANDLE, COLORS.BLACK, 18, true);
      
      // Cat with glow effect
      this.ctx.fillStyle = colorToHex(COLORS.BLACK);
      this.ctx.fillRect(width / 2 - 10, 65, 20, 15);
      this.ctx.fillStyle = colorToHex(COLORS.CANDLE);
      this.ctx.fillRect(width / 2 - 6, 70, 2, 2);
      this.ctx.fillRect(width / 2 + 4, 70, 2, 2);
      
      // Victory story
      this.drawText(width / 2, 95, 'Luna has gathered all the fallen starlight!', COLORS.WHITE, 11, true);
      this.drawText(width / 2, 107, 'The celestial magic flows through her', COLORS.CYAN, 10, true);
      this.drawText(width / 2, 119, 'midnight fur, restoring balance to the', COLORS.CYAN, 10, true);
      this.drawText(width / 2, 131, 'realm between worlds.', COLORS.CYAN, 10, true);
      
      this.drawText(width / 2, 150, 'The shadows whisper your legend...', COLORS.PURPLE, 11, true);
    } else {
      // Defeat screen
      this.drawOutlinedText(width / 2, 50, 'Luna Has Fallen', COLORS.WHITE, COLORS.BLACK, 18, true);
      
      // Defeated cat
      this.ctx.fillStyle = colorToHex(COLORS.BLACK);
      this.ctx.fillRect(width / 2 - 10, 65, 20, 15);
      this.ctx.fillStyle = colorToHex(COLORS.CYAN);
      this.ctx.fillRect(width / 2 - 6, 70, 2, 2);
      this.ctx.fillRect(width / 2 + 4, 70, 2, 2);
      
      // Defeat story
      this.drawText(width / 2, 95, 'The alley guards have caught Luna.', COLORS.WHITE, 11, true);
      this.drawText(width / 2, 107, 'But a cat with nine lives never', COLORS.WHITE, 10, true);
      this.drawText(width / 2, 119, 'truly dies...', COLORS.WHITE, 10, true);
      
      this.drawText(width / 2, 138, 'Try again to complete the quest!', COLORS.PURPLE, 11, true);
    }
    
    // Score and statistics
    this.drawText(width / 2, 165, `Final Score: ${score}`, COLORS.WHITE, 12, true);
    
    // Time
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    this.drawText(width / 2, 180, 
      `Quest Time: ${minutes}:${seconds.toString().padStart(2, '0')}`, COLORS.WHITE, 11, true);
    
    // Seed
    this.drawText(width / 2, 195, `World Seed: ${seed}`, COLORS.GRAY, 10, true);
    
    // Restart options with animation
    const blink = Math.floor(Date.now() / 700) % 2;
    if (blink) {
      this.drawText(width / 2, 220, 'Press R - Try this world again', COLORS.WHITE, 11, true);
      this.drawText(width / 2, 235, 'Press N - Generate new world', COLORS.WHITE, 11, true);
    }
  }

  // Draw enhanced pause screen
  drawPauseScreen(width: number, height: number): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, width, height);
    
    this.drawOutlinedText(width / 2, height / 2 - 10, 'Game Paused', COLORS.WHITE, COLORS.BLACK, 18, true);
    this.drawText(width / 2, height / 2 + 15, 'Luna rests in the shadows...', COLORS.GRAY, 11, true);
    this.drawText(width / 2, height / 2 + 35, 'Press P to resume your quest', COLORS.WHITE, 12, true);
  }

  // Draw enhanced loading screen
  drawLoadingScreen(width: number, height: number, progress: number): void {
    this.ctx.fillStyle = colorToHex(COLORS.NIGHT);
    this.ctx.fillRect(0, 0, width, height);
    
    this.drawText(width / 2, height / 2 - 30, 'Summoning Luna...', COLORS.WHITE, 14, true);
    this.drawText(width / 2, height / 2 - 10, 'The mystical alley awaits', COLORS.GRAY, 11, true);
    
    // Enhanced progress bar
    const barWidth = 120;
    const barHeight = 8;
    const barX = (width - barWidth) / 2;
    const barY = height / 2 + 10;
    
    this.ctx.fillStyle = colorToHex(COLORS.BLACK);
    this.ctx.fillRect(barX, barY, barWidth, barHeight);
    
    this.ctx.fillStyle = colorToHex(COLORS.CANDLE);
    this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    
    this.ctx.strokeStyle = colorToHex(COLORS.WHITE);
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // Percentage
    this.drawText(width / 2, height / 2 + 35, `${Math.floor(progress * 100)}%`, COLORS.WHITE, 10, true);
  }

  // Draw enhanced accessibility options
  drawAccessibilityToggle(width: number, height: number, highContrast: boolean): void {
    const text = highContrast ? 'High Contrast: Enabled' : 'High Contrast: Disabled';
    this.drawText(8, height - 30, text, COLORS.GRAY, 9);
    this.drawText(8, height - 18, 'Press C to toggle contrast mode', COLORS.GRAY, 9);
  }

  // Clear screen with background color
  clear(width: number, height: number, color: number = COLORS.NIGHT): void {
    this.ctx.fillStyle = colorToHex(color);
    this.ctx.fillRect(0, 0, width, height);
  }

  // Draw story introduction screen
  drawStoryIntro(width: number, height: number, progress: number): void {
    this.ctx.fillStyle = colorToHex(COLORS.NIGHT);
    this.ctx.fillRect(0, 0, width, height);
    
    // Title
    this.drawOutlinedText(width / 2, 40, 'The Legend of Luna', COLORS.CANDLE, COLORS.BLACK, 16, true);
    
    // Story text that appears progressively
    const storyLines = [
      { text: 'In the depths of midnight, when the veil between', color: COLORS.WHITE, delay: 0 },
      { text: 'worlds grows thin, ancient starlight falls from', color: COLORS.WHITE, delay: 1 },
      { text: 'the celestial realm above.', color: COLORS.WHITE, delay: 2 },
      { text: '', color: COLORS.WHITE, delay: 3 },
      { text: 'Luna, a mystical black cat blessed with nine lives,', color: COLORS.CYAN, delay: 4 },
      { text: 'prowls the shadowed alleys where few dare to tread.', color: COLORS.CYAN, delay: 5 },
      { text: '', color: COLORS.WHITE, delay: 6 },
      { text: 'The fallen starlight holds the power to restore', color: COLORS.PURPLE, delay: 7 },
      { text: 'balance between the mortal and spirit worlds.', color: COLORS.PURPLE, delay: 8 },
      { text: '', color: COLORS.WHITE, delay: 9 },
      { text: 'But the alley is guarded by watchful hounds', color: COLORS.WHITE, delay: 10 },
      { text: 'and piercing lantern light that reveals all.', color: COLORS.WHITE, delay: 11 },
      { text: '', color: COLORS.WHITE, delay: 12 },
      { text: 'Can Luna gather all the starlight shards', color: COLORS.CANDLE, delay: 13 },
      { text: 'before her nine lives are spent?', color: COLORS.CANDLE, delay: 14 }
    ];
    
    let yPos = 80;
    for (const line of storyLines) {
      if (progress > line.delay) {
        this.drawText(width / 2, yPos, line.text, line.color, 11, true);
      }
      yPos += 16;
    }
    
    // Continue prompt
    if (progress > 15) {
      const blink = Math.floor(Date.now() / 800) % 2;
      if (blink) {
        this.drawText(width / 2, height - 30, 'Press any key to begin...', COLORS.WHITE, 12, true);
      }
    }
  }
}