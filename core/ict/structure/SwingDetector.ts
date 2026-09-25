/**
 * ICT Market Structure - Swing Detector
 * Deterministic swing high / swing low identification algorithm.
 * Explicitly records eventTimestamp (peak time) and confirmationTimestamp (time rightBars confirm peak).
 */

import { Candle, Timeframe } from '../../market/Candle';
import { SwingPoint } from '../types/SwingPoint';
import { ICTConfig } from '../types/ICTConfig';

export class SwingDetector {
  private config: ICTConfig;

  constructor(config: ICTConfig) {
    this.config = config;
  }

  public detectSwings(candles: Candle[], symbol: string, timeframe: Timeframe): SwingPoint[] {
    const swings: SwingPoint[] = [];
    const { swingLeftBars, swingRightBars, swingMinDisplacementPoints } = this.config;

    if (candles.length < swingLeftBars + swingRightBars + 1) {
      return swings;
    }

    for (let i = swingLeftBars; i < candles.length - swingRightBars; i++) {
      const candidate = candles[i];
      const confirmationCandle = candles[i + swingRightBars];

      // 1. Check Swing High
      let isHigh = true;
      for (let l = 1; l <= swingLeftBars; l++) {
        if (candles[i - l].high >= candidate.high) {
          isHigh = false;
          break;
        }
      }
      if (isHigh) {
        for (let r = 1; r <= swingRightBars; r++) {
          if (candles[i + r].high >= candidate.high) {
            isHigh = false;
            break;
          }
        }
      }

      if (isHigh) {
        const displacementLeft = candidate.high - Math.min(...candles.slice(i - swingLeftBars, i).map((c) => c.low));
        if (displacementLeft >= swingMinDisplacementPoints) {
          swings.push({
            id: `SH-${symbol}-${timeframe}-${candidate.timestamp}`,
            symbol,
            timeframe,
            candleIndex: i,
            timestamp: candidate.timestamp,
            eventTimestamp: candidate.timestamp,
            confirmationTimestamp: confirmationCandle.timestamp,
            price: candidate.high,
            type: 'SWING_HIGH',
            strength: swingLeftBars + swingRightBars,
            confirmed: true,
            classification: 'EXTERNAL',
            broken: false,
          });
        }
      }

      // 2. Check Swing Low
      let isLow = true;
      for (let l = 1; l <= swingLeftBars; l++) {
        if (candles[i - l].low <= candidate.low) {
          isLow = false;
          break;
        }
      }
      if (isLow) {
        for (let r = 1; r <= swingRightBars; r++) {
          if (candles[i + r].low <= candidate.low) {
            isLow = false;
            break;
          }
        }
      }

      if (isLow) {
        const displacementLeft = Math.max(...candles.slice(i - swingLeftBars, i).map((c) => c.high)) - candidate.low;
        if (displacementLeft >= swingMinDisplacementPoints) {
          swings.push({
            id: `SL-${symbol}-${timeframe}-${candidate.timestamp}`,
            symbol,
            timeframe,
            candleIndex: i,
            timestamp: candidate.timestamp,
            eventTimestamp: candidate.timestamp,
            confirmationTimestamp: confirmationCandle.timestamp,
            price: candidate.low,
            type: 'SWING_LOW',
            strength: swingLeftBars + swingRightBars,
            confirmed: true,
            classification: 'EXTERNAL',
            broken: false,
          });
        }
      }
    }

    return swings;
  }
}
