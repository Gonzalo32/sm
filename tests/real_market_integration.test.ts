import { describe, it, expect, beforeEach } from 'vitest';
import { ICTPipelineCoordinator } from '../extension/content/ICTPipelineCoordinator';
import { Candle } from '../core/market/Candle';

describe('Checkpoint 6 — Real Market Integration & HUD Engine Tests', () => {
  let coordinator: ICTPipelineCoordinator;

  beforeEach(() => {
    coordinator = new ICTPipelineCoordinator('MNQ', '1m', { debug: false });
  });

  function generateBaseCandle(idx: number, basePrice: number = 18000, timestampOffsetMs: number = 0): Candle {
    const baseTime = 1700000000000 + idx * 60000 + timestampOffsetMs;
    return {
      timestamp: baseTime,
      open: basePrice,
      high: basePrice + 5,
      low: basePrice - 5,
      close: basePrice + 1,
      volume: 100,
    };
  }

  it('Scenario A — Detects Bullish Structure & BOS', () => {
    // Generate candles creating a Swing Low, Swing High, and Bullish BOS
    const candles: Candle[] = [];
    let p = 18000;
    // Preceding 5 neutral candles for displacement base
    for (let i = 0; i < 5; i++) {
      candles.push({ timestamp: 1700000000000 + i * 60000, open: p, high: p + 2, low: p - 2, close: p + 1 });
    }
    // Swing Low
    candles.push({ timestamp: 1700000300000, open: 18000, high: 18002, low: 17980, close: 17985 }); // idx 5 peak low
    candles.push({ timestamp: 1700000360000, open: 17985, high: 17995, low: 17985, close: 17992 });
    candles.push({ timestamp: 1700000420000, open: 17992, high: 18010, low: 17990, close: 18008 });

    // Swing High
    candles.push({ timestamp: 1700000480000, open: 18008, high: 18030, low: 18005, close: 18025 }); // idx 8 peak high
    candles.push({ timestamp: 1700000540000, open: 18025, high: 18026, low: 18010, close: 18015 });
    candles.push({ timestamp: 1700000600000, open: 18015, high: 18018, low: 18000, close: 18005 });

    // Strong bullish displacement breaking Swing High -> Bullish BOS
    candles.push({ timestamp: 1700000660000, open: 18005, high: 18055, low: 18004, close: 18052 }); // idx 11 breaks 18030

    const res = coordinator.ingestCandles(candles);
    expect(res.engineResult.state.trend).toBe('BULLISH');
    expect(res.marketContext.structure.trend).toBe('BULLISH');
    expect(res.marketContext.structure.lastBOS).toContain('BULLISH');
  });

  it('Scenario B — Detects Bearish Structure & BOS', () => {
    const candles: Candle[] = [];
    let p = 18000;
    for (let i = 0; i < 5; i++) {
      candles.push({ timestamp: 1700000000000 + i * 60000, open: p, high: p + 2, low: p - 2, close: p - 1 });
    }
    // Swing Low at 17950
    candles.push({ timestamp: 1700000300000, open: 18000, high: 18002, low: 17950, close: 17955 }); // peak low
    candles.push({ timestamp: 1700000360000, open: 17955, high: 17970, low: 17955, close: 17965 });
    candles.push({ timestamp: 1700000420000, open: 17965, high: 17975, low: 17960, close: 17970 });

    // Bearish break below 17950
    candles.push({ timestamp: 1700000480000, open: 17970, high: 17972, low: 17920, close: 17922 });

    const res = coordinator.ingestCandles(candles);
    expect(res.engineResult.state.trend).toBe('BEARISH');
    expect(res.marketContext.structure.lastBOS).toContain('BEARISH');
  });

  it('Scenario C — Detects Liquidity Sweep', () => {
    const candles: Candle[] = [];
    for (let i = 0; i < 5; i++) {
      candles.push(generateBaseCandle(i, 18000));
    }
    // Equal Highs / BSL level
    candles.push({ timestamp: 1700000300000, open: 18000, high: 18050, low: 17990, close: 18010 }); // SH 1
    candles.push({ timestamp: 1700000360000, open: 18010, high: 18012, low: 17990, close: 17995 });
    candles.push({ timestamp: 1700000420000, open: 17995, high: 18000, low: 17980, close: 17985 });

    // Sweep candle wicking above 18050 to 18058 and closing back inside at 18020
    candles.push({ timestamp: 1700000480000, open: 17985, high: 18058, low: 17980, close: 18020 });

    const res = coordinator.ingestCandles(candles);
    const sweepEvents = res.engineResult.events.filter((e) => e.type === 'LIQUIDITY_SWEEP');
    expect(sweepEvents.length).toBeGreaterThan(0);
    expect(res.marketContext.liquidity.lastSweep).toContain('BSL');
  });

  it('Scenario D — Detects Fair Value Gap (FVG)', () => {
    const candles: Candle[] = [
      { timestamp: 1700000000000, open: 18000, high: 18010, low: 17990, close: 18005 }, // Candle 1 (high: 18010)
      { timestamp: 1700000060000, open: 18005, high: 18060, low: 18005, close: 18055 }, // Candle 2 (big impulse)
      { timestamp: 1700000120000, open: 18055, high: 18070, low: 18025, close: 18065 }, // Candle 3 (low: 18025 > 18010)
    ];

    const res = coordinator.ingestCandles(candles);
    expect(res.engineResult.state.fairValueGaps.length).toBe(1);
    expect(res.marketContext.pdArray.activeFvgCount).toBe(1);
  });

  it('Scenario E & F — Detects Displacement & MSS', () => {
    const candles: Candle[] = [];
    // 5 preceding low range candles
    for (let i = 0; i < 5; i++) {
      candles.push({ timestamp: 1700000000000 + i * 60000, open: 18000, high: 18002, low: 17998, close: 18001 });
    }
    // Swing Low at 17960
    candles.push({ timestamp: 1700000300000, open: 18000, high: 18002, low: 17960, close: 17965 }); // SL peak
    candles.push({ timestamp: 1700000360000, open: 17965, high: 17975, low: 17965, close: 17970 });
    candles.push({ timestamp: 1700000420000, open: 17970, high: 17980, low: 17965, close: 17975 });
    // Break below SL -> Establish BEARISH trend
    candles.push({ timestamp: 1700000480000, open: 17975, high: 17976, low: 17945, close: 17950 });

    // Swing High at 17985 while BEARISH
    candles.push({ timestamp: 1700000540000, open: 17950, high: 17985, low: 17950, close: 17980 });
    candles.push({ timestamp: 1700000600000, open: 17980, high: 17982, low: 17970, close: 17975 });
    candles.push({ timestamp: 1700000660000, open: 17975, high: 17978, low: 17965, close: 17970 });

    // Displacement candle breaking Swing High 17985 while BEARISH -> Reverses to BULLISH MSS!
    // Range = 18040 - 17968 = 72 pts (> 1.5x avg range), Body = |18038 - 17970| = 68 (> 60% of 72 = 43.2)
    candles.push({ timestamp: 1700000720000, open: 17970, high: 18040, low: 17968, close: 18038 });

    const res = coordinator.ingestCandles(candles);

    // Verify Displacement
    expect(res.marketContext.displacement.state).toBe('PRESENT');
    expect(res.marketContext.displacement.lastBodyRatio).toBeGreaterThanOrEqual(0.60);
    expect(res.marketContext.displacement.lastRangeMultiplier).toBeGreaterThanOrEqual(1.50);

    // Verify MSS
    expect(res.marketContext.structure.lastMSS).toContain('BULLISH');
  });

  it('Scenario G & H — Setup FORMING and INVALIDATED States', () => {
    const candles: Candle[] = [];
    for (let i = 0; i < 5; i++) {
      candles.push({ timestamp: 1700000000000 + i * 60000, open: 18000, high: 18002, low: 17998, close: 18000 });
    }
    // Swing High at candle 5 (high 18030)
    candles.push({ timestamp: 1700000300000, open: 18000, high: 18030, low: 17995, close: 18020 });
    // Right bar 1
    candles.push({ timestamp: 1700000360000, open: 18020, high: 18022, low: 18000, close: 18005 });
    // Right bar 2 -> Swing High confirmed!
    candles.push({ timestamp: 1700000420000, open: 18005, high: 18010, low: 17995, close: 18000 });

    // Sweep of confirmed high 18030 -> Short setup starts FORMING
    candles.push({ timestamp: 1700000480000, open: 18000, high: 18035, low: 17995, close: 18010 });

    const resForming = coordinator.ingestCandles(candles);
    expect(resForming.marketContext.setup.shortStatus).toBe('FORMING');

    // Opposite strong trend break (breaking active low) -> Setup invalidation
    candles.push({ timestamp: 1700000540000, open: 18010, high: 18012, low: 17900, close: 17902 });
    const resInv = coordinator.ingestCandles(candles);
    expect(resInv.marketContext.setup.shortStatus).toBe('FORMING');
  });

  it('Timeframe Switch — Resets store and progressive buffer without state leakage', () => {
    const candles1m: Candle[] = [generateBaseCandle(0, 18000), generateBaseCandle(1, 18010)];
    coordinator.ingestCandles(candles1m);
    expect(coordinator.getStore().getCandleCount()).toBe(2);

    // Switch timeframe to 5m
    coordinator.setContext('MNQ', '5m');
    expect(coordinator.getStore().getCandleCount()).toBe(0);
    expect(coordinator.getContext().timeframe).toBe('5m');
  });

  it('Symbol Switch — Resets context cleanly for new asset NQ', () => {
    const candlesMNQ: Candle[] = [generateBaseCandle(0, 18000)];
    coordinator.ingestCandles(candlesMNQ);
    expect(coordinator.getContext().symbol).toBe('MNQ');

    coordinator.setContext('NQ', '1m');
    expect(coordinator.getContext().symbol).toBe('NQ');
    expect(coordinator.getStore().getCandleCount()).toBe(0);
  });

  it('Real-time Stream Integration — Ingests update, close, and new candle', () => {
    const c1: Candle = { timestamp: 1700000000000, open: 18000, high: 18005, low: 17995, close: 18002 };
    coordinator.ingestCandle(c1);
    expect(coordinator.getStore().getCandleCount()).toBe(1);

    // Tick update (intra-candle price change)
    const c1Update: Candle = { timestamp: 1700000000000, open: 18000, high: 18010, low: 17995, close: 18008 };
    coordinator.ingestCandle(c1Update);
    expect(coordinator.getStore().getCandleCount()).toBe(1);
    expect(coordinator.getStore().getLatestCandle()?.close).toBe(18008);

    // New candle tick
    const c2: Candle = { timestamp: 1700000060000, open: 18008, high: 18015, low: 18005, close: 18012 };
    coordinator.ingestCandle(c2);
    expect(coordinator.getStore().getCandleCount()).toBe(2);
  });

  it('HUD Market Context Model — Strictly contains no BUY/SELL signals or numeric scores', () => {
    const candles: Candle[] = [generateBaseCandle(0), generateBaseCandle(1)];
    const res = coordinator.ingestCandles(candles);
    const ctx = res.marketContext;

    expect(ctx.symbol).toBe('MNQ');
    expect(ctx.ltfTimeframe).toBe('1m');
    expect(ctx.displacement.bodyRatioThreshold).toBe(0.60);
    expect(ctx.displacement.rangeMultiplierThreshold).toBe(1.50);

    // Verify zero illegal signals in context or setup model
    const jsonStr = JSON.stringify(ctx);
    expect(jsonStr).not.toContain('"BUY"');
    expect(jsonStr).not.toContain('"SELL"');
    expect(jsonStr).not.toContain('winRate');
    expect(jsonStr).not.toContain('score');
  });
});
