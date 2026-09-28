import { CP21DatasetGenerator } from '../core/ict/backtest/CP21DatasetGenerator';
import { CP21Runner } from '../core/ict/backtest/CP21Runner';

const { items, dataset } = CP21DatasetGenerator.generateCP21Dataset();
console.log('Dataset Hash:', dataset.datasetHash);
console.log('Total Scenarios:', dataset.scenarios.length);
console.log('Symbol Dist:', dataset.symbolDistribution);
console.log('Timeframe Dist:', dataset.timeframeDistribution);
console.log('Event Dist:', dataset.eventDistribution);
console.log('Regime Dist:', dataset.regimeDistribution);
console.log('Split Dist:', dataset.splitDistribution);

const runner = new CP21Runner(items, dataset.datasetHash);
const reportData = runner.runFullProtocol(0.8);

console.log('\n--- EXPLORATION METRICS ---');
console.table(reportData.explorationMetrics);

console.log('\n--- SELECTION METRICS ---');
console.table(reportData.selectionMetrics);

console.log('\n--- HOLDOUT METRICS ---');
console.table(reportData.holdoutMetrics);

console.log('\n--- REGIME METRICS (POST-SHOCK) ---');
console.table(reportData.regimeStratifiedMetrics['POST-SHOCK']);

console.log('\n--- REGIME METRICS (SHOCK) ---');
console.table(reportData.regimeStratifiedMetrics['SHOCK']);

console.log('\n--- REGIME METRICS (NORMAL) ---');
console.table(reportData.regimeStratifiedMetrics['NORMAL']);

console.log('\n--- REGIME METRICS (ELEVATED) ---');
console.table(reportData.regimeStratifiedMetrics['ELEVATED']);

console.log('\n--- SYMBOL METRICS (MNQ) ---');
console.table(reportData.symbolStratifiedMetrics['MNQ']);

console.log('\n--- SYMBOL METRICS (NQ) ---');
console.table(reportData.symbolStratifiedMetrics['NQ']);

console.log('\n--- TIMEFRAME METRICS (1m) ---');
console.table(reportData.timeframeStratifiedMetrics['1m']);

console.log('\n--- TIMEFRAME METRICS (5m) ---');
console.table(reportData.timeframeStratifiedMetrics['5m']);

console.log('\n--- TIMEFRAME METRICS (15m) ---');
console.table(reportData.timeframeStratifiedMetrics['15m']);

console.log('\n--- EVENT METRICS (BOS) ---');
console.table(reportData.eventStratifiedMetrics['BOS']);

console.log('\n--- EVENT METRICS (MSS) ---');
console.table(reportData.eventStratifiedMetrics['MSS']);
