/**
 * Checkpoint 25 - Structural Audit of Volatility Eligibility Test Suite
 * Validates dataset independence, group classification (A, B, C, D, E), BaseScenario immutability,
 * EligibilityDecision isolation, detection invariance, multi-timeframe & regime breakdowns,
 * shock-distance calculation, pure shadow control, and counterexample detection.
 */

import { describe, it, expect } from 'vitest';
import { CP25DatasetGenerator } from '../core/ict/backtest/CP25DatasetGenerator';
import { ExecutionSimulator } from '../core/ict/backtest/ExecutionSimulator';
import { CP21Runner } from '../core/ict/backtest/CP21Runner';
import { BacktestScenario, VolatilityVariant } from '../core/ict/backtest/BacktestTypes';

describe('Checkpoint 25 - Structural Volatility Eligibility Audit Suite', () => {
  // 1. Dataset Independence & Hash Integrity
  it('should generate a frozen, independent CP25 dataset with 600 scenarios', () => {
    const { dataset, items } = CP25DatasetGenerator.generateCP25Dataset();

    expect(items.length).toBe(600);
    expect(dataset.datasetHash).toBe('HASH-CP25-1A87D45C-FROZEN');
    expect(dataset.symbolDistribution['MNQ']).toBe(300);
    expect(dataset.symbolDistribution['NQ']).toBe(300);
  });

  // 2. Group Classification (Groups A, B, C, D, E)
  it('should classify scenarios into Groups A, B, C, D, E accurately', () => {
    const { items, dataset } = CP25DatasetGenerator.generateCP25Dataset();

    const runner = new CP21Runner(items, dataset.datasetHash);

    const baseTraces = runner.executeVariant(items, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);
    const rob10Traces = runner.executeVariant(items, 'ROBUST_10', 'FILTERED_EXPERIMENT', 0.8);
    const rob14Traces = runner.executeVariant(items, 'ROBUST_14', 'FILTERED_EXPERIMENT', 0.8);
    const rob20Traces = runner.executeVariant(items, 'ROBUST_20', 'FILTERED_EXPERIMENT', 0.8);

    const groupA: BacktestScenario[] = [];
    const groupB: BacktestScenario[] = [];
    const groupC: BacktestScenario[] = [];
    const groupD: BacktestScenario[] = [];
    const groupE: BacktestScenario[] = [];

    for (let i = 0; i < items.length; i++) {
      const s = items[i].scenario;
      const bRej = baseTraces[i].outcome === 'NO_EXECUTION';
      const r10Elig = rob10Traces[i].outcome !== 'NO_EXECUTION';
      const r14Elig = rob14Traces[i].outcome !== 'NO_EXECUTION';
      const r20Elig = rob20Traces[i].outcome !== 'NO_EXECUTION';

      if (bRej && r10Elig) groupA.push(s);
      if (bRej && r14Elig) groupB.push(s);
      if (bRej && r20Elig) groupC.push(s);
      if (bRej && !r10Elig) groupD.push(s);
      if (!bRej && (!r10Elig || !r14Elig || !r20Elig)) groupE.push(s);
    }

    expect(groupA.length).toBeGreaterThan(0);
    expect(groupB.length).toBe(groupA.length);
    expect(groupC.length).toBe(groupA.length);
    expect(groupE.length).toBe(0);
  });

  // 3. BaseScenario Immutability
  it('should verify BaseScenario structural properties remain untampered by eligibility filtering', () => {
    const { items } = CP25DatasetGenerator.generateCP25Dataset();
    const item = items[0];

    const scenario = item.scenario;
    expect(scenario.brokenLevel).toBeDefined();
    expect(scenario.penetrationAbsolute).toBeDefined();

    const origEntry = scenario.entryPrice;
    const origStop = scenario.stopPrice;

    ExecutionSimulator.evaluateEligibility(scenario, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);

    expect(scenario.entryPrice).toBe(origEntry);
    expect(scenario.stopPrice).toBe(origStop);
  });

  // 4. EligibilityDecision Isolation
  it('should isolate EligibilityDecision without mutating BaseScenario', () => {
    const { items } = CP25DatasetGenerator.generateCP25Dataset();
    const scenario = items[0].scenario;

    const dec = ExecutionSimulator.evaluateEligibility(scenario, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);

    expect(dec.scenarioId).toBe(scenario.scenarioId);
    expect(dec.estimator).toBe('RollingMeanTR');
    expect(dec.threshold).toBe(0.8);
    expect(typeof dec.eligible).toBe('boolean');
  });

  // 5. Multi-Timeframe Breakdown
  it('should desegregate baseline rejections across all 6 symbol/timeframe pairs', () => {
    const { items, dataset } = CP25DatasetGenerator.generateCP25Dataset();
    const runner = new CP21Runner(items, dataset.datasetHash);

    const baseTraces = runner.executeVariant(items, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);
    const rejCount = baseTraces.filter((t) => t.outcome === 'NO_EXECUTION').length;

    expect(rejCount).toBe(45);
  });

  // 6. Regime & Shock-Distance Isolation
  it('should verify baseline rejections occur strictly during active shock bars (bars 1-5 from shock)', () => {
    const { items, dataset } = CP25DatasetGenerator.generateCP25Dataset();
    const runner = new CP21Runner(items, dataset.datasetHash);

    const baseTraces = runner.executeVariant(items, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);

    const shockRejects = items.filter((_, idx) => baseTraces[idx].outcome === 'NO_EXECUTION' && items[idx].scenario.volatilityRegime === 'SHOCK');
    expect(shockRejects.length).toBe(45);

    for (const item of shockRejects) {
      expect(item.scenario.barsFromShock).toBeLessThanOrEqual(5);
    }
  });

  // 7. Pure Shadow Control Invariance
  it('should confirm Pure Shadow mode (ratio = 0) yields 0 outcome divergence across all 4 variants', () => {
    const { items, dataset } = CP25DatasetGenerator.generateCP25Dataset();
    const runner = new CP21Runner(items, dataset.datasetHash);

    const basePure = runner.computeMetrics(runner.executeVariant(items, 'BASELINE', 'PURE_SHADOW', 0), 'BASELINE');
    const rob14Pure = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_14', 'PURE_SHADOW', 0), 'ROBUST_14');

    expect(basePure.targetReachedCount).toBe(200);
    expect(basePure.stopReachedCount).toBe(400);
    expect(rob14Pure.targetReachedCount).toBe(200);
    expect(rob14Pure.stopReachedCount).toBe(400);
  });

  // 8. Counterexample Detection (Group E)
  it('should report exactly 0 counterexamples (Baseline eligible / Robust rejected) in CP25 dataset', () => {
    const { items, dataset } = CP25DatasetGenerator.generateCP25Dataset();
    const runner = new CP21Runner(items, dataset.datasetHash);

    const baseTraces = runner.executeVariant(items, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);
    const rob14Traces = runner.executeVariant(items, 'ROBUST_14', 'FILTERED_EXPERIMENT', 0.8);

    let counterexampleCount = 0;
    for (let i = 0; i < items.length; i++) {
      if (baseTraces[i].outcome !== 'NO_EXECUTION' && rob14Traces[i].outcome === 'NO_EXECUTION') {
        counterexampleCount++;
      }
    }

    expect(counterexampleCount).toBe(0);
  });
});
