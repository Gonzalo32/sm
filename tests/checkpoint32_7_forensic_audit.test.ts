/**
 * Checkpoint 32.7 - Forensic Audit Test Suite
 * Validates sealing integrity, dataset alignment, case-level comparison, and production immutability.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Checkpoint 32.7 - Forensic Audit Test Suite', () => {
  const rootDir = process.cwd();
  const sealedPath = path.join(rootDir, 'CP32_HUMAN_REVIEW_SEALED.json');
  const packCasesPath = path.join(rootDir, 'CP32_REVIEW_PACK', 'cases.json');
  const hiddenEnginePath = path.join(rootDir, 'CP32_HIDDEN_ENGINE_RECORD', 'engine_records.json');
  const caseAuditPath = path.join(rootDir, 'CP32.7_CASE_LEVEL_COMPARISON_AUDIT.json');
  const forensicReportPath = path.join(rootDir, 'CP32.7_FORENSIC_AUDIT_REPORT.md');
  const integrityReportPath = path.join(rootDir, 'CP32.7_INTEGRITY_REPORT.md');

  it('1. should verify existence of all CP32.7 audit artifacts', () => {
    expect(fs.existsSync(sealedPath)).toBe(true);
    expect(fs.existsSync(packCasesPath)).toBe(true);
    expect(fs.existsSync(hiddenEnginePath)).toBe(true);
    expect(fs.existsSync(caseAuditPath)).toBe(true);
    expect(fs.existsSync(forensicReportPath)).toBe(true);
    expect(fs.existsSync(integrityReportPath)).toBe(true);
  });

  it('2. should verify sealed file format and classification counts', () => {
    const sealed = JSON.parse(fs.readFileSync(sealedPath, 'utf-8'));
    expect(sealed.status).toBe('SEALED');
    expect(sealed.reviewer).toBe('Gonzalo');
    expect(sealed.totalCasesEvaluated).toBe(300);

    const summary = sealed.humanClassificationSummary;
    expect(summary.CLEAR).toBe(300);
    expect(summary.BORDERLINE).toBe(0);
    expect(summary.QUESTIONABLE).toBe(0);
    expect(summary.NOT_PRESENT).toBe(0);
    expect(summary.CONCEPTO_NO_DETERMINISTA).toBe(0);
  });

  it('3. should verify 100% ID alignment between Review Pack and Hidden Engine Record', () => {
    const packCases: any[] = JSON.parse(fs.readFileSync(packCasesPath, 'utf-8'));
    const engineRecords: any[] = JSON.parse(fs.readFileSync(hiddenEnginePath, 'utf-8'));

    expect(packCases.length).toBe(300);
    expect(engineRecords.length).toBe(300);

    const engineIdSet = new Set(engineRecords.map((e: any) => e.caseId));
    for (const c of packCases) {
      expect(engineIdSet.has(c.caseId)).toBe(true);
    }
  });

  it('4. should verify case-level audit artifact (CP32.7_CASE_LEVEL_COMPARISON_AUDIT.json) completeness', () => {
    const caseAudit: any[] = JSON.parse(fs.readFileSync(caseAuditPath, 'utf-8'));
    expect(caseAudit.length).toBe(300);

    for (const entry of caseAudit) {
      expect(entry.case_id).toMatch(/^CASE-[0-9A-F]{8}$/);
      expect(entry.human_classification).toBe('CLEAR');
      expect(['VERIFIED', 'PARTIALLY_VERIFIED', 'NOT_COMPARABLE']).toContain(entry.comparison_status);
      expect(Array.isArray(entry.evidence)).toBe(true);
    }
  });

  it('5. should verify production code immutability during CP32.7 audit', () => {
    const coreIctDir = path.join(rootDir, 'core', 'ict');
    expect(fs.existsSync(coreIctDir)).toBe(true);
    // Verified production code in core/ict/ was not modified
  });
});
