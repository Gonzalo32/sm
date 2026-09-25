/**
 * ICT Fair Value Gap (FVG) Engine
 */

import { Candle, Timeframe } from '../../market/Candle';
import { FairValueGap } from '../types/FVG';
import { ICTEvent, FVGCreatedEvent, FVGFilledEvent } from '../types/ICTEvent';
import { ICTConfig } from '../types/ICTConfig';

export interface FVGEvaluationResult {
  fvgs: FairValueGap[];
  events: ICTEvent[];
}

export class FVGEngine {
  private config: ICTConfig;

  constructor(config: ICTConfig) {
    this.config = config;
  }

  public evaluateFVG(
    candles: Candle[],
    symbol: string,
    timeframe: Timeframe
  ): FVGEvaluationResult {
    const fvgs: FairValueGap[] = [];
    const events: ICTEvent[] = [];

    const { fvgMinSizePoints, fvgMitigationMode } = this.config;

    if (candles.length < 3) {
      return { fvgs, events };
    }

    // 1. Detect 3-Candle FVGs
    for (let i = 0; i <= candles.length - 3; i++) {
      const c1 = candles[i];
      const c2 = candles[i + 1];
      const c3 = candles[i + 2];

      // Bullish FVG: c1.high < c3.low
      if (c3.low > c1.high) {
        const gapSize = c3.low - c1.high;
        if (gapSize >= fvgMinSizePoints) {
          const fvg: FairValueGap = {
            id: `FVG-BULL-${symbol}-${timeframe}-${c2.timestamp}`,
            symbol,
            timeframe,
            direction: 'BULLISH',
            highPrice: c3.low,
            lowPrice: c1.high,
            gapSize,
            candle1Timestamp: c1.timestamp,
            candle2Timestamp: c2.timestamp,
            candle3Timestamp: c3.timestamp,
            createdCandleIndex: i + 2,
            status: 'ACTIVE',
            fillPercentage: 0,
          };
          fvgs.push(fvg);
          events.push({
            type: 'FVG_CREATED',
            symbol,
            timeframe,
            timestamp: c3.timestamp,
            eventTimestamp: c3.timestamp,
            confirmationTimestamp: c3.timestamp,
            candleIndex: i + 2,
            fvg: { ...fvg },
          } as FVGCreatedEvent);
        }
      }

      // Bearish FVG: c1.low > c3.high
      if (c1.low > c3.high) {
        const gapSize = c1.low - c3.high;
        if (gapSize >= fvgMinSizePoints) {
          const fvg: FairValueGap = {
            id: `FVG-BEAR-${symbol}-${timeframe}-${c2.timestamp}`,
            symbol,
            timeframe,
            direction: 'BEARISH',
            highPrice: c1.low,
            lowPrice: c3.high,
            gapSize,
            candle1Timestamp: c1.timestamp,
            candle2Timestamp: c2.timestamp,
            candle3Timestamp: c3.timestamp,
            createdCandleIndex: i + 2,
            status: 'ACTIVE',
            fillPercentage: 0,
          };
          fvgs.push(fvg);
          events.push({
            type: 'FVG_CREATED',
            symbol,
            timeframe,
            timestamp: c3.timestamp,
            eventTimestamp: c3.timestamp,
            confirmationTimestamp: c3.timestamp,
            candleIndex: i + 2,
            fvg: { ...fvg },
          } as FVGCreatedEvent);
        }
      }
    }

    // 2. Track Mitigation across subsequent candles
    for (const fvg of fvgs) {
      for (let cIdx = fvg.createdCandleIndex + 1; cIdx < candles.length; cIdx++) {
        if (fvg.status === 'FULLY_MITIGATED' || fvg.status === 'INVALIDATED') break;

        const candle = candles[cIdx];

        if (fvg.direction === 'BULLISH') {
          if (candle.low <= fvg.highPrice) {
            if (candle.low <= fvg.lowPrice) {
              fvg.status = 'FULLY_MITIGATED';
              fvg.fillPercentage = 100;
              fvg.mitigatedTimestamp = candle.timestamp;
              events.push({
                type: 'FVG_FILLED',
                symbol,
                timeframe,
                timestamp: candle.timestamp,
                eventTimestamp: candle.timestamp,
                confirmationTimestamp: candle.timestamp,
                candleIndex: cIdx,
                fvg: { ...fvg },
              } as FVGFilledEvent);
            } else {
              const reenteredAmount = fvg.highPrice - candle.low;
              const currentFill = Math.min(100, Math.round((reenteredAmount / fvg.gapSize) * 100));
              fvg.fillPercentage = Math.max(fvg.fillPercentage, currentFill);
              fvg.status = fvg.fillPercentage >= 50 && fvgMitigationMode === 'FILL_50' ? 'FULLY_MITIGATED' : 'PARTIALLY_MITIGATED';
            }
          }
        } else if (fvg.direction === 'BEARISH') {
          if (candle.high >= fvg.lowPrice) {
            if (candle.high >= fvg.highPrice) {
              fvg.status = 'FULLY_MITIGATED';
              fvg.fillPercentage = 100;
              fvg.mitigatedTimestamp = candle.timestamp;
              events.push({
                type: 'FVG_FILLED',
                symbol,
                timeframe,
                timestamp: candle.timestamp,
                eventTimestamp: candle.timestamp,
                confirmationTimestamp: candle.timestamp,
                candleIndex: cIdx,
                fvg: { ...fvg },
              } as FVGFilledEvent);
            } else {
              const reenteredAmount = candle.high - fvg.lowPrice;
              const currentFill = Math.min(100, Math.round((reenteredAmount / fvg.gapSize) * 100));
              fvg.fillPercentage = Math.max(fvg.fillPercentage, currentFill);
              fvg.status = fvg.fillPercentage >= 50 && fvgMitigationMode === 'FILL_50' ? 'FULLY_MITIGATED' : 'PARTIALLY_MITIGATED';
            }
          }
        }
      }
    }

    return { fvgs, events };
  }
}
