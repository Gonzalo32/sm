import { describe, it, expect } from 'vitest';
import { MarketAnalystEngine } from '../core/analyst/MarketAnalystEngine';
import { Candle, Timeframe } from '../core/market/Candle';
import { ICTMarketState } from '../core/ict/types/MarketState';
import { LiquiditySweepEvent } from '../core/ict/types/ICTEvent';
import { SwingPoint, SwingType } from '../core/ict/types/SwingPoint';
import { LiquidityLevel, LiquidityType } from '../core/ict/types/Liquidity';
import { DealingRange, PriceZone } from '../core/ict/types/PDArrays';
import { FairValueGap } from '../core/ict/types/FVG';

function createMockSwing(id: string, type: SwingType, price: number, timestamp: number, candleIndex: number): SwingPoint {
  return {
    id,
    symbol: 'MNQZ6',
    timeframe: '1m',
    candleIndex,
    timestamp,
    eventTimestamp: timestamp,
    confirmationTimestamp: timestamp,
    price,
    type,
    strength: 3,
    confirmed: true,
    classification: 'EXTERNAL',
    broken: false,
  };
}

function createMockLiquidity(id: string, type: LiquidityType, price: number, swept: boolean = false): LiquidityLevel {
  return {
    id,
    symbol: 'MNQZ6',
    timeframe: '1m',
    price,
    type,
    category: type === 'BSL' ? 'SWING_HIGH' : 'SWING_LOW',
    swings: [],
    swept,
  };
}

function createMockDealingRange(rangeHigh: number, rangeLow: number, currentZone: PriceZone, currentPrice: number = (rangeHigh + rangeLow) / 2): DealingRange {
  return {
    symbol: 'MNQZ6',
    timeframe: '1m',
    rangeHigh,
    rangeLow,
    equilibrium: (rangeHigh + rangeLow) / 2,
    currentPrice,
    currentZone,
    timestamp: Date.now(),
  };
}

function generateCandleSeries(
  count: number,
  startPrice: number,
  direction: 'UP' | 'DOWN' | 'FLAT',
  timeframe: Timeframe = '1m',
  baseTimestampMs: number = Date.now() - 60000 * 50
): Candle[] {
  const candles: Candle[] = [];
  let price = startPrice;
  const intervalMs = 60000;

  for (let i = 0; i < count; i++) {
    const timestamp = baseTimestampMs + i * intervalMs;
    const delta = direction === 'UP' ? 1.5 : direction === 'DOWN' ? -1.5 : 0;
    const open = price;
    const close = price + delta;
    const high = Math.max(open, close) + 0.75;
    const low = Math.min(open, close) - 0.75;
    price = close;

    candles.push({
      symbol: 'MNQZ6',
      timeframe,
      timestamp,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: 100,
    });
  }
  return candles;
}

