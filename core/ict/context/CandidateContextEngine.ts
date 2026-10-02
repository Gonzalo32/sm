/**
 * Core ICT - Candidate Context Engine (CP35 Integration)
 * Aggregates verified ICT events (STRUCTURE, BOS, MSS, DISPLACEMENT, FVG, LIQUIDITY, PD_ARRAY)
 * into a neutral, traceable, anti-lookahead CandidateContext without trading signals or recommendations.
 */

import { ICTMarketState } from '../types/MarketState';
import { ICTEvent } from '../types/ICTEvent';

export type CandidateContextStatus = 'NO_CONTEXT' | 'CONTEXT_FORMING' | 'CONTEXT_CONFIRMED' | 'CONTEXT_EXPIRED';

export interface CandidateContext {
  id: string;
  symbol: string;
  timeframe: string;

  eventTimestamp: number;
  confirmationTimestamp: number | null;

  structure: {
    trend: string;
    lastBOS?: string;
    lastMSS?: string;
  };
  liquidity: {
    bslCount: number;
    sslCount: number;
    lastSweep?: string;
  };
  displacement: {
    state: string;
    bodyRatio: number;
    rangeMultiplier: number;
  };
  fvg: {
    activeFvgCount: number;
    lastFvgStatus?: string;
  };
  pdArray: {
    zone: string;
    equilibrium: number;
  };

  supportingEvents: string[];
  sourceCandleTimestamps: number[];

  status: CandidateContextStatus;
  expirationStatus: 'NOT_DEFINED' | 'EXPIRED';
}

export class CandidateContextEngine {
  /**
   * Aggregates current ICT market state and events into a CandidateContext.
   */
  public buildCandidateContext(state: ICTMarketState, events: ICTEvent[]): CandidateContext {
    const { symbol, timeframe } = state;

    if (!events || events.length === 0) {
      return this.createEmptyContext(symbol, timeframe, state.lastUpdatedTimestamp);
    }

    // Filter relevant structural/contextual events
    const bosEvents = events.filter((e) => e.type === 'BOS');
    const mssEvents = events.filter((e) => e.type === 'MSS');
    const dispEvents = events.filter((e) => e.type === 'DISPLACEMENT');
    const liqEvents = events.filter((e) => e.type === 'LIQUIDITY_SWEEP');

    const lastBOS = bosEvents.length > 0 ? bosEvents[bosEvents.length - 1] : undefined;
    const lastMSS = mssEvents.length > 0 ? mssEvents[mssEvents.length - 1] : undefined;
    const lastDisp = dispEvents.length > 0 ? dispEvents[dispEvents.length - 1] : undefined;
    const lastSweep = liqEvents.length > 0 ? liqEvents[liqEvents.length - 1] : undefined;

    const bsl = state.liquidityLevels.filter((l) => l.type === 'BSL');
    const ssl = state.liquidityLevels.filter((l) => l.type === 'SSL');
    const activeFvgs = state.fairValueGaps.filter((f) => f.status === 'ACTIVE');

    // Extract supporting events & timestamps for full traceability
    const supportingEvents: string[] = [];
    const sourceCandleTimestamps: number[] = [];

    for (const e of events) {
      supportingEvents.push(`${e.type} @ ${e.timestamp}${e.confirmationTimestamp ? ` (Confirmed: ${e.confirmationTimestamp})` : ''}`);
      sourceCandleTimestamps.push(e.timestamp);
    }

    // Deduplicate timestamps
    const uniqueSourceTimestamps = Array.from(new Set(sourceCandleTimestamps)).sort((a, b) => a - b);

    // Determine eventTimestamp & confirmationTimestamp ensuring anti-lookahead: eventTimestamp <= confirmationTimestamp
    const firstEventTs = events[0].timestamp;
    const lastConfTs = events[events.length - 1].confirmationTimestamp || events[events.length - 1].timestamp;
    const confirmationTimestamp = Math.max(firstEventTs, lastConfTs);

    // Determine neutral context status
    let status: CandidateContextStatus = 'NO_CONTEXT';

    const hasStructureBreak = !!lastBOS || !!lastMSS;
    const hasDisplacement = !!lastDisp;
    const hasActiveFVG = activeFvgs.length > 0;

    if (hasStructureBreak && (hasDisplacement || hasActiveFVG)) {
      // Both structural break and displacement/FVG present -> Technical conditions fulfilled
      status = 'CONTEXT_CONFIRMED';
    } else if (hasStructureBreak || hasDisplacement || hasActiveFVG || lastSweep) {
      // Partial technical conditions forming
      status = 'CONTEXT_FORMING';
    } else {
      status = 'NO_CONTEXT';
    }

    const id = `ctx_${symbol}_${timeframe}_${firstEventTs}`;

    return {
      id,
      symbol,
      timeframe,
      eventTimestamp: firstEventTs,
      confirmationTimestamp,

      structure: {
        trend: state.trend,
        lastBOS: lastBOS ? `${lastBOS.direction} @ $${(lastBOS as any).breakPrice?.toFixed(2) || '0.00'}` : undefined,
        lastMSS: lastMSS ? `${lastMSS.direction} @ $${(lastMSS as any).breakPrice?.toFixed(2) || '0.00'}` : undefined,
      },
      liquidity: {
        bslCount: bsl.length,
        sslCount: ssl.length,
        lastSweep: lastSweep ? `${(lastSweep as any).sweep?.liquidityType || 'SWEEP'} @ $${(lastSweep as any).sweep?.levelPrice?.toFixed(2) || '0.00'}` : undefined,
      },
      displacement: {
        state: hasDisplacement ? 'PRESENT' : 'ABSENT',
        bodyRatio: lastDisp ? (lastDisp as any).displacement?.bodyRatio || 0 : 0,
        rangeMultiplier: lastDisp ? (lastDisp as any).displacement?.rangeMultiplier || 0 : 0,
      },
      fvg: {
        activeFvgCount: activeFvgs.length,
        lastFvgStatus: activeFvgs.length > 0 ? 'ACTIVE' : 'NONE',
      },
      pdArray: {
        zone: state.dealingRange ? state.dealingRange.currentZone : 'EQUILIBRIUM',
        equilibrium: state.dealingRange ? state.dealingRange.equilibrium : 0,
      },

      supportingEvents,
      sourceCandleTimestamps: uniqueSourceTimestamps,

      status,
      expirationStatus: 'NOT_DEFINED',
    };
  }

  public createEmptyContext(symbol: string, timeframe: string, timestamp?: number): CandidateContext {
    const eventTs = timestamp || Date.now();
    return {
      id: `ctx_${symbol}_${timeframe}_empty_${eventTs}`,
      symbol,
      timeframe,
      eventTimestamp: eventTs,
      confirmationTimestamp: eventTs,
      structure: { trend: 'SIDEWAYS' },
      liquidity: { bslCount: 0, sslCount: 0 },
      displacement: { state: 'ABSENT', bodyRatio: 0, rangeMultiplier: 0 },
      fvg: { activeFvgCount: 0, lastFvgStatus: 'NONE' },
      pdArray: { zone: 'EQUILIBRIUM', equilibrium: 0 },
      supportingEvents: [],
      sourceCandleTimestamps: [],
      status: 'NO_CONTEXT',
      expirationStatus: 'NOT_DEFINED',
    };
  }
}
