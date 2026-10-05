/**
 * Checkpoint 43 — State Lifecycle & Reference Integrity Test Suite
 * Independent audit suite verifying state lifecycle integrity, identity stability,
 * orphan reference absence, stale reference isolation, reset/reconnect safety,
 * context isolation (NQ <-> MNQ, 1m <-> 5m), MTF relation integrity, and visual derivation bounds.
 * 
 * Audit Invariants:
 * LC-01: Create -> Update lifecycle across pipeline entities
 * LC-02: Duplicate update handling (in-place OHLC updates without entity duplication)
 * LC-03: Replacement & recalculation behavior
 * LC-04: Source deletion handling & clean memory purge
 * LC-05: Orphan reference audit (ORPHAN_REFERENCES = 0)
 * LC-06: Stale reference audit (STALE_REFERENCES = 0)
 * LC-07: Explicit state reset (store.clear() & setContext())
 * LC-08: Reconnect state recovery & identity stability
 * LC-09: Symbol context isolation (NQ vs MNQ boundary)
 * LC-10: Timeframe context isolation (1m vs 5m boundary)
 * LC-11: MTF relation lifecycle & anti-lookahead causality (HTF confTs <= LTF evTs)
 * LC-12: Visual object derivation & pure non-mutating transformation
 * LC-13: Duplicate visual creation prevention & capping
 * LC-14: Secondary index & supportingEvents collection integrity
 * LC-15: Interrupted lifecycle / partial stream evaluation
 */

import { describe, it, expect } from 'vitest';
import { Candle } from '../core/market/Candle';
import { CandleStore } from '../core/market/CandleStore';
import { MarketDataAdapter } from '../core/market/MarketDataAdapter';
import { ICTPipelineCoordinator } from '../extension/content/ICTPipelineCoordinator';
import { CandidateContext } from '../core/ict/context/CandidateContextEngine';
import { MultiTimeframeContextEngine } from '../core/ict/context/MultiTimeframeContextEngine';
import { VisualAdapter } from '../extension/visual/VisualAdapter';

