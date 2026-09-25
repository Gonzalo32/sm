/**
 * Core Market - Candle Validation & Integrity Engine
 * Pure logic decoupled from browser APIs.
 */

import { Candle } from './Candle';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SeriesValidationResult {
  isValid: boolean;
  errors: string[];
  duplicates: number[];
  outOfOrder: number[];
  gaps: { index: number; expectedIntervalMs: number; actualDiffMs: number }[];
}

export class CandleValidator {
  /**
   * Validates individual candle integrity:
   * - Valid numeric values (non-NaN, finite, positive)
   * - OHLC logical relationships:
   *     high >= max(open, close)
   *     low <= min(open, close)
   *     high >= low
   */
  public static validateCandle(candle: Candle): ValidationResult {
    const errors: string[] = [];

    if (!candle) {
      return { isValid: false, errors: ['Candle object is null or undefined'] };
    }

    const { timestamp, open, high, low, close, volume } = candle;

    // 1. Timestamp validation
    if (typeof timestamp !== 'number' || isNaN(timestamp) || !isFinite(timestamp) || timestamp <= 0) {
      errors.push(`Invalid timestamp: ${timestamp}`);
    }

    // 2. Numeric type and finite check for OHLC
    const values = { open, high, low, close };
    for (const [key, val] of Object.entries(values)) {
      if (typeof val !== 'number' || isNaN(val) || !isFinite(val) || val <= 0) {
        errors.push(`Invalid ${key} price value: ${val}`);
      }
    }

    // 3. Logical price relationships
    if (high < Math.max(open, close)) {
      errors.push(`High (${high}) is less than max(open, close) (${Math.max(open, close)})`);
    }

    if (low > Math.min(open, close)) {
      errors.push(`Low (${low}) is greater than min(open, close) (${Math.min(open, close)})`);
    }

    if (high < low) {
      errors.push(`High (${high}) is less than Low (${low})`);
    }

    // 4. Volume check (optional)
    if (volume !== undefined && (typeof volume !== 'number' || isNaN(volume) || !isFinite(volume) || volume < 0)) {
      errors.push(`Invalid volume value: ${volume}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates a series of candles for monotonicity, duplicates, out-of-order timestamps, and gaps.
   */
  public static validateSeries(candles: Candle[], expectedIntervalMs?: number): SeriesValidationResult {
    const errors: string[] = [];
    const duplicates: number[] = [];
    const outOfOrder: number[] = [];
    const gaps: SeriesValidationResult['gaps'] = [];

    if (!Array.isArray(candles) || candles.length === 0) {
      return {
        isValid: true,
        errors: [],
        duplicates: [],
        outOfOrder: [],
        gaps: [],
      };
    }

    // Validate first candle
    const firstVal = this.validateCandle(candles[0]);
    if (!firstVal.isValid) {
      errors.push(`Candle at index 0 invalid: ${firstVal.errors.join('; ')}`);
    }

    for (let i = 1; i < candles.length; i++) {
      const prev = candles[i - 1];
      const curr = candles[i];

      const val = this.validateCandle(curr);
      if (!val.isValid) {
        errors.push(`Candle at index ${i} invalid: ${val.errors.join('; ')}`);
      }

      if (curr.timestamp === prev.timestamp) {
        duplicates.push(i);
        errors.push(`Duplicate timestamp detected at index ${i}: ${curr.timestamp}`);
      } else if (curr.timestamp < prev.timestamp) {
        outOfOrder.push(i);
        errors.push(`Out of order timestamp at index ${i}: ${curr.timestamp} < ${prev.timestamp}`);
      } else if (expectedIntervalMs && expectedIntervalMs > 0) {
        const diff = curr.timestamp - prev.timestamp;
        if (diff > expectedIntervalMs * 1.5) {
          gaps.push({
            index: i,
            expectedIntervalMs,
            actualDiffMs: diff,
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      duplicates,
      outOfOrder,
      gaps,
    };
  }
}
