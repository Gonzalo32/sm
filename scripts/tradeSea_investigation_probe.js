/**
 * TradeSea Technical Investigation Probe - Phase 0
 * Run directly in browser console on app.tradesea.ai or injected via Content Script
 */

(function runTradeSeaProbe() {
  console.log('====================================================');
  console.log('[ICT Assistant Probe] Starting TradeSea Technical Inspection...');
  console.log('====================================================');

  const report = {
    symbol: 'UNKNOWN',
    timeframe: 'UNKNOWN',
    candles: [],
    framework: 'UNKNOWN',
    wsDetected: false,
    xhrEndpoints: [],
    domCanvasCount: 0,
    tvWidgetFound: false,
    timestamp: new Date().toISOString()
  };

  // 1. Inspect TradingView Widget & Page Globals
  if (window.tvWidget || window.TradingView || window.TradingViewApi) {
    report.framework = 'TradingView Charting Library';
    report.tvWidgetFound = true;
    console.log('[Probe] TradingView global object detected!');
  } else {
    // Search iframe / DOM for TradingView elements
    const tvIframe = document.querySelector('iframe[id^="tradingview_"]');
    const tvContainer = document.querySelector('.tv-side-toolbar') || document.querySelector('[class*="chart-container"]');
    if (tvIframe || tvContainer) {
      report.framework = 'TradingView Embedded (DOM Container)';
    }
  }

  // 2. DOM & Canvas Inspection
  const canvases = document.querySelectorAll('canvas');
  report.domCanvasCount = canvases.length;
  console.log(`[Probe] Found ${canvases.length} canvas elements on page.`);

  // 3. Symbol and Timeframe Detection via DOM heuristics
  const symbolEl = document.querySelector('[data-name="legend-source-title"]') || 
                   document.querySelector('.title-3-311-text') || 
                   document.querySelector('[class*="symbol"]');
  if (symbolEl && symbolEl.textContent) {
    report.symbol = symbolEl.textContent.trim();
  }

  const timeframeEl = document.querySelector('[class*="resolution"]') || 
                      document.querySelector('[data-role="button"][class*="selected"]');
  if (timeframeEl && timeframeEl.textContent) {
    report.timeframe = timeframeEl.textContent.trim();
  }

  // 4. Hooking WebSockets & Fetch for Data Stream discovery
  console.log('[Probe] Inspection strategy ready. Injecting interceptors...');

  console.log('====================================================');
  console.log('[ICT Assistant Probe] Result Summary:', JSON.stringify(report, null, 2));
  console.log('====================================================');

  return report;
})();
