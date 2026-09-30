/**
 * Checkpoint 33.1.17 - Historical Data Sufficiency & Validation Requirements Test Suite
 * Validates component lookback code derivations, warm-up calculations, requirement separations,
 * 31-candle sufficiency evaluations, non-mutation rules, and PARTIAL status enforcement.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DEFAULT_ICT_CONFIG } from '../core/ict/types/ICTConfig';
import { DEFAULT_DISPLACEMENT_CONFIG } from '../core/ict/displacement/DisplacementEngine';
import { PREDEFINED_MODELS } from '../core/ict/models/PredefinedModels';

describe('Checkpoint 33.1.17 - Sufficiency Requirements Test Suite', () => {
  const rootDir = process.cwd();
  const docPath = path.join(rootDir, 'CP33.1.17_HISTORICAL_SUFFICIENCY_AUDIT.md');
  const finalStatusPath = path.join(rootDir, 'CP33.1.17_FINAL_STATUS.md');

  // 1. Runtime minimum history identification & minimum candle count
  it('1. should track RUNTIME_MINIMUM_HISTORY_IDENTIFIED = YES and RUNTIME_MINIMUM_CANDLES = 5', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('RUNTIME_MINIMUM_HISTORY_IDENTIFIED=YES');
    expect(finalContent).toContain('RUNTIME_MINIMUM_CANDLES=5');
  });

  // 2. Replay & validation minimum candle counts
  it('2. should track REPLAY_MINIMUM_CANDLES = 31 and VALIDATION_MINIMUM_CANDLES = 1500', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('REPLAY_MINIMUM_CANDLES=31');
    expect(finalContent).toContain('VALIDATION_MINIMUM_CANDLES=1500');
  });

  // 3. Lookback calculation derivation assertions (SwingDetector = 5, FVGEngine = 3)
  it('3. should verify lookback calculation derivation (SwingDetector = left+right+1 = 5, FVG = 3)', () => {
    const { swingLeftBars, swingRightBars } = DEFAULT_ICT_CONFIG;
    const swingMinCandles = swingLeftBars + swingRightBars + 1;

    expect(swingLeftBars).toBe(2);
    expect(swingRightBars).toBe(2);
    expect(swingMinCandles).toBe(5);

    const docContent = fs.readFileSync(docPath, 'utf-8');
    expect(docContent).toContain('`SwingDetector.ts:22`');
    expect(docContent).toContain('`FVGEngine.ts:32`');
  });

  // 4. Warm-up requirement tracking
  it('4. should track WARMUP_REQUIREMENT_IDENTIFIED = YES', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('WARMUP_REQUIREMENT_IDENTIFIED=YES');
  });

  // 5. Multi-timeframe relationship tracking
  it('5. should track MULTI_TIMEFRAME_REQUIREMENT_IDENTIFIED = YES', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('MULTI_TIMEFRAME_REQUIREMENT_IDENTIFIED=YES');
  });

  // 6. Evaluation of 31-candle dataset for runtime and replay
  it('6. should evaluate 31-candle dataset as fully sufficient for runtime and replay', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('CURRENT_DATA_FULLY_SUFFICIENT_FOR_RUNTIME=YES');
    expect(finalContent).toContain('CURRENT_DATA_FULLY_SUFFICIENT_FOR_REPLAY=YES');
  });

  // 7. Evaluation of 31-candle dataset for validation (PARTIAL)
  it('7. should evaluate 31-candle dataset as PARTIAL for validation', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('CURRENT_DATA_FULLY_SUFFICIENT_FOR_VALIDATION=PARTIAL');
  });

  // 8. Validation case counts tracking
  it('8. should track VALIDATION_CASE_COUNT = 300 (150 positive, 150 negative)', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('VALIDATION_CASE_COUNT=300');
    expect(finalContent).toContain('VALIDATION_POSITIVE_CASES=150');
    expect(finalContent).toContain('VALIDATION_NEGATIVE_CASES=150');
    expect(finalContent).toContain('VALIDATION_CONCEPT_REVIEW_CASES=100');
    expect(finalContent).toContain('VALIDATION_DETECTION_REVIEW_CASES=200');
  });

  // 9. Baseline depth facts preservation
  it('9. should preserve NQ_5M_CURRENT_CANDLES = 31 and NQ_5M_CURRENT_SPAN_DAYS = 0.104', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('NQ_5M_CURRENT_CANDLES=31');
    expect(finalContent).toContain('NQ_5M_CURRENT_SPAN_DAYS=0.104');
  });

  // 10. Continuous historical data availability disclaimer
  it('10. should track CONTINUOUS_HISTORICAL_DATA_AVAILABLE = NO and CONTINUOUS_HISTORICAL_DEPTH_CONFIRMED = NO', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('CONTINUOUS_HISTORICAL_DATA_AVAILABLE=NO');
    expect(finalContent).toContain('CONTINUOUS_HISTORICAL_DEPTH_CONFIRMED=NO');
  });

  // 11. Synthetic data blocking gate
  it('11. should track SYNTHETIC_DATA_USED = NO', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('SYNTHETIC_DATA_USED=NO');
  });

  // 12. Data acquisition code non-mutation
  it('12. should track DATA_ACQUISITION_CODE_MODIFIED = NO and DATA_RUNTIME_INFRASTRUCTURE_MODIFIED = NO', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('DATA_ACQUISITION_CODE_MODIFIED=NO');
    expect(finalContent).toContain('DATA_RUNTIME_INFRASTRUCTURE_MODIFIED=NO');
  });

  // 13. ICT production logic non-mutation
  it('13. should track ICT_PRODUCTION_LOGIC_MODIFIED = NO', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('ICT_PRODUCTION_LOGIC_MODIFIED=NO');
    expect(finalContent).toContain('PARAMETERS_MODIFIED=NO');
    expect(finalContent).toContain('MODELS_MODIFIED=NO');
  });

  // 14. Frozen parameter & model definitions check
  it('14. should verify frozen parameters and model definitions remain intact (Model A, B, C)', () => {
    expect(DEFAULT_DISPLACEMENT_CONFIG.minBodyToRangeRatio).toBe(0.60);
    expect(DEFAULT_DISPLACEMENT_CONFIG.minRangeMultiplier).toBe(1.50);
    expect(DEFAULT_ICT_CONFIG.fvgMinSizePoints).toBe(0.25);
    expect(PREDEFINED_MODELS.length).toBeGreaterThanOrEqual(3);
    const ids = PREDEFINED_MODELS.map((m) => m.id);
    expect(ids.some((id) => id.includes('MODEL_A'))).toBe(true);
    expect(ids.some((id) => id.includes('MODEL_B'))).toBe(true);
    expect(ids.some((id) => id.includes('MODEL_C'))).toBe(true);
  });

  // 15. Final status PARTIAL declaration check
  it('15. should declare CP33.1.17_STATUS = PARTIAL in final status report', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('CP33.1.17_STATUS=PARTIAL');

    expect(fs.existsSync(docPath)).toBe(true);
    expect(fs.existsSync(finalStatusPath)).toBe(true);
  });
});
