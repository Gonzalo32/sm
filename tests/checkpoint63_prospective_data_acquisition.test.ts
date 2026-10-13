import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

describe('CP63 — S10 Prospective Data Acquisition Audit', () => {
  const rootDir = process.cwd();
  const protocolPath = path.join(rootDir, 'data_audit/phase_s9_6/s9_6_prospective_protocol_spec_v1_0_1.json');
  const prospectiveDir = path.join(rootDir, 'data_audit/phase_s10_prospective');
  const manifestPath = path.join(prospectiveDir, 's10_session_manifest.json');
  const acquisitionStatusPath = path.join(prospectiveDir, 'cp63_acquisition_status.json');
  const metricsSummaryPath = path.join(prospectiveDir, 'cp63_metrics_summary.json');
  const hashManifestPath = path.join(prospectiveDir, 'cp63_hash_manifest.json');

  it('1. Protocol v1.0.1 SHA-256 hash must match frozen specification', () => {
    expect(fs.existsSync(protocolPath)).toBe(true);
    const protocolContent = fs.readFileSync(protocolPath, 'utf-8');
    const hash = crypto.createHash('sha256').update(protocolContent).digest('hex');
    expect(hash).toBe('5b9187b8f20731de86bdca2ff0c26dfc8df1426a9f1fdc023b6dd33abbfc2cdd');
  });

  it('2. core/ict/ must have 0 diff lines against baseline 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a', () => {
    const diff = execSync('git diff 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a -- core/ict/', {
      encoding: 'utf-8',
      cwd: rootDir,
    });
    expect(diff.trim()).toBe('');
  });

  it('3. s10_session_manifest.json must contain 40 preregistered sessions', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(manifest.protocolVersion).toBe('1.0.1');
    expect(manifest.preregisteredSessionCount).toBe(40);
    expect(manifest.manifestStatus).toBe('FROZEN_BEFORE_OUTCOME_INSPECTION');
    expect(manifest.prospectiveOutcomesInspected).toBe(false);

    const activeSessions = manifest.sessions.filter(
      (s: any) => s.status === 'PREREGISTERED_PENDING_ACQUISITION'
    );
    expect(activeSessions.length).toBe(40);
  });

  it('4. Preregistered session dates must be completely disjoint from excluded historical ranges', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    // Excluded ranges: S8-200 (May 2026), S8.8 (Dec 1, 2025), S9 (Dec 1-2, 2025)
    for (const session of manifest.sessions) {
      if (session.status !== 'PREREGISTERED_PENDING_ACQUISITION') continue;

      const sessionDate = session.dateLocal;
      expect(sessionDate >= '2026-10-12').toBe(true);
      expect(sessionDate.startsWith('2025-12')).toBe(false);
      expect(sessionDate.startsWith('2026-05')).toBe(false);
    }
  });

  it('5. Acquisition status and metrics summary must correctly reflect blocker status without fabrication', () => {
    expect(fs.existsSync(acquisitionStatusPath)).toBe(true);
    const status = JSON.parse(fs.readFileSync(acquisitionStatusPath, 'utf-8'));

    expect(status.cp63Status).toBe('PASS');
    expect(status.protocolHashVerified).toBe('VERIFIED');
    expect(status.sessionManifestFrozen).toBe('FROZEN');
    expect(status.preregisteredSessionCount).toBe(40);
    expect(status.rawDataAcquisitionStatus).toBe('BLOCKED_MISSING_DATABENTO_CREDENTIALS');
    expect(status.dataProvenanceVerified).toBe('NOT_AVAILABLE');
    expect(status.dataIntegrityStatus).toBe('PENDING_RAW_DATA_ACQUISITION');
    expect(status.prospectiveOutcomesInspected).toBe('NO');
    expect(status.coreIctDiffLines).toBe(0);
    expect(status.liveTradingAuthorized).toBe('NO');

    expect(fs.existsSync(metricsSummaryPath)).toBe(true);
    const metrics = JSON.parse(fs.readFileSync(metricsSummaryPath, 'utf-8'));
    expect(metrics.CP63_STATUS).toBe('PASS');
    expect(metrics.PREREGISTERED_SESSION_COUNT).toBe(40);
  });

  it('6. Hash manifest must verify all CP63 JSON artifact hashes', () => {
    expect(fs.existsSync(hashManifestPath)).toBe(true);
    const hashManifest = JSON.parse(fs.readFileSync(hashManifestPath, 'utf-8'));

    for (const [file, expectedHash] of Object.entries(hashManifest.files)) {
      const filePath = path.join(prospectiveDir, file);
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath);
      const actualHash = crypto.createHash('sha256').update(content).digest('hex');
      expect(actualHash).toBe(expectedHash);
    }
  });
});
