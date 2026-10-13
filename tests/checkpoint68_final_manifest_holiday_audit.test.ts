import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

describe('CP68 — Final Session Manifest & Holiday Calendar Audit', () => {
  const rootDir = process.cwd();
  const cp68Dir = path.join(rootDir, 'data_audit/phase_cp68');
  const manifestPath = path.join(rootDir, 'data_audit/phase_s10_prospective/s10_session_manifest.json');
  const auditPath = path.join(cp68Dir, 'cp68_manifest_audit.json');
  const metricsPath = path.join(cp68Dir, 'cp68_metrics_summary.json');
  const hashManifestPath = path.join(cp68Dir, 'cp68_hash_manifest.json');

  it('1. core/ict/ must maintain 0 diff lines against baseline 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a', () => {
    const diff = execSync('git diff 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a -- core/ict/', {
      encoding: 'utf-8',
      cwd: rootDir,
    });
    expect(diff.trim()).toBe('');
  });

  it('2. s10_session_manifest.json must contain exactly 40 preregistered active sessions and 1 skipped Thanksgiving holiday', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    const activeSessions = manifest.sessions.filter((s: any) => s.status === 'PREREGISTERED_PENDING_ACQUISITION');
    expect(activeSessions.length).toBe(40);

    const skippedSessions = manifest.sessions.filter((s: any) => s.status.startsWith('SKIPPED'));
    expect(skippedSessions.length).toBe(1);
    expect(skippedSessions[0].dateLocal).toBe('2026-11-26');
  });

  it('3. Thanksgiving 2026 audit: Nov 26 is skipped (CME closed), Nov 27 is early close with 12:55 local cutoff', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    const thanksgiving = manifest.sessions.find((s: any) => s.dateLocal === '2026-11-26');
    expect(thanksgiving).toBeDefined();
    expect(thanksgiving.status).toContain('THANKSGIVING_DAY');

    const blackFriday = manifest.sessions.find((s: any) => s.dateLocal === '2026-11-27');
    expect(blackFriday).toBeDefined();
    expect(blackFriday.isEarlyClose).toBe(true);
    expect(blackFriday.rthEndLocal).toBe('13:00:00');
    expect(blackFriday.signalCutoffLocal).toBe('12:55:00');
  });

  it('4. Timezone conversion rules must be consistent for Neuquén ART (UTC-3) across EDT and EST', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    // EDT session (Oct 12)
    const edtSession = manifest.sessions.find((s: any) => s.dateLocal === '2026-10-12');
    expect(edtSession.utcOffsetHours).toBe(-4);
    expect(edtSession.rthStartUtc).toBe('13:30:00Z'); // 09:30 EDT = 13:30 UTC = 10:30 ART

    // EST session (Nov 02)
    const estSession = manifest.sessions.find((s: any) => s.dateLocal === '2026-11-02');
    expect(estSession.utcOffsetHours).toBe(-5);
    expect(estSession.rthStartUtc).toBe('14:30:00Z'); // 09:30 EST = 14:30 UTC = 11:30 ART
  });

  it('5. CP68 audit & metrics summary must acknowledge CP67 single-candle smoke test limitation and state OFFICIAL_S10_CAPTURE_STARTED = NO', () => {
    expect(fs.existsSync(auditPath)).toBe(true);
    expect(fs.existsSync(metricsPath)).toBe(true);

    const audit = JSON.parse(fs.readFileSync(auditPath, 'utf-8'));
    expect(audit.cp64Status || audit.cp68Status).toBe('PASS_WITH_LIMITATIONS');
    expect(audit.cp67LimitationAcknowledgment).toContain('single closed candle');
    expect(audit.officialS10CaptureStarted).toBe('NO');
    expect(audit.liveTradingAuthorized).toBe('NO');

    const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));
    expect(metrics.CP68_STATUS).toBe('PASS_WITH_LIMITATIONS');
    expect(metrics.OFFICIAL_S10_CAPTURE_STARTED).toBe('NO');
    expect(metrics.LIVE_TRADING_AUTHORIZED).toBe('NO');
  });

  it('6. Hash manifest must verify all CP68 JSON artifact hashes', () => {
    expect(fs.existsSync(hashManifestPath)).toBe(true);
    const hashManifest = JSON.parse(fs.readFileSync(hashManifestPath, 'utf-8'));

    for (const [file, expectedHash] of Object.entries(hashManifest.files)) {
      const filePath = path.join(cp68Dir, file);
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath);
      const actualHash = crypto.createHash('sha256').update(content).digest('hex');
      expect(actualHash).toBe(expectedHash);
    }
  });
});
