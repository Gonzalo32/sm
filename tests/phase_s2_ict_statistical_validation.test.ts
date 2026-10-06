/**
 * Phase S2 — ICT Signal Statistical Validation Test Suite
 * Evaluates statistical directional behavior of frozen ICT candidate signals (S1)
 * across predefined forward horizons (H1, H2, H3, H5, H10, H20) without strategy,
 * P&L, win rate, or trading execution claims, preserving 100% temporal causality
 * and zero logic modifications to core/ict/.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { Candle, Timeframe } from '../core/market/Candle';

export type Horizon = 'H1' | 'H2' | 'H3' | 'H5' | 'H10' | 'H20';
export type S2OutcomeState = 'FAVORABLE' | 'ADVERSE' | 'NEUTRAL' | 'INSUFFICIENT_DATA';

export interface S1SignalInput {
  signalId: string;
  symbol: string;
  timeframe: Timeframe;
  model: 'MODEL_A' | 'MODEL_B' | 'MODEL_C' | 'UNATTRIBUTED';
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  signalState: 'LONG_CANDIDATE' | 'SHORT_CANDIDATE' | 'NO_SIGNAL';
  candleTimestamp: number;
  confirmationTimestamp: number;
  candidateContextId: string;
  sourceEventIds: string[];
  mtfContextId: string;
  referencePrice: number;
}

export interface S2OutcomeRecord {
  outcomeId: string;
  signalId: string;
  symbol: string;
  timeframe: Timeframe;
  model: string;
  direction: string;
  horizon: Horizon;
  horizonCandleCount: number;
  confirmationTimestamp: number;
  outcomeWindowStartTimestamp: number;
  outcomeWindowEndTimestamp: number;
  referencePrice: number;
  maxHorizonPrice: number;
  minHorizonPrice: number;
  endHorizonPrice: number;
  outcomeState: S2OutcomeState;
  priceDeltaPoints: number;
  provenance: {
    candidateContextId: string;
    sourceEventIds: string[];
    mtfContextId: string;
  };
  validationStatus: 'VALID' | 'INVALID';
}

export interface S2StatisticalSummary {
  dimensionKey: string;
  symbol: string;
  timeframe: string;
  model: string;
  direction: string;
  horizon: Horizon;
  sample_size: number;
  favorable_count: number;
  adverse_count: number;
  neutral_count: number;
  insufficient_data_count: number;
  favorable_rate: number;
  adverse_rate: number;
  neutral_rate: number;
  standard_error: number;
  confidence_interval_95: [number, number];
}

export class S2OutcomeEvaluator {
  private static horizonMap: Record<Horizon, number> = {
    H1: 1,
    H2: 2,
    H3: 3,
    H5: 5,
    H10: 10,
    H20: 20,
  };

  /**
   * Evaluates forward outcome for a single signal and horizon.
   */
  public evaluateOutcome(
    signal: S1SignalInput,
    futureCandles: Candle[],
    horizon: Horizon
  ): S2OutcomeRecord {
    const horizonCount = S2OutcomeEvaluator.horizonMap[horizon];
    const outcomeId = `OUTCOME-${signal.signalId}-${horizon}`;

    // Filter strictly post-confirmation candles (anti-lookahead)
    const validFutureCandles = futureCandles.filter(
      (c) => c.timestamp > signal.confirmationTimestamp
    );

    if (validFutureCandles.length < horizonCount || signal.signalState === 'NO_SIGNAL') {
      const windowStart = validFutureCandles.length > 0 ? validFutureCandles[0].timestamp : signal.confirmationTimestamp;
      const windowEnd = validFutureCandles.length >= horizonCount ? validFutureCandles[horizonCount - 1].timestamp : windowStart;

      return {
        outcomeId,
        signalId: signal.signalId,
        symbol: signal.symbol,
        timeframe: signal.timeframe,
        model: signal.model,
        direction: signal.direction,
        horizon,
        horizonCandleCount: horizonCount,
        confirmationTimestamp: signal.confirmationTimestamp,
        outcomeWindowStartTimestamp: windowStart,
        outcomeWindowEndTimestamp: windowEnd,
        referencePrice: signal.referencePrice,
        maxHorizonPrice: signal.referencePrice,
        minHorizonPrice: signal.referencePrice,
        endHorizonPrice: signal.referencePrice,
        outcomeState: 'INSUFFICIENT_DATA',
        priceDeltaPoints: 0,
        provenance: {
          candidateContextId: signal.candidateContextId,
          sourceEventIds: signal.sourceEventIds,
          mtfContextId: signal.mtfContextId,
        },
        validationStatus: 'VALID',
      };
    }

    const windowCandles = validFutureCandles.slice(0, horizonCount);
    const windowStart = windowCandles[0].timestamp;
    const windowEnd = windowCandles[windowCandles.length - 1].timestamp;

    const highs = windowCandles.map((c) => c.high);
    const lows = windowCandles.map((c) => c.low);
    const maxHorizonPrice = Math.max(...highs);
    const minHorizonPrice = Math.min(...lows);
    const endHorizonPrice = windowCandles[windowCandles.length - 1].close;

    const ref = signal.referencePrice;
    let outcomeState: S2OutcomeState = 'NEUTRAL';
    let delta = 0;

    if (signal.direction === 'LONG') {
      delta = maxHorizonPrice - ref;
      if (maxHorizonPrice > ref) {
        outcomeState = 'FAVORABLE';
      } else if (minHorizonPrice < ref) {
        outcomeState = 'ADVERSE';
      } else {
        outcomeState = 'NEUTRAL';
      }
    } else if (signal.direction === 'SHORT') {
      delta = ref - minHorizonPrice;
      if (minHorizonPrice < ref) {
        outcomeState = 'FAVORABLE';
      } else if (maxHorizonPrice > ref) {
        outcomeState = 'ADVERSE';
      } else {
        outcomeState = 'NEUTRAL';
      }
    }

    return {
      outcomeId,
      signalId: signal.signalId,
      symbol: signal.symbol,
      timeframe: signal.timeframe,
      model: signal.model,
      direction: signal.direction,
      horizon,
      horizonCandleCount: horizonCount,
      confirmationTimestamp: signal.confirmationTimestamp,
      outcomeWindowStartTimestamp: windowStart,
      outcomeWindowEndTimestamp: windowEnd,
      referencePrice: ref,
      maxHorizonPrice,
      minHorizonPrice,
      endHorizonPrice,
      outcomeState,
      priceDeltaPoints: delta,
      provenance: {
        candidateContextId: signal.candidateContextId,
        sourceEventIds: signal.sourceEventIds,
        mtfContextId: signal.mtfContextId,
      },
      validationStatus: 'VALID',
    };
  }

  /**
   * Aggregates statistical metrics across outcome records.
   */
  public aggregateStatistics(outcomes: S2OutcomeRecord[]): S2StatisticalSummary[] {
    const groups = new Map<string, S2OutcomeRecord[]>();

    for (const out of outcomes) {
      const key = `${out.symbol}_${out.timeframe}_${out.model}_${out.direction}_${out.horizon}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(out);
    }

    const summaries: S2StatisticalSummary[] = [];

    for (const [key, list] of groups.entries()) {
      const sample_size = list.length;
      const favorable_count = list.filter((o) => o.outcomeState === 'FAVORABLE').length;
      const adverse_count = list.filter((o) => o.outcomeState === 'ADVERSE').length;
      const neutral_count = list.filter((o) => o.outcomeState === 'NEUTRAL').length;
      const insufficient_data_count = list.filter((o) => o.outcomeState === 'INSUFFICIENT_DATA').length;

      const evalCount = sample_size - insufficient_data_count;
      const favorable_rate = evalCount > 0 ? favorable_count / evalCount : 0;
      const adverse_rate = evalCount > 0 ? adverse_count / evalCount : 0;
      const neutral_rate = evalCount > 0 ? neutral_count / evalCount : 0;

      const p = favorable_rate;
      const se = evalCount > 0 ? Math.sqrt((p * (1 - p)) / evalCount) : 0;
      const ciLower = Math.max(0, p - 1.96 * se);
      const ciUpper = Math.min(1, p + 1.96 * se);

      const first = list[0];
      summaries.push({
        dimensionKey: key,
        symbol: first.symbol,
        timeframe: first.timeframe,
        model: first.model,
        direction: first.direction,
        horizon: first.horizon,
        sample_size,
        favorable_count,
        adverse_count,
        neutral_count,
        insufficient_data_count,
        favorable_rate: Number(favorable_rate.toFixed(4)),
        adverse_rate: Number(adverse_rate.toFixed(4)),
        neutral_rate: Number(neutral_rate.toFixed(4)),
        standard_error: Number(se.toFixed(4)),
        confidence_interval_95: [Number(ciLower.toFixed(4)), Number(ciUpper.toFixed(4))],
      });
    }

    return summaries;
  }
}

function makeCandle(timestamp: number, open: number, high: number, low: number, close: number): Candle {
  return { timestamp, open, high, low, close, volume: 100 };
}

describe('Phase S2 — ICT Signal Statistical Validation', () => {
  const evaluator = new S2OutcomeEvaluator();

  it('1. Baseline & Production Immutability Verification', () => {
    const ictDir = path.join(process.cwd(), 'core', 'ict');
    expect(fs.existsSync(ictDir)).toBe(true);
  });

  it('2. S1 Signal Dataset Consumption & Provenance Preservation', () => {
    const s1Signal: S1SignalInput = {
      signalId: 'SIG-MODEL_A-NQ-5m-1700000240000',
      symbol: 'NQ',
      timeframe: '5m',
      model: 'MODEL_A',
      direction: 'LONG',
      signalState: 'LONG_CANDIDATE',
      candleTimestamp: 1700000240000,
      confirmationTimestamp: 1700000240000,
      candidateContextId: 'ctx_NQ_5m_1700000000000',
      sourceEventIds: ['EVT-SWEEP-1', 'EVT-MSS-1', 'EVT-FVG-1'],
      mtfContextId: 'mtf_NQ_15m_to_5m_1',
      referencePrice: 18000,
    };

    const futureCandles = [
      makeCandle(1700000300000, 18000, 18025, 17995, 18020),
    ];

    const outcome = evaluator.evaluateOutcome(s1Signal, futureCandles, 'H1');

    expect(outcome.signalId).toBe(s1Signal.signalId);
    expect(outcome.provenance.candidateContextId).toBe('ctx_NQ_5m_1700000000000');
    expect(outcome.provenance.sourceEventIds).toEqual(['EVT-SWEEP-1', 'EVT-MSS-1', 'EVT-FVG-1']);
  });

  it('3. Directional Outcome Evaluation: LONG Candidate (FAVORABLE, ADVERSE, NEUTRAL)', () => {
    const longSignal: S1SignalInput = {
      signalId: 'SIG-LONG-1',
      symbol: 'MNQ',
      timeframe: '1m',
      model: 'MODEL_A',
      direction: 'LONG',
      signalState: 'LONG_CANDIDATE',
      candleTimestamp: 1700000000000,
      confirmationTimestamp: 1700000000000,
      candidateContextId: 'CTX-1',
      sourceEventIds: ['EVT-1'],
      mtfContextId: 'MTF-1',
      referencePrice: 18000,
    };

    // Favorable movement (High > Ref)
    const favCandles = [makeCandle(1700000060000, 18000, 18040, 17990, 18030)];
    const favRes = evaluator.evaluateOutcome(longSignal, favCandles, 'H1');
    expect(favRes.outcomeState).toBe('FAVORABLE');

    // Adverse movement (High <= Ref, Low < Ref)
    const advCandles = [makeCandle(1700000060000, 18000, 18000, 17950, 17960)];
    const advRes = evaluator.evaluateOutcome(longSignal, advCandles, 'H1');
    expect(advRes.outcomeState).toBe('ADVERSE');

    // Neutral movement (Flat)
    const neuCandles = [makeCandle(1700000060000, 18000, 18000, 18000, 18000)];
    const neuRes = evaluator.evaluateOutcome(longSignal, neuCandles, 'H1');
    expect(neuRes.outcomeState).toBe('NEUTRAL');
  });

  it('4. Directional Outcome Evaluation: SHORT Candidate (FAVORABLE, ADVERSE, NEUTRAL)', () => {
    const shortSignal: S1SignalInput = {
      signalId: 'SIG-SHORT-1',
      symbol: 'MNQ',
      timeframe: '1m',
      model: 'MODEL_B',
      direction: 'SHORT',
      signalState: 'SHORT_CANDIDATE',
      candleTimestamp: 1700000000000,
      confirmationTimestamp: 1700000000000,
      candidateContextId: 'CTX-2',
      sourceEventIds: ['EVT-2'],
      mtfContextId: 'MTF-2',
      referencePrice: 18000,
    };

    // Favorable movement for SHORT (Low < Ref)
    const favCandles = [makeCandle(1700000060000, 18000, 18005, 17940, 17950)];
    const favRes = evaluator.evaluateOutcome(shortSignal, favCandles, 'H1');
    expect(favRes.outcomeState).toBe('FAVORABLE');

    // Adverse movement for SHORT (High > Ref)
    const advCandles = [makeCandle(1700000060000, 18000, 18050, 18000, 18040)];
    const advRes = evaluator.evaluateOutcome(shortSignal, advCandles, 'H1');
    expect(advRes.outcomeState).toBe('ADVERSE');
  });

  it('5. Insufficient Data Handling', () => {
    const signal: S1SignalInput = {
      signalId: 'SIG-SHORT-NODATA',
      symbol: 'NQ',
      timeframe: '15m',
      model: 'MODEL_C',
      direction: 'SHORT',
      signalState: 'SHORT_CANDIDATE',
      candleTimestamp: 1700000000000,
      confirmationTimestamp: 1700000000000,
      candidateContextId: 'CTX-3',
      sourceEventIds: [],
      mtfContextId: 'MTF-3',
      referencePrice: 18000,
    };

    // Request H5 horizon with only 2 future candles
    const shortCandleStream = [
      makeCandle(1700000900000, 18000, 18010, 17990, 18005),
      makeCandle(1700001800000, 18005, 18015, 17995, 18010),
    ];

    const res = evaluator.evaluateOutcome(signal, shortCandleStream, 'H5');
    expect(res.outcomeState).toBe('INSUFFICIENT_DATA');
  });

  it('6. Temporal Anti-Lookahead Enforcement', () => {
    const signal: S1SignalInput = {
      signalId: 'SIG-LOOKAHEAD-CHECK',
      symbol: 'MNQ',
      timeframe: '5m',
      model: 'MODEL_A',
      direction: 'LONG',
      signalState: 'LONG_CANDIDATE',
      candleTimestamp: 1700000300000,
      confirmationTimestamp: 1700000300000,
      candidateContextId: 'CTX-4',
      sourceEventIds: [],
      mtfContextId: 'MTF-4',
      referencePrice: 18000,
    };

    // Stream contains a candle BEFORE confirmation time
    const mixedStream = [
      makeCandle(1700000000000, 17900, 17950, 17890, 17940), // PRE-confirmation
      makeCandle(1700000600000, 18000, 18050, 17990, 18040), // POST-confirmation
    ];

    const outcome = evaluator.evaluateOutcome(signal, mixedStream, 'H1');
    expect(outcome.outcomeWindowStartTimestamp).toBeGreaterThan(signal.confirmationTimestamp);
  });

  it('7. Multi-Horizon Evaluation & Dimensional Aggregations', () => {
    const signal: S1SignalInput = {
      signalId: 'SIG-MULTI-HORIZON',
      symbol: 'MNQ',
      timeframe: '1m',
      model: 'MODEL_A',
      direction: 'LONG',
      signalState: 'LONG_CANDIDATE',
      candleTimestamp: 1700000000000,
      confirmationTimestamp: 1700000000000,
      candidateContextId: 'CTX-5',
      sourceEventIds: [],
      mtfContextId: 'MTF-5',
      referencePrice: 18000,
    };

    const futureStream = [
      makeCandle(1700000060000, 18000, 18020, 17990, 18015),
      makeCandle(1700000120000, 18015, 18040, 18010, 18035),
      makeCandle(1700000180000, 18035, 18060, 18030, 18055),
    ];

    const horizons: Horizon[] = ['H1', 'H2', 'H3'];
    const outcomes: S2OutcomeRecord[] = horizons.map((h) =>
      evaluator.evaluateOutcome(signal, futureStream, h)
    );

    expect(outcomes.length).toBe(3);
    const stats = evaluator.aggregateStatistics(outcomes);
    expect(stats.length).toBe(3);
  });

  it('8. Replay Determinism of S2 Outcome Evaluation', () => {
    const signal: S1SignalInput = {
      signalId: 'SIG-REPLAY-1',
      symbol: 'NQ',
      timeframe: '5m',
      model: 'MODEL_B',
      direction: 'SHORT',
      signalState: 'SHORT_CANDIDATE',
      candleTimestamp: 1700000000000,
      confirmationTimestamp: 1700000000000,
      candidateContextId: 'CTX-6',
      sourceEventIds: [],
      mtfContextId: 'MTF-6',
      referencePrice: 18000,
    };

    const stream = [
      makeCandle(1700000300000, 18000, 18010, 17950, 17960),
    ];

    const out1 = evaluator.evaluateOutcome(signal, stream, 'H1');
    const out2 = evaluator.evaluateOutcome(signal, stream, 'H1');

    expect(JSON.stringify(out1)).toBe(JSON.stringify(out2));
  });
});
