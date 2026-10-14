/**
 * Core Analyst - TradeSea Market Analyst Engine
 * Deterministic, point-in-time market analysis engine.
 * Evaluates Bullish and Bearish scenarios independently using factual ICT structures,
 * derives nearby and extended price targets, identifies structural invalidation levels,
 * and delegates to MarketRiskFilter for conservative directional selection.
 *
 * PURE READ-ONLY CONSUMER OF FROZEN ICT MODELS. Zero trading or execution paths.
 */

import { Candle } from '../market/Candle';
import { ICTMarketState } from '../ict/types/MarketState';
import { ICTEvent, BOSEvent, MSSEvent, LiquiditySweepEvent } from '../ict/types/ICTEvent';
import { ICTSetup } from '../ict/setups/SetupTypes';
import { CandidateContext } from '../ict/context/CandidateContextEngine';
import {
  MarketAnalysis,
  MarketScenario,
  PriceTarget,
  MarketRiskFilterConfig,
  DEFAULT_RISK_FILTER_CONFIG,
} from './MarketAnalystTypes';
import { MarketDataIntegrityValidator } from './MarketDataIntegrityValidator';
import { MarketRiskFilter } from './MarketRiskFilter';

export class MarketAnalystEngine {
  private integrityValidator: MarketDataIntegrityValidator;
  private riskFilter: MarketRiskFilter;

  constructor(config: Partial<MarketRiskFilterConfig> = {}) {
    const mergedConfig = { ...DEFAULT_RISK_FILTER_CONFIG, ...config };
    this.integrityValidator = new MarketDataIntegrityValidator(mergedConfig);
    this.riskFilter = new MarketRiskFilter(mergedConfig);
  }

  /**
   * Executes a complete point-in-time market analysis.
   */
  public analyze(
    candles: Candle[],
    state: ICTMarketState,
    events: ICTEvent[] = [],
    setups: ICTSetup[] = [],
    candidateContext?: CandidateContext,
    currentTimestampMs: number = Date.now()
  ): MarketAnalysis {
    const analysisId = `ANL_${state.symbol}_${state.timeframe}_${currentTimestampMs}`;
    const evaluatedAtIso = new Date(currentTimestampMs).toISOString();

    const dataQualityNotes: string[] = [];
    const uncertaintyNotes: string[] = [
      'Analysis provides qualitative decision support only; does not forecast deterministic outcomes.',
      'Historical S9.3 return autocorrelation (+0.7414) remains an unadjusted empirical limitation.',
      'Market conditions can invalidate structural assumptions instantaneously upon high-impact events.',
    ];

    // 1. Data Integrity and Freshness Check
    const integrity = this.integrityValidator.validate(candles, state.timeframe, currentTimestampMs);
    dataQualityNotes.push(...integrity.warnings);

    if (!integrity.valid) {
      dataQualityNotes.push(...integrity.errors);
      return {
        analysisId,
        instrument: state.symbol,
        timeframe: state.timeframe,
        evaluatedAt: evaluatedAtIso,
        evaluationTimestampMs: currentTimestampMs,
        latestMarketDataTimestamp: candles.length > 0 ? new Date(candles[candles.length - 1].timestamp).toISOString() : undefined,
        latestCandleTimestampMs: candles.length > 0 ? candles[candles.length - 1].timestamp : undefined,
        status: integrity.candleCount < this.riskFilter.getConfig().minLookbackCandles ? 'INSUFFICIENT_DATA' : 'ANALYSIS_ERROR',
        preferredDirection: 'INDETERMINATE',
        statusExplanation: `Data integrity validation failed: ${integrity.errors.join('; ')}`,
        dataQualityNotes,
        uncertaintyNotes,
        modelVersions: {
          ictEngine: '1.0.0 (Frozen CP30)',
          models: 'Models A, B, C (Frozen CP30)',
          analyst: '1.0.0 (CP92)',
        },
      };
    }

    if (integrity.stale) {
      return {
        analysisId,
        instrument: state.symbol,
        timeframe: state.timeframe,
        evaluatedAt: evaluatedAtIso,
        evaluationTimestampMs: currentTimestampMs,
        latestMarketDataTimestamp: new Date(candles[candles.length - 1].timestamp).toISOString(),
        latestCandleTimestampMs: candles[candles.length - 1].timestamp,
        status: 'STALE_MARKET_DATA',
        preferredDirection: 'INDETERMINATE',
        statusExplanation: `Market data is stale by ${Math.round(integrity.ageMs / 1000)} seconds (threshold: ${Math.round(
          this.riskFilter.getConfig().maxStaleDataMs / 1000
        )}s). Real-time analysis cannot proceed with stale prices.`,
        dataQualityNotes,
        uncertaintyNotes,
        modelVersions: {
          ictEngine: '1.0.0 (Frozen CP30)',
          models: 'Models A, B, C (Frozen CP30)',
          analyst: '1.0.0 (CP92)',
        },
      };
    }

    const latestCandle = candles[candles.length - 1];
    const referencePrice = latestCandle.close;

    // 2. Evaluate Bullish Scenario
    const bullishScenario = this.evaluateBullishScenario(referencePrice, state, events, setups, candidateContext);

    // 3. Evaluate Bearish Scenario
    const bearishScenario = this.evaluateBearishScenario(referencePrice, state, events, setups, candidateContext);

    // 4. Apply Risk Filter and Determine Preferred Direction
    const selection = this.riskFilter.selectPreferredScenario(bullishScenario, bearishScenario);

    return {
      analysisId,
      instrument: state.symbol,
      timeframe: state.timeframe,
      evaluatedAt: evaluatedAtIso,
      evaluationTimestampMs: currentTimestampMs,
      latestMarketDataTimestamp: new Date(latestCandle.timestamp).toISOString(),
      latestCandleTimestampMs: latestCandle.timestamp,
      status: selection.status,
      preferredDirection: selection.preferredDirection,
      statusExplanation: selection.explanation,
      bullishScenario,
      bearishScenario,
      selectedScenario: selection.selectedScenario,
      dataQualityNotes,
      uncertaintyNotes,
      modelVersions: {
        ictEngine: '1.0.0 (Frozen CP30)',
        models: 'Models A, B, C (Frozen CP30)',
        analyst: '1.0.0 (CP92)',
      },
    };
  }

