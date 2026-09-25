import { describe, it, expect, beforeEach } from 'vitest';
import { MarketContextEngine, ICTMarketContext } from '../core/ict/context/MarketContextEngine';
import { ICTPipelineCoordinator } from '../extension/content/ICTPipelineCoordinator';
import { Candle } from '../core/market/Candle';

describe('Checkpoint 8 — Market Context Assistant Tests', () => {
  let contextEngine: MarketContextEngine;
  let coordinator: ICTPipelineCoordinator;

  beforeEach(() => {
    contextEngine = new MarketContextEngine();
    coordinator = new ICTPipelineCoordinator('MNQ', '1m', { debug: false });
  });

  function makeBaseCandles(count: number = 5, startPrice: number = 18000): Candle[] {
    const candles: Candle[] = [];
    for (let i = 0; i < count; i++) {
      candles.push({
        timestamp: 1700000000000 + i * 60000,
        open: startPrice,
        high: startPrice + 2,
        low: startPrice - 2,
        close: startPrice + 1,
        volume: 100,
      });
    }
    return candles;
  }

  it('Test 1 — Generates Dynamic Textual Narrative Summary strictly from ICTMarketContext', () => {
    const mockContext: Partial<ICTMarketContext> = {
      symbol: 'MNQ',
      ltfTimeframe: '1m',
      htfTimeframe: '1h',
      structure: {
        trend: 'BULLISH',
        lastMSS: 'BULLISH @ $18038.00',
        lastBOS: 'BULLISH @ $18052.00',
        structureState: 'HTF (SIDEWAYS) | LTF (BULLISH)',
      },
      liquidity: {
        bslCount: 1,
        sslCount: 1,
        nearestTarget: 'BSL @ $18520.00',
      },
      pdArray: {
        zone: 'DISCOUNT',
        equilibrium: 18000,
        activeFvgCount: 1,
        activeObCount: 1,
      },
      setup: {
        activeModelName: 'MODEL_A_LONG',
        longStatus: 'FORMING',
        shortStatus: 'WATCHING',
        status: 'FORMING',
        fulfilledConditions: ['✓ LIQUIDITY_SWEEP', '✓ MSS_CONFIRMED'],
        missingConditions: ['○ FVG_CONFLUENCE'],
        invalidatedConditions: [],
        target: 'BSL @ $18520.00',
      },
    };

    const lines = contextEngine.generateNarrativeSummary(mockContext);
    const text = lines.join(' ');

    expect(lines.length).toBeGreaterThanOrEqual(5);
    expect(text).toContain('Mercado alcista.');
    expect(text).toContain('Último evento relevante: MSS bullish @ $18038.00.');
    expect(text).toContain('Liquidez objetivo: BSL @ $18520.00.');
    expect(text).toContain('Precio en Discount.');
    expect(text).toContain('Existe FVG (1) y OB (1) activo.');
    expect(text).toContain('Setup MODEL_A_LONG en FORMING.');
    expect(text).toContain('Falta: FVG_CONFLUENCE.');
  });

  it('Test 2 — Narrative adapts correctly to Bearish Market & Premium Zone', () => {
    const mockContext: Partial<ICTMarketContext> = {
      structure: {
        trend: 'BEARISH',
        lastBOS: 'BEARISH @ $17950.00',
        structureState: 'HTF (BEARISH) | LTF (BEARISH)',
      },
      liquidity: {
        bslCount: 0,
        sslCount: 2,
        nearestTarget: 'SSL @ $17900.00',
      },
      pdArray: {
        zone: 'PREMIUM',
        equilibrium: 17950,
        activeFvgCount: 1,
        activeObCount: 0,
      },
      setup: {
        activeModelName: 'MODEL_A_SHORT',
        longStatus: 'WATCHING',
        shortStatus: 'CONFIRMED',
        status: 'CONFIRMED',
        fulfilledConditions: ['✓ LIQUIDITY_SWEEP', '✓ MSS_CONFIRMED', '✓ FVG_CONFLUENCE'],
        missingConditions: [],
        invalidatedConditions: [],
        target: 'SSL @ $17900.00',
      },
    };

    const lines = contextEngine.generateNarrativeSummary(mockContext);
    const text = lines.join(' ');

    expect(text).toContain('Mercado bajista.');
    expect(text).toContain('Último evento relevante: BOS bearish @ $17950.00.');
    expect(text).toContain('Liquidez objetivo: SSL @ $17900.00.');
    expect(text).toContain('Precio en Premium.');
    expect(text).toContain('Existe FVG activo.');
    expect(text).toContain('Setup MODEL_A_SHORT CONFIRMADO.');
  });

  it('Test 3 — Full Pipeline Integration generates Narrative Summary in Context', () => {
    const candles = makeBaseCandles(5, 18000);
    candles.push({ timestamp: 1700000300000, open: 18000, high: 18050, low: 18000, close: 18048 });

    const res = coordinator.ingestCandles(candles);
    const ctx = res.marketContext;

    expect(ctx.narrativeSummary).toBeDefined();
    expect(ctx.narrativeSummary.length).toBeGreaterThan(0);
    expect(ctx.narrativeText).toContain('Mercado');
  });

  it('Test 4 — Assistant Data Model is 100% Free of Trading Signals & Order Terms', () => {
    const candles = makeBaseCandles(5, 18000);
    const res = coordinator.ingestCandles(candles);
    const ctxJson = JSON.stringify(res.marketContext);

    expect(ctxJson).not.toContain('"BUY"');
    expect(ctxJson).not.toContain('"SELL"');
    expect(ctxJson).not.toContain('"ENTRY"');
    expect(ctxJson).not.toContain('"STOP_LOSS"');
    expect(ctxJson).not.toContain('"TAKE_PROFIT"');
    expect(ctxJson).not.toContain('"WIN_RATE"');
  });
});
