/**
 * Checkpoint 33.1.16 - Native WebSocket Frame Sequence Audit Test Suite
 * Validates create_series discrepancy resolution, timestamp UTC conversions, interaction matrix assertions,
 * explicit historical request audit findings, non-mutation rules, and PARTIAL status enforcement.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DEFAULT_ICT_CONFIG } from '../core/ict/types/ICTConfig';
import { DEFAULT_DISPLACEMENT_CONFIG } from '../core/ict/displacement/DisplacementEngine';
import { PREDEFINED_MODELS } from '../core/ict/models/PredefinedModels';

describe('Checkpoint 33.1.16 - Frame Sequence Audit Suite', () => {
  const rootDir = process.cwd();
  const docPath = path.join(rootDir, 'CP33.1.16_FRAME_SEQUENCE_AUDIT.md');
  const finalStatusPath = path.join(rootDir, 'CP33.1.16_FINAL_STATUS.md');

  // 1. Resolution of create_series observation discrepancy
  it('1. should track CREATE_SERIES_OBSERVED_AT_RUNTIME = NO and CREATE_SERIES_EVIDENCE_LEVEL = LEVEL_6', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('CREATE_SERIES_OBSERVED_AT_RUNTIME=NO');
    expect(finalContent).toContain('CREATE_SERIES_EVIDENCE_LEVEL=LEVEL_6');
    expect(finalContent).toContain('CREATE_SERIES_FRAME_CAPTURED=NO');
  });

  // 2. Discrepancy source classification
  it('2. should classify create_series source as TRADINGVIEW_PROTOCOL_SPEC_INFERENCE in audit report', () => {
    const docContent = fs.readFileSync(docPath, 'utf-8');
    expect(docContent).toContain('TRADINGVIEW_PROTOCOL_SPEC_INFERENCE');
    expect(docContent).toContain('SERIES_SUBSCRIPTION');
  });

  // 3. Explicit historical request audit
  it('3. should track EXPLICIT_HISTORICAL_REQUEST = NO and EXPLICIT_HISTORICAL_REQUEST_EVIDENCE_LEVEL = LEVEL_1', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('EXPLICIT_HISTORICAL_REQUEST=NO');
    expect(finalContent).toContain('EXPLICIT_HISTORICAL_REQUEST_EVIDENCE_LEVEL=LEVEL_1');
  });

  // 4. Initial history trigger classification
  it('4. should track INITIAL_HISTORY_TRIGGER = SESSION_INITIALIZATION_PUSH with HIGH confidence', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('INITIAL_HISTORY_TRIGGER=SESSION_INITIALIZATION_PUSH');
    expect(finalContent).toContain('INITIAL_HISTORY_TRIGGER_CONFIDENCE=HIGH');
  });

  // 5. Timestamp UTC conversion assertions
  it('5. should verify exact UTC conversion for baseline timestamps (1779128100000 and 1779137100000)', () => {
    const firstTs = 1779128100000;
    const lastTs = 1779137100000;

    const firstIso = new Date(firstTs).toISOString();
    const lastIso = new Date(lastTs).toISOString();

    expect(firstIso).toBe('2026-05-18T18:15:00.000Z');
    expect(lastIso).toBe('2026-05-18T20:45:00.000Z');

    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('TIMESTAMP_FIRST_UTC=2026-05-18T18:15:00.000Z');
    expect(finalContent).toContain('TIMESTAMP_LAST_UTC=2026-05-18T20:45:00.000Z');
  });

  // 6. Timestamp span & bar count calculations
  it('6. should verify TIMESTAMP_SPAN_HOURS = 2.5, EXPECTED_5M_BAR_COUNT = 31, and ACTUAL_BAR_COUNT = 31', () => {
    const firstTs = 1779128100000;
    const lastTs = 1779137100000;
    const spanHours = (lastTs - firstTs) / (1000 * 60 * 60);
    const expectedBars = Math.floor(spanHours * 12) + 1;

    expect(spanHours).toBe(2.5);
    expect(expectedBars).toBe(31);

    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('TIMESTAMP_SPAN_HOURS=2.5');
    expect(finalContent).toContain('EXPECTED_5M_BAR_COUNT=31');
    expect(finalContent).toContain('ACTUAL_BAR_COUNT=31');
  });

  // 7. Reload test tracking
  it('7. should track RELOAD_CREATE_SERIES_OBSERVED = NO and RELOAD_CANDLE_COUNT = 31', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('RELOAD_CREATE_SERIES_OBSERVED=NO');
    expect(finalContent).toContain('RELOAD_HISTORICAL_REQUEST_OBSERVED=NO');
    expect(finalContent).toContain('RELOAD_CANDLE_COUNT=31');
  });

  // 8. Timeframe change test tracking
  it('8. should track TIMEFRAME_CHANGE_OUTBOUND_CAPTURED = NO and TIMEFRAME_CHANGE_CANDLE_COUNT = 31', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('TIMEFRAME_CHANGE_OUTBOUND_CAPTURED=NO');
    expect(finalContent).toContain('TIMEFRAME_CHANGE_HISTORICAL_REQUEST=NO');
    expect(finalContent).toContain('TIMEFRAME_CHANGE_CANDLE_COUNT=31');
  });

  // 9. Scroll-back test tracking
  it('9. should track SCROLL_BACK_OUTBOUND_CAPTURED = NO and SCROLL_BACK_NEW_OLDER_TIMESTAMPS = NO', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('SCROLL_BACK_OUTBOUND_CAPTURED=NO');
    expect(finalContent).toContain('SCROLL_BACK_HISTORICAL_REQUEST=NO');
    expect(finalContent).toContain('SCROLL_BACK_NEW_OLDER_TIMESTAMPS=NO');
  });

  // 10. Historical request & backfill mechanism status
  it('10. should track HISTORICAL_REQUEST_MECHANISM_IDENTIFIED = NO and BACKFILL_MECHANISM_IDENTIFIED = NO', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('HISTORICAL_REQUEST_MECHANISM_IDENTIFIED=NO');
    expect(finalContent).toContain('BACKFILL_MECHANISM_IDENTIFIED=NO');
  });

  // 11. Baseline depth facts preservation
  it('11. should preserve NQ_5M_REAL_CANDLES = 31, MAX_DEPTH_DEMONSTRATED_DAYS = 0.104, and MAX_DEPTH_AVAILABLE_CONFIRMED = NO', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('NQ_5M_REAL_CANDLES=31');
    expect(finalContent).toContain('MAX_DEPTH_DEMONSTRATED_DAYS=0.104');
    expect(finalContent).toContain('MAX_DEPTH_AVAILABLE_CONFIRMED=NO');
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
  it('15. should declare CP33.1.16_STATUS = PARTIAL in final status report', () => {
    const finalContent = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalContent).toContain('CP33.1.16_STATUS=PARTIAL');

    expect(fs.existsSync(docPath)).toBe(true);
    expect(fs.existsSync(finalStatusPath)).toBe(true);
  });
});
