/**
 * Extension Visual Layer - Visual Adapter
 * Transforms ICTMarketState and ICTEvents into pure VisualObjects.
 * NO ICT calculations performed here.
 */

import { ICTMarketState } from '../../core/ict/types/MarketState';
import { ICTEvent } from '../../core/ict/types/ICTEvent';
import { ICTSetup } from '../../core/ict/setups/SetupTypes';
import { VisualObject, VisualAdapterConfig, DEFAULT_VISUAL_CONFIG, SetupVisualAnnotation, SetupVisualType } from './VisualTypes';

import { CandidateContext } from '../../core/ict/context/CandidateContextEngine';

export class VisualAdapter {
  private config: VisualAdapterConfig & { maxVisibleObjects?: number };
  private setupVisualRegistry: Map<string, VisualObject[]> = new Map();
  private currentContext: { symbol: string; timeframe: string } = { symbol: '', timeframe: '' };
  private isViewportSynchronizedFlag: boolean = true;

  constructor(config: Partial<VisualAdapterConfig & { maxVisibleObjects?: number }> = {}) {
    this.config = { maxVisibleObjects: 100, ...DEFAULT_VISUAL_CONFIG, ...config };
  }

  /**
   * Adapts ICTMarketState snapshot and events array into renderable VisualObjects.
   * Supports optional CandidateContext badge and CP84 ICTSetup annotations.
   */
  public adaptStateToVisuals(
    state: ICTMarketState,
    events: ICTEvent[] = [],
    candidateContext?: CandidateContext,
    setups?: ICTSetup[]
  ): VisualObject[] {
    let visuals: VisualObject[] = [];
    const colors = this.config.colorScheme;
    const { symbol, timeframe } = state;

    // 1. Swings -> Visual Markers
    for (const s of state.swings) {
      if (s.type === 'SWING_HIGH') {
        visuals.push({
          id: `VIS-${s.id}`,
          type: 'MARKER',
          symbol,
          timeframe,
          shape: 'TRIANGLE_DOWN',
          candleIndex: s.candleIndex,
          timestamp: s.timestamp,
          price: s.price,
          color: colors.swingHigh,
          label: 'SH',
          zIndex: 10,
        });
      } else {
        visuals.push({
          id: `VIS-${s.id}`,
          type: 'MARKER',
          symbol,
          timeframe,
          shape: 'TRIANGLE_UP',
          candleIndex: s.candleIndex,
          timestamp: s.timestamp,
          price: s.price,
          color: colors.swingLow,
          label: 'SL',
          zIndex: 10,
        });
      }
    }

    // 2. BOS & MSS -> Visual Lines
    for (const ev of events) {
      if (ev.type === 'BOS') {
        visuals.push({
          id: `VIS-BOS-${ev.candleIndex}-${ev.breakPrice}`,
          type: 'LINE',
          symbol,
          timeframe,
          price: ev.breakPrice,
          startCandleIndex: ev.brokenSwing.candleIndex,
          endCandleIndex: ev.candleIndex,
          startTimestamp: ev.brokenSwing.timestamp,
          endTimestamp: ev.timestamp,
          lineStyle: 'SOLID',
          color: colors.bosLine,
          label: `BOS (${ev.direction})`,
          lineWidth: 2,
          zIndex: 20,
        });
      } else if (ev.type === 'MSS') {
        visuals.push({
          id: `VIS-MSS-${ev.candleIndex}-${ev.breakPrice}`,
          type: 'LINE',
          symbol,
          timeframe,
          price: ev.breakPrice,
          startCandleIndex: ev.brokenSwing.candleIndex,
          endCandleIndex: ev.candleIndex,
          startTimestamp: ev.brokenSwing.timestamp,
          endTimestamp: ev.timestamp,
          lineStyle: 'DASHED',
          color: colors.mssLine,
          label: `MSS (${ev.direction})`,
          lineWidth: 2,
          zIndex: 25,
        });
      } else if (ev.type === 'LIQUIDITY_SWEEP') {
        visuals.push({
          id: `VIS-${ev.sweep.id}`,
          type: 'MARKER',
          symbol,
          timeframe,
          shape: 'CROSS',
          candleIndex: ev.candleIndex,
          timestamp: ev.timestamp,
          price: ev.sweep.extremePrice,
          color: colors.sweepMarker,
          label: `SWEEP (${ev.sweep.liquidityType})`,
          zIndex: 30,
        });
      } else if (ev.type === 'DISPLACEMENT') {
        const disp = ev.displacement;
        visuals.push({
          id: `VIS-${disp.id}`,
          type: 'MARKER',
          symbol,
          timeframe,
          shape: disp.direction === 'BULLISH' ? 'TRIANGLE_UP' : 'TRIANGLE_DOWN',
          candleIndex: disp.candleIndex,
          timestamp: disp.timestamp,
          price: disp.direction === 'BULLISH' ? disp.lowPrice : disp.highPrice,
          color: '#c084fc',
          label: `DISP (${disp.direction.slice(0, 4)} ${disp.bodyRatio.toFixed(2)})`,
          zIndex: 12,
        });
      }
    }

    // 3. Liquidity Levels -> Visual Lines
    for (const lvl of state.liquidityLevels) {
      const isBSL = lvl.type === 'BSL';
      visuals.push({
        id: `VIS-${lvl.id}`,
        type: 'LINE',
        symbol,
        timeframe,
        price: lvl.price,
        startCandleIndex: lvl.swings[0]?.candleIndex || 0,
        endCandleIndex: lvl.sweptByCandleIndex,
        startTimestamp: lvl.swings[0]?.timestamp || 0,
        endTimestamp: lvl.sweptTimestamp,
        lineStyle: lvl.swept ? 'DOTTED' : 'SOLID',
        color: isBSL ? colors.bslLine : colors.sslLine,
        opacity: lvl.swept ? 0.4 : 0.9,
        label: `${lvl.type} (${lvl.category})`,
        lineWidth: 1,
        zIndex: 15,
      });
    }

    // 4. Fair Value Gaps (FVG) -> Visual Rectangles
    for (const fvg of state.fairValueGaps) {
      const isBull = fvg.direction === 'BULLISH';
      const isFullyMitigated = fvg.status === 'FULLY_MITIGATED';

      visuals.push({
        id: `VIS-${fvg.id}`,
        type: 'RECTANGLE',
        symbol,
        timeframe,
        highPrice: fvg.highPrice,
        lowPrice: fvg.lowPrice,
        startCandleIndex: fvg.createdCandleIndex,
        endCandleIndex: isFullyMitigated ? fvg.createdCandleIndex + 10 : undefined,
        startTimestamp: fvg.candle3Timestamp,
        endTimestamp: fvg.mitigatedTimestamp,
        color: isBull ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)',
        fillColor: isBull ? colors.bullishFvg : colors.bearishFvg,
        opacity: isFullyMitigated ? 0.2 : 0.7,
        label: `FVG ${fvg.direction} (${fvg.status})`,
        zIndex: 5,
      });
    }

