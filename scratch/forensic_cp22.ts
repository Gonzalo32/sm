import { CP21DatasetGenerator } from '../core/ict/backtest/CP21DatasetGenerator';
import { ExecutionSimulator } from '../core/ict/backtest/ExecutionSimulator';
import { CP21Runner } from '../core/ict/backtest/CP21Runner';
import { BacktestScenario, ExecutionTrace, VolatilityVariant } from '../core/ict/backtest/BacktestTypes';

const { items, dataset } = CP21DatasetGenerator.generateCP21Dataset();

console.log('--- CP22 FORENSIC AUDIT SCRIPT ---');
console.log('Dataset Hash:', dataset.datasetHash);
expectHash(dataset.datasetHash, 'HASH-CP21-7DCF0593-FROZEN');

function expectHash(actual: string, expected: string) {
  if (actual !== expected) {
    console.error(`HASH DISCREPANCY! Got ${actual}, expected ${expected}`);
  } else {
    console.log('HASH MATCH CONFIRMED:', actual);
  }
}

const runner = new CP21Runner(items, dataset.datasetHash);
const report = runner.runFullProtocol(0.8);

console.log('\n--- REPRODUCING CP21 METRICS (Filter = 0.8) ---');
console.log('BASELINE:', report.selectionMetrics['BASELINE'].targetReachedCount + report.explorationMetrics['BASELINE'].targetReachedCount + report.holdoutMetrics['BASELINE'].targetReachedCount, 'TARGET /',
  report.selectionMetrics['BASELINE'].stopReachedCount + report.explorationMetrics['BASELINE'].stopReachedCount + report.holdoutMetrics['BASELINE'].stopReachedCount, 'STOP /',
  report.selectionMetrics['BASELINE'].noExecutionCount + report.explorationMetrics['BASELINE'].noExecutionCount + report.holdoutMetrics['BASELINE'].noExecutionCount, 'NO_EXEC');

console.log('ROBUST_14:', report.selectionMetrics['ROBUST_14'].targetReachedCount + report.explorationMetrics['ROBUST_14'].targetReachedCount + report.holdoutMetrics['ROBUST_14'].targetReachedCount, 'TARGET /',
  report.selectionMetrics['ROBUST_14'].stopReachedCount + report.explorationMetrics['ROBUST_14'].stopReachedCount + report.holdoutMetrics['ROBUST_14'].stopReachedCount, 'STOP /',
  report.selectionMetrics['ROBUST_14'].noExecutionCount + report.explorationMetrics['ROBUST_14'].noExecutionCount + report.holdoutMetrics['ROBUST_14'].noExecutionCount, 'NO_EXEC');

// Extract the 50 NO_EXECUTION cases
const simulator = new ExecutionSimulator();
const noExecCases: Array<{
  scenarioId: string;
  eventId: string;
  symbol: string;
  timeframe: string;
  eventType: string;
  eventTimestamp: number;
  confirmationTimestamp: number;
  referencePrice: number;
  stopPrice: number;
  targetPrice: number;
  volatilityBaseline: number;
  medianTR10: number;
  medianTR14: number;
  medianTR20: number;
  baselineExecutionDecision: string;
  robustExecutionDecision: string;
  executionDecisionReason: string;
  regime: string;
  split: string;
}> = [];

for (const item of items) {
  const baseTrace = simulator.simulate(item.scenario, item.futureCandles, 'BASELINE', 0.8);
  const robTrace = simulator.simulate(item.scenario, item.futureCandles, 'ROBUST_14', 0.8);

  if (baseTrace.outcome === 'NO_EXECUTION' && robTrace.outcome !== 'NO_EXECUTION') {
    const s = item.scenario;
    const ratioBase = s.risk / s.shadowVolatility.baseline;
    const ratioRob = s.risk / s.shadowVolatility.robust14;
    noExecCases.push({
      scenarioId: s.scenarioId,
      eventId: s.eventId,
      symbol: s.symbol,
      timeframe: s.timeframe,
      eventType: s.eventType,
      eventTimestamp: s.eventTimestamp,
      confirmationTimestamp: s.confirmationTimestamp,
      referencePrice: s.referencePrice,
      stopPrice: s.stopPrice,
      targetPrice: s.targetPrice,
      volatilityBaseline: s.shadowVolatility.baseline,
      medianTR10: s.shadowVolatility.robust10,
      medianTR14: s.shadowVolatility.robust14,
      medianTR20: s.shadowVolatility.robust20,
      baselineExecutionDecision: 'NO_EXECUTION',
      robustExecutionDecision: robTrace.outcome,
      executionDecisionReason: `Risk/BaselineVol ratio (${ratioBase.toFixed(3)}) < threshold (0.800) due to shock ATR inflation, whereas Risk/RobustVol ratio (${ratioRob.toFixed(3)}) >= 0.800`,
      regime: s.volatilityRegime,
      split: s.split,
    });
  }
}

