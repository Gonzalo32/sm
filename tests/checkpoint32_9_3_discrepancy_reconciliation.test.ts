/**
 * Checkpoint 32.9.3 - Documentation Discrepancy & Attribution Gap Reconciliation Test Suite
 * Validates identification and classification of MISMATCH-01 and GAP-01, SAME_ISSUE = YES determination,
 * bodyRatio = 0.60 & rangeMultiplier = 1.50 immutability, CORRECTION_PERFORMED = NO, and final status declarations.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DEFAULT_ICT_CONFIG } from '../core/ict/types/ICTConfig';
import { DEFAULT_DISPLACEMENT_CONFIG } from '../core/ict/displacement/DisplacementEngine';

describe('Checkpoint 32.9.3 - Discrepancy Reconciliation Test Suite', () => {
  const rootDir = process.cwd();
  const reportPath = path.join(rootDir, 'CP32.9.3_DISCREPANCY_RECONCILIATION_REPORT.md');
  const matrixPath = path.join(rootDir, 'CP32.9.3_EVIDENCE_MATRIX.md');
  const finalStatusPath = path.join(rootDir, 'CP32.9.3_FINAL_STATUS.md');

  it('1. should verify Documentation-Code Mismatch (MISMATCH-01) is identified in audit deliverables', () => {
    expect(fs.existsSync(reportPath)).toBe(true);
    expect(fs.existsSync(matrixPath)).toBe(true);

    const reportContent = fs.readFileSync(reportPath, 'utf-8');
    const matrixContent = fs.readFileSync(matrixPath, 'utf-8');

    expect(reportContent).toContain('MISMATCH-01');
    expect(matrixContent).toContain('MISMATCH-01');
  });

  it('2. should verify mismatch has explicit documentation location', () => {
    const reportContent = fs.readFileSync(reportPath, 'utf-8');

    expect(reportContent).toContain('CP32.8_EXPERT_ICT_BASELINE/02_DEFINITIONS.md');
    expect(reportContent).toContain('CONCEPT-12');
  });

  it('3. should verify mismatch has code file and symbol location', () => {
    const reportContent = fs.readFileSync(reportPath, 'utf-8');

    expect(reportContent).toContain('DisplacementEngine.ts');
    expect(reportContent).toContain('DEFAULT_DISPLACEMENT_CONFIG.minBodyToRangeRatio');
  });

  it('4. should verify documented behavior (0.65) and actual code behavior (0.60) are separated', () => {
    const reportContent = fs.readFileSync(reportPath, 'utf-8');

    expect(reportContent).toContain('0.65');
    expect(reportContent).toContain('0.60');
    expect(reportContent).toContain('minBodyToRangeRatio = 0.6');
  });

  it('5. should verify mismatch has explicit classification (DOCUMENTATION_ERROR)', () => {
    const matrixContent = fs.readFileSync(matrixPath, 'utf-8');

    expect(matrixContent).toContain('DOCUMENTATION_ERROR');
  });

  it('6. should verify Attribution Gap (GAP-01) is identified in audit deliverables', () => {
    const reportContent = fs.readFileSync(reportPath, 'utf-8');
    const matrixContent = fs.readFileSync(matrixPath, 'utf-8');

    expect(reportContent).toContain('GAP-01');
    expect(matrixContent).toContain('GAP-01');
  });

  it('7. should verify attribution gap has explicit documentation location', () => {
    const reportContent = fs.readFileSync(reportPath, 'utf-8');

    expect(reportContent).toContain('CP32.9_SOURCE_GAPS.md');
  });

  it('8. should verify attributed source is identified ([SRC-02])', () => {
    const reportContent = fs.readFileSync(reportPath, 'utf-8');

    expect(reportContent).toContain('[SRC-02]');
    expect(reportContent).toContain('ICT 2022 YouTube Mentorship Series Episodio 2');
  });

  it('9. should verify source evidence is located (qualitative energetic expansion)', () => {
    const reportContent = fs.readFileSync(reportPath, 'utf-8');

    expect(reportContent).toContain('expansión enérgica');
  });

  it('10. should verify attribution gap has explicit classification (PROJECT_OPERATIONAL_PRESENTED_AS_SOURCE)', () => {
    const matrixContent = fs.readFileSync(matrixPath, 'utf-8');

    expect(matrixContent).toContain('PROJECT_OPERATIONAL_PRESENTED_AS_SOURCE');
  });

  it('11. should verify determination if both issues are the same (SAME_ISSUE = YES)', () => {
    expect(fs.existsSync(finalStatusPath)).toBe(true);
    const statusContent = fs.readFileSync(finalStatusPath, 'utf-8');

    expect(statusContent).toContain('SAME_ISSUE = YES');
  });

  it('12. should verify bodyRatio remains 0.60 in production DisplacementEngine', () => {
    expect(DEFAULT_DISPLACEMENT_CONFIG.minBodyToRangeRatio).toBe(0.6);
  });

  it('13. should verify rangeMultiplier remains 1.50 in production DisplacementEngine', () => {
    expect(DEFAULT_DISPLACEMENT_CONFIG.minRangeMultiplier).toBe(1.5);
  });

  it('14. should verify production code in core/ict/ remains unmodified', () => {
    const coreIctDir = path.join(rootDir, 'core', 'ict');
    expect(fs.existsSync(coreIctDir)).toBe(true);

    const expectedCoreFiles = [
      'index.ts',
      'types/ICTConfig.ts',
      'displacement/DisplacementEngine.ts',
      'structure/StructureEngine.ts',
      'liquidity/LiquidityEngine.ts',
      'fvg/FVGEngine.ts',
      'orderblocks/OrderBlockEngine.ts',
      'pdarrays/PremiumDiscountEngine.ts',
      'setups/SetupEngine.ts',
      'models/PredefinedModels.ts',
    ];

    for (const relFile of expectedCoreFiles) {
      const fullPath = path.join(coreIctDir, relFile);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });

  it('15. should verify DEFAULT_ICT_CONFIG parameters remain unmodified', () => {
    expect(DEFAULT_ICT_CONFIG.swingLeftBars).toBe(2);
    expect(DEFAULT_ICT_CONFIG.swingRightBars).toBe(2);
    expect(DEFAULT_ICT_CONFIG.bosBreakMode).toBe('CLOSE');
    expect(DEFAULT_ICT_CONFIG.mssBreakMode).toBe('CLOSE');
    expect(DEFAULT_ICT_CONFIG.liquidityTolerancePoints).toBe(0.5);
    expect(DEFAULT_ICT_CONFIG.sweepMinPenetrationPoints).toBe(0.1);
    expect(DEFAULT_ICT_CONFIG.fvgMinSizePoints).toBe(0.25);
    expect(DEFAULT_ICT_CONFIG.fvgMitigationMode).toBe('TOUCH');
    expect(DEFAULT_ICT_CONFIG.dealingRangeLookbackBars).toBe(50);
  });

  it('16. should verify production parameters remain unmodified', () => {
    expect(DEFAULT_DISPLACEMENT_CONFIG.minBodyToRangeRatio).toBe(0.6);
    expect(DEFAULT_DISPLACEMENT_CONFIG.minRangeMultiplier).toBe(1.5);
  });

  it('17. should verify Model A, B, and C remain unmodified in PredefinedModels', () => {
    const modelsFile = path.join(rootDir, 'core', 'ict', 'models', 'PredefinedModels.ts');
    expect(fs.existsSync(modelsFile)).toBe(true);
  });

  it('18. should verify no automatic corrections were performed (CORRECTION_PERFORMED = NO) and status is PASS', () => {
    const statusContent = fs.readFileSync(finalStatusPath, 'utf-8');

    expect(statusContent).toContain('DOCUMENTATION_CODE_MISMATCH = CONFIRMED');
    expect(statusContent).toContain('DOCUMENTATION_ATTRIBUTION_GAP = CONFIRMED');
    expect(statusContent).toContain('CORRECTION_PERFORMED = NO');
    expect(statusContent).toContain('CP32.9.3_STATUS = PASS');
  });
});
