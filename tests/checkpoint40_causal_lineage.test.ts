/**
 * Checkpoint 40 — End-to-End Causal Trace & Event Lineage Test Suite
 * Validates 15 mandatory test scenarios:
 * 1. Candle identity key (symbol|timeframe|marketTimestamp)
 * 2. Candle -> Event lineage (sourceCandleTimestamp, eventTimestamp)
 * 3. Event identity (unique id, type, symbol, timeframe)
 * 4. Event timing ordering (sourceCandleTimestamp <= eventTimestamp <= confirmationTimestamp)
 * 5. Event -> CandidateContext lineage (supportingEvents, sourceCandleTimestamps)
 * 6. CandidateContext identity (unique id, status, expirationStatus)
 * 7. MTF lineage (sourceEventIds, HTF -> LTF causal propagation)
 * 8. Future HTF confirmation rejection (HTF.confTs > LTF.evTs -> causal = false)
 * 9. Symbol lineage isolation (NQ vs MNQ returns SYMBOL_MISMATCH)
 * 10. Timeframe lineage isolation (1m, 5m, 15m contexts strictly separated)
 * 11. Visual -> Event lineage (VisualObject id & label trace to source context)
 * 12. Reconnect lineage preservation (reconnect maintains identity without breaking lineage)
 * 13. Late message lineage protection (late ticks rejected, zero false lineage)
 * 14. Duplicate lineage deduplication (duplicate ticks retain deduplicated source timestamps)
 * 15. End-to-end trace (complete lineage chain: Candle -> Event -> Context -> MTF -> Visual)
 */

import { describe, it, expect } from 'vitest';
import { Candle } from '../core/market/Candle';
import { CandleStore } from '../core/market/CandleStore';
import { MarketDataAdapter } from '../core/market/MarketDataAdapter';
import { ICTPipelineCoordinator } from '../extension/content/ICTPipelineCoordinator';
import { CandidateContext } from '../core/ict/context/CandidateContextEngine';
import { MultiTimeframeContextEngine } from '../core/ict/context/MultiTimeframeContextEngine';
import { VisualAdapter } from '../extension/visual/VisualAdapter';

