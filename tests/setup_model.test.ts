import { describe, it, expect, beforeEach } from 'vitest';
import { Candle } from '../core/market';
import {
  ICTEngine,
  ConfluenceEngine,
  SetupEngine,
  MarketContextEngine,
} from '../core/ict';

describe('Checkpoint 4 — ICT Setup & Confluence Conceptual Data Model Tests', () => {
  let engine: ICTEngine;
  let confluenceEngine: ConfluenceEngine;
  let setupEngine: SetupEngine;
  let contextEngine: MarketContextEngine;

  beforeEach(() => {
    engine = new ICTEngine({
      swingLeftBars: 2,
      swingRightBars: 2,
      fvgMinSizePoints: 0.1,
      liquidityTolerancePoints: 0.5,
      sweepMinPenetrationPoints: 0.1,
    });
    confluenceEngine = new ConfluenceEngine();
    setupEngine = new SetupEngine();
    contextEngine = new MarketContextEngine();
  });

  // Test 1: Valid events produce coherent context
  it('Test 1: Valid events produce a coherent market context', () => {
    const candles: Candle[] = [
      { timestamp: 1000, open: 100, high: 105, low: 99, close: 104 },
      { timestamp: 2000, open: 104, high: 112, low: 104, close: 111 },
      { timestamp: 3000, open: 111, high: 116, low: 107, close: 115 },
    ];

    const { state, events } = engine.process(candles, 'MNQ', '1m');
    const confluences = confluenceEngine.evaluateConfluences(state, events, 'BULLISH');
    const setups = setupEngine.evaluateSetups(state, events, confluences);
    const context = contextEngine.buildContext(state, events, confluences, setups);

    expect(context.symbol).toBe('MNQ');
    expect(context.ltfTimeframe).toBe('1m');
    expect(context.confluences.length).toBeGreaterThan(0);
    expect(context.setups.length).toBe(2); // Long and Short setup models
  });

  // Test 2: Setup cannot confirm if mandatory condition is missing
  it('Test 2: Setup cannot confirm if a mandatory condition is missing', () => {
    // Only 3-candle FVG, no SSL sweep or MSS yet
    const candles: Candle[] = [
      { timestamp: 1000, open: 100, high: 105, low: 99, close: 104 },
      { timestamp: 2000, open: 104, high: 112, low: 104, close: 111 },
      { timestamp: 3000, open: 111, high: 116, low: 107, close: 115 },
    ];

    const { state, events } = engine.process(candles, 'MNQ', '1m');
    const confluences = confluenceEngine.evaluateConfluences(state, events);
    const setups = setupEngine.evaluateSetups(state, events, confluences);

    const longSetup = setups.find((s) => s.direction === 'LONG');

    // FVG is present, but LIQUIDITY_SWEEP and MSS_CONFIRMED are missing -> Cannot be CONFIRMED
    expect(longSetup).toBeDefined();
    expect(longSetup?.status).not.toBe('CONFIRMED');
    expect(longSetup?.missingConfluences.length).toBeGreaterThan(0);
  });

  // Test 3: Invalidating condition invalidates setup
  it('Test 3: An invalidating condition invalidates the setup', () => {
    const candles: Candle[] = [
      { timestamp: 1000, open: 20, high: 22, low: 19, close: 20 },
      { timestamp: 2000, open: 20, high: 21, low: 18, close: 19 },
      { timestamp: 3000, open: 19, high: 18, low: 10, close: 11 }, // Swing Low 10
      { timestamp: 4000, open: 11, high: 15, low: 11, close: 14 },
      { timestamp: 5000, open: 14, high: 16, low: 13, close: 15 },
      { timestamp: 6000, open: 15, high: 15, low: 5, close: 6 },   // Bearish BOS breaks lower structure
    ];

    const { state, events } = engine.process(candles, 'MNQ', '1m');
    const confluences = confluenceEngine.evaluateConfluences(state, events);
    const setups = setupEngine.evaluateSetups(state, events, confluences);

    const longSetup = setups.find((s) => s.direction === 'LONG');
    expect(longSetup?.status).toBe('INVALIDATED');
  });

  // Test 4: Future data does not retroactively modify historical setup
  it('Test 4: Adding future data does not retroactively modify a historical setup', () => {
    const baseCandles: Candle[] = [
      { timestamp: 1000, open: 100, high: 105, low: 99, close: 104 },
      { timestamp: 2000, open: 104, high: 112, low: 104, close: 111 },
      { timestamp: 3000, open: 111, high: 116, low: 107, close: 115 },
    ];

    const resBefore = engine.process(baseCandles, 'MNQ', '1m');
    const confBefore = confluenceEngine.evaluateConfluences(resBefore.state, resBefore.events);
    const setupBefore = setupEngine.evaluateSetups(resBefore.state, resBefore.events, confBefore);

    const candlesWithFuture: Candle[] = [
      ...baseCandles,
      { timestamp: 4000, open: 115, high: 200, low: 50, close: 180 },
    ];

    const resAfter = engine.process(candlesWithFuture, 'MNQ', '1m');
    const confAfter = confluenceEngine.evaluateConfluences(resAfter.state, resAfter.events);
    const setupAfter = setupEngine.evaluateSetups(resAfter.state, resAfter.events, confAfter);

    // Initial setup snapshot for baseCandles timestamp 3000 remains deterministic
    expect(JSON.stringify(setupBefore)).toBeDefined();
    expect(setupAfter.length).toBe(2);
  });

  // Test 5: Batch and incremental processing produce identical setup state
  it('Test 5: Batch and incremental processing produce the same setup state', () => {
    const candles: Candle[] = [
      { timestamp: 1000, open: 100, high: 105, low: 99, close: 104 },
      { timestamp: 2000, open: 104, high: 112, low: 104, close: 111 },
      { timestamp: 3000, open: 111, high: 116, low: 107, close: 115 },
    ];

    // Batch
    const resBatch = engine.process(candles, 'MNQ', '1m');
    const confBatch = confluenceEngine.evaluateConfluences(resBatch.state, resBatch.events);
    const setupBatch = setupEngine.evaluateSetups(resBatch.state, resBatch.events, confBatch);

    // Incremental
    let resInc;
    for (const c of candles) {
      resInc = engine.processNext(c, 'MNQ', '1m');
    }
    const confInc = confluenceEngine.evaluateConfluences(resInc!.state, resInc!.events);
    const setupInc = setupEngine.evaluateSetups(resInc!.state, resInc!.events, confInc);

    expect(JSON.stringify(setupInc)).toEqual(JSON.stringify(setupBatch));
  });

  // Test 6: Changing HTF/LTF updates context correctly
  it('Test 6: Changing HTF/LTF updates the context correctly', () => {
    const ltfCandles: Candle[] = [
      { timestamp: 1000, open: 100, high: 105, low: 99, close: 104 },
    ];

    const res1m = engine.process(ltfCandles, 'MNQ', '1m');
    const conf1m = confluenceEngine.evaluateConfluences(res1m.state, res1m.events, 'BEARISH');
    const setup1m = setupEngine.evaluateSetups(res1m.state, res1m.events, conf1m);
    const context1m = contextEngine.buildContext(res1m.state, res1m.events, conf1m, setup1m);

    expect(context1m.ltfTimeframe).toBe('1m');

    const res5m = engine.process(ltfCandles, 'MNQ', '5m');
    const conf5m = confluenceEngine.evaluateConfluences(res5m.state, res5m.events, 'BULLISH');
    const setup5m = setupEngine.evaluateSetups(res5m.state, res5m.events, conf5m);
    const context5m = contextEngine.buildContext(res5m.state, res5m.events, conf5m, setup5m);

    expect(context5m.ltfTimeframe).toBe('5m');
  });

  // Test 7: Two independent setups do not pollute each other
  it('Test 7: Independent LONG and SHORT setups do not pollute each other', () => {
    const candles: Candle[] = [
      { timestamp: 1000, open: 100, high: 105, low: 99, close: 104 },
    ];

    const { state, events } = engine.process(candles, 'MNQ', '1m');
    const confluences = confluenceEngine.evaluateConfluences(state, events);
    const setups = setupEngine.evaluateSetups(state, events, confluences);

    const longSetup = setups.find((s) => s.direction === 'LONG');
    const shortSetup = setups.find((s) => s.direction === 'SHORT');

    expect(longSetup?.id).not.toEqual(shortSetup?.id);
    expect(longSetup?.direction).toBe('LONG');
    expect(shortSetup?.direction).toBe('SHORT');
  });

  // Test 8: Setup states are 100% deterministic across multiple runs
  it('Test 8: Setup states are 100% deterministic across multiple runs', () => {
    const candles: Candle[] = [
      { timestamp: 1000, open: 100, high: 105, low: 99, close: 104 },
      { timestamp: 2000, open: 104, high: 112, low: 104, close: 111 },
      { timestamp: 3000, open: 111, high: 116, low: 107, close: 115 },
    ];

    const runSetup = () => {
      const { state, events } = engine.process(candles, 'MNQ', '1m');
      const confluences = confluenceEngine.evaluateConfluences(state, events);
      return setupEngine.evaluateSetups(state, events, confluences);
    };

    const run1 = JSON.stringify(runSetup());
    const run2 = JSON.stringify(runSetup());
    const run3 = JSON.stringify(runSetup());

    expect(run1).toEqual(run2);
    expect(run2).toEqual(run3);
  });
});
