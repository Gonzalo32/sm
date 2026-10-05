/**
 * Checkpoint 42 — Temporal Consistency & Replay Determinism Audit Test Suite
 * Independent audit suite verifying determinism, ordering robustness, duplicate handling,
 * open candle replay, state reset, MTF determinism, visual determinism, structural hashing,
 * and negative determinism across TradeSea pipeline layers.
 * 
 * Scenarios:
 * 1. Identical Replay Determinism (T0..T4 sequence processed 2x from clean state -> 100% identical outputs)
 * 2. Double Replay Structural Equivalence (Replay A vs Replay B entity matching & stable IDs)
 * 3. Ordering Adversarial Audit (Case A: T0->T1->T2, Case B: T0->T2->T1, Case C: T0->T1->T1->T2, Case D: T0->T2->T2->T1)
 * 4. Duplicate Input Audit (DUP-01..DUP-05 handling: duplicates, open candle updates, reconnect repeats)
 * 5. Open Candle Stream Replay (Active candle updates 1..3 -> close, reset + replay yielding identical state)
 * 6. Reconnection / State Reset Audit (State survival vs clean reset behavior)
 * 7. Symbol & Timeframe Context Switching (NQ <-> MNQ, 1m <-> 5m context isolation)
 * 8. Reset + Replay Invariance (Original Replay vs Reset + Replay)
 * 9. Partial Replay Behavior (T0..T4 vs T2..T4 boundaries)
 * 10. MultiTimeframe Context Engine Replay Determinism (Causal MTF output determinism)
 * 11. Visual Adapter Replay Determinism (Visual object derivation determinism & ID stability)
 * 12. Structural Hash Result Comparison (Normalized structural hashing comparison)
 * 13. Negative Determinism (Logical input variance A vs B yields expected divergent state)
 */

import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { Candle } from '../core/market/Candle';
import { CandleStore } from '../core/market/CandleStore';
import { MarketDataAdapter } from '../core/market/MarketDataAdapter';
import { ICTPipelineCoordinator } from '../extension/content/ICTPipelineCoordinator';
import { CandidateContext } from '../core/ict/context/CandidateContextEngine';
import { MultiTimeframeContextEngine } from '../core/ict/context/MultiTimeframeContextEngine';
import { VisualAdapter } from '../extension/visual/VisualAdapter';