describe('TradeSea Market Analyst — Scenario Evaluation & Target Derivation', () => {
  const baseEngine = new MarketAnalystEngine();

  it('1. Derives Bullish scenario with structural targets and invalidation', () => {
    const now = Date.now();
    const candles = generateCandleSeries(40, 20000, 'UP', '1m', now - 40 * 60000);
    const lastClose = candles[candles.length - 1].close; // ~20060

    const state: ICTMarketState = {
      symbol: 'MNQZ6',
      timeframe: '1m',
      lastUpdatedTimestamp: candles[candles.length - 1].timestamp,
      lastCandleIndex: candles.length - 1,
      trend: 'BULLISH',
      swings: [
        createMockSwing('SW_1', 'SWING_LOW', 20020, now - 15 * 60000, 25),
        createMockSwing('SW_2', 'SWING_HIGH', 20070, now - 5 * 60000, 35),
      ],
      activeSwingHigh: createMockSwing('SW_HIGH_ACT', 'SWING_HIGH', 20180, now - 30 * 60000, 10),
      activeSwingLow: createMockSwing('SW_LOW_ACT', 'SWING_LOW', 20020, now - 15 * 60000, 25),
      liquidityLevels: [
        createMockLiquidity('BSL_1', 'BSL', 20130, false),
        createMockLiquidity('BSL_2', 'BSL', 20180, false),
      ],
      fairValueGaps: [],
      orderBlocks: [],
      dealingRange: createMockDealingRange(20180, 19980, 'DISCOUNT', lastClose),
    };

    const sweepEvent: LiquiditySweepEvent = {
      type: 'LIQUIDITY_SWEEP',
      symbol: 'MNQZ6',
      timeframe: '1m',
      timestamp: now - 10 * 60000,
      eventTimestamp: now - 10 * 60000,
      confirmationTimestamp: now - 10 * 60000,
      candleIndex: 30,
      sweep: {
        id: 'SWEEP_SSL_1',
        symbol: 'MNQZ6',
        timeframe: '1m',
        liquidityLevelId: 'SSL_POOL',
        liquidityType: 'SSL',
        levelPrice: 20030,
        extremePrice: 20015,
        sweepTimestamp: now - 10 * 60000,
        candleIndex: 30,
        confirmed: true,
      },
    };

    const analysis = baseEngine.analyze(candles, state, [sweepEvent], [], undefined, now);

    expect(analysis.status).toBe('ANALYSIS_READY');
    expect(analysis.preferredDirection).toBe('BULLISH');
    expect(analysis.selectedScenario).toBeDefined();

    const bull = analysis.bullishScenario;
    expect(bull).toBeDefined();
    expect(bull!.direction).toBe('BULLISH');
    expect(bull!.referencePrice).toBe(lastClose);

    // Nearby target should be BSL_1 at 20130
    expect(bull!.nearbyTarget).toBeDefined();
    expect(bull!.nearbyTarget!.price).toBe(20130);
    expect(bull!.nearbyTarget!.structuralSource).toBe('LIQUIDITY_POOL');

    // Extended target should be BSL_2 at 20180
    expect(bull!.extendedTarget).toBeDefined();
    expect(bull!.extendedTarget!.price).toBe(20180);
    expect(bull!.extendedTarget!.structuralSource).toBe('LIQUIDITY_POOL');

    // Invalidation level derived from SSL sweep extreme (20015)
    expect(bull!.invalidationLevel).toBe(20015);
    expect(bull!.invalidationRationale).toContain('Liquidity sweep extreme');

    // Supporting evidence
    expect(bull!.supportingEvidence.some((e) => e.includes('Bullish'))).toBe(true);
    expect(bull!.supportingEvidence.some((e) => e.includes('Discount'))).toBe(true);
    expect(bull!.supportingEvidence.some((e) => e.includes('SSL'))).toBe(true);
  });

  it('2. Derives Bearish scenario with structural targets and invalidation', () => {
    const now = Date.now();
    const candles = generateCandleSeries(40, 20100, 'DOWN', '1m', now - 40 * 60000);
    const lastClose = candles[candles.length - 1].close; // ~20040

    const state: ICTMarketState = {
      symbol: 'MNQZ6',
      timeframe: '1m',
      lastUpdatedTimestamp: candles[candles.length - 1].timestamp,
      lastCandleIndex: candles.length - 1,
      trend: 'BEARISH',
      swings: [
        createMockSwing('SW_1', 'SWING_HIGH', 20080, now - 15 * 60000, 25),
        createMockSwing('SW_2', 'SWING_LOW', 20030, now - 5 * 60000, 35),
      ],
      activeSwingHigh: createMockSwing('SW_HIGH_ACT', 'SWING_HIGH', 20080, now - 15 * 60000, 25),
      activeSwingLow: createMockSwing('SW_LOW_ACT', 'SWING_LOW', 19920, now - 30 * 60000, 10),
      liquidityLevels: [
        createMockLiquidity('SSL_1', 'SSL', 19970, false),
        createMockLiquidity('SSL_2', 'SSL', 19920, false),
      ],
      fairValueGaps: [],
      orderBlocks: [],
      dealingRange: createMockDealingRange(20120, 19920, 'PREMIUM', lastClose),
    };

    const sweepEvent: LiquiditySweepEvent = {
      type: 'LIQUIDITY_SWEEP',
      symbol: 'MNQZ6',
      timeframe: '1m',
      timestamp: now - 10 * 60000,
      eventTimestamp: now - 10 * 60000,
      confirmationTimestamp: now - 10 * 60000,
      candleIndex: 30,
      sweep: {
        id: 'SWEEP_BSL_1',
        symbol: 'MNQZ6',
        timeframe: '1m',
        liquidityLevelId: 'BSL_POOL',
        liquidityType: 'BSL',
        levelPrice: 20070,
        extremePrice: 20085,
        sweepTimestamp: now - 10 * 60000,
        candleIndex: 30,
        confirmed: true,
      },
    };

    const analysis = baseEngine.analyze(candles, state, [sweepEvent], [], undefined, now);

    expect(analysis.status).toBe('ANALYSIS_READY');
    expect(analysis.preferredDirection).toBe('BEARISH');
    expect(analysis.selectedScenario).toBeDefined();

    const bear = analysis.bearishScenario;
    expect(bear).toBeDefined();
    expect(bear!.direction).toBe('BEARISH');
    expect(bear!.referencePrice).toBe(lastClose);

    // Nearby target should be SSL_1 at 19970
    expect(bear!.nearbyTarget).toBeDefined();
    expect(bear!.nearbyTarget!.price).toBe(19970);
    expect(bear!.nearbyTarget!.structuralSource).toBe('LIQUIDITY_POOL');

    // Extended target should be SSL_2 at 19920
    expect(bear!.extendedTarget).toBeDefined();
    expect(bear!.extendedTarget!.price).toBe(19920);

    // Invalidation level derived from BSL sweep extreme (20085)
    expect(bear!.invalidationLevel).toBe(20085);
    expect(bear!.invalidationRationale).toContain('Liquidity sweep extreme');

    // Supporting evidence
    expect(bear!.supportingEvidence.some((e) => e.includes('Bearish'))).toBe(true);
    expect(bear!.supportingEvidence.some((e) => e.includes('Premium'))).toBe(true);
    expect(bear!.supportingEvidence.some((e) => e.includes('BSL'))).toBe(true);
  });

  it('3. Target derivation falls back to FVG when no un-swept liquidity pool exists', () => {
    const now = Date.now();
    const candles = generateCandleSeries(35, 20000, 'FLAT', '1m', now - 35 * 60000);

    const fvg: FairValueGap = {
      id: 'FVG_BULL_TGT',
      symbol: 'MNQZ6',
      timeframe: '1m',
      direction: 'BEARISH',
      highPrice: 20050,
      lowPrice: 20035,
      gapSize: 15,
      candle1Timestamp: now - 15000,
      candle2Timestamp: now - 10000,
      candle3Timestamp: now - 5000,
      createdCandleIndex: 20,
      status: 'ACTIVE',
      fillPercentage: 0,
    };

    const state: ICTMarketState = {
      symbol: 'MNQZ6',
      timeframe: '1m',
      lastUpdatedTimestamp: candles[candles.length - 1].timestamp,
      lastCandleIndex: candles.length - 1,
      trend: 'BULLISH',
      swings: [],
      activeSwingLow: createMockSwing('SW_LOW_ACT', 'SWING_LOW', 19970, now - 10000, 10),
      liquidityLevels: [], // No liquidity pools
      fairValueGaps: [fvg],
      orderBlocks: [],
    };

    const analysis = baseEngine.analyze(candles, state, [], [], undefined, now);
    const bull = analysis.bullishScenario;
    expect(bull).toBeDefined();
    expect(bull!.nearbyTarget).toBeDefined();
    expect(bull!.nearbyTarget!.structuralSource).toBe('FAIR_VALUE_GAP');
    expect(bull!.nearbyTarget!.price).toBe(20035);
    expect(bull!.nearbyTarget!.zoneHigh).toBe(20050);
  });

  it('4. Fails closed to NO_CLEAR_OPPORTUNITY when no defensible targets exist', () => {
    const now = Date.now();
    const candles = generateCandleSeries(35, 20000, 'FLAT', '1m', now - 35 * 60000);

    const state: ICTMarketState = {
      symbol: 'MNQZ6',
      timeframe: '1m',
      lastUpdatedTimestamp: candles[candles.length - 1].timestamp,
      lastCandleIndex: candles.length - 1,
      trend: 'SIDEWAYS',
      swings: [],
      liquidityLevels: [],
      fairValueGaps: [],
      orderBlocks: [],
    };

    const analysis = baseEngine.analyze(candles, state, [], [], undefined, now);
    expect(analysis.status).toBe('NO_CLEAR_OPPORTUNITY');
    expect(analysis.preferredDirection).toBe('INDETERMINATE');
    expect(analysis.selectedScenario).toBeUndefined();
    expect(analysis.statusExplanation).toContain('No viable directional scenario identified');
  });

  it('5. Declares CONFLICTING_EVIDENCE when both directions have balanced structural plausibility', () => {
    const now = Date.now();
    const candles = generateCandleSeries(35, 20000, 'FLAT', '1m', now - 35 * 60000);

    const state: ICTMarketState = {
      symbol: 'MNQZ6',
      timeframe: '1m',
      lastUpdatedTimestamp: candles[candles.length - 1].timestamp,
      lastCandleIndex: candles.length - 1,
      trend: 'SIDEWAYS',
      swings: [],
      activeSwingHigh: createMockSwing('SW_H', 'SWING_HIGH', 20030, now - 5000, 20),
      activeSwingLow: createMockSwing('SW_L', 'SWING_LOW', 19970, now - 5000, 20),
      liquidityLevels: [
        createMockLiquidity('BSL_1', 'BSL', 20050, false),
        createMockLiquidity('SSL_1', 'SSL', 19950, false),
      ],
      fairValueGaps: [],
      orderBlocks: [],
      dealingRange: createMockDealingRange(20050, 19950, 'EQUILIBRIUM', 20000),
    };

    const analysis = baseEngine.analyze(candles, state, [], [], undefined, now);
    expect(analysis.status).toBe('CONFLICTING_EVIDENCE');
    expect(analysis.preferredDirection).toBe('INDETERMINATE');
    expect(analysis.statusExplanation).toContain('Both Bullish and Bearish scenarios exhibit comparable structural plausibility');
  });

  it('6. Fails closed on STALE_MARKET_DATA when candle age exceeds threshold', () => {
    const now = Date.now();
    const staleOffsetMs = 600000; // 10 minutes old (> 5 minute threshold)
    const candles = generateCandleSeries(35, 20000, 'UP', '1m', now - staleOffsetMs - 35 * 60000);

    const state: ICTMarketState = {
      symbol: 'MNQZ6',
      timeframe: '1m',
      lastUpdatedTimestamp: candles[candles.length - 1].timestamp,
      lastCandleIndex: candles.length - 1,
      trend: 'BULLISH',
      swings: [],
      liquidityLevels: [],
      fairValueGaps: [],
      orderBlocks: [],
    };

    const analysis = baseEngine.analyze(candles, state, [], [], undefined, now);
    expect(analysis.status).toBe('STALE_MARKET_DATA');
    expect(analysis.preferredDirection).toBe('INDETERMINATE');
    expect(analysis.statusExplanation).toContain('Market data is stale');
  });
});
