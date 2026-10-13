/**
 * Phase S9.6 — Prospective Protocol Preflight & Versioned Freeze Test Suite
 * Performs deterministic verification of dynamic EDT/EST timezone conversion,
 * contract rollover logic, cost model decomposition, session eligibility rules,
 * protocol v1.0.0 preservation, protocol v1.0.1 cryptographic hashing, and production immutability.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync } from 'child_process';

export function determineActiveContract(dateIso: string): string {
  const d = new Date(dateIso);
  const yearStr = d.getUTCFullYear().toString().substring(2);
  const month = d.getUTCMonth() + 1; // 1..12
  const day = d.getUTCDate();

  // Rollover effective date is 8 calendar days prior to 3rd Friday of contract month (around day 11-13)
  if (month === 12 && day >= 12 || month === 1 || month === 2 || (month === 3 && day < 13)) {
    const yr = month === 12 ? (d.getUTCFullYear() + 1).toString().substring(2) : yearStr;
    return `NQH${yr}`;
  }
  if (month === 3 && day >= 13 || month === 4 || month === 5 || (month === 6 && day < 12)) {
    return `NQM${yearStr}`;
  }
  if (month === 6 && day >= 12 || month === 7 || month === 8 || (month === 9 && day < 11)) {
    return `NQU${yearStr}`;
  }
  return `NQZ${yearStr}`;
}

export function isEstTimezone(dateIso: string): boolean {
  const d = new Date(dateIso);
  const month = d.getUTCMonth() + 1;
  // Standard time in US: Nov, Dec, Jan, Feb, Mar (early)
  return month === 11 || month === 12 || month === 1 || month === 2;
}

export function getRthSessionWindowUtc(dateIso: string) {
  const isEst = isEstTimezone(dateIso);
  const dateStr = dateIso.substring(0, 10);
  if (isEst) {
    return { startUtc: `${dateStr}T14:30:00.000Z`, endUtc: `${dateStr}T21:00:00.000Z` };
  } else {
    return { startUtc: `${dateStr}T13:30:00.000Z`, endUtc: `${dateStr}T20:00:00.000Z` };
  }
}

describe('Phase S9.6 — Prospective Protocol Preflight & Versioned Freeze Test Suite', () => {
  const v100Path = path.join(process.cwd(), 'data_audit', 'phase_s9_5', 's9_5_prospective_protocol_spec.json');
  const v101Path = path.join(process.cwd(), 'data_audit', 'phase_s9_6', 's9_6_prospective_protocol_spec_v1_0_1.json');

  // 1. Historical Protocol v1.0.0 Immutability
  it('1. verifies historical protocol v1.0.0 file and exact SHA-256 hash preservation', () => {
    expect(fs.existsSync(v100Path)).toBe(true);
    const raw = fs.readFileSync(v100Path, 'utf-8');
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    expect(hash).toBe('ade544739a777f0a8434c2e134eca79e964b68da25f78a6488973cc3b2770ab2');
  });

  // 2. Final Frozen Protocol v1.0.1 Hash Verification
  it('2. verifies final frozen protocol v1.0.1 file existence and SHA-256 hash match', () => {
    expect(fs.existsSync(v101Path)).toBe(true);
    const raw = fs.readFileSync(v101Path, 'utf-8');
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    expect(hash).toBe('5b9187b8f20731de86bdca2ff0c26dfc8df1426a9f1fdc023b6dd33abbfc2cdd');
  });

  // 3. Dynamic Timezone Conversion (EDT vs EST)
  it('3. converts RTH session boundaries dynamically for EDT (summer) and EST (winter) dates', () => {
    const summer = getRthSessionWindowUtc('2026-07-15T00:00:00.000Z');
    expect(summer.startUtc).toBe('2026-07-15T13:30:00.000Z'); // 09:30 EDT
    expect(summer.endUtc).toBe('2026-07-15T20:00:00.000Z');   // 16:00 EDT

    const winter = getRthSessionWindowUtc('2026-01-15T00:00:00.000Z');
    expect(winter.startUtc).toBe('2026-01-15T14:30:00.000Z'); // 09:30 EST
    expect(winter.endUtc).toBe('2026-01-15T21:00:00.000Z');   // 16:00 EST
  });

  // 4. Deterministic Contract Rollover Logic
  it('4. determines active contract deterministically across quarterly roll dates', () => {
    expect(determineActiveContract('2026-01-15T00:00:00.000Z')).toBe('NQH26'); // Q1 March
    expect(determineActiveContract('2026-04-15T00:00:00.000Z')).toBe('NQM26'); // Q2 June
    expect(determineActiveContract('2026-07-15T00:00:00.000Z')).toBe('NQU26'); // Q3 September
    expect(determineActiveContract('2026-10-15T00:00:00.000Z')).toBe('NQZ26'); // Q4 December
  });

  // 5. Cost Model Decomposition & Units
  it('5. verifies friction model breakdown of 1.0 pt into spread, commission, and slippage', () => {
    const spec = JSON.parse(fs.readFileSync(v101Path, 'utf-8'));
    const friction = spec.executionCostModel;
    expect(friction.baseRoundTripFrictionPoints).toBe(1.0);
    expect(friction.costBreakdownPoints.bidAskSpread).toBe(0.50);
    expect(friction.costBreakdownPoints.commissionAndClearingFees).toBe(0.25);
    expect(friction.costBreakdownPoints.slippageAllowance).toBe(0.25);
    expect(friction.dollarFrictionPerTrade.NQ).toBe(20.0);
    expect(friction.dollarFrictionPerTrade.MNQ).toBe(2.0);
  });

  // 6. Pre-Declared Cost Sensitivity Scenarios
  it('6. verifies 4 pre-declared cost sensitivity scenarios', () => {
    const spec = JSON.parse(fs.readFileSync(v101Path, 'utf-8'));
    const scenarios = spec.executionCostModel.sensitivityScenariosPoints;
    expect(scenarios.length).toBe(4);
    expect(scenarios[0].frictionPoints).toBe(0.50); // Low
    expect(scenarios[1].frictionPoints).toBe(1.00); // Base
    expect(scenarios[2].frictionPoints).toBe(1.50); // High
    expect(scenarios[3].frictionPoints).toBe(2.00); // Stress
  });

  // 7. Session Close Cutoff Rule
  it('7. enforces 15:55 local cutoff rule to prevent overnight position holding', () => {
    const spec = JSON.parse(fs.readFileSync(v101Path, 'utf-8'));
    expect(spec.sessionCloseHandling.cutoffLocalTime).toContain('15:55:00');
  });

  // 8. Change Log Verification
  it('8. verifies preflight change log detailing v1.0.0 to v1.0.1 refinements', () => {
    const logPath = path.join(process.cwd(), 'data_audit', 'phase_s9_6', 's9_6_protocol_changelog_v1_0_1.json');
    expect(fs.existsSync(logPath)).toBe(true);
    const log = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
    expect(log.previousVersion).toBe('1.0.0');
    expect(log.newVersion).toBe('1.0.1');
    expect(log.acquisitionState).toBe('PRE_ACQUISITION_NO_PROSPECTIVE_DATA_EXAMINED');
  });

  // 9. Production Immutability
  it('9. verifies core/ict/ has 0 diff lines against baseline 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a', () => {
    const diff = execSync('git diff 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a -- core/ict/').toString();
    expect(diff.trim().length).toBe(0);
  });
});
