/**
 * ICT Displacement System - Data Models & Configuration
 */

import { Timeframe } from '../../market/Candle';

export type DisplacementDirection = 'BULLISH' | 'BEARISH';

export interface DisplacementConfig {
  minBodyToRangeRatio: number;      // Body must be >= 60% of total candle range (default 0.60)
  minRangeMultiplier: number;        // Candle range must be >= 1.5x average of preceding N candles (default 1.5)
  lookbackCandles: number;           // Preceding candles window to compute average range (default 5)
  requireStructuralBreak: boolean;   // Must coincide with BOS or MSS (default false)
  requireFvgCreation: boolean;       // Must create a Fair Value Gap (default false)
}

export interface Displacement {
  id: string;
  symbol: string;
  timeframe: Timeframe;
  direction: DisplacementDirection;
  candleIndex: number;
  timestamp: number;
  openPrice: number;
  closePrice: number;
  highPrice: number;
  lowPrice: number;
  bodyRatio: number;
  rangeMultiplier: number;
}
