import { describe, it, expect } from 'vitest';
import { MarketAnalystVisualAdapter } from '../extension/analyst/MarketAnalystVisualAdapter';
import { MarketAnalysis } from '../core/analyst/MarketAnalystTypes';
import { VisualLine, VisualMarker, VisualRectangle } from '../extension/visual/VisualTypes';

describe('TradeSea Market Analyst — Visualization Adapter Unit Tests', () => {
  const adapter = new MarketAnalystVisualAdapter();

  const mockBullAnalysis: MarketAnalysis = {
    analysisId: 'ANL_MNQZ6_1m_1728900000000',
    instrument: 'MNQZ6',
    timeframe: '1m',
    evaluatedAt: '2026-10-14T10:00:00.000Z',
    evaluationTimestampMs: 1728900000000,
    latestCandleTimestampMs: 1728900000000,
    status: 'ANALYSIS_READY',
    preferredDirection: 'BULLISH',
    statusExplanation: 'Bullish scenario preferred',
    selectedScenario: {
      direction: 'BULLISH',
      referencePrice: 20000,
      nearbyTarget: {
        price: 20050,
        zoneLow: 20045,
        zoneHigh: 20055,
        rationale: 'FVG mitigation zone',
        structuralSource: 'FAIR_VALUE_GAP',
      },
      extendedTarget: {
        price: 20090,
        rationale: 'Major BSL pool',
        structuralSource: 'LIQUIDITY_POOL',
      },
      invalidationLevel: 19965,
      invalidationRationale: 'SSL sweep extreme',
      supportingEvidence: ['Bullish trend'],
      conflictingEvidence: [],
      conditionsRequired: [],
      confidenceLabel: 'HIGH',
      targetAccessibilityNotes: [],
    },
    dataQualityNotes: [],
    uncertaintyNotes: [],
    modelVersions: { analyst: '1.0.0' },
  };

  it('1. Adapts Bullish analysis to complete visual set with correct IDs and attributes', () => {
    adapter.setViewportSynchronized(true);
    adapter.setVisible(true);

    const visuals = adapter.adaptAnalysisToVisuals(mockBullAnalysis, 45);

    expect(visuals.length).toBe(5); // Ref marker, Ref line, Nearby target zone, Extended line, Invalidation line
    // Let's verify each visual object
    const marker = visuals.find((v) => v.type === 'MARKER') as VisualMarker;
    expect(marker).toBeDefined();
    expect(marker.shape).toBe('TRIANGLE_UP');
    expect(marker.price).toBe(20000);
    expect(marker.setupId).toBe(mockBullAnalysis.analysisId);
    expect(marker.color).toBe('#22c55e');

    const refLine = visuals.find((v) => v.type === 'LINE' && v.id.includes('ref_line')) as VisualLine;
    expect(refLine).toBeDefined();
    expect(refLine.price).toBe(20000);
    expect(refLine.lineStyle).toBe('DOTTED');
    expect(refLine.setupId).toBe(mockBullAnalysis.analysisId);

    const nearbyZone = visuals.find((v) => v.type === 'RECTANGLE') as VisualRectangle;
    expect(nearbyZone).toBeDefined();
    expect(nearbyZone.highPrice).toBe(20055);
    expect(nearbyZone.lowPrice).toBe(20045);
    expect(nearbyZone.setupId).toBe(mockBullAnalysis.analysisId);

    const extLine = visuals.find((v) => v.type === 'LINE' && v.id.includes('extended_line')) as VisualLine;
    expect(extLine).toBeDefined();
    expect(extLine.price).toBe(20090);
    expect(extLine.lineStyle).toBe('SOLID');
    expect(extLine.setupId).toBe(mockBullAnalysis.analysisId);

    const invLine = visuals.find((v) => v.type === 'LINE' && v.id.includes('inv_line')) as VisualLine;
    expect(invLine).toBeDefined();
    expect(invLine.price).toBe(19965);
    expect(invLine.lineStyle).toBe('DASHED');
    expect(invLine.setupId).toBe(mockBullAnalysis.analysisId);
  });

  it('2. Adapts Bearish analysis with target line when no zone bounds are present', () => {
    const mockBearAnalysis: MarketAnalysis = {
      ...mockBullAnalysis,
      analysisId: 'ANL_MNQZ6_1m_BEAR',
      preferredDirection: 'BEARISH',
      selectedScenario: {
        direction: 'BEARISH',
        referencePrice: 20000,
        nearbyTarget: {
          price: 19950,
          rationale: 'SSL pool',
          structuralSource: 'LIQUIDITY_POOL',
        },
        invalidationLevel: 20035,
        supportingEvidence: ['Bearish trend'],
        conflictingEvidence: [],
        conditionsRequired: [],
        confidenceLabel: 'MODERATE',
        targetAccessibilityNotes: [],
      },
    };

    const visuals = adapter.adaptAnalysisToVisuals(mockBearAnalysis, 50);

    const marker = visuals.find((v) => v.type === 'MARKER') as VisualMarker;
    expect(marker.shape).toBe('TRIANGLE_DOWN');
    expect(marker.color).toBe('#ef4444');

    const tgtLine = visuals.find((v) => v.type === 'LINE' && v.id.includes('nearby_line')) as VisualLine;
    expect(tgtLine).toBeDefined();
    expect(tgtLine.price).toBe(19950);
    expect(tgtLine.lineStyle).toBe('DASHED');

    const invLine = visuals.find((v) => v.type === 'LINE' && v.id.includes('inv_line')) as VisualLine;
    expect(invLine.price).toBe(20035);
  });

  it('3. Fails closed to empty visuals when viewport is not synchronized', () => {
    adapter.setViewportSynchronized(false);
    const visuals = adapter.adaptAnalysisToVisuals(mockBullAnalysis, 45);
    expect(visuals).toEqual([]);
    adapter.setViewportSynchronized(true);
  });

  it('4. Respects visibility toggle without destroying cached analysis state', () => {
    adapter.adaptAnalysisToVisuals(mockBullAnalysis, 45);
    expect(adapter.getVisuals().length).toBeGreaterThan(0);

    // Toggle hide
    adapter.setVisible(false);
    expect(adapter.getVisible()).toBe(false);
    expect(adapter.getVisuals()).toEqual([]);
    expect(adapter.getCurrentAnalysis()).toBe(mockBullAnalysis);

    // Toggle show
    adapter.setVisible(true);
    expect(adapter.getVisible()).toBe(true);
    expect(adapter.getVisuals().length).toBeGreaterThan(0);
  });

  it('5. Clear operation removes visuals and resets current analysis', () => {
    adapter.adaptAnalysisToVisuals(mockBullAnalysis, 45);
    expect(adapter.getVisuals().length).toBeGreaterThan(0);

    adapter.clear();
    expect(adapter.getVisuals()).toEqual([]);
    expect(adapter.getCurrentAnalysis()).toBeNull();
  });

  it('6. Non-ready analysis produces no visuals', () => {
    const unreadyAnalysis: MarketAnalysis = {
      ...mockBullAnalysis,
      status: 'NO_CLEAR_OPPORTUNITY',
      selectedScenario: undefined,
    };
    const visuals = adapter.adaptAnalysisToVisuals(unreadyAnalysis, 45);
    expect(visuals).toEqual([]);
  });
});
