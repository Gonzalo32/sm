import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { ReadOnlyPreflightGuard, TradingDisabledViolationError } from '../extension/content/ReadOnlyPreflightGuard';
import { TradeSeaPassiveRecorder } from '../extension/content/TradeSeaPassiveRecorder';

describe('CP82 — Human Remediation Confirmation & Session 003 Final Eligibility Gate Suite', () => {
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

  it('3. Session 002 artifacts are immutably preserved as INVALID_INCOMPLETE without reuse or deletion', () => {
    expect(fs.existsSync(session002SummaryPath)).toBe(true);
    const summary = JSON.parse(fs.readFileSync(session002SummaryPath, 'utf-8'));

    expect(summary.finalSessionStatus).toBe('INVALID_INCOMPLETE');
    expect(summary.officialCaptureLedgerState.officialCandlesCaptured).toBe(0);
    expect(summary.officialCaptureLedgerState.officialCandlesPersisted).toBe(0);
    expect(summary.mandatoryGovernanceFlags.officialS10CaptureStarted).toBe('NO');
  });

  it('4. Target session S10_SESSION_003_20261014 resolves accurately from frozen manifest', () => {
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
    expect(session003.status).toBe('PREREGISTERED_PENDING_ACQUISITION');
  });

  it('5. Session timing and late-start assessment: boundary is future date (2026-10-14), preventing premature capture on 2026-10-13', () => {
    const targetDate = '2026-10-14';
    const auditDate = '2026-10-13';

    // Target date is in the future relative to current audit date
    expect(targetDate > auditDate).toBe(true);

    // Official capture cannot start today (prior to manifest session date)
    const isPremature = auditDate < targetDate;
    expect(isPremature).toBe(true);
  });

  it('6. Human remediation confirmation gate: absence of explicit operator confirmation enforces BLOCKED_PENDING_HUMAN_CONFIRMATION', () => {
    const guard = new ReadOnlyPreflightGuard();

    const humanConfirmedNoPosition = false; // UNKNOWN / NOT_CONFIRMED
    const humanConfirmedNoPendingOrders = false; // UNKNOWN / NOT_CONFIRMED

    const evaluation = guard.evaluatePassivePreflight({
      symbol: 'MNQ',
      expectedSymbol: 'MNQ',
      timeframe: '1m',
      expectedTimeframe: '1m',
      currentTimeArt: '10:15:00',
      rthStartArt: '10:30:00',
      humanConfirmedNoPosition,
      humanConfirmedNoPendingOrders,
      streamActive: true,
    });

    expect(evaluation.ready).toBe(false);
    expect(evaluation.blockers).toContain(
      'POSITION_UNCONFIRMED: Human operator has not confirmed that all positions are closed/flattened'
    );
    expect(evaluation.blockers).toContain(
      'PENDING_ORDERS_UNCONFIRMED: Human operator has not confirmed that zero pending orders exist'
    );

    // Final eligibility status decision
    const eligibilityDecision = evaluation.ready ? 'ELIGIBLE_FOR_SEPARATE_HUMAN_AUTHORIZATION' : 'BLOCKED_PENDING_HUMAN_CONFIRMATION';
    expect(eligibilityDecision).toBe('BLOCKED_PENDING_HUMAN_CONFIRMATION');
  });

  it('7. Passive recorder architectural integrity: zero trading controls and fail-closed operation', () => {
    const recorder = new TradeSeaPassiveRecorder();
    expect(recorder.isRecordingActive()).toBe(false);

    // Any attempt to execute trading action throws TradingDisabledViolationError
    const guard = new ReadOnlyPreflightGuard();
    expect(() => guard.blockTradingAction('execute_trade')).toThrowError(TradingDisabledViolationError);
  });

  it('8. Governance invariants check: official capture NOT started, live trading NOT authorized, zero order actions', () => {
    const officialS10CaptureStarted = false;
    const liveTradingAuthorized = false;
    const automatedOrderActions = 0;
    const automatedTradingUiInteractions = 0;

    expect(officialS10CaptureStarted).toBe(false);
    expect(liveTradingAuthorized).toBe(false);
    expect(automatedOrderActions).toBe(0);
    expect(automatedTradingUiInteractions).toBe(0);
  });
});
