/**
 * Core Market - Live Market Data Adapter & Provenance Engine
 * Connects market sources to in-memory CandleStore and handles historical backfill,
 * realtime streaming, reconnection deduplication, synthetic dataset blocking,
 * and memory window metadata.
 */

import { Candle, Timeframe } from './Candle';
import { CandleStore } from './CandleStore';
import { CandleValidator } from './CandleValidator';

export interface MarketDataSourceContract {
  source: string; // e.g. 'TradeSea_REST', 'Rithmic_WS', 'Synthetic_CP21_Test'
  instrument: 'MNQ' | 'NQ';
  timeframe: '1m' | '5m' | '15m';
  timezone?: string;
  isSynthetic?: boolean;
}

export interface AdapterIngestionResult {
  success: boolean;
  status: string;
  loadedHistoryCount?: number;
  skippedCount?: number;
  prunedCount?: number;
  error?: string;
}

export interface RuntimeProvenanceMetadataPayload {
  source: string;
  instrument: 'MNQ' | 'NQ';
  timeframe: '1m' | '5m' | '15m';
  timezone: string;
  requestedLookbackDays: number;
  actualAvailableLookbackDays: number;
  firstTimestamp: number | null;
  lastTimestamp: number | null;
  candleCount: number;
  connectionStatus: 'DISCONNECTED' | 'CONNECTED' | 'RECONNECTING' | 'ERROR';
  syntheticBlocked: boolean;
}

export class MarketDataAdapter {
  private sourceContract: MarketDataSourceContract;
  private store: CandleStore;
  private connectionStatus: 'DISCONNECTED' | 'CONNECTED' | 'RECONNECTING' | 'ERROR' = 'DISCONNECTED';
  private requireRealRuntime: boolean;
  private syntheticBlocked: boolean = false;
  private rejectedCandlesCount: number = 0;
  private gapEventsCount: number = 0;

  constructor(
    contract: MarketDataSourceContract,
    store?: CandleStore,
    requireRealRuntime: boolean = false
  ) {
    this.sourceContract = { ...contract };
    this.requireRealRuntime = requireRealRuntime;
    this.store = store || new CandleStore(contract.instrument, contract.timeframe, 60);

    // Validate synthetic blocking upon initialization
    if (this.requireRealRuntime && this.isSyntheticSource(this.sourceContract)) {
      this.syntheticBlocked = true;
      this.connectionStatus = 'ERROR';
    }
  }

  private isSyntheticSource(contract: MarketDataSourceContract): boolean {
    if (contract.isSynthetic === true) return true;
    const s = contract.source.toLowerCase();
    return s.includes('synthetic') || s.includes('cp21') || s.includes('mock') || s.includes('fixture');
  }

  public setConnectionStatus(status: 'DISCONNECTED' | 'CONNECTED' | 'RECONNECTING' | 'ERROR'): void {
    this.connectionStatus = status;
  }

  public getConnectionStatus(): string {
    return this.connectionStatus;
  }

  /**
   * Bulk loads historical window into CandleStore.
   * Blocks synthetic datasets if requireRealRuntime = true.
   */
  public loadHistoricalWindow(rawHistory: Candle[]): AdapterIngestionResult {
    if (this.requireRealRuntime && this.isSyntheticSource(this.sourceContract)) {
      this.syntheticBlocked = true;
      this.connectionStatus = 'ERROR';
      return {
        success: false,
        status: 'REJECTED_FOR_REAL_RUNTIME',
        error: 'Synthetic dataset source is blocked for real runtime data adapter.',
      };
    }

    if (!Array.isArray(rawHistory) || rawHistory.length === 0) {
      this.setConnectionStatus('DISCONNECTED');
      return {
        success: false,
        status: 'REAL_DATA_UNAVAILABLE',
        error: 'No historical candles available from source.',
      };
    }

    // Check for gaps before loading
    const expectedIntervalMs = this.getExpectedIntervalMs(this.sourceContract.timeframe);
    const seriesVal = CandleValidator.validateSeries(rawHistory, expectedIntervalMs);
    if (seriesVal.gaps.length > 0) {
      this.gapEventsCount += seriesVal.gaps.length;
    }

    const { loaded, skipped, pruned } = this.store.loadHistory(rawHistory);
    this.setConnectionStatus('CONNECTED');

    return {
      success: true,
      status: 'LOADED',
      loadedHistoryCount: loaded,
      skippedCount: skipped,
      prunedCount: pruned,
    };
  }

