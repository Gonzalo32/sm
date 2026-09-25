/**
 * ICT Audit Engine - Collector, Categorizer & Metrics Generator
 * Analyzes market events deterministically without altering core rules.
 * Generates descriptive audit records and summary metrics.
 */

import { Candle, Timeframe } from '../../market/Candle';
import { ICTEngineResult } from '../engine/ICTEngine';
import { ICTMarketState } from '../types/MarketState';
import { ICTEvent } from '../types/ICTEvent';
import { ICTSetup } from '../setups/SetupTypes';
import {
  DisplacementAuditRecord,
  SweepAuditRecord,
  FVGAuditRecord,
  StructureAuditRecord,
  SetupAuditRecord,
  AuditMetricsSummary,
  AuditClassification,
  AuditCaseType,
} from './AuditTypes';

export class AuditEngine {
  /**
   * Audits Displacement events and classifies them into CLEAR, BORDERLINE, or QUESTIONABLE.
   */
  public auditDisplacements(
    candles: Candle[],
    events: ICTEvent[],
    symbol: string,
    timeframe: Timeframe
  ): DisplacementAuditRecord[] {
    const records: DisplacementAuditRecord[] = [];
    const dispEvents = events.filter((e) => e.type === 'DISPLACEMENT') as any[];

    const structEvents = events.filter((e) => e.type === 'BOS' || e.type === 'MSS');
    const fvgEvents = events.filter((e) => e.type === 'FVG_CREATED');

    for (const e of dispEvents) {
      const disp = e.displacement;
      const cIdx = disp.candleIndex;

      // Calculate preceding 5 candles average range
      let totalPrecedingRange = 0;
      const lookback = 5;
      const startIdx = Math.max(0, cIdx - lookback);
      const count = cIdx - startIdx;
      for (let j = startIdx; j < cIdx; j++) {
        totalPrecedingRange += candles[j].high - candles[j].low;
      }
      const avgPrevRange = count > 0 ? totalPrecedingRange / count : 0;
      const range = disp.highPrice - disp.lowPrice;

      const hasStructBreak = structEvents.some((s) => Math.abs(s.candleIndex - cIdx) <= 1);
      const hasFvg = fvgEvents.some((f) => Math.abs(f.candleIndex - cIdx) <= 1);

      let classification: AuditClassification = 'CLEAR';
      let notes = 'Strong quantifiable displacement with body & range expansion.';

      if (!hasStructBreak && !hasFvg && disp.rangeMultiplier < 1.8) {
        classification = 'QUESTIONABLE';
        notes = 'Isolated range expansion without immediate structural break or FVG creation.';
      } else if (disp.bodyRatio < 0.65 || disp.rangeMultiplier < 1.8) {
        classification = 'BORDERLINE';
        notes = 'Meets threshold (≥0.60, ≥1.5x) but close to lower boundary values.';
      }

      records.push({
        auditCaseId: `CASE-DISP-${symbol}-${timeframe}-${disp.timestamp}`,
        id: `AUD-DISP-${disp.id}`,
        symbol,
        timeframe,
        timestamp: disp.timestamp,
        open: disp.openPrice,
        high: disp.highPrice,
        low: disp.lowPrice,
        close: disp.closePrice,
        bodyRatio: disp.bodyRatio,
        range,
        averagePreviousRange: avgPrevRange,
        rangeMultiplier: disp.rangeMultiplier,
        direction: disp.direction,
        detectionType: 'MATHEMATICAL_TRUTH',
        evaluationType: 'POST_EVENT_EVALUATION',
        classification,
        hasStructuralBreak: hasStructBreak,
        hasFvgCreated: hasFvg,
        notes,
      });
    }

    return records;
  }

