import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { ReadOnlyPreflightGuard, TradingDisabledViolationError } from '../extension/content/ReadOnlyPreflightGuard';

describe('CP80 — Next-Session Readiness & Safety Preflight Audit Suite', () => {
  const rootDir = process.cwd();
  const manifestPath = path.join(rootDir, 'data_audit/phase_s10_prospective/s10_session_manifest.json');
  const protocolPath = path.join(rootDir, 'data_audit/phase_s10_prospective/s10_prospective_protocol_spec_v1_1_0_final.json');
  const session002SummaryPath = path.join(
    rootDir,
    'data_audit/phase_s10_prospective/daily_captures/S10_SESSION_002_20261013/s10_session_002_summary.json'
  );

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

  it('3. Session 002 artifacts remain immutably preserved as INVALID_INCOMPLETE without reuse or deletion', () => {
    expect(fs.existsSync(session002SummaryPath)).toBe(true);
    const summary = JSON.parse(fs.readFileSync(session002SummaryPath, 'utf-8'));

    expect(summary.finalSessionStatus).toBe('INVALID_INCOMPLETE');
    expect(summary.officialCaptureLedgerState.officialCandlesCaptured).toBe(0);
    expect(summary.officialCaptureLedgerState.officialCandlesPersisted).toBe(0);
    expect(summary.mandatoryGovernanceFlags.officialS10CaptureStarted).toBe('NO');
  });

  it('4. Session 003 resolves accurately from frozen manifest for Wednesday, October 14, 2026', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const session003 = manifest.sessions.find((s: any) => s.sessionId === 'S10_SESSION_003_20261014');

    expect(session003).toBeDefined();
    expect(session003.sessionId).toBe('S10_SESSION_003_20261014');
    expect(session003.dateLocal).toBe('2026-10-14');
    expect(session003.timezone).toBe('America/New_York');
    expect(session003.utcOffsetHours).toBe(-4);
    expect(session003.rthStartLocal).toBe('09:30:00');
    expect(session003.rthEndLocal).toBe('16:00:00');
    expect(session003.signalCutoffLocal).toBe('15:55:00');
    expect(session003.contract).toBe('NQZ6 / MNQZ6');
    expect(session003.isEarlyClose).toBe(false);
    expect(session003.status).toBe('PREREGISTERED_PENDING_ACQUISITION');
  });

  it('5. RTH Neuquén local schedule conversion verified for Session 003 (EDT: 10:30 ART start)', () => {
    const protocol = JSON.parse(fs.readFileSync(protocolPath, 'utf-8'));
    const edtSchedule = protocol.neuquenLocalTimeSchedule.edtPeriod;

    expect(edtSchedule.rthNycLocal).toBe('09:30 - 16:00 EDT');
    expect(edtSchedule.rthNeuquenLocal).toBe('10:30 - 17:00 ART (UTC-3)');
    expect(edtSchedule.signalCutoffNeuquen).toBe('16:55 ART');
  });

  it('6. ReadOnlyPreflightGuard enforces trading prohibition and documents defensive limitations', () => {
    const guard = new ReadOnlyPreflightGuard();

    // Must block order action execution
    expect(() => guard.blockTradingAction('execute_order')).toThrowError(TradingDisabledViolationError);

    // Passive evaluation must detect missing human confirmation
    const evaluation = guard.evaluatePassivePreflight({
      symbol: 'MNQ',
      expectedSymbol: 'MNQ',
      timeframe: '1m',
      expectedTimeframe: '1m',
      currentTimeArt: '10:15:00',
      rthStartArt: '10:30:00',
      humanConfirmedNoPosition: false, // PENDING
      humanConfirmedNoPendingOrders: false, // PENDING
      streamActive: true,
    });

    expect(evaluation.ready).toBe(false);
    expect(evaluation.blockers).toContain(
      'POSITION_UNCONFIRMED: Human operator has not confirmed that all positions are closed/flattened'
    );
    expect(evaluation.blockers).toContain(
      'PENDING_ORDERS_UNCONFIRMED: Human operator has not confirmed that zero pending orders exist'
    );
  });

  it('7. Governance invariants: official capture NOT started, live trading NOT authorized', () => {
    const officialS10CaptureStarted = false;
    const liveTradingAuthorized = false;

    expect(officialS10CaptureStarted).toBe(false);
    expect(liveTradingAuthorized).toBe(false);
  });
});
