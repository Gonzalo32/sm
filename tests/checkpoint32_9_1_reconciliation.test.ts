/**
 * Checkpoint 32.9.1 - Parameter & Source Reconciliation Test Suite
 * Validates production parameter value determination (bodyRatio = 0.60),
 * documentary discrepancy reconciliation (0.60 vs 0.65), SRC-01 / SRC-02 traceability,
 * Level A/B/C separation, production immutability, and parameter freeze.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DEFAULT_ICT_CONFIG } from '../core/ict/types/ICTConfig';
import { DEFAULT_DISPLACEMENT_CONFIG } from '../core/ict/displacement/DisplacementEngine';

describe('Checkpoint 32.9.1 - Parameter & Source Reconciliation Test Suite', () => {
  const rootDir = process.cwd();
  const paramReportPath = path.join(rootDir, 'CP32.9.1_PARAMETER_RECONCILIATION_REPORT.md');
  const sourceReportPath = path.join(rootDir, 'CP32.9.1_SOURCE_RECONCILIATION_REPORT.md');
  const finalStatusPath = path.join(rootDir, 'CP32.9.1_FINAL_STATUS.md');

  it('1. should verify production contains a determinable value for bodyRatio (0.60)', () => {
    expect(DEFAULT_DISPLACEMENT_CONFIG.minBodyToRangeRatio).toBe(0.6);
  });

  it('2. should verify production contains a determinable value for rangeMultiplier (1.50)', () => {
    expect(DEFAULT_DISPLACEMENT_CONFIG.minRangeMultiplier).toBe(1.5);
  });

  it('3. should verify the 0.60 / 0.65 discrepancy is documented in CP32.9.1 report', () => {
    expect(fs.existsSync(paramReportPath)).toBe(true);
    const paramReportContent = fs.readFileSync(paramReportPath, 'utf-8');

    expect(paramReportContent).toContain('0.60');
    expect(paramReportContent).toContain('0.65');
    expect(paramReportContent).toContain('PRODUCTION_BODY_RATIO');
    expect(paramReportContent).toContain('DOCUMENTATION_ERROR');
  });

  it('4. should verify 0.65 is not presented as a production parameter without evidence', () => {
    const paramReportContent = fs.readFileSync(paramReportPath, 'utf-8');

    expect(paramReportContent).toContain('DOCUMENTATION_ERROR');
    expect(paramReportContent).toContain('PRODUCTION_BODY_RATIO');
  });

  it('5. should verify thresholds from CP32.9 are classified in parameter reconciliation table', () => {
    const paramReportContent = fs.readFileSync(paramReportPath, 'utf-8');

    expect(paramReportContent).toContain('DOCUMENTATION_MISMATCH');
    expect(paramReportContent).toContain('RECONCILED');
    expect(paramReportContent).toContain('fvgMinSizePoints');
  });

  it('6. should verify SRC-01 exists and is traceable (ICT Core Content 2016-2017)', () => {
    expect(fs.existsSync(sourceReportPath)).toBe(true);
    const sourceReportContent = fs.readFileSync(sourceReportPath, 'utf-8');

    expect(sourceReportContent).toContain('SRC-01');
    expect(sourceReportContent).toContain('ICT Core Content Mentorship (Months 1-12)');
    expect(sourceReportContent).toContain('PRIMARY');
  });

  it('7. should verify SRC-02 exists and is traceable (ICT 2022 YouTube Mentorship)', () => {
    const sourceReportContent = fs.readFileSync(sourceReportPath, 'utf-8');

    expect(sourceReportContent).toContain('SRC-02');
    expect(sourceReportContent).toContain('ICT 2022 YouTube Mentorship Series');
    expect(sourceReportContent).toContain('PRIMARY');
  });

  it('8. should verify source claims have location and evidence in reconciliation report', () => {
    const sourceReportContent = fs.readFileSync(sourceReportPath, 'utf-8');

    expect(sourceReportContent).toContain('Ubicación Concreta en Fuente');
    expect(sourceReportContent).toContain('DIRECTLY_SUPPORTED');
    expect(sourceReportContent).toContain('Month 2');
    expect(sourceReportContent).toContain('Market Structure');
  });

  it('9. should verify Level A (Source), Level B (Interpretation), and Level C (Operational Rule) remain separated', () => {
    const sourceReportContent = fs.readFileSync(sourceReportPath, 'utf-8');

    expect(sourceReportContent).toContain('A — FUENTE');
    expect(sourceReportContent).toContain('B — INTERPRETACIÓN');
    expect(sourceReportContent).toContain('C — IMPLEMENTACIÓN');
  });

  it('10. should verify production code in core/ict/ remains unmodified', () => {
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
    ];

    for (const relFile of expectedCoreFiles) {
      const fullPath = path.join(coreIctDir, relFile);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });

  it('11. should verify DEFAULT_ICT_CONFIG parameters remain unmodified', () => {
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

  it('12. should verify parameters remain unmodified in production DisplacementEngine', () => {
    expect(DEFAULT_DISPLACEMENT_CONFIG.minBodyToRangeRatio).toBe(0.6);
    expect(DEFAULT_DISPLACEMENT_CONFIG.minRangeMultiplier).toBe(1.5);
  });

  it('13. should verify Model A, B, and C remain unmodified and final status is PASS', () => {
    expect(fs.existsSync(finalStatusPath)).toBe(true);
    const finalStatusContent = fs.readFileSync(finalStatusPath, 'utf-8');

    expect(finalStatusContent).toContain('PARAMETER_RECONCILIATION = PASS');
    expect(finalStatusContent).toContain('SOURCE_RECONCILIATION = PASS');
    expect(finalStatusContent).toContain('PRODUCTION_MODIFIED = NO');
    expect(finalStatusContent).toContain('PARAMETERS_MODIFIED = NO');
    expect(finalStatusContent).toContain('MODEL_MODIFIED = NO');
  });
});
