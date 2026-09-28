/**
 * ExecutionSimulator - Pure Deterministic Retrospective Execution Engine (CP20 / CP21 / CP22 / CP23)
 * Evaluates BacktestScenario against future Candles without lookahead or dynamic optimization.
 * Formally distinguishes PURE_SHADOW observation mode from FILTERED_EXPERIMENT eligibility mode.
 */

import { Candle } from '../../market/Candle';
import {
  BacktestScenario,
  ExecutionTrace,
  VolatilityVariant,
  ProtocolMode,
  EligibilityDecision,
} from './BacktestTypes';

export class ExecutionSimulator {
  /**
   * Computes simple string hash for audit trail and determinism verification.
   */
  public static computeTraceHash(
    scenarioId: string,
    variant: VolatilityVariant,
    protocolMode: ProtocolMode,
    outcome: string,
    exitPrice: number,
    barsInTrade: number,
    riskUnits: number
  ): string {
    const raw = `${scenarioId}:${variant}:${protocolMode}:${outcome}:${exitPrice.toFixed(4)}:${barsInTrade}:${riskUnits.toFixed(4)}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `TRC-${Math.abs(hash).toString(16).padStart(8, '0')}`;
  }

  /**
   * Evaluates eligibility decision independently from scenario definition and execution.
   */
  public static evaluateEligibility(
    scenario: BacktestScenario,
    variant: VolatilityVariant,
    protocolMode: ProtocolMode,
    thresholdRatio: number
  ): EligibilityDecision {
    const { scenarioId, risk, shadowVolatility, isInvalidScenario } = scenario;

    let estimatorName = 'RollingMeanTR';
    let vol = shadowVolatility.baseline;

    if (variant === 'ROBUST_10') {
      estimatorName = 'MedianTR10';
      vol = shadowVolatility.robust10;
    } else if (variant === 'ROBUST_14') {
      estimatorName = 'MedianTR14';
      vol = shadowVolatility.robust14;
    } else if (variant === 'ROBUST_20') {
      estimatorName = 'MedianTR20';
      vol = shadowVolatility.robust20;
    }

    const ratio = vol > 0 ? risk / vol : 0;

    if (isInvalidScenario || risk <= 0) {
      return {
        scenarioId,
        protocolMode,
        variant,
        estimator: estimatorName,
        volatility: vol,
        risk,
        riskVolatilityRatio: ratio,
        threshold: thresholdRatio,
        eligible: false,
        reason: 'INVALID_SCENARIO',
      };
    }

    if (protocolMode === 'PURE_SHADOW' || thresholdRatio <= 0) {
      return {
        scenarioId,
        protocolMode: 'PURE_SHADOW',
        variant,
        estimator: estimatorName,
        volatility: vol,
        risk,
        riskVolatilityRatio: ratio,
        threshold: 0.0,
        eligible: true,
        reason: 'FILTER_DISABLED_PURE_SHADOW',
      };
    }

    // FILTERED_EXPERIMENT
    const isEligible = ratio >= thresholdRatio;
    return {
      scenarioId,
      protocolMode: 'FILTERED_EXPERIMENT',
      variant,
      estimator: estimatorName,
      volatility: vol,
      risk,
      riskVolatilityRatio: ratio,
      threshold: thresholdRatio,
      eligible: isEligible,
      reason: isEligible ? 'ELIGIBLE_ABOVE_THRESHOLD' : 'FILTER_REJECTED_BASELINE',
    };
  }

  /**
   * Simulates trade execution for a single scenario under a specific volatility variant and protocol mode.
   *
   * @param scenario Immutable scenario definition (BaseScenario)
   * @param futureCandles Candles strictly AFTER confirmationTimestamp (up to 20 candles)
   * @param variant Shadow volatility variant being evaluated
   * @param protocolMode PURE_SHADOW (observation only, filter disabled) vs FILTERED_EXPERIMENT (filter enabled)
   * @param qualificationThresholdRatio Threshold ratio when protocolMode is FILTERED_EXPERIMENT (e.g. 0.8)
   */
  public simulate(
    scenario: BacktestScenario,
    futureCandles: Candle[],
    variant: VolatilityVariant,
    protocolMode: ProtocolMode = 'PURE_SHADOW',
    qualificationThresholdRatio: number = 0
  ): ExecutionTrace {
    const { scenarioId, entryPrice, stopPrice, targetPrice, direction, risk, isInvalidScenario } = scenario;

    const threshold = protocolMode === 'PURE_SHADOW' ? 0 : qualificationThresholdRatio;
    const eligibility = ExecutionSimulator.evaluateEligibility(scenario, variant, protocolMode, threshold);

    // 1. Invalid scenario check
    if (isInvalidScenario || risk <= 0 || isNaN(entryPrice) || isNaN(stopPrice) || isNaN(targetPrice)) {
      const hash = ExecutionSimulator.computeTraceHash(scenarioId, variant, protocolMode, 'INVALID_SCENARIO', entryPrice, 0, 0);
      return {
        scenarioId,
        variant,
        protocolMode,
        outcome: 'INVALID_SCENARIO',
        entryPrice,
        exitPrice: entryPrice,
        stopPrice,
        targetPrice,
        barsInTrade: 0,
        timeToOutcome: 0,
        mfe: 0,
        mae: 0,
        outcomeDistance: 0,
        riskUnits: 0,
        ambiguousBarCount: 0,
        gapOccurred: false,
        eligibilityDecision: eligibility,
        traceHash: hash,
      };
    }

    // 2. Eligibility Check
    if (!eligibility.eligible) {
      const hash = ExecutionSimulator.computeTraceHash(scenarioId, variant, protocolMode, 'NO_EXECUTION', entryPrice, 0, 0);
      return {
        scenarioId,
        variant,
        protocolMode,
        outcome: 'NO_EXECUTION',
        entryPrice,
        exitPrice: entryPrice,
        stopPrice,
        targetPrice,
        barsInTrade: 0,
        timeToOutcome: 0,
        mfe: 0,
        mae: 0,
        outcomeDistance: 0,
        riskUnits: 0,
        ambiguousBarCount: 0,
        gapOccurred: false,
        eligibilityDecision: eligibility,
        traceHash: hash,
      };
    }

    // 3. Handle empty future candles case
    if (!futureCandles || futureCandles.length === 0) {
      const hash = ExecutionSimulator.computeTraceHash(scenarioId, variant, protocolMode, 'TIMEOUT', entryPrice, 0, 0);
      return {
        scenarioId,
        variant,
        protocolMode,
        outcome: 'TIMEOUT',
        entryPrice,
        exitPrice: entryPrice,
        stopPrice,
        targetPrice,
        barsInTrade: 0,
        timeToOutcome: 0,
        mfe: 0,
        mae: 0,
        outcomeDistance: 0,
        riskUnits: 0,
        ambiguousBarCount: 0,
        gapOccurred: false,
        eligibilityDecision: eligibility,
        traceHash: hash,
      };
    }

    // 4. Execution Loop
    const maxBars = Math.min(20, futureCandles.length);
    let mfe = 0;
    let mae = 0;

    for (let k = 0; k < maxBars; k++) {
      const candle = futureCandles[k];

      let favorable = 0;
      let adverse = 0;

      if (direction === 'LONG_SCENARIO') {
        favorable = candle.high - entryPrice;
        adverse = entryPrice - candle.low;
      } else {
        favorable = entryPrice - candle.low;
        adverse = candle.high - entryPrice;
      }

      if (favorable > mfe) mfe = favorable;
      if (adverse > mae) mae = adverse;

      let hitTarget = false;
      let hitStop = false;

      if (direction === 'LONG_SCENARIO') {
        hitTarget = candle.high >= targetPrice;
        hitStop = candle.low <= stopPrice;
      } else {
        hitTarget = candle.low <= targetPrice;
        hitStop = candle.high >= stopPrice;
      }

      // Check Intrabar Ambiguity
      if (hitTarget && hitStop) {
        const hash = ExecutionSimulator.computeTraceHash(scenarioId, variant, protocolMode, 'AMBIGUOUS', entryPrice, k + 1, 0);
        return {
          scenarioId,
          variant,
          protocolMode,
          outcome: 'AMBIGUOUS',
          entryPrice,
          exitPrice: entryPrice,
          stopPrice,
          targetPrice,
          barsInTrade: k + 1,
          timeToOutcome: k + 1,
          mfe,
          mae,
          outcomeDistance: 0,
          riskUnits: 0,
          ambiguousBarCount: 1,
          gapOccurred: false,
          eligibilityDecision: eligibility,
          traceHash: hash,
        };
      }

      // Check Gap on first bar (k === 0)
      if (k === 0) {
        let gapTarget = false;
        let gapStop = false;

        if (direction === 'LONG_SCENARIO') {
          gapTarget = candle.open >= targetPrice;
          gapStop = candle.open <= stopPrice;
        } else {
          gapTarget = candle.open <= targetPrice;
          gapStop = candle.open >= stopPrice;
        }

        if (gapTarget) {
          const exitPrice = candle.open;
          const outcomeDistance = direction === 'LONG_SCENARIO' ? exitPrice - entryPrice : entryPrice - exitPrice;
          const riskUnits = outcomeDistance / risk;
          const hash = ExecutionSimulator.computeTraceHash(scenarioId, variant, protocolMode, 'TARGET_REACHED', exitPrice, 1, riskUnits);
          return {
            scenarioId,
            variant,
            protocolMode,
            outcome: 'TARGET_REACHED',
            entryPrice,
            exitPrice,
            stopPrice,
            targetPrice,
            barsInTrade: 1,
            timeToOutcome: 1,
            mfe,
            mae,
            outcomeDistance,
            riskUnits,
            ambiguousBarCount: 0,
            gapOccurred: true,
            eligibilityDecision: eligibility,
            traceHash: hash,
          };
        }

        if (gapStop) {
          const exitPrice = candle.open;
          const outcomeDistance = direction === 'LONG_SCENARIO' ? exitPrice - entryPrice : entryPrice - exitPrice;
          const riskUnits = outcomeDistance / risk;
          const hash = ExecutionSimulator.computeTraceHash(scenarioId, variant, protocolMode, 'STOP_REACHED', exitPrice, 1, riskUnits);
          return {
            scenarioId,
            variant,
            protocolMode,
            outcome: 'STOP_REACHED',
            entryPrice,
            exitPrice,
            stopPrice,
            targetPrice,
            barsInTrade: 1,
            timeToOutcome: 1,
            mfe,
            mae,
            outcomeDistance,
            riskUnits,
            ambiguousBarCount: 0,
            gapOccurred: true,
            eligibilityDecision: eligibility,
            traceHash: hash,
          };
        }
      }

      // Normal Target Hit
      if (hitTarget) {
        const exitPrice = targetPrice;
        const outcomeDistance = direction === 'LONG_SCENARIO' ? exitPrice - entryPrice : entryPrice - exitPrice;
        const riskUnits = 2.0;
        const hash = ExecutionSimulator.computeTraceHash(scenarioId, variant, protocolMode, 'TARGET_REACHED', exitPrice, k + 1, riskUnits);
        return {
          scenarioId,
          variant,
          protocolMode,
          outcome: 'TARGET_REACHED',
          entryPrice,
          exitPrice,
          stopPrice,
          targetPrice,
          barsInTrade: k + 1,
          timeToOutcome: k + 1,
          mfe,
          mae,
          outcomeDistance,
          riskUnits,
          ambiguousBarCount: 0,
          gapOccurred: false,
          eligibilityDecision: eligibility,
          traceHash: hash,
        };
      }

      // Normal Stop Hit
      if (hitStop) {
        const exitPrice = stopPrice;
        const outcomeDistance = direction === 'LONG_SCENARIO' ? exitPrice - entryPrice : entryPrice - exitPrice;
        const riskUnits = -1.0;
        const hash = ExecutionSimulator.computeTraceHash(scenarioId, variant, protocolMode, 'STOP_REACHED', exitPrice, k + 1, riskUnits);
        return {
          scenarioId,
          variant,
          protocolMode,
          outcome: 'STOP_REACHED',
          entryPrice,
          exitPrice,
          stopPrice,
          targetPrice,
          barsInTrade: k + 1,
          timeToOutcome: k + 1,
          mfe,
          mae,
          outcomeDistance,
          riskUnits,
          ambiguousBarCount: 0,
          gapOccurred: false,
          eligibilityDecision: eligibility,
          traceHash: hash,
        };
      }
    }

    // 5. Timeout after 20 bars
    const lastBarIndex = maxBars - 1;
    const finalCandle = futureCandles[lastBarIndex];
    const exitPrice = finalCandle.close;
    const outcomeDistance = direction === 'LONG_SCENARIO' ? exitPrice - entryPrice : entryPrice - exitPrice;
    const riskUnits = risk > 0 ? outcomeDistance / risk : 0;
    const hash = ExecutionSimulator.computeTraceHash(scenarioId, variant, protocolMode, 'TIMEOUT', exitPrice, maxBars, riskUnits);

    return {
      scenarioId,
      variant,
      protocolMode,
      outcome: 'TIMEOUT',
      entryPrice,
      exitPrice,
      stopPrice,
      targetPrice,
      barsInTrade: maxBars,
      timeToOutcome: maxBars,
      mfe,
      mae,
      outcomeDistance,
      riskUnits,
      ambiguousBarCount: 0,
      gapOccurred: false,
      eligibilityDecision: eligibility,
      traceHash: hash,
    };
  }
}
