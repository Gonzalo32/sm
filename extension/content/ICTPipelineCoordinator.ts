/**
 * ICT Assistant - Real Market & Replay Pipeline Coordinator (ISOLATED World)
 * Connects CandleStore / ReplayEngine -> ICTEngine -> ConfluenceEngine -> SetupEngine -> MarketContextEngine -> VisualAdapter -> ICTHUD.
 * Integrates TradeSea Market Analyst decision-support engine, journal, and visual overlay adapter.
 * Guarantees 100% shared domain logic between LIVE stream and REPLAY mode.
 */

import { CandleStore } from '../../core/market/CandleStore';
import { MarketDataAdapter } from '../../core/market/MarketDataAdapter';
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
import { VisualObject, ChartViewportUpdate, validateViewportUpdate } from '../visual/VisualTypes';

import { CandidateContextEngine, CandidateContext } from '../../core/ict/context/CandidateContextEngine';
import { MultiTimeframeContextEngine, MultiTimeframeContext } from '../../core/ict/context/MultiTimeframeContextEngine';

import { MarketAnalystEngine } from '../../core/analyst/MarketAnalystEngine';
import { MarketAnalystJournal } from '../analyst/MarketAnalystJournal';
import { MarketAnalystVisualAdapter } from '../analyst/MarketAnalystVisualAdapter';
import { MarketAnalysis } from '../../core/analyst/MarketAnalystTypes';
import { SessionClassifier, SessionClassificationResult, isValidTimestamp } from '../../core/ict/time/SessionClassifier';

export interface PipelineEvaluationResult {
  engineResult: ICTEngineResult;
  marketContext: ICTMarketContext;
  candidateContext: CandidateContext;
  mtfContext?: MultiTimeframeContext;
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
  private adapter: MarketDataAdapter;
  private replayEngine: ReplayEngine;
  private ictEngine: ICTEngine;
  private confluenceEngine: ConfluenceEngine;
  private setupEngine: SetupEngine;
  private contextEngine: MarketContextEngine;
  private candidateEngine: CandidateContextEngine;
  private mtfEngine: MultiTimeframeContextEngine;
  private visualAdapter: VisualAdapter;
  private hud: ICTHUD | null = null;
  private renderer: CanvasRenderer | null = null;

  // Market Analyst Modules
  private analystEngine: MarketAnalystEngine;
  private analystJournal: MarketAnalystJournal;
  private analystVisualAdapter: MarketAnalystVisualAdapter;
  private lastAnalysis: MarketAnalysis | null = null;
  private lastSessionContext: SessionClassificationResult | null = null;

