import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationLabEngine } from '../core/ict/validation/ValidationLabEngine';
import { ICTEngine } from '../core/ict/engine/ICTEngine';
import { Candle } from '../core/market/Candle';

import positiveCasesData from '../audit/validation/positive_cases.json';
import negativeCasesData from '../audit/validation/negative_cases.json';
import validationSchema from '../audit/validation/validation_schema.json';

describe('Checkpoint 10 — ICT Model Validation Lab Tests', () => {
  let valEngine: ValidationLabEngine;
  let ictEngine: ICTEngine;

  beforeEach(() => {
    valEngine = new ValidationLabEngine();
    ictEngine = new ICTEngine();
  });

  function makeBaseCandles(count: number = 5, startPrice: number = 18000): Candle[] {
    const candles: Candle[] = [];
    for (let i = 0; i < count; i++) {
      candles.push({
        timestamp: 1700000000000 + i * 60000,
        open: startPrice,
        high: startPrice + 2,
        low: startPrice - 2,
        close: startPrice + 1,
        volume: 100,
      });
    }
    return candles;
  }

  it('Test 1 — ValidationCase Schema Compliance', () => {
    expect(validationSchema).toBeDefined();
    expect(validationSchema.required).toContain('caseId');
    expect(validationSchema.required).toContain('symbol');
    expect(validationSchema.required).toContain('timeframe');
    expect(validationSchema.required).toContain('eventType');
    expect(validationSchema.required).toContain('detectionSnapshot');
    expect(validationSchema.required).toContain('validationStatus');

    valEngine.loadCases(positiveCasesData.positiveCases as any);
    const cases = valEngine.getCases();
    expect(cases.length).toBeGreaterThan(0);
    const c = cases[0];
    expect(c.caseId).toBeDefined();
    expect(c.symbol).toBeDefined();
    expect(c.timeframe).toBeDefined();
    expect(c.eventType).toBeDefined();
    expect(c.eventTimestamp).toBeGreaterThan(0);
    expect(c.detectionSnapshot).toBeDefined();
    expect(['UNREVIEWED', 'CLEAR', 'BORDERLINE', 'QUESTIONABLE']).toContain(c.validationStatus);
  });

  it('Test 2 — Stable Case ID Generation (Deterministic)', () => {
    const id1 = valEngine.generateStableCaseId('MNQ', '1m', 'DISPLACEMENT', 1700000480000);
    const id2 = valEngine.generateStableCaseId('MNQ', '1m', 'DISPLACEMENT', 1700000480000);

    expect(id1).toBe('VAL-MNQ-1m-DISPLACEMENT-1700000480000');
    expect(id1).toBe(id2);
    expect(id1).not.toContain(Date.now().toString());
  });

  it('Test 3 — Detection Snapshot Immutability (Object.isFrozen)', () => {
    const candles = makeBaseCandles(5, 18000);
    candles.push({
      timestamp: 1700000300000,
      open: 17998,
      high: 18050,
      low: 17997,
      close: 18048,
    });

    const res = ictEngine.process(candles, 'MNQ', '1m');
    const dispEvent = res.events.find((e) => e.type === 'DISPLACEMENT');
    expect(dispEvent).toBeDefined();

    const snapshot = valEngine.buildDetectionSnapshot(dispEvent!, candles, 5);
    expect(Object.isFrozen(snapshot)).toBe(true);

    expect(() => {
      (snapshot as any).bodyRatio = 0.99;
    }).toThrow();
  });

  it('Test 4 — Validation Review Cannot Mutate Detection Event or Snapshot', () => {
    const candles = makeBaseCandles(5, 18000);
    candles.push({
      timestamp: 1700000300000,
      open: 17998,
      high: 18050,
      low: 17997,
      close: 18048,
    });

    const res = ictEngine.process(candles, 'MNQ', '1m');
    const dispEvent = res.events.find((e) => e.type === 'DISPLACEMENT')!;

    const valCase = valEngine.registerPositiveCase(dispEvent, candles, 'MNQ', '1m');
    const origSnapshotJSON = JSON.stringify(valCase.detectionSnapshot);
    const origEventType = valCase.eventType;
    const origTimestamp = valCase.eventTimestamp;

    const updated = valEngine.reviewCase(
      valCase.caseId,
      'BORDERLINE',
      'Break exists but displacement context is moderate',
      'Human audit observation'
    );

    expect(updated).toBeDefined();
    expect(updated?.validationStatus).toBe('BORDERLINE');
    expect(updated?.validationReason).toContain('displacement context');

    expect(updated?.eventType).toBe(origEventType);
    expect(updated?.eventTimestamp).toBe(origTimestamp);
    expect(JSON.stringify(updated?.detectionSnapshot)).toBe(origSnapshotJSON);
  });

  it('Test 5 — Positive Case Reproducibility', () => {
    valEngine.loadCases(positiveCasesData.positiveCases as any);
    const cases = valEngine.getCases();
    expect(cases.length).toBeGreaterThan(0);
    const target = cases[0];
    const c1 = valEngine.getCaseById(target.caseId);
    expect(c1).toBeDefined();
    expect(c1?.eventType).toBe(target.eventType);
    expect(c1?.isNegativeCase).toBe(false);
  });

  it('Test 6 — Negative Case Reproducibility & Registration', () => {
    valEngine.loadCases(negativeCasesData.negativeCases as any);
    const negCases = valEngine.getCases().filter((c) => c.isNegativeCase);
    expect(negCases.length).toBeGreaterThan(0);

    const candidate = negCases.find((c) => c.expectedEvent === 'DISPLACEMENT');
    expect(candidate).toBeDefined();
    expect(candidate?.eventType).toBe('NONE');
    expect(candidate?.isNegativeCase).toBe(true);
    expect(candidate?.validationStatus).toBe('CLEAR');
  });

  it('Test 7 — Future Information Cannot Modify Detection Snapshot', () => {
    const candles = makeBaseCandles(5, 18000);
    candles.push({ timestamp: 1700000300000, open: 17998, high: 18050, low: 17997, close: 18048 });

    const res1 = ictEngine.process(candles, 'MNQ', '1m');
    const dispEvent1 = res1.events.find((e) => e.type === 'DISPLACEMENT')!;
    const case1 = valEngine.registerPositiveCase(dispEvent1, candles, 'MNQ', '1m');

    const futureCandles = [...candles];
    for (let k = 0; k < 10; k++) {
      futureCandles.push({
        timestamp: 1700000360000 + k * 60000,
        open: 18048 + k,
        high: 18055 + k,
        low: 18045 + k,
        close: 18050 + k,
      });
    }

    const res2 = ictEngine.process(futureCandles, 'MNQ', '1m');
    const dispEvent2 = res2.events.find((e) => e.type === 'DISPLACEMENT')!;
    const case2 = valEngine.registerPositiveCase(dispEvent2, futureCandles, 'MNQ', '1m');

    expect(JSON.stringify(case1.detectionSnapshot)).toBe(JSON.stringify(case2.detectionSnapshot));
  });

  it('Test 8 — Positive and Negative Cases Separation', () => {
    valEngine.loadCases(positiveCasesData.positiveCases as any);
    valEngine.loadCases(negativeCasesData.negativeCases as any);

    const metrics = valEngine.computeMetricsSummary();
    expect(metrics.totalCases).toBe(positiveCasesData.positiveCases.length + negativeCasesData.negativeCases.length);
    expect(metrics.positiveCasesCount).toBe(positiveCasesData.positiveCases.length);
    expect(metrics.negativeCasesCount).toBe(negativeCasesData.negativeCases.length);
  });

  it('Test 9 — Replay Compatibility (Timestamps align with market candles)', () => {
    const candles = makeBaseCandles(5, 18000);
    candles.push({ timestamp: 1700000300000, open: 17998, high: 18050, low: 17997, close: 18048 });

    const res = ictEngine.process(candles, 'MNQ', '1m');
    const event = res.events[0];
    const valCase = valEngine.registerPositiveCase(event, candles, 'MNQ', '1m');

    const matchedCandle = candles.find((c) => c.timestamp === valCase.eventTimestamp);
    expect(matchedCandle).toBeDefined();
    expect(matchedCandle?.timestamp).toBe(1700000300000);
  });

  it('Test 10 — Deterministic Validation Dataset Metrics', () => {
    valEngine.clearCases();
    valEngine.loadCases(positiveCasesData.positiveCases as any);
    valEngine.loadCases(negativeCasesData.negativeCases as any);

    const metrics = valEngine.computeMetricsSummary();
    expect(metrics.totalCases).toBe(positiveCasesData.positiveCases.length + negativeCasesData.negativeCases.length);
    expect(metrics.positiveCasesCount).toBe(positiveCasesData.positiveCases.length);
    expect(metrics.negativeCasesCount).toBe(negativeCasesData.negativeCases.length);
    expect(metrics.clearCount).toBeGreaterThan(0);
  });

  it('Test 11 — Symbol and Timeframe Isolation', () => {
    valEngine.clearCases();
    valEngine.loadCases(positiveCasesData.positiveCases as any);

    const mnq1m = valEngine.filterCases('MNQ', '1m');
    const nq5m = valEngine.filterCases('NQ', '5m');

    expect(mnq1m.every((c) => c.symbol === 'MNQ' && c.timeframe === '1m')).toBe(true);
    expect(nq5m.every((c) => c.symbol === 'NQ' && c.timeframe === '5m')).toBe(true);
    expect(nq5m.length).toBeGreaterThan(0);
  });

  it('Test 12 — Event Timestamp Preservation', () => {
    const candles = makeBaseCandles(5, 18000);
    const ts = 1700000300000;
    candles.push({ timestamp: ts, open: 17998, high: 18050, low: 17997, close: 18048 });

    const res = ictEngine.process(candles, 'MNQ', '1m');
    const event = res.events[0];
    const valCase = valEngine.registerPositiveCase(event, candles, 'MNQ', '1m');

    expect(valCase.eventTimestamp).toBe(ts);
  });

  it('Test 13 — Confirmation Timestamp Preservation', () => {
    const candles = makeBaseCandles(5, 18000);
    const ts = 1700000300000;
    candles.push({ timestamp: ts, open: 17998, high: 18050, low: 17997, close: 18048 });

    const res = ictEngine.process(candles, 'MNQ', '1m');
    const event = res.events[0];
    const valCase = valEngine.registerPositiveCase(event, candles, 'MNQ', '1m');

    expect(valCase.confirmationTimestamp).toBeDefined();
    expect(valCase.confirmationTimestamp).toBeGreaterThanOrEqual(valCase.eventTimestamp);
  });

  it('Test 14 — Detection & Validation Serialization Round-Trip (toJSON / fromJSON)', () => {
    valEngine.clearCases();
    valEngine.loadCases(positiveCasesData.positiveCases as any);
    valEngine.loadCases(negativeCasesData.negativeCases as any);

    const targetId = valEngine.getCases()[0].caseId;
    valEngine.reviewCase(targetId, 'BORDERLINE', 'Near lower limit', 'Audited in test');

    const json = valEngine.toJSON();
    const restored = ValidationLabEngine.fromJSON(json);

    expect(restored.getCases().length).toBe(valEngine.getCases().length);
    const reviewedCase = restored.getCaseById(targetId);
    expect(reviewedCase?.validationStatus).toBe('BORDERLINE');
    expect(reviewedCase?.validationReason).toBe('Near lower limit');
    expect(reviewedCase?.notes).toBe('Audited in test');
  });
});
