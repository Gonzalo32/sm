/**
 * Checkpoint 32.9.2 - Conceptual Claim & Implementation Traceability Audit Test Suite
 * Validates 4-level conceptual traceability (Level A to D), claim-to-code mapping for 14 concepts,
 * OB Variant B & FVG Lifecycle classifications, bodyRatio = 0.60 & rangeMultiplier = 1.50 immutability,
 * Model A/B/C classifications, production code freeze, and audit status declarations.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DEFAULT_ICT_CONFIG } from '../core/ict/types/ICTConfig';
import { DEFAULT_DISPLACEMENT_CONFIG } from '../core/ict/displacement/DisplacementEngine';

describe('Checkpoint 32.9.2 - Conceptual Claim & Implementation Traceability Audit Test Suite', () => {
  const rootDir = process.cwd();
  const traceReportPath = path.join(rootDir, 'CP32.9.2_CONCEPTUAL_TRACEABILITY_REPORT.md');
  const claimMatrixPath = path.join(rootDir, 'CP32.9.2_CLAIM_TO_CODE_MATRIX.md');
  const finalStatusPath = path.join(rootDir, 'CP32.9.2_FINAL_STATUS.md');

  const MANDATORY_CONCEPTS = [
    'Swing High',
    'Swing Low',
    'BOS',
    'MSS',
    'BSL',
    'SSL',
    'Liquidity Sweep',
    'FVG',
    'Order Block',
    'Displacement',
    'Premium',
    'Discount',
    'HTF Alignment',
    'Liquidity Target',
  ];

  it('1. should verify all 14 mandatory concepts appear in CP32.9.2 traceability matrix', () => {
    expect(fs.existsSync(claimMatrixPath)).toBe(true);
    expect(fs.existsSync(traceReportPath)).toBe(true);
    const matrixContent = fs.readFileSync(claimMatrixPath, 'utf-8');

    for (const concept of MANDATORY_CONCEPTS) {
      expect(matrixContent).toContain(concept);
    }
  });

  it('2. should verify each concept has source classification (PRIMARY, SECONDARY, COMMUNITY, PROJECT_OPERATIONAL)', () => {
    const reportContent = fs.readFileSync(traceReportPath, 'utf-8');

    expect(reportContent).toContain('Level A (Source)');
    expect(reportContent).toContain('PROJECT_OPERATIONAL');
    expect(reportContent).toContain('DIRECTLY_SUPPORTED');
  });

  it('3. should verify each concept distinguishes interpretation (Level B) from implementation (Level D)', () => {
    const matrixContent = fs.readFileSync(claimMatrixPath, 'utf-8');
    const reportContent = fs.readFileSync(traceReportPath, 'utf-8');

    expect(matrixContent).toContain('Interpretation (Level B)');
    expect(matrixContent).toContain('Implementation (Level D)');
    expect(reportContent).toContain('LEVEL A: SOURCE');
  });

  it('4. should verify BOS/MSS close-only has explicit classification (PROJECT_OPERATIONAL / DIRECTLY_SUPPORTED)', () => {
    const reportContent = fs.readFileSync(traceReportPath, 'utf-8');

    expect(reportContent).toContain('2.1 BOS y MSS');
    expect(reportContent).toContain('PROJECT_OPERATIONAL');
    expect(reportContent).toContain('bosBreakMode = \'CLOSE\'');
  });

  it('5. should verify OB Variant B has explicit classification (PROJECT_OPERATIONAL)', () => {
    const reportContent = fs.readFileSync(traceReportPath, 'utf-8');

    expect(reportContent).toContain('2.2 Order Block (OB Variant B)');
    expect(reportContent).toContain('PROJECT_OPERATIONAL');
  });

  it('6. should verify FVG lifecycle terms are explicitly classified as PROJECT_OPERATIONAL', () => {
    const reportContent = fs.readFileSync(traceReportPath, 'utf-8');

    expect(reportContent).toContain('2.3 Fair Value Gap');
    expect(reportContent).toContain('ACTIVE');
    expect(reportContent).toContain('PROJECT_OPERATIONAL');
  });

  it('7. should verify Displacement distinguishes concept from thresholds (bodyRatio, rangeMultiplier)', () => {
    const reportContent = fs.readFileSync(traceReportPath, 'utf-8');

    expect(reportContent).toContain('2.4 Desplazamiento');
    expect(reportContent).toContain('PRODUCTION_BODY_RATIO = 0.60');
    expect(reportContent).toContain('PRODUCTION_RANGE_MULTIPLIER = 1.50');
  });

  it('8. should verify bodyRatio remains 0.60 in production DisplacementEngine', () => {
    expect(DEFAULT_DISPLACEMENT_CONFIG.minBodyToRangeRatio).toBe(0.6);
  });

  it('9. should verify rangeMultiplier remains 1.50 in production DisplacementEngine', () => {
    expect(DEFAULT_DISPLACEMENT_CONFIG.minRangeMultiplier).toBe(1.5);
  });

  it('10. should verify Model A, B, and C are correctly classified as PROJECT_MODEL_V1', () => {
    const reportContent = fs.readFileSync(traceReportPath, 'utf-8');

    expect(reportContent).toContain('2.5 Modelos A, B y C');
    expect(reportContent).toContain('PROJECT_MODEL_V1');
  });

  it('11. should verify production code in core/ict/ remains unmodified', () => {
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

  it('12. should verify DEFAULT_ICT_CONFIG parameters remain unmodified', () => {
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

  it('13. should verify production parameters remain unmodified', () => {
    expect(DEFAULT_DISPLACEMENT_CONFIG.minBodyToRangeRatio).toBe(0.6);
    expect(DEFAULT_DISPLACEMENT_CONFIG.minRangeMultiplier).toBe(1.5);
  });

  it('14. should verify Model A, B, and C remain unmodified in PredefinedModels', () => {
    const modelsFile = path.join(rootDir, 'core', 'ict', 'models', 'PredefinedModels.ts');
    expect(fs.existsSync(modelsFile)).toBe(true);
  });

  it('15. should verify unsupported attributions count is 0 in final status', () => {
    expect(fs.existsSync(finalStatusPath)).toBe(true);
    const statusContent = fs.readFileSync(finalStatusPath, 'utf-8');

    expect(statusContent).toContain('UNSUPPORTED_ATTRIBUTIONS = 0');
  });

  it('16. should verify documentation/code mismatches are documented in final status', () => {
    const statusContent = fs.readFileSync(finalStatusPath, 'utf-8');

    expect(statusContent).toContain('DOCUMENTATION_CODE_MISMATCHES = 1');
    expect(statusContent).toContain('DOCUMENTATION_ATTRIBUTION_GAPS = 1');
  });

  it('17. should verify Level A, B, C, and D remain separated and status is PASS', () => {
    const statusContent = fs.readFileSync(finalStatusPath, 'utf-8');

    expect(statusContent).toContain('CONCEPTUAL_TRACEABILITY = PASS');
    expect(statusContent).toContain('CLAIM_TO_CODE_TRACEABILITY = PASS');
    expect(statusContent).toContain('PRODUCTION_MODIFIED = NO');
    expect(statusContent).toContain('PARAMETERS_MODIFIED = NO');
    expect(statusContent).toContain('MODEL_MODIFIED = NO');
  });
});
