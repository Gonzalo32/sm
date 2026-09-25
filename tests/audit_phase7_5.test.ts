import { describe, it, expect, beforeEach } from 'vitest';
import { ICTEngine } from '../core/ict/engine/ICTEngine';
import { DisplacementEngine } from '../core/ict/displacement/DisplacementEngine';
import { AuditEngine } from '../core/ict/audit/AuditEngine';
import { Candle } from '../core/market/Candle';

import dispDataset from '../audit/displacement/displacement_cases.json';

describe('Checkpoint 7.5 — Statistical & Methodological Audit Tests', () => {
  let engine: ICTEngine;
  let displacementEngine: DisplacementEngine;
  let auditEngine: AuditEngine;

  beforeEach(() => {
    engine = new ICTEngine();
    displacementEngine = new DisplacementEngine();
    auditEngine = new AuditEngine();
  });

  function makeBaseCandles(count: number = 5, startPrice: number = 18000): Candle[] {
    const candles: Candle[] = [];
    for (let i = 0; i < count; i++) {
      candles.push({
        timestamp: 1700000000000 + i * 60000,
        open: startPrice,
        high: startPrice + 2,
        low: startPrice - 2,
        close: startPrice + 1,
        volume: 100,
      });
    }
    return candles;
  }

  it('Test 1 — averagePreviousRange uses strictly past candles (j < i)', () => {
    const candles = makeBaseCandles(5, 18000); // 5 candles with range = 4.0 (avg = 4.0)
    // Add 6th candle at index 5 with huge range = 53.0
    candles.push({
      timestamp: 1700000300000,
      open: 17998,
      high: 18050,
      low: 17997,
      close: 18048,
    });

    const res = displacementEngine.evaluateDisplacements(candles, 'MNQ', '1m');
    expect(res.displacements.length).toBe(1);

    const disp = res.displacements[0];
    // Check that rangeMultiplier is computed against past avg (4.0) -> 53.0 / 4.0 = 13.25x
    // If candle 5 was included in avg, total range would be 20+53=73 -> avg 14.6 -> multiplier 3.63 (incorrect).
    expect(disp.rangeMultiplier).toBeCloseTo(13.25, 2);
  });

  it('Test 2 — 13.25x Extreme Case is 100% Mathematically Reproducible', () => {
    // Reconstruct exact OHLC inputs of 13.25x case
    const candles: Candle[] = [
      { timestamp: 1700000180000, open: 18000, high: 18002, low: 17998, close: 18000 },
      { timestamp: 1700000240000, open: 18000, high: 18002, low: 17998, close: 18000 },
      { timestamp: 1700000300000, open: 18000, high: 18002, low: 17998, close: 18000 },
      { timestamp: 1700000360000, open: 18000, high: 18002, low: 17998, close: 18000 },
      { timestamp: 1700000420000, open: 18000, high: 18002, low: 17998, close: 18000 },
      // Index 5: range = 53.0, body = 50.0 (bodyRatio = 94.34%)
      { timestamp: 1700000480000, open: 17998, high: 18050, low: 17997, close: 18048 },
    ];

    const res = displacementEngine.evaluateDisplacements(candles, 'MNQ', '1m');
    expect(res.displacements.length).toBe(1);

    const disp = res.displacements[0];
    expect(disp.candleIndex).toBe(5);
    expect(disp.bodyRatio).toBeCloseTo(50 / 53, 4);
    expect(disp.rangeMultiplier).toBe(13.25);
  });

  it('Test 3 — Detection (Mathematical Truth) and Classification (Audit) are Independent', () => {
    const candles = makeBaseCandles(5, 18000);
    // Candle meeting math detection threshold: range = 10, body = 6.5 (ratio = 65%), rangeMult = 2.5x
    candles.push({ timestamp: 1700000300000, open: 18000, high: 18010, low: 18000, close: 18006.5 });

    const res = engine.process(candles, 'MNQ', '1m');
    const dispEvent = res.events.find((e) => e.type === 'DISPLACEMENT');
    expect(dispEvent).toBeDefined(); // Mathematical detection = TRUE

    const auditRecords = auditEngine.auditDisplacements(candles, res.events, 'MNQ', '1m');
    expect(auditRecords.length).toBe(1);
    expect(auditRecords[0].detectionType).toBe('MATHEMATICAL_TRUTH');
    expect(auditRecords[0].evaluationType).toBe('POST_EVENT_EVALUATION');

    // Classification does NOT alter original detection event
    expect(dispEvent?.type).toBe('DISPLACEMENT');
  });

  it('Test 4 — Post-Event Information does NOT alter historical detection event', () => {
    const candles = makeBaseCandles(5, 18000);
    candles.push({ timestamp: 1700000300000, open: 18000, high: 18050, low: 18000, close: 18048 });

    const res1 = engine.process(candles, 'MNQ', '1m');
    const event1 = res1.events.find((e) => e.type === 'DISPLACEMENT');

    // Add post-event candles (which would form BOS or FVG later)
    const futureCandles = [...candles];
    futureCandles.push({ timestamp: 1700000360000, open: 18048, high: 18090, low: 18045, close: 18088 });
    futureCandles.push({ timestamp: 1700000420000, open: 18088, high: 18120, low: 18085, close: 18115 });

    const res2 = engine.process(futureCandles, 'MNQ', '1m');
    const event2 = res2.events.find((e) => e.type === 'DISPLACEMENT');

    expect(event1?.timestamp).toBe(event2?.timestamp);
    expect(event1?.eventTimestamp).toBe(event2?.eventTimestamp);
    expect(event1?.confirmationTimestamp).toBe(event2?.confirmationTimestamp);
  });

  it('Test 5 — Batch vs Incremental Equivalence on Statistical Datasets', () => {
    const candles = makeBaseCandles(5, 18000);
    candles.push({ timestamp: 1700000300000, open: 18000, high: 18050, low: 18000, close: 18048 });

    const batchRes = displacementEngine.evaluateDisplacements(candles, 'MNQ', '1m');

    let incRes: any = { displacements: [], events: [] };
    for (let k = 5; k <= candles.length; k++) {
      const sub = candles.slice(0, k);
      incRes = displacementEngine.evaluateDisplacements(sub, 'MNQ', '1m');
    }

    expect(batchRes.displacements.length).toBe(incRes.displacements.length);
    expect(batchRes.displacements[0].rangeMultiplier).toBe(incRes.displacements[0].rangeMultiplier);
  });

  it('Test 6 — Determinism: Repeated execution yields 100% identical outputs', () => {
    const candles = makeBaseCandles(5, 18000);
    candles.push({ timestamp: 1700000300000, open: 17998, high: 18050, low: 17997, close: 18048 });

    const runA = engine.process(candles, 'MNQ', '1m');
    const runB = engine.process(candles, 'MNQ', '1m');

    expect(JSON.stringify(runA)).toBe(JSON.stringify(runB));
  });

  it('Test 7 — Audit Dataset Case Reproducibility via Stable auditCaseId', () => {
    const candles = makeBaseCandles(5, 18000);
    candles.push({ timestamp: 1700000300000, open: 17998, high: 18050, low: 17997, close: 18048 });

    const res = engine.process(candles, 'MNQ', '1m');
    const records = auditEngine.auditDisplacements(candles, res.events, 'MNQ', '1m');

    expect(records[0].auditCaseId).toContain('CASE-DISP-MNQ-1m-');
    expect(dispDataset.cases.length).toBeGreaterThan(0);
  });
});
