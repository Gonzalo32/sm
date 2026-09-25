/**
 * Main Deterministic ICT Engine Orchestrator
 * Fully decoupled from browser APIs, Canvas, DOM, and WebSockets.
 * Compatible with Node.js, offline backtesting, and unit tests.
 */

import { Candle, Timeframe } from '../../market/Candle';
import { ICTConfig, DEFAULT_ICT_CONFIG } from '../types/ICTConfig';
import { ICTMarketState } from '../types/MarketState';
import { ICTEvent } from '../types/ICTEvent';

import { SwingDetector } from '../structure/SwingDetector';
import { StructureEngine } from '../structure/StructureEngine';
import { LiquidityEngine } from '../liquidity/LiquidityEngine';
import { FVGEngine } from '../fvg/FVGEngine';
import { OrderBlockEngine } from '../orderblocks/OrderBlockEngine';
import { PremiumDiscountEngine } from '../pdarrays/PremiumDiscountEngine';
import { DisplacementEngine } from '../displacement/DisplacementEngine';

export interface ICTEngineResult {
  state: ICTMarketState;
  events: ICTEvent[];
}

export class ICTEngine {
  private config: ICTConfig;
  private swingDetector: SwingDetector;
  private structureEngine: StructureEngine;
  private liquidityEngine: LiquidityEngine;
  private fvgEngine: FVGEngine;
  private obEngine: OrderBlockEngine;
  private pdEngine: PremiumDiscountEngine;
  private displacementEngine: DisplacementEngine;

  private progressiveBuffer: Candle[] = [];

  constructor(config: Partial<ICTConfig> = {}) {
    this.config = { ...DEFAULT_ICT_CONFIG, ...config };
    this.swingDetector = new SwingDetector(this.config);
    this.structureEngine = new StructureEngine(this.config);
    this.liquidityEngine = new LiquidityEngine(this.config);
    this.fvgEngine = new FVGEngine(this.config);
    this.obEngine = new OrderBlockEngine(this.config);
    this.pdEngine = new PremiumDiscountEngine(this.config);
    this.displacementEngine = new DisplacementEngine();
  }

  public process(candles: Candle[], symbol: string = 'MNQ', timeframe: Timeframe = '1m'): ICTEngineResult {
    const allEvents: ICTEvent[] = [];

    if (!candles || candles.length === 0) {
      const emptyState: ICTMarketState = {
        symbol,
        timeframe,
        lastUpdatedTimestamp: 0,
        lastCandleIndex: -1,
        trend: 'SIDEWAYS',
        swings: [],
        liquidityLevels: [],
        fairValueGaps: [],
        orderBlocks: [],
      };
      return { state: emptyState, events: [] };
    }

    // 1. Detect Swings
    const initialSwings = this.swingDetector.detectSwings(candles, symbol, timeframe);
    for (const s of initialSwings) {
      if (s.type === 'SWING_HIGH') {
        allEvents.push({
          type: 'SWING_HIGH',
          symbol,
          timeframe,
          timestamp: s.timestamp,
          eventTimestamp: s.eventTimestamp,
          confirmationTimestamp: s.confirmationTimestamp,
          candleIndex: s.candleIndex,
          swing: JSON.parse(JSON.stringify(s)),
        });
      } else {
        allEvents.push({
          type: 'SWING_LOW',
          symbol,
          timeframe,
          timestamp: s.timestamp,
          eventTimestamp: s.eventTimestamp,
          confirmationTimestamp: s.confirmationTimestamp,
          candleIndex: s.candleIndex,
          swing: JSON.parse(JSON.stringify(s)),
        });
      }
    }

    // 2. Evaluate Market Structure (BOS & MSS)
    const structSwings = JSON.parse(JSON.stringify(initialSwings));
    const structRes = this.structureEngine.evaluateStructure(candles, structSwings, symbol, timeframe);
    allEvents.push(...structRes.events);

    // 3. Evaluate Liquidity Levels & Sweeps
    const liqSwings = JSON.parse(JSON.stringify(initialSwings));
    const liqRes = this.liquidityEngine.evaluateLiquidity(candles, liqSwings, symbol, timeframe);
    allEvents.push(...liqRes.events);

    // 4. Evaluate Fair Value Gaps (FVG)
    const fvgRes = this.fvgEngine.evaluateFVG(candles, symbol, timeframe);
    allEvents.push(...fvgRes.events);

    // 5. Evaluate Order Blocks
    const obRes = this.obEngine.evaluateOrderBlocks(candles, fvgRes.fvgs, symbol, timeframe);
    allEvents.push(...obRes.events);

    // 6. Evaluate Displacements
    const dispRes = this.displacementEngine.evaluateDisplacements(candles, symbol, timeframe);
    allEvents.push(...dispRes.events);

    // 7. Calculate Dealing Range & Premium/Discount
    const dealingRange = this.pdEngine.calculateDealingRange(candles, symbol, timeframe);

    // Sort all events deterministically
    allEvents.sort(
      (a, b) =>
        a.confirmationTimestamp - b.confirmationTimestamp ||
        a.eventTimestamp - b.eventTimestamp ||
        a.candleIndex - b.candleIndex
    );

    const lastCandle = candles[candles.length - 1];

    const state: ICTMarketState = {
      symbol,
      timeframe,
      lastUpdatedTimestamp: lastCandle.timestamp,
      lastCandleIndex: candles.length - 1,
      trend: structRes.trend,
      swings: structRes.swings,
      activeSwingHigh: structRes.activeSwingHigh,
      activeSwingLow: structRes.activeSwingLow,
      liquidityLevels: liqRes.levels,
      fairValueGaps: fvgRes.fvgs,
      orderBlocks: obRes.orderBlocks,
      dealingRange,
    };

    const immutableEvents: ICTEvent[] = JSON.parse(JSON.stringify(allEvents));

    return { state, events: immutableEvents };
  }

  public processNext(candle: Candle, symbol: string = 'MNQ', timeframe: Timeframe = '1m'): ICTEngineResult {
    this.progressiveBuffer.push(candle);
    return this.process(this.progressiveBuffer, symbol, timeframe);
  }

  public resetProgressiveBuffer(): void {
    this.progressiveBuffer = [];
  }
}
