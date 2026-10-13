const fs = require('fs');
const path = require('path');

function inspectFile(filePath, datasetName) {
  console.log(`\n=== Inspecting ${datasetName} (${filePath}) ===`);
  if (!fs.existsSync(filePath)) {
    console.log(`File does not exist: ${filePath}`);
    return;
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw);
  const trades = Array.isArray(parsed) ? parsed : parsed.trades || [];
  console.log(`Total trades: ${trades.length}`);
  if (trades.length === 0) return;

  const first = trades[0];
  const last = trades[trades.length - 1];

  console.log('First trade keys:', Object.keys(first));
  console.log('First trade:', {
    tradeId: first.tradeId,
    candidateTimestamp: first.candidateTimestamp,
    signalTimestamp: first.signalTimestamp,
    entryTimestamp: first.entryTimestamp,
    exitTimestamp: first.exitTimestamp || first.forwardExitTimestamp,
    contract: first.contract || first.symbol,
  });
  
  const getSig = (t) => t.signalTimestamp || t.candidateTimestamp || t.entryTimestamp;

  const firstSig = getSig(first);
  const lastSig = getSig(last);

  console.log('First signal timestamp raw:', firstSig, 'ISO:', new Date(firstSig).toISOString());
  console.log('Last signal timestamp raw:', lastSig, 'ISO:', new Date(lastSig).toISOString());
}

inspectFile(path.join(process.cwd(), 'data_audit', 'phase_s8_5', 's8_5_real_market_outcome_dataset.json'), 'S8-200 (S8.5)');
inspectFile(path.join(process.cwd(), 'data_audit', 'phase_s8_8', 's8_8_oos_trade_dataset.json'), 'S8.8');
inspectFile(path.join(process.cwd(), 'data_audit', 'phase_s9', 's9_oos_trade_dataset.json'), 'S9');
