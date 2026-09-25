/**
 * ICT Liquidity Engine - BSL, SSL, Equal Highs/Lows & Sweeps
 */

import { Candle, Timeframe } from '../../market/Candle';
import { SwingPoint } from '../types/SwingPoint';
import { LiquidityLevel, LiquiditySweep } from '../types/Liquidity';
import { ICTEvent, BSLEvent, SSLEvent, LiquiditySweepEvent } from '../types/ICTEvent';
import { ICTConfig } from '../types/ICTConfig';

export interface LiquidityEvaluationResult {
  levels: LiquidityLevel[];
  sweeps: LiquiditySweep[];
  events: ICTEvent[];
}

export class LiquidityEngine {
  private config: ICTConfig;

  constructor(config: ICTConfig) {
    this.config = config;
  }

  public evaluateLiquidity(
    candles: Candle[],
    swings: SwingPoint[],
    symbol: string,
    timeframe: Timeframe
  ): LiquidityEvaluationResult {
    const levels: LiquidityLevel[] = [];
    const sweeps: LiquiditySweep[] = [];
    const events: ICTEvent[] = [];

    const { liquidityTolerancePoints, sweepMinPenetrationPoints } = this.config;

    const swingHighs = swings.filter((s) => s.type === 'SWING_HIGH');
    const swingLows = swings.filter((s) => s.type === 'SWING_LOW');

    // Process BSL
    for (let i = 0; i < swingHighs.length; i++) {
      const sh = swingHighs[i];
      const existing = levels.find(
        (l) => l.type === 'BSL' && Math.abs(l.price - sh.price) <= liquidityTolerancePoints
      );

      if (existing) {
        existing.category = 'EQUAL_HIGHS';
        existing.swings.push({ ...sh });
      } else {
        const newLevel: LiquidityLevel = {
          id: `BSL-${symbol}-${timeframe}-${sh.timestamp}`,
          symbol,
          timeframe,
          price: sh.price,
          type: 'BSL',
          category: 'SWING_HIGH',
          swings: [{ ...sh }],
          swept: false,
        };
        levels.push(newLevel);
        events.push({
          type: 'BSL',
          symbol,
          timeframe,
          timestamp: sh.timestamp,
          eventTimestamp: sh.eventTimestamp,
          confirmationTimestamp: sh.confirmationTimestamp,
          candleIndex: sh.candleIndex,
          level: { ...newLevel, swings: newLevel.swings.map((s) => ({ ...s })) },
        } as BSLEvent);
      }
    }

    // Process SSL
    for (let i = 0; i < swingLows.length; i++) {
      const sl = swingLows[i];
      const existing = levels.find(
        (l) => l.type === 'SSL' && Math.abs(l.price - sl.price) <= liquidityTolerancePoints
      );

      if (existing) {
        existing.category = 'EQUAL_LOWS';
        existing.swings.push({ ...sl });
      } else {
        const newLevel: LiquidityLevel = {
          id: `SSL-${symbol}-${timeframe}-${sl.timestamp}`,
          symbol,
          timeframe,
          price: sl.price,
          type: 'SSL',
          category: 'SWING_LOW',
          swings: [{ ...sl }],
          swept: false,
        };
        levels.push(newLevel);
        events.push({
          type: 'SSL',
          symbol,
          timeframe,
          timestamp: sl.timestamp,
          eventTimestamp: sl.eventTimestamp,
          confirmationTimestamp: sl.confirmationTimestamp,
          candleIndex: sl.candleIndex,
          level: { ...newLevel, swings: newLevel.swings.map((s) => ({ ...s })) },
        } as SSLEvent);
      }
    }

    // Evaluate Liquidity Sweeps
    const swingRightBars = this.config.swingRightBars;

    for (let cIdx = 0; cIdx < candles.length; cIdx++) {
      const candle = candles[cIdx];

      for (const level of levels) {
        if (level.swept) continue;

        const latestSwingIndex = Math.max(...level.swings.map((s) => s.candleIndex));
        if (cIdx <= latestSwingIndex + swingRightBars) continue;

        if (level.type === 'BSL') {
          if (candle.high >= level.price + sweepMinPenetrationPoints) {
            level.swept = true;
            level.sweptTimestamp = candle.timestamp;
            level.sweptByCandleIndex = cIdx;

            const sweep: LiquiditySweep = {
              id: `SWEEP-BSL-${level.id}-${candle.timestamp}`,
              symbol,
              timeframe,
              liquidityLevelId: level.id,
              liquidityType: 'BSL',
              levelPrice: level.price,
              extremePrice: candle.high,
              sweepTimestamp: candle.timestamp,
              candleIndex: cIdx,
              confirmed: candle.close < level.price,
            };
            sweeps.push(sweep);
            events.push({
              type: 'LIQUIDITY_SWEEP',
              symbol,
              timeframe,
              timestamp: candle.timestamp,
              eventTimestamp: candle.timestamp,
              confirmationTimestamp: candle.timestamp,
              candleIndex: cIdx,
              sweep,
            } as LiquiditySweepEvent);
          }
        } else if (level.type === 'SSL') {
          if (candle.low <= level.price - sweepMinPenetrationPoints) {
            level.swept = true;
            level.sweptTimestamp = candle.timestamp;
            level.sweptByCandleIndex = cIdx;

            const sweep: LiquiditySweep = {
              id: `SWEEP-SSL-${level.id}-${candle.timestamp}`,
              symbol,
              timeframe,
              liquidityLevelId: level.id,
              liquidityType: 'SSL',
              levelPrice: level.price,
              extremePrice: candle.low,
              sweepTimestamp: candle.timestamp,
              candleIndex: cIdx,
              confirmed: candle.close > level.price,
            };
            sweeps.push(sweep);
            events.push({
              type: 'LIQUIDITY_SWEEP',
              symbol,
              timeframe,
              timestamp: candle.timestamp,
              eventTimestamp: candle.timestamp,
              confirmationTimestamp: candle.timestamp,
              candleIndex: cIdx,
              sweep,
            } as LiquiditySweepEvent);
          }
        }
      }
    }

    return { levels, sweeps, events };
  }
}
