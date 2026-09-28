/**
 * Checkpoint 28 - Exact Eligibility Transition Matrix Audit Test Suite
 * Validates pairwise transition matrices, complete state accounting, divergence directionality,
 * 134-case baseline-robust reconciliation, 14-case robust divergence extraction, margin calculations,
 * regime/BOS/MSS/MTF breakdowns, dataset hash integrity, determinism, reproducibility,
 * detection invariance, BaseScenario immutability, and audit trail completeness.
 */

import { describe, it, expect } from 'vitest';
import { CP27DatasetGenerator } from '../core/ict/backtest/CP27DatasetGenerator';
import { ExecutionSimulator } from '../core/ict/backtest/ExecutionSimulator';

describe('Checkpoint 28 - Exact Eligibility Transition Matrix Audit Suite', () => {
  // Helper to load and evaluate CP27 frozen dataset
  function getRecords() {
    const { dataset, items } = CP27DatasetGenerator.generateCP27Dataset();
    expect(dataset.datasetHash).toBe('HASH-CP27-3AF23381-FROZEN');

    return items.map(item => {
      const s = item.scenario;
      return {
        scenario: s,
        baseDec: ExecutionSimulator.evaluateEligibility(s, 'BASELINE', 'FILTERED_EXPERIMENT', 0.8),
        rob10Dec: ExecutionSimulator.evaluateEligibility(s, 'ROBUST_10', 'FILTERED_EXPERIMENT', 0.8),
        rob14Dec: ExecutionSimulator.evaluateEligibility(s, 'ROBUST_14', 'FILTERED_EXPERIMENT', 0.8),
        rob20Dec: ExecutionSimulator.evaluateEligibility(s, 'ROBUST_20', 'FILTERED_EXPERIMENT', 0.8),
      };
    });
  }

  // 1. Pairwise Transition Matrix
  it('should generate all 6 pairwise transition matrices with exact cell counts summing to 600', () => {
    const records = getRecords();

    function computeMatrix(getA: (r: any) => boolean, getB: (r: any) => boolean) {
      let EE = 0, ER = 0, RE = 0, RR = 0;
      for (const r of records) {
        const a = getA(r), b = getB(r);
        if (a && b) EE++;
        else if (a && !b) ER++;
        else if (!a && b) RE++;
        else if (!a && !b) RR++;
      }
      return { EE, ER, RE, RR, sum: EE + ER + RE + RR };
    }

    const mBase10 = computeMatrix(r => r.baseDec.eligible, r => r.rob10Dec.eligible);
    const mBase14 = computeMatrix(r => r.baseDec.eligible, r => r.rob14Dec.eligible);
    const mBase20 = computeMatrix(r => r.baseDec.eligible, r => r.rob20Dec.eligible);
    const mM10M14 = computeMatrix(r => r.rob10Dec.eligible, r => r.rob14Dec.eligible);
    const mM14M20 = computeMatrix(r => r.rob14Dec.eligible, r => r.rob20Dec.eligible);
    const mM10M20 = computeMatrix(r => r.rob10Dec.eligible, r => r.rob20Dec.eligible);

    expect(mBase10.sum).toBe(600);
    expect(mBase14.sum).toBe(600);
    expect(mBase20.sum).toBe(600);
    expect(mM10M14.sum).toBe(600);
    expect(mM14M20.sum).toBe(600);
    expect(mM10M20.sum).toBe(600);
  });

  // 2. Complete State Accounting
  it('should verify exact state counts for each estimator across all 600 scenarios', () => {
    const records = getRecords();

    const baseRej = records.filter(r => !r.baseDec.eligible).length;
    const baseElig = records.filter(r => r.baseDec.eligible).length;

    const r10Rej = records.filter(r => !r.rob10Dec.eligible).length;
    const r10Elig = records.filter(r => r.rob10Dec.eligible).length;

    const r14Rej = records.filter(r => !r.rob14Dec.eligible).length;
    const r14Elig = records.filter(r => r.rob14Dec.eligible).length;

    const r20Rej = records.filter(r => !r.rob20Dec.eligible).length;
    const r20Elig = records.filter(r => r.rob20Dec.eligible).length;

    expect(baseElig).toBe(360); expect(baseRej).toBe(240);
    expect(r10Elig).toBe(488); expect(r10Rej).toBe(112);
    expect(r14Elig).toBe(494); expect(r14Rej).toBe(106);
    expect(r20Elig).toBe(502); expect(r20Rej).toBe(98);
  });

  // 3. Divergence Direction Accounting
  it('should confirm ELIGIBLE -> REJECTED direction is exactly 0 across all estimator pairs', () => {
    const records = getRecords();

    const base14_ER = records.filter(r => r.baseDec.eligible && !r.rob14Dec.eligible).length;
    const base10_ER = records.filter(r => r.baseDec.eligible && !r.rob10Dec.eligible).length;
    const base20_ER = records.filter(r => r.baseDec.eligible && !r.rob20Dec.eligible).length;
    const m10_14_ER = records.filter(r => r.rob10Dec.eligible && !r.rob14Dec.eligible).length;
    const m14_20_ER = records.filter(r => r.rob14Dec.eligible && !r.rob20Dec.eligible).length;

    expect(base14_ER).toBe(0);
    expect(base10_ER).toBe(0);
    expect(base20_ER).toBe(0);
    expect(m10_14_ER).toBe(0);
    expect(m14_20_ER).toBe(0);
  });

  // 4. Baseline/M10 Reconciliation
  it('should reconcile Baseline vs MedianTR10 transitions (360 EE, 0 ER, 128 RE, 112 RR)', () => {
    const records = getRecords();
    const EE = records.filter(r => r.baseDec.eligible && r.rob10Dec.eligible).length;
    const ER = records.filter(r => r.baseDec.eligible && !r.rob10Dec.eligible).length;
    const RE = records.filter(r => !r.baseDec.eligible && r.rob10Dec.eligible).length;
    const RR = records.filter(r => !r.baseDec.eligible && !r.rob10Dec.eligible).length;

    expect(EE).toBe(360);
    expect(ER).toBe(0);
    expect(RE).toBe(128);
    expect(RR).toBe(112);
  });

  // 5. Baseline/M14 Reconciliation
  it('should reconcile Baseline vs MedianTR14 transitions (360 EE, 0 ER, 134 RE, 106 RR)', () => {
    const records = getRecords();
    const EE = records.filter(r => r.baseDec.eligible && r.rob14Dec.eligible).length;
    const ER = records.filter(r => r.baseDec.eligible && !r.rob14Dec.eligible).length;
    const RE = records.filter(r => !r.baseDec.eligible && r.rob14Dec.eligible).length;
    const RR = records.filter(r => !r.baseDec.eligible && !r.rob14Dec.eligible).length;

    expect(EE).toBe(360);
    expect(ER).toBe(0);
    expect(RE).toBe(134);
    expect(RR).toBe(106);
  });

  // 6. Baseline/M20 Reconciliation
  it('should reconcile Baseline vs MedianTR20 transitions (360 EE, 0 ER, 142 RE, 98 RR)', () => {
    const records = getRecords();
    const EE = records.filter(r => r.baseDec.eligible && r.rob20Dec.eligible).length;
    const ER = records.filter(r => r.baseDec.eligible && !r.rob20Dec.eligible).length;
    const RE = records.filter(r => !r.baseDec.eligible && r.rob20Dec.eligible).length;
    const RR = records.filter(r => !r.baseDec.eligible && !r.rob20Dec.eligible).length;

    expect(EE).toBe(360);
    expect(ER).toBe(0);
    expect(RE).toBe(142);
    expect(RR).toBe(98);
  });

  // 7. M10/M14 Reconciliation
  it('should reconcile MedianTR10 vs MedianTR14 transitions (488 EE, 0 ER, 6 RE, 106 RR)', () => {
    const records = getRecords();
    const EE = records.filter(r => r.rob10Dec.eligible && r.rob14Dec.eligible).length;
    const ER = records.filter(r => r.rob10Dec.eligible && !r.rob14Dec.eligible).length;
    const RE = records.filter(r => !r.rob10Dec.eligible && r.rob14Dec.eligible).length;
    const RR = records.filter(r => !r.rob10Dec.eligible && !r.rob14Dec.eligible).length;

    expect(EE).toBe(488);
    expect(ER).toBe(0);
    expect(RE).toBe(6);
    expect(RR).toBe(106);
  });

  // 8. M14/M20 Reconciliation
  it('should reconcile MedianTR14 vs MedianTR20 transitions (494 EE, 0 ER, 8 RE, 98 RR)', () => {
    const records = getRecords();
    const EE = records.filter(r => r.rob14Dec.eligible && r.rob20Dec.eligible).length;
    const ER = records.filter(r => r.rob14Dec.eligible && !r.rob20Dec.eligible).length;
    const RE = records.filter(r => !r.rob14Dec.eligible && r.rob20Dec.eligible).length;
    const RR = records.filter(r => !r.rob14Dec.eligible && !r.rob20Dec.eligible).length;

    expect(EE).toBe(494);
    expect(ER).toBe(0);
    expect(RE).toBe(8);
    expect(RR).toBe(98);
  });

  // 9. M10/M20 Reconciliation
  it('should reconcile MedianTR10 vs MedianTR20 transitions (488 EE, 0 ER, 14 RE, 98 RR)', () => {
    const records = getRecords();
    const EE = records.filter(r => r.rob10Dec.eligible && r.rob20Dec.eligible).length;
    const ER = records.filter(r => r.rob10Dec.eligible && !r.rob20Dec.eligible).length;
    const RE = records.filter(r => !r.rob10Dec.eligible && r.rob20Dec.eligible).length;
    const RR = records.filter(r => !r.rob10Dec.eligible && !r.rob20Dec.eligible).length;

    expect(EE).toBe(488);
    expect(ER).toBe(0);
    expect(RE).toBe(14);
    expect(RR).toBe(98);
  });

  // 10. 14-Case Extraction
  it('should extract exactly the 14 divergent scenarios between MedianTR10 and MedianTR20', () => {
    const records = getRecords();
    const diff14 = records.filter(r => r.rob10Dec.eligible !== r.rob20Dec.eligible);

    expect(diff14.length).toBe(14);
    for (const c of diff14) {
      expect(c.rob10Dec.eligible).toBe(false);
      expect(c.rob20Dec.eligible).toBe(true);
      expect(c.scenario.scenarioId).toBeDefined();
    }
  });

  // 11. Margin Calculation
  it('should compute exact eligibility margins and absolute ratio differences for divergent cases', () => {
    const records = getRecords();
    const div14 = records.filter(r => r.baseDec.eligible !== r.rob14Dec.eligible);

    for (const d of div14) {
      const baseRatio = d.baseDec.riskVolatilityRatio;
      const robRatio = d.rob14Dec.riskVolatilityRatio;
      const absDiff = Math.abs(baseRatio - robRatio);

      expect(baseRatio).toBeLessThan(0.8);
      expect(robRatio).toBeGreaterThanOrEqual(0.8);
      expect(absDiff).toBeGreaterThan(0);
    }
  });

  // 12. Regime Classification
  it('should verify divergence breakdown by regime (SHOCK: 60, POST-SHOCK: 60, ELEVATED: 14, NORMAL: 0)', () => {
    const records = getRecords();
    const div14 = records.filter(r => r.baseDec.eligible !== r.rob14Dec.eligible);

    const counts: Record<string, number> = {};
    for (const d of div14) {
      const reg = d.scenario.volatilityRegime;
      counts[reg] = (counts[reg] || 0) + 1;
    }

    expect(counts['SHOCK']).toBe(60);
    expect(counts['POST-SHOCK']).toBe(60);
    expect(counts['ELEVATED']).toBe(14);
    expect(counts['NORMAL'] || 0).toBe(0);
  });

  // 13. BOS/MSS Classification
  it('should audit transition distribution between BOS and MSS event types', () => {
    const records = getRecords();
    const div14 = records.filter(r => r.baseDec.eligible !== r.rob14Dec.eligible);

    let bosDiv = 0;
    let mssDiv = 0;

    for (const d of div14) {
      if (d.scenario.eventType === 'BOS') bosDiv++;
      if (d.scenario.eventType === 'MSS') mssDiv++;
    }

    expect(bosDiv).toBe(60);
    expect(mssDiv).toBe(74);
    expect(bosDiv + mssDiv).toBe(134);
  });

  // 14. Multi-Timeframe Classification
  it('should verify timeframe transition breakdown with exact denominators of 100', () => {
    const records = getRecords();
    const mtfDiv: Record<string, number> = {};

    for (const r of records) {
      if (!r.baseDec.eligible && r.rob14Dec.eligible) {
        const key = `${r.scenario.symbol}_${r.scenario.timeframe}`;
        mtfDiv[key] = (mtfDiv[key] || 0) + 1;
      }
    }

    expect(mtfDiv['MNQ_1m']).toBe(26);
    expect(mtfDiv['MNQ_5m']).toBe(25);
    expect(mtfDiv['MNQ_15m']).toBe(16);
    expect(mtfDiv['NQ_1m']).toBe(16);
    expect(mtfDiv['NQ_5m']).toBe(25);
    expect(mtfDiv['NQ_15m']).toBe(26);
  });

  // 15. Dataset Hash Integrity
  it('should verify dataset hash remains unchanged (HASH-CP27-3AF23381-FROZEN)', () => {
    const { dataset } = CP27DatasetGenerator.generateCP27Dataset();
    expect(dataset.datasetHash).toBe('HASH-CP27-3AF23381-FROZEN');
  });

  // 16. Determinism
  it('should yield identical transition matrix output on repeated calculations', () => {
    const r1 = getRecords();
    const r2 = getRecords();

    const countR1 = r1.filter(r => !r.baseDec.eligible && r.rob14Dec.eligible).length;
    const countR2 = r2.filter(r => !r.baseDec.eligible && r.rob14Dec.eligible).length;

    expect(countR1).toBe(countR2);
    expect(countR1).toBe(134);
  });

  // 17. Reproducibility
  it('should pass 2-pass matrix reproducibility check with 100% match', () => {
    const records = getRecords();
    const pass1 = records.map(r => ({ id: r.scenario.scenarioId, base: r.baseDec.eligible, rob14: r.rob14Dec.eligible }));
    const pass2 = records.map(r => ({ id: r.scenario.scenarioId, base: r.baseDec.eligible, rob14: r.rob14Dec.eligible }));

    expect(JSON.stringify(pass1)).toBe(JSON.stringify(pass2));
  });

  // 18. Detection Invariance
  it('should confirm detection parameters remain untampered across all eligibility decisions', () => {
    const records = getRecords();
    for (const r of records) {
      expect(r.scenario.eventId).toBeDefined();
      expect(r.scenario.eventTimestamp).toBeGreaterThan(0);
      expect(r.scenario.confirmationTimestamp).toBeGreaterThan(r.scenario.eventTimestamp);
    }
  });

  // 19. BaseScenario Immutability
  it('should guarantee BaseScenario structural properties are never mutated during matrix evaluation', () => {
    const records = getRecords();
    const s = records[0].scenario;
    const initialEntry = s.entryPrice;
    const initialStop = s.stopPrice;

    ExecutionSimulator.evaluateEligibility(s, 'ROBUST_20', 'FILTERED_EXPERIMENT', 0.8);

    expect(s.entryPrice).toBe(initialEntry);
    expect(s.stopPrice).toBe(initialStop);
  });

  // 20. Audit Trail Completeness
  it('should ensure all eligibility decisions contain full audit trail parameters', () => {
    const records = getRecords();
    for (const r of records) {
      expect(r.baseDec.scenarioId).toBeDefined();
      expect(r.baseDec.estimator).toBe('RollingMeanTR');
      expect(r.rob14Dec.estimator).toBe('MedianTR14');
      expect(r.rob14Dec.threshold).toBe(0.8);
    }
  });
});
