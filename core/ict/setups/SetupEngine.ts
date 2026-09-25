/**
 * ICT Setup Engine - Configurable Model State Machine Manager
 * Evaluates declarative ICTSetupModels without hardcoded rules.
 */

import { ICTMarketState } from '../types/MarketState';
import { ICTEvent } from '../types/ICTEvent';
import { ICTConfluence } from '../confluence/ConfluenceTypes';
import { ICTSetup, SetupStatus } from './SetupTypes';
import { ICTSetupModel, ExtendedConditionType } from '../models/ICTSetupModel';
import { PREDEFINED_MODELS } from '../models/PredefinedModels';

export class SetupEngine {
  private registeredModels: ICTSetupModel[];

  constructor(models?: ICTSetupModel[]) {
    this.registeredModels = models && models.length > 0 ? models : PREDEFINED_MODELS;
  }

  public registerModel(model: ICTSetupModel): void {
    this.registeredModels.push(model);
  }

  /**
   * Evaluates all registered declarative ICTSetupModels deterministically.
   */
  public evaluateSetups(
    state: ICTMarketState,
    events: ICTEvent[],
    confluences: ICTConfluence[]
  ): ICTSetup[] {
    const setups: ICTSetup[] = [];
    const { symbol, timeframe, lastUpdatedTimestamp, lastCandleIndex } = state;

    // Collect all present event and confluence types along with their timestamps & candleIndices
    const activeConditionMap = new Map<ExtendedConditionType, { timestamp: number; candleIndex: number }>();

    // Collect active condition timestamps & candleIndices from events first
    for (const e of events) {
      activeConditionMap.set(e.type as ExtendedConditionType, {
        timestamp: e.confirmationTimestamp,
        candleIndex: e.candleIndex,
      });

      // Map event types to confluence alias keys
      if (e.type === 'FVG_CREATED') {
        activeConditionMap.set('FVG_CONFLUENCE', { timestamp: e.confirmationTimestamp, candleIndex: e.candleIndex });
      } else if (e.type === 'ORDER_BLOCK_CREATED') {
        activeConditionMap.set('ORDER_BLOCK_CONFLUENCE', { timestamp: e.confirmationTimestamp, candleIndex: e.candleIndex });
      } else if (e.type === 'MSS') {
        activeConditionMap.set('MSS_CONFIRMED', { timestamp: e.confirmationTimestamp, candleIndex: e.candleIndex });
      } else if (e.type === 'BOS') {
        activeConditionMap.set('BOS_CONFIRMED', { timestamp: e.confirmationTimestamp, candleIndex: e.candleIndex });
      }
    }

    for (const c of confluences) {
      if (c.status === 'PRESENT' && !activeConditionMap.has(c.type)) {
        activeConditionMap.set(c.type, { timestamp: c.timestamp, candleIndex: lastCandleIndex });
      }
    }

    for (const model of this.registeredModels) {
      const requiredConditions = model.conditions.filter((c) => c.category === 'REQUIRED');

      const fulfilledRequired: ExtendedConditionType[] = [];
      const missingRequired: ExtendedConditionType[] = [];
      const fulfilledIndices: number[] = [];
      const fulfilledTimestamps: number[] = [];

      let isOrderedValid = true;

      for (let idx = 0; idx < requiredConditions.length; idx++) {
        const cond = requiredConditions[idx];
        const match = activeConditionMap.get(cond.type);

        if (match) {
          fulfilledRequired.push(cond.type);
          fulfilledIndices.push(match.candleIndex);
          fulfilledTimestamps.push(match.timestamp);

          if (model.sequenceMode === 'ORDERED' && idx > 0) {
            const prevMatch = activeConditionMap.get(requiredConditions[idx - 1].type);
            if (prevMatch && match.timestamp < prevMatch.timestamp) {
              isOrderedValid = false;
            }
          }
        } else {
          missingRequired.push(cond.type);
        }
      }

      // Check maxBarsBetweenConditions constraint
      let isWithinMaxBars = true;
      if (fulfilledIndices.length > 1) {
        const barSpan = Math.max(...fulfilledIndices) - Math.min(...fulfilledIndices);
        if (barSpan > model.maxBarsBetweenConditions) {
          isWithinMaxBars = false;
        }
      }

      // Check invalidation
      const isInvalidatedByTrend =
        (model.direction === 'LONG' && state.trend === 'BEARISH' && events.some((e) => e.type === 'BOS' && e.direction === 'BEARISH')) ||
        (model.direction === 'SHORT' && state.trend === 'BULLISH' && events.some((e) => e.type === 'BOS' && e.direction === 'BULLISH'));

      let status: SetupStatus = 'WATCHING';
      if (isInvalidatedByTrend || !isOrderedValid || !isWithinMaxBars) {
        status = isInvalidatedByTrend ? 'INVALIDATED' : 'EXPIRED';
      } else if (missingRequired.length === 0) {
        status = 'CONFIRMED';
      } else if (fulfilledRequired.length > 0) {
        status = 'FORMING';
      }

      const setup: ICTSetup = {
        id: `SETUP-${model.id}-${symbol}-${timeframe}-${lastUpdatedTimestamp}`,
        symbol,
        timeframe,
        direction: model.direction,
        status,
        activatedTimestamp: lastUpdatedTimestamp,
        confirmedTimestamp: status === 'CONFIRMED' ? lastUpdatedTimestamp : undefined,
        invalidatedTimestamp: status === 'INVALIDATED' ? lastUpdatedTimestamp : undefined,
        mandatoryConfluences: requiredConditions.map((c) => c.type as any),
        fulfilledConfluences: fulfilledRequired.map((c) => c as any),
        missingConfluences: missingRequired.map((c) => c as any),
        invalidatingConditions: isInvalidatedByTrend
          ? ['Opposing BOS trend break']
          : !isOrderedValid
          ? ['Sequence order violated']
          : !isWithinMaxBars
          ? ['Max bars between conditions exceeded']
          : [],
        evidence: [
          `Model: ${model.name}`,
          `Sequence: ${model.sequenceMode}`,
          `Fulfilled ${fulfilledRequired.length}/${requiredConditions.length} required conditions`,
        ],
      };

      setups.push(setup);
    }

    return setups;
  }
}
