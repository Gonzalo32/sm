import { describe, it, expect } from 'vitest';
import { MarketDataIntegrityValidator } from '../core/analyst/MarketDataIntegrityValidator';
import { Candle } from '../core/market/Candle';

function generateCandles(count: number, startTs: number = 1700000000000, intervalMs: number = 60000): Candle[] {
  const candles: Candle[] = [];
  let price = 20000;
  for (let i = 0; i < count; i++) {
    const ts = startTs + i * intervalMs;
    const open = price;
    const high = price + 5;
    const low = price - 5;
    const close = price + 2;
    price = close;
    candles.push({
      timestamp: ts,
      open,
      high,
      low,
      close,
      volume: 100,
    });
  }
  return candles;
}

describe('TradeSea Market Analyst — Data Integrity & Freshness Tests', () => {
  const validator = new MarketDataIntegrityValidator({
    minLookbackCandles: 30,
    maxStaleDataMs: 300000, // 5 min
  });

  it('1. validates a clean, strictly time-ordered candle series with >= 30 candles', () => {
    const candles = generateCandles(35, 1700000000000);
    const evalTs = candles[candles.length - 1].timestamp + 30000; // 30s after latest candle

    const result = validator.validate(candles, '1m', evalTs);
    expect(result.valid).toBe(true);
    expect(result.candleCount).toBe(35);
    expect(result.stale).toBe(false);
    expect(result.duplicatesDetected).toBe(0);
    expect(result.outOfOrderDetected).toBe(0);
    expect(result.errors.length).toBe(0);
  });

  it('2. rejects candle series with insufficient lookback (< 30 candles)', () => {
    const candles = generateCandles(15);
    const result = validator.validate(candles, '1m');

    expect(result.valid).toBe(false);
    expect(result.candleCount).toBe(15);
    expect(result.errors.some((e) => e.includes('Insufficient lookback'))).toBe(true);
  });

  it('3. detects duplicate candle timestamps and flags error', () => {
    const candles = generateCandles(35);
    // Duplicate timestamp between index 10 and 11
    candles[11].timestamp = candles[10].timestamp;

    const result = validator.validate(candles, '1m');
    expect(result.valid).toBe(false);
    expect(result.duplicatesDetected).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.includes('duplicate'))).toBe(true);
  });

  it('4. detects out-of-order timestamps and flags error', () => {
    const candles = generateCandles(35);
    // Swap timestamp of 15 and 16
    const tmp = candles[15].timestamp;
    candles[15].timestamp = candles[16].timestamp + 1000;
    candles[16].timestamp = tmp;

    const result = validator.validate(candles, '1m');
    expect(result.valid).toBe(false);
    expect(result.outOfOrderDetected).toBeGreaterThan(0);
  });

  it('5. detects stale market data when latest candle is older than maxStaleDataMs', () => {
    const candles = generateCandles(35, 1700000000000);
    const latestTs = candles[candles.length - 1].timestamp;
    const currentClockMs = latestTs + 600000; // 10 minutes later (> 5 min threshold)

    const result = validator.validate(candles, '1m', currentClockMs);
    expect(result.valid).toBe(true); // Structure is valid, but stale flag is set
    expect(result.stale).toBe(true);
    expect(result.ageMs).toBe(600000);
    expect(result.warnings.some((w) => w.includes('stale'))).toBe(true);
  });

  it('6. handles empty or null candle series gracefully without throwing', () => {
    const emptyResult = validator.validate([], '1m');
    expect(emptyResult.valid).toBe(false);
    expect(emptyResult.candleCount).toBe(0);

    const nullResult = validator.validate(null as any, '1m');
    expect(nullResult.valid).toBe(false);
  });
});
