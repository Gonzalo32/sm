/**
 * ICT Model Validation Lab Engine - Empirical Validation & Snapshot Manager
 * Pure TypeScript, browser-independent orchestrator.
 * Maintains strict separation between Detection Layer and Validation Layer.
 */

import { Candle, Timeframe } from '../../market/Candle';
import { ICTEvent } from '../types/ICTEvent';
import {
  ValidationCase,
  ValidationEventType,
  ValidationStatus,
  DetectionReviewType,
  DisplacementSnapshot,
  SweepSnapshot,
  FVGSnapshot,
  StructureSnapshot,
  ValidationSummaryMetrics,
} from './ValidationTypes';

export class ValidationLabEngine {
  private cases: ValidationCase[] = [];
  private currentPointer: number = 0;
  private blindReviewMode: boolean = false;

  public setBlindReviewMode(enabled: boolean): void {
    this.blindReviewMode = enabled;
  }

  public isBlindReviewMode(): boolean {
    return this.blindReviewMode;
  }

  public generateStableCaseId(
    symbol: string,
    timeframe: Timeframe,
    eventType: ValidationEventType,
    timestamp: number
  ): string {
    return `VAL-${symbol}-${timeframe}-${eventType}-${timestamp}`;
  }

  /**
   * Generates a Detection Snapshot containing strictly information available at event timestamp.
   */
  public buildDetectionSnapshot(
    event: ICTEvent,
    candles: Candle[],
    candleIndex: number
  ): unknown {
    if (event.type === 'DISPLACEMENT') {
      const disp = (event as any).displacement;
      const lookback = 5;
      const startIdx = Math.max(0, candleIndex - lookback);
      const prevRanges: number[] = [];
      for (let j = startIdx; j < candleIndex; j++) {
        prevRanges.push(candles[j].high - candles[j].low);
      }
      const range = disp.highPrice - disp.lowPrice;
      const body = Math.abs(disp.closePrice - disp.openPrice);

      const snapshot: DisplacementSnapshot = {
        currentRange: range,
        currentBody: body,
        bodyRatio: disp.bodyRatio,
        averagePreviousRange: prevRanges.length > 0 ? prevRanges.reduce((a, b) => a + b, 0) / prevRanges.length : 0,
        rangeMultiplier: disp.rangeMultiplier,
        N: lookback,
        previousRanges: prevRanges,
      };
      return Object.freeze(snapshot);
    }

    if (event.type === 'LIQUIDITY_SWEEP') {
      const sw = (event as any).sweep;
      const snapshot: SweepSnapshot = {
        liquidityType: sw.liquidityType,
        levelPrice: sw.levelPrice,
        extremePrice: sw.extremePrice,
        closePrice: candles[candleIndex] ? candles[candleIndex].close : sw.levelPrice,
        penetration: Math.abs(sw.extremePrice - sw.levelPrice),
        closeBackInside: true,
        minimumPenetration: 0.1,
      };
      return Object.freeze(snapshot);
    }

    if (event.type === 'FVG_CREATED') {
      const fvg = (event as any).fvg;
      const snapshot: FVGSnapshot = {
        candle1High: fvg ? fvg.highPrice : 0,
        candle1Low: fvg ? fvg.lowPrice : 0,
        candle2High: candles[candleIndex] ? candles[candleIndex].high : 0,
        candle2Low: candles[candleIndex] ? candles[candleIndex].low : 0,
        candle3High: candles[candleIndex] ? candles[candleIndex].high : 0,
        candle3Low: candles[candleIndex] ? candles[candleIndex].low : 0,
        gapSize: fvg ? Math.abs(fvg.highPrice - fvg.lowPrice) : 0,
        direction: fvg ? fvg.direction : 'BULLISH',
      };
      return Object.freeze(snapshot);
    }

    if (event.type === 'BOS' || event.type === 'MSS') {
      const struct = event as any;
      const snapshot: StructureSnapshot = {
        previousTrend: struct.priorTrend || 'SIDEWAYS',
        newTrend: struct.direction,
        brokenLevel: struct.brokenSwing.price,
        breakMode: 'CLOSE',
        breakPrice: struct.breakPrice,
        eventTimestamp: struct.eventTimestamp,
        confirmationTimestamp: struct.confirmationTimestamp,
        penetration: Math.abs(struct.breakPrice - struct.brokenSwing.price),
      };
      return Object.freeze(snapshot);
    }

    return Object.freeze({
      eventType: event.type,
      candleIndex,
      timestamp: event.timestamp,
    });
  }

