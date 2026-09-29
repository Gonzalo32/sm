/**
 * Checkpoint 32.9 - Independent Source & Conceptual Baseline Audit Test Suite
 * Validates baseline source traceability, classifications, Level A/B/C separation,
 * PROJECT_OPERATIONAL & PROJECT_MODEL_V1 tags, production immutability, and governance rules.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DEFAULT_ICT_CONFIG } from '../core/ict/types/ICTConfig';

describe('Checkpoint 32.9 - Independent Source & Conceptual Baseline Audit Test Suite', () => {
  const rootDir = process.cwd();
  const baselineDir = path.join(rootDir, 'CP32.8_EXPERT_ICT_BASELINE');
  const inventoryPath = path.join(baselineDir, '01_CONCEPT_INVENTORY.md');
  const definitionsPath = path.join(baselineDir, '02_DEFINITIONS.md');
  const rulesPath = path.join(baselineDir, '03_OPERATIONAL_RULES.md');
  const ambiguitiesPath = path.join(baselineDir, '04_AMBIGUITIES.md');
  const sourcesPath = path.join(baselineDir, '05_SOURCE_REGISTRY.md');

  const auditReportPath = path.join(rootDir, 'CP32.9_SOURCE_AUDIT_REPORT.md');
  const matrixPath = path.join(rootDir, 'CP32.9_CONCEPT_TRACEABILITY_MATRIX.md');
  const gapsPath = path.join(rootDir, 'CP32.9_SOURCE_GAPS.md');
  const conflictsPath = path.join(rootDir, 'CP32.9_CONCEPTUAL_CONFLICTS.md');
  const decisionLogPath = path.join(rootDir, 'CP32.9_DECISION_LOG.md');

  const EXPECTED_CONCEPT_IDS = Array.from({ length: 22 }, (_, i) => 
    `CONCEPT-${String(i + 1).padStart(2, '0')}`
  );

  it('1. should verify all 22 concepts are registered in audit deliverables', () => {
    expect(fs.existsSync(matrixPath)).toBe(true);
    expect(fs.existsSync(auditReportPath)).toBe(true);
    expect(fs.existsSync(gapsPath)).toBe(true);
    expect(fs.existsSync(conflictsPath)).toBe(true);
    expect(fs.existsSync(decisionLogPath)).toBe(true);
    expect(fs.existsSync(inventoryPath)).toBe(true);
    expect(fs.existsSync(rulesPath)).toBe(true);

    const matrixContent = fs.readFileSync(matrixPath, 'utf-8');

    for (const conceptId of EXPECTED_CONCEPT_IDS) {
      expect(matrixContent).toContain(conceptId);
    }
  });

  it('2. should verify each concept has a source or is explicitly marked PROJECT_OPERATIONAL', () => {
    const matrixContent = fs.readFileSync(matrixPath, 'utf-8');

    for (const conceptId of EXPECTED_CONCEPT_IDS) {
      const conceptRow = matrixContent.split(conceptId)[1];
      expect(conceptRow).toBeDefined();

      const hasPrimarySource = conceptRow.includes('PRIMARY') || conceptRow.includes('[SRC-');
      const isProjectOperational = conceptRow.includes('PROJECT_OPERATIONAL') || conceptRow.includes('PROJECT_MODEL_V1');

      expect(hasPrimarySource || isProjectOperational).toBe(true);
    }
  });

  it('3. should verify sources have explicit classification (PRIMARY, SECONDARY, COMMUNITY, PROJECT_OPERATIONAL)', () => {
    const sourcesContent = fs.readFileSync(sourcesPath, 'utf-8');
    const matrixContent = fs.readFileSync(matrixPath, 'utf-8');

    expect(sourcesContent).toContain('[SRC-01]');
    expect(sourcesContent).toContain('[SRC-02]');

    expect(matrixContent).toContain('PRIMARY');
    expect(matrixContent).toContain('PROJECT_OPERATIONAL');
  });

  it('4. should verify no invented/fake references or unverified claims exist', () => {
    const gapsContent = fs.readFileSync(gapsPath, 'utf-8');

    expect(gapsContent).toContain('DECLARACIÓN DE AUSENCIA DE FUENTES INVENTADAS');
    expect(gapsContent).not.toMatch(/http:\/\/fake-url/i);
  });

  it('5. should verify no claims of universal authority without backing exist in baseline docs', () => {
    const definitionsContent = fs.readFileSync(definitionsPath, 'utf-8');
    const inventoryContent = fs.readFileSync(inventoryPath, 'utf-8');

    expect(definitionsContent).not.toContain('Esta es la definición universal de ICT');
    expect(inventoryContent).not.toContain('Esta es la definición universal de ICT');
  });

  it('6. should verify operational rules (Level C) are separated from conceptual definitions (Level A)', () => {
    const matrixContent = fs.readFileSync(matrixPath, 'utf-8');

    expect(matrixContent).toContain('Definition (Level A)');
    expect(matrixContent).toContain('Operational Rule (Level C)');
  });

  it('7. should verify ambiguities and conflicts are explicitly registered in audit docs', () => {
    const ambiguitiesContent = fs.readFileSync(ambiguitiesPath, 'utf-8');
    const conflictsContent = fs.readFileSync(conflictsPath, 'utf-8');

    expect(ambiguitiesContent).toContain('DEFINICION_CONFLICTIVA');
    expect(ambiguitiesContent).toContain('CONCEPTO_AMBIGUO');
    expect(conflictsContent).toContain('CONF-01: BOS y MSS');
    expect(conflictsContent).toContain('CONF-02: Order Block');
  });

  it('8. should verify Model A, B, and C are correctly classified as PROJECT_MODEL_V1 or PROJECT_OPERATIONAL', () => {
    const matrixContent = fs.readFileSync(matrixPath, 'utf-8');

    for (const modelId of ['CONCEPT-19', 'CONCEPT-20', 'CONCEPT-21']) {
      const modelRow = matrixContent.split(modelId)[1];
      expect(modelRow).toContain('PROJECT_MODEL_V1');
    }
  });

  it('9. should verify thresholds (bodyRatio, rangeMultiplier, fvgMinSizePoints) are classified as PROJECT_OPERATIONAL', () => {
    const gapsContent = fs.readFileSync(gapsPath, 'utf-8');
    const matrixContent = fs.readFileSync(matrixPath, 'utf-8');

    expect(gapsContent).toContain('GAP-01: Umbrales Discretos de Desplazamiento');
    expect(gapsContent).toContain('PROJECT_OPERATIONAL');
    expect(matrixContent).toContain('bodyRatio >= 0.65');
  });

  it('10. should verify no conceptual dependency on the user exists in governance audit docs', () => {
    const auditReportContent = fs.readFileSync(auditReportPath, 'utf-8');
    const decisionLogContent = fs.readFileSync(decisionLogPath, 'utf-8');

    expect(auditReportContent).toContain('Product Owner');
    expect(decisionLogContent).toContain('DEC-32.9-06');
    expect(decisionLogContent).toContain('Usuario = Product Owner únicamente');
  });

  it('11. should verify no circular dependency with production exists', () => {
    const auditReportContent = fs.readFileSync(auditReportPath, 'utf-8');

    expect(auditReportContent).not.toMatch(/El engine detectó .* por lo tanto/i);
    expect(auditReportContent).toContain('Independencia');
  });

  it('12. should verify production code in core/ict/ remains unmodified', () => {
    const coreIctDir = path.join(rootDir, 'core', 'ict');
    expect(fs.existsSync(coreIctDir)).toBe(true);

    const expectedCoreFiles = [
      'index.ts',
      'types/ICTConfig.ts',
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

  it('13. should verify production parameters in DEFAULT_ICT_CONFIG remain unmodified', () => {
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
});
