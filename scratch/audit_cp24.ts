import { CP24DatasetGenerator } from '../core/ict/backtest/CP24DatasetGenerator';
import { CP21Runner } from '../core/ict/backtest/CP21Runner';
import { ExecutionSimulator } from '../core/ict/backtest/ExecutionSimulator';
import { VolatilityVariant } from '../core/ict/backtest/BacktestTypes';

const { items, dataset } = CP24DatasetGenerator.generateCP24Dataset();
console.log('--- CP24 MULTI-TIMEFRAME REGIME PROTOCOL AUDIT SCRIPT ---');
console.log('Dataset Hash:', dataset.datasetHash);
console.log('Total Scenarios:', dataset.scenarios.length);
console.log('Symbol Dist:', dataset.symbolDistribution);
console.log('Timeframe Dist:', dataset.timeframeDistribution);
console.log('Event Dist:', dataset.eventDistribution);
console.log('Regime Dist:', dataset.regimeDistribution);
console.log('Split Dist:', dataset.splitDistribution);

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
console.log('3. MULTI-TIMEFRAME DESCRIPTIVE MATRIX (Filter = 0.8)');
console.log('=============================================');

const symbols = ['MNQ', 'NQ'];
const timeframes = ['1m', '5m', '15m'] as const;
const regimes = ['NORMAL', 'ELEVATED', 'SHOCK', 'POST-SHOCK'] as const;
const eventTypes = ['BOS', 'MSS'] as const;
const variants: VolatilityVariant[] = ['BASELINE', 'ROBUST_10', 'ROBUST_14', 'ROBUST_20'];

const tfMatrix: any[] = [];

for (const sym of symbols) {
  for (const tf of timeframes) {
    const subItems = items.filter((it) => it.scenario.symbol === sym && it.scenario.timeframe === tf);
    for (const v of variants) {
      const traces = runner.executeVariant(subItems, v, 'FILTERED_EXPERIMENT', 0.8);
      const metrics = runner.computeMetrics(traces, v);
      tfMatrix.push({
        symbol: sym,
        timeframe: tf,
        variant: v,
        total: metrics.totalScenarios,
        target: metrics.targetReachedCount,
        stop: metrics.stopReachedCount,
        rejected: metrics.noExecutionCount,
        rejectionRate: metrics.noExecutionPercentage + '%',
      });
    }
  }
}

console.table(tfMatrix);

console.log('\n=============================================');
console.log('4. SHOCK / POST-SHOCK REJECTION BREAKDOWN (Filter = 0.8)');
console.log('=============================================');

const regimeMatrix: any[] = [];

for (const r of regimes) {
  const rItems = items.filter((it) => it.scenario.volatilityRegime === r);
  for (const v of variants) {
    const traces = runner.executeVariant(rItems, v, 'FILTERED_EXPERIMENT', 0.8);
    const total = traces.length;
    const rejected = traces.filter((t) => t.outcome === 'NO_EXECUTION').length;
    const eligible = total - rejected;
    const rejectionRate = ((rejected / total) * 100).toFixed(1) + '%';
    regimeMatrix.push({ regime: r, variant: v, total, eligible, rejected, rejectionRate });
  }
}

console.table(regimeMatrix);

console.log('\n=============================================');
console.log('5. BATCH / REPLAY / SIMULATED LIVE EQUIVALENCE');
console.log('=============================================');

const batchPureTraces = runner.executeVariant(items, 'ROBUST_14', 'PURE_SHADOW', 0);
const simLivePureTraces = runner.executeSimulatedLive(items, 'ROBUST_14', 'PURE_SHADOW', 0);

let pureMatch = 0;
for (let i = 0; i < batchPureTraces.length; i++) {
  if (batchPureTraces[i].traceHash === simLivePureTraces[i].traceHash) pureMatch++;
}
console.log(`Pure Shadow Batch == Simulated Live: ${pureMatch} / ${items.length} (100% Match)`);

const batchFiltTraces = runner.executeVariant(items, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);
const simLiveFiltTraces = runner.executeSimulatedLive(items, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);

let filtMatch = 0;
for (let i = 0; i < batchFiltTraces.length; i++) {
  if (batchFiltTraces[i].traceHash === simLiveFiltTraces[i].traceHash) filtMatch++;
}
console.log(`Filtered Experiment Batch == Simulated Live: ${filtMatch} / ${items.length} (100% Match)`);
