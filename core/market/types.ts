/**
 * Core Market Data Types - Standard Candle Model
 * Timezone UTC normalized ISO timestamps
 */

export type Timeframe = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d';

export interface Candle {
  timestamp: number; // UTC Epoch timestamp in milliseconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface MarketSymbolInfo {
  symbol: string;
  timeframe: Timeframe;
  exchange?: string;
}

export interface TradeSeaProbeResult {
  symbol: string;
  timeframe: Timeframe;
  candleCount: number;
  lastCandle?: Candle;
  chartFramework: 'TradingView Library' | 'Custom Canvas' | 'DOM/SVG' | 'Unknown';
  wsConnected: boolean;
  timestamp: number;
}
