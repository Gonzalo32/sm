import { describe, it, expect, beforeEach } from 'vitest';
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

describe('CP71 — Real-Time Recorder Endurance & S10 Preflight Audit', () => {
  const rootDir = process.cwd();
  const manifestPath = path.join(rootDir, 'data_audit/phase_s10_prospective/s10_session_manifest.json');
  const protocolPath = path.join(rootDir, 'data_audit/phase_s10_prospective/s10_prospective_protocol_spec_v1_1_0_final.json');

  let mockFactory: MockIDBFactory;
  let storage: PassiveRecorderStorage;
  let recorder: TradeSeaPassiveRecorder;

  beforeEach(async () => {
    mockFactory = new MockIDBFactory();
    storage = new PassiveRecorderStorage();
    await storage.init(mockFactory as any);
    recorder = new TradeSeaPassiveRecorder(storage);
    await recorder.init(mockFactory as any);
  });

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

  it('3. Persistence and restart recovery with NON_OFFICIAL_CP71_SOAK_TEST session provenance', async () => {
    const session = await recorder.startRecording('MNQ', '1m');
    session.status = 'ACTIVE';

    await recorder.handleCandleEvent({
      type: 'ICT_CANDLE_CLOSE',
      candle: { timestamp: 1779128100000, open: 20000, high: 20010, low: 19990, close: 20005, volume: 10 },
      symbol: 'MNQ',
      timeframe: '1m',
    });

    // Simulate extension reload / restart
    const newStorage = new PassiveRecorderStorage();
    await newStorage.init(mockFactory as any);
    const newRecorder = new TradeSeaPassiveRecorder(newStorage);
    await newRecorder.init(mockFactory as any);

    const stored = await newRecorder.getStoredCandles();
    expect(stored.length).toBe(1);
    expect(stored[0].close).toBe(20005);
    expect(stored[0].isClosed).toBe(true);
  });

  it('4. Reconnect duplicate delivery rejection', async () => {
    await recorder.startRecording('MNQ', '1m');

    await recorder.handleCandleEvent({
      type: 'ICT_CANDLE_CLOSE',
      candle: { timestamp: 1779128100000, open: 20000, high: 20010, low: 19990, close: 20005, volume: 10 },
      symbol: 'MNQ',
      timeframe: '1m',
    });

    // Reconnection re-sends same closed candle -> rejected by primary key
    const resDup = await recorder.handleCandleEvent({
      type: 'ICT_CANDLE_CLOSE',
      candle: { timestamp: 1779128100000, open: 20000, high: 20010, low: 19990, close: 20005, volume: 10 },
      symbol: 'MNQ',
      timeframe: '1m',
    });

    expect(resDup.stored).toBe(false);
    expect(resDup.reason).toContain('Duplicate');
  });

  it('5. Gap recording without synthetic candle filling', async () => {
    await recorder.startRecording('MNQ', '1m');

    await recorder.handleCandleEvent({
      type: 'ICT_CANDLE_CLOSE',
      candle: { timestamp: 1779128100000, open: 20000, high: 20010, low: 19990, close: 20005, volume: 10 },
      symbol: 'MNQ',
      timeframe: '1m',
    });

    // 2-minute gap
    await recorder.handleCandleEvent({
      type: 'ICT_CANDLE_CLOSE',
      candle: { timestamp: 1779128280000, open: 20030, high: 20040, low: 20025, close: 20035, volume: 12 },
      symbol: 'MNQ',
      timeframe: '1m',
    });

    const stored = await recorder.getStoredCandles();
    expect(stored.length).toBe(2);
    expect(stored[0].timestamp).toBe(1779128100000);
    expect(stored[1].timestamp).toBe(1779128280000);
  });

  it('6. Export provenance isolation and credential safety', async () => {
    await recorder.startRecording('MNQ', '1m');

    await recorder.handleCandleEvent({
      type: 'ICT_CANDLE_CLOSE',
      candle: { timestamp: 1779128100000, open: 20000, high: 20010, low: 19990, close: 20005, volume: 10 },
      symbol: 'MNQ',
      timeframe: '1m',
    });

    const exportManifest = await recorder.exportManifest();
    expect(exportManifest.closedCandleCount).toBe(1);
    expect(exportManifest.dataHash).toBeDefined();

    const jsonStr = JSON.stringify(exportManifest).toLowerCase();
    expect(jsonStr).not.toContain('password');
    expect(jsonStr).not.toContain('auth');
    expect(jsonStr).not.toContain('token');
    expect(jsonStr).not.toContain('balance');
  });
});
