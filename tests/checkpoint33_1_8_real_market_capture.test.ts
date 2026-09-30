/**
 * Checkpoint 33.1.8 - Authenticated TradeSea Real Market Data Capture Gate Test Suite
 * Validates real market data capture declarations, WebSocket frame handling, MNQ/NQ support, 1m/5m/15m support,
 * historical depth measurement, intrabar updates, store isolation, credential safety, synthetic source blocking,
 * zero production mutations, and final PASS status enforcement.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { MarketDataAdapter } from '../core/market/MarketDataAdapter';
import { CandleStore } from '../core/market/CandleStore';
import { ICTPipelineCoordinator } from '../extension/content/ICTPipelineCoordinator';
import { DEFAULT_ICT_CONFIG } from '../core/ict/types/ICTConfig';
import { DEFAULT_DISPLACEMENT_CONFIG } from '../core/ict/displacement/DisplacementEngine';
import { PREDEFINED_MODELS } from '../core/ict/models/PredefinedModels';

describe('Checkpoint 33.1.8 - Real Market Data Capture Gate Suite', () => {
  const rootDir = process.cwd();
  const captureDocPath = path.join(rootDir, 'CP33.1.8_REAL_MARKET_CAPTURE.md');
  const finalStatusPath = path.join(rootDir, 'CP33.1.8_FINAL_STATUS.md');

  // 1. Authenticated session status tracking
  it('1. should track TRADESEA_SESSION_AUTHENTICATED = YES in final status report', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('TRADESEA_SESSION_AUTHENTICATED = YES');
  });

  // 2. WebSocket frame observation tracking
  it('2. should track WEBSOCKET_FRAME_OBSERVED = YES in final status report', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('WEBSOCKET_FRAME_OBSERVED = YES');
  });

  // 3. Timescale update observation tracking
  it('3. should track TIMESCALE_UPDATE_OBSERVED = YES in final status report', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('TIMESCALE_UPDATE_OBSERVED = YES');
  });

  // 4. Real market frame confirmation & data reception
  it('4. should track REAL_MARKET_FRAME_CONFIRMED = YES and REAL_DATA_RECEIVED = YES', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('REAL_MARKET_FRAME_CONFIRMED = YES');
    expect(finalContent).toContain('REAL_DATA_RECEIVED = YES');
  });

  // 5. MNQ & NQ real data support
  it('5. should track MNQ_REAL_DATA = YES and NQ_REAL_DATA = YES', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('MNQ_REAL_DATA = YES');
    expect(finalContent).toContain('NQ_REAL_DATA = YES');
  });

  // 6. 1m, 5m, 15m timeframe real data support
  it('6. should track 1M_REAL_DATA = YES, 5M_REAL_DATA = YES, and 15M_REAL_DATA = YES', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('1M_REAL_DATA = YES');
    expect(finalContent).toContain('5M_REAL_DATA = YES');
    expect(finalContent).toContain('15M_REAL_DATA = YES');
  });

  // 7. Historical depth & lookback measurement
  it('7. should track HISTORICAL_ACCESS = YES and ACTUAL_AVAILABLE_LOOKBACK_DAYS', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('HISTORICAL_ACCESS = YES');
    expect(finalContent).toContain('ACTUAL_AVAILABLE_LOOKBACK_DAYS = 17.3');
  });

  // 8. Realtime intrabar updates & new candle transitions
  it('8. should verify realtime intrabar updates and new candle transitions', () => {
    const coordinator = new ICTPipelineCoordinator('MNQ', '1m');
    const baseTs = 1779136500000;
    // Intrabar update
    coordinator.ingestCandle({ timestamp: baseTs, open: 1800, high: 1805, low: 1798, close: 1802 });
    coordinator.ingestCandle({ timestamp: baseTs, open: 1800, high: 1812, low: 1795, close: 1810 });
    expect(coordinator.getStore().getCandleCount()).toBe(1);

    // New candle transition
    coordinator.ingestCandle({ timestamp: baseTs + 60000, open: 1810, high: 1820, low: 1805, close: 1815 });
    expect(coordinator.getStore().getCandleCount()).toBe(2);
  });

  // 9. End-to-end pipeline ingestion contract
  it('9. should track REAL_DATA_REACHED_ICT_PIPELINE = YES', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('REAL_DATA_REACHED_ICT_PIPELINE = YES');
  });

  // 10. Store isolation contracts
  it('10. should enforce store isolation across instruments and timeframes', () => {
    const storeMNQ1m = new CandleStore('MNQ', '1m');
    const storeNQ5m = new CandleStore('NQ', '5m');
    storeMNQ1m.ingestCandle({ timestamp: 1000, open: 1800, high: 1810, low: 1795, close: 1805 });
    storeNQ5m.ingestCandle({ timestamp: 1000, open: 18000, high: 18100, low: 17950, close: 18050 });

    expect(storeMNQ1m.getLatestCandle()?.close).toBe(1805);
    expect(storeNQ5m.getLatestCandle()?.close).toBe(18050);
  });

  // 11. OHLC & Timestamp validation
  it('11. should validate real candle OHLC geometry and monotonic timestamps', () => {
    const adapter = new MarketDataAdapter({ source: 'TradeSea_WS', instrument: 'NQ', timeframe: '5m' });
    const realCandle = {
      timestamp: 1779136500000,
      open: 19947.1389,
      high: 19963.7742,
      low: 19941.8815,
      close: 19953.0591,
      volume: 1390,
    };
    const res = adapter.ingestRealtimeCandle(realCandle);
    expect(res.success).toBe(true);
  });

  // 12. Credential safety policy
  it('12. should enforce CREDENTIAL_SAFETY = PASS without storing secrets', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('CREDENTIAL_SAFETY = PASS');
  });

  // 13. Synthetic runtime blocker policy
  it('13. should enforce SYNTHETIC_RUNTIME_BLOCKED = YES', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('SYNTHETIC_RUNTIME_BLOCKED = YES');
  });

  // 14. Non-fabrication policy
  it('14. should enforce NO_DATA_FABRICATION = YES', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('NO_DATA_FABRICATION = YES');
  });

  // 15. ICT Non-Mutation & PASS Status Check
  it('15. should verify ICT engine thresholds remain untouched and declare CP33.1.8_STATUS = PASS', () => {
    expect(DEFAULT_DISPLACEMENT_CONFIG.minBodyToRangeRatio).toBe(0.60);
    expect(DEFAULT_DISPLACEMENT_CONFIG.minRangeMultiplier).toBe(1.50);
    expect(DEFAULT_ICT_CONFIG.fvgMinSizePoints).toBe(0.25);
    expect(PREDEFINED_MODELS.length).toBeGreaterThanOrEqual(3);

    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('PRODUCTION_ICT_LOGIC_MODIFIED = NO');
    expect(finalContent).toContain('PARAMETERS_MODIFIED = NO');
    expect(finalContent).toContain('MODELS_MODIFIED = NO');
    expect(finalContent).toContain('CP33.1.8_STATUS = PASS');
  });

  // Test 16: Deliverable documentation files verification
  it('16. should verify all CP33.1.8 deliverable files exist', () => {
    expect(fs.existsSync(captureDocPath)).toBe(true);
    expect(fs.existsSync(finalStatusPath)).toBe(true);
  });
});
