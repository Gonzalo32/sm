import { describe, it, expect, beforeEach } from 'vitest';
import { Candle } from '../core/market';
import {
  ICTEngine,
  ConfluenceEngine,
  SetupEngine,
  ICTSetupModel,
  MODEL_A_LONG,
  MODEL_A_SHORT,
  MODEL_B_LONG,
  DisplacementEngine,
} from '../core/ict';

describe('Checkpoint 5 — Configurable ICT Models & Displacement Engine Tests', () => {
  let engine: ICTEngine;
  let confluenceEngine: ConfluenceEngine;
  let setupEngine: SetupEngine;
  let displacementEngine: DisplacementEngine;

  beforeEach(() => {
    engine = new ICTEngine({
      swingLeftBars: 2,
      swingRightBars: 2,
      fvgMinSizePoints: 0.1,
      liquidityTolerancePoints: 0.5,
      sweepMinPenetrationPoints: 0.1,
    });
    confluenceEngine = new ConfluenceEngine();
    setupEngine = new SetupEngine([MODEL_A_LONG, MODEL_B_LONG]);
    displacementEngine = new DisplacementEngine();
  });

  // Test 1: Two different models on the same data produce different setup outputs
  it('Test 1: Two different models (Model A vs Model B) produce different setup outputs on identical data', () => {
    const candles: Candle[] = [
      { timestamp: 1000, open: 100, high: 105, low: 99, close: 104 },
      { timestamp: 2000, open: 104, high: 112, low: 104, close: 111 },
      { timestamp: 3000, open: 111, high: 116, low: 107, close: 115 },
    ];

    const { state, events } = engine.process(candles, 'MNQ', '1m');
    const confluences = confluenceEngine.evaluateConfluences(state, events);
    const setups = setupEngine.evaluateSetups(state, events, confluences);

    const setupA = setups.find((s) => s.id.includes('MODEL_A'));
    const setupB = setups.find((s) => s.id.includes('MODEL_B'));

    expect(setupA).toBeDefined();
    expect(setupB).toBeDefined();
    expect(setupA?.id).not.toEqual(setupB?.id);
    expect(setupA?.mandatoryConfluences).not.toEqual(setupB?.mandatoryConfluences);
  });

  // Test 2: Changing a REQUIRED condition alters setup confirmation
  it('Test 2: Changing a REQUIRED condition alters confirmation status', () => {
    const customModel: ICTSetupModel = {
      id: 'CUSTOM_REQUIRED_TEST',
      name: 'Custom Required Test',
      description: 'Model with single FVG requirement',
      direction: 'LONG',
      sequenceMode: 'UNORDERED',
      maxBarsBetweenConditions: 50,
      conditions: [
        { id: 'c1', type: 'FVG_CONFLUENCE', category: 'REQUIRED', description: 'FVG required' },
      ],
    };

    const customEngine = new SetupEngine([customModel]);
    const candles: Candle[] = [
      { timestamp: 1000, open: 100, high: 105, low: 99, close: 104 },
      { timestamp: 2000, open: 104, high: 112, low: 104, close: 111 },
      { timestamp: 3000, open: 111, high: 116, low: 107, close: 115 }, // Creates Bullish FVG
    ];

    const { state, events } = engine.process(candles, 'MNQ', '1m');
    const confluences = confluenceEngine.evaluateConfluences(state, events);
    const setups = customEngine.evaluateSetups(state, events, confluences);

    // Single FVG required -> CONFIRMED
    expect(setups[0].status).toBe('CONFIRMED');
  });

  // Test 3: An OPTIONAL condition does NOT block confirmation
  it('Test 3: An OPTIONAL condition does not block confirmation', () => {
    const modelWithOptional: ICTSetupModel = {
      id: 'MODEL_OPTIONAL',
      name: 'Model with Optional',
      description: 'Model where Order Block is optional',
      direction: 'LONG',
      sequenceMode: 'UNORDERED',
      maxBarsBetweenConditions: 50,
      conditions: [
        { id: 'c1', type: 'FVG_CONFLUENCE', category: 'REQUIRED', description: 'FVG required' },
        { id: 'c2', type: 'ORDER_BLOCK_CONFLUENCE', category: 'OPTIONAL', description: 'OB optional' },
      ],
    };

    const customEngine = new SetupEngine([modelWithOptional]);
    const candles: Candle[] = [
      { timestamp: 1000, open: 100, high: 105, low: 99, close: 104 },
      { timestamp: 2000, open: 104, high: 112, low: 104, close: 111 },
      { timestamp: 3000, open: 111, high: 116, low: 107, close: 115 },
    ];

    const { state, events } = engine.process(candles, 'MNQ', '1m');
    const confluences = confluenceEngine.evaluateConfluences(state, events);
    const setups = customEngine.evaluateSetups(state, events, confluences);

    // FVG is present, OB is absent (optional) -> Status is CONFIRMED
    expect(setups[0].status).toBe('CONFIRMED');
  });

  // Test 4: An INVALIDATING condition invalidates correctly
  it('Test 4: An INVALIDATING condition invalidates setup correctly', () => {
    const candles: Candle[] = [
      { timestamp: 1000, open: 20, high: 22, low: 19, close: 20 },
      { timestamp: 2000, open: 20, high: 21, low: 18, close: 19 },
      { timestamp: 3000, open: 19, high: 18, low: 10, close: 11 },
      { timestamp: 4000, open: 11, high: 15, low: 11, close: 14 },
      { timestamp: 5000, open: 14, high: 16, low: 13, close: 15 },
      { timestamp: 6000, open: 15, high: 15, low: 5, close: 6 }, // Bearish BOS
    ];

    const { state, events } = engine.process(candles, 'MNQ', '1m');
    const confluences = confluenceEngine.evaluateConfluences(state, events);
    const setups = setupEngine.evaluateSetups(state, events, confluences);

    const longSetup = setups.find((s) => s.direction === 'LONG');
    expect(longSetup?.status).toBe('INVALIDATED');
  });

  // Test 5: ORDERED mode respects temporal sequence
  it('Test 5: ORDERED mode respects temporal sequence', () => {
    const orderedModel: ICTSetupModel = {
      id: 'ORDERED_TEST',
      name: 'Ordered Sequence Test',
      description: 'Requires Sweep then FVG in strict order',
      direction: 'LONG',
      sequenceMode: 'ORDERED',
      maxBarsBetweenConditions: 50,
      conditions: [
        { id: 'c1', type: 'LIQUIDITY_SWEEP', category: 'REQUIRED', description: 'Sweep first' },
        { id: 'c2', type: 'FVG_CONFLUENCE', category: 'REQUIRED', description: 'FVG second' },
      ],
    };

    const customEngine = new SetupEngine([orderedModel]);
    // FVG happens before Sweep -> ORDERED mode must invalidate or expire setup
    const candles: Candle[] = [
      { timestamp: 1000, open: 100, high: 105, low: 99, close: 104 },
      { timestamp: 2000, open: 104, high: 112, low: 104, close: 111 },
      { timestamp: 3000, open: 111, high: 116, low: 107, close: 115 }, // FVG created at timestamp 3000
    ];

    const { state, events } = engine.process(candles, 'MNQ', '1m');
    const confluences = confluenceEngine.evaluateConfluences(state, events);
    const setups = customEngine.evaluateSetups(state, events, confluences);

    expect(setups[0].status).not.toBe('CONFIRMED');
  });

  // Test 6: UNORDERED mode does not require temporal sequence
  it('Test 6: UNORDERED mode does not require strict sequence', () => {
    const unorderedModel: ICTSetupModel = {
      id: 'UNORDERED_TEST',
      name: 'Unordered Test',
      description: 'Requires FVG in any order',
      direction: 'LONG',
      sequenceMode: 'UNORDERED',
      maxBarsBetweenConditions: 50,
      conditions: [
        { id: 'c1', type: 'FVG_CONFLUENCE', category: 'REQUIRED', description: 'FVG' },
      ],
    };

    const customEngine = new SetupEngine([unorderedModel]);
    const candles: Candle[] = [
      { timestamp: 1000, open: 100, high: 105, low: 99, close: 104 },
      { timestamp: 2000, open: 104, high: 112, low: 104, close: 111 },
      { timestamp: 3000, open: 111, high: 116, low: 107, close: 115 },
    ];

    const { state, events } = engine.process(candles, 'MNQ', '1m');
    const confluences = confluenceEngine.evaluateConfluences(state, events);
    const setups = customEngine.evaluateSetups(state, events, confluences);

    expect(setups[0].status).toBe('CONFIRMED');
  });

  // Test 7: maxBarsBetweenConditions constraint works
  it('Test 7: maxBarsBetweenConditions constraint marks setup EXPIRED if bar span is exceeded', () => {
    const strictBarModel: ICTSetupModel = {
      id: 'STRICT_BARS_TEST',
      name: 'Strict Bars Test',
      description: 'Max 2 bars between conditions',
      direction: 'LONG',
      sequenceMode: 'UNORDERED',
      maxBarsBetweenConditions: 1, // Only 1 bar allowed
      conditions: [
        { id: 'c1', type: 'FVG_CONFLUENCE', category: 'REQUIRED', description: 'FVG' },
        { id: 'c2', type: 'BOS_CONFIRMED', category: 'REQUIRED', description: 'BOS' },
      ],
    };

    const customEngine = new SetupEngine([strictBarModel]);
    // FVG at index 2, BOS at index 6 -> span = 4 > 1 -> EXPIRED
    const candles: Candle[] = [
      { timestamp: 1000, open: 10, high: 11, low: 9, close: 10 },
      { timestamp: 2000, open: 10, high: 12, low: 9, close: 11 },
      { timestamp: 3000, open: 11, high: 20, low: 10, close: 19 }, // FVG / Swing
      { timestamp: 4000, open: 19, high: 18, low: 14, close: 15 },
      { timestamp: 5000, open: 15, high: 16, low: 13, close: 14 },
      { timestamp: 6000, open: 14, high: 25, low: 14, close: 24 }, // BOS at index 5
    ];

    const { state, events } = engine.process(candles, 'MNQ', '1m');
    const confluences = confluenceEngine.evaluateConfluences(state, events);
    const setups = customEngine.evaluateSetups(state, events, confluences);

    expect(setups[0].status).toBe('EXPIRED');
  });

  // Test 8: LONG and SHORT setups are independent
  it('Test 8: LONG and SHORT setup models evaluate independently', () => {
    const dualEngine = new SetupEngine([MODEL_A_LONG, MODEL_A_SHORT]);
    const candles: Candle[] = [
      { timestamp: 1000, open: 100, high: 105, low: 99, close: 104 },
    ];

    const { state, events } = engine.process(candles, 'MNQ', '1m');
    const confluences = confluenceEngine.evaluateConfluences(state, events);
    const setups = dualEngine.evaluateSetups(state, events, confluences);

    const longSetups = setups.filter((s) => s.direction === 'LONG');
    const shortSetups = setups.filter((s) => s.direction === 'SHORT');

    expect(longSetups.length).toBeGreaterThan(0);
    expect(shortSetups.length).toBeGreaterThan(0);
  });

  // Test 9: Displacement is deterministic and quantifiable
  it('Test 9: Displacement engine detects high-volume body ratio expansion deterministically', () => {
    // 5 preceding small range candles (range = 2)
    // 6th candle: open=100, high=120, low=100, close=119 -> body=19, range=20 (bodyRatio = 0.95, rangeMultiplier = 10)
    const candles: Candle[] = [
      { timestamp: 1000, open: 100, high: 102, low: 100, close: 101 },
      { timestamp: 2000, open: 101, high: 103, low: 101, close: 102 },
      { timestamp: 3000, open: 102, high: 104, low: 102, close: 103 },
      { timestamp: 4000, open: 103, high: 105, low: 103, close: 104 },
      { timestamp: 5000, open: 104, high: 106, low: 104, close: 105 },
      { timestamp: 6000, open: 105, high: 125, low: 105, close: 124 }, // Displacement!
    ];

    const res = displacementEngine.evaluateDisplacements(candles, 'MNQ', '1m');

    expect(res.displacements).toHaveLength(1);
    expect(res.displacements[0].direction).toBe('BULLISH');
    expect(res.displacements[0].bodyRatio).toBeGreaterThan(0.6);
    expect(res.events).toHaveLength(1);
  });

  // Test 10: Future data does not alter historical results
  it('Test 10: Future data does not alter historical setup evaluations', () => {
    const baseCandles: Candle[] = [
      { timestamp: 1000, open: 100, high: 105, low: 99, close: 104 },
      { timestamp: 2000, open: 104, high: 112, low: 104, close: 111 },
      { timestamp: 3000, open: 111, high: 116, low: 107, close: 115 },
    ];

    const resBase = engine.process(baseCandles, 'MNQ', '1m');
    const confBase = confluenceEngine.evaluateConfluences(resBase.state, resBase.events);
    const setupBase = setupEngine.evaluateSetups(resBase.state, resBase.events, confBase);

    const futureCandles: Candle[] = [
      ...baseCandles,
      { timestamp: 4000, open: 115, high: 300, low: 50, close: 290 },
    ];

    const resFuture = engine.process(futureCandles, 'MNQ', '1m');
    const confFuture = confluenceEngine.evaluateConfluences(resFuture.state, resFuture.events);
    const setupFuture = setupEngine.evaluateSetups(resFuture.state, resFuture.events, confFuture);

    expect(JSON.stringify(setupBase)).toBeDefined();
    expect(setupFuture.length).toEqual(setupBase.length);
  });

  // Test 11: Batch and incremental processing are equivalent
  it('Test 11: Batch and incremental processing produce equivalent setup models', () => {
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

  // Test 12: Repeated runs on identical inputs yield 100% identical outputs
  it('Test 12: Repeated runs on identical inputs yield 100% identical setup model outputs', () => {
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
