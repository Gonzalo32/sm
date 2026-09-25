/**
 * Core Market - Candle Store & Event Engine
 * Decoupled in-memory time series storage and event manager.
 */

import { Candle, CandleEvent, Timeframe } from './Candle';
import { CandleValidator } from './CandleValidator';

export type CandleEventListener = (event: CandleEvent) => void;

export class CandleStore {
  private symbol: string;
  private timeframe: Timeframe;
  private candles: Candle[] = [];
  private listeners: Set<CandleEventListener> = new Set();

  constructor(symbol: string = 'MNQ', timeframe: Timeframe = '1m') {
    this.symbol = symbol;
    this.timeframe = timeframe;
  }

  public setContext(symbol: string, timeframe: Timeframe): boolean {
    const changed = this.symbol !== symbol || this.timeframe !== timeframe;
    if (changed) {
      this.symbol = symbol;
      this.timeframe = timeframe;
      this.candles = []; // Clear store on context change to maintain integrity
    }
    return changed;
  }

  public getContext(): { symbol: string; timeframe: Timeframe } {
    return { symbol: this.symbol, timeframe: this.timeframe };
  }

  public subscribe(listener: CandleEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(event: CandleEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[CandleStore] Listener error:', err);
      }
    }
  }

  /**
   * Ingests a new or updating candle into the store.
   * Performs validation, and explicitly triggers:
   * - ICT_CANDLE_UPDATE if timestamp matches current active candle.
   * - ICT_CANDLE_CLOSE and ICT_NEW_CANDLE if timestamp is newer than current active candle.
   */
  public ingestCandle(rawCandle: Candle): { success: boolean; eventType?: string; error?: string } {
    const val = CandleValidator.validateCandle(rawCandle);
    if (!val.isValid) {
      return { success: false, error: `Invalid candle: ${val.errors.join('; ')}` };
    }

    const candle: Candle = { ...rawCandle };

    if (this.candles.length === 0) {
      this.candles.push(candle);
      this.notify({
        type: 'ICT_NEW_CANDLE',
        candle,
        symbol: this.symbol,
        timeframe: this.timeframe,
        timestamp: Date.now(),
      });
      return { success: true, eventType: 'ICT_NEW_CANDLE' };
    }

    const lastIndex = this.candles.length - 1;
    const lastCandle = this.candles[lastIndex];

    if (candle.timestamp === lastCandle.timestamp) {
      // Update existing candle (e.g. tick update)
      const prevCandle = { ...lastCandle };
      this.candles[lastIndex] = {
        timestamp: candle.timestamp,
        open: lastCandle.open, // Preserve original open of active candle
        high: Math.max(lastCandle.high, candle.high),
        low: Math.min(lastCandle.low, candle.low),
        close: candle.close,
        volume: candle.volume !== undefined ? (lastCandle.volume || 0) + candle.volume : lastCandle.volume,
      };

      this.notify({
        type: 'ICT_CANDLE_UPDATE',
        candle: this.candles[lastIndex],
        previousCandle: prevCandle,
        symbol: this.symbol,
        timeframe: this.timeframe,
        timestamp: Date.now(),
      });

      return { success: true, eventType: 'ICT_CANDLE_UPDATE' };
    } else if (candle.timestamp > lastCandle.timestamp) {
      // New candle arrived -> Close previous candle, then emit new candle
      const closedCandle = { ...lastCandle };
      
      // 1. Emit Close Event for previous candle
      this.notify({
        type: 'ICT_CANDLE_CLOSE',
        candle: closedCandle,
        symbol: this.symbol,
        timeframe: this.timeframe,
        timestamp: Date.now(),
      });

      // 2. Add and Emit New Candle Event
      this.candles.push(candle);
      this.notify({
        type: 'ICT_NEW_CANDLE',
        candle,
        previousCandle: closedCandle,
        symbol: this.symbol,
        timeframe: this.timeframe,
        timestamp: Date.now(),
      });

      return { success: true, eventType: 'ICT_NEW_CANDLE' };
    } else {
      // Out of order past timestamp - reject or handle historical backfill
      return {
        success: false,
        error: `Out of order timestamp received: ${candle.timestamp} < ${lastCandle.timestamp}`,
      };
    }
  }

  /**
   * Bulk loads historical candles, validating and sorting them.
   */
  public loadHistory(rawHistory: Candle[]): { loaded: number; skipped: number } {
    let loaded = 0;
    let skipped = 0;

    const validCandles: Candle[] = [];

    for (const c of rawHistory) {
      if (CandleValidator.validateCandle(c).isValid) {
        validCandles.push({ ...c });
      } else {
        skipped++;
      }
    }

    // Sort by timestamp ascending
    validCandles.sort((a, b) => a.timestamp - b.timestamp);

    // Deduplicate by timestamp
    const deduplicated: Candle[] = [];
    for (const c of validCandles) {
      if (deduplicated.length === 0 || deduplicated[deduplicated.length - 1].timestamp !== c.timestamp) {
        deduplicated.push(c);
        loaded++;
      } else {
        skipped++;
      }
    }

    this.candles = deduplicated;
    return { loaded, skipped };
  }

  public getCandles(): Candle[] {
    return [...this.candles];
  }

  public getLatestCandle(): Candle | undefined {
    return this.candles.length > 0 ? { ...this.candles[this.candles.length - 1] } : undefined;
  }

  public getCandleCount(): number {
    return this.candles.length;
  }

  public clear(): void {
    this.candles = [];
  }
}