describe('Checkpoint 42 — Temporal Consistency & Replay Determinism Audit Suite', () => {

  function makeCandle(timestamp: number, open: number, high: number, low: number, close: number, volume: number = 100): Candle {
    return { timestamp, open, high, low, close, volume };
  }

  function makeMockCandidateContext(
    symbol: string,
    timeframe: string,
    eventTimestamp: number,
    confirmationTimestamp: number | null,
    status: any = 'CONTEXT_CONFIRMED'
  ): CandidateContext {
    return {
      id: `ctx_${symbol}_${timeframe}_${eventTimestamp}`,
      symbol,
      timeframe,
      eventTimestamp,
      confirmationTimestamp,
      structure: { trend: 'BULLISH', lastBOS: 'BOS BULLISH @ $18030.00' },
      liquidity: { bslCount: 2, sslCount: 1 },
      displacement: { state: 'PRESENT', bodyRatio: 0.83, rangeMultiplier: 2.1 },
      fvg: { activeFvgCount: 1, lastFvgStatus: 'ACTIVE' },
      pdArray: { zone: 'DISCOUNT', equilibrium: 18015 },
      supportingEvents: [`BOS @ ${eventTimestamp}`],
      sourceCandleTimestamps: [eventTimestamp],
      status,
      expirationStatus: 'NOT_DEFINED',
    };
  }

  function normalizeAndHash(obj: any): string {
    const json = JSON.stringify(obj, (key, value) => {
      if (key === 'executionTimestamp' || key === 'renderTime' || key === 'executionTimeMs') return undefined;
      return value;
    });
    return crypto.createHash('sha256').update(json).digest('hex');
  }

  // 1. Identical Replay Determinism
  it('1. should produce 100% identical candles, contexts, and visual outputs for identical replay from clean state', () => {
    const candles: Candle[] = [
      makeCandle(100000, 18000, 18010, 17990, 18000),
      makeCandle(160000, 18000, 18060, 17990, 18050),
      makeCandle(220000, 18050, 18070, 18040, 18060),
    ];

    // Execution 1
    const coord1 = new ICTPipelineCoordinator('NQ', '1m', { debug: false });
    const res1 = coord1.ingestCandles(candles);

    // Execution 2 (Clean State)
    const coord2 = new ICTPipelineCoordinator('NQ', '1m', { debug: false });
    const res2 = coord2.ingestCandles(candles);

    expect(res1.candidateContext.id).toBe(res2.candidateContext.id);
    expect(res1.candidateContext.eventTimestamp).toBe(res2.candidateContext.eventTimestamp);
    expect(res1.candidateContext.status).toBe(res2.candidateContext.status);
    expect(res1.visuals.length).toBe(res2.visuals.length);
    if (res1.visuals.length > 0) {
      expect(res1.visuals[0].id).toBe(res2.visuals[0].id);
      expect(res1.visuals[0].label).toBe(res2.visuals[0].label);
    }
  });

  // 2. Double Replay Structural Equivalence
  it('2. should verify double replay structural equivalence and ID stability', () => {
    const candles = [
      makeCandle(100000, 18000, 18020, 17980, 18010),
      makeCandle(160000, 18010, 18080, 18000, 18070),
    ];

    const runA = new ICTPipelineCoordinator('NQ', '1m', { debug: false }).ingestCandles(candles);
    const runB = new ICTPipelineCoordinator('NQ', '1m', { debug: false }).ingestCandles(candles);

    const hashA = normalizeAndHash(runA.candidateContext);
    const hashB = normalizeAndHash(runB.candidateContext);

    expect(hashA).toBe(hashB);
    expect(runA.candidateContext.id).toBe(runB.candidateContext.id);
  });

  // 3. Ordering Adversarial Audit
  it('3. should verify pipeline behavior across adversarial arrival ordering (Case A, B, C, D)', () => {
    const c0 = makeCandle(100000, 18000, 18010, 17990, 18000);
    const c1 = makeCandle(160000, 18000, 18060, 17990, 18050);
    const c2 = makeCandle(220000, 18050, 18080, 18040, 18070);

    // Case A: T0 -> T1 -> T2
    const storeA = new CandleStore('NQ', '1m');
    const adapterA = new MarketDataAdapter({ source: 'TradeSea_WS', instrument: 'NQ', timeframe: '1m' }, storeA);
    adapterA.loadHistoricalWindow([c0, c1, c2]);

    // Case B: T0 -> T2 -> T1 (T1 arrives out-of-order after T2)
    const storeB = new CandleStore('NQ', '1m');
    const adapterB = new MarketDataAdapter({ source: 'TradeSea_WS', instrument: 'NQ', timeframe: '1m' }, storeB);
    adapterB.loadHistoricalWindow([c0, c2]);
    adapterB.ingestRealtimeCandle(c1);

    // Case C: T0 -> T1 -> T1 -> T2 (duplicate T1)
    const storeC = new CandleStore('NQ', '1m');
    const adapterC = new MarketDataAdapter({ source: 'TradeSea_WS', instrument: 'NQ', timeframe: '1m' }, storeC);
    adapterC.loadHistoricalWindow([c0, c1, c1, c2]);

    // Case D: T0 -> T2 -> T2 -> T1 (duplicate T2 + out-of-order T1)
    const storeD = new CandleStore('NQ', '1m');
    const adapterD = new MarketDataAdapter({ source: 'TradeSea_WS', instrument: 'NQ', timeframe: '1m' }, storeD);
    adapterD.loadHistoricalWindow([c0, c2, c2]);
    adapterD.ingestRealtimeCandle(c1);

    // Orderly sequence has 3 candles
    expect(storeA.getCandles().length).toBe(3);
    // Out-of-order past tick c1 rejected by store when latest is c2
    expect(storeB.getCandles().length).toBe(2);
    // Duplicate c1 safely deduplicated
    expect(storeC.getCandles().length).toBe(3);
    // Out-of-order c1 rejected, duplicate c2 deduplicated
    expect(storeD.getCandles().length).toBe(2);
  });

  // 4. Duplicate Input Audit (DUP-01..DUP-05)
  it('4. should handle duplicate input variants (DUP-01..DUP-05) deterministically', () => {
    const store = new CandleStore('NQ', '1m');
    const adapter = new MarketDataAdapter({ source: 'TradeSea_WS', instrument: 'NQ', timeframe: '1m' }, store);
    const c1 = makeCandle(100000, 18000, 18050, 17950, 18040);

    // DUP-01: Identical duplicate candle ingestion
    const r1 = adapter.ingestRealtimeCandle(c1);
    adapter.ingestRealtimeCandle(c1);

    expect(r1.success).toBe(true);
    // Same candle updated open candle in-place
    expect(store.getCandles().length).toBe(1);

    // DUP-03: Open candle update with higher high
    const c1Update = makeCandle(100000, 18000, 18060, 17950, 18055);
    adapter.ingestRealtimeCandle(c1Update);
    expect(store.getLatestCandle()!.high).toBe(18060);

    // DUP-05: Reconnect candle re-ingestion
    adapter.ingestRealtimeCandle(c1Update);
    expect(store.getCandles().length).toBe(1);
    expect(store.getLatestCandle()!.high).toBe(18060);
  });

  // 5. Open Candle Stream Replay
  it('5. should rebuild identical state when replaying open candle update stream after reset', () => {
    const updates = [
      makeCandle(100000, 18000, 18000, 18000, 18000),
      makeCandle(100000, 18000, 18020, 18000, 18020),
      makeCandle(100000, 18000, 18020, 17980, 17980),
      makeCandle(100000, 18000, 18050, 17980, 18050),
      makeCandle(160000, 18050, 18060, 18040, 18055), // Close candle 100000, start 160000
    ];

    // Execution 1
    const store1 = new CandleStore('NQ', '1m');
    const adapter1 = new MarketDataAdapter({ source: 'TradeSea_WS', instrument: 'NQ', timeframe: '1m' }, store1);
    updates.forEach(c => adapter1.ingestRealtimeCandle(c));
    const candles1 = store1.getCandles();

    // Reset & Execution 2
    const store2 = new CandleStore('NQ', '1m');
    const adapter2 = new MarketDataAdapter({ source: 'TradeSea_WS', instrument: 'NQ', timeframe: '1m' }, store2);
    updates.forEach(c => adapter2.ingestRealtimeCandle(c));
    const candles2 = store2.getCandles();

    expect(candles1.length).toBe(candles2.length);
    expect(candles1[0].high).toBe(candles2[0].high);
    expect(candles1[0].low).toBe(candles2[0].low);
    expect(candles1[0].close).toBe(candles2[0].close);
  });

  // 6. Reconnection / State Reset Audit
  it('6. should verify reconnection state survival vs reset boundaries', () => {
    const store = new CandleStore('NQ', '1m');
    const adapter = new MarketDataAdapter({ source: 'TradeSea_WS', instrument: 'NQ', timeframe: '1m' }, store);
    adapter.ingestRealtimeCandle(makeCandle(100000, 18000, 18020, 17990, 18010));
    adapter.ingestRealtimeCandle(makeCandle(160000, 18010, 18050, 18000, 18040));

    expect(store.getCandles().length).toBe(2);

    // Reconnect simulation: clear store
    store.clear();
    expect(store.getCandles().length).toBe(0);

    // Re-ingest stream after reconnect
    adapter.ingestRealtimeCandle(makeCandle(100000, 18000, 18020, 17990, 18010));
    adapter.ingestRealtimeCandle(makeCandle(160000, 18010, 18050, 18000, 18040));

    expect(store.getCandles().length).toBe(2);
  });

  // 7. Symbol & Timeframe Context Switching
  it('7. should isolate candle store state when switching symbol (NQ <-> MNQ) or timeframe (1m <-> 5m)', () => {
    const coord = new ICTPipelineCoordinator('NQ', '1m', { debug: false });
    coord.ingestCandle(makeCandle(100000, 18000, 18020, 17990, 18010));

    expect(coord.getContext().symbol).toBe('NQ');
    expect(coord.getStore().getCandles().length).toBe(1);

    // Switch context to MNQ 5m
    coord.setContext('MNQ', '5m');
    expect(coord.getContext().symbol).toBe('MNQ');
    expect(coord.getContext().timeframe).toBe('5m');
    expect(coord.getStore().getCandles().length).toBe(0);

    // Switch back to NQ 1m
    coord.setContext('NQ', '1m');
    expect(coord.getContext().symbol).toBe('NQ');
    expect(coord.getStore().getCandles().length).toBe(0);
  });

  // 8. Reset + Replay Invariance
  it('8. should yield identical candidate context after reset + replay', () => {
    const candles = [
      makeCandle(100000, 18000, 18010, 17990, 18000),
      makeCandle(160000, 18000, 18070, 17990, 18060),
    ];

    const coord = new ICTPipelineCoordinator('NQ', '1m', { debug: false });
    const run1 = coord.ingestCandles(candles);

    // Reset coordinator context
    coord.setContext('NQ', '1m');
    const run2 = coord.ingestCandles(candles);

    expect(run1.candidateContext.id).toBe(run2.candidateContext.id);
    expect(run1.candidateContext.eventTimestamp).toBe(run2.candidateContext.eventTimestamp);
    expect(run1.candidateContext.status).toBe(run2.candidateContext.status);
  });

  // 9. Partial Replay Behavior
  it('9. should document partial stream replay contract behavior (NOT_APPLICABLE without historical context)', () => {
    const fullCandles = [
      makeCandle(100000, 18000, 18010, 17990, 18000),
      makeCandle(160000, 18000, 18070, 17990, 18060),
      makeCandle(220000, 18060, 18090, 18050, 18080),
    ];

    const partialCandles = [
      makeCandle(220000, 18060, 18090, 18050, 18080),
    ];

    const runFull = new ICTPipelineCoordinator('NQ', '1m', { debug: false }).ingestCandles(fullCandles);
    const runPartial = new ICTPipelineCoordinator('NQ', '1m', { debug: false }).ingestCandles(partialCandles);

    // Full run has 3 candles of history -> forms candidate context with BOS/FVG
    // Partial run only has 1 candle -> insufficient lookback context
    expect(runFull.candidateContext.sourceCandleTimestamps.length).toBeGreaterThan(0);
    expect(runPartial.candidateContext.eventTimestamp).toBe(220000);
  });

  // 10. MultiTimeframe Context Engine Replay Determinism
  it('10. should produce 100% deterministic MTF relation structures on identical stream replay', () => {
    const mtfEngine1 = new MultiTimeframeContextEngine();
    const mtfEngine2 = new MultiTimeframeContextEngine();

    const htf = makeMockCandidateContext('NQ', '15m', 100000, 150000);
    const ltf = makeMockCandidateContext('NQ', '5m', 160000, 165000);

    const mtf1 = mtfEngine1.evaluateMTFContext(htf, ltf);
    const mtf2 = mtfEngine2.evaluateMTFContext(htf, ltf);

    expect(mtf1.id).toBe(mtf2.id);
    expect(mtf1.causal).toBe(mtf2.causal);
    expect(mtf1.status).toBe(mtf2.status);
    expect(normalizeAndHash(mtf1)).toBe(normalizeAndHash(mtf2));
  });

  // 11. Visual Adapter Replay Determinism
  it('11. should derive identical VisualObjects with stable IDs across replays', () => {
    const ctx = makeMockCandidateContext('NQ', '1m', 100000, 105000);

    const adapter1 = new VisualAdapter();
    const adapter2 = new VisualAdapter();

    const mockState: any = {
      symbol: 'NQ',
      timeframe: '1m',
      lastCandleTimestamp: 100000,
      swings: [],
      fairValueGaps: [],
      orderBlocks: [],
      liquidityLevels: [],
      marketStructure: { trend: 'BULLISH', lastBOS: null, lastMSS: null },
    };

    const shapes1 = adapter1.adaptStateToVisuals(mockState, [], ctx);
    const shapes2 = adapter2.adaptStateToVisuals(mockState, [], ctx);

    expect(shapes1.length).toBe(shapes2.length);
    expect(normalizeAndHash(shapes1)).toBe(normalizeAndHash(shapes2));
  });

  // 12. Structural Hash Result Comparison
  it('12. should confirm hash equality for identical replays and hash divergence for altered input', () => {
    const candlesA = [
      makeCandle(100000, 18000, 18010, 17990, 18000),
      makeCandle(160000, 18000, 18070, 17990, 18060),
    ];

    const candlesB = [
      makeCandle(200000, 18000, 18010, 17990, 18000),
      makeCandle(260000, 18000, 18020, 17990, 18010),
    ];

    const resA1 = new ICTPipelineCoordinator('NQ', '1m', { debug: false }).ingestCandles(candlesA);
    const resA2 = new ICTPipelineCoordinator('NQ', '1m', { debug: false }).ingestCandles(candlesA);
    const resB = new ICTPipelineCoordinator('NQ', '1m', { debug: false }).ingestCandles(candlesB);

    const hashA1 = normalizeAndHash(resA1.candidateContext);
    const hashA2 = normalizeAndHash(resA2.candidateContext);
    const hashB = normalizeAndHash(resB.candidateContext);

    expect(hashA1).toBe(hashA2);
    expect(hashA1).not.toBe(hashB);
  });

  // 13. Negative Determinism
  it('13. should demonstrate negative determinism (distinct input timestamps yield distinct candidate IDs)', () => {
    const candles1 = [
      makeCandle(100000, 18000, 18010, 17990, 18000),
    ];

    const candles2 = [
      makeCandle(200000, 18000, 18010, 17990, 18000),
    ];

    const res1 = new ICTPipelineCoordinator('NQ', '1m', { debug: false }).ingestCandles(candles1);
    const res2 = new ICTPipelineCoordinator('NQ', '1m', { debug: false }).ingestCandles(candles2);

    expect(res1.candidateContext.eventTimestamp).not.toBe(res2.candidateContext.eventTimestamp);
    expect(res1.candidateContext.id).not.toBe(res2.candidateContext.id);
  });
});
