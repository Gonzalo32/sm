import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { PassiveRecorderStorage } from '../extension/content/PassiveRecorderStorage';
import { TradeSeaPassiveRecorder } from '../extension/content/TradeSeaPassiveRecorder';

// In-Memory IndexedDB Mock for Node environment
class MockIDBDatabase {
  public objectStoreNames = {
    contains: (name: string) => name in this.stores,
  };
  private stores: Record<string, Map<string, any>> = {
    candles: new Map(),
    sessions: new Map(),
  };

  public transaction(_storeNames: string | string[], _mode: string) {
    const stores = this.stores;
    return {
      objectStore: (name: string) => {
        const storeMap = stores[name] || new Map();
        return {
          put: (value: any) => {
            let key: string;
            if (name === 'candles') {
              key = `${value.symbol}_${value.timeframe}_${value.timestamp}`;
            } else {
              key = value.sessionId;
            }
            storeMap.set(key, JSON.parse(JSON.stringify(value)));
            const req = { onsuccess: null as any, onerror: null as any };
            setTimeout(() => req.onsuccess && req.onsuccess(), 0);
            return req;
          },
          get: (key: any) => {
            const keyStr = Array.isArray(key) ? `${key[0]}_${key[1]}_${key[2]}` : key;
            const res = storeMap.get(keyStr);
            const req = { result: res ? JSON.parse(JSON.stringify(res)) : undefined, onsuccess: null as any, onerror: null as any };
            setTimeout(() => req.onsuccess && req.onsuccess(), 0);
            return req;
          },
          getAll: () => {
            const list = Array.from(storeMap.values()).map(v => JSON.parse(JSON.stringify(v)));
            const req = { result: list, onsuccess: null as any, onerror: null as any };
            setTimeout(() => req.onsuccess && req.onsuccess(), 0);
            return req;
          },
          index: (_indexName: string) => ({
            getAll: (keyRange: any[]) => {
              const list = Array.from(storeMap.values())
                .filter(v => v.symbol === keyRange[0] && v.timeframe === keyRange[1])
                .map(v => JSON.parse(JSON.stringify(v)));
              const req = { result: list, onsuccess: null as any, onerror: null as any };
              setTimeout(() => req.onsuccess && req.onsuccess(), 0);
              return req;
            }
          }),
          clear: () => {
            storeMap.clear();
            const tx = { oncomplete: null as any, onerror: null as any };
            setTimeout(() => tx.oncomplete && tx.oncomplete(), 0);
            return tx;
          }
        };
      },
      oncomplete: null as any,
      onerror: null as any,
    };
  }
}

class MockIDBFactory {
  private mockDb = new MockIDBDatabase();

  public open(_name: string, _version: number) {
    const req = {
      result: this.mockDb,
      error: null,
      onsuccess: null as any,
      onerror: null as any,
      onupgradeneeded: null as any,
    };

    setTimeout(() => {
      if (req.onupgradeneeded) {
        req.onupgradeneeded({ target: { result: this.mockDb } });
      }
      if (req.onsuccess) {
        req.onsuccess({ target: { result: this.mockDb } });
      }
    }, 0);

    return req;
  }
}

