/**
 * Extension Visual Layer - Visual Adapter
 * Transforms ICTMarketState and ICTEvents into pure VisualObjects.
 * NO ICT calculations performed here.
 */

import { ICTMarketState } from '../../core/ict/types/MarketState';
import { ICTEvent } from '../../core/ict/types/ICTEvent';
import { VisualObject, VisualAdapterConfig, DEFAULT_VISUAL_CONFIG } from './VisualTypes';

export class VisualAdapter {
  private config: VisualAdapterConfig;

  constructor(config: Partial<VisualAdapterConfig> = {}) {
    this.config = { ...DEFAULT_VISUAL_CONFIG, ...config };
  }

  /**
   * Adapts ICTMarketState snapshot and events array into renderable VisualObjects.
   */
  public adaptStateToVisuals(state: ICTMarketState, events: ICTEvent[]): VisualObject[] {
    const visuals: VisualObject[] = [];
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
        endCandleIndex: lvl.sweptByCandleIndex, // Stop extending if swept
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

    return visuals;
  }
}