  /**
   * Creates a positive validation case from a detected event.
   */
  public registerPositiveCase(
    event: ICTEvent,
    candles: Candle[],
    symbol: string,
    timeframe: Timeframe
  ): ValidationCase {
    const caseId = this.generateStableCaseId(
      symbol,
      timeframe,
      event.type as ValidationEventType,
      event.timestamp
    );

    const snapshot = this.buildDetectionSnapshot(event, candles, event.candleIndex);

    const valCase: ValidationCase = {
      caseId,
      symbol,
      timeframe,
      eventType: event.type as ValidationEventType,
      eventTimestamp: event.eventTimestamp || event.timestamp,
      confirmationTimestamp: event.confirmationTimestamp || event.timestamp,
      eventIndex: event.candleIndex,
      detectionSnapshot: snapshot,
      validationStatus: 'UNREVIEWED',
      detectionReviewType: 'NONE',
      isNegativeCase: false,
    };

    const existingIdx = this.cases.findIndex((c) => c.caseId === caseId);
    if (existingIdx >= 0) {
      this.cases[existingIdx] = valCase;
    } else {
      this.cases.push(valCase);
    }

    return valCase;
  }

  /**
   * Creates a negative validation case where an event candidate occurred but NO event was emitted.
   */
  public registerNegativeCase(
    symbol: string,
    timeframe: Timeframe,
    eventIndex: number,
    timestamp: number,
    expectedEvent: ValidationEventType,
    candidateSnapshot: unknown,
    reason: string
  ): ValidationCase {
    const caseId = this.generateStableCaseId(symbol, timeframe, 'NONE', timestamp);

    const valCase: ValidationCase = {
      caseId,
      symbol,
      timeframe,
      eventType: 'NONE',
      eventTimestamp: timestamp,
      confirmationTimestamp: timestamp,
      eventIndex,
      detectionSnapshot: candidateSnapshot,
      validationStatus: 'UNREVIEWED',
      detectionReviewType: 'NONE',
      validationReason: reason,
      isNegativeCase: true,
      expectedEvent,
    };

    const existingIdx = this.cases.findIndex((c) => c.caseId === caseId);
    if (existingIdx >= 0) {
      this.cases[existingIdx] = valCase;
    } else {
      this.cases.push(valCase);
    }

    return valCase;
  }

  /**
   * Reviews a validation case WITHOUT mutating any detection event, timestamp, or snapshot.
   */
  public reviewCase(
    caseId: string,
    status: ValidationStatus,
    reason?: string,
    notes?: string,
    reviewer: string = 'HumanAuditor',
    detectionReviewType: DetectionReviewType = 'NONE'
  ): ValidationCase | undefined {
    const targetCase = this.cases.find((c) => c.caseId === caseId);
    if (!targetCase) return undefined;

    targetCase.validationStatus = status;
    targetCase.detectionReviewType = detectionReviewType;
    if (reason) targetCase.validationReason = reason;
    if (notes) targetCase.notes = notes;
    targetCase.reviewer = reviewer;
    targetCase.reviewTimestamp = Date.now();

    return targetCase;
  }

