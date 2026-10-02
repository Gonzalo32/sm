/**
 * Core ICT - Multi-Timeframe Context Engine (CP37 Integration)
 * Evaluates causal HTF -> LTF context propagation for the same symbol (15m -> 5m, 15m -> 1m, 5m -> 1m).
 * Enforces strict symbol isolation, timeframe hierarchy direction, anti-lookahead causality
 * (source.confirmationTimestamp <= target.eventTimestamp), and 100% event traceability.
 */

import { CandidateContext } from './CandidateContextEngine';

export type MTFContextStatus = 'NO_CONTEXT' | 'AVAILABLE' | 'CONFIRMED' | 'STALE';

export interface MultiTimeframeContext {
  id: string;
  symbol: string;
  targetTimeframe: string;
  sourceTimeframe: string;

  eventTimestamp: number;
  confirmationTimestamp: number | null;

  sourceEventIds: string[];
  sourceCandleTimestamps: number[];

  structure: {
    trend?: string;
    bos?: string;
    mss?: string;
  };

  liquidity: {
    bslCount?: number;
    sslCount?: number;
    sweep?: string;
  };

  displacement: {
    state?: string;
    bodyRatio?: number;
    rangeMultiplier?: number;
  };

  fvg: {
    activeCount?: number;
    lastStatus?: string;
  };

  pdArray: {
    zone?: string;
    equilibrium?: number;
  };

  status: MTFContextStatus;
  causal: boolean;
  validityWindow: 'NOT_DEFINED';
}

export class MultiTimeframeContextEngine {
  /**
   * Helper to verify if an HTF confirmation timestamp is causally available to an LTF event timestamp.
   * HTF.confirmationTimestamp <= LTF.eventTimestamp
   */
  public isCausallyAvailable(
    sourceConfirmationTimestamp: number | null | undefined,
    targetEventTimestamp: number
  ): boolean {
    if (sourceConfirmationTimestamp === null || sourceConfirmationTimestamp === undefined) {
      return false; // Open HTF bar or unconfirmed event is NOT causally available
    }
    return sourceConfirmationTimestamp <= targetEventTimestamp;
  }

  /**
   * Validates if timeframe direction is strictly HTF -> LTF.
   * Allowed: 15m -> 5m, 15m -> 1m, 5m -> 1m.
   * Rejected: 1m -> 5m, 1m -> 15m, 5m -> 15m, same timeframe.
   */
  public isValidDirection(sourceTimeframe: string, targetTimeframe: string): boolean {
    const rank: Record<string, number> = { '15m': 3, '5m': 2, '1m': 1 };
    const srcRank = rank[sourceTimeframe];
    const tgtRank = rank[targetTimeframe];

    if (!srcRank || !tgtRank) return false;
    return srcRank > tgtRank;
  }

  /**
   * Evaluates HTF CandidateContext against LTF CandidateContext and returns a MultiTimeframeContext payload.
   */
  public evaluateMTFContext(
    htfContext: CandidateContext,
    ltfContext: CandidateContext
  ): MultiTimeframeContext {
    const symbol = ltfContext.symbol;
    const targetTimeframe = ltfContext.timeframe;
    const sourceTimeframe = htfContext.timeframe;

    // 1. Symbol Isolation Check
    if (htfContext.symbol !== ltfContext.symbol) {
      return this.createRejectedContext(symbol, targetTimeframe, sourceTimeframe, 'SYMBOL_MISMATCH');
    }

    // 2. Timeframe Direction Check
    if (!this.isValidDirection(sourceTimeframe, targetTimeframe)) {
      return this.createRejectedContext(symbol, targetTimeframe, sourceTimeframe, 'INVALID_DIRECTION');
    }

    // 3. Causality & Anti-Lookahead Check
    const isCausal = this.isCausallyAvailable(
      htfContext.confirmationTimestamp,
      ltfContext.eventTimestamp
    );

    if (!isCausal) {
      return this.createRejectedContext(symbol, targetTimeframe, sourceTimeframe, 'NON_CAUSAL_LOOKAHEAD');
    }

    // 4. Construct Causal MTF Context
    const id = `mtf_${symbol}_${sourceTimeframe}_to_${targetTimeframe}_${ltfContext.eventTimestamp}`;
    const status: MTFContextStatus =
      htfContext.status === 'CONTEXT_CONFIRMED' && ltfContext.status === 'CONTEXT_CONFIRMED'
        ? 'CONFIRMED'
        : htfContext.status !== 'NO_CONTEXT'
        ? 'AVAILABLE'
        : 'NO_CONTEXT';

    return {
      id,
      symbol,
      targetTimeframe,
      sourceTimeframe,

      eventTimestamp: ltfContext.eventTimestamp,
      confirmationTimestamp: htfContext.confirmationTimestamp,

      sourceEventIds: [htfContext.id, ...htfContext.supportingEvents],
      sourceCandleTimestamps: Array.from(
        new Set([...htfContext.sourceCandleTimestamps, ...ltfContext.sourceCandleTimestamps])
      ).sort((a, b) => a - b),

      structure: {
        trend: htfContext.structure.trend,
        bos: htfContext.structure.lastBOS,
        mss: htfContext.structure.lastMSS,
      },
      liquidity: {
        bslCount: htfContext.liquidity.bslCount,
        sslCount: htfContext.liquidity.sslCount,
        sweep: htfContext.liquidity.lastSweep,
      },
      displacement: {
        state: htfContext.displacement.state,
        bodyRatio: htfContext.displacement.bodyRatio,
        rangeMultiplier: htfContext.displacement.rangeMultiplier,
      },
      fvg: {
        activeCount: htfContext.fvg.activeFvgCount,
        lastStatus: htfContext.fvg.lastFvgStatus,
      },
      pdArray: {
        zone: htfContext.pdArray.zone,
        equilibrium: htfContext.pdArray.equilibrium,
      },

      status,
      causal: true,
      validityWindow: 'NOT_DEFINED',
    };
  }

  public createRejectedContext(
    symbol: string,
    targetTimeframe: string,
    sourceTimeframe: string,
    reason: string
  ): MultiTimeframeContext {
    return {
      id: `mtf_rejected_${symbol}_${sourceTimeframe}_to_${targetTimeframe}_${Date.now()}`,
      symbol,
      targetTimeframe,
      sourceTimeframe,

      eventTimestamp: Date.now(),
      confirmationTimestamp: null,

      sourceEventIds: [`REJECTED:${reason}`],
      sourceCandleTimestamps: [],

      structure: {},
      liquidity: {},
      displacement: {},
      fvg: {},
      pdArray: {},

      status: 'NO_CONTEXT',
      causal: false,
      validityWindow: 'NOT_DEFINED',
    };
  }
}
