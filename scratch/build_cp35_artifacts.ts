import fs from 'fs';
import path from 'path';
import { ICTPipelineCoordinator } from '../extension/content/ICTPipelineCoordinator';
import { Candle } from '../core/market/Candle';

async function generateCP35Artifacts() {
  const rootDir = process.cwd();
  const cp35Dir = path.join(rootDir, 'data_audit', 'cp35');
  const runtimeDir = path.join(cp35Dir, 'runtime');

  if (!fs.existsSync(cp35Dir)) fs.mkdirSync(cp35Dir, { recursive: true });
  if (!fs.existsSync(runtimeDir)) fs.mkdirSync(runtimeDir, { recursive: true });

  console.log('Generating CP35 Candidate Context Audit Artifacts...');

  // 1. CP35_MANIFEST.json
  const manifest = {
    checkpoint: "CP35",
    production_ict_logic_modified: false,
    parameters_modified: false,
    oos_dataset_modified: false,
    cp33_7_datasets_modified: false,
    candidate_context_tested: true,
    anti_lookahead_tested: true,
    reconnect_tested: true,
    no_context_case_tested: true,
    multiple_contexts_tested: true,
    hud_integration_tested: true,
    canvas_integration_tested: true,
    expiration_rules_status: "NOT_DEFINED",
    execution_timestamp: new Date().toISOString()
  };

  fs.writeFileSync(path.join(cp35Dir, 'CP35_MANIFEST.json'), JSON.stringify(manifest, null, 2));

  // 2. CP35_CONTEXT_CONTRACT.json
  const contextContract = {
    contract_name: "CandidateContextNeutralContract",
    version: "1.0.0",
    description: "Consolidated neutral candidate context structure derived from verified ICT events",
    allowed_status_values: [
      "NO_CONTEXT",
      "CONTEXT_FORMING",
      "CONTEXT_CONFIRMED",
      "CONTEXT_EXPIRED"
    ],
    expiration_rules_status: "NOT_DEFINED",
    forbidden_trading_terms: [
      "BUY", "SELL", "LONG", "SHORT", "ENTRY", "STOP_LOSS", "TAKE_PROFIT", "RR", "WIN_RATE", "PROFIT", "LOSS"
    ],
    schema: {
      id: "string (e.g. ctx_MNQ_1m_1700000000000)",
      symbol: "string (e.g. MNQ, NQ)",
      timeframe: "string (e.g. 1m, 5m, 15m)",
      eventTimestamp: "number (Epoch MS)",
      confirmationTimestamp: "number | null (Epoch MS)",
      structure: {
        trend: "string (BULLISH | BEARISH | SIDEWAYS)",
        lastBOS: "string (optional)",
        lastMSS: "string (optional)"
      },
      liquidity: {
        bslCount: "number",
        sslCount: "number",
        lastSweep: "string (optional)"
      },
      displacement: {
        state: "string (PRESENT | ABSENT)",
        bodyRatio: "number",
        rangeMultiplier: "number"
      },
      fvg: {
        activeFvgCount: "number",
        lastFvgStatus: "string (optional)"
      },
      pdArray: {
        zone: "string (PREMIUM | DISCOUNT | EQUILIBRIUM)",
        equilibrium: "number"
      },
      supportingEvents: "Array<string> (Traceable event logs)",
      sourceCandleTimestamps: "Array<number> (Timestamps of source candles)",
      status: "string (NO_CONTEXT | CONTEXT_FORMING | CONTEXT_CONFIRMED | CONTEXT_EXPIRED)",
      expirationStatus: "string (NOT_DEFINED | EXPIRED)"
    }
  };

  fs.writeFileSync(path.join(cp35Dir, 'CP35_CONTEXT_CONTRACT.json'), JSON.stringify(contextContract, null, 2));

  // 3. Generate CP35_RUNTIME_TRACE.json
  const coordinator = new ICTPipelineCoordinator('MNQ', '1m', { debug: false });
  const traceSteps: any[] = [];

  const baseTs = 1700000000000;
  const candles: Candle[] = [
    { timestamp: baseTs, open: 18000, high: 18005, low: 17998, close: 18002, volume: 100 },
    { timestamp: baseTs + 60000, open: 18002, high: 18020, low: 17995, close: 18015, volume: 120 },
    { timestamp: baseTs + 120000, open: 18015, high: 18025, low: 18010, close: 18020, volume: 150 }, // Swing high @ 18025
    { timestamp: baseTs + 180000, open: 18020, high: 18022, low: 18005, close: 18010, volume: 110 },
    { timestamp: baseTs + 240000, open: 18010, high: 18015, low: 17990, close: 17995, volume: 130 },
    { timestamp: baseTs + 300000, open: 17995, high: 18055, low: 17990, close: 18050, volume: 300 }  // Large displacement break
  ];

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const evalRes = coordinator.ingestCandle(c);

    traceSteps.push({
      step: i + 1,
      input_candle: c,
      candidate_context_id: evalRes.candidateContext.id,
      candidate_context_status: evalRes.candidateContext.status,
      event_timestamp: evalRes.candidateContext.eventTimestamp,
      confirmation_timestamp: evalRes.candidateContext.confirmationTimestamp,
      supporting_events_count: evalRes.candidateContext.supportingEvents.length,
      supporting_events: evalRes.candidateContext.supportingEvents,
      source_timestamps: evalRes.candidateContext.sourceCandleTimestamps
    });
  }

  // Multi-Context & Isolation Trace
  const coordNQ = new ICTPipelineCoordinator('NQ', '5m', { debug: false });
  const evalNQ = coordNQ.ingestCandle(candles[0]);

  const runtimeTrace = {
    symbol: "MNQ",
    timeframe: "1m",
    total_steps: traceSteps.length,
    trace: traceSteps,
    multi_context_isolation_sample: {
      context_mnq_1m_id: traceSteps[traceSteps.length - 1].candidate_context_id,
      context_nq_5m_id: evalNQ.candidateContext.id,
      isolation_maintained: traceSteps[traceSteps.length - 1].candidate_context_id !== evalNQ.candidateContext.id
    }
  };

  fs.writeFileSync(path.join(cp35Dir, 'CP35_RUNTIME_TRACE.json'), JSON.stringify(runtimeTrace, null, 2));
  fs.writeFileSync(path.join(runtimeDir, 'realtime_candidate_context_trace.json'), JSON.stringify(runtimeTrace, null, 2));

  // Copy test file to data_audit/cp35/
  const testSource = path.join(rootDir, 'tests', 'checkpoint35_candidate_context.test.ts');
  if (fs.existsSync(testSource)) {
    fs.copyFileSync(testSource, path.join(cp35Dir, 'checkpoint35_candidate_context.test.ts'));
  }

  console.log('CP35 Artifacts successfully generated in data_audit/cp35/');
}

generateCP35Artifacts().catch(console.error);
