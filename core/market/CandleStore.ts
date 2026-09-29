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
  private maxLookbackDays: number = 60;
  private prunedCandlesCount: number = 0;

  constructor(symbol: string = 'MNQ', timeframe: Timeframe = '1m', maxLookbackDays: number = 60) {
    this.symbol = symbol;
    this.timeframe = timeframe;
    this.maxLookbackDays = maxLookbackDays;
  }

  public setContext(symbol: string, timeframe: Timeframe): boolean {
    const changed = this.symbol !== symbol || this.timeframe !== timeframe;
    if (changed) {
      this.symbol = symbol;
      this.timeframe = timeframe;
      this.candles = []; // Clear store on context change to maintain integrity
      this.prunedCandlesCount = 0;
    }
    return changed;
  }

  public getContext(): { symbol: string; timeframe: Timeframe } {
    return { symbol: this.symbol, timeframe: this.timeframe };
  }

  public setMaxLookbackDays(days: number): void {
    this.maxLookbackDays = days;
    this.pruneOldCandles();
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
   * Prunes candles older than maxLookbackDays from the latest candle timestamp.
   */
  public pruneOldCandles(): number {
    if (this.candles.length === 0 || this.maxLookbackDays <= 0) return 0;
    const latestTs = this.candles[this.candles.length - 1].timestamp;
    const maxWindowMs = this.maxLookbackDays * 24 * 60 * 60 * 1000;
    const cutoffTs = latestTs - maxWindowMs;

    const initialLength = this.candles.length;
    this.candles = this.candles.filter((c) => c.timestamp >= cutoffTs);
    const removed = initialLength - this.candles.length;
    this.prunedCandlesCount += removed;
    return removed;
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
      this.pruneOldCandles();
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
   * Bulk loads historical candles, validating, sorting, deduplicating, and pruning to lookback window.
   */
  public loadHistory(rawHistory: Candle[]): { loaded: number; skipped: number; pruned: number } {
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
    const pruned = this.pruneOldCandles();

    return { loaded, skipped, pruned };
  }

  public getMemoryWindowStatus(): {
    requestedLookbackDays: number;
    actualAvailableLookbackDays: number;
    candleCount: number;
    firstTimestamp: number | null;
    lastTimestamp: number | null;
    prunedCandlesCount: number;
  } {
    const candleCount = this.candles.length;
    const firstTimestamp = candleCount > 0 ? this.candles[0].timestamp : null;
    const lastTimestamp = candleCount > 0 ? this.candles[candleCount - 1].timestamp : null;
    const actualAvailableLookbackDays =
      firstTimestamp !== null && lastTimestamp !== null
        ? (lastTimestamp - firstTimestamp) / (24 * 60 * 60 * 1000)
        : 0;

    return {
      requestedLookbackDays: this.maxLookbackDays,
      actualAvailableLookbackDays,
      candleCount,
      firstTimestamp,
      lastTimestamp,
      prunedCandlesCount: this.prunedCandlesCount,
    };
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
    this.prunedCandlesCount = 0;
  }
}
