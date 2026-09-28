/**
 * Checkpoint 32 - Sealing Readiness Test Suite
 * Validates sealing metadata format and hash readiness.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Checkpoint 32 - Sealing Suite', () => {
  it('should verify seed file exists and contains valid seed format', () => {
    const seedPath = path.join(process.cwd(), 'CP32_REVIEW_SEED.txt');
    expect(fs.existsSync(seedPath)).toBe(true);

    const seed = fs.readFileSync(seedPath, 'utf-8').trim();
    expect(seed).toContain('CP32-SEED-');
  });

  it('should verify CP32_HUMAN_REVIEW_FORM.csv is properly formatted for 300 cases x 7 concepts', () => {
    const csvPath = path.join(process.cwd(), 'CP32_REVIEW_PACK', 'CP32_HUMAN_REVIEW_FORM.csv');
    expect(fs.existsSync(csvPath)).toBe(true);

    const lines = fs.readFileSync(csvPath, 'utf-8').trim().split('\n');
    const header = lines[0];
    expect(header).toBe('caseId,concept,classification,comment');

    // 1 header + 300 cases * 7 concepts = 2101 lines
    expect(lines.length).toBe(2101);
  });
});