  /**
   * Audits Liquidity Sweeps and distinguishes Sweeps vs Breakouts.
   */
  public auditSweeps(
    events: ICTEvent[],
    symbol: string,
    timeframe: Timeframe
  ): SweepAuditRecord[] {
    const records: SweepAuditRecord[] = [];
    const sweepEvents = events.filter((e) => e.type === 'LIQUIDITY_SWEEP') as any[];

    for (const e of sweepEvents) {
      const sw = e.sweep;
      const penetration = Math.abs(sw.extremePrice - sw.levelPrice);
      const isBreakout = penetration > 15.0; // Deep penetration beyond wick sweep

      let classification: AuditClassification = 'CLEAR';
      let notes = 'Liquidity level penetrated with price reaction.';

      if (isBreakout) {
        classification = 'QUESTIONABLE';
        notes = 'Deep penetration indicates potential breakout rather than swift wick sweep.';
      } else if (penetration < 1.0) {
        classification = 'BORDERLINE';
        notes = 'Micro-penetration of liquidity level.';
      }

      records.push({
        auditCaseId: `CASE-SWEEP-${symbol}-${timeframe}-${e.timestamp}`,
        id: `AUD-SWEEP-${sw.id}`,
        symbol,
        timeframe,
        timestamp: e.timestamp,
        liquidityType: sw.liquidityType,
        levelPrice: sw.levelPrice,
        extremePrice: sw.extremePrice,
        closePrice: e.sweep ? sw.extremePrice : sw.levelPrice,
        penetration,
        isBreakout,
        classification,
        notes,
      });
    }

    return records;
  }

  /**
   * Audits Fair Value Gaps (FVG) and lifecycle status.
   */
  public auditFVGs(
    state: ICTMarketState,
    symbol: string,
    timeframe: Timeframe
  ): FVGAuditRecord[] {
    const records: FVGAuditRecord[] = [];

    for (const fvg of state.fairValueGaps) {
      const gapSize = Math.abs(fvg.highPrice - fvg.lowPrice);
      let classification: AuditClassification = 'CLEAR';
      let notes = 'Valid 3-candle imbalance gap.';

      if (gapSize < 1.0) {
        classification = 'BORDERLINE';
        notes = 'Small gap size near minimum noise floor.';
      }

      records.push({
        auditCaseId: `CASE-FVG-${symbol}-${timeframe}-${fvg.candle3Timestamp}`,
        id: `AUD-FVG-${fvg.id}`,
        symbol,
        timeframe,
        createdTimestamp: fvg.candle3Timestamp,
        direction: fvg.direction,
        highPrice: fvg.highPrice,
        lowPrice: fvg.lowPrice,
        gapSize,
        status: fvg.status,
        classification,
        notes,
      });
    }

    return records;
  }

  /**
   * Audits Market Structure events (BOS & MSS).
   */
  public auditStructure(
    events: ICTEvent[],
    symbol: string,
    timeframe: Timeframe
  ): StructureAuditRecord[] {
    const records: StructureAuditRecord[] = [];
    const structEvents = events.filter((e) => e.type === 'BOS' || e.type === 'MSS') as any[];

    for (const s of structEvents) {
      const isMSS = s.type === 'MSS';
      records.push({
        auditCaseId: `CASE-STRUCT-${symbol}-${timeframe}-${s.timestamp}`,
        id: `AUD-STRUCT-${s.type}-${s.candleIndex}-${s.breakPrice}`,
        symbol,
        timeframe,
        timestamp: s.timestamp,
        type: s.type,
        direction: s.direction,
        brokenSwingPrice: s.brokenSwing.price,
        breakPrice: s.breakPrice,
        breakMode: 'CLOSE',
        priorTrend: isMSS ? s.priorTrend : s.direction === 'BULLISH' ? 'BULLISH' : 'BEARISH',
        newTrend: s.direction,
        eventTimestamp: s.eventTimestamp,
        confirmationTimestamp: s.confirmationTimestamp,
        classification: 'CLEAR',
        notes: isMSS ? 'Trend reversal market structure shift.' : 'Trend continuation break of structure.',
      });
    }

    return records;
  }

  /**
   * Audits Setup Model state machine evaluations and classifies cases into A, B, C.
   */
  public auditSetups(
    setups: ICTSetup[],
    symbol: string,
    timeframe: Timeframe
  ): SetupAuditRecord[] {
    const records: SetupAuditRecord[] = [];

    for (const setup of setups) {
      let caseType: AuditCaseType = 'CASE_A_COHERENT';
      let notes = 'Setup state machine evaluated deterministically.';

      if (setup.status === 'CONFIRMED' && setup.fulfilledConfluences.length < 3) {
        caseType = 'CASE_B_CONFIRMED_QUESTIONABLE';
        notes = 'Confirmed setup with minimal confluences.';
      } else if (setup.status === 'FORMING' && setup.fulfilledConfluences.length >= 1) {
        caseType = 'CASE_C_UNCONFIRMED_INTERESTING';
        notes = 'Forming setup with partial confluence accumulation, waiting for final rule.';
      }

      records.push({
        auditCaseId: `CASE-SETUP-${symbol}-${timeframe}-${setup.activatedTimestamp}`,
        id: `AUD-SETUP-${setup.id}`,
        symbol,
        timeframe,
        modelId: setup.id.split('-')[1] || 'MODEL',
        direction: setup.direction,
        status: setup.status,
        fulfilledConditions: setup.fulfilledConfluences.map((c) => String(c)),
        missingConditions: setup.missingConfluences.map((c) => String(c)),
        invalidatingConditions: setup.invalidatingConditions,
        activatedTimestamp: setup.activatedTimestamp,
        target: 'Liquidity Target',
        caseType,
        notes,
      });
    }

    return records;
  }

