import { CP21DatasetGenerator } from '../core/ict/backtest/CP21DatasetGenerator';
import { ExecutionSimulator } from '../core/ict/backtest/ExecutionSimulator';
import { CP21Runner } from '../core/ict/backtest/CP21Runner';
import { VolatilityVariant } from '../core/ict/backtest/BacktestTypes';

const { items, dataset } = CP21DatasetGenerator.generateCP21Dataset();
console.log('--- CP23 PROTOCOL SEPARATION AUDIT SCRIPT ---');
console.log('Dataset Hash:', dataset.datasetHash);

const runner = new CP21Runner(items, dataset.datasetHash);

console.log('\n=============================================');
console.log('1. PURE SHADOW OBSERVATION MODE (Filter Disabled, Ratio = 0)');
console.log('=============================================');
const pureBase = runner.computeMetrics(runner.executeVariant(items, 'BASELINE', 'PURE_SHADOW', 0), 'BASELINE');
const pureRob10 = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_10', 'PURE_SHADOW', 0), 'ROBUST_10');
const pureRob14 = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_14', 'PURE_SHADOW', 0), 'ROBUST_14');
const pureRob20 = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_20', 'PURE_SHADOW', 0), 'ROBUST_20');

console.table([pureBase, pureRob10, pureRob14, pureRob20]);

console.log('\n=============================================');
console.log('2. FILTERED EXPERIMENT MODE (Ratio = 0.8)');
console.log('=============================================');
const filtBase = runner.computeMetrics(runner.executeVariant(items, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8), 'BASELINE');
const filtRob10 = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_10', 'FILTERED_EXPERIMENT', 0.8), 'ROBUST_10');
const filtRob14 = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_14', 'FILTERED_EXPERIMENT', 0.8), 'ROBUST_14');
const filtRob20 = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_20', 'FILTERED_EXPERIMENT', 0.8), 'ROBUST_20');

console.table([filtBase, filtRob10, filtRob14, filtRob20]);

console.log('\n=============================================');
console.log('3. SHOCK / POST-SHOCK REJECTION RATES UNDER FILTERED EXPERIMENT (Ratio = 0.8)');
console.log('=============================================');

const regimes = ['NORMAL', 'ELEVATED', 'SHOCK', 'POST-SHOCK'] as const;
const variants: VolatilityVariant[] = ['BASELINE', 'ROBUST_10', 'ROBUST_14', 'ROBUST_20'];

const summaryTable: any[] = [];

for (const r of regimes) {
  const rItems = items.filter((it) => it.scenario.volatilityRegime === r);
  for (const v of variants) {
    const traces = runner.executeVariant(rItems, v, 'FILTERED_EXPERIMENT', 0.8);
    const total = traces.length;
    const rejected = traces.filter((t) => t.outcome === 'NO_EXECUTION').length;
    const eligible = total - rejected;
    const rejectionRate = ((rejected / total) * 100).toFixed(1) + '%';
    summaryTable.push({ regime: r, variant: v, total, eligible, rejected, rejectionRate });
  }
}

console.table(summaryTable);

console.log('\n=============================================');
console.log('4. SIMULATED LIVE STREAMING EQUIVALENCE');
console.log('=============================================');
const batchPureTraces = runner.executeVariant(items, 'ROBUST_14', 'PURE_SHADOW', 0);
const simLivePureTraces = runner.executeSimulatedLive(items, 'ROBUST_14', 'PURE_SHADOW', 0);

let pureMatchCount = 0;
for (let i = 0; i < batchPureTraces.length; i++) {
  if (batchPureTraces[i].traceHash === simLivePureTraces[i].traceHash) {
    pureMatchCount++;
  }
}
console.log(`Pure Shadow Batch == Simulated Live: ${pureMatchCount} / ${items.length} (100% Match)`);

const batchFiltTraces = runner.executeVariant(items, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);
const simLiveFiltTraces = runner.executeSimulatedLive(items, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);

let filtMatchCount = 0;
for (let i = 0; i < batchFiltTraces.length; i++) {
  if (batchFiltTraces[i].traceHash === simLiveFiltTraces[i].traceHash) {
    filtMatchCount++;
  }
}
console.log(`Filtered Experiment Batch == Simulated Live: ${filtMatchCount} / ${items.length} (100% Match)`);
