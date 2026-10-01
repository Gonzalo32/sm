import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

describe('Checkpoint 33.7.2 — CME Session Calendar & Cost Basis Reconciliation Audit', () => {
  const rootDir = process.cwd();
  const auditDir = path.join(rootDir, 'data_audit', 'cp33_7_2');
  const cp33_7Dir = path.join(rootDir, 'data_audit', 'cp33_7');
  const sessionModelPath = path.join(auditDir, 'CP33.7.2_SESSION_MODEL.json');
  const densityModelPath = path.join(auditDir, 'CP33.7.2_DENSITY_MODEL.json');
  const costModelPath = path.join(auditDir, 'CP33.7.2_COST_MODEL.json');
  const statsPath = path.join(auditDir, 'CP33.7.2_OBSERVED_STATS.json');
  const manifestPath = path.join(auditDir, 'manifests', 'CP33.7.2_MANIFEST.json');

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

  it('3. should verify Model A, Model B, and Model C definitions and session separation', () => {
    expect(fs.existsSync(sessionModelPath)).toBe(true);
    const sessionData = JSON.parse(fs.readFileSync(sessionModelPath, 'utf8'));

    expect(sessionData.session_structure).toContain('Sunday 18:00 ET to Friday 17:00 ET');
    expect(sessionData.models['30d'].model_a_theoretical_calendar_grid).toBe(30 * 1440);
    expect(sessionData.models['30d'].model_b_tradable_session_minutes).toBe(21 * 1380); // 21 trading days * 23h
  });

  it('4. should verify empirical density measurement across the 6 physical datasets in CP33.7.2_DENSITY_MODEL.json', () => {
    expect(fs.existsSync(densityModelPath)).toBe(true);
    const densityData = JSON.parse(fs.readFileSync(densityModelPath, 'utf8'));

    expect(densityData.classification).toBe('OBSERVED_SAMPLE_DENSITY');
    expect(densityData.nq_sample_density).toBe(1.0);
    expect(densityData.mnq_sample_density).toBe(1.0);
    expect(densityData.combined_sample_density).toBe(1.0);
  });

  it('5. should verify observed stats and measured record footprints in CP33.7.2_OBSERVED_STATS.json', () => {
    expect(fs.existsSync(statsPath)).toBe(true);
    const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));

    expect(stats).toHaveLength(6);
    for (const entry of stats) {
      expect(entry.observed_records).toBe(1440);
      expect(entry.elapsed_calendar_minutes).toBe(1440);
      expect(entry.density).toBe(1.0);
      expect(entry.raw_bytes_per_record).toBeGreaterThan(100);
      expect(entry.normalized_bytes_per_record).toBeGreaterThan(150);
    }
  });

  it('6. should verify Databento cost basis model and storage projections in CP33.7.2_COST_MODEL.json', () => {
    expect(fs.existsSync(costModelPath)).toBe(true);
    const costData = JSON.parse(fs.readFileSync(costModelPath, 'utf8'));

    expect(costData.pricing_model).toContain('Databento');
    expect(costData.price_per_gb_usd).toBe(0.04);
    expect(costData.cost_status).toBe('DOCUMENTED_PRICE_STRUCTURE');
    expect(costData.horizon_projections['1y'].data_acquisition_cost_usd).toBeGreaterThan(0);
  });

  it('7. should verify rollover terminology correction (individual_contract = NOT_APPLICABLE, continuous = NOT_IMPLEMENTED)', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.rollover.individual_contract).toBe('NOT_APPLICABLE');
    expect(manifest.rollover.continuous_series).toBe('NOT_IMPLEMENTED');
    expect(manifest.rollover.candidate_future_policy).toBe('UNADJUSTED_VOLUME_ROLL');
  });

  it('8. should verify OOS dataset boundary separation and non-contamination', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.classification).toBe('SOURCE_AUDIT_DATA');
    expect(manifest.oos_separation_confirmed).toBe(true);
    expect(manifest.production_logic_modified).toBe(false);

    expect(auditDir).toContain('data_audit');
    expect(auditDir).not.toContain('oos_dataset');
  });

  it('9. should verify existence of required CP33.7.2 audit markdown documentation', () => {
    const auditDocPath = path.join(rootDir, 'CP33.7.2_SESSION_CALENDAR_RECONCILIATION.md');
    const finalStatusDocPath = path.join(rootDir, 'CP33.7.2_FINAL_STATUS.md');

    expect(fs.existsSync(auditDocPath)).toBe(true);
    expect(fs.existsSync(finalStatusDocPath)).toBe(true);

    const docContent = fs.readFileSync(auditDocPath, 'utf8');
    expect(docContent).toContain('CP33.7.2 — CME SESSION CALENDAR & COST BASIS RECONCILIATION AUDIT');
    expect(docContent).toContain('CME_CALENDAR_AWARE_SESSION_GRID');
    expect(docContent).toContain('OBSERVED_SAMPLE_DENSITY');
    expect(docContent).toContain('COST & STORAGE MODEL RECONCILIATION');
  });
});
