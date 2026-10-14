import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { ReadOnlyPreflightGuard, TradingDisabledViolationError } from '../extension/content/ReadOnlyPreflightGuard';

describe('TradeSea Market Analyst — Security, Isolation & Frozen Boundaries Audit', () => {
  const rootDir = process.cwd();
  const manifestPath = path.join(rootDir, 'data_audit/phase_s10_prospective/s10_session_manifest.json');
  const protocolPath = path.join(rootDir, 'data_audit/phase_s10_prospective/s10_prospective_protocol_spec_v1_1_0_final.json');
  const session002SummaryPath = path.join(
    rootDir,
    'data_audit/phase_s10_prospective/daily_captures/S10_SESSION_002_20261013/s10_session_002_summary.json'
  );

  it('1. core/ict/ maintains exact 0-line diff against frozen baseline commit 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a', () => {
    const diff = execSync('git diff 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a -- core/ict/', {
      encoding: 'utf-8',
      cwd: rootDir,
    });
    expect(diff.trim()).toBe('');
  });

  it('2. Exact byte SHA-256 of S10 manifest and protocol v1.1.0 specification match frozen hashes', () => {
    const manifestBytes = fs.readFileSync(manifestPath);
    const manifestHash = crypto.createHash('sha256').update(manifestBytes).digest('hex');
    expect(manifestHash).toBe('744720e2b930550d1d7bb76654459b9277c094302b595051fad8323cba7f7107');

    const protocolBytes = fs.readFileSync(protocolPath);
    const protocolHash = crypto.createHash('sha256').update(protocolBytes).digest('hex');
    expect(protocolHash).toBe('d8c4e83cbce2a303c2fd947cac424822d6d6885a4d5800ff234ef5e348317220');
  });

  it('3. Session 002 artifacts are immutably preserved as INVALID_INCOMPLETE without modification', () => {
    expect(fs.existsSync(session002SummaryPath)).toBe(true);
    const summary = JSON.parse(fs.readFileSync(session002SummaryPath, 'utf-8'));
    expect(summary.finalSessionStatus).toBe('INVALID_INCOMPLETE');
    expect(summary.officialCaptureLedgerState.officialCandlesCaptured).toBe(0);
    expect(summary.officialCaptureLedgerState.officialCandlesPersisted).toBe(0);
    expect(summary.mandatoryGovernanceFlags.officialS10CaptureStarted).toBe('NO');
  });

  it('4. Zero order-execution and trading API surface in core/analyst and extension/analyst', () => {
    const prohibitedTokens = [
      'submitOrder',
      'placeOrder',
      'cancelOrder',
      'closePosition',
      'flatten',
      'sendOrder',
      'executeOrder',
      'buy-button',
      'sell-button',
      'order-entry',
      'account-summary',
      'brokerExecution',
    ];

    const analystDirs = [
      path.join(rootDir, 'core/analyst'),
      path.join(rootDir, 'extension/analyst'),
    ];

    for (const dir of analystDirs) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.ts'));

      for (const file of files) {
        const content = fs.readFileSync(path.join(dir, file), 'utf-8');
        for (const token of prohibitedTokens) {
          const regex = new RegExp(`\\b${token}\\b`, 'i');
          const matched = regex.test(content);
          expect(
            matched,
            `Prohibited trading execution token '${token}' found in analyst source: ${file}`
          ).toBe(false);
        }
      }
    }
  });

  it('5. ReadOnlyPreflightGuard remains active and throws TradingDisabledViolationError', () => {
    const guard = new ReadOnlyPreflightGuard();
    expect(() => guard.assertLiveTradingUnauthorized()).not.toThrow();

    expect(() => {
      guard.blockTradingAction('Test execution attempt');
    }).toThrow(TradingDisabledViolationError);

    // Blocked trading interactions
    expect(guard.isInteractionAllowed({ text: 'Buy 2 MKT' })).toBe(false);
    expect(guard.isInteractionAllowed({ text: 'Sell 1 Limit' })).toBe(false);
    expect(guard.isInteractionAllowed({ className: 'dom-order-pad-btn' })).toBe(false);
    expect(guard.isInteractionAllowed({ testId: 'order-submit-button' })).toBe(false);

    // Allowed non-trading interactions
    expect(guard.isInteractionAllowed({ text: 'Analizar mercado' })).toBe(true);
  });

  it('6. MarketAnalystJournal is strictly isolated in TradeSeaMarketAnalystDB database', () => {
    const journalPath = path.join(rootDir, 'extension/analyst/MarketAnalystJournal.ts');
    const journalContent = fs.readFileSync(journalPath, 'utf-8');

    expect(journalContent).toContain("'TradeSeaMarketAnalystDB'");
    expect(journalContent).not.toContain('TradeSeaPassiveDataDB');
    expect(journalContent).not.toContain('s10_official');
  });
});
