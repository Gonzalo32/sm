/**
 * Checkpoint 33.1.13 - Native WebSocket Traffic Capture Feasibility Test Suite
 * Validates evidence hierarchy classifications, outbound observation status disclaimers,
 * initial vs scroll-back candle counts, non-mutation rules, and PARTIAL status enforcement.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DEFAULT_ICT_CONFIG } from '../core/ict/types/ICTConfig';
import { DEFAULT_DISPLACEMENT_CONFIG } from '../core/ict/displacement/DisplacementEngine';
import { PREDEFINED_MODELS } from '../core/ict/models/PredefinedModels';

describe('Checkpoint 33.1.13 - Native WebSocket Traffic Audit Suite', () => {
  const rootDir = process.cwd();
  const docPath = path.join(rootDir, 'CP33.1.13_NATIVE_WEBSOCKET_TRAFFIC_AUDIT.md');
  const finalStatusPath = path.join(rootDir, 'CP33.1.13_FINAL_STATUS.md');

  // 1. Outbound traffic observation status
  it('1. should track OUTBOUND_TRAFFIC_DIRECTLY_OBSERVED = NO and WEBSOCKET_SEND_INTERCEPTION_IN_CODE = NO', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('OUTBOUND_TRAFFIC_DIRECTLY_OBSERVED=NO');
    expect(finalContent).toContain('WEBSOCKET_SEND_INTERCEPTION_IN_CODE=NO');
  });

  // 2. Evidence hierarchy classification for timescale_update (LEVEL_1) vs create_series (LEVEL_6)
  it('2. should classify timescale_update as LEVEL_1 and create_series as LEVEL_6', () => {
    const docContent = fs.readFileSync(docPath, 'utf-8');
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');

    expect(docContent).toContain('**LEVEL 1**');
    expect(docContent).toContain('**LEVEL 6**');
    expect(finalContent).toContain('CREATE_SERIES_EVIDENCE_LEVEL=LEVEL_6');
  });

  // 3. Direct runtime capture of timescale_update
  it('3. should track TIMESCALE_UPDATE_OBSERVED_AT_RUNTIME = YES', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('TIMESCALE_UPDATE_OBSERVED_AT_RUNTIME=YES');
  });

  // 4. Verification of evidence level 6 for create_series
  it('4. should track CREATE_SERIES_EVIDENCE_LEVEL = LEVEL_6 in final status report', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('CREATE_SERIES_EVIDENCE_LEVEL=LEVEL_6');
  });

  // 5. Explicit historical request tracking
  it('5. should track EXPLICIT_HISTORICAL_REQUEST = NO', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('EXPLICIT_HISTORICAL_REQUEST=NO');
  });

  // 6. Role & confidence evaluation of create_series
  it('6. should evaluate CREATE_SERIES_ROLE = SERIES_SUBSCRIPTION with CREATE_SERIES_ROLE_CONFIDENCE = MEDIUM', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('CREATE_SERIES_ROLE=SERIES_SUBSCRIPTION');
    expect(finalContent).toContain('CREATE_SERIES_ROLE_CONFIDENCE=MEDIUM');
  });

  // 7. Correlation status tracking
  it('7. should track CREATE_SERIES_TO_TIMESCALE_CORRELATION = NOT_DEMONSTRATED', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('CREATE_SERIES_TO_TIMESCALE_CORRELATION=NOT_DEMONSTRATED');
  });

  // 8. Scroll-back test result tracking
  it('8. should track NEW_OLDER_TIMESTAMPS_AFTER_SCROLL = NO and BACKFILL_TRIGGER_OBSERVED = NO', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('NEW_OLDER_TIMESTAMPS_AFTER_SCROLL=NO');
    expect(finalContent).toContain('BACKFILL_TRIGGER_OBSERVED=NO');
  });

  // 9. Initial vs reload vs timeframe change candle counts
  it('9. should track INITIAL_HISTORY_COUNT = 31, RELOAD_HISTORY_COUNT = 31, and TIMEFRAME_CHANGE_HISTORY_COUNT = 31', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('INITIAL_HISTORY_COUNT=31');
    expect(finalContent).toContain('RELOAD_HISTORY_COUNT=31');
    expect(finalContent).toContain('TIMEFRAME_CHANGE_HISTORY_COUNT=31');
  });

  // 10. Depth demonstrated tracking
  it('10. should track MAX_DEPTH_DEMONSTRATED_DAYS = 0.104 and MAX_DEPTH_AVAILABLE_CONFIRMED = NO', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('MAX_DEPTH_DEMONSTRATED_DAYS=0.104');
    expect(finalContent).toContain('MAX_DEPTH_AVAILABLE_CONFIRMED=NO');
  });

  // 11. Synthetic fallback blocking gate
  it('11. should track NO_DATA_FABRICATION = PASS and SYNTHETIC_FALLBACK_USED = NO', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('NO_DATA_FABRICATION=PASS');
    expect(finalContent).toContain('SYNTHETIC_FALLBACK_USED=NO');
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
  it('15. should declare CP33.1.13_STATUS = PARTIAL in final status report', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('CP33.1.13_STATUS=PARTIAL');

    expect(fs.existsSync(docPath)).toBe(true);
    expect(fs.existsSync(finalStatusPath)).toBe(true);
  });
});
