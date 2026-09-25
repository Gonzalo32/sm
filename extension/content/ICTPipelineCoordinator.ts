/**
 * ICT Assistant - Real Market & Replay Pipeline Coordinator (ISOLATED World)
 * Connects CandleStore / ReplayEngine -> ICTEngine -> ConfluenceEngine -> SetupEngine -> MarketContextEngine -> VisualAdapter -> ICTHUD.
 * Guarantees 100% shared domain logic between LIVE stream and REPLAY mode.
 */

import { CandleStore } from '../../core/market/CandleStore';
import { Candle, Timeframe } from '../../core/market/Candle';
import { ICTEngine, ICTEngineResult } from '../../core/ict/engine/ICTEngine';
import { ConfluenceEngine } from '../../core/ict/confluence/ConfluenceEngine';
import { SetupEngine } from '../../core/ict/setups/SetupEngine';
import { MarketContextEngine, ICTMarketContext } from '../../core/ict/context/MarketContextEngine';
import { ReplayEngine } from '../../core/ict/replay/ReplayEngine';
import { ReplayState } from '../../core/ict/replay/ReplayTypes';
import { VisualAdapter } from '../visual/VisualAdapter';
import { ICTHUD } from '../visual/ICTHUD';
import { CanvasRenderer } from '../visual/CanvasRenderer';
import { VisualObject } from '../visual/VisualTypes';

export interface PipelineEvaluationResult {
  engineResult: ICTEngineResult;
  marketContext: ICTMarketContext;
  visuals: VisualObject[];
  executionTimeMs: number;
}

export type PipelineMode = 'LIVE' | 'REPLAY';

export class ICTPipelineCoordinator {
  private symbol: string;
  private timeframe: Timeframe;
  private mode: PipelineMode = 'LIVE';
  private debugMode: boolean = true;

  private store: CandleStore;
  private replayEngine: ReplayEngine;
  private ictEngine: ICTEngine;
  private confluenceEngine: ConfluenceEngine;
  private setupEngine: SetupEngine;
  private contextEngine: MarketContextEngine;
  private visualAdapter: VisualAdapter;
  private hud: ICTHUD | null = null;
  private renderer: CanvasRenderer | null = null;

  constructor(
    symbol: string = 'MNQ',
    timeframe: Timeframe = '1m',
    options?: { hud?: ICTHUD; renderer?: CanvasRenderer; debug?: boolean }
  ) {
    this.symbol = symbol;
    this.timeframe = timeframe;
    this.debugMode = options?.debug ?? true;

    this.store = new CandleStore(symbol, timeframe);
    this.replayEngine = new ReplayEngine(symbol, timeframe);
    this.ictEngine = new ICTEngine();
    this.confluenceEngine = new ConfluenceEngine();
    this.setupEngine = new SetupEngine();
    this.contextEngine = new MarketContextEngine();
    this.visualAdapter = new VisualAdapter();

    this.hud = options?.hud || null;
    this.renderer = options?.renderer || null;

    // Listen to replay updates to re-evaluate on every step
    this.replayEngine.subscribe((state, currentSlice) => {
      if (this.mode === 'REPLAY') {
        this.evaluateSlice(currentSlice, state);
      }
    });
  }

  public setMode(mode: PipelineMode): void {
    this.mode = mode;
  }

  public getMode(): PipelineMode {
    return this.mode;
  }

  public getReplayEngine(): ReplayEngine {
    return this.replayEngine;
  }

  public setContext(symbol: string, timeframe: Timeframe): void {
    if (this.symbol === symbol && this.timeframe === timeframe) return;

    if (this.debugMode) {
      console.log(`[ICT Pipeline] Changing context: ${this.symbol} ${this.timeframe} -> ${symbol} ${timeframe}`);
    }

    this.symbol = symbol;
    this.timeframe = timeframe;
    this.store = new CandleStore(symbol, timeframe);
    this.ictEngine.resetProgressiveBuffer();

    if (this.renderer) {
      this.renderer.clear();
    }

    if (this.mode === 'LIVE') {
      this.reevaluate();
    }
  }

  public getContext(): { symbol: string; timeframe: Timeframe } {
    return { symbol: this.symbol, timeframe: this.timeframe };
  }

  public getStore(): CandleStore {
    return this.store;
  }

  public ingestCandle(candle: Candle): PipelineEvaluationResult {
    this.mode = 'LIVE';
    this.store.ingestCandle(candle);
    return this.reevaluate();
  }

  public ingestCandles(candles: Candle[]): PipelineEvaluationResult {
    this.mode = 'LIVE';
    this.store.loadHistory(candles);
    return this.reevaluate();
  }

  public loadReplayDataset(candles: Candle[], symbol?: string, timeframe?: Timeframe): ReplayState {
    this.mode = 'REPLAY';
    if (symbol) this.symbol = symbol;
    if (timeframe) this.timeframe = timeframe;
    return this.replayEngine.loadDataset(candles, this.symbol, this.timeframe);
  }

  public reevaluate(): PipelineEvaluationResult {
    const candles = this.store.getCandles();
    return this.evaluateSlice(candles);
  }

  /**
   * Shared Domain Logic Processor: Evaluates any given slice of candles.
   * Guarantees 100% equivalence between LIVE stream and REPLAY step.
   */
  public evaluateSlice(candles: Candle[], replayState?: ReplayState): PipelineEvaluationResult {
    const startTime = performance.now();

    // 1. Process ICT Engine on candle slice strictly available up to current index
    const engineResult = this.ictEngine.process(candles, this.symbol, this.timeframe);
    const { state, events } = engineResult;

    // 2. Process Confluences
    const confluences = this.confluenceEngine.evaluateConfluences(state, events);

    // 3. Process Setup Engine
    const setups = this.setupEngine.evaluateSetups(state, events, confluences);

    // 4. Build Market Context
    const marketContext = this.contextEngine.buildContext(state, events, confluences, setups);

    // 5. Adapt Visuals
    const visuals = this.visualAdapter.adaptStateToVisuals(state, events);

    const executionTimeMs = Math.round(performance.now() - startTime);

    // Update HUD (supports both LIVE and REPLAY display)
    if (this.hud) {
      this.hud.render(marketContext, {
        candleCount: candles.length,
        executionTimeMs,
        fps: 60,
        replayState,
      });
    }

    // Update Renderer
    if (this.renderer) {
      this.renderer.updateVisuals(visuals, {
        symbol: this.symbol,
        timeframe: this.timeframe,
        candleCount: candles.length,
        eventCount: events.length,
        activeFvgCount: state.fairValueGaps.filter((f) => f.status === 'ACTIVE').length,
        liquidityCount: state.liquidityLevels.length,
      });
    }

    return {
      engineResult,
      marketContext,
      visuals,
      executionTimeMs,
    };
  }
}
