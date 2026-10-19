import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ICTPipelineCoordinator } from '../extension/content/ICTPipelineCoordinator';
import { ICTHUD } from '../extension/visual/ICTHUD';
import { CanvasRenderer } from '../extension/visual/CanvasRenderer';
import { CoordinateTranslator } from '../extension/visual/CoordinateTranslator';
import { Candle } from '../core/market/Candle';

describe('Extension Controls — Stop/Resume & Hide Chart Overlay Tests', () => {
  let mockCanvas: HTMLCanvasElement;
  let mockCtx: any;
  let renderer: CanvasRenderer;
  let hud: ICTHUD;
  let coordinator: ICTPipelineCoordinator;

  function makeCandle(timestamp: number, price: number): Candle {
    return {
      timestamp,
      open: price,
      high: price + 10,
      low: price - 10,
      close: price + 5,
      volume: 100,
    };
  }

  beforeEach(() => {
    // Mock HTMLCanvasElement
    mockCtx = {
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      strokeRect: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      setLineDash: vi.fn(),
      scale: vi.fn(),
    };

    mockCanvas = {
      width: 800,
      height: 600,
      style: { display: 'block' },
      getContext: vi.fn().mockReturnValue(mockCtx),
    } as any;

    renderer = new CanvasRenderer(mockCanvas, new CoordinateTranslator());
    hud = new ICTHUD();
    coordinator = new ICTPipelineCoordinator('MNQ', '1m', {
      hud,
      renderer,
      debug: false,
    });
  });

  it('1. Initializes with running=true and chartOverlayVisible=true', () => {
    expect(coordinator.isRunningState()).toBe(true);
    expect(coordinator.isOverlayVisibleState()).toBe(true);
    expect(hud.isRunningState()).toBe(true);
    expect(hud.isChartOverlayVisibleState()).toBe(true);
  });

  it('2. Stops the extension, hides canvas, clears visuals, and updates HUD', () => {
    // Ingest some candles first
    const candles = [
      makeCandle(1700000000000, 20000),
      makeCandle(1700000060000, 20010),
      makeCandle(1700000120000, 20020),
    ];
    coordinator.ingestCandles(candles);

    // Stop extension
    coordinator.setRunning(false);

    expect(coordinator.isRunningState()).toBe(false);
    expect(hud.isRunningState()).toBe(false);
    expect(renderer.getVisible()).toBe(false);
    expect(mockCanvas.style.display).toBe('none');

    // Ingesting candles while stopped should not update canvas visuals
    const clearCallsBefore = mockCtx.clearRect.mock.calls.length;
    coordinator.refreshVisuals();
    // Renderer should have remained cleared / skipped
    expect(mockCtx.clearRect.mock.calls.length).toBe(clearCallsBefore + 1); // clear() called
  });

  it('3. Resumes the extension, shows canvas, and restores visuals', () => {
    coordinator.setRunning(false);
    expect(coordinator.isRunningState()).toBe(false);

    coordinator.setRunning(true);
    expect(coordinator.isRunningState()).toBe(true);
    expect(hud.isRunningState()).toBe(true);
    expect(renderer.getVisible()).toBe(true);
    expect(mockCanvas.style.display).toBe('block');
  });

  it('4. Hides and displays chart overlay on command ("Ocultar Gráfico")', () => {
    // Initially visible
    expect(coordinator.isOverlayVisibleState()).toBe(true);

    // Hide chart overlay
    coordinator.setChartOverlayVisible(false);
    expect(coordinator.isOverlayVisibleState()).toBe(false);
    expect(hud.isChartOverlayVisibleState()).toBe(false);
    expect(renderer.getVisible()).toBe(false);
    expect(mockCanvas.style.display).toBe('none');

    // Show chart overlay again
    coordinator.setChartOverlayVisible(true);
    expect(coordinator.isOverlayVisibleState()).toBe(true);
    expect(hud.isChartOverlayVisibleState()).toBe(true);
    expect(renderer.getVisible()).toBe(true);
    expect(mockCanvas.style.display).toBe('block');
  });

  it('5. CanvasRenderer skips renderFrame when isVisible is false', () => {
    renderer.setVisible(false);
    mockCtx.clearRect.mockClear();

    renderer.renderFrame();
    // clearRect inside renderFrame should NOT be called because it returned early
    expect(mockCtx.clearRect).not.toHaveBeenCalled();

    renderer.setVisible(true);
    renderer.renderFrame();
    expect(mockCtx.clearRect).toHaveBeenCalled();
  });

  it('6. HUD updateOverlayButtons reflects button label and styling changes', () => {
    hud.setChartOverlayVisible(false);
    expect(hud.isChartOverlayVisibleState()).toBe(false);

    hud.setChartOverlayVisible(true);
    expect(hud.isChartOverlayVisibleState()).toBe(true);
  });

  it('7. Suppresses invalidated OrderBlocks, fully mitigated FVGs, and swept LiquidityLevels by default', () => {
    const visualAdapter = coordinator.getVisualAdapter();
    expect(visualAdapter.isHideInvalidated()).toBe(true);

    const mockState: any = {
      symbol: 'MNQ',
      timeframe: '1m',
      swings: [],
      liquidityLevels: [
        {
          id: 'LL-ACTIVE',
          type: 'BSL',
          category: 'SWING_HIGH',
          price: 20100,
          swept: false,
          swings: [],
        },
        {
          id: 'LL-SWEPT',
          type: 'SSL',
          category: 'SWING_LOW',
          price: 19900,
          swept: true,
          swings: [],
        },
      ],
      fairValueGaps: [
        {
          id: 'FVG-ACTIVE',
          direction: 'BULLISH',
          status: 'ACTIVE',
          highPrice: 20050,
          lowPrice: 20030,
          createdCandleIndex: 1,
          candle3Timestamp: 1700000060000,
        },
        {
          id: 'FVG-MITIGATED',
          direction: 'BULLISH',
          status: 'FULLY_MITIGATED',
          highPrice: 20020,
          lowPrice: 20000,
          createdCandleIndex: 0,
          candle3Timestamp: 1700000000000,
        },
      ],
      orderBlocks: [
        {
          id: 'OB-ACTIVE',
          type: 'BULLISH_OB',
          status: 'UNTESTED',
          highPrice: 20010,
          lowPrice: 19990,
          candleIndex: 0,
          timestamp: 1700000000000,
        },
        {
          id: 'OB-INVALIDATED',
          type: 'BULLISH_OB',
          status: 'INVALIDATED',
          highPrice: 19980,
          lowPrice: 19960,
          candleIndex: 0,
          timestamp: 1700000000000,
        },
      ],
      lastCandleIndex: 10,
      lastUpdatedTimestamp: 1700000600000,
    };

    // When hideInvalidated = true (default)
    const visuals = visualAdapter.adaptStateToVisuals(mockState, []);
    const visualIds = visuals.map((v) => v.id);

    // Active indicators should be present
    expect(visualIds).toContain('VIS-LL-ACTIVE');
    expect(visualIds).toContain('VIS-FVG-ACTIVE');
    expect(visualIds).toContain('VIS-OB-ACTIVE');

    // Invalidated/mitigated/swept indicators MUST NOT be marked on chart
    expect(visualIds).not.toContain('VIS-LL-SWEPT');
    expect(visualIds).not.toContain('VIS-FVG-MITIGATED');
    expect(visualIds).not.toContain('VIS-OB-INVALIDATED');

    // When hideInvalidated = false, all are rendered
    visualAdapter.setHideInvalidated(false);
    const allVisuals = visualAdapter.adaptStateToVisuals(mockState, []);
    const allIds = allVisuals.map((v) => v.id);

    expect(allIds).toContain('VIS-LL-SWEPT');
    expect(allIds).toContain('VIS-FVG-MITIGATED');
    expect(allIds).toContain('VIS-OB-INVALIDATED');

    // Reset back to true
    visualAdapter.setHideInvalidated(true);
    expect(visualAdapter.isHideInvalidated()).toBe(true);
  });

  it('8. Ingests streaming real-time candle updates and updates active bar', () => {
    const c1 = makeCandle(1700000000000, 20000);
    coordinator.ingestCandle(c1);

    expect(coordinator.getStore().getCandleCount()).toBe(1);
    expect(coordinator.getStore().getLatestCandle()?.close).toBe(20005);

    // Live tick update on same candle timestamp
    const c1Update: Candle = {
      timestamp: 1700000000000,
      open: 20000,
      high: 20030,
      low: 19990,
      close: 20025,
      volume: 150,
    };
    coordinator.ingestCandle(c1Update);

    expect(coordinator.getStore().getCandleCount()).toBe(1);
    expect(coordinator.getStore().getLatestCandle()?.close).toBe(20025);
    expect(coordinator.getStore().getLatestCandle()?.high).toBe(20030);

    // New candle arrival
    const c2 = makeCandle(1700000060000, 20030);
    coordinator.ingestCandle(c2);

    expect(coordinator.getStore().getCandleCount()).toBe(2);
    expect(coordinator.getStore().getLatestCandle()?.timestamp).toBe(1700000060000);
  });

  it('9. CoordinateTranslator pan and zoom dynamically moves annotations with chart dragging', () => {
    const translator = new CoordinateTranslator({
      width: 1000,
      height: 500,
      topPadding: 0,
      bottomPadding: 0,
      leftPadding: 0,
      rightPadding: 0,
      minPrice: 100,
      maxPrice: 200,
      firstCandleIndex: 0,
      lastCandleIndex: 100,
      barWidth: 10,
    });

    const initialX = translator.indexToX(50);
    const initialY = translator.priceToY(150);
    expect(initialX).toBe(505);
    expect(initialY).toBe(250);

    // User drags chart 100px to the right (dx = 100) and 50px down (dy = 50)
    translator.pan(100, 50);

    // When dragging right, annotations move right (+100px)
    const pannedX = translator.indexToX(50);
    expect(pannedX).toBe(605);

    // When dragging down, annotations move down (+50px)
    const pannedY = translator.priceToY(150);
    expect(pannedY).toBe(300);

    // Zooming in anchored at center
    translator.zoom(0.8, 500);
    expect(translator.getViewport().barWidth).toBeGreaterThan(10);
  });

  it('10. Draws estimated target line (Draw On Liquidity) where price should reach, and removes it when swept', () => {
    const visualAdapter = coordinator.getVisualAdapter();

    const mockState: any = {
      symbol: 'MNQ',
      timeframe: '1m',
      trend: 'BULLISH',
      swings: [],
      activeSwingLow: { price: 20000 },
      activeSwingHigh: { price: 20100 },
      liquidityLevels: [
        {
          id: 'BSL-TARGET-1',
          type: 'BSL',
          category: 'SWING_HIGH',
          price: 20300,
          swept: false,
          swings: [],
        },
      ],
      fairValueGaps: [],
      orderBlocks: [],
      lastCandleIndex: 20,
      lastUpdatedTimestamp: 1700000000000,
    };

    // When BSL is unswept, DOL target line is drawn
    const visuals = visualAdapter.adaptStateToVisuals(mockState, []);
    const targetVisual = visuals.find((v) => v.id.startsWith('VIS-DOL-TARGET-BSL'));

    expect(targetVisual).toBeDefined();
    expect(targetVisual?.type).toBe('LINE');
    expect((targetVisual as any)?.price).toBe(20300);
    expect((targetVisual as any)?.label).toContain('TARGET');

    // When the target liquidity level is swept / reached, it is invalidated and disappears
    mockState.liquidityLevels[0].swept = true;
    const afterSwept = visualAdapter.adaptStateToVisuals(mockState, []);
    const targetAfterSwept = afterSwept.find((v) => v.id.startsWith('VIS-DOL-TARGET-BSL'));

    expect(targetAfterSwept).toBeUndefined();
  });

  describe('Dynamic Auto-Analysis (Auto-Gestión) Tests', () => {
    it('starts with dynamic analysis inactive by default', () => {
      expect(coordinator.isDynamicAnalysisActiveState()).toBe(false);
      expect(hud.isDynamicAnalysisActiveState()).toBe(false);
    });

    it('activates dynamic analysis mode when runMarketAnalysis is called', async () => {
      const baseTime = 1700000000000;
      const candles: Candle[] = [];
      for (let i = 0; i < 35; i++) {
        candles.push(makeCandle(baseTime + i * 60000, 20100 + i));
      }
      coordinator.ingestCandles(candles);

      await coordinator.runMarketAnalysis({ allowDelayedFeed: true });

      expect(coordinator.isDynamicAnalysisActiveState()).toBe(true);
      expect(hud.isDynamicAnalysisActiveState()).toBe(true);
    });

    it('can toggle dynamic analysis mode via setDynamicAnalysisActive and HUD callback', () => {
      coordinator.setDynamicAnalysisActive(true);
      expect(coordinator.isDynamicAnalysisActiveState()).toBe(true);
      expect(hud.isDynamicAnalysisActiveState()).toBe(true);

      coordinator.setDynamicAnalysisActive(false);
      expect(coordinator.isDynamicAnalysisActiveState()).toBe(false);
      expect(hud.isDynamicAnalysisActiveState()).toBe(false);
    });

    it('auto-evaluates dynamically on new closed candles when dynamic analysis is active', async () => {
      const baseTime = 1700000000000;
      const candles: Candle[] = [];
      for (let i = 0; i < 35; i++) {
        candles.push(makeCandle(baseTime + i * 60000, 20100 + i));
      }
      coordinator.ingestCandles(candles);

      await coordinator.runMarketAnalysis({ allowDelayedFeed: true });
      expect(coordinator.isDynamicAnalysisActiveState()).toBe(true);

      const evaluateSpy = vi.spyOn(coordinator, 'evaluateAnalysisSync');

      // Ingest new closed candle (index 35, 36)
      coordinator.ingestCandle(makeCandle(baseTime + 35 * 60000, 20140));
      coordinator.ingestCandle(makeCandle(baseTime + 36 * 60000, 20145));

      // evaluateAnalysisSync should have been triggered automatically
      expect(evaluateSpy).toHaveBeenCalled();
      evaluateSpy.mockRestore();
    });

    it('clearing analyst overlay disables dynamic analysis and clears notices', async () => {
      const baseTime = 1700000000000;
      const candles: Candle[] = [];
      for (let i = 0; i < 35; i++) {
        candles.push(makeCandle(baseTime + i * 60000, 20100 + i));
      }
      coordinator.ingestCandles(candles);
      await coordinator.runMarketAnalysis({ allowDelayedFeed: true });

      hud.setDirectionChangeNotice({ from: 'BEARISH', to: 'BULLISH', timestamp: Date.now() });
      expect(coordinator.isDynamicAnalysisActiveState()).toBe(true);

      // Trigger clear
      if (hud.onClearAnalystOverlay) {
        hud.onClearAnalystOverlay();
      }

      expect(coordinator.isDynamicAnalysisActiveState()).toBe(false);
      expect(coordinator.getLastAnalysis()).toBeNull();
    });
  });

  describe('Funded Account Position Sizing & Risk Management Tests', () => {
    it('calculates suggested MNQ contracts accurately based on $2/pt', () => {
      hud.setUserRiskBudget(100);
      hud.setSelectedInstrumentType('MNQ');

      // 15 pts risk * $2/pt = $30 risk per contract.
      // Floor($100 / $30) = 3 contracts.
      // Estimated move: 30 pts * $2/pt = $60 reward per contract * 3 = $180 total reward.
      const sizing = coordinator.calculatePositionSize(15, 30);

      expect(sizing.pointValue).toBe(2);
      expect(sizing.contracts).toBe(3);
      expect(sizing.riskPerContract).toBe(30);
      expect(sizing.totalRiskUsd).toBe(90);
      expect(sizing.totalRewardUsd).toBe(180);
    });

    it('calculates suggested NQ contracts accurately based on $20/pt', () => {
      hud.setUserRiskBudget(1000);
      hud.setSelectedInstrumentType('NQ');

      // 15 pts risk * $20/pt = $300 risk per contract.
      // Floor($1000 / $300) = 3 contracts.
      const sizing = coordinator.calculatePositionSize(15, 30);

      expect(sizing.pointValue).toBe(20);
      expect(sizing.contracts).toBe(3);
      expect(sizing.riskPerContract).toBe(300);
      expect(sizing.totalRiskUsd).toBe(900);
      expect(sizing.totalRewardUsd).toBe(1800);
    });

    it('returns 0 contracts when risk exceeds user budget (protects funded account drawdown)', () => {
      hud.setUserRiskBudget(50);
      hud.setSelectedInstrumentType('MNQ');

      // 30 pts risk * $2/pt = $60 risk per contract.
      // Budget is $50, so 0 contracts can be safely taken.
      const sizing = coordinator.calculatePositionSize(30, 60);

      expect(sizing.contracts).toBe(0);
      expect(sizing.riskPerContract).toBe(60);
      expect(sizing.totalRiskUsd).toBe(0);
    });

    it('updates contract calculation dynamically when budget changes', () => {
      hud.setSelectedInstrumentType('MNQ');

      // 20 pts risk ($40/contract)
      hud.setUserRiskBudget(50);
      expect(coordinator.calculatePositionSize(20).contracts).toBe(1);

      hud.setUserRiskBudget(150);
      expect(coordinator.calculatePositionSize(20).contracts).toBe(3);

      hud.setUserRiskBudget(200);
      expect(coordinator.calculatePositionSize(20).contracts).toBe(5);
    });

    it('switches point value seamlessly when changing instrument type', () => {
      coordinator.setUserRiskBudget(500);

      coordinator.setSelectedInstrumentType('MNQ');
      expect(coordinator.getSelectedInstrumentType()).toBe('MNQ');
      // 10 pts * $2 = $20/contract -> 25 contracts
      expect(coordinator.calculatePositionSize(10).contracts).toBe(25);

      coordinator.setSelectedInstrumentType('NQ');
      expect(coordinator.getSelectedInstrumentType()).toBe('NQ');
      // 10 pts * $20 = $200/contract -> 2 contracts
      expect(coordinator.calculatePositionSize(10).contracts).toBe(2);
    });
  });
});