  /**
   * Evaluates the Bullish hypothesis against existing ICT structures.
   */
  private evaluateBullishScenario(
    referencePrice: number,
    state: ICTMarketState,
    events: ICTEvent[],
    setups: ICTSetup[],
    candidateContext?: CandidateContext
  ): MarketScenario {
    const supportingEvidence: string[] = [];
    const conflictingEvidence: string[] = [];
    const conditionsRequired: string[] = [];
    const targetAccessibilityNotes: string[] = [];

    // Structural Trend
    if (state.trend === 'BULLISH') {
      supportingEvidence.push('Active market structure trend is Bullish (Higher Highs / Higher Lows)');
    } else if (state.trend === 'BEARISH') {
      conflictingEvidence.push('Active market structure trend is Bearish (Lower Highs / Lower Lows)');
    }

    // Structure Breaks (MSS & BOS)
    const recentEvents = events.slice(-15);
    const mssEvents = recentEvents.filter((e): e is MSSEvent => e.type === 'MSS');
    const bosEvents = recentEvents.filter((e): e is BOSEvent => e.type === 'BOS');

    const bullishMSS = mssEvents.find((e) => e.direction === 'BULLISH');
    const bearishMSS = mssEvents.find((e) => e.direction === 'BEARISH');
    const bullishBOS = bosEvents.find((e) => e.direction === 'BULLISH');
    const bearishBOS = bosEvents.find((e) => e.direction === 'BEARISH');

    if (bullishMSS) supportingEvidence.push(`Bullish Market Structure Shift confirmed at $${bullishMSS.breakPrice.toFixed(2)}`);
    if (bullishBOS) supportingEvidence.push(`Bullish Break of Structure confirmed at $${bullishBOS.breakPrice.toFixed(2)}`);
    if (bearishMSS) conflictingEvidence.push(`Opposing Bearish Market Structure Shift detected at $${bearishMSS.breakPrice.toFixed(2)}`);
    if (bearishBOS) conflictingEvidence.push(`Opposing Bearish Break of Structure detected at $${bearishBOS.breakPrice.toFixed(2)}`);

    // Setups (Models A/B/C)
    const longSetups = setups.filter((s) => s.direction === 'LONG');
    const confirmedLong = longSetups.find((s) => s.status === 'CONFIRMED');
    const formingLong = longSetups.find((s) => s.status === 'FORMING');

    if (confirmedLong) {
      supportingEvidence.push(`Confirmed Model Setup (${confirmedLong.id}) with confluences: ${confirmedLong.fulfilledConfluences.join(', ')}`);
    } else if (formingLong) {
      supportingEvidence.push(`Forming Model Setup (${formingLong.id}) with pending confluences: ${formingLong.missingConfluences.join(', ')}`);
      conditionsRequired.push(`Completion of pending confluences: ${formingLong.missingConfluences.join(', ')}`);
    }

    // Dealing Range (Premium vs Discount)
    if (state.dealingRange) {
      if (state.dealingRange.currentZone === 'DISCOUNT') {
        supportingEvidence.push(`Price is situated in Discount zone (${state.dealingRange.currentZone}) below equilibrium $${state.dealingRange.equilibrium.toFixed(2)}`);
      } else if (state.dealingRange.currentZone === 'PREMIUM') {
        conflictingEvidence.push(`Price is situated in Premium zone (${state.dealingRange.currentZone}) above equilibrium $${state.dealingRange.equilibrium.toFixed(2)}`);
      }
    }

    // Liquidity Sweeps
    const sweepEvents = recentEvents.filter((e): e is LiquiditySweepEvent => e.type === 'LIQUIDITY_SWEEP');
    const recentSweep = sweepEvents.length > 0 ? sweepEvents[sweepEvents.length - 1] : undefined;

    if (recentSweep && recentSweep.sweep.liquidityType === 'SSL') {
      supportingEvidence.push(`Recent Sell-Side Liquidity (SSL) sweep at $${recentSweep.sweep.extremePrice.toFixed(2)} indicates liquidity absorption`);
    } else if (recentSweep && recentSweep.sweep.liquidityType === 'BSL') {
      conflictingEvidence.push(`Recent Buy-Side Liquidity (BSL) sweep at $${recentSweep.sweep.extremePrice.toFixed(2)} may exhaust upward momentum`);
    }

    // Active FVGs
    const activeBullishFvgs = state.fairValueGaps.filter((f) => f.direction === 'BULLISH' && f.status === 'ACTIVE');
    if (activeBullishFvgs.length > 0) {
      supportingEvidence.push(`${activeBullishFvgs.length} active Bullish Fair Value Gap(s) providing potential support`);
    }

    // Context Integration (if supplied)
    if (candidateContext && candidateContext.displacement.state === 'PRESENT') {
      supportingEvidence.push(`Candidate Context indicates strong displacement (body ratio: ${(candidateContext.displacement.bodyRatio * 100).toFixed(0)}%)`);
    }

    // --- TARGET ESTIMATION ---
    let nearbyTarget: PriceTarget | undefined = undefined;
    let extendedTarget: PriceTarget | undefined = undefined;

    // 1. Nearby Target: Nearest un-swept BSL or Bearish FVG above reference price
    const unsweptBsl = state.liquidityLevels
      .filter((l) => l.type === 'BSL' && !l.swept && l.price > referencePrice)
      .sort((a, b) => a.price - b.price);

    const activeBearishFvgsAbove = state.fairValueGaps
      .filter((f) => f.direction === 'BEARISH' && f.status === 'ACTIVE' && f.lowPrice > referencePrice)
      .sort((a, b) => a.lowPrice - b.lowPrice);

    if (unsweptBsl.length > 0) {
      const targetBsl = unsweptBsl[0];
      nearbyTarget = {
        price: targetBsl.price,
        rationale: `First un-swept Buy-Side Liquidity pool above current price ($${targetBsl.price.toFixed(2)})`,
        structuralSource: 'LIQUIDITY_POOL',
      };
      targetAccessibilityNotes.push(`Direct path to BSL at $${targetBsl.price.toFixed(2)} with no intervening high-volume liquidity sweep`);

      // Extended Target from next higher BSL pool or swing high
      if (unsweptBsl.length > 1) {
        const extBsl = unsweptBsl[1];
        extendedTarget = {
          price: extBsl.price,
          rationale: `Secondary Buy-Side Liquidity pool ($${extBsl.price.toFixed(2)})`,
          structuralSource: 'LIQUIDITY_POOL',
        };
      } else if (state.activeSwingHigh && state.activeSwingHigh.price > targetBsl.price) {
        extendedTarget = {
          price: state.activeSwingHigh.price,
          rationale: `Major structural swing high extreme ($${state.activeSwingHigh.price.toFixed(2)})`,
          structuralSource: 'SWING_EXTREME',
        };
      }
    } else if (activeBearishFvgsAbove.length > 0) {
      const targetFvg = activeBearishFvgsAbove[0];
      nearbyTarget = {
        price: targetFvg.lowPrice,
        zoneLow: targetFvg.lowPrice,
        zoneHigh: targetFvg.highPrice,
        rationale: `Unmitigated Bearish Fair Value Gap lower boundary ($${targetFvg.lowPrice.toFixed(2)})`,
        structuralSource: 'FAIR_VALUE_GAP',
      };
      targetAccessibilityNotes.push(`Target is the mitigation boundary of FVG [$${targetFvg.lowPrice.toFixed(2)} - $${targetFvg.highPrice.toFixed(2)}]`);

      if (state.activeSwingHigh && state.activeSwingHigh.price > targetFvg.highPrice) {
        extendedTarget = {
          price: state.activeSwingHigh.price,
          rationale: `Structural swing high ($${state.activeSwingHigh.price.toFixed(2)}) beyond FVG zone`,
          structuralSource: 'SWING_EXTREME',
        };
      }
    } else if (state.activeSwingHigh && state.activeSwingHigh.price > referencePrice) {
      nearbyTarget = {
        price: state.activeSwingHigh.price,
        rationale: `Recent structural swing high ($${state.activeSwingHigh.price.toFixed(2)})`,
        structuralSource: 'SWING_EXTREME',
      };
    } else {
      targetAccessibilityNotes.push('No factual structural target identified above current reference price in available data');
    }

    // --- INVALIDATION ESTIMATION ---
    let invalidationLevel: number | undefined = undefined;
    let invalidationRationale: string | undefined = undefined;

    // Look for lowest swept SSL or active swing low below reference price
    if (recentSweep && recentSweep.sweep.liquidityType === 'SSL' && recentSweep.sweep.extremePrice < referencePrice) {
      invalidationLevel = recentSweep.sweep.extremePrice;
      invalidationRationale = `Liquidity sweep extreme ($${recentSweep.sweep.extremePrice.toFixed(2)}); a break below violates liquidity absorption thesis`;
    } else if (state.activeSwingLow && state.activeSwingLow.price < referencePrice) {
      invalidationLevel = state.activeSwingLow.price;
      invalidationRationale = `Active structural swing low ($${state.activeSwingLow.price.toFixed(2)}); price trading below invalidates bullish market structure`;
    } else {
      const swingsBelow = state.swings.filter((s) => s.type === 'SWING_LOW' && s.price < referencePrice).sort((a, b) => b.price - a.price);
      if (swingsBelow.length > 0) {
        invalidationLevel = swingsBelow[0].price;
        invalidationRationale = `Prior structural swing low ($${swingsBelow[0].price.toFixed(2)})`;
      }
    }

    const confidenceLabel = this.determineConfidenceLabel(supportingEvidence.length, conflictingEvidence.length, !!confirmedLong);

    return {
      direction: 'BULLISH',
      referencePrice,
      nearbyTarget,
      extendedTarget,
      invalidationLevel,
      invalidationRationale,
      supportingEvidence,
      conflictingEvidence,
      conditionsRequired,
      confidenceLabel,
      targetAccessibilityNotes,
    };
  }

