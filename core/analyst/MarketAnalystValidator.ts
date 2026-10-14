/**
 * Core Analyst - Market Analyst Historical Causal Validator
 * Strictly time-ordered evaluation harness for analyzing forecast performance against subsequent candles.
 * Prevents lookahead bias, measures nearby vs extended target hits, computes MFE/MAE,
 * accounts for benchmark friction assumptions, and flags same-bar target/invalidation hits as AMBIGUOUS_EVALUATION.
 */

import { Candle } from '../market/Candle';
import { MarketAnalysis, MarketScenario } from './MarketAnalystTypes';
import { ForecastOutcomeRecord, ForecastOutcomeStatus } from '../../extension/analyst/MarketAnalystJournal';

export interface EvaluationOptions {
  maxEvaluationCandles?: number; // e.g. 60 bars (1 hour on 1m)
  baselineFrictionAssumptionPts?: number; // default 1.00 pt
}

export class MarketAnalystValidator {
  /**
   * Evaluates a point-in-time MarketAnalysis against subsequent chronologically ordered candles.
   *
   * @param analysis The original point-in-time analysis
   * @param subsequentCandles Candles occurring strictly AFTER the analysis evaluation timestamp
   * @param options Evaluation parameters
   * @returns ForecastOutcomeRecord
   */
  public evaluateOutcome(
    analysis: MarketAnalysis,
    subsequentCandles: Candle[],
    options: EvaluationOptions = {}
  ): ForecastOutcomeRecord {
    const maxCandles = options.maxEvaluationCandles ?? 60;
    const frictionPts = options.baselineFrictionAssumptionPts ?? 1.0;
    const outcomeId = `OUT_${analysis.analysisId}_${Date.now()}`;

    // If analysis was not ready or has no selected scenario, record as EXPIRED / UNRESOLVED
    if (analysis.status !== 'ANALYSIS_READY' || !analysis.selectedScenario) {
      return {
        outcomeId,
        analysisId: analysis.analysisId,
        evaluatedAtIso: new Date().toISOString(),
        evaluatedCandleCount: 0,
        outcomeStatus: 'EXPIRED',
        maxFavorableExcursionPts: 0,
        maxAdverseExcursionPts: 0,
        baselineFrictionAssumptionPts: frictionPts,
        notes: `Analysis had status '${analysis.status}' with no actionable scenario to evaluate.`,
      };
    }

    const scenario: MarketScenario = analysis.selectedScenario;
    const isBull = scenario.direction === 'BULLISH';
    const refPrice = scenario.referencePrice;
    const nearbyTarget = scenario.nearbyTarget?.price;
    const extendedTarget = scenario.extendedTarget?.price;
    const invalidation = scenario.invalidationLevel;

    // Filter to candles strictly following the analysis timestamp
    const futureCandles = subsequentCandles
      .filter((c) => c.timestamp > (analysis.latestCandleTimestampMs || analysis.evaluationTimestampMs))
      .slice(0, maxCandles);

    if (futureCandles.length === 0) {
      return {
        outcomeId,
        analysisId: analysis.analysisId,
        evaluatedAtIso: new Date().toISOString(),
        evaluatedCandleCount: 0,
        outcomeStatus: 'UNRESOLVED',
        maxFavorableExcursionPts: 0,
        maxAdverseExcursionPts: 0,
        baselineFrictionAssumptionPts: frictionPts,
        notes: 'Zero subsequent candles available for evaluation.',
      };
    }

    let maxFavorableExcursionPts = 0;
    let maxAdverseExcursionPts = 0;
    let outcomeStatus: ForecastOutcomeStatus = 'UNRESOLVED';
    let targetHitPrice: number | undefined = undefined;
    let targetHitTimestampMs: number | undefined = undefined;
    let invalidationHitPrice: number | undefined = undefined;
    let invalidationHitTimestampMs: number | undefined = undefined;
    let notes = '';

    for (let i = 0; i < futureCandles.length; i++) {
      const candle = futureCandles[i];

      // Track Excursions
      if (isBull) {
        const favorable = Math.max(0, candle.high - refPrice);
        const adverse = Math.max(0, refPrice - candle.low);
        if (favorable > maxFavorableExcursionPts) maxFavorableExcursionPts = favorable;
        if (adverse > maxAdverseExcursionPts) maxAdverseExcursionPts = adverse;
      } else {
        const favorable = Math.max(0, refPrice - candle.low);
        const adverse = Math.max(0, candle.high - refPrice);
        if (favorable > maxFavorableExcursionPts) maxFavorableExcursionPts = favorable;
        if (adverse > maxAdverseExcursionPts) maxAdverseExcursionPts = adverse;
      }

      // Check Hits on this bar
      const hitNearby = nearbyTarget !== undefined ? (isBull ? candle.high >= nearbyTarget : candle.low <= nearbyTarget) : false;
      const hitExtended = extendedTarget !== undefined ? (isBull ? candle.high >= extendedTarget : candle.low <= extendedTarget) : false;
      const hitInvalidation = invalidation !== undefined ? (isBull ? candle.low <= invalidation : candle.high >= invalidation) : false;

      // Ambiguous Evaluation: Both target and invalidation touched on the EXACT SAME CANDLE
      if (hitNearby && hitInvalidation) {
        outcomeStatus = 'AMBIGUOUS_EVALUATION';
        targetHitPrice = nearbyTarget;
        targetHitTimestampMs = candle.timestamp;
        invalidationHitPrice = invalidation;
        invalidationHitTimestampMs = candle.timestamp;
        notes = `Bar ${i + 1} touched both nearby target ($${nearbyTarget}) and invalidation ($${invalidation}). Intrabar sequence is indeterminate; evaluated fail-closed as AMBIGUOUS.`;
        break;
      }

      // Invalidation Hit
      if (hitInvalidation) {
        outcomeStatus = 'INVALIDATION_HIT';
        invalidationHitPrice = invalidation;
        invalidationHitTimestampMs = candle.timestamp;
        notes = `Invalidation level reached at bar ${i + 1} ($${invalidation}).`;
        break;
      }

      // Extended Target Hit
      if (hitExtended) {
        outcomeStatus = 'EXTENDED_TARGET_HIT';
        targetHitPrice = extendedTarget;
        targetHitTimestampMs = candle.timestamp;
        notes = `Extended target objective reached at bar ${i + 1} ($${extendedTarget}).`;
        break;
      }

      // Nearby Target Hit
      if (hitNearby) {
        outcomeStatus = 'TARGET_HIT';
        targetHitPrice = nearbyTarget;
        targetHitTimestampMs = candle.timestamp;
        notes = `Nearby target objective reached at bar ${i + 1} ($${nearbyTarget}).`;
        break;
      }
    }

    if (outcomeStatus === 'UNRESOLVED' && futureCandles.length >= maxCandles) {
      outcomeStatus = 'EXPIRED';
      notes = `Evaluation horizon expired after ${futureCandles.length} candles without reaching target or invalidation.`;
    }

    return {
      outcomeId,
      analysisId: analysis.analysisId,
      evaluatedAtIso: new Date().toISOString(),
      evaluatedCandleCount: futureCandles.length,
      outcomeStatus,
      targetHitPrice,
      targetHitTimestampMs,
      invalidationHitPrice,
      invalidationHitTimestampMs,
      maxFavorableExcursionPts: Number(maxFavorableExcursionPts.toFixed(2)),
      maxAdverseExcursionPts: Number(maxAdverseExcursionPts.toFixed(2)),
      baselineFrictionAssumptionPts: frictionPts,
      notes,
    };
  }
}
