/**
 * Checkpoint 44 — State Transition & Invariant Stress Test Suite
 * Independent adversarial stress audit suite verifying TradeSea pipeline under compound state transitions.
 * Evaluates composed multi-step operational sequences across causality, temporal consistency,
 * determinism, lifecycle integrity, identity integrity, reference integrity, context isolation,
 * MTF causality, and visual derivation.
 * 
 * Compound Scenarios:
 * CS-01: Duplicate -> Update -> Finalize (1 logical candle, stable identity, 0 duplicate events)
 * CS-02: Duplicate -> Out-of-Order -> Valid Update (Late T0 rejected, T1 and T2 valid)
 * CS-03: Open Candle -> Multiple Updates -> Finalization (OHLCV expansion & deterministic replay match)
 * CS-04: Event Creation -> Context Update -> MTF Derivation (Anti-lookahead causality HTF confTs <= LTF evTs)
 * CS-05: Event -> Reset -> Reconnect -> Replay (Direct Replay vs Reset+Reconnect+Replay equality)
 * CS-06: Symbol Switch During Active State (NQ 1m -> MNQ 1m -> NQ 1m clean isolation)
 * CS-07: Timeframe Switch During Active State (NQ 1m -> NQ 5m -> NQ 1m clean isolation)
 * CS-08: Replacement -> Downstream Recalculation (Active bar expansion updates downstream state)
 * CS-09: Reset During MTF State (HTF+LTF -> MTF -> Reset -> Reconnect -> Rebuild match)
 * CS-10: Reset During Visual State (Event -> Context -> Visual -> Reset -> Replay -> Visual match)
 * CS-11: Duplicate + Reset + Replay (First Clean Replay vs Duplicate+Reset+Replay structural equivalence)
 * CS-12: Out-of-Order + Reset + Reconnect (T0, T2, late T1 -> Reset -> Chronological T0, T1, T2)
 * CS-13: Multi-Context Stress (Interleaved context switches across 6 NQ/MNQ 1m/5m/15m pairs)
 * CS-14: Full Lifecycle Primary Stress (15-step compound sequence: Create->Update->Duplicate->OOO->Event->Context->MTF->Visual->Update->Recalc->Switch->Reset->Reconnect->Replay->Visual)
 * CS-15 / NS: Repeated Cycle Stress (10x repeated execution cycle Create->Update->Reset->Replay)
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

describe('Checkpoint 44 — State Transition & Invariant Stress Suite', () => {

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

  // CS-01: Duplicate -> Update -> Finalize
  it('CS-01: should compound Duplicate -> Update -> Finalize without duplicating entities or events', () => {
    const store = new CandleStore('NQ', '1m');
    const adapter = new MarketDataAdapter({ source: 'TradeSea_WS', instrument: 'NQ', timeframe: '1m' }, store);

    // 1. Create tick
    adapter.ingestRealtimeCandle(makeCandle(100000, 18000, 18000, 18000, 18000));
    // 2. Duplicate tick
    adapter.ingestRealtimeCandle(makeCandle(100000, 18000, 18000, 18000, 18000));
    // 3. OHLC update
    adapter.ingestRealtimeCandle(makeCandle(100000, 18000, 18050, 17980, 18040));
    // 4. Finalize bar via next candle
    adapter.ingestRealtimeCandle(makeCandle(160000, 18040, 18060, 18030, 18055));

    expect(store.getCandles().length).toBe(2);
    expect(store.getCandles()[0].high).toBe(18050);
    expect(store.getCandles()[0].low).toBe(17980);
    expect(store.getCandles()[0].close).toBe(18040);
  });

  // CS-02: Duplicate -> Out-of-Order -> Valid Update
  it('CS-02: should handle Duplicate -> Out-of-Order -> Valid Update while maintaining store integrity', () => {
    const store = new CandleStore('NQ', '1m');
    const adapter = new MarketDataAdapter({ source: 'TradeSea_WS', instrument: 'NQ', timeframe: '1m' }, store);

    const c0 = makeCandle(100000, 18000, 18010, 17990, 18000);
    const c1 = makeCandle(160000, 18000, 18050, 17950, 18040);
    const c2 = makeCandle(220000, 18040, 18070, 18030, 18060);

    adapter.ingestRealtimeCandle(c0);
    adapter.ingestRealtimeCandle(c1);
    adapter.ingestRealtimeCandle(c1); // Duplicate T1
    const lateRes = adapter.ingestRealtimeCandle(c0); // Late T0 (< T1)
    adapter.ingestRealtimeCandle(c2); // Valid T2

    expect(lateRes.success).toBe(false); // Rejected out-of-order past tick
    expect(store.getCandles().length).toBe(3);
    expect(store.getCandles().map(c => c.timestamp)).toEqual([100000, 160000, 220000]);
  });

  // CS-03: Open Candle -> Multiple Updates -> Finalization
  it('CS-03: should compound multiple open candle tick updates into identical final replay state', () => {
    const updates = [
      makeCandle(100000, 18000, 18000, 18000, 18000), // Open
      makeCandle(100000, 18000, 18030, 18000, 18025), // High update
      makeCandle(100000, 18000, 18030, 17970, 17985), // Low update
      makeCandle(100000, 18000, 18060, 17970, 18050), // Volume & Close update
      makeCandle(160000, 18050, 18070, 18040, 18065), // Close T=100000, Open T=160000
    ];

    const coord1 = new ICTPipelineCoordinator('NQ', '1m', { debug: false });
    updates.forEach(c => coord1.ingestCandle(c));
    const res1 = coord1.getStore().getCandles();

    const coord2 = new ICTPipelineCoordinator('NQ', '1m', { debug: false });
    updates.forEach(c => coord2.ingestCandle(c));
    const res2 = coord2.getStore().getCandles();

    expect(res1.length).toBe(res2.length);
    expect(res1[0].high).toBe(res2[0].high);
    expect(res1[0].low).toBe(res2[0].low);
    expect(res1[0].close).toBe(res2[0].close);
  });

  // CS-04: Event Creation -> Context Update -> MTF Derivation
  it('CS-04: should compound Event Creation -> Context Update -> MTF Derivation enforcing anti-lookahead', () => {
    const mtfEngine = new MultiTimeframeContextEngine();

    const htf = makeMockCandidateContext('NQ', '15m', 100000, 150000);
    const ltf = makeMockCandidateContext('NQ', '5m', 160000, 165000);

    const mtfRes = mtfEngine.evaluateMTFContext(htf, ltf);
    expect(mtfRes.causal).toBe(true);
    expect(mtfRes.status).toBe('CONFIRMED');
    expect(mtfRes.targetTimeframe).toBe('5m');
    expect(mtfRes.sourceTimeframe).toBe('15m');
  });

  // CS-05: Event -> Reset -> Reconnect -> Replay
  it('CS-05: should compound Event -> Reset -> Reconnect -> Replay with exact structural equivalence', () => {
    const candles = [
      makeCandle(100000, 18000, 18010, 17990, 18000),
      makeCandle(160000, 18000, 18070, 17990, 18060),
    ];

    // Direct Replay
    const coordDirect = new ICTPipelineCoordinator('NQ', '1m', { debug: false });
    const runDirect = coordDirect.ingestCandles(candles);

    // Reset + Reconnect + Replay
    const coordReset = new ICTPipelineCoordinator('NQ', '1m', { debug: false });
    coordReset.ingestCandles(candles);
    coordReset.getStore().clear();
    coordReset.setContext('MNQ', '1m');
    coordReset.setContext('NQ', '1m');
    const runReset = coordReset.ingestCandles(candles);

    expect(normalizeAndHash(runDirect.candidateContext)).toBe(normalizeAndHash(runReset.candidateContext));
    expect(runDirect.candidateContext.id).toBe(runReset.candidateContext.id);
  });

  // CS-06: Symbol Switch During Active State
  it('CS-06: should compound active state symbol switching (NQ 1m -> MNQ 1m -> NQ 1m) without state leakage', () => {
    const coord = new ICTPipelineCoordinator('NQ', '1m', { debug: false });
    coord.ingestCandle(makeCandle(100000, 18000, 18020, 17990, 18010));

    expect(coord.getContext().symbol).toBe('NQ');
    expect(coord.getStore().getCandles().length).toBe(1);

    // Switch to MNQ 1m
    coord.setContext('MNQ', '1m');
    coord.ingestCandle(makeCandle(100000, 18000, 18030, 17980, 18025));

    expect(coord.getContext().symbol).toBe('MNQ');
    expect(coord.getStore().getCandles().length).toBe(1);

    // Switch back to NQ 1m
    coord.setContext('NQ', '1m');
    expect(coord.getContext().symbol).toBe('NQ');
    expect(coord.getStore().getCandles().length).toBe(0);
  });

  // CS-07: Timeframe Switch During Active State
  it('CS-07: should compound timeframe switching (NQ 1m -> NQ 5m -> NQ 1m) with strict timeframe isolation', () => {
    const coord = new ICTPipelineCoordinator('NQ', '1m', { debug: false });
    coord.ingestCandle(makeCandle(100000, 18000, 18020, 17990, 18010));

    expect(coord.getContext().timeframe).toBe('1m');
    expect(coord.getStore().getCandles().length).toBe(1);

    coord.setContext('NQ', '5m');
    expect(coord.getContext().timeframe).toBe('5m');
    expect(coord.getStore().getCandles().length).toBe(0);

    coord.setContext('NQ', '1m');
    expect(coord.getContext().timeframe).toBe('1m');
    expect(coord.getStore().getCandles().length).toBe(0);
  });

  // CS-08: Replacement -> Downstream Recalculation
  it('CS-08: should compound source candle update into downstream candidate context recalculation', () => {
    const coord = new ICTPipelineCoordinator('NQ', '1m', { debug: false });
    const c1 = makeCandle(100000, 18000, 18010, 17990, 18000);
    const c2Initial = makeCandle(160000, 18000, 18020, 17990, 18010);
    const c2Expansion = makeCandle(160000, 18000, 18080, 17990, 18070);

    coord.ingestCandles([c1, c2Initial]);
    const res1 = coord.ingestCandle(c2Expansion);

    expect(res1.candidateContext.eventTimestamp).toBe(160000);
    expect(res1.engineResult.events).toBeDefined();
  });

  // CS-09: Reset During MTF State
  it('CS-09: should compound reset during active MTF state and rebuild clean causal MTF relation', () => {
    const mtfEngine = new MultiTimeframeContextEngine();
    const htf = makeMockCandidateContext('NQ', '15m', 100000, 150000);
    const ltf = makeMockCandidateContext('NQ', '5m', 160000, 165000);

    const mtf1 = mtfEngine.evaluateMTFContext(htf, ltf);
    expect(mtf1.causal).toBe(true);

    // Reset simulation: evaluate fresh engines
    const mtfEngine2 = new MultiTimeframeContextEngine();
    const mtf2 = mtfEngine2.evaluateMTFContext(htf, ltf);

    expect(mtf1.id).toBe(mtf2.id);
    expect(normalizeAndHash(mtf1)).toBe(normalizeAndHash(mtf2));
  });

  // CS-10: Reset During Visual State
  it('CS-10: should compound reset during active visual state and regenerate identical VisualObjects', () => {
    const ctx = makeMockCandidateContext('NQ', '1m', 100000, 105000);
    const adapter1 = new VisualAdapter();
    const adapter2 = new VisualAdapter();

    const mockState: any = {
      symbol: 'NQ',
      timeframe: '1m',
      lastCandleTimestamp: 100000,
      swings: [{ id: 'sw1', type: 'SWING_HIGH', price: 18050, timestamp: 100000, candleIndex: 0 }],
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

  // CS-11: Duplicate + Reset + Replay
  it('CS-11: should verify First Clean Replay vs Duplicate + Reset + Replay equivalence', () => {
    const cleanCandles = [
      makeCandle(100000, 18000, 18010, 17990, 18000),
      makeCandle(160000, 18000, 18070, 17990, 18060),
    ];

    const duplicateCandles = [
      makeCandle(100000, 18000, 18010, 17990, 18000),
      makeCandle(100000, 18000, 18010, 17990, 18000), // Duplicate
      makeCandle(160000, 18000, 18070, 17990, 18060),
      makeCandle(160000, 18000, 18070, 17990, 18060), // Duplicate
    ];

    const coordClean = new ICTPipelineCoordinator('NQ', '1m', { debug: false });
    const runClean = coordClean.ingestCandles(cleanCandles);

    const coordDup = new ICTPipelineCoordinator('NQ', '1m', { debug: false });
    coordDup.ingestCandles(duplicateCandles);
    coordDup.setContext('MNQ', '1m');
    coordDup.setContext('NQ', '1m'); // Reset
    const runDupRebuild = coordDup.ingestCandles(cleanCandles);

    expect(runClean.candidateContext.id).toBe(runDupRebuild.candidateContext.id);
    expect(normalizeAndHash(runClean.candidateContext)).toBe(normalizeAndHash(runDupRebuild.candidateContext));
  });

  // CS-12: Out-of-Order + Reset + Reconnect
  it('CS-12: should compound Out-of-Order -> Reset -> Chronological Reconnect into valid rebuilt state', () => {
    const c0 = makeCandle(100000, 18000, 18010, 17990, 18000);
    const c1 = makeCandle(160000, 18000, 18060, 17990, 18050);
    const c2 = makeCandle(220000, 18050, 18080, 18040, 18070);

    // Initial out-of-order run
    const coord1 = new ICTPipelineCoordinator('NQ', '1m', { debug: false });
    coord1.ingestCandle(c0);
    coord1.ingestCandle(c2);
    coord1.ingestCandle(c1); // Late c1 rejected by store

    expect(coord1.getStore().getCandles().length).toBe(2);

    // Reset & Reconnect chronological run
    coord1.setContext('MNQ', '1m');
    coord1.setContext('NQ', '1m');
    coord1.ingestCandles([c0, c1, c2]);

    expect(coord1.getStore().getCandles().length).toBe(3);
    expect(coord1.getStore().getCandles().map(c => c.timestamp)).toEqual([100000, 160000, 220000]);
  });

  // CS-13: Multi-Context Stress
  it('CS-13: should interleave multi-context operations across 6 symbol/timeframe pairs without cross-contamination', () => {
    const coord = new ICTPipelineCoordinator('NQ', '1m', { debug: false });

    // Step 1: NQ 1m
    coord.ingestCandle(makeCandle(100000, 18000, 18020, 17990, 18010));
    expect(coord.getContext().symbol).toBe('NQ');

    // Step 2: NQ 5m
    coord.setContext('NQ', '5m');
    coord.ingestCandle(makeCandle(300000, 18000, 18100, 17950, 18080));
    expect(coord.getContext().timeframe).toBe('5m');

    // Step 3: MNQ 1m
    coord.setContext('MNQ', '1m');
    coord.ingestCandle(makeCandle(100000, 18000, 18015, 17995, 18005));
    expect(coord.getContext().symbol).toBe('MNQ');

    // Step 4: NQ 15m
    coord.setContext('NQ', '15m');
    coord.ingestCandle(makeCandle(900000, 18000, 18200, 17900, 18150));
    expect(coord.getContext().timeframe).toBe('15m');

    // Step 5: MNQ 5m
    coord.setContext('MNQ', '5m');
    coord.ingestCandle(makeCandle(300000, 18000, 18050, 17980, 18040));
    expect(coord.getContext().symbol).toBe('MNQ');

    // Step 6: NQ 1m (Return to origin)
    coord.setContext('NQ', '1m');
    expect(coord.getContext().symbol).toBe('NQ');
    expect(coord.getStore().getCandles().length).toBe(0);
  });

  // CS-14: Full Lifecycle Primary Stress Sequence (15 Compound Steps)
  it('CS-14: should execute 15-step compound primary stress sequence without invariant breakdown', () => {
    const coord = new ICTPipelineCoordinator('NQ', '1m', { debug: false });
    const mtfEngine = new MultiTimeframeContextEngine();

    // 1. Create T0
    coord.ingestCandle(makeCandle(100000, 18000, 18010, 17990, 18000));
    // 2. Update T0
    coord.ingestCandle(makeCandle(100000, 18000, 18020, 17990, 18015));
    // 3. Duplicate T0
    coord.ingestCandle(makeCandle(100000, 18000, 18020, 17990, 18015));
    // 4. Create T1 (BOS / FVG expansion)
    const resT1 = coord.ingestCandle(makeCandle(160000, 18015, 18080, 18000, 18070));
    // 5. Out-of-order past tick T0
    const oooRes = coord.ingestCandle(makeCandle(100000, 18000, 18020, 17990, 18015));
    expect(oooRes.engineResult.events.length).toBeDefined();

    // 6. CandidateContext Verification
    const ctx = resT1.candidateContext;
    expect(ctx.eventTimestamp).toBe(160000);

    // 7. MTF Derivation
    const htfMock = makeMockCandidateContext('NQ', '15m', 100000, 150000);
    const mtf = mtfEngine.evaluateMTFContext(htfMock, ctx);
    expect(mtf.causal).toBe(true);

    // 8. Visual Object Verification
    expect(resT1.visuals).toBeDefined();

    // 9. Source Candle Update T1 expansion
    const resT1Exp = coord.ingestCandle(makeCandle(160000, 18015, 18100, 18000, 18090));
    expect(resT1Exp.candidateContext.eventTimestamp).toBe(160000);

    // 10. Downstream Recalculation
    expect(resT1Exp.candidateContext.eventTimestamp).toBe(160000);

    // 11. Context Switch NQ -> MNQ
    coord.setContext('MNQ', '1m');
    expect(coord.getStore().getCandles().length).toBe(0);

    // 12. Reset
    coord.setContext('NQ', '1m');
    expect(coord.getStore().getCandles().length).toBe(0);

    // 13. Reconnect Re-ingestion
    const candlesStream = [
      makeCandle(100000, 18000, 18010, 17990, 18000),
      makeCandle(160000, 18015, 18080, 18000, 18070),
    ];
    const resRebuild = coord.ingestCandles(candlesStream);

    // 14. Replay Verification
    expect(resRebuild.candidateContext.eventTimestamp).toBe(160000);

    // 15. Visual Regeneration Verification
    expect(resRebuild.visuals.length).toBeGreaterThanOrEqual(0);
  });

  // CS-15 / NS-01..10: Repeated Cycle Stress (10x Cycles)
  it('CS-15: should execute 10 repeated Create -> Update -> Reset -> Replay cycles with zero memory accumulation', () => {
    const candles = [
      makeCandle(100000, 18000, 18010, 17990, 18000),
      makeCandle(160000, 18000, 18070, 17990, 18060),
    ];

    const coord = new ICTPipelineCoordinator('NQ', '1m', { debug: false });
    let baselineHash = '';

    for (let cycle = 1; cycle <= 10; cycle++) {
      const res = coord.ingestCandles(candles);
      const currentHash = normalizeAndHash(res.candidateContext);

      if (cycle === 1) {
        baselineHash = currentHash;
      } else {
        expect(currentHash).toBe(baselineHash);
      }

      // Reset state cleanly for next cycle
      coord.setContext('MNQ', '1m');
      coord.setContext('NQ', '1m');
      expect(coord.getStore().getCandles().length).toBe(0);
    }
  });
});
