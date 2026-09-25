import { describe, it, expect } from 'vitest';
import { Candle } from '../core/market';
import { ICTEngine } from '../core/ict';

describe('Deterministic ICT Engine — Synthetic Scenario Tests', () => {
  const engine = new ICTEngine({
    swingLeftBars: 2,
    swingRightBars: 2,
    fvgMinSizePoints: 0.1,
    liquidityTolerancePoints: 0.5,
    sweepMinPenetrationPoints: 0.1,
  });

  it('scenario_bullish_fvg: should detect a 3-candle Bullish Fair Value Gap', () => {
    const candles: Candle[] = [
      { timestamp: 1000, open: 100, high: 105, low: 99, close: 104 },
      { timestamp: 2000, open: 104, high: 112, low: 104, close: 111 },
      { timestamp: 3000, open: 111, high: 116, low: 107, close: 115 },
    ];

    const result = engine.process(candles, 'MNQ', '1m');

    const fvgCreatedEvents = result.events.filter((e) => e.type === 'FVG_CREATED');
    expect(fvgCreatedEvents).toHaveLength(1);

    const fvg = result.state.fairValueGaps[0];
    expect(fvg.direction).toBe('BULLISH');
    expect(fvg.lowPrice).toBe(105);
    expect(fvg.highPrice).toBe(107);
    expect(fvg.gapSize).toBe(2.0);
    expect(fvg.status).toBe('ACTIVE');
  });

  it('scenario_bearish_fvg: should detect a 3-candle Bearish Fair Value Gap', () => {
    const candles: Candle[] = [
      { timestamp: 1000, open: 105, high: 106, low: 100, close: 101 },
      { timestamp: 2000, open: 101, high: 101, low: 90, close: 91 },
      { timestamp: 3000, open: 91, high: 96, low: 88, close: 89 },
    ];

    const result = engine.process(candles, 'MNQ', '1m');

    const fvgCreatedEvents = result.events.filter((e) => e.type === 'FVG_CREATED');
    expect(fvgCreatedEvents).toHaveLength(1);

    const fvg = result.state.fairValueGaps[0];
    expect(fvg.direction).toBe('BEARISH');
    expect(fvg.highPrice).toBe(100);
    expect(fvg.lowPrice).toBe(96);
    expect(fvg.gapSize).toBe(4.0);
  });

  it('scenario_bullish_bos: should detect Swing High and subsequent Bullish BOS', () => {
    const candles: Candle[] = [
      { timestamp: 1000, open: 10, high: 11, low: 9, close: 10 },
      { timestamp: 2000, open: 10, high: 12, low: 9, close: 11 },
      { timestamp: 3000, open: 11, high: 20, low: 10, close: 19 }, // Peak 20 at index 2 (has 2 left bars)
      { timestamp: 4000, open: 19, high: 18, low: 14, close: 15 },
      { timestamp: 5000, open: 15, high: 16, low: 13, close: 14 }, // Confirms Swing High 20 at index 4
      { timestamp: 6000, open: 14, high: 25, low: 14, close: 24 }, // Closes above 20 at index 5 -> Bullish BOS!
    ];

    const result = engine.process(candles, 'MNQ', '1m');

    const swingHighs = result.state.swings.filter((s) => s.type === 'SWING_HIGH');
    expect(swingHighs.length).toBeGreaterThan(0);
    expect(swingHighs[0].price).toBe(20);

    const bosEvents = result.events.filter((e) => e.type === 'BOS');
    expect(bosEvents).toHaveLength(1);
    expect(result.state.trend).toBe('BULLISH');
  });

  it('scenario_bearish_bos: should detect Swing Low and subsequent Bearish BOS', () => {
    const candles: Candle[] = [
      { timestamp: 1000, open: 20, high: 22, low: 19, close: 20 },
      { timestamp: 2000, open: 20, high: 21, low: 18, close: 19 },
      { timestamp: 3000, open: 19, high: 18, low: 10, close: 11 }, // Swing Low peak 10 at index 2
      { timestamp: 4000, open: 11, high: 15, low: 11, close: 14 },
      { timestamp: 5000, open: 14, high: 16, low: 13, close: 15 }, // Confirms Swing Low 10 at index 4
      { timestamp: 6000, open: 15, high: 15, low: 5, close: 6 },   // Closes below 10 -> Bearish BOS!
    ];

    const result = engine.process(candles, 'MNQ', '1m');

    const swingLows = result.state.swings.filter((s) => s.type === 'SWING_LOW');
    expect(swingLows.length).toBeGreaterThan(0);
    expect(swingLows[0].price).toBe(10);

    const bosEvents = result.events.filter((e) => e.type === 'BOS');
    expect(bosEvents).toHaveLength(1);
    expect(result.state.trend).toBe('BEARISH');
  });

  it('scenario_mss: should detect Market Structure Shift when prior trend reverses', () => {
    // 1. Establish Bearish Trend via Bearish BOS at index 5
    // 2. Establish Swing High 40 at index 7 (confirmed at index 9)
    // 3. Candle 10 closes above 40 -> Bullish MSS!
    const candles: Candle[] = [
      { timestamp: 1000, open: 60, high: 61, low: 58, close: 59 },
      { timestamp: 2000, open: 59, high: 60, low: 55, close: 56 },
      { timestamp: 3000, open: 56, high: 57, low: 30, close: 31 }, // Swing Low 30 at index 2
      { timestamp: 4000, open: 31, high: 35, low: 31, close: 34 },
      { timestamp: 5000, open: 34, high: 36, low: 33, close: 35 }, // Confirms Swing Low 30 at index 4
      { timestamp: 6000, open: 35, high: 35, low: 20, close: 21 }, // Bearish BOS at index 5 -> Trend = BEARISH
      { timestamp: 7000, open: 21, high: 25, low: 20, close: 24 }, // Left bar 1 for SH
      { timestamp: 8000, open: 24, high: 40, low: 23, close: 39 }, // Peak SH 40 at index 7
      { timestamp: 9000, open: 39, high: 39, low: 28, close: 30 }, // Right bar 1
      { timestamp: 10000, open: 30, high: 31, low: 27, close: 29 },// Right bar 2 -> Confirms SH 40 at index 9
      { timestamp: 11000, open: 29, high: 55, low: 29, close: 54 },// Candle 10 closes above 40 -> Bullish MSS!
    ];

    const result = engine.process(candles, 'MNQ', '1m');

    const mssEvents = result.events.filter((e) => e.type === 'MSS');
    expect(mssEvents).toHaveLength(1);
    expect(result.state.trend).toBe('BULLISH');
  });

  it('scenario_liquidity_sweep: should detect SSL sweep when price penetrates low and closes above', () => {
    // 1. Establish Swing Low at index 2 (low 100), confirmed at index 4
    // 2. Candle 5 penetrates low to 98.5 but closes at 103 (back above 100) -> SSL Sweep!
    const candles: Candle[] = [
      { timestamp: 1000, open: 115, high: 116, low: 112, close: 113 },
      { timestamp: 2000, open: 113, high: 114, low: 108, close: 109 },
      { timestamp: 3000, open: 109, high: 109, low: 100, close: 101 }, // Low 100 at index 2
      { timestamp: 4000, open: 101, high: 108, low: 101, close: 107 },
      { timestamp: 5000, open: 107, high: 110, low: 106, close: 109 }, // Confirms SSL at index 4
      { timestamp: 6000, open: 109, high: 109, low: 98.5, close: 103 },// Candle 5 sweeps SSL to 98.5
    ];

    const result = engine.process(candles, 'MNQ', '1m');

    const sweepEvents = result.events.filter((e) => e.type === 'LIQUIDITY_SWEEP');
    expect(sweepEvents).toHaveLength(1);

    const sslLevels = result.state.liquidityLevels.filter((l) => l.type === 'SSL');
    expect(sslLevels[0].swept).toBe(true);
  });
});
