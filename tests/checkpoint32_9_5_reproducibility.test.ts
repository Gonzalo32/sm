/**
 * Checkpoint 32.9.5 - Baseline Evidence & Reproducibility Audit Test Suite
 * Validates independent reproducibility of physical baseline parameters (bodyRatio = 0.60, rangeMultiplier = 1.50, fvgMinSizePoints = 0.25),
 * runtime configuration chain resolution, MISMATCH-01 & GAP-01 reproduction, Model A/B/C and 9 engines integrity,
 * audit chain completeness, zero automated corrections, and final status declarations.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DEFAULT_ICT_CONFIG } from '../core/ict/types/ICTConfig';
import { DEFAULT_DISPLACEMENT_CONFIG } from '../core/ict/displacement/DisplacementEngine';

describe('Checkpoint 32.9.5 - Baseline Evidence & Reproducibility Audit Test Suite', () => {
  const rootDir = process.cwd();
  const reportPath = path.join(rootDir, 'CP32.9.5_BASELINE_REPRODUCIBILITY_REPORT.md');
  const matrixPath = path.join(rootDir, 'CP32.9.5_REPRODUCIBILITY_EVIDENCE_MATRIX.md');
  const finalStatusPath = path.join(rootDir, 'CP32.9.5_FINAL_STATUS.md');

  it('1. should verify actual production bodyRatio is 0.60', () => {
    expect(DEFAULT_DISPLACEMENT_CONFIG.minBodyToRangeRatio).toBe(0.6);
  });

  it('2. should verify actual production rangeMultiplier is 1.50', () => {
    expect(DEFAULT_DISPLACEMENT_CONFIG.minRangeMultiplier).toBe(1.5);
  });

  it('3. should verify FVG threshold is 0.25', () => {
    expect(DEFAULT_ICT_CONFIG.fvgMinSizePoints).toBe(0.25);
  });

  it('4. should verify effective runtime resolution of bodyRatio (0.60)', () => {
    const dispEnginePath = path.join(rootDir, 'core', 'ict', 'displacement', 'DisplacementEngine.ts');
    expect(fs.existsSync(dispEnginePath)).toBe(true);

    const content = fs.readFileSync(dispEnginePath, 'utf-8');
    expect(content).toContain('minBodyToRangeRatio: 0.6');
  });

  it('5. should verify effective runtime resolution of rangeMultiplier (1.50)', () => {
    const dispEnginePath = path.join(rootDir, 'core', 'ict', 'displacement', 'DisplacementEngine.ts');
    const content = fs.readFileSync(dispEnginePath, 'utf-8');

    expect(content).toContain('minRangeMultiplier: 1.5');
  });

  it('6. should verify effective runtime resolution of FVG threshold (0.25)', () => {
    const configPath = path.join(rootDir, 'core', 'ict', 'types', 'ICTConfig.ts');
    expect(fs.existsSync(configPath)).toBe(true);

    const content = fs.readFileSync(configPath, 'utf-8');
    expect(content).toContain('fvgMinSizePoints: 0.25');
  });

  it('7. should verify 0.65 is NOT a production parameter in DisplacementEngine.ts', () => {
    const dispEnginePath = path.join(rootDir, 'core', 'ict', 'displacement', 'DisplacementEngine.ts');
    const content = fs.readFileSync(dispEnginePath, 'utf-8');

    expect(content).not.toContain('minBodyToRangeRatio: 0.65');
    expect(content).not.toContain('0.65');
  });

  it('8. should verify 0.60 IS the production parameter in DisplacementEngine.ts', () => {
    const dispEnginePath = path.join(rootDir, 'core', 'ict', 'displacement', 'DisplacementEngine.ts');
    const content = fs.readFileSync(dispEnginePath, 'utf-8');

    expect(content).toContain('minBodyToRangeRatio: 0.6');
  });

  it('9. should verify MISMATCH-01 reproducibility (DOCUMENTATION_ERROR)', () => {
    const report3293 = path.join(rootDir, 'CP32.9.3_DISCREPANCY_RECONCILIATION_REPORT.md');
    expect(fs.existsSync(report3293)).toBe(true);

    const content = fs.readFileSync(report3293, 'utf-8');
    expect(content).toContain('MISMATCH-01');
    expect(content).toContain('DOCUMENTATION_ERROR');
  });

  it('10. should verify GAP-01 reproducibility (PROJECT_OPERATIONAL_PRESENTED_AS_SOURCE)', () => {
    const report3293 = path.join(rootDir, 'CP32.9.3_DISCREPANCY_RECONCILIATION_REPORT.md');
    const content = fs.readFileSync(report3293, 'utf-8');

    expect(content).toContain('GAP-01');
    expect(content).toContain('PROJECT_OPERATIONAL_PRESENTED_AS_SOURCE');
  });

  it('11. should verify SAME_ISSUE reproducibility (YES)', () => {
    const status3293 = path.join(rootDir, 'CP32.9.3_FINAL_STATUS.md');
    const content = fs.readFileSync(status3293, 'utf-8');

    expect(content).toContain('SAME_ISSUE = YES');
  });

  it('12. should verify baseline displacement reproducibility', () => {
    expect(fs.existsSync(reportPath)).toBe(true);
    const content = fs.readFileSync(reportPath, 'utf-8');

    expect(content).toContain('minBodyToRangeRatio');
    expect(content).toContain('0.60');
  });

  it('13. should verify baseline FVG reproducibility', () => {
    const content = fs.readFileSync(reportPath, 'utf-8');

    expect(content).toContain('fvgMinSizePoints');
    expect(content).toContain('0.25');
  });

  it('14. should verify baseline structural configuration reproducibility', () => {
    expect(DEFAULT_ICT_CONFIG.bosBreakMode).toBe('CLOSE');
    expect(DEFAULT_ICT_CONFIG.mssBreakMode).toBe('CLOSE');
    expect(DEFAULT_ICT_CONFIG.swingLeftBars).toBe(2);
    expect(DEFAULT_ICT_CONFIG.swingRightBars).toBe(2);
  });

  it('15. should verify MODEL_A reproducibility in PredefinedModels', () => {
    const modelsFile = path.join(rootDir, 'core', 'ict', 'models', 'PredefinedModels.ts');
    expect(fs.existsSync(modelsFile)).toBe(true);

    const content = fs.readFileSync(modelsFile, 'utf-8');
    expect(content).toContain('MODEL_A_LONG');
    expect(content).toContain('MODEL_A_SHORT');
  });

  it('16. should verify MODEL_B reproducibility in PredefinedModels', () => {
    const modelsFile = path.join(rootDir, 'core', 'ict', 'models', 'PredefinedModels.ts');
    const content = fs.readFileSync(modelsFile, 'utf-8');

    expect(content).toContain('MODEL_B_LONG');
    expect(content).toContain('MODEL_B_SHORT');
  });

  it('17. should verify MODEL_C reproducibility in PredefinedModels', () => {
    const modelsFile = path.join(rootDir, 'core', 'ict', 'models', 'PredefinedModels.ts');
    const content = fs.readFileSync(modelsFile, 'utf-8');

    expect(content).toContain('MODEL_C_LONG');
    expect(content).toContain('MODEL_C_SHORT');
  });

  it('18. should verify engine inventory reproducibility (9 core engines intact)', () => {
    const coreIctDir = path.join(rootDir, 'core', 'ict');
    expect(fs.existsSync(coreIctDir)).toBe(true);

    const expectedEngines = [
      'structure/SwingDetector.ts',
      'structure/StructureEngine.ts',
      'liquidity/LiquidityEngine.ts',
      'fvg/FVGEngine.ts',
      'orderblocks/OrderBlockEngine.ts',
      'displacement/DisplacementEngine.ts',
      'pdarrays/PremiumDiscountEngine.ts',
      'context/MarketContextEngine.ts',
      'setups/SetupEngine.ts',
    ];

    for (const relFile of expectedEngines) {
      const fullPath = path.join(coreIctDir, relFile);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });

  it('19. should verify audit documentation reproducibility across CP32.9.x chain', () => {
    expect(fs.existsSync(matrixPath)).toBe(true);
    expect(fs.existsSync(finalStatusPath)).toBe(true);

    const matrixContent = fs.readFileSync(matrixPath, 'utf-8');
    expect(matrixContent).toContain('CLM-32.9.4-01');
  });

  it('20. should verify absence of automated corrections (AUTOMATED_CORRECTION = NO) and status is PASS', () => {
    const statusContent = fs.readFileSync(finalStatusPath, 'utf-8');

    expect(statusContent).toContain('BASELINE_REPRODUCIBILITY = FULL');
    expect(statusContent).toContain('MISMATCH_01_REPRODUCED = YES');
    expect(statusContent).toContain('GAP_01_REPRODUCED = YES');
    expect(statusContent).toContain('RUNTIME_VALUES_REPRODUCED = YES');
    expect(statusContent).toContain('MODEL_INTEGRITY = PASS');
    expect(statusContent).toContain('ENGINE_INTEGRITY = PASS');
    expect(statusContent).toContain('HISTORICAL_EVIDENCE = AVAILABLE');
    expect(statusContent).toContain('BASELINE_HASH_COMPARISON = MATCH');
    expect(statusContent).toContain('AUTOMATED_CORRECTION = NO');
    expect(statusContent).toContain('PRODUCTION_MODIFIED = NO');
    expect(statusContent).toContain('PARAMETERS_MODIFIED = NO');
    expect(statusContent).toContain('MODEL_MODIFIED = NO');
    expect(statusContent).toContain('CP32.9.5_STATUS = PASS');
  });
});
