import { CP25DatasetGenerator } from '../core/ict/backtest/CP25DatasetGenerator';
import { CP21Runner } from '../core/ict/backtest/CP21Runner';
import { ExecutionSimulator } from '../core/ict/backtest/ExecutionSimulator';
import { BacktestScenario, ExecutionTrace } from '../core/ict/backtest/BacktestTypes';

const { items, dataset } = CP25DatasetGenerator.generateCP25Dataset();
console.log('--- CP25 STRUCTURAL AUDIT SCRIPT ---');
console.log('Dataset Hash:', dataset.datasetHash);
console.log('Total Scenarios:', dataset.scenarios.length);
console.log('Symbol Dist:', dataset.symbolDistribution);
console.log('Timeframe Dist:', dataset.timeframeDistribution);
console.log('Event Dist:', dataset.eventDistribution);
console.log('Regime Dist:', dataset.regimeDistribution);

const runner = new CP21Runner(items, dataset.datasetHash);
const simulator = new ExecutionSimulator();

// Evaluate all scenarios under FILTERED_EXPERIMENT (ratio = 0.8)
const baseTraces = runner.executeVariant(items, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8);
const rob10Traces = runner.executeVariant(items, 'ROBUST_10', 'FILTERED_EXPERIMENT', 0.8);
const rob14Traces = runner.executeVariant(items, 'ROBUST_14', 'FILTERED_EXPERIMENT', 0.8);
const rob20Traces = runner.executeVariant(items, 'ROBUST_20', 'FILTERED_EXPERIMENT', 0.8);

// Classify Groups A, B, C, D, E
const groupA: BacktestScenario[] = []; // Base rejected, Rob10 eligible
const groupB: BacktestScenario[] = []; // Base rejected, Rob14 eligible
const groupC: BacktestScenario[] = []; // Base rejected, Rob20 eligible
const groupD: BacktestScenario[] = []; // Base rejected, Rob10 rejected
const groupE: BacktestScenario[] = []; // Base eligible, Rob rejected

for (let i = 0; i < items.length; i++) {
  const s = items[i].scenario;
  const bObj = baseTraces[i];
  const r10Obj = rob10Traces[i];
  const r14Obj = rob14Traces[i];
  const r20Obj = rob20Traces[i];

  const bRej = bObj.outcome === 'NO_EXECUTION';
  const r10Elig = r10Obj.outcome !== 'NO_EXECUTION';
  const r14Elig = r14Obj.outcome !== 'NO_EXECUTION';
  const r20Elig = r20Obj.outcome !== 'NO_EXECUTION';

  if (bRej && r10Elig) groupA.push(s);
  if (bRej && r14Elig) groupB.push(s);
  if (bRej && r20Elig) groupC.push(s);
  if (bRej && !r10Elig) groupD.push(s);
  if (!bRej && (!r10Elig || !r14Elig || !r20Elig)) groupE.push(s);
}

console.log('\n=============================================');
console.log('1. GROUP COUNTS & REJECTIONS AUDIT');
console.log('=============================================');
console.log(`BASELINE REJECTIONS: ${items.filter((_, idx) => baseTraces[idx].outcome === 'NO_EXECUTION').length}`);
console.log(`GROUP A (Base Rej, Rob10 Elig): ${groupA.length}`);
console.log(`GROUP B (Base Rej, Rob14 Elig): ${groupB.length}`);
console.log(`GROUP C (Base Rej, Rob20 Elig): ${groupC.length}`);
console.log(`GROUP D (Base Rej, Rob10 Rej): ${groupD.length}`);
console.log(`GROUP E (Base Elig, Rob Rej - Counterexamples): ${groupE.length}`);

console.log('\n=============================================');
console.log('2. BOS vs MSS REJECTION BREAKDOWN');
console.log('=============================================');
const bosItems = items.filter((it) => it.scenario.eventType === 'BOS');
const mssItems = items.filter((it) => it.scenario.eventType === 'MSS');

const bosBaseRej = runner.executeVariant(bosItems, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8).filter((t) => t.outcome === 'NO_EXECUTION').length;
const mssBaseRej = runner.executeVariant(mssItems, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8).filter((t) => t.outcome === 'NO_EXECUTION').length;

console.log(`BOS Total: ${bosItems.length} | Baseline Rejected: ${bosBaseRej} | Rob14 Elig: ${bosItems.length}`);
console.log(`MSS Total: ${mssItems.length} | Baseline Rejected: ${mssBaseRej} | Rob14 Elig: ${mssItems.length}`);

console.log('\n=============================================');
console.log('3. SYMBOL & TIMEFRAME BREAKDOWN');
console.log('=============================================');
const pairs = [
  { symbol: 'MNQ', tf: '1m' },
  { symbol: 'MNQ', tf: '5m' },
  { symbol: 'MNQ', tf: '15m' },
  { symbol: 'NQ', tf: '1m' },
  { symbol: 'NQ', tf: '5m' },
  { symbol: 'NQ', tf: '15m' },
];

