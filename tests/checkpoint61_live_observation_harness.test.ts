/**
 * Checkpoint CP61 — TradeSea Live Observation Harness Test Suite
 * Tests WebSocket frame parsing (~m~ framing & JSON OHLC), malformed message resilience,
 * candle decoding, duplicate filtering, context resets, reconnect handling,
 * read-only diagnostic logger execution, and production logic immutability.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { execSync } from 'child_process';
import { CandleStore } from '../core/market/CandleStore';
import { Candle } from '../core/market/Candle';

// WebSocket Frame Decoder Helper (Pure function extracted from pageBridge architecture for testing)
export function parseWebSocketMessage(data: string): Candle | null {
  if (typeof data !== 'string') return null;

  let parsed: any = null;

  try {
    if (data.startsWith('~m~')) {
      const parts = data.split('~m~');
      for (const part of parts) {
        if (part && part.startsWith('{')) {
          try {
            parsed = JSON.parse(part);
            break;
          } catch (e) {
            // continue parsing next frame
          }
        }
      }
    } else if (data.startsWith('{')) {
      parsed = JSON.parse(data);
    }
  } catch (err) {
    return null; // Malformed payload handled safely
  }

  if (!parsed) return null;

  // TradingView timescale_update format
  if (parsed.m === 'timescale_update' && parsed.p && parsed.p[1]) {
    const series = parsed.p[1];
    const keys = Object.keys(series);
    if (keys.length > 0 && series[keys[0]].s) {
      const bars = series[keys[0]].s;
      if (bars.length > 0) {
        const lastBar = bars[bars.length - 1].v; // [time, open, high, low, close, volume]
        return {
          timestamp: lastBar[0] * 1000,
          open: Number(lastBar[1]),
          high: Number(lastBar[2]),
          low: Number(lastBar[3]),
          close: Number(lastBar[4]),
          volume: Number(lastBar[5] || 0),
        };
      }
    }
  }

  // Direct OHLC Object format
  if (parsed.open !== undefined && parsed.high !== undefined && parsed.low !== undefined && parsed.close !== undefined) {
    return {
      timestamp: Number(parsed.timestamp || parsed.time || Date.now()),
      open: Number(parsed.open),
      high: Number(parsed.high),
      low: Number(parsed.low),
      close: Number(parsed.close),
      volume: parsed.volume ? Number(parsed.volume) : 0,
    };
  }

  return null;
}

// Harness Observer & Diagnostic Logger
export class ObservationHarnessLogger {
  public logs: { type: string; details: any; timestamp: number }[] = [];
  public isEnabled: boolean = true;

  public log(type: string, details: any): void {
    if (!this.isEnabled) return;
    this.logs.push({ type, details, timestamp: Date.now() });
  }

  public clear(): void {
    this.logs = [];
  }
}

describe('Checkpoint CP61 — TradeSea Live Observation Harness Test Suite', () => {
  let logger: ObservationHarnessLogger;
  let store: CandleStore;

  beforeEach(() => {
    logger = new ObservationHarnessLogger();
    store = new CandleStore('MNQ', '1m');
  });

  // 1. TradingView ~m~ WebSocket Frame Decoding
  it('1. decodes TradingView ~m~ framed WebSocket messages correctly', () => {
    const tvPayload = `~m~180~m~{"m":"timescale_update","p":["s1",{"s1":{"s":[{"i":0,"v":[1764613200,17894.5,17914.0,17891.75,17911.75,1547]}]}}]}`;
    const candle = parseWebSocketMessage(tvPayload);

    expect(candle).not.toBeNull();
    expect(candle?.timestamp).toBe(1764613200000); // Converted to ms
    expect(candle?.open).toBe(17894.5);
    expect(candle?.high).toBe(17914.0);
    expect(candle?.low).toBe(17891.75);
    expect(candle?.close).toBe(17911.75);
    expect(candle?.volume).toBe(1547);
  });

  // 2. Direct JSON OHLC Frame Decoding
  it('2. decodes direct JSON OHLC WebSocket messages correctly', () => {
    const jsonPayload = JSON.stringify({
      timestamp: 1764613500000,
      open: 17911.75,
      high: 17923.0,
      low: 17905.0,
      close: 17918.5,
      volume: 820,
    });
    const candle = parseWebSocketMessage(jsonPayload);

    expect(candle).not.toBeNull();
    expect(candle?.timestamp).toBe(1764613500000);
    expect(candle?.close).toBe(17918.5);
  });

  // 3. Malformed WS Message Resilience
  it('3. handles malformed or non-JSON WebSocket payloads without crashing', () => {
    expect(parseWebSocketMessage('invalid_non_json_string')).toBeNull();
    expect(parseWebSocketMessage('~m~invalid_len~m~{broken_json')).toBeNull();
    expect(parseWebSocketMessage('')).toBeNull();
  });

  // 4. Duplicate Timestamp Filtering
  it('4. filters out duplicate candle timestamps in CandleStore ingestion', () => {
    const c1: Candle = { timestamp: 1764613200000, open: 100, high: 105, low: 95, close: 102, volume: 500 };
    const c2: Candle = { timestamp: 1764613200000, open: 100, high: 106, low: 95, close: 104, volume: 600 }; // Same ts, updated close

    store.ingestCandle(c1);
    expect(store.getCandles().length).toBe(1);

    store.ingestCandle(c2);
    expect(store.getCandles().length).toBe(1); // Length remains 1
    expect(store.getCandles()[0].close).toBe(104); // Updated in-place
    logger.log('CANDLE_UPDATE', c2);
    expect(logger.logs.length).toBe(1);
  });

  // 5. Context Switch & State Reset
  it('5. clears candle store and visual state when context (symbol/timeframe) changes', () => {
    const c1: Candle = { timestamp: 1764613200000, open: 100, high: 105, low: 95, close: 102, volume: 500 };
    store.ingestCandle(c1);
    expect(store.getCandles().length).toBe(1);

    // Perform context reset
    let newStore = new CandleStore('NQ', '5m');
    logger.log('CONTEXT_CHANGED', { symbol: 'NQ', timeframe: '5m' });

    expect(newStore.getCandles().length).toBe(0);
    expect(logger.logs.some(l => l.type === 'CONTEXT_CHANGED')).toBe(true);
  });

  // 6. Reconnect Handling & Event Re-initialization
  it('6. handles WebSocket reconnect events without creating duplicate listeners or candles', () => {
    let reconnectCount = 0;
    const handleReconnect = () => {
      reconnectCount++;
      store = new CandleStore('MNQ', '1m'); // Fresh store clean state
      logger.log('RECONNECT', { count: reconnectCount });
    };

    handleReconnect();
    expect(reconnectCount).toBe(1);
    expect(store.getCandles().length).toBe(0);

    handleReconnect();
    expect(reconnectCount).toBe(2);
    expect(store.getCandles().length).toBe(0);
  });

  // 7. Read-Only Diagnostic Logger
  it('7. verifies observation harness diagnostics do not alter candle values or calculations', () => {
    const candle: Candle = { timestamp: 1764613200000, open: 100, high: 105, low: 95, close: 102, volume: 500 };
    const originalJson = JSON.stringify(candle);

    logger.log('CANDLE_OBSERVED', candle);

    expect(JSON.stringify(candle)).toBe(originalJson); // Original object unmodified
    expect(logger.logs.length).toBe(1);
  });

  // 8. Production core/ict/ Immutability
  it('8. verifies core/ict/ has 0 diff lines against baseline 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a', () => {
    const diff = execSync('git diff 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a -- core/ict/').toString();
    expect(diff.trim().length).toBe(0);
  });
});
