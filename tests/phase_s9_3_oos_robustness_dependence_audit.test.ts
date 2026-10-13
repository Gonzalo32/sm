/**
 * Phase S9.3 — OOS Robustness & Dependence Audit Test Suite
 * Performs deterministic verification of S9 canonical reproduction, ACF at lags 1-20,
 * Wald-Wolfowitz runs test, top-winner concentration risk, chronological 4-block partitioning,
 * dependence-aware uncertainty, selection independence classification, and production immutability.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface S9Trade {
  tradeId: string;
  signalTimestamp?: number;
  candidateTimestamp?: number;
  entryTimestamp: number;
  contract?: string;
  direction?: string;
  entryPrice: number;
  exitPrice: number;
  grossResultPoints?: number;
  netResultPoints: number;
  outcome?: string;
  mfePoints: number;
  maePoints: number;
}

export class S93AuditEngine {
  public loadS9Trades(): S9Trade[] {
    const filePath = path.join(process.cwd(), 'data_audit', 'phase_s9', 's9_oos_trade_dataset.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : parsed.trades || [];
  }

  public calcACF(arr: number[], maxLag = 20): number[] {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    let den = 0;
    for (let i = 0; i < arr.length; i++) {
      den += Math.pow(arr[i] - mean, 2);
    }
    const acf: number[] = [];
    for (let lag = 1; lag <= maxLag; lag++) {
      let num = 0;
      if (den > 0) {
        for (let i = 0; i < arr.length - lag; i++) {
          num += (arr[i] - mean) * (arr[i + lag] - mean);
        }
      }
      acf.push(den > 0 ? num / den : 0);
    }
    return acf;
  }

  public calcRunsTest(outcomes: number[]) {
    let runs = 1;
    for (let i = 1; i < outcomes.length; i++) {
      if (outcomes[i] !== outcomes[i - 1]) runs++;
    }
    const n1 = outcomes.filter(o => o > 0).length;
    const n2 = outcomes.filter(o => o < 0).length;
    const N = outcomes.length;
    const expRuns = 1 + (2 * n1 * n2) / N;
    const varRuns = (2 * n1 * n2 * (2 * n1 * n2 - N)) / (Math.pow(N, 2) * (N - 1));
    const zScore = (runs - expRuns) / Math.sqrt(varRuns);
    return { runs, expRuns, varRuns, zScore };
  }

  public partitionBlocks(trades: S9Trade[], blockSize = 50) {
    const blocks = [];
    for (let i = 0; i < trades.length; i += blockSize) {
      const bTrades = trades.slice(i, i + blockSize);
      const bNet = bTrades.map(t => t.netResultPoints);
      const bWins = bTrades.filter(t => t.outcome === 'WINNER').length;
      blocks.push({
        blockIndex: i / blockSize + 1,
        count: bTrades.length,
        wins: bWins,
        winRate: bWins / bTrades.length,
        totalNet: bNet.reduce((a, b) => a + b, 0),
        meanNet: bNet.reduce((a, b) => a + b, 0) / bTrades.length
      });
    }
    return blocks;
  }
}

describe('Phase S9.3 — OOS Robustness & Dependence Audit Test Suite', () => {
  const engine = new S93AuditEngine();
  const trades = engine.loadS9Trades();

  // 1. Canonical S9 Reproduction
  it('1. reproduces canonical S9 dataset aggregate metrics exactly', () => {
    expect(trades.length).toBe(200);
    const wins = trades.filter(t => t.outcome === 'WINNER').length;
    const losses = trades.filter(t => t.outcome === 'LOSER').length;
    expect(wins).toBe(169);
    expect(losses).toBe(31);
    expect(wins / trades.length).toBe(0.845);

    const totalNet = trades.reduce((sum, t) => sum + t.netResultPoints, 0);
    expect(totalNet).toBe(1805.25);

    const meanNet = totalNet / trades.length;
    expect(meanNet).toBeCloseTo(9.02625, 4);
  });

  // 2. Return Dependence & ACF Lags 1-20
  it('2. calculates return ACF at lags 1 to 20', () => {
    const netReturns = trades.map(t => t.netResultPoints);
    const acf = engine.calcACF(netReturns, 20);
    expect(acf.length).toBe(20);
    expect(acf[0]).toBeCloseTo(0.7414, 2); // Lag-1 return autocorr
  });

  // 3. Binary Outcome ACF
  it('3. calculates binary outcome ACF at lags 1 to 20', () => {
    const outcomes = trades.map(t => t.outcome === 'WINNER' ? 1 : -1);
    const acf = engine.calcACF(outcomes, 20);
    expect(acf.length).toBe(20);
    expect(acf[0]).toBeCloseTo(0.0447, 2); // Lag-1 binary outcome autocorr
  });

  // 4. Wald-Wolfowitz Runs Test
  it('4. performs Wald-Wolfowitz runs test on binary outcomes', () => {
    const outcomes = trades.map(t => t.outcome === 'WINNER' ? 1 : -1);
    const result = engine.calcRunsTest(outcomes);
    expect(result.runs).toBe(51);
    expect(result.expRuns).toBeCloseTo(53.39, 1);
    expect(result.zScore).toBeCloseTo(-0.6498, 2);
  });

  // 5. Winner Concentration Risk
  it('5. evaluates top winner concentration risk', () => {
    const sorted = trades.map(t => t.netResultPoints).sort((a, b) => b - a);
    const totalNet = sorted.reduce((a, b) => a + b, 0);
    const top1 = sorted[0];
    const top5 = sorted.slice(0, 5).reduce((a, b) => a + b, 0);
    const top10 = sorted.slice(0, 10).reduce((a, b) => a + b, 0);

    expect(top1 / totalNet).toBeLessThan(0.02); // < 2%
    expect(top5 / totalNet).toBeLessThan(0.10); // < 10%
    expect(top10 / totalNet).toBeLessThan(0.15); // < 15%
  });

  // 6. Chronological 4-Block Partitioning
  it('6. partitions S9 chronologically into 4 non-overlapping blocks of 50 trades', () => {
    const blocks = engine.partitionBlocks(trades, 50);
    expect(blocks.length).toBe(4);
    blocks.forEach(b => {
      expect(b.count).toBe(50);
      expect(b.winRate).toBeGreaterThanOrEqual(0.80);
      expect(b.meanNet).toBeGreaterThan(7.0);
    });
  });

  // 7. Dependence-Aware Uncertainty Classification
  it('7. verifies dependence-aware uncertainty classification as INSUFFICIENT', () => {
    const filePath = path.join(process.cwd(), 'data_audit', 'phase_s9_3', 's9_3_uncertainty_audit.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.independentMarketSampleStatus).toBe('INSUFFICIENT');
  });

  // 8. Selection Independence Classification
  it('8. verifies selection independence classification as UNVERIFIED', () => {
    const filePath = path.join(process.cwd(), 'data_audit', 'phase_s9_3', 's9_3_provenance_audit.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.modelSelectionIndependence).toBe('UNVERIFIED');
  });

  // 9. Production Immutability
  it('9. verifies core/ict/ has 0 diff lines against commit 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a', () => {
    const diff = execSync('git diff 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a -- core/ict/').toString();
    expect(diff.trim().length).toBe(0);
  });
});
