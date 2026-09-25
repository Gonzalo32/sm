/**
 * ICT Confluence System - Typed Data Models
 * Objective confluences without arbitrary numeric score assignment.
 */

import { Timeframe } from '../../market/Candle';

export type ConfluenceType =
  | 'HTF_TREND_ALIGNMENT'
  | 'LIQUIDITY_SWEEP'
  | 'MSS_CONFIRMED'
  | 'BOS_CONFIRMED'
  | 'DISPLACEMENT'
  | 'FVG_CONFLUENCE'
  | 'ORDER_BLOCK_CONFLUENCE'
  | 'PREMIUM_DISCOUNT_ALIGNMENT'
  | 'LIQUIDITY_TARGET_PRESENT';

export type ConfluenceStatus = 'PRESENT' | 'ABSENT' | 'INVALIDATED' | 'UNKNOWN';

export interface ICTConfluence {
  id: string;
  type: ConfluenceType;
  status: ConfluenceStatus;
  timestamp: number;
  timeframe: Timeframe;
  evidence: string[];
}
