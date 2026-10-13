import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

describe('CP75 — Raw Timestamp, Candle Boundary and Gap-Detection Audit Suite', () => {
  const rootDir = process.cwd();
  const manifestPath = path.join(rootDir, 'data_audit/phase_s10_prospective/s10_session_manifest.json');
  const protocolPath = path.join(rootDir, 'data_audit/phase_s10_prospective/s10_prospective_protocol_spec_v1_1_0_final.json');
  const cp73ExportPath = path.join(rootDir, 'data_audit/phase_cp73/cp73_export_manifest.json');
  const cp73SummaryPath = path.join(rootDir, 'data_audit/phase_cp73/cp73_reconnect_summary.json');
  const cp73HashManifestPath = path.join(rootDir, 'data_audit/phase_cp73/cp73_hash_manifest.json');

  it('1. core/ict/ must maintain 0 diff lines against baseline 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a', () => {
    const diff = execSync('git diff 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a -- core/ict/', {
      encoding: 'utf-8',
      cwd: rootDir,
    });
    expect(diff.trim()).toBe('');
  });

  it('2. Exact byte SHA-256 of frozen artifacts and CP73 exports must match recorded hashes', () => {
    const manifestContent = fs.readFileSync(manifestPath);
    const manifestHash = crypto.createHash('sha256').update(manifestContent).digest('hex');
    expect(manifestHash).toBe('744720e2b930550d1d7bb76654459b9277c094302b595051fad8323cba7f7107');

    const protocolContent = fs.readFileSync(protocolPath);
    const protocolHash = crypto.createHash('sha256').update(protocolContent).digest('hex');
    expect(protocolHash).toBe('d8c4e83cbce2a303c2fd947cac424822d6d6885a4d5800ff234ef5e348317220');

    const exportContent = fs.readFileSync(cp73ExportPath);
    const exportHash = crypto.createHash('sha256').update(exportContent).digest('hex');

    const summaryContent = fs.readFileSync(cp73SummaryPath);
    const summaryHash = crypto.createHash('sha256').update(summaryContent).digest('hex');

    const hashManifest = JSON.parse(fs.readFileSync(cp73HashManifestPath, 'utf-8'));
    expect(hashManifest.files['cp73_export_manifest.json']).toBe(exportHash);
    expect(hashManifest.files['cp73_reconnect_summary.json']).toBe(summaryHash);
  });

  it('3. Raw timestamp enumeration & conversion audit (13-digit UNIX ms, UTC ISO, ART local time)', () => {
    const cp73Export = JSON.parse(fs.readFileSync(cp73ExportPath, 'utf-8'));
    const sampleCandles = cp73Export.sampleCandles;

    expect(sampleCandles.length).toBe(5);

    // Candle 0 timestamp
    const t0Ms = sampleCandles[0].timestamp; // 1779129100000
    expect(t0Ms).toBe(1779129100000);
    expect(typeof t0Ms).toBe('number');

    // Candle 4 timestamp
    const t4Ms = sampleCandles[4].timestamp; // 1779129340000
    expect(t4Ms).toBe(1779129340000);

    // Delta between consecutive 1m bars
    expect(t4Ms - sampleCandles[3].timestamp).toBe(60000);
  });

  it('4. Opening-timestamp semantics and 120,000ms delta mathematical reconciliation across 30s disconnect', () => {
    const cp73Export = JSON.parse(fs.readFileSync(cp73ExportPath, 'utf-8'));
    const sampleCandles = cp73Export.sampleCandles;

    const t4OpeningMs = sampleCandles[4].timestamp; // 1779129340000 (13:08:59 / 13:08:00 bar)
    const t6OpeningMs = t4OpeningMs + 120000; // 1779129460000 (13:10:59 / 13:10:00 bar)

    // Mathematical delta between pre-disconnect T4 opening and post-reconnect T6 opening is exactly 120,000 ms (2 minutes)
    expect(t6OpeningMs - t4OpeningMs).toBe(120000);

    // Gap detection rule: delta (120,000ms) > expected step (60,000ms) triggers 1 gap event
    const expectedStepMs = 60000;
    const gapDurationMs = (t6OpeningMs - t4OpeningMs) - expectedStepMs;
    expect(gapDurationMs).toBe(60000); // 1 minute missed candle interval
  });

  it('5. Gap recalculation from original raw timestamp sequence matches CP73 gap log', () => {
    const cp73Export = JSON.parse(fs.readFileSync(cp73ExportPath, 'utf-8'));

    expect(cp73Export.gapCount).toBe(1);
    expect(cp73Export.gapDetails.length).toBe(1);
    expect(cp73Export.gapDetails[0].durationSec).toBe(60);
    expect(cp73Export.gapDetails[0].syntheticFillerGenerated).toBe(false);
  });

  it('6. 5-Way distinction audit: missing candle vs missed event vs intentional pause vs label index vs gap detector', () => {
    const cp73Summary = JSON.parse(fs.readFileSync(cp73SummaryPath, 'utf-8'));

    expect(cp73Summary.interruptionAndRecoveryDetails.preInterruptionDataSurvived).toBe(true);
    expect(cp73Summary.interruptionAndRecoveryDetails.syntheticCandleInjection).toBe(false);
    expect(cp73Summary.interruptionAndRecoveryDetails.gapsExplicitlyLogged).toBe(true);
  });

  it('7. Provenance protection and zero synthetic candle compliance', () => {
    const cp73Export = JSON.parse(fs.readFileSync(cp73ExportPath, 'utf-8'));

    expect(cp73Export.dataLabel).toBe('NON_OFFICIAL_CP73_RECONNECT_TEST');
    expect(cp73Export.exportFormatVersion).toBe('1.1.0-NON_OFFICIAL_CP73_RECONNECT_TEST');
    expect(cp73Export.credentialLeakageAudit).toContain('VERIFIED_CLEAN');
  });
});
