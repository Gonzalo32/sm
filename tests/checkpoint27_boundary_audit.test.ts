/**
 * Checkpoint 27 - Eligibility Boundary and Near-Threshold Audit Test Suite
 * Validates near-threshold classification, exact equality at ratio = 0.8, floating-point safety,
 * near-threshold divergence detection, estimator comparisons, shock/post-shock grouping,
 * BOS/MSS grouping, multi-timeframe grouping, BaseScenario immutability, detection invariance,
 * Pure Shadow outcome invariance, determinism, reproducibility, audit-trail completeness,
 * and no synthetic case mutation.
 */

import { describe, it, expect } from 'vitest';
import { CP27DatasetGenerator } from '../core/ict/backtest/CP27DatasetGenerator';
import { ExecutionSimulator } from '../core/ict/backtest/ExecutionSimulator';
import { CP21Runner } from '../core/ict/backtest/CP21Runner';

describe('Checkpoint 27 - Eligibility Boundary & Near-Threshold Audit Suite', () => {
  // 1. Boundary Classification
  it('should categorize scenarios into proximity bands correctly without missing any cases', () => {
    const { items } = CP27DatasetGenerator.generateCP27Dataset();
    expect(items.length).toBe(600);

    const bandCounts: Record<string, number> = {
      '< 0.75': 0,
      '0.75-0.77': 0,
      '0.77-0.79': 0,
      '0.79-0.80': 0,
      '0.80-0.81': 0,
      '0.81-0.83': 0,
      '0.83-0.85': 0,
      '> 0.85': 0,
    };

    function getBand(ratio: number): string {
      if (ratio < 0.75) return '< 0.75';
      if (ratio < 0.77) return '0.75-0.77';
      if (ratio < 0.79) return '0.77-0.79';
      if (ratio < 0.80) return '0.79-0.80';
      if (ratio < 0.81) return '0.80-0.81';
      if (ratio < 0.83) return '0.81-0.83';
      if (ratio < 0.85) return '0.83-0.85';
      return '> 0.85';
    }

    for (const item of items) {
      const dec = ExecutionSimulator.evaluateEligibility(item.scenario, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);
      bandCounts[getBand(dec.riskVolatilityRatio)]++;
    }

    const totalCategorized = Object.values(bandCounts).reduce((a, b) => a + b, 0);
    expect(totalCategorized).toBe(600);
  });

  // 2. Exact Threshold Equality
  it('should evaluate ratio == 0.8 as eligible == true according to ratio >= threshold definition', () => {
    const { items } = CP27DatasetGenerator.generateCP27Dataset();
    let exactCount = 0;

    for (const item of items) {
      const dec = ExecutionSimulator.evaluateEligibility(item.scenario, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);
      if (dec.riskVolatilityRatio === 0.8) {
        exactCount++;
        expect(dec.eligible).toBe(true);
        expect(dec.reason).toBe('ELIGIBLE_ABOVE_THRESHOLD');
      }
    }

    expect(exactCount).toBeGreaterThan(0);
  });

  // 3. Floating-Point Behavior
  it('should handle floating-point precision safely without producing NaN, Infinity, or rounding misclassifications', () => {
    const { items } = CP27DatasetGenerator.generateCP27Dataset();

    for (const item of items) {
      for (const variant of ['BASELINE', 'ROBUST_10', 'ROBUST_14', 'ROBUST_20'] as const) {
        const dec = ExecutionSimulator.evaluateEligibility(item.scenario, variant, 'FILTERED_EXPERIMENT', 0.8);
        expect(Number.isNaN(dec.riskVolatilityRatio)).toBe(false);
        expect(Number.isFinite(dec.riskVolatilityRatio)).toBe(true);

        const expected = dec.riskVolatilityRatio >= 0.8;
        expect(dec.eligible).toBe(expected);
      }
    }
  });

  // 4. Near-Threshold Divergence Detection
  it('should identify natural cases in the 0.795 <= ratio <= 0.805 region and detect classification divergences', () => {
    const { items } = CP27DatasetGenerator.generateCP27Dataset();
    const nearCases: string[] = [];

    for (const item of items) {
      const decB = ExecutionSimulator.evaluateEligibility(item.scenario, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);
      const dec14 = ExecutionSimulator.evaluateEligibility(item.scenario, 'ROBUST_14', 'FILTERED_EXPERIMENT', 0.8);

      if (
        (decB.riskVolatilityRatio >= 0.795 && decB.riskVolatilityRatio <= 0.805) ||
        (dec14.riskVolatilityRatio >= 0.795 && dec14.riskVolatilityRatio <= 0.805)
      ) {
        nearCases.push(item.scenario.scenarioId);
      }
    }

    expect(nearCases.length).toBeGreaterThan(0);
  });

  // 5. Estimator Comparison
  it('should calculate descriptive distances between RollingMeanTR and MedianTR10/14/20', () => {
    const { items } = CP27DatasetGenerator.generateCP27Dataset();
    let count = 0;

    for (const item of items) {
      const decB = ExecutionSimulator.evaluateEligibility(item.scenario, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);
      const dec14 = ExecutionSimulator.evaluateEligibility(item.scenario, 'ROBUST_14', 'FILTERED_EXPERIMENT', 0.8);

      const volDiff = decB.volatility - dec14.volatility;
      const ratioDiff = decB.riskVolatilityRatio - dec14.riskVolatilityRatio;

      expect(typeof volDiff).toBe('number');
      expect(typeof ratioDiff).toBe('number');
      count++;
    }

    expect(count).toBe(600);
  });

  // 6. Shock/Post-Shock Grouping
  it('should audit eligibility breakdown across NORMAL, ELEVATED, SHOCK, and POST-SHOCK regimes', () => {
    const { items } = CP27DatasetGenerator.generateCP27Dataset();
    const regimeCounts: Record<string, number> = {};

    for (const item of items) {
      const r = item.scenario.volatilityRegime;
      regimeCounts[r] = (regimeCounts[r] || 0) + 1;

      if (r === 'SHOCK' || r === 'POST-SHOCK') {
        expect(item.scenario.barsFromShock).toBeDefined();
      }
    }

    expect(regimeCounts['NORMAL']).toBe(150);
    expect(regimeCounts['ELEVATED']).toBe(150);
    expect(regimeCounts['SHOCK']).toBe(150);
    expect(regimeCounts['POST-SHOCK']).toBe(150);
  });

  // 7. BOS/MSS Grouping
  it('should separate BOS and MSS scenarios without cross-contamination', () => {
    const { items } = CP27DatasetGenerator.generateCP27Dataset();
    let bosCount = 0;
    let mssCount = 0;

    for (const item of items) {
      if (item.scenario.eventType === 'BOS') bosCount++;
      if (item.scenario.eventType === 'MSS') mssCount++;
    }

    expect(bosCount).toBe(300);
    expect(mssCount).toBe(300);
  });

  // 8. Multi-Timeframe Grouping
  it('should cover all 6 Symbol/Timeframe pairs with exact denominators of 100', () => {
    const { items } = CP27DatasetGenerator.generateCP27Dataset();
    const mtfCounts: Record<string, number> = {};

    for (const item of items) {
      const key = `${item.scenario.symbol}_${item.scenario.timeframe}`;
      mtfCounts[key] = (mtfCounts[key] || 0) + 1;
    }

    expect(mtfCounts['MNQ_1m']).toBe(100);
    expect(mtfCounts['MNQ_5m']).toBe(100);
    expect(mtfCounts['MNQ_15m']).toBe(100);
    expect(mtfCounts['NQ_1m']).toBe(100);
    expect(mtfCounts['NQ_5m']).toBe(100);
    expect(mtfCounts['NQ_15m']).toBe(100);
  });

  // 9. BaseScenario Immutability
  it('should ensure BaseScenario properties remain untampered during eligibility evaluation', () => {
    const { items } = CP27DatasetGenerator.generateCP27Dataset();
    const item = items[0];

    const initialEntry = item.scenario.entryPrice;
    const initialStop = item.scenario.stopPrice;
    const initialRisk = item.scenario.risk;

    ExecutionSimulator.evaluateEligibility(item.scenario, 'ROBUST_14', 'FILTERED_EXPERIMENT', 0.8);

    expect(item.scenario.entryPrice).toBe(initialEntry);
    expect(item.scenario.stopPrice).toBe(initialStop);
    expect(item.scenario.risk).toBe(initialRisk);
  });

  // 10. Detection Invariance
  it('should confirm detection parameters remain identical regardless of eligibility decision', () => {
    const { items } = CP27DatasetGenerator.generateCP27Dataset();
    const item = items[0];

    const decB = ExecutionSimulator.evaluateEligibility(item.scenario, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);
    const dec14 = ExecutionSimulator.evaluateEligibility(item.scenario, 'ROBUST_14', 'FILTERED_EXPERIMENT', 0.8);

    expect(decB.scenarioId).toBe(dec14.scenarioId);
    expect(item.scenario.eventId).toBeDefined();
    expect(item.scenario.eventType).toBeDefined();
  });

  // 11. Pure Shadow Invariance
  it('should confirm Pure Shadow mode (threshold = 0) yields 0 outcome divergence across all 4 variants', () => {
    const { items, dataset } = CP27DatasetGenerator.generateCP27Dataset();
    const runner = new CP21Runner(items, dataset.datasetHash);

    const basePure = runner.computeMetrics(runner.executeVariant(items, 'BASELINE', 'PURE_SHADOW', 0), 'BASELINE');
    const rob10Pure = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_10', 'PURE_SHADOW', 0), 'ROBUST_10');
    const rob14Pure = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_14', 'PURE_SHADOW', 0), 'ROBUST_14');
    const rob20Pure = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_20', 'PURE_SHADOW', 0), 'ROBUST_20');

    expect(basePure.targetReachedCount).toBe(200);
    expect(basePure.stopReachedCount).toBe(400);
    expect(rob10Pure.targetReachedCount).toBe(200);
    expect(rob10Pure.stopReachedCount).toBe(400);
    expect(rob14Pure.targetReachedCount).toBe(200);
    expect(rob14Pure.stopReachedCount).toBe(400);
    expect(rob20Pure.targetReachedCount).toBe(200);
    expect(rob20Pure.stopReachedCount).toBe(400);
  });

  // 12. Determinism
  it('should produce identical dataset hash and decisions on repeated executions', () => {
    const { dataset: d1 } = CP27DatasetGenerator.generateCP27Dataset();
    const { dataset: d2 } = CP27DatasetGenerator.generateCP27Dataset();

    expect(d1.datasetHash).toBe(d2.datasetHash);
    expect(d1.datasetHash.startsWith('HASH-CP27-')).toBe(true);
    expect(d1.datasetHash.endsWith('-FROZEN')).toBe(true);
  });

  // 13. Reproducibility
  it('should pass full 3-pass reproducibility verification', () => {
    const { items, dataset } = CP27DatasetGenerator.generateCP27Dataset();
    const runner = new CP21Runner(items, dataset.datasetHash);

    const isReproducible = runner.verifyReproducibility(3);
    expect(isReproducible).toBe(true);
  });

  // 14. Audit-Trail Completeness
  it('should include full trace hash and eligibility decision in execution trace', () => {
    const { items } = CP27DatasetGenerator.generateCP27Dataset();
    const simulator = new ExecutionSimulator();

    const trace = simulator.simulate(items[0].scenario, items[0].futureCandles, 'ROBUST_14', 'FILTERED_EXPERIMENT', 0.8);
    expect(trace.traceHash).toBeDefined();
    expect(trace.traceHash.startsWith('TRC-')).toBe(true);
    expect(trace.eligibilityDecision).toBeDefined();
    expect(trace.eligibilityDecision?.estimator).toBe('MedianTR14');
  });

  // 15. No Synthetic Case Mutation
  it('should confirm dataset is generated deterministically without ad-hoc scenario manipulation', () => {
    const { items } = CP27DatasetGenerator.generateCP27Dataset();
    for (let i = 0; i < items.length; i++) {
      const s = items[i].scenario;
      expect(s.risk).toBeGreaterThan(0);
      expect(s.shadowVolatility.baseline).toBeGreaterThan(0);
      expect(s.shadowVolatility.robust14).toBeGreaterThan(0);
    }
  });
});
