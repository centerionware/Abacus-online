import { AbacusEngine } from './services/abacusEngine';
import { AbacusStyle, AbacusScheme } from './types';

// Scheme Definitions
const SCHEMES: Record<AbacusStyle, AbacusScheme> = {
  [AbacusStyle.SOROBAN]: {
    id: AbacusStyle.SOROBAN,
    name: 'Soroban',
    rods: 13,
    orientation: 'vertical',
    placeValue: true,
    beadShape: 'bicone',
    beadColor: '#8B4513',
    frameColor: '#1a1a1a',
    rodColor: '#e5e7eb',
    beamColor: '#e5e7eb',
    groups: [
      { count: 1, value: 5, position: 'top', color: '#3b82f6' },
      { 
        count: 4, 
        value: 1, 
        position: 'bottom',
        colors: ['#22c55e', '#eab308', '#f97316', '#ef4444']
      }
    ]
  },
  [AbacusStyle.SUANPAN]: {
    id: AbacusStyle.SUANPAN,
    name: 'Suanpan',
    rods: 13,
    orientation: 'vertical',
    placeValue: true,
    beadShape: 'oval',
    beadColor: '#4b5563',
    frameColor: '#78350f',
    rodColor: '#fde68a',
    beamColor: '#fde68a',
    groups: [
      { count: 2, value: 5, position: 'top' },
      { count: 5, value: 1, position: 'bottom' }
    ]
  },
  [AbacusStyle.SCHOOL]: {
    id: AbacusStyle.SCHOOL,
    name: 'School',
    rods: 10,
    orientation: 'horizontal',
    placeValue: false,
    beadShape: 'round',
    beadColor: '#dc2626',
    frameColor: '#f3f4f6',
    rodColor: '#9ca3af',
    groups: [
      { 
        count: 10, 
        value: 1, 
        position: 'row', 
        colors: ['#dc2626', '#ffffff']
      }
    ]
  }
};

interface AbacusOptions {
  style?: AbacusStyle;
  decimals?: number;
  showUI?: boolean;
}

class AbacusApp {
  private container: HTMLElement;
  private engine!: AbacusEngine;
  
  private currentStyle: AbacusStyle;
  private decimalPlaces: number;
  private showUI: boolean;
  private total: number = 0;

  private totalDisplay: HTMLElement | null = null;
  private styleSelect: HTMLSelectElement | null = null;
  private decimalSelect: HTMLSelectElement | null = null;
  private decimalContainer: HTMLElement | null = null;
  private canvas!: HTMLCanvasElement;

  constructor(container: HTMLElement, options: AbacusOptions = {}) {
    this.container = container;
    
    // Config from options or data attributes
    const dataStyle = container.getAttribute('data-style')?.toUpperCase();
    this.currentStyle = (dataStyle as AbacusStyle) || options.style || AbacusStyle.SOROBAN;
    
    const dataDecimals = container.getAttribute('data-decimals');
    this.decimalPlaces = dataDecimals ? parseInt(dataDecimals) : (options.decimals ?? 0);
    
    const dataUI = container.getAttribute('data-ui');
    this.showUI = dataUI !== null ? dataUI === 'true' : (options.showUI ?? true);

    this.initUI();
    this.initEngine();
    this.attachEvents();
  }

