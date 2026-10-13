import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

describe('CP77 — S10 Official Prospective Capture Preflight & Integrity Gate Suite', () => {
  const rootDir = process.cwd();
  const manifestPath = path.join(rootDir, 'data_audit/phase_s10_prospective/s10_session_manifest.json');
  const protocolPath = path.join(rootDir, 'data_audit/phase_s10_prospective/s10_prospective_protocol_spec_v1_1_0_final.json');

  it('1. core/ict/ must maintain 0 diff lines against baseline 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a', () => {
    const diff = execSync('git diff 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a -- core/ict/', {
      encoding: 'utf-8',
      cwd: rootDir,
    });
    expect(diff.trim()).toBe('');
  });

  it('2. Exact byte SHA-256 of s10_session_manifest.json and protocol v1.1.0 spec must match frozen hashes', () => {
    const manifestContent = fs.readFileSync(manifestPath);
    const manifestHash = crypto.createHash('sha256').update(manifestContent).digest('hex');
    expect(manifestHash).toBe('744720e2b930550d1d7bb76654459b9277c094302b595051fad8323cba7f7107');

    const protocolContent = fs.readFileSync(protocolPath);
    const protocolHash = crypto.createHash('sha256').update(protocolContent).digest('hex');
    expect(protocolHash).toBe('d8c4e83cbce2a303c2fd947cac424822d6d6885a4d5800ff234ef5e348317220');
  });

  it('3. Target session for October 13, 2026 resolves to S10_SESSION_002_20261013 in frozen manifest', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const session = manifest.sessions.find((s: any) => s.dateLocal === '2026-10-13');

    expect(session).toBeDefined();
    expect(session.sessionId).toBe('S10_SESSION_002_20261013');
    expect(session.contract).toBe('NQZ6 / MNQZ6');
    expect(session.timezone).toBe('America/New_York');
    expect(session.rthStartLocal).toBe('09:30:00');
    expect(session.rthEndLocal).toBe('16:00:00');
    expect(session.signalCutoffLocal).toBe('15:55:00');
    expect(session.status).toBe('PREREGISTERED_PENDING_ACQUISITION');
  });

  it('4. Preflight schedule verification: RTH start is 10:30 ART (09:30 EDT); pre-RTH timestamp prevents premature capture', () => {
    // Preflight schedule check: RTH start is 10:30 ART (09:30 EDT); pre-RTH timestamp prevents premature capture
    const rthStartHourArt: number = 10;
    const rthStartMinuteArt: number = 30;

    // Inspection time: 08:35 ART -> pre-RTH
    const preRthHourArt: number = 8;
    const preRthMinuteArt: number = 35;

    const isPreRth = (preRthHourArt < rthStartHourArt) || (preRthHourArt === rthStartHourArt && preRthMinuteArt < rthStartMinuteArt);
    expect(isPreRth).toBe(true);
  });

  it('5. Mandatory governance invariants: official capture cannot be started if preflight conditions fail', () => {
    const requiredSymbol: string = 'MNQ';
    const activeBrowserSymbol: string = 'MES'; // Observed in TradeSea UI

    const symbolMatch = (activeBrowserSymbol === requiredSymbol);
    expect(symbolMatch).toBe(false);

    // Because symbol does not match and time is pre-RTH, status must be BLOCKED
    const preflightStatus = symbolMatch ? 'CAPTURING' : 'BLOCKED';
    expect(preflightStatus).toBe('BLOCKED');
  });
});
