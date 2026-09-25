/**
 * ICT Engine - Order Block Data Models
 */

import { Timeframe } from '../../market/Candle';

export type OrderBlockType = 'BULLISH_OB' | 'BEARISH_OB';
export type OrderBlockStatus = 'UNTESTED' | 'TESTED' | 'MITIGATED' | 'INVALIDATED';

export interface OrderBlock {
  id: string;
  symbol: string;
  timeframe: Timeframe;
  type: OrderBlockType;
  highPrice: number;
  lowPrice: number;
  openPrice: number;
  closePrice: number;
  timestamp: number;
  candleIndex: number;
  status: OrderBlockStatus;
  hasFvgConfluence: boolean;
  invalidatedTimestamp?: number;
}
