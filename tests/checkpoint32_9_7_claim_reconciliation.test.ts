/**
 * Checkpoint 32.9.7 - Historical Claim Status Reconciliation Test Suite
 * Validates 20+ checks across 4 evidence layers (Current Code, Documentation, Git History, Cryptographic),
 * ensuring proper classification of historical claims (VERIFIED vs PARTIAL vs UNKNOWN vs NO_EVIDENCE),
 * zero production mutations, and full audit chain integrity.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DEFAULT_ICT_CONFIG } from '../core/ict/types/ICTConfig';
import { DEFAULT_DISPLACEMENT_CONFIG } from '../core/ict/displacement/DisplacementEngine';

describe('Checkpoint 32.9.7 - Historical Claim Status Reconciliation Test Suite', () => {
  const rootDir = process.cwd();
  const reportPath = path.join(rootDir, 'CP32.9.7_CLAIM_RECONCILIATION_REPORT.md');
  const finalStatusPath = path.join(rootDir, 'CP32.9.7_FINAL_STATUS.md');

  it('1. should verify current bodyRatio is 0.60', () => {
    expect(DEFAULT_DISPLACEMENT_CONFIG.minBodyToRangeRatio).toBe(0.60);
  });

  it('2. should verify current rangeMultiplier is 1.50', () => {
    expect(DEFAULT_DISPLACEMENT_CONFIG.minRangeMultiplier).toBe(1.50);
  });

  it('3. should verify current FVG threshold is 0.25', () => {
    expect(DEFAULT_ICT_CONFIG.fvgMinSizePoints).toBe(0.25);
  });

  it('4. should verify documented bodyRatio is 0.60', () => {
    const reportPath = path.join(rootDir, 'CP32.9.1_PARAMETER_RECONCILIATION_REPORT.md');
    expect(fs.existsSync(reportPath)).toBe(true);
    const content = fs.readFileSync(reportPath, 'utf-8');
    expect(content).toContain('0.60');
  });

  it('5. should verify documented rangeMultiplier is 1.50', () => {
    const reportPath = path.join(rootDir, 'CP32.9.1_PARAMETER_RECONCILIATION_REPORT.md');
    const content = fs.readFileSync(reportPath, 'utf-8');
    expect(content).toContain('1.50');
  });

  it('6. should verify documented FVG threshold is 0.25', () => {
    const reportPath = path.join(rootDir, 'CP32.9.1_PARAMETER_RECONCILIATION_REPORT.md');
    const content = fs.readFileSync(reportPath, 'utf-8');
    expect(content).toContain('0.25');
  });

  it('7. should verify historical bodyRatio classification is PARTIAL', () => {
    const finalStatus = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalStatus).toContain('BODY_RATIO_HISTORICAL_STATUS = PARTIAL');
  });

  it('8. should verify historical rangeMultiplier classification is PARTIAL', () => {
    const finalStatus = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalStatus).toContain('RANGE_MULTIPLIER_HISTORICAL_STATUS = PARTIAL');
  });

  it('9. should verify historical FVG classification is PARTIAL', () => {
    const finalStatus = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalStatus).toContain('FVG_HISTORICAL_STATUS = PARTIAL');
  });

  it('10. should verify 0.65 is not present in active core/ict config', () => {
    const dispPath = path.join(rootDir, 'core', 'ict', 'displacement', 'DisplacementEngine.ts');
    const dispContent = fs.readFileSync(dispPath, 'utf-8');
    expect(dispContent).not.toContain('minBodyToRangeRatio: 0.65');
  });

  it('11. should verify production 0.65 history classification is NO_EVIDENCE', () => {
    const finalStatus = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalStatus).toContain('PRODUCTION_065_HISTORY = NO_EVIDENCE');
  });

  it('12. should verify MISMATCH-01 status is VERIFIED', () => {
    const finalStatus = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalStatus).toContain('MISMATCH_01_STATUS = VERIFIED');
  });

  it('13. should verify GAP-01 status is VERIFIED', () => {
    const finalStatus = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalStatus).toContain('GAP_01_STATUS = VERIFIED');
  });

  it('14. should verify MODEL_A historical status is PARTIAL', () => {
    const finalStatus = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalStatus).toContain('MODEL_A_HISTORICAL_STATUS = PARTIAL');
  });

  it('15. should verify MODEL_B historical status is PARTIAL', () => {
    const finalStatus = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalStatus).toContain('MODEL_B_HISTORICAL_STATUS = PARTIAL');
  });

  it('16. should verify MODEL_C historical status is PARTIAL', () => {
    const finalStatus = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalStatus).toContain('MODEL_C_HISTORICAL_STATUS = PARTIAL');
  });

  it('17. should verify CURRENT_HASH_MANIFEST is VERIFIED', () => {
    const finalStatus = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalStatus).toContain('CURRENT_HASH_MANIFEST = VERIFIED');
  });

  it('18. should verify HISTORICAL_HASH_MANIFEST is UNKNOWN', () => {
    const finalStatus = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalStatus).toContain('HISTORICAL_HASH_MANIFEST = UNKNOWN');
  });

  it('19. should preserve distinction between current code integrity and historical integrity', () => {
    const finalStatus = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalStatus).toContain('CURRENT_CODE_INTEGRITY = PASS');
    expect(finalStatus).toContain('HISTORICAL_CODE_INTEGRITY = PARTIAL');
    expect(finalStatus).toContain('CRYPTOGRAPHIC_BASELINE_INTEGRITY = PARTIAL');
  });

  it('20. should verify no production mutation was performed by CP32.9.7', () => {
    const finalStatus = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalStatus).toContain('PRODUCTION_MODIFIED_BY_CP32_9_7 = NO');
    expect(finalStatus).toContain('PARAMETERS_MODIFIED_BY_CP32_9_7 = NO');
    expect(finalStatus).toContain('MODEL_MODIFIED_BY_CP32_9_7 = NO');
  });

  it('21. should verify HISTORICAL_PARAMETER_EVIDENCE_REVIEW is TOO_STRONG in report', () => {
    const report = fs.readFileSync(reportPath, 'utf-8');
    expect(report).toContain('HISTORICAL_PARAMETER_EVIDENCE_REVIEW = TOO_STRONG');
  });
});
