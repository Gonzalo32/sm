import { describe, it, expect } from 'vitest';
import { Candle, TradeSeaProbeResult } from '../core/market/types';

describe('Market Data Models & Probe Types', () => {
  it('should format a candle correctly', () => {
    const candle: Candle = {
      timestamp: 1780000000000,
      open: 21450.0,
      high: 21480.0,
      low: 21440.0,
      close: 21475.0,
      volume: 1250,
    };

    expect(candle.open).toBeLessThanOrEqual(candle.high);
    expect(candle.low).toBeLessThanOrEqual(candle.close);
    expect(candle.volume).toBeGreaterThan(0);
  });

  it('should validate TradeSea probe payload structure', () => {
    const probe: TradeSeaProbeResult = {
      symbol: 'MNQ',
      timeframe: '1m',
      candleCount: 1500,
      chartFramework: 'TradingView Library',
      wsConnected: true,
      timestamp: Date.now(),
    };

    expect(probe.symbol).toBe('MNQ');
    expect(probe.chartFramework).toBe('TradingView Library');
  });
});
