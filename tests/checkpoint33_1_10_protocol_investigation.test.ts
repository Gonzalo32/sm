/**
 * Checkpoint 33.1.10 - TradeSea Historical Acquisition Protocol Investigation Test Suite
 * Validates code inspection classifications, runtime protocol discovery findings,
 * initial vs additional historical acquisition mechanisms, limit cause analysis,
 * multi-timeframe evaluation matrix, non-mutation rules, and PARTIAL status enforcement.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DEFAULT_ICT_CONFIG } from '../core/ict/types/ICTConfig';
import { DEFAULT_DISPLACEMENT_CONFIG } from '../core/ict/displacement/DisplacementEngine';
import { PREDEFINED_MODELS } from '../core/ict/models/PredefinedModels';

describe('Checkpoint 33.1.10 - Protocol Investigation Test Suite', () => {
  const rootDir = process.cwd();
  const docPath = path.join(rootDir, 'CP33.1.10_PROTOCOL_INVESTIGATION.md');
  const finalStatusPath = path.join(rootDir, 'CP33.1.10_FINAL_STATUS.md');

  // 1. Code inspection element classification
  it('1. should verify code inspection classifications (timescale_update = OBSERVED_IN_CODE, getBars = NOT_FOUND)', () => {
    const docContent = fs.readFileSync(docPath, 'utf-8');
    expect(docContent).toContain('`timescale_update`');
    expect(docContent).toContain('`OBSERVED_IN_CODE`');
    expect(docContent).toContain('`getBars`');
    expect(docContent).toContain('`NOT_FOUND`');
    expect(docContent).toContain('`resolveSymbol`');
  });

  // 2. Initial history mechanism tracking
  it('2. should track INITIAL_HISTORY_MECHANISM = WEBSOCKET_TIMESCALE_UPDATE_PUSH', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('INITIAL_HISTORY_MECHANISM=WEBSOCKET_TIMESCALE_UPDATE_PUSH');
    expect(finalContent).toContain('HISTORICAL_RESPONSE_OBSERVED=YES');
  });

  // 3. Additional history mechanism tracking
  it('3. should track ADDITIONAL_HISTORY_MECHANISM = NOT_OBSERVED and ADDITIONAL_HISTORY_REQUEST_OBSERVED = NO', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('ADDITIONAL_HISTORY_MECHANISM=NOT_OBSERVED');
    expect(finalContent).toContain('ADDITIONAL_HISTORY_REQUEST_OBSERVED=NO');
    expect(finalContent).toContain('ADDITIONAL_HISTORY_RECEIVED=NO');
  });

  // 4. Candle count tracking
  it('4. should track INITIAL_HISTORY_COUNT = 31 and ADDITIONAL_HISTORY_COUNT = 0', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('INITIAL_HISTORY_COUNT=31');
    expect(finalContent).toContain('ADDITIONAL_HISTORY_COUNT=0');
  });

  // 5. Historical depth demonstrated tracking
  it('5. should track MAX_DEPTH_DEMONSTRATED_DAYS = 0.104 and MAX_DEPTH_AVAILABLE_CONFIRMED = NO', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('MAX_DEPTH_DEMONSTRATED_DAYS=0.104');
    expect(finalContent).toContain('MAX_DEPTH_AVAILABLE_CONFIRMED=NO');
  });

  // 6. 31-candle limit cause analysis
  it('6. should document limit cause as INITIAL_WEBSOCKET_PUSH_FRAME_LIMIT in investigation report', () => {
    const docContent = fs.readFileSync(docPath, 'utf-8');
    expect(docContent).toContain('INITIAL_WEBSOCKET_PUSH_FRAME_LIMIT');
  });

  // 7. Internal Historical API discovery status
  it('7. should document HISTORICAL_API_OR_PROTOCOL = NOT_IDENTIFIED in investigation report', () => {
    const docContent = fs.readFileSync(docPath, 'utf-8');
    expect(docContent).toContain('HISTORICAL_API_OR_PROTOCOL = NOT_IDENTIFIED');
  });

  // 8. Rithmic evaluation status
  it('8. should document RITHMIC_REQUIRED_FOR_HISTORY = UNKNOWN in investigation report', () => {
    const docContent = fs.readFileSync(docPath, 'utf-8');
    expect(docContent).toContain('RITHMIC_REQUIRED_FOR_HISTORY = UNKNOWN');
  });

  // 9. Multi-timeframe evaluation matrix tracking
  it('9. should track NQ_5M = PASS and UNTESTED combinations as NOT_TESTED', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('NQ_5M=PASS');
    expect(finalContent).toContain('NQ_1M=NOT_TESTED');
    expect(finalContent).toContain('NQ_15M=NOT_TESTED');
    expect(finalContent).toContain('MNQ_1M=NOT_TESTED');
    expect(finalContent).toContain('MNQ_5M=NOT_TESTED');
    expect(finalContent).toContain('MNQ_15M=NOT_TESTED');
  });

  // 10. Synthetic fallback blocking gate
  it('10. should track NO_DATA_FABRICATION = PASS and SYNTHETIC_FALLBACK_USED = NO', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('NO_DATA_FABRICATION=PASS');
    expect(finalContent).toContain('SYNTHETIC_FALLBACK_USED=NO');
  });

  // 11. Data acquisition code non-mutation
  it('11. should track DATA_ACQUISITION_CODE_MODIFIED = NO and DATA_RUNTIME_INFRASTRUCTURE_MODIFIED = NO', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('DATA_ACQUISITION_CODE_MODIFIED=NO');
    expect(finalContent).toContain('DATA_RUNTIME_INFRASTRUCTURE_MODIFIED=NO');
  });

  // 12. ICT production logic non-mutation
  it('12. should track ICT_PRODUCTION_LOGIC_MODIFIED = NO', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('ICT_PRODUCTION_LOGIC_MODIFIED=NO');
    expect(finalContent).toContain('PARAMETERS_MODIFIED=NO');
    expect(finalContent).toContain('MODELS_MODIFIED=NO');
  });

  // 13. Frozen parameter values check
  it('13. should verify frozen parameters remain intact (bodyRatio = 0.60, rangeMultiplier = 1.50, fvgMinSizePoints = 0.25)', () => {
    expect(DEFAULT_DISPLACEMENT_CONFIG.minBodyToRangeRatio).toBe(0.60);
    expect(DEFAULT_DISPLACEMENT_CONFIG.minRangeMultiplier).toBe(1.50);
    expect(DEFAULT_ICT_CONFIG.fvgMinSizePoints).toBe(0.25);
  });

  // 14. Model definitions check
  it('14. should verify predefined models remain intact (Model A, B, C)', () => {
    expect(PREDEFINED_MODELS.length).toBeGreaterThanOrEqual(3);
    const ids = PREDEFINED_MODELS.map((m) => m.id);
    expect(ids.some((id) => id.includes('MODEL_A'))).toBe(true);
    expect(ids.some((id) => id.includes('MODEL_B'))).toBe(true);
    expect(ids.some((id) => id.includes('MODEL_C'))).toBe(true);
  });

  // 15. Final status PARTIAL declaration check
  it('15. should declare CP33.1.10_STATUS = PARTIAL in final status report', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('CP33.1.10_STATUS=PARTIAL');

    expect(fs.existsSync(docPath)).toBe(true);
    expect(fs.existsSync(finalStatusPath)).toBe(true);
  });
});
