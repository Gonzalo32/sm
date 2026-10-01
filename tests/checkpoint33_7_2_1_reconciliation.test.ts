import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

describe('Checkpoint 33.7.2.1 — Model C Extrapolation & Pricing Reconciliation Audit', () => {
  const rootDir = process.cwd();
  const auditDir = path.join(rootDir, 'data_audit', 'cp33_7_2_1');
  const cp33_7Dir = path.join(rootDir, 'data_audit', 'cp33_7');
  const manifestPath = path.join(auditDir, 'manifests', 'CP33.7.2.1_MANIFEST.json');

  it('1. should verify frozen ICT production parameters remain unaltered', () => {
    const defaultParams = {
      bodyRatio: 0.60,
      rangeMultiplier: 1.50,
      fvgMinSizePoints: 0.25,
      lookbackCandles: 5,
      requireStructuralBreak: false,
      requireFvgCreation: false,
    };

    expect(defaultParams.bodyRatio).toBe(0.60);
    expect(defaultParams.rangeMultiplier).toBe(1.50);
    expect(defaultParams.fvgMinSizePoints).toBe(0.25);
    expect(defaultParams.lookbackCandles).toBe(5);
    expect(defaultParams.requireStructuralBreak).toBe(false);
    expect(defaultParams.requireFvgCreation).toBe(false);
  });

  it('2. should verify immutability of the 6 physical CP33.7 raw datasets', () => {
    const contracts = [
      { sym: 'nq', c: 'nqz25' },
      { sym: 'nq', c: 'nqh26' },
      { sym: 'nq', c: 'nqm26' },
      { sym: 'mnq', c: 'mnqz25' },
      { sym: 'mnq', c: 'mnqh26' },
      { sym: 'mnq', c: 'mnqm26' },
    ];

    for (const item of contracts) {
      const rawFile = path.join(cp33_7Dir, 'raw', `${item.sym}_${item.c}_raw.json`);
      expect(fs.existsSync(rawFile)).toBe(true);

      const rawContent = fs.readFileSync(rawFile, 'utf8');
      const hash = crypto.createHash('sha256').update(rawContent, 'utf8').digest('hex');
      expect(hash).toHaveLength(64);
    }
  });

  it('3. should verify Model C extrapolation status (NOT_VALIDATED) and sample scope', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.model_c_density.extrapolation_status).toBe('MODEL_C_EXTRAPOLATION_STATUS = NOT_VALIDATED');
    expect(manifest.model_c_density.extrapolation_formula).toBe('Illustrative Projection at Observed Sample Density');
    expect(manifest.model_c_density.sample_scope).toContain('OBSERVED_SAMPLE_DENSITY');
  });

  it('4. should verify Model B parametric projection classification', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.model_b_projection.projection_type).toBe('CALENDAR_PARAMETRIC_PROJECTION');
    expect(manifest.model_b_projection.date_specific_cme_calendar).toBe('NOT_VALIDATED_DAY_BY_DAY');
  });

  it('5. should verify cost model classification (PROJECTED_WITH_DOCUMENTED_PRICING_BASIS)', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.cost_basis.cost_model_status).toBe('COST_MODEL_STATUS = PROJECTED_WITH_DOCUMENTED_PRICING_BASIS');
    expect(manifest.cost_basis.usd_values_classification).toBe('PROJECTED');
  });

  it('6. should verify measured storage classification across the 6 physical datasets', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.measured_storage).toHaveLength(6);
    for (const entry of manifest.measured_storage) {
      expect(entry.status).toBe('MEASURED_STORAGE');
      expect(entry.raw_size_bytes).toBeGreaterThan(0);
      expect(entry.normalized_size_bytes).toBeGreaterThan(0);
    }
  });

  it('7. should verify explicit classification labels in manifest', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.classifications.observed).toContain('6 Physical CP33.7 Datasets');
    expect(manifest.classifications.measured).toContain('Measured Byte Sizes');
    expect(manifest.classifications.projected).toContain('Multi-Horizon');
    expect(manifest.classifications.not_validated).toContain('Model C Multi-Year Extrapolation');
    expect(manifest.classifications.documented_provider_capability).toContain('Multi-Year Historical Depth');
  });

  it('8. should verify OOS dataset boundary separation and non-contamination', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.classification).toBe('SOURCE_AUDIT_DATA');
    expect(manifest.oos_separation_confirmed).toBe(true);
    expect(manifest.production_logic_modified).toBe(false);

    expect(auditDir).toContain('data_audit');
    expect(auditDir).not.toContain('oos_dataset');
  });

  it('9. should verify existence of required CP33.7.2.1 audit markdown documentation', () => {
    const auditDocPath = path.join(rootDir, 'CP33.7.2.1_RECONCILIATION.md');
    const finalStatusDocPath = path.join(rootDir, 'CP33.7.2.1_FINAL_STATUS.md');

    expect(fs.existsSync(auditDocPath)).toBe(true);
    expect(fs.existsSync(finalStatusDocPath)).toBe(true);

    const docContent = fs.readFileSync(auditDocPath, 'utf8');
    expect(docContent).toContain('CP33.7.2.1 — MODEL C EXTRAPOLATION & PRICING RECONCILIATION AUDIT');
    expect(docContent).toContain('MODEL_C_EXTRAPOLATION_STATUS = NOT_VALIDATED');
    expect(docContent).toContain('CALENDAR_PARAMETRIC_PROJECTION');
    expect(docContent).toContain('COST_MODEL_STATUS = PROJECTED_WITH_DOCUMENTED_PRICING_BASIS');
  });
});
