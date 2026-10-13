import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';
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

describe('CP65 — Passive Recorder Implementation & Data Integrity Audit', () => {
  const rootDir = process.cwd();
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

  it('2. Closed candles persistence & retrieval in IndexedDB', async () => {
    await recorder.startRecording('MNQ', '1m');

    const res = await recorder.handleCandleEvent({
      type: 'ICT_CANDLE_CLOSE',
      candle: { timestamp: 1779128100000, open: 20000, high: 20010, low: 19990, close: 20005, volume: 10 },
      symbol: 'MNQ',
      timeframe: '1m',
    });

    expect(res.stored).toBe(true);

    const stored = await recorder.getStoredCandles();
    expect(stored.length).toBe(1);
    expect(stored[0].close).toBe(20005);
    expect(stored[0].isClosed).toBe(true);
    expect(stored[0].integrityHash).toBeDefined();
  });

  it('3. Reconnection deduplication for duplicate closed candles', async () => {
    await recorder.startRecording('MNQ', '1m');

    // Ingest candle
    await recorder.handleCandleEvent({
      type: 'ICT_CANDLE_CLOSE',
      candle: { timestamp: 1779128100000, open: 20000, high: 20010, low: 19990, close: 20005, volume: 10 },
      symbol: 'MNQ',
      timeframe: '1m',
    });

    // Reconnection occurs - duplicate candle received
    const resDup = await recorder.handleCandleEvent({
      type: 'ICT_CANDLE_CLOSE',
      candle: { timestamp: 1779128100000, open: 20000, high: 20010, low: 19990, close: 20005, volume: 10 },
      symbol: 'MNQ',
      timeframe: '1m',
    });

    expect(resDup.stored).toBe(false);
    expect(resDup.reason).toContain('Duplicate');

    const stored = await recorder.getStoredCandles();
    expect(stored.length).toBe(1);
  });

  it('4. Separation between forming candle updates and closed candles', async () => {
    await recorder.startRecording('MNQ', '1m');

    // Forming tick update
    const resForming = await recorder.handleCandleEvent({
      type: 'ICT_CANDLE_UPDATE',
      candle: { timestamp: 1779128100000, open: 20000, high: 20015, low: 19990, close: 20012, volume: 5 },
      symbol: 'MNQ',
      timeframe: '1m',
    });

    expect(resForming.stored).toBe(false);
    expect(resForming.reason).toContain('Forming candle update skipped');

    // Closed candle event
    const resClosed = await recorder.handleCandleEvent({
      type: 'ICT_CANDLE_CLOSE',
      candle: { timestamp: 1779128100000, open: 20000, high: 20015, low: 19990, close: 20012, volume: 15 },
      symbol: 'MNQ',
      timeframe: '1m',
    });

    expect(resClosed.stored).toBe(true);

    // Attempt forming update on closed candle -> rejected
    const resPostUpdate = await storage.saveCandle({
      symbol: 'MNQ',
      timeframe: '1m',
      timestamp: 1779128100000,
      open: 20000,
      high: 20020,
      low: 19990,
      close: 20018,
      isClosed: false,
    });

    expect(resPostUpdate.stored).toBe(false);
    expect(resPostUpdate.reason).toContain('Cannot overwrite closed candle');
  });

  it('5. Gap detection without synthetic filling', async () => {
    await recorder.startRecording('MNQ', '1m');

    // Candle 1 at t0
    await recorder.handleCandleEvent({
      type: 'ICT_CANDLE_CLOSE',
      candle: { timestamp: 1779128100000, open: 20000, high: 20010, low: 19990, close: 20005, volume: 10 },
      symbol: 'MNQ',
      timeframe: '1m',
    });

    // Candle 2 at t0 + 3m (2 minute gap skipped)
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

    const session = recorder.isRecordingActive() ? await storage.getActiveSession() : null;
    expect(session?.gapCount).toBeGreaterThan(0);
  });

  it('6. Extension restart recovery without data loss', async () => {
    await recorder.startRecording('MNQ', '1m');

    await recorder.handleCandleEvent({
      type: 'ICT_CANDLE_CLOSE',
      candle: { timestamp: 1779128100000, open: 20000, high: 20010, low: 19990, close: 20005, volume: 10 },
      symbol: 'MNQ',
      timeframe: '1m',
    });

    // Simulate Extension Restart
    const newStorage = new PassiveRecorderStorage();
    await newStorage.init(mockFactory as any);
    const newRecorder = new TradeSeaPassiveRecorder(newStorage);
    await newRecorder.init(mockFactory as any);

    const storedAfterRestart = await newRecorder.getStoredCandles();
    expect(storedAfterRestart.length).toBe(1);
    expect(storedAfterRestart[0].close).toBe(20005);
  });

  it('7. Isolation by symbol and timeframe', async () => {
    await recorder.startRecording('MNQ', '1m');

    await recorder.handleCandleEvent({
      type: 'ICT_CANDLE_CLOSE',
      candle: { timestamp: 1779128100000, open: 20000, high: 20010, low: 19990, close: 20005, volume: 10 },
      symbol: 'MNQ',
      timeframe: '1m',
    });

    // Event with different timeframe NQ 5m -> rejected by context check
    const resMismatched = await recorder.handleCandleEvent({
      type: 'ICT_CANDLE_CLOSE',
      candle: { timestamp: 1779128100000, open: 20000, high: 20010, low: 19990, close: 20005, volume: 10 },
      symbol: 'NQ',
      timeframe: '5m',
    });

    expect(resMismatched.stored).toBe(false);
    expect(resMismatched.reason).toContain('mismatch');
  });

  it('8. Export manifest generation and SHA-256 hash verification', async () => {
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
    expect(exportManifest.manifestHash).toBeDefined();

    // Verify SHA-256 hash recalculation
    const recalculatedDataHash = crypto.createHash('sha256').update(JSON.stringify(exportManifest.data)).digest('hex');
    expect(recalculatedDataHash).toBe(exportManifest.dataHash);
  });

  it('9. Complete absence of credentials, tokens, or personal account fields in exports', async () => {
    await recorder.startRecording('MNQ', '1m');

    await recorder.handleCandleEvent({
      type: 'ICT_CANDLE_CLOSE',
      candle: { timestamp: 1779128100000, open: 20000, high: 20010, low: 19990, close: 20005, volume: 10 },
      symbol: 'MNQ',
      timeframe: '1m',
    });

    const exportManifest = await recorder.exportManifest();
    const jsonString = JSON.stringify(exportManifest).toLowerCase();

    expect(jsonString).not.toContain('password');
    expect(jsonString).not.toContain('token');
    expect(jsonString).not.toContain('auth');
    expect(jsonString).not.toContain('balance');
    expect(jsonString).not.toContain('account');
    expect(jsonString).not.toContain('credential');
  });
});
