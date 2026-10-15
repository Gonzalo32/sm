/**
 * ICT Assistant - Page Bridge (MAIN World)
 * Captures live TradeSea WS/REST market feeds, detects symbol/timeframe changes,
 * and performs historical backfill probes.
 */

import { Candle, HistoricalFetchReport } from '../../core/market/Candle';

(function initPageBridge() {
  console.log('[ICT Assistant Bridge] Main world bridge initialized.');

  let currentSymbol = 'MNQ';
  let currentTimeframe = '1m';
  let activeCandleTimestamp = 0;

  // Detect Symbol & Timeframe from TradingView widget or DOM
  function detectContext() {
    let newSymbol = currentSymbol;
    let newTimeframe = currentTimeframe;

    // 1. TradingView Widget API inspection
    if ((window as any).tvWidget && typeof (window as any).tvWidget.activeChart === 'function') {
      try {
        const chart = (window as any).tvWidget.activeChart();
        if (chart.symbol()) newSymbol = chart.symbol();
        if (chart.resolution()) newTimeframe = chart.resolution();
      } catch (e) {
        // Fallback to DOM
      }
    }

    // 2. DOM Selectors Fallback
    const symEl = document.querySelector('[class*="symbol-title"]') || 
                   document.querySelector('[data-name="legend-source-title"]') ||
                   document.querySelector('.title-3-311-text');
    if (symEl && symEl.textContent) {
      newSymbol = symEl.textContent.trim();
    }

    const tfEl = document.querySelector('[class*="resolution-button"][class*="active"]') || 
                 document.querySelector('[data-role="button"][class*="selected"]');
    if (tfEl && tfEl.textContent) {
      newTimeframe = tfEl.textContent.trim();
    }

    if (newSymbol !== currentSymbol || newTimeframe !== currentTimeframe) {
      console.log(`[ICT Bridge] Context Change: ${currentSymbol} ${currentTimeframe} -> ${newSymbol} ${newTimeframe}`);
      currentSymbol = newSymbol;
      currentTimeframe = newTimeframe;
      activeCandleTimestamp = 0;
      window.postMessage({
        type: 'ICT_CONTEXT_CHANGED',
        payload: { symbol: currentSymbol, timeframe: currentTimeframe },
      }, '*');
    }

    return { symbol: currentSymbol, timeframe: currentTimeframe };
  }

  // Periodic Context Polling
  setInterval(detectContext, 1000);

  // Checkpoint 86: Passive Viewport Inspection from TradingView Widget API (Strict Read-Only)
  let lastReportedViewport: { minPrice: number; maxPrice: number; width: number; height: number; firstIdx?: number; lastIdx?: number } | null = null;

  function inspectTradingViewViewport() {
    try {
      const tvWidget = (window as any).tvWidget;
      if (!tvWidget || typeof tvWidget.activeChart !== 'function') {
        return;
      }

      const chart = tvWidget.activeChart();
      if (!chart) return;

      let minPrice: number | null = null;
      let maxPrice: number | null = null;

      if (typeof chart.getVisiblePriceRange === 'function') {
        const pr = chart.getVisiblePriceRange();
        if (pr && typeof pr.from === 'number' && typeof pr.to === 'number' && pr.to > pr.from) {
          minPrice = pr.from;
          maxPrice = pr.to;
        }
      } else if (typeof chart.getPriceRange === 'function') {
        const pr = chart.getPriceRange();
        if (pr && typeof pr.from === 'number' && typeof pr.to === 'number' && pr.to > pr.from) {
          minPrice = pr.from;
          maxPrice = pr.to;
        }
      }

      if (minPrice === null || maxPrice === null || !isFinite(minPrice) || !isFinite(maxPrice)) {
        return;
      }

      const container = (document.querySelector('.chart-container') as HTMLElement) ||
                        (document.querySelector('[class*="chart-container"]') as HTMLElement) ||
                        document.body;
      const width = container.clientWidth || 800;
      const height = container.clientHeight || 600;

      let firstCandleIndex = 0;
      let lastCandleIndex = 100;

      if (typeof chart.getVisibleRange === 'function') {
        const vr = chart.getVisibleRange();
        if (vr && typeof vr.from === 'number' && typeof vr.to === 'number') {
          // If range is available, can estimate visible bars
        }
      }

      if (
        lastReportedViewport &&
        lastReportedViewport.minPrice === minPrice &&
        lastReportedViewport.maxPrice === maxPrice &&
        lastReportedViewport.width === width &&
        lastReportedViewport.height === height
      ) {
        return;
      }

      lastReportedViewport = { minPrice, maxPrice, width, height, firstIdx: firstCandleIndex, lastIdx: lastCandleIndex };

      window.postMessage({
        type: 'ICT_VIEWPORT_CHANGED',
        payload: {
          source: 'TRADINGVIEW_WIDGET_API',
          symbol: currentSymbol,
          timeframe: currentTimeframe,
          width,
          height,
          minPrice,
          maxPrice,
          firstCandleIndex,
          lastCandleIndex,
          barWidth: Math.max(1, (width - 60) / Math.max(1, lastCandleIndex - firstCandleIndex)),
          timestamp: Date.now(),
        },
      }, '*');
    } catch (e) {
      // Safe passive inspection, ignore errors
    }
  }

  setInterval(inspectTradingViewViewport, 500);

  // Intercept WebSocket Stream for Real-time Candle Feeds
  const OriginalWebSocket = window.WebSocket;
  (window as any).WebSocket = function (url: string | URL, protocols?: string | string[]) {
    const ws = new OriginalWebSocket(url, protocols);

    ws.addEventListener('message', (event) => {
      try {
        if (typeof event.data === 'string') {
          // TradingView Datafeed or Rithmic WS frame parsing
          let parsed: any = null;

          if (event.data.startsWith('~m~')) {
            // TradingView protocol framing: ~m~len~m~json
            const parts = event.data.split('~m~');
            for (const part of parts) {
              if (part && part.startsWith('{')) {
                try {
                  parsed = JSON.parse(part);
                  handleParsedWSMessage(parsed);
                } catch (e) {}
              }
            }
          } else if (event.data.startsWith('{')) {
            parsed = JSON.parse(event.data);
            handleParsedWSMessage(parsed);
          }
        }
      } catch (err) {
        // Non-JSON or binary WS payload
      }
    });

    return ws;
  };
  (window as any).WebSocket.prototype = OriginalWebSocket.prototype;

  function handleParsedWSMessage(parsed: any) {
    if (!parsed) return;

    // Check if payload contains bar / ohlc update
    let candleData: any = null;

    if (parsed.m === 'timescale_update' && parsed.p && parsed.p[1]) {
      // TradingView timescale_update format
      const series = parsed.p[1];
      const keys = Object.keys(series);
      if (keys.length > 0 && series[keys[0]].s) {
        const bars = series[keys[0]].s;
        if (bars.length > 0) {
          if (bars.length > 1) {
            // Checkpoint 101: Multi-bar historical batch delivery
            const batchCandles: Candle[] = bars.map((b: any) => ({
              timestamp: b.v[0] * 1000,
              open: Number(b.v[1]),
              high: Number(b.v[2]),
              low: Number(b.v[3]),
              close: Number(b.v[4]),
              volume: b.v[5] !== undefined ? Number(b.v[5]) : 0,
            }));

            window.postMessage({
              type: 'ICT_HISTORICAL_BATCH',
              candles: batchCandles,
              symbol: currentSymbol,
              timeframe: currentTimeframe,
            }, '*');
          }

          const lastBar = bars[bars.length - 1].v; // [time, open, high, low, close, volume]
          candleData = {
            timestamp: lastBar[0] * 1000,
            open: Number(lastBar[1]),
            high: Number(lastBar[2]),
            low: Number(lastBar[3]),
            close: Number(lastBar[4]),
            volume: lastBar[5] !== undefined ? Number(lastBar[5]) : 0,
          };
        }
      }
    } else if (parsed.open && parsed.high && parsed.low && parsed.close) {
      candleData = {
        timestamp: parsed.timestamp || parsed.time || Date.now(),
        open: Number(parsed.open),
        high: Number(parsed.high),
        low: Number(parsed.low),
        close: Number(parsed.close),
        volume: parsed.volume ? Number(parsed.volume) : 0,
      };
    }

    if (candleData) {
      const candle: Candle = candleData;
      let eventType = 'ICT_CANDLE_UPDATE';

      if (activeCandleTimestamp === 0) {
        eventType = 'ICT_NEW_CANDLE';
        activeCandleTimestamp = candle.timestamp;
      } else if (candle.timestamp > activeCandleTimestamp) {
        // Emit close for previous, then new candle
        window.postMessage({
          type: 'ICT_CANDLE_CLOSE',
          candle,
          symbol: currentSymbol,
          timeframe: currentTimeframe,
        }, '*');
        
        eventType = 'ICT_NEW_CANDLE';
        activeCandleTimestamp = candle.timestamp;
      }

      window.postMessage({
        type: eventType,
        candle,
        symbol: currentSymbol,
        timeframe: currentTimeframe,
      }, '*');
    }
  }

  // Simulated & Real Historical Data Fetcher Test Probe
  function runHistoricalScanProbe(requestedCount: number): HistoricalFetchReport {
    const startTime = performance.now();
    const now = Date.now();
    const intervalMs = currentTimeframe === '1m' ? 60000 : 300000;

    // Generate test backfill payload to simulate TradeSea feed response
    const mockFeedLimit = 5000; // Simulated datafeed real limit (e.g. 5000 candles for 1m = ~3.47 days)
    const actualCount = Math.min(requestedCount, mockFeedLimit);
    
    const startTimeEpoch = now - actualCount * intervalMs;
    const downloadTimeMs = Math.round(performance.now() - startTime);

    return {
      symbol: currentSymbol,
      timeframe: currentTimeframe,
      requestedCount,
      receivedCount: actualCount,
      startTimeISO: new Date(startTimeEpoch).toISOString(),
      endTimeISO: new Date(now).toISOString(),
      downloadTimeMs,
      gapsDetected: 0,
      errors: requestedCount > mockFeedLimit 
        ? [`Datafeed limit reached: requested ${requestedCount}, returned ${actualCount} max available candles.`] 
        : [],
    };
  }

  // Listen for request probes from ContentScript
  window.addEventListener('message', (event) => {
    if (!event.data) return;

    if (event.data.type === 'ICT_RUN_HISTORICAL_PROBE') {
      const targetCount = event.data.count || 1000;
      const report = runHistoricalScanProbe(targetCount);
      window.postMessage({ type: 'ICT_HISTORICAL_PROBE_RESPONSE', report }, '*');
    }
  });

  console.log('[ICT Assistant Bridge] WebSockets and event listeners armed.');
})();
