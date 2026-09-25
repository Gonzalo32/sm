/**
 * ICT Engine - Liquidity & Sweep Models
 */

import { Timeframe } from '../../market/Candle';
import { SwingPoint } from './SwingPoint';

export type LiquidityType = 'BSL' | 'SSL';
export type LiquidityCategory = 'SWING_HIGH' | 'SWING_LOW' | 'EQUAL_HIGHS' | 'EQUAL_LOWS' | 'SESSION_HIGH' | 'SESSION_LOW';

export interface LiquidityLevel {
  id: string;
  symbol: string;
  timeframe: Timeframe;
  price: number;
  type: LiquidityType;
  category: LiquidityCategory;
  swings: SwingPoint[];
  swept: boolean;
  sweptTimestamp?: number;
  sweptByCandleIndex?: number;
}

export interface LiquiditySweep {
  id: string;
  symbol: string;
  timeframe: Timeframe;
  liquidityLevelId: string;
  liquidityType: LiquidityType;
  levelPrice: number;
  extremePrice: number;        // Highest high or lowest low of the sweep candle
  sweepTimestamp: number;
  candleIndex: number;
  confirmed: boolean;          // True when price closes back inside or produces displacement
}