const tfTable: any[] = [];
for (const p of pairs) {
  const pItems = items.filter((it) => it.scenario.symbol === p.symbol && it.scenario.timeframe === p.tf);
  const pBaseRej = runner.executeVariant(pItems, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8).filter((t) => t.outcome === 'NO_EXECUTION').length;
  const pRob10Elig = runner.executeVariant(pItems, 'ROBUST_10', 'FILTERED_EXPERIMENT', 0.8).filter((t) => t.outcome !== 'NO_EXECUTION').length;
  const pRob14Elig = runner.executeVariant(pItems, 'ROBUST_14', 'FILTERED_EXPERIMENT', 0.8).filter((t) => t.outcome !== 'NO_EXECUTION').length;
  const pRob20Elig = runner.executeVariant(pItems, 'ROBUST_20', 'FILTERED_EXPERIMENT', 0.8).filter((t) => t.outcome !== 'NO_EXECUTION').length;

  tfTable.push({
    symbol: p.symbol,
    timeframe: p.tf,
    total: pItems.length,
    baseRejected: pBaseRej,
    rob10Elig: pRob10Elig,
    rob14Elig: pRob14Elig,
    rob20Elig: pRob20Elig,
  });
}
console.table(tfTable);

console.log('\n=============================================');
console.log('4. REGIME & DISTANCE TO SHOCK BREAKDOWN');
console.log('=============================================');
const regimes = ['NORMAL', 'ELEVATED', 'SHOCK', 'POST-SHOCK'] as const;
const regimeTable: any[] = [];

for (const r of regimes) {
  const rItems = items.filter((it) => it.scenario.volatilityRegime === r);
  const rBaseRej = runner.executeVariant(rItems, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8).filter((t) => t.outcome === 'NO_EXECUTION').length;
  const rRob14Elig = runner.executeVariant(rItems, 'ROBUST_14', 'FILTERED_EXPERIMENT', 0.8).filter((t) => t.outcome !== 'NO_EXECUTION').length;

  let shock1_5 = 0;
  let shock6_10 = 0;
  let shock11Plus = 0;

  for (const it of rItems) {
    if (runner.executeVariant([it], 'BASELINE', 'FILTERED_EXPERIMENT', 0.8)[0].outcome === 'NO_EXECUTION') {
      const bars = it.scenario.barsFromShock || 0;
      if (bars <= 5) shock1_5++;
      else if (bars <= 10) shock6_10++;
      else shock11Plus++;
    }
  }

  regimeTable.push({
    regime: r,
    total: rItems.length,
    baseRejected: rBaseRej,
    rob14Elig: rRob14Elig,
    rejectedBars1_5: shock1_5,
    rejectedBars6_10: shock6_10,
    rejectedBars11Plus: shock11Plus,
  });
}
console.table(regimeTable);

console.log('\n=============================================');
console.log('5. STRUCTURAL PENETRATION MAGNITUDE ANALYSIS');
console.log('=============================================');
let baseRejPenAbsSum = 0;
let baseEligPenAbsSum = 0;
let rejCount = 0;
let eligCount = 0;

for (let i = 0; i < items.length; i++) {
  const s = items[i].scenario;
  const pen = s.penetrationAbsolute || 0;
  if (baseTraces[i].outcome === 'NO_EXECUTION') {
    baseRejPenAbsSum += pen;
    rejCount++;
  } else {
    baseEligPenAbsSum += pen;
    eligCount++;
  }
}

console.log(`Average Penetration of Baseline Rejected: ${(baseRejPenAbsSum / (rejCount || 1)).toFixed(2)} pts`);
console.log(`Average Penetration of Baseline Eligible: ${(baseEligPenAbsSum / (eligCount || 1)).toFixed(2)} pts`);

console.log('\n=============================================');
console.log('6. PURE SHADOW CONTROL VERIFICATION');
console.log('=============================================');
const pureBase = runner.computeMetrics(runner.executeVariant(items, 'BASELINE', 'PURE_SHADOW', 0), 'BASELINE');
const pureRob14 = runner.computeMetrics(runner.executeVariant(items, 'ROBUST_14', 'PURE_SHADOW', 0), 'ROBUST_14');
console.log(`Pure Shadow Baseline: ${pureBase.targetReachedCount} TARGET / ${pureBase.stopReachedCount} STOP`);
console.log(`Pure Shadow Robust14: ${pureRob14.targetReachedCount} TARGET / ${pureRob14.stopReachedCount} STOP`);
console.log(`Pure Shadow Divergence: ${pureBase.targetReachedCount === pureRob14.targetReachedCount ? '0 (NONE)' : 'DIVERGENCE DETECTED'}`);
