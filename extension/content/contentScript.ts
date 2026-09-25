/**
 * ICT Assistant - Content Script (ISOLATED World)
 * Orchestrates PageBridge communications, ICTPipelineCoordinator, HUD & Canvas Renderer.
 */

import { ICTPipelineCoordinator } from './ICTPipelineCoordinator';
import { ICTHUD } from '../visual/ICTHUD';
import { CanvasRenderer } from '../visual/CanvasRenderer';
import { CoordinateTranslator } from '../visual/CoordinateTranslator';

console.log('[ICT ContentScript] Initializing Checkpoint 6 Real Market & HUD Integration...');

// 1. Instantiate HUD
const hud = new ICTHUD();

// 2. Setup Transparent Canvas Overlay if DOM elements exist
let canvasRenderer: CanvasRenderer | null = null;

function setupCanvasOverlay(): CanvasRenderer | null {
  if (typeof document === 'undefined') return null;

  let canvas = document.getElementById('ict-canvas-overlay') as HTMLCanvasElement;
  if (!canvas) {
    const chartContainer = document.querySelector('.chart-container') || document.body;
    canvas = document.createElement('canvas');
    canvas.id = 'ict-canvas-overlay';
    canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    `;
    chartContainer.appendChild(canvas);
  }

  const translator = new CoordinateTranslator();
  const renderer = new CanvasRenderer(canvas, translator);
  renderer.startAnimationLoop();
  return renderer;
}

canvasRenderer = setupCanvasOverlay();

// 3. Instantiate ICT Pipeline Coordinator
const coordinator = new ICTPipelineCoordinator('MNQ', '1m', {
  hud,
  renderer: canvasRenderer || undefined,
  debug: true,
});

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

// 5. PostMessage Handler for Bridge & TradeSea Event Stream
window.addEventListener('message', (event) => {
  if (!event.data) return;

  const { type, candle, symbol, timeframe, payload, report } = event.data;

  if (type === 'ICT_CONTEXT_CHANGED' && payload) {
    coordinator.setContext(payload.symbol, payload.timeframe);
  } else if (type === 'ICT_CANDLE_UPDATE' || type === 'ICT_NEW_CANDLE' || type === 'ICT_CANDLE_CLOSE') {
    if (symbol && timeframe) {
      const current = coordinator.getContext();
      if (current.symbol !== symbol || current.timeframe !== timeframe) {
        coordinator.setContext(symbol, timeframe);
      }
    }
    if (candle) {
      coordinator.ingestCandle(candle);
    }
  } else if (type === 'ICT_HISTORICAL_PROBE_RESPONSE' && report) {
    console.log(`[ICT ContentScript] Historical Probe Response:`, report);
  }
});

// Initialization
injectPageBridge();
