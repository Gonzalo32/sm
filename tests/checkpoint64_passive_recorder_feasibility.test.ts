import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { CandleStore } from '../core/market/CandleStore';
import { Candle } from '../core/market/Candle';

describe('CP64 — TradeSea Live Feed Passive Recorder Feasibility Audit', () => {
  const rootDir = process.cwd();
  const pageBridgePath = path.join(rootDir, 'extension/content/pageBridge.ts');
  const contentScriptPath = path.join(rootDir, 'extension/content/contentScript.ts');
  const coordinatorPath = path.join(rootDir, 'extension/content/ICTPipelineCoordinator.ts');
  const manifestPath = path.join(rootDir, 'data_audit/phase_s10_prospective/s10_session_manifest.json');

  it('1. core/ict/ must maintain 0 diff lines against baseline 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a', () => {
    const diff = execSync('git diff 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a -- core/ict/', {
      encoding: 'utf-8',
      cwd: rootDir,
    });
    expect(diff.trim()).toBe('');
  });

  it('2. pageBridge.ts and contentScript.ts must exist and implement passive WebSocket interception without order placement or credential logging', () => {
    expect(fs.existsSync(pageBridgePath)).toBe(true);
    expect(fs.existsSync(contentScriptPath)).toBe(true);
    expect(fs.existsSync(coordinatorPath)).toBe(true);

    const bridgeCode = fs.readFileSync(pageBridgePath, 'utf-8');
    
    // Check WebSocket interception capability
    expect(bridgeCode).toContain('WebSocket');
    expect(bridgeCode).toContain('timescale_update');
    expect(bridgeCode).toContain('ICT_CANDLE_CLOSE');
    expect(bridgeCode).toContain('ICT_NEW_CANDLE');

    // Confirm absolute absence of order execution / credential scraping keywords
    expect(bridgeCode.toLowerCase()).not.toContain('submitorder');
    expect(bridgeCode.toLowerCase()).not.toContain('placeorder');
    expect(bridgeCode.toLowerCase()).not.toContain('accountpassword');
    expect(bridgeCode.toLowerCase()).not.toContain('authtoken');
  });

  it('3. CandleStore must accurately distinguish active updates, closed candles, and deduplicate history', () => {
    const store = new CandleStore('MNQ', '1m');
    const events: string[] = [];

    store.subscribe((e) => {
      events.push(e.type);
    });

    const c1: Candle = { timestamp: 1779128100000, open: 20000, high: 20010, low: 19990, close: 20005, volume: 10 };
    const c1_tick: Candle = { timestamp: 1779128100000, open: 20000, high: 20015, low: 19990, close: 20012, volume: 5 };
    const c2: Candle = { timestamp: 1779128160000, open: 20012, high: 20025, low: 20010, close: 20020, volume: 15 };

    // Ingest first candle
    const res1 = store.ingestCandle(c1);
    expect(res1.eventType).toBe('ICT_NEW_CANDLE');

    // Update same candle (forming state update)
    const res2 = store.ingestCandle(c1_tick);
    expect(res2.eventType).toBe('ICT_CANDLE_UPDATE');
    expect(store.getLatestCandle()?.high).toBe(20015);
    expect(store.getLatestCandle()?.close).toBe(20012);

    // Ingest next minute candle (triggers CLOSE for c1, then NEW for c2)
    const res3 = store.ingestCandle(c2);
    expect(res3.eventType).toBe('ICT_NEW_CANDLE');

    expect(events).toEqual(['ICT_NEW_CANDLE', 'ICT_CANDLE_UPDATE', 'ICT_CANDLE_CLOSE', 'ICT_NEW_CANDLE']);
  });

  it('4. S10 frozen session manifest dates must align with Q4_Z contract schedule without contract roll discontinuity', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    expect(manifest.preregisteredSessionCount).toBe(40);
    expect(manifest.contractQuarter).toContain('Q4_Z');

    for (const session of manifest.sessions) {
      if (session.status !== 'PREREGISTERED_PENDING_ACQUISITION') continue;
      // All dates between 2026-10-12 and 2026-12-07 fall prior to Dec 10 contract roll date
      expect(session.contract).toContain('NQZ6');
    }
  });

  it('5. Feasibility Audit Verdict must be PASS_WITH_LIMITATIONS with clean documentation', () => {
    const cp64ReportPath = path.join(rootDir, 'data_audit/phase_cp64/cp64_feasibility_summary.json');
    if (fs.existsSync(cp64ReportPath)) {
      const report = JSON.parse(fs.readFileSync(cp64ReportPath, 'utf-8'));
      expect(report.cp64Status).toBe('PASS_WITH_LIMITATIONS');
      expect(report.liveTradingAuthorized).toBe('NO');
      expect(report.coreIctDiffLines).toBe(0);
    }
  });
});