  private initUI() {
    if (this.showUI) {
      this.container.innerHTML = `
        <div class="abacus-instance flex flex-col h-full w-full bg-slate-50 text-slate-900 overflow-hidden no-select border border-slate-200 rounded-lg shadow-sm">
          <header class="flex-none p-3 sm:p-4 bg-white shadow-sm border-b border-slate-200 z-10 flex flex-wrap items-center justify-between gap-y-3 gap-x-4">
            <div class="flex flex-wrap items-center gap-3 sm:gap-4">
              <h1 class="text-lg sm:text-xl font-bold tracking-tight text-slate-800 hidden xs:block">
                Abacus<span class="text-blue-600">.js</span>
              </h1>
              
              <div class="flex items-center gap-2">
                <select class="style-select bg-slate-100 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none">
                  ${Object.values(SCHEMES).map(s => `<option value="${s.id}" ${s.id === this.currentStyle ? 'selected' : ''}>${s.name}</option>`).join('')}
                </select>
                
                <div class="decimal-container flex items-center gap-1 sm:gap-2 px-1 sm:px-2 border-l border-slate-200 ml-1 sm:ml-2">
                    <label class="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase hidden sm:inline-block">Decimals</label>
                    <select class="decimal-select bg-slate-100 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none w-14 sm:w-16">
                        ${[0, 1, 2, 3, 4].map(d => `<option value="${d}" ${d === this.decimalPlaces ? 'selected' : ''}>${d}</option>`).join('')}
                    </select>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3 sm:gap-6 ml-auto sm:ml-0">
               <div class="flex flex-col items-end">
                 <span class="text-[10px] sm:text-xs uppercase font-semibold text-slate-400">Total</span>
                 <span class="total-display text-2xl sm:text-3xl font-mono font-bold text-slate-900 leading-none">0</span>
               </div>
               <button class="reset-btn px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm sm:text-base rounded-md font-medium transition-colors shadow-sm active:translate-y-0.5">
                 Reset
               </button>
            </div>
          </header>

          <main class="flex-1 w-full relative overflow-hidden bg-slate-200 p-2 sm:p-4 md:p-8">
            <div class="w-full h-full relative bg-white rounded-lg sm:rounded-xl shadow-xl overflow-hidden border border-slate-300">
                <canvas class="abacus-canvas w-full h-full block cursor-pointer touch-none"></canvas>
            </div>
          </main>
          
          <footer class="flex-none p-2 text-center text-[10px] sm:text-xs text-slate-400 bg-slate-50 border-t border-slate-200">
            Touch and drag beads to move.
          </footer>
        </div>
      `;
      this.totalDisplay = this.container.querySelector('.total-display');
      this.styleSelect = this.container.querySelector('.style-select');
      this.decimalSelect = this.container.querySelector('.decimal-select');
      this.decimalContainer = this.container.querySelector('.decimal-container');
      this.canvas = this.container.querySelector('.abacus-canvas') as HTMLCanvasElement;
    } else {
      // Minimal mode: Just the canvas filling the container
      this.container.style.position = 'relative';
      this.container.innerHTML = `<canvas class="abacus-canvas w-full h-full block cursor-pointer touch-none"></canvas>`;
      this.canvas = this.container.querySelector('.abacus-canvas') as HTMLCanvasElement;
    }
  }

  private initEngine() {
    this.engine = new AbacusEngine(this.canvas, (total) => {
      this.total = total;
      this.updateTotalDisplay();
      // Emit a custom event so parent applications can listen to the total
      this.container.dispatchEvent(new CustomEvent('abacus:change', { detail: { total } }));
    });
    
    this.engine.init(SCHEMES[this.currentStyle]);
    this.engine.setDecimalPlaces(this.decimalPlaces);
    this.updateControlsVisibility();
    this.updateTotalDisplay();
  }

  private attachEvents() {
    this.styleSelect?.addEventListener('change', (e) => {
      this.currentStyle = (e.target as HTMLSelectElement).value as AbacusStyle;
      this.engine.setScheme(SCHEMES[this.currentStyle]);
      this.updateControlsVisibility();
    });

    this.decimalSelect?.addEventListener('change', (e) => {
      this.decimalPlaces = Number((e.target as HTMLSelectElement).value);
      this.engine.setDecimalPlaces(this.decimalPlaces);
      this.updateTotalDisplay();
    });

    this.container.querySelector('.reset-btn')?.addEventListener('click', () => {
      this.engine.reset();
    });

    window.addEventListener('resize', () => {
      this.engine.resize(this.canvas.clientWidth, this.canvas.clientHeight);
    });
    
    setTimeout(() => this.engine.resize(this.canvas.clientWidth, this.canvas.clientHeight), 50);
  }

  private updateControlsVisibility() {
    if (!this.decimalContainer) return;
    const scheme = SCHEMES[this.currentStyle];
    if (scheme.placeValue) {
      this.decimalContainer.classList.remove('hidden');
    } else {
      this.decimalContainer.classList.add('hidden');
    }
  }

  private updateTotalDisplay() {
    if (!this.totalDisplay) return;
    this.totalDisplay.textContent = this.total.toLocaleString(undefined, {
      minimumFractionDigits: this.decimalPlaces,
      maximumFractionDigits: this.decimalPlaces
    });
  }
}

// Global API
const InteractiveAbacus = {
  /**
   * Manual initialization for a specific element.
   */
  create: (selector: string, options: AbacusOptions = {}) => {
    const el = document.querySelector(selector);
    if (el) return new AbacusApp(el as HTMLElement, options);
    console.warn('[Abacus.js] Target not found:', selector);
  },

  /**
   * Scan the entire document for elements with the 'abacus-js' class and auto-init them.
   */
  initAll: () => {
    const elements = document.querySelectorAll('.abacus-js');
    elements.forEach(el => {
      // Avoid double initialization
      if ((el as any)._abacusInitialized) return;
      new AbacusApp(el as HTMLElement);
      (el as any)._abacusInitialized = true;
    });
  }
};

(window as any).InteractiveAbacus = InteractiveAbacus;
(window as any).createAbacus = InteractiveAbacus.create; // Backward compatibility

// Auto-init on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', InteractiveAbacus.initAll);
} else {
  InteractiveAbacus.initAll();
}

// Also auto-init #root for development environment
if (document.getElementById('root')) {
  InteractiveAbacus.create('#root');
}
