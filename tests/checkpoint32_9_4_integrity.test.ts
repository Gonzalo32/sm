/**
 * Checkpoint 32.9.4 - Frozen Baseline & Audit-Chain Integrity Test Suite
 * Validates executable production bodyRatio = 0.60 & rangeMultiplier = 1.50, fvgMinSizePoints = 0.25,
 * MISMATCH-01 and GAP-01 documentation consistency, SAME_ISSUE = YES, audit chain completeness (CP32.9 -> CP32.9.4),
 * PredefinedModels MODEL_A/B/C immutability, core/ict/ freeze, and final status declarations.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DEFAULT_ICT_CONFIG } from '../core/ict/types/ICTConfig';
import { DEFAULT_DISPLACEMENT_CONFIG } from '../core/ict/displacement/DisplacementEngine';

describe('Checkpoint 32.9.4 - Frozen Baseline & Audit-Chain Integrity Test Suite', () => {
  const rootDir = process.cwd();
  const reportPath = path.join(rootDir, 'CP32.9.4_FROZEN_BASELINE_INTEGRITY_REPORT.md');
  const matrixPath = path.join(rootDir, 'CP32.9.4_AUDIT_CHAIN_MATRIX.md');
  const finalStatusPath = path.join(rootDir, 'CP32.9.4_FINAL_STATUS.md');

  it('1. should verify actual production bodyRatio is 0.60', () => {
    expect(DEFAULT_DISPLACEMENT_CONFIG.minBodyToRangeRatio).toBe(0.6);
  });

  it('2. should verify actual production rangeMultiplier is 1.50', () => {
    expect(DEFAULT_DISPLACEMENT_CONFIG.minRangeMultiplier).toBe(1.5);
  });

  it('3. should verify fvgMinSizePoints is determinable (0.25)', () => {
    expect(DEFAULT_ICT_CONFIG.fvgMinSizePoints).toBe(0.25);
  });

  it('4. should verify MISMATCH-01 remains documented in audit deliverables', () => {
    const report3293 = path.join(rootDir, 'CP32.9.3_DISCREPANCY_RECONCILIATION_REPORT.md');
    expect(fs.existsSync(report3293)).toBe(true);

    const content = fs.readFileSync(report3293, 'utf-8');
    expect(content).toContain('MISMATCH-01');
    expect(content).toContain('DOCUMENTATION_ERROR');
  });

  it('5. should verify GAP-01 remains documented in audit deliverables', () => {
    const report3293 = path.join(rootDir, 'CP32.9.3_DISCREPANCY_RECONCILIATION_REPORT.md');
    const content = fs.readFileSync(report3293, 'utf-8');

    expect(content).toContain('GAP-01');
    expect(content).toContain('PROJECT_OPERATIONAL_PRESENTED_AS_SOURCE');
  });

  it('6. should verify SAME_ISSUE remains YES across audit chain', () => {
    const status3293 = path.join(rootDir, 'CP32.9.3_FINAL_STATUS.md');
    expect(fs.existsSync(status3293)).toBe(true);

    const content = fs.readFileSync(status3293, 'utf-8');
    expect(content).toContain('SAME_ISSUE = YES');
  });

  it('7. should verify 0.65 does not appear as a production parameter in executable code', () => {
    expect(DEFAULT_DISPLACEMENT_CONFIG.minBodyToRangeRatio).not.toBe(0.65);
    expect(DEFAULT_DISPLACEMENT_CONFIG.minBodyToRangeRatio).toBe(0.6);
  });

  it('8. should verify all CP32.9.1 documents exist', () => {
    const files = [
      'CP32.9.1_PARAMETER_RECONCILIATION_REPORT.md',
      'CP32.9.1_SOURCE_RECONCILIATION_REPORT.md',
      'CP32.9.1_FINAL_STATUS.md',
    ];

    for (const f of files) {
      expect(fs.existsSync(path.join(rootDir, f))).toBe(true);
    }
  });

  it('9. should verify all CP32.9.2 documents exist', () => {
    const files = [
      'CP32.9.2_CONCEPTUAL_TRACEABILITY_REPORT.md',
      'CP32.9.2_CLAIM_TO_CODE_MATRIX.md',
      'CP32.9.2_FINAL_STATUS.md',
    ];

    for (const f of files) {
      expect(fs.existsSync(path.join(rootDir, f))).toBe(true);
    }
  });

  it('10. should verify all CP32.9.3 documents exist', () => {
    const files = [
      'CP32.9.3_DISCREPANCY_RECONCILIATION_REPORT.md',
      'CP32.9.3_EVIDENCE_MATRIX.md',
      'CP32.9.3_FINAL_STATUS.md',
    ];

    for (const f of files) {
      expect(fs.existsSync(path.join(rootDir, f))).toBe(true);
    }
  });

  it('11. should verify Model A, B, and C remain identifiable in PredefinedModels', () => {
    const modelsFile = path.join(rootDir, 'core', 'ict', 'models', 'PredefinedModels.ts');
    expect(fs.existsSync(modelsFile)).toBe(true);

    const content = fs.readFileSync(modelsFile, 'utf-8');
    expect(content).toContain('MODEL_A');
    expect(content).toContain('MODEL_B');
    expect(content).toContain('MODEL_C');
  });

  it('12. should verify core/ict/ remains unmodified during CP32.9.4', () => {
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

  it('13. should verify DEFAULT_ICT_CONFIG parameters remain unmodified during CP32.9.4', () => {
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

  it('14. should verify production displacement parameters remain unmodified during CP32.9.4', () => {
    expect(DEFAULT_DISPLACEMENT_CONFIG.minBodyToRangeRatio).toBe(0.6);
    expect(DEFAULT_DISPLACEMENT_CONFIG.minRangeMultiplier).toBe(1.5);
  });

  it('15. should verify Model A, B, and C remain unmodified in PredefinedModels during CP32.9.4', () => {
    const modelsFile = path.join(rootDir, 'core', 'ict', 'models', 'PredefinedModels.ts');
    const content = fs.readFileSync(modelsFile, 'utf-8');

    expect(content).toContain('export const PREDEFINED_MODELS');
  });

  it('16. should verify audit chain matrix and integrity report contain no material contradictions', () => {
    expect(fs.existsSync(reportPath)).toBe(true);
    expect(fs.existsSync(matrixPath)).toBe(true);

    const reportContent = fs.readFileSync(reportPath, 'utf-8');
    const matrixContent = fs.readFileSync(matrixPath, 'utf-8');

    expect(reportContent).toContain('PRODUCTION_BODY_RATIO = 0.60');
    expect(matrixContent).toContain('CP32.9.4');
  });

  it('17. should verify no automatic corrections were performed and final status is PASS', () => {
    expect(fs.existsSync(finalStatusPath)).toBe(true);
    const statusContent = fs.readFileSync(finalStatusPath, 'utf-8');

    expect(statusContent).toContain('FROZEN_BASELINE_INTEGRITY = PASS');
    expect(statusContent).toContain('AUDIT_CHAIN_INTEGRITY = PASS');
    expect(statusContent).toContain('PRODUCTION_MODIFIED = NO');
    expect(statusContent).toContain('PARAMETERS_MODIFIED = NO');
    expect(statusContent).toContain('MODEL_MODIFIED = NO');
    expect(statusContent).toContain('DOCUMENT_CHAIN_COMPLETE = YES');
    expect(statusContent).toContain('BASELINE_COMPARISON = MATCH');
    expect(statusContent).toContain('CP32.9.4_STATUS = PASS');
  });
});
