/**
 * ICT Historical Replay System - Typed Models & Interfaces
 * Browser-independent, pure TypeScript state definition.
 */

import { Candle, Timeframe } from '../../market/Candle';

export interface ReplayState {
  symbol: string;
  timeframe: Timeframe;
  currentIndex: number;
  currentTimestamp: number;
  totalCandles: number;
  isPlaying: boolean;
  speedMs: number;
}

export type ReplayEventListener = (state: ReplayState, currentSlice: Candle[]) => void;
