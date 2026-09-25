/**
 * ICT Premium / Discount Engine
 */

import { Candle, Timeframe } from '../../market/Candle';
import { DealingRange, PriceZone } from '../types/PDArrays';
import { ICTConfig } from '../types/ICTConfig';

export class PremiumDiscountEngine {
  private config: ICTConfig;

  constructor(config: ICTConfig) {
    this.config = config;
  }

  public calculateDealingRange(
    candles: Candle[],
    symbol: string,
    timeframe: Timeframe
  ): DealingRange | undefined {
    if (candles.length === 0) return undefined;

    const lookback = Math.min(candles.length, this.config.dealingRangeLookbackBars);
    const windowCandles = candles.slice(candles.length - lookback);

    let rangeHigh = -Infinity;
    let rangeLow = Infinity;

    for (const c of windowCandles) {
      if (c.high > rangeHigh) rangeHigh = c.high;
      if (c.low < rangeLow) rangeLow = c.low;
    }

    const equilibrium = (rangeHigh + rangeLow) / 2;
    const currentPrice = candles[candles.length - 1].close;

    let currentZone: PriceZone = 'EQUILIBRIUM';
    if (currentPrice > equilibrium) currentZone = 'PREMIUM';
    else if (currentPrice < equilibrium) currentZone = 'DISCOUNT';

    return {
      symbol,
      timeframe,
      rangeHigh,
      rangeLow,
      equilibrium,
      currentPrice,
      currentZone,
      timestamp: candles[candles.length - 1].timestamp,
    };
  }
}
