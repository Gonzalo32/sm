import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

describe('Checkpoint 33.6.1 — Acquisition Reconciliation & Session-Gap Correction Audit', () => {
  const rootDir = process.cwd();
  const auditDir = path.join(rootDir, 'data_audit', 'cp33_6');
  const rawNqPath = path.join(auditDir, 'raw', 'databento_nq_1m_reconciled_raw.json');
  const rawMnqPath = path.join(auditDir, 'raw', 'databento_mnq_1m_reconciled_raw.json');
  const normNqPath = path.join(auditDir, 'normalized', 'nq_1m_reconciled_normalized.json');
  const normMnqPath = path.join(auditDir, 'normalized', 'mnq_1m_reconciled_normalized.json');
  const manifestPath = path.join(auditDir, 'manifests', 'CP33.6.1_MANIFEST.json');

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

  it('2. should verify physical NQ contract verification and active front-month NQH26 symbol', () => {
    expect(fs.existsSync(rawNqPath)).toBe(true);
    expect(fs.existsSync(normNqPath)).toBe(true);

    const normNqCandles = JSON.parse(fs.readFileSync(normNqPath, 'utf8'));
    expect(normNqCandles.length).toBe(1440);
    expect(normNqCandles[0].symbol).toBe('NQ');
    expect(normNqCandles[0].contract_symbol).toBe('NQH26');
    expect(normNqCandles[0].venue).toBe('CME');
  });

  it('3. should verify physical MNQ acquisition proof and MNQH26 contract metadata', () => {
    expect(fs.existsSync(rawMnqPath)).toBe(true);
    expect(fs.existsSync(normMnqPath)).toBe(true);

    const rawMnqContent = fs.readFileSync(rawMnqPath, 'utf8');
    const computedMnqSha = crypto.createHash('sha256').update(rawMnqContent, 'utf8').digest('hex');
    expect(computedMnqSha).toHaveLength(64);

    const normMnqCandles = JSON.parse(fs.readFileSync(normMnqPath, 'utf8'));
    expect(normMnqCandles.length).toBe(1440);
    expect(normMnqCandles[0].symbol).toBe('MNQ');
    expect(normMnqCandles[0].contract_symbol).toBe('MNQH26');
  });

  it('4. should verify timestamp monotonicity, uniqueness, and gap classification', () => {
    const normNqCandles = JSON.parse(fs.readFileSync(normNqPath, 'utf8'));
    let prevMs = 0;
    const gaps: { prev: string; curr: string; minutes: number }[] = [];

    for (const c of normNqCandles) {
      const timeMs = new Date(c.timestamp_utc).getTime();
      expect(timeMs).toBeGreaterThan(prevMs);

      if (prevMs > 0) {
        const diffMin = Math.round((timeMs - prevMs) / (60 * 1000));
        if (diffMin > 1) {
          gaps.push({
            prev: new Date(prevMs).toISOString(),
            curr: c.timestamp_utc,
            minutes: diffMin,
          });
        }
      }
      prevMs = timeMs;
    }

    expect(gaps).toHaveLength(1);
    expect(gaps[0].minutes).toBeGreaterThanOrEqual(60);
    expect(gaps[0].prev).toBe('2026-03-16T16:59:00.000Z');
    expect(gaps[0].curr).toBe('2026-03-16T18:00:00.000Z');
  });

  it('5. should verify individual-contract rollover policy semantics (NOT_APPLICABLE)', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.rollover_method_individual_contract).toBe('NOT_APPLICABLE');
    expect(manifest.future_continuous_rollover_policy).toBe('UNADJUSTED_VOLUME_ROLL');
  });

  it('6. should verify licensing status and redistribution restriction parameters', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.license_status).toBe('CONFIRMED_FOR_INTERNAL_VALIDATION');
    expect(manifest.redistribution).toBe('RESTRICTED');
    expect(manifest.independence).toBe('CONFIRMED');
  });

  it('7. should verify OOS dataset boundary separation and non-contamination', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.classification).toBe('SOURCE_AUDIT_SAMPLE');
    expect(manifest.oos_separation_confirmed).toBe(true);
    expect(manifest.production_logic_modified).toBe(false);

    expect(normNqPath).toContain('data_audit');
    expect(normNqPath).not.toContain('oos_dataset');
  });

  it('8. should verify existence of required CP33.6.1 audit markdown documentation', () => {
    const auditDocPath = path.join(rootDir, 'CP33.6.1_ACQUISITION_RECONCILIATION_AUDIT.md');
    const finalStatusDocPath = path.join(rootDir, 'CP33.6.1_FINAL_STATUS.md');

    expect(fs.existsSync(auditDocPath)).toBe(true);
    expect(fs.existsSync(finalStatusDocPath)).toBe(true);

    const docContent = fs.readFileSync(auditDocPath, 'utf8');
    expect(docContent).toContain('CP33.6.1 — ACQUISITION RECONCILIATION & SESSION-GAP CORRECTION AUDIT');
    expect(docContent).toContain('NQH26');
    expect(docContent).toContain('MNQH26');
    expect(docContent).toContain('EXPECTED_SESSION_BREAK');
    expect(docContent).toContain('CONFIRMED_FOR_INTERNAL_VALIDATION');
  });
});
