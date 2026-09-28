/**
 * ICT Retrospective Backtest Infrastructure - Core Types (CP20 / CP21 / CP22 / CP23)
 * Immutable, deterministic definitions for pre-registered retrospective outcome evaluation
 * with strict separation between Pure Shadow Observation and Experimental Volatility Filter.
 */

import { Timeframe } from '../../market/Candle';

export type ScenarioDirection = 'LONG_SCENARIO' | 'SHORT_SCENARIO';
export type ScenarioType = 'BOS' | 'MSS';
export type VolatilityVariant = 'BASELINE' | 'ROBUST_10' | 'ROBUST_14' | 'ROBUST_20';
export type VolatilityRegime = 'NORMAL' | 'ELEVATED' | 'SHOCK' | 'POST-SHOCK';
export type DatasetSplit = 'EXPLORATION' | 'SELECTION' | 'HOLDOUT';

/**
 * Protocol Mode distinguishing pure shadow observation from experimental eligibility filtering.
 * Prevents ambiguous boolean flags.
 */
export type ProtocolMode = 'PURE_SHADOW' | 'FILTERED_EXPERIMENT';

export type OutcomeType =
  | 'TARGET_REACHED'
  | 'STOP_REACHED'
  | 'TIMEOUT'
  | 'AMBIGUOUS'
  | 'NO_EXECUTION'
  | 'INVALID_SCENARIO';

export interface ShadowVolatilityValues {
  baseline: number; // RollingMeanTR(14)
  robust10: number; // MedianTR(10)
  robust14: number; // MedianTR(14)
  robust20: number; // MedianTR(20)
}

/**
 * BaseScenario: Structural event parameters completely independent of volatility metrics or eligibility filters.
 */
export interface BaseScenario {
  scenarioId: string;
  eventId: string;
  symbol: string;               // 'MNQ' | 'NQ'
  timeframe: Timeframe;          // '1m' | '5m' | '15m'
  eventType: ScenarioType;      // 'BOS' | 'MSS'
  direction: ScenarioDirection;  // 'LONG_SCENARIO' | 'SHORT_SCENARIO'
  eventTimestamp: number;
  confirmationTimestamp: number;
  referencePrice: number;
  entryPrice: number;            // referencePrice + 0 (ENTRY OFFSET = 0)
  stopPrice: number;             // brokenLevel
  targetPrice: number;           // entryPrice +/- 2 * risk
  risk: number;                  // abs(entryPrice - stopPrice)
  targetDistance: number;        // 2 * risk
  volatilityRegime: VolatilityRegime;
  shadowVolatility: ShadowVolatilityValues;
  split: DatasetSplit;
  isInvalidScenario: boolean;
  brokenLevel?: number;
  penetrationAbsolute?: number;
  priorStructureState?: string;
  barsFromShock?: number;
}


/**
 * BacktestScenario: Alias for BaseScenario for backward compatibility.
 */
export type BacktestScenario = BaseScenario;

/**
 * EligibilityDecision: Separate decision object evaluating scenario qualification.
 * Keeps BaseScenario immutable.
 */
export interface EligibilityDecision {
  scenarioId: string;
  protocolMode: ProtocolMode;
  variant: VolatilityVariant;
  estimator: string;             // 'RollingMeanTR' | 'MedianTR10' | 'MedianTR14' | 'MedianTR20'
  volatility: number;
  risk: number;
  riskVolatilityRatio: number;
  threshold: number;            // 0.0 for PURE_SHADOW, 0.8 for FILTERED_EXPERIMENT
  eligible: boolean;
  reason: 'FILTER_DISABLED_PURE_SHADOW' | 'ELIGIBLE_ABOVE_THRESHOLD' | 'FILTER_REJECTED_BASELINE' | 'INVALID_SCENARIO';
}

export interface ExecutionTrace {
  scenarioId: string;
  variant: VolatilityVariant;
  protocolMode: ProtocolMode;
  outcome: OutcomeType;
  entryPrice: number;
  exitPrice: number;
  stopPrice: number;
  targetPrice: number;
  barsInTrade: number;
  timeToOutcome: number;        // bar count or milliseconds
  mfe: number;                  // Maximum Favorable Excursion in points
  mae: number;                  // Maximum Adverse Excursion in points
  outcomeDistance: number;      // signed price movement from entry to exit
  riskUnits: number;            // +2.0 for TARGET, -1.0 for STOP, realized R for TIMEOUT, 0 for INVALID/NO_EXECUTION/AMBIGUOUS
  ambiguousBarCount: number;
  gapOccurred: boolean;
  eligibilityDecision?: EligibilityDecision;
  traceHash: string;
}

export interface ScenarioDataset {
  datasetId: string;
  datasetHash: string;
  createdAt: number;
  symbolDistribution: Record<string, number>;
  timeframeDistribution: Record<string, number>;
  eventDistribution: Record<string, number>;
  regimeDistribution: Record<string, number>;
  splitDistribution: Record<DatasetSplit, number>;
  scenarios: BacktestScenario[];
}

export interface VariantOutcomeMetrics {
  variant: VolatilityVariant;
  protocolMode: ProtocolMode;
  totalScenarios: number;
  targetReachedCount: number;
  targetReachedPercentage: number;
  stopReachedCount: number;
  stopReachedPercentage: number;
  timeoutCount: number;
  timeoutPercentage: number;
  ambiguousCount: number;
  ambiguousPercentage: number;
  noExecutionCount: number;
  noExecutionPercentage: number;
  invalidCount: number;
  invalidPercentage: number;
  medianTimeToOutcome: number;
  medianMfe: number;
  medianMae: number;
  netRiskUnits: number;
}

export interface CP21BacktestReportData {
  datasetHash: string;
  explorationMetrics: Record<VolatilityVariant, VariantOutcomeMetrics>;
  selectionMetrics: Record<VolatilityVariant, VariantOutcomeMetrics>;
  holdoutMetrics: Record<VolatilityVariant, VariantOutcomeMetrics>;
  regimeStratifiedMetrics: Record<VolatilityRegime, Record<VolatilityVariant, VariantOutcomeMetrics>>;
  symbolStratifiedMetrics: Record<string, Record<VolatilityVariant, VariantOutcomeMetrics>>;
  timeframeStratifiedMetrics: Record<string, Record<VolatilityVariant, VariantOutcomeMetrics>>;
  eventStratifiedMetrics: Record<string, Record<VolatilityVariant, VariantOutcomeMetrics>>;
  observedDifferences: string[];
  reproducibleDifferences: string[];
  materialDifferences: string[];
  holdoutContradictions: boolean;
}
