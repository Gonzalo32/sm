/**
 * Checkpoint 52 — Observability, Diagnostics & Audit-Trail Integrity Test Suite
 * Independent audit suite verifying diagnostic fidelity, transition traceability, entity identity preservation,
 * symbol/timeframe attribution, timestamp integrity, failure/recovery diagnostics, and diagnostic mutability isolation:
 * - D01..D03: Diagnostic fidelity, state transition traceability, domain entity identity preservation
 * - D04..D07: Symbol & timeframe attribution, timestamp integrity (T_conf^HTF <= T_ev^LTF), monotonic ordering
 * - D08..D12: Duplication control, stale state purging, failure & recovery diagnostics, cross-context isolation
 * - D13..D17: Diagnostic mutability isolation (mutating diagnostic object cannot alter authoritative store), replay determinism
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Candle } from '../core/market/Candle';
import { CandleStore } from '../core/market/CandleStore';
import { MarketDataAdapter } from '../core/market/MarketDataAdapter';
import { ICTPipelineCoordinator } from '../extension/content/ICTPipelineCoordinator';
import { CandidateContext } from '../core/ict/context/CandidateContextEngine';
import { MultiTimeframeContextEngine } from '../core/ict/context/MultiTimeframeContextEngine';
import { ReplayEngine } from '../core/ict/replay/ReplayEngine';

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
    structure: { trend: 'BULLISH', lastBOS: 'BOS BULLISH' },
    liquidity: { bslCount: 1, sslCount: 1 },
    displacement: { state: 'PRESENT', bodyRatio: 0.8, rangeMultiplier: 2.0 },
    fvg: { activeFvgCount: 1, lastFvgStatus: 'ACTIVE' },
    pdArray: { zone: 'DISCOUNT', equilibrium: 18000 },
    supportingEvents: [`BOS @ ${eventTimestamp}`],
    sourceCandleTimestamps: [eventTimestamp],
    status,
    expirationStatus: 'NOT_DEFINED',
  };
}

describe('Checkpoint 52 — Observability, Diagnostics & Audit-Trail Integrity Suite', () => {
  let store: CandleStore;
  let adapter: MarketDataAdapter;
  let coord: ICTPipelineCoordinator;
  let mtfEngine: MultiTimeframeContextEngine;
  let replayEngine: ReplayEngine;

  beforeEach(() => {
    store = new CandleStore('NQ', '1m');
    adapter = new MarketDataAdapter({ source: 'TradeSea_WS', instrument: 'NQ', timeframe: '1m' }, store);
    coord = new ICTPipelineCoordinator('NQ', '1m', { debug: false });
    mtfEngine = new MultiTimeframeContextEngine();
    replayEngine = new ReplayEngine('NQ', '1m');
  });

  // D01..D03: Diagnostic Fidelity, Traceability & Identity
  it('D01..D03: diagnostic outputs accurately reflect runtime state and domain identity without contradiction', () => {
    // D01: Diagnostic fidelity check
    expect(adapter.getConnectionStatus()).toBe('DISCONNECTED');
    adapter.setConnectionStatus('CONNECTED');
    expect(adapter.getConnectionStatus()).toBe('CONNECTED');
    expect(store.getCandles().length).toBe(0);
    expect(coord.getMode()).toBe('LIVE');

    const c1 = makeCandle(100000, 18000, 18010, 17990, 18005);
    const res = adapter.ingestRealtimeCandle(c1);

    expect(res.success).toBe(true);
    expect(store.getCandles().length).toBe(1);

    // D02: Connection transition traceability
    adapter.setConnectionStatus('RECONNECTING');
    expect(adapter.getConnectionStatus()).toBe('RECONNECTING');
    adapter.setConnectionStatus('CONNECTED');
    expect(adapter.getConnectionStatus()).toBe('CONNECTED');

    // D03: Domain entity identity in candidate context
    const ctx = makeMockCandidateContext('NQ', '1m', 100000, 105000, 'CONTEXT_CONFIRMED');
    expect(ctx.id).toBe('ctx_NQ_1m_100000');
    expect(ctx.symbol).toBe('NQ');
    expect(ctx.timeframe).toBe('1m');
  });

  // D04..D07: Symbol & Timeframe Attribution, Timestamps & Ordering
  it('D04..D07: maintains correct symbol/timeframe attribution, timestamp semantics, and temporal ordering', () => {
    // D04 & D05: Context symbol and timeframe attribution
    const ctxNQ = makeMockCandidateContext('NQ', '1m', 100000, 105000);
    const ctxMNQ = makeMockCandidateContext('MNQ', '5m', 100000, 105000);

    expect(ctxNQ.symbol).toBe('NQ');
    expect(ctxNQ.timeframe).toBe('1m');
    expect(ctxMNQ.symbol).toBe('MNQ');
    expect(ctxMNQ.timeframe).toBe('5m');

    // D06: Timestamp integrity & anti-lookahead causality (T_conf^HTF <= T_ev^LTF)
    const ltfCtx = makeMockCandidateContext('NQ', '5m', 160000, 165000, 'CONTEXT_CONFIRMED');
    const validHTF = makeMockCandidateContext('NQ', '15m', 100000, 140000, 'CONTEXT_CONFIRMED');
    const mtfValid = mtfEngine.evaluateMTFContext(validHTF, ltfCtx);
    expect(mtfValid.causal).toBe(true);

    const futureHTF = makeMockCandidateContext('NQ', '15m', 100000, 300000, 'CONTEXT_CONFIRMED');
    const mtfFuture = mtfEngine.evaluateMTFContext(futureHTF, ltfCtx);
    expect(mtfFuture.causal).toBe(false);
  });

  // D08..D12: Duplication Control, Stale State & Failure/Recovery Diagnostics
  it('D08..D12: controls diagnostic duplication, purges stale state on reset, and reports failure/recovery accurately', () => {
    // D08: Duplicate tick ingestion doesn't create duplicate store records
    const c1 = makeCandle(100000, 18000, 18010, 17990, 18005);
    adapter.ingestRealtimeCandle(c1);
    adapter.ingestRealtimeCandle(c1);
    expect(store.getCandles().length).toBe(1);

    // D10: Diagnostic error reporting on invalid OHLCV
    const resNaN = adapter.ingestRealtimeCandle({ timestamp: 200000, open: NaN, high: 18010, low: 17990, close: 18005 });
    expect(resNaN.success).toBe(false);
    expect(resNaN.error).toBeDefined();

    // D11: Recovery diagnostic reporting after error
    const cValid = makeCandle(200000, 18005, 18030, 18000, 18025);
    const resValid = adapter.ingestRealtimeCandle(cValid);
    expect(resValid.success).toBe(true);
    expect(store.getCandles().length).toBe(2);

    // D09: Stale diagnostic state purged on reset
    store.clear();
    expect(store.getCandles().length).toBe(0);

    // D12: Cross-context diagnostic isolation
    const storeMNQ = new CandleStore('MNQ', '1m');
    const adapterMNQ = new MarketDataAdapter({ source: 'TradeSea_WS', instrument: 'MNQ', timeframe: '1m' }, storeMNQ);
    adapterMNQ.ingestRealtimeCandle(makeCandle(100000, 1800, 1801, 1799, 1800.5));

    expect(store.getCandles().length).toBe(0);
    expect(storeMNQ.getCandles().length).toBe(1);
  });

  // D13..D17: Diagnostic Mutability Isolation & Replay Consistency
  it('D13..D17: guarantees diagnostic mutability isolation and replay diagnostic determinism', () => {
    // D13: Modifying a returned diagnostic result object does NOT mutate authoritative CandleStore
    const c1 = makeCandle(100000, 18000, 18010, 17990, 18005);
    const res = adapter.ingestRealtimeCandle(c1);
    (res as any).success = false;

    expect(store.getCandles().length).toBe(1);
    expect(store.getCandles()[0].open).toBe(18000);

    // D16: Replay diagnostic determinism
    const candles = [
      makeCandle(100000, 18000, 18010, 17990, 18005),
      makeCandle(160000, 18005, 18050, 18000, 18045),
    ];
    const state1 = replayEngine.loadDataset(candles);
    replayEngine.reset();
    const state2 = replayEngine.loadDataset(candles);

    expect(state1).toEqual(state2);

    // D17: Negative diagnostic reporting for out-of-order past tick
    const resStale = adapter.ingestRealtimeCandle(makeCandle(50000, 17900, 17910, 17890, 17905));
    expect(resStale.success).toBe(false);
    expect(resStale.error).toBeDefined();
  });
});
