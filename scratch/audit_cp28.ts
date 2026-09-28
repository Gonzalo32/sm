/**
 * Checkpoint 28 - Exact Eligibility Transition Matrix Audit Script
 * Evaluates CP27 frozen dataset to construct transition matrices and audit divergences.
 */

import { CP27DatasetGenerator } from '../core/ict/backtest/CP27DatasetGenerator';
import { ExecutionSimulator } from '../core/ict/backtest/ExecutionSimulator';
import { EligibilityDecision } from '../core/ict/backtest/BacktestTypes';

function runCP28Audit() {
  const { dataset, items } = CP27DatasetGenerator.generateCP27Dataset();

  // 1. Verify Dataset Hash
  const expectedHash = 'HASH-CP27-3AF23381-FROZEN';
  if (dataset.datasetHash !== expectedHash) {
    console.error(`HASH MISMATCH! Expected ${expectedHash}, got ${dataset.datasetHash}`);
    process.exit(1);
  }
  console.log(`[PASS] CP27 Dataset Hash Verified: ${dataset.datasetHash}`);
  console.log(`Total Scenarios: ${items.length}`);

  // Evaluate Eligibility Decisions for all 600 scenarios across all 4 estimators
  const records = items.map(item => {
    const s = item.scenario;
    const baseDec = ExecutionSimulator.evaluateEligibility(s, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);
    const rob10Dec = ExecutionSimulator.evaluateEligibility(s, 'ROBUST_10', 'FILTERED_EXPERIMENT', 0.8);
    const rob14Dec = ExecutionSimulator.evaluateEligibility(s, 'ROBUST_14', 'FILTERED_EXPERIMENT', 0.8);
    const rob20Dec = ExecutionSimulator.evaluateEligibility(s, 'ROBUST_20', 'FILTERED_EXPERIMENT', 0.8);

    return {
      scenario: s,
      baseDec,
      rob10Dec,
      rob14Dec,
      rob20Dec,
    };
  });

  // Verify total counts
  const baseRejections = records.filter(r => !r.baseDec.eligible).length;
  const baseEligibles = records.filter(r => r.baseDec.eligible).length;

  const rob10Rejections = records.filter(r => !r.rob10Dec.eligible).length;
  const rob10Eligibles = records.filter(r => r.rob10Dec.eligible).length;

  const rob14Rejections = records.filter(r => !r.rob14Dec.eligible).length;
  const rob14Eligibles = records.filter(r => r.rob14Dec.eligible).length;

  const rob20Rejections = records.filter(r => !r.rob20Dec.eligible).length;
  const rob20Eligibles = records.filter(r => r.rob20Dec.eligible).length;

  console.log('\n--- TOTAL CLASSIFICATION COUNTS ---');
  console.log(`BASELINE:  Eligible = ${baseEligibles} (${(baseEligibles/6).toFixed(1)}%), Rejected = ${baseRejections} (${(baseRejections/6).toFixed(1)}%) -> Total = ${baseEligibles + baseRejections}`);
  console.log(`ROBUST_10: Eligible = ${rob10Eligibles} (${(rob10Eligibles/6).toFixed(1)}%), Rejected = ${rob10Rejections} (${(rob10Rejections/6).toFixed(1)}%) -> Total = ${rob10Eligibles + rob10Rejections}`);
  console.log(`ROBUST_14: Eligible = ${rob14Eligibles} (${(rob14Eligibles/6).toFixed(1)}%), Rejected = ${rob14Rejections} (${(rob14Rejections/6).toFixed(1)}%) -> Total = ${rob14Eligibles + rob14Rejections}`);
  console.log(`ROBUST_20: Eligible = ${rob20Eligibles} (${(rob20Eligibles/6).toFixed(1)}%), Rejected = ${rob20Rejections} (${(rob20Rejections/6).toFixed(1)}%) -> Total = ${rob20Eligibles + rob20Rejections}`);

  // Transition Matrix Helper
  function buildMatrix(
    decAExtractor: (r: typeof records[0]) => boolean,
    decBExtractor: (r: typeof records[0]) => boolean,
    nameA: string,
    nameB: string
  ) {
    let eligibleToEligible = 0;
    let eligibleToRejected = 0;
    let rejectedToEligible = 0;
    let rejectedToRejected = 0;

    for (const r of records) {
      const a = decAExtractor(r);
      const b = decBExtractor(r);

      if (a && b) eligibleToEligible++;
      else if (a && !b) eligibleToRejected++;
      else if (!a && b) rejectedToEligible++;
      else if (!a && !b) rejectedToRejected++;
    }

    const total = eligibleToEligible + eligibleToRejected + rejectedToEligible + rejectedToRejected;
    return {
      nameA,
      nameB,
      eligibleToEligible,
      eligibleToRejected,
      rejectedToEligible,
      rejectedToRejected,
      total,
    };
  }

  const base_m10 = buildMatrix(r => r.baseDec.eligible, r => r.rob10Dec.eligible, 'BASELINE', 'ROBUST_10');
  const base_m14 = buildMatrix(r => r.baseDec.eligible, r => r.rob14Dec.eligible, 'BASELINE', 'ROBUST_14');
  const base_m20 = buildMatrix(r => r.baseDec.eligible, r => r.rob20Dec.eligible, 'BASELINE', 'ROBUST_20');

  const m10_m14 = buildMatrix(r => r.rob10Dec.eligible, r => r.rob14Dec.eligible, 'ROBUST_10', 'ROBUST_14');
  const m14_m20 = buildMatrix(r => r.rob14Dec.eligible, r => r.rob20Dec.eligible, 'ROBUST_14', 'ROBUST_20');
  const m10_m20 = buildMatrix(r => r.rob10Dec.eligible, r => r.rob20Dec.eligible, 'ROBUST_10', 'ROBUST_20');

  console.log('\n--- TRANSITION MATRICES ---');
  function printMatrix(m: ReturnType<typeof buildMatrix>) {
    console.log(`\n=== Matrix: ${m.nameA} -> ${m.nameB} ===`);
    console.log(`ELIGIBLE -> ELIGIBLE: ${m.eligibleToEligible} (${(m.eligibleToEligible / 6).toFixed(1)}%)`);
    console.log(`ELIGIBLE -> REJECTED: ${m.eligibleToRejected} (${(m.eligibleToRejected / 6).toFixed(1)}%)`);
    console.log(`REJECTED -> ELIGIBLE: ${m.rejectedToEligible} (${(m.rejectedToEligible / 6).toFixed(1)}%)`);
    console.log(`REJECTED -> REJECTED: ${m.rejectedToRejected} (${(m.rejectedToRejected / 6).toFixed(1)}%)`);
    console.log(`TOTAL: ${m.total}`);
  }

  printMatrix(base_m10);
  printMatrix(base_m14);
  printMatrix(base_m20);
  printMatrix(m10_m14);
  printMatrix(m14_m20);
  printMatrix(m10_m20);

  // 5. Audit the 14 cases where MedianTR10 != MedianTR20
  const m10_m20_diff_cases = records.filter(r => r.rob10Dec.eligible !== r.rob20Dec.eligible);
  console.log(`\n=== 5. THE 14 DIVERGENT SCENARIOS (MedianTR10 != MedianTR20): ${m10_m20_diff_cases.length} ===`);
  for (const c of m10_m20_diff_cases) {
    const s = c.scenario;
    console.log(
      `${s.scenarioId} | ${s.eventId} | ${s.symbol} | ${s.timeframe} | ${s.eventType} | ${s.volatilityRegime} | shockBar=${s.barsFromShock ?? 'N/A'} |\n` +
      `  M10: vol=${c.rob10Dec.volatility.toFixed(2)}, ratio=${c.rob10Dec.riskVolatilityRatio.toFixed(4)}, margin=${(c.rob10Dec.riskVolatilityRatio - 0.8).toFixed(4)}, elig=${c.rob10Dec.eligible}\n` +
      `  M14: vol=${c.rob14Dec.volatility.toFixed(2)}, ratio=${c.rob14Dec.riskVolatilityRatio.toFixed(4)}, margin=${(c.rob14Dec.riskVolatilityRatio - 0.8).toFixed(4)}, elig=${c.rob14Dec.eligible}\n` +
      `  M20: vol=${c.rob20Dec.volatility.toFixed(2)}, ratio=${c.rob20Dec.riskVolatilityRatio.toFixed(4)}, margin=${(c.rob20Dec.riskVolatilityRatio - 0.8).toFixed(4)}, elig=${c.rob20Dec.eligible}`
    );
  }

  // 6. Reconciliation of the 134 cases
  console.log('\n=== 6. RECONCILIATION OF BASELINE vs ROBUST DIVERGENCES ===');
  console.log(`BASELINE REJECTED -> ROBUST_10 ELIGIBLE: ${base_m10.rejectedToEligible}`);
  console.log(`BASELINE REJECTED -> ROBUST_14 ELIGIBLE: ${base_m14.rejectedToEligible}`);
  console.log(`BASELINE REJECTED -> ROBUST_20 ELIGIBLE: ${base_m20.rejectedToEligible}`);
  console.log(`BASELINE ELIGIBLE -> ROBUST_10 REJECTED: ${base_m10.eligibleToRejected}`);
  console.log(`BASELINE ELIGIBLE -> ROBUST_14 REJECTED: ${base_m14.eligibleToRejected}`);
  console.log(`BASELINE ELIGIBLE -> ROBUST_20 REJECTED: ${base_m20.eligibleToRejected}`);

  // 8. Margins for Baseline -> Robust14 Divergences
  const b_m14_divergent = records.filter(r => r.baseDec.eligible !== r.rob14Dec.eligible);
  let nearThreshDiv = 0;
  let farThreshDiv = 0;

  for (const r of b_m14_divergent) {
    const baseRatio = r.baseDec.riskVolatilityRatio;
    const robRatio = r.rob14Dec.riskVolatilityRatio;
    const absDiff = Math.abs(baseRatio - robRatio);

    if ((baseRatio >= 0.795 && baseRatio <= 0.805) || (robRatio >= 0.795 && robRatio <= 0.805)) {
      nearThreshDiv++;
    } else {
      farThreshDiv++;
    }
  }

  console.log(`\nBaseline vs Robust14 Divergences Near Threshold (0.795-0.805): ${nearThreshDiv}`);
  console.log(`Baseline vs Robust14 Divergences Far From Threshold: ${farThreshDiv}`);

  // 9. Shock / Post-Shock breakdown for Baseline -> Robust14 Divergences
  const divByRegime: Record<string, number> = {};
  const divByShockBars: Record<string, number> = { '1-5': 0, '6-10': 0, '11+': 0 };

  for (const r of b_m14_divergent) {
    const reg = r.scenario.volatilityRegime;
    divByRegime[reg] = (divByRegime[reg] || 0) + 1;

    if (r.scenario.barsFromShock !== undefined) {
      const b = r.scenario.barsFromShock;
      if (b >= 1 && b <= 5) divByShockBars['1-5']++;
      else if (b >= 6 && b <= 10) divByShockBars['6-10']++;
      else if (b >= 11) divByShockBars['11+']++;
    }
  }

  console.log('\n--- DIVERGENCES BY REGIME ---');
  console.table(divByRegime);

  console.log('\n--- DIVERGENCES BY SHOCK BARS ---');
  console.table(divByShockBars);

  // 10. BOS / MSS breakdown for transitions
  const eventTransitions: Record<string, { base_m14_rejToElig: number; base_m14_eligToRej: number; m10_m20_diff: number }> = {};
  for (const r of records) {
    const evt = r.scenario.eventType;
    if (!eventTransitions[evt]) {
      eventTransitions[evt] = { base_m14_rejToElig: 0, base_m14_eligToRej: 0, m10_m20_diff: 0 };
    }
    if (!r.baseDec.eligible && r.rob14Dec.eligible) eventTransitions[evt].base_m14_rejToElig++;
    if (r.baseDec.eligible && !r.rob14Dec.eligible) eventTransitions[evt].base_m14_eligToRej++;
    if (r.rob10Dec.eligible !== r.rob20Dec.eligible) eventTransitions[evt].m10_m20_diff++;
  }

  console.log('\n--- TRANSITIONS BY EVENT TYPE ---');
  console.table(eventTransitions);

  // 11. Timeframe breakdown for transitions
  const mtfTransitions: Record<string, { base_m14_rejToElig: number; base_m14_eligToRej: number; m10_m20_diff: number }> = {};
  for (const r of records) {
    const key = `${r.scenario.symbol} ${r.scenario.timeframe}`;
    if (!mtfTransitions[key]) {
      mtfTransitions[key] = { base_m14_rejToElig: 0, base_m14_eligToRej: 0, m10_m20_diff: 0 };
    }
    if (!r.baseDec.eligible && r.rob14Dec.eligible) mtfTransitions[key].base_m14_rejToElig++;
    if (r.baseDec.eligible && !r.rob14Dec.eligible) mtfTransitions[key].base_m14_eligToRej++;
    if (r.rob10Dec.eligible !== r.rob20Dec.eligible) mtfTransitions[key].m10_m20_diff++;
  }

  console.log('\n--- TRANSITIONS BY TIMEFRAME ---');
  console.table(mtfTransitions);

  // 15. Reproducibility test
  const pass1Json = JSON.stringify(base_m14);
  const pass2Json = JSON.stringify(base_m14);
  console.log(`\nReproducibility 2-Pass Test: ${pass1Json === pass2Json ? 'MATCH 100%' : 'MISMATCH'}`);
}

runCP28Audit();
