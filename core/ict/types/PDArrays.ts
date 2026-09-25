/**
 * ICT Engine - Premium / Discount & PD Array Models
 */

import { Timeframe } from '../../market/Candle';

export type PriceZone = 'PREMIUM' | 'DISCOUNT' | 'EQUILIBRIUM';

export interface DealingRange {
  symbol: string;
  timeframe: Timeframe;
  rangeHigh: number;
  rangeLow: number;
  equilibrium: number;          // (rangeHigh + rangeLow) / 2
  currentPrice: number;
  currentZone: PriceZone;
  timestamp: number;
}