  /**
   * Generates descriptive statistics summary metrics.
   */
  public generateMetricsSummary(
    candles: Candle[],
    engineResult: ICTEngineResult,
    setups: ICTSetup[],
    symbol: string = 'MNQ',
    timeframe: Timeframe = '1m'
  ): AuditMetricsSummary {
    const dispRecords = this.auditDisplacements(candles, engineResult.events, symbol, timeframe);
    const sweepRecords = this.auditSweeps(engineResult.events, symbol, timeframe);
    const fvgRecords = this.auditFVGs(engineResult.state, symbol, timeframe);
    const structRecords = this.auditStructure(engineResult.events, symbol, timeframe);
    const setupRecords = this.auditSetups(setups, symbol, timeframe);

    return {
      sampleSizeCandles: candles.length,
      symbolsAudited: [symbol],
      timeframesAudited: [timeframe],
      displacement: {
        total: dispRecords.length,
        clear: dispRecords.filter((d) => d.classification === 'CLEAR').length,
        borderline: dispRecords.filter((d) => d.classification === 'BORDERLINE').length,
        questionable: dispRecords.filter((d) => d.classification === 'QUESTIONABLE').length,
        apparentFalsePositives: dispRecords.filter((d) => d.classification === 'QUESTIONABLE').length,
        apparentFalseNegatives: 0,
      },
      sweeps: {
        total: sweepRecords.length,
        confirmedSweeps: sweepRecords.filter((s) => !s.isBreakout).length,
        falseSweepsBreakouts: sweepRecords.filter((s) => s.isBreakout).length,
      },
      fvgs: {
        total: fvgRecords.length,
        active: fvgRecords.filter((f) => f.status === 'ACTIVE').length,
        partiallyMitigated: fvgRecords.filter((f) => f.status === 'PARTIALLY_MITIGATED').length,
        fullyMitigated: fvgRecords.filter((f) => f.status === 'FULLY_MITIGATED').length,
        invalidated: fvgRecords.filter((f) => f.status === 'INVALIDATED').length,
      },
      structure: {
        totalBOS: structRecords.filter((s) => s.type === 'BOS').length,
        totalMSS: structRecords.filter((s) => s.type === 'MSS').length,
        bullishBOS: structRecords.filter((s) => s.type === 'BOS' && s.direction === 'BULLISH').length,
        bearishBOS: structRecords.filter((s) => s.type === 'BOS' && s.direction === 'BEARISH').length,
        bullishMSS: structRecords.filter((s) => s.type === 'MSS' && s.direction === 'BULLISH').length,
        bearishMSS: structRecords.filter((s) => s.type === 'MSS' && s.direction === 'BEARISH').length,
      },
      setups: {
        watching: setupRecords.filter((s) => s.status === 'WATCHING').length,
        forming: setupRecords.filter((s) => s.status === 'FORMING').length,
        confirmed: setupRecords.filter((s) => s.status === 'CONFIRMED').length,
        invalidated: setupRecords.filter((s) => s.status === 'INVALIDATED').length,
        expired: setupRecords.filter((s) => s.status === 'EXPIRED').length,
        completed: setupRecords.filter((s) => s.status === 'COMPLETED').length,
        caseACoherent: setupRecords.filter((s) => s.caseType === 'CASE_A_COHERENT').length,
        caseBConfirmedQuestionable: setupRecords.filter((s) => s.caseType === 'CASE_B_CONFIRMED_QUESTIONABLE').length,
        caseCUnconfirmedInteresting: setupRecords.filter((s) => s.caseType === 'CASE_C_UNCONFIRMED_INTERESTING').length,
      },
    };
  }
}