console.log(`\nExtracted ${noExecCases.length} NO_EXECUTION cases.`);
console.log('Breakdown of NO_EXECUTION cases by Regime:');
const regimeCounts: Record<string, number> = {};
for (const c of noExecCases) {
  regimeCounts[c.regime] = (regimeCounts[c.regime] || 0) + 1;
}
console.log(regimeCounts);

console.log('\nBreakdown by Symbol:');
const symbolCounts: Record<string, number> = {};
for (const c of noExecCases) {
  symbolCounts[c.symbol] = (symbolCounts[c.symbol] || 0) + 1;
}
console.log(symbolCounts);

console.log('\nBreakdown by Timeframe:');
const tfCounts: Record<string, number> = {};
for (const c of noExecCases) {
  tfCounts[c.timeframe] = (tfCounts[c.timeframe] || 0) + 1;
}
console.log(tfCounts);

console.log('\nBreakdown by Event Type:');
const evCounts: Record<string, number> = {};
for (const c of noExecCases) {
  evCounts[c.eventType] = (evCounts[c.eventType] || 0) + 1;
}
console.log(evCounts);

console.log('\n--- AUDIT OF 20% CLAIM ---');
console.log('Total NO_EXECUTION cases:', noExecCases.length);
console.log('Total dataset scenarios:', items.length);
console.log('NO_EXECUTION / Total Dataset:', (noExecCases.length / items.length) * 100, '%');

const shockPostShockCount = items.filter(i => i.scenario.volatilityRegime === 'SHOCK' || i.scenario.volatilityRegime === 'POST-SHOCK').length;
console.log('Total SHOCK + POST-SHOCK scenarios:', shockPostShockCount);
console.log('NO_EXECUTION / (SHOCK + POST-SHOCK):', (noExecCases.length / shockPostShockCount) * 100, '%');

const shockCount = items.filter(i => i.scenario.volatilityRegime === 'SHOCK').length;
const postShockCount = items.filter(i => i.scenario.volatilityRegime === 'POST-SHOCK').length;
console.log(`SHOCK regime NO_EXEC: ${regimeCounts['SHOCK'] || 0} / ${shockCount} = ${((regimeCounts['SHOCK'] || 0) / shockCount * 100).toFixed(1)}%`);
console.log(`POST-SHOCK regime NO_EXEC: ${regimeCounts['POST-SHOCK'] || 0} / ${postShockCount} = ${((regimeCounts['POST-SHOCK'] || 0) / postShockCount * 100).toFixed(1)}%`);

console.log('\n--- SHADOW PURITY TEST (Filter = 0) ---');
const rawBaseTraces = runner.executeVariant(items, 'BASELINE', 0);
const rawRob10Traces = runner.executeVariant(items, 'ROBUST_10', 0);
const rawRob14Traces = runner.executeVariant(items, 'ROBUST_14', 0);
const rawRob20Traces = runner.executeVariant(items, 'ROBUST_20', 0);

const rawBaseMetrics = runner.computeMetrics(rawBaseTraces, 'BASELINE');
const rawRob10Metrics = runner.computeMetrics(rawRob10Traces, 'ROBUST_10');
const rawRob14Metrics = runner.computeMetrics(rawRob14Traces, 'ROBUST_14');
const rawRob20Metrics = runner.computeMetrics(rawRob20Traces, 'ROBUST_20');

console.log('RAW BASELINE:', rawBaseMetrics.targetReachedCount, 'TARGET /', rawBaseMetrics.stopReachedCount, 'STOP /', rawBaseMetrics.noExecutionCount, 'NO_EXEC');
console.log('RAW ROBUST_10:', rawRob10Metrics.targetReachedCount, 'TARGET /', rawRob10Metrics.stopReachedCount, 'STOP /', rawRob10Metrics.noExecutionCount, 'NO_EXEC');
console.log('RAW ROBUST_14:', rawRob14Metrics.targetReachedCount, 'TARGET /', rawRob14Metrics.stopReachedCount, 'STOP /', rawRob14Metrics.noExecutionCount, 'NO_EXEC');
console.log('RAW ROBUST_20:', rawRob20Metrics.targetReachedCount, 'TARGET /', rawRob20Metrics.stopReachedCount, 'STOP /', rawRob20Metrics.noExecutionCount, 'NO_EXEC');

console.log('\n--- HOLDOUT AUDIT BREAKDOWN ---');
console.log('Selection Target Rate:', report.selectionMetrics['ROBUST_14'].targetReachedPercentage, '% (', report.selectionMetrics['ROBUST_14'].targetReachedCount, '/', report.selectionMetrics['ROBUST_14'].totalScenarios, ')');
console.log('Holdout Target Rate:', report.holdoutMetrics['ROBUST_14'].targetReachedPercentage, '% (', report.holdoutMetrics['ROBUST_14'].targetReachedCount, '/', report.holdoutMetrics['ROBUST_14'].totalScenarios, ')');
