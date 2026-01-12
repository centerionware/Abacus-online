import { AbacusScheme, AbacusStyle, BeadGroupConfig } from '../types';

// Constants
const ANIMATION_SPEED = 0.25; 
const BEAD_HEIGHT_RATIO = 0.65;
const BEAD_WIDTH_RATIO = 0.9;

class Bead {
  rodIndex: number;
  groupIndex: number; 
  index: number;      
  value: number;
  
  isActive: boolean = false;
  isHovered: boolean = false;
  pos: number = 0;       
  targetPos: number = 0; 

  x: number = 0;
  y: number = 0;
  w: number = 0;
  h: number = 0;
  color: string;

  inactiveX: number = 0;
  inactiveY: number = 0;
  activeX: number = 0;
  activeY: number = 0;

  constructor(rodIdx: number, groupIdx: number, idx: number, value: number, color: string) {
    this.rodIndex = rodIdx;
    this.groupIndex = groupIdx;
    this.index = idx;
    this.value = value;
    this.color = color;
  }

  update() {
    const diff = this.targetPos - this.pos;
    if (Math.abs(diff) < 0.001) {
      this.pos = this.targetPos;
    } else {
      this.pos += diff * ANIMATION_SPEED;
    }
  }

  updateRenderCoords() {
    this.x = this.inactiveX + (this.activeX - this.inactiveX) * this.pos;
    this.y = this.inactiveY + (this.activeY - this.inactiveY) * this.pos;
  }
}

class Rod {
  index: number;
  groups: Bead[][] = [];
  constructor(index: number) { this.index = index; }
}

interface CursorState {
  active: boolean;
  x: number;
  y: number;
  targetBead: Bead | null;
}

