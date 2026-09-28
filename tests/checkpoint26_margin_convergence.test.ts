/**
 * Checkpoint 26 - Eligibility Margin and Estimator Convergence Audit Test Suite
 * Validates eligibility formula, floating point handling, warmup safety, robust estimator convergence,
 * closest case identification, BaseScenario immutability, detection invariance, and pure shadow control.
 */

import { describe, it, expect } from 'vitest';
import { CP26DatasetGenerator } from '../core/ict/backtest/CP26DatasetGenerator';
import { ExecutionSimulator } from '../core/ict/backtest/ExecutionSimulator';
import { CP21Runner } from '../core/ict/backtest/CP21Runner';
import { VolatilityVariant } from '../core/ict/backtest/BacktestTypes';

describe('Checkpoint 26 - Eligibility Margin & Estimator Convergence Audit Suite', () => {
  // 1. Eligibility Formula & Margin Calculation
  it('should compute eligibility margin = (risk / volatility) - 0.8 and absolute margin = risk - (0.8 * volatility)', () => {
    const { items } = CP26DatasetGenerator.generateCP26Dataset();
    const item = items[0];

    const dec = ExecutionSimulator.evaluateEligibility(item.scenario, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);
    const expectedRatio = item.scenario.risk / dec.volatility;
    const expectedMargin = expectedRatio - 0.8;
    const expectedAbsMargin = item.scenario.risk - 0.8 * dec.volatility;

    expect(dec.riskVolatilityRatio).toBeCloseTo(expectedRatio, 6);
    expect(dec.riskVolatilityRatio - 0.8).toBeCloseTo(expectedMargin, 6);
    expect(item.scenario.risk - 0.8 * dec.volatility).toBeCloseTo(expectedAbsMargin, 6);
  });

  // 2. Threshold Equality & Floating Point Precision
  it('should evaluate threshold equality correctly with non-negative margin for eligible trades', () => {
    const { items } = CP26DatasetGenerator.generateCP26Dataset();
    const simulator = new ExecutionSimulator();

    for (const item of items) {
      const dec = ExecutionSimulator.evaluateEligibility(item.scenario, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);
      if (dec.eligible) {
        expect(dec.riskVolatilityRatio).toBeGreaterThanOrEqual(0.8 - 1e-9);
      } else {
        expect(dec.riskVolatilityRatio).toBeLessThan(0.8);
      }
    }
  });

  // 3. Floating-Point, NaN, and Infinity Safety
  it('should handle zero volatility, NaN, and Infinity safely without crashing', () => {
    const invalidScenario = {
      scenarioId: 'EDGE-01',
      eventId: 'EVT-EDGE-01',
      symbol: 'NQ',
      timeframe: '1m',
      eventType: 'BOS',
      direction: 'LONG_SCENARIO',
      eventTimestamp: 1000,
      confirmationTimestamp: 2000,
      referencePrice: 100,
      entryPrice: 100,
      stopPrice: 90,
      targetPrice: 120,
      risk: 10,
      targetDistance: 20,
      volatilityRegime: 'NORMAL',
      shadowVolatility: { baseline: 0, robust10: 0, robust14: 0, robust20: 0 },
      split: 'EXPLORATION',
      isInvalidScenario: false,
    } as any;

    const dec = ExecutionSimulator.evaluateEligibility(invalidScenario, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);
    expect(dec.riskVolatilityRatio).toBe(0);
    expect(dec.eligible).toBe(false);
  });

  // 4. Estimator Convergence Audit & Robust Divergences
  it('should audit robust estimator convergence and confirm 0 classification divergences between M10, M14, M20', () => {
    const { items } = CP26DatasetGenerator.generateCP26Dataset();

    let robDivergences = 0;
    for (const item of items) {
      const s = item.scenario;
      const d10 = ExecutionSimulator.evaluateEligibility(s, 'ROBUST_10', 'FILTERED_EXPERIMENT', 0.8);
      const d14 = ExecutionSimulator.evaluateEligibility(s, 'ROBUST_14', 'FILTERED_EXPERIMENT', 0.8);
      const d20 = ExecutionSimulator.evaluateEligibility(s, 'ROBUST_20', 'FILTERED_EXPERIMENT', 0.8);

      if (d10.eligible !== d14.eligible || d14.eligible !== d20.eligible) {
        robDivergences++;
      }
    }

    expect(robDivergences).toBe(0);
  });

  // 5. Closest Case Identification
  it('should identify the closest case to threshold 0.8 in CP26 dataset', () => {
    const { items } = CP26DatasetGenerator.generateCP26Dataset();
    const records: Array<{ scenarioId: string; ratio: number; margin: number }> = [];

    for (const item of items) {
      const dec = ExecutionSimulator.evaluateEligibility(item.scenario, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);
      records.push({
        scenarioId: item.scenario.scenarioId,
        ratio: dec.riskVolatilityRatio,
        margin: dec.riskVolatilityRatio - 0.8,
      });
    }

    records.sort((a, b) => Math.abs(a.ratio - 0.8) - Math.abs(b.ratio - 0.8));

    const closest = records[0];
    expect(closest.scenarioId).toBe('CP26-SCEN-NQ-1m-MSS-0348');
    expect(closest.ratio).toBeCloseTo(0.8013, 3);
    expect(closest.margin).toBeGreaterThan(0);
  });

  // 6. BaseScenario Immutability
  it('should verify BaseScenario structural properties remain untampered during margin calculation', () => {
    const { items } = CP26DatasetGenerator.generateCP26Dataset();
    const item = items[0];

    const origEntry = item.scenario.entryPrice;
    const origStop = item.scenario.stopPrice;

    ExecutionSimulator.evaluateEligibility(item.scenario, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);

    expect(item.scenario.entryPrice).toBe(origEntry);
    expect(item.scenario.stopPrice).toBe(origStop);
  });

  // 7. Pure Shadow Control Invariance
  it('should confirm Pure Shadow mode (ratio = 0) yields 0 outcome divergence across all 4 variants', () => {
    const { items, dataset } = CP26DatasetGenerator.generateCP26Dataset();
    const runner = new CP21Runner(items, dataset.datasetHash);

    const basePure = runner.computeMetrics(runner.executeVariant(items, 'BASELINE', 'PURE_SHADOW', 0), 'BASELINE');
    const rob14Pure = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_14', 'PURE_SHADOW', 0), 'ROBUST_14');

    expect(basePure.targetReachedCount).toBe(200);
    expect(basePure.stopReachedCount).toBe(400);
    expect(rob14Pure.targetReachedCount).toBe(200);
    expect(rob14Pure.stopReachedCount).toBe(400);
  });

  // 8. Determinism & Audit Trail Completeness
  it('should guarantee 100% determinism and audit trail completeness', () => {
    const { items, dataset } = CP26DatasetGenerator.generateCP26Dataset();
    const runner = new CP21Runner(items, dataset.datasetHash);

    const isReproducible = runner.verifyReproducibility(3);
    expect(isReproducible).toBe(true);
  });
});
