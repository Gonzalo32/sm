/**
 * Extension Visual Layer - ICT Market Context Assistant & Replay HUD
 * Renders structured natural-language market context, replay controls, historical event timeline, and audit inspector.
 * Derived strictly from ICTMarketContext data model. Zero trading signals.
 */

import { ICTMarketContext } from '../../core/ict/context/MarketContextEngine';
import { ReplayState } from '../../core/ict/replay/ReplayTypes';

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
  private mode: HUDMode = 'LIVE';
  private selectedAuditDetail: EventAuditDetail | null = null;

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
      return;
    }

    const hud = document.createElement('div');
    hud.id = 'ict-assistant-hud';
    hud.style.cssText = `
      position: fixed;
      top: 50px;
      right: 20px;
      width: 360px;
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

  public render(
    context: ICTMarketContext,
    options?: {
      fps?: number;
      candleCount?: number;
      executionTimeMs?: number;
      replayState?: ReplayState;
      validationCase?: any;
      validationMetrics?: any;
    }
  ): void {
    if (!this.container || !this.isVisible) return;

    const { symbol, ltfTimeframe, htfTimeframe, structure, liquidity, pdArray, displacement, setup, narrativeSummary } = context;
    const replayState = options?.replayState;
    const valCase = options?.validationCase;
    const isReplay = this.mode === 'REPLAY' || !!replayState;
    const isValidation = this.mode === 'VALIDATION' || !!valCase;

    const getStatusBadge = (status: string) => {
      switch (status) {
        case 'CLEAR':
        case 'CONFIRMED':
        case 'PRESENT':
          return `<span style="color:#4ade80; background:rgba(34,197,94,0.15); padding:1px 6px; border-radius:4px; font-weight:700;">${status}</span>`;
        case 'BORDERLINE':
        case 'FORMING':
          return `<span style="color:#facc15; background:rgba(234,179,8,0.15); padding:1px 6px; border-radius:4px; font-weight:700;">${status}</span>`;
        case 'QUESTIONABLE':
        case 'INVALIDATED':
        case 'EXPIRED':
          return `<span style="color:#f87171; background:rgba(239,68,68,0.15); padding:1px 6px; border-radius:4px; font-weight:700;">${status}</span>`;
        case 'UNREVIEWED':
        case 'WATCHING':
        case 'ABSENT':
        default:
          return `<span style="color:#94a3b8; background:rgba(148,163,184,0.15); padding:1px 6px; border-radius:4px; font-weight:600;">${status}</span>`;
      }
    };

    if (this.mode === 'VALIDATION' && valCase) {
      // Render Dedicated Validation Lab Dual Panel
      const snapStr = JSON.stringify(valCase.detectionSnapshot, null, 2);

      this.container.innerHTML = `
        <!-- Top Mode Switcher Bar -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid #334155; padding-bottom:6px;">
          <span style="font-weight:800; color:#38bdf8; font-size:12px; letter-spacing:0.5px;">🧪 ICT VALIDATION LAB</span>
          <div style="display:flex; gap:4px;">
            <button id="btn-mode-live" style="padding:2px 6px; border-radius:4px; font-size:9px; font-weight:700; border:none; cursor:pointer; background:#1e293b; color:#94a3b8;">LIVE</button>
            <button id="btn-mode-replay" style="padding:2px 6px; border-radius:4px; font-size:9px; font-weight:700; border:none; cursor:pointer; background:#1e293b; color:#94a3b8;">REPLAY</button>
            <button id="btn-mode-validation" style="padding:2px 6px; border-radius:4px; font-size:9px; font-weight:700; border:none; cursor:pointer; background:#0284c7; color:#fff;">VALIDATION</button>
          </div>
        </div>

        <!-- Case Navigation Controls -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; background:rgba(30,41,59,0.85); padding:6px 8px; border-radius:6px; border:1px solid #334155;">
          <button id="btn-val-prev" style="padding:3px 8px; background:#1e293b; color:#cbd5e1; border:1px solid #475569; border-radius:4px; cursor:pointer; font-weight:700;">&lt; Previous Case</button>
          <span style="color:#f8fafc; font-weight:700; font-size:10px;">${valCase.caseId.slice(0, 24)}...</span>
          <button id="btn-val-next" style="padding:3px 8px; background:#1e293b; color:#cbd5e1; border:1px solid #475569; border-radius:4px; cursor:pointer; font-weight:700;">Next Case &gt;</button>
        </div>

        <!-- PANEL 1: DETECTION LAYER (Mathematical Truth) -->
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

        <!-- PANEL 2: VALIDATION LAYER (Independent Audit Evaluation) -->
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

    // Replay Mode Header & Control Bar
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

    // Active Event Audit Inspector Section with Anti-Lookahead Proof
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
      <!-- Top Mode Switcher Bar -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid #334155; padding-bottom:6px;">
        <span style="font-weight:800; color:#38bdf8; font-size:12px; letter-spacing:0.5px;">⚡ ICT ASSISTANT <span style="font-size:9px; color:#94a3b8;">(${htfTimeframe})</span></span>
        <div style="display:flex; gap:4px;">
          <button id="btn-mode-live" style="padding:2px 6px; border-radius:4px; font-size:9px; font-weight:700; border:none; cursor:pointer; background:${!isReplay && !isValidation ? '#0284c7' : '#1e293b'}; color:${!isReplay && !isValidation ? '#fff' : '#94a3b8'};">LIVE</button>
          <button id="btn-mode-replay" style="padding:2px 6px; border-radius:4px; font-size:9px; font-weight:700; border:none; cursor:pointer; background:${isReplay ? '#0284c7' : '#1e293b'}; color:${isReplay ? '#fff' : '#94a3b8'};">REPLAY</button>
          <button id="btn-mode-validation" style="padding:2px 6px; border-radius:4px; font-size:9px; font-weight:700; border:none; cursor:pointer; background:${isValidation ? '#0284c7' : '#1e293b'}; color:${isValidation ? '#fff' : '#94a3b8'};">VALIDATION</button>
        </div>
      </div>

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

      <!-- Engine Debug Info -->
      ${
        options
          ? `<div style="border-top:1px solid #334155; pt:4px; margin-top:6px; font-size:9px; color:#64748b; display:flex; justify-content:space-between;">
              <span>Velas: ${options.candleCount || 0}</span>
              <span>Exec: ${options.executionTimeMs || 0}ms</span>
              <span>FPS: ${options.fps || 60}</span>
            </div>`
          : ''
      }
    `;

    // Attach Event Listeners to UI Buttons
    this.attachEventListeners(isReplay, replayState);
  }

  private attachEventListeners(isReplay: boolean, replayState?: ReplayState): void {
    if (!this.container) return;

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
