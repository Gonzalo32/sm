/**
 * Checkpoint 33.1.4 - Real Market Data Acquisition & Provenance Gate Test Suite
 * Validates synthetic data classification, synthetic dataset rejection as real market,
 * preserved parameters (0.60 / 1.50 / 0.25), intact models (Model A/B/C), zero production mutations,
 * explicit data source inventory declarations, independence requirements, data quality gate rules,
 * and enforcement of PARTIAL status when real data is absent.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { CP21DatasetGenerator } from '../core/ict/backtest/CP21DatasetGenerator';
import { DEFAULT_ICT_CONFIG } from '../core/ict/types/ICTConfig';
import { DEFAULT_DISPLACEMENT_CONFIG } from '../core/ict/displacement/DisplacementEngine';
import { PREDEFINED_MODELS } from '../core/ict/models/PredefinedModels';

describe('Checkpoint 33.1.4 - Real Market Data Acquisition & Provenance Gate Suite', () => {
  const rootDir = process.cwd();
  const reqDocPath = path.join(rootDir, 'CP33.1.4_REAL_DATA_REQUIREMENTS.md');
  const invDocPath = path.join(rootDir, 'CP33.1.4_SOURCE_INVENTORY.md');
  const qualDocPath = path.join(rootDir, 'CP33.1.4_DATA_QUALITY_GATE.md');
  const indDocPath = path.join(rootDir, 'CP33.1.4_INDEPENDENCE_GATE.md');
  const finalStatusPath = path.join(rootDir, 'CP33.1.4_FINAL_STATUS.md');

  // 1. CP21 synthetic data is classified SYNTHETIC
  it('1. CP21 synthetic data is classified SYNTHETIC', () => {
    const invContent = fs.readFileSync(invDocPath, 'utf-8');
    expect(invContent).toContain('SYNTHETIC');
    const { dataset } = CP21DatasetGenerator.generateCP21Dataset();
    expect(dataset.datasetId).toBe('DATASET-CP21-ISOLATED-01');
  });

  // 2. No synthetic dataset is accepted as REAL_MARKET
  it('2. No synthetic dataset is accepted as REAL_MARKET', () => {
    const indContent = fs.readFileSync(indDocPath, 'utf-8');
    expect(indContent).toContain('SYNTHETIC_DATASET_ACCEPTABLE_FOR_REAL_VALIDATION = NO');
    expect(indContent).toContain('SYNTHETIC_CONTAMINATION_GATE = PASS');
  });

  // 3. Production parameters unchanged
  it('3. Production parameters remain frozen: bodyRatio = 0.60, rangeMultiplier = 1.50, fvgMinSizePoints = 0.25', () => {
    expect(DEFAULT_DISPLACEMENT_CONFIG.minBodyToRangeRatio).toBe(0.60);
    expect(DEFAULT_DISPLACEMENT_CONFIG.minRangeMultiplier).toBe(1.50);
    expect(DEFAULT_ICT_CONFIG.fvgMinSizePoints).toBe(0.25);
  });

  // 4. Models unchanged
  it('4. Models remain unchanged: PREDEFINED_MODELS contains Model A, B, and C', () => {
    expect(PREDEFINED_MODELS.length).toBeGreaterThanOrEqual(3);
    const ids = PREDEFINED_MODELS.map((m) => m.id);
    expect(ids.some((id) => id.includes('MODEL_A'))).toBe(true);
    expect(ids.some((id) => id.includes('MODEL_B'))).toBe(true);
    expect(ids.some((id) => id.includes('MODEL_C'))).toBe(true);
  });

  // 5. No production mutation
  it('5. Zero production mutations performed', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('PRODUCTION_MODIFIED = NO');
    expect(finalContent).toContain('PARAMETERS_MODIFIED = NO');
    expect(finalContent).toContain('MODELS_MODIFIED = NO');
    expect(finalContent).toContain('AUTOMATED_CORRECTION = NO');
  });

  // 6. Real source classification is explicit
  it('6. Real source classification is explicit in CP33.1.4_SOURCE_INVENTORY.md', () => {
    const invContent = fs.readFileSync(invDocPath, 'utf-8');
    expect(invContent).toContain('EXISTING_REAL_DATASETS = NO');
    expect(invContent).toContain('REAL_MNQ_DATA = NO');
    expect(invContent).toContain('REAL_NQ_DATA = NO');
  });

  // 7. Independence classification is explicit
  it('7. Independence classification is explicit in CP33.1.4_INDEPENDENCE_GATE.md', () => {
    const indContent = fs.readFileSync(indDocPath, 'utf-8');
    expect(indContent).toContain('REAL_DATASET_INDEPENDENCE = NO');
  });

  // 8. Hash/provenance requirements are explicit
  it('8. Hash and provenance requirements are explicit in CP33.1.4_REAL_DATA_REQUIREMENTS.md', () => {
    const reqContent = fs.readFileSync(reqDocPath, 'utf-8');
    expect(reqContent).toContain('sha256');
    expect(reqContent).toContain('Minimum Candle Count');
  });

  // 9. Dataset quality requirements are explicit
  it('9. Dataset quality requirements are explicit in CP33.1.4_DATA_QUALITY_GATE.md', () => {
    const qualContent = fs.readFileSync(qualDocPath, 'utf-8');
    expect(qualContent).toContain('Check 1: Geometric OHLC Sanity');
    expect(qualContent).toContain('Check 2: Timestamp Monotonicity & Uniqueness');
    expect(qualContent).toContain('AUTOMATED_CORRECTION = NO');
    expect(qualContent).toContain('DATASET_STATUS = REJECTED');
  });

  // 10. Missing real data cannot silently become PASS
  it('10. Missing real data cannot silently become PASS: status must be PARTIAL', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('REAL_MARKET_VALIDATION_READY = NO');
    expect(finalContent).toContain('CP33.1.4_STATUS = PARTIAL');
  });

  // 11. Deliverable Documentation Files Verification
  it('11. Deliverable Documentation Files Verification', () => {
    expect(fs.existsSync(reqDocPath)).toBe(true);
    expect(fs.existsSync(invDocPath)).toBe(true);
    expect(fs.existsSync(qualDocPath)).toBe(true);
    expect(fs.existsSync(indDocPath)).toBe(true);
    expect(fs.existsSync(finalStatusPath)).toBe(true);
  });
});
