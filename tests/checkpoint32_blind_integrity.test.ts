/**
 * Checkpoint 32 - Blind Integrity Test Suite
 * Validates that CP32_REVIEW_PACK contains ZERO internal engine labels, predictions, or scores.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Checkpoint 32 - Blind Integrity Suite', () => {
  it('should verify CP32_REVIEW_PACK/cases.json contains ZERO prohibited internal labels or predictions', () => {
    const packPath = path.join(process.cwd(), 'CP32_REVIEW_PACK', 'cases.json');
    expect(fs.existsSync(packPath)).toBe(true);

    const rawContent = fs.readFileSync(packPath, 'utf-8');

    const prohibitedTerms = [
      '"CLEAR"',
      '"BORDERLINE"',
      '"QUESTIONABLE"',
      '"NOT_PRESENT"',
      '"predicted"',
      '"expected"',
      '"confidence"',
      '"probability"',
      '"score"',
      '"winRate"',
      '"BUY"',
      '"SELL"',
      '"MODEL_A"',
      '"MODEL_B"',
      '"MODEL_C"',
      '"activeTrend"',
      '"detectedEvents"',
      '"invalidationReason"',
    ];

    for (const term of prohibitedTerms) {
      expect(rawContent).not.toContain(term);
    }
  });

  it('should verify cases.json contains valid OHLC candle structures and anonymized caseIds', () => {
    const packPath = path.join(process.cwd(), 'CP32_REVIEW_PACK', 'cases.json');
    const cases = JSON.parse(fs.readFileSync(packPath, 'utf-8'));

    expect(cases.length).toBe(300);
    for (const c of cases) {
      expect(c.caseId).toMatch(/^CASE-[0-9A-F]{8}$/);
      expect(['MNQ', 'NQ']).toContain(c.symbol);
      expect(['1m', '5m', '15m']).toContain(c.timeframe);
      expect(c.candles.length).toBeGreaterThan(0);
    }
  });
});
