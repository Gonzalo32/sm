/**
 * Checkpoint 32.6 - Human Sample Audit Test Suite
 * Validates sample size of 50 cases, stratification, blinding, reproducibility, and form structure.
 * Strictly avoids accessing CP32_HIDDEN_ENGINE_RECORD.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Checkpoint 32.6 - Human Sample Audit Suite', () => {
  const rootDir = process.cwd();
  const cp32PackPath = path.join(rootDir, 'CP32_REVIEW_PACK', 'cases.json');
  const cp32_6PackDir = path.join(rootDir, 'CP32.6_HUMAN_REVIEW_PACK');
  const cp32_6CasesPath = path.join(cp32_6PackDir, 'cases.json');
  const cp32_6FormPath = path.join(cp32_6PackDir, 'CP32.6_HUMAN_REVIEW_FORM.csv');
  const cp32_6InstructionsPath = path.join(cp32_6PackDir, 'INSTRUCTIONS.md');
  const cp32_6ManifestPath = path.join(cp32_6PackDir, 'SAMPLE_MANIFEST.md');
  const seedPath = path.join(rootDir, 'CP32.6_HUMAN_SAMPLE_SEED.txt');

  it('1. should verify CP32.6 pack files existence and valid seed', () => {
    expect(fs.existsSync(cp32_6CasesPath)).toBe(true);
    expect(fs.existsSync(cp32_6FormPath)).toBe(true);
    expect(fs.existsSync(cp32_6InstructionsPath)).toBe(true);
    expect(fs.existsSync(cp32_6ManifestPath)).toBe(true);
    expect(fs.existsSync(seedPath)).toBe(true);

    const seed = fs.readFileSync(seedPath, 'utf-8').trim();
    expect(seed).toBe('CP32.6-HUMAN-SAMPLE-SEED-20260928-50');
  });

  it('2. should verify sample size equals 50 cases and all IDs belong to CP32 pack', () => {
    const originalCases: any[] = JSON.parse(fs.readFileSync(cp32PackPath, 'utf-8'));
    const originalIdSet = new Set(originalCases.map((c: any) => c.caseId));

    const sampleCases: any[] = JSON.parse(fs.readFileSync(cp32_6CasesPath, 'utf-8'));
    expect(sampleCases.length).toBe(50);

    const sampleIdSet = new Set<string>();
    for (const c of sampleCases) {
      expect(c.caseId).toMatch(/^CASE-[0-9A-F]{8}$/);
      expect(sampleIdSet.has(c.caseId)).toBe(false);
      sampleIdSet.add(c.caseId);

      // Must belong to CP32 pack
      expect(originalIdSet.has(c.caseId)).toBe(true);
    }
  });

  it('3. should verify stratification representation (25 MNQ, 25 NQ across 1m, 5m, 15m)', () => {
    const sampleCases: any[] = JSON.parse(fs.readFileSync(cp32_6CasesPath, 'utf-8'));

    const mnqCount = sampleCases.filter((c: any) => c.symbol === 'MNQ').length;
    const nqCount = sampleCases.filter((c: any) => c.symbol === 'NQ').length;

    expect(mnqCount).toBe(25);
    expect(nqCount).toBe(25);

    const tf1m = sampleCases.filter((c: any) => c.timeframe === '1m').length;
    const tf5m = sampleCases.filter((c: any) => c.timeframe === '5m').length;
    const tf15m = sampleCases.filter((c: any) => c.timeframe === '15m').length;

    expect(tf1m).toBeGreaterThan(0);
    expect(tf5m).toBeGreaterThan(0);
    expect(tf15m).toBeGreaterThan(0);
    expect(tf1m + tf5m + tf15m).toBe(50);
  });

  it('4. should verify zero internal detector fields or labels in cases.json', () => {
    const raw = fs.readFileSync(cp32_6CasesPath, 'utf-8');

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

  it('5. should verify CP32.6_HUMAN_REVIEW_FORM.csv structure (case_id,classification,reviewer_note)', () => {
    const sampleCases: any[] = JSON.parse(fs.readFileSync(cp32_6CasesPath, 'utf-8'));
    const sampleIdSet = new Set(sampleCases.map((c: any) => c.caseId));

    const csvContent = fs.readFileSync(cp32_6FormPath, 'utf-8');
    const lines = csvContent.trim().split('\n');

    expect(lines[0]).toBe('case_id,classification,reviewer_note');
    expect(lines.length).toBe(51); // 50 rows + 1 header

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      const caseId = parts[0];
      const classification = parts[1];

      expect(sampleIdSet.has(caseId)).toBe(true);
      expect(classification).toBe(''); // Empty, ready for Gonzalo
    }
  });
});