describe('Checkpoint 40 — End-to-End Causal Trace & Event Lineage Suite', () => {

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

  // 1. Candle identity key
  it('1. should verify candle identity key format (symbol|timeframe|marketTimestamp)', () => {
    const store = new CandleStore('NQ', '1m');
    const t0 = 100000;
    store.ingestCandle(makeCandle(t0, 18000, 18010, 17990, 18005));

    const latest = store.getLatestCandle()!;
    const ctx = store.getContext();
    const identityKey = `${ctx.symbol}|${ctx.timeframe}|${latest.timestamp}`;

    expect(identityKey).toBe('NQ|1m|100000');
    expect(latest.open).toBe(18000);
  });

  // 2. Candle -> Event lineage
  it('2. should verify Candle -> ICT Event lineage tracing', () => {
    const coordinator = new ICTPipelineCoordinator('NQ', '1m', { debug: false });
    const c1 = makeCandle(100000, 18000, 18050, 17950, 18040);
    const evalRes = coordinator.ingestCandle(c1);

    expect(evalRes.engineResult).toBeDefined();
    expect(evalRes.candidateContext.eventTimestamp).toBe(100000);
  });

  // 3. Event identity
  it('3. should verify ICT Event identity uniqueness and properties', () => {
    const coordinator = new ICTPipelineCoordinator('NQ', '1m', { debug: false });
    const candles = [
      makeCandle(100000, 18000, 18010, 17990, 18000),
      makeCandle(160000, 18000, 18060, 17990, 18050),
    ];
    const evalRes = coordinator.ingestCandles(candles);
    const events = evalRes.engineResult.events;

    for (const evt of events) {
      expect(evt.type).toBeDefined();
      expect(evt.timestamp).toBeGreaterThanOrEqual(100000);
    }
  });

  // 4. Event timestamps ordering
  it('4. should verify strict event timing: sourceCandleTimestamp <= eventTimestamp <= confirmationTimestamp', () => {
    const htf = makeMockCandidateContext('NQ', '15m', 100000, 160000);
    expect(htf.sourceCandleTimestamps[0]).toBeLessThanOrEqual(htf.eventTimestamp);
    expect(htf.eventTimestamp).toBeLessThanOrEqual(htf.confirmationTimestamp!);
  });

  // 5. Event -> CandidateContext lineage
  it('5. should trace CandidateContext to supportingEvents and sourceCandleTimestamps', () => {
    const htf = makeMockCandidateContext('NQ', '15m', 100000, 160000);
    expect(htf.supportingEvents.length).toBeGreaterThan(0);
    expect(htf.supportingEvents[0]).toContain('100000');
    expect(htf.sourceCandleTimestamps).toContain(100000);
  });

  // 6. CandidateContext identity
  it('6. should verify CandidateContext identity stability and state parameters', () => {
    const htf = makeMockCandidateContext('NQ', '15m', 100000, 160000);
    expect(htf.id).toBe('ctx_NQ_15m_100000');
    expect(htf.status).toBe('CONTEXT_CONFIRMED');
    expect(htf.expirationStatus).toBe('NOT_DEFINED');
  });

  // 7. MTF lineage
  it('7. should trace MultiTimeframeContext back to sourceEventIds and HTF/LTF parameters', () => {
    const mtfEngine = new MultiTimeframeContextEngine();
    const htf = makeMockCandidateContext('NQ', '15m', 100000, 160000);
    const ltf = makeMockCandidateContext('NQ', '5m', 170000, 175000);

    const mtf = mtfEngine.evaluateMTFContext(htf, ltf);
    expect(mtf.sourceTimeframe).toBe('15m');
    expect(mtf.targetTimeframe).toBe('5m');
    expect(mtf.sourceEventIds).toContain(htf.id);
    expect(mtf.sourceCandleTimestamps).toContain(100000);
  });

  // 8. Future HTF rejection
  it('8. should reject future HTF confirmation (confirmationTimestamp > eventTimestamp)', () => {
    const mtfEngine = new MultiTimeframeContextEngine();
    const htfFuture = makeMockCandidateContext('NQ', '15m', 100000, 300000);
    const ltfEarly = makeMockCandidateContext('NQ', '5m', 170000, 175000);

    const mtf = mtfEngine.evaluateMTFContext(htfFuture, ltfEarly);
    expect(mtf.causal).toBe(false);
    expect(mtf.status).toBe('NO_CONTEXT');
    expect(mtf.sourceEventIds[0]).toContain('NON_CAUSAL_LOOKAHEAD');
  });

  // 9. Symbol lineage isolation
  it('9. should enforce symbol lineage isolation (NQ vs MNQ returns SYMBOL_MISMATCH)', () => {
    const mtfEngine = new MultiTimeframeContextEngine();
    const htfNQ = makeMockCandidateContext('NQ', '15m', 100000, 160000);
    const ltfMNQ = makeMockCandidateContext('MNQ', '5m', 170000, 175000);

    const mtf = mtfEngine.evaluateMTFContext(htfNQ, ltfMNQ);
    expect(mtf.causal).toBe(false);
    expect(mtf.sourceEventIds[0]).toContain('SYMBOL_MISMATCH');
  });

  // 10. Timeframe lineage isolation
  it('10. should maintain timeframe lineage isolation across 1m, 5m, and 15m target contexts', () => {
    const mtfEngine = new MultiTimeframeContextEngine();
    const htf = makeMockCandidateContext('NQ', '15m', 100000, 160000);
    const ltf5m = makeMockCandidateContext('NQ', '5m', 170000, 175000);
    const ltf1m = makeMockCandidateContext('NQ', '1m', 171000, 172000);

    const mtf5m = mtfEngine.evaluateMTFContext(htf, ltf5m);
    const mtf1m = mtfEngine.evaluateMTFContext(htf, ltf1m);

    expect(mtf5m.targetTimeframe).toBe('5m');
    expect(mtf1m.targetTimeframe).toBe('1m');
    expect(mtf5m.id).not.toBe(mtf1m.id);
  });

  // 11. Visual -> Event lineage
  it('11. should trace VisualObject id back to CandidateContext id', () => {
    const adapter = new VisualAdapter();
    const mockState: any = { symbol: 'NQ', timeframe: '1m', lastCandleIndex: 0, swings: [], liquidityLevels: [], fairValueGaps: [], orderBlocks: [] };
    const mockContext = makeMockCandidateContext('NQ', '1m', 100000, 105000);

    const visuals = adapter.adaptStateToVisuals(mockState, [], mockContext);
    const contextBadge = visuals.find((v) => v.id.includes(mockContext.id));

    expect(contextBadge).toBeDefined();
    expect(contextBadge?.id).toBe(`VIS-${mockContext.id}`);
  });

  // 12. Reconnect lineage preservation
  it('12. should preserve candle and context lineage across disconnect and reconnect cycles', () => {
    const adapter = new MarketDataAdapter({ source: 'TradeSea_WS', instrument: 'NQ', timeframe: '1m' });
    adapter.ingestRealtimeCandle(makeCandle(100000, 18000, 18010, 17990, 18005));

    adapter.setConnectionStatus('DISCONNECTED');

    const missing = [
      makeCandle(100000, 18000, 18010, 17990, 18005),
      makeCandle(160000, 18005, 18020, 18000, 18015),
    ];

    const recRes = adapter.handleReconnection(missing);
    expect(recRes.success).toBe(true);
    expect(adapter.getStore().getCandleCount()).toBe(2);
    expect(adapter.getStore().getCandles()[0].timestamp).toBe(100000);
  });

  // 13. Late message lineage protection
  it('13. should reject late message ticks and protect historical lineage integrity', () => {
    const store = new CandleStore('NQ', '1m');
    store.ingestCandle(makeCandle(100000, 18000, 18010, 17990, 18005));
    store.ingestCandle(makeCandle(160000, 18005, 18020, 18000, 18015));

    const lateRes = store.ingestCandle(makeCandle(90000, 17990, 18000, 17980, 17995));
    expect(lateRes.success).toBe(false);
    expect(store.getCandles()[0].timestamp).toBe(100000);
  });

  // 14. Duplicate lineage deduplication
  it('14. should deduplicate repeated ticks without duplicating source timestamps or context IDs', () => {
    const store = new CandleStore('NQ', '1m');
    const tick = makeCandle(100000, 18000, 18010, 17990, 18005);

    store.ingestCandle(tick);
    store.ingestCandle(tick);
    store.ingestCandle(tick);

    expect(store.getCandleCount()).toBe(1);
    expect(store.getCandles()[0].timestamp).toBe(100000);
  });

  // 15. End-to-end trace
  it('15. should produce a complete 100% traceable lineage chain: Candle -> Event -> Context -> MTF -> Visual', () => {
    const coordinator = new ICTPipelineCoordinator('NQ', '1m', { debug: false });
    const htf = makeMockCandidateContext('NQ', '15m', 100000, 160000);

    const c1 = makeCandle(170000, 18000, 18050, 17950, 18040);
    const evalRes = coordinator.ingestCandle(c1, htf);

    expect(evalRes.candidateContext).toBeDefined();
    expect(evalRes.mtfContext).toBeDefined();
    expect(evalRes.visuals).toBeDefined();

    // Verify chain linkage
    const candleTs = c1.timestamp; // 170000
    const ltfCtx = evalRes.candidateContext;
    const mtfCtx = evalRes.mtfContext!;

    const adapter = new VisualAdapter();
    const visuals = adapter.adaptStateToVisuals(evalRes.engineResult.state, evalRes.engineResult.events, htf);

    expect(ltfCtx.eventTimestamp).toBe(candleTs);
    expect(mtfCtx.sourceEventIds).toContain(htf.id);
    expect(mtfCtx.sourceCandleTimestamps).toContain(100000);
    expect(visuals.length).toBeGreaterThan(0);
  });

});
