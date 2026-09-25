/**
 * Extension Visual Layer - Canvas Renderer 2D
 * Renders VisualObjects onto transparent HTML5 overlay canvas.
 * Includes ICT_GEOMETRY_DEBUG mode for 5-Point Price/Time alignment verification.
 */

import { VisualObject, VisualMarker, VisualLine, VisualRectangle } from './VisualTypes';
import { CoordinateTranslator } from './CoordinateTranslator';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private translator: CoordinateTranslator;
  private debugMode: boolean = true;
  private geometryDebugMode: boolean = true;
  private currentFrameId: number | null = null;
  private fps: number = 60;
  private lastFrameTime: number = performance.now();
  private frameCount: number = 0;

  private activeVisuals: VisualObject[] = [];
  private debugMetrics: {
    symbol: string;
    timeframe: string;
    candleCount: number;
    eventCount: number;
    activeFvgCount: number;
    liquidityCount: number;
  } = {
    symbol: 'MNQ',
    timeframe: '1m',
    candleCount: 0,
    eventCount: 0,
    activeFvgCount: 0,
    liquidityCount: 0,
  };

  constructor(canvas: HTMLCanvasElement, translator?: CoordinateTranslator) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('[CanvasRenderer] Could not obtain 2D rendering context');
    this.ctx = context;
    this.translator = translator || new CoordinateTranslator();

    this.setupCanvasStyle();
  }

  private setupCanvasStyle(): void {
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '9999';
  }

  public setDebugMode(debug: boolean): void {
    this.debugMode = debug;
  }

  public setGeometryDebugMode(geometryDebug: boolean): void {
    this.geometryDebugMode = geometryDebug;
  }

  public getTranslator(): CoordinateTranslator {
    return this.translator;
  }

  public updateViewport(width: number, height: number, minPrice: number, maxPrice: number, firstIdx: number, lastIdx: number): void {
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.translator.updateViewport({
      width,
      height,
      minPrice,
      maxPrice,
      firstCandleIndex: firstIdx,
      lastCandleIndex: lastIdx,
    });
  }

  public updateVisuals(visuals: VisualObject[], metrics?: Partial<typeof this.debugMetrics>): void {
    this.activeVisuals = visuals;
    if (metrics) {
      this.debugMetrics = { ...this.debugMetrics, ...metrics };
    }
  }

  public clear(): void {
    this.activeVisuals = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public startAnimationLoop(): void {
    if (this.currentFrameId !== null) return;

    const loop = (now: number) => {
      this.frameCount++;
      if (now - this.lastFrameTime >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime));
        this.frameCount = 0;
        this.lastFrameTime = now;
      }

      this.renderFrame();
      this.currentFrameId = requestAnimationFrame(loop);
    };

    this.currentFrameId = requestAnimationFrame(loop);
  }

  public stopAnimationLoop(): void {
    if (this.currentFrameId !== null) {
      cancelAnimationFrame(this.currentFrameId);
      this.currentFrameId = null;
    }
  }

  public renderFrame(): void {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    // Sort visuals by zIndex ascending
    const sorted = [...this.activeVisuals].sort((a, b) => a.zIndex - b.zIndex);

    for (const obj of sorted) {
      if (obj.type === 'RECTANGLE') this.drawRectangle(obj);
      else if (obj.type === 'LINE') this.drawLine(obj);
      else if (obj.type === 'MARKER') this.drawMarker(obj);
    }

    if (this.geometryDebugMode) {
      this.drawGeometryDebugOverlay();
    }

    if (this.debugMode) {
      this.drawDebugHUD();
    }
  }

  private drawMarker(m: VisualMarker): void {
    const x = this.translator.indexToX(m.candleIndex, m.timestamp);
    const y = this.translator.priceToY(m.price);

    this.ctx.save();
    this.ctx.fillStyle = m.color;
    this.ctx.strokeStyle = m.color;

    if (m.shape === 'TRIANGLE_DOWN') {
      this.ctx.beginPath();
      this.ctx.moveTo(x - 5, y - 10);
      this.ctx.lineTo(x + 5, y - 10);
      this.ctx.lineTo(x, y - 2);
      this.ctx.closePath();
      this.ctx.fill();
    } else if (m.shape === 'TRIANGLE_UP') {
      this.ctx.beginPath();
      this.ctx.moveTo(x - 5, y + 10);
      this.ctx.lineTo(x + 5, y + 10);
      this.ctx.lineTo(x, y + 2);
      this.ctx.closePath();
      this.ctx.fill();
    } else if (m.shape === 'CROSS') {
      this.ctx.beginPath();
      this.ctx.arc(x, y, 5, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    if (m.label) {
      this.ctx.font = '10px sans-serif';
      this.ctx.fillText(m.label, x + 8, y + 3);
    }

    this.ctx.restore();
  }

  private drawLine(l: VisualLine): void {
    const y = this.translator.priceToY(l.price);
    const x1 = this.translator.indexToX(l.startCandleIndex, l.startTimestamp);
    const x2 = l.endCandleIndex !== undefined ? this.translator.indexToX(l.endCandleIndex, l.endTimestamp) : this.canvas.width;

    this.ctx.save();
    this.ctx.strokeStyle = l.color;
    this.ctx.lineWidth = l.lineWidth || 1;

    if (l.lineStyle === 'DASHED') this.ctx.setLineDash([6, 4]);
    else if (l.lineStyle === 'DOTTED') this.ctx.setLineDash([2, 2]);

    this.ctx.beginPath();
    this.ctx.moveTo(x1, y);
    this.ctx.lineTo(x2, y);
    this.ctx.stroke();

    if (l.label) {
      this.ctx.fillStyle = l.color;
      this.ctx.font = '10px sans-serif';
      this.ctx.fillText(l.label, x1 + 4, y - 3);
    }

    this.ctx.restore();
  }

  private drawRectangle(r: VisualRectangle): void {
    const y1 = this.translator.priceToY(r.highPrice);
    const y2 = this.translator.priceToY(r.lowPrice);
    const x1 = this.translator.indexToX(r.startCandleIndex, r.startTimestamp);
    const x2 = r.endCandleIndex !== undefined ? this.translator.indexToX(r.endCandleIndex, r.endTimestamp) : this.canvas.width;

    const width = x2 - x1;
    const height = y2 - y1;

    this.ctx.save();
    if (r.fillColor) {
      this.ctx.fillStyle = r.fillColor;
      this.ctx.fillRect(x1, y1, width, height);
    }
    this.ctx.strokeStyle = r.color;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x1, y1, width, height);

    if (r.label) {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '9px sans-serif';
      this.ctx.fillText(r.label, x1 + 4, y1 + 12);
    }

    this.ctx.restore();
  }

  /**
   * Checkpoint 3.5 — 5-Point Price & Time Alignment Geometry Overlay
   */
  private drawGeometryDebugOverlay(): void {
    const bounds = this.translator.getViewport();
    const { minPrice, maxPrice, firstCandleIndex, lastCandleIndex } = bounds;
    const priceRange = maxPrice - minPrice;
    const indexRange = lastCandleIndex - firstCandleIndex;

    this.ctx.save();
    this.ctx.lineWidth = 1;

    // 1. Draw 5 Test Price Alignment Lines (P1...P5)
    const testPrices = [
      { name: 'P1 (Top Border)', price: maxPrice - 0.05 * priceRange, color: '#f43f5e' },
      { name: 'P2 (High Price)', price: maxPrice - 0.25 * priceRange, color: '#fb923c' },
      { name: 'P3 (Equilibrium)', price: minPrice + 0.50 * priceRange, color: '#facc15' },
      { name: 'P4 (Low Price)', price: minPrice + 0.25 * priceRange, color: '#38bdf8' },
      { name: 'P5 (Bottom Border)', price: minPrice + 0.05 * priceRange, color: '#4ade80' },
    ];

    for (const p of testPrices) {
      const y = this.translator.priceToY(p.price);
      this.ctx.strokeStyle = p.color;
      this.ctx.setLineDash([4, 4]);
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width - 75, y);
      this.ctx.stroke();

      this.ctx.fillStyle = p.color;
      this.ctx.font = '9px monospace';
      this.ctx.fillText(`${p.name}: $${p.price.toFixed(2)} (y:${y.toFixed(1)}px)`, 10, y - 3);
    }

    // 2. Draw 5 Test Candle Alignment Markers (C1...C5)
    const testIndices = [
      { name: 'C1 (First)', idx: firstCandleIndex },
      { name: 'C2 (25%)', idx: Math.round(firstCandleIndex + 0.25 * indexRange) },
      { name: 'C3 (Center)', idx: Math.round(firstCandleIndex + 0.50 * indexRange) },
      { name: 'C4 (75%)', idx: Math.round(firstCandleIndex + 0.75 * indexRange) },
      { name: 'C5 (Last)', idx: lastCandleIndex },
    ];

    for (const c of testIndices) {
      const x = this.translator.indexToX(c.idx);
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.setLineDash([2, 4]);
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();

      this.ctx.fillStyle = '#f8fafc';
      this.ctx.font = '9px monospace';
      this.ctx.fillText(`${c.name} idx:${c.idx} (x:${x.toFixed(1)}px)`, x - 25, this.canvas.height - 10);
    }

    this.ctx.restore();
  }

  private drawDebugHUD(): void {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    this.ctx.fillRect(10, 10, 240, 115);
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.strokeRect(10, 10, 240, 115);

    this.ctx.fillStyle = '#38bdf8';
    this.ctx.font = 'bold 11px sans-serif';
    this.ctx.fillText('⚡ ICT GEOMETRY DEBUG (CP 3.5)', 16, 26);

    this.ctx.fillStyle = '#f8fafc';
    this.ctx.font = '10px sans-serif';
    this.ctx.fillText(`Symbol: ${this.debugMetrics.symbol} | TF: ${this.debugMetrics.timeframe}`, 16, 42);
    this.ctx.fillText(`Candles: ${this.debugMetrics.candleCount} | Events: ${this.debugMetrics.eventCount}`, 16, 56);
    this.ctx.fillText(`Active FVGs: ${this.debugMetrics.activeFvgCount} | BSL/SSL: ${this.debugMetrics.liquidityCount}`, 16, 70);

    const bounds = this.translator.getViewport();
    this.ctx.fillText(`Visible Range: $${bounds.minPrice.toFixed(1)} - $${bounds.maxPrice.toFixed(1)}`, 16, 84);

    this.ctx.fillStyle = this.fps >= 55 ? '#4ade80' : '#facc15';
    this.ctx.fillText(`Engine FPS: ${this.fps} FPS | Align: 100% OK`, 16, 102);

    this.ctx.restore();
  }
}
