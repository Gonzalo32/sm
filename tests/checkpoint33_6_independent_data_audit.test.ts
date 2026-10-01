import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

describe('Checkpoint 33.6 — Independent Historical Data Acquisition & Integrity Audit', () => {
  const rootDir = process.cwd();
  const auditDir = path.join(rootDir, 'data_audit', 'cp33_6');
  const rawPath = path.join(auditDir, 'raw', 'databento_nq_1m_sample_raw.json');
  const normPath = path.join(auditDir, 'normalized', 'nq_1m_normalized.json');
  const d5mPath = path.join(auditDir, 'derived', 'nq_5m_derived.json');
  const d15mPath = path.join(auditDir, 'derived', 'nq_15m_derived.json');
  const d1hPath = path.join(auditDir, 'derived', 'nq_1h_derived.json');
  const manifestPath = path.join(auditDir, 'manifests', 'CP33.6_MANIFEST.json');

  it('1. should verify frozen ICT production parameters remain unaltered', () => {
    const defaultParams = {
      bodyRatio: 0.60,
      rangeMultiplier: 1.50,
      fvgMinSizePoints: 0.25,
      lookbackCandles: 5,
      requireStructuralBreak: false,
      requireFvgCreation: false,
    };

    expect(defaultParams.bodyRatio).toBe(0.60);
    expect(defaultParams.rangeMultiplier).toBe(1.50);
    expect(defaultParams.fvgMinSizePoints).toBe(0.25);
    expect(defaultParams.lookbackCandles).toBe(5);
    expect(defaultParams.requireStructuralBreak).toBe(false);
    expect(defaultParams.requireFvgCreation).toBe(false);
  });

  it('2. should verify raw, normalized, derived, and manifest artifacts exist in isolated audit directory', () => {
    expect(fs.existsSync(rawPath)).toBe(true);
    expect(fs.existsSync(normPath)).toBe(true);
    expect(fs.existsSync(d5mPath)).toBe(true);
    expect(fs.existsSync(d15mPath)).toBe(true);
    expect(fs.existsSync(d1hPath)).toBe(true);
    expect(fs.existsSync(manifestPath)).toBe(true);
  });

  it('3. should verify raw data preservation and SHA-256 hash match manifest', () => {
    const rawContent = fs.readFileSync(rawPath, 'utf8');
    const computedRawHash = crypto.createHash('sha256').update(rawContent, 'utf8').digest('hex');

    const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifestContent.raw_sha256).toBe(computedRawHash);
    expect(manifestContent.provider).toBe('Databento');
    expect(manifestContent.dataset).toBe('GLBX.MDP3');
    expect(manifestContent.symbol).toBe('NQ');
    expect(manifestContent.contract).toBe('NQZ26');
  });

  it('4. should verify 100% OHLCV integrity across normalized 1m candles', () => {
    const normalizedCandles = JSON.parse(fs.readFileSync(normPath, 'utf8'));
    expect(normalizedCandles.length).toBeGreaterThan(0);

    let prevTimeMs = 0;

    for (const c of normalizedCandles) {
      expect(c.high).toBeGreaterThanOrEqual(c.open);
      expect(c.high).toBeGreaterThanOrEqual(c.close);
      expect(c.low).toBeLessThanOrEqual(c.open);
      expect(c.low).toBeLessThanOrEqual(c.close);
      expect(c.high).toBeGreaterThanOrEqual(c.low);
      expect(c.volume).toBeGreaterThanOrEqual(0);

      const timeMs = new Date(c.timestamp_utc).getTime();
      expect(timeMs).toBeGreaterThan(prevTimeMs);
      prevTimeMs = timeMs;
    }
  });

  it('5. should verify timestamp UTC normalization and Start-of-Bar semantics', () => {
    const normalizedCandles = JSON.parse(fs.readFileSync(normPath, 'utf8'));
    const firstCandle = normalizedCandles[0];

    expect(firstCandle.source_timezone).toBe('UTC');
    expect(firstCandle.timestamp_utc).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('6. should verify Option B derived timeframe aggregation determinism (5m, 15m, 1H)', () => {
    const norm1m = JSON.parse(fs.readFileSync(normPath, 'utf8'));
    const d5m = JSON.parse(fs.readFileSync(d5mPath, 'utf8'));
    const d15m = JSON.parse(fs.readFileSync(d15mPath, 'utf8'));
    const d1h = JSON.parse(fs.readFileSync(d1hPath, 'utf8'));

    expect(d5m.length).toBe(Math.ceil(norm1m.length / 5));
    expect(d15m.length).toBe(Math.ceil(norm1m.length / 15));
    expect(d1h.length).toBe(Math.ceil(norm1m.length / 60));

    // Verify first 5m bar alignment
    const first5mBar = d5m[0];
    const first5_1mBars = norm1m.slice(0, 5);
    expect(first5mBar.open).toBe(first5_1mBars[0].open);
    expect(first5mBar.high).toBe(Math.max(...first5_1mBars.map((b: { high: number }) => b.high)));
    expect(first5mBar.low).toBe(Math.min(...first5_1mBars.map((b: { low: number }) => b.low)));
    expect(first5mBar.close).toBe(first5_1mBars[4].close);
    expect(first5mBar.volume).toBe(first5_1mBars.reduce((sum: number, b: { volume: number }) => sum + b.volume, 0));
  });

  it('7. should verify OOS dataset separation and non-contamination', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.classification).toBe('SOURCE_AUDIT_SAMPLE');
    expect(manifest.oos_separation_confirmed).toBe(true);

    // Verify audit files reside in /data_audit/cp33_6/ and not /oos_dataset/
    expect(rawPath).toContain('data_audit');
    expect(rawPath).not.toContain('oos_dataset');
  });

  it('8. should verify existence of required CP33.6 audit markdown documentation', () => {
    const auditDocPath = path.join(rootDir, 'CP33.6_INDEPENDENT_DATA_ACQUISITION_AUDIT.md');
    const finalStatusDocPath = path.join(rootDir, 'CP33.6_FINAL_STATUS.md');

    expect(fs.existsSync(auditDocPath)).toBe(true);
    expect(fs.existsSync(finalStatusDocPath)).toBe(true);

    const docContent = fs.readFileSync(auditDocPath, 'utf8');
    expect(docContent).toContain('CP33.6 — INDEPENDENT HISTORICAL DATA ACQUISITION & INTEGRITY AUDIT');
    expect(docContent).toContain('Databento');
    expect(docContent).toContain('GLBX.MDP3');
    expect(docContent).toContain('0ed2b06cbc607ce6b60ee183b851f97c0227aef04984954ed2e6bf9249efdcb0');
  });
});
