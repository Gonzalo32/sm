const fs = require('fs');
const path = require('path');

const s8200Path = path.join(process.cwd(), 'data_audit', 'phase_s8_5', 's8_5_real_market_outcome_dataset.json');
const s88Path = path.join(process.cwd(), 'data_audit', 'phase_s8_8', 's8_8_oos_trade_dataset.json');
const s9Path = path.join(process.cwd(), 'data_audit', 'phase_s9', 's9_oos_trade_dataset.json');

const s8200 = JSON.parse(fs.readFileSync(s8200Path, 'utf-8')).trades || [];
const s88 = JSON.parse(fs.readFileSync(s88Path, 'utf-8')).trades || [];
const s9 = JSON.parse(fs.readFileSync(s9Path, 'utf-8')).trades || [];

function getContracts(trades) {
  const map = {};
  trades.forEach(t => {
    const c = t.contract || t.symbol || 'UNKNOWN';
    map[c] = (map[c] || 0) + 1;
  });
  return map;
}

console.log('S8-200 contracts:', getContracts(s8200));
console.log('S8.8 contracts:', getContracts(s88));
console.log('S9 contracts:', getContracts(s9));