describe('CP76 — S10 Operational Readiness and Explicit Authorization Gate Suite', () => {
  const rootDir = process.cwd();
  const manifestPath = path.join(rootDir, 'data_audit/phase_s10_prospective/s10_session_manifest.json');
  const protocolPath = path.join(rootDir, 'data_audit/phase_s10_prospective/s10_prospective_protocol_spec_v1_1_0_final.json');

  it('1. core/ict/ must maintain 0 diff lines against baseline 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a', () => {
    const diff = execSync('git diff 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a -- core/ict/', {
      encoding: 'utf-8',
      cwd: rootDir,
    });
    expect(diff.trim()).toBe('');
  });

  it('2. Exact byte SHA-256 of s10_session_manifest.json and protocol v1.1.0 spec must match frozen hashes', () => {
    const manifestContent = fs.readFileSync(manifestPath);
    const manifestHash = crypto.createHash('sha256').update(manifestContent).digest('hex');
    expect(manifestHash).toBe('744720e2b930550d1d7bb76654459b9277c094302b595051fad8323cba7f7107');

    const protocolContent = fs.readFileSync(protocolPath);
    const protocolHash = crypto.createHash('sha256').update(protocolContent).digest('hex');
    expect(protocolHash).toBe('d8c4e83cbce2a303c2fd947cac424822d6d6885a4d5800ff234ef5e348317220');
  });

  it('3. Scheduled session progression is determined strictly from frozen manifest', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(manifest.preregisteredSessionCount).toBe(40);
    expect(manifest.totalEntries).toBe(41);
    expect(manifest.sessions.length).toBe(41);

    const activeSessions = manifest.sessions.filter((s: any) => s.status === 'PREREGISTERED_PENDING_ACQUISITION');
    expect(activeSessions.length).toBe(40);

    const holidayEntries = manifest.sessions.filter((s: any) => s.status.includes('SKIPPED'));
    expect(holidayEntries.length).toBe(1);
    expect(holidayEntries[0].dateLocal).toBe('2026-11-26');

    // Verify Session 001 and Session 002 metadata
    const sess1 = activeSessions[0];
    expect(sess1.sessionId).toBe('S10_SESSION_001_20261012');
    expect(sess1.dateLocal).toBe('2026-10-12');
    expect(sess1.status).toBe('PREREGISTERED_PENDING_ACQUISITION');
    expect(sess1.contract).toBe('NQZ6 / MNQZ6');

    const sess2 = activeSessions[1];
    expect(sess2.sessionId).toBe('S10_SESSION_002_20261013');
    expect(sess2.dateLocal).toBe('2026-10-13');
    expect(sess2.status).toBe('PREREGISTERED_PENDING_ACQUISITION');
    expect(sess2.contract).toBe('NQZ6 / MNQZ6');

    // Verify final session 040
    const sess40 = activeSessions[39];
    expect(sess40.sessionId).toBe('S10_SESSION_040_20261207');
    expect(sess40.dateLocal).toBe('2026-12-07');
  });

  it('4. Timezone mapping and daylight-saving transition rules (EDT UTC-4 -> ART UTC-3 vs EST UTC-5 -> ART UTC-3)', () => {
    const protocol = JSON.parse(fs.readFileSync(protocolPath, 'utf-8'));
    const schedule = protocol.neuquenLocalTimeSchedule;

    // EDT: Oct 12 to Oct 31 (UTC-4) -> ART (UTC-3) difference is +1 hour
    expect(schedule.edtPeriod.rthNycLocal).toBe('09:30 - 16:00 EDT');
    expect(schedule.edtPeriod.rthNeuquenLocal).toBe('10:30 - 17:00 ART (UTC-3)');
    expect(schedule.edtPeriod.signalCutoffNeuquen).toBe('16:55 ART');

    // EST: Nov 02 to Dec 07 (UTC-5) -> ART (UTC-3) difference is +2 hours
    expect(schedule.estPeriod.rthNycLocal).toBe('09:30 - 16:00 EST');
    expect(schedule.estPeriod.rthNeuquenLocal).toBe('11:30 - 18:00 ART (UTC-3)');
    expect(schedule.estPeriod.signalCutoffNeuquen).toBe('17:55 ART');
  });

  it('5. Test data isolation: CP72 and CP73 records have non-official provenance and do not enter S10 ledger', () => {
    const cp72Export = JSON.parse(fs.readFileSync(path.join(rootDir, 'data_audit/phase_cp72/cp72_export_manifest.json'), 'utf-8'));
    const cp73Export = JSON.parse(fs.readFileSync(path.join(rootDir, 'data_audit/phase_cp73/cp73_export_manifest.json'), 'utf-8'));

    expect(cp72Export.dataLabel).toBe('NON_OFFICIAL_CP72_SOAK_TEST');
    expect(cp72Export.exportFormatVersion).toBe('1.1.0-NON_OFFICIAL_CP72_SOAK_TEST');

    expect(cp73Export.dataLabel).toBe('NON_OFFICIAL_CP73_RECONNECT_TEST');
    expect(cp73Export.exportFormatVersion).toBe('1.1.0-NON_OFFICIAL_CP73_RECONNECT_TEST');

    // Verify official captures directory does not contain CP72/CP73 non-official test records
    const dailyCapturesPath = path.join(rootDir, 'data_audit/phase_s10_prospective/daily_captures');
    const officialExists = fs.existsSync(dailyCapturesPath);
    if (officialExists) {
      const files = fs.readdirSync(dailyCapturesPath);
      files.forEach((file) => {
        expect(file).not.toContain('CP72');
        expect(file).not.toContain('CP73');
        expect(file).toMatch(/^S10_SESSION_/);
      });
    }
  });

  it('6. Recorder passive frame handling, deduplication, and persistence contract', async () => {
    const mockFactory = new MockIDBFactory();
    const storage = new PassiveRecorderStorage();
    await storage.init(mockFactory as any);
    const recorder = new TradeSeaPassiveRecorder(storage);
    await recorder.init(mockFactory as any);

    // Initial state
    expect(recorder.isRecordingActive()).toBe(false);
    expect(recorder.getContext()).toEqual({ symbol: 'MNQ', timeframe: '1m' });

    await recorder.startRecording('MNQ', '1m');
    expect(recorder.isRecordingActive()).toBe(true);

    // Forming tick skipped for prospective closed ledger
    const formingRes = await recorder.handleCandleEvent({
      type: 'ICT_CANDLE_UPDATE',
      candle: { timestamp: 1779130000000, open: 31050, high: 31055, low: 31045, close: 31052, volume: 5 },
      symbol: 'MNQ',
      timeframe: '1m',
    });
    expect(formingRes.stored).toBe(false);
    expect(formingRes.reason).toContain('skipped');

    // Closed candle stored
    const closedRes = await recorder.handleCandleEvent({
      type: 'ICT_CANDLE_CLOSE',
      candle: { timestamp: 1779130000000, open: 31050, high: 31055, low: 31045, close: 31052, volume: 10 },
      symbol: 'MNQ',
      timeframe: '1m',
    });
    expect(closedRes.stored).toBe(true);

    // Duplicate closed candle rejected
    const dupRes = await recorder.handleCandleEvent({
      type: 'ICT_CANDLE_CLOSE',
      candle: { timestamp: 1779130000000, open: 31050, high: 31055, low: 31045, close: 31052, volume: 10 },
      symbol: 'MNQ',
      timeframe: '1m',
    });
    expect(dupRes.stored).toBe(false);
    expect(dupRes.reason).toContain('Duplicate');

    const stored = await recorder.getStoredCandles();
    expect(stored.length).toBe(1);
    expect(stored[0].isClosed).toBe(true);
  });
});
