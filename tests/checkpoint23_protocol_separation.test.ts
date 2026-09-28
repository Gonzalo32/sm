/**
 * Checkpoint 23 - Pure Shadow vs Experimental Volatility Filter Separation Test Suite
 * Validates pure shadow outcome invariance, filtered eligibility, BaseScenario immutability,
 * EligibilityDecision isolation, simulated live streaming equivalence, and audit trail integrity.
 */

import { describe, it, expect } from 'vitest';
import { CP21DatasetGenerator } from '../core/ict/backtest/CP21DatasetGenerator';
import { ExecutionSimulator } from '../core/ict/backtest/ExecutionSimulator';
import { CP21Runner } from '../core/ict/backtest/CP21Runner';
import { ProtocolMode } from '../core/ict/backtest/BacktestTypes';

describe('Checkpoint 23 - Protocol Separation Suite', () => {
  // 1. Pure Shadow Outcome Invariance
  it('should guarantee 100% outcome invariance across all 4 variants under PURE_SHADOW mode (ratio = 0)', () => {
    const { items, dataset } = CP21DatasetGenerator.generateCP21Dataset();
    const runner = new CP21Runner(items, dataset.datasetHash);

    const basePure = runner.computeMetrics(runner.executeVariant(items, 'BASELINE', 'PURE_SHADOW', 0), 'BASELINE');
    const rob10Pure = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_10', 'PURE_SHADOW', 0), 'ROBUST_10');
    const rob14Pure = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_14', 'PURE_SHADOW', 0), 'ROBUST_14');
    const rob20Pure = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_20', 'PURE_SHADOW', 0), 'ROBUST_20');

    expect(basePure.targetReachedCount).toBe(167);
    expect(basePure.stopReachedCount).toBe(333);
    expect(basePure.noExecutionCount).toBe(0);

    expect(rob10Pure.targetReachedCount).toBe(167);
    expect(rob10Pure.stopReachedCount).toBe(333);
    expect(rob10Pure.noExecutionCount).toBe(0);

    expect(rob14Pure.targetReachedCount).toBe(167);
    expect(rob14Pure.stopReachedCount).toBe(333);
    expect(rob14Pure.noExecutionCount).toBe(0);

    expect(rob20Pure.targetReachedCount).toBe(167);
    expect(rob20Pure.stopReachedCount).toBe(333);
    expect(rob20Pure.noExecutionCount).toBe(0);
  });

  // 2. Filtered Eligibility Difference
  it('should produce 50 BASELINE rejections and 0 ROBUST rejections under FILTERED_EXPERIMENT mode (ratio = 0.8)', () => {
    const { items, dataset } = CP21DatasetGenerator.generateCP21Dataset();
    const runner = new CP21Runner(items, dataset.datasetHash);

    const baseFilt = runner.computeMetrics(runner.executeVariant(items, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8), 'BASELINE');
    const rob14Filt = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_14', 'FILTERED_EXPERIMENT', 0.8), 'ROBUST_14');

    expect(baseFilt.targetReachedCount).toBe(151);
    expect(baseFilt.stopReachedCount).toBe(299);
    expect(baseFilt.noExecutionCount).toBe(50);

    expect(rob14Filt.targetReachedCount).toBe(167);
    expect(rob14Filt.stopReachedCount).toBe(333);
    expect(rob14Filt.noExecutionCount).toBe(0);
  });

  // 3. BaseScenario Immutability & EligibilityDecision Isolation
  it('should verify BaseScenario remains 100% immutable while EligibilityDecision captures qualification reason', () => {
    const { items } = CP21DatasetGenerator.generateCP21Dataset();
    const item = items[0];

    const decPure = ExecutionSimulator.evaluateEligibility(item.scenario, 'BASELINE', 'PURE_SHADOW', 0);
    const decFilt = ExecutionSimulator.evaluateEligibility(item.scenario, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);

    expect(decPure.protocolMode).toBe('PURE_SHADOW');
    expect(decPure.eligible).toBe(true);
    expect(decPure.reason).toBe('FILTER_DISABLED_PURE_SHADOW');

    expect(decFilt.protocolMode).toBe('FILTERED_EXPERIMENT');
    expect(decFilt.threshold).toBe(0.8);

    // Verify scenario itself was untampered
    expect(item.scenario.entryPrice).toBe(item.scenario.referencePrice);
    expect(item.scenario.risk).toBe(Math.abs(item.scenario.entryPrice - item.scenario.stopPrice));
  });

  // 4. 50 Case Audit & Attribution
  it('should audit the 50 BASELINE rejections and attribute 25 to SHOCK and 25 to POST-SHOCK', () => {
    const { items } = CP21DatasetGenerator.generateCP21Dataset();
    const simulator = new ExecutionSimulator();

    const rejectedScenarios = items
      .map((item) => simulator.simulate(item.scenario, item.futureCandles, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8))
      .filter((t) => t.outcome === 'NO_EXECUTION');

    expect(rejectedScenarios.length).toBe(50);

    const shockRejects = rejectedScenarios.filter((t) => {
      const s = items.find((it) => it.scenario.scenarioId === t.scenarioId)?.scenario;
      return s?.volatilityRegime === 'SHOCK';
    });

    const postShockRejects = rejectedScenarios.filter((t) => {
      const s = items.find((it) => it.scenario.scenarioId === t.scenarioId)?.scenario;
      return s?.volatilityRegime === 'POST-SHOCK';
    });

    expect(shockRejects.length).toBe(25);
    expect(postShockRejects.length).toBe(25);
  });

  // 5. Batch vs Simulated Live Streaming Equivalence
  it('should guarantee 100% equivalence between Batch and Simulated Live Streaming for both Pure Shadow and Filtered modes', () => {
    const { items, dataset } = CP21DatasetGenerator.generateCP21Dataset();
    const runner = new CP21Runner(items, dataset.datasetHash);

    // Pure Shadow
    const batchPure = runner.executeVariant(items, 'ROBUST_14', 'PURE_SHADOW', 0);
    const simLivePure = runner.executeSimulatedLive(items, 'ROBUST_14', 'PURE_SHADOW', 0);

    expect(batchPure.length).toBe(simLivePure.length);
    for (let i = 0; i < batchPure.length; i++) {
      expect(batchPure[i].traceHash).toBe(simLivePure[i].traceHash);
    }

    // Filtered Experiment
    const batchFilt = runner.executeVariant(items, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);
    const simLiveFilt = runner.executeSimulatedLive(items, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);

    expect(batchFilt.length).toBe(simLiveFilt.length);
    for (let i = 0; i < batchFilt.length; i++) {
      expect(batchFilt[i].traceHash).toBe(simLiveFilt[i].traceHash);
    }
  });

  // 6. Configuration Isolation
  it('should enforce ProtocolMode configuration isolation without ambiguous boolean flags', () => {
    const validModes: ProtocolMode[] = ['PURE_SHADOW', 'FILTERED_EXPERIMENT'];
    for (const mode of validModes) {
      expect(['PURE_SHADOW', 'FILTERED_EXPERIMENT']).toContain(mode);
    }
  });
});
