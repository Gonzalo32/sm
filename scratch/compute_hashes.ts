import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const oosDir = path.join(process.cwd(), 'oos_dataset');

function getHash(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

const rawHash = getHash(path.join(oosDir, 'raw', 'raw_candles.json'));
const normHash = getHash(path.join(oosDir, 'normalized', 'normalized_candles.json'));
const casesHash = getHash(path.join(oosDir, 'cases', 'cases.json'));
const selectionHash = getHash(path.join(oosDir, 'selection_manifest.json'));
const acqReportHash = getHash(path.join(oosDir, 'acquisition_report.md'));
const intReportHash = getHash(path.join(oosDir, 'integrity_report.md'));
const contReportHash = getHash(path.join(oosDir, 'contamination_report.md'));

const manifestPath = path.join(oosDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

manifest.file_hashes = {
  raw_candles: rawHash,
  normalized_candles: normHash,
  cases: casesHash,
  selection_manifest: selectionHash,
  acquisition_report: acqReportHash,
  integrity_report: intReportHash,
  contamination_report: contReportHash,
};

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

// Compute final hash for manifest itself
const manifestHash = getHash(manifestPath);
console.log('Manifest Hash:', manifestHash);
console.log('Hashes successfully updated!');
