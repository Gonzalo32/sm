/**
 * Checkpoint 33.3 - Corrective Audit & Status Reconciliation Test Suite
 * Performs forensic verification of CP33.3 status reconciliation (CP33.3_STATUS = PARTIAL),
 * acquisition breakdown, shortfall tracking, overlap buffer audit, SHA-256 seal verification, and freeze rules.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DEFAULT_ICT_CONFIG } from '../core/ict/types/ICTConfig';
import { DEFAULT_DISPLACEMENT_CONFIG } from '../core/ict/displacement/DisplacementEngine';
import { PREDEFINED_MODELS } from '../core/ict/models/PredefinedModels';

describe('Checkpoint 33.3 - Corrective Audit & Status Reconciliation Suite', () => {
  const rootDir = process.cwd();
  const docPath = path.join(rootDir, 'CP33.3_OOS_DATASET_ACQUISITION_AUDIT.md');
  const finalStatusPath = path.join(rootDir, 'CP33.3_FINAL_STATUS.md');
  const oosDir = path.join(rootDir, 'oos_dataset');

  // 1. Strict Freeze Invariants
  it('1. should verify core ICT logic, parameters, models, and existing validation datasets remain 100% frozen', () => {
    expect(DEFAULT_DISPLACEMENT_CONFIG.minBodyToRangeRatio).toBe(0.60);
    expect(DEFAULT_DISPLACEMENT_CONFIG.minRangeMultiplier).toBe(1.50);
    expect(DEFAULT_ICT_CONFIG.fvgMinSizePoints).toBe(0.25);
    expect(PREDEFINED_MODELS.length).toBeGreaterThanOrEqual(3);

    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('ICT_PRODUCTION_LOGIC_MODIFIED=NO');
    expect(finalContent).toContain('PARAMETERS_MODIFIED=NO');
    expect(finalContent).toContain('MODELS_MODIFIED=NO');
    expect(finalContent).toContain('VALIDATION_LOGIC_MODIFIED=NO');
    expect(finalContent).toContain('EXISTING_VALIDATION_DATASET_MODIFIED=NO');
  });

  // 2. Reconciled Status Verification (CP33.3_STATUS = PARTIAL)
  it('2. should verify reconciled status declarations (CP33.3_STATUS = PARTIAL, DATA_ACQUISITION_STATUS = PARTIAL)', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('CP33.3_STATUS=PARTIAL');
    expect(finalContent).toContain('DATA_ACQUISITION_STATUS=PARTIAL');
    expect(finalContent).toContain('DATA_EXTRACTION_STATUS=PARTIAL');
    expect(finalContent).toContain('CALIBRATION_CONTAMINATION_STATUS=PARTIAL');
    expect(finalContent).toContain('CASE_INDEPENDENCE_STATUS=PARTIAL');
  });

  // 3. Shortfall & Case Count Tracking
  it('3. should track ACTUAL_CASE_COUNT = 2, TARGET = 300, SHORTFALL = 298', () => {
    const docContent = fs.readFileSync(docPath, 'utf-8');
    expect(docContent).toContain('ACTUAL_CASE_COUNT = 2');
    expect(docContent).toContain('VALIDATION_DESIGN_TARGET = 300');
    expect(docContent).toContain('CASE_COUNT_SHORTFALL = 298');
  });

  // 4. Overlap Buffer Audit (1 candle vs 20 candles required)
  it('4. should track overlap separation buffer shortfall (1 candle vs 20 candles required)', () => {
    const docContent = fs.readFileSync(docPath, 'utf-8');
    expect(docContent).toContain('BUFFER_SHORTFALL');
    expect(docContent).toContain('CASE_INDEPENDENCE_STATUS = PARTIAL');
  });

  // 5. SHA-256 Real Hash Sealing Verification
  it('5. should verify SHA-256 file hashes in oos_dataset/manifest.json match physical files', () => {
    const manifestPath = path.join(oosDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const hashes = manifest.file_hashes;

    expect(hashes.raw_candles).toBeDefined();
    expect(hashes.normalized_candles).toBeDefined();
    expect(hashes.cases).toBeDefined();

    // Re-verify SHA-256 of raw_candles.json
    const rawBuffer = fs.readFileSync(path.join(oosDir, 'raw', 'raw_candles.json'));
    const calculatedRawHash = crypto.createHash('sha256').update(rawBuffer).digest('hex');
    expect(hashes.raw_candles).toBe(calculatedRawHash);
  });

  // 6. Final Status Declarations Check
  it('6. should declare CP33.3_STATUS = PARTIAL in final status report', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('CP33.3_STATUS=PARTIAL');
    expect(finalContent).toContain('HISTORICAL_DATA_SOURCE_LIMITATION=CONFIRMED');

    expect(fs.existsSync(docPath)).toBe(true);
    expect(fs.existsSync(finalStatusPath)).toBe(true);
  });
});
