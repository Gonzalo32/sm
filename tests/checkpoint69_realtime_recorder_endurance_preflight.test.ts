import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

describe('CP69 — Real-Time Recorder Endurance & S10 Preflight Audit', () => {
  const rootDir = process.cwd();
  const cp69Dir = path.join(rootDir, 'data_audit/phase_cp69');
  const summaryPath = path.join(cp69Dir, 'cp69_preflight_summary.json');
  const metricsPath = path.join(cp69Dir, 'cp69_metrics_summary.json');
  const hashManifestPath = path.join(cp69Dir, 'cp69_hash_manifest.json');
  const manifestPath = path.join(rootDir, 'data_audit/phase_s10_prospective/s10_session_manifest.json');
  const finalProtocolPath = path.join(rootDir, 'data_audit/phase_s10_prospective/s10_prospective_protocol_spec_v1_1_0_final.json');

  it('1. core/ict/ must maintain 0 diff lines against baseline 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a', () => {
    const diff = execSync('git diff 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a -- core/ict/', {
      encoding: 'utf-8',
      cwd: rootDir,
    });
    expect(diff.trim()).toBe('');
  });

  it('2. CP69 preflight summary must reflect PASS_WITH_LIMITATIONS and non-official smoke test labeling', () => {
    expect(fs.existsSync(summaryPath)).toBe(true);
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));

    expect(summary.cp69Status).toBe('PASS_WITH_LIMITATIONS');
    expect(summary.multiCandleSmokeTest.dataLabel).toBe('NON_OFFICIAL_SMOKE_TEST');
    expect(summary.multiCandleSmokeTest.fullSessionEnduranceClaimed).toBe(false);
    expect(summary.officialS10CaptureStarted).toBe('NO');
    expect(summary.liveTradingAuthorized).toBe('NO');
  });

  it('3. CME calendar source must be authoritatively recorded', () => {
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
    expect(summary.authoritativeCmeCalendarSource.status).toBe('VERIFIED_CME_GROUP_SPECIFICATION');
    expect(summary.authoritativeCmeCalendarSource.thanksgivingDay).toContain('CLOSED');
    expect(summary.authoritativeCmeCalendarSource.blackFriday).toContain('EARLY CLOSE');
  });

  it('4. Frozen session manifest and Protocol v1.1.0 specification hashes must match', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    expect(fs.existsSync(finalProtocolPath)).toBe(true);

    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifestHash = crypto.createHash('sha256').update(manifestContent).digest('hex');
    expect(manifestHash).toBe('744720e2b930550d1d7bb76654459b9277c094302b595051fad8323cba7f7107');

    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
    expect(summary.governanceAndHashes.frozenManifestHashMatchesCP68).toBe(true);
  });

  it('5. Metrics summary must state OFFICIAL_S10_CAPTURE_STARTED = NO', () => {
    expect(fs.existsSync(metricsPath)).toBe(true);
    const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));

    expect(metrics.CP69_STATUS).toBe('PASS_WITH_LIMITATIONS');
    expect(metrics.FULL_SESSION_ENDURANCE_CLAIMED).toBe('NO_PREFLIGHT_ONLY');
    expect(metrics.OFFICIAL_S10_CAPTURE_STARTED).toBe('NO');
    expect(metrics.LIVE_TRADING_AUTHORIZED).toBe('NO');
  });

  it('6. Hash manifest must verify all CP69 JSON artifact hashes', () => {
    expect(fs.existsSync(hashManifestPath)).toBe(true);
    const hashManifest = JSON.parse(fs.readFileSync(hashManifestPath, 'utf-8'));

    for (const [file, expectedHash] of Object.entries(hashManifest.files)) {
      const filePath = path.join(cp69Dir, file);
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath);
      const actualHash = crypto.createHash('sha256').update(content).digest('hex');
      expect(actualHash).toBe(expectedHash);
    }
  });
});