  public loadCases(cases: ValidationCase[]): void {
    for (const c of cases) {
      const clonedCase = { ...c };
      if (clonedCase.detectionSnapshot && typeof clonedCase.detectionSnapshot === 'object') {
        clonedCase.detectionSnapshot = Object.freeze({ ...(clonedCase.detectionSnapshot as object) });
      }
      const existingIdx = this.cases.findIndex((item) => item.caseId === clonedCase.caseId);
      if (existingIdx >= 0) {
        this.cases[existingIdx] = clonedCase;
      } else {
        this.cases.push(clonedCase);
      }
    }
  }

  public clearCases(): void {
    this.cases = [];
    this.currentPointer = 0;
  }

  public toJSON(): string {
    return JSON.stringify({
      cases: this.cases,
      currentPointer: this.currentPointer,
      blindReviewMode: this.blindReviewMode,
    }, null, 2);
  }

  public static fromJSON(jsonString: string): ValidationLabEngine {
    const engine = new ValidationLabEngine();
    const data = JSON.parse(jsonString);
    if (data && Array.isArray(data.cases)) {
      engine.loadCases(data.cases);
      if (typeof data.currentPointer === 'number') {
        engine.currentPointer = data.currentPointer;
      }
      if (typeof data.blindReviewMode === 'boolean') {
        engine.setBlindReviewMode(data.blindReviewMode);
      }
    }
    return engine;
  }

  public getCases(): ValidationCase[] {
    return this.cases.map((c) => {
      const cloned = { ...c };
      if (this.blindReviewMode) {
        cloned.validationStatus = 'UNREVIEWED';
        cloned.validationReason = undefined;
        cloned.notes = undefined;
      }
      return cloned;
    });
  }

  public getCaseById(caseId: string): ValidationCase | undefined {
    const c = this.cases.find((item) => item.caseId === caseId);
    if (!c) return undefined;
    const cloned = { ...c };
    if (this.blindReviewMode) {
      cloned.validationStatus = 'UNREVIEWED';
      cloned.validationReason = undefined;
      cloned.notes = undefined;
    }
    return cloned;
  }

  public getCurrentCase(): ValidationCase | undefined {
    if (this.cases.length === 0) return undefined;
    return this.getCaseById(this.cases[this.currentPointer].caseId);
  }

  public nextCase(): ValidationCase | undefined {
    if (this.cases.length === 0) return undefined;
    this.currentPointer = (this.currentPointer + 1) % this.cases.length;
    return this.getCurrentCase();
  }

  public previousCase(): ValidationCase | undefined {
    if (this.cases.length === 0) return undefined;
    this.currentPointer = (this.currentPointer - 1 + this.cases.length) % this.cases.length;
    return this.getCurrentCase();
  }

  public filterCases(
    symbol?: string,
    timeframe?: Timeframe,
    eventType?: ValidationEventType,
    status?: ValidationStatus,
    reviewType?: DetectionReviewType
  ): ValidationCase[] {
    return this.cases.filter((c) => {
      if (symbol && c.symbol !== symbol) return false;
      if (timeframe && c.timeframe !== timeframe) return false;
      if (eventType && c.eventType !== eventType) return false;
      if (status && c.validationStatus !== status) return false;
      if (reviewType && c.detectionReviewType !== reviewType) return false;
      return true;
    });
  }

  public getBorderlineBreaks(): ValidationCase[] {
    return this.cases.filter((c) => c.isBorderlineBreak || c.notes?.toLowerCase().includes('borderline break') || c.validationReason?.toLowerCase().includes('borderline break'));
  }

  public getBorderlineDisplacements(): ValidationCase[] {
    return this.cases.filter((c) => c.isBorderlineDisplacement || c.notes?.toLowerCase().includes('borderline displacement') || c.validationReason?.toLowerCase().includes('borderline displacement'));
  }

