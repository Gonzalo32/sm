/**
 * ICT Historical Replay Engine - Browser-Independent Orchestrator
 * Evaluates historical market data candle-by-candle with strict anti-lookahead guarantees.
 */

import { Candle, Timeframe } from '../../market/Candle';
import { ReplayState, ReplayEventListener } from './ReplayTypes';

export class ReplayEngine {
  private symbol: string = 'MNQ';
  private timeframe: Timeframe = '1m';
  private candles: Candle[] = [];
  private currentIndex: number = -1;
  private isPlaying: boolean = false;
  private speedMs: number = 500;
  private playTimer: any = null;
  private listeners: Set<ReplayEventListener> = new Set();

  constructor(symbol: string = 'MNQ', timeframe: Timeframe = '1m') {
    this.symbol = symbol;
    this.timeframe = timeframe;
  }

  public loadDataset(candles: Candle[], symbol?: string, timeframe?: Timeframe): ReplayState {
    this.pause();

    if (symbol) this.symbol = symbol;
    if (timeframe) this.timeframe = timeframe;

    // Clone and sort by timestamp ascending
    const validCandles = [...candles].sort((a, b) => a.timestamp - b.timestamp);

    // Deduplicate timestamps
    const deduplicated: Candle[] = [];
    for (const c of validCandles) {
      if (deduplicated.length === 0 || deduplicated[deduplicated.length - 1].timestamp !== c.timestamp) {
        deduplicated.push({ ...c });
      }
    }

    this.candles = deduplicated;
    this.currentIndex = this.candles.length > 0 ? 0 : -1;

    const state = this.getState();
    this.notify(state, this.getCurrentSlice());
    return state;
  }

  public reset(): ReplayState {
    this.pause();
    this.currentIndex = this.candles.length > 0 ? 0 : -1;
    const state = this.getState();
    this.notify(state, this.getCurrentSlice());
    return state;
  }

  public stepForward(n: number = 1): ReplayState {
    if (this.candles.length === 0) return this.getState();

    const maxIdx = this.candles.length - 1;
    const targetIdx = Math.min(maxIdx, this.currentIndex + n);

    this.currentIndex = targetIdx;

    if (this.currentIndex >= maxIdx && this.isPlaying) {
      this.pause();
    }

    const state = this.getState();
    this.notify(state, this.getCurrentSlice());
    return state;
  }

  public stepBackward(): ReplayState {
    if (this.candles.length === 0) return this.getState();

    this.currentIndex = Math.max(0, this.currentIndex - 1);
    const state = this.getState();
    this.notify(state, this.getCurrentSlice());
    return state;
  }

  public play(speedMs?: number): ReplayState {
    if (speedMs && speedMs > 0) {
      this.speedMs = speedMs;
    }

    if (this.candles.length === 0 || this.currentIndex >= this.candles.length - 1) {
      this.isPlaying = false;
      return this.getState();
    }

    if (this.isPlaying) return this.getState();

    this.isPlaying = true;

    const tick = () => {
      if (!this.isPlaying) return;
      if (this.currentIndex >= this.candles.length - 1) {
        this.pause();
        return;
      }
      this.stepForward(1);
    };

    if (typeof setInterval !== 'undefined') {
      this.playTimer = setInterval(tick, this.speedMs);
    }

    const state = this.getState();
    this.notify(state, this.getCurrentSlice());
    return state;
  }

  public pause(): ReplayState {
    this.isPlaying = false;
    if (this.playTimer !== null) {
      if (typeof clearInterval !== 'undefined') {
        clearInterval(this.playTimer);
      }
      this.playTimer = null;
    }
    const state = this.getState();
    this.notify(state, this.getCurrentSlice());
    return state;
  }

  public setSpeed(speedMs: number): void {
    if (speedMs <= 0) return;
    this.speedMs = speedMs;
    if (this.isPlaying) {
      this.pause();
      this.play(speedMs);
    }
  }

  public subscribe(listener: ReplayEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(state: ReplayState, currentSlice: Candle[]): void {
    for (const listener of this.listeners) {
      try {
        listener(state, currentSlice);
      } catch (err) {
        console.error('[ReplayEngine] Listener error:', err);
      }
    }
  }

  public getCurrentSlice(): Candle[] {
    if (this.candles.length === 0 || this.currentIndex < 0) return [];
    // Strict anti look-ahead: return slice ONLY up to currentIndex
    return this.candles.slice(0, this.currentIndex + 1).map((c) => ({ ...c }));
  }

  public getFullDataset(): Candle[] {
    return this.candles.map((c) => ({ ...c }));
  }

  public getState(): ReplayState {
    const currentCandle = this.candles[this.currentIndex];
    return {
      symbol: this.symbol,
      timeframe: this.timeframe,
      currentIndex: this.currentIndex,
      currentTimestamp: currentCandle ? currentCandle.timestamp : 0,
      totalCandles: this.candles.length,
      isPlaying: this.isPlaying,
      speedMs: this.speedMs,
    };
  }
}