export class AbacusEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private scheme!: AbacusScheme;
  private rods: Rod[] = [];
  private requestRef: number | null = null;
  
  private decimalPlaces: number = 0;
  private cursor: CursorState = { active: false, x: 0, y: 0, targetBead: null };
  
  private width = 0;
  private height = 0;
  private framePadding = 20;
  private rodSpacingSize = 0;
  private beamY = 0;

  private onTotalChange: (total: number) => void;

  constructor(canvas: HTMLCanvasElement, onTotalChange: (t: number) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.onTotalChange = onTotalChange;
    
    this.handleStart = this.handleStart.bind(this);
    this.handleMove = this.handleMove.bind(this);
    this.handleEnd = this.handleEnd.bind(this);

    canvas.addEventListener('mousedown', (e) => this.handleStart(e.offsetX, e.offsetY));
    window.addEventListener('mousemove', (e) => {
      if (this.cursor.active) {
        const rect = canvas.getBoundingClientRect();
        this.handleMove(e.clientX - rect.left, e.clientY - rect.top);
      }
    });
    window.addEventListener('mouseup', this.handleEnd);

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      this.handleStart(touch.clientX - rect.left, touch.clientY - rect.top);
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (this.cursor.active) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.handleMove(touch.clientX - rect.left, touch.clientY - rect.top);
      }
    }, { passive: false });

    canvas.addEventListener('touchend', this.handleEnd);
  }

  init(scheme: AbacusScheme) {
    this.scheme = scheme;
    this.createBeads();
    this.resize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.startLoop();
  }

  setScheme(scheme: AbacusScheme) {
    this.scheme = scheme;
    this.createBeads();
    this.resize(this.width, this.height);
    this.notifyTotal();
  }

  setDecimalPlaces(places: number) {
    this.decimalPlaces = places;
    this.notifyTotal();
  }

  reset() {
    this.rods.forEach(rod => {
      rod.groups.forEach(group => {
        group.forEach(bead => {
          bead.isActive = false;
          bead.targetPos = 0;
        });
      });
    });
    this.notifyTotal();
  }

  destroy() {
    if (this.requestRef) cancelAnimationFrame(this.requestRef);
    window.removeEventListener('mouseup', this.handleEnd);
  }

  private createBeads() {
    this.rods = [];
    for (let i = 0; i < this.scheme.rods; i++) {
      const rod = new Rod(i);
      this.scheme.groups.forEach((groupConfig, gIdx) => {
        const group: Bead[] = [];
        for (let b = 0; b < groupConfig.count; b++) {
          let color = groupConfig.color || this.scheme.beadColor;
          if (groupConfig.colors && groupConfig.colors.length > 0) {
            if (groupConfig.colors.length === groupConfig.count) {
                color = groupConfig.colors[b];
            } else {
                if (b < 5) color = groupConfig.colors[0];
                else color = groupConfig.colors[1] || groupConfig.colors[0];
            }
          }
          const bead = new Bead(i, gIdx, b, groupConfig.value, color);
          group.push(bead);
        }
        rod.groups.push(group);
      });
      this.rods.push(rod);
    }
  }

  resize(w: number, h: number) {
    this.width = w;
    this.height = h;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.scale(dpr, dpr);
    
    this.framePadding = w < 400 ? 10 : 20;
    this.calculateLayout();
  }

  private calculateLayout() {
    const { orientation, groups } = this.scheme;
    const isVertical = orientation === 'vertical';
    const usableW = this.width - this.framePadding * 2;
    const usableH = this.height - this.framePadding * 2;

    if (isVertical) {
      this.rodSpacingSize = usableW / this.scheme.rods;
      const beadW = this.rodSpacingSize * BEAD_WIDTH_RATIO;
      const hasUpper = groups.some(g => g.position === 'top');
      const hasLower = groups.some(g => g.position === 'bottom');

      let upperH = 0;
      let lowerH = 0;
      let beamH = 0;
      
      if (hasUpper && hasLower) {
         beamH = 10;
         const splitRatio = this.scheme.id === AbacusStyle.SUANPAN ? 0.35 : 0.30;
         const availableH = usableH - beamH;
         upperH = availableH * splitRatio;
         lowerH = availableH * (1 - splitRatio);
         this.beamY = this.framePadding + upperH + beamH/2;
      } else {
        lowerH = usableH;
        this.beamY = this.framePadding; 
      }

      this.rods.forEach((rod, rIdx) => {
        const cx = this.framePadding + (rIdx * this.rodSpacingSize) + (this.rodSpacingSize / 2);
        rod.groups.forEach((group, gIdx) => {
          const config = groups[gIdx];
          const isTop = config.position === 'top';
          const count = group.length;
          const sectionH = isTop ? upperH : lowerH;
          const startY = isTop ? this.framePadding : (this.framePadding + upperH + beamH);
          const beadH = Math.min(beadW * 0.7, (sectionH / (count + 1.2))); 
          
          group.forEach((bead, bIdx) => {
            bead.w = beadW;
            bead.h = beadH;
            if (isTop) {
               bead.inactiveY = startY + (bIdx * beadH);
               const offsetFromBottom = (count - 1 - bIdx) * beadH;
               bead.activeY = (startY + sectionH) - beadH - offsetFromBottom;
            } else {
               bead.activeY = startY + (bIdx * beadH);
               const offsetFromBottom = (count - 1 - bIdx) * beadH;
               bead.inactiveY = (startY + sectionH) - beadH - offsetFromBottom;
            }
            bead.inactiveX = cx - beadW/2;
            bead.activeX = cx - beadW/2;
          });
        });
      });

    } else {
      this.rodSpacingSize = usableH / this.scheme.rods;
      const beadH = this.rodSpacingSize * 0.8;
      const beadW = Math.min(beadH, usableW / 15);

      this.rods.forEach((rod, rIdx) => {
        const cy = this.framePadding + (rIdx * this.rodSpacingSize) + (this.rodSpacingSize / 2);
        rod.groups.forEach((group, gIdx) => {
          const count = group.length;
          group.forEach((bead, bIdx) => {
            bead.h = beadH;
            bead.w = beadW;
            const yPos = cy - beadH/2;
            bead.activeY = yPos;
            bead.inactiveY = yPos;
            bead.activeX = this.framePadding + (bIdx * beadW);
            const offsetFromRight = (count - 1 - bIdx) * beadW;
            bead.inactiveX = (this.width - this.framePadding) - beadW - offsetFromRight;
          });
        });
      });
    }
    this.rods.forEach(r => r.groups.forEach(g => g.forEach(b => b.updateRenderCoords())));
  }

  private startLoop() {
    const loop = () => {
      this.update();
      this.draw();
      this.requestRef = requestAnimationFrame(loop);
    };
    this.requestRef = requestAnimationFrame(loop);
  }

  private update() {
    this.rods.forEach(r => r.groups.forEach(g => g.forEach(b => {
      b.update();
      b.updateRenderCoords();
    })));
  }

  private draw() {
    const { ctx, width, height } = this;
    ctx.fillStyle = this.scheme.frameColor;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#f1f5f9'; // Slightly off-white for contrast
    ctx.fillRect(this.framePadding, this.framePadding, width - this.framePadding*2, height - this.framePadding*2);

    ctx.lineWidth = 4;
    ctx.strokeStyle = this.scheme.rodColor;
    ctx.beginPath();
    this.rods.forEach(rod => {
      if (this.scheme.orientation === 'vertical') {
        const x = rod.groups[0][0].inactiveX + rod.groups[0][0].w / 2;
        ctx.moveTo(x, this.framePadding);
        ctx.lineTo(x, height - this.framePadding);
      } else {
        const y = rod.groups[0][0].inactiveY + rod.groups[0][0].h / 2;
        ctx.moveTo(this.framePadding, y);
        ctx.lineTo(width - this.framePadding, y);
      }
    });
    ctx.stroke();

    // Place value indicators (Unit marker and markers every 4 rods)
    const unitIdx = this.scheme.rods - 1 - this.decimalPlaces;
    if (unitIdx >= 0 && unitIdx < this.rods.length) {
        
        // Marker indices: unitIdx, unitIdx-4, unitIdx-8, etc.
        const markers = [];
        for (let i = unitIdx; i >= 0; i -= 4) {
            markers.push(i);
        }

        if (this.scheme.orientation === 'vertical' && this.beamY > 0) {
            // Draw the beam
            ctx.fillStyle = this.scheme.beamColor || '#333';
            ctx.fillRect(this.framePadding, this.beamY - 5, width - this.framePadding*2, 10);
            
            markers.forEach(idx => {
                const isUnit = idx === unitIdx;
                const rod = this.rods[idx];
                const x = rod.groups[0][0].inactiveX + rod.groups[0][0].w / 2;
                
                // HIGH CONTRAST MARKERS
                // Outer ring for definition
                ctx.strokeStyle = isUnit ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)';
                ctx.lineWidth = isUnit ? 1.5 : 1;
                ctx.beginPath();
                ctx.arc(x, this.beamY, isUnit ? 4.5 : 3.5, 0, Math.PI * 2);
                ctx.stroke();

                // Inner dot
                ctx.fillStyle = isUnit ? '#ffffff' : '#cbd5e1'; // White for unit, bright gray for others
                ctx.beginPath();
                ctx.arc(x, this.beamY, isUnit ? 3.5 : 2.5, 0, Math.PI * 2);
                ctx.fill();
            });
        } else if (this.scheme.orientation === 'horizontal') {
            markers.forEach(idx => {
                const isUnit = idx === unitIdx;
                const rod = this.rods[idx];
                const y = rod.groups[0][0].inactiveY + rod.groups[0][0].h / 2;
                
                // HIGH CONTRAST MARKERS FOR SIDE FRAME
                const dotSize = isUnit ? 5 : 3.5;
                ctx.fillStyle = isUnit ? '#475569' : '#94a3b8'; // Slate-600 for unit, Slate-400 for others
                
                // Left margin
                ctx.beginPath();
                ctx.arc(this.framePadding / 2, y, dotSize, 0, Math.PI * 2);
                ctx.fill();
                
                // Right margin
                ctx.beginPath();
                ctx.arc(this.width - this.framePadding / 2, y, dotSize, 0, Math.PI * 2);
                ctx.fill();
                
                // Optional stroke for unit
                if (isUnit) {
                   ctx.strokeStyle = '#1e293b';
                   ctx.lineWidth = 1;
                   ctx.stroke();
                }
            });
        }
    }

    this.rods.forEach(rod => rod.groups.forEach(group => group.forEach(bead => this.drawBead(bead))));
    if (this.cursor.active) this.drawCursor();
  }

  private drawBead(bead: Bead) {
    const ctx = this.ctx;
    const { x, y, w, h } = bead;
    ctx.fillStyle = bead.color;
    if (bead.isHovered) ctx.fillStyle = lightenColor(bead.color, 40);
    
    if (this.scheme.beadShape === 'round') {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, Math.min(w, h) / 2);
      ctx.fill();
    } else if (this.scheme.beadShape === 'bicone') {
      ctx.beginPath();
      ctx.moveTo(x, y + h*0.1); ctx.lineTo(x + w/2, y - h*0.1); ctx.lineTo(x + w, y + h*0.1);
      ctx.lineTo(x + w, y + h*0.9); ctx.lineTo(x + w/2, y + h*1.1); ctx.lineTo(x, y + h*0.9);
      ctx.closePath(); ctx.fill();
    } else {
      ctx.beginPath(); ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, Math.PI*2); ctx.fill();
    }

    // Border to ensure visibility against any background
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Shine/Depth
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath(); ctx.ellipse(x + w*0.3, y + h*0.3, w*0.1, h*0.1, 0, 0, Math.PI*2); ctx.fill();
  }

  private drawCursor() {
      const { x, y } = this.cursor;
      this.ctx.beginPath(); this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'; this.ctx.lineWidth = 2;
      this.ctx.arc(x, y, 25, 0, Math.PI * 2); this.ctx.stroke();
      this.ctx.fillStyle = 'rgba(0, 150, 255, 0.2)';
      this.ctx.beginPath(); this.ctx.arc(x, y, 20, 0, Math.PI * 2); this.ctx.fill();
  }

  private hitTest(x: number, y: number): Bead | null {
    const isVertical = this.scheme.orientation === 'vertical';
    for (const rod of this.rods) {
      const sample = rod.groups[0]?.[0];
      if (!sample) continue;

      const trackStart = this.framePadding + rod.index * this.rodSpacingSize;
      const trackEnd = trackStart + this.rodSpacingSize;
      if (isVertical) {
          if (x < trackStart || x > trackEnd) continue;
      } else {
          if (y < trackStart || y > trackEnd) continue;
      }

      for (const group of rod.groups) {
        for (const bead of group) {
           // Larger hit targets for touch (12px padding)
           if (x >= bead.x - 12 && x <= bead.x + bead.w + 12 &&
               y >= bead.y - 12 && y <= bead.y + bead.h + 12) {
             return bead;
           }
        }
      }
    }
    return null;
  }

  private handleStart(x: number, y: number) {
     this.cursor.active = true; this.cursor.x = x; this.cursor.y = y;
     this.checkBeamClear(x, y); this.updateCursorTarget();
  }

  private handleMove(x: number, y: number) {
      if (!this.cursor.active) return;
      this.cursor.x = x; this.cursor.y = y;
      if (this.checkBeamClear(x, y)) {
          this.cursor.targetBead = null; this.clearHovers();
      } else {
          this.updateCursorTarget();
      }
  }

  private checkBeamClear(x: number, y: number): boolean {
      if (this.scheme.orientation === 'vertical' && this.beamY > 0) {
          if (Math.abs(y - this.beamY) < 25) { 
              const rodIdx = Math.floor((x - this.framePadding) / this.rodSpacingSize);
              if (rodIdx >= 0 && rodIdx < this.rods.length) { this.clearRod(rodIdx); return true; }
          }
      }
      return false;
  }

  private clearRod(rodIdx: number) {
    const rod = this.rods[rodIdx];
    let changed = false;
    rod.groups.forEach(g => g.forEach(b => { if (b.isActive) { b.isActive = false; b.targetPos = 0; changed = true; } }));
    if (changed) this.notifyTotal();
  }

  private handleEnd() {
      if (!this.cursor.active) return;
      if (this.cursor.targetBead) {
          const bead = this.cursor.targetBead;
          this.interactBead(bead, this.rods[bead.rodIndex], this.rods[bead.rodIndex].groups[bead.groupIndex]);
      }
      this.cursor.active = false; this.clearHovers(); this.cursor.targetBead = null;
  }

  private updateCursorTarget() {
      const bead = this.hitTest(this.cursor.x, this.cursor.y);
      if (bead !== this.cursor.targetBead) {
          this.clearHovers(); this.cursor.targetBead = bead;
          if (bead) bead.isHovered = true;
      }
  }

  private clearHovers() {
      this.rods.forEach(r => r.groups.forEach(g => g.forEach(b => b.isHovered = false)));
  }

  private interactBead(target: Bead, rod: Rod, group: Bead[]) {
    const isVertical = this.scheme.orientation === 'vertical';
    const isTopGroup = target.groupIndex === 0 && isVertical && this.scheme.groups.length > 1;
    const newActiveState = !target.isActive;
    
    if (this.scheme.id === AbacusStyle.SCHOOL) {
      if (newActiveState) {
        for (let i = 0; i <= target.index; i++) this.setBeadState(group[i], true);
      } else {
        for (let i = target.index; i < group.length; i++) this.setBeadState(group[i], false);
      }
    } else if (isTopGroup) {
      if (newActiveState) {
        for (let i = target.index; i < group.length; i++) this.setBeadState(group[i], true);
      } else {
        for (let i = 0; i <= target.index; i++) this.setBeadState(group[i], false);
      }
    } else {
      if (newActiveState) {
        for (let i = 0; i <= target.index; i++) this.setBeadState(group[i], true);
      } else {
        for (let i = target.index; i < group.length; i++) this.setBeadState(group[i], false);
      }
    }
    this.notifyTotal();
  }

  private setBeadState(bead: Bead, active: boolean) {
    bead.isActive = active; bead.targetPos = active ? 1 : 0;
  }

  private notifyTotal() {
    let total = 0;
    this.rods.forEach((rod, rIdx) => {
      let rodVal = 0;
      rod.groups.forEach(group => group.forEach(bead => { if (bead.isActive) rodVal += bead.value; }));
      if (this.scheme.placeValue) {
        const power = (this.scheme.rods - 1 - this.decimalPlaces) - rIdx;
        total += rodVal * Math.pow(10, power);
      } else {
        total += rodVal;
      }
    });
    if (this.decimalPlaces > 0) {
        const factor = Math.pow(10, this.decimalPlaces);
        total = Math.round(total * factor) / factor;
    }
    this.onTotalChange(total);
  }
}

function lightenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace("#",""),16), amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt, G = (num >> 8 & 0x00FF) + amt, B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
}
