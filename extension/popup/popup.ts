/**
 * Popup UI Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const symbolVal = document.getElementById('symbol-val');
  const tfVal = document.getElementById('tf-val');
  const fwVal = document.getElementById('fw-val');
  const btnScan = document.getElementById('btn-scan');

  // Load from chrome.storage
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['lastProbeData'], (result) => {
      if (result.lastProbeData) {
        if (symbolVal) symbolVal.textContent = result.lastProbeData.symbol || 'MNQ';
        if (tfVal) tfVal.textContent = result.lastProbeData.timeframe || '1m';
        if (fwVal) fwVal.textContent = result.lastProbeData.chartFramework || 'TradingView';
      }
    });
  }

  btnScan?.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'TRIGGER_PROBE' });
      }
    });
  });
});
