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
      (document.querySelector('.chart-container') as HTMLElement) ||
      (document.querySelector('[class*="chart-container"]') as HTMLElement) ||
      (document.querySelector('iframe[id^="tradingview_"]')?.parentElement as HTMLElement) ||
      document.body;

    this.container = container;

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
   * Synchronizes canvas drawing-buffer dimensions and CSS layout dimensions with container.
   * Handles DPR scaling without double-scaling or distortion.
   */
  public syncDimensions(clientWidth: number, clientHeight: number): void {
    if (!this.canvas || !this.renderer) return;

    // Handle zero-sized or temporarily hidden containers gracefully without throwing
    if (clientWidth <= 0 || clientHeight <= 0) {
      return;
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
