/**
 * Popup UI Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const symbolVal = document.getElementById('symbol-val');
  const tfVal = document.getElementById('tf-val');
  const fwVal = document.getElementById('fw-val');
  const btnScan = document.getElementById('btn-scan');
  const statusBadge = document.getElementById('extension-status-badge');
  const btnTogglePower = document.getElementById('btn-toggle-power') as HTMLButtonElement | null;
  const btnToggleOverlay = document.getElementById('btn-toggle-overlay') as HTMLButtonElement | null;

  let isRunning = true;
  let isOverlayVisible = true;

  function updatePowerUI(running: boolean) {
    isRunning = running;
    if (btnTogglePower) {
      btnTogglePower.textContent = running ? '⏹ Detener Extensión' : '▶ Iniciar Extensión';
      btnTogglePower.style.backgroundColor = running ? '#ef4444' : '#22c55e';
    }
    if (statusBadge) {
      statusBadge.textContent = running ? 'ACTIVA' : 'DETENIDA';
      statusBadge.style.backgroundColor = running ? '#22c55e' : '#ef4444';
    }
  }

  function updateOverlayUI(visible: boolean) {
    isOverlayVisible = visible;
    if (btnToggleOverlay) {
      btnToggleOverlay.textContent = visible ? '👁 Ocultar Gráfico' : '👁 Mostrar Gráfico';
      btnToggleOverlay.style.color = visible ? '#cbd5e1' : '#facc15';
    }
  }

  // Load from chrome.storage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['lastProbeData', 'extensionRunning', 'chartOverlayVisible'], (result) => {
      if (result.lastProbeData) {
        if (symbolVal) symbolVal.textContent = result.lastProbeData.symbol || 'MNQ';
        if (tfVal) tfVal.textContent = result.lastProbeData.timeframe || '1m';
        if (fwVal) fwVal.textContent = result.lastProbeData.chartFramework || 'TradingView';
      }
      if (result.extensionRunning !== undefined) {
        updatePowerUI(result.extensionRunning);
      }
      if (result.chartOverlayVisible !== undefined) {
        updateOverlayUI(result.chartOverlayVisible);
      }
    });
  }

  // Query active tab for live status to guarantee 100% accurate sync
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'ICT_GET_STATUS' }, (response) => {
          if (chrome.runtime.lastError) return;
          if (response && response.status === 'OK') {
            if (response.running !== undefined) updatePowerUI(response.running);
            if (response.overlayVisible !== undefined) updateOverlayUI(response.overlayVisible);
            if (response.context) {
              if (symbolVal) symbolVal.textContent = response.context.symbol || 'MNQ';
              if (tfVal) tfVal.textContent = response.context.timeframe || '1m';
            }
          }
        });
      }
    });
  }

  btnTogglePower?.addEventListener('click', () => {
    const nextRunning = !isRunning;
    updatePowerUI(nextRunning);
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ extensionRunning: nextRunning });
    }
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'ICT_SET_RUNNING_STATE', running: nextRunning });
        }
      });
    }
  });

  btnToggleOverlay?.addEventListener('click', () => {
    const nextOverlay = !isOverlayVisible;
    updateOverlayUI(nextOverlay);
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ chartOverlayVisible: nextOverlay });
    }
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'ICT_TOGGLE_CHART_OVERLAY', visible: nextOverlay });
        }
      });
    }
  });

  btnScan?.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'TRIGGER_PROBE' });
        }
      });
    }
  });
});
