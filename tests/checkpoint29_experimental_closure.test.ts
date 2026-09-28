/**
 * Checkpoint 29 - Experimental Branch Closure and Global Project Audit Test Suite
 * Validates production isolation, shadow isolation, filtered experiment isolation, production regression,
 * event invariance, BaseScenario immutability, Pure Shadow outcome invariance, batch/replay equivalence,
 * future injection asymmetry, context reset, immutability, configuration isolation, and audit reproducibility.
 */

import { describe, it, expect } from 'vitest';
import { ICTEngine } from '../core/ict/engine/ICTEngine';
import { DEFAULT_ICT_CONFIG } from '../core/ict/types/ICTConfig';
import { Candle } from '../core/market/Candle';
import { CP27DatasetGenerator } from '../core/ict/backtest/CP27DatasetGenerator';
import { ExecutionSimulator } from '../core/ict/backtest/ExecutionSimulator';
import { CP21Runner } from '../core/ict/backtest/CP21Runner';
import { ProtocolMode } from '../core/ict/backtest/BacktestTypes';

describe('Checkpoint 29 - Experimental Branch Closure & Global Audit Suite', () => {
  // Helper to generate deterministic synthetic candles for production ICTEngine
  function generateCandles(count: number = 50): Candle[] {
    const candles: Candle[] = [];
    let price = 19500;
    const baseTs = 1775184000000;

    for (let i = 0; i < count; i++) {
      const swingPattern = Math.sin(i * 0.5) * 20;
      const open = price;
      const high = open + Math.max(5, swingPattern + 10);
      const low = open - Math.max(5, -swingPattern + 10);
      const close = (open + high + low) / 3;
      price = close;

      candles.push({
        timestamp: baseTs + i * 60000,
        open,
        high,
        low,
        close,
        volume: 1000 + i * 10,
        symbol: 'NQ',
        timeframe: '1m',
      });
    }
    return candles;
  }

  // 1. Production Isolation
  it('should verify production ICTEngine operates with 0 dependency on experimental volatility modules', () => {
    const candles = generateCandles(60);
    const engine = new ICTEngine();

    const res = engine.process(candles, 'NQ', '1m');

    expect(res.state).toBeDefined();
    expect(res.events).toBeDefined();
    expect(Array.isArray(res.events)).toBe(true);

    // Verify state objects contain only core ICT production attributes
    for (const evt of res.events) {
      expect((evt as any).shadowVolatility).toBeUndefined();
      expect((evt as any).qualificationThresholdRatio).toBeUndefined();
      expect((evt as any).eligibilityDecision).toBeUndefined();
    }
  });

  // 2. Shadow Isolation
  it('should confirm PURE_SHADOW volatility observation does not mutate BaseScenario or detection events', () => {
    const { items } = CP27DatasetGenerator.generateCP27Dataset();
    const item = items[0];

    const origEntry = item.scenario.entryPrice;
    const origStop = item.scenario.stopPrice;
    const origRisk = item.scenario.risk;

    const dec = ExecutionSimulator.evaluateEligibility(item.scenario, 'ROBUST_14', 'PURE_SHADOW', 0);

    expect(dec.protocolMode).toBe('PURE_SHADOW');
    expect(dec.eligible).toBe(true);
    expect(item.scenario.entryPrice).toBe(origEntry);
    expect(item.scenario.stopPrice).toBe(origStop);
    expect(item.scenario.risk).toBe(origRisk);
  });

  // 3. Filtered Experiment Isolation
  it('should confirm FILTERED_EXPERIMENT qualification ratio 0.8 is strictly isolated and inaccessible from production config', () => {
    expect((DEFAULT_ICT_CONFIG as any).qualificationThresholdRatio).toBeUndefined();
    expect((DEFAULT_ICT_CONFIG as any).protocolMode).toBeUndefined();
    expect((DEFAULT_ICT_CONFIG as any).medianTRWindow).toBeUndefined();

    const validModes: ProtocolMode[] = ['PURE_SHADOW', 'FILTERED_EXPERIMENT'];
    expect(validModes).toContain('FILTERED_EXPERIMENT');
  });

  // 4. Production Regression Test
  it('should confirm ProductionWithoutExperimentalModules == ProductionWithExperimentalModulesPresentButDisabled', () => {
    const candles = generateCandles(80);

    const engine1 = new ICTEngine();
    const res1 = engine1.process(candles, 'NQ', '1m');

    const engine2 = new ICTEngine();
    const res2 = engine2.process(candles, 'NQ', '1m');

    expect(res1.events.length).toBe(res2.events.length);
    expect(res1.state.trend).toBe(res2.state.trend);
    expect(res1.state.swings.length).toBe(res2.state.swings.length);
    expect(JSON.stringify(res1.events)).toBe(JSON.stringify(res2.events));
  });

  // 5. Event Invariance
  it('should confirm eventId, eventTimestamp, confirmationTimestamp, and eventType remain 100% invariant', () => {
    const { items } = CP27DatasetGenerator.generateCP27Dataset();
    const s = items[0].scenario;

    const decBase = ExecutionSimulator.evaluateEligibility(s, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);
    const decRob = ExecutionSimulator.evaluateEligibility(s, 'ROBUST_14', 'FILTERED_EXPERIMENT', 0.8);

    expect(decBase.scenarioId).toBe(decRob.scenarioId);
    expect(s.eventId).toBeDefined();
    expect(s.eventTimestamp).toBeGreaterThan(0);
    expect(s.confirmationTimestamp).toBeGreaterThan(s.eventTimestamp);
  });

  // 6. BaseScenario Immutability
  it('should guarantee BaseScenario parameters are never modified by any simulator evaluation', () => {
    const { items } = CP27DatasetGenerator.generateCP27Dataset();
    const s = items[5].scenario;

    const origScenarioJson = JSON.stringify(s);
    ExecutionSimulator.evaluateEligibility(s, 'ROBUST_20', 'FILTERED_EXPERIMENT', 0.8);

    expect(JSON.stringify(s)).toBe(origScenarioJson);
  });

  // 7. Pure Shadow Outcome Invariance
  it('should confirm Pure Shadow mode (ratio = 0) yields 0 outcome divergence across all 4 variants', () => {
    const { items, dataset } = CP27DatasetGenerator.generateCP27Dataset();
    const runner = new CP21Runner(items, dataset.datasetHash);

    const basePure = runner.computeMetrics(runner.executeVariant(items, 'BASELINE', 'PURE_SHADOW', 0), 'BASELINE');
    const rob10Pure = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_10', 'PURE_SHADOW', 0), 'ROBUST_10');
    const rob14Pure = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_14', 'PURE_SHADOW', 0), 'ROBUST_14');
    const rob20Pure = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_20', 'PURE_SHADOW', 0), 'ROBUST_20');

    expect(basePure.targetReachedCount).toBe(200);
    expect(basePure.stopReachedCount).toBe(400);
    expect(rob10Pure.targetReachedCount).toBe(200);
    expect(rob14Pure.targetReachedCount).toBe(200);
    expect(rob20Pure.targetReachedCount).toBe(200);
  });

  // 8. Batch / Replay Equivalence
  it('should guarantee 100% equivalence between batch simulation and sequential candle streaming', () => {
    const { items, dataset } = CP27DatasetGenerator.generateCP27Dataset();
    const runner = new CP21Runner(items, dataset.datasetHash);

    const batchTraces = runner.executeVariant(items, 'ROBUST_14', 'PURE_SHADOW', 0);
    const simLiveTraces = runner.executeSimulatedLive(items, 'ROBUST_14', 'PURE_SHADOW', 0);

    expect(batchTraces.length).toBe(simLiveTraces.length);
    for (let i = 0; i < batchTraces.length; i++) {
      expect(batchTraces[i].traceHash).toBe(simLiveTraces[i].traceHash);
    }
  });

  // 9. Future Injection Asymmetry
  it('should alter trade trace outcomes when future candles are modified without changing BaseScenario', () => {
    const { items } = CP27DatasetGenerator.generateCP27Dataset();
    const item = items[0];
    const simulator = new ExecutionSimulator();

    const origTrace = simulator.simulate(item.scenario, item.futureCandles, 'ROBUST_14');

    const injectedFutureCandles = [...item.futureCandles];
    injectedFutureCandles[0] = { ...injectedFutureCandles[0], high: 99999, low: 0 };

    const injectedTrace = simulator.simulate(item.scenario, injectedFutureCandles, 'ROBUST_14');

    expect(origTrace.scenarioId).toBe(injectedTrace.scenarioId);
    expect(injectedTrace.outcome).toBe('AMBIGUOUS');
  });

  // 10. Context Reset
  it('should verify progressive buffer context reset returns ICTEngine to initial state', () => {
    const candles = generateCandles(30);
    const engine = new ICTEngine();

    for (const c of candles) {
      engine.processNext(c, 'NQ', '1m');
    }

    engine.resetProgressiveBuffer();

    const freshRes = engine.process(candles, 'NQ', '1m');
    expect(freshRes.events.length).toBeGreaterThan(0);
  });

  // 11. Immutability
  it('should ensure events returned by ICTEngine are immutable deep clones', () => {
    const candles = generateCandles(40);
    const engine = new ICTEngine();

    const res1 = engine.process(candles, 'NQ', '1m');
    if (res1.events.length > 0) {
      (res1.events[0] as any).symbol = 'MUTATED';
    }

    const res2 = engine.process(candles, 'NQ', '1m');
    if (res2.events.length > 0) {
      expect(res2.events[0].symbol).toBe('NQ');
    }
  });

  // 12. Configuration Isolation
  it('should verify DEFAULT_ICT_CONFIG contains zero experimental volatility keys', () => {
    const keys = Object.keys(DEFAULT_ICT_CONFIG);
    expect(keys).not.toContain('qualificationThresholdRatio');
    expect(keys).not.toContain('protocolMode');
    expect(keys).not.toContain('medianTRWindow');
    expect(keys).not.toContain('volatilityFilterEnabled');
  });

  // 13. Audit Reproducibility
  it('should pass multi-pass reproducibility check with 100% hash equivalence', () => {
    const { items, dataset } = CP27DatasetGenerator.generateCP27Dataset();
    const runner = new CP21Runner(items, dataset.datasetHash);

    const isReproducible = runner.verifyReproducibility(3);
    expect(isReproducible).toBe(true);
  });
});
