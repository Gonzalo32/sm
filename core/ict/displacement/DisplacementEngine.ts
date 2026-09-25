/**
 * ICT Displacement Engine - Quantifiable & Deterministic Evaluator
 */

import { Candle, Timeframe } from '../../market/Candle';
import { Displacement, DisplacementConfig } from './DisplacementTypes';
import { ICTEvent, DisplacementEvent } from '../types/ICTEvent';

export const DEFAULT_DISPLACEMENT_CONFIG: DisplacementConfig = {
  minBodyToRangeRatio: 0.6,
  minRangeMultiplier: 1.5,
  lookbackCandles: 5,
  requireStructuralBreak: false,
  requireFvgCreation: false,
};

export class DisplacementEngine {
  private config: DisplacementConfig;

  constructor(config: Partial<DisplacementConfig> = {}) {
    this.config = { ...DEFAULT_DISPLACEMENT_CONFIG, ...config };
  }

  public evaluateDisplacements(
    candles: Candle[],
    symbol: string,
    timeframe: Timeframe
  ): { displacements: Displacement[]; events: ICTEvent[] } {
    const displacements: Displacement[] = [];
    const events: ICTEvent[] = [];

    const { minBodyToRangeRatio, minRangeMultiplier, lookbackCandles } = this.config;

    if (candles.length < lookbackCandles + 1) {
      return { displacements, events };
    }

    for (let i = lookbackCandles; i < candles.length; i++) {
      const candle = candles[i];
      const candleRange = candle.high - candle.low;

      if (candleRange <= 0) continue;

      const candleBody = Math.abs(candle.close - candle.open);
      const bodyRatio = candleBody / candleRange;

      if (bodyRatio < minBodyToRangeRatio) continue;

      // Calculate average range of preceding lookback candles
      let totalPrecedingRange = 0;
      for (let j = i - lookbackCandles; j < i; j++) {
        totalPrecedingRange += candles[j].high - candles[j].low;
      }
      const avgPrecedingRange = totalPrecedingRange / lookbackCandles;

      if (avgPrecedingRange <= 0) continue;

      const rangeMultiplier = candleRange / avgPrecedingRange;

      if (rangeMultiplier >= minRangeMultiplier) {
        const direction = candle.close >= candle.open ? 'BULLISH' : 'BEARISH';
        const disp: Displacement = {
          id: `DISP-${symbol}-${timeframe}-${candle.timestamp}`,
          symbol,
          timeframe,
          direction,
          candleIndex: i,
          timestamp: candle.timestamp,
          openPrice: candle.open,
          closePrice: candle.close,
          highPrice: candle.high,
          lowPrice: candle.low,
          bodyRatio,
          rangeMultiplier,
        };

        displacements.push(disp);
        events.push({
          type: 'DISPLACEMENT',
          symbol,
          timeframe,
          timestamp: candle.timestamp,
          eventTimestamp: candle.timestamp,
          confirmationTimestamp: candle.timestamp,
          candleIndex: i,
          displacement: { ...disp },
        } as DisplacementEvent);
      }
    }

    return { displacements, events };
  }
}
