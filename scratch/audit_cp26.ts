import { CP26DatasetGenerator } from '../core/ict/backtest/CP26DatasetGenerator';
import { CP21Runner } from '../core/ict/backtest/CP21Runner';
import { ExecutionSimulator } from '../core/ict/backtest/ExecutionSimulator';
import { VolatilityVariant } from '../core/ict/backtest/BacktestTypes';

const { items, dataset } = CP26DatasetGenerator.generateCP26Dataset();
console.log('--- CP26 ELIGIBILITY MARGIN & ESTIMATOR CONVERGENCE AUDIT SCRIPT ---');
console.log('Dataset Hash:', dataset.datasetHash);
console.log('Total Scenarios:', dataset.scenarios.length);
console.log('Symbol Dist:', dataset.symbolDistribution);
console.log('Timeframe Dist:', dataset.timeframeDistribution);
console.log('Event Dist:', dataset.eventDistribution);
console.log('Regime Dist:', dataset.regimeDistribution);

const runner = new CP21Runner(items, dataset.datasetHash);
const simulator = new ExecutionSimulator();

// 1. Math control & Margin calculations
const threshold = 0.8;
interface MarginItem {
  scenarioId: string;
  variant: VolatilityVariant;
  estimator: string;
  volatility: number;
  risk: number;
  ratio: number;
  eligibilityMargin: number;
  absoluteMargin: number;
  eligible: boolean;
  band: string;
  symbol: string;
  timeframe: string;
  eventType: string;
  regime: string;
  barsFromShock?: number;
}

const allMarginRecords: MarginItem[] = [];
const variants: VolatilityVariant[] = ['BASELINE', 'ROBUST_10', 'ROBUST_14', 'ROBUST_20'];

for (const item of items) {
  const s = item.scenario;
  for (const v of variants) {
    const dec = ExecutionSimulator.evaluateEligibility(s, v, 'FILTERED_EXPERIMENT', threshold);
    const ratio = dec.riskVolatilityRatio;
    const margin = ratio - threshold;
    const absMargin = s.risk - threshold * dec.volatility;

    let band = '>= 0.90';
    if (ratio < 0.70) band = '< 0.70';
    else if (ratio < 0.75) band = '0.70 - 0.75';
    else if (ratio < 0.80) band = '0.75 - 0.80';
    else if (ratio < 0.85) band = '0.80 - 0.85';
    else if (ratio < 0.90) band = '0.85 - 0.90';

    allMarginRecords.push({
      scenarioId: s.scenarioId,
      variant: v,
      estimator: dec.estimator,
      volatility: dec.volatility,
      risk: s.risk,
      ratio,
      eligibilityMargin: margin,
      absoluteMargin: absMargin,
      eligible: dec.eligible,
      band,
      symbol: s.symbol,
      timeframe: s.timeframe,
      eventType: s.eventType,
      regime: s.volatilityRegime,
      barsFromShock: s.barsFromShock,
    });
  }
}

console.log('\n=============================================');
console.log('1. RATIO BAND DISTRIBUTION BY ESTIMATOR');
console.log('=============================================');
const bands = ['< 0.70', '0.70 - 0.75', '0.75 - 0.80', '0.80 - 0.85', '0.85 - 0.90', '>= 0.90'];
const bandSummary: any[] = [];

for (const b of bands) {
  const row: any = { band: b };
  for (const v of variants) {
    row[v] = allMarginRecords.filter((r) => r.variant === v && r.band === b).length;
  }
  bandSummary.push(row);
}
console.table(bandSummary);

console.log('\n=============================================');
console.log('2. BASELINE vs ROBUST CLASSIFICATION REJECTIONS');
console.log('=============================================');
const baseRejects = allMarginRecords.filter((r) => r.variant === 'BASELINE' && !r.eligible);
const rob10Rejects = allMarginRecords.filter((r) => r.variant === 'ROBUST_10' && !r.eligible);
const rob14Rejects = allMarginRecords.filter((r) => r.variant === 'ROBUST_14' && !r.eligible);
const rob20Rejects = allMarginRecords.filter((r) => r.variant === 'ROBUST_20' && !r.eligible);

console.log(`BASELINE FILTER REJECTIONS: ${baseRejects.length}`);
console.log(`ROBUST_10 FILTER REJECTIONS: ${rob10Rejects.length}`);
console.log(`ROBUST_14 FILTER REJECTIONS: ${rob14Rejects.length}`);
console.log(`ROBUST_20 FILTER REJECTIONS: ${rob20Rejects.length}`);

