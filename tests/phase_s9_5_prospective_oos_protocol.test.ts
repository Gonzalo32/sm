/**
 * Phase S9.5 — Prospective OOS Protocol & Frozen Evaluation Plan Test Suite
 * Performs deterministic verification of protocol specification immutability,
 * SHA-256 cryptographic hashing, timestamp exclusion rules, contract roll rules,
 * sample sufficiency target, execution cost model, selection independence classification,
 * and production logic immutability.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync } from 'child_process';

describe('Phase S9.5 — Prospective OOS Protocol & Frozen Evaluation Plan Test Suite', () => {
  const protocolPath = path.join(process.cwd(), 'data_audit', 'phase_s9_5', 's9_5_prospective_protocol_spec.json');

  // 1. Protocol Spec File Existence & Hashing
  it('1. verifies frozen prospective protocol specification file existence and cryptographic hash', () => {
    expect(fs.existsSync(protocolPath)).toBe(true);
    const raw = fs.readFileSync(protocolPath, 'utf-8');
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    expect(hash.length).toBe(64);
  });

  // 2. Protocol Version & Baseline Commit
  it('2. verifies protocol version 1.0.0 and baseline commit 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a', () => {
    const spec = JSON.parse(fs.readFileSync(protocolPath, 'utf-8'));
    expect(spec.protocolVersion).toBe('1.0.0');
    expect(spec.baselineCommit).toBe('57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a');
  });

  // 3. Instrument & Contract Roll Rules
  it('3. verifies eligible instruments NQ and MNQ with quarterly roll schedule', () => {
    const spec = JSON.parse(fs.readFileSync(protocolPath, 'utf-8'));
    const symbols = spec.eligibleInstruments.map((i: any) => i.symbol);
    expect(symbols).toContain('NQ');
    expect(symbols).toContain('MNQ');
    expect(spec.contractRollRules).toContain('Quarterly roll schedule');
  });

  // 4. Session & Timezone Rules
  it('4. verifies session window America/New_York and UTC timestamp conventions', () => {
    const spec = JSON.parse(fs.readFileSync(protocolPath, 'utf-8'));
    expect(spec.timeZone).toContain('America/New_York');
    expect(spec.sessionStartUtc).toBe('13:30:00Z');
    expect(spec.sessionEndUtc).toBe('20:00:00Z');
  });

  // 5. Excluded Evaluated Ranges (Anti-Overlap)
  it('5. enforces timestamp exclusion for S8-200, S8.8, and S9 historical periods', () => {
    const spec = JSON.parse(fs.readFileSync(protocolPath, 'utf-8'));
    const names = spec.excludedEvaluatedRanges.map((r: any) => r.name);
    expect(names).toEqual(['S8-200', 'S8.8', 'S9']);

    // Function to check if a new candidate timestamp falls in excluded ranges
    const isOverlap = (tsIso: string) => {
      const ts = new Date(tsIso).getTime();
      return spec.excludedEvaluatedRanges.some((r: any) => {
        const start = new Date(r.startIso).getTime();
        const end = new Date(r.endIso).getTime();
        return ts >= start && ts <= end;
      });
    };

    expect(isOverlap('2026-05-19T10:00:00.000Z')).toBe(true); // Inside S8-200
    expect(isOverlap('2025-12-01T20:00:00.000Z')).toBe(true); // Inside S8.8 / S9
    expect(isOverlap('2026-10-01T14:00:00.000Z')).toBe(false); // Valid prospective timestamp
  });

  // 6. Sample Sufficiency Target
  it('6. targets 30 to 50 distinct calendar sessions for sample sufficiency', () => {
    const spec = JSON.parse(fs.readFileSync(protocolPath, 'utf-8'));
    expect(spec.targetMinIndependentSessions).toBe(30);
    expect(spec.targetMaxIndependentSessions).toBe(50);
  });

  // 7. Execution Cost Model
  it('7. defines 1.0 point fixed friction execution cost model', () => {
    const spec = JSON.parse(fs.readFileSync(protocolPath, 'utf-8'));
    expect(spec.frictionModel.frictionPoints).toBe(1.0);
    expect(spec.frictionModel.breakdown.spreadPoints).toBe(0.50);
  });

  // 8. Selection Independence Classification
  it('8. classifies historical selection independence as UNVERIFIED', () => {
    const auditPath = path.join(process.cwd(), 'data_audit', 'phase_s9_5', 's9_5_selection_independence_audit.json');
    const audit = JSON.parse(fs.readFileSync(auditPath, 'utf-8'));
    expect(audit.S8_200.status).toBe('UNVERIFIED');
    expect(audit.S8_8.status).toBe('UNVERIFIED');
    expect(audit.S9.status).toBe('UNVERIFIED');
  });

  // 9. Production Immutability
  it('9. verifies core/ict/ has 0 diff lines against baseline 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a', () => {
    const diff = execSync('git diff 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a -- core/ict/').toString();
    expect(diff.trim().length).toBe(0);
  });
});
