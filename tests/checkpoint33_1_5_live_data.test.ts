/**
 * Checkpoint 33.1.5 - Live Market Data Adapter & Runtime Historical Window Test Suite
 * Tests A through N: Historical load, OHLC validation, timestamp deduplication, regressive timestamp rejection,
 * gap detection without candle fabrication, 60-day window pruning, instrument/timeframe isolation,
 * realtime forming updates, bar confirmation causality, reconnection handling, synthetic source blocking,
 * and zero production mutations.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { CandleStore } from '../core/market/CandleStore';
import { MarketDataAdapter } from '../core/market/MarketDataAdapter';
import { DEFAULT_ICT_CONFIG } from '../core/ict/types/ICTConfig';
import { DEFAULT_DISPLACEMENT_CONFIG } from '../core/ict/displacement/DisplacementEngine';
import { PREDEFINED_MODELS } from '../core/ict/models/PredefinedModels';

describe('Checkpoint 33.1.5 - Live Market Data Adapter & Runtime Window Suite', () => {
  const rootDir = process.cwd();
  const archDocPath = path.join(rootDir, 'CP33.1.5_LIVE_DATA_ARCHITECTURE.md');
  const auditDocPath = path.join(rootDir, 'CP33.1.5_DATA_SOURCE_AUDIT.md');
  const windowDocPath = path.join(rootDir, 'CP33.1.5_RUNTIME_WINDOW.md');
  const provDocPath = path.join(rootDir, 'CP33.1.5_PROVENANCE_MODEL.md');
  const reconnDocPath = path.join(rootDir, 'CP33.1.5_RECONNECT_POLICY.md');
  const finalStatusPath = path.join(rootDir, 'CP33.1.5_FINAL_STATUS.md');

  // TEST A: Cargar histórico válido -> PASS
  it('TEST A: should load valid historical candle series cleanly', () => {
    const adapter = new MarketDataAdapter({ source: 'TradeSea_REST', instrument: 'MNQ', timeframe: '1m' });
    const baseTs = 1767225600000;
    const history = [
      { timestamp: baseTs, open: 1800, high: 1810, low: 1795, close: 1805, volume: 100 },
      { timestamp: baseTs + 60000, open: 1805, high: 1815, low: 1800, close: 1810, volume: 150 },
      { timestamp: baseTs + 120000, open: 1810, high: 1820, low: 1805, close: 1815, volume: 200 },
    ];
    const res = adapter.loadHistoricalWindow(history);
    expect(res.success).toBe(true);
    expect(res.loadedHistoryCount).toBe(3);
    expect(adapter.getStore().getCandleCount()).toBe(3);
  });

  // TEST B: OHLC inválido -> REJECTED
  it('TEST B: should reject invalid OHLC candles without mutating store', () => {
    const adapter = new MarketDataAdapter({ source: 'TradeSea_REST', instrument: 'MNQ', timeframe: '1m' });
    const invalidCandle = { timestamp: 1767225600000, open: 1800, high: 1790, low: 1795, close: 1805 }; // high < open
    const res = adapter.ingestRealtimeCandle(invalidCandle);
    expect(res.success).toBe(false);
    expect(res.status).toBe('DATA_REJECTED');
    expect(adapter.getStore().getCandleCount()).toBe(0);
  });

  // TEST C: Timestamp duplicado -> REJECTED/DEDUPLICATED
  it('TEST C: should update forming candle on duplicate timestamp during realtime or deduplicate during load', () => {
    const adapter = new MarketDataAdapter({ source: 'TradeSea_REST', instrument: 'MNQ', timeframe: '1m' });
    const baseTs = 1767225600000;
    adapter.ingestRealtimeCandle({ timestamp: baseTs, open: 1800, high: 1810, low: 1795, close: 1805 });
    const res = adapter.ingestRealtimeCandle({ timestamp: baseTs, open: 1800, high: 1815, low: 1790, close: 1812 });
    expect(res.success).toBe(true);
    expect(res.status).toBe('ICT_CANDLE_UPDATE');
    expect(adapter.getStore().getCandleCount()).toBe(1);
    expect(adapter.getStore().getLatestCandle()?.high).toBe(1815);
  });

  // TEST D: Timestamp regresivo -> REJECTED
  it('TEST D: should reject regressive out-of-order past timestamps', () => {
    const adapter = new MarketDataAdapter({ source: 'TradeSea_REST', instrument: 'MNQ', timeframe: '1m' });
    const baseTs = 1767225600000;
    adapter.ingestRealtimeCandle({ timestamp: baseTs + 60000, open: 1805, high: 1815, low: 1800, close: 1810 });
    const res = adapter.ingestRealtimeCandle({ timestamp: baseTs, open: 1800, high: 1810, low: 1795, close: 1805 });
    expect(res.success).toBe(false);
    expect(res.status).toBe('DATA_REJECTED');
  });

  // TEST E: Gap temporal -> GAP_DETECTED sin fabricar candle
  it('TEST E: should detect time gaps during series validation without fabricating candles', () => {
    const adapter = new MarketDataAdapter({ source: 'TradeSea_REST', instrument: 'MNQ', timeframe: '1m' });
    const baseTs = 1767225600000;
    const gappedHistory = [
      { timestamp: baseTs, open: 1800, high: 1810, low: 1795, close: 1805 },
      { timestamp: baseTs + 600000, open: 1805, high: 1815, low: 1800, close: 1810 }, // 10 min gap
    ];
    adapter.loadHistoricalWindow(gappedHistory);
    expect(adapter.getGapEventsCount()).toBe(1);
    expect(adapter.getStore().getCandleCount()).toBe(2); // Exactly 2 candles, zero fabricated
  });

  // TEST F: Candle fuera de ventana de 60 días -> REMOVED_FROM_RUNTIME_WINDOW
  it('TEST F: should prune candles older than 60 days lookback window from memory', () => {
    const store = new CandleStore('MNQ', '1m', 60);
    const nowTs = 1767225600000;
    const oldTs = nowTs - 61 * 24 * 60 * 60 * 1000; // 61 days ago
    const history = [
      { timestamp: oldTs, open: 1800, high: 1810, low: 1795, close: 1805 },
      { timestamp: nowTs, open: 1820, high: 1830, low: 1815, close: 1825 },
    ];
    const { loaded, pruned } = store.loadHistory(history);
    expect(loaded).toBe(2);
    expect(pruned).toBe(1);
    expect(store.getCandleCount()).toBe(1);
    expect(store.getCandles()[0].timestamp).toBe(nowTs);
  });

  // TEST G: MNQ y NQ simultáneos -> stores aislados
  it('TEST G: should keep MNQ and NQ candle stores strictly isolated', () => {
    const adapterMNQ = new MarketDataAdapter({ source: 'TradeSea_REST', instrument: 'MNQ', timeframe: '1m' });
    const adapterNQ = new MarketDataAdapter({ source: 'TradeSea_REST', instrument: 'NQ', timeframe: '1m' });
    adapterMNQ.ingestRealtimeCandle({ timestamp: 1000, open: 1800, high: 1810, low: 1795, close: 1805 });
    adapterNQ.ingestRealtimeCandle({ timestamp: 1000, open: 18000, high: 18100, low: 17950, close: 18050 });

    expect(adapterMNQ.getStore().getLatestCandle()?.close).toBe(1805);
    expect(adapterNQ.getStore().getLatestCandle()?.close).toBe(18050);
  });

  // TEST H: 1m, 5m y 15m simultáneos -> stores aislados
  it('TEST H: should keep 1m, 5m, and 15m timeframe stores strictly isolated', () => {
    const store1m = new CandleStore('MNQ', '1m');
    const store5m = new CandleStore('MNQ', '5m');
    const store15m = new CandleStore('MNQ', '15m');

    store1m.ingestCandle({ timestamp: 1000, open: 1800, high: 1810, low: 1795, close: 1805 });
    store5m.ingestCandle({ timestamp: 1000, open: 1800, high: 1820, low: 1790, close: 1815 });

    expect(store1m.getCandleCount()).toBe(1);
    expect(store5m.getCandleCount()).toBe(1);
    expect(store15m.getCandleCount()).toBe(0);
  });

  // TEST I: Realtime candle update -> misma candle actualizada sin duplicación
  it('TEST I: should update active forming candle on intrabar ticks without adding new bars', () => {
    const store = new CandleStore('MNQ', '1m');
    store.ingestCandle({ timestamp: 1000, open: 1800, high: 1805, low: 1798, close: 1802 });
    store.ingestCandle({ timestamp: 1000, open: 1800, high: 1812, low: 1795, close: 1810 });
    expect(store.getCandleCount()).toBe(1);
    expect(store.getLatestCandle()?.high).toBe(1812);
    expect(store.getLatestCandle()?.low).toBe(1795);
  });

  // TEST J: Realtime candle confirmation -> transición causal correcta
  it('TEST J: should emit ICT_CANDLE_CLOSE then ICT_NEW_CANDLE when new bar timestamp arrives', () => {
    const store = new CandleStore('MNQ', '1m');
    const events: string[] = [];
    store.subscribe((e) => events.push(e.type));

    store.ingestCandle({ timestamp: 1000, open: 1800, high: 1810, low: 1795, close: 1805 });
    store.ingestCandle({ timestamp: 2000, open: 1805, high: 1815, low: 1800, close: 1810 });

    expect(events).toEqual(['ICT_NEW_CANDLE', 'ICT_CANDLE_CLOSE', 'ICT_NEW_CANDLE']);
  });

  // TEST K: Reconnect -> sin duplicados y sin retroceso temporal
  it('TEST K: should handle reconnection and gap fill without duplicate timestamps', () => {
    const adapter = new MarketDataAdapter({ source: 'TradeSea_REST', instrument: 'MNQ', timeframe: '1m' });
    const baseTs = 1767225600000;
    adapter.loadHistoricalWindow([
      { timestamp: baseTs, open: 1800, high: 1810, low: 1795, close: 1805 },
      { timestamp: baseTs + 60000, open: 1805, high: 1815, low: 1800, close: 1810 },
    ]);

    // Reconnection payload containing overlapping bar + new bar
    const missing = [
      { timestamp: baseTs + 60000, open: 1805, high: 1815, low: 1800, close: 1810 }, // duplicate
      { timestamp: baseTs + 120000, open: 1810, high: 1820, low: 1805, close: 1815 }, // new
    ];
    const reconnRes = adapter.handleReconnection(missing);
    expect(reconnRes.success).toBe(true);
    expect(adapter.getStore().getCandleCount()).toBe(3);
  });

  // TEST L: Synthetic source -> REJECTED_FOR_REAL_RUNTIME
  it('TEST L: should reject synthetic test source when requireRealRuntime = true', () => {
    const adapter = new MarketDataAdapter(
      { source: 'CP21DatasetGenerator', instrument: 'MNQ', timeframe: '1m', isSynthetic: true },
      undefined,
      true // requireRealRuntime
    );
    const res = adapter.loadHistoricalWindow([
      { timestamp: 1000, open: 1800, high: 1810, low: 1795, close: 1805 },
    ]);
    expect(res.success).toBe(false);
    expect(res.status).toBe('REJECTED_FOR_REAL_RUNTIME');
  });

  // TEST M: No historical data available -> REAL_DATA_UNAVAILABLE sin fallback sintético
  it('TEST M: should return REAL_DATA_UNAVAILABLE when history is empty without synthetic fallback', () => {
    const adapter = new MarketDataAdapter({ source: 'TradeSea_REST', instrument: 'MNQ', timeframe: '1m' });
    const res = adapter.loadHistoricalWindow([]);
    expect(res.success).toBe(false);
    expect(res.status).toBe('REAL_DATA_UNAVAILABLE');
    expect(adapter.getStore().getCandleCount()).toBe(0);
  });

  // TEST N: 60-day window -> solo datos dentro del lookback permanecen en memoria
  it('TEST N: should verify actual available lookback days in memory window status', () => {
    const store = new CandleStore('MNQ', '1m', 60);
    const baseTs = 1767225600000;
    const tenDaysMs = 10 * 24 * 60 * 60 * 1000;
    store.loadHistory([
      { timestamp: baseTs, open: 1800, high: 1810, low: 1795, close: 1805 },
      { timestamp: baseTs + tenDaysMs, open: 1850, high: 1860, low: 1845, close: 1855 },
    ]);
    const memStatus = store.getMemoryWindowStatus();
    expect(memStatus.requestedLookbackDays).toBe(60);
    expect(memStatus.actualAvailableLookbackDays).toBeCloseTo(10.0, 1);
    expect(memStatus.candleCount).toBe(2);
  });

  // Test 15: Parameter & Model Non-Mutation Check
  it('15. should verify ICT engine thresholds and models remain untouched', () => {
    expect(DEFAULT_DISPLACEMENT_CONFIG.minBodyToRangeRatio).toBe(0.60);
    expect(DEFAULT_DISPLACEMENT_CONFIG.minRangeMultiplier).toBe(1.50);
    expect(DEFAULT_ICT_CONFIG.fvgMinSizePoints).toBe(0.25);
    expect(PREDEFINED_MODELS.length).toBeGreaterThanOrEqual(3);
  });

  // Test 16: Deliverable Documentation Files Verification
  it('16. should verify all CP33.1.5 deliverable files exist', () => {
    expect(fs.existsSync(archDocPath)).toBe(true);
    expect(fs.existsSync(auditDocPath)).toBe(true);
    expect(fs.existsSync(windowDocPath)).toBe(true);
    expect(fs.existsSync(provDocPath)).toBe(true);
    expect(fs.existsSync(reconnDocPath)).toBe(true);
    expect(fs.existsSync(finalStatusPath)).toBe(true);
  });
});
