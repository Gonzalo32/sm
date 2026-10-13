import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { ReadOnlyPreflightGuard, TradingDisabledViolationError } from '../extension/content/ReadOnlyPreflightGuard';

describe('CP78 — Safe Remediation & Read-Only Preflight Test Suite', () => {
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

  it('3. ReadOnlyPreflightGuard strictly enforces live trading unauthorized and blocks order actions', () => {
    const guard = new ReadOnlyPreflightGuard();

    // Must not throw on assertLiveTradingUnauthorized since live trading is unauthorized
    expect(() => guard.assertLiveTradingUnauthorized()).not.toThrow();

    // Must throw TradingDisabledViolationError on any execution attempt
    expect(() => guard.blockTradingAction('market_order_buy')).toThrowError(TradingDisabledViolationError);
    expect(() => guard.blockTradingAction('market_order_sell')).toThrowError(TradingDisabledViolationError);
    expect(() => guard.blockTradingAction('flatten_all')).toThrowError(TradingDisabledViolationError);
  });

  it('4. ReadOnlyPreflightGuard identifies and blocks all order-entry controls by text, class, and testId', () => {
    const guard = new ReadOnlyPreflightGuard();

    // Order pad controls must be blocked
    expect(guard.isInteractionAllowed({ text: 'Buy 2 MKT' })).toBe(false);
    expect(guard.isInteractionAllowed({ text: 'Sell 1 Limit' })).toBe(false);
    expect(guard.isInteractionAllowed({ text: 'Flatten All' })).toBe(false);
    expect(guard.isInteractionAllowed({ text: 'Close Position' })).toBe(false);
    expect(guard.isInteractionAllowed({ className: 'dom-order-pad-btn' })).toBe(false);
    expect(guard.isInteractionAllowed({ testId: 'order-submit-button' })).toBe(false);
    expect(guard.isInteractionAllowed({ testId: 'buy-market' })).toBe(false);

    // Read-only chart or indicator controls are permitted
    expect(guard.isInteractionAllowed({ text: 'Indicators' })).toBe(true);
    expect(guard.isInteractionAllowed({ text: 'Timeframe 1m' })).toBe(true);
    expect(guard.isInteractionAllowed({ text: 'Settings' })).toBe(true);
  });

  it('5. Passive preflight evaluation rejects start if human operator has not confirmed position remediation', () => {
    const guard = new ReadOnlyPreflightGuard();

    // When human confirmation is absent (even if symbols match and time is RTH)
    const resultUnconfirmed = guard.evaluatePassivePreflight({
      symbol: 'MNQ',
      expectedSymbol: 'MNQ',
      timeframe: '1m',
      expectedTimeframe: '1m',
      currentTimeArt: '10:35:00',
      rthStartArt: '10:30:00',
      humanConfirmedNoPosition: false, // NOT CONFIRMED
      humanConfirmedNoPendingOrders: true,
      streamActive: true,
    });

    expect(resultUnconfirmed.ready).toBe(false);
    expect(resultUnconfirmed.blockers).toContain(
      'POSITION_UNCONFIRMED: Human operator has not confirmed that all positions are closed/flattened'
    );
  });

  it('6. Passive preflight evaluation rejects start if current time is pre-RTH', () => {
    const guard = new ReadOnlyPreflightGuard();

    const resultPreRth = guard.evaluatePassivePreflight({
      symbol: 'MNQ',
      expectedSymbol: 'MNQ',
      timeframe: '1m',
      expectedTimeframe: '1m',
      currentTimeArt: '09:45:00', // Pre-RTH
      rthStartArt: '10:30:00',
      humanConfirmedNoPosition: true,
      humanConfirmedNoPendingOrders: true,
      streamActive: true,
    });

    expect(resultPreRth.ready).toBe(false);
    expect(resultPreRth.blockers.some((b: string) => b.includes('PRE_RTH_WINDOW'))).toBe(true);
  });

  it('7. Passive preflight evaluation succeeds only when all conditions including human confirmation are satisfied', () => {
    const guard = new ReadOnlyPreflightGuard();

    const resultReady = guard.evaluatePassivePreflight({
      symbol: 'MNQ',
      expectedSymbol: 'MNQ',
      timeframe: '1m',
      expectedTimeframe: '1m',
      currentTimeArt: '10:30:01', // At or after RTH
      rthStartArt: '10:30:00',
      humanConfirmedNoPosition: true,
      humanConfirmedNoPendingOrders: true,
      streamActive: true,
    });

    expect(resultReady.ready).toBe(true);
    expect(resultReady.blockers).toHaveLength(0);
  });

  it('8. Zero order actions and zero official candles captured during CP78', () => {
    // Official prospective captures ledger directory
    const officialSessionDir = path.join(
      rootDir,
      'data_audit/phase_s10_prospective/daily_captures/S10_SESSION_002_20261013'
    );
    expect(fs.existsSync(officialSessionDir)).toBe(true);

    const summaryFile = path.join(officialSessionDir, 's10_session_002_summary.json');
    const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf-8'));

    // Official capture must remain 0 and NOT started
    expect(summary.officialCaptureLedgerState.officialCandlesCaptured).toBe(0);
    expect(summary.officialCaptureLedgerState.officialCandlesPersisted).toBe(0);
    expect(summary.mandatoryGovernanceFlags.officialS10CaptureStarted).toBe('NO');
    expect(summary.mandatoryGovernanceFlags.liveTradingAuthorized).toBe('NO');
  });
});
