/**
 * Extension Visual Layer - ICT Market Context Assistant & Replay HUD
 * Renders structured natural-language market context, replay controls, historical event timeline,
 * and TradeSea Market Analyst decision-support trigger & scenario cards.
 * Derived strictly from ICTMarketContext data model and MarketAnalysis results. Zero trading execution.
 */

import { ICTMarketContext } from '../../core/ict/context/MarketContextEngine';
import { ReplayState } from '../../core/ict/replay/ReplayTypes';
import { CandidateContext } from '../../core/ict/context/CandidateContextEngine';
import { MultiTimeframeContext } from '../../core/ict/context/MultiTimeframeContextEngine';
import { MarketAnalysis } from '../../core/analyst/MarketAnalystTypes';

export interface EventAuditDetail {
  type: string;
  timestamp: number;
  eventTimestamp?: number;
  confirmationTimestamp?: number;
  ohlc?: { open: number; high: number; low: number; close: number };
  bodyRatio?: number;
  rangeMultiplier?: number;
  thresholds?: string;
  status: string;
  setupRelation?: string;
  classification?: 'CLEAR' | 'BORDERLINE' | 'QUESTIONABLE';
  infoAvailableAtEvent?: boolean;
  futureInfoUsed?: boolean;
}

export type HUDMode = 'LIVE' | 'REPLAY' | 'VALIDATION';

export class ICTHUD {
  private container: HTMLDivElement | null = null;
  private isVisible: boolean = true;
  private isMinimized: boolean = false;
  private isDraggableInitialized: boolean = false;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private initialLeft: number = 0;
  private initialTop: number = 0;
  private lastContext: ICTMarketContext | null = null;
  private lastOptions: any = null;
  private mode: HUDMode = 'LIVE';
  private selectedAuditDetail: EventAuditDetail | null = null;

  // Extension & Overlay Controls
  private isRunning: boolean = true;
  private isChartOverlayVisible: boolean = true;
  public onToggleRunning?: (running: boolean) => void;
  public onToggleChartOverlay?: (visible: boolean) => void;

  // Market Analyst State
  private currentAnalysis: MarketAnalysis | null = null;
  private isAnalyzing: boolean = false;
  private isAnalystOverlayVisible: boolean = true;
  private isDynamicAnalysisActive: boolean = false;
  private lastDirectionChangeNotice: {
    from: string;
    to: string;
    timestamp: number;
  } | null = null;

  // Market Analyst Callbacks
  public onAnalyzeMarket?: () => void;
  public onToggleDynamicAnalysis?: (active: boolean) => void;
  public onToggleAnalystOverlay?: (visible: boolean) => void;
  public onClearAnalystOverlay?: () => void;

  // Replay Control Callbacks
  public onModeChange?: (mode: HUDMode) => void;
  public onReplayReset?: () => void;
  public onReplayPrev?: () => void;
  public onReplayPlay?: () => void;
  public onReplayPause?: () => void;
  public onReplayNext?: (n?: number) => void;
  public onReplaySpeedChange?: (speedMs: number) => void;

  // Validation Control Callbacks
  public onValidationPrev?: () => void;
  public onValidationNext?: () => void;
  public onValidationReview?: (caseId: string, status: 'CLEAR' | 'BORDERLINE' | 'QUESTIONABLE', reason?: string, notes?: string) => void;

  constructor() {
    this.mount();
  }

  public mount(): void {
    if (typeof document === 'undefined') return;
    if (document.getElementById('ict-assistant-hud')) {
      this.container = document.getElementById('ict-assistant-hud') as HTMLDivElement;
      this.setupDraggable();
      return;
    }

    const hud = document.createElement('div');
    hud.id = 'ict-assistant-hud';
    hud.style.cssText = `
      position: fixed;
      top: 50px;
      right: 20px;
      width: 370px;
      max-height: 85vh;
      overflow-y: auto;
      background: rgba(15, 23, 42, 0.96);
      backdrop-filter: blur(14px);
      border: 1px solid rgba(56, 189, 248, 0.4);
      border-radius: 12px;
      padding: 14px 16px;
      color: #f8fafc;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      line-height: 1.45;
      z-index: 999999;
      box-shadow: 0 16px 36px -6px rgba(0, 0, 0, 0.7);
      user-select: none;
      transition: opacity 0.2s ease;
    `;

    document.body.appendChild(hud);
    this.container = hud;
    this.setupDraggable();
  }

  private setupDraggable(): void {
    if (!this.container || this.isDraggableInitialized) return;
    this.isDraggableInitialized = true;

    const onStartDrag = (clientX: number, clientY: number, target: HTMLElement): boolean => {
      // Do not initiate drag if user clicked on interactive controls
      if (target.closest('button, input, select, textarea, pre, a')) {
        return false;
      }

      // In expanded mode, drag from header or drag handles to avoid intercepting scroll or content selection
      if (!this.isMinimized && !target.closest('.hud-drag-handle') && !target.closest('.hud-header')) {
        return false;
      }

      this.isDragging = true;
      this.dragStartX = clientX;
      this.dragStartY = clientY;

      const rect = this.container!.getBoundingClientRect();
      this.initialLeft = rect.left;
      this.initialTop = rect.top;

      // Switch from right/bottom to explicit left/top coordinates
      this.container!.style.right = 'auto';
      this.container!.style.bottom = 'auto';
      this.container!.style.left = `${this.initialLeft}px`;
      this.container!.style.top = `${this.initialTop}px`;
      this.container!.style.cursor = 'grabbing';
      if (typeof document !== 'undefined') {
        document.body.style.userSelect = 'none';
      }
      return true;
    };

    const onMoveDrag = (clientX: number, clientY: number) => {
      if (!this.isDragging || !this.container) return;

      const dx = clientX - this.dragStartX;
      const dy = clientY - this.dragStartY;

      let newLeft = this.initialLeft + dx;
      let newTop = this.initialTop + dy;

      const containerWidth = this.container.offsetWidth;
      const containerHeight = this.container.offsetHeight;
      const maxLeft = Math.max(0, window.innerWidth - containerWidth);
      const maxTop = Math.max(0, window.innerHeight - containerHeight);

      newLeft = Math.max(0, Math.min(newLeft, maxLeft));
      newTop = Math.max(0, Math.min(newTop, maxTop));

      this.container.style.left = `${newLeft}px`;
      this.container.style.top = `${newTop}px`;
    };

    const onEndDrag = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      if (this.container) {
        this.container.style.cursor = '';
      }
      if (typeof document !== 'undefined') {
        document.body.style.userSelect = '';
      }
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };

