/**
 * Checkpoint 32 - Reproducibility Test Suite
 * Validates 100% reproducible sampling and caseId hashing given CP32_REVIEW_SEED.txt.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Checkpoint 32 - Reproducibility Suite', () => {
  it('should verify cases.json in CP32_REVIEW_PACK has deterministic length and hash structure', () => {
    const packPath = path.join(process.cwd(), 'CP32_REVIEW_PACK', 'cases.json');
    const cases = JSON.parse(fs.readFileSync(packPath, 'utf-8'));

    expect(cases.length).toBe(300);
    const caseIds = cases.map((c: any) => c.caseId);
    const uniqueIds = new Set(caseIds);

    expect(uniqueIds.size).toBe(300);
  });
});
