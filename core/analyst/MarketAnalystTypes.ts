/**
 * Core Analyst - Market Analyst Domain Types
 * Strict, typed representation for user-triggered point-in-time market analysis.
 * Pure analytical models decoupled from trading execution and DOM controls.
 */

import { Timeframe } from '../market/Candle';

export type MarketAnalysisStatus =
  | 'ANALYSIS_READY'
  | 'NO_CLEAR_OPPORTUNITY'
  | 'INSUFFICIENT_DATA'
  | 'STALE_MARKET_DATA'
  | 'CONFLICTING_EVIDENCE'
  | 'ANALYSIS_ERROR';

export type MarketDirection =
  | 'BULLISH'
  | 'BEARISH'
  | 'INDETERMINATE';

export type ConfidenceLabel =
  | 'LOW'
  | 'MODERATE'
  | 'HIGH'
  | 'NOT_CALIBRATED';

export type TargetStructuralSource =
  | 'LIQUIDITY_POOL'
  | 'FAIR_VALUE_GAP'
  | 'SWING_EXTREME'
  | 'ORDER_BLOCK'
  | 'HTF_LEVEL';

export interface PriceTarget {
  price: number;
  zoneLow?: number;
  zoneHigh?: number;
  rationale: string;
  structuralSource: TargetStructuralSource;
}

export interface MarketScenario {
  direction: 'BULLISH' | 'BEARISH';
  referencePrice: number;
  nearbyTarget?: PriceTarget;
  extendedTarget?: PriceTarget;
  invalidationLevel?: number;
  invalidationRationale?: string;
  supportingEvidence: string[];
  conflictingEvidence: string[];
  conditionsRequired: string[];
  estimatedGrossMove?: number;
  estimatedNetMove?: number;
  frictionAssumptionNote?: string;
  riskDistance?: number;
  estimatedRewardRiskRatio?: number;
  confidenceLabel: ConfidenceLabel;
  targetAccessibilityNotes: string[];
}

export interface MarketAnalysis {
  analysisId: string;
  instrument: string;
  timeframe: Timeframe;
  evaluatedAt: string; // ISO 8601
  evaluationTimestampMs: number;
  latestMarketDataTimestamp?: string;
  latestCandleTimestampMs?: number;
  status: MarketAnalysisStatus;
  preferredDirection: MarketDirection;
  statusExplanation: string;
  bullishScenario?: MarketScenario;
  bearishScenario?: MarketScenario;
  selectedScenario?: MarketScenario;
  dataQualityNotes: string[];
  uncertaintyNotes: string[];
  modelVersions: Record<string, string>;
}

export interface MarketDataIntegrityCheck {
  valid: boolean;
  candleCount: number;
  stale: boolean;
  ageMs: number;
  gapsDetected: number;
  duplicatesDetected: number;
  outOfOrderDetected: number;
  errors: string[];
  warnings: string[];
}

export interface MarketRiskFilterConfig {
  maxStaleDataMs: number; // e.g. 5 minutes for 1m timeframe (300,000ms)
  minLookbackCandles: number; // Minimum historical candles required for meaningful structure (e.g. 30)
  minRewardRiskRatio: number; // Minimum structural reward to risk ratio (e.g. 1.2)
  baselineFrictionAssumptionPts: number; // Benchmark friction assumption in index points (e.g. 1.00 pt)
  maxStructuralRiskDistancePts: number; // Maximum allowable risk distance before flagging excessive risk (e.g. 80 pts)
}

export const DEFAULT_RISK_FILTER_CONFIG: MarketRiskFilterConfig = {
  maxStaleDataMs: 300000, // 5 minutes
  minLookbackCandles: 30,
  minRewardRiskRatio: 1.2,
  baselineFrictionAssumptionPts: 1.0,
  maxStructuralRiskDistancePts: 80.0,
};
