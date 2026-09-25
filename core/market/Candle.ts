/**
 * Core Market - Candle Data Models & Interfaces
 * Completely decoupled from DOM, Window, Chrome, and TradingView APIs.
 */

export type Timeframe = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | string;

export interface Candle {
  timestamp: number; // UTC epoch timestamp in milliseconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface SymbolTimeframeContext {
  symbol: string;
  timeframe: Timeframe;
}

export type CandleEventType = 'ICT_CANDLE_UPDATE' | 'ICT_CANDLE_CLOSE' | 'ICT_NEW_CANDLE';

export interface CandleEvent {
  type: CandleEventType;
  candle: Candle;
  previousCandle?: Candle;
  symbol: string;
  timeframe: Timeframe;
  timestamp: number;
}

export interface HistoricalFetchReport {
  symbol: string;
  timeframe: Timeframe;
  requestedCount: number;
  receivedCount: number;
  startTimeISO: string;
  endTimeISO: string;
  downloadTimeMs: number;
  gapsDetected: number;
  errors: string[];
}