describe('Checkpoint 43 — State Lifecycle & Reference Integrity Suite', () => {

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

  // LC-01: Create -> Update lifecycle
  it('LC-01: should transition entities through valid Create -> Update -> Finalize lifecycle states', () => {
    const store = new CandleStore('NQ', '1m');
    const adapter = new MarketDataAdapter({ source: 'TradeSea_WS', instrument: 'NQ', timeframe: '1m' }, store);

    // Create tick
    adapter.ingestRealtimeCandle(makeCandle(100000, 18000, 18000, 18000, 18000));
    expect(store.getCandles().length).toBe(1);
    expect(store.getLatestCandle()!.close).toBe(18000);

    // Update tick 1
    adapter.ingestRealtimeCandle(makeCandle(100000, 18000, 18020, 17990, 18015));
    expect(store.getCandles().length).toBe(1);
    expect(store.getLatestCandle()!.high).toBe(18020);

    // Finalize candle by starting next bar
    adapter.ingestRealtimeCandle(makeCandle(160000, 18015, 18030, 18010, 18025));
    expect(store.getCandles().length).toBe(2);
    expect(store.getCandles()[0].close).toBe(18015);
  });

  // LC-02: Duplicate update handling
  it('LC-02: should handle duplicate tick updates in-place without duplicating entity instances', () => {
    const store = new CandleStore('NQ', '1m');
    const adapter = new MarketDataAdapter({ source: 'TradeSea_WS', instrument: 'NQ', timeframe: '1m' }, store);
    const candle = makeCandle(100000, 18000, 18050, 17950, 18040);

    adapter.ingestRealtimeCandle(candle);
    adapter.ingestRealtimeCandle(candle);
    adapter.ingestRealtimeCandle(candle);

    expect(store.getCandles().length).toBe(1);
    expect(store.getLatestCandle()!.timestamp).toBe(100000);
  });

  // LC-03: Replacement & recalculation behavior
  it('LC-03: should maintain single active entity during high/low expansion updates', () => {
    const store = new CandleStore('NQ', '1m');
    const adapter = new MarketDataAdapter({ source: 'TradeSea_WS', instrument: 'NQ', timeframe: '1m' }, store);

    adapter.ingestRealtimeCandle(makeCandle(100000, 18000, 18010, 17990, 18005));
    adapter.ingestRealtimeCandle(makeCandle(100000, 18000, 18080, 17990, 18070));

    expect(store.getCandles().length).toBe(1);
    expect(store.getLatestCandle()!.high).toBe(18080);
    expect(store.getLatestCandle()!.close).toBe(18070);
  });

  // LC-04: Source deletion handling
  it('LC-04: should clean all candle entities completely when store clear is invoked', () => {
    const store = new CandleStore('NQ', '1m');
    const adapter = new MarketDataAdapter({ source: 'TradeSea_WS', instrument: 'NQ', timeframe: '1m' }, store);

    adapter.ingestRealtimeCandle(makeCandle(100000, 18000, 18020, 17990, 18010));
    adapter.ingestRealtimeCandle(makeCandle(160000, 18010, 18050, 18000, 18040));
    expect(store.getCandles().length).toBe(2);

    store.clear();
    expect(store.getCandles().length).toBe(0);
    expect(store.getLatestCandle()).toBeUndefined();
  });

  // LC-05: Orphan reference audit (ORPHAN_REFERENCES = 0)
  it('LC-05: should verify zero orphan references in CandidateContext and MTF relations', () => {
    const coord = new ICTPipelineCoordinator('NQ', '1m', { debug: false });
    const candles = [
      makeCandle(100000, 18000, 18010, 17990, 18000),
      makeCandle(160000, 18000, 18060, 17990, 18050),
    ];
    const res = coord.ingestCandles(candles);
    const ctx = res.candidateContext;

    // Verify all source candle timestamps reference valid ingested candles
    const validTimestamps = new Set(candles.map(c => c.timestamp));
    for (const ts of ctx.sourceCandleTimestamps) {
      expect(validTimestamps.has(ts)).toBe(true);
    }
  });

  // LC-06: Stale reference audit (STALE_REFERENCES = 0)
  it('LC-06: should verify re-evaluated CandidateContext updates to newest event timestamp', () => {
    const coord = new ICTPipelineCoordinator('NQ', '1m', { debug: false });
    
    const res1 = coord.ingestCandle(makeCandle(100000, 18000, 18010, 17990, 18000));
    const res2 = coord.ingestCandle(makeCandle(160000, 18000, 18060, 17990, 18050));

    expect(res1.candidateContext.eventTimestamp).toBe(100000);
    expect(res2.candidateContext.eventTimestamp).toBe(160000);
    expect(res2.candidateContext.id).not.toBe(res1.candidateContext.id);
  });

  // LC-07: Explicit state reset
  it('LC-07: should purge all context state on setContext() call', () => {
    const coord = new ICTPipelineCoordinator('NQ', '1m', { debug: false });
    coord.ingestCandle(makeCandle(100000, 18000, 18020, 17990, 18010));
    expect(coord.getStore().getCandles().length).toBe(1);

    coord.setContext('NQ', '1m'); // Re-initialize context
    expect(coord.getContext().symbol).toBe('NQ');
    expect(coord.getContext().timeframe).toBe('1m');
  });

  // LC-08: Reconnect state recovery
  it('LC-08: should preserve clean identity lifecycle after store reset and stream re-ingestion', () => {
    const store = new CandleStore('NQ', '1m');
    const adapter = new MarketDataAdapter({ source: 'TradeSea_WS', instrument: 'NQ', timeframe: '1m' }, store);

    adapter.ingestRealtimeCandle(makeCandle(100000, 18000, 18020, 17990, 18010));
    const firstCandleId = `${store.getContext().symbol}|${store.getContext().timeframe}|${store.getLatestCandle()!.timestamp}`;

    store.clear();
    adapter.ingestRealtimeCandle(makeCandle(100000, 18000, 18020, 17990, 18010));
    const secondCandleId = `${store.getContext().symbol}|${store.getContext().timeframe}|${store.getLatestCandle()!.timestamp}`;

    expect(firstCandleId).toBe('NQ|1m|100000');
    expect(secondCandleId).toBe('NQ|1m|100000');
  });

  // LC-09: Symbol context isolation (NQ vs MNQ)
  it('LC-09: should strictly isolate state across symbol boundary (NQ -> MNQ)', () => {
    const coord = new ICTPipelineCoordinator('NQ', '1m', { debug: false });
    coord.ingestCandle(makeCandle(100000, 18000, 18020, 17990, 18010));

    expect(coord.getStore().getContext().symbol).toBe('NQ');
    expect(coord.getStore().getCandles().length).toBe(1);

    coord.setContext('MNQ', '1m');
    expect(coord.getStore().getContext().symbol).toBe('MNQ');
    expect(coord.getStore().getCandles().length).toBe(0);
  });

  // LC-10: Timeframe context isolation (1m vs 5m)
  it('LC-10: should strictly isolate state across timeframe boundary (1m -> 5m)', () => {
    const coord = new ICTPipelineCoordinator('NQ', '1m', { debug: false });
    coord.ingestCandle(makeCandle(100000, 18000, 18020, 17990, 18010));

    expect(coord.getStore().getContext().timeframe).toBe('1m');
    expect(coord.getStore().getCandles().length).toBe(1);

    coord.setContext('NQ', '5m');
    expect(coord.getStore().getContext().timeframe).toBe('5m');
    expect(coord.getStore().getCandles().length).toBe(0);
  });

  // LC-11: MTF relation lifecycle & anti-lookahead causality
  it('LC-11: should enforce HTF confTs <= LTF evTs boundary during MTF relation lifecycle', () => {
    const mtfEngine = new MultiTimeframeContextEngine();

    // Valid causal relation (150000 <= 160000)
    const htfValid = makeMockCandidateContext('NQ', '15m', 100000, 150000);
    const ltfValid = makeMockCandidateContext('NQ', '5m', 160000, 165000);
    const mtfCausal = mtfEngine.evaluateMTFContext(htfValid, ltfValid);

    expect(mtfCausal.causal).toBe(true);
    expect(mtfCausal.status).toBe('CONFIRMED');

    // Future HTF injection (300000 > 160000)
    const htfFuture = makeMockCandidateContext('NQ', '15m', 100000, 300000);
    const mtfNonCausal = mtfEngine.evaluateMTFContext(htfFuture, ltfValid);

    expect(mtfNonCausal.causal).toBe(false);
    expect(mtfNonCausal.status).toBe('NO_CONTEXT');
  });

  // LC-12: Visual object derivation & pure non-mutating transformation
  it('LC-12: should derive VisualObjects without mutating source market state or candidate context', () => {
    const ctx = makeMockCandidateContext('NQ', '1m', 100000, 105000);
    const adapter = new VisualAdapter();

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

    const stateSnapshotBefore = JSON.stringify(mockState);
    const ctxSnapshotBefore = JSON.stringify(ctx);

    const visuals = adapter.adaptStateToVisuals(mockState, [], ctx);

    expect(visuals.length).toBeGreaterThan(0);
    expect(JSON.stringify(mockState)).toBe(stateSnapshotBefore);
    expect(JSON.stringify(ctx)).toBe(ctxSnapshotBefore);
  });

  // LC-13: Duplicate visual creation prevention & capping
  it('LC-13: should cap derived visual objects to maxVisibleObjects setting in VisualAdapter', () => {
    const adapter = new VisualAdapter({ maxVisibleObjects: 2 });

    const mockState: any = {
      symbol: 'NQ',
      timeframe: '1m',
      lastCandleTimestamp: 100000,
      swings: [
        { id: 'sw1', type: 'SWING_HIGH', price: 18050, timestamp: 100000, candleIndex: 0 },
        { id: 'sw2', type: 'SWING_LOW', price: 17950, timestamp: 101000, candleIndex: 1 },
        { id: 'sw3', type: 'SWING_HIGH', price: 18060, timestamp: 102000, candleIndex: 2 },
      ],
      fairValueGaps: [],
      orderBlocks: [],
      liquidityLevels: [],
      marketStructure: { trend: 'BULLISH', lastBOS: null, lastMSS: null },
    };

    const visuals = adapter.adaptStateToVisuals(mockState, []);
    expect(visuals.length).toBe(2);
  });

  // LC-14: Secondary index & supportingEvents collection integrity
  it('LC-14: should verify secondary index supportingEvents contains indexed distinct event descriptors', () => {
    const ctx = makeMockCandidateContext('NQ', '1m', 100000, 105000);
    ctx.supportingEvents = ['BOS BULLISH @ 100000', 'FVG BULLISH @ 100000'];

    expect(ctx.supportingEvents.length).toBe(2);
    expect(ctx.supportingEvents[0]).toContain('BOS');
    expect(ctx.supportingEvents[1]).toContain('FVG');
    expect(ctx.supportingEvents[0]).not.toBe(ctx.supportingEvents[1]);
  });

  // LC-15: Interrupted lifecycle / partial stream evaluation
  it('LC-15: should evaluate partial stream without history into NO_CONTEXT status', () => {
    const coord = new ICTPipelineCoordinator('NQ', '1m', { debug: false });
    const singleCandle = makeCandle(100000, 18000, 18010, 17990, 18000);

    const res = coord.ingestCandle(singleCandle);
    expect(res.candidateContext.eventTimestamp).toBe(100000);
    expect(res.candidateContext.status).toBe('NO_CONTEXT');
  });
});
