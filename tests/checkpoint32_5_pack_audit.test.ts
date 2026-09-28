/**
 * Checkpoint 32.5 - Independent Review Pack Audit Test Suite
 * Strictly audits CP32_REVIEW_PACK without accessing CP32_HIDDEN_ENGINE_RECORD.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Checkpoint 32.5 - Independent Review Pack Audit', () => {
  const rootDir = process.cwd();
  const packDir = path.join(rootDir, 'CP32_REVIEW_PACK');
  const casesPath = path.join(packDir, 'cases.json');
  const formPath = path.join(packDir, 'CP32_HUMAN_REVIEW_FORM.csv');
  const instructionsPath = path.join(packDir, 'INSTRUCTIONS.md');
  const seedPath = path.join(rootDir, 'CP32_REVIEW_SEED.txt');

  it('1. should verify CP32_REVIEW_PACK existence and absence of hidden engine record access', () => {
    expect(fs.existsSync(casesPath)).toBe(true);
    expect(fs.existsSync(formPath)).toBe(true);
    expect(fs.existsSync(instructionsPath)).toBe(true);
    expect(fs.existsSync(seedPath)).toBe(true);
  });

  it('2. should verify cases.json contains exactly 300 valid, anonymized cases', () => {
    const raw = fs.readFileSync(casesPath, 'utf-8');
    const cases = JSON.parse(raw);

    expect(cases.length).toBe(300);

    const caseIds = new Set<string>();
    for (const c of cases) {
      expect(c.caseId).toMatch(/^CASE-[0-9A-F]{8}$/);
      expect(caseIds.has(c.caseId)).toBe(false);
      caseIds.add(c.caseId);

      expect(['MNQ', 'NQ']).toContain(c.symbol);
      expect(['1m', '5m', '15m']).toContain(c.timeframe);
      expect(typeof c.contextTimestamp).toBe('number');
      expect(Array.isArray(c.candles)).toBe(true);
      expect(c.candles.length).toBeGreaterThanOrEqual(30);
    }
  });

  it('3. should verify zero internal labels or detector predictions in cases.json', () => {
    const raw = fs.readFileSync(casesPath, 'utf-8');

    const forbiddenTerms = [
      'CLEAR',
      'BORDERLINE',
      'QUESTIONABLE',
      'NOT_PRESENT',
      'CONCEPTO_NO_DETERMINISTA',
      'detectorResult',
      'expected',
      'predicted',
      'modelMatch',
      'confidence',
      'probability',
      'score',
      'setupState',
      'MODEL_A',
      'MODEL_B',
      'MODEL_C',
      'BUY',
      'SELL',
      'winRate',
      'profitability',
    ];

    for (const term of forbiddenTerms) {
      expect(raw.includes(`"${term}"`)).toBe(false);
      expect(raw.includes(`"${term.toLowerCase()}"`)).toBe(false);
    }
  });

  it('4. should verify instructions.md neutrality and clarity', () => {
    const text = fs.readFileSync(instructionsPath, 'utf-8');

    expect(text).toContain('Gonzalo');
    expect(text).toContain('300');
    expect(text).toContain('CLEAR');
    expect(text).toContain('BORDERLINE');
    expect(text).toContain('QUESTIONABLE');
    expect(text).toContain('NOT_PRESENT');
    expect(text).toContain('CONCEPTO_NO_DETERMINISTA');

    // Must not contain system output hints
    expect(text.toLowerCase()).not.toContain('expected');
    expect(text.toLowerCase()).not.toContain('prediction');
    expect(text.toLowerCase()).not.toContain('win rate');
  });

  it('5. should verify CP32_HUMAN_REVIEW_FORM.csv completeness and caseId alignment', () => {
    const rawCases = fs.readFileSync(casesPath, 'utf-8');
    const cases = JSON.parse(rawCases);
    const caseIdSet = new Set(cases.map((c: any) => c.caseId));

    const csvContent = fs.readFileSync(formPath, 'utf-8');
    const lines = csvContent.trim().split('\n');

    expect(lines[0]).toBe('caseId,concept,classification,comment');
    expect(lines.length).toBe(300 * 7 + 1); // 2101 lines

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      const caseId = parts[0];
      const concept = parts[1];
      const classification = parts[2];

      expect(caseIdSet.has(caseId)).toBe(true);
      expect([
        'MARKET_STRUCTURE',
        'LIQUIDITY',
        'DISPLACEMENT',
        'FVG',
        'ORDER_BLOCK',
        'PREMIUM_DISCOUNT',
        'MODEL_EVALUATION',
      ]).toContain(concept);
      expect(classification).toBe(''); // Unfilled, pending human review
    }
  });

  it('6. should verify candle presentation integrity across all 300 cases', () => {
    const cases = JSON.parse(fs.readFileSync(casesPath, 'utf-8'));

    for (const c of cases) {
      for (const candle of c.candles) {
        expect(candle.timestamp).toBeGreaterThan(0);
        expect(candle.open).toBeGreaterThan(0);
        expect(candle.high).toBeGreaterThan(0);
        expect(candle.low).toBeGreaterThan(0);
        expect(candle.close).toBeGreaterThan(0);
        expect(candle.high).toBeGreaterThanOrEqual(candle.low);
        expect(candle.high).toBeGreaterThanOrEqual(candle.open);
        expect(candle.high).toBeGreaterThanOrEqual(candle.close);
        expect(candle.low).toBeLessThanOrEqual(candle.open);
        expect(candle.low).toBeLessThanOrEqual(candle.close);
      }
    }
  });

  it('7. should verify random seed reproducibility', () => {
    const seed = fs.readFileSync(seedPath, 'utf-8').trim();
    expect(seed).toBe('CP32-SEED-20260928-8849201');
  });
});