    // 5. Order Blocks -> Visual Rectangles
    for (const ob of state.orderBlocks) {
      const isBull = ob.type === 'BULLISH_OB';
      const isInvalidated = ob.status === 'INVALIDATED';

      visuals.push({
        id: `VIS-${ob.id}`,
        type: 'RECTANGLE',
        symbol,
        timeframe,
        highPrice: ob.highPrice,
        lowPrice: ob.lowPrice,
        startCandleIndex: ob.candleIndex,
        endCandleIndex: isInvalidated ? ob.candleIndex + 5 : undefined,
        startTimestamp: ob.timestamp,
        endTimestamp: ob.invalidatedTimestamp,
        color: isBull ? '#38bdf8' : '#f59e0b',
        fillColor: isBull ? colors.bullishOb : colors.bearishOb,
        opacity: isInvalidated ? 0.15 : 0.6,
        label: `OB ${ob.type} [${ob.status}]`,
        zIndex: 6,
      });
    }

    // 6. CandidateContext -> Level 5 Visual Context Badge
    if (candidateContext && (candidateContext.status === 'CONTEXT_FORMING' || candidateContext.status === 'CONTEXT_CONFIRMED')) {
      const isConfirmed = candidateContext.status === 'CONTEXT_CONFIRMED';
      visuals.push({
        id: `VIS-${candidateContext.id}`,
        type: 'MARKER',
        symbol,
        timeframe,
        shape: 'CIRCLE',
        candleIndex: Math.max(0, state.lastCandleIndex),
        timestamp: candidateContext.eventTimestamp,
        price: candidateContext.pdArray?.equilibrium || 0,
        color: isConfirmed ? '#4ade80' : '#facc15',
        label: `ICT CONTEXT: ${candidateContext.status}`,
        zIndex: 50,
      });
    }

    // 7. Checkpoint 84 — Visual Setup Annotations (CONFIRMED Setups)
    if (setups && Array.isArray(setups) && setups.length > 0) {
      const setupVisuals = this.adaptSetupsToVisuals(setups, state, events);
      visuals.push(...setupVisuals);
    }

