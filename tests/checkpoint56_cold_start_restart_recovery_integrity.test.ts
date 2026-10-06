/**
 * Checkpoint 56 — Cold-Start, Restart & Recovery Integrity Test Suite
 * Independent audit suite verifying clean initialization state, initialization order dependencies,
 * double initialization safety, restart determinism, reconnection recovery, store reset cleanups,
 * failure recovery, interrupted stream handling, and resource/cardinality recovery across:
 * COLD START -> INITIALIZATION -> RUNTIME -> RESET / RESTART -> REINITIALIZATION -> RECONNECT -> RECOVERY
 *
 * Scenarios tested:
 * - R01..R05: Cold start baseline, double initialization safety, partial state reset, reconnect after failure, malformed input recovery
 * - R06..R12: Duplicate/stale input recovery, symbol/timeframe switch recovery, partial stream interruption, reset/replay equivalence, repeated recovery cycle
 */

import { describe, it, expect } from 'vitest';
import { CandleStore } from '../core/market/CandleStore';
import { MarketDataAdapter } from '../core/market/MarketDataAdapter';
import { ICTPipelineCoordinator } from '../extension/content/ICTPipelineCoordinator';
import { ReplayEngine } from '../core/ict/replay/ReplayEngine';
import { Candle } from '../core/market/Candle';

function makeCandle(timestamp: number, open: number, high: number, low: number, close: number, volume: number = 100): Candle {
  return { timestamp, open, high, low, close, volume };
}

describe('Checkpoint 56 — Cold-Start, Restart & Recovery Integrity Suite', () => {

  // R01..R05: Cold Start, Double Init, Partial Reset & Reconnect Recovery
  it('R01..R05: verifies cold start baseline, double initialization, reset during partial state, and reconnect recovery', () => {
    // R01 & R02: Cold start baseline and double initialization safety
    const coordA = new ICTPipelineCoordinator('NQ', '1m');
    const storeA = coordA.getStore();
    expect(storeA.getCandles().length).toBe(0);
    expect(coordA.getMode()).toBe('LIVE');

    // Double initialization safe check (re-assigning mode or re-instantiating adapter)
    coordA.setMode('LIVE');
    expect(coordA.getMode()).toBe('LIVE');

    // R03: Reset during partial state
    storeA.loadHistory([makeCandle(100000, 18000, 18010, 17990, 18005)]);
    expect(storeA.getCandles().length).toBe(1);
    storeA.clear();
    expect(storeA.getCandles().length).toBe(0);

    // R04 & R05: Reconnect after failure and recovery after malformed input
    const adapter = coordA.getAdapter();
    const resNaN = adapter.ingestRealtimeCandle({ timestamp: 200000, open: NaN, high: 18010, low: 17990, close: 18005 } as any);
    expect(resNaN.success).toBe(false);

    // Reconnect gap fill recovery after error
    const resReconnect = adapter.handleReconnection([makeCandle(200000, 18005, 18030, 18000, 18025)]);
    expect(resReconnect.success).toBe(true);
    expect(adapter.getConnectionStatus()).toBe('CONNECTED');
    expect(storeA.getCandles().length).toBe(1);
  });

  // R06..R09: Duplicate/Stale Input Recovery & Symbol/Timeframe Switch Recovery
  it('R06..R09: controls duplicate/stale input recovery and symbol/timeframe context switch recovery', () => {
    // R06 & R07: Recovery after duplicate or stale past ticks
    const store = new CandleStore('NQ', '1m');
    const adapter = new MarketDataAdapter({ source: 'TradeSea_WS', instrument: 'NQ', timeframe: '1m' }, store);

    adapter.ingestRealtimeCandle(makeCandle(100000, 18000, 18010, 17990, 18005));
    expect(store.getCandles().length).toBe(1);

    // Duplicate input
    adapter.ingestRealtimeCandle(makeCandle(100000, 18000, 18010, 17990, 18005));
    expect(store.getCandles().length).toBe(1);

    // Stale past tick
    const resStale = adapter.ingestRealtimeCandle(makeCandle(50000, 17900, 17910, 17890, 17905));
    expect(resStale.success).toBe(false);
    expect(store.getCandles().length).toBe(1);

    // Subsequent valid tick accepted cleanly
    const resValid = adapter.ingestRealtimeCandle(makeCandle(160000, 18005, 18040, 18000, 18035));
    expect(resValid.success).toBe(true);
    expect(store.getCandles().length).toBe(2);

    // R08 & R09: Symbol and timeframe switch recovery isolation
    const coordMNQ = new ICTPipelineCoordinator('MNQ', '5m');
    expect(coordMNQ.getStore().getCandles().length).toBe(0);
    expect(store.getCandles().length).toBe(2);
  });

  // R10..R12: Interrupted Stream Recovery, Reset/Replay Equivalence & Recovery Determinism
  it('R10..R12: verifies interrupted stream recovery, reset/replay equivalence, and repeated recovery determinism', () => {
    // R10: Interrupted stream recovery
    const store = new CandleStore('NQ', '1m');
    const adapter = new MarketDataAdapter({ source: 'TradeSea_WS', instrument: 'NQ', timeframe: '1m' }, store);
    adapter.ingestRealtimeCandle(makeCandle(100000, 18000, 18010, 17990, 18005));

    // Simulated stream interruption (disconnect)
    adapter.setConnectionStatus('DISCONNECTED');
    expect(adapter.getConnectionStatus()).toBe('DISCONNECTED');

    // Re-establishing stream via reconnection
    adapter.handleReconnection([makeCandle(160000, 18005, 18040, 18000, 18035)]);
    expect(adapter.getConnectionStatus()).toBe('CONNECTED');
    expect(store.getCandles().length).toBe(2);

    // R11 & R12: Reset/replay equivalence & repeated recovery determinism
    const replayEngine = new ReplayEngine('NQ', '1m');
    const dataset = [
      makeCandle(100000, 18000, 18010, 17990, 18005),
      makeCandle(160000, 18005, 18040, 18000, 18035),
    ];

    const stateRun1 = replayEngine.loadDataset(dataset);
    replayEngine.reset();
    const stateRun2 = replayEngine.loadDataset(dataset);

    expect(stateRun1).toEqual(stateRun2); // Structural determinism across reset/replay
  });
});
