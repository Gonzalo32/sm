/**
 * Checkpoint 32 - Contamination Protection Test Suite
 * Validates absolute isolation between CP32_REVIEW_PACK and CP32_HIDDEN_ENGINE_RECORD.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Checkpoint 32 - Contamination Protection Suite', () => {
  it('should confirm CP32_REVIEW_PACK is in a separate directory from CP32_HIDDEN_ENGINE_RECORD', () => {
    const packDir = path.join(process.cwd(), 'CP32_REVIEW_PACK');
    const hiddenDir = path.join(process.cwd(), 'CP32_HIDDEN_ENGINE_RECORD');

    expect(packDir).not.toBe(hiddenDir);
    expect(fs.existsSync(packDir)).toBe(true);
    expect(fs.existsSync(hiddenDir)).toBe(true);
  });

  it('should verify engine_records.json is NOT inside CP32_REVIEW_PACK/', () => {
    const leakedPath = path.join(process.cwd(), 'CP32_REVIEW_PACK', 'engine_records.json');
    expect(fs.existsSync(leakedPath)).toBe(false);
  });

  it('should verify CP32_COMPARISON_REPORT.md only exists after human review completion and sealing', () => {
    const sealedPath = path.join(process.cwd(), 'CP32_HUMAN_REVIEW_SEALED.json');
    const compReportPath = path.join(process.cwd(), 'CP32_COMPARISON_REPORT.md');

    if (!fs.existsSync(sealedPath)) {
      expect(fs.existsSync(compReportPath)).toBe(false);
    } else {
      expect(fs.existsSync(compReportPath)).toBe(true);
    }
  });
});
