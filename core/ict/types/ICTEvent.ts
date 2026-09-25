/**
 * ICT Engine - Discriminated Union Event Types
 * Strict typing with explicit eventTimestamp vs confirmationTimestamp for causality.
 */

import { Timeframe } from '../../market/Candle';
import { SwingPoint } from './SwingPoint';
import { LiquidityLevel, LiquiditySweep } from './Liquidity';
import { FairValueGap } from './FVG';
import { OrderBlock } from './OrderBlock';
import { Displacement } from '../displacement/DisplacementTypes';

export type ICTEventType =
  | 'SWING_HIGH'
  | 'SWING_LOW'
  | 'BOS'
  | 'MSS'
  | 'BSL'
  | 'SSL'
  | 'LIQUIDITY_SWEEP'
  | 'FVG_CREATED'
  | 'FVG_FILLED'
  | 'ORDER_BLOCK_CREATED'
  | 'ORDER_BLOCK_INVALIDATED'
  | 'DISPLACEMENT';

export type StructureBreakType = 'BOS' | 'MSS';
export type StructureDirection = 'BULLISH' | 'BEARISH';

export interface BaseICTEvent {
  type: ICTEventType;
  symbol: string;
  timeframe: Timeframe;
  timestamp: number;             // Legacy alias for eventTimestamp
  eventTimestamp: number;        // Timestamp when the underlying structural peak/pattern occurred
  confirmationTimestamp: number; // Timestamp when the engine confirmed the event without lookahead
  candleIndex: number;
}

export interface SwingHighEvent extends BaseICTEvent {
  type: 'SWING_HIGH';
  swing: SwingPoint;
}

export interface SwingLowEvent extends BaseICTEvent {
  type: 'SWING_LOW';
  swing: SwingPoint;
}

export interface BOSEvent extends BaseICTEvent {
  type: 'BOS';
  direction: StructureDirection;
  brokenSwing: SwingPoint;
  breakPrice: number;
}

export interface MSSEvent extends BaseICTEvent {
  type: 'MSS';
  direction: StructureDirection;
  brokenSwing: SwingPoint;
  breakPrice: number;
  priorTrend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
}

export interface BSLEvent extends BaseICTEvent {
  type: 'BSL';
  level: LiquidityLevel;
}

export interface SSLEvent extends BaseICTEvent {
  type: 'SSL';
  level: LiquidityLevel;
}

export interface LiquiditySweepEvent extends BaseICTEvent {
  type: 'LIQUIDITY_SWEEP';
  sweep: LiquiditySweep;
}

export interface FVGCreatedEvent extends BaseICTEvent {
  type: 'FVG_CREATED';
  fvg: FairValueGap;
}

export interface FVGFilledEvent extends BaseICTEvent {
  type: 'FVG_FILLED';
  fvg: FairValueGap;
}

export interface OrderBlockCreatedEvent extends BaseICTEvent {
  type: 'ORDER_BLOCK_CREATED';
  orderBlock: OrderBlock;
}

export interface OrderBlockInvalidatedEvent extends BaseICTEvent {
  type: 'ORDER_BLOCK_INVALIDATED';
  orderBlock: OrderBlock;
}

export interface DisplacementEvent extends BaseICTEvent {
  type: 'DISPLACEMENT';
  displacement: Displacement;
}

export type ICTEvent =
  | SwingHighEvent
  | SwingLowEvent
  | BOSEvent
  | MSSEvent
  | BSLEvent
  | SSLEvent
  | LiquiditySweepEvent
  | FVGCreatedEvent
  | FVGFilledEvent
  | OrderBlockCreatedEvent
  | OrderBlockInvalidatedEvent
  | DisplacementEvent;
