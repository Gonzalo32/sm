/**
 * Extension Analyst - Market Analyst Visual Adapter
 * Adapts MarketAnalysis scenario outputs into graphical VisualObject[] primitives
 * for rendering on the TradeSea chart overlay via CanvasRenderer.
 * Strictly maintains analysisId association and supports hide/clear operations without touching journal records.
 */

import { VisualObject, VisualLine, VisualMarker, VisualRectangle } from '../visual/VisualTypes';
import { MarketAnalysis, MarketScenario } from '../../core/analyst/MarketAnalystTypes';
import { Timeframe } from '../../core/market/Candle';

export class MarketAnalystVisualAdapter {
  private activeVisuals: VisualObject[] = [];
  private currentAnalysis: MarketAnalysis | null = null;
  private isVisible: boolean = true;
  private isViewportSynchronized: boolean = true;

  constructor() {}

  public setViewportSynchronized(synced: boolean): void {
    this.isViewportSynchronized = synced;
  }

  public setVisible(visible: boolean): void {
    this.isVisible = visible;
  }

  public getVisible(): boolean {
    return this.isVisible;
  }

  public getCurrentAnalysis(): MarketAnalysis | null {
    return this.currentAnalysis;
  }

  public clear(): void {
    this.activeVisuals = [];
    this.currentAnalysis = null;
  }

  /**
   * Adapts a MarketAnalysis result into chart visual objects.
   */
  public adaptAnalysisToVisuals(analysis: MarketAnalysis, currentCandleIndex: number = 0): VisualObject[] {
    this.currentAnalysis = analysis;
    this.activeVisuals = [];

    // If fail-closed on unsynchronized viewport or no selected scenario, produce no drawings
    if (!this.isViewportSynchronized || !analysis.selectedScenario || analysis.status !== 'ANALYSIS_READY') {
      return [];
    }

    const scenario: MarketScenario = analysis.selectedScenario;
    const isBull = scenario.direction === 'BULLISH';
    const primaryColor = isBull ? '#22c55e' : '#ef4444';
    const invColor = isBull ? '#f43f5e' : '#ea580c';
    const extColor = isBull ? '#10b981' : '#b91c1c';

    const symbol = analysis.instrument;
    const timeframe: Timeframe = analysis.timeframe;
    const timestamp = analysis.latestCandleTimestampMs || analysis.evaluationTimestampMs;
    const analysisId = analysis.analysisId;

    const visuals: VisualObject[] = [];

    // 1. Reference Price Marker and Line
    const refMarker: VisualMarker = {
      id: `${analysisId}_ref_marker`,
      type: 'MARKER',
      symbol,
      timeframe,
      price: scenario.referencePrice,
      candleIndex: currentCandleIndex,
      timestamp,
      shape: isBull ? 'TRIANGLE_UP' : 'TRIANGLE_DOWN',
      color: primaryColor,
      label: `[ANL] ${scenario.direction} Ref: $${scenario.referencePrice.toFixed(2)}`,
      zIndex: 100,
      setupId: analysisId,
    };
    visuals.push(refMarker);

    const refLine: VisualLine = {
      id: `${analysisId}_ref_line`,
      type: 'LINE',
      symbol,
      timeframe,
      price: scenario.referencePrice,
      startCandleIndex: currentCandleIndex,
      startTimestamp: timestamp,
      lineStyle: 'DOTTED',
      color: '#38bdf8',
      lineWidth: 1,
      label: `REF: $${scenario.referencePrice.toFixed(2)}`,
      zIndex: 90,
      setupId: analysisId,
    };
    visuals.push(refLine);

    // 2. Nearby Target Zone / Line
    if (scenario.nearbyTarget) {
      if (scenario.nearbyTarget.zoneLow !== undefined && scenario.nearbyTarget.zoneHigh !== undefined) {
        const tgtRect: VisualRectangle = {
          id: `${analysisId}_nearby_zone`,
          type: 'RECTANGLE',
          symbol,
          timeframe,
          highPrice: scenario.nearbyTarget.zoneHigh,
          lowPrice: scenario.nearbyTarget.zoneLow,
          startCandleIndex: currentCandleIndex,
          startTimestamp: timestamp,
          color: primaryColor,
          fillColor: isBull ? 'rgba(34, 197, 94, 0.18)' : 'rgba(239, 68, 68, 0.18)',
          label: `NEARBY TGT ZONE: $${scenario.nearbyTarget.price.toFixed(2)}`,
          zIndex: 80,
          setupId: analysisId,
        };
        visuals.push(tgtRect);
      } else {
        const tgtLine: VisualLine = {
          id: `${analysisId}_nearby_line`,
          type: 'LINE',
          symbol,
          timeframe,
          price: scenario.nearbyTarget.price,
          startCandleIndex: currentCandleIndex,
          startTimestamp: timestamp,
          lineStyle: 'DASHED',
          color: primaryColor,
          lineWidth: 2,
          label: `NEARBY TGT: $${scenario.nearbyTarget.price.toFixed(2)}`,
          zIndex: 95,
          setupId: analysisId,
        };
        visuals.push(tgtLine);
      }
    }

    // 3. Extended Target Line
    if (scenario.extendedTarget) {
      const extLine: VisualLine = {
        id: `${analysisId}_extended_line`,
        type: 'LINE',
        symbol,
        timeframe,
        price: scenario.extendedTarget.price,
        startCandleIndex: currentCandleIndex,
        startTimestamp: timestamp,
        lineStyle: 'SOLID',
        color: extColor,
        lineWidth: 2,
        label: `EXT TGT: $${scenario.extendedTarget.price.toFixed(2)}`,
        zIndex: 94,
        setupId: analysisId,
      };
      visuals.push(extLine);
    }

    // 4. Invalidation Level Line
    if (scenario.invalidationLevel !== undefined) {
      const invLine: VisualLine = {
        id: `${analysisId}_inv_line`,
        type: 'LINE',
        symbol,
        timeframe,
        price: scenario.invalidationLevel,
        startCandleIndex: currentCandleIndex,
        startTimestamp: timestamp,
        lineStyle: 'DASHED',
        color: invColor,
        lineWidth: 2,
        label: `INV: $${scenario.invalidationLevel.toFixed(2)}`,
        zIndex: 96,
        setupId: analysisId,
      };
      visuals.push(invLine);
    }

    this.activeVisuals = visuals;
    return visuals;
  }

  public getVisuals(): VisualObject[] {
    return this.isVisible ? this.activeVisuals : [];
  }
}
