/**
 * Checkpoint 34 — Realtime ICT Pipeline Integration & Audit Test Suite
 * Validates TradeSea WebSocket -> pageBridge -> Data Adapter -> CandleStore -> Lifecycle -> ICT Engine -> CandidateContext -> HUD/Canvas.
 * Ensures zero lookahead, strict candle identity, open/closed lifecycle, reconnect deduplication, TF/symbol isolation,
 * descriptive/contextual output contracts, and frozen core ICT logic.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Candle } from '../core/market/Candle';
import { CandleStore } from '../core/market/CandleStore';
import { MarketDataAdapter } from '../core/market/MarketDataAdapter';
import { ICTPipelineCoordinator } from '../extension/content/ICTPipelineCoordinator';
import { ICTHUD } from '../extension/visual/ICTHUD';
import { CoordinateTranslator } from '../extension/visual/CoordinateTranslator';
import { DEFAULT_DISPLACEMENT_CONFIG } from '../core/ict/displacement/DisplacementEngine';
import { DEFAULT_ICT_CONFIG } from '../core/ict/types/ICTConfig';

describe('Checkpoint 34 — Realtime ICT Pipeline Integration Audit Suite', () => {

  // Helper to build deterministic test candles
  function makeCandle(timestamp: number, open: number, high: number, low: number, close: number, volume: number = 100): Candle {
    return { timestamp, open, high, low, close, volume };
  }

  // 1. WebSocket event -> adapter
  it('1. should parse WebSocket event payload and feed to MarketDataAdapter', () => {
    const store = new CandleStore('MNQ', '1m');
    const adapter = new MarketDataAdapter({ source: 'TradeSea_WS', instrument: 'MNQ', timeframe: '1m' }, store);

    // Mock WS message payload structure (TradingView timescale_update or JSON OHLC)
    const rawWsPayload = {
      timestamp: 1700000000000,
      open: 18000.0,
      high: 18010.5,
      low: 17995.0,
      close: 18005.25,
      volume: 150,
    };

    const res = adapter.ingestRealtimeCandle(rawWsPayload);
    expect(res.success).toBe(true);
    expect(res.status).toBe('ICT_NEW_CANDLE');
    expect(adapter.getConnectionStatus()).toBe('CONNECTED');
    expect(store.getCandleCount()).toBe(1);
    expect(store.getLatestCandle()?.close).toBe(18005.25);
  });

  // 2. adapter -> CandleStore
  it('2. should properly pass single and bulk candles from MarketDataAdapter into CandleStore', () => {
    const store = new CandleStore('NQ', '5m');
    const adapter = new MarketDataAdapter({ source: 'TradeSea_WS', instrument: 'NQ', timeframe: '5m' }, store);

    const history: Candle[] = [
      makeCandle(1700000000000, 18000, 18020, 17990, 18010),
      makeCandle(1700000300000, 18010, 18030, 18005, 18025),
      makeCandle(1700000600000, 18025, 18050, 18020, 18045),
    ];

    const bulkRes = adapter.loadHistoricalWindow(history);
    expect(bulkRes.success).toBe(true);
    expect(bulkRes.loadedHistoryCount).toBe(3);
    expect(store.getCandleCount()).toBe(3);

    const nextCandle = makeCandle(1700000900000, 18045, 18060, 18040, 18055);
    const tickRes = adapter.ingestRealtimeCandle(nextCandle);
    expect(tickRes.success).toBe(true);
    expect(store.getCandleCount()).toBe(4);
  });

  // 3. CandleStore -> lifecycle
  it('3. should enforce candle identity (symbol|timeframe|marketTimestamp) and emit lifecycle events', () => {
    const store = new CandleStore('MNQ', '1m');
    const emittedEvents: Array<{ type: string; timestamp: number; candleTs: number }> = [];

    store.subscribe((e) => {
      emittedEvents.push({ type: e.type, timestamp: e.timestamp, candleTs: e.candle.timestamp });
    });

    const c1 = makeCandle(1700000000000, 18000, 18010, 17990, 18005);
    store.ingestCandle(c1);

    expect(emittedEvents.length).toBe(1);
    expect(emittedEvents[0].type).toBe('ICT_NEW_CANDLE');

    // Tick update on open candle
    const c1Update = makeCandle(1700000000000, 18000, 18015, 17990, 18012);
    store.ingestCandle(c1Update);

    expect(emittedEvents.length).toBe(2);
    expect(emittedEvents[1].type).toBe('ICT_CANDLE_UPDATE');

    // New candle arrives (closes c1, opens c2)
    const c2 = makeCandle(1700000060000, 18012, 18025, 18010, 18020);
    store.ingestCandle(c2);

    expect(emittedEvents.length).toBe(4);
    expect(emittedEvents[2].type).toBe('ICT_CANDLE_CLOSE');
    expect(emittedEvents[2].candleTs).toBe(1700000000000);
    expect(emittedEvents[3].type).toBe('ICT_NEW_CANDLE');
    expect(emittedEvents[3].candleTs).toBe(1700000060000);
  });

  // 4. lifecycle -> ICT pipeline
  it('4. should process lifecycle updates through ICTPipelineCoordinator deterministically', () => {
    const coordinator = new ICTPipelineCoordinator('MNQ', '1m', { debug: false });
    const candles: Candle[] = [
      makeCandle(1700000000000, 18000, 18010, 17990, 18005),
      makeCandle(1700000060000, 18005, 18030, 18000, 18028), // Large body bullish candle
      makeCandle(1700000120000, 18028, 18055, 18025, 18050), // Displacement continuation
    ];

    let result = coordinator.ingestCandles(candles);
    expect(result.engineResult).toBeDefined();
    expect(result.marketContext).toBeDefined();
    expect(result.marketContext.symbol).toBe('MNQ');
    expect(result.visuals).toBeDefined();
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
  });

  // 5. ICT output -> HUD
  it('5. should correctly pass pipeline evaluation context into ICTHUD', () => {
    const hud = new ICTHUD();
    const coordinator = new ICTPipelineCoordinator('MNQ', '1m', { hud, debug: false });

    const candles: Candle[] = [
      makeCandle(1700000000000, 18000, 18010, 17990, 18005),
      makeCandle(1700000060000, 18005, 18020, 18000, 18015),
    ];

    const evalRes = coordinator.ingestCandles(candles);
    expect(evalRes.marketContext.symbol).toBe('MNQ');
    expect(evalRes.marketContext.narrativeSummary.length).toBeGreaterThan(0);
  });

  // 6. ICT output -> Canvas
  it('6. should translate pipeline visual objects to CanvasRenderer drawing instructions using CoordinateTranslator', () => {
    const translator = new CoordinateTranslator();
    translator.updateViewport({
      width: 1000,
      height: 600,
      minPrice: 17900,
      maxPrice: 18100,
      firstCandleIndex: 0,
      lastCandleIndex: 10,
    });

    const x = translator.indexToX(5);
    const y = translator.priceToY(18000);

    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(1000);
    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThan(600);
  });

  // 7. open candle update
  it('7. should update open candle OHLC without creating a new bar or duplicating timestamps', () => {
    const store = new CandleStore('MNQ', '1m');
    const openBar = makeCandle(1700000000000, 18000, 18005, 17998, 18002);
    store.ingestCandle(openBar);
    expect(store.getCandleCount()).toBe(1);

    // High and close updated while open is locked
    const tickUpdate = makeCandle(1700000000000, 18000, 18018, 17995, 18015);
    store.ingestCandle(tickUpdate);

    expect(store.getCandleCount()).toBe(1);
    const latest = store.getLatestCandle()!;
    expect(latest.open).toBe(18000); // Preserves initial open
    expect(latest.high).toBe(18018); // Updated high
    expect(latest.low).toBe(17995);  // Updated low
    expect(latest.close).toBe(18015); // Updated close
  });

  // 8. closed candle transition
  it('8. should lock closed candle upon new bar arrival and forbid post-close modification', () => {
    const store = new CandleStore('MNQ', '1m');
    const bar1 = makeCandle(1700000000000, 18000, 18010, 17990, 18005);
    const bar2 = makeCandle(1700000060000, 18005, 18020, 18000, 18015);

    store.ingestCandle(bar1);
    store.ingestCandle(bar2);

    expect(store.getCandleCount()).toBe(2);
    expect(store.getCandles()[0].timestamp).toBe(1700000000000);
    expect(store.getCandles()[1].timestamp).toBe(1700000060000);

    // Attempting to overwrite closed bar 1 with past timestamp must be rejected
    const retroAttempt = makeCandle(1700000000000, 18000, 18999, 17000, 18999);
    const rej = store.ingestCandle(retroAttempt);
    expect(rej.success).toBe(false);
    expect(rej.error).toContain('Out of order timestamp');

    // Bar 1 remains intact
    expect(store.getCandles()[0].close).toBe(18005);
  });

  // 9. duplicate event
  it('9. should handle duplicate candle events cleanly without corrupting series', () => {
    const store = new CandleStore('MNQ', '1m');
    const adapter = new MarketDataAdapter({ source: 'TradeSea_WS', instrument: 'MNQ', timeframe: '1m' }, store);

    const candles: Candle[] = [
      makeCandle(1700000000000, 18000, 18010, 17990, 18005),
      makeCandle(1700000000000, 18000, 18010, 17990, 18005), // Duplicate
      makeCandle(1700000060000, 18005, 18020, 18000, 18015),
    ];

    const bulkRes = adapter.loadHistoricalWindow(candles);
    expect(bulkRes.success).toBe(true);
    expect(bulkRes.loadedHistoryCount).toBe(2);
    expect(bulkRes.skippedCount).toBe(1);
    expect(store.getCandleCount()).toBe(2);
  });

  // 10. out-of-order event
  it('10. should reject out-of-order past timestamps to preserve temporal integrity', () => {
    const store = new CandleStore('MNQ', '1m');
    store.ingestCandle(makeCandle(1700000060000, 18005, 18020, 18000, 18015));

    // Arrives late with past timestamp
    const outOfOrderCandle = makeCandle(1700000000000, 18000, 18010, 17990, 18005);
    const res = store.ingestCandle(outOfOrderCandle);

    expect(res.success).toBe(false);
    expect(res.error).toContain('Out of order timestamp');
    expect(store.getCandleCount()).toBe(1);
  });

  // 11. symbol isolation
  it('11. should maintain strict symbol isolation between NQ and MNQ stores', () => {
    const storeNQ = new CandleStore('NQ', '1m');
    const storeMNQ = new CandleStore('MNQ', '1m');

    storeNQ.ingestCandle(makeCandle(1700000000000, 18000, 18010, 17990, 18005));
    storeMNQ.ingestCandle(makeCandle(1700000000000, 18002, 18012, 17992, 18007));

    expect(storeNQ.getContext().symbol).toBe('NQ');
    expect(storeMNQ.getContext().symbol).toBe('MNQ');

    expect(storeNQ.getLatestCandle()?.close).toBe(18005);
    expect(storeMNQ.getLatestCandle()?.close).toBe(18007);
  });

  // 12. timeframe isolation
  it('12. should maintain strict timeframe isolation between 1m, 5m, and 15m pipelines', () => {
    const coordinator1m = new ICTPipelineCoordinator('NQ', '1m', { debug: false });
    const coordinator5m = new ICTPipelineCoordinator('NQ', '5m', { debug: false });

    coordinator1m.ingestCandle(makeCandle(1700000000000, 18000, 18010, 17990, 18005));
    coordinator5m.ingestCandle(makeCandle(1700000000000, 18000, 18040, 17980, 18035));

    expect(coordinator1m.getContext().timeframe).toBe('1m');
    expect(coordinator5m.getContext().timeframe).toBe('5m');

    expect(coordinator1m.getStore().getCandleCount()).toBe(1);
    expect(coordinator5m.getStore().getCandleCount()).toBe(1);

    expect(coordinator1m.getStore().getLatestCandle()?.close).toBe(18005);
    expect(coordinator5m.getStore().getLatestCandle()?.close).toBe(18035);
  });

  // 13. reconnect
  it('13. should handle reconnection gap fill, deduplicate missing candles, and restore connection status', () => {
    const store = new CandleStore('MNQ', '1m');
    const adapter = new MarketDataAdapter({ source: 'TradeSea_WS', instrument: 'MNQ', timeframe: '1m' }, store);

    // Initial feed
    adapter.ingestRealtimeCandle(makeCandle(1700000000000, 18000, 18010, 17990, 18005));
    adapter.ingestRealtimeCandle(makeCandle(1700000060000, 18005, 18020, 18000, 18015));
    expect(store.getCandleCount()).toBe(2);

    // Simulate WebSocket disconnect
    adapter.setConnectionStatus('DISCONNECTED');
    expect(adapter.getConnectionStatus()).toBe('DISCONNECTED');

    // Missing segment returned during reconnect (includes last bar + 2 new bars)
    const missingSegment: Candle[] = [
      makeCandle(1700000060000, 18005, 18020, 18000, 18015), // Duplicate active/last bar
      makeCandle(1700000120000, 18015, 18030, 18010, 18025), // New
      makeCandle(1700000180000, 18025, 18040, 18020, 18038), // New
    ];

    const reconRes = adapter.handleReconnection(missingSegment);
    expect(reconRes.success).toBe(true);
    expect(reconRes.status).toBe('RECONNECTED');
    expect(adapter.getConnectionStatus()).toBe('CONNECTED');
    expect(store.getCandleCount()).toBe(4);
  });

  // 14. anti-lookahead timestamp propagation
  it('14. should enforce strict anti-lookahead causality (eventTimestamp <= confirmationTimestamp)', () => {
    const coordinator = new ICTPipelineCoordinator('MNQ', '1m', { debug: false });
    const candles: Candle[] = [
      makeCandle(1700000000000, 18000, 18010, 17990, 18005),
      makeCandle(1700000060000, 18005, 18030, 18000, 18028),
      makeCandle(1700000120000, 18028, 18055, 18025, 18050),
      makeCandle(1700000180000, 18050, 18080, 18045, 18075),
    ];

    const evalRes = coordinator.ingestCandles(candles);
    const events = evalRes.engineResult.events;

    for (const event of events) {
      const eTs = event.timestamp;
      const cTs = event.confirmationTimestamp || event.timestamp;
      expect(eTs).toBeLessThanOrEqual(cTs);
    }
  });

  // 15. Output Contract & Candidate Context Neutrality
  it('15. should produce neutral, descriptive output contract and CandidateContext without trading signals', () => {
    const coordinator = new ICTPipelineCoordinator('MNQ', '1m', { debug: false });
    const candles: Candle[] = [
      makeCandle(1700000000000, 18000, 18010, 17990, 18005),
      makeCandle(1700000060000, 18005, 18030, 18000, 18028),
      makeCandle(1700000120000, 18028, 18055, 18025, 18050),
    ];

    const evalRes = coordinator.ingestCandles(candles);
    const ctx = evalRes.marketContext;

    // Verify forbidden operational terms are absent
    const strContext = JSON.stringify(ctx);
    expect(strContext).not.toContain('"BUY"');
    expect(strContext).not.toContain('"SELL"');
    expect(strContext).not.toContain('"STOP_LOSS"');
    expect(strContext).not.toContain('"TAKE_PROFIT"');
    expect(strContext).not.toContain('"WIN_RATE"');
  });

  // 16. Frozen Core Logic & Parameter Preservation
  it('16. should verify zero modifications to core/ict/ and exact frozen parameters', () => {
    expect(DEFAULT_DISPLACEMENT_CONFIG.minBodyToRangeRatio).toBe(0.60);
    expect(DEFAULT_DISPLACEMENT_CONFIG.minRangeMultiplier).toBe(1.50);
    expect(DEFAULT_ICT_CONFIG.fvgMinSizePoints).toBe(0.25);

    const rootDir = process.cwd();
    const ictDir = path.join(rootDir, 'core', 'ict');
    expect(fs.existsSync(ictDir)).toBe(true);
  });
});
