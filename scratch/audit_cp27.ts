/**
 * Checkpoint 27 - Near-Threshold Eligibility Audit Script
 * Executes full analysis on CP27 dataset to inspect boundary behavior around ratio = 0.8.
 */

import { CP27DatasetGenerator } from '../core/ict/backtest/CP27DatasetGenerator';
import { ExecutionSimulator } from '../core/ict/backtest/ExecutionSimulator';
import { CP21Runner } from '../core/ict/backtest/CP21Runner';
import { EligibilityDecision, VolatilityVariant } from '../core/ict/backtest/BacktestTypes';

function runCP27Audit() {
  const { dataset, items } = CP27DatasetGenerator.generateCP27Dataset();
  console.log(`Dataset ID: ${dataset.datasetId}`);
  console.log(`Dataset Hash: ${dataset.datasetHash}`);
  console.log(`Total Scenarios: ${items.length}`);

  const simulator = new ExecutionSimulator();

  // Store eligibility decisions
  const records: Array<{
    scenarioId: string;
    symbol: string;
    timeframe: string;
    eventType: string;
    regime: string;
    barsFromShock?: number;
    risk: number;
    baseDec: EligibilityDecision;
    rob10Dec: EligibilityDecision;
    rob14Dec: EligibilityDecision;
    rob20Dec: EligibilityDecision;
  }> = [];

  for (const item of items) {
    const s = item.scenario;
    const baseDec = ExecutionSimulator.evaluateEligibility(s, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);
    const rob10Dec = ExecutionSimulator.evaluateEligibility(s, 'ROBUST_10', 'FILTERED_EXPERIMENT', 0.8);
    const rob14Dec = ExecutionSimulator.evaluateEligibility(s, 'ROBUST_14', 'FILTERED_EXPERIMENT', 0.8);
    const rob20Dec = ExecutionSimulator.evaluateEligibility(s, 'ROBUST_20', 'FILTERED_EXPERIMENT', 0.8);

    records.push({
      scenarioId: s.scenarioId,
      symbol: s.symbol,
      timeframe: s.timeframe,
      eventType: s.eventType,
      regime: s.volatilityRegime,
      barsFromShock: s.barsFromShock,
      risk: s.risk,
      baseDec,
      rob10Dec,
      rob14Dec,
      rob20Dec,
    });
  }

  // 1. Proximity Bands Analysis
  const bands = ['< 0.75', '0.75-0.77', '0.77-0.79', '0.79-0.80', '0.80-0.81', '0.81-0.83', '0.83-0.85', '> 0.85'];
  const bandCounts: Record<string, { baseline: number; rob10: number; rob14: number; rob20: number }> = {};
  for (const b of bands) {
    bandCounts[b] = { baseline: 0, rob10: 0, rob14: 0, rob20: 0 };
  }

  function getBand(ratio: number): string {
    if (ratio < 0.75) return '< 0.75';
    if (ratio < 0.77) return '0.75-0.77';
    if (ratio < 0.79) return '0.77-0.79';
    if (ratio < 0.80) return '0.79-0.80';
    if (ratio < 0.81) return '0.80-0.81';
    if (ratio < 0.83) return '0.81-0.83';
    if (ratio < 0.85) return '0.83-0.85';
    return '> 0.85';
  }

  for (const r of records) {
    bandCounts[getBand(r.baseDec.riskVolatilityRatio)].baseline++;
    bandCounts[getBand(r.rob10Dec.riskVolatilityRatio)].rob10++;
    bandCounts[getBand(r.rob14Dec.riskVolatilityRatio)].rob14++;
    bandCounts[getBand(r.rob20Dec.riskVolatilityRatio)].rob20++;
  }

  console.log('\n--- PROXIMITY BANDS ---');
  console.table(bandCounts);

  // 2. Near Boundary Cases (0.795 <= ratio <= 0.805)
  const nearCases = records.filter(
    r =>
      (r.baseDec.riskVolatilityRatio >= 0.795 && r.baseDec.riskVolatilityRatio <= 0.805) ||
      (r.rob10Dec.riskVolatilityRatio >= 0.795 && r.rob10Dec.riskVolatilityRatio <= 0.805) ||
      (r.rob14Dec.riskVolatilityRatio >= 0.795 && r.rob14Dec.riskVolatilityRatio <= 0.805) ||
      (r.rob20Dec.riskVolatilityRatio >= 0.795 && r.rob20Dec.riskVolatilityRatio <= 0.805)
  );

  console.log(`\n--- NEAR BOUNDARY CASOS (0.795 <= ratio <= 0.805): ${nearCases.length} ---`);

  // 3. Exact 0.8 Cases
  const exactCases = records.filter(
    r =>
      r.baseDec.riskVolatilityRatio === 0.8 ||
      r.rob10Dec.riskVolatilityRatio === 0.8 ||
      r.rob14Dec.riskVolatilityRatio === 0.8 ||
      r.rob20Dec.riskVolatilityRatio === 0.8
  );
  console.log(`\n--- EXACT 0.8 CASOS: ${exactCases.length} ---`);
  for (const c of exactCases) {
    console.log(`Exact case: ${c.scenarioId}, base ratio=${c.baseDec.riskVolatilityRatio}, base eligible=${c.baseDec.eligible}`);
  }

  // 4. Divergences
  let baseReject_robEligible = 0;
  let baseEligible_robReject = 0;
  let m10_m14_diff = 0;
  let m14_m20_diff = 0;
  let m10_m20_diff = 0;

  for (const r of records) {
    const baseE = r.baseDec.eligible;
    const rob14E = r.rob14Dec.eligible;
    if (!baseE && rob14E) baseReject_robEligible++;
    if (baseE && !rob14E) baseEligible_robReject++;

    if (r.rob10Dec.eligible !== r.rob14Dec.eligible) m10_m14_diff++;
    if (r.rob14Dec.eligible !== r.rob20Dec.eligible) m14_m20_diff++;
    if (r.rob10Dec.eligible !== r.rob20Dec.eligible) m10_m20_diff++;
  }

  console.log('\n--- DIVERGENCES ---');
  console.log(`BASELINE = REJECTED, ROBUST14 = ELIGIBLE: ${baseReject_robEligible}`);
  console.log(`BASELINE = ELIGIBLE, ROBUST14 = REJECTED: ${baseEligible_robReject}`);
  console.log(`MedianTR10 != MedianTR14 eligibility: ${m10_m14_diff}`);
  console.log(`MedianTR14 != MedianTR20 eligibility: ${m14_m20_diff}`);
  console.log(`MedianTR10 != MedianTR20 eligibility: ${m10_m20_diff}`);

  // 5. Rejection Counts per Estimator
  let baseRejections = 0;
  let rob10Rejections = 0;
  let rob14Rejections = 0;
  let rob20Rejections = 0;

  for (const r of records) {
    if (!r.baseDec.eligible) baseRejections++;
    if (!r.rob10Dec.eligible) rob10Rejections++;
    if (!r.rob14Dec.eligible) rob14Rejections++;
    if (!r.rob20Dec.eligible) rob20Rejections++;
  }

  console.log('\n--- FILTER REJECTIONS ---');
  console.log(`BASELINE FILTER REJECTIONS: ${baseRejections}`);
  console.log(`ROBUST_10 FILTER REJECTIONS: ${rob10Rejections}`);
  console.log(`ROBUST_14 FILTER REJECTIONS: ${rob14Rejections}`);
  console.log(`ROBUST_20 FILTER REJECTIONS: ${rob20Rejections}`);

  // 6. Pure Shadow Control
  const runner = new CP21Runner(items, dataset.datasetHash);
  const basePure = runner.computeMetrics(runner.executeVariant(items, 'BASELINE', 'PURE_SHADOW', 0), 'BASELINE');
  const rob10Pure = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_10', 'PURE_SHADOW', 0), 'ROBUST_10');
  const rob14Pure = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_14', 'PURE_SHADOW', 0), 'ROBUST_14');
  const rob20Pure = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_20', 'PURE_SHADOW', 0), 'ROBUST_20');

  console.log('\n--- PURE SHADOW CONTROL ---');
  console.log(`BASELINE Pure Target: ${basePure.targetReachedCount}, Stop: ${basePure.stopReachedCount}`);
  console.log(`ROBUST_10 Pure Target: ${rob10Pure.targetReachedCount}, Stop: ${rob10Pure.stopReachedCount}`);
  console.log(`ROBUST_14 Pure Target: ${rob14Pure.targetReachedCount}, Stop: ${rob14Pure.stopReachedCount}`);
  console.log(`ROBUST_20 Pure Target: ${rob20Pure.targetReachedCount}, Stop: ${rob20Pure.stopReachedCount}`);

  const pureShadowDivergence =
    basePure.targetReachedCount !== rob14Pure.targetReachedCount ||
    basePure.stopReachedCount !== rob14Pure.stopReachedCount ||
    basePure.timeoutCount !== rob14Pure.timeoutCount;

  console.log(`Pure Shadow Outcome Divergence: ${pureShadowDivergence ? 'YES' : 'NO'}`);

  // 7. Estimator Distances
  let sumDiffB10 = 0, sumDiffB14 = 0, sumDiffB20 = 0;
  let sumRatioDiffB10 = 0, sumRatioDiffB14 = 0, sumRatioDiffB20 = 0;
  let sumDiffM10M14 = 0, sumDiffM14M20 = 0, sumDiffM10M20 = 0;

  for (const r of records) {
    const volB = r.baseDec.volatility;
    const vol10 = r.rob10Dec.volatility;
    const vol14 = r.rob14Dec.volatility;
    const vol20 = r.rob20Dec.volatility;

    const ratioB = r.baseDec.riskVolatilityRatio;
    const ratio10 = r.rob10Dec.riskVolatilityRatio;
    const ratio14 = r.rob14Dec.riskVolatilityRatio;
    const ratio20 = r.rob20Dec.riskVolatilityRatio;

    sumDiffB10 += (volB - vol10);
    sumDiffB14 += (volB - vol14);
    sumDiffB20 += (volB - vol20);

    sumRatioDiffB10 += (ratioB - ratio10);
    sumRatioDiffB14 += (ratioB - ratio14);
    sumRatioDiffB20 += (ratioB - ratio20);

    sumDiffM10M14 += (vol10 - vol14);
    sumDiffM14M20 += (vol14 - vol20);
    sumDiffM10M20 += (vol10 - vol20);
  }

  const avgDiffB10 = sumDiffB10 / records.length;
  const avgDiffB14 = sumDiffB14 / records.length;
  const avgDiffB20 = sumDiffB20 / records.length;

  const avgRatioDiffB10 = sumRatioDiffB10 / records.length;
  const avgRatioDiffB14 = sumRatioDiffB14 / records.length;
  const avgRatioDiffB20 = sumRatioDiffB20 / records.length;

  const avgDiffM10M14 = sumDiffM10M14 / records.length;
  const avgDiffM14M20 = sumDiffM14M20 / records.length;
  const avgDiffM10M20 = sumDiffM10M20 / records.length;

  console.log('\n--- ESTIMATOR DISTANCES (AVERAGES) ---');
  console.log(`avg differenceBaselineMedian10: ${avgDiffB10.toFixed(4)}`);
  console.log(`avg differenceBaselineMedian14: ${avgDiffB14.toFixed(4)}`);
  console.log(`avg differenceBaselineMedian20: ${avgDiffB20.toFixed(4)}`);
  console.log(`avg ratioDifferenceBaselineMedian10: ${avgRatioDiffB10.toFixed(6)}`);
  console.log(`avg ratioDifferenceBaselineMedian14: ${avgRatioDiffB14.toFixed(6)}`);
  console.log(`avg ratioDifferenceBaselineMedian20: ${avgRatioDiffB20.toFixed(6)}`);
  console.log(`avg median10Median14Difference: ${avgDiffM10M14.toFixed(4)}`);
  console.log(`avg median14Median20Difference: ${avgDiffM14M20.toFixed(4)}`);
  console.log(`avg median10Median20Difference: ${avgDiffM10M20.toFixed(4)}`);

  // Print Detailed Table for Near Boundary Cases
  console.log('\n--- NEAR BOUNDARY SCENARIOS TABLE (0.795 <= ratio <= 0.805) ---');
  for (const c of nearCases) {
    console.log(
      `${c.scenarioId} | ${c.symbol} | ${c.timeframe} | ${c.eventType} | ${c.regime} | risk=${c.risk.toFixed(2)} | ` +
      `BaseTR=${c.baseDec.volatility.toFixed(2)}, ratio=${c.baseDec.riskVolatilityRatio.toFixed(4)}, margin=${(c.baseDec.riskVolatilityRatio - 0.8).toFixed(4)}, elig=${c.baseDec.eligible} | ` +
      `M10=${c.rob10Dec.volatility.toFixed(2)}, ratio=${c.rob10Dec.riskVolatilityRatio.toFixed(4)}, margin=${(c.rob10Dec.riskVolatilityRatio - 0.8).toFixed(4)}, elig=${c.rob10Dec.eligible} | ` +
      `M14=${c.rob14Dec.volatility.toFixed(2)}, ratio=${c.rob14Dec.riskVolatilityRatio.toFixed(4)}, margin=${(c.rob14Dec.riskVolatilityRatio - 0.8).toFixed(4)}, elig=${c.rob14Dec.eligible} | ` +
      `M20=${c.rob20Dec.volatility.toFixed(2)}, ratio=${c.rob20Dec.riskVolatilityRatio.toFixed(4)}, margin=${(c.rob20Dec.riskVolatilityRatio - 0.8).toFixed(4)}, elig=${c.rob20Dec.eligible}`
    );
  }
}

runCP27Audit();
