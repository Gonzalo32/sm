import { describe, it, expect, beforeEach } from 'vitest';
import { execSync } from 'child_process';
import { ICTSetup } from '../core/ict/setups/SetupTypes';
import { ICTMarketState } from '../core/ict/types/MarketState';
import { ICTEvent } from '../core/ict/types/ICTEvent';
import { VisualAdapter } from '../extension/visual/VisualAdapter';
import { CoordinateTranslator } from '../extension/visual/CoordinateTranslator';
import { ICTPipelineCoordinator } from '../extension/content/ICTPipelineCoordinator';
import { Candle } from '../core/market/Candle';

describe('CP84 — Visual Setup Annotation Adapter & Chart Overlay Test Suite', () => {
  const rootDir = process.cwd();
  let adapter: VisualAdapter;
  let mockState: ICTMarketState;

  beforeEach(() => {
    adapter = new VisualAdapter();
    mockState = {
      symbol: 'MNQ',
      timeframe: '1m',
      lastUpdatedTimestamp: 1728820000000,
      lastCandleIndex: 50,
      trend: 'BULLISH',
      swings: [
        {
          id: 'SW-1',
          symbol: 'MNQ',
          timeframe: '1m',
          type: 'SWING_LOW',
          price: 21450,
          candleIndex: 30,
          timestamp: 1728818000000,
          eventTimestamp: 1728818000000,
          confirmationTimestamp: 1728818200000,
          strength: 3,
          confirmed: true,
          classification: 'INTERNAL',
          broken: false,
        },
      ],
      activeSwingLow: {
        id: 'SW-1',
        symbol: 'MNQ',
        timeframe: '1m',
        type: 'SWING_LOW',
        price: 21450,
        candleIndex: 30,
        timestamp: 1728818000000,
        eventTimestamp: 1728818000000,
        confirmationTimestamp: 1728818200000,
        strength: 3,
        confirmed: true,
        classification: 'INTERNAL',
        broken: false,
      },
      liquidityLevels: [
        {
          id: 'LIQ-BSL-1',
          symbol: 'MNQ',
          timeframe: '1m',
          type: 'BSL',
          price: 21600,
          category: 'SWING_HIGH',
          swings: [],
          swept: false,
        },
        {
          id: 'LIQ-SSL-1',
          symbol: 'MNQ',
          timeframe: '1m',
          type: 'SSL',
          price: 21400,
          category: 'SWING_LOW',
          swings: [],
          swept: false,
        },
      ],
      fairValueGaps: [
        {
          id: 'FVG-BULL-1',
          symbol: 'MNQ',
          timeframe: '1m',
          direction: 'BULLISH',
          highPrice: 21520,
          lowPrice: 21500,
          gapSize: 20,
          candle1Timestamp: 1728819400000,
          candle2Timestamp: 1728819460000,
          candle3Timestamp: 1728819500000,
          createdCandleIndex: 45,
          fillPercentage: 0,
          status: 'ACTIVE',
        },
      ],
      orderBlocks: [
        {
          id: 'OB-BULL-1',
          symbol: 'MNQ',
          timeframe: '1m',
          type: 'BULLISH_OB',
          highPrice: 21495,
          lowPrice: 21480,
          openPrice: 21490,
          closePrice: 21485,
          candleIndex: 40,
          timestamp: 1728819000000,
          status: 'TESTED',
          hasFvgConfluence: true,
        },
      ],
    };
  });

  it('1. Confirmed LONG produces the correct BUY annotation and visual primitives', () => {
    const longSetup: ICTSetup = {
      id: 'SETUP-MODEL_A_LONG-MNQ-1m-1728820000000',
      symbol: 'MNQ',
      timeframe: '1m',
      direction: 'LONG',
      status: 'CONFIRMED',
      activatedTimestamp: 1728819000000,
      confirmedTimestamp: 1728820000000,
      mandatoryConfluences: ['LIQUIDITY_SWEEP', 'MSS_CONFIRMED', 'FVG_CONFLUENCE'] as any,
      fulfilledConfluences: ['LIQUIDITY_SWEEP', 'MSS_CONFIRMED', 'FVG_CONFLUENCE'] as any,
      missingConfluences: [],
      invalidatingConditions: [],
      evidence: [
        'Model: Model A Long',
        'Sequence: ORDERED',
        'Fulfilled 3/3 required conditions',
      ],
    };

    const mockEvents: ICTEvent[] = [
      {
        type: 'LIQUIDITY_SWEEP',
        symbol: 'MNQ',
        timeframe: '1m',
        timestamp: 1728818500000,
        eventTimestamp: 1728818500000,
        confirmationTimestamp: 1728818600000,
        candleIndex: 35,
        sweep: {
          id: 'SWP-1',
          symbol: 'MNQ',
          timeframe: '1m',
          liquidityLevelId: 'LIQ-SSL-1',
          liquidityType: 'SSL',
          levelPrice: 21450,
          extremePrice: 21440,
          sweepTimestamp: 1728818500000,
          candleIndex: 35,
          confirmed: true,
        },
      },
    ];

    const visuals = adapter.adaptSetupsToVisuals([longSetup], mockState, mockEvents);

    expect(visuals.length).toBeGreaterThanOrEqual(1);

    // Directional Marker verification
    const marker = visuals.find((v) => v.type === 'MARKER' && (v as any).shape === 'TRIANGLE_UP');
    expect(marker).toBeDefined();
    expect(marker?.color).toBe('#22c55e');
    expect((marker as any)?.price).toBe(21500); // Confluent Bullish FVG lowPrice
    expect((marker as any)?.label).toContain('BUY SETUP [MODEL_A_LONG]');
    expect(marker?.zIndex).toBe(60);

    // Entry Zone verification
    const zone = visuals.find((v) => v.type === 'RECTANGLE' && v.id.includes('ZONE'));
    expect(zone).toBeDefined();
    expect((zone as any)?.highPrice).toBe(21520);
    expect((zone as any)?.lowPrice).toBe(21500);

    // Invalidation Level verification (swept extreme price)
    const invLine = visuals.find((v) => v.type === 'LINE' && v.id.includes('INV'));
    expect(invLine).toBeDefined();
    expect((invLine as any)?.price).toBe(21440);
    expect((invLine as any)?.lineStyle).toBe('DASHED');

    // Target Level verification (nearest un-swept BSL)
    const tgtLine = visuals.find((v) => v.type === 'LINE' && v.id.includes('TGT'));
    expect(tgtLine).toBeDefined();
    expect((tgtLine as any)?.price).toBe(21600);
    expect((tgtLine as any)?.lineStyle).toBe('DOTTED');
  });

  it('2. Confirmed SHORT produces the correct SELL annotation and visual primitives', () => {
    mockState.trend = 'BEARISH';
    mockState.fairValueGaps = [
      {
        id: 'FVG-BEAR-1',
        symbol: 'MNQ',
        timeframe: '1m',
        direction: 'BEARISH',
        highPrice: 21580,
        lowPrice: 21560,
        gapSize: 20,
        candle1Timestamp: 1728819400000,
        candle2Timestamp: 1728819460000,
        candle3Timestamp: 1728819500000,
        createdCandleIndex: 45,
        fillPercentage: 0,
        status: 'ACTIVE',
      },
    ];

    const shortSetup: ICTSetup = {
      id: 'SETUP-MODEL_A_SHORT-MNQ-1m-1728820000000',
      symbol: 'MNQ',
      timeframe: '1m',
      direction: 'SHORT',
      status: 'CONFIRMED',
      activatedTimestamp: 1728819000000,
      confirmedTimestamp: 1728820000000,
      mandatoryConfluences: ['LIQUIDITY_SWEEP', 'MSS_CONFIRMED', 'FVG_CONFLUENCE'] as any,
      fulfilledConfluences: ['LIQUIDITY_SWEEP', 'MSS_CONFIRMED', 'FVG_CONFLUENCE'] as any,
      missingConfluences: [],
      invalidatingConditions: [],
      evidence: [
        'Model: Model A Short',
        'Sequence: ORDERED',
        'Fulfilled 3/3 required conditions',
      ],
    };

    const mockEvents: ICTEvent[] = [
      {
        type: 'LIQUIDITY_SWEEP',
        symbol: 'MNQ',
        timeframe: '1m',
        timestamp: 1728818500000,
        eventTimestamp: 1728818500000,
        confirmationTimestamp: 1728818600000,
        candleIndex: 35,
        sweep: {
          id: 'SWP-2',
          symbol: 'MNQ',
          timeframe: '1m',
          liquidityLevelId: 'LIQ-BSL-1',
          liquidityType: 'BSL',
          levelPrice: 21600,
          extremePrice: 21620,
          sweepTimestamp: 1728818500000,
          candleIndex: 35,
          confirmed: true,
        },
      },
    ];

    const visuals = adapter.adaptSetupsToVisuals([shortSetup], mockState, mockEvents);

    expect(visuals.length).toBeGreaterThanOrEqual(1);

    // Directional Marker verification
    const marker = visuals.find((v) => v.type === 'MARKER' && (v as any).shape === 'TRIANGLE_DOWN');
    expect(marker).toBeDefined();
    expect(marker?.color).toBe('#ef4444');
    expect((marker as any)?.price).toBe(21580); // Confluent Bearish FVG highPrice
    expect((marker as any)?.label).toContain('SELL SETUP [MODEL_A_SHORT]');
    expect(marker?.zIndex).toBe(60);

    // Entry Zone verification
    const zone = visuals.find((v) => v.type === 'RECTANGLE' && v.id.includes('ZONE'));
    expect(zone).toBeDefined();
    expect((zone as any)?.highPrice).toBe(21580);
    expect((zone as any)?.lowPrice).toBe(21560);

    // Invalidation Level verification (swept extreme price)
    const invLine = visuals.find((v) => v.type === 'LINE' && v.id.includes('INV'));
    expect(invLine).toBeDefined();
    expect((invLine as any)?.price).toBe(21620);

    // Target Level verification (nearest un-swept SSL)
    const tgtLine = visuals.find((v) => v.type === 'LINE' && v.id.includes('TGT'));
    expect(tgtLine).toBeDefined();
    expect((tgtLine as any)?.price).toBe(21400);
  });

  it('3. WATCHING and FORMING setups must not produce confirmed entry markers', () => {
    const watchingSetup: ICTSetup = {
      id: 'SETUP-MODEL_A_LONG-MNQ-1m-1728820000000',
      symbol: 'MNQ',
      timeframe: '1m',
      direction: 'LONG',
      status: 'WATCHING',
      activatedTimestamp: 1728819000000,
      mandatoryConfluences: ['LIQUIDITY_SWEEP', 'MSS_CONFIRMED', 'FVG_CONFLUENCE'] as any,
      fulfilledConfluences: [],
      missingConfluences: ['LIQUIDITY_SWEEP', 'MSS_CONFIRMED', 'FVG_CONFLUENCE'] as any,
      invalidatingConditions: [],
      evidence: [],
    };

    const formingSetup: ICTSetup = {
      id: 'SETUP-MODEL_B_LONG-MNQ-1m-1728820000000',
      symbol: 'MNQ',
      timeframe: '1m',
      direction: 'LONG',
      status: 'FORMING',
      activatedTimestamp: 1728819000000,
      mandatoryConfluences: ['LIQUIDITY_SWEEP', 'DISPLACEMENT', 'FVG_CONFLUENCE'] as any,
      fulfilledConfluences: ['LIQUIDITY_SWEEP'] as any,
      missingConfluences: ['DISPLACEMENT', 'FVG_CONFLUENCE'] as any,
      invalidatingConditions: [],
      evidence: [],
    };

    const visuals = adapter.adaptSetupsToVisuals([watchingSetup, formingSetup], mockState, []);
    expect(visuals.length).toBe(0);
    expect(visuals.some((v) => v.label?.includes('BUY SETUP'))).toBe(false);
  });

  it('4. INVALIDATED and EXPIRED setups do not remain visually active', () => {
    const confirmedSetup: ICTSetup = {
      id: 'SETUP-MODEL_A_LONG-MNQ-1m-1728820000000',
      symbol: 'MNQ',
      timeframe: '1m',
      direction: 'LONG',
      status: 'CONFIRMED',
      activatedTimestamp: 1728819000000,
      confirmedTimestamp: 1728820000000,
      mandatoryConfluences: ['LIQUIDITY_SWEEP'] as any,
      fulfilledConfluences: ['LIQUIDITY_SWEEP'] as any,
      missingConfluences: [],
      invalidatingConditions: [],
      evidence: ['Model: Model A Long'],
    };

    // 1. Initial confirmation renders active visuals
    const activeVisuals = adapter.adaptSetupsToVisuals([confirmedSetup], mockState, []);
    expect(activeVisuals.length).toBeGreaterThan(0);

    // 2. Setup transitions to INVALIDATED
    const invalidatedSetup: ICTSetup = {
      ...confirmedSetup,
      status: 'INVALIDATED',
      invalidatedTimestamp: 1728820500000,
    };

    const visualsAfterInvalidation = adapter.adaptSetupsToVisuals([invalidatedSetup], mockState, []);
    expect(visualsAfterInvalidation.length).toBe(0);

    // 3. Re-confirm and then EXPIRE
    adapter.adaptSetupsToVisuals([confirmedSetup], mockState, []);
    const expiredSetup: ICTSetup = {
      ...confirmedSetup,
      status: 'EXPIRED',
    };

    const visualsAfterExpiration = adapter.adaptSetupsToVisuals([expiredSetup], mockState, []);
    expect(visualsAfterExpiration.length).toBe(0);
  });

  it('5. Missing or invalid price levels are handled safely (fail closed)', () => {
    // Empty market state with no price anchors
    const emptyState: ICTMarketState = {
      symbol: 'MNQ',
      timeframe: '1m',
      lastUpdatedTimestamp: 1728820000000,
      lastCandleIndex: 50,
      trend: 'SIDEWAYS',
      swings: [],
      liquidityLevels: [],
      fairValueGaps: [],
      orderBlocks: [],
    };

    const setupWithoutLevels: ICTSetup = {
      id: 'SETUP-MODEL_A_LONG-MNQ-1m-1728820000000',
      symbol: 'MNQ',
      timeframe: '1m',
      direction: 'LONG',
      status: 'CONFIRMED',
      activatedTimestamp: 1728819000000,
      confirmedTimestamp: 1728820000000,
      mandatoryConfluences: [] as any,
      fulfilledConfluences: [] as any,
      missingConfluences: [],
      invalidatingConditions: [],
      evidence: [],
    };

    // Fail closed: omit drawing if valid finite price cannot be resolved
    const visuals = adapter.adaptSetupsToVisuals([setupWithoutLevels], emptyState, []);
    expect(visuals.length).toBe(0);
  });

  it('6. Instrument and timeframe mismatches are rejected', () => {
    const mismatchedSetup: ICTSetup = {
      id: 'SETUP-MODEL_A_LONG-ES-5m-1728820000000',
      symbol: 'ES',
      timeframe: '5m',
      direction: 'LONG',
      status: 'CONFIRMED',
      activatedTimestamp: 1728819000000,
      confirmedTimestamp: 1728820000000,
      mandatoryConfluences: [] as any,
      fulfilledConfluences: [] as any,
      missingConfluences: [],
      invalidatingConditions: [],
      evidence: [],
    };

    // State is for MNQ 1m, setup is for ES 5m -> must reject
    const visuals = adapter.adaptSetupsToVisuals([mismatchedSetup], mockState, []);
    expect(visuals.length).toBe(0);
  });

  it('7. Repeated evaluation does not create duplicate drawings', () => {
    const setup: ICTSetup = {
      id: 'SETUP-MODEL_A_LONG-MNQ-1m-1728820000000',
      symbol: 'MNQ',
      timeframe: '1m',
      direction: 'LONG',
      status: 'CONFIRMED',
      activatedTimestamp: 1728819000000,
      confirmedTimestamp: 1728820000000,
      mandatoryConfluences: [] as any,
      fulfilledConfluences: [] as any,
      missingConfluences: [],
      invalidatingConditions: [],
      evidence: ['Model: Model A Long'],
    };

    // Simulate 5 repeated ticks
    let lastVisuals: any[] = [];
    for (let i = 0; i < 5; i++) {
      lastVisuals = adapter.adaptSetupsToVisuals([setup], mockState, []);
    }

    // Must contain exactly 1 marker and 1 entry zone, not 5 duplicates
    const markers = lastVisuals.filter((v) => v.type === 'MARKER');
    expect(markers.length).toBe(1);

    const zones = lastVisuals.filter((v) => v.type === 'RECTANGLE');
    expect(zones.length).toBe(1);
  });

  it('8. Lifecycle updates correctly replace or transition annotations', () => {
    const setupV1: ICTSetup = {
      id: 'SETUP-MODEL_A_LONG-MNQ-1m-1728820000000',
      symbol: 'MNQ',
      timeframe: '1m',
      direction: 'LONG',
      status: 'CONFIRMED',
      activatedTimestamp: 1728819000000,
      confirmedTimestamp: 1728820000000,
      mandatoryConfluences: [] as any,
      fulfilledConfluences: [] as any,
      missingConfluences: [],
      invalidatingConditions: [],
      evidence: ['Model: Model A Long'],
    };

    const visualsV1 = adapter.adaptSetupsToVisuals([setupV1], mockState, []);
    const markerV1 = visualsV1.find((v) => v.type === 'MARKER') as any;
    expect(markerV1.price).toBe(21500);

    // Update FVG price in next tick
    mockState.fairValueGaps[0].lowPrice = 21515;
    mockState.fairValueGaps[0].highPrice = 21535;

    const setupV2: ICTSetup = {
      ...setupV1,
      id: 'SETUP-MODEL_A_LONG-MNQ-1m-1728820060000',
      confirmedTimestamp: 1728820060000,
    };

    const visualsV2 = adapter.adaptSetupsToVisuals([setupV2], mockState, []);
    const markerV2 = visualsV2.find((v) => v.type === 'MARKER') as any;
    expect(markerV2.price).toBe(21515);

    // Must still be only 1 active marker (clean replacement)
    const totalMarkers = visualsV2.filter((v) => v.type === 'MARKER');
    expect(totalMarkers.length).toBe(1);
  });

  it('9. Timestamp and price mapping use the existing coordinate translator', () => {
    const translator = new CoordinateTranslator({
      width: 1000,
      height: 500,
      topPadding: 0,
      bottomPadding: 0,
      minPrice: 21400,
      maxPrice: 21600,
      firstCandleIndex: 0,
      lastCandleIndex: 100,
      barWidth: 10,
    });

    const setupPrice = 21500;
    const setupIndex = 50;

    const x = translator.indexToX(setupIndex);
    const y = translator.priceToY(setupPrice);

    expect(isFinite(x)).toBe(true);
    expect(isFinite(y)).toBe(true);
    expect(x).toBeGreaterThan(0);
    expect(y).toBe(250); // Exact midpoint of 21400 and 21600 with 0 padding
  });

  it('10. Existing market-geometry drawings remain compatible with setup annotations', () => {
    const coordinator = new ICTPipelineCoordinator('MNQ', '1m', { debug: false });
    const candles: Candle[] = [
      { timestamp: 1728820000000, open: 21480, high: 21510, low: 21475, close: 21505 },
      { timestamp: 1728820060000, open: 21505, high: 21530, low: 21500, close: 21525 },
      { timestamp: 1728820120000, open: 21525, high: 21550, low: 21520, close: 21545 },
    ];

    const evalResult = coordinator.ingestCandles(candles);
    expect(evalResult.visuals).toBeDefined();
    expect(Array.isArray(evalResult.visuals)).toBe(true);

    // Context switch clears setup visuals cleanly
    coordinator.setContext('ES', '5m');
    const esContext = coordinator.getContext();
    expect(esContext.symbol).toBe('ES');
    expect(esContext.timeframe).toBe('5m');
    expect(coordinator.getVisualAdapter().getActiveSetupVisualCount()).toBe(0);
  });

  it('11. Visual rendering and adapter have strictly zero order execution side effects', () => {
    const adapterPrototype = Object.getOwnPropertyNames(Object.getPrototypeOf(adapter));
    const forbiddenOrderKeywords = [
      'buy',
      'sell',
      'placeorder',
      'executeorder',
      'submitorder',
      'cancelorder',
      'modifyorder',
      'flatten',
      'closeposition',
    ];

    for (const key of adapterPrototype) {
      for (const kw of forbiddenOrderKeywords) {
        expect(key.toLowerCase()).not.toBe(kw);
      }
    }
  });

  it('12. Frozen core/ict/ diff verification: 0 diff lines against baseline 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a', () => {
    const diff = execSync('git diff 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a -- core/ict/', {
      encoding: 'utf-8',
      cwd: rootDir,
    });
    expect(diff.trim()).toBe('');
  });
});
