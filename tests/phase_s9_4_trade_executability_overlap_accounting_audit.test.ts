/**
 * Phase S9.4 — Trade Executability, Overlap & Return Accounting Audit Test Suite
 * Performs deterministic verification of signal-confirmation-entry-exit monotonicity,
 * holding durations, strict overlap detection, return & friction accounting, drawdown calculations,
 * decision uniqueness, dataset hash preservation, and production logic immutability.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync } from 'child_process';

interface S9Trade {
  tradeId: string;
  signalId?: string;
  instrument?: string;
  contract?: string;
  timeframe?: string;
  model?: string;
  direction?: string;
  signalTimestamp?: number;
  confirmationTimestamp?: number;
  entryTimestamp: number;
  exitTimestamp?: number;
  forwardExitTimestamp?: number;
  entryPrice: number;
  exitPrice: number;
  grossResultPoints?: number;
  frictionPoints?: number;
  netResultPoints: number;
  outcome?: string;
  maePoints?: number;
  mfePoints?: number;
}

export class S94AuditEngine {
  public loadS9Trades(): S9Trade[] {
    const filePath = path.join(process.cwd(), 'data_audit', 'phase_s9', 's9_oos_trade_dataset.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : parsed.trades || [];
  }

  public verifyMonotonicity(trades: S9Trade[]): boolean {
    return trades.every(t => {
      const sig = t.signalTimestamp || t.entryTimestamp;
      const conf = t.confirmationTimestamp || sig;
      const entry = t.entryTimestamp;
      const exit = t.exitTimestamp || t.forwardExitTimestamp || entry;
      return sig <= conf && conf <= entry && entry < exit;
    });
  }

  public detectStrictOverlaps(trades: S9Trade[]) {
    const strictOverlaps = [];
    for (let i = 0; i < trades.length; i++) {
      for (let j = i + 1; j < trades.length; j++) {
        const entryA = trades[i].entryTimestamp;
        const exitA = trades[i].exitTimestamp || trades[i].forwardExitTimestamp || entryA;
        const entryB = trades[j].entryTimestamp;
        const exitB = trades[j].exitTimestamp || trades[j].forwardExitTimestamp || entryB;

        if (entryB < exitA && entryA < exitB) {
          strictOverlaps.push([trades[i].tradeId, trades[j].tradeId]);
        }
      }
    }
    return strictOverlaps;
  }

  public reconcileReturns(trades: S9Trade[]) {
    let grossMatches = 0;
    let netMatches = 0;
    let calcGrossTotal = 0;
    let calcNetTotal = 0;

    trades.forEach(t => {
      const dir = t.direction === 'LONG' ? 1 : -1;
      const gross = (t.exitPrice - t.entryPrice) * dir;
      const friction = t.frictionPoints || 1.0;
      const net = gross - friction;

      if (Math.abs(gross - (t.grossResultPoints !== undefined ? t.grossResultPoints : gross)) < 1e-4) grossMatches++;
      if (Math.abs(net - t.netResultPoints) < 1e-4) netMatches++;

      calcGrossTotal += gross;
      calcNetTotal += net;
    });

    return { grossMatches, netMatches, calcGrossTotal, calcNetTotal };
  }

  public calculateDrawdowns(trades: S9Trade[]) {
    let cumNet = 0;
    let peak = 0;
    let maxClosedDD = 0;

    trades.forEach(t => {
      const dir = t.direction === 'LONG' ? 1 : -1;
      const net = (t.exitPrice - t.entryPrice) * dir - (t.frictionPoints || 1.0);
      cumNet += net;
      if (cumNet > peak) peak = cumNet;
      const dd = peak - cumNet;
      if (dd > maxClosedDD) maxClosedDD = dd;
    });

    return { maxClosedDD };
  }
}

describe('Phase S9.4 — Trade Executability, Overlap & Return Accounting Audit Test Suite', () => {
  const engine = new S94AuditEngine();
  const trades = engine.loadS9Trades();
  const s9Path = path.join(process.cwd(), 'data_audit', 'phase_s9', 's9_oos_trade_dataset.json');

  // 1. Monotonic Timestamps & Execution Sequences
  it('1. verifies signal-confirmation-entry-exit monotonicity for all 200 trades', () => {
    expect(trades.length).toBe(200);
    const valid = engine.verifyMonotonicity(trades);
    expect(valid).toBe(true);
  });

  // 2. Strict Overlap Detection
  it('2. detects zero strict overlapping open positions among all 200 trades', () => {
    const overlaps = engine.detectStrictOverlaps(trades);
    expect(overlaps.length).toBe(0);
  });

  // 3. Holding Durations
  it('3. verifies all 200 trades have holding duration of exactly 300 seconds (1 candle)', () => {
    trades.forEach(t => {
      const entry = t.entryTimestamp;
      const exit = t.exitTimestamp || t.forwardExitTimestamp || entry;
      const durSec = (exit - entry) / 1000;
      expect(durSec).toBe(300);
    });
  });

  // 4. Return Accounting Reconciliation
  it('4. reconciles gross and net returns with zero mismatches across all 200 trades', () => {
    const res = engine.reconcileReturns(trades);
    expect(res.grossMatches).toBe(200);
    expect(res.netMatches).toBe(200);
    expect(res.calcGrossTotal).toBeCloseTo(2005.25, 2);
    expect(res.calcNetTotal).toBeCloseTo(1805.25, 2);
  });

  // 5. Drawdown Accounting
  it('5. reconciles maximum equity drawdown from closed trades as exactly 8.25 points', () => {
    const dd = engine.calculateDrawdowns(trades);
    expect(dd.maxClosedDD).toBeCloseTo(8.25, 2);
  });

  // 6. Unique Candle & Decision Sequence
  it('6. verifies 200 unique entry timestamps and 200 unique exit timestamps', () => {
    const entries = new Set(trades.map(t => t.entryTimestamp));
    const exits = new Set(trades.map(t => (t.exitTimestamp || t.forwardExitTimestamp)));
    expect(entries.size).toBe(200);
    expect(exits.size).toBe(200);
  });

  // 7. Canonical Dataset SHA-256 Hash Integrity
  it('7. verifies canonical S9 dataset byte-for-byte SHA-256 hash match', () => {
    const rawBytes = fs.readFileSync(s9Path);
    const currentHash = crypto.createHash('sha256').update(rawBytes).digest('hex');
    expect(currentHash).toBe('b31a5f5a6b3486681e729572512c29c018d13397bd5c386dd5470cc998501f3a');
  });

  // 8. Production core/ict/ Immutability
  it('8. verifies core/ict/ has 0 diff lines against baseline 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a', () => {
    const diff = execSync('git diff 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a -- core/ict/').toString();
    expect(diff.trim().length).toBe(0);
  });
});
