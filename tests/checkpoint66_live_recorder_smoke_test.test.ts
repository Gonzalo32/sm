import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

describe('CP66 — Live TradeSea Recorder Smoke Test & Protocol Review', () => {
  const rootDir = process.cwd();
  const cp66Dir = path.join(rootDir, 'data_audit/phase_cp66');
  const summaryPath = path.join(cp66Dir, 'cp66_smoke_test_summary.json');
  const metricsPath = path.join(cp66Dir, 'cp66_metrics_summary.json');
  const hashManifestPath = path.join(cp66Dir, 'cp66_hash_manifest.json');
  const proposalDocPath = path.join(rootDir, 'S10_PROSPECTIVE_PROTOCOL_V1_1_0_PROPOSAL.md');

  it('1. core/ict/ must maintain 0 diff lines against baseline 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a', () => {
    const diff = execSync('git diff 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a -- core/ict/', {
      encoding: 'utf-8',
      cwd: rootDir,
    });
    expect(diff.trim()).toBe('');
  });

  it('2. Live TradeSea session observation and passive recorder status must be PASS_WITH_LIMITATIONS', () => {
    expect(fs.existsSync(summaryPath)).toBe(true);
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));

    expect(summary.cp66Status).toBe('PASS_WITH_LIMITATIONS');
    expect(summary.liveSessionVerified).toBe('YES');
    expect(summary.activeInstrument).toContain('MNQ');
    expect(summary.activeTimeframe).toBe('1m');
    expect(summary.officialCaptureAuthorized).toBe(false);
    expect(summary.liveTradingAuthorized).toBe('NO');
  });

  it('3. Protocol v1.1.0 proposal document must exist and specify invalidation & rollover rules', () => {
    expect(fs.existsSync(proposalDocPath)).toBe(true);
    const docText = fs.readFileSync(proposalDocPath, 'utf-8');

    expect(docText).toContain('S10 Protocol v1.1.0 Proposal');
    expect(docText).toContain('TradeSea_WSS_Realtime_Feed');
    expect(docText).toContain('IndexedDB');
    expect(docText).toContain('INVALID_INCOMPLETE');
    expect(docText).toContain('December 07, 2026');
    expect(docText).toContain('NQZ6');
  });

  it('4. Hash manifest must verify all CP66 JSON artifact hashes', () => {
    expect(fs.existsSync(hashManifestPath)).toBe(true);
    const hashManifest = JSON.parse(fs.readFileSync(hashManifestPath, 'utf-8'));

    for (const [file, expectedHash] of Object.entries(hashManifest.files)) {
      const filePath = path.join(cp66Dir, file);
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath);
      const actualHash = crypto.createHash('sha256').update(content).digest('hex');
      expect(actualHash).toBe(expectedHash);
    }
  });

  it('5. Metrics summary must reflect clear human operator approval gate requirement', () => {
    expect(fs.existsSync(metricsPath)).toBe(true);
    const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));

    expect(metrics.CP66_STATUS).toBe('PASS_WITH_LIMITATIONS');
    expect(metrics.OFFICIAL_40_SESSION_CAPTURE_STARTED).toBe('NO');
    expect(metrics.HUMAN_OPERATOR_APPROVAL_PENDING).toBe('YES');
    expect(metrics.LIVE_TRADING_AUTHORIZED).toBe('NO');
  });
});
