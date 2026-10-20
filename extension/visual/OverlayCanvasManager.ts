/**
 * Extension Visual Layer - Overlay Canvas Manager (Checkpoint 86)
 * Safely creates, mounts, resizes, and tears down the transparent HTML5 chart overlay canvas.
 * Implements passive ResizeObserver, high-DPI scaling, duplicate prevention, and zero-size safety.
 * STRICTLY NON-EXECUTING: Zero order controls or trading UI interactions.
 */

import { CanvasRenderer } from './CanvasRenderer';
import { CoordinateTranslator } from './CoordinateTranslator';

export interface OverlayManagerOptions {
  canvasId?: string;
  dpr?: number;
  onResize?: (width: number, height: number, dpr: number) => void;
  debug?: boolean;
}

export class OverlayCanvasManager {
  private canvas: HTMLCanvasElement | null = null;
  private renderer: CanvasRenderer | null = null;
  private translator: CoordinateTranslator | null = null;
  private container: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private isInitialized: boolean = false;
  private currentDpr: number = 1;
  private canvasId: string = 'ict-canvas-overlay';
  private onResizeCallback?: (width: number, height: number, dpr: number) => void;

  constructor(options?: OverlayManagerOptions) {
    if (options?.canvasId) this.canvasId = options.canvasId;
    if (options?.onResize) this.onResizeCallback = options.onResize;
  }

  /**
   * Resolves the TradeSea / TradingView chart container element safely.
   */
  public static resolveChartContainer(): HTMLElement {
    if (typeof document === 'undefined') return null as any;

    // A. Check for TradingView chart iframe parent
    const iframe = document.querySelector('iframe[id^="tradingview_"]') ||
                   document.querySelector('iframe[src*="tradingview"]');
    if (iframe && iframe.parentElement) {
      return iframe.parentElement as HTMLElement;
    }

    // B. Check for TradingView Side Toolbar container
    const tvToolbar = document.querySelector('.tv-side-toolbar');
    if (tvToolbar && tvToolbar.parentElement) {
      return tvToolbar.parentElement as HTMLElement;
    }

    // C. Check for common chart container selectors
    const classCandidates = [
      '.chart-container',
      '[class*="chart-container"]',
      '.chart-gui-wrapper',
      '[class*="chartWrapper"]',
      '[class*="chart-pane"]',
      '.layout__area--center',
    ];
    for (const sel of classCandidates) {
      try {
        const el = document.querySelector(sel) as HTMLElement;
        if (el && el.clientWidth > 200 && el.clientHeight > 150) {
          return el;
        }
      } catch (_) {}
    }

    // D. Check for the largest canvas on page (excluding our overlay canvas)
    try {
      if (typeof document.querySelectorAll === 'function') {
        const canvases = Array.from(document.querySelectorAll('canvas')).filter(
          (c) => c.id !== 'ict-canvas-overlay' && c.clientWidth > 250 && c.clientHeight > 150
        );
        if (canvases.length > 0) {
          canvases.sort((a, b) => (b.clientWidth * b.clientHeight) - (a.clientWidth * a.clientHeight));
          if (canvases[0].parentElement) {
            return canvases[0].parentElement as HTMLElement;
          }
        }
      }
    } catch (_) {}

    return (document.querySelector('.chart-container') as HTMLElement) ||
           (document.querySelector('[class*="chart-container"]') as HTMLElement) ||
           (document.querySelector('iframe[id^="tradingview_"]')?.parentElement as HTMLElement) ||
           document.body;
  }

