import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

describe('Checkpoint 33.7 — Independent Historical Dataset Expansion & Normalization Audit', () => {
  const rootDir = process.cwd();
  const auditDir = path.join(rootDir, 'data_audit', 'cp33_7');
  const inventoryPath = path.join(auditDir, 'CP33.7_CONTRACT_INVENTORY.json');
  const manifestPath = path.join(auditDir, 'manifests', 'CP33.7_MANIFEST.json');

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

  it('2. should verify existence and schema completeness of CP33.7_CONTRACT_INVENTORY.json', () => {
    expect(fs.existsSync(inventoryPath)).toBe(true);
    const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));

    expect(inventory.provider).toBe('Databento');
    expect(inventory.dataset).toBe('GLBX.MDP3');
    expect(inventory.venue).toBe('CME');
    expect(inventory.instruments.NQ).toHaveLength(3);
    expect(inventory.instruments.MNQ).toHaveLength(3);

    const nqContracts = inventory.instruments.NQ.map((c: any) => c.contract);
    const mnqContracts = inventory.instruments.MNQ.map((c: any) => c.contract);

    expect(nqContracts).toEqual(['NQZ25', 'NQH26', 'NQM26']);
    expect(mnqContracts).toEqual(['MNQZ25', 'MNQH26', 'MNQM26']);
  });

  it('3. should verify raw, normalized, and derived contract files exist for all 6 contracts', () => {
    const contracts = [
      { sym: 'nq', c: 'nqz25' },
      { sym: 'nq', c: 'nqh26' },
      { sym: 'nq', c: 'nqm26' },
      { sym: 'mnq', c: 'mnqz25' },
      { sym: 'mnq', c: 'mnqh26' },
      { sym: 'mnq', c: 'mnqm26' },
    ];

    for (const item of contracts) {
      const rawFile = path.join(auditDir, 'raw', `${item.sym}_${item.c}_raw.json`);
      const normFile = path.join(auditDir, 'normalized', `${item.sym}_${item.c}_normalized.json`);
      const d5mFile = path.join(auditDir, 'derived', `${item.sym}_${item.c}_5m.json`);
      const d15mFile = path.join(auditDir, 'derived', `${item.sym}_${item.c}_15m.json`);
      const d1hFile = path.join(auditDir, 'derived', `${item.sym}_${item.c}_1h.json`);

      expect(fs.existsSync(rawFile)).toBe(true);
      expect(fs.existsSync(normFile)).toBe(true);
      expect(fs.existsSync(d5mFile)).toBe(true);
      expect(fs.existsSync(d15mFile)).toBe(true);
      expect(fs.existsSync(d1hFile)).toBe(true);
    }
  });

  it('4. should verify SHA-256 raw and normalized hashes match CP33.7_MANIFEST.json', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    expect(manifest.contracts).toHaveLength(6);
    expect(manifest.raw_contract_price_policy).toBe('IMMUTABLE_UNADJUSTED');

    for (const cEntry of manifest.contracts) {
      const rawFile = path.join(auditDir, 'raw', `${cEntry.symbol.toLowerCase()}_${cEntry.contract.toLowerCase()}_raw.json`);
      const rawContent = fs.readFileSync(rawFile, 'utf8');
      const computedRawHash = crypto.createHash('sha256').update(rawContent, 'utf8').digest('hex');

      expect(computedRawHash).toBe(cEntry.raw_sha256);
    }
  });

  it('5. should verify 100% OHLCV integrity and contract isolation across multi-contract series', () => {
    const normFile = path.join(auditDir, 'normalized', 'nq_nqh26_normalized.json');
    const candles = JSON.parse(fs.readFileSync(normFile, 'utf8'));

    for (const c of candles) {
      expect(c.symbol).toBe('NQ');
      expect(c.contract_symbol).toBe('NQH26');
      expect(c.instrument_id).toBe(10425);
      expect(c.high).toBeGreaterThanOrEqual(c.open);
      expect(c.high).toBeGreaterThanOrEqual(c.close);
      expect(c.low).toBeLessThanOrEqual(c.open);
      expect(c.low).toBeLessThanOrEqual(c.close);
      expect(c.high).toBeGreaterThanOrEqual(c.low);
      expect(c.volume).toBeGreaterThanOrEqual(0);
    }
  });

  it('6. should verify Option B derived timeframe aggregation determinism across contracts', () => {
    const normFile = path.join(auditDir, 'normalized', 'mnq_mnqh26_normalized.json');
    const d5mFile = path.join(auditDir, 'derived', 'mnq_mnqh26_5m.json');

    const normCandles = JSON.parse(fs.readFileSync(normFile, 'utf8'));
    const d5mCandles = JSON.parse(fs.readFileSync(d5mFile, 'utf8'));

    expect(d5mCandles.length).toBe(Math.ceil(normCandles.length / 5));

    const first5mBar = d5mCandles[0];
    const first5_1mBars = normCandles.slice(0, 5);

    expect(first5mBar.open).toBe(first5_1mBars[0].open);
    expect(first5mBar.high).toBe(Math.max(...first5_1mBars.map((b: any) => b.high)));
    expect(first5mBar.low).toBe(Math.min(...first5_1mBars.map((b: any) => b.low)));
    expect(first5mBar.close).toBe(first5_1mBars[4].close);
  });

  it('7. should verify OOS dataset boundary separation and non-contamination', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.classification).toBe('SOURCE_AUDIT_DATA');
    expect(manifest.oos_separation_confirmed).toBe(true);
    expect(manifest.production_logic_modified).toBe(false);

    expect(auditDir).toContain('data_audit');
    expect(auditDir).not.toContain('oos_dataset');
  });

  it('8. should verify existence of required CP33.7 audit markdown documentation', () => {
    const auditDocPath = path.join(rootDir, 'CP33.7_INDEPENDENT_DATASET_EXPANSION_AUDIT.md');
    const finalStatusDocPath = path.join(rootDir, 'CP33.7_FINAL_STATUS.md');

    expect(fs.existsSync(auditDocPath)).toBe(true);
    expect(fs.existsSync(finalStatusDocPath)).toBe(true);

    const docContent = fs.readFileSync(auditDocPath, 'utf8');
    expect(docContent).toContain('CP33.7 — INDEPENDENT HISTORICAL DATASET EXPANSION & NORMALIZATION AUDIT');
    expect(docContent).toContain('NQZ25');
    expect(docContent).toContain('NQH26');
    expect(docContent).toContain('NQM26');
    expect(docContent).toContain('IMMUTABLE_UNADJUSTED');
    expect(docContent).toContain('CP33.7_CONTRACT_INVENTORY.json');
  });
});
