/**
 * ICT Model Validation Lab - Typed Definitions & Case Schemas
 * Pure TypeScript, browser-independent definitions for empirical model validation.
 */

import { Timeframe } from '../../market/Candle';

export type ValidationEventType =
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
  | 'DISPLACEMENT'
  | 'SETUP'
  | 'NONE';

export type ValidationStatus = 'UNREVIEWED' | 'CLEAR' | 'BORDERLINE' | 'QUESTIONABLE';

export type DetectionReviewType = 'NONE' | 'DETECTION_REVIEW' | 'CONCEPT_REVIEW';

export interface DisplacementSnapshot {
  currentRange: number;
  currentBody: number;
  bodyRatio: number;
  averagePreviousRange: number;
  rangeMultiplier: number;
  N: number;
  previousRanges: number[];
}

export interface SweepSnapshot {
  liquidityType: 'BSL' | 'SSL';
  levelPrice: number;
  extremePrice: number;
  closePrice: number;
  penetration: number;
  closeBackInside: boolean;
  minimumPenetration: number;
}

export interface FVGSnapshot {
  candle1High: number;
  candle1Low: number;
  candle2High: number;
  candle2Low: number;
  candle3High: number;
  candle3Low: number;
  gapSize: number;
  direction: 'BULLISH' | 'BEARISH';
}

export interface StructureSnapshot {
  previousTrend: string;
  newTrend: string;
  brokenLevel: number;
  breakMode: 'CLOSE' | 'WICK';
  breakPrice: number;
  eventTimestamp: number;
  confirmationTimestamp: number;
  penetration?: number;
}

export interface ValidationCase {
  caseId: string;
  symbol: string;
  timeframe: Timeframe;
  eventType: ValidationEventType;
  eventTimestamp: number;
  confirmationTimestamp?: number;
  eventIndex: number;
  detectionSnapshot: DisplacementSnapshot | SweepSnapshot | FVGSnapshot | StructureSnapshot | unknown;
  validationStatus: ValidationStatus;
  detectionReviewType?: DetectionReviewType;
  validationReason?: string;
  notes?: string;
  reviewTimestamp?: number;
  reviewer?: string;
  isNegativeCase: boolean;
  expectedEvent?: ValidationEventType;
  isBorderlineBreak?: boolean;
  isBorderlineDisplacement?: boolean;
}

export interface ValidationSummaryMetrics {
  totalCases: number;
  positiveCasesCount: number;
  negativeCasesCount: number;
  unreviewedCount: number;
  clearCount: number;
  borderlineCount: number;
  questionableCount: number;
  agreementsCount: number;
  disagreementsCount: number;
  detectionReviewCount: number;
  conceptReviewCount: number;
  noneReviewCount: number;
  borderlineMSSBOSCount: number;
  borderlineDisplacementCount: number;
  byEvent: Record<string, { positive: number; negative: number; unreviewed: number; clear: number; borderline: number; questionable: number; detectionReview: number; conceptReview: number }>;
  stratifiedMatrix?: Record<string, { available: number; selected: number; reviewed: number; insufficient: boolean }>;
}
