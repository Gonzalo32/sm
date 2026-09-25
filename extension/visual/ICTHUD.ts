/**
 * Extension Visual Layer - ICT Floating Heads-Up Display (HUD) & Event Audit Inspector
 * Renders ICTMarketContext data model and interactive Event Audit details onto TradeSea chart UI.
 * Strictly presents engine context state with zero trading signals.
 */

import { ICTMarketContext } from '../../core/ict/context/MarketContextEngine';

export interface EventAuditDetail {
  type: string;
  timestamp: number;
  ohlc?: { open: number; high: number; low: number; close: number };
  bodyRatio?: number;
  rangeMultiplier?: number;
  thresholds?: string;
  status: string;
  setupRelation?: string;
  classification?: 'CLEAR' | 'BORDERLINE' | 'QUESTIONABLE';
}

export class ICTHUD {
  private container: HTMLDivElement | null = null;
  private isVisible: boolean = true;
  private selectedAuditDetail: EventAuditDetail | null = null;

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
      width: 330px;
      background: rgba(15, 23, 42, 0.94);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(56, 189, 248, 0.35);
      border-radius: 12px;
      padding: 14px 16px;
      color: #f8fafc;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      line-height: 1.4;
      z-index: 999999;
      box-shadow: 0 16px 36px -6px rgba(0, 0, 0, 0.65);
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

  public selectEventAudit(detail: EventAuditDetail | null): void {
    this.selectedAuditDetail = detail;
  }

