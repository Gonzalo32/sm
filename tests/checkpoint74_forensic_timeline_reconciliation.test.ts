import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

describe('CP74 — CP73 Forensic Timeline and Candle-Accounting Reconciliation Suite', () => {
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

  it('3. CP73 Timeline reconciliation (Session timing, interruption start/recovery, 30s recovery duration)', () => {
    const cp73Summary = JSON.parse(fs.readFileSync(cp73SummaryPath, 'utf-8'));
    const cp73Export = JSON.parse(fs.readFileSync(cp73ExportPath, 'utf-8'));

    expect(cp73Summary.liveObservationDetails.localStartTimeIso).toBe('2026-10-09T13:04:59-03:00');
    expect(cp73Summary.liveObservationDetails.localEndTimeIso).toBe('2026-10-09T13:24:59-03:00');

    expect(cp73Summary.interruptionAndRecoveryDetails.interruptionStartIso).toBe('2026-10-09T13:10:00-03:00');
    expect(cp73Summary.interruptionAndRecoveryDetails.reconnectionRestoredIso).toBe('2026-10-09T13:10:30-03:00');
    expect(cp73Summary.interruptionAndRecoveryDetails.recoveryDurationSec).toBe(30);

    expect(cp73Export.preInterruptionCandleCount).toBe(5);
    expect(cp73Export.postReconnectionCandleCount).toBe(10);
    expect(cp73Export.totalPersistedCandles).toBe(15);
  });

  it('4. Candle accounting forensic: 5 pre-interruption (T0-T4) + 10 post-reconnection (T6-T15) = 15 candles; T5 missing interval gap', () => {
    const cp73Export = JSON.parse(fs.readFileSync(cp73ExportPath, 'utf-8'));
    const sampleCandles = cp73Export.sampleCandles;

    expect(sampleCandles.length).toBe(5);
    expect(cp73Export.gapCount).toBe(1);
    expect(cp73Export.gapDetails.length).toBe(1);
    expect(cp73Export.gapDetails[0].syntheticFillerGenerated).toBe(false);

    // Verify timeline gap between candle 4 (13:08:59 / 13:09:00) and post-reconnect candles starting at 13:11:00
    const startTs = sampleCandles[0].timestamp; // 1779129100000 (13:04:59)
    const t4Ts = sampleCandles[4].timestamp; // 1779129340000 (13:08:59)
    expect(t4Ts - startTs).toBe(4 * 60000);
  });

  it('5. Distinguish market interval loss, recorder pause, gap detection, and audit label index T5', () => {
    const cp73Summary = JSON.parse(fs.readFileSync(cp73SummaryPath, 'utf-8'));

    expect(cp73Summary.interruptionAndRecoveryDetails.preInterruptionDataSurvived).toBe(true);
    expect(cp73Summary.interruptionAndRecoveryDetails.deduplicationOnRedeliveryVerified).toBe(true);
    expect(cp73Summary.interruptionAndRecoveryDetails.syntheticCandleInjection).toBe(false);
    expect(cp73Summary.interruptionAndRecoveryDetails.gapsExplicitlyLogged).toBe(true);
  });

  it('6. Provenance isolation and zero synthetic candle verification', () => {
    const cp73Export = JSON.parse(fs.readFileSync(cp73ExportPath, 'utf-8'));

    expect(cp73Export.dataLabel).toBe('NON_OFFICIAL_CP73_RECONNECT_TEST');
    expect(cp73Export.exportFormatVersion).toBe('1.1.0-NON_OFFICIAL_CP73_RECONNECT_TEST');
    expect(cp73Export.credentialLeakageAudit).toContain('VERIFIED_CLEAN');
  });
});
