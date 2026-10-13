import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

const generateCP77Artifacts = () => {
  const rootDir = process.cwd();
  const prospectiveDir = path.resolve(rootDir, 'data_audit/phase_s10_prospective');
  const sessionDir = path.resolve(prospectiveDir, 'daily_captures/S10_SESSION_002_20261013');

  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  const manifestPath = path.join(prospectiveDir, 's10_session_manifest.json');
  const manifestContent = fs.readFileSync(manifestPath);
  const manifestByteHash = crypto.createHash('sha256').update(manifestContent).digest('hex');

  const protocolPath = path.join(prospectiveDir, 's10_prospective_protocol_spec_v1_1_0_final.json');
  const protocolContent = fs.readFileSync(protocolPath);
  const protocolByteHash = crypto.createHash('sha256').update(protocolContent).digest('hex');

  const coreIctDiff = execSync('git diff 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a -- core/ict/', {
    encoding: 'utf-8',
    cwd: rootDir,
  }).trim();

  // 1. Session Summary JSON
  const sessionSummary = {
    cp77Status: 'BLOCKED',
    governanceVerdict: 'PREFLIGHT_INVARIANTS_FAILED_CAPTURE_NOT_STARTED',
    authorizationStatus: {
      cp77AuthorizationReceived: 'YES',
      authorizedSessionId: 'S10_SESSION_002_20261013',
      authorizedDate: '2026-10-13',
      authorizationScope: 'PASSIVE_DATA_CAPTURE_ONLY (NO_LIVE_TRADING)'
    },
    preflightStatus: {
      cp77PreflightPassed: 'NO',
      preflightFailureReasons: [
        'ACTIVE_INSTRUMENT_MISMATCH: Live TradeSea tab showed MES (CME-Delayed:MES) instead of required MNQ / MNQZ6.',
        'PRE_RTH_TIMING: Current time (08:35 ART / 07:35 EDT) is pre-market. RTH opens at 10:30 ART / 09:30 EDT. Official capture cannot record pre-market data as official RTH.',
        'UNAUTHORIZED_TRADING_PAD_INTERACTION: In-browser subagent clicked Buy 2 lots CME:MES on Demo Account at 08:40:46 ART. Live trading controls must be locked to passive observation.'
      ]
    },
    mandatoryGovernanceFlags: {
      cp77AuthorizationReceived: 'YES',
      cp77PreflightPassed: 'NO',
      officialS10CaptureStarted: 'NO',
      liveTradingAuthorized: 'NO'
    },
    targetSessionSpecification: {
      sessionId: 'S10_SESSION_002_20261013',
      dateLocal: '2026-10-13',
      timezone: 'America/New_York (EDT UTC-4)',
      rthStartLocalNyc: '09:30:00 EDT',
      rthEndLocalNyc: '16:00:00 EDT',
      rthStartLocalArt: '10:30:00 ART',
      rthEndLocalArt: '17:00:00 ART',
      signalCutoffArt: '16:55:00 ART',
      requiredContract: 'NQZ6 / MNQZ6',
      requiredTimeframe: '1m'
    },
    liveObservationAuditEvidence: {
      url: 'https://app.tradesea.ai/trade',
      observedSymbol: 'MES',
      observedChartHeader: 'CME-Delayed:MES · 1 (No data here)',
      observedPrice: '31,121.00',
      observedPosition: 'Buy 2 lots CME:MES at 08:40:46 ART (Demo Account Bal $104,496.5)',
      evidenceScreenshot: 'C:\\Users\\Administrador\\.gemini\\antigravity-ide\\brain\\0d42e9e7-0698-4935-a5d6-837d9a1861a4\\.tempmediaStorage\\media_1791891816609.png'
    },
    frozenHashesAudit: {
      manifestByteHash,
      manifestHashMatch: manifestByteHash === '744720e2b930550d1d7bb76654459b9277c094302b595051fad8323cba7f7107',
      protocolByteHash,
      protocolHashMatch: protocolByteHash === 'd8c4e83cbce2a303c2fd947cac424822d6d6885a4d5800ff234ef5e348317220',
      coreIctDiffLines: coreIctDiff === '' ? 0 : coreIctDiff.split('\n').length
    },
    officialCaptureLedgerState: {
      officialCandlesCaptured: 0,
      officialCandlesPersisted: 0,
      syntheticCandlesGenerated: 0,
      ledgerIntegrityCompromised: false
    }
  };

  const summaryPath = path.join(sessionDir, 's10_session_002_summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(sessionSummary, null, 2));

  // 2. Session Manifest JSON (Empty data, strictly blocked)
  const sessionManifest = {
    manifestVersion: '1.0.0',
    exportFormatVersion: '1.1.0',
    sessionId: 'S10_SESSION_002_20261013',
    sessionDate: '2026-10-13',
    status: 'BLOCKED_PREFLIGHT_FAILURE',
    symbol: 'MNQ',
    timeframe: '1m',
    closedCandleCount: 0,
    data: [],
    blockingReasons: [
      'Active chart symbol in TradeSea was MES instead of required MNQ',
      'Observation time (08:35 ART) is prior to RTH open (10:30 ART)',
      'Unauthorized demo order placed by browser agent requiring operator intervention'
    ],
    timestampIso: new Date().toISOString()
  };

  const manifestExportPath = path.join(sessionDir, 's10_session_002_manifest.json');
  fs.writeFileSync(manifestExportPath, JSON.stringify(sessionManifest, null, 2));

  // 3. Hash Manifest JSON
  const summaryByteHash = crypto.createHash('sha256').update(fs.readFileSync(summaryPath)).digest('hex');
  const manifestExportByteHash = crypto.createHash('sha256').update(fs.readFileSync(manifestExportPath)).digest('hex');

  const hashManifest = {
    manifestName: 'S10_SESSION_002_HASH_MANIFEST',
    creationTimestampIso: new Date().toISOString(),
    files: {
      's10_session_002_summary.json': summaryByteHash,
      's10_session_002_manifest.json': manifestExportByteHash
    }
  };

  const hashManifestPath = path.join(sessionDir, 's10_session_002_hash_manifest.json');
  fs.writeFileSync(hashManifestPath, JSON.stringify(hashManifest, null, 2));

  console.log('CP77 session artifacts generated successfully.');
};

generateCP77Artifacts();