  public render(
    context: ICTMarketContext,
    metrics?: { fps?: number; candleCount?: number; executionTimeMs?: number }
  ): void {
    if (!this.container || !this.isVisible) return;

    const { symbol, ltfTimeframe, htfTimeframe, structure, liquidity, pdArray, displacement, setup } = context;

    const getStatusBadge = (status: string) => {
      switch (status) {
        case 'CONFIRMED':
        case 'PRESENT':
          return `<span style="color:#4ade80; background:rgba(34,197,94,0.15); padding:1px 6px; border-radius:4px; font-weight:700;">CONFIRMED</span>`;
        case 'FORMING':
          return `<span style="color:#facc15; background:rgba(234,179,8,0.15); padding:1px 6px; border-radius:4px; font-weight:700;">FORMING</span>`;
        case 'INVALIDATED':
        case 'EXPIRED':
          return `<span style="color:#f87171; background:rgba(239,68,68,0.15); padding:1px 6px; border-radius:4px; font-weight:700;">${status}</span>`;
        case 'WATCHING':
        case 'ABSENT':
        default:
          return `<span style="color:#94a3b8; background:rgba(148,163,184,0.15); padding:1px 6px; border-radius:4px; font-weight:600;">${status}</span>`;
      }
    };

    const formatTrend = (trend: string) => {
      if (trend === 'BULLISH') return `<span style="color:#4ade80; font-weight:700;">▲ Bullish</span>`;
      if (trend === 'BEARISH') return `<span style="color:#f87171; font-weight:700;">▼ Bearish</span>`;
      return `<span style="color:#94a3b8; font-weight:600;">► Sideways</span>`;
    };

    const fulfilledHtml =
      setup.fulfilledConditions.length > 0
        ? setup.fulfilledConditions.map((c) => `<div style="color:#4ade80;">${c}</div>`).join('')
        : `<div style="color:#64748b;">(None)</div>`;

    const missingHtml =
      setup.missingConditions.length > 0
        ? setup.missingConditions.map((c) => `<div style="color:#94a3b8;">${c}</div>`).join('')
        : '';

    const invalidatedHtml =
      setup.invalidatedConditions.length > 0
        ? setup.invalidatedConditions.map((c) => `<div style="color:#f87171;">${c}</div>`).join('')
        : '';

    // Active Event Audit Details Panel
    const activeAudit = this.selectedAuditDetail || {
      type: displacement.state === 'PRESENT' ? 'DISPLACEMENT' : 'MARKET_STRUCTURE',
      timestamp: displacement.lastCandleTimestamp || Date.now(),
      bodyRatio: displacement.lastBodyRatio,
      rangeMultiplier: displacement.lastRangeMultiplier,
      thresholds: 'Body >= 0.60, Range >= 1.50',
      status: displacement.state,
      setupRelation: `Active Model: ${setup.activeModelName}`,
      classification: displacement.lastBodyRatio >= 0.7 ? 'CLEAR' : displacement.state === 'PRESENT' ? 'BORDERLINE' : 'CLEAR',
    };

    const auditInspectorHtml = `
      <div style="margin-bottom:8px; background:rgba(15,23,42,0.85); padding:8px 10px; border-radius:8px; border:1px dashed rgba(56,189,248,0.4);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span style="color:#38bdf8; font-weight:800; font-size:10px; text-transform:uppercase;">🔍 EVENT AUDIT INSPECTOR</span>
          <span style="color:${activeAudit.classification === 'CLEAR' ? '#4ade80' : activeAudit.classification === 'BORDERLINE' ? '#facc15' : '#f87171'}; font-weight:700; font-size:9px;">[${activeAudit.classification}]</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
          <span style="color:#94a3b8;">Type:</span> <b style="color:#f8fafc;">${activeAudit.type}</b>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
          <span style="color:#94a3b8;">Timestamp:</span> <span style="color:#cbd5e1;">${new Date(activeAudit.timestamp).toLocaleTimeString()}</span>
        </div>
        ${
          activeAudit.ohlc
            ? `<div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                <span style="color:#94a3b8;">OHLC:</span> <span style="color:#38bdf8; font-size:9px;">O:${activeAudit.ohlc.open} H:${activeAudit.ohlc.high} L:${activeAudit.ohlc.low} C:${activeAudit.ohlc.close}</span>
              </div>`
            : ''
        }
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
          <span style="color:#94a3b8;">Body Ratio:</span> <span style="color:#f8fafc;">${activeAudit.bodyRatio ? (activeAudit.bodyRatio * 100).toFixed(1) + '%' : 'N/A'} <span style="color:#64748b;">(≥60%)</span></span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
          <span style="color:#94a3b8;">Range Mult:</span> <span style="color:#f8fafc;">${activeAudit.rangeMultiplier ? activeAudit.rangeMultiplier.toFixed(2) + 'x' : 'N/A'} <span style="color:#64748b;">(≥1.5x)</span></span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
          <span style="color:#94a3b8;">Status:</span> ${getStatusBadge(activeAudit.status)}
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span style="color:#94a3b8;">Setup Rel:</span> <span style="color:#cbd5e1; font-size:9px;">${activeAudit.setupRelation}</span>
        </div>
      </div>
    `;

    this.container.innerHTML = `
      <!-- Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #334155; padding-bottom:6px;">
        <span style="font-weight:800; color:#38bdf8; font-size:13px; letter-spacing:0.5px;">⚡ ICT MARKET CONTEXT</span>
        <span style="color:#cbd5e1; font-weight:700; font-size:11px;">${symbol} <span style="color:#38bdf8;">${ltfTimeframe}</span> <span style="color:#64748b; font-size:9px;">(${htfTimeframe})</span></span>
      </div>

      <!-- Structure -->
      <div style="margin-bottom:8px;">
        <div style="color:#64748b; font-weight:700; font-size:9px; text-transform:uppercase; margin-bottom:2px;">Structure</div>
        <div style="display:flex; justify-content:space-between;">
          <span style="color:#94a3b8;">Trend:</span> <span>${formatTrend(structure.trend)}</span>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span style="color:#94a3b8;">Last BOS:</span> <span style="color:#f8fafc;">${structure.lastBOS}</span>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span style="color:#94a3b8;">Last MSS:</span> <span style="color:#f8fafc;">${structure.lastMSS}</span>
        </div>
      </div>

      <!-- Liquidity -->
      <div style="margin-bottom:8px;">
        <div style="color:#64748b; font-weight:700; font-size:9px; text-transform:uppercase; margin-bottom:2px;">Liquidity</div>
        <div style="display:flex; justify-content:space-between;">
          <span style="color:#94a3b8;">BSL / SSL Active:</span> <span style="color:#f8fafc;">${liquidity.bslCount} BSL / ${liquidity.sslCount} SSL</span>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span style="color:#94a3b8;">Last Sweep:</span> <span style="color:#facc15;">${liquidity.lastSweep}</span>
        </div>
      </div>

      <!-- PD Array -->
      <div style="margin-bottom:8px;">
        <div style="color:#64748b; font-weight:700; font-size:9px; text-transform:uppercase; margin-bottom:2px;">PD Array</div>
        <div style="display:flex; justify-content:space-between;">
          <span style="color:#94a3b8;">Zone:</span> <b style="color:${pdArray.zone === 'DISCOUNT' ? '#4ade80' : pdArray.zone === 'PREMIUM' ? '#f87171' : '#facc15'};">${pdArray.zone}</b>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span style="color:#94a3b8;">Active FVGs / OBs:</span> <span style="color:#f8fafc;">${pdArray.activeFvgCount} FVG / ${pdArray.activeObCount} OB</span>
        </div>
      </div>

      <!-- Event Audit Inspector -->
      ${auditInspectorHtml}

      <!-- Setup Model Checklist -->
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
          <div style="color:#64748b; font-size:9px; margin-bottom:2px; font-weight:700;">CONDITIONS CHECKLIST:</div>
          ${fulfilledHtml}
          ${missingHtml}
          ${invalidatedHtml}
        </div>
      </div>

      <!-- Target -->
      <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
        <span style="color:#94a3b8;">Target Liquidity:</span> <b style="color:#38bdf8;">${setup.target}</b>
      </div>

      <!-- Engine Performance Debug Info -->
      ${
        metrics
          ? `<div style="border-top:1px solid #334155; pt:4px; margin-top:6px; font-size:9px; color:#64748b; display:flex; justify-content:space-between;">
              <span>Candles: ${metrics.candleCount || 0}</span>
              <span>Exec: ${metrics.executionTimeMs || 0}ms</span>
              <span>FPS: ${metrics.fps || 60}</span>
            </div>`
          : ''
      }
    `;
  }
}
