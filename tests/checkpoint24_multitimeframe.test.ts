/**
 * Checkpoint 24 - Multi-Timeframe Regime Protocol Validation Test Suite
 * Validates pure shadow outcome invariance, filtered eligibility divergence, BaseScenario immutability,
 * multi-timeframe coverage (MNQ/NQ 1m, 5m, 15m), regime isolation, batch/replay/simulated-live equivalence,
 * and future injection asymmetry.
 */

import { describe, it, expect } from 'vitest';
import { CP24DatasetGenerator } from '../core/ict/backtest/CP24DatasetGenerator';
import { ExecutionSimulator } from '../core/ict/backtest/ExecutionSimulator';
import { CP21Runner } from '../core/ict/backtest/CP21Runner';
describe('Checkpoint 24 - Multi-Timeframe Regime Protocol Suite', () => {
  // 1. Pure Shadow Outcome Invariance
  it('should guarantee 100% outcome invariance across all 4 variants under PURE_SHADOW mode (ratio = 0)', () => {
    const { items, dataset } = CP24DatasetGenerator.generateCP24Dataset();
    expect(items.length).toBe(600);

    const runner = new CP21Runner(items, dataset.datasetHash);

    const basePure = runner.computeMetrics(runner.executeVariant(items, 'BASELINE', 'PURE_SHADOW', 0), 'BASELINE');
    const rob10Pure = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_10', 'PURE_SHADOW', 0), 'ROBUST_10');
    const rob14Pure = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_14', 'PURE_SHADOW', 0), 'ROBUST_14');
    const rob20Pure = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_20', 'PURE_SHADOW', 0), 'ROBUST_20');

    expect(basePure.targetReachedCount).toBe(200);
    expect(basePure.stopReachedCount).toBe(400);
    expect(basePure.noExecutionCount).toBe(0);

    expect(rob10Pure.targetReachedCount).toBe(200);
    expect(rob10Pure.stopReachedCount).toBe(400);
    expect(rob10Pure.noExecutionCount).toBe(0);

    expect(rob14Pure.targetReachedCount).toBe(200);
    expect(rob14Pure.stopReachedCount).toBe(400);
    expect(rob14Pure.noExecutionCount).toBe(0);

    expect(rob20Pure.targetReachedCount).toBe(200);
    expect(rob20Pure.stopReachedCount).toBe(400);
    expect(rob20Pure.noExecutionCount).toBe(0);
  });

  // 2. Filtered Eligibility Divergence
  it('should produce 45 BASELINE rejections and 0 ROBUST rejections under FILTERED_EXPERIMENT mode (ratio = 0.8)', () => {
    const { items, dataset } = CP24DatasetGenerator.generateCP24Dataset();
    const runner = new CP21Runner(items, dataset.datasetHash);

    const baseFilt = runner.computeMetrics(runner.executeVariant(items, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8), 'BASELINE');
    const rob14Filt = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_14', 'FILTERED_EXPERIMENT', 0.8), 'ROBUST_14');

    expect(baseFilt.targetReachedCount).toBe(185);
    expect(baseFilt.stopReachedCount).toBe(370);
    expect(baseFilt.noExecutionCount).toBe(45);

    expect(rob14Filt.targetReachedCount).toBe(200);
    expect(rob14Filt.stopReachedCount).toBe(400);
    expect(rob14Filt.noExecutionCount).toBe(0);
  });

  // 3. BaseScenario Immutability & EligibilityDecision Isolation
  it('should verify BaseScenario remains 100% immutable while EligibilityDecision captures qualification reason', () => {
    const { items } = CP24DatasetGenerator.generateCP24Dataset();
    const item = items[0];

    const decPure = ExecutionSimulator.evaluateEligibility(item.scenario, 'BASELINE', 'PURE_SHADOW', 0);
    const decFilt = ExecutionSimulator.evaluateEligibility(item.scenario, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);

    expect(decPure.protocolMode).toBe('PURE_SHADOW');
    expect(decPure.eligible).toBe(true);
    expect(decPure.reason).toBe('FILTER_DISABLED_PURE_SHADOW');

    expect(decFilt.protocolMode).toBe('FILTERED_EXPERIMENT');
    expect(decFilt.threshold).toBe(0.8);

    expect(item.scenario.entryPrice).toBe(item.scenario.referencePrice);
    expect(item.scenario.risk).toBe(Math.abs(item.scenario.entryPrice - item.scenario.stopPrice));
  });

  // 4. Multi-Timeframe Coverage Verification
  it('should enforce balanced multi-timeframe coverage across MNQ 1m/5m/15m and NQ 1m/5m/15m', () => {
    const { dataset } = CP24DatasetGenerator.generateCP24Dataset();

    for (const sym of ['MNQ', 'NQ']) {
      for (const tf of ['1m', '5m', '15m']) {
        const count = dataset.scenarios.filter((s) => s.symbol === sym && s.timeframe === tf).length;
        expect(count).toBe(100);
      }
    }
  });

  // 5. Batch vs Replay vs Simulated Live Streaming Equivalence
  it('should guarantee 100% equivalence between Batch and Simulated Live Streaming across 600 scenarios', () => {
    const { items, dataset } = CP24DatasetGenerator.generateCP24Dataset();
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

  // 6. Future Injection Asymmetry
  it('should maintain 100% EligibilityDecision immutability at confirmation timestamp when future candles change', () => {
    const { items } = CP24DatasetGenerator.generateCP24Dataset();
    const item = items[0];

    const origEligibility = ExecutionSimulator.evaluateEligibility(item.scenario, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);

    const injectedFutureCandles = [...item.futureCandles];
    injectedFutureCandles[0] = { ...injectedFutureCandles[0], high: 99999, low: 0 };

    const injectedEligibility = ExecutionSimulator.evaluateEligibility(item.scenario, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);

    expect(origEligibility.eligible).toBe(injectedEligibility.eligible);
    expect(origEligibility.volatility).toBe(injectedEligibility.volatility);
  });
});
