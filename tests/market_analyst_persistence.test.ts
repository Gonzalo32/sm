import { describe, it, expect, beforeEach } from 'vitest';
import { MarketAnalystJournal, ForecastOutcomeRecord } from '../extension/analyst/MarketAnalystJournal';
import { MarketAnalystValidator } from '../core/analyst/MarketAnalystValidator';
import { MarketAnalysis } from '../core/analyst/MarketAnalystTypes';
import { Candle } from '../core/market/Candle';

// In-Memory IndexedDB Mock for MarketAnalystJournal testing
class MockAnalystIDBDatabase {
  public objectStoreNames = {
    contains: (name: string) => name in this.stores,
  };
  private stores: Record<string, Map<string, any>> = {
    forecasts: new Map(),
    outcomes: new Map(),
  };

  public createObjectStore(name: string, _opts: any) {
    if (!this.stores[name]) this.stores[name] = new Map();
    return {
      createIndex: () => {},
    };
  }

  public transaction(_storeNames: string | string[], _mode: string) {
    const stores = this.stores;
    return {
      objectStore: (name: string) => {
        const storeMap = stores[name] || new Map();
        return {
          add: (value: any) => {
            const key = name === 'forecasts' ? value.analysisId : value.outcomeId;
            const req = { onsuccess: null as any, onerror: null as any, error: null as any };
            if (storeMap.has(key)) {
              setTimeout(() => {
                req.error = new Error(`Key already exists in store ${name}: ${key}`);
                if (req.onerror) req.onerror();
              }, 0);
            } else {
              storeMap.set(key, JSON.parse(JSON.stringify(value)));
              setTimeout(() => req.onsuccess && req.onsuccess(), 0);
            }
            return req;
          },
          put: (value: any) => {
            const key = name === 'forecasts' ? value.analysisId : value.outcomeId;
            storeMap.set(key, JSON.parse(JSON.stringify(value)));
            const req = { onsuccess: null as any, onerror: null as any };
            setTimeout(() => req.onsuccess && req.onsuccess(), 0);
            return req;
          },
          get: (key: any) => {
            const res = storeMap.get(key);
            const req = { result: res ? JSON.parse(JSON.stringify(res)) : undefined, onsuccess: null as any, onerror: null as any };
            setTimeout(() => req.onsuccess && req.onsuccess(), 0);
            return req;
          },
          getAll: () => {
            const list = Array.from(storeMap.values()).map((v) => JSON.parse(JSON.stringify(v)));
            const req = { result: list, onsuccess: null as any, onerror: null as any };
            setTimeout(() => req.onsuccess && req.onsuccess(), 0);
            return req;
          },
          index: (_indexName: string) => ({
            getAll: (searchKey: string) => {
              const list = Array.from(storeMap.values())
                .filter((v) => v.analysisId === searchKey)
                .map((v) => JSON.parse(JSON.stringify(v)));
              const req = { result: list, onsuccess: null as any, onerror: null as any };
              setTimeout(() => req.onsuccess && req.onsuccess(), 0);
              return req;
            },
          }),
          clear: () => {
            storeMap.clear();
          },
        };
      },
      oncomplete: null as any,
      onerror: null as any,
    };
  }
}

