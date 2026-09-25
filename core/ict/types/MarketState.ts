/**
 * ICT Engine - Unified Market State Snapshot Model
 */

import { Timeframe } from '../../market/Candle';
import { SwingPoint } from './SwingPoint';
import { LiquidityLevel } from './Liquidity';
import { FairValueGap } from './FVG';
import { OrderBlock } from './OrderBlock';
import { DealingRange } from './PDArrays';

export type TrendDirection = 'BULLISH' | 'BEARISH' | 'SIDEWAYS';

export interface ICTMarketState {
  symbol: string;
  timeframe: Timeframe;
  lastUpdatedTimestamp: number;
  lastCandleIndex: number;
  trend: TrendDirection;
  swings: SwingPoint[];
  activeSwingHigh?: SwingPoint;
  activeSwingLow?: SwingPoint;
  liquidityLevels: LiquidityLevel[];
  fairValueGaps: FairValueGap[];
  orderBlocks: OrderBlock[];
  dealingRange?: DealingRange;
}
