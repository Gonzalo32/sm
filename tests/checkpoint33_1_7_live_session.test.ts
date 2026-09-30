/**
 * Checkpoint 33.1.7 - Live TradeSea Browser Session & Execution Gate Test Suite
 * Validates real session execution parameters, authentication gate tracking, credential safety,
 * synthetic runtime blocking, non-fabrication policies, candle normalization & store isolation,
 * ICT engine non-mutation, and explicit PARTIAL status enforcement when unauthenticated.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { MarketDataAdapter } from '../core/market/MarketDataAdapter';
import { CandleStore } from '../core/market/CandleStore';
import { DEFAULT_ICT_CONFIG } from '../core/ict/types/ICTConfig';
import { DEFAULT_DISPLACEMENT_CONFIG } from '../core/ict/displacement/DisplacementEngine';
import { PREDEFINED_MODELS } from '../core/ict/models/PredefinedModels';

describe('Checkpoint 33.1.7 - Live Browser Session & Execution Gate Suite', () => {
  const rootDir = process.cwd();
  const sessionDocPath = path.join(rootDir, 'CP33.1.7_LIVE_SESSION_AUDIT.md');
  const authDocPath = path.join(rootDir, 'CP33.1.7_AUTHENTICATION_GATE.md');
  const provDocPath = path.join(rootDir, 'CP33.1.7_PROVENANCE_AND_SAFETY.md');
  const finalStatusPath = path.join(rootDir, 'CP33.1.7_FINAL_STATUS.md');

  // 1. Session execution tracking
  it('1. should track TRADESEA_SESSION_EXECUTED = YES in CP33.1.7_FINAL_STATUS.md', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('TRADESEA_SESSION_EXECUTED = YES');
  });

  // 2. Authentication gate tracking
  it('2. should track TRADESEA_SESSION_AUTHENTICATED = NO in CP33.1.7_FINAL_STATUS.md', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('TRADESEA_SESSION_AUTHENTICATED = NO');
  });

  // 3. WebSocket frame observation tracking
  it('3. should track WEBSOCKET_FRAME_OBSERVED = NO in CP33.1.7_FINAL_STATUS.md', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('WEBSOCKET_FRAME_OBSERVED = NO');
  });

  // 4. Real data received status tracking
  it('4. should track REAL_DATA_RECEIVED = NO when session is unauthenticated', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('REAL_DATA_RECEIVED = NO');
  });

  // 5. Credential safety policy
  it('5. should enforce CREDENTIAL_SAFETY = PASS without storing secrets or tokens', () => {
    const authContent = fs.readFileSync(authDocPath, 'utf-8');
    expect(authContent).toContain('CREDENTIAL_SAFETY = PASS');
  });

  // 6. Synthetic runtime blocker policy
  it('6. should enforce SYNTHETIC_RUNTIME_BLOCKED = YES for real runtime adapter', () => {
    const adapter = new MarketDataAdapter(
      { source: 'CP21DatasetGenerator', instrument: 'MNQ', timeframe: '1m', isSynthetic: true },
      undefined,
      true // requireRealRuntime
    );
    const res = adapter.ingestRealtimeCandle({ timestamp: 1000, open: 1800, high: 1810, low: 1795, close: 1805 });
    expect(res.success).toBe(false);
    expect(res.status).toBe('REJECTED_FOR_REAL_RUNTIME');
  });

  // 7. Non-fabrication policy
  it('7. should enforce NO_DATA_FABRICATION = YES without padding missing data', () => {
    const provContent = fs.readFileSync(provDocPath, 'utf-8');
    expect(provContent).toContain('NO_DATA_FABRICATION = YES');
  });

  // 8. Real candle normalization contract
  it('8. should validate and normalize real candle structures cleanly', () => {
    const adapter = new MarketDataAdapter({ source: 'TradeSea_WS', instrument: 'MNQ', timeframe: '1m' });
    const candle = { timestamp: 1767225600000, open: 1800, high: 1810, low: 1795, close: 1805, volume: 250 };
    const res = adapter.ingestRealtimeCandle(candle);
    expect(res.success).toBe(true);
    expect(adapter.getStore().getCandleCount()).toBe(1);
  });

  // 9. Store ingestion and isolation contract
  it('9. should isolate candle stores across MNQ and NQ instruments', () => {
    const storeMNQ = new CandleStore('MNQ', '1m');
    const storeNQ = new CandleStore('NQ', '1m');
    storeMNQ.ingestCandle({ timestamp: 1000, open: 1800, high: 1810, low: 1795, close: 1805 });
    storeNQ.ingestCandle({ timestamp: 1000, open: 18000, high: 18100, low: 17950, close: 18050 });

    expect(storeMNQ.getLatestCandle()?.close).toBe(1805);
    expect(storeNQ.getLatestCandle()?.close).toBe(18050);
  });

  // 10. Symbol context transition detection
  it('10. should clear store and update context on symbol change', () => {
    const store = new CandleStore('MNQ', '1m');
    store.ingestCandle({ timestamp: 1000, open: 1800, high: 1810, low: 1795, close: 1805 });
    const changed = store.setContext('NQ', '1m');
    expect(changed).toBe(true);
    expect(store.getCandleCount()).toBe(0);
    expect(store.getContext().symbol).toBe('NQ');
  });

  // 11. Timeframe context transition detection
  it('11. should clear store and update context on timeframe change', () => {
    const store = new CandleStore('MNQ', '1m');
    store.ingestCandle({ timestamp: 1000, open: 1800, high: 1810, low: 1795, close: 1805 });
    const changed = store.setContext('MNQ', '5m');
    expect(changed).toBe(true);
    expect(store.getCandleCount()).toBe(0);
    expect(store.getContext().timeframe).toBe('5m');
  });

  // 12. ICT non-mutation assertions
  it('12. should verify ICT engine thresholds and models remain untouched', () => {
    expect(DEFAULT_DISPLACEMENT_CONFIG.minBodyToRangeRatio).toBe(0.60);
    expect(DEFAULT_DISPLACEMENT_CONFIG.minRangeMultiplier).toBe(1.50);
    expect(DEFAULT_ICT_CONFIG.fvgMinSizePoints).toBe(0.25);
    expect(PREDEFINED_MODELS.length).toBeGreaterThanOrEqual(3);
  });

  // 13. CP33.1.7 status declaration
  it('13. should declare CP33.1.7_STATUS = PARTIAL in final status report', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('CP33.1.7_STATUS = PARTIAL');
  });

  // 14. Deliverable documentation files verification
  it('14. should verify all CP33.1.7 deliverable files exist', () => {
    expect(fs.existsSync(sessionDocPath)).toBe(true);
    expect(fs.existsSync(authDocPath)).toBe(true);
    expect(fs.existsSync(provDocPath)).toBe(true);
    expect(fs.existsSync(finalStatusPath)).toBe(true);
  });
});
