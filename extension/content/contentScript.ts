/**
 * ICT Assistant - Content Script (ISOLATED World)
 * Orchestrates PageBridge communications, ICTPipelineCoordinator, HUD & Canvas Renderer.
 */

import { ICTPipelineCoordinator } from './ICTPipelineCoordinator';
import { ICTHUD } from '../visual/ICTHUD';
import { CanvasRenderer } from '../visual/CanvasRenderer';
import { OverlayCanvasManager } from '../visual/OverlayCanvasManager';
import { Candle } from '../../core/market/Candle';

console.log('[ICT ContentScript] Initializing Checkpoint 86 Safe Viewport Synchronization & Visual Overlay...');

// 1. Instantiate HUD
const hud = new ICTHUD();

// 2. Setup Transparent Canvas Overlay via OverlayCanvasManager (Safe, DPR-aware, ResizeObserver)
const canvasManager = new OverlayCanvasManager({
  canvasId: 'ict-canvas-overlay',
});
const overlayInit = canvasManager.initialize();
const canvasRenderer: CanvasRenderer | null = overlayInit?.renderer || null;

// 3. Instantiate ICT Pipeline Coordinator
const coordinator = new ICTPipelineCoordinator('MNQ', '1m', {
  hud,
  renderer: canvasRenderer || undefined,
  debug: true,
});

// Arm fail-closed mode: suppress price-anchored setup drawings when viewport is not synchronized
coordinator.getVisualAdapter().setFailClosedOnUnsyncedViewport(true);

// Initial HUD render so the UI panel and manual analysis button are immediately visible
coordinator.reevaluate();

// 4. Inject Page Bridge script into MAIN world
function injectPageBridge() {
  try {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('content/pageBridge.js');
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
    console.log('[ICT ContentScript] pageBridge.js injected.');
  } catch (err) {
    console.error('[ICT ContentScript] Injection error:', err);
  }
}

import { TradeSeaPassiveRecorder } from './TradeSeaPassiveRecorder';
import { ReadOnlyPreflightGuard } from './ReadOnlyPreflightGuard';

// Arm deterministic ReadOnly Preflight Guard
const preflightGuard = new ReadOnlyPreflightGuard();
if (typeof document !== 'undefined') {
  preflightGuard.armDomNeutralizer(document);
  console.log('[ICT ContentScript] ReadOnlyPreflightGuard armed: trading controls neutralized.');
}

const recorder = new TradeSeaPassiveRecorder();
recorder.init().then(() => {
  recorder.startRecording('MNQ', '1m').catch(err => console.error('[PassiveRecorder] Init error:', err));
}).catch(err => console.error('[PassiveRecorder] Storage init error:', err));

// 5. PostMessage Handler for Bridge & TradeSea Event Stream
window.addEventListener('message', (event) => {
  // Validate origin / source window
  if (typeof window !== 'undefined' && event.source !== window) {
    return;
  }
  if (!event.data || typeof event.data !== 'object') return;

  const { type, candle, symbol, timeframe, payload, report } = event.data;

  if (type === 'ICT_VIEWPORT_CHANGED' && payload) {
    const applied = coordinator.updateViewport(payload);
    if (!applied) {
      console.warn('[ICT ContentScript] Viewport update was rejected by validation guard.');
    }
  } else if (type === 'ICT_CONTEXT_CHANGED' && payload) {
    coordinator.setContext(payload.symbol, payload.timeframe);
    recorder.startRecording(payload.symbol, payload.timeframe).catch(() => {});
  } else if (type === 'ICT_HISTORICAL_BATCH' && event.data.candles) {
    // Checkpoint 101: Route multi-bar historical batch exclusively to coordinator
    // Do NOT call recorder or trigger S10 persistence
    if (symbol && timeframe) {
      const current = coordinator.getContext();
      if (current.symbol !== symbol || current.timeframe !== timeframe) {
        coordinator.setContext(symbol, timeframe);
      }
    }
    const batchCandles: Candle[] = event.data.candles;
    if (Array.isArray(batchCandles) && batchCandles.length > 0) {
      coordinator.ingestCandles(batchCandles);
    }
  } else if (type === 'ICT_CANDLE_UPDATE' || type === 'ICT_NEW_CANDLE' || type === 'ICT_CANDLE_CLOSE') {
    if (symbol && timeframe) {
      const current = coordinator.getContext();
      if (current.symbol !== symbol || current.timeframe !== timeframe) {
        coordinator.setContext(symbol, timeframe);
        recorder.startRecording(symbol, timeframe).catch(() => {});
      }
    }
    if (candle) {
      coordinator.ingestCandle(candle);
      recorder.handleCandleEvent({ type, candle, symbol: symbol || 'MNQ', timeframe: timeframe || '1m' }).catch(() => {});
    }
  } else if (type === 'ICT_HISTORICAL_PROBE_RESPONSE' && report) {
    console.log(`[ICT ContentScript] Historical Probe Response:`, report);
  }
});

// Initialization
injectPageBridge();
window.postMessage({ type: 'ICT_REQUEST_CACHED_BATCH' }, '*');
