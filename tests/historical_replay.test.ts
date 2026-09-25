import { describe, it, expect, beforeEach } from 'vitest';
import { ReplayEngine } from '../core/ict/replay/ReplayEngine';
import { ICTPipelineCoordinator } from '../extension/content/ICTPipelineCoordinator';
import { ICTEngine } from '../core/ict/engine/ICTEngine';
import { Candle } from '../core/market/Candle';

describe('Checkpoint 9 — Historical Replay & Market Context Validation Tests', () => {
  let replayEngine: ReplayEngine;
  let coordinator: ICTPipelineCoordinator;
  let singleEngine: ICTEngine;

  beforeEach(() => {
    replayEngine = new ReplayEngine('MNQ', '1m');
    coordinator = new ICTPipelineCoordinator('MNQ', '1m', { debug: false });
    singleEngine = new ICTEngine();
  });

  function makeBaseCandles(count: number = 10, startPrice: number = 18000): Candle[] {
    const candles: Candle[] = [];
    for (let i = 0; i < count; i++) {
      candles.push({
        timestamp: 1700000000000 + i * 60000,
        open: startPrice + (i % 2 === 0 ? 1 : -1),
        high: startPrice + 5,
        low: startPrice - 5,
        close: startPrice + (i % 2 === 0 ? 3 : -3),
        volume: 100 + i * 10,
      });
    }
    return candles;
  }

  it('Test 1 — Basic Replay Dataset Loading & Initial State', () => {
    const dataset = makeBaseCandles(20);
    const state = replayEngine.loadDataset(dataset, 'MNQ', '1m');

    expect(state.symbol).toBe('MNQ');
    expect(state.timeframe).toBe('1m');
    expect(state.totalCandles).toBe(20);
    expect(state.currentIndex).toBe(0);
    expect(state.isPlaying).toBe(false);
    expect(replayEngine.getCurrentSlice().length).toBe(1);
  });

  it('Test 2 — Step Forward Advances Replay Index One Candle at a Time', () => {
    const dataset = makeBaseCandles(20);
    replayEngine.loadDataset(dataset);

    const s1 = replayEngine.stepForward(1);
    expect(s1.currentIndex).toBe(1);
    expect(replayEngine.getCurrentSlice().length).toBe(2);

    const s2 = replayEngine.stepForward(5);
    expect(s2.currentIndex).toBe(6);
    expect(replayEngine.getCurrentSlice().length).toBe(7);
  });

  it('Test 3 — Step Backward Reconstructs Valid Past Slice', () => {
    const dataset = makeBaseCandles(20);
    replayEngine.loadDataset(dataset);
    replayEngine.stepForward(10); // Index 10

    const sBack = replayEngine.stepBackward(); // Index 9
    expect(sBack.currentIndex).toBe(9);
    expect(replayEngine.getCurrentSlice().length).toBe(10);
    expect(replayEngine.getCurrentSlice()[9].timestamp).toBe(dataset[9].timestamp);
  });

  it('Test 4 — Reset Restores Replay to Initial Index 0', () => {
    const dataset = makeBaseCandles(20);
    replayEngine.loadDataset(dataset);
    replayEngine.stepForward(15);

    const sReset = replayEngine.reset();
    expect(sReset.currentIndex).toBe(0);
    expect(replayEngine.getCurrentSlice().length).toBe(1);
  });

  it('Test 5 — Play & Pause Control Execution Flow', () => {
    const dataset = makeBaseCandles(20);
    replayEngine.loadDataset(dataset);

    const sPlay = replayEngine.play(100);
    expect(sPlay.isPlaying).toBe(true);

    const sPause = replayEngine.pause();
    expect(sPause.isPlaying).toBe(false);
  });

  it('Test 6 — Replay Determinism: Multiple runs produce 100% identical outcomes', () => {
    const dataset = makeBaseCandles(15);

    const r1 = new ReplayEngine();
    r1.loadDataset(dataset);
    r1.stepForward(10);
    const slice1 = r1.getCurrentSlice();

    const r2 = new ReplayEngine();
    r2.loadDataset(dataset);
    r2.stepForward(10);
    const slice2 = r2.getCurrentSlice();

    expect(JSON.stringify(slice1)).toBe(JSON.stringify(slice2));
  });

  it('Test 7 — Replay vs Batch Equivalence: ReplayState(i) === BatchProcess(candles[0..i])', () => {
    const dataset = makeBaseCandles(10);
    // Add displacement candle at index 7
    dataset[7] = { timestamp: 1700000000000 + 7 * 60000, open: 18000, high: 18060, low: 17998, close: 18055, volume: 500 };

    coordinator.loadReplayDataset(dataset);
    const replayRes = coordinator.evaluateSlice(dataset.slice(0, 8)); // Slice 0..7

    const batchRes = singleEngine.process(dataset.slice(0, 8), 'MNQ', '1m');

    expect(replayRes.engineResult.events.length).toBe(batchRes.events.length);
    expect(replayRes.engineResult.state.trend).toBe(batchRes.state.trend);
    expect(JSON.stringify(replayRes.engineResult.events)).toBe(JSON.stringify(batchRes.events));
  });

  it('Test 8 — Future-Data Injection Test: Extreme future modifications DO NOT alter past state at index N', () => {
    const datasetNormal = makeBaseCandles(15);
    datasetNormal[5] = { timestamp: 1700000000000 + 5 * 60000, open: 18000, high: 18050, low: 17998, close: 18048, volume: 500 };

    // Process slice 0..5 on normal dataset
    const resNormal = singleEngine.process(datasetNormal.slice(0, 6), 'MNQ', '1m');

    // Create Dataset B with aggressive future modifications in candles 6..14 (extreme high 99999, crash to 1, mega FVG)
    const datasetInjected = JSON.parse(JSON.stringify(datasetNormal));
    datasetInjected[6] = { timestamp: 1700000000000 + 6 * 60000, open: 18048, high: 99999, low: 1000, close: 99900, volume: 99999 };
    datasetInjected[7] = { timestamp: 1700000000000 + 7 * 60000, open: 99900, high: 99999, low: 1, close: 2, volume: 99999 };

    // Replay evaluation at index 5 on injected dataset MUST evaluate slice 0..5 ONLY
    coordinator.loadReplayDataset(datasetInjected);
    const resInjected = coordinator.evaluateSlice(datasetInjected.slice(0, 6));

    expect(resInjected.engineResult.events.length).toBe(resNormal.events.length);
    expect(resInjected.marketContext.structure.trend).toBe(resNormal.state.trend);
    expect(JSON.stringify(resInjected.engineResult.events)).toBe(JSON.stringify(resNormal.events));
  });

  it('Test 9 — confirmationTimestamp vs eventTimestamp Visibility Constraint', () => {
    const candles = makeBaseCandles(10);
    // Swing High at candle 3 (timestamp 1700000180000)
    candles[3] = { timestamp: 1700000180000, open: 18000, high: 18050, low: 17995, close: 18020, volume: 100 };
    candles[4] = { timestamp: 1700000240000, open: 18020, high: 18022, low: 18000, close: 18005, volume: 100 };
    candles[5] = { timestamp: 1700000300000, open: 18005, high: 18010, low: 17995, close: 18000, volume: 100 }; // 2 right bars -> confirmed at candle 5

    const resAt3 = singleEngine.process(candles.slice(0, 4), 'MNQ', '1m'); // slice up to candle 3
    const swingAt3 = resAt3.events.find((e) => e.type === 'SWING_HIGH');
    expect(swingAt3).toBeUndefined(); // Swing NOT visible/confirmed at index 3

    const resAt5 = singleEngine.process(candles.slice(0, 6), 'MNQ', '1m'); // slice up to candle 5
    const swingAt5 = resAt5.events.find((e) => e.type === 'SWING_HIGH');
    expect(swingAt5).toBeDefined();
    expect(swingAt5?.eventTimestamp).toBe(candles[3].timestamp);
    expect(swingAt5?.confirmationTimestamp).toBe(candles[5].timestamp);
  });

  it('Test 10 — Event Timestamp Immutability under Future Candles', () => {
    const candles = makeBaseCandles(10);
    candles[5] = { timestamp: 1700000000000 + 5 * 60000, open: 18000, high: 18050, low: 17998, close: 18048 };

    const res1 = singleEngine.process(candles.slice(0, 6), 'MNQ', '1m');
    const disp1 = res1.events.find((e) => e.type === 'DISPLACEMENT');

    const longCandles = makeBaseCandles(30);
    longCandles[5] = { ...candles[5] };

    const res2 = singleEngine.process(longCandles.slice(0, 30), 'MNQ', '1m');
    const disp2 = res2.events.find((e) => e.type === 'DISPLACEMENT');

    expect(disp1?.eventTimestamp).toBe(disp2?.eventTimestamp);
    expect(disp1?.confirmationTimestamp).toBe(disp2?.confirmationTimestamp);
  });

  it('Test 11 — Symbol Reset during Replay', () => {
    const dataset = makeBaseCandles(10);
    coordinator.loadReplayDataset(dataset, 'MNQ', '1m');
    expect(coordinator.getContext().symbol).toBe('MNQ');

    coordinator.loadReplayDataset(dataset, 'NQ', '1m');
    expect(coordinator.getContext().symbol).toBe('NQ');
  });

  it('Test 12 — Timeframe Reset during Replay', () => {
    const dataset = makeBaseCandles(10);
    coordinator.loadReplayDataset(dataset, 'MNQ', '1m');
    expect(coordinator.getContext().timeframe).toBe('1m');

    coordinator.loadReplayDataset(dataset, 'MNQ', '5m');
    expect(coordinator.getContext().timeframe).toBe('5m');
  });

  it('Test 13 — ICTMarketContext Equivalence during Replay', () => {
    const dataset = makeBaseCandles(10);
    coordinator.loadReplayDataset(dataset);

    const r1 = coordinator.evaluateSlice(dataset.slice(0, 5));
    const r2 = coordinator.evaluateSlice(dataset.slice(0, 5));

    expect(JSON.stringify(r1.marketContext)).toBe(JSON.stringify(r2.marketContext));
  });

  it('Test 14 — SetupEngine State Machine Equivalence during Replay', () => {
    const dataset = makeBaseCandles(10);
    coordinator.loadReplayDataset(dataset);

    const r1 = coordinator.evaluateSlice(dataset.slice(0, 8));
    const r2 = coordinator.evaluateSlice(dataset.slice(0, 8));

    expect(r1.marketContext.setup.status).toBe(r2.marketContext.setup.status);
    expect(r1.marketContext.setup.longStatus).toBe(r2.marketContext.setup.longStatus);
  });

  it('Test 15 — Assistant Narrative Summary Equivalence during Replay Step', () => {
    const dataset = makeBaseCandles(10);
    coordinator.loadReplayDataset(dataset);

    const r1 = coordinator.evaluateSlice(dataset.slice(0, 6));
    const r2 = coordinator.evaluateSlice(dataset.slice(0, 6));

    expect(r1.marketContext.narrativeText).toBe(r2.marketContext.narrativeText);
  });
});
