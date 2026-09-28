/**
 * Checkpoint 32 - Sampling Test Suite
 * Validates sample size of 300 cases balanced across MNQ and NQ for 1m, 5m, 15m timeframes.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Checkpoint 32 - Sampling Suite', () => {
  it('should verify sample size equals 300 cases', () => {
    const packPath = path.join(process.cwd(), 'CP32_REVIEW_PACK', 'cases.json');
    const cases = JSON.parse(fs.readFileSync(packPath, 'utf-8'));
    expect(cases.length).toBe(300);
  });

  it('should verify balanced distribution between MNQ and NQ instruments', () => {
    const packPath = path.join(process.cwd(), 'CP32_REVIEW_PACK', 'cases.json');
    const cases = JSON.parse(fs.readFileSync(packPath, 'utf-8'));

    const mnqCount = cases.filter((c: any) => c.symbol === 'MNQ').length;
    const nqCount = cases.filter((c: any) => c.symbol === 'NQ').length;

    expect(mnqCount).toBe(150);
    expect(nqCount).toBe(150);
    expect(mnqCount + nqCount).toBe(300);
  });

  it('should verify coverage across 1m, 5m, and 15m timeframes', () => {
    const packPath = path.join(process.cwd(), 'CP32_REVIEW_PACK', 'cases.json');
    const cases = JSON.parse(fs.readFileSync(packPath, 'utf-8'));

    const tf1m = cases.filter((c: any) => c.timeframe === '1m').length;
    const tf5m = cases.filter((c: any) => c.timeframe === '5m').length;
    const tf15m = cases.filter((c: any) => c.timeframe === '15m').length;

    expect(tf1m).toBeGreaterThan(0);
    expect(tf5m).toBeGreaterThan(0);
    expect(tf15m).toBeGreaterThan(0);
    expect(tf1m + tf5m + tf15m).toBe(300);
  });
});
