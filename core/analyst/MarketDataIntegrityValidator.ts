/**
 * Core Analyst - Market Data Integrity & Freshness Validator
 * Pure deterministic validator for market candle arrays prior to analysis.
 * Verifies ordering, duplicates, gaps, sufficiency, and data freshness.
 */

import { Candle, Timeframe } from '../market/Candle';
import { CandleValidator } from '../market/CandleValidator';
import { MarketDataIntegrityCheck, MarketRiskFilterConfig, DEFAULT_RISK_FILTER_CONFIG } from './MarketAnalystTypes';

export class MarketDataIntegrityValidator {
  private config: MarketRiskFilterConfig;

  constructor(config: Partial<MarketRiskFilterConfig> = {}) {
    this.config = { ...DEFAULT_RISK_FILTER_CONFIG, ...config };
  }

  /**
   * Validates a series of market candles against integrity and freshness criteria.
   *
   * @param candles Raw candle series
   * @param timeframe Active timeframe
   * @param currentTimestampMs Current system or simulation timestamp in ms
   * @returns MarketDataIntegrityCheck summary
   */
  public validate(
    candles: Candle[],
    timeframe: Timeframe = '1m',
    currentTimestampMs: number = Date.now()
  ): MarketDataIntegrityCheck {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(candles) || candles.length === 0) {
      return {
        valid: false,
        candleCount: 0,
        stale: false,
        ageMs: 0,
        gapsDetected: 0,
        duplicatesDetected: 0,
        outOfOrderDetected: 0,
        errors: ['Candle array is empty or undefined'],
        warnings: [],
      };
    }

    const candleCount = candles.length;

    // 1. Minimum Lookback Requirement
    if (candleCount < this.config.minLookbackCandles) {
      errors.push(
        `Insufficient lookback: received ${candleCount} candles, minimum required is ${this.config.minLookbackCandles}`
      );
    }

    // 2. Expected interval based on timeframe
    const expectedIntervalMs =
      timeframe === '1m'
        ? 60000
        : timeframe === '5m'
        ? 300000
        : timeframe === '15m'
        ? 900000
        : 60000;

    // 3. Series Integrity Check
    const seriesVal = CandleValidator.validateSeries(candles, expectedIntervalMs);
    if (!seriesVal.isValid) {
      errors.push(...seriesVal.errors);
    }

    const duplicatesDetected = seriesVal.duplicates.length;
    const outOfOrderDetected = seriesVal.outOfOrder.length;
    const gapsDetected = seriesVal.gaps.length;

    if (duplicatesDetected > 0) {
      errors.push(`Detected ${duplicatesDetected} duplicate candle timestamps`);
    }

    if (outOfOrderDetected > 0) {
      errors.push(`Detected ${outOfOrderDetected} out-of-order candle timestamps`);
    }

    if (gapsDetected > 0) {
      warnings.push(`Detected ${gapsDetected} time intervals exceeding standard bar spacing`);
    }

    // 4. Freshness Evaluation
    const latestCandle = candles[candles.length - 1];
    const latestTs = latestCandle.timestamp;
    const ageMs = Math.max(0, currentTimestampMs - latestTs);
    const isStale = ageMs > this.config.maxStaleDataMs;

    if (isStale) {
      warnings.push(
        `Market data appears stale: latest candle timestamp (${new Date(
          latestTs
        ).toISOString()}) is ${Math.round(ageMs / 1000)}s older than current time (${new Date(
          currentTimestampMs
        ).toISOString()})`
      );
    }

    return {
      valid: errors.length === 0,
      candleCount,
      stale: isStale,
      ageMs,
      gapsDetected,
      duplicatesDetected,
      outOfOrderDetected,
      errors,
      warnings,
    };
  }
}
