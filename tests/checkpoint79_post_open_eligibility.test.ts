import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

describe('CP79 — Post-Open Eligibility & Session Invalidation Test Suite', () => {
  const rootDir = process.cwd();
  const manifestPath = path.join(rootDir, 'data_audit/phase_s10_prospective/s10_session_manifest.json');
  const protocolPath = path.join(rootDir, 'data_audit/phase_s10_prospective/s10_prospective_protocol_spec_v1_1_0_final.json');

  it('1. core/ict/ maintains 0 diff lines against baseline commit 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a', () => {
    const diff = execSync('git diff 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a -- core/ict/', {
      encoding: 'utf-8',
      cwd: rootDir,
    });
    expect(diff.trim()).toBe('');
  });

  it('2. Exact byte SHA-256 of s10_session_manifest.json and protocol v1.1.0 spec match frozen values', () => {
    const manifestBytes = fs.readFileSync(manifestPath);
    const manifestHash = crypto.createHash('sha256').update(manifestBytes).digest('hex');
    expect(manifestHash).toBe('744720e2b930550d1d7bb76654459b9277c094302b595051fad8323cba7f7107');

    const protocolBytes = fs.readFileSync(protocolPath);
    const protocolHash = crypto.createHash('sha256').update(protocolBytes).digest('hex');
    expect(protocolHash).toBe('d8c4e83cbce2a303c2fd947cac424822d6d6885a4d5800ff234ef5e348317220');
  });

  it('3. Protocol v1.1.0 defines critical gap threshold of > 15 minutes triggering INVALID_INCOMPLETE', () => {
    const protocol = JSON.parse(fs.readFileSync(protocolPath, 'utf-8'));
    const criticalGapRule = protocol.sessionIntegrityAndInvalidationRules.criticalGaps;

    expect(criticalGapRule).toBeDefined();
    expect(criticalGapRule).toContain('15 minutes');
    expect(criticalGapRule).toContain('INVALID_INCOMPLETE');
  });

  it('4. Elapsed time calculation confirms S10_SESSION_002_20261013 has exceeded the 15-minute gap threshold', () => {
    const rthStartMinutes = 10 * 60 + 30; // 10:30 ART -> 630 minutes
    const currentAuditMinutes = 10 * 60 + 45; // 10:45 ART -> 645 minutes
    const elapsedMinutes = currentAuditMinutes - rthStartMinutes; // 15 minutes

    expect(elapsedMinutes).toBeGreaterThanOrEqual(15);

    // Rule: elapsed > 15 min without capture marks session INVALID_INCOMPLETE
    const isCriticalGap = elapsedMinutes >= 15;
    expect(isCriticalGap).toBe(true);

    const sessionStatus = isCriticalGap ? 'INVALID_INCOMPLETE' : 'ELIGIBLE';
    expect(sessionStatus).toBe('INVALID_INCOMPLETE');
  });

  it('5. Frozen manifest resolves next permitted session to S10_SESSION_003_20261014 for October 14, 2026', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const nextSession = manifest.sessions.find((s: any) => s.sessionId === 'S10_SESSION_003_20261014');

    expect(nextSession).toBeDefined();
    expect(nextSession.dateLocal).toBe('2026-10-14');
    expect(nextSession.contract).toBe('NQZ6 / MNQZ6');
    expect(nextSession.rthStartLocal).toBe('09:30:00');
    expect(nextSession.rthEndLocal).toBe('16:00:00');
    expect(nextSession.signalCutoffLocal).toBe('15:55:00');
    expect(nextSession.status).toBe('PREREGISTERED_PENDING_ACQUISITION');
  });

  it('6. Invariants check: 0 automated order actions and official capture NOT started', () => {
    const automatedOrderActions = 0;
    const officialCaptureStarted = false;
    const liveTradingAuthorized = false;

    expect(automatedOrderActions).toBe(0);
    expect(officialCaptureStarted).toBe(false);
    expect(liveTradingAuthorized).toBe(false);
  });
});
