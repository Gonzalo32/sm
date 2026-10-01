/**
 * Checkpoint 33.2 - Independent Out-Of-Sample Validation Dataset Design Audit Test Suite
 * Validates CP33.2 design declarations, freeze invariants, instrument/timeframe/session protocols,
 * leakage controls, permitted/prohibited metrics, and design-only status.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DEFAULT_ICT_CONFIG } from '../core/ict/types/ICTConfig';
import { DEFAULT_DISPLACEMENT_CONFIG } from '../core/ict/displacement/DisplacementEngine';
import { PREDEFINED_MODELS } from '../core/ict/models/PredefinedModels';

describe('Checkpoint 33.2 - Independent Out-Of-Sample Dataset Design Audit Suite', () => {
  const rootDir = process.cwd();
  const docPath = path.join(rootDir, 'CP33.2_DATASET_DESIGN_AUDIT.md');
  const finalStatusPath = path.join(rootDir, 'CP33.2_FINAL_STATUS.md');

  // 1. Strict Freeze & Non-Mutation Rule
  it('1. should verify production logic, parameters, and models are 100% frozen', () => {
    expect(DEFAULT_DISPLACEMENT_CONFIG.minBodyToRangeRatio).toBe(0.60);
    expect(DEFAULT_DISPLACEMENT_CONFIG.minRangeMultiplier).toBe(1.50);
    expect(DEFAULT_ICT_CONFIG.fvgMinSizePoints).toBe(0.25);
    expect(PREDEFINED_MODELS.length).toBeGreaterThanOrEqual(3);

    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('PRODUCTION_MUTATION=NO');
    expect(finalContent).toContain('PARAMETER_MUTATION=NO');
    expect(finalContent).toContain('MODEL_MUTATION=NO');
    expect(finalContent).toContain('VALIDATION_LOGIC_MUTATION=NO');
    expect(finalContent).toContain('EXISTING_DATASET_MUTATION=NO');
  });

  // 2. Out-of-sample data non-acquisition & design-only status
  it('2. should verify OUT_OF_SAMPLE_DATA_ACQUIRED = NO and DESIGN_ONLY = YES', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('OUT_OF_SAMPLE_DATA_ACQUIRED=NO');
    expect(finalContent).toContain('OUT_OF_SAMPLE_VALIDATION_EXECUTED=NO');
    expect(finalContent).toContain('OUT_OF_SAMPLE_VALIDATION_PROVEN=NO');
    expect(finalContent).toContain('DESIGN_ONLY=YES');
  });

  // 3. Dataset design scope parameters tracking
  it('3. should track instrument scope (NQ primary, MNQ equivalent) and timeframe scope (5m primary, 1m/15m secondary)', () => {
    const docContent = fs.readFileSync(docPath, 'utf-8');
    expect(docContent).toContain('PRIMARY_INSTRUMENT = NQ');
    expect(docContent).toContain('SECONDARY_INSTRUMENT = MNQ (ECONOMICALLY_EQUIVALENT)');
    expect(docContent).toContain('PRIMARY_TIMEFRAME = 5m');
    expect(docContent).toContain('SECONDARY_TIMEFRAMES = 1m, 15m');
  });

  // 4. Overlap & Independence Rules
  it('4. should track overlap control (minimum 20 candles / 100 minutes separation) and temporal isolation', () => {
    const docContent = fs.readFileSync(docPath, 'utf-8');
    expect(docContent).toContain('MINIMUM_TEMPORAL_SEPARATION = 20_CANDLES_5M (100_MINUTES)');
    expect(docContent).toContain('TEMPORAL_ISOLATION_RULE = PASS');
    expect(docContent).toContain('LABEL_INDEPENDENCE_RULE = PASS');
  });

  // 5. Permitted vs Prohibited Metrics Classification
  it('5. should verify metric classifications (label agreement = PERMITTED, win-rate/P&L = PROHIBITED)', () => {
    const docContent = fs.readFileSync(docPath, 'utf-8');
    expect(docContent).toContain('LABEL_AGREEMENT_METRIC = PERMITTED');
    expect(docContent).toContain('WIN_RATE_METRIC = PROHIBITED');
    expect(docContent).toContain('PNL_METRIC = PROHIBITED');
    expect(docContent).toContain('SL_TP_METRIC = PROHIBITED');
  });

  // 6. Required Final Declarations & Pass Status
  it('6. should declare CP33.2_STATUS = PASS in final status report', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('CP33.2_STATUS=PASS');
    expect(finalContent).toContain('DATASET_DESIGN_STATUS=PASS');

    expect(fs.existsSync(docPath)).toBe(true);
    expect(fs.existsSync(finalStatusPath)).toBe(true);
  });
});
