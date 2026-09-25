/**
 * Multi-Timeframe ICT Market Context Engine
 * Feeds the conceptual data model for the Info Panel HUD.
 */

import { Timeframe } from '../../market/Candle';
import { ICTMarketState } from '../types/MarketState';
import { ICTEvent } from '../types/ICTEvent';
import { ICTConfluence } from '../confluence/ConfluenceTypes';
import { ICTSetup, SetupStatus } from '../setups/SetupTypes';

export interface ICTMarketContext {
  symbol: string;
  htfTimeframe: Timeframe;
  ltfTimeframe: Timeframe;

  structure: {
    trend: string;
    lastBOS?: string;
    lastMSS?: string;
    structureState: string;
  };

  liquidity: {
    bslCount: number;
    sslCount: number;
    lastSweep?: string;
    nearestTarget?: string;
  };

  pdArray: {
    zone: string;
    equilibrium: number;
    activeFvgCount: number;
    activeObCount: number;
  };

  displacement: {
    state: 'PRESENT' | 'ABSENT';
    lastBodyRatio: number;
    lastRangeMultiplier: number;
    bodyRatioThreshold: number;
    rangeMultiplierThreshold: number;
    lastCandleTimestamp?: number;
  };

  setup: {
    activeModelName: string;
    longStatus: SetupStatus;
    shortStatus: SetupStatus;
    status: SetupStatus;
    fulfilledConditions: string[];
    missingConditions: string[];
    invalidatedConditions: string[];
    target: string;
    invalidationReason?: string;
  };

  confluences: ICTConfluence[];
  setups: ICTSetup[];
}

export class MarketContextEngine {
  public buildContext(
    ltfState: ICTMarketState,
    ltfEvents: ICTEvent[],
    confluences: ICTConfluence[],
    setups: ICTSetup[],
    htfState?: ICTMarketState
  ): ICTMarketContext {
    const { symbol, timeframe: ltfTimeframe } = ltfState;
    const htfTimeframe = htfState ? htfState.timeframe : '1h';

    // Structure summary
    const lastBOS = ltfEvents.filter((e) => e.type === 'BOS').pop() as any;
    const lastMSS = ltfEvents.filter((e) => e.type === 'MSS').pop() as any;

    // Liquidity summary
    const bsl = ltfState.liquidityLevels.filter((l) => l.type === 'BSL');
    const ssl = ltfState.liquidityLevels.filter((l) => l.type === 'SSL');
    const lastSweep = ltfEvents.filter((e) => e.type === 'LIQUIDITY_SWEEP').pop() as any;
    const unswept = ltfState.liquidityLevels.filter((l) => !l.swept);

    // Displacement summary
    const dispEvents = ltfEvents.filter((e) => e.type === 'DISPLACEMENT') as any[];
    const lastDispEvent = dispEvents.pop();
    const hasDisplacement = !!lastDispEvent;

    // Setups
    const longSetup = setups.find((s) => s.direction === 'LONG');
    const shortSetup = setups.find((s) => s.direction === 'SHORT');
    const activeSetup = setups.find((s) => s.status === 'CONFIRMED' || s.status === 'FORMING') || setups[0];

    const targetStr = unswept.length > 0 ? `${unswept[0].type} @ $${unswept[0].price.toFixed(2)}` : 'None';

    return {
      symbol,
      htfTimeframe,
      ltfTimeframe,

      structure: {
        trend: ltfState.trend,
        lastBOS: lastBOS ? `${lastBOS.direction} @ $${lastBOS.breakPrice.toFixed(2)}` : 'None',
        lastMSS: lastMSS ? `${lastMSS.direction} @ $${lastMSS.breakPrice.toFixed(2)}` : 'None',
        structureState: `HTF (${htfState ? htfState.trend : 'SIDEWAYS'}) | LTF (${ltfState.trend})`,
      },

      liquidity: {
        bslCount: bsl.length,
        sslCount: ssl.length,
        lastSweep: lastSweep ? `${lastSweep.sweep.liquidityType} @ $${lastSweep.sweep.levelPrice.toFixed(2)}` : 'None',
        nearestTarget: targetStr,
      },

      pdArray: {
        zone: ltfState.dealingRange ? ltfState.dealingRange.currentZone : 'EQUILIBRIUM',
        equilibrium: ltfState.dealingRange ? ltfState.dealingRange.equilibrium : 0,
        activeFvgCount: ltfState.fairValueGaps.filter((f) => f.status === 'ACTIVE').length,
        activeObCount: ltfState.orderBlocks.filter((o) => o.status === 'UNTESTED').length,
      },

      displacement: {
        state: hasDisplacement ? 'PRESENT' : 'ABSENT',
        lastBodyRatio: lastDispEvent ? lastDispEvent.displacement.bodyRatio : 0,
        lastRangeMultiplier: lastDispEvent ? lastDispEvent.displacement.rangeMultiplier : 0,
        bodyRatioThreshold: 0.60,
        rangeMultiplierThreshold: 1.50,
        lastCandleTimestamp: lastDispEvent ? lastDispEvent.timestamp : undefined,
      },

      setup: {
        activeModelName: activeSetup ? activeSetup.evidence[0]?.replace('Model: ', '') || 'Model A' : 'None',
        longStatus: longSetup ? longSetup.status : 'WATCHING',
        shortStatus: shortSetup ? shortSetup.status : 'WATCHING',
        status: activeSetup ? activeSetup.status : 'WATCHING',
        fulfilledConditions: activeSetup ? activeSetup.fulfilledConfluences.map((c) => `✓ ${c}`) : [],
        missingConditions: activeSetup ? activeSetup.missingConfluences.map((c) => `○ ${c}`) : [],
        invalidatedConditions: activeSetup && activeSetup.invalidatingConditions ? activeSetup.invalidatingConditions.map((c) => `✕ ${c}`) : [],
        target: targetStr,
        invalidationReason: activeSetup && activeSetup.invalidatingConditions.length > 0 ? activeSetup.invalidatingConditions[0] : 'None',
      },

      confluences,
      setups,
    };
  }
}

