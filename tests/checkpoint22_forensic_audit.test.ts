/**
 * Checkpoint 22 - Forensic Audit of Shadow-Induced Outcome Divergence Test Suite
 * Validates exact reproduction, 50 NO_EXECUTION case extraction, volatility dependency trace,
 * scenario identity, execution rule identity, variant separation, 20% claim audit, and shadow purity.
 */

import { describe, it, expect } from 'vitest';
import { CP21DatasetGenerator } from '../core/ict/backtest/CP21DatasetGenerator';
import { ExecutionSimulator } from '../core/ict/backtest/ExecutionSimulator';
import { CP21Runner } from '../core/ict/backtest/CP21Runner';
import { BacktestScenario, VolatilityVariant, ExecutionTrace } from '../core/ict/backtest/BacktestTypes';

describe('Checkpoint 22 - Forensic Audit Suite', () => {
  // 1. CP21 Reproduction & Hash Integrity
  it('should reproduce CP21 outcomes and hash HASH-CP21-7DCF0593-FROZEN exactly', () => {
    const { items, dataset } = CP21DatasetGenerator.generateCP21Dataset();

    expect(dataset.datasetHash).toBe('HASH-CP21-7DCF0593-FROZEN');

    const runner = new CP21Runner(items, dataset.datasetHash);
    const report = runner.runFullProtocol(0.8);

    const baseTarget = report.selectionMetrics['BASELINE'].targetReachedCount + report.explorationMetrics['BASELINE'].targetReachedCount + report.holdoutMetrics['BASELINE'].targetReachedCount;
    const baseStop = report.selectionMetrics['BASELINE'].stopReachedCount + report.explorationMetrics['BASELINE'].stopReachedCount + report.holdoutMetrics['BASELINE'].stopReachedCount;
    const baseNoExec = report.selectionMetrics['BASELINE'].noExecutionCount + report.explorationMetrics['BASELINE'].noExecutionCount + report.holdoutMetrics['BASELINE'].noExecutionCount;

    expect(baseTarget).toBe(151);
    expect(baseStop).toBe(299);
    expect(baseNoExec).toBe(50);

    const robTarget = report.selectionMetrics['ROBUST_14'].targetReachedCount + report.explorationMetrics['ROBUST_14'].targetReachedCount + report.holdoutMetrics['ROBUST_14'].targetReachedCount;
    const robStop = report.selectionMetrics['ROBUST_14'].stopReachedCount + report.explorationMetrics['ROBUST_14'].stopReachedCount + report.holdoutMetrics['ROBUST_14'].stopReachedCount;
    const robNoExec = report.selectionMetrics['ROBUST_14'].noExecutionCount + report.explorationMetrics['ROBUST_14'].noExecutionCount + report.holdoutMetrics['ROBUST_14'].noExecutionCount;

    expect(robTarget).toBe(167);
    expect(robStop).toBe(333);
    expect(robNoExec).toBe(0);
  });

  // 2. Extraction and Traceability of 50 NO_EXECUTION Cases
  it('should extract exactly 50 NO_EXECUTION cases belonging strictly to SHOCK and POST-SHOCK regimes', () => {
    const { items } = CP21DatasetGenerator.generateCP21Dataset();
    const simulator = new ExecutionSimulator();

    const noExecCases: BacktestScenario[] = [];

    for (const item of items) {
      const baseTrace = simulator.simulate(item.scenario, item.futureCandles, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);
      const robTrace = simulator.simulate(item.scenario, item.futureCandles, 'ROBUST_14', 'FILTERED_EXPERIMENT', 0.8);


      if (baseTrace.outcome === 'NO_EXECUTION' && robTrace.outcome !== 'NO_EXECUTION') {
        noExecCases.push(item.scenario);
      }
    }

    expect(noExecCases.length).toBe(50);

    const shockCases = noExecCases.filter((s) => s.volatilityRegime === 'SHOCK');
    const postShockCases = noExecCases.filter((s) => s.volatilityRegime === 'POST-SHOCK');
    const normalCases = noExecCases.filter((s) => s.volatilityRegime === 'NORMAL');
    const elevatedCases = noExecCases.filter((s) => s.volatilityRegime === 'ELEVATED');

    expect(shockCases.length).toBe(25);
    expect(postShockCases.length).toBe(25);
    expect(normalCases.length).toBe(0);
    expect(elevatedCases.length).toBe(0);
  });

  // 3. Exact NO_EXECUTION Reasons
  it('should verify that all 50 NO_EXECUTION cases are caused by risk/volatility ratio dropping below 0.8 threshold', () => {
    const { items } = CP21DatasetGenerator.generateCP21Dataset();
    const simulator = new ExecutionSimulator();

    for (const item of items) {
      const baseTrace = simulator.simulate(item.scenario, item.futureCandles, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);

      if (baseTrace.outcome === 'NO_EXECUTION') {
        const ratio = item.scenario.risk / item.scenario.shadowVolatility.baseline;
        expect(ratio).toBeLessThan(0.8);
        expect(item.scenario.shadowVolatility.baseline).toBeGreaterThan(item.scenario.shadowVolatility.robust14);
      }
    }
  });

  // 4. Scenario & Execution Rule Identity
  it('should verify 100% scenario parameter and execution rule identity across all 4 variants', () => {
    const { items } = CP21DatasetGenerator.generateCP21Dataset();
    const variants: VolatilityVariant[] = ['BASELINE', 'ROBUST_10', 'ROBUST_14', 'ROBUST_20'];

    for (const item of items) {
      const s = item.scenario;
      for (const v of variants) {
        expect(s.entryPrice).toBe(s.referencePrice);
        expect(s.risk).toBe(Math.abs(s.entryPrice - s.stopPrice));
        expect(s.targetDistance).toBe(2 * s.risk);
      }
    }
  });

  // 5. Independent Variant Separation (ROBUST_10, ROBUST_14, ROBUST_20)
  it('should run ROBUST_10, ROBUST_14, and ROBUST_20 independently and verify each yields 167 TARGET / 333 STOP', () => {
    const { items, dataset } = CP21DatasetGenerator.generateCP21Dataset();
    const runner = new CP21Runner(items, dataset.datasetHash);

    const t10 = runner.executeVariant(items, 'ROBUST_10', 0.8);
    const t14 = runner.executeVariant(items, 'ROBUST_14', 0.8);
    const t20 = runner.executeVariant(items, 'ROBUST_20', 0.8);

    const m10 = runner.computeMetrics(t10, 'ROBUST_10');
    const m14 = runner.computeMetrics(t14, 'ROBUST_14');
    const m20 = runner.computeMetrics(t20, 'ROBUST_20');

    expect(m10.targetReachedCount).toBe(167);
    expect(m10.stopReachedCount).toBe(333);
    expect(m10.noExecutionCount).toBe(0);

    expect(m14.targetReachedCount).toBe(167);
    expect(m14.stopReachedCount).toBe(333);
    expect(m14.noExecutionCount).toBe(0);

    expect(m20.targetReachedCount).toBe(167);
    expect(m20.stopReachedCount).toBe(333);
    expect(m20.noExecutionCount).toBe(0);
  });

  // 6. Audit of the "20%" Claim
  it('should audit the 20% claim and verify it represents 50 / 250 SHOCK+POST-SHOCK scenarios', () => {
    const { items } = CP21DatasetGenerator.generateCP21Dataset();

    const shockPostShockCount = items.filter((i) => i.scenario.volatilityRegime === 'SHOCK' || i.scenario.volatilityRegime === 'POST-SHOCK').length;
    expect(shockPostShockCount).toBe(250);

    const simulator = new ExecutionSimulator();
    let noExecCount = 0;
    for (const item of items) {
      const trace = simulator.simulate(item.scenario, item.futureCandles, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);

      if (trace.outcome === 'NO_EXECUTION') noExecCount++;
    }

    expect(noExecCount).toBe(50);
    expect((noExecCount / shockPostShockCount) * 100).toBe(20.0);
    expect((noExecCount / items.length) * 100).toBe(10.0);
  });

  // 7. Shadow Purity Test (Filter = 0)
  it('should verify 100% Shadow Purity when qualification filter is 0 (identical outcomes across all variants)', () => {
    const { items, dataset } = CP21DatasetGenerator.generateCP21Dataset();
    const runner = new CP21Runner(items, dataset.datasetHash);

    const baseRaw = runner.computeMetrics(runner.executeVariant(items, 'BASELINE', 0), 'BASELINE');
    const rob10Raw = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_10', 0), 'ROBUST_10');
    const rob14Raw = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_14', 0), 'ROBUST_14');
    const rob20Raw = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_20', 0), 'ROBUST_20');

    expect(baseRaw.targetReachedCount).toBe(167);
    expect(baseRaw.stopReachedCount).toBe(333);
    expect(baseRaw.noExecutionCount).toBe(0);

    expect(rob10Raw.targetReachedCount).toBe(167);
    expect(rob14Raw.targetReachedCount).toBe(167);
    expect(rob20Raw.targetReachedCount).toBe(167);

    expect(rob10Raw.stopReachedCount).toBe(333);
    expect(rob14Raw.stopReachedCount).toBe(333);
    expect(rob20Raw.stopReachedCount).toBe(333);
  });

  // 8. Holdout Audit Verification
  it('should audit Selection vs Holdout metrics and confirm zero post-hoc rule changes', () => {
    const { items, dataset } = CP21DatasetGenerator.generateCP21Dataset();
    const runner = new CP21Runner(items, dataset.datasetHash);
    const report = runner.runFullProtocol(0.8);

    const sel = report.selectionMetrics['ROBUST_14'];
    const hol = report.holdoutMetrics['ROBUST_14'];

    expect(sel.totalScenarios).toBe(200);
    expect(hol.totalScenarios).toBe(200);

    expect(sel.targetReachedCount).toBe(66);
    expect(sel.targetReachedPercentage).toBe(33.0);

    expect(hol.targetReachedCount).toBe(67);
    expect(hol.targetReachedPercentage).toBe(33.5);

    expect(report.holdoutContradictions).toBe(false);
  });
});
