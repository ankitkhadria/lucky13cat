// Input handling for keyboard and touch
export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  dash: boolean;
  luck: boolean;
  meow: boolean;
}

export class Input {
  private keys: { [key: string]: boolean } = {};
  private touch: { x: number; y: number; active: boolean } = { x: 0, y: 0, active: false };
  private touchStart: { x: number; y: number; time: number } = { x: 0, y: 0, time: 0 };
  private canvas: HTMLCanvasElement;
  private rect: DOMRect;
  
  public state: InputState = {
    left: false, right: false, up: false, down: false,
    dash: false, luck: false, meow: false
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.rect = canvas.getBoundingClientRect();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Keyboard events
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      e.preventDefault();
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      e.preventDefault();
    });

    // Touch events
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const x = (touch.clientX - this.rect.left) / this.rect.width;
      const y = (touch.clientY - this.rect.top) / this.rect.height;
      this.touchStart = { x, y, time: Date.now() };
      this.touch = { x, y, active: true };
    });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (this.touch.active && e.touches[0]) {
        const touch = e.touches[0];
        this.touch.x = (touch.clientX - this.rect.left) / this.rect.width;
        this.touch.y = (touch.clientY - this.rect.top) / this.rect.height;
      }
    });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.touch.active = false;
      
      // Detect tap vs swipe
      const dt = Date.now() - this.touchStart.time;
      const dx = Math.abs(this.touch.x - this.touchStart.x);
      const dy = Math.abs(this.touch.y - this.touchStart.y);
      
      if (dt < 200 && dx < 0.1 && dy < 0.1) {
        // Quick tap - check touch UI areas
        this.handleTouchTap(this.touchStart.x, this.touchStart.y);
      }
    });

    // Prevent context menu on right click
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private handleTouchTap(x: number, y: number): void {
    // Touch UI layout (bottom corners)
    if (x > 0.8 && y > 0.8) {
      // Bottom right - luck button
      this.state.luck = true;
      setTimeout(() => this.state.luck = false, 100);
    } else if (x > 0.6 && y > 0.8) {
      // Bottom right-center - meow button  
      this.state.meow = true;
      setTimeout(() => this.state.meow = false, 100);
    }
  }

  update(): void {
    this.rect = this.canvas.getBoundingClientRect();

    // Keyboard input
    this.state.left = this.keys['ArrowLeft'] || this.keys['KeyA'];
    this.state.right = this.keys['ArrowRight'] || this.keys['KeyD'];
    this.state.up = this.keys['ArrowUp'] || this.keys['KeyW'];
    this.state.down = this.keys['ArrowDown'] || this.keys['KeyS'];
    this.state.dash = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    this.state.luck = this.state.luck || this.keys['Space'];
    this.state.meow = this.state.meow || this.keys['KeyZ'];

    // Touch directional input (virtual d-pad)
    if (this.touch.active) {
      const dx = this.touch.x - this.touchStart.x;
      const dy = this.touch.y - this.touchStart.y;
      const threshold = 0.05;

      if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
        this.state.left = dx < -threshold;
        this.state.right = dx > threshold;
        this.state.up = dy < -threshold;
        this.state.down = dy > threshold;
      }
    }
  }

  // Draw touch UI overlay
  drawTouchUI(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (!('ontouchstart' in window)) return;

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;

    // Virtual d-pad indicator (if touching)
    if (this.touch.active) {
      const x = this.touchStart.x * width;
      const y = this.touchStart.y * height;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Luck button (bottom right)
    const lx = width * 0.85;
    const ly = height * 0.85;
    ctx.fillRect(lx - 15, ly - 15, 30, 30);
    ctx.font = '12px monospace';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('L', lx, ly + 4);

    // Meow button 
    const mx = width * 0.7;
    const my = height * 0.85;
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(mx - 15, my - 15, 30, 30);
    ctx.fillStyle = 'white';
    ctx.fillText('M', mx, my + 4);
  }
}