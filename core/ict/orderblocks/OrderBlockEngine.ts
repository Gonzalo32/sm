/**
 * ICT Order Block Engine
 */

import { Candle, Timeframe } from '../../market/Candle';
import { OrderBlock } from '../types/OrderBlock';
import { FairValueGap } from '../types/FVG';
import { ICTEvent, OrderBlockCreatedEvent, OrderBlockInvalidatedEvent } from '../types/ICTEvent';
import { ICTConfig } from '../types/ICTConfig';

export interface OrderBlockEvaluationResult {
  orderBlocks: OrderBlock[];
  events: ICTEvent[];
}

export class OrderBlockEngine {
  private config: ICTConfig;

  constructor(config: ICTConfig) {
    this.config = config;
  }

  public evaluateOrderBlocks(
    candles: Candle[],
    fvgs: FairValueGap[],
    symbol: string,
    timeframe: Timeframe
  ): OrderBlockEvaluationResult {
    const orderBlocks: OrderBlock[] = [];
    const events: ICTEvent[] = [];

    if (!this.config || candles.length < 3) {
      return { orderBlocks, events };
    }

    // 1. Detect Order Blocks matching FVGs (Variant B: ICT Standard)
    for (const fvg of fvgs) {
      const obCandleIndex = fvg.createdCandleIndex - 2;
      if (obCandleIndex >= 0 && obCandleIndex < candles.length) {
        const obCandle = candles[obCandleIndex];

        if (fvg.direction === 'BULLISH' && obCandle.close <= obCandle.open) {
          const ob: OrderBlock = {
            id: `OB-BULL-${symbol}-${timeframe}-${obCandle.timestamp}`,
            symbol,
            timeframe,
            type: 'BULLISH_OB',
            highPrice: obCandle.high,
            lowPrice: obCandle.low,
            openPrice: obCandle.open,
            closePrice: obCandle.close,
            timestamp: obCandle.timestamp,
            candleIndex: obCandleIndex,
            status: 'UNTESTED',
            hasFvgConfluence: true,
          };
          orderBlocks.push(ob);
          events.push({
            type: 'ORDER_BLOCK_CREATED',
            symbol,
            timeframe,
            timestamp: obCandle.timestamp,
            eventTimestamp: obCandle.timestamp,
            confirmationTimestamp: fvg.candle3Timestamp,
            candleIndex: obCandleIndex,
            orderBlock: { ...ob },
          } as OrderBlockCreatedEvent);
        } else if (fvg.direction === 'BEARISH' && obCandle.close >= obCandle.open) {
          const ob: OrderBlock = {
            id: `OB-BEAR-${symbol}-${timeframe}-${obCandle.timestamp}`,
            symbol,
            timeframe,
            type: 'BEARISH_OB',
            highPrice: obCandle.high,
            lowPrice: obCandle.low,
            openPrice: obCandle.open,
            closePrice: obCandle.close,
            timestamp: obCandle.timestamp,
            candleIndex: obCandleIndex,
            status: 'UNTESTED',
            hasFvgConfluence: true,
          };
          orderBlocks.push(ob);
          events.push({
            type: 'ORDER_BLOCK_CREATED',
            symbol,
            timeframe,
            timestamp: obCandle.timestamp,
            eventTimestamp: obCandle.timestamp,
            confirmationTimestamp: fvg.candle3Timestamp,
            candleIndex: obCandleIndex,
            orderBlock: { ...ob },
          } as OrderBlockCreatedEvent);
        }
      }
    }

    // 2. Track Mitigation / Invalidation
    for (const ob of orderBlocks) {
      for (let cIdx = ob.candleIndex + 1; cIdx < candles.length; cIdx++) {
        if (ob.status === 'INVALIDATED') break;

        const candle = candles[cIdx];

        if (ob.type === 'BULLISH_OB') {
          if (candle.low <= ob.highPrice && ob.status === 'UNTESTED') {
            ob.status = 'TESTED';
          }
          if (candle.close < ob.lowPrice) {
            ob.status = 'INVALIDATED';
            ob.invalidatedTimestamp = candle.timestamp;
            events.push({
              type: 'ORDER_BLOCK_INVALIDATED',
              symbol,
              timeframe,
              timestamp: candle.timestamp,
              eventTimestamp: candle.timestamp,
              confirmationTimestamp: candle.timestamp,
              candleIndex: cIdx,
              orderBlock: { ...ob },
            } as OrderBlockInvalidatedEvent);
          }
        } else if (ob.type === 'BEARISH_OB') {
          if (candle.high >= ob.lowPrice && ob.status === 'UNTESTED') {
            ob.status = 'TESTED';
          }
          if (candle.close > ob.highPrice) {
            ob.status = 'INVALIDATED';
            ob.invalidatedTimestamp = candle.timestamp;
            events.push({
              type: 'ORDER_BLOCK_INVALIDATED',
              symbol,
              timeframe,
              timestamp: candle.timestamp,
              eventTimestamp: candle.timestamp,
              confirmationTimestamp: candle.timestamp,
              candleIndex: cIdx,
              orderBlock: { ...ob },
            } as OrderBlockInvalidatedEvent);
          }
        }
      }
    }

    return { orderBlocks, events };
  }
}
