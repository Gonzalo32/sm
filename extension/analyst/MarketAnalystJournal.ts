/**
 * Extension Analyst - Market Analyst Forecast Journal & Persistence Layer
 * High-integrity IndexedDB persistence for immutable point-in-time forecasts and separate outcome evaluations.
 * Strictly isolated in 'TradeSeaMarketAnalystDB' to prevent any contamination of S10 prospective capture evidence.
 */

import { MarketAnalysis } from '../../core/analyst/MarketAnalystTypes';

export interface ForecastRecord extends MarketAnalysis {
  inputCandleCount: number;
  inputCandleStartTimestampMs?: number;
  inputCandleEndTimestampMs?: number;
  originalRecordFrozen: true;
}

export type ForecastOutcomeStatus =
  | 'TARGET_HIT'
  | 'EXTENDED_TARGET_HIT'
  | 'INVALIDATION_HIT'
  | 'UNRESOLVED'
  | 'EXPIRED'
  | 'AMBIGUOUS_EVALUATION';

export interface ForecastOutcomeRecord {
  outcomeId: string;
  analysisId: string;
  evaluatedAtIso: string;
  evaluatedCandleCount: number;
  outcomeStatus: ForecastOutcomeStatus;
  targetHitPrice?: number;
  targetHitTimestampMs?: number;
  invalidationHitPrice?: number;
  invalidationHitTimestampMs?: number;
  maxFavorableExcursionPts: number;
  maxAdverseExcursionPts: number;
  baselineFrictionAssumptionPts: number;
  notes: string;
}

export class MarketAnalystJournal {
  private dbName = 'TradeSeaMarketAnalystDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {}

  /**
   * Initializes IndexedDB database and stores.
   * Works in browser and test environments (e.g. fake-indexeddb).
   */
  public async init(indexedDBObj?: IDBFactory): Promise<void> {
    const idbFactory = indexedDBObj || (typeof indexedDB !== 'undefined' ? indexedDB : undefined);
    if (!idbFactory) {
      throw new Error('[MarketAnalystJournal] IndexedDB environment not available.');
    }

    return new Promise((resolve, reject) => {
      const request = idbFactory.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        reject(new Error(`[MarketAnalystJournal] Open failed: ${(event.target as any)?.error?.message}`));
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('forecasts')) {
          const forecastStore = db.createObjectStore('forecasts', { keyPath: 'analysisId' });
          forecastStore.createIndex('instrument_tf', ['instrument', 'timeframe'], { unique: false });
          forecastStore.createIndex('evaluationTimestampMs', 'evaluationTimestampMs', { unique: false });
          forecastStore.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains('outcomes')) {
          const outcomeStore = db.createObjectStore('outcomes', { keyPath: 'outcomeId' });
          outcomeStore.createIndex('analysisId', 'analysisId', { unique: false });
          outcomeStore.createIndex('outcomeStatus', 'outcomeStatus', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };
    });
  }

  /**
   * Saves an immutable forecast record.
   * Enforces that an existing analysisId CANNOT be overwritten (Fail-Closed Immutability).
   */
  public async recordForecast(
    analysis: MarketAnalysis,
    inputCandleCount: number,
    startTs?: number,
    endTs?: number
  ): Promise<ForecastRecord> {
    if (!this.db) await this.init();

    const existing = await this.getForecast(analysis.analysisId);
    if (existing) {
      throw new Error(
        `[MarketAnalystJournal] VIOLATION: Cannot overwrite existing forecast '${analysis.analysisId}'. Forecasts are immutable.`
      );
    }

    const record: ForecastRecord = {
      ...analysis,
      inputCandleCount,
      inputCandleStartTimestampMs: startTs,
      inputCandleEndTimestampMs: endTs,
      originalRecordFrozen: true,
    };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('forecasts', 'readwrite');
      const store = tx.objectStore('forecasts');
      const req = store.add(record); // 'add' throws if key already exists

      req.onsuccess = () => resolve(record);
      req.onerror = () => reject(new Error(`[MarketAnalystJournal] Failed to record forecast: ${req.error?.message}`));
    });
  }

  public async getForecast(analysisId: string): Promise<ForecastRecord | null> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('forecasts', 'readonly');
      const store = tx.objectStore('forecasts');
      const req = store.get(analysisId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  public async getAllForecasts(): Promise<ForecastRecord[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('forecasts', 'readonly');
      const store = tx.objectStore('forecasts');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Appends an outcome evaluation record for an existing forecast.
   * Does NOT alter the original forecast record.
   */
  public async recordOutcome(outcome: ForecastOutcomeRecord): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('outcomes', 'readwrite');
      const store = tx.objectStore('outcomes');
      const req = store.put(outcome);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(new Error(`[MarketAnalystJournal] Failed to record outcome: ${req.error?.message}`));
    });
  }

  public async getOutcomesForForecast(analysisId: string): Promise<ForecastOutcomeRecord[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('outcomes', 'readonly');
      const store = tx.objectStore('outcomes');
      const index = store.index('analysisId');
      const req = index.getAll(analysisId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  public async clear(): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['forecasts', 'outcomes'], 'readwrite');
      tx.objectStore('forecasts').clear();
      tx.objectStore('outcomes').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
