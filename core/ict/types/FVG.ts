/**
 * ICT Engine - Fair Value Gap (FVG) Data Models
 */

import { Timeframe } from '../../market/Candle';

export type FVGDirection = 'BULLISH' | 'BEARISH';
export type FVGStatus = 'ACTIVE' | 'PARTIALLY_MITIGATED' | 'FULLY_MITIGATED' | 'INVALIDATED';

export interface FairValueGap {
  id: string;
  symbol: string;
  timeframe: Timeframe;
  direction: FVGDirection;
  highPrice: number;            // Upper boundary of FVG zone
  lowPrice: number;             // Lower boundary of FVG zone
  gapSize: number;              // highPrice - lowPrice
  candle1Timestamp: number;
  candle2Timestamp: number;
  candle3Timestamp: number;
  createdCandleIndex: number;
  status: FVGStatus;
  fillPercentage: number;       // 0 to 100%
  mitigatedTimestamp?: number;
}
