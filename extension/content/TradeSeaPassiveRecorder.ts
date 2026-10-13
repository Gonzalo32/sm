/**
 * TradeSea Passive Recorder Engine
 * Orchestrates live candle stream ingestion, session tracking, IndexedDB persistence,
 * and zero-order-exposure audit export.
 */

import { PassiveRecorderStorage, StoredCandle, CaptureSession, ExportManifest } from './PassiveRecorderStorage';
import { Candle } from '../../core/market/Candle';

export class TradeSeaPassiveRecorder {
  private storage: PassiveRecorderStorage;
  private symbol: string = 'MNQ';
  private timeframe: string = '1m';
  private isRecording: boolean = false;

  constructor(storage?: PassiveRecorderStorage) {
    this.storage = storage || new PassiveRecorderStorage();
  }

  public async init(indexedDBObj?: IDBFactory): Promise<void> {
    await this.storage.init(indexedDBObj);
  }

  public async startRecording(symbol: string = 'MNQ', timeframe: string = '1m'): Promise<CaptureSession> {
    this.symbol = symbol;
    this.timeframe = timeframe;
    this.isRecording = true;
    return await this.storage.startSession(symbol, timeframe);
  }

  public async stopRecording(): Promise<void> {
    this.isRecording = false;
    const session = this.storage.getActiveSession();
    if (session) {
      session.status = 'COMPLETED';
      session.endIso = new Date().toISOString();
      await this.storage.saveSession(session);
    }
  }

  public isRecordingActive(): boolean {
    return this.isRecording;
  }

  public getContext(): { symbol: string; timeframe: string } {
    return { symbol: this.symbol, timeframe: this.timeframe };
  }

  /**
   * Ingests realtime candle event from pageBridge message stream.
   * Only persists CLOSED candles (`ICT_CANDLE_CLOSE`) or initial historical window.
   */
  public async handleCandleEvent(event: {
    type: 'ICT_NEW_CANDLE' | 'ICT_CANDLE_UPDATE' | 'ICT_CANDLE_CLOSE';
    candle: Candle;
    symbol: string;
    timeframe: string;
  }): Promise<{ stored: boolean; reason?: string }> {
    if (!this.isRecording) {
      return { stored: false, reason: 'Recorder is paused' };
    }

    if (event.symbol !== this.symbol || event.timeframe !== this.timeframe) {
      return { stored: false, reason: 'Symbol or timeframe mismatch' };
    }

    // Only persist CLOSED candles into prospective dataset (or forming tick if explicit)
    const isClosed = event.type === 'ICT_CANDLE_CLOSE';
    if (!isClosed) {
      // Do not store transient forming ticks in closed prospective ledger
      return { stored: false, reason: 'Forming candle update skipped for prospective closed ledger' };
    }

    return await this.storage.saveCandle({
      symbol: event.symbol,
      timeframe: event.timeframe,
      timestamp: event.candle.timestamp,
      open: event.candle.open,
      high: event.candle.high,
      low: event.candle.low,
      close: event.candle.close,
      volume: event.candle.volume,
      source: 'TradeSea_WSS_Realtime',
      isClosed: true,
    });
  }

  public async exportManifest(): Promise<ExportManifest> {
    return await this.storage.exportData(this.symbol, this.timeframe);
  }

  public async getStoredCandles(closedOnly: boolean = true): Promise<StoredCandle[]> {
    return await this.storage.queryCandles(this.symbol, this.timeframe, closedOnly);
  }

  public async getSessions(): Promise<CaptureSession[]> {
    return await this.storage.querySessions();
  }

  public async clearStorage(): Promise<void> {
    await this.storage.clear();
  }
}