  constructor(
    symbol: string = 'MNQ',
    timeframe: Timeframe = '1m',
    options?: { hud?: ICTHUD; renderer?: CanvasRenderer; debug?: boolean; adapter?: MarketDataAdapter }
  ) {
    this.symbol = symbol;
    this.timeframe = timeframe;
    this.debugMode = options?.debug ?? true;

    this.store = new CandleStore(symbol, timeframe);
    this.adapter =
      options?.adapter ||
      new MarketDataAdapter(
        { source: 'TradeSea_WS', instrument: symbol as any, timeframe: timeframe as any },
        this.store
      );

    this.replayEngine = new ReplayEngine(symbol, timeframe);
    this.ictEngine = new ICTEngine();
    this.confluenceEngine = new ConfluenceEngine();
    this.setupEngine = new SetupEngine();
    this.contextEngine = new MarketContextEngine();
    this.candidateEngine = new CandidateContextEngine();
    this.mtfEngine = new MultiTimeframeContextEngine();
    this.visualAdapter = new VisualAdapter();

    this.hud = options?.hud || null;
    this.renderer = options?.renderer || null;

    // Instantiate Market Analyst
    this.analystEngine = new MarketAnalystEngine();
    this.analystJournal = new MarketAnalystJournal();
    this.analystVisualAdapter = new MarketAnalystVisualAdapter();

    // Hook HUD Analyst Callbacks
    if (this.hud) {
      this.hud.onAnalyzeMarket = () => {
        this.runMarketAnalysis().catch((err) => {
          if (this.debugMode) console.error('[ICT Pipeline] Analysis error:', err);
        });
      };
      this.hud.onToggleAnalystOverlay = (visible: boolean) => {
        this.analystVisualAdapter.setVisible(visible);
        this.refreshVisuals();
      };
      this.hud.onClearAnalystOverlay = () => {
        this.analystVisualAdapter.clear();
        this.lastAnalysis = null;
        this.lastSessionContext = null;
        this.hud?.setAnalysis(null);
        this.refreshVisuals();
      };
    }

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

  public getAdapter(): MarketDataAdapter {
    return this.adapter;
  }

  public setContext(symbol: string, timeframe: Timeframe): void {
    if (this.symbol === symbol && this.timeframe === timeframe) return;

    if (this.debugMode) {
      console.log(`[ICT Pipeline] Changing context: ${this.symbol} ${this.timeframe} -> ${symbol} ${timeframe}`);
    }

    this.symbol = symbol;
    this.timeframe = timeframe;
    this.store = new CandleStore(symbol, timeframe);
    this.adapter = new MarketDataAdapter(
      { source: 'TradeSea_WS', instrument: symbol as any, timeframe: timeframe as any },
      this.store
    );

    this.ictEngine.resetProgressiveBuffer();
    this.visualAdapter.resetContext(symbol, timeframe);
    this.visualAdapter.setViewportSynchronized(false);
    this.analystVisualAdapter.setViewportSynchronized(false);
    this.analystVisualAdapter.clear();
    this.lastAnalysis = null;
    if (this.hud) this.hud.setAnalysis(null);

    if (this.renderer) {
      this.renderer.getTranslator().resetViewportSync();
      this.renderer.clear();
    }

    if (this.mode === 'LIVE') {
      this.reevaluate();
    }
  }

  /**
   * Updates viewport synchronization from validated chart update.
   * Rejects invalid, stale, or context-mismatched updates.
   */
  public updateViewport(viewport: ChartViewportUpdate): boolean {
    const validation = validateViewportUpdate(viewport);
    if (!validation.valid) {
      if (this.debugMode) {
        console.warn(`[ICT Pipeline] Rejected invalid viewport update: ${validation.error}`);
      }
      return false;
    }

    // Check instrument and timeframe match
    if (viewport.symbol !== this.symbol || viewport.timeframe !== this.timeframe) {
      if (this.debugMode) {
        console.warn(`[ICT Pipeline] Rejected viewport context mismatch: expected ${this.symbol}/${this.timeframe}, got ${viewport.symbol}/${viewport.timeframe}`);
      }
      return false;
    }

    if (this.renderer) {
      this.renderer.updateViewport(
        viewport.width,
        viewport.height,
        viewport.minPrice,
        viewport.maxPrice,
        viewport.firstCandleIndex,
        viewport.lastCandleIndex
      );
      this.renderer.getTranslator().updateFromValidatedViewport(viewport);
    }

    this.visualAdapter.setViewportSynchronized(true);
    this.analystVisualAdapter.setViewportSynchronized(true);

    if (this.mode === 'LIVE') {
      this.reevaluate();
    }

    return true;
  }

  public getRenderer(): CanvasRenderer | null {
    return this.renderer;
  }

  public getVisualAdapter(): VisualAdapter {
    return this.visualAdapter;
  }

  public getMarketAnalystVisualAdapter(): MarketAnalystVisualAdapter {
    return this.analystVisualAdapter;
  }

  public getMarketAnalystJournal(): MarketAnalystJournal {
    return this.analystJournal;
  }

  public getLastAnalysis(): MarketAnalysis | null {
    return this.lastAnalysis;
  }

  public getLastSessionContext(): SessionClassificationResult | null {
    return this.lastSessionContext;
  }

  public getContext(): { symbol: string; timeframe: Timeframe } {
    return { symbol: this.symbol, timeframe: this.timeframe };
  }

  public getStore(): CandleStore {
    return this.store;
  }

  public getMTFEngine(): MultiTimeframeContextEngine {
    return this.mtfEngine;
  }

  public ingestCandle(candle: Candle, htfCandidateContext?: CandidateContext): PipelineEvaluationResult {
    this.mode = 'LIVE';
    this.adapter.ingestRealtimeCandle(candle);
    return this.reevaluate(htfCandidateContext);
  }

  /**
   * Checkpoint 102: Returns strictly closed candles eligible for market analysis.
   * Excludes the final candle whose closure status is indeterminate (forming/active)
   * unless explicit closure is verified.
   * Does NOT modify or prune the underlying CandleStore.
   */
  public getAnalysisEligibleCandles(): Candle[] {
    const candles = this.store.getCandles();
    if (candles.length <= 1) {
      // 0 candles or 1 candle with no successor cannot confirm closure
      return [];
    }

    // Bars 0 through N-2 are guaranteed closed because each bar i has a confirmed successor bar i+1 with T_{i+1} > T_i.
    // The final bar (N-1) has no successor in the store and is treated conservatively as unconfirmed/forming.
    return candles.slice(0, candles.length - 1);
  }

  public ingestCandles(candles: Candle[], htfCandidateContext?: CandidateContext): PipelineEvaluationResult {
    this.mode = 'LIVE';
    if (!Array.isArray(candles) || candles.length === 0) {
      return this.reevaluate(htfCandidateContext);
    }

    // Checkpoint 102: Preserve any existing streaming candles that are strictly newer than the incoming batch
    const maxBatchTs = Math.max(...candles.map((c) => c.timestamp));
    const existingNewer = this.store.getCandles().filter((c) => c.timestamp > maxBatchTs);
    const mergedBatch = existingNewer.length > 0 ? [...candles, ...existingNewer] : candles;

    this.adapter.loadHistoricalWindow(mergedBatch);
    return this.reevaluate(htfCandidateContext);
  }

  public loadReplayDataset(candles: Candle[], symbol?: string, timeframe?: Timeframe): ReplayState {
    this.mode = 'REPLAY';
    if (symbol) this.symbol = symbol;
    if (timeframe) this.timeframe = timeframe;
    return this.replayEngine.loadDataset(candles, this.symbol, this.timeframe);
  }

  public reevaluate(htfCandidateContext?: CandidateContext): PipelineEvaluationResult {
    const candles = this.store.getCandles();
    return this.evaluateSlice(candles, undefined, htfCandidateContext);
  }

  /**
   * Refreshes chart overlay canvas with merged visuals (ICT setups + Market Analyst).
   */
  public refreshVisuals(): void {
    if (!this.renderer) return;

    const candles = this.store.getCandles();
    const engineResult = this.ictEngine.process(candles, this.symbol, this.timeframe);
    const candidateContext = this.candidateEngine.buildCandidateContext(engineResult.state, engineResult.events);
    const confluences = this.confluenceEngine.evaluateConfluences(engineResult.state, engineResult.events);
    const setups = this.setupEngine.evaluateSetups(engineResult.state, engineResult.events, confluences);

    const setupVisuals = this.visualAdapter.adaptStateToVisuals(engineResult.state, engineResult.events, candidateContext, setups);
    const analystVisuals = this.analystVisualAdapter.getVisuals();

    // Checkpoint 100.3 / 102: Apply visual suppression filter for non-READY analysis
    let filteredSetupVisuals = setupVisuals;
    if (this.lastAnalysis && this.lastAnalysis.status !== 'ANALYSIS_READY') {
      filteredSetupVisuals = setupVisuals.filter(
        (v) => !v.id.endsWith('-MARKER') && !v.id.endsWith('-TGT')
      );
    }

    const merged = [...filteredSetupVisuals, ...analystVisuals];

    this.renderer.updateVisuals(merged, {
      symbol: this.symbol,
      timeframe: this.timeframe,
      candleCount: candles.length,
      eventCount: engineResult.events.length,
      activeFvgCount: engineResult.state.fairValueGaps.filter((f) => f.status === 'ACTIVE').length,
      liquidityCount: engineResult.state.liquidityLevels.length,
    });
  }

  /**
   * User-triggered point-in-time Market Analysis execution.
   * Evaluates strictly on confirmed closed history via getAnalysisEligibleCandles().
   * By default, analysis results are transient (zero IndexedDB or ledger writes).
   */
  public async runMarketAnalysis(options?: { persistForecast?: boolean }): Promise<MarketAnalysis> {
    const analysisCandles = this.getAnalysisEligibleCandles();
    const engineResult = this.ictEngine.process(analysisCandles, this.symbol, this.timeframe);
    const confluences = this.confluenceEngine.evaluateConfluences(engineResult.state, engineResult.events);
    const setups = this.setupEngine.evaluateSetups(engineResult.state, engineResult.events, confluences);
    const candidateContext = this.candidateEngine.buildCandidateContext(engineResult.state, engineResult.events);

    const analysis = this.analystEngine.analyze(
      analysisCandles,
      engineResult.state,
      engineResult.events,
      setups,
      candidateContext,
      Date.now()
    );

    // CP105: Explicit user-requested session classification on the latest confirmed closed candle
    const latestCandle = analysisCandles.length > 0 ? analysisCandles[analysisCandles.length - 1] : undefined;
    if (latestCandle && isValidTimestamp(latestCandle.timestamp)) {
      try {
        this.lastSessionContext = SessionClassifier.classify(latestCandle.timestamp);
      } catch (err) {
        if (this.debugMode) {
          console.warn('[ICT Pipeline Coordinator] Session classification failed:', err);
        }
        this.lastSessionContext = null;
      }
    } else {
      this.lastSessionContext = null;
    }

    if (this.lastSessionContext) {
      analysis.sessionContext = this.lastSessionContext;
    }

    this.lastAnalysis = analysis;

    // Checkpoint 102: Transient analysis contract — do NOT write forecasts to journal unless explicitly requested
    if (options?.persistForecast === true) {
      try {
        const startTs = analysisCandles.length > 0 ? analysisCandles[0].timestamp : undefined;
        const endTs = analysisCandles.length > 0 ? analysisCandles[analysisCandles.length - 1].timestamp : undefined;
        await this.analystJournal.recordForecast(analysis, analysisCandles.length, startTs, endTs);
      } catch (e) {
        if (this.debugMode) {
          console.warn('[ICT Pipeline Coordinator] Failed to record forecast to journal:', e);
        }
      }
    }

    // Adapt visuals
    const currentIdx = analysisCandles.length > 0 ? analysisCandles.length - 1 : 0;
    this.analystVisualAdapter.adaptAnalysisToVisuals(analysis, currentIdx);

    // Update HUD
    if (this.hud) {
      this.hud.setAnalysis(analysis);
      const marketContext = this.contextEngine.buildContext(engineResult.state, engineResult.events, confluences, setups);
      this.hud.render(marketContext, {
        candleCount: analysisCandles.length,
        executionTimeMs: 0,
        fps: 60,
        candidateContext,
        analysis,
      });
    }

    // Refresh renderer
    this.refreshVisuals();

    return analysis;
  }

  /**
   * Shared Domain Logic Processor: Evaluates any given slice of candles.
   * Guarantees 100% equivalence between LIVE stream and REPLAY step.
   */
  public evaluateSlice(
    candles: Candle[],
    replayState?: ReplayState,
    htfCandidateContext?: CandidateContext
  ): PipelineEvaluationResult {
    const startTime = performance.now();

    // 1. Process ICT Engine on candle slice strictly available up to current index
    const engineResult = this.ictEngine.process(candles, this.symbol, this.timeframe);
    const { state, events } = engineResult;

    // 2. Process Confluences
    const confluences = this.confluenceEngine.evaluateConfluences(state, events);

    // 3. Process Setup Engine
    const setups = this.setupEngine.evaluateSetups(state, events, confluences);

    // 4. Build Market Context & Candidate Context
    const marketContext = this.contextEngine.buildContext(state, events, confluences, setups);
    const candidateContext = this.candidateEngine.buildCandidateContext(state, events);

    // 5. Evaluate Multi-Timeframe Context if HTF candidate context supplied
    let mtfContext: MultiTimeframeContext | undefined = undefined;
    if (htfCandidateContext) {
      mtfContext = this.mtfEngine.evaluateMTFContext(htfCandidateContext, candidateContext);
    }

    // 6. Adapt Visuals (including CP84 confirmed setup annotations and analyst overlays)
    const setupVisuals = this.visualAdapter.adaptStateToVisuals(state, events, candidateContext, setups);
    const analystVisuals = this.analystVisualAdapter.getVisuals();
    const visuals = [...setupVisuals, ...analystVisuals];

    const executionTimeMs = Math.round(performance.now() - startTime);

    // Update HUD (supports both LIVE and REPLAY display)
    if (this.hud) {
      this.hud.render(marketContext, {
        candleCount: candles.length,
        executionTimeMs,
        fps: 60,
        replayState,
        candidateContext,
        mtfContext,
        analysis: this.lastAnalysis,
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
      candidateContext,
      mtfContext,
      visuals,
      executionTimeMs,
    };
  }
}
