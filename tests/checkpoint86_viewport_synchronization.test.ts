import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

import { ICTSetup } from '../core/ict/setups/SetupTypes';
import { ICTMarketState } from '../core/ict/types/MarketState';
import { VisualAdapter } from '../extension/visual/VisualAdapter';
import { CoordinateTranslator } from '../extension/visual/CoordinateTranslator';
import { CanvasRenderer } from '../extension/visual/CanvasRenderer';
import { OverlayCanvasManager } from '../extension/visual/OverlayCanvasManager';
import { ICTPipelineCoordinator } from '../extension/content/ICTPipelineCoordinator';
import {
  ChartViewportUpdate,
  validateViewportUpdate,
} from '../extension/visual/VisualTypes';

describe('CP86 — Safe Viewport Synchronization & Visual Overlay Alignment Test Suite', () => {
  const rootDir = process.cwd();
  let adapter: VisualAdapter;
  let mockState: ICTMarketState;

  // DOM Mock Helpers
  let mockContainer: any;
  let mockCanvas: any;
  let mockCtx: any;

  beforeEach(() => {
    adapter = new VisualAdapter();
    mockState = {
      symbol: 'MNQ',
      timeframe: '1m',
      lastUpdatedTimestamp: 1728820000000,
      lastCandleIndex: 50,
      trend: 'BULLISH',
      swings: [
        {
          id: 'SW-1',
          symbol: 'MNQ',
          timeframe: '1m',
          type: 'SWING_LOW',
          price: 21450,
          candleIndex: 30,
          timestamp: 1728818000000,
          eventTimestamp: 1728818000000,
          confirmationTimestamp: 1728818200000,
          strength: 3,
          confirmed: true,
          classification: 'INTERNAL',
          broken: false,
        },
      ],
      activeSwingLow: {
        id: 'SW-1',
        symbol: 'MNQ',
        timeframe: '1m',
        type: 'SWING_LOW',
        price: 21450,
        candleIndex: 30,
        timestamp: 1728818000000,
        eventTimestamp: 1728818000000,
        confirmationTimestamp: 1728818200000,
        strength: 3,
        confirmed: true,
        classification: 'INTERNAL',
        broken: false,
      },
      liquidityLevels: [
        {
          id: 'LIQ-BSL-1',
          symbol: 'MNQ',
          timeframe: '1m',
          type: 'BSL',
          category: 'SWING_HIGH',
          price: 21600,
          swings: [],
          swept: false,
        },
      ],
      fairValueGaps: [
        {
          id: 'FVG-BULL-1',
          symbol: 'MNQ',
          timeframe: '1m',
          direction: 'BULLISH',
          highPrice: 21520,
          lowPrice: 21500,
          gapSize: 20,
          candle1Timestamp: 1728819000000,
          candle2Timestamp: 1728819060000,
          candle3Timestamp: 1728819120000,
          createdCandleIndex: 40,
          status: 'ACTIVE',
          fillPercentage: 0,
        },
      ],
      orderBlocks: [],
    };

    mockCtx = {
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      arc: vi.fn(),
      closePath: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 50 }),
      setLineDash: vi.fn(),
    };

    mockCanvas = {
      id: 'ict-canvas-overlay',
      width: 800,
      height: 600,
      style: {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '800px',
        height: '600px',
        pointerEvents: 'none',
        zIndex: '9999',
      },
      getContext: vi.fn().mockReturnValue(mockCtx),
    };

    mockContainer = {
      clientWidth: 800,
      clientHeight: 600,
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      querySelector: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================
  // 1. Canvas buffer and CSS dimension synchronization
  // ==========================================
  it('1. Canvas buffer dimensions synchronize with container and handle DPR scaling', () => {
    const translator = new CoordinateTranslator();
    const renderer = new CanvasRenderer(mockCanvas, translator);

    // Initial 800x600 layout at DPR 1
    renderer.updateViewport(800, 600, 21400, 21600, 0, 100, 1);
    expect(mockCanvas.width).toBe(800);
    expect(mockCanvas.height).toBe(600);
    expect(mockCanvas.style.width).toBe('800px');
    expect(mockCanvas.style.height).toBe('600px');

    // High-DPI Retina (DPR 2)
    renderer.updateViewport(1200, 800, 21400, 21600, 0, 100, 2);
    expect(mockCanvas.width).toBe(2400); // 1200 * 2
    expect(mockCanvas.height).toBe(1600); // 800 * 2
    expect(mockCanvas.style.width).toBe('1200px'); // layout CSS remains CSS pixels
    expect(mockCanvas.style.height).toBe('800px');
    expect(renderer.getDpr()).toBe(2);
  });

  // ==========================================
  // 2. Device-pixel ratio handling
  // ==========================================
  it('2. Device-pixel ratio scaling applies ctx.scale without double-scaling', () => {
    const translator = new CoordinateTranslator({
      width: 1000,
      height: 500,
      minPrice: 21400,
      maxPrice: 21600,
      firstCandleIndex: 0,
      lastCandleIndex: 100,
    });
    const renderer = new CanvasRenderer(mockCanvas, translator);
    renderer.setDpr(2);

    renderer.renderFrame();

    // Verify context scaling matches DPR inside save/restore
    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.scale).toHaveBeenCalledWith(2, 2);
    expect(mockCtx.restore).toHaveBeenCalled();
  });

  // ==========================================
  // 3. ResizeObserver lifecycle, duplicate prevention, and zero-size safety
  // ==========================================
  it('3. OverlayCanvasManager handles lifecycle, duplicate prevention, and zero-sized containers safely', () => {
    // Setup document mock for test environment
    const elements: Record<string, any> = {};
    const originalDoc = global.document;

    (global as any).document = {
      getElementById: (id: string) => elements[id] || null,
      createElement: (_tag: string) => {
        const el = {
          id: '',
          style: {} as any,
          width: 0,
          height: 0,
          getContext: vi.fn().mockReturnValue(mockCtx),
        };
        return el;
      },
      querySelector: vi.fn().mockReturnValue(mockContainer),
      body: mockContainer,
    };

    const manager = new OverlayCanvasManager({ canvasId: 'test-overlay' });

    // 3a. Initialization creates overlay canvas
    const res1 = manager.initialize(mockContainer, { dpr: 2 });
    expect(res1).not.toBeNull();
    expect(res1?.renderer).toBeDefined();
    expect(mockContainer.appendChild).toHaveBeenCalled();

    // Store in mock registry
    elements['test-overlay'] = res1?.canvas;

    // 3b. Repeated initialization returns existing instance without duplicate creation
    const appendCallsBefore = mockContainer.appendChild.mock.calls.length;
    const res2 = manager.initialize(mockContainer, { dpr: 2 });
    expect(res2?.canvas).toBe(res1?.canvas);
    expect(mockContainer.appendChild.mock.calls.length).toBe(appendCallsBefore);

    // 3c. Zero-sized container safety: should not crash or throw
    expect(() => {
      manager.syncDimensions(0, 0);
    }).not.toThrow();

    expect(() => {
      manager.syncDimensions(-100, 0);
    }).not.toThrow();

    // 3d. Normal dimension sync updates canvas
    manager.syncDimensions(1024, 768);
    expect(res1?.canvas.width).toBe(2048); // 1024 * 2 DPR
    expect(res1?.canvas.height).toBe(1536); // 768 * 2 DPR

    // 3e. Cleanup disconnects gracefully
    expect(() => {
      manager.cleanup();
    }).not.toThrow();
    expect(manager.getCanvas()).toBeNull();

    // Restore document
    (global as any).document = originalDoc;
  });

  // ==========================================
  // 4. Valid and invalid viewport messages
  // ==========================================
  it('4. Viewport message schema validation strictly enforces finite numeric values and bounds', () => {
    const validPayload: ChartViewportUpdate = {
      source: 'TRADINGVIEW_WIDGET_API',
      symbol: 'MNQ',
      timeframe: '1m',
      width: 1200,
      height: 800,
      minPrice: 21400,
      maxPrice: 21600,
      firstCandleIndex: 0,
      lastCandleIndex: 100,
      barWidth: 10,
      timestamp: Date.now(),
    };

    // Valid update
    const v1 = validateViewportUpdate(validPayload);
    expect(v1.valid).toBe(true);
    expect(v1.viewport).toBeDefined();

    // Null/non-object payload
    expect(validateViewportUpdate(null).valid).toBe(false);
    expect(validateViewportUpdate('invalid').valid).toBe(false);

    // Invalid source
    expect(validateViewportUpdate({ ...validPayload, source: 'UNAUTHORIZED_HACK' }).valid).toBe(false);

    // Inverted price scale (maxPrice <= minPrice)
    expect(validateViewportUpdate({ ...validPayload, minPrice: 21600, maxPrice: 21400 }).valid).toBe(false);

    // Inverted candle indices (lastCandleIndex < firstCandleIndex)
    expect(validateViewportUpdate({ ...validPayload, firstCandleIndex: 100, lastCandleIndex: 50 }).valid).toBe(false);

    // Non-finite or negative dimensions
    expect(validateViewportUpdate({ ...validPayload, width: -100 }).valid).toBe(false);
    expect(validateViewportUpdate({ ...validPayload, height: NaN }).valid).toBe(false);
    expect(validateViewportUpdate({ ...validPayload, minPrice: Infinity }).valid).toBe(false);
  });

  // ==========================================
  // 5. Stale viewport rejection
  // ==========================================
  it('5. Stale viewport updates (> 30000ms old) are strictly rejected', () => {
    const stalePayload: ChartViewportUpdate = {
      source: 'TRADINGVIEW_WIDGET_API',
      symbol: 'MNQ',
      timeframe: '1m',
      width: 1000,
      height: 600,
      minPrice: 21400,
      maxPrice: 21600,
      firstCandleIndex: 0,
      lastCandleIndex: 100,
      timestamp: Date.now() - 35000, // 35 seconds old
    };

    const res = validateViewportUpdate(stalePayload, undefined, undefined, 30000);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('stale');

    // Fresh payload (500ms old) passes
    const freshPayload: ChartViewportUpdate = {
      ...stalePayload,
      timestamp: Date.now() - 500,
    };
    const resFresh = validateViewportUpdate(freshPayload, undefined, undefined, 30000);
    expect(resFresh.valid).toBe(true);
  });

  // ==========================================
  // 6. Instrument/timeframe mismatch rejection
  // ==========================================
  it('6. Viewport updates with mismatched symbol or timeframe are rejected by coordinator', () => {
    const coordinator = new ICTPipelineCoordinator('MNQ', '1m', { debug: false });

    const mismatchedSymbol: ChartViewportUpdate = {
      source: 'TRADINGVIEW_WIDGET_API',
      symbol: 'ES',
      timeframe: '1m',
      width: 1000,
      height: 600,
      minPrice: 5800,
      maxPrice: 5900,
      firstCandleIndex: 0,
      lastCandleIndex: 100,
      timestamp: Date.now(),
    };

    const mismatchedTf: ChartViewportUpdate = {
      source: 'TRADINGVIEW_WIDGET_API',
      symbol: 'MNQ',
      timeframe: '5m',
      width: 1000,
      height: 600,
      minPrice: 21400,
      maxPrice: 21600,
      firstCandleIndex: 0,
      lastCandleIndex: 100,
      timestamp: Date.now(),
    };

    expect(coordinator.updateViewport(mismatchedSymbol)).toBe(false);
    expect(coordinator.updateViewport(mismatchedTf)).toBe(false);

    // Matching update succeeds
    const matching: ChartViewportUpdate = {
      source: 'TRADINGVIEW_WIDGET_API',
      symbol: 'MNQ',
      timeframe: '1m',
      width: 1000,
      height: 600,
      minPrice: 21400,
      maxPrice: 21600,
      firstCandleIndex: 0,
      lastCandleIndex: 100,
      timestamp: Date.now(),
    };
    expect(coordinator.updateViewport(matching)).toBe(true);
  });

  // ==========================================
  // 7. Correct price and time coordinate mapping
  // ==========================================
  it('7. Dynamic viewport updates correctly map price to Y and candle index to X', () => {
    const translator = new CoordinateTranslator();

    const viewportUpdate: ChartViewportUpdate = {
      source: 'TRADINGVIEW_WIDGET_API',
      symbol: 'MNQ',
      timeframe: '1m',
      width: 1000,
      height: 500,
      minPrice: 21400,
      maxPrice: 21600,
      firstCandleIndex: 0,
      lastCandleIndex: 100,
      barWidth: 10,
      timestamp: Date.now(),
    };

    translator.updateFromValidatedViewport(viewportUpdate);
    expect(translator.isViewportSynchronized()).toBe(true);

    // Check custom padding bounds (topPadding: 20, bottomPadding: 30)
    // drawableHeight = 500 - 20 - 30 = 450
    const yTop = translator.priceToY(21600); // max price -> top padding
    expect(yTop).toBe(20);

    const yBottom = translator.priceToY(21400); // min price -> top + drawableHeight
    expect(yBottom).toBe(470);

    const yMid = translator.priceToY(21500); // exact midpoint
    expect(yMid).toBe(245);

    // X coordinate mapping (width 1000, leftPad 0, rightPad 60 => drawable 940 / 100 bars = 9.4 barWidth)
    const x0 = translator.indexToX(0);
    expect(x0).toBe(4.7); // 9.4 / 2 = 4.7
    const x50 = translator.indexToX(50);
    expect(x50).toBe(474.7); // 50 * 9.4 + 4.7 = 474.7
  });

  // ==========================================
  // 8. Pan, zoom, resize, and context-change update propagation
  // ==========================================
  it('8. Viewport pan, zoom, and context changes propagate correctly and invalidate stale mappings', () => {
    const translator = new CoordinateTranslator({
      width: 1000,
      height: 500,
      minPrice: 21400,
      maxPrice: 21600,
      firstCandleIndex: 0,
      lastCandleIndex: 100,
    });

    const xInitial = translator.indexToX(50);

    // 8a. Horizontal Pan: user scrolled chart forward by 20 candles
    translator.updateViewport({
      firstCandleIndex: 20,
      lastCandleIndex: 120,
    });
    const xPanned = translator.indexToX(50);
    expect(xPanned).toBeLessThan(xInitial); // bar 50 shifted leftwards on screen

    // 8b. Price Zoom: user zoomed in vertically (21450 to 21550)
    const yBeforeZoom = translator.priceToY(21500);
    translator.updateViewport({
      minPrice: 21450,
      maxPrice: 21550,
    });
    const yAfterZoom = translator.priceToY(21500);
    expect(yAfterZoom).toBe(yBeforeZoom); // 21500 is still midpoint, but 21460 shifts

    // 8c. Context Change reset: changing instrument/timeframe invalidates sync
    const coordinator = new ICTPipelineCoordinator('MNQ', '1m', { debug: false });
    coordinator.getVisualAdapter().setViewportSynchronized(true);
    expect(coordinator.getVisualAdapter().isViewportSynchronized()).toBe(true);

    coordinator.setContext('NQ', '5m');
    expect(coordinator.getVisualAdapter().isViewportSynchronized()).toBe(false);
  });

  // ==========================================
  // 9. Fail-closed behavior when reliable chart coordinates are unavailable
  // ==========================================
  it('9. Fail-closed policy suppresses price-anchored setup annotations when viewport is unsynchronized', () => {
    const setup: ICTSetup = {
      id: 'SETUP-MODEL_A_LONG-MNQ-1m-1728820000000',
      symbol: 'MNQ',
      timeframe: '1m',
      direction: 'LONG',
      status: 'CONFIRMED',
      activatedTimestamp: 1728819000000,
      confirmedTimestamp: 1728820000000,
      mandatoryConfluences: [] as any,
      fulfilledConfluences: [] as any,
      missingConfluences: [],
      invalidatingConditions: [],
      evidence: ['Model: Model A Long'],
    };

    // Configure adapter to fail closed when unsynchronized
    adapter.setFailClosedOnUnsyncedViewport(true);

    // Unsynchronized state -> must suppress drawings (fail closed)
    adapter.setViewportSynchronized(false);
    const unsyncedVisuals = adapter.adaptSetupsToVisuals([setup], mockState, []);
    expect(unsyncedVisuals.length).toBe(0);

    // Synchronized state -> renders confirmed setup drawings
    adapter.setViewportSynchronized(true);
    const syncedVisuals = adapter.adaptSetupsToVisuals([setup], mockState, []);
    expect(syncedVisuals.length).toBeGreaterThan(0);
    const marker = syncedVisuals.find((v) => v.type === 'MARKER');
    expect(marker).toBeDefined();
    expect((marker as any).color).toBe('#22c55e');
  });

  // ==========================================
  // 10. Existing CP84 signal lifecycle and deduplication behavior
  // ==========================================
  it('10. Confirmed setups render BUY/SELL annotations while non-confirmed states are omitted', () => {
    adapter.setViewportSynchronized(true);

    const confirmedLong: ICTSetup = {
      id: 'SETUP-MODEL_A_LONG-MNQ-1m-1728820000000',
      symbol: 'MNQ',
      timeframe: '1m',
      direction: 'LONG',
      status: 'CONFIRMED',
      activatedTimestamp: 1728819000000,
      confirmedTimestamp: 1728820000000,
      mandatoryConfluences: [] as any,
      fulfilledConfluences: [] as any,
      missingConfluences: [],
      invalidatingConditions: [],
      evidence: ['Model: Model A Long'],
    };

    const watchingSetup: ICTSetup = {
      id: 'SETUP-MODEL_B_SHORT-MNQ-1m-1728820000000',
      symbol: 'MNQ',
      timeframe: '1m',
      direction: 'SHORT',
      status: 'WATCHING',
      activatedTimestamp: 1728819000000,
      mandatoryConfluences: [] as any,
      fulfilledConfluences: [] as any,
      missingConfluences: [],
      invalidatingConditions: [],
      evidence: [],
    };

    const formingSetup: ICTSetup = {
      id: 'SETUP-MODEL_C_LONG-MNQ-1m-1728820000000',
      symbol: 'MNQ',
      timeframe: '1m',
      direction: 'LONG',
      status: 'FORMING',
      activatedTimestamp: 1728819000000,
      mandatoryConfluences: [] as any,
      fulfilledConfluences: [] as any,
      missingConfluences: [],
      invalidatingConditions: [],
      evidence: [],
    };

    const visuals = adapter.adaptSetupsToVisuals(
      [confirmedLong, watchingSetup, formingSetup],
      mockState,
      []
    );

    // Only confirmed setup produces visual objects
    const markers = visuals.filter((v) => v.type === 'MARKER');
    expect(markers.length).toBe(1);
    expect((markers[0] as any).label).toContain('BUY SETUP');

    // Watching and forming must produce zero drawings
    const watchingDrawings = visuals.filter((v) => v.id.includes('MODEL_B'));
    const formingDrawings = visuals.filter((v) => v.id.includes('MODEL_C'));
    expect(watchingDrawings.length).toBe(0);
    expect(formingDrawings.length).toBe(0);
  });

  // ==========================================
  // 11. Zero order-execution side effects guarantee
  // ==========================================
  it('11. Zero order execution APIs exist across visual and overlay modules', () => {
    const modules = [
      adapter,
      new CoordinateTranslator(),
      new OverlayCanvasManager(),
    ];

    const forbiddenOrderKeywords = [
      'buy',
      'sell',
      'placeorder',
      'executeorder',
      'submitorder',
      'cancelorder',
      'modifyorder',
      'flatten',
      'closeposition',
      'broker',
      'sendorder',
    ];

    for (const mod of modules) {
      const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(mod));
      for (const method of proto) {
        for (const kw of forbiddenOrderKeywords) {
          expect(method.toLowerCase()).not.toBe(kw);
        }
      }
    }
  });

  // ==========================================
  // 12. Frozen core/ict/ and governance protocol invariants
  // ==========================================
  it('12. Frozen invariant: core/ict/ has 0 diff lines against baseline 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a', () => {
    const diff = execSync(
      'git diff 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a -- core/ict/',
      { encoding: 'utf-8', cwd: rootDir }
    );
    expect(diff.trim()).toBe('');
  });

  it('13. Frozen invariant: S10 Protocol v1.1.0 and Manifest SHA-256 hashes match frozen values', () => {
    const manifestPath = path.join(
      rootDir,
      'data_audit',
      'phase_s10_prospective',
      's10_session_manifest.json'
    );
    const protocolPath = path.join(
      rootDir,
      'data_audit',
      'phase_s10_prospective',
      's10_prospective_protocol_spec_v1_1_0_final.json'
    );

    const manifestBytes = fs.readFileSync(manifestPath);
    const protocolBytes = fs.readFileSync(protocolPath);

    const manifestHash = crypto.createHash('sha256').update(manifestBytes).digest('hex');
    const protocolHash = crypto.createHash('sha256').update(protocolBytes).digest('hex');

    expect(manifestHash).toBe('744720e2b930550d1d7bb76654459b9277c094302b595051fad8323cba7f7107');
    expect(protocolHash).toBe('d8c4e83cbce2a303c2fd947cac424822d6d6885a4d5800ff234ef5e348317220');
  });

  it('14. Frozen invariant: Session 002 remains preserved as INVALID_INCOMPLETE', () => {
    const session002SummaryPath = path.join(
      rootDir,
      'data_audit',
      'phase_s10_prospective',
      'daily_captures',
      'S10_SESSION_002_20261013',
      's10_session_002_summary.json'
    );
    expect(fs.existsSync(session002SummaryPath)).toBe(true);

    const summary = JSON.parse(fs.readFileSync(session002SummaryPath, 'utf-8'));
    expect(summary.finalSessionStatus).toBe('INVALID_INCOMPLETE');
  });
});