  /**
   * Streams a single candle (forming update or new close) from realtime stream.
   */
  public ingestRealtimeCandle(candle: Candle): AdapterIngestionResult {
    if (this.requireRealRuntime && this.isSyntheticSource(this.sourceContract)) {
      this.syntheticBlocked = true;
      return {
        success: false,
        status: 'REJECTED_FOR_REAL_RUNTIME',
        error: 'Synthetic candle blocked for real runtime execution.',
      };
    }

    const res = this.store.ingestCandle(candle);
    if (!res.success) {
      this.rejectedCandlesCount++;
      return {
        success: false,
        status: 'DATA_REJECTED',
        error: res.error,
      };
    }

    this.setConnectionStatus('CONNECTED');
    return {
      success: true,
      status: res.eventType || 'INGESTED',
    };
  }

  /**
   * Handles reconnection gap fill after a WebSocket disconnect.
   * Deduplicates missing segment against existing store timestamps.
   */
  public handleReconnection(missingCandles: Candle[]): AdapterIngestionResult {
    this.setConnectionStatus('RECONNECTING');

    if (this.requireRealRuntime && this.isSyntheticSource(this.sourceContract)) {
      this.syntheticBlocked = true;
      this.setConnectionStatus('ERROR');
      return {
        success: false,
        status: 'REJECTED_FOR_REAL_RUNTIME',
        error: 'Synthetic dataset blocked during reconnection.',
      };
    }

    const latest = this.store.getLatestCandle();
    const lastTs = latest ? latest.timestamp : 0;

    // Filter missing candles to only those strictly newer than lastTs, or update active bar
    const validMissing = missingCandles.filter((c) => c.timestamp >= lastTs);
    let loadedCount = 0;
    let skippedCount = 0;

    for (const c of validMissing) {
      const res = this.store.ingestCandle(c);
      if (res.success) {
        loadedCount++;
      } else {
        skippedCount++;
      }
    }

    this.setConnectionStatus('CONNECTED');
    return {
      success: true,
      status: 'RECONNECTED',
      loadedHistoryCount: loadedCount,
      skippedCount,
    };
  }

  public getExpectedIntervalMs(timeframe: Timeframe): number {
    switch (timeframe) {
      case '1m':
        return 60000;
      case '5m':
        return 300000;
      case '15m':
        return 900000;
      default:
        return 60000;
    }
  }

  public getProvenanceMetadata(): RuntimeProvenanceMetadataPayload {
    const memStatus = this.store.getMemoryWindowStatus();
    return {
      source: this.sourceContract.source,
      instrument: this.sourceContract.instrument,
      timeframe: this.sourceContract.timeframe,
      timezone: this.sourceContract.timezone || 'UTC',
      requestedLookbackDays: memStatus.requestedLookbackDays,
      actualAvailableLookbackDays: memStatus.actualAvailableLookbackDays,
      firstTimestamp: memStatus.firstTimestamp,
      lastTimestamp: memStatus.lastTimestamp,
      candleCount: memStatus.candleCount,
      connectionStatus: this.connectionStatus,
      syntheticBlocked: this.syntheticBlocked,
    };
  }

  public getStore(): CandleStore {
    return this.store;
  }

  public getRejectedCandlesCount(): number {
    return this.rejectedCandlesCount;
  }

  public getGapEventsCount(): number {
    return this.gapEventsCount;
  }
}
