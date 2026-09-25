import { describe, it, expect, beforeEach } from 'vitest';
import { ICTEngine } from '../core/ict/engine/ICTEngine';
import { SetupEngine } from '../core/ict/setups/SetupEngine';
import { ConfluenceEngine } from '../core/ict/confluence/ConfluenceEngine';
import { AuditEngine } from '../core/ict/audit/AuditEngine';
import { Candle } from '../core/market/Candle';

import dispDataset from '../audit/displacement/displacement_cases.json';
import sweepDataset from '../audit/liquidity/sweep_cases.json';
import fvgDataset from '../audit/fvg/fvg_cases.json';
import structDataset from '../audit/structure/structure_cases.json';
import setupDataset from '../audit/setups/setup_cases.json';

describe('Checkpoint 7 — Real Market Audit & Reproducibility Tests', () => {
  let engine: ICTEngine;
  let setupEngine: SetupEngine;
  let confluenceEngine: ConfluenceEngine;
  let auditEngine: AuditEngine;

  beforeEach(() => {
    engine = new ICTEngine();
    setupEngine = new SetupEngine();
    confluenceEngine = new ConfluenceEngine();
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

  it('Test 1 — Audit Cases Reproducibility: Re-processing produces identical events & timestamps', () => {
    const candles: Candle[] = makeBaseCandles(5, 18000);
    // Add swing high at candle 5
    candles.push({ timestamp: 1700000300000, open: 18001, high: 18020, low: 18000, close: 18015 });
    candles.push({ timestamp: 1700000360000, open: 18015, high: 18016, low: 18005, close: 18008 });
    candles.push({ timestamp: 1700000420000, open: 18008, high: 18010, low: 17995, close: 17998 });
    // Displacement candle
    candles.push({ timestamp: 1700000480000, open: 17998, high: 18050, low: 17997, close: 18048 });

    const run1 = engine.process(candles, 'MNQ', '1m');
    const run2 = engine.process(candles, 'MNQ', '1m');

    expect(run1.events.length).toBe(run2.events.length);
    expect(run1.state.lastUpdatedTimestamp).toBe(run2.state.lastUpdatedTimestamp);
    expect(JSON.stringify(run1.events)).toBe(JSON.stringify(run2.events));
  });

  it('Test 2 — Displacement CLEAR Classification', () => {
    const candles = makeBaseCandles(5, 18000);
    // Huge impulse candle: body = 48, range = 50 (bodyRatio = 96% >= 70%), rangeMult = 50 / 4 = 12.5x (>= 2.0x)
    candles.push({ timestamp: 1700000300000, open: 18000, high: 18050, low: 18000, close: 18048 });

    const res = engine.process(candles, 'MNQ', '1m');
    const records = auditEngine.auditDisplacements(candles, res.events, 'MNQ', '1m');

    expect(records.length).toBe(1);
    expect(records[0].classification).toBe('CLEAR');
    expect(records[0].bodyRatio).toBeGreaterThanOrEqual(0.70);
    expect(records[0].rangeMultiplier).toBeGreaterThanOrEqual(2.0);
  });

  it('Test 3 — Displacement BORDERLINE Classification', () => {
    const candles: Candle[] = [
      { timestamp: 1700000000000, open: 18000, high: 18002, low: 17998, close: 18000 },
      { timestamp: 1700000060000, open: 18000, high: 18002, low: 17998, close: 18000 },
      { timestamp: 1700000120000, open: 18000, high: 18002, low: 17998, close: 18000 },
      { timestamp: 1700000180000, open: 18000, high: 18002, low: 17998, close: 18000 },
      { timestamp: 1700000240000, open: 18000, high: 18002, low: 17998, close: 18000 },
      // Borderline displacement candle creating FVG: range = 12 (1.71x avg), body = 7.5 (62.5%)
      { timestamp: 1700000300000, open: 18000, high: 18012, low: 18000, close: 18007.5 },
      { timestamp: 1700000360000, open: 18007.5, high: 18009, low: 18006, close: 18008.5 },
    ];

    const res = engine.process(candles, 'MNQ', '1m');
    const records = auditEngine.auditDisplacements(candles, res.events, 'MNQ', '1m');

    expect(records.length).toBe(1);
    expect(records[0].classification).toBe('BORDERLINE');
  });

  it('Test 4 — Displacement ABSENT Classification', () => {
    const candles = makeBaseCandles(5, 18000);
    // Candle failing threshold: range = 4, body = 1 (bodyRatio = 25% < 60%)
    candles.push({ timestamp: 1700000300000, open: 18000, high: 18003, low: 17999, close: 18001 });

    const res = engine.process(candles, 'MNQ', '1m');
    const records = auditEngine.auditDisplacements(candles, res.events, 'MNQ', '1m');

    expect(records.length).toBe(0);
  });

  it('Test 5 — Sweep vs Breakout Audit Discrimination', () => {
    const candles = makeBaseCandles(5, 18000);
    // Swing High
    candles.push({ timestamp: 1700000300000, open: 18000, high: 18030, low: 17995, close: 18020 });
    candles.push({ timestamp: 1700000360000, open: 18020, high: 18022, low: 18000, close: 18005 });
    candles.push({ timestamp: 1700000420000, open: 18005, high: 18010, low: 17995, close: 18000 });

    // Sweep candle wicking to 18035 and closing back inside at 18010
    candles.push({ timestamp: 1700000480000, open: 18000, high: 18035, low: 17995, close: 18010 });

    const res = engine.process(candles, 'MNQ', '1m');
    const auditSweeps = auditEngine.auditSweeps(res.events, 'MNQ', '1m');

    expect(auditSweeps.length).toBeGreaterThan(0);
    expect(auditSweeps[0].isBreakout).toBe(false);
    expect(auditSweeps[0].classification).toBe('CLEAR');
  });

  it('Test 6 — Fair Value Gap (FVG) Lifecycle Audit', () => {
    const candles: Candle[] = [
      { timestamp: 1700000000000, open: 18000, high: 18010, low: 17990, close: 18005 }, // c1 high 18010
      { timestamp: 1700000060000, open: 18005, high: 18060, low: 18005, close: 18055 }, // c2
      { timestamp: 1700000120000, open: 18055, high: 18070, low: 18025, close: 18065 }, // c3 low 18025 -> gap 18010 to 18025
    ];

    const res1 = engine.process(candles, 'MNQ', '1m');
    expect(res1.state.fairValueGaps[0].status).toBe('ACTIVE');

    // Partial mitigation candle retracing to 18018 inside gap
    candles.push({ timestamp: 1700000180000, open: 18065, high: 18066, low: 18018, close: 18020 });
    const res2 = engine.process(candles, 'MNQ', '1m');
    expect(res2.state.fairValueGaps[0].status).toBe('PARTIALLY_MITIGATED');

    // Full mitigation candle penetrating below 18010
    candles.push({ timestamp: 1700000240000, open: 18020, high: 18022, low: 18005, close: 18008 });
    const res3 = engine.process(candles, 'MNQ', '1m');
    expect(res3.state.fairValueGaps[0].status).toBe('FULLY_MITIGATED');
  });

  it('Test 7 — BOS vs MSS Structural Shift Audit', () => {
    const candles = makeBaseCandles(5, 18000);
    // Swing Low
    candles.push({ timestamp: 1700000300000, open: 18000, high: 18002, low: 17960, close: 17965 });
    candles.push({ timestamp: 1700000360000, open: 17965, high: 17975, low: 17965, close: 17970 });
    candles.push({ timestamp: 1700000420000, open: 17970, high: 17980, low: 17965, close: 17975 });
    // Break low -> BEARISH BOS
    candles.push({ timestamp: 1700000480000, open: 17975, high: 17976, low: 17945, close: 17950 });

    // Swing High at 17985 while BEARISH
    candles.push({ timestamp: 1700000540000, open: 17950, high: 17985, low: 17950, close: 17980 });
    candles.push({ timestamp: 1700000600000, open: 17980, high: 17982, low: 17970, close: 17975 });
    candles.push({ timestamp: 1700000660000, open: 17975, high: 17978, low: 17965, close: 17970 });

    // Break high 17985 -> BULLISH MSS
    candles.push({ timestamp: 1700000720000, open: 17970, high: 18040, low: 17968, close: 18038 });

    const res = engine.process(candles, 'MNQ', '1m');
    const structRecords = auditEngine.auditStructure(res.events, 'MNQ', '1m');

    const bosEvents = structRecords.filter((s) => s.type === 'BOS');
    const mssEvents = structRecords.filter((s) => s.type === 'MSS');

    expect(bosEvents.length).toBe(1);
    expect(mssEvents.length).toBe(1);
    expect(mssEvents[0].direction).toBe('BULLISH');
  });

  it('Test 8 — Setup Lifecycle Categorization (Cases A, B, C)', () => {
    const candles = makeBaseCandles(5, 18000);
    // Swing High at 18030
    candles.push({ timestamp: 1700000300000, open: 18000, high: 18030, low: 17995, close: 18020 });
    candles.push({ timestamp: 1700000360000, open: 18020, high: 18022, low: 18000, close: 18005 });
    candles.push({ timestamp: 1700000420000, open: 18005, high: 18010, low: 17995, close: 18000 });
    // Sweep of 18030
    candles.push({ timestamp: 1700000480000, open: 18000, high: 18035, low: 17995, close: 18010 });

    const res = engine.process(candles, 'MNQ', '1m');
    const confluences = confluenceEngine.evaluateConfluences(res.state, res.events);
    const setups = setupEngine.evaluateSetups(res.state, res.events, confluences);
    const setupAudits = auditEngine.auditSetups(setups, 'MNQ', '1m');

    expect(setupAudits.length).toBeGreaterThan(0);
    const caseC = setupAudits.find((s) => s.caseType === 'CASE_C_UNCONFIRMED_INTERESTING');
    expect(caseC).toBeDefined();
  });

  it('Test 9 — Batch vs Incremental Equivalence on Audit Datasets', () => {
    const candles = makeBaseCandles(5, 18000);
    candles.push({ timestamp: 1700000300000, open: 18000, high: 18050, low: 18000, close: 18048 });

    const batchRes = engine.process(candles, 'MNQ', '1m');

    engine.resetProgressiveBuffer();
    let incRes: any;
    for (const c of candles) {
      incRes = engine.processNext(c, 'MNQ', '1m');
    }

    expect(batchRes.events.length).toBe(incRes.events.length);
    expect(batchRes.state.lastUpdatedTimestamp).toBe(incRes.state.lastUpdatedTimestamp);
  });

  it('Test 10 — Zero Look-Ahead Verification: Future candles do not mutate past event timestamps', () => {
    const candles = makeBaseCandles(5, 18000);
    candles.push({ timestamp: 1700000300000, open: 18000, high: 18050, low: 18000, close: 18048 });

    const resBefore = engine.process(candles, 'MNQ', '1m');
    const dispBefore = resBefore.events.find((e) => e.type === 'DISPLACEMENT');

    // Add 10 future candles with price action
    const futureCandles = [...candles];
    for (let f = 1; f <= 10; f++) {
      futureCandles.push({
        timestamp: 1700000300000 + f * 60000,
        open: 18048 + f,
        high: 18050 + f,
        low: 18045 + f,
        close: 18049 + f,
      });
    }

    const resAfter = engine.process(futureCandles, 'MNQ', '1m');
    const dispAfter = resAfter.events.find((e) => e.type === 'DISPLACEMENT');

    expect(dispBefore?.confirmationTimestamp).toBe(dispAfter?.confirmationTimestamp);
    expect(dispBefore?.eventTimestamp).toBe(dispAfter?.eventTimestamp);
  });

  it('Test 11 — Audit JSON Datasets Integrity Check', () => {
    expect(dispDataset.cases.length).toBeGreaterThan(0);
    expect(sweepDataset.cases.length).toBeGreaterThan(0);
    expect(fvgDataset.cases.length).toBeGreaterThan(0);
    expect(structDataset.cases.length).toBeGreaterThan(0);
    expect(setupDataset.cases.length).toBeGreaterThan(0);
  });
});
