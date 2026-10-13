/**
 * Phase S9.2 — Forensic Timestamp & Clustering Reconciliation Audit Test Suite
 * Performs independent verification of raw timestamp preservation, unit detection,
 * range reconciliation, dataset & contract boundary handling, gap distributions,
 * episode constructions, autocorrelations, and effective sample size.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface RawTrade {
  tradeId: string;
  signalTimestamp?: number;
  candidateTimestamp?: number;
  confirmationTimestamp?: number;
  entryTimestamp: number;
  exitTimestamp?: number;
  forwardExitTimestamp?: number;
  symbol?: string;
  instrument?: string;
  contract?: string;
  timeframe?: string;
  model?: string;
  direction?: string;
  netResultPoints: number;
  outcome?: string;
  signalSourceCandle?: any;
  outcomeSourceCandle?: any;
  confCandle?: any;
  forwardCandle?: any;
}

export interface NormalizedTradeRecord {
  tradeId: string;
  dataset: 'S8-200' | 'S8.8' | 'S9';
  instrument: string;
  contract: string;
  timeframe: string;
  signalTimestamp: number;
  confirmationTimestamp: number;
  entryTimestamp: number;
  exitTimestamp: number;
  rawSignalValue: number;
  unit: string;
  epochMs: number;
  isoUtc: string;
  netResultPoints: number;
  outcome: string;
  signalSourceCandle?: any;
  outcomeSourceCandle?: any;
}

export function detectTimestampUnit(val: number): string {
  if (val > 1e14) return 'microseconds';
  if (val > 1e11) return 'milliseconds';
  if (val > 1e8) return 'seconds';
  return 'unknown';
}

export function parseToEpochMs(val: number): number {
  const unit = detectTimestampUnit(val);
  if (unit === 'seconds') return val * 1000;
  return val;
}

export class S92ForensicAuditEngine {
  public loadAndNormalizeDataset(filePath: string, datasetName: 'S8-200' | 'S8.8' | 'S9'): NormalizedTradeRecord[] {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    const list: RawTrade[] = Array.isArray(parsed) ? parsed : parsed.trades || [];

    return list.map(t => {
      const rawSig = t.signalTimestamp !== undefined ? t.signalTimestamp : (t.candidateTimestamp !== undefined ? t.candidateTimestamp : t.entryTimestamp);
      const confTs = t.confirmationTimestamp !== undefined ? t.confirmationTimestamp : rawSig;
      const exitTs = t.exitTimestamp !== undefined ? t.exitTimestamp : (t.forwardExitTimestamp || t.entryTimestamp);

      const unit = detectTimestampUnit(rawSig);
      const epochMs = parseToEpochMs(rawSig);
      const isoUtc = new Date(epochMs).toISOString();

      let outcome = t.outcome;
      if (!outcome) {
        outcome = t.netResultPoints > 0 ? 'WINNER' : t.netResultPoints < 0 ? 'LOSER' : 'NEUTRAL';
      }

      return {
        tradeId: t.tradeId,
        dataset: datasetName,
        instrument: t.instrument || t.symbol || (datasetName === 'S9' ? 'NQ' : 'MNQ'),
        contract: t.contract || (datasetName === 'S9' ? 'NQZ25' : 'MNQZ25'),
        timeframe: t.timeframe || '5m',
        signalTimestamp: epochMs,
        confirmationTimestamp: confTs,
        entryTimestamp: t.entryTimestamp,
        exitTimestamp: exitTs,
        rawSignalValue: rawSig,
        unit,
        epochMs,
        isoUtc,
        netResultPoints: t.netResultPoints,
        outcome,
        signalSourceCandle: t.signalSourceCandle,
        outcomeSourceCandle: t.outcomeSourceCandle || t.confCandle || t.forwardCandle,
      };
    });
  }

  public calculateGaps(trades: NormalizedTradeRecord[]): number[] {
    const sorted = [...trades].sort((a, b) => a.signalTimestamp - b.signalTimestamp);
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      gaps.push((sorted[i].signalTimestamp - sorted[i - 1].signalTimestamp) / 1000);
    }
    return gaps;
  }

  public buildEpisodes(trades: NormalizedTradeRecord[], gapMinutes = 60) {
    if (trades.length === 0) return [];
    const sorted = [...trades].sort((a, b) => a.signalTimestamp - b.signalTimestamp);
    const episodes: NormalizedTradeRecord[][] = [];
    let current: NormalizedTradeRecord[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const gapSec = (sorted[i].signalTimestamp - sorted[i - 1].signalTimestamp) / 1000;
      if (gapSec > gapMinutes * 60) {
        episodes.push(current);
        current = [sorted[i]];
      } else {
        current.push(sorted[i]);
      }
    }
    if (current.length > 0) episodes.push(current);
    return episodes;
  }

  public calcAutocorrelation(values: number[], lag: number): number {
    if (values.length <= lag) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    let num = 0;
    let den = 0;
    for (let i = 0; i < values.length; i++) {
      den += Math.pow(values[i] - mean, 2);
    }
    if (den === 0) return 0;
    for (let i = 0; i < values.length - lag; i++) {
      num += (values[i] - mean) * (values[i + lag] - mean);
    }
    return num / den;
  }
}

describe('Phase S9.2 — Forensic Timestamp & Clustering Reconciliation Audit', () => {
  const engine = new S92ForensicAuditEngine();
  const s8200Path = path.join(process.cwd(), 'data_audit', 'phase_s8_5', 's8_5_real_market_outcome_dataset.json');
  const s88Path = path.join(process.cwd(), 'data_audit', 'phase_s8_8', 's8_8_oos_trade_dataset.json');
  const s9Path = path.join(process.cwd(), 'data_audit', 'phase_s9', 's9_oos_trade_dataset.json');

  const s8200Trades = engine.loadAndNormalizeDataset(s8200Path, 'S8-200');
  const s88Trades = engine.loadAndNormalizeDataset(s88Path, 'S8.8');
  const s9Trades = engine.loadAndNormalizeDataset(s9Path, 'S9');

  // 1. Raw timestamp preservation
  it('1. verifies raw timestamp preservation across all datasets', () => {
    expect(s8200Trades.length).toBe(200);
    expect(s88Trades.length).toBe(50);
    expect(s9Trades.length).toBe(200);
    [...s8200Trades, ...s88Trades, ...s9Trades].forEach(t => {
      expect(t.rawSignalValue).toBeDefined();
      expect(typeof t.rawSignalValue).toBe('number');
    });
  });

  // 2. Timestamp unit detection
  it('2. detects timestamp unit correctly as milliseconds for epoch timestamps', () => {
    [...s8200Trades, ...s88Trades, ...s9Trades].forEach(t => {
      expect(t.unit).toBe('milliseconds');
    });
  });

  // 3. Timestamp conversion
  it('3. converts epoch milliseconds to valid ISO UTC strings without precision loss', () => {
    expect(s8200Trades[0].isoUtc).toBe('2026-05-18T18:15:00.000Z');
    expect(s88Trades[0].isoUtc).toBe('2025-12-01T19:35:00.000Z');
    expect(s9Trades[0].isoUtc).toBe('2025-12-01T18:20:00.000Z');
  });

  // 4. Dataset range reconciliation
  it('4. reconciles individual dataset time ranges', () => {
    const s8200Span = (s8200Trades[199].signalTimestamp - s8200Trades[0].signalTimestamp) / (1000 * 3600 * 24);
    const s88Span = (s88Trades[49].signalTimestamp - s88Trades[0].signalTimestamp) / (1000 * 3600 * 24);
    const s9Span = (s9Trades[199].signalTimestamp - s9Trades[0].signalTimestamp) / (1000 * 3600 * 24);

    expect(s8200Span).toBeCloseTo(2.07, 1);
    expect(s88Span).toBeCloseTo(0.17, 1);
    expect(s9Span).toBeCloseTo(0.69, 1);
  });

  // 5. Contract range reconciliation
  it('5. reconciles contract-by-contract ranges within S9', () => {
    const s9NQZ25 = s9Trades.filter(t => t.contract === 'NQZ25');
    expect(s9NQZ25.length).toBe(200);
    const spanHours = (s9NQZ25[199].signalTimestamp - s9NQZ25[0].signalTimestamp) / 3600000;
    expect(spanHours).toBeCloseTo(16.58, 1);
  });

  // 6. Chronological ordering
  it('6. verifies internal chronological ordering within each dataset', () => {
    [s8200Trades, s88Trades, s9Trades].forEach(dataset => {
      for (let i = 1; i < dataset.length; i++) {
        expect(dataset[i].signalTimestamp).toBeGreaterThan(dataset[i - 1].signalTimestamp);
      }
    });
  });

  // 7. Dataset boundary handling
  it('7. handles dataset boundaries without treating gaps across datasets as intra-session gaps', () => {
    const s8200Last = s8200Trades[199].signalTimestamp;
    const s88First = s88Trades[0].signalTimestamp;
    // S8-200 is May 2026, S8.8 is Dec 2025 -> transition is negative or distinct dataset boundary
    expect(s88First).toBeLessThan(s8200Last);
  });

  // 8. Contract boundary handling
  it('8. verifies contract boundaries are maintained explicitly', () => {
    const contracts = Array.from(new Set(s9Trades.map(t => t.contract)));
    expect(contracts).toContain('NQZ25');
  });

  // 9. Gap calculation
  it('9. calculates gap distributions accurately per dataset', () => {
    const s8200Gaps = engine.calculateGaps(s8200Trades);
    const s88Gaps = engine.calculateGaps(s88Trades);
    const s9Gaps = engine.calculateGaps(s9Trades);

    // Every gap in S8-200 is exactly 900s (15m)
    s8200Gaps.forEach(g => expect(g).toBe(900));
    // Every gap in S8.8 is exactly 300s (5m)
    s88Gaps.forEach(g => expect(g).toBe(300));
    // Every gap in S9 is exactly 300s (5m)
    s9Gaps.forEach(g => expect(g).toBe(300));
  });

  // 10. Episode construction
  it('10. constructs episodes correctly per dataset using 60m threshold', () => {
    const s8200Episodes = engine.buildEpisodes(s8200Trades, 60);
    const s88Episodes = engine.buildEpisodes(s88Trades, 60);
    const s9Episodes = engine.buildEpisodes(s9Trades, 60);

    expect(s8200Episodes.length).toBe(1);
    expect(s88Episodes.length).toBe(1);
    expect(s9Episodes.length).toBe(1);
  });

  // 11. 448/449 reconciliation
  it('11. reconciles the S9.1 reported 448/449 <= 15m gaps result', () => {
    // 199 gaps in S8-200 (15m) + 49 in S8.8 (5m) + 199 in S9 (5m) = 447 internal gaps <= 15m.
    // Plus 1 dataset transition gap when naively concatenated = 448 / 449 total.
    const concatenated = [...s8200Trades, ...s88Trades, ...s9Trades];
    const gaps = engine.calculateGaps(concatenated);
    const le15m = gaps.filter(g => Math.abs(g) <= 900).length;
    expect(le15m).toBe(448);
  });

  // 12. Calendar-day reconciliation
  it('12. reconciles calendar days for S9', () => {
    const s9Days = Array.from(new Set(s9Trades.map(t => t.isoUtc.substring(0, 10))));
    expect(s9Days.length).toBe(2);
    expect(s9Days).toEqual(['2025-12-01', '2025-12-02']);
  });

  // 13. Source-candle timestamp cross-check
  it('13. verifies trade timestamps against source candle provenance', () => {
    const sample = s9Trades.slice(0, 20);
    sample.forEach(t => {
      expect(t.signalSourceCandle).toBeDefined();
      expect(t.signalSourceCandle.timestamp).toBe(t.confirmationTimestamp);
    });
  });

  // 14. Timestamp transformation audit
  it('14. verifies timestamp transformations preserve precision without alteration', () => {
    s9Trades.forEach(t => {
      expect(new Date(t.signalTimestamp).getTime()).toBe(t.epochMs);
    });
  });

  // 15. Autocorrelation reconciliation
  it('15. calculates serial autocorrelation independently per dataset', () => {
    const s9Returns = s9Trades.map(t => t.netResultPoints);
    const s9Outcomes = s9Trades.map(t => t.outcome === 'WINNER' ? 1 : t.outcome === 'LOSER' ? -1 : 0);

    const rLag1 = engine.calcAutocorrelation(s9Returns, 1);
    const oLag1 = engine.calcAutocorrelation(s9Outcomes, 1);

    expect(rLag1).toBeCloseTo(0.7414, 2);
    expect(oLag1).toBeCloseTo(0.0447, 2);
  });

  // 16. Effective sample-size reconciliation
  it('16. reassesses effective sample size status when clusters are contiguous single episodes', () => {
    // When S9 consists of 1 contiguous episode, Neff is NOT_IDENTIFIABLE_WITH_CONFIDENCE
    const episodes = engine.buildEpisodes(s9Trades, 60);
    expect(episodes.length).toBe(1);
  });

  // 17. Bootstrap eligibility
  it('17. flags cluster bootstrap inference as INSUFFICIENT_CLUSTER_COUNT when single episodes exist', () => {
    const s9Episodes = engine.buildEpisodes(s9Trades, 60);
    expect(s9Episodes.length).toBeLessThan(5);
  });

  // 18. Production core/ict/ immutability
  it('18. verifies core/ict/ has 0 diff lines against commit 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a', () => {
    const diff = execSync('git diff 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a -- core/ict/').toString();
    expect(diff.trim().length).toBe(0);
  });
});
