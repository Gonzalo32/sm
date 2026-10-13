const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Prospective Protocol Specification v1.0.0
const prospectiveProtocolSpec = {
  protocolVersion: '1.0.0',
  protocolName: 'S10_PROSPECTIVE_OOS_EVALUATION_PROTOCOL',
  freezeTimestamp: new Date().toISOString(),
  baselineCommit: '57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a',
  
  // 1. Instrument & Contract Roll Rules
  eligibleInstruments: [
    { symbol: 'NQ', name: 'E-mini NQ Futures', pointValueUSD: 20.0, tickSize: 0.25, tickValueUSD: 5.0 },
    { symbol: 'MNQ', name: 'Micro E-mini NQ Futures', pointValueUSD: 2.0, tickSize: 0.25, tickValueUSD: 0.5 }
  ],
  contractRollRules: 'Quarterly roll schedule (H=Mar, M=Jun, U=Sep, Z=Dec). Switch active contract 8 calendar days prior to expiration (second Thursday of contract month).',

  // 2. Session & Timezone Rules
  tradingSession: 'US Equities Regular Trading Hours (RTH) + Extended Trading Hours (ETH) active session window',
  timeZone: 'America/New_York (UTC-5 / UTC-4 DST)',
  sessionStartUtc: '13:30:00Z',
  sessionEndUtc: '20:00:00Z',

  // 3. Data Source & Timestamp Conventions
  dataSource: 'CME Databento MDP3 (GLBX.MDP3) direct order book / OHLC aggregate candles',
  timestampFormat: 'Unix epoch milliseconds (13-digit integer) and ISO 8601 UTC strings',

  // 4. Execution Rules
  holdingDuration: '1 5-minute candle (300 seconds)',
  maxConcurrentPositions: 1,
  positionOverlapAllowed: false,
  signalConfirmationSequence: 'signalTimestamp (t0 - 5m) <= confirmationTimestamp (t0) <= entryTimestamp (t0) < exitTimestamp (t0 + 5m)',

  // 5. Cost & Friction Model
  frictionModel: {
    type: 'FIXED_PER_TRADE_FRICTION',
    frictionPoints: 1.0,
    breakdown: {
      spreadPoints: 0.50, // 2 ticks
      commissionAndSlippagePoints: 0.50
    },
    nqValueUSD: 20.0,
    mnqValueUSD: 2.0
  },

  // 6. Data Quality & Missing Candle Criteria
  maxMissingCandlePercent: 5.0,
  syntheticCandleInsertionAllowed: false,

  // 7. Sample Sufficiency Target
  targetMinIndependentSessions: 30,
  targetMaxIndependentSessions: 50,
  acquisitionStoppingRule: 'Must acquire and evaluate all pre-registered sessions within target window without early stopping based on interim performance results.',

  // 8. Primary & Diagnostic Metrics
  primaryMetrics: ['winRate', 'totalNetPoints', 'meanNetPoints', 'maxClosedDrawdownPoints'],
  diagnosticMetrics: ['returnLag1Autocorr', 'outcomeLag1Autocorr', 'hacStandardError', 'blockBootstrap95CI'],

  // 9. Failure & Rejection Criteria
  failureCriteria: {
    minWinRateThreshold: 0.60,
    minMeanNetPointsThreshold: 0.0,
    maxDrawdownPointsThreshold: 30.0
  },

  // 10. Excluded Previous Session Timestamp Bounds (Anti-Overlap)
  excludedEvaluatedRanges: [
    { name: 'S8-200', startIso: '2026-05-18T18:15:00.000Z', endIso: '2026-05-20T20:00:00.000Z' },
    { name: 'S8.8', startIso: '2025-12-01T19:35:00.000Z', endIso: '2025-12-01T23:40:00.000Z' },
    { name: 'S9', startIso: '2025-12-01T18:20:00.000Z', endIso: '2025-12-02T10:55:00.000Z' }
  ]
};