  public computeMetricsSummary(): ValidationSummaryMetrics {
    const totalCases = this.cases.length;
    const positiveCasesCount = this.cases.filter((c) => !c.isNegativeCase).length;
    const negativeCasesCount = this.cases.filter((c) => c.isNegativeCase).length;
    const unreviewedCount = this.cases.filter((c) => c.validationStatus === 'UNREVIEWED').length;
    const clearCount = this.cases.filter((c) => c.validationStatus === 'CLEAR').length;
    const borderlineCount = this.cases.filter((c) => c.validationStatus === 'BORDERLINE').length;
    const questionableCount = this.cases.filter((c) => c.validationStatus === 'QUESTIONABLE').length;

    const detectionReviewCount = this.cases.filter((c) => c.detectionReviewType === 'DETECTION_REVIEW').length;
    const conceptReviewCount = this.cases.filter((c) => c.detectionReviewType === 'CONCEPT_REVIEW').length;
    const noneReviewCount = this.cases.filter((c) => !c.detectionReviewType || c.detectionReviewType === 'NONE').length;

    const borderlineMSSBOSCount = this.getBorderlineBreaks().length;
    const borderlineDisplacementCount = this.getBorderlineDisplacements().length;

    // Agreements: Clear positive or Clear negative
    const agreementsCount = this.cases.filter(
      (c) => (!c.isNegativeCase && c.validationStatus === 'CLEAR') || (c.isNegativeCase && c.validationStatus === 'CLEAR')
    ).length;

    // Disagreements: Questionable positive or Questionable negative
    const disagreementsCount = this.cases.filter(
      (c) => (!c.isNegativeCase && c.validationStatus === 'QUESTIONABLE') || (c.isNegativeCase && c.validationStatus === 'QUESTIONABLE')
    ).length;

    const byEvent: Record<string, any> = {};

    for (const c of this.cases) {
      const key = String(c.eventType);
      if (!byEvent[key]) {
        byEvent[key] = { positive: 0, negative: 0, unreviewed: 0, clear: 0, borderline: 0, questionable: 0, detectionReview: 0, conceptReview: 0 };
      }
      if (c.isNegativeCase) byEvent[key].negative++;
      else byEvent[key].positive++;

      if (c.validationStatus === 'UNREVIEWED') byEvent[key].unreviewed++;
      else if (c.validationStatus === 'CLEAR') byEvent[key].clear++;
      else if (c.validationStatus === 'BORDERLINE') byEvent[key].borderline++;
      else if (c.validationStatus === 'QUESTIONABLE') byEvent[key].questionable++;

      if (c.detectionReviewType === 'DETECTION_REVIEW') byEvent[key].detectionReview++;
      else if (c.detectionReviewType === 'CONCEPT_REVIEW') byEvent[key].conceptReview++;
    }

    const stratifiedMatrix: Record<string, any> = {};
    const symbols = ['MNQ', 'NQ'];
    const timeframes: Timeframe[] = ['1m', '5m', '15m'];
    const eventTypes: ValidationEventType[] = ['BOS', 'MSS', 'LIQUIDITY_SWEEP', 'FVG_CREATED', 'ORDER_BLOCK_CREATED', 'DISPLACEMENT', 'SETUP'];

    for (const sym of symbols) {
      for (const tf of timeframes) {
        for (const ev of eventTypes) {
          const key = `${ev} × ${sym} × ${tf}`;
          const matches = this.cases.filter((c) => c.symbol === sym && c.timeframe === tf && (c.eventType === ev || c.expectedEvent === ev));
          const reviewed = matches.filter((c) => c.validationStatus !== 'UNREVIEWED').length;
          stratifiedMatrix[key] = {
            available: matches.length,
            selected: matches.length,
            reviewed,
            insufficient: matches.length < 3,
          };
        }
      }
    }

    return {
      totalCases,
      positiveCasesCount,
      negativeCasesCount,
      unreviewedCount,
      clearCount,
      borderlineCount,
      questionableCount,
      agreementsCount,
      disagreementsCount,
      detectionReviewCount,
      conceptReviewCount,
      noneReviewCount,
      borderlineMSSBOSCount,
      borderlineDisplacementCount,
      byEvent,
      stratifiedMatrix,
    };
  }
}