  /**
   * Evaluates the Bearish hypothesis against existing ICT structures.
   */
  private evaluateBearishScenario(
    referencePrice: number,
    state: ICTMarketState,
    events: ICTEvent[],
    setups: ICTSetup[],
    candidateContext?: CandidateContext
  ): MarketScenario {
    const supportingEvidence: string[] = [];
    const conflictingEvidence: string[] = [];
    const conditionsRequired: string[] = [];
    const targetAccessibilityNotes: string[] = [];

    // Structural Trend
    if (state.trend === 'BEARISH') {
      supportingEvidence.push('Active market structure trend is Bearish (Lower Highs / Lower Lows)');
    } else if (state.trend === 'BULLISH') {
      conflictingEvidence.push('Active market structure trend is Bullish (Higher Highs / Higher Lows)');
    }

    // Structure Breaks (MSS & BOS)
    const recentEvents = events.slice(-15);
    const mssEvents = recentEvents.filter((e): e is MSSEvent => e.type === 'MSS');
    const bosEvents = recentEvents.filter((e): e is BOSEvent => e.type === 'BOS');

    const bearishMSS = mssEvents.find((e) => e.direction === 'BEARISH');
    const bullishMSS = mssEvents.find((e) => e.direction === 'BULLISH');
    const bearishBOS = bosEvents.find((e) => e.direction === 'BEARISH');
    const bullishBOS = bosEvents.find((e) => e.direction === 'BULLISH');

    if (bearishMSS) supportingEvidence.push(`Bearish Market Structure Shift confirmed at $${bearishMSS.breakPrice.toFixed(2)}`);
    if (bearishBOS) supportingEvidence.push(`Bearish Break of Structure confirmed at $${bearishBOS.breakPrice.toFixed(2)}`);
    if (bullishMSS) conflictingEvidence.push(`Opposing Bullish Market Structure Shift detected at $${bullishMSS.breakPrice.toFixed(2)}`);
    if (bullishBOS) conflictingEvidence.push(`Opposing Bullish Break of Structure detected at $${bullishBOS.breakPrice.toFixed(2)}`);

    // Setups (Models A/B/C)
    const shortSetups = setups.filter((s) => s.direction === 'SHORT');
    const confirmedShort = shortSetups.find((s) => s.status === 'CONFIRMED');
    const formingShort = shortSetups.find((s) => s.status === 'FORMING');

    if (confirmedShort) {
      supportingEvidence.push(`Confirmed Model Setup (${confirmedShort.id}) with confluences: ${confirmedShort.fulfilledConfluences.join(', ')}`);
    } else if (formingShort) {
      supportingEvidence.push(`Forming Model Setup (${formingShort.id}) with pending confluences: ${formingShort.missingConfluences.join(', ')}`);
      conditionsRequired.push(`Completion of pending confluences: ${formingShort.missingConfluences.join(', ')}`);
    }

    // Dealing Range (Premium vs Discount)
    if (state.dealingRange) {
      if (state.dealingRange.currentZone === 'PREMIUM') {
        supportingEvidence.push(`Price is situated in Premium zone (${state.dealingRange.currentZone}) above equilibrium $${state.dealingRange.equilibrium.toFixed(2)}`);
      } else if (state.dealingRange.currentZone === 'DISCOUNT') {
        conflictingEvidence.push(`Price is situated in Discount zone (${state.dealingRange.currentZone}) below equilibrium $${state.dealingRange.equilibrium.toFixed(2)}`);
      }
    }

    // Liquidity Sweeps
    const sweepEvents = recentEvents.filter((e): e is LiquiditySweepEvent => e.type === 'LIQUIDITY_SWEEP');
    const recentSweep = sweepEvents.length > 0 ? sweepEvents[sweepEvents.length - 1] : undefined;

    if (recentSweep && recentSweep.sweep.liquidityType === 'BSL') {
      supportingEvidence.push(`Recent Buy-Side Liquidity (BSL) sweep at $${recentSweep.sweep.extremePrice.toFixed(2)} indicates liquidity absorption`);
    } else if (recentSweep && recentSweep.sweep.liquidityType === 'SSL') {
      conflictingEvidence.push(`Recent Sell-Side Liquidity (SSL) sweep at $${recentSweep.sweep.extremePrice.toFixed(2)} may exhaust downward momentum`);
    }

    // Active FVGs
    const activeBearishFvgs = state.fairValueGaps.filter((f) => f.direction === 'BEARISH' && f.status === 'ACTIVE');
    if (activeBearishFvgs.length > 0) {
      supportingEvidence.push(`${activeBearishFvgs.length} active Bearish Fair Value Gap(s) providing potential resistance`);
    }

    // Context Integration (if supplied)
    if (candidateContext && candidateContext.displacement.state === 'PRESENT') {
      supportingEvidence.push(`Candidate Context indicates strong displacement (body ratio: ${(candidateContext.displacement.bodyRatio * 100).toFixed(0)}%)`);
    }

    // --- TARGET ESTIMATION ---
    let nearbyTarget: PriceTarget | undefined = undefined;
    let extendedTarget: PriceTarget | undefined = undefined;

    // 1. Nearby Target: Nearest un-swept SSL or Bullish FVG below reference price
    const unsweptSsl = state.liquidityLevels
      .filter((l) => l.type === 'SSL' && !l.swept && l.price < referencePrice)
      .sort((a, b) => b.price - a.price);

    const activeBullishFvgsBelow = state.fairValueGaps
      .filter((f) => f.direction === 'BULLISH' && f.status === 'ACTIVE' && f.highPrice < referencePrice)
      .sort((a, b) => b.highPrice - a.highPrice);

    if (unsweptSsl.length > 0) {
      const targetSsl = unsweptSsl[0];
      nearbyTarget = {
        price: targetSsl.price,
        rationale: `First un-swept Sell-Side Liquidity pool below current price ($${targetSsl.price.toFixed(2)})`,
        structuralSource: 'LIQUIDITY_POOL',
      };
      targetAccessibilityNotes.push(`Direct path to SSL at $${targetSsl.price.toFixed(2)} with no intervening high-volume liquidity sweep`);

      // Extended Target from next lower SSL pool or swing low
      if (unsweptSsl.length > 1) {
        const extSsl = unsweptSsl[1];
        extendedTarget = {
          price: extSsl.price,
          rationale: `Secondary Sell-Side Liquidity pool ($${extSsl.price.toFixed(2)})`,
          structuralSource: 'LIQUIDITY_POOL',
        };
      } else if (state.activeSwingLow && state.activeSwingLow.price < targetSsl.price) {
        extendedTarget = {
          price: state.activeSwingLow.price,
          rationale: `Major structural swing low extreme ($${state.activeSwingLow.price.toFixed(2)})`,
          structuralSource: 'SWING_EXTREME',
        };
      }
    } else if (activeBullishFvgsBelow.length > 0) {
      const targetFvg = activeBullishFvgsBelow[0];
      nearbyTarget = {
        price: targetFvg.highPrice,
        zoneLow: targetFvg.lowPrice,
        zoneHigh: targetFvg.highPrice,
        rationale: `Unmitigated Bullish Fair Value Gap upper boundary ($${targetFvg.highPrice.toFixed(2)})`,
        structuralSource: 'FAIR_VALUE_GAP',
      };
      targetAccessibilityNotes.push(`Target is the mitigation boundary of FVG [$${targetFvg.lowPrice.toFixed(2)} - $${targetFvg.highPrice.toFixed(2)}]`);

      if (state.activeSwingLow && state.activeSwingLow.price < targetFvg.lowPrice) {
        extendedTarget = {
          price: state.activeSwingLow.price,
          rationale: `Structural swing low ($${state.activeSwingLow.price.toFixed(2)}) beyond FVG zone`,
          structuralSource: 'SWING_EXTREME',
        };
      }
    } else if (state.activeSwingLow && state.activeSwingLow.price < referencePrice) {
      nearbyTarget = {
        price: state.activeSwingLow.price,
        rationale: `Recent structural swing low ($${state.activeSwingLow.price.toFixed(2)})`,
        structuralSource: 'SWING_EXTREME',
      };
    } else {
      targetAccessibilityNotes.push('No factual structural target identified below current reference price in available data');
    }

    // --- INVALIDATION ESTIMATION ---
    let invalidationLevel: number | undefined = undefined;
    let invalidationRationale: string | undefined = undefined;

    // Look for lowest swept BSL or active swing high above reference price
    if (recentSweep && recentSweep.sweep.liquidityType === 'BSL' && recentSweep.sweep.extremePrice > referencePrice) {
      invalidationLevel = recentSweep.sweep.extremePrice;
      invalidationRationale = `Liquidity sweep extreme ($${recentSweep.sweep.extremePrice.toFixed(2)}); a break above violates liquidity absorption thesis`;
    } else if (state.activeSwingHigh && state.activeSwingHigh.price > referencePrice) {
      invalidationLevel = state.activeSwingHigh.price;
      invalidationRationale = `Active structural swing high ($${state.activeSwingHigh.price.toFixed(2)}); price trading above invalidates bearish market structure`;
    } else {
      const swingsAbove = state.swings.filter((s) => s.type === 'SWING_HIGH' && s.price > referencePrice).sort((a, b) => a.price - b.price);
      if (swingsAbove.length > 0) {
        invalidationLevel = swingsAbove[0].price;
        invalidationRationale = `Prior structural swing high ($${swingsAbove[0].price.toFixed(2)})`;
      }
    }

    const confidenceLabel = this.determineConfidenceLabel(supportingEvidence.length, conflictingEvidence.length, !!confirmedShort);

    return {
      direction: 'BEARISH',
      referencePrice,
      nearbyTarget,
      extendedTarget,
      invalidationLevel,
      invalidationRationale,
      supportingEvidence,
      conflictingEvidence,
      conditionsRequired,
      confidenceLabel,
      targetAccessibilityNotes,
    };
  }

  private determineConfidenceLabel(supportingCount: number, conflictingCount: number, hasConfirmedSetup: boolean): 'LOW' | 'MODERATE' | 'HIGH' | 'NOT_CALIBRATED' {
    const net = supportingCount - conflictingCount;
    if (net >= 4 && hasConfirmedSetup) return 'HIGH';
    if (net >= 2) return 'MODERATE';
    if (net >= 1) return 'LOW';
    return 'NOT_CALIBRATED';
  }
}
