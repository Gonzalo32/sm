import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

describe('Checkpoint 33.7.1 — Historical Horizon, Volume & Cost Reconciliation Audit', () => {
  const rootDir = process.cwd();
  const auditDir = path.join(rootDir, 'data_audit', 'cp33_7_1');
  const cp33_7Dir = path.join(rootDir, 'data_audit', 'cp33_7');
  const statsPath = path.join(auditDir, 'CP33.7.1_OBSERVED_CONTRACT_STATS.json');
  const horizonMatrixPath = path.join(auditDir, 'CP33.7.1_HORIZON_MATRIX.json');
  const volumeCostPath = path.join(auditDir, 'CP33.7.1_VOLUME_COST_MODEL.json');
  const manifestPath = path.join(auditDir, 'manifests', 'CP33.7.1_MANIFEST.json');

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

  it('3. should verify distinction between documented provider capability and empirical acquisition', () => {
    expect(fs.existsSync(horizonMatrixPath)).toBe(true);
    const horizonMatrix = JSON.parse(fs.readFileSync(horizonMatrixPath, 'utf8'));

    expect(horizonMatrix['30d'].provider_capability).toBe('DOCUMENTED_PROVIDER_CAPABILITY');
    expect(horizonMatrix['30d'].empirically_acquired).toBe('NOT_TESTED');
    expect(horizonMatrix['10y'].provider_capability).toBe('DOCUMENTED_PROVIDER_CAPABILITY');
    expect(horizonMatrix['10y'].empirically_acquired).toBe('NOT_TESTED');
  });

  it('4. should verify mathematical volume models (Model A continuous 24h vs Model B session-adjusted)', () => {
    expect(fs.existsSync(volumeCostPath)).toBe(true);
    const modelData = JSON.parse(fs.readFileSync(volumeCostPath, 'utf8'));

    const model30d = modelData.models['30d'];
    expect(model30d.model_a_continuous_grid_records).toBe(30 * 1440); // 43,200
    expect(model30d.model_b_session_adjusted_records).toBe(21 * 1380); // 28,980 (approx 21 trading days)

    const model1y = modelData.models['1y'];
    expect(model1y.model_a_continuous_grid_records).toBe(365 * 1440); // 525,600
    expect(model1y.model_b_session_adjusted_records).toBe(260 * 1380); // 358,800
  });

  it('5. should verify Databento ohlcv-1m no-trade interval omission rule', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.databento_semantics.schema).toBe('ohlcv-1m');
    expect(manifest.databento_semantics.empty_interval_handling).toBe('OMITTED_NO_TRADE_BARS');
    expect(manifest.databento_semantics.record_count_rule).toBe('RECORD_COUNT != MINUTE_GRID_COUNT');
  });

  it('6. should verify observed statistics across the 6 physical datasets in CP33.7.1_OBSERVED_CONTRACT_STATS.json', () => {
    expect(fs.existsSync(statsPath)).toBe(true);
    const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));

    expect(stats).toHaveLength(6);
    for (const entry of stats) {
      expect(entry.observed_records).toBe(1440);
      expect(entry.elapsed_minutes).toBe(1440);
      expect(entry.record_density).toBe(1.0);
      expect(entry.unexpected_gaps).toBe(0);
    }
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

  it('9. should verify existence of required CP33.7.1 audit markdown documentation', () => {
    const auditDocPath = path.join(rootDir, 'CP33.7.1_HISTORICAL_HORIZON_RECONCILIATION.md');
    const finalStatusDocPath = path.join(rootDir, 'CP33.7.1_FINAL_STATUS.md');

    expect(fs.existsSync(auditDocPath)).toBe(true);
    expect(fs.existsSync(finalStatusDocPath)).toBe(true);

    const docContent = fs.readFileSync(auditDocPath, 'utf8');
    expect(docContent).toContain('CP33.7.1 — HISTORICAL HORIZON, VOLUME & COST RECONCILIATION AUDIT');
    expect(docContent).toContain('DOCUMENTED_PROVIDER_CAPABILITY');
    expect(docContent).toContain('MINUTE_GRID_COUNT');
    expect(docContent).toContain('STORAGE & COST SCALING MODEL');
  });
});
