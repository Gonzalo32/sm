import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ICTPipelineCoordinator } from '../extension/content/ICTPipelineCoordinator';
import { Candle } from '../core/market/Candle';

function makeCandle(
  timestamp: number,
  open: number,
  high: number,
  low: number,
  close: number,
  volume: number = 100
): Candle {
  return {
    timestamp,
    open,
    high,
    low,
    close,
    volume,
  };
}

describe('CP102 — Stage 2: Analytical History Boundary & Integration Tests', () => {
  let coordinator: ICTPipelineCoordinator;

  beforeEach(() => {
    coordinator = new ICTPipelineCoordinator('MNQ', '1m', { debug: false });
  });

  // 1. A historical batch with multiple distinct timestamps is ingested without losing valid candles
  it('1. should ingest multi-bar historical batch without losing valid candles', () => {
    const batch: Candle[] = [];
    const baseTime = 1728800000000;
    const interval = 60000; // 1m

    for (let i = 0; i < 15; i++) {
      batch.push(makeCandle(baseTime + i * interval, 21000 + i, 21010 + i, 20990 + i, 21005 + i));
    }

    const res = coordinator.ingestCandles(batch);
    expect(res).toBeDefined();

    const stored = coordinator.getStore().getCandles();
    expect(stored.length).toBe(15);
    for (let i = 0; i < 15; i++) {
      expect(stored[i].timestamp).toBe(baseTime + i * interval);
      expect(stored[i].open).toBe(21000 + i);
    }
  });

  // 2. Re-ingesting the same batch does not create duplicate candles
  it('2. should not create duplicate candles when re-ingesting identical batch', () => {
    const batch: Candle[] = [];
    const baseTime = 1728800000000;
    const interval = 60000;

    for (let i = 0; i < 10; i++) {
      batch.push(makeCandle(baseTime + i * interval, 21000 + i, 21010 + i, 20990 + i, 21005 + i));
    }

    coordinator.ingestCandles(batch);
    expect(coordinator.getStore().getCandleCount()).toBe(10);

    // Re-ingest the exact same batch
    coordinator.ingestCandles(batch);
    expect(coordinator.getStore().getCandleCount()).toBe(10);

    const stored = coordinator.getStore().getCandles();
    const timestamps = stored.map((c) => c.timestamp);
    const uniqueTimestamps = new Set(timestamps);
    expect(uniqueTimestamps.size).toBe(10);
  });

  // 3. A batch followed by a live update preserves correct ordering and streaming continuity
  it('3. should preserve correct ordering and streaming continuity after batch ingestion', () => {
    const batch: Candle[] = [];
    const baseTime = 1728800000000;
    const interval = 60000;

    for (let i = 0; i < 10; i++) {
      batch.push(makeCandle(baseTime + i * interval, 21000 + i, 21010 + i, 20990 + i, 21005 + i));
    }

    coordinator.ingestCandles(batch);
    expect(coordinator.getStore().getCandleCount()).toBe(10);

    // Ingest new live streaming candle
    const liveCandle1 = makeCandle(baseTime + 10 * interval, 21020, 21035, 21015, 21030);
    coordinator.ingestCandle(liveCandle1);
    expect(coordinator.getStore().getCandleCount()).toBe(11);

    // Ingest tick update for same forming candle (higher high)
    const liveCandle1Update = makeCandle(baseTime + 10 * interval, 21020, 21045, 21015, 21040);
    coordinator.ingestCandle(liveCandle1Update);
    expect(coordinator.getStore().getCandleCount()).toBe(11);
    expect(coordinator.getStore().getLatestCandle()?.high).toBe(21045);

    // Re-ingesting older historical batch must NOT overwrite newer streaming candle
    coordinator.ingestCandles(batch);
    expect(coordinator.getStore().getCandleCount()).toBe(11);
    expect(coordinator.getStore().getLatestCandle()?.timestamp).toBe(baseTime + 10 * interval);

    // Verify strict ascending order
    const stored = coordinator.getStore().getCandles();
    for (let i = 0; i < stored.length - 1; i++) {
      expect(stored[i].timestamp).toBeLessThan(stored[i + 1].timestamp);
    }
  });

  // 4. A symbol/timeframe switch does not mix candles from different contexts
  it('4. should purge candle store on context switch and not leak prior candles', () => {
    const batchMNQ: Candle[] = [
      makeCandle(100000, 21000, 21010, 20990, 21005),
      makeCandle(160000, 21005, 21020, 21000, 21015),
    ];

    coordinator.ingestCandles(batchMNQ);
    expect(coordinator.getStore().getCandleCount()).toBe(2);
    expect(coordinator.getContext().symbol).toBe('MNQ');
    expect(coordinator.getContext().timeframe).toBe('1m');

    // Switch to NQ 5m
    coordinator.setContext('NQ', '5m');
    expect(coordinator.getContext().symbol).toBe('NQ');
    expect(coordinator.getContext().timeframe).toBe('5m');
    expect(coordinator.getStore().getCandleCount()).toBe(0);

    // Ingest NQ 5m batch
    const batchNQ: Candle[] = [
      makeCandle(500000, 19500, 19550, 19480, 19520),
      makeCandle(800000, 19520, 19570, 19510, 19560),
      makeCandle(1100000, 19560, 19590, 19540, 19580),
    ];

    coordinator.ingestCandles(batchNQ);
    expect(coordinator.getStore().getCandleCount()).toBe(3);

    const stored = coordinator.getStore().getCandles();
    for (const c of stored) {
      expect(c.open).toBeLessThan(20000); // Only NQ candles
      expect(c.timestamp).toBeGreaterThanOrEqual(500000);
    }
  });

  // 5. The final unconfirmed candle is excluded from closed-history analysis input
  it('5. should exclude the final unconfirmed candle from analysis-eligible input', () => {
    const batch: Candle[] = [];
    const baseTime = 1728800000000;
    const interval = 60000;

    for (let i = 0; i < 32; i++) {
      batch.push(makeCandle(baseTime + i * interval, 21000 + i, 21010 + i, 20990 + i, 21005 + i));
    }

    coordinator.ingestCandles(batch);
    expect(coordinator.getStore().getCandleCount()).toBe(32);

    const eligible = coordinator.getAnalysisEligibleCandles();
    expect(eligible.length).toBe(31); // 32 - 1 = 31 confirmed closed bars
    expect(eligible[eligible.length - 1].timestamp).toBe(baseTime + 30 * interval);
    expect(eligible.some((c) => c.timestamp === baseTime + 31 * interval)).toBe(false);

    // Edge case: single candle cannot confirm closure
    const singleCandleCoord = new ICTPipelineCoordinator('MNQ', '1m', { debug: false });
    singleCandleCoord.ingestCandle(makeCandle(baseTime, 21000, 21010, 20990, 21005));
    expect(singleCandleCoord.getStore().getCandleCount()).toBe(1);
    expect(singleCandleCoord.getAnalysisEligibleCandles().length).toBe(0);
  });

  // 6. Excluding a candle from analysis does not accidentally delete it from the underlying store
  it('6. should retain unconfirmed candle in store when analysis consumes closed slice', async () => {
    const batch: Candle[] = [];
    const baseTime = 1728800000000;
    const interval = 60000;

    for (let i = 0; i < 20; i++) {
      batch.push(makeCandle(baseTime + i * interval, 21000 + i, 21010 + i, 20990 + i, 21005 + i));
    }

    coordinator.ingestCandles(batch);
    expect(coordinator.getStore().getCandleCount()).toBe(20);

    const eligible = coordinator.getAnalysisEligibleCandles();
    expect(eligible.length).toBe(19);

    // Run market analysis
    await coordinator.runMarketAnalysis();

    // Store must STILL have all 20 candles
    expect(coordinator.getStore().getCandleCount()).toBe(20);
    expect(coordinator.getStore().getLatestCandle()?.timestamp).toBe(baseTime + 19 * interval);
  });

  // 7. Manual analysis does not create forecast journal or S10 recorder writes
  it('7. should execute manual analysis transiently without writing to forecast journal or S10', async () => {
    const batch: Candle[] = [];
    const baseTime = 1728800000000;
    const interval = 60000;

    for (let i = 0; i < 35; i++) {
      batch.push(makeCandle(baseTime + i * interval, 21000 + i, 21010 + i, 20990 + i, 21005 + i));
    }

    coordinator.ingestCandles(batch);

    // Spy on recordForecast to verify it is NOT called during default manual analysis
    const journalSpy = vi.spyOn(coordinator.getMarketAnalystJournal(), 'recordForecast');

    const analysis = await coordinator.runMarketAnalysis();

    expect(analysis).toBeDefined();
    expect(analysis.instrument).toBe('MNQ');
    expect(analysis.timeframe).toBe('1m');
    expect(coordinator.getLastAnalysis()).toBe(analysis);

    // Must NOT write to journal (transient execution contract)
    expect(journalSpy).not.toHaveBeenCalled();

    journalSpy.mockRestore();
  });

  // 8. Existing streaming behavior remains unchanged
  it('8. should maintain existing single-candle streaming behavior and progressive evaluation', () => {
    const baseTime = 1728800000000;
    const interval = 60000;

    const c1 = makeCandle(baseTime, 21000, 21020, 20980, 21010);
    const res1 = coordinator.ingestCandle(c1);

    expect(res1).toBeDefined();
    expect(res1.engineResult.state.symbol).toBe('MNQ');
    expect(res1.engineResult.state.timeframe).toBe('1m');
    expect(coordinator.getStore().getCandleCount()).toBe(1);

    // Next bar closes previous and appends
    const c2 = makeCandle(baseTime + interval, 21010, 21030, 21000, 21025);
    const res2 = coordinator.ingestCandle(c2);

    expect(coordinator.getStore().getCandleCount()).toBe(2);
    expect(res2.engineResult.state.lastUpdatedTimestamp).toBe(baseTime + interval);
  });
});
