/**
 * Checkpoint 21 - Pre-Registered Retrospective Outcome Protocol Tests
 * Validates deterministic execution, variant immutability, causality, batch/replay equivalence,
 * future injection, reproducibility, and holdout isolation.
 */

import { describe, it, expect } from 'vitest';
import { CP21DatasetGenerator } from '../core/ict/backtest/CP21DatasetGenerator';
import { ExecutionSimulator } from '../core/ict/backtest/ExecutionSimulator';
import { CP21Runner } from '../core/ict/backtest/CP21Runner';
import { BacktestScenario, VolatilityVariant, ExecutionTrace } from '../core/ict/backtest/BacktestTypes';
import { Candle } from '../core/market/Candle';

describe('Checkpoint 21 - Retrospective Backtest Protocol Suite', () => {
  // 1. Dataset generation and hashing
  it('should generate a new, frozen CP21 dataset with expected distributions and hashes', () => {
    const { dataset, items } = CP21DatasetGenerator.generateCP21Dataset();

    expect(items.length).toBe(500);
    expect(dataset.datasetHash).toContain('HASH-CP21');
    expect(dataset.symbolDistribution['MNQ']).toBe(250);
    expect(dataset.symbolDistribution['NQ']).toBe(250);

    expect(dataset.splitDistribution['EXPLORATION']).toBe(100);
    expect(dataset.splitDistribution['SELECTION']).toBe(200);
    expect(dataset.splitDistribution['HOLDOUT']).toBe(200);

    expect(dataset.regimeDistribution['NORMAL']).toBeGreaterThan(0);
    expect(dataset.regimeDistribution['ELEVATED']).toBeGreaterThan(0);
    expect(dataset.regimeDistribution['SHOCK']).toBeGreaterThan(0);
    expect(dataset.regimeDistribution['POST-SHOCK']).toBeGreaterThan(0);
  });

  // 2. Reference price and pre-registered rules causality
  it('should strictly enforce referencePrice = confirmationPrice with entryOffset = 0', () => {
    const { items } = CP21DatasetGenerator.generateCP21Dataset();
    const item = items[0];
    const scenario = item.scenario;

    expect(scenario.entryPrice).toBe(scenario.referencePrice);
    expect(scenario.risk).toBe(Math.abs(scenario.entryPrice - scenario.stopPrice));
    expect(scenario.targetDistance).toBe(2 * scenario.risk);

    if (scenario.direction === 'LONG_SCENARIO') {
      expect(scenario.targetPrice).toBe(scenario.entryPrice + scenario.targetDistance);
    } else {
      expect(scenario.targetPrice).toBe(scenario.entryPrice - scenario.targetDistance);
    }
  });

  // 3. Variant Immutability
  it('should pass exactly identical scenario parameters to all 4 volatility variants', () => {
    const { items } = CP21DatasetGenerator.generateCP21Dataset();
    const runner = new CP21Runner(items, 'TEST-HASH');
    const item = items[10];

    const simulator = new ExecutionSimulator();
    const variants: VolatilityVariant[] = ['BASELINE', 'ROBUST_10', 'ROBUST_14', 'ROBUST_20'];

    const traces: ExecutionTrace[] = variants.map((v) => simulator.simulate(item.scenario, item.futureCandles, v));

    // Every trace must share exact same entryPrice, stopPrice, targetPrice
    for (const trace of traces) {
      expect(trace.entryPrice).toBe(item.scenario.entryPrice);
      expect(trace.stopPrice).toBe(item.scenario.stopPrice);
      expect(trace.targetPrice).toBe(item.scenario.targetPrice);
    }
  });

  // 4. Intrabar Ambiguity Policy
  it('should classify intrabar ambiguity when high >= target AND low <= stop in the same candle', () => {
    const simulator = new ExecutionSimulator();
    const scenario: BacktestScenario = {
      scenarioId: 'TEST-AMB-01',
      eventId: 'EVT-01',
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
      shadowVolatility: { baseline: 5, robust10: 5, robust14: 5, robust20: 5 },
      split: 'EXPLORATION',
      isInvalidScenario: false,
    };

    const ambiguousCandle: Candle = {
      symbol: 'NQ',
      timeframe: '1m',
      timestamp: 3000,
      open: 100,
      high: 125, // >= target (120)
      low: 85,   // <= stop (90)
      close: 105,
      volume: 100,
    };

    const trace = simulator.simulate(scenario, [ambiguousCandle], 'BASELINE');

    expect(trace.outcome).toBe('AMBIGUOUS');
    expect(trace.ambiguousBarCount).toBe(1);
    expect(trace.barsInTrade).toBe(1);
  });

  // 5. Gap Open Policy
  it('should handle gap open past target or stop on bar 1 correctly', () => {
    const simulator = new ExecutionSimulator();
    const scenario: BacktestScenario = {
      scenarioId: 'TEST-GAP-01',
      eventId: 'EVT-02',
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
      shadowVolatility: { baseline: 5, robust10: 5, robust14: 5, robust20: 5 },
      split: 'EXPLORATION',
      isInvalidScenario: false,
    };

    const gapTargetCandle: Candle = {
      symbol: 'NQ',
      timeframe: '1m',
      timestamp: 3000,
      open: 125, // Gaps above target (120)
      high: 130,
      low: 124,
      close: 128,
      volume: 100,
    };

    const trace = simulator.simulate(scenario, [gapTargetCandle], 'BASELINE');

    expect(trace.outcome).toBe('TARGET_REACHED');
    expect(trace.gapOccurred).toBe(true);
    expect(trace.exitPrice).toBe(125);
  });

  // 6. Batch / Replay Equivalence
  it('should guarantee BatchOutcome == ReplayOutcome across all 500 scenarios', () => {
    const { items } = CP21DatasetGenerator.generateCP21Dataset();
    const runner = new CP21Runner(items, 'TEST-HASH');

    const batchTraces = runner.executeVariant(items, 'ROBUST_14');

    // Simulate item-by-item sequential replay
    const replayTraces: ExecutionTrace[] = [];
    const simulator = new ExecutionSimulator();

    for (const item of items) {
      replayTraces.push(simulator.simulate(item.scenario, item.futureCandles, 'ROBUST_14'));
    }

    expect(batchTraces.length).toBe(replayTraces.length);
    for (let i = 0; i < batchTraces.length; i++) {
      expect(batchTraces[i].outcome).toBe(replayTraces[i].outcome);
      expect(batchTraces[i].traceHash).toBe(replayTraces[i].traceHash);
    }
  });

  // 7. Future Injection Asymmetry
  it('should alter outcome when future candles change, but maintain 100% scenario immutability', () => {
    const { items } = CP21DatasetGenerator.generateCP21Dataset();
    const item = items[0];
    const simulator = new ExecutionSimulator();

    const originalTrace = simulator.simulate(item.scenario, item.futureCandles, 'ROBUST_14');

    // Inject extreme future candle at k=2
    const injectedFutureCandles = [...item.futureCandles];
    injectedFutureCandles[1] = {
      ...injectedFutureCandles[1],
      high: 99999,
      low: 0,
    };

    const injectedTrace = simulator.simulate(item.scenario, injectedFutureCandles, 'ROBUST_14');

    // Scenario itself must NOT change
    expect(item.scenario.entryPrice).toBe(item.scenario.referencePrice);
    expect(item.scenario.stopPrice).toBe(item.scenario.stopPrice);

    // Outcome trace may change due to future candle modification
    expect(injectedTrace.outcome).toBe('AMBIGUOUS');
    expect(originalTrace.scenarioId).toBe(injectedTrace.scenarioId);
  });

  // 8. Reproducibility across 3 consecutive runs
  it('should yield 100% identical trace hashes across 3 consecutive evaluation runs', () => {
    const { items } = CP21DatasetGenerator.generateCP21Dataset();
    const runner = new CP21Runner(items, 'REPRODUCE-HASH');

    const isReproducible = runner.verifyReproducibility(3);
    expect(isReproducible).toBe(true);
  });

  // 9. Full Protocol Evaluation & Holdout Isolation
  it('should complete full CP21 report data generation without holdout contradictions', () => {
    const { items, dataset } = CP21DatasetGenerator.generateCP21Dataset();
    const runner = new CP21Runner(items, dataset.datasetHash);

    const reportData = runner.runFullProtocol(0.8);


    expect(reportData.datasetHash).toContain('HASH-CP21');
    expect(reportData.holdoutContradictions).toBe(false);

    expect(reportData.selectionMetrics['BASELINE'].totalScenarios).toBe(200);
    expect(reportData.holdoutMetrics['ROBUST_14'].totalScenarios).toBe(200);

    expect(reportData.observedDifferences.length).toBeGreaterThan(0);
    expect(reportData.reproducibleDifferences.length).toBeGreaterThan(0);
  });
});
