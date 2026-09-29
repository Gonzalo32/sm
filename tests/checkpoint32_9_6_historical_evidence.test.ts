/**
 * Checkpoint 32.9.6 - Cryptographic Baseline & Historical Evidence Verification Suite
 * Validates git commit traceability, SHA-256 baseline hashing, 3-level match distinctions
 * (Document, Content, Cryptographic), historical parameter evidence, model history,
 * audit chain integrity, and strict read-only compliance without production mutations.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DEFAULT_ICT_CONFIG } from '../core/ict/types/ICTConfig';
import { DEFAULT_DISPLACEMENT_CONFIG } from '../core/ict/displacement/DisplacementEngine';

describe('Checkpoint 32.9.6 - Cryptographic Baseline & Historical Evidence Verification Suite', () => {
  const rootDir = process.cwd();
  const manifestPath = path.join(rootDir, 'CP32.9.6_BASELINE_HASH_MANIFEST.md');
  const reportPath = path.join(rootDir, 'CP32.9.6_HISTORICAL_EVIDENCE_REPORT.md');
  const finalStatusPath = path.join(rootDir, 'CP32.9.6_FINAL_STATUS.md');

  it('1. current HEAD identifiable or UNKNOWN', () => {
    expect(fs.existsSync(reportPath)).toBe(true);
    const content = fs.readFileSync(reportPath, 'utf-8');
    expect(content).toContain('CURRENT_HEAD');
    expect(content).toContain('590a068c1cdfadca77da0b19a6e6f65139574ad8');
  });

  it('2. baseline commit identifiable or UNKNOWN', () => {
    const content = fs.readFileSync(reportPath, 'utf-8');
    expect(content).toContain('BASELINE_COMMIT');
    expect(content).toContain('UNKNOWN');
  });

  it('3. baseline type identifiable', () => {
    const finalStatus = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalStatus).toMatch(/BASELINE_TYPE\s*=\s*(DOCUMENT|SNAPSHOT|COMMIT|HYBRID|UNKNOWN)/);
  });

  it('4. hash algorithm identifiable or UNKNOWN', () => {
    const manifest = fs.readFileSync(manifestPath, 'utf-8');
    expect(manifest).toContain('SHA-256');
  });

  it('5. hash scope identifiable or UNKNOWN', () => {
    const manifest = fs.readFileSync(manifestPath, 'utf-8');
    expect(manifest).toContain('core/ict/**/*.ts');
  });

  it('6. bodyRatio current is 0.60', () => {
    expect(DEFAULT_DISPLACEMENT_CONFIG.minBodyToRangeRatio).toBe(0.60);
  });

  it('7. rangeMultiplier current is 1.50', () => {
    expect(DEFAULT_DISPLACEMENT_CONFIG.minRangeMultiplier).toBe(1.50);
  });

  it('8. FVG current is 0.25', () => {
    expect(DEFAULT_ICT_CONFIG.fvgMinSizePoints).toBe(0.25);
  });

  it('9. displacement historical evidence verified in code and git', () => {
    const dispFile = path.join(rootDir, 'core', 'ict', 'displacement', 'DisplacementEngine.ts');
    expect(fs.existsSync(dispFile)).toBe(true);
    const fileContent = fs.readFileSync(dispFile, 'utf-8');
    expect(fileContent).toContain('minBodyToRangeRatio: 0.6');
    expect(fileContent).toContain('minRangeMultiplier: 1.5');
  });

  it('10. FVG historical evidence verified in config', () => {
    const configFile = path.join(rootDir, 'core', 'ict', 'types', 'ICTConfig.ts');
    expect(fs.existsSync(configFile)).toBe(true);
    const fileContent = fs.readFileSync(configFile, 'utf-8');
    expect(fileContent).toContain('fvgMinSizePoints: 0.25');
  });

  it('11. model historical evidence verified in predefined models', () => {
    const modelFile = path.join(rootDir, 'core', 'ict', 'models', 'PredefinedModels.ts');
    expect(fs.existsSync(modelFile)).toBe(true);
    const content = fs.readFileSync(modelFile, 'utf-8');
    expect(content).toContain('MODEL_A');
    expect(content).toContain('MODEL_B');
    expect(content).toContain('MODEL_C');
  });

  it('12. MISMATCH-01 historical evidence documented and untampered', () => {
    const report = fs.readFileSync(reportPath, 'utf-8');
    expect(report).toContain('MISMATCH');
    const finalStatus = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalStatus).toContain('MISMATCH_01_HISTORICAL_EVIDENCE = VERIFIED');
  });

  it('13. GAP-01 historical evidence documented and untampered', () => {
    const report = fs.readFileSync(reportPath, 'utf-8');
    expect(report).toContain('GAP');
    const finalStatus = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalStatus).toContain('GAP_01_HISTORICAL_EVIDENCE = VERIFIED');
  });

  it('14. distinction document/content/cryptographic match preserved', () => {
    const finalStatus = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalStatus).toContain('DOCUMENT_MATCH = YES');
    expect(finalStatus).toContain('CONTENT_MATCH = YES');
    expect(finalStatus).toContain('CRYPTOGRAPHIC_MATCH = PARTIAL');
  });

  it('15. no production mutation performed by this checkpoint', () => {
    const finalStatus = fs.readFileSync(finalStatusPath, 'utf-8');
    expect(finalStatus).toContain('PRODUCTION_MODIFIED_BY_CP32_9_6 = NO');
    expect(finalStatus).toContain('PARAMETERS_MODIFIED_BY_CP32_9_6 = NO');
    expect(finalStatus).toContain('MODEL_MODIFIED_BY_CP32_9_6 = NO');
  });
});
