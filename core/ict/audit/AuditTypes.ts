/**
 * ICT Audit System - Typed Definitions & Case Models
 * Used for real market auditing, reproducibility verification, and descriptive metrics.
 */

import { Candle, Timeframe } from '../../market/Candle';
import { SetupStatus } from '../setups/SetupTypes';

export type AuditClassification = 'CLEAR' | 'BORDERLINE' | 'QUESTIONABLE';

export type AuditCaseType = 'CASE_A_COHERENT' | 'CASE_B_CONFIRMED_QUESTIONABLE' | 'CASE_C_UNCONFIRMED_INTERESTING';

export interface DisplacementAuditRecord {
  auditCaseId: string;
  id: string;
  symbol: string;
  timeframe: Timeframe;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  bodyRatio: number;
  range: number;
  averagePreviousRange: number;
  rangeMultiplier: number;
  direction: 'BULLISH' | 'BEARISH';
  detectionType: 'MATHEMATICAL_TRUTH';
  evaluationType: 'POST_EVENT_EVALUATION';
  classification: AuditClassification;
  hasStructuralBreak: boolean;
  hasFvgCreated: boolean;
  notes: string;
}

export interface SweepAuditRecord {
  auditCaseId: string;
  id: string;
  symbol: string;
  timeframe: Timeframe;
  timestamp: number;
  liquidityType: 'BSL' | 'SSL';
  levelPrice: number;
  extremePrice: number;
  closePrice: number;
  penetration: number;
  isBreakout: boolean;
  classification: AuditClassification;
  notes: string;
}

export interface FVGAuditRecord {
  auditCaseId: string;
  id: string;
  symbol: string;
  timeframe: Timeframe;
  createdTimestamp: number;
  direction: 'BULLISH' | 'BEARISH';
  highPrice: number;
  lowPrice: number;
  gapSize: number;
  status: 'ACTIVE' | 'PARTIALLY_MITIGATED' | 'FULLY_MITIGATED' | 'INVALIDATED';
  classification: AuditClassification;
  notes: string;
}

export interface StructureAuditRecord {
  auditCaseId: string;
  id: string;
  symbol: string;
  timeframe: Timeframe;
  timestamp: number;
  type: 'BOS' | 'MSS';
  direction: 'BULLISH' | 'BEARISH';
  brokenSwingPrice: number;
  breakPrice: number;
  breakMode: 'CLOSE' | 'WICK';
  priorTrend: string;
  newTrend: string;
  eventTimestamp: number;
  confirmationTimestamp: number;
  classification: AuditClassification;
  notes: string;
}

export interface SetupAuditRecord {
  auditCaseId: string;
  id: string;
  symbol: string;
  timeframe: Timeframe;
  modelId: string;
  direction: 'LONG' | 'SHORT';
  status: SetupStatus;
  fulfilledConditions: string[];
  missingConditions: string[];
  invalidatingConditions: string[];
  activatedTimestamp: number;
  target: string;
  caseType: AuditCaseType;
  notes: string;
}

export interface AuditReproducibleCase {
  caseId: string;
  title: string;
  symbol: string;
  timeframe: Timeframe;
  candles: Candle[];
  expectedDisplacementsCount: number;
  expectedSweepsCount: number;
  expectedFvgCount: number;
  expectedStructureCount: number;
  expectedSetupsCount: number;
}

export interface AuditMetricsSummary {
  sampleSizeCandles: number;
  symbolsAudited: string[];
  timeframesAudited: Timeframe[];
  displacement: {
    total: number;
    clear: number;
    borderline: number;
    questionable: number;
    apparentFalsePositives: number;
    apparentFalseNegatives: number;
  };
  sweeps: {
    total: number;
    confirmedSweeps: number;
    falseSweepsBreakouts: number;
  };
  fvgs: {
    total: number;
    active: number;
    partiallyMitigated: number;
    fullyMitigated: number;
    invalidated: number;
  };
  structure: {
    totalBOS: number;
    totalMSS: number;
    bullishBOS: number;
    bearishBOS: number;
    bullishMSS: number;
    bearishMSS: number;
  };
  setups: {
    watching: number;
    forming: number;
    confirmed: number;
    invalidated: number;
    expired: number;
    completed: number;
    caseACoherent: number;
    caseBConfirmedQuestionable: number;
    caseCUnconfirmedInteresting: number;
  };
}
