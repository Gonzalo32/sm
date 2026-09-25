import { describe, it, expect, beforeEach } from 'vitest';
import { CoordinateTranslator } from '../extension/visual/CoordinateTranslator';

describe('Checkpoint 3.5 — Geometry Validation & Alignment Tests', () => {
  let translator: CoordinateTranslator;

  beforeEach(() => {
    translator = new CoordinateTranslator({
      width: 1000,
      height: 500,
      topPadding: 20,
      bottomPadding: 30,
      leftPadding: 0,
      rightPadding: 100,
      minPrice: 20000,
      maxPrice: 21000,
      firstCandleIndex: 0,
      lastCandleIndex: 100,
    });
  });

  it('5-Point Price Validation: P1 to P5 must map monotonically to Y pixels', () => {
    const minPrice = 20000;
    const maxPrice = 21000;
    const range = maxPrice - minPrice;

    const P1 = maxPrice - 0.05 * range; // Near top (20950)
    const P2 = maxPrice - 0.25 * range; // High (20750)
    const P3 = minPrice + 0.50 * range; // Mid / Equilibrium (20500)
    const P4 = minPrice + 0.25 * range; // Low (20250)
    const P5 = minPrice + 0.05 * range; // Near bottom (20050)

    const y1 = translator.priceToY(P1);
    const y2 = translator.priceToY(P2);
    const y3 = translator.priceToY(P3);
    const y4 = translator.priceToY(P4);
    const y5 = translator.priceToY(P5);

    // In canvas Y, higher prices must have LOWER Y pixel values
    expect(y1).toBeLessThan(y2);
    expect(y2).toBeLessThan(y3);
    expect(y3).toBeLessThan(y4);
    expect(y4).toBeLessThan(y5);

    // Equilibrium (P3: 20500) must be exactly at drawable center Y
    // Drawable height = 500 - 20 - 30 = 450. Center Y = 20 + 225 = 245.
    expect(y3).toBe(245);
  });

  it('5-Point Time Validation: C1 to C5 must map monotonically to X pixels', () => {
    const firstIdx = 0;
    const lastIdx = 100;
    const range = lastIdx - firstIdx;

    const C1 = firstIdx;
    const C2 = Math.round(firstIdx + 0.25 * range);
    const C3 = Math.round(firstIdx + 0.50 * range);
    const C4 = Math.round(firstIdx + 0.75 * range);
    const C5 = lastIdx;

    const x1 = translator.indexToX(C1);
    const x2 = translator.indexToX(C2);
    const x3 = translator.indexToX(C3);
    const x4 = translator.indexToX(C4);
    const x5 = translator.indexToX(C5);

    // Later candle indices must have HIGHER X pixel values
    expect(x1).toBeLessThan(x2);
    expect(x2).toBeLessThan(x3);
    expect(x3).toBeLessThan(x4);
    expect(x4).toBeLessThan(x5);
  });

  it('Zoom & Pan Test: updating minPrice/maxPrice and indices dynamically updates coordinates', () => {
    const initialY = translator.priceToY(20500);

    // Zoom in on price (scale min 20400 to max 20600)
    translator.updateViewport({ minPrice: 20400, maxPrice: 20600 });
    const zoomedY = translator.priceToY(20500);

    // Price 20500 is still mid price, so y remains centered at 245
    expect(zoomedY).toBe(245);

    // Pan chart upward (scale shifts to min 20500, max 20700)
    translator.updateViewport({ minPrice: 20500, maxPrice: 20700 });
    const pannedY = translator.priceToY(20500);

    // Price 20500 is now at bottom of scale -> Y should be near bottom (470px)
    expect(pannedY).toBe(470);
    expect(pannedY).toBeGreaterThan(initialY);
  });

  it('Resize Test: changing canvas width/height updates drawable bounds', () => {
    translator.updateViewport({ width: 2000, height: 1000 });
    const bounds = translator.getViewport();

    expect(bounds.width).toBe(2000);
    expect(bounds.height).toBe(1000);
  });

  it('Native TradingView Bridge API Override Test', () => {
    translator.setTvBridgeApi({
      priceToY: (p) => (p === 20500 ? 123.45 : null),
      indexToX: (i) => (i === 50 ? 678.9 : null),
    });

    expect(translator.priceToY(20500)).toBe(123.45);
    expect(translator.indexToX(50)).toBe(678.9);
  });
});