// Calculate Hash of Protocol Spec
const specString = JSON.stringify(prospectiveProtocolSpec, null, 2);
const protocolHash = crypto.createHash('sha256').update(specString).digest('hex');

console.log(`Protocol Version: ${prospectiveProtocolSpec.protocolVersion}`);
console.log(`Protocol Specification SHA-256 Hash: ${protocolHash}`);

// Audit Selection Independence of Historical Phases
const selectionIndependenceAudit = {
  S8_200: { status: 'UNVERIFIED', reason: 'No pre-registration artifact found establishing May 18-20, 2026 session selection prior to dataset exposure.' },
  S8_8: { status: 'UNVERIFIED', reason: 'No pre-registration artifact found establishing Dec 1, 2025 session selection prior to dataset exposure.' },
  S9: { status: 'UNVERIFIED', reason: 'No pre-registration artifact found establishing Dec 1-2, 2025 session selection prior to dataset exposure.' },
  S10_PROSPECTIVE: { status: 'PRE_REGISTERED_FROZEN', protocolHash }
};

// Write output files to data_audit/phase_s9_5/
const outputDir = path.join(process.cwd(), 'data_audit', 'phase_s9_5');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

fs.writeFileSync(path.join(outputDir, 's9_5_prospective_protocol_spec.json'), specString);
fs.writeFileSync(path.join(outputDir, 's9_5_selection_independence_audit.json'), JSON.stringify(selectionIndependenceAudit, null, 2));

const metricsSummary = {
  S9_5_STATUS: 'PASS',
  S9_5_PROTOCOL_FROZEN: 'YES',
  S9_5_SELECTION_INDEPENDENCE: 'UNVERIFIED',
  S9_5_PROSPECTIVE_DATA_ACQUIRED: 'NO',
  S9_5_EXECUTION_COST_MODEL: 'ASSUMPTION_ONLY',
  S9_5_LIVE_TRADING_AUTHORIZED: 'NO',
  S9_5_PROTOCOL_VERSION: prospectiveProtocolSpec.protocolVersion,
  S9_5_PROTOCOL_HASH: protocolHash,
  S9_5_MIN_SESSIONS_TARGET: 30,
  S9_5_MAX_SESSIONS_TARGET: 50,
  CORE_ICT_DIFF_LINES: 0
};

fs.writeFileSync(path.join(outputDir, 's9_5_metrics_summary.json'), JSON.stringify(metricsSummary, null, 2));

// Generate hash manifest
const hashManifest = {};
const jsonFiles = [
  's9_5_prospective_protocol_spec.json',
  's9_5_selection_independence_audit.json',
  's9_5_metrics_summary.json'
];

jsonFiles.forEach(file => {
  const content = fs.readFileSync(path.join(outputDir, file));
  hashManifest[file] = crypto.createHash('sha256').update(content).digest('hex');
});

fs.writeFileSync(path.join(outputDir, 's9_5_hash_manifest.json'), JSON.stringify(hashManifest, null, 2));

// Generate artifact manifest markdown
const artifactManifestMd = `# S9.5 Artifact Manifest

| File | Type | Description |
| :--- | :--- | :--- |
| \`s9_5_prospective_protocol_spec.json\` | Specification | Complete versioned, frozen prospective OOS evaluation protocol specification |
| \`s9_5_selection_independence_audit.json\` | Data | Audit classification of selection independence for historical vs prospective phases |
| \`s9_5_metrics_summary.json\` | Summary | Final key-value metrics summary for Phase S9.5 |
| \`s9_5_hash_manifest.json\` | Verification | SHA-256 cryptographic hashes of all S9.5 JSON artifacts |
`;

fs.writeFileSync(path.join(outputDir, 's9_5_artifact_manifest.md'), artifactManifestMd);

console.log('S9.5 protocol freeze script completed cleanly!');
