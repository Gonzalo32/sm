import { describe, it, expect } from 'vitest';
import { Candle } from '../core/market';
import { ICTEngine } from '../core/ict';
import { VisualAdapter } from '../extension/visual/VisualAdapter';
import { CoordinateTranslator } from '../extension/visual/CoordinateTranslator';

describe('Checkpoint 3 — Extension Visual Layer Unit Tests', () => {
  const engine = new ICTEngine();
  const adapter = new VisualAdapter();

  it('VisualAdapter: should transform ICTMarketState and ICTEvents into VisualObjects', () => {
    const candles: Candle[] = [
      { timestamp: 1000, open: 100, high: 105, low: 99, close: 104 },
      { timestamp: 2000, open: 104, high: 112, low: 104, close: 111 },
      { timestamp: 3000, open: 111, high: 116, low: 107, close: 115 },
    ];

    const { state, events } = engine.process(candles, 'MNQ', '1m');
    const visuals = adapter.adaptStateToVisuals(state, events);

    expect(visuals.length).toBeGreaterThan(0);

    const fvgVisual = visuals.find((v) => v.id.startsWith('VIS-FVG-BULL'));
    expect(fvgVisual).toBeDefined();
    expect(fvgVisual?.type).toBe('RECTANGLE');
  });

  it('CoordinateTranslator: should accurately map prices and indices to pixel coordinates', () => {
    const translator = new CoordinateTranslator({
      width: 1000,
      height: 500,
      topPadding: 0,
      bottomPadding: 0,
      leftPadding: 0,
      rightPadding: 0,
      minPrice: 100,
      maxPrice: 200,
      firstCandleIndex: 0,
      lastCandleIndex: 100,
      barWidth: 10,
    });

    // maxPrice (200) -> top Y = 0
    expect(translator.priceToY(200)).toBe(0);
    // minPrice (100) -> bottom Y = 500
    expect(translator.priceToY(100)).toBe(500);
    // mid price (150) -> Y = 250
    expect(translator.priceToY(150)).toBe(250);

    // first index (0) -> X = barWidth / 2 (candle bar center = 5px)
    expect(translator.indexToX(0)).toBe(5);
    // last index (100) -> X = 100 * 10 + 5 = 1005
    expect(translator.indexToX(100)).toBe(1005);
    // mid index (50) -> X = 50 * 10 + 5 = 505
    expect(translator.indexToX(50)).toBe(505);
  });

  it('Context Change: switching symbol or timeframe must reset visual adapter input', () => {
    const candles1m: Candle[] = [
      { timestamp: 1000, open: 100, high: 105, low: 99, close: 104 },
    ];

    const res1m = engine.process(candles1m, 'MNQ', '1m');
    const visuals1m = adapter.adaptStateToVisuals(res1m.state, res1m.events);

    const candles5m: Candle[] = [
      { timestamp: 1000, open: 200, high: 210, low: 190, close: 205 },
    ];

    const res5m = engine.process(candles5m, 'MNQ', '5m');
    const visuals5m = adapter.adaptStateToVisuals(res5m.state, res5m.events);

    expect(visuals1m.every((v) => v.timeframe === '1m')).toBe(true);
    expect(visuals5m.every((v) => v.timeframe === '5m')).toBe(true);
  });
});