class MockAnalystIDBFactory {
  private mockDb = new MockAnalystIDBDatabase();

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

describe('TradeSea Market Analyst — Persistence & Causal Outcome Validation', () => {
  let journal: MarketAnalystJournal;
  let validator: MarketAnalystValidator;

  const mockAnalysis: MarketAnalysis = {
    analysisId: 'ANL_MNQZ6_1m_TEST_100',
    instrument: 'MNQZ6',
    timeframe: '1m',
    evaluatedAt: '2026-10-14T10:00:00.000Z',
    evaluationTimestampMs: 100000,
    latestCandleTimestampMs: 100000,
    status: 'ANALYSIS_READY',
    preferredDirection: 'BULLISH',
    statusExplanation: 'Bullish scenario preferred',
    selectedScenario: {
      direction: 'BULLISH',
      referencePrice: 20000,
      nearbyTarget: { price: 20040, rationale: 'BSL target', structuralSource: 'LIQUIDITY_POOL' },
      extendedTarget: { price: 20080, rationale: 'Extended BSL', structuralSource: 'LIQUIDITY_POOL' },
      invalidationLevel: 19970,
      invalidationRationale: 'SSL extreme',
      supportingEvidence: ['Bullish trend'],
      conflictingEvidence: [],
      conditionsRequired: [],
      confidenceLabel: 'MODERATE',
      targetAccessibilityNotes: [],
    },
    dataQualityNotes: [],
    uncertaintyNotes: [],
    modelVersions: { analyst: '1.0.0' },
  };

  beforeEach(async () => {
    journal = new MarketAnalystJournal();
    const mockFactory = new MockAnalystIDBFactory();
    await journal.init(mockFactory as any);
    validator = new MarketAnalystValidator();
  });

  it('1. Persists immutable original forecast and rejects duplicate overwrite', async () => {
    const saved = await journal.recordForecast(mockAnalysis, 50, 50000, 100000);
    expect(saved.analysisId).toBe(mockAnalysis.analysisId);
    expect(saved.originalRecordFrozen).toBe(true);

    const retrieved = await journal.getForecast(mockAnalysis.analysisId);
    expect(retrieved).toBeDefined();
    expect(retrieved!.instrument).toBe('MNQZ6');

    // Attempting to overwrite must reject / throw error
    await expect(journal.recordForecast(mockAnalysis, 50, 50000, 100000)).rejects.toThrow(
      'Cannot overwrite existing forecast'
    );
  });

  it('2. Appends outcome evaluations to separate store without mutating forecast', async () => {
    await journal.recordForecast(mockAnalysis, 50);

    const outcomeRecord: ForecastOutcomeRecord = {
      outcomeId: 'OUT_1',
      analysisId: mockAnalysis.analysisId,
      evaluatedAtIso: new Date().toISOString(),
      evaluatedCandleCount: 10,
      outcomeStatus: 'TARGET_HIT',
      targetHitPrice: 20040,
      targetHitTimestampMs: 160000,
      maxFavorableExcursionPts: 42.0,
      maxAdverseExcursionPts: 5.0,
      baselineFrictionAssumptionPts: 1.0,
      notes: 'Nearby target reached.',
    };

    await journal.recordOutcome(outcomeRecord);

    const outcomes = await journal.getOutcomesForForecast(mockAnalysis.analysisId);
    expect(outcomes.length).toBe(1);
    expect(outcomes[0].outcomeStatus).toBe('TARGET_HIT');
    expect(outcomes[0].maxFavorableExcursionPts).toBe(42.0);

    // Verify original forecast was not mutated
    const original = await journal.getForecast(mockAnalysis.analysisId);
    expect(original!.originalRecordFrozen).toBe(true);
  });

  it('3. Validator evaluates TARGET_HIT and calculates MFE/MAE', () => {
    const futureCandles: Candle[] = [
      {
        symbol: 'MNQZ6',
        timeframe: '1m',
        timestamp: 160000,
        open: 20000,
        high: 20025,
        low: 19990, // Adverse: 10 pts
        close: 20020,
        volume: 100,
      },
      {
        symbol: 'MNQZ6',
        timeframe: '1m',
        timestamp: 220000,
        open: 20020,
        high: 20045, // Touches nearby target 20040! Favorable: 45 pts
        low: 20015,
        close: 20042,
        volume: 100,
      },
    ];

    const outcome = validator.evaluateOutcome(mockAnalysis, futureCandles);
    expect(outcome.outcomeStatus).toBe('TARGET_HIT');
    expect(outcome.targetHitPrice).toBe(20040);
    expect(outcome.maxFavorableExcursionPts).toBe(45.0);
    expect(outcome.maxAdverseExcursionPts).toBe(10.0);
  });

  it('4. Validator evaluates INVALIDATION_HIT when price breaches invalidation level', () => {
    const futureCandles: Candle[] = [
      {
        symbol: 'MNQZ6',
        timeframe: '1m',
        timestamp: 160000,
        open: 20000,
        high: 20010,
        low: 19965, // Breaches invalidation 19970!
        close: 19968,
        volume: 100,
      },
    ];

    const outcome = validator.evaluateOutcome(mockAnalysis, futureCandles);
    expect(outcome.outcomeStatus).toBe('INVALIDATION_HIT');
    expect(outcome.invalidationHitPrice).toBe(19970);
    expect(outcome.maxAdverseExcursionPts).toBe(35.0);
  });

  it('5. Validator flags AMBIGUOUS_EVALUATION when target and invalidation touch on the exact same bar', () => {
    const futureCandles: Candle[] = [
      {
        symbol: 'MNQZ6',
        timeframe: '1m',
        timestamp: 160000,
        open: 20000,
        high: 20050, // Touches target 20040!
        low: 19960, // Touches invalidation 19970!
        close: 20010,
        volume: 500,
      },
    ];

    const outcome = validator.evaluateOutcome(mockAnalysis, futureCandles);
    expect(outcome.outcomeStatus).toBe('AMBIGUOUS_EVALUATION');
    expect(outcome.notes).toContain('touched both nearby target');
    expect(outcome.notes).toContain('evaluated fail-closed as AMBIGUOUS');
  });

  it('6. Validator returns EXPIRED when horizon closes without reaching target or invalidation', () => {
    const futureCandles: Candle[] = [
      {
        symbol: 'MNQZ6',
        timeframe: '1m',
        timestamp: 160000,
        open: 20000,
        high: 20015,
        low: 19985,
        close: 20005,
        volume: 100,
      },
    ];

    const outcome = validator.evaluateOutcome(mockAnalysis, futureCandles, { maxEvaluationCandles: 1 });
    expect(outcome.outcomeStatus).toBe('EXPIRED');
    expect(outcome.notes).toContain('expired after 1 candles');
  });
});
