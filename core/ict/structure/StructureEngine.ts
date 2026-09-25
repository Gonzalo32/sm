/**
 * ICT Market Structure Engine - BOS & MSS Evaluator
 */

import { Candle, Timeframe } from '../../market/Candle';
import { SwingPoint } from '../types/SwingPoint';
import { ICTEvent, BOSEvent, MSSEvent } from '../types/ICTEvent';
import { TrendDirection } from '../types/MarketState';
import { ICTConfig } from '../types/ICTConfig';

export interface StructureEvaluationResult {
  trend: TrendDirection;
  swings: SwingPoint[];
  events: ICTEvent[];
  activeSwingHigh?: SwingPoint;
  activeSwingLow?: SwingPoint;
}

export class StructureEngine {
  private config: ICTConfig;

  constructor(config: ICTConfig) {
    this.config = config;
  }

  public evaluateStructure(
    candles: Candle[],
    swings: SwingPoint[],
    symbol: string,
    timeframe: Timeframe
  ): StructureEvaluationResult {
    let currentTrend: TrendDirection = 'SIDEWAYS';
    const events: ICTEvent[] = [];
    const updatedSwings = [...swings];

    if (candles.length === 0 || updatedSwings.length === 0) {
      return { trend: currentTrend, swings: updatedSwings, events };
    }

    let activeHigh: SwingPoint | undefined;
    let activeLow: SwingPoint | undefined;

    const swingRightBars = this.config.swingRightBars;

    for (let cIdx = 0; cIdx < candles.length; cIdx++) {
      const candle = candles[cIdx];

      // Swings must be fully confirmed (cIdx >= s.candleIndex + swingRightBars) to be visible/breakable
      const availableSwings = updatedSwings.filter(
        (s) => s.candleIndex + swingRightBars <= cIdx && !s.broken
      );
      const swingHighs = availableSwings.filter((s) => s.type === 'SWING_HIGH');
      const swingLows = availableSwings.filter((s) => s.type === 'SWING_LOW');

      activeHigh = swingHighs.length > 0 ? swingHighs[swingHighs.length - 1] : undefined;
      activeLow = swingLows.length > 0 ? swingLows[swingLows.length - 1] : undefined;

      // 1. Check Bullish Break (Breaking Active Swing High)
      if (activeHigh) {
        const breakPrice = this.config.bosBreakMode === 'CLOSE' ? candle.close : candle.high;
        if (breakPrice > activeHigh.price) {
          activeHigh.broken = true;
          activeHigh.brokenTimestamp = candle.timestamp;

          if (currentTrend === 'BEARISH') {
            // Trend Reversal -> MSS
            events.push({
              type: 'MSS',
              symbol,
              timeframe,
              timestamp: candle.timestamp,
              eventTimestamp: candle.timestamp,
              confirmationTimestamp: candle.timestamp,
              candleIndex: cIdx,
              direction: 'BULLISH',
              brokenSwing: { ...activeHigh },
              breakPrice,
              priorTrend: 'BEARISH',
            } as MSSEvent);
            currentTrend = 'BULLISH';
          } else {
            // Trend Continuation -> BOS
            events.push({
              type: 'BOS',
              symbol,
              timeframe,
              timestamp: candle.timestamp,
              eventTimestamp: candle.timestamp,
              confirmationTimestamp: candle.timestamp,
              candleIndex: cIdx,
              direction: 'BULLISH',
              brokenSwing: { ...activeHigh },
              breakPrice,
            } as BOSEvent);
            currentTrend = 'BULLISH';
          }
        }
      }

      // 2. Check Bearish Break (Breaking Active Swing Low)
      if (activeLow) {
        const breakPrice = this.config.bosBreakMode === 'CLOSE' ? candle.close : candle.low;
        if (breakPrice < activeLow.price) {
          activeLow.broken = true;
          activeLow.brokenTimestamp = candle.timestamp;

          if (currentTrend === 'BULLISH') {
            // Trend Reversal -> MSS
            events.push({
              type: 'MSS',
              symbol,
              timeframe,
              timestamp: candle.timestamp,
              eventTimestamp: candle.timestamp,
              confirmationTimestamp: candle.timestamp,
              candleIndex: cIdx,
              direction: 'BEARISH',
              brokenSwing: { ...activeLow },
              breakPrice,
              priorTrend: 'BULLISH',
            } as MSSEvent);
            currentTrend = 'BEARISH';
          } else {
            // Trend Continuation -> BOS
            events.push({
              type: 'BOS',
              symbol,
              timeframe,
              timestamp: candle.timestamp,
              eventTimestamp: candle.timestamp,
              confirmationTimestamp: candle.timestamp,
              candleIndex: cIdx,
              direction: 'BEARISH',
              brokenSwing: { ...activeLow },
              breakPrice,
            } as BOSEvent);
            currentTrend = 'BEARISH';
          }
        }
      }
    }

    return {
      trend: currentTrend,
      swings: updatedSwings,
      events,
      activeSwingHigh: activeHigh && !activeHigh.broken ? activeHigh : undefined,
      activeSwingLow: activeLow && !activeLow.broken ? activeLow : undefined,
    };
  }
}
