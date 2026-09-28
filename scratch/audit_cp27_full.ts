/**
 * Checkpoint 27 - Full Audit Script with Breakdown Tables
 */

import { CP27DatasetGenerator } from '../core/ict/backtest/CP27DatasetGenerator';
import { ExecutionSimulator } from '../core/ict/backtest/ExecutionSimulator';
import { CP21Runner } from '../core/ict/backtest/CP21Runner';
import { EligibilityDecision } from '../core/ict/backtest/BacktestTypes';

function runCP27FullAudit() {
  const { dataset, items } = CP27DatasetGenerator.generateCP27Dataset();
  const simulator = new ExecutionSimulator();

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
    records.push({
      scenarioId: s.scenarioId,
      symbol: s.symbol,
      timeframe: s.timeframe,
      eventType: s.eventType,
      regime: s.volatilityRegime,
      barsFromShock: s.barsFromShock,
      risk: s.risk,
      baseDec: ExecutionSimulator.evaluateEligibility(s, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8),
      rob10Dec: ExecutionSimulator.evaluateEligibility(s, 'ROBUST_10', 'FILTERED_EXPERIMENT', 0.8),
      rob14Dec: ExecutionSimulator.evaluateEligibility(s, 'ROBUST_14', 'FILTERED_EXPERIMENT', 0.8),
      rob20Dec: ExecutionSimulator.evaluateEligibility(s, 'ROBUST_20', 'FILTERED_EXPERIMENT', 0.8),
    });
  }

  // 1. Shock / Post-Shock Analysis
  console.log('\n=== 1. SHOCK / POST-SHOCK AUDIT ===');
  const regimeBreakdown: Record<string, { total: number; baseEligible: number; rob14Eligible: number }> = {};
  for (const r of records) {
    if (!regimeBreakdown[r.regime]) {
      regimeBreakdown[r.regime] = { total: 0, baseEligible: 0, rob14Eligible: 0 };
    }
    regimeBreakdown[r.regime].total++;
    if (r.baseDec.eligible) regimeBreakdown[r.regime].baseEligible++;
    if (r.rob14Dec.eligible) regimeBreakdown[r.regime].rob14Eligible++;
  }
  console.table(regimeBreakdown);

  // Bars from shock breakdown (1-5, 6-10, 11+)
  const shockBarsBreakdown: Record<string, { total: number; baseEligible: number; rob14Eligible: number }> = {
    '1-5 (SHOCK)': { total: 0, baseEligible: 0, rob14Eligible: 0 },
    '6-10 (POST-SHOCK early)': { total: 0, baseEligible: 0, rob14Eligible: 0 },
    '11+ (POST-SHOCK late)': { total: 0, baseEligible: 0, rob14Eligible: 0 },
  };

  for (const r of records) {
    if (r.barsFromShock !== undefined) {
      let group = '1-5 (SHOCK)';
      if (r.barsFromShock >= 6 && r.barsFromShock <= 10) group = '6-10 (POST-SHOCK early)';
      else if (r.barsFromShock >= 11) group = '11+ (POST-SHOCK late)';

      shockBarsBreakdown[group].total++;
      if (r.baseDec.eligible) shockBarsBreakdown[group].baseEligible++;
      if (r.rob14Dec.eligible) shockBarsBreakdown[group].rob14Eligible++;
    }
  }
  console.table(shockBarsBreakdown);

  // 2. BOS / MSS Analysis
  console.log('\n=== 2. BOS / MSS AUDIT ===');
  const eventBreakdown: Record<string, { total: number; baseEligible: number; rob14Eligible: number; rob10_14_diff: number; rob14_20_diff: number }> = {};
  for (const r of records) {
    if (!eventBreakdown[r.eventType]) {
      eventBreakdown[r.eventType] = { total: 0, baseEligible: 0, rob14Eligible: 0, rob10_14_diff: 0, rob14_20_diff: 0 };
    }
    eventBreakdown[r.eventType].total++;
    if (r.baseDec.eligible) eventBreakdown[r.eventType].baseEligible++;
    if (r.rob14Dec.eligible) eventBreakdown[r.eventType].rob14Eligible++;
    if (r.rob10Dec.eligible !== r.rob14Dec.eligible) eventBreakdown[r.eventType].rob10_14_diff++;
    if (r.rob14Dec.eligible !== r.rob20Dec.eligible) eventBreakdown[r.eventType].rob14_20_diff++;
  }
  console.table(eventBreakdown);

  // 3. Multi-Timeframe Analysis
  console.log('\n=== 3. MULTI-TIMEFRAME AUDIT ===');
  const mtfBreakdown: Record<string, { total: number; baseEligible: number; rob10Eligible: number; rob14Eligible: number; rob20Eligible: number }> = {};
  for (const r of records) {
    const key = `${r.symbol} ${r.timeframe}`;
    if (!mtfBreakdown[key]) {
      mtfBreakdown[key] = { total: 0, baseEligible: 0, rob10Eligible: 0, rob14Eligible: 0, rob20Eligible: 0 };
    }
    mtfBreakdown[key].total++;
    if (r.baseDec.eligible) mtfBreakdown[key].baseEligible++;
    if (r.rob10Dec.eligible) mtfBreakdown[key].rob10Eligible++;
    if (r.rob14Dec.eligible) mtfBreakdown[key].rob14Eligible++;
    if (r.rob20Dec.eligible) mtfBreakdown[key].rob20Eligible++;
  }
  console.table(mtfBreakdown);

  // 4. Floating-Point Audit
  console.log('\n=== 4. FLOATING POINT AUDIT ===');
  let nanCount = 0;
  let infCount = 0;
  let roundingErrors = 0;

  for (const r of records) {
    for (const dec of [r.baseDec, r.rob10Dec, r.rob14Dec, r.rob20Dec]) {
      if (isNaN(dec.riskVolatilityRatio) || isNaN(dec.volatility)) nanCount++;
      if (!isFinite(dec.riskVolatilityRatio) || !isFinite(dec.volatility)) infCount++;

      const expectedEligible = dec.riskVolatilityRatio >= 0.8;
      if (dec.eligible !== expectedEligible) {
        roundingErrors++;
      }
    }
  }

  console.log(`NaN count: ${nanCount}`);
  console.log(`Infinity count: ${infCount}`);
  console.log(`Rounding mismatch count: ${roundingErrors}`);
  console.log(`Threshold 0.8 IEEE 754 value: (0.8).toPrecision(17) = ${(0.8).toPrecision(17)}`);
}

runCP27FullAudit();
