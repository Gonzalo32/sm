import { describe, it, expect, beforeEach } from 'vitest';
import { Candle } from '../core/market';
import { ICTEngine } from '../core/ict';

describe('Checkpoint 2.5 — Conceptual Audit, Causality & Determinism Tests', () => {
  let engine: ICTEngine;

  beforeEach(() => {
    engine = new ICTEngine({
      swingLeftBars: 2,
      swingRightBars: 2,
      bosBreakMode: 'CLOSE',
      fvgMinSizePoints: 0.1,
      liquidityTolerancePoints: 0.5,
      sweepMinPenetrationPoints: 0.1,
    });
  });

  // 1. LOOKAHEAD BIAS & NO-FUTURE CAUSALITY TEST
  it('LOOKAHEAD_BIAS_TEST: modifying future candles must not alter past events emitted up to candle N', () => {
    const baseCandles: Candle[] = [
      { timestamp: 1000, open: 10, high: 11, low: 9, close: 10 },
      { timestamp: 2000, open: 10, high: 12, low: 9, close: 11 },
      { timestamp: 3000, open: 11, high: 20, low: 10, close: 19 }, // Peak at 20 (index 2)
      { timestamp: 4000, open: 19, high: 18, low: 14, close: 15 },
      { timestamp: 5000, open: 15, high: 16, low: 13, close: 14 }, // Confirms Swing High 20 at index 4 (timestamp 5000)
    ];

    const resultBeforeFuture = engine.process(baseCandles, 'MNQ', '1m');
    const eventsCountBefore = resultBeforeFuture.events.length;

    // Append 3 wild future candles at timestamp 6000, 7000, 8000
    const candlesWithFuture: Candle[] = [
      ...baseCandles,
      { timestamp: 6000, open: 14, high: 999, low: 1, close: 500 },
      { timestamp: 7000, open: 500, high: 1000, low: 10, close: 800 },
      { timestamp: 8000, open: 800, high: 1200, low: 5, close: 1100 },
    ];

    const resultAfterFuture = engine.process(candlesWithFuture, 'MNQ', '1m');

    // Past events up to index 4 (timestamp 5000) must remain identical
    const eventsUpToTimestamp5000 = resultAfterFuture.events.filter((e) => e.confirmationTimestamp <= 5000);
    expect(eventsUpToTimestamp5000).toHaveLength(eventsCountBefore);
    expect(eventsUpToTimestamp5000).toEqual(resultBeforeFuture.events);
  });

  it('LOOKAHEAD_BIAS_TEST: Swing confirmationTimestamp must equal eventTimestamp + swingRightBars interval', () => {
    const candles: Candle[] = [
      { timestamp: 1000, open: 10, high: 11, low: 9, close: 10 },
      { timestamp: 2000, open: 10, high: 12, low: 9, close: 11 },
      { timestamp: 3000, open: 11, high: 20, low: 10, close: 19 }, // Peak 20 at index 2 (timestamp 3000)
      { timestamp: 4000, open: 19, high: 18, low: 14, close: 15 },
      { timestamp: 5000, open: 15, high: 16, low: 13, close: 14 }, // Confirmed at index 4 (timestamp 5000)
    ];

    const res = engine.process(candles, 'MNQ', '1m');
    const swingHighEvent = res.events.find((e) => e.type === 'SWING_HIGH');

    expect(swingHighEvent).toBeDefined();
    expect(swingHighEvent?.eventTimestamp).toBe(3000);
    expect(swingHighEvent?.confirmationTimestamp).toBe(5000);
    expect(swingHighEvent?.confirmationTimestamp).toBeGreaterThan(swingHighEvent!.eventTimestamp);
  });

  // 2. BOS AUDIT TESTS
  it('BOS_AUDIT: should differentiate CLOSE break vs WICK break', () => {
    const candlesCloseMode: Candle[] = [
      { timestamp: 1000, open: 10, high: 11, low: 9, close: 10 },
      { timestamp: 2000, open: 10, high: 12, low: 9, close: 11 },
      { timestamp: 3000, open: 11, high: 20, low: 10, close: 19 }, // Swing High 20
      { timestamp: 4000, open: 19, high: 18, low: 14, close: 15 },
      { timestamp: 5000, open: 15, high: 16, low: 13, close: 14 }, // Confirmed at index 4
      { timestamp: 6000, open: 14, high: 22, low: 14, close: 18 }, // High = 22 (wick above 20), but Close = 18 (< 20)
    ];

    // In CLOSE mode: high wick = 22 does NOT break 20 because close = 18 < 20
    const closeEngine = new ICTEngine({ swingLeftBars: 2, swingRightBars: 2, bosBreakMode: 'CLOSE' });
    const resClose = closeEngine.process(candlesCloseMode, 'MNQ', '1m');
    expect(resClose.events.filter((e) => e.type === 'BOS')).toHaveLength(0);

    // In WICK mode: high wick = 22 DOES break 20
    const wickEngine = new ICTEngine({ swingLeftBars: 2, swingRightBars: 2, bosBreakMode: 'WICK' });
    const resWick = wickEngine.process(candlesCloseMode, 'MNQ', '1m');
    expect(resWick.events.filter((e) => e.type === 'BOS')).toHaveLength(1);
  });

  it('BOS_AUDIT: should consume broken level and NOT emit duplicate BOS on already broken swing', () => {
    const candles: Candle[] = [
      { timestamp: 1000, open: 10, high: 11, low: 9, close: 10 },
      { timestamp: 2000, open: 10, high: 12, low: 9, close: 11 },
      { timestamp: 3000, open: 11, high: 20, low: 10, close: 19 }, // Swing High 20
      { timestamp: 4000, open: 19, high: 18, low: 14, close: 15 },
      { timestamp: 5000, open: 15, high: 16, low: 13, close: 14 }, // Confirmed Swing High 20
      { timestamp: 6000, open: 14, high: 25, low: 14, close: 24 }, // First break above 20 -> BOS emitted
      { timestamp: 7000, open: 24, high: 28, low: 22, close: 26 }, // Subsequent candle higher than 20
    ];

    const res = engine.process(candles, 'MNQ', '1m');
    const bosEvents = res.events.filter((e) => e.type === 'BOS');
    expect(bosEvents).toHaveLength(1); // Only 1 BOS event emitted, level is marked broken
  });

  // 3. MSS AUDIT TESTS
  it('MSS_AUDIT: trend continuation must emit BOS, whereas trend reversal must emit MSS', () => {
    const candles: Candle[] = [
      { timestamp: 1000, open: 60, high: 61, low: 58, close: 59 },
      { timestamp: 2000, open: 59, high: 60, low: 55, close: 56 },
      { timestamp: 3000, open: 56, high: 57, low: 30, close: 31 }, // Swing Low 30
      { timestamp: 4000, open: 31, high: 35, low: 31, close: 34 },
      { timestamp: 5000, open: 34, high: 36, low: 33, close: 35 },
      { timestamp: 6000, open: 35, high: 35, low: 20, close: 21 }, // Bearish BOS -> Trend = BEARISH
      { timestamp: 7000, open: 21, high: 25, low: 20, close: 24 },
      { timestamp: 8000, open: 24, high: 40, low: 23, close: 39 }, // Swing High 40
      { timestamp: 9000, open: 39, high: 39, low: 28, close: 30 },
      { timestamp: 10000, open: 30, high: 31, low: 27, close: 29 }, // Confirms Swing High 40
      { timestamp: 11000, open: 29, high: 55, low: 29, close: 54 },// Break above 40 in BEARISH trend -> MSS
    ];

    const res = engine.process(candles, 'MNQ', '1m');
    const bosEvents = res.events.filter((e) => e.type === 'BOS');
    const mssEvents = res.events.filter((e) => e.type === 'MSS');

    expect(bosEvents).toHaveLength(1);
    expect(bosEvents[0].direction).toBe('BEARISH');
    expect(mssEvents).toHaveLength(1);
    expect(mssEvents[0].direction).toBe('BULLISH');
  });

  // 4. LIQUIDITY SWEEP AUDIT TESTS
  it('LIQUIDITY_SWEEP_AUDIT: true sweep vs breakout close', () => {
    // True Sweep: Price penetrates SSL level 100 to 98.5 but closes at 103 (back inside > 100)
    const candlesSweep: Candle[] = [
      { timestamp: 1000, open: 115, high: 116, low: 112, close: 113 },
      { timestamp: 2000, open: 113, high: 114, low: 108, close: 109 },
      { timestamp: 3000, open: 109, high: 109, low: 100, close: 101 }, // Low 100 at index 2
      { timestamp: 4000, open: 101, high: 108, low: 101, close: 107 },
      { timestamp: 5000, open: 107, high: 110, low: 106, close: 109 }, // Confirms SSL at index 4
      { timestamp: 6000, open: 109, high: 109, low: 98.5, close: 103 },// Sweeps to 98.5, closes at 103 (> 100)
    ];

    const resSweep = engine.process(candlesSweep, 'MNQ', '1m');
    const sweepEvents = resSweep.events.filter((e) => e.type === 'LIQUIDITY_SWEEP') as any[];
    expect(sweepEvents).toHaveLength(1);
    expect(sweepEvents[0].sweep.confirmed).toBe(true);

    // Breakout close: Price penetrates SSL level 100 and closes at 95 (< 100)
    const candlesBreakout: Candle[] = [
      { timestamp: 1000, open: 115, high: 116, low: 112, close: 113 },
      { timestamp: 2000, open: 113, high: 114, low: 108, close: 109 },
      { timestamp: 3000, open: 109, high: 109, low: 100, close: 101 },
      { timestamp: 4000, open: 101, high: 108, low: 101, close: 107 },
      { timestamp: 5000, open: 107, high: 110, low: 106, close: 109 },
      { timestamp: 6000, open: 109, high: 109, low: 94, close: 95 },   // Closes at 95 (< 100)
    ];

    const resBreakout = engine.process(candlesBreakout, 'MNQ', '1m');
    const sweepEventsBreakout = resBreakout.events.filter((e) => e.type === 'LIQUIDITY_SWEEP') as any[];
    expect(sweepEventsBreakout).toHaveLength(1);
    expect(sweepEventsBreakout[0].sweep.confirmed).toBe(false); // Unconfirmed sweep / breakout close
  });

  // 5. FVG AUDIT TESTS
  it('FVG_AUDIT: indexing and partial/full mitigation tracking', () => {
    // 3-candle Bullish FVG: C1 high=105, C2 expansion, C3 low=107 (gap = [105, 107])
    const candles: Candle[] = [
      { timestamp: 1000, open: 100, high: 105, low: 99, close: 104 }, // C1
      { timestamp: 2000, open: 104, high: 112, low: 104, close: 111 },// C2
      { timestamp: 3000, open: 111, high: 116, low: 107, close: 115 },// C3 -> FVG [105, 107]
      { timestamp: 4000, open: 115, high: 115, low: 106, close: 108 },// Candle 4 low=106 -> re-enters gap -> Partial mitigation
      { timestamp: 5000, open: 108, high: 108, low: 104, close: 105 },// Candle 5 low=104 (< 105) -> Full mitigation
    ];

    const res = engine.process(candles, 'MNQ', '1m');
    const fvg = res.state.fairValueGaps[0];

    expect(fvg).toBeDefined();
    expect(fvg.lowPrice).toBe(105);
    expect(fvg.highPrice).toBe(107);
    expect(fvg.status).toBe('FULLY_MITIGATED');
    expect(fvg.fillPercentage).toBe(100);

    const fvgFilledEvents = res.events.filter((e) => e.type === 'FVG_FILLED');
    expect(fvgFilledEvents).toHaveLength(1);
  });

  // 6. DETERMINISM TEST
  it('DETERMINISM_TEST: running engine process multiple times on same input yields 100% identical output', () => {
    const candles: Candle[] = [
      { timestamp: 1000, open: 10, high: 11, low: 9, close: 10 },
      { timestamp: 2000, open: 10, high: 12, low: 9, close: 11 },
      { timestamp: 3000, open: 11, high: 20, low: 10, close: 19 },
      { timestamp: 4000, open: 19, high: 18, low: 14, close: 15 },
      { timestamp: 5000, open: 15, high: 16, low: 13, close: 14 },
      { timestamp: 6000, open: 14, high: 25, low: 14, close: 24 },
    ];

    const run1 = JSON.stringify(engine.process(candles, 'MNQ', '1m'));
    const run2 = JSON.stringify(engine.process(candles, 'MNQ', '1m'));
    const run3 = JSON.stringify(engine.process(candles, 'MNQ', '1m'));
    const run4 = JSON.stringify(engine.process(candles, 'MNQ', '1m'));
    const run5 = JSON.stringify(engine.process(candles, 'MNQ', '1m'));

    expect(run1).toEqual(run2);
    expect(run2).toEqual(run3);
    expect(run3).toEqual(run4);
    expect(run4).toEqual(run5);
  });

  // 7. INCREMENTAL VS BATCH EQUIVALENCE TEST
  it('INCREMENTAL_VS_BATCH_TEST: process(allCandles) must match progressive processNext(candle)', () => {
    const candles: Candle[] = [
      { timestamp: 1000, open: 10, high: 11, low: 9, close: 10 },
      { timestamp: 2000, open: 10, high: 12, low: 9, close: 11 },
      { timestamp: 3000, open: 11, high: 20, low: 10, close: 19 },
      { timestamp: 4000, open: 19, high: 18, low: 14, close: 15 },
      { timestamp: 5000, open: 15, high: 16, low: 13, close: 14 },
      { timestamp: 6000, open: 14, high: 25, low: 14, close: 24 },
    ];

    // Batch run
    const batchEngine = new ICTEngine();
    const batchResult = batchEngine.process(candles, 'MNQ', '1m');

    // Incremental run
    const progressiveEngine = new ICTEngine();
    let progressiveResult;
    for (const c of candles) {
      progressiveResult = progressiveEngine.processNext(c, 'MNQ', '1m');
    }

    expect(JSON.stringify(progressiveResult)).toEqual(JSON.stringify(batchResult));
  });
});