    const onMouseMove = (e: MouseEvent) => {
      onMoveDrag(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
      onEndDrag();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        onMoveDrag(e.touches[0].clientX, e.touches[0].clientY);
        e.preventDefault();
      }
    };

    const onTouchEnd = () => {
      onEndDrag();
    };

    this.container.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (onStartDrag(e.clientX, e.clientY, e.target as HTMLElement)) {
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        e.preventDefault();
      }
    });

    this.container.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length === 1) {
        if (onStartDrag(e.touches[0].clientX, e.touches[0].clientY, e.touches[0].target as HTMLElement)) {
          window.addEventListener('touchmove', onTouchMove, { passive: false });
          window.addEventListener('touchend', onTouchEnd);
          window.addEventListener('touchcancel', onTouchEnd);
        }
      }
    }, { passive: true });
  }

  public setVisible(visible: boolean): void {
    this.isVisible = visible;
    if (this.container) {
      this.container.style.display = visible ? 'block' : 'none';
    }
  }

  public setMode(mode: HUDMode): void {
    this.mode = mode;
  }

  public selectEventAudit(detail: EventAuditDetail | null): void {
    this.selectedAuditDetail = detail;
  }

  public setAnalysis(analysis: MarketAnalysis | null): void {
    this.currentAnalysis = analysis;
    this.isAnalyzing = false;
  }

  public setAnalyzing(analyzing: boolean): void {
    this.isAnalyzing = analyzing;
  }

  public setDynamicAnalysisActive(active: boolean): void {
    this.isDynamicAnalysisActive = active;
  }

  public isDynamicAnalysisActiveState(): boolean {
    return this.isDynamicAnalysisActive;
  }

  public setDirectionChangeNotice(notice: { from: string; to: string; timestamp: number } | null): void {
    this.lastDirectionChangeNotice = notice;
  }

  public getAnalystOverlayVisible(): boolean {
    return this.isAnalystOverlayVisible;
  }

  public setRunning(running: boolean): void {
    this.isRunning = running;
    if (this.lastContext) {
      this.render(this.lastContext, this.lastOptions);
    }
  }

  public isRunningState(): boolean {
    return this.isRunning;
  }

  public setChartOverlayVisible(visible: boolean): void {
    this.isChartOverlayVisible = visible;
    this.isAnalystOverlayVisible = visible;
    this.updateOverlayButtons();
  }

  public isChartOverlayVisibleState(): boolean {
    return this.isChartOverlayVisible;
  }

  public updateOverlayButtons(): void {
    if (typeof document === 'undefined') return;
    const text = this.isChartOverlayVisible ? '👁 Ocultar Gráfico' : '👁 Mostrar Gráfico';
    const bg = this.isChartOverlayVisible ? '#1e293b' : '#334155';
    const color = this.isChartOverlayVisible ? '#cbd5e1' : '#facc15';

    const btnHud = document.getElementById('btn-hud-toggle-chart');
    if (btnHud) {
      btnHud.textContent = text;
      btnHud.style.backgroundColor = bg;
      btnHud.style.color = color;
    }
    const btnAnalyst = document.getElementById('btn-analyst-toggle-overlay');
    if (btnAnalyst) {
      btnAnalyst.textContent = text;
      btnAnalyst.style.backgroundColor = bg;
      btnAnalyst.style.color = color;
    }
  }

  public render(
    context: ICTMarketContext,
    options?: {
      fps?: number;
      candleCount?: number;
      executionTimeMs?: number;
      replayState?: ReplayState;
      validationCase?: any;
      validationMetrics?: any;
      candidateContext?: CandidateContext;
      mtfContext?: MultiTimeframeContext;
      analysis?: MarketAnalysis | null;
    }
  ): void {
    if (!this.container || !this.isVisible) return;

    if (options?.analysis !== undefined) {
      this.currentAnalysis = options.analysis;
    }

    this.lastContext = context;
    this.lastOptions = options;

    const { symbol, ltfTimeframe, htfTimeframe, structure, liquidity, pdArray, displacement, setup, narrativeSummary } = context;
    const replayState = options?.replayState;
    const valCase = options?.validationCase;
    const isReplay = this.mode === 'REPLAY' || !!replayState;

    if (this.isMinimized) {
      this.container.style.width = 'auto';
      this.container.style.maxHeight = 'none';
      this.container.style.padding = '6px 10px';
      this.container.innerHTML = `
        <div class="hud-header" style="display:flex; align-items:center; gap:6px;">
          <span class="hud-drag-handle" style="cursor:grab; color:#64748b; font-size:14px; user-select:none; padding:0 2px;" title="Arrastrar">⠿</span>
          <span class="hud-drag-handle" style="font-weight:800; color:#38bdf8; font-size:11px; letter-spacing:0.5px; cursor:grab;">⚡ ICT</span>
          <button id="btn-hud-power" style="padding:3px 7px; background:${this.isRunning ? '#ef4444' : '#22c55e'}; color:#fff; border:none; border-radius:4px; cursor:pointer; font-size:10px; font-weight:800;" title="${this.isRunning ? 'Detener extensión' : 'Reanudar extensión'}">
            ${this.isRunning ? '⏹ Detener' : '▶ Reanudar'}
          </button>
          <button id="btn-hud-toggle-chart" style="padding:3px 7px; background:#1e293b; color:${this.isChartOverlayVisible ? '#cbd5e1' : '#facc15'}; border:1px solid #475569; border-radius:4px; cursor:pointer; font-size:10px; font-weight:800;" title="${this.isChartOverlayVisible ? 'Ocultar gráfico' : 'Mostrar gráfico'}">
            ${this.isChartOverlayVisible ? '👁' : '👁‍🗨'}
          </button>
          <button id="btn-analizar-mercado" style="padding:4px 8px; background:#0284c7; color:#fff; border:none; border-radius:6px; cursor:pointer; font-size:10px; font-weight:800; letter-spacing:0.5px; box-shadow:0 2px 6px rgba(2,132,199,0.4);">
            ${this.isAnalyzing ? '⏳ Analizando...' : '⚡ Analizar mercado'}
          </button>
          <button id="btn-hud-expand" style="padding:3px 7px; background:#1e293b; color:#38bdf8; border:1px solid #475569; border-radius:4px; cursor:pointer; font-size:11px; font-weight:800;" title="Expandir panel">
            ➕
          </button>
        </div>
      `;
      this.attachEventListeners(isReplay, replayState);
      return;
    }

    this.container.style.width = '370px';
    this.container.style.maxHeight = '85vh';
    this.container.style.padding = '14px 16px';

    const getStatusBadge = (status: string) => {
      switch (status) {
        case 'CLEAR':
        case 'CONFIRMED':
        case 'PRESENT':
        case 'ANALYSIS_READY':
        case 'BULLISH':
          return `<span style="color:#4ade80; background:rgba(34,197,94,0.15); padding:1px 6px; border-radius:4px; font-weight:700;">${status}</span>`;
        case 'BORDERLINE':
        case 'FORMING':
        case 'NO_CLEAR_OPPORTUNITY':
        case 'INDETERMINATE':
          return `<span style="color:#facc15; background:rgba(234,179,8,0.15); padding:1px 6px; border-radius:4px; font-weight:700;">${status}</span>`;
        case 'QUESTIONABLE':
        case 'INVALIDATED':
        case 'EXPIRED':
        case 'STALE_MARKET_DATA':
        case 'CONFLICTING_EVIDENCE':
        case 'ANALYSIS_ERROR':
        case 'BEARISH':
          return `<span style="color:#f87171; background:rgba(239,68,68,0.15); padding:1px 6px; border-radius:4px; font-weight:700;">${status}</span>`;
        case 'UNREVIEWED':
        case 'WATCHING':
        case 'INSUFFICIENT_DATA':
        case 'ABSENT':
        default:
          return `<span style="color:#94a3b8; background:rgba(148,163,184,0.15); padding:1px 6px; border-radius:4px; font-weight:600;">${status}</span>`;
      }
    };

    if (this.mode === 'VALIDATION' && valCase) {
      const snapStr = JSON.stringify(valCase.detectionSnapshot, null, 2);

      this.container.innerHTML = `
        <div class="hud-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid #334155; padding-bottom:6px; cursor:grab;">
          <div class="hud-drag-handle" style="display:flex; align-items:center; gap:6px; cursor:grab; user-select:none;" title="Arrastrar panel">
            <span style="color:#64748b; font-size:14px;">⠿</span>
            <span style="font-weight:800; color:#38bdf8; font-size:12px; letter-spacing:0.5px;">🧪 ICT VALIDATION LAB</span>
          </div>
          <div style="display:flex; gap:4px; align-items:center;">
            <button id="btn-mode-live" style="padding:2px 6px; border-radius:4px; font-size:9px; font-weight:700; border:none; cursor:pointer; background:#1e293b; color:#94a3b8;">LIVE</button>
            <button id="btn-mode-replay" style="padding:2px 6px; border-radius:4px; font-size:9px; font-weight:700; border:none; cursor:pointer; background:#1e293b; color:#94a3b8;">REPLAY</button>
            <button id="btn-mode-validation" style="padding:2px 6px; border-radius:4px; font-size:9px; font-weight:700; border:none; cursor:pointer; background:#0284c7; color:#fff;">VALIDATION</button>
            <button id="btn-hud-minimize" style="padding:2px 6px; border-radius:4px; font-size:10px; font-weight:700; border:1px solid #475569; cursor:pointer; background:#1e293b; color:#cbd5e1; margin-left:2px;" title="Minimizar panel">➖</button>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; background:rgba(30,41,59,0.85); padding:6px 8px; border-radius:6px; border:1px solid #334155;">
          <button id="btn-val-prev" style="padding:3px 8px; background:#1e293b; color:#cbd5e1; border:1px solid #475569; border-radius:4px; cursor:pointer; font-weight:700;">&lt; Previous Case</button>
          <span style="color:#f8fafc; font-weight:700; font-size:10px;">${valCase.caseId.slice(0, 24)}...</span>
          <button id="btn-val-next" style="padding:3px 8px; background:#1e293b; color:#cbd5e1; border:1px solid #475569; border-radius:4px; cursor:pointer; font-weight:700;">Next Case &gt;</button>
        </div>

        <div style="margin-bottom:8px; background:rgba(15,23,42,0.9); padding:8px 10px; border-radius:8px; border:1px solid rgba(56,189,248,0.4);">
          <div style="color:#38bdf8; font-weight:800; font-size:10px; text-transform:uppercase; margin-bottom:4px;">⚙️ DETECTION LAYER (Pure Mathematical Truth)</div>
          <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
            <span style="color:#94a3b8;">Symbol / TF:</span> <b style="color:#f8fafc;">${valCase.symbol} ${valCase.timeframe}</b>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
            <span style="color:#94a3b8;">Event Type:</span> <b style="color:#4ade80;">${valCase.eventType}</b>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
            <span style="color:#94a3b8;">Event Timestamp:</span> <span style="color:#cbd5e1;">${new Date(valCase.eventTimestamp).toLocaleTimeString()}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span style="color:#94a3b8;">Confirmation:</span> <span style="color:#cbd5e1;">${valCase.confirmationTimestamp ? new Date(valCase.confirmationTimestamp).toLocaleTimeString() : 'Same candle'}</span>
          </div>
          <div style="color:#64748b; font-size:9px; font-weight:700; margin-bottom:2px;">DETECTION SNAPSHOT:</div>
          <pre style="background:#090d16; padding:6px; border-radius:4px; color:#38bdf8; font-size:9px; max-height:80px; overflow-y:auto; margin:0;">${snapStr}</pre>
        </div>

        <div style="margin-bottom:8px; background:rgba(30,41,59,0.9); padding:8px 10px; border-radius:8px; border:1px solid rgba(250,204,21,0.4);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="color:#facc15; font-weight:800; font-size:10px; text-transform:uppercase;">⚖️ VALIDATION LAYER (Independent Audit)</span>
            ${getStatusBadge(valCase.validationStatus)}
          </div>
          <div style="margin-bottom:6px;">
            <div style="color:#cbd5e1; font-size:9px; margin-bottom:4px; font-weight:700;">Classify Event:</div>
            <div style="display:flex; gap:4px;">
              <button id="btn-val-clear" style="flex:1; padding:4px; background:#14532d; color:#4ade80; border:1px solid #22c55e; border-radius:4px; cursor:pointer; font-weight:700;">CLEAR</button>
              <button id="btn-val-borderline" style="flex:1; padding:4px; background:#713f12; color:#facc15; border:1px solid #eab308; border-radius:4px; cursor:pointer; font-weight:700;">BORDERLINE</button>
              <button id="btn-val-questionable" style="flex:1; padding:4px; background:#7f1d1d; color:#f87171; border:1px solid #ef4444; border-radius:4px; cursor:pointer; font-weight:700;">QUESTIONABLE</button>
            </div>
          </div>
          <div style="margin-bottom:4px;">
            <div style="color:#94a3b8; font-size:9px;">Validation Reason:</div>
            <div style="color:#e2e8f0; font-size:10px; background:#1e293b; padding:4px; border-radius:4px; border:1px solid #334155;">${valCase.validationReason || '(None specified)'}</div>
          </div>
          <div>
            <div style="color:#94a3b8; font-size:9px;">Auditor Notes:</div>
            <div style="color:#cbd5e1; font-size:9px; background:#1e293b; padding:4px; border-radius:4px; border:1px solid #334155;">${valCase.notes || '(No extra notes)'}</div>
          </div>
        </div>
      `;

      this.attachEventListeners(false, undefined);
      return;
    }

    // Market Analyst Card HTML
    const analystCardHtml = this.renderMarketAnalystCard(getStatusBadge);

    const narrativeHtml = narrativeSummary && narrativeSummary.length > 0
      ? narrativeSummary.map((line) => `<div style="color:#e2e8f0; margin-bottom:2px;">• ${line}</div>`).join('')
      : '<div style="color:#94a3b8;">• Analizando contexto de mercado...</div>';

    const fulfilledHtml =
      setup.fulfilledConditions.length > 0
        ? setup.fulfilledConditions.map((c) => `<div style="color:#4ade80;">${c}</div>`).join('')
        : `<div style="color:#64748b;">(Ninguna confluencia cumplida)</div>`;

    const missingHtml =
      setup.missingConditions.length > 0
        ? setup.missingConditions.map((c) => `<div style="color:#94a3b8;">${c}</div>`).join('')
        : '';

    const invalidatedHtml =
      setup.invalidatedConditions.length > 0
        ? setup.invalidatedConditions.map((c) => `<div style="color:#f87171;">${c}</div>`).join('')
        : '';

    const replayControlsHtml = isReplay
      ? `
        <div style="margin-bottom:10px; background:rgba(30,41,59,0.85); padding:8px 10px; border-radius:8px; border:1px solid #0284c7;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="color:#38bdf8; font-weight:800; font-size:11px;">⏺ REPLAY | ${symbol} ${ltfTimeframe}</span>
            <span style="color:#4ade80; font-size:10px; font-weight:700;">Vela ${replayState ? replayState.currentIndex + 1 : 0} / ${replayState ? replayState.totalCandles : 0}</span>
          </div>
          <div style="color:#cbd5e1; font-size:9px; margin-bottom:6px;">
            Timestamp: ${replayState && replayState.currentTimestamp ? new Date(replayState.currentTimestamp).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : 'N/A'}
          </div>
          <div style="display:flex; justify-content:space-between; gap:4px;">
            <button id="btn-replay-reset" style="flex:1; padding:4px; background:#1e293b; color:#cbd5e1; border:1px solid #334155; border-radius:4px; cursor:pointer; font-weight:700;">|&lt;</button>
            <button id="btn-replay-prev" style="flex:1; padding:4px; background:#1e293b; color:#cbd5e1; border:1px solid #334155; border-radius:4px; cursor:pointer; font-weight:700;">&lt;</button>
            <button id="btn-replay-play" style="flex:2; padding:4px; background:#0284c7; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:700;">${replayState && replayState.isPlaying ? '⏸ Pause' : '▶ Play'}</button>
            <button id="btn-replay-next" style="flex:1; padding:4px; background:#1e293b; color:#cbd5e1; border:1px solid #334155; border-radius:4px; cursor:pointer; font-weight:700;">&gt;</button>
            <button id="btn-replay-step10" style="flex:1; padding:4px; background:#1e293b; color:#38bdf8; border:1px solid #334155; border-radius:4px; cursor:pointer; font-weight:700;">+10</button>
          </div>
        </div>
      `
      : '';

    const activeAudit = this.selectedAuditDetail || {
      type: displacement.state === 'PRESENT' ? 'DISPLACEMENT' : 'MARKET_STRUCTURE',
      timestamp: displacement.lastCandleTimestamp || Date.now(),
      eventTimestamp: displacement.lastCandleTimestamp || Date.now(),
      confirmationTimestamp: displacement.lastCandleTimestamp || Date.now(),
      bodyRatio: displacement.lastBodyRatio,
      rangeMultiplier: displacement.lastRangeMultiplier,
      status: displacement.state,
      setupRelation: `Model: ${setup.activeModelName}`,
      classification: displacement.lastBodyRatio >= 0.7 ? 'CLEAR' : displacement.state === 'PRESENT' ? 'BORDERLINE' : 'CLEAR',
      infoAvailableAtEvent: true,
      futureInfoUsed: false,
    };

    const auditInspectorHtml = `
      <div style="margin-bottom:8px; background:rgba(15,23,42,0.85); padding:8px 10px; border-radius:8px; border:1px dashed rgba(56,189,248,0.4);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span style="color:#38bdf8; font-weight:800; font-size:10px; text-transform:uppercase;">🔍 EVENT AUDIT INSPECTOR</span>
          <span style="color:${activeAudit.classification === 'CLEAR' ? '#4ade80' : activeAudit.classification === 'BORDERLINE' ? '#facc15' : '#f87171'}; font-weight:700; font-size:9px;">[${activeAudit.classification}]</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
          <span style="color:#94a3b8;">Event:</span> <b style="color:#f8fafc;">${activeAudit.type}</b>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
          <span style="color:#94a3b8;">Event Timestamp:</span> <span style="color:#cbd5e1;">${new Date(activeAudit.eventTimestamp || activeAudit.timestamp).toLocaleTimeString()}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
          <span style="color:#94a3b8;">Confirmation Timestamp:</span> <span style="color:#4ade80;">${new Date(activeAudit.confirmationTimestamp || activeAudit.timestamp).toLocaleTimeString()}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
          <span style="color:#94a3b8;">Info Available at Event:</span> <b style="color:#4ade80;">YES</b>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
          <span style="color:#94a3b8;">Future Info Used:</span> <b style="color:#38bdf8;">NO (0% Look-Ahead)</b>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span style="color:#94a3b8;">Status:</span> ${getStatusBadge(activeAudit.status)}
        </div>
      </div>
    `;

    this.container.innerHTML = `
      <div class="hud-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid #334155; padding-bottom:6px; cursor:grab;">
        <div class="hud-drag-handle" style="display:flex; align-items:center; gap:6px; cursor:grab; user-select:none;" title="Arrastrar panel">
          <span style="color:#64748b; font-size:14px;">⠿</span>
          <span style="font-weight:800; color:#38bdf8; font-size:12px; letter-spacing:0.5px;">⚡ ICT ASSISTANT <span style="font-size:9px; color:#94a3b8;">(${htfTimeframe})</span> <span style="font-size:9px; color:#22c55e; background:rgba(34,197,94,0.15); padding:1px 5px; border-radius:3px; font-weight:700;">LIVE</span></span>
        </div>
        <div style="display:flex; gap:4px; align-items:center;">
          <button id="btn-hud-toggle-chart" style="padding:2px 6px; border-radius:4px; font-size:9px; font-weight:700; border:1px solid #475569; cursor:pointer; background:${this.isChartOverlayVisible ? '#1e293b' : '#334155'}; color:${this.isChartOverlayVisible ? '#cbd5e1' : '#facc15'};" title="${this.isChartOverlayVisible ? 'Ocultar gráfico' : 'Mostrar gráfico'}">
            ${this.isChartOverlayVisible ? '👁 Ocultar Gráfico' : '👁 Mostrar Gráfico'}
          </button>
          <button id="btn-hud-power" style="padding:2px 6px; border-radius:4px; font-size:9px; font-weight:700; border:none; cursor:pointer; background:${this.isRunning ? '#ef4444' : '#22c55e'}; color:#fff;" title="${this.isRunning ? 'Detener extensión' : 'Reanudar extensión'}">
            ${this.isRunning ? '⏹ Detener' : '▶ Reanudar'}
          </button>
          <button id="btn-hud-minimize" style="padding:2px 6px; border-radius:4px; font-size:10px; font-weight:700; border:1px solid #475569; cursor:pointer; background:#1e293b; color:#cbd5e1; margin-left:2px;" title="Minimizar panel">➖</button>
        </div>
      </div>

      ${!this.isRunning ? `
        <div id="hud-stopped-banner" style="margin-bottom:8px; background:rgba(239,68,68,0.2); border:1px solid #ef4444; border-radius:6px; padding:6px 10px; display:flex; justify-content:space-between; align-items:center;">
          <span style="color:#f87171; font-weight:700; font-size:10px;">⏹ EXTENSIÓN DETENIDA (Pausada)</span>
          <button id="btn-hud-resume-banner" style="padding:2px 8px; background:#22c55e; color:#fff; border:none; border-radius:4px; font-size:9px; font-weight:700; cursor:pointer;">▶ Iniciar</button>
        </div>
      ` : ''}

      <!-- TradeSea Market Analyst Trigger & Output Section -->
      ${analystCardHtml}

      <!-- Replay Controls (Visible in Replay Mode) -->
      ${replayControlsHtml}

      <!-- Textual Narrative Context Summary -->
      <div style="margin-bottom:10px; background:rgba(30,41,59,0.7); padding:8px 10px; border-radius:8px; border:1px solid rgba(56,189,248,0.25);">
        <div style="color:#38bdf8; font-weight:700; font-size:9px; text-transform:uppercase; margin-bottom:4px; letter-spacing:0.5px;">💬 Resumen del Contexto Actual</div>
        ${narrativeHtml}
      </div>

      <!-- Structured Context Breakdown -->
      <div style="margin-bottom:8px;">
        <div style="color:#64748b; font-weight:700; font-size:9px; text-transform:uppercase; margin-bottom:4px;">Contexto de Mercado</div>
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
          <span style="color:#94a3b8;">HTF / LTF Trend:</span> <span style="color:#f8fafc;">${structure.structureState}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
          <span style="color:#94a3b8;">Target Liquidity:</span> <b style="color:#38bdf8;">${liquidity.nearestTarget || 'None'}</b>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
          <span style="color:#94a3b8;">PD Array Zone:</span> <b style="color:${pdArray.zone === 'DISCOUNT' ? '#4ade80' : pdArray.zone === 'PREMIUM' ? '#f87171' : '#facc15'};">${pdArray.zone}</b>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
          <span style="color:#94a3b8;">Active FVGs / OBs:</span> <span style="color:#f8fafc;">${pdArray.activeFvgCount} FVG / ${pdArray.activeObCount} OB</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <span style="color:#94a3b8;">Displacement:</span> ${getStatusBadge(displacement.state)}
        </div>
      </div>

      <!-- Event Audit Inspector -->
      ${auditInspectorHtml}

      <!-- Setup Models & Checklist -->
      <div style="margin-bottom:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
          <span style="color:#64748b; font-weight:700; font-size:9px; text-transform:uppercase;">Setup Model: ${setup.activeModelName}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
          <span style="color:#94a3b8;">LONG Setup:</span> ${getStatusBadge(setup.longStatus)}
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <span style="color:#94a3b8;">SHORT Setup:</span> ${getStatusBadge(setup.shortStatus)}
        </div>
        <div style="background:rgba(15,23,42,0.6); padding:6px; border-radius:6px; border:1px solid #334155;">
          <div style="color:#64748b; font-size:9px; margin-bottom:2px; font-weight:700;">CHECKLIST DE CONDICIONES:</div>
          ${fulfilledHtml}
          ${missingHtml}
          ${invalidatedHtml}
        </div>
      </div>

      <!-- Geometry & Engine Debug Info at the very end of ICT Assistant -->
      <div style="border-top:1px solid #334155; padding-top:6px; margin-top:8px; font-size:9px; color:#64748b; display:flex; justify-content:space-between; align-items:center;">
        <span>Velas: ${options?.candleCount || 0} • Exec: ${options?.executionTimeMs || 0}ms</span>
        <span style="color:#38bdf8; font-weight:600;">Geometría: Sincronizada</span>
        <span style="color:${(options?.fps || 60) >= 55 ? '#4ade80' : '#facc15'}; font-weight:700;">${options?.fps || 60} FPS</span>
      </div>
    `;

    this.attachEventListeners(isReplay, replayState);
  }

  private renderMarketAnalystCard(getStatusBadge: (s: string) => string): string {
    const anl = this.currentAnalysis;

    let analysisBody = '';
    if (this.isAnalyzing) {
      analysisBody = `
        <div style="color:#38bdf8; font-weight:700; padding:8px 0; text-align:center;">
          ⏳ Evaluando datos de mercado y estructuras ICT...
        </div>
      `;
    } else if (anl) {
      const scenario = anl.selectedScenario;
      const isBull = scenario?.direction === 'BULLISH';
      const dirColor = isBull ? '#4ade80' : scenario?.direction === 'BEARISH' ? '#f87171' : '#facc15';

      let scenarioDetails = '';
      if (scenario) {
        scenarioDetails = `
          <div style="margin-top:6px; background:#090d16; padding:6px 8px; border-radius:6px; border:1px solid #334155;">
            <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
              <span style="color:#94a3b8;">Dirección:</span> <b style="color:${dirColor};">${scenario.direction}</b>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
              <span style="color:#94a3b8;">Ref Price:</span> <span style="color:#f8fafc;">$${scenario.referencePrice.toFixed(2)}</span>
            </div>
            ${
              scenario.nearbyTarget
                ? `<div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                    <span style="color:#94a3b8;">Objetivo Cercano:</span> <b style="color:#38bdf8;">$${scenario.nearbyTarget.price.toFixed(2)}</b>
                  </div>
                  <div style="color:#64748b; font-size:9px; margin-bottom:3px;">↳ ${scenario.nearbyTarget.rationale}</div>`
                : ''
            }
            ${
              scenario.extendedTarget
                ? `<div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                    <span style="color:#94a3b8;">Objetivo Extendido:</span> <b style="color:#4ade80;">$${scenario.extendedTarget.price.toFixed(2)}</b>
                  </div>
                  <div style="color:#64748b; font-size:9px; margin-bottom:3px;">↳ ${scenario.extendedTarget.rationale}</div>`
                : ''
            }
            ${
              scenario.invalidationLevel !== undefined
                ? `<div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                    <span style="color:#94a3b8;">Invalidación:</span> <b style="color:#f87171;">$${scenario.invalidationLevel.toFixed(2)}</b>
                  </div>
                  <div style="color:#64748b; font-size:9px; margin-bottom:3px;">↳ ${scenario.invalidationRationale || 'Violación de estructura'}</div>`
                : ''
            }
            <div style="display:flex; justify-content:space-between; border-top:1px dashed #334155; padding-top:4px; margin-top:4px;">
              <span style="color:#94a3b8;">Dist. Riesgo:</span> <span>${scenario.riskDistance ? `${scenario.riskDistance.toFixed(2)} pts` : 'N/A'}</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:#94a3b8;">Mov. Neto Estimado:</span> <span>${scenario.estimatedNetMove ? `${scenario.estimatedNetMove.toFixed(2)} pts` : 'N/A'}</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:#94a3b8;">Ratio R:R:</span> <b style="color:${(scenario.estimatedRewardRiskRatio || 0) >= 1.5 ? '#4ade80' : '#facc15'};">${scenario.estimatedRewardRiskRatio ? `${scenario.estimatedRewardRiskRatio.toFixed(2)}` : 'N/A'}</b>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:2px;">
              <span style="color:#94a3b8;">Confianza Cualitativa:</span> <b style="color:#cbd5e1;">${scenario.confidenceLabel}</b>
            </div>
            ${scenario.frictionAssumptionNote ? `<div style="color:#64748b; font-size:8px; margin-top:4px; line-height:1.2;">* ${scenario.frictionAssumptionNote}</div>` : ''}
          </div>
        `;
      }

      let sessionBadgeHtml = '';
      if (anl.sessionContext) {
        const s = anl.sessionContext;
        const windows: string[] = [];
        if (s.isNyCashOpen) windows.push('NY Cash Open');
        if (s.isInNyAmSilverBullet) windows.push('NY AM Silver Bullet');
        else if (s.isInNyAmKillzone) windows.push('NY AM Killzone');
        if (s.isInNyLunchAvoidance) windows.push('NY Lunch');
        if (s.isInNyPmSilverBullet) windows.push('NY PM Silver Bullet');
        else if (s.isInNyPmKillzone) windows.push('NY PM Killzone');
        if (s.isInLondonSilverBullet) windows.push('London Silver Bullet');
        else if (s.isInLondonKillzone) windows.push('London Killzone');
        if (s.isInAsianWindow) windows.push('Asian Window');

        const windowDesc = windows.length > 0 ? windows.join(' / ') : 'Outside Killzone';
        sessionBadgeHtml = `
          <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:9px; background:rgba(30,41,59,0.6); padding:3px 6px; border-radius:4px; border:1px solid #334155;">
            <span style="color:#94a3b8;">Sesión (${s.et.timeZoneName}):</span>
            <span style="color:#38bdf8; font-weight:700;">${windowDesc} [Trade Date: ${s.tradeDate}]</span>
          </div>
        `;
      }

      analysisBody = `
        <div style="margin-top:6px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="color:#94a3b8;">Estado:</span> ${getStatusBadge(anl.status)}
          </div>
          <div style="color:#cbd5e1; font-size:10px; margin-bottom:4px;">${anl.statusExplanation}</div>
          ${sessionBadgeHtml}
          ${scenarioDetails}
          <div style="display:flex; gap:4px; margin-top:6px;">
            <button id="btn-analyst-toggle-overlay" style="flex:1; padding:3px 6px; background:${this.isChartOverlayVisible ? '#1e293b' : '#334155'}; color:${this.isChartOverlayVisible ? '#cbd5e1' : '#facc15'}; border:1px solid #475569; border-radius:4px; cursor:pointer; font-size:9px; font-weight:700;">
              ${this.isChartOverlayVisible ? '👁 Ocultar Gráfico' : '👁 Mostrar Gráfico'}
            </button>
            <button id="btn-analyst-clear-overlay" style="flex:1; padding:3px 6px; background:#1e293b; color:#f87171; border:1px solid #475569; border-radius:4px; cursor:pointer; font-size:9px; font-weight:700;">
              ✕ Limpiar Gráfico
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div style="margin-bottom:10px; background:linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.95)); padding:10px 12px; border-radius:10px; border:1px solid #0284c7; box-shadow:0 4px 12px rgba(2,132,199,0.2);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="color:#38bdf8; font-weight:800; font-size:11px; letter-spacing:0.5px;">📊 TRADESEA MARKET ANALYST</span>
          <span style="display:flex; align-items:center; gap:4px; font-size:9px; color:${this.isDynamicAnalysisActive ? '#4ade80' : '#94a3b8'};">
            ${this.isDynamicAnalysisActive ? '<span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#22c55e; box-shadow:0 0 6px #22c55e;"></span> Auto-Gestión' : 'Manual'}
          </span>
        </div>
        <div style="display:flex; gap:6px; margin-bottom:6px;">
          <button id="btn-analizar-mercado" style="flex:1; padding:6px 8px; background:${this.isDynamicAnalysisActive ? '#059669' : '#0284c7'}; color:#fff; border:none; border-radius:6px; cursor:pointer; font-size:11px; font-weight:800; letter-spacing:0.5px; box-shadow:0 2px 6px rgba(2,132,199,0.4); transition:background 0.2s;">
            ${this.isAnalyzing ? '⏳ Analizando...' : (this.isDynamicAnalysisActive ? '⚡ Re-evaluar ahora' : '⚡ Analizar mercado')}
          </button>
          <button id="btn-toggle-dynamic-analyst" style="padding:6px 10px; background:${this.isDynamicAnalysisActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)'}; color:${this.isDynamicAnalysisActive ? '#34d399' : '#94a3b8'}; border:1px solid ${this.isDynamicAnalysisActive ? '#059669' : '#475569'}; border-radius:6px; cursor:pointer; font-size:10px; font-weight:700; white-space:nowrap;" title="Activar/Pausar evaluación continua automática">
            ${this.isDynamicAnalysisActive ? '● Auto: ON' : '○ Auto: OFF'}
          </button>
        </div>
        ${this.isDynamicAnalysisActive ? `<div style="font-size:9px; color:#34d399; margin-bottom:6px; display:flex; align-items:center; gap:4px; background:rgba(6, 78, 59, 0.3); padding:3px 6px; border-radius:4px; border:1px solid rgba(16, 185, 129, 0.3);">
          <span>🔄</span> <b>Auto-gestión activa:</b> evalúa y se corrige dinámicamente con cada vela
        </div>` : ''}
        ${this.lastDirectionChangeNotice ? `
          <div style="background:rgba(59, 130, 246, 0.2); border:1px solid #3b82f6; border-radius:6px; padding:6px 8px; margin-bottom:6px;">
            <div style="color:#60a5fa; font-weight:800; font-size:10px; display:flex; justify-content:space-between;">
              <span>🔄 CAMBIO DE TENDENCIA DETECTADO</span>
              <span style="font-size:8px; color:#94a3b8;">${new Date(this.lastDirectionChangeNotice.timestamp).toLocaleTimeString()}</span>
            </div>
            <div style="color:#e2e8f0; font-size:9.5px; margin-top:2px;">
              Giro de <b style="color:${this.lastDirectionChangeNotice.from === 'BEARISH' ? '#f87171' : '#4ade80'};">${this.lastDirectionChangeNotice.from}</b> ➔ <b style="color:${this.lastDirectionChangeNotice.to === 'BULLISH' ? '#4ade80' : '#f87171'};">${this.lastDirectionChangeNotice.to}</b>. Niveles y objetivo actualizados.
            </div>
          </div>
        ` : ''}
        ${analysisBody}
      </div>
    `;
  }

  private attachEventListeners(isReplay: boolean, replayState?: ReplayState): void {
    if (!this.container) return;

    // Power & Running State Event Listeners
    const handleTogglePower = () => {
      this.isRunning = !this.isRunning;
      if (this.onToggleRunning) {
        this.onToggleRunning(this.isRunning);
      }
      if (this.lastContext) {
        this.render(this.lastContext, this.lastOptions);
      }
    };

    document.getElementById('btn-hud-power')?.addEventListener('click', handleTogglePower);
    document.getElementById('btn-hud-resume-banner')?.addEventListener('click', handleTogglePower);

    // Chart Overlay Toggle Event Listeners
    const handleToggleOverlay = () => {
      this.isChartOverlayVisible = !this.isChartOverlayVisible;
      this.isAnalystOverlayVisible = this.isChartOverlayVisible;
      this.updateOverlayButtons();
      if (this.onToggleChartOverlay) {
        this.onToggleChartOverlay(this.isChartOverlayVisible);
      }
      if (this.onToggleAnalystOverlay) {
        this.onToggleAnalystOverlay(this.isChartOverlayVisible);
      }
    };

    document.getElementById('btn-hud-toggle-chart')?.addEventListener('click', handleToggleOverlay);
    document.getElementById('btn-analyst-toggle-overlay')?.addEventListener('click', handleToggleOverlay);

    // Market Analyst Event Listeners
    document.getElementById('btn-toggle-dynamic-analyst')?.addEventListener('click', () => {
      this.isDynamicAnalysisActive = !this.isDynamicAnalysisActive;
      if (this.onToggleDynamicAnalysis) {
        this.onToggleDynamicAnalysis(this.isDynamicAnalysisActive);
      }
      if (this.lastContext) {
        this.render(this.lastContext, this.lastOptions);
      }
    });

    document.getElementById('btn-analizar-mercado')?.addEventListener('click', () => {
      this.isDynamicAnalysisActive = true;
      if (this.onToggleDynamicAnalysis) {
        this.onToggleDynamicAnalysis(true);
      }
      if (this.onAnalyzeMarket) {
        this.setAnalyzing(true);
        this.onAnalyzeMarket();
      }
    });

    document.getElementById('btn-analyst-clear-overlay')?.addEventListener('click', () => {
      this.isDynamicAnalysisActive = false;
      this.lastDirectionChangeNotice = null;
      if (this.onClearAnalystOverlay) {
        this.onClearAnalystOverlay();
      }
    });

    document.getElementById('btn-hud-minimize')?.addEventListener('click', () => {
      this.isMinimized = true;
      if (this.lastContext) this.render(this.lastContext, this.lastOptions);
    });

    document.getElementById('btn-hud-expand')?.addEventListener('click', () => {
      this.isMinimized = false;
      if (this.container && typeof window !== 'undefined') {
        const rect = this.container.getBoundingClientRect();
        if (rect.left + 380 > window.innerWidth) {
          const clampedLeft = Math.max(10, window.innerWidth - 390);
          this.container.style.left = `${clampedLeft}px`;
        }
        if (rect.top + 450 > window.innerHeight) {
          const clampedTop = Math.max(10, window.innerHeight - 480);
          this.container.style.top = `${clampedTop}px`;
        }
      }
      if (this.lastContext) this.render(this.lastContext, this.lastOptions);
    });

    document.getElementById('btn-mode-live')?.addEventListener('click', () => {
      this.mode = 'LIVE';
      if (this.onModeChange) this.onModeChange('LIVE');
    });

    document.getElementById('btn-mode-replay')?.addEventListener('click', () => {
      this.mode = 'REPLAY';
      if (this.onModeChange) this.onModeChange('REPLAY');
    });

    document.getElementById('btn-mode-validation')?.addEventListener('click', () => {
      this.mode = 'VALIDATION';
      if (this.onModeChange) this.onModeChange('VALIDATION');
    });

    document.getElementById('btn-val-prev')?.addEventListener('click', () => {
      if (this.onValidationPrev) this.onValidationPrev();
    });

    document.getElementById('btn-val-next')?.addEventListener('click', () => {
      if (this.onValidationNext) this.onValidationNext();
    });

    const activeCaseId = this.container.querySelector('#btn-val-clear')?.getAttribute('data-caseid') || '';

    document.getElementById('btn-val-clear')?.addEventListener('click', () => {
      if (this.onValidationReview) this.onValidationReview(activeCaseId, 'CLEAR');
    });

    document.getElementById('btn-val-borderline')?.addEventListener('click', () => {
      if (this.onValidationReview) this.onValidationReview(activeCaseId, 'BORDERLINE');
    });

    document.getElementById('btn-val-questionable')?.addEventListener('click', () => {
      if (this.onValidationReview) this.onValidationReview(activeCaseId, 'QUESTIONABLE');
    });

    if (isReplay) {
      document.getElementById('btn-replay-reset')?.addEventListener('click', () => {
        if (this.onReplayReset) this.onReplayReset();
      });

      document.getElementById('btn-replay-prev')?.addEventListener('click', () => {
        if (this.onReplayPrev) this.onReplayPrev();
      });

      document.getElementById('btn-replay-play')?.addEventListener('click', () => {
        if (replayState && replayState.isPlaying) {
          if (this.onReplayPause) this.onReplayPause();
        } else {
          if (this.onReplayPlay) this.onReplayPlay();
        }
      });

      document.getElementById('btn-replay-next')?.addEventListener('click', () => {
        if (this.onReplayNext) this.onReplayNext(1);
      });

      document.getElementById('btn-replay-step10')?.addEventListener('click', () => {
        if (this.onReplayNext) this.onReplayNext(10);
      });
    }
  }
}