    // Presentation Capping: limit visual render object count without altering underlying logical history
    const maxVis = this.config.maxVisibleObjects || 100;
    if (visuals.length > maxVis) {
      visuals = visuals.slice(visuals.length - maxVis);
    }

    return visuals;
  }

  /**
   * Checkpoint 84 — Visual Setup Annotation Adapter
   * Transforms confirmed ICTSetup collection into visual chart annotations.
   * Pure visual mapping: strictly zero order execution side effects.
   */
  public adaptSetupsToVisuals(
    setups: ICTSetup[],
    state: ICTMarketState,
    events: ICTEvent[] = []
  ): VisualObject[] {
    if (!setups || !Array.isArray(setups) || setups.length === 0) {
      return [];
    }

    // Fail-closed guard: if configured to require synchronized viewport and currently unsynchronized, suppress drawings
    if (this.config.failClosedOnUnsyncedViewport && !this.isViewportSynchronizedFlag) {
      return [];
    }

    // Context guard: check if instrument or timeframe changed
    if (this.currentContext.symbol !== state.symbol || this.currentContext.timeframe !== state.timeframe) {
      this.setupVisualRegistry.clear();
      this.currentContext = { symbol: state.symbol, timeframe: state.timeframe };
    }

    const { symbol, timeframe } = state;

    for (const setup of setups) {
      // 1. Context validation: Reject mismatched chart contexts
      if (setup.symbol !== symbol || setup.timeframe !== timeframe) {
        continue;
      }

      // 2. Data validation: validate required fields
      if (!setup.id || !setup.direction || !setup.status) {
        continue;
      }

      // 3. Direction validation: reject unsupported directions
      if (setup.direction !== 'LONG' && setup.direction !== 'SHORT') {
        continue;
      }

      const modelId = this.extractModelId(setup);
      const logicalKey = `${setup.symbol}:${setup.timeframe}:${modelId}:${setup.direction}`;

      // 4. Lifecycle state handling:
      // WATCHING and FORMING must NOT be represented as confirmed entry signals
      if (setup.status === 'WATCHING' || setup.status === 'FORMING') {
        this.setupVisualRegistry.delete(logicalKey);
        continue;
      }

      // INVALIDATED and EXPIRED must not continue to look like active setups
      if (setup.status === 'INVALIDATED' || setup.status === 'EXPIRED' || setup.status === 'COMPLETED') {
        this.setupVisualRegistry.delete(logicalKey);
        continue;
      }

      // 5. CONFIRMED setups: map into visual primitives
      if (setup.status === 'CONFIRMED') {
        const annotation = this.buildSetupAnnotation(setup, state, events);
        if (annotation && annotation.visualObjects.length > 0) {
          // Replace existing annotation to avoid duplicate drawings on repeated evaluation
          this.setupVisualRegistry.set(logicalKey, annotation.visualObjects);
        } else {
          this.setupVisualRegistry.delete(logicalKey);
        }
      }
    }

    // Flatten all active setup visual objects deterministically
    const result: VisualObject[] = [];
    for (const objs of this.setupVisualRegistry.values()) {
      result.push(...objs);
    }

    return result;
  }

  /**
   * Builds a structured SetupVisualAnnotation for a single ICTSetup.
   * Anchors coordinates deterministically using state and events.
   * Fails closed (returns null) if price or timestamp cannot be safely resolved.
   */
  public buildSetupAnnotation(
    setup: ICTSetup,
    state: ICTMarketState,
    events: ICTEvent[] = []
  ): SetupVisualAnnotation | null {
    const { symbol, timeframe, lastCandleIndex, lastUpdatedTimestamp } = state;
    const colors = this.config.colorScheme;
    const modelId = this.extractModelId(setup);
    const isLong = setup.direction === 'LONG';
    const visualType: SetupVisualType = isLong ? 'BUY_SETUP' : 'SELL_SETUP';

    // 1. Timestamp validation
    const timestamp = setup.confirmedTimestamp ?? setup.activatedTimestamp ?? lastUpdatedTimestamp;
    if (!timestamp || !isFinite(timestamp) || timestamp <= 0) {
      return null;
    }

    // 2. Resolve Entry Zone & Entry Price
    let entryZone: SetupVisualAnnotation['entryZone'] = undefined;
    let entryPrice: number | undefined = undefined;

    // A. Check Fair Value Gaps
    const matchingFvg = state.fairValueGaps.find((f) =>
      isLong ? f.direction === 'BULLISH' : f.direction === 'BEARISH'
    );
    if (matchingFvg && isFinite(matchingFvg.highPrice) && isFinite(matchingFvg.lowPrice)) {
      entryZone = {
        highPrice: matchingFvg.highPrice,
        lowPrice: matchingFvg.lowPrice,
        startCandleIndex: matchingFvg.createdCandleIndex,
        endCandleIndex: matchingFvg.mitigatedTimestamp ? undefined : lastCandleIndex + 10,
        startTimestamp: matchingFvg.candle3Timestamp,
        endTimestamp: matchingFvg.mitigatedTimestamp,
      };
      entryPrice = isLong ? matchingFvg.lowPrice : matchingFvg.highPrice;
    }

    // B. Check Order Blocks if no FVG
    if (!entryZone) {
      const matchingOb = state.orderBlocks.find((ob) =>
        isLong ? ob.type === 'BULLISH_OB' : ob.type === 'BEARISH_OB'
      );
      if (matchingOb && isFinite(matchingOb.highPrice) && isFinite(matchingOb.lowPrice)) {
        entryZone = {
          highPrice: matchingOb.highPrice,
          lowPrice: matchingOb.lowPrice,
          startCandleIndex: matchingOb.candleIndex,
          endCandleIndex: lastCandleIndex + 10,
          startTimestamp: matchingOb.timestamp,
        };
        entryPrice = isLong ? matchingOb.lowPrice : matchingOb.highPrice;
      }
    }

    // C. Check Structure Break Events if still no entryPrice
    if (entryPrice === undefined) {
      const breakEvent = events.find((e) =>
        (e.type === 'MSS' || e.type === 'BOS') && (isLong ? e.direction === 'BULLISH' : e.direction === 'BEARISH')
      );
      if (breakEvent && 'breakPrice' in breakEvent && isFinite(breakEvent.breakPrice)) {
        entryPrice = breakEvent.breakPrice;
      }
    }

    // D. Check Swings fallback
    if (entryPrice === undefined) {
      const activeSwing = isLong ? state.activeSwingLow : state.activeSwingHigh;
      if (activeSwing && isFinite(activeSwing.price)) {
        entryPrice = activeSwing.price;
      } else if (state.swings.length > 0) {
        const lastSwing = state.swings[state.swings.length - 1];
        if (isFinite(lastSwing.price)) {
          entryPrice = lastSwing.price;
        }
      }
    }

    // Validate finite entry price
    if (entryPrice === undefined || !isFinite(entryPrice) || isNaN(entryPrice) || entryPrice <= 0) {
      // Fail closed: omit drawing if valid price cannot be resolved
      return null;
    }

    // 3. Resolve Invalidation Price (Optional)
    let invalidationPrice: number | undefined = undefined;
    const sweepEvent = events.find((e) => e.type === 'LIQUIDITY_SWEEP');
    if (sweepEvent && 'sweep' in sweepEvent && isFinite(sweepEvent.sweep.extremePrice)) {
      invalidationPrice = sweepEvent.sweep.extremePrice;
    } else {
      const oppositeSwing = isLong ? state.activeSwingLow : state.activeSwingHigh;
      if (oppositeSwing && isFinite(oppositeSwing.price)) {
        invalidationPrice = oppositeSwing.price;
      }
    }

    // Validate invalidation price orientation (must be below entry for LONG, above entry for SHORT)
    if (invalidationPrice !== undefined) {
      if (!isFinite(invalidationPrice) || invalidationPrice <= 0) {
        invalidationPrice = undefined;
      } else if (isLong && invalidationPrice >= entryPrice) {
        invalidationPrice = undefined; // Invalid orientation, omit rather than fabricate
      } else if (!isLong && invalidationPrice <= entryPrice) {
        invalidationPrice = undefined; // Invalid orientation, omit rather than fabricate
      }
    }

    // 4. Resolve Target Price (Optional)
    let targetPrice: number | undefined = undefined;
    const targetLiquidity = state.liquidityLevels.filter((lvl) =>
      !lvl.swept && (isLong ? lvl.type === 'BSL' && lvl.price > entryPrice : lvl.type === 'SSL' && lvl.price < entryPrice)
    );
    if (targetLiquidity.length > 0) {
      // Pick nearest target
      if (isLong) {
        targetLiquidity.sort((a, b) => a.price - b.price);
        targetPrice = targetLiquidity[0].price;
      } else {
        targetLiquidity.sort((a, b) => b.price - a.price);
        targetPrice = targetLiquidity[0].price;
      }
    }

    if (targetPrice !== undefined && (!isFinite(targetPrice) || targetPrice <= 0)) {
      targetPrice = undefined;
    }

    // 5. Build reason codes from setup evidence and confluences
    const reasonCodes: string[] = [
      ...setup.evidence,
      ...setup.fulfilledConfluences.map((c) => `Confluence: ${c}`),
    ];

    // 6. Construct Visual Primitives
    const visualObjects: VisualObject[] = [];
    const logicalId = `VIS-SETUP-${modelId}-${setup.direction}-${symbol}-${timeframe}`;

    // A. Directional Marker
    visualObjects.push({
      id: `${logicalId}-MARKER`,
      type: 'MARKER',
      symbol,
      timeframe,
      shape: isLong ? 'TRIANGLE_UP' : 'TRIANGLE_DOWN',
      candleIndex: Math.max(0, lastCandleIndex),
      timestamp,
      price: entryPrice,
      color: isLong ? colors.buySetupMarker : colors.sellSetupMarker,
      label: `${isLong ? 'BUY' : 'SELL'} SETUP [${modelId}]`,
      zIndex: 60,
      setupId: setup.id,
      setupStatus: setup.status,
    });

    // B. Optional Entry Zone (Rectangle)
    if (entryZone) {
      visualObjects.push({
        id: `${logicalId}-ZONE`,
        type: 'RECTANGLE',
        symbol,
        timeframe,
        highPrice: entryZone.highPrice,
        lowPrice: entryZone.lowPrice,
        startCandleIndex: entryZone.startCandleIndex,
        endCandleIndex: entryZone.endCandleIndex,
        startTimestamp: entryZone.startTimestamp,
        endTimestamp: entryZone.endTimestamp,
        color: isLong ? colors.buySetupMarker : colors.sellSetupMarker,
        fillColor: isLong ? colors.entryZoneBullish : colors.entryZoneBearish,
        opacity: 0.3,
        label: `ENTRY ZONE [${modelId}]`,
        zIndex: 8,
        setupId: setup.id,
        setupStatus: setup.status,
      });
    }

    // C. Optional Invalidation Level (Line)
    if (invalidationPrice !== undefined) {
      visualObjects.push({
        id: `${logicalId}-INV`,
        type: 'LINE',
        symbol,
        timeframe,
        price: invalidationPrice,
        startCandleIndex: Math.max(0, lastCandleIndex - 10),
        endCandleIndex: undefined,
        startTimestamp: timestamp,
        lineStyle: 'DASHED',
        color: colors.invalidationLine,
        lineWidth: 1.5,
        label: `INVALIDATION [SL] $${invalidationPrice.toFixed(2)}`,
        zIndex: 22,
        setupId: setup.id,
        setupStatus: setup.status,
      });
    }

    // D. Optional Target Level (Line)
    if (targetPrice !== undefined) {
      visualObjects.push({
        id: `${logicalId}-TGT`,
        type: 'LINE',
        symbol,
        timeframe,
        price: targetPrice,
        startCandleIndex: Math.max(0, lastCandleIndex - 10),
        endCandleIndex: undefined,
        startTimestamp: timestamp,
        lineStyle: 'DOTTED',
        color: colors.targetLine,
        lineWidth: 1.5,
        label: `TARGET [TP] $${targetPrice.toFixed(2)}`,
        zIndex: 22,
        setupId: setup.id,
        setupStatus: setup.status,
      });
    }

    return {
      setupId: setup.id,
      modelId,
      direction: setup.direction,
      status: setup.status,
      visualType,
      symbol,
      timeframe,
      timestamp,
      entryPrice,
      invalidationPrice,
      targetPrice,
      entryZone,
      reasonCodes,
      visualObjects,
    };
  }

  public extractModelId(setup: ICTSetup): string {
    const parts = setup.id.split('-');
    if (parts.length >= 2 && parts[0] === 'SETUP') {
      return parts[1];
    }
    const modelEv = setup.evidence?.find((e) => e.startsWith('Model:'));
    if (modelEv) {
      return modelEv.replace('Model:', '').trim();
    }
    return 'ICT_MODEL';
  }

  public resetContext(symbol?: string, timeframe?: string): void {
    this.setupVisualRegistry.clear();
    if (symbol && timeframe) {
      this.currentContext = { symbol, timeframe };
    }
  }

  public getActiveSetupVisualCount(): number {
    let count = 0;
    for (const objs of this.setupVisualRegistry.values()) {
      count += objs.length;
    }
    return count;
  }

  public setViewportSynchronized(synced: boolean): void {
    this.isViewportSynchronizedFlag = synced;
  }

  public isViewportSynchronized(): boolean {
    return this.isViewportSynchronizedFlag;
  }

  public setFailClosedOnUnsyncedViewport(failClosed: boolean): void {
    this.config.failClosedOnUnsyncedViewport = failClosed;
  }
}
