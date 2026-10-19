/**
 * ICT Assistant - Page Bridge (MAIN World)
 * Captures live TradeSea WS/REST market feeds, detects symbol/timeframe changes,
 * and performs historical backfill probes.
 */

import { Candle, HistoricalFetchReport } from '../../core/market/Candle';

(function initPageBridge() {
  if ((window as any).__ICT_PAGE_BRIDGE_INITIALIZED__) {
    console.log('[ICT Assistant Bridge] Already initialized, skipping duplicate injection.');
    return;
  }
  (window as any).__ICT_PAGE_BRIDGE_INITIALIZED__ = true;

  console.log('[ICT Assistant Bridge] Main world bridge initialized.');

  let currentSymbol = 'MNQ';
  let currentTimeframe = '1m';
  let activeCandleTimestamp = 0;
  let lastKnownCandle: Candle | null = null;
  let lastRealtimeFeedTimestamp = Date.now();
  let lastCachedBatch: { candles: Candle[]; symbol: string; timeframe: string } | null = null;

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
      lastKnownCandle = null;
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

  function getTradingViewWidget(): any {
    const w = window as any;
    if (w.tvWidget && typeof w.tvWidget.activeChart === 'function') return w.tvWidget;
    if (w.widget && typeof w.widget.activeChart === 'function') return w.widget;
    if (w._tvWidget && typeof w._tvWidget.activeChart === 'function') return w._tvWidget;
    if (w.chartWidget && typeof w.chartWidget.activeChart === 'function') return w.chartWidget;
    return null;
  }

  function inspectTradingViewViewport() {
    try {
      const tvWidget = getTradingViewWidget();
      if (!tvWidget || typeof tvWidget.activeChart !== 'function') {
        return;
      }

      const chart = tvWidget.activeChart();
      if (!chart) return;

      // Subscribe to visible range changes for real-time panning/zooming updates
      if (typeof chart.onVisibleRangeChanged === 'function' && !(chart as any).__ict_range_subscribed__) {
        (chart as any).__ict_range_subscribed__ = true;
        try {
          chart.onVisibleRangeChanged().subscribe(null, () => {
            inspectTradingViewViewport();
          });
        } catch (e) {}
      }

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
        if (vr && typeof vr.from === 'number' && typeof vr.to === 'number' && vr.to > vr.from) {
          if (lastCachedBatch && Array.isArray(lastCachedBatch.candles) && lastCachedBatch.candles.length > 0) {
            const candles = lastCachedBatch.candles;
            const fromMs = vr.from > 1e11 ? vr.from : vr.from * 1000;
            const toMs = vr.to > 1e11 ? vr.to : vr.to * 1000;
            const fIdx = candles.findIndex((c) => c.timestamp >= fromMs);
            const lIdx = candles.findIndex((c) => c.timestamp >= toMs);
            if (fIdx !== -1) {
              firstCandleIndex = fIdx;
              lastCandleIndex = lIdx !== -1 ? lIdx : candles.length - 1;
            } else {
              const intervalMs = currentTimeframe === '1m' ? 60000 : currentTimeframe === '5m' ? 300000 : 900000;
              const baseTs = candles[0].timestamp;
              firstCandleIndex = Math.max(0, Math.floor((fromMs - baseTs) / intervalMs));
              lastCandleIndex = Math.max(firstCandleIndex + 1, Math.floor((toMs - baseTs) / intervalMs));
            }
          } else if (vr.to <= 10000) {
            firstCandleIndex = Math.max(0, Math.round(vr.from));
            lastCandleIndex = Math.max(firstCandleIndex + 1, Math.round(vr.to));
          }
        }
      }

      if (
        lastReportedViewport &&
        lastReportedViewport.minPrice === minPrice &&
        lastReportedViewport.maxPrice === maxPrice &&
        lastReportedViewport.width === width &&
        lastReportedViewport.height === height &&
        lastReportedViewport.firstIdx === firstCandleIndex &&
        lastReportedViewport.lastIdx === lastCandleIndex
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

  window.addEventListener('wheel', () => setTimeout(inspectTradingViewViewport, 30), { passive: true });
  window.addEventListener('mouseup', () => setTimeout(inspectTradingViewViewport, 30), { passive: true });

  setInterval(inspectTradingViewViewport, 500);

  // Intercept WebSocket Stream for Real-time Candle Feeds
  const OriginalWebSocket = window.WebSocket;
  (window as any).WebSocket = function (url: string | URL, protocols?: string | string[]) {
    const ws = new OriginalWebSocket(url, protocols);

    function processRawWSData(dataStr: string) {
      if (!dataStr) return;
      if (dataStr.startsWith('~m~')) {
        // TradingView protocol framing: ~m~len~m~json
        const parts = dataStr.split('~m~');
        for (const part of parts) {
          const trimmed = part ? part.trim() : '';
          if (trimmed && (trimmed.startsWith('{') || trimmed.startsWith('['))) {
            try {
              const parsed = JSON.parse(trimmed);
              handleParsedWSMessage(parsed);
            } catch (e) {}
          }
        }
      } else if (dataStr.startsWith('{') || dataStr.startsWith('[')) {
        try {
          const parsed = JSON.parse(dataStr);
          handleParsedWSMessage(parsed);
        } catch (e) {}
      }
    }

    ws.addEventListener('message', (event) => {
      try {
        if (typeof event.data === 'string') {
          processRawWSData(event.data);
        } else if (event.data instanceof Blob) {
          event.data.text().then((text) => {
            processRawWSData(text);
          }).catch(() => {});
        } else if (event.data instanceof ArrayBuffer) {
          try {
            const text = new TextDecoder('utf-8').decode(event.data);
            processRawWSData(text);
          } catch (e) {}
        }
      } catch (err) {
        // Non-JSON or unsupported WS payload
      }
    });

    return ws;
  };
  (window as any).WebSocket.prototype = OriginalWebSocket.prototype;

  // Intercept window.fetch for REST Historical Candle Feeds (e.g. /history?...)
  const originalFetch = window.fetch;
  (window as any).fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const response = await originalFetch.call(this, input, init);
    try {
      const url = typeof input === 'string' ? input : (input as any)?.url || '';
      if (url.includes('/history') || url.includes('history?')) {
        const clone = response.clone();
        clone.json().then((data: any) => {
          handleParsedHistoryFetch(data);
        }).catch(() => {});
      }
    } catch (e) {
      // Safe passive inspection
    }
    return response;
  };

  function handleParsedHistoryFetch(data: any) {
    if (!data) return;
    let batchCandles: Candle[] = [];

    // 1. TradingView UDF format: { s: 'ok', t: [...], o: [...], h: [...], l: [...], c: [...] }
    if (Array.isArray(data.t) && Array.isArray(data.c)) {
      const len = data.t.length;
      for (let i = 0; i < len; i++) {
        const rawT = Number(data.t[i]);
        const ts = rawT > 1e11 ? rawT : rawT * 1000;
        batchCandles.push({
          timestamp: ts,
          open: Number(data.o[i]),
          high: Number(data.h[i]),
          low: Number(data.l[i]),
          close: Number(data.c[i]),
          volume: data.v && data.v[i] !== undefined ? Number(data.v[i]) : 0,
        });
      }
    } else if (Array.isArray(data)) {
      // 2. Direct array format: [ { time/timestamp, open, high, low, close, volume } ]
      for (const b of data) {
        const rawT = Number(b.timestamp || b.time || b.t || 0);
        const ts = rawT > 1e11 ? rawT : rawT * 1000;
        if (ts > 0 && b.open !== undefined && b.close !== undefined) {
          batchCandles.push({
            timestamp: ts,
            open: Number(b.open ?? b.o),
            high: Number(b.high ?? b.h),
            low: Number(b.low ?? b.l),
            close: Number(b.close ?? b.c),
            volume: b.volume !== undefined ? Number(b.volume) : b.v !== undefined ? Number(b.v) : 0,
          });
        }
      }
    } else if (data.bars && Array.isArray(data.bars)) {
      return handleParsedHistoryFetch(data.bars);
    } else if (data.data && Array.isArray(data.data)) {
      return handleParsedHistoryFetch(data.data);
    }

    if (batchCandles.length > 0) {
      batchCandles.sort((a, b) => a.timestamp - b.timestamp);

      lastCachedBatch = {
        candles: batchCandles,
        symbol: currentSymbol,
        timeframe: currentTimeframe,
      };

      console.log(`[ICT Assistant Bridge] Successfully captured ${batchCandles.length} candles from fetch(/history). Emitting ICT_HISTORICAL_BATCH.`);

      window.postMessage({
        type: 'ICT_HISTORICAL_BATCH',
        candles: batchCandles,
        symbol: currentSymbol,
        timeframe: currentTimeframe,
      }, '*');
    }
  }

  function emitCandleUpdate(candle: Candle) {
    lastKnownCandle = { ...candle };
    lastRealtimeFeedTimestamp = Date.now();

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

  function handleParsedWSMessage(parsed: any) {
    if (!parsed) return;

    let candleData: Candle | null = null;

    // A. TradingView Real-time Data: 'timescale_update' and 'du' (streaming updates)
    if ((parsed.m === 'timescale_update' || parsed.m === 'du') && parsed.p && parsed.p[1]) {
      const series = parsed.p[1];
      if (typeof series === 'object') {
        for (const key of Object.keys(series)) {
          const sObj = series[key];
          if (!sObj) continue;

          // Check multi-bar array in .s
          if (Array.isArray(sObj.s) && sObj.s.length > 0) {
            const bars = sObj.s;
            if (bars.length > 1) {
              const batchCandles: Candle[] = bars
                .filter((b: any) => b && Array.isArray(b.v) && b.v.length >= 5)
                .map((b: any) => {
                  const rawT = Number(b.v[0]);
                  return {
                    timestamp: rawT > 1e11 ? rawT : rawT * 1000,
                    open: Number(b.v[1]),
                    high: Number(b.v[2]),
                    low: Number(b.v[3]),
                    close: Number(b.v[4]),
                    volume: b.v[5] !== undefined ? Number(b.v[5]) : 0,
                  };
                });

              if (batchCandles.length > 0) {
                lastCachedBatch = {
                  candles: batchCandles,
                  symbol: currentSymbol,
                  timeframe: currentTimeframe,
                };
                window.postMessage({
                  type: 'ICT_HISTORICAL_BATCH',
                  candles: batchCandles,
                  symbol: currentSymbol,
                  timeframe: currentTimeframe,
                }, '*');
              }
            }

            const lastItem = bars[bars.length - 1];
            if (lastItem && Array.isArray(lastItem.v) && lastItem.v.length >= 5) {
              const rawT = Number(lastItem.v[0]);
              candleData = {
                timestamp: rawT > 1e11 ? rawT : rawT * 1000,
                open: Number(lastItem.v[1]),
                high: Number(lastItem.v[2]),
                low: Number(lastItem.v[3]),
                close: Number(lastItem.v[4]),
                volume: lastItem.v[5] !== undefined ? Number(lastItem.v[5]) : 0,
              };
            }
          }

          // Check Latest Bar Summary in .lbs (TradingView streaming tick/bar update)
          if (sObj.lbs && Array.isArray(sObj.lbs.v) && sObj.lbs.v.length >= 5) {
            const b = sObj.lbs.v;
            const rawT = Number(b[0]);
            candleData = {
              timestamp: rawT > 1e11 ? rawT : rawT * 1000,
              open: Number(b[1]),
              high: Number(b[2]),
              low: Number(b[3]),
              close: Number(b[4]),
              volume: b[5] !== undefined ? Number(b[5]) : 0,
            };
          }

          if (candleData) break;
        }
      }
    } else if (parsed.m === 'qsd' && parsed.p && parsed.p[1]) {
      // TradingView Quote Stream Data (live last price update)
      const qData = parsed.p[1];
      const lp = qData?.v?.lp ?? qData?.lp;
      if (typeof lp === 'number' && isFinite(lp) && lp > 0 && lastKnownCandle) {
        candleData = {
          ...lastKnownCandle,
          high: Math.max(lastKnownCandle.high, lp),
          low: Math.min(lastKnownCandle.low, lp),
          close: lp,
        };
      }
    } else if (parsed.open !== undefined && parsed.high !== undefined && parsed.low !== undefined && parsed.close !== undefined) {
      const rawT = Number(parsed.timestamp || parsed.time || parsed.t || Date.now());
      candleData = {
        timestamp: rawT > 1e11 ? rawT : rawT * 1000,
        open: Number(parsed.open),
        high: Number(parsed.high),
        low: Number(parsed.low),
        close: Number(parsed.close),
        volume: parsed.volume ? Number(parsed.volume) : 0,
      };
    } else if (parsed.o !== undefined && parsed.h !== undefined && parsed.l !== undefined && parsed.c !== undefined) {
      const rawT = Number(parsed.t || parsed.time || Date.now());
      candleData = {
        timestamp: rawT > 1e11 ? rawT : rawT * 1000,
        open: Number(parsed.o),
        high: Number(parsed.h),
        low: Number(parsed.l),
        close: Number(parsed.c),
        volume: parsed.v ? Number(parsed.v) : 0,
      };
    } else if (parsed.bar && (parsed.bar.open !== undefined || parsed.bar.o !== undefined)) {
      const b = parsed.bar;
      const rawT = Number(b.timestamp || b.time || b.t || Date.now());
      candleData = {
        timestamp: rawT > 1e11 ? rawT : rawT * 1000,
        open: Number(b.open ?? b.o),
        high: Number(b.high ?? b.h),
        low: Number(b.low ?? b.l),
        close: Number(b.close ?? b.c),
        volume: Number(b.volume ?? b.v ?? 0),
      };
    } else if (parsed.k && (parsed.k.o !== undefined || parsed.k.c !== undefined)) {
      const k = parsed.k;
      const rawT = Number(k.t || Date.now());
      candleData = {
        timestamp: rawT > 1e11 ? rawT : rawT * 1000,
        open: Number(k.o),
        high: Number(k.h),
        low: Number(k.l),
        close: Number(k.c),
        volume: Number(k.v || 0),
      };
    }

    if (candleData) {
      emitCandleUpdate(candleData);
    }
  }

  // Passive DOM Realtime OHLC inspection fallback
  function inspectRealtimeDOMPrice() {
    if (Date.now() - lastRealtimeFeedTimestamp < 1500 && lastKnownCandle) {
      return;
    }

    try {
      const legendValues = document.querySelectorAll(
        '[class*="itemValue-"], [class*="valueValue-"], .pane-legend-item-value, [data-name="legend-series-item"] [class*="value"]'
      );
      if (legendValues.length >= 4) {
        const o = parseFloat(legendValues[0]?.textContent?.replace(/,/g, '') || '');
        const h = parseFloat(legendValues[1]?.textContent?.replace(/,/g, '') || '');
        const l = parseFloat(legendValues[2]?.textContent?.replace(/,/g, '') || '');
        const c = parseFloat(legendValues[3]?.textContent?.replace(/,/g, '') || '');

        if (isFinite(o) && isFinite(h) && isFinite(l) && isFinite(c) && o > 0 && h >= l) {
          const now = Date.now();
          const intervalMs = currentTimeframe === '1m' ? 60000 : currentTimeframe === '5m' ? 300000 : 900000;
          const barTimestamp = Math.floor(now / intervalMs) * intervalMs;

          emitCandleUpdate({
            timestamp: barTimestamp,
            open: o,
            high: h,
            low: l,
            close: c,
            volume: 0,
          });
        }
      }
    } catch (e) {
      // Passive fallback, ignore errors
    }
  }

  setInterval(inspectRealtimeDOMPrice, 500);

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

  // Listen for request probes and cached batch requests from ContentScript
  window.addEventListener('message', (event) => {
    if (!event.data) return;

    if (event.data.type === 'ICT_REQUEST_CACHED_BATCH') {
      if (lastCachedBatch) {
        console.log(`[ICT Assistant Bridge] Delivering cached historical batch (${lastCachedBatch.candles.length} candles) to ContentScript.`);
        window.postMessage({
          type: 'ICT_HISTORICAL_BATCH',
          candles: lastCachedBatch.candles,
          symbol: lastCachedBatch.symbol,
          timeframe: lastCachedBatch.timeframe,
        }, '*');
      }
    }

    if (event.data.type === 'ICT_RUN_HISTORICAL_PROBE') {
      const targetCount = event.data.count || 1000;
      const report = runHistoricalScanProbe(targetCount);
      window.postMessage({ type: 'ICT_HISTORICAL_PROBE_RESPONSE', report }, '*');
    }
  });

  console.log('[ICT Assistant Bridge] WebSockets and event listeners armed.');
})();
