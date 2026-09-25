import { describe, it, expect, beforeEach } from 'vitest';
import { Candle, CandleStore, CandleValidator } from '../core/market';

describe('Checkpoint 1 — Candle Data Pipeline & Storage Core', () => {
  let store: CandleStore;

  beforeEach(() => {
    store = new CandleStore('MNQ', '1m');
  });

  describe('CandleValidator Unit Tests', () => {
    it('should validate a correct candle', () => {
      const validCandle: Candle = {
        timestamp: 1780000000000,
        open: 21450.0,
        high: 21480.0,
        low: 21440.0,
        close: 21475.0,
        volume: 500,
      };

      const result = CandleValidator.validateCandle(validCandle);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject an invalid candle with null/NaN values', () => {
      const invalidCandle = {
        timestamp: NaN,
        open: 21450.0,
        high: NaN,
        low: 21440.0,
        close: 21475.0,
      } as Candle;

      const result = CandleValidator.validateCandle(invalidCandle);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject inconsistent OHLC where High < max(Open, Close)', () => {
      const inconsistentCandle: Candle = {
        timestamp: 1780000000000,
        open: 21450.0,
        high: 21440.0, // High lower than Open!
        low: 21430.0,
        close: 21445.0,
      };

      const result = CandleValidator.validateCandle(inconsistentCandle);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('High (21440) is less than max(open, close)');
    });

    it('should reject inconsistent OHLC where Low > min(Open, Close)', () => {
      const inconsistentCandle: Candle = {
        timestamp: 1780000000000,
        open: 21450.0,
        high: 21480.0,
        low: 21460.0, // Low higher than Open!
        close: 21470.0,
      };

      const result = CandleValidator.validateCandle(inconsistentCandle);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Low (21460) is greater than min(open, close)');
    });

    it('should detect duplicate timestamps in a series', () => {
      const series: Candle[] = [
        { timestamp: 1000, open: 10, high: 12, low: 9, close: 11 },
        { timestamp: 1000, open: 10, high: 13, low: 8, close: 12 }, // Duplicate!
      ];

      const res = CandleValidator.validateSeries(series);
      expect(res.isValid).toBe(false);
      expect(res.duplicates).toContain(1);
    });

    it('should detect timestamps out of order in a series', () => {
      const series: Candle[] = [
        { timestamp: 2000, open: 10, high: 12, low: 9, close: 11 },
        { timestamp: 1000, open: 10, high: 13, low: 8, close: 12 }, // Out of order!
      ];

      const res = CandleValidator.validateSeries(series);
      expect(res.isValid).toBe(false);
      expect(res.outOfOrder).toContain(1);
    });
  });

  describe('CandleStore Ingestion & Event Emission', () => {
    it('should emit ICT_NEW_CANDLE when first candle is ingested', () => {
      const events: string[] = [];
      store.subscribe((e) => events.push(e.type));

      const c1: Candle = { timestamp: 1780000000000, open: 100, high: 105, low: 99, close: 104 };
      store.ingestCandle(c1);

      expect(events).toEqual(['ICT_NEW_CANDLE']);
      expect(store.getCandleCount()).toBe(1);
    });

    it('should emit ICT_CANDLE_UPDATE when same timestamp is ingested with updated tick', () => {
      const events: string[] = [];
      store.subscribe((e) => events.push(e.type));

      const c1: Candle = { timestamp: 1780000000000, open: 100, high: 105, low: 99, close: 104 };
      store.ingestCandle(c1);

      const c1Update: Candle = { timestamp: 1780000000000, open: 100, high: 108, low: 99, close: 107 };
      store.ingestCandle(c1Update);

      expect(events).toEqual(['ICT_NEW_CANDLE', 'ICT_CANDLE_UPDATE']);
      expect(store.getCandleCount()).toBe(1);
      expect(store.getLatestCandle()?.high).toBe(108);
      expect(store.getLatestCandle()?.close).toBe(107);
    });

    it('should emit ICT_CANDLE_CLOSE and ICT_NEW_CANDLE when new timestamp arrives', () => {
      const events: string[] = [];
      store.subscribe((e) => events.push(e.type));

      const c1: Candle = { timestamp: 1780000000000, open: 100, high: 105, low: 99, close: 104 };
      store.ingestCandle(c1);

      const c2: Candle = { timestamp: 1780000060000, open: 104, high: 109, low: 103, close: 108 };
      store.ingestCandle(c2);

      expect(events).toEqual(['ICT_NEW_CANDLE', 'ICT_CANDLE_CLOSE', 'ICT_NEW_CANDLE']);
      expect(store.getCandleCount()).toBe(2);
    });

    it('should reset store and notify when symbol or timeframe changes', () => {
      const c1: Candle = { timestamp: 1780000000000, open: 100, high: 105, low: 99, close: 104 };
      store.ingestCandle(c1);
      expect(store.getCandleCount()).toBe(1);

      // Change symbol & timeframe
      const changed = store.setContext('NQ', '5m');
      expect(changed).toBe(true);
      expect(store.getCandleCount()).toBe(0);
      expect(store.getContext()).toEqual({ symbol: 'NQ', timeframe: '5m' });
    });
  });
});
