import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

describe('CP70 — Frozen Artifact Hash Reconciliation & S10 Authorization Gate', () => {
  const rootDir = process.cwd();
  const cp70Dir = path.join(rootDir, 'data_audit/phase_cp70');
  const summaryPath = path.join(cp70Dir, 'cp70_hash_reconciliation.json');
  const metricsPath = path.join(cp70Dir, 'cp70_metrics_summary.json');
  const hashManifestPath = path.join(cp70Dir, 'cp70_hash_manifest.json');
  const manifestPath = path.join(rootDir, 'data_audit/phase_s10_prospective/s10_session_manifest.json');
  const finalProtocolPath = path.join(rootDir, 'data_audit/phase_s10_prospective/s10_prospective_protocol_spec_v1_1_0_final.json');

  it('1. core/ict/ must maintain 0 diff lines against baseline 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a', () => {
    const diff = execSync('git diff 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a -- core/ict/', {
      encoding: 'utf-8',
      cwd: rootDir,
    });
    expect(diff.trim()).toBe('');
  });

  it('2. Exact byte SHA-256 of s10_session_manifest.json must match 744720e2b930550d1d7bb76654459b9277c094302b595051fad8323cba7f7107', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    const content = fs.readFileSync(manifestPath);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    expect(hash).toBe('744720e2b930550d1d7bb76654459b9277c094302b595051fad8323cba7f7107');
  });

  it('3. Exact byte SHA-256 of s10_prospective_protocol_spec_v1_1_0_final.json must match d8c4e83cbce2a303c2fd947cac424822d6d6885a4d5800ff234ef5e348317220', () => {
    expect(fs.existsSync(finalProtocolPath)).toBe(true);
    const content = fs.readFileSync(finalProtocolPath);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    expect(hash).toBe('d8c4e83cbce2a303c2fd947cac424822d6d6885a4d5800ff234ef5e348317220');
  });

  it('4. Hash reconciliation audit must explain discrepancy root cause as doc transcription typo', () => {
    expect(fs.existsSync(summaryPath)).toBe(true);
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));

    expect(summary.cp70Status).toBe('PASS_WITH_LIMITATIONS');
    expect(summary.reconciliationVerdict).toBe('MANIFEST_AND_PROTOCOL_INTEGRITY_VERIFIED');
    expect(summary.sessionManifestForensics.exactByteSha256).toBe('744720e2b930550d1d7bb76654459b9277c094302b595051fad8323cba7f7107');
    expect(summary.sessionManifestForensics.discrepancyRootCause).toContain('transcription');
    expect(summary.officialS10CaptureStarted).toBe('NO');
    expect(summary.liveTradingAuthorized).toBe('NO');
  });

  it('5. Metrics summary must state OFFICIAL_S10_CAPTURE_STARTED = NO and LIVE_TRADING_AUTHORIZED = NO', () => {
    expect(fs.existsSync(metricsPath)).toBe(true);
    const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));

    expect(metrics.CP70_STATUS).toBe('PASS_WITH_LIMITATIONS');
    expect(metrics.MANIFEST_EXACT_BYTE_SHA256).toBe('744720e2b930550d1d7bb76654459b9277c094302b595051fad8323cba7f7107');
    expect(metrics.PROTOCOL_EXACT_BYTE_SHA256).toBe('d8c4e83cbce2a303c2fd947cac424822d6d6885a4d5800ff234ef5e348317220');
    expect(metrics.OFFICIAL_S10_CAPTURE_STARTED).toBe('NO');
    expect(metrics.LIVE_TRADING_AUTHORIZED).toBe('NO');
  });

  it('6. Hash manifest must verify all CP70 JSON artifact hashes', () => {
    expect(fs.existsSync(hashManifestPath)).toBe(true);
    const hashManifest = JSON.parse(fs.readFileSync(hashManifestPath, 'utf-8'));

    for (const [file, expectedHash] of Object.entries(hashManifest.files)) {
      const filePath = path.join(cp70Dir, file);
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath);
      const actualHash = crypto.createHash('sha256').update(content).digest('hex');
      expect(actualHash).toBe(expectedHash);
    }
  });
});
