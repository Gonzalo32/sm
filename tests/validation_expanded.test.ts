import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationLabEngine } from '../core/ict/validation/ValidationLabEngine';
import { ICTEngine } from '../core/ict/engine/ICTEngine';
import { Candle } from '../core/market/Candle';

import positiveCasesData from '../audit/validation/positive_cases.json';
import negativeCasesData from '../audit/validation/negative_cases.json';

describe('Checkpoint 11 — Expanded ICT Validation Dataset Tests', () => {
  let valEngine: ValidationLabEngine;
  let ictEngine: ICTEngine;

  beforeEach(() => {
    valEngine = new ValidationLabEngine();
    ictEngine = new ICTEngine();
    valEngine.loadCases(positiveCasesData.positiveCases as any);
    valEngine.loadCases(negativeCasesData.negativeCases as any);
  });

  it('Test 1 — Stratified Sampling Reproducibility Matrix', () => {
    const metrics = valEngine.computeMetricsSummary();
    expect(metrics.stratifiedMatrix).toBeDefined();

    const keys = Object.keys(metrics.stratifiedMatrix!);
    expect(keys.length).toBe(2 * 3 * 7); // symbol(2) x tf(3) x eventType(7) = 42 cells

    const sampleCell = metrics.stratifiedMatrix!['BOS × MNQ × 1m'];
    expect(sampleCell).toBeDefined();
    expect(sampleCell.available).toBeGreaterThan(0);
    expect(sampleCell.reviewed).toBeGreaterThan(0);
  });

  it('Test 2 — Stable Sampling & Case ID Reproducibility', () => {
    const cases = valEngine.getCases();
    const c1 = cases[0];
    const regeneratedId = valEngine.generateStableCaseId(
      c1.symbol,
      c1.timeframe,
      c1.eventType,
      c1.eventTimestamp
    );

    expect(c1.caseId).toBe(regeneratedId);
    expect(c1.caseId).toMatch(/^VAL-(MNQ|NQ)-(1m|5m|15m)-[A-Z_]+-\d+$/);
  });

  it('Test 3 — Positive Case Dataset Reproducibility (70+ Cases)', () => {
    const posCases = valEngine.getCases().filter((c) => !c.isNegativeCase);
    expect(posCases.length).toBeGreaterThanOrEqual(70);
    expect(posCases.every((c) => c.detectionSnapshot !== undefined)).toBe(true);
  });

  it('Test 4 — Negative Case Dataset Reproducibility (50+ Cases)', () => {
    const negCases = valEngine.getCases().filter((c) => c.isNegativeCase);
    expect(negCases.length).toBeGreaterThanOrEqual(50);
    expect(negCases.every((c) => c.eventType === 'NONE')).toBe(true);
    expect(negCases.every((c) => c.expectedEvent !== undefined)).toBe(true);
  });

  it('Test 5 — DetectionReviewType Classification Handling', () => {
    const targetCase = valEngine.getCases()[0];
    valEngine.reviewCase(
      targetCase.caseId,
      'QUESTIONABLE',
      'Potential bug in mathematical detection logic',
      'Requires code inspection',
      'Auditor1',
      'DETECTION_REVIEW'
    );

    const updated = valEngine.getCaseById(targetCase.caseId);
    expect(updated?.detectionReviewType).toBe('DETECTION_REVIEW');
    expect(updated?.validationStatus).toBe('QUESTIONABLE');
  });

  it('Test 6 — ConceptReviewType Classification Handling', () => {
    const targetCase = valEngine.getCases()[1];
    valEngine.reviewCase(
      targetCase.caseId,
      'BORDERLINE',
      'Rule implemented correctly mathematically, but concept definition questionable (+1.2pt break)',
      'Requires concept discussion',
      'Auditor2',
      'CONCEPT_REVIEW'
    );

    const updated = valEngine.getCaseById(targetCase.caseId);
    expect(updated?.detectionReviewType).toBe('CONCEPT_REVIEW');
    expect(updated?.validationStatus).toBe('BORDERLINE');
  });

  it('Test 7 — Snapshot Immutability Verification', () => {
    const c = valEngine.getCases()[0];
    expect(Object.isFrozen(c.detectionSnapshot)).toBe(true);
  });

  it('Test 8 — Independent Validation (No Mutation of Detection Engine/Events)', () => {
    const origCaseCount = valEngine.getCases().length;
    const c = valEngine.getCases()[0];
    const origSnapshotJSON = JSON.stringify(c.detectionSnapshot);

    valEngine.reviewCase(c.caseId, 'QUESTIONABLE', 'Disagreement', 'Note', 'Auditor3', 'CONCEPT_REVIEW');

    expect(valEngine.getCases().length).toBe(origCaseCount);
    const after = valEngine.getCaseById(c.caseId)!;
    expect(JSON.stringify(after.detectionSnapshot)).toBe(origSnapshotJSON);
    expect(after.eventType).toBe(c.eventType);
    expect(after.eventTimestamp).toBe(c.eventTimestamp);
  });

  it('Test 9 — Future-Data Isolation in Validation Lab', () => {
    const candles: Candle[] = [
      { timestamp: 1700000000000, open: 18000, high: 18002, low: 17998, close: 18000 },
      { timestamp: 1700000060000, open: 18000, high: 18002, low: 17998, close: 18000 },
      { timestamp: 1700000120000, open: 18000, high: 18002, low: 17998, close: 18000 },
      { timestamp: 1700000180000, open: 18000, high: 18002, low: 17998, close: 18000 },
      { timestamp: 1700000240000, open: 18000, high: 18002, low: 17998, close: 18000 },
      { timestamp: 1700000300000, open: 17998, high: 18050, low: 17997, close: 18048 },
    ];

    const res1 = ictEngine.process(candles, 'MNQ', '1m');
    const dispEvent1 = res1.events.find((e) => e.type === 'DISPLACEMENT')!;
    const snapshot1 = valEngine.buildDetectionSnapshot(dispEvent1, candles, 5);

    // Append 5 future candles
    const futureCandles = [...candles];
    for (let k = 0; k < 5; k++) {
      futureCandles.push({
        timestamp: 1700000360000 + k * 60000,
        open: 18048 + k * 2,
        high: 18055 + k * 2,
        low: 18045 + k * 2,
        close: 18050 + k * 2,
      });
    }

    const res2 = ictEngine.process(futureCandles, 'MNQ', '1m');
    const dispEvent2 = res2.events.find((e) => e.type === 'DISPLACEMENT')!;
    const snapshot2 = valEngine.buildDetectionSnapshot(dispEvent2, futureCandles, 5);

    expect(JSON.stringify(snapshot1)).toBe(JSON.stringify(snapshot2));
  });

  it('Test 10 — Event Timestamp Preservation', () => {
    const cases = valEngine.getCases();
    expect(cases.every((c) => typeof c.eventTimestamp === 'number' && c.eventTimestamp > 0)).toBe(true);
  });

  it('Test 11 — Confirmation Timestamp Preservation', () => {
    const cases = valEngine.getCases();
    expect(cases.every((c) => c.confirmationTimestamp !== undefined && c.confirmationTimestamp >= c.eventTimestamp)).toBe(true);
  });

  it('Test 12 — Symbol Isolation (MNQ vs NQ)', () => {
    const mnqCases = valEngine.filterCases('MNQ');
    const nqCases = valEngine.filterCases('NQ');

    expect(mnqCases.length).toBeGreaterThan(0);
    expect(nqCases.length).toBeGreaterThan(0);
    expect(mnqCases.every((c) => c.symbol === 'MNQ')).toBe(true);
    expect(nqCases.every((c) => c.symbol === 'NQ')).toBe(true);
    expect(mnqCases.length + nqCases.length).toBe(valEngine.getCases().length);
  });

  it('Test 13 — Timeframe Isolation (1m, 5m, 15m)', () => {
    const tf1m = valEngine.filterCases(undefined, '1m');
    const tf5m = valEngine.filterCases(undefined, '5m');
    const tf15m = valEngine.filterCases(undefined, '15m');

    expect(tf1m.length).toBeGreaterThan(0);
    expect(tf5m.length).toBeGreaterThan(0);
    expect(tf15m.length).toBeGreaterThan(0);
    expect(tf1m.length + tf5m.length + tf15m.length).toBe(valEngine.getCases().length);
  });

  it('Test 14 — Serialization Round-Trip with Blind Review Mode', () => {
    valEngine.setBlindReviewMode(true);
    const json = valEngine.toJSON();
    const restored = ValidationLabEngine.fromJSON(json);

    expect(restored.isBlindReviewMode()).toBe(true);
    expect(restored.getCases().length).toBe(valEngine.getCases().length);
    expect(restored.getCases()[0].validationStatus).toBe('UNREVIEWED');
  });

  it('Test 15 — Deterministic Expanded Dataset Generation (100+ Total Cases)', () => {
    const metrics = valEngine.computeMetricsSummary();
    expect(metrics.totalCases).toBeGreaterThanOrEqual(100);
    expect(metrics.positiveCasesCount).toBeGreaterThanOrEqual(70);
    expect(metrics.negativeCasesCount).toBeGreaterThanOrEqual(50);
    expect(metrics.totalCases).toBe(127);
  });
});
