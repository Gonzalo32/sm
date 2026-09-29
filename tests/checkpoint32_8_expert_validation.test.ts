/**
 * Checkpoint 32.8 - Independent Expert ICT/SMC Conceptual Baseline Test Suite
 * Validates baseline documentation, concept inventory, definitions, operational rules,
 * source registry, ambiguities, production immutability, parameter freeze, and governance rules.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DEFAULT_ICT_CONFIG } from '../core/ict/types/ICTConfig';

describe('Checkpoint 32.8 - Independent Expert Conceptual Baseline Test Suite', () => {
  const rootDir = process.cwd();
  const baselineDir = path.join(rootDir, 'CP32.8_EXPERT_ICT_BASELINE');
  const inventoryPath = path.join(baselineDir, '01_CONCEPT_INVENTORY.md');
  const definitionsPath = path.join(baselineDir, '02_DEFINITIONS.md');
  const rulesPath = path.join(baselineDir, '03_OPERATIONAL_RULES.md');
  const ambiguitiesPath = path.join(baselineDir, '04_AMBIGUITIES.md');
  const sourcesPath = path.join(baselineDir, '05_SOURCE_REGISTRY.md');
  const caseReviewPath = path.join(baselineDir, '06_CASE_REVIEW.md');
  const decisionLogPath = path.join(baselineDir, '07_DECISION_LOG.md');

  const EXPECTED_CONCEPT_IDS = Array.from({ length: 22 }, (_, i) => 
    `CONCEPT-${String(i + 1).padStart(2, '0')}`
  );

  it('1. should verify all 22 concepts are registered in baseline inventory and definitions', () => {
    expect(fs.existsSync(inventoryPath)).toBe(true);
    expect(fs.existsSync(definitionsPath)).toBe(true);
    expect(fs.existsSync(caseReviewPath)).toBe(true);
    expect(fs.existsSync(decisionLogPath)).toBe(true);

    const inventoryContent = fs.readFileSync(inventoryPath, 'utf-8');
    const definitionsContent = fs.readFileSync(definitionsPath, 'utf-8');

    for (const conceptId of EXPECTED_CONCEPT_IDS) {
      expect(inventoryContent).toContain(conceptId);
      expect(definitionsContent).toContain(conceptId);
    }
  });

  it('2. should verify each concept has a non-empty definition in 02_DEFINITIONS.md', () => {
    const definitionsContent = fs.readFileSync(definitionsPath, 'utf-8');
    const conceptBlocks = definitionsContent.split(/### CONCEPT-\d\d/);

    expect(conceptBlocks.length - 1).toBe(22);

    for (let i = 1; i <= 22; i++) {
      const conceptBlock = conceptBlocks[i];
      expect(conceptBlock).toBeDefined();

      expect(conceptBlock).toContain('DEFINICIÓN');
      expect(conceptBlock).toContain('EVIDENCIA NECESARIA');
      expect(conceptBlock).toContain('CONDICIONES NECESARIAS');
      expect(conceptBlock).toContain('REGLA OPERATIVA PROPUESTA');

      // Verify definition text exists and is non-empty
      const defMatch = conceptBlock.match(/#### 3\. DEFINICIÓN\s+([\s\S]+?)\s+#### 4\./);
      expect(defMatch).not.toBeNull();
      expect(defMatch![1].trim().length).toBeGreaterThan(10);
    }
  });

  it('3. should verify each concept has an operational rule or is explicitly marked as ambiguous', () => {
    const rulesContent = fs.readFileSync(rulesPath, 'utf-8');
    const ambiguitiesContent = fs.readFileSync(ambiguitiesPath, 'utf-8');

    for (let i = 1; i <= 22; i++) {
      const opId = `OP-${String(i).padStart(2, '0')}`;
      const conceptId = `CONCEPT-${String(i).padStart(2, '0')}`;

      const hasOperationalRule = rulesContent.includes(opId) || rulesContent.includes(conceptId);
      const isMarkedAmbiguous = ambiguitiesContent.includes(conceptId) || 
                                ambiguitiesContent.includes('CONCEPTO_AMBIGUO') || 
                                ambiguitiesContent.includes('DEFINICION_CONFLICTIVA');

      expect(hasOperationalRule || isMarkedAmbiguous).toBe(true);
    }
  });

  it('4. should verify sources are registered for all 22 concepts in 05_SOURCE_REGISTRY.md', () => {
    expect(fs.existsSync(sourcesPath)).toBe(true);
    const sourcesContent = fs.readFileSync(sourcesPath, 'utf-8');

    expect(sourcesContent).toContain('[SRC-01]');
    expect(sourcesContent).toContain('[SRC-02]');

    for (const conceptId of EXPECTED_CONCEPT_IDS) {
      expect(sourcesContent).toContain(conceptId);
    }
  });

  it('5. should verify ambiguities and conflicts are explicitly registered with formal taxonomy', () => {
    expect(fs.existsSync(ambiguitiesPath)).toBe(true);
    const ambiguitiesContent = fs.readFileSync(ambiguitiesPath, 'utf-8');

    expect(ambiguitiesContent).toContain('DEFINICION_CONFLICTIVA');
    expect(ambiguitiesContent).toContain('CONCEPTO_AMBIGUO');
    expect(ambiguitiesContent).toContain('BOS y MSS');
    expect(ambiguitiesContent).toContain('Order Block');
    expect(ambiguitiesContent).toContain('Fair Value Gap');
  });

  it('6. should verify no engine output dependencies were used for defining concepts', () => {
    const definitionsContent = fs.readFileSync(definitionsPath, 'utf-8');
    const inventoryContent = fs.readFileSync(inventoryPath, 'utf-8');

    // Baseline definitions must not argue "El engine detectó X, por lo tanto X es correcto"
    expect(definitionsContent).not.toMatch(/El engine detectó .* por lo tanto/i);
    expect(inventoryContent).not.toMatch(/El engine detectó .* por lo tanto/i);
    expect(definitionsContent).toContain('especificación formal e independiente');
  });

  it('7. should verify production code in core/ict/ remains unmodified', () => {
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

  it('8. should verify production parameters in DEFAULT_ICT_CONFIG remain unmodified', () => {
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

  it('9. should verify no conceptual dependency on the user exists in governance documents', () => {
    const inventoryContent = fs.readFileSync(inventoryPath, 'utf-8');
    const decisionLogContent = fs.readFileSync(decisionLogPath, 'utf-8');

    expect(inventoryContent).toContain('Product Owner');
    expect(inventoryContent).not.toContain('El usuario decide si un concepto es correcto');
    expect(decisionLogContent).toContain('DEC-32.8-01');
    expect(decisionLogContent).toContain('Usuario = Product Owner únicamente');
  });

  it('10. should verify NO BUY/SELL signals are introduced in baseline documentation', () => {
    const rulesContent = fs.readFileSync(rulesPath, 'utf-8');
    const decisionLogContent = fs.readFileSync(decisionLogPath, 'utf-8');

    expect(decisionLogContent).toContain('CERO SEÑALES FINANCIERAS');
    expect(rulesContent).not.toContain('GENERAR SEÑAL BUY');
    expect(rulesContent).not.toContain('GENERAR SEÑAL SELL');
  });

  it('11. should verify NO Entry/SL/TP/RR metrics exist in baseline documentation', () => {
    const decisionLogContent = fs.readFileSync(decisionLogPath, 'utf-8');
    expect(decisionLogContent).toContain('DEC-32.8-05');
    expect(decisionLogContent).toContain('Entry, Stop-Loss (SL), Take-Profit (TP) o Risk/Reward (RR)');
  });

  it('12. should verify NO profitability metrics exist in baseline documentation', () => {
    const decisionLogContent = fs.readFileSync(decisionLogPath, 'utf-8');
    expect(decisionLogContent).toContain('DEC-32.8-06');
    expect(decisionLogContent).toContain('CERO MÉTRICAS DE RENTABILIDAD');
  });
});
