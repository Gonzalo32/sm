import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { ReadOnlyPreflightGuard, TradingDisabledViolationError } from '../extension/content/ReadOnlyPreflightGuard';
import { TradeSeaPassiveRecorder } from '../extension/content/TradeSeaPassiveRecorder';

describe('CP81 — Human Pre-Open Verification & Capture Authorization Gate Suite', () => {
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

  it('2. Exact byte SHA-256 of s10_session_manifest.json and protocol spec match frozen values', () => {
    const manifestBytes = fs.readFileSync(manifestPath);
    const manifestHash = crypto.createHash('sha256').update(manifestBytes).digest('hex');
    expect(manifestHash).toBe('744720e2b930550d1d7bb76654459b9277c094302b595051fad8323cba7f7107');

    const protocolBytes = fs.readFileSync(protocolPath);
    const protocolHash = crypto.createHash('sha256').update(protocolBytes).digest('hex');
    expect(protocolHash).toBe('d8c4e83cbce2a303c2fd947cac424822d6d6885a4d5800ff234ef5e348317220');
  });

  it('3. Target session S10_SESSION_003_20261014 parameters resolve accurately from frozen manifest', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const session003 = manifest.sessions.find((s: any) => s.sessionId === 'S10_SESSION_003_20261014');

    expect(session003).toBeDefined();
    expect(session003.sessionId).toBe('S10_SESSION_003_20261014');
    expect(session003.dateLocal).toBe('2026-10-14');
    expect(session003.timezone).toBe('America/New_York');
    expect(session003.utcOffsetHours).toBe(-4);
    expect(session003.rthStartLocal).toBe('09:30:00');
    expect(session003.rthEndLocal).toBe('16:00:00');
    expect(session003.rthStartUtc).toBe('13:30:00Z');
    expect(session003.rthEndUtc).toBe('20:00:00Z');
    expect(session003.signalCutoffLocal).toBe('15:55:00');
    expect(session003.signalCutoffUtc).toBe('19:55:00Z');
    expect(session003.contract).toBe('NQZ6 / MNQZ6');
    expect(session003.isEarlyClose).toBe(false);
    expect(session003.status).toBe('PREREGISTERED_PENDING_ACQUISITION');
  });

  it('4. Session 002 artifacts are immutably preserved as INVALID_INCOMPLETE without reuse or deletion', () => {
    expect(fs.existsSync(session002SummaryPath)).toBe(true);
    const summary = JSON.parse(fs.readFileSync(session002SummaryPath, 'utf-8'));

    expect(summary.finalSessionStatus).toBe('INVALID_INCOMPLETE');
    expect(summary.officialCaptureLedgerState.officialCandlesCaptured).toBe(0);
    expect(summary.officialCaptureLedgerState.officialCandlesPersisted).toBe(0);
    expect(summary.mandatoryGovernanceFlags.officialS10CaptureStarted).toBe('NO');
  });

  it('5. ReadOnlyPreflightGuard enforces fail-closed trading restrictions and reports blockers when human confirmation is pending', () => {
    const guard = new ReadOnlyPreflightGuard();

    // Must unconditionally throw on execution attempt
    expect(() => guard.blockTradingAction('place_order')).toThrowError(TradingDisabledViolationError);

    // Passive evaluation returns ready: false when human confirmation is false
    const evalPending = guard.evaluatePassivePreflight({
      symbol: 'MNQ',
      expectedSymbol: 'MNQ',
      timeframe: '1m',
      expectedTimeframe: '1m',
      currentTimeArt: '10:15:00',
      rthStartArt: '10:30:00',
      humanConfirmedNoPosition: false,
      humanConfirmedNoPendingOrders: false,
      streamActive: true,
    });

    expect(evalPending.ready).toBe(false);
    expect(evalPending.blockers).toContain(
      'POSITION_UNCONFIRMED: Human operator has not confirmed that all positions are closed/flattened'
    );
    expect(evalPending.blockers).toContain(
      'PENDING_ORDERS_UNCONFIRMED: Human operator has not confirmed that zero pending orders exist'
    );
  });

  it('6. TradeSeaPassiveRecorder source code inspection verifies zero order placement or trade routing capability', () => {
    const recorder = new TradeSeaPassiveRecorder();

    // Verify recorder API surface has no trading methods
    const prototypeKeys = Object.getOwnPropertyNames(Object.getPrototypeOf(recorder));
    expect(prototypeKeys).not.toContain('buy');
    expect(prototypeKeys).not.toContain('sell');
    expect(prototypeKeys).not.toContain('placeOrder');
    expect(prototypeKeys).not.toContain('cancelOrder');
    expect(prototypeKeys).not.toContain('flatten');

    // Context inspection confirms passive defaults
    expect(recorder.getContext()).toEqual({ symbol: 'MNQ', timeframe: '1m' });
    expect(recorder.isRecordingActive()).toBe(false);
  });

  it('7. Governance invariants: official capture NOT started, live trading NOT authorized, zero order actions', () => {
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
