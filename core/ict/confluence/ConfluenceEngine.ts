/**
 * ICT Confluence System - Confluence Evaluator Engine
 */

import { ICTMarketState } from '../types/MarketState';
import { ICTEvent } from '../types/ICTEvent';
import { ICTConfluence } from './ConfluenceTypes';

export class ConfluenceEngine {
  /**
   * Evaluates all objective confluences for a given market state and event stream.
   */
  public evaluateConfluences(
    state: ICTMarketState,
    events: ICTEvent[],
    htfTrend?: string
  ): ICTConfluence[] {
    const confluences: ICTConfluence[] = [];
    const { symbol, timeframe, lastUpdatedTimestamp } = state;

    // 1. HTF Trend Alignment
    const isHtfAligned = htfTrend && htfTrend !== 'SIDEWAYS' && htfTrend === state.trend;
    confluences.push({
      id: `CONF-HTF-${symbol}-${timeframe}`,
      type: 'HTF_TREND_ALIGNMENT',
      status: isHtfAligned ? 'PRESENT' : 'ABSENT',
      timestamp: lastUpdatedTimestamp,
      timeframe,
      evidence: isHtfAligned ? [`LTF trend (${state.trend}) aligns with HTF trend (${htfTrend})`] : ['HTF trend not aligned'],
    });

    // 2. Liquidity Sweep
    const recentSweeps = events.filter((e) => e.type === 'LIQUIDITY_SWEEP');
    const isSweepPresent = recentSweeps.length > 0;
    confluences.push({
      id: `CONF-SWEEP-${symbol}-${timeframe}`,
      type: 'LIQUIDITY_SWEEP',
      status: isSweepPresent ? 'PRESENT' : 'ABSENT',
      timestamp: lastUpdatedTimestamp,
      timeframe,
      evidence: isSweepPresent ? recentSweeps.map((s: any) => `Liquidity sweep detected on ${s.sweep.liquidityType} at price ${s.sweep.levelPrice}`) : ['No recent liquidity sweep'],
    });

    // 3. MSS Confirmed
    const recentMSS = events.filter((e) => e.type === 'MSS');
    const isMssPresent = recentMSS.length > 0;
    confluences.push({
      id: `CONF-MSS-${symbol}-${timeframe}`,
      type: 'MSS_CONFIRMED',
      status: isMssPresent ? 'PRESENT' : 'ABSENT',
      timestamp: lastUpdatedTimestamp,
      timeframe,
      evidence: isMssPresent ? recentMSS.map((m: any) => `MSS (${m.direction}) confirmed at price ${m.breakPrice}`) : ['No MSS confirmed'],
    });

    // 4. BOS Confirmed
    const recentBOS = events.filter((e) => e.type === 'BOS');
    const isBosPresent = recentBOS.length > 0;
    confluences.push({
      id: `CONF-BOS-${symbol}-${timeframe}`,
      type: 'BOS_CONFIRMED',
      status: isBosPresent ? 'PRESENT' : 'ABSENT',
      timestamp: lastUpdatedTimestamp,
      timeframe,
      evidence: isBosPresent ? recentBOS.map((b: any) => `BOS (${b.direction}) confirmed at price ${b.breakPrice}`) : ['No BOS confirmed'],
    });

    // 5. FVG Confluence
    const activeFVGs = state.fairValueGaps.filter((f) => f.status === 'ACTIVE' || f.status === 'PARTIALLY_MITIGATED');
    const isFvgPresent = activeFVGs.length > 0;
    confluences.push({
      id: `CONF-FVG-${symbol}-${timeframe}`,
      type: 'FVG_CONFLUENCE',
      status: isFvgPresent ? 'PRESENT' : 'ABSENT',
      timestamp: lastUpdatedTimestamp,
      timeframe,
      evidence: isFvgPresent ? activeFVGs.map((f) => `Active FVG ${f.direction} zone [${f.lowPrice} - ${f.highPrice}]`) : ['No active FVG'],
    });

    // 6. Order Block Confluence
    const activeOBs = state.orderBlocks.filter((o) => o.status === 'UNTESTED' || o.status === 'TESTED');
    const isObPresent = activeOBs.length > 0;
    confluences.push({
      id: `CONF-OB-${symbol}-${timeframe}`,
      type: 'ORDER_BLOCK_CONFLUENCE',
      status: isObPresent ? 'PRESENT' : 'ABSENT',
      timestamp: lastUpdatedTimestamp,
      timeframe,
      evidence: isObPresent ? activeOBs.map((o) => `Active Order Block ${o.type} [${o.lowPrice} - ${o.highPrice}]`) : ['No active Order Block'],
    });

    // 7. Premium / Discount Alignment
    const range = state.dealingRange;
    const isPdPresent = range !== undefined;
    confluences.push({
      id: `CONF-PD-${symbol}-${timeframe}`,
      type: 'PREMIUM_DISCOUNT_ALIGNMENT',
      status: isPdPresent ? 'PRESENT' : 'ABSENT',
      timestamp: lastUpdatedTimestamp,
      timeframe,
      evidence: range ? [`Price is in ${range.currentZone} zone (Equilibrium: ${range.equilibrium})`] : ['No dealing range available'],
    });

    // 8. Liquidity Target Present
    const unsweptLiquidity = state.liquidityLevels.filter((l) => !l.swept);
    const isTargetPresent = unsweptLiquidity.length > 0;
    confluences.push({
      id: `CONF-TARGET-${symbol}-${timeframe}`,
      type: 'LIQUIDITY_TARGET_PRESENT',
      status: isTargetPresent ? 'PRESENT' : 'ABSENT',
      timestamp: lastUpdatedTimestamp,
      timeframe,
      evidence: isTargetPresent ? unsweptLiquidity.map((l) => `Unswept ${l.type} target at price ${l.price}`) : ['No unswept liquidity targets'],
    });

    return confluences;
  }
}
