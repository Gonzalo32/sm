import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

describe('CP67 — S10 v1.1.0 Final Governance Gate & Capture Readiness Audit', () => {
  const rootDir = process.cwd();
  const cp67Dir = path.join(rootDir, 'data_audit/phase_cp67');
  const summaryPath = path.join(cp67Dir, 'cp67_readiness_status.json');
  const metricsPath = path.join(cp67Dir, 'cp67_metrics_summary.json');
  const hashManifestPath = path.join(cp67Dir, 'cp67_hash_manifest.json');
  const finalProtocolPath = path.join(rootDir, 'data_audit/phase_s10_prospective/s10_prospective_protocol_spec_v1_1_0_final.json');
  const finalDocPath = path.join(rootDir, 'S10_PROSPECTIVE_PROTOCOL_V1_1_0_FINAL.md');

  it('1. core/ict/ must maintain 0 diff lines against baseline 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a', () => {
    const diff = execSync('git diff 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a -- core/ict/', {
      encoding: 'utf-8',
      cwd: rootDir,
    });
    expect(diff.trim()).toBe('');
  });

  it('2. CP67 status must be PASS_WITH_LIMITATIONS with OFFICIAL_S10_CAPTURE_STARTED = NO', () => {
    expect(fs.existsSync(summaryPath)).toBe(true);
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));

    expect(summary.cp67Status).toBe('PASS_WITH_LIMITATIONS');
    expect(summary.realPersistenceVerified).toContain('YES');
    expect(summary.officialS10CaptureStarted).toBe('NO');
    expect(summary.liveTradingAuthorized).toBe('NO');
    expect(summary.coreIctDiffLines).toBe(0);
  });

  it('3. Finalized Protocol v1.1.0 JSON spec and markdown document must contain Neuquén local schedule and invalidation rules', () => {
    expect(fs.existsSync(finalProtocolPath)).toBe(true);
    expect(fs.existsSync(finalDocPath)).toBe(true);

    const spec = JSON.parse(fs.readFileSync(finalProtocolPath, 'utf-8'));
    expect(spec.protocolVersion).toBe('1.1.0');
    expect(spec.neuquenLocalTimeSchedule.edtPeriod.rthNeuquenLocal).toBe('10:30 - 17:00 ART (UTC-3)');
    expect(spec.neuquenLocalTimeSchedule.estPeriod.rthNeuquenLocal).toBe('11:30 - 18:00 ART (UTC-3)');
    expect(spec.sessionIntegrityAndInvalidationRules.criticalGaps).toContain('15 minutes');

    const docText = fs.readFileSync(finalDocPath, 'utf-8');
    expect(docText).toContain('10:30 - 17:00 ART');
    expect(docText).toContain('11:30 - 18:00 ART');
    expect(docText).toContain('INVALID_INCOMPLETE');
  });

  it('4. Hash manifest must verify all CP67 JSON artifact hashes', () => {
    expect(fs.existsSync(hashManifestPath)).toBe(true);
    const hashManifest = JSON.parse(fs.readFileSync(hashManifestPath, 'utf-8'));

    for (const [file, expectedHash] of Object.entries(hashManifest.files)) {
      let filePath = path.join(cp67Dir, file);
      if (!fs.existsSync(filePath)) {
        filePath = path.join(rootDir, 'data_audit/phase_s10_prospective', file);
      }
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath);
      const actualHash = crypto.createHash('sha256').update(content).digest('hex');
      expect(actualHash).toBe(expectedHash);
    }
  });

  it('5. Metrics summary must state OFFICIAL_S10_CAPTURE_STARTED = NO', () => {
    expect(fs.existsSync(metricsPath)).toBe(true);
    const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));

    expect(metrics.CP67_STATUS).toBe('PASS_WITH_LIMITATIONS');
    expect(metrics.OFFICIAL_S10_CAPTURE_STARTED).toBe('NO');
    expect(metrics.HUMAN_OPERATOR_GATE_STATUS).toBe('AWAITING_SIGN_OFF');
    expect(metrics.LIVE_TRADING_AUTHORIZED).toBe('NO');
  });
});