console.log('\n=============================================');
console.log('3. ROBUST ESTIMATOR CLASSIFICATION DIVERGENCES');
console.log('=============================================');
let robDivergences = 0;
for (const item of items) {
  const s = item.scenario;
  const d10 = ExecutionSimulator.evaluateEligibility(s, 'ROBUST_10', 'FILTERED_EXPERIMENT', threshold);
  const d14 = ExecutionSimulator.evaluateEligibility(s, 'ROBUST_14', 'FILTERED_EXPERIMENT', threshold);
  const d20 = ExecutionSimulator.evaluateEligibility(s, 'ROBUST_20', 'FILTERED_EXPERIMENT', threshold);

  if (d10.eligible !== d14.eligible || d14.eligible !== d20.eligible || d10.eligible !== d20.eligible) {
    robDivergences++;
  }
}
console.log(`ROBUST ESTIMATOR CLASSIFICATION DIVERGENCES: ${robDivergences}`);

console.log('\n=============================================');
console.log('4. ESTIMATOR CONVERGENCE METRICS (AVG DIFFERENCES)');
console.log('=============================================');
let sumAbsDiff10_14 = 0;
let sumAbsDiff14_20 = 0;
let sumRatioDiff10_14 = 0;
let sumRatioDiff14_20 = 0;

for (const item of items) {
  const s = item.scenario;
  const v10 = s.shadowVolatility.robust10;
  const v14 = s.shadowVolatility.robust14;
  const v20 = s.shadowVolatility.robust20;

  sumAbsDiff10_14 += Math.abs(v10 - v14);
  sumAbsDiff14_20 += Math.abs(v14 - v20);

  const r10 = s.risk / v10;
  const r14 = s.risk / v14;
  const r20 = s.risk / v20;

  sumRatioDiff10_14 += Math.abs(r10 - r14);
  sumRatioDiff14_20 += Math.abs(r14 - r20);
}

console.log(`Avg Volatility Diff (M10 vs M14): ${(sumAbsDiff10_14 / items.length).toFixed(4)} pts`);
console.log(`Avg Volatility Diff (M14 vs M20): ${(sumAbsDiff14_20 / items.length).toFixed(4)} pts`);
console.log(`Avg Ratio Diff (M10 vs M14): ${(sumRatioDiff10_14 / items.length).toFixed(4)}`);
console.log(`Avg Ratio Diff (M14 vs M20): ${(sumRatioDiff14_20 / items.length).toFixed(4)}`);

console.log('\n=============================================');
console.log('5. TOP 10 CLOSEST CASES TO THRESHOLD 0.8');
console.log('=============================================');
const sortedByProximity = [...allMarginRecords].sort((a, b) => Math.abs(a.ratio - threshold) - Math.abs(b.ratio - threshold));
const top10Closest = sortedByProximity.slice(0, 10).map((r) => ({
  scenarioId: r.scenarioId,
  estimator: r.estimator,
  ratio: Number(r.ratio.toFixed(4)),
  margin: Number(r.eligibilityMargin.toFixed(4)),
  eligible: r.eligible,
  symbol: r.symbol,
  timeframe: r.timeframe,
  eventType: r.eventType,
  regime: r.regime,
}));
console.table(top10Closest);

console.log('\nClosest case to threshold:', top10Closest[0].scenarioId, 'Ratio:', top10Closest[0].ratio, 'Margin:', top10Closest[0].margin);

console.log('\n=============================================');
console.log('6. PURE SHADOW CONTROL VERIFICATION');
console.log('=============================================');
const pureBase = runner.computeMetrics(runner.executeVariant(items, 'BASELINE', 'PURE_SHADOW', 0), 'BASELINE');
const pureRob14 = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_14', 'PURE_SHADOW', 0), 'ROBUST_14');
console.log(`Pure Shadow Baseline: ${pureBase.targetReachedCount} TARGET / ${pureBase.stopReachedCount} STOP`);
console.log(`Pure Shadow Robust14: ${pureRob14.targetReachedCount} TARGET / ${pureRob14.stopReachedCount} STOP`);
console.log(`Pure Shadow Outcome Difference: ${pureBase.targetReachedCount === pureRob14.targetReachedCount ? 'NO' : 'YES'}`);