  /**
   * Initializes the overlay canvas, attaches renderer, and starts passive resize observation.
   * Safe against missing containers, repeated initialization, and zero-sized containers.
   */
  public initialize(
    targetContainer?: HTMLElement | null,
    options?: OverlayManagerOptions
  ): { canvas: HTMLCanvasElement; renderer: CanvasRenderer; translator: CoordinateTranslator } | null {
    if (typeof document === 'undefined') return null;

    if (options?.onResize) this.onResizeCallback = options.onResize;

    // 1. Resolve container safely without touching trading controls
    const container =
      targetContainer ||
      OverlayCanvasManager.resolveChartContainer();

    this.container = container;

    // Ensure non-static position on container if not body
    if (container !== document.body && typeof window !== 'undefined') {
      try {
        const pos = window.getComputedStyle ? window.getComputedStyle(container).position : container.style.position;
        if (pos === 'static') {
          container.style.position = 'relative';
        }
      } catch (_) {}
    }

    // 2. Prevent duplicate canvases or redundant initialization
    const existingCanvas = document.getElementById(this.canvasId) as HTMLCanvasElement | null;
    if (existingCanvas && this.isInitialized && this.canvas === existingCanvas && this.renderer && this.translator) {
      return { canvas: this.canvas, renderer: this.renderer, translator: this.translator };
    }

    let canvas: HTMLCanvasElement;
    if (existingCanvas) {
      canvas = existingCanvas;
    } else {
      canvas = document.createElement('canvas');
      canvas.id = this.canvasId;
      container.appendChild(canvas);
    }
    this.canvas = canvas;

    // Apply strictly non-interactive, transparent overlay styling
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';

    // 3. Resolve devicePixelRatio safely
    const dpr = options?.dpr ?? (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
    this.currentDpr = dpr > 0 && isFinite(dpr) ? dpr : 1;

    // 4. Instantiate Translator and Renderer
    if (!this.translator) {
      this.translator = new CoordinateTranslator();
    }
    if (!this.renderer) {
      this.renderer = new CanvasRenderer(canvas, this.translator);
      this.renderer.setDpr(this.currentDpr);
      this.renderer.startAnimationLoop();
    }

    // 5. Initial dimension synchronization (handling zero-sized container safely)
    const clientW = container ? container.clientWidth : 800;
    const clientH = container ? container.clientHeight : 600;
    this.syncDimensions(clientW, clientH);

    // 6. Setup passive ResizeObserver if supported in environment
    this.setupResizeObserver(container);

    this.isInitialized = true;
    return { canvas: this.canvas, renderer: this.renderer, translator: this.translator };
  }

  /**
   * Reattaches the canvas to the TradeSea chart container if it became available after initial load.
   */
  public reattachToChartIfAvailable(): boolean {
    if (typeof document === 'undefined' || !this.canvas) return false;
    const bestContainer = OverlayCanvasManager.resolveChartContainer();
    if (bestContainer && bestContainer !== this.container && bestContainer !== document.body) {
      try {
        if (this.canvas.parentElement) {
          this.canvas.parentElement.removeChild(this.canvas);
        }
        bestContainer.appendChild(this.canvas);
        this.container = bestContainer;
        if (typeof window !== 'undefined') {
          const pos = window.getComputedStyle ? window.getComputedStyle(bestContainer).position : bestContainer.style.position;
          if (pos === 'static') {
            bestContainer.style.position = 'relative';
          }
        }
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.setupResizeObserver(bestContainer);
        this.syncDimensions(bestContainer.clientWidth, bestContainer.clientHeight);
        return true;
      } catch (_) {}
    }
    return false;
  }

  /**
   * Synchronizes canvas drawing-buffer dimensions and CSS layout dimensions with container.
   * Handles DPR scaling without double-scaling or distortion.
   */
  public syncDimensions(clientWidth: number, clientHeight: number): void {
    if (!this.canvas || !this.renderer) return;

    // Handle zero-sized or temporarily hidden containers gracefully without throwing
    if (clientWidth <= 0 || clientHeight <= 0) {
      return;
    }

    // If mounted on body, align directly to the largest chart canvas bounding box
    if (this.container === document.body && typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') {
      try {
        const canvases = Array.from(document.querySelectorAll('canvas')).filter(
          (c) => c.id !== this.canvasId && c.clientWidth > 250 && c.clientHeight > 150
        );
        if (canvases.length > 0) {
          canvases.sort((a, b) => (b.clientWidth * b.clientHeight) - (a.clientWidth * a.clientHeight));
          const rect = canvases[0].getBoundingClientRect();
          this.canvas.style.position = 'fixed';
          this.canvas.style.top = `${rect.top}px`;
          this.canvas.style.left = `${rect.left}px`;
          clientWidth = rect.width;
          clientHeight = rect.height;
        }
      } catch (_) {}
    }

    const safeW = Math.max(1, Math.round(clientWidth));
    const safeH = Math.max(1, Math.round(clientHeight));

    // Update canvas buffer and CSS dimensions
    const targetBufferW = Math.round(safeW * this.currentDpr);
    const targetBufferH = Math.round(safeH * this.currentDpr);

    if (this.canvas.width !== targetBufferW || this.canvas.height !== targetBufferH) {
      this.canvas.width = targetBufferW;
      this.canvas.height = targetBufferH;
    }
    this.canvas.style.width = `${safeW}px`;
    this.canvas.style.height = `${safeH}px`;

    // Propagate dimensions to renderer and translator
    const currentBounds = this.renderer.getTranslator().getViewport();
    this.renderer.updateViewport(
      safeW,
      safeH,
      currentBounds.minPrice,
      currentBounds.maxPrice,
      currentBounds.firstCandleIndex,
      currentBounds.lastCandleIndex,
      this.currentDpr
    );

    if (this.onResizeCallback) {
      this.onResizeCallback(safeW, safeH, this.currentDpr);
    }
  }

  private setupResizeObserver(container: HTMLElement): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (typeof ResizeObserver !== 'undefined') {
      try {
        this.resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            this.syncDimensions(width, height);
          }
        });
        this.resizeObserver.observe(container);
      } catch (e) {
        // Safe catch if ResizeObserver fails in restricted environments
      }
    }
  }

  /**
   * Cleans up observers, stops renderer animation loop, and removes canvas from DOM.
   */
  public cleanup(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.renderer) {
      this.renderer.stopAnimationLoop();
      this.renderer.clear();
      this.renderer = null;
    }

    if (this.canvas) {
      if (this.canvas.parentElement) {
        this.canvas.parentElement.removeChild(this.canvas);
      }
      this.canvas = null;
    }

    this.translator = null;
    this.container = null;
    this.isInitialized = false;
  }

  public getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  public getRenderer(): CanvasRenderer | null {
    return this.renderer;
  }

  public getTranslator(): CoordinateTranslator | null {
    return this.translator;
  }

  public getContainer(): HTMLElement | null {
    return this.container;
  }

  public getDpr(): number {
    return this.currentDpr;
  }

  public isAttached(): boolean {
    return this.isInitialized && this.canvas !== null && this.canvas.isConnected;
  }
}
