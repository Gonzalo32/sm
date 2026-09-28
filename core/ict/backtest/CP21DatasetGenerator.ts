/**
 * CP21 Dataset Generator - Generates a brand-new, isolated dataset for CP21
 * Frozen hashes, strict splits (Exploration 20%, Selection 40%, Holdout 40%),
 * across MNQ/NQ, 1m/5m/15m, BOS/MSS, and NORMAL/ELEVATED/SHOCK/POST-SHOCK regimes.
 */

import { Candle, Timeframe } from '../../market/Candle';
import { BacktestScenario, ScenarioDataset, DatasetSplit, VolatilityRegime, ScenarioType, ScenarioDirection } from './BacktestTypes';

export interface CP21DatasetItem {
  scenario: BacktestScenario;
  futureCandles: Candle[];
}

export class CP21DatasetGenerator {
  /**
   * Computes a stable hash string for the generated dataset.
   */
  public static computeDatasetHash(scenarios: BacktestScenario[]): string {
    let combinedStr = '';
    for (const s of scenarios) {
      combinedStr += `${s.scenarioId}:${s.symbol}:${s.timeframe}:${s.eventType}:${s.volatilityRegime}:${s.referencePrice}:${s.stopPrice}:${s.targetPrice};`;
    }
    let hash = 0;
    for (let i = 0; i < combinedStr.length; i++) {
      const char = combinedStr.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `HASH-CP21-${Math.abs(hash).toString(16).toUpperCase()}-FROZEN`;
  }

  /**
   * Generates deterministic synthetic candle data and backtest scenarios for CP21.
   * Total scenarios = 500 (MNQ: 250, NQ: 250).
   */
  public static generateCP21Dataset(): { dataset: ScenarioDataset; items: CP21DatasetItem[] } {
    const items: CP21DatasetItem[] = [];
    const scenarios: BacktestScenario[] = [];

    const symbols = ['MNQ', 'NQ'];
    const timeframes: Timeframe[] = ['1m', '5m', '15m'];
    const eventTypes: ScenarioType[] = ['BOS', 'MSS'];
    const regimes: VolatilityRegime[] = ['NORMAL', 'ELEVATED', 'SHOCK', 'POST-SHOCK'];

    let scenarioCounter = 1;
    const baseTimestamp = 1767225600000; // Jan 1, 2026

    // Target total: 500 scenarios
    for (let i = 0; i < 500; i++) {
      const symbol = symbols[i % symbols.length];
      const timeframe = timeframes[i % timeframes.length];
      const eventType = eventTypes[i % eventTypes.length];
      const volatilityRegime = regimes[i % regimes.length];

      const direction: ScenarioDirection = i % 2 === 0 ? 'LONG_SCENARIO' : 'SHORT_SCENARIO';

      // Assign split: 20% EXPLORATION (0..99), 40% SELECTION (100..299), 40% HOLDOUT (300..499)
      let split: DatasetSplit = 'HOLDOUT';
      if (i < 100) split = 'EXPLORATION';
      else if (i < 300) split = 'SELECTION';

      const eventTs = baseTimestamp + i * 3600000;
      const confTs = eventTs + 60000; // +1 minute

      const basePrice = symbol === 'NQ' ? 18000 + (i % 50) * 10 : 1800 + (i % 50) * 2;
      const riskPoints = symbol === 'NQ' ? 15 + (i % 10) * 2 : 5 + (i % 5);

      const entryPrice = basePrice;
      const stopPrice = direction === 'LONG_SCENARIO' ? entryPrice - riskPoints : entryPrice + riskPoints;
      const targetPrice = direction === 'LONG_SCENARIO' ? entryPrice + 2 * riskPoints : entryPrice - 2 * riskPoints;
      const risk = Math.abs(entryPrice - stopPrice);
      const targetDistance = 2 * risk;

      // Shadow Volatility Values based on Regime
      let baselineTR = symbol === 'NQ' ? 12 : 3;
      let robust10TR = symbol === 'NQ' ? 12 : 3;
      let robust14TR = symbol === 'NQ' ? 12 : 3;
      let robust20TR = symbol === 'NQ' ? 12 : 3;

      if (volatilityRegime === 'SHOCK') {
        baselineTR *= 2.5;
        robust10TR *= 1.4;
        robust14TR *= 1.3;
        robust20TR *= 1.2;
      } else if (volatilityRegime === 'POST-SHOCK') {
        baselineTR *= 1.8; // Baseline stays inflated by shock memory
        robust10TR *= 1.0; // Robust median recovers immediately
        robust14TR *= 0.98;
        robust20TR *= 1.0;
      } else if (volatilityRegime === 'ELEVATED') {
        baselineTR *= 1.2;
        robust10TR *= 1.15;
        robust14TR *= 1.15;
        robust20TR *= 1.15;
      }

      const scenarioId = `CP21-SCEN-${symbol}-${timeframe}-${eventType}-${scenarioCounter.toString().padStart(4, '0')}`;
      const eventId = `EVT-${symbol}-${timeframe}-${eventTs}`;

      const scenario: BacktestScenario = {
        scenarioId,
        eventId,
        symbol,
        timeframe,
        eventType,
        direction,
        eventTimestamp: eventTs,
        confirmationTimestamp: confTs,
        referencePrice: entryPrice,
        entryPrice,
        stopPrice,
        targetPrice,
        risk,
        targetDistance,
        volatilityRegime,
        shadowVolatility: {
          baseline: baselineTR,
          robust10: robust10TR,
          robust14: robust14TR,
          robust20: robust20TR,
        },
        split,
        isInvalidScenario: false,
      };

      // Generate 20 future candles deterministically
      const futureCandles: Candle[] = [];
      let currentPrice = entryPrice;

      for (let k = 0; k < 20; k++) {
        const candleTs = confTs + (k + 1) * 60000;
        // Deterministic price path generator
        const pseudoRandom = Math.sin(i * 100 + k * 17);

        let deltaHigh = 0;
        let deltaLow = 0;

        if (direction === 'LONG_SCENARIO') {
          if (i % 3 === 0) {
            // Reaches Target in ~ 5-10 bars
            deltaHigh = pseudoRandom > 0 ? risk * 0.4 : risk * 0.1;
            deltaLow = pseudoRandom < 0 ? -risk * 0.15 : -risk * 0.05;
            if (k >= 6) {
              currentPrice = entryPrice + risk * 2.1;
              deltaHigh = risk * 2.2;
            }
          } else if (i % 3 === 1) {
            // Reaches Stop in ~ 4-8 bars
            deltaHigh = pseudoRandom > 0 ? risk * 0.1 : 0;
            deltaLow = pseudoRandom < 0 ? -risk * 0.4 : -risk * 0.2;
            if (k >= 5) {
              currentPrice = entryPrice - risk * 1.1;
              deltaLow = -risk * 1.2;
            }
          } else {
            // Timeout / Range bound
            currentPrice = entryPrice + pseudoRandom * risk * 0.5;
            deltaHigh = Math.abs(pseudoRandom) * risk * 0.6;
            deltaLow = -Math.abs(pseudoRandom) * risk * 0.6;
          }
        } else {
          // SHORT SCENARIO
          if (i % 3 === 0) {
            // Reaches Target in ~ 5-10 bars
            deltaLow = pseudoRandom > 0 ? -risk * 0.4 : -risk * 0.1;
            deltaHigh = pseudoRandom < 0 ? risk * 0.15 : risk * 0.05;
            if (k >= 6) {
              currentPrice = entryPrice - risk * 2.1;
              deltaLow = -risk * 2.2;
            }
          } else if (i % 3 === 1) {
            // Reaches Stop in ~ 4-8 bars
            deltaLow = pseudoRandom > 0 ? -risk * 0.1 : 0;
            deltaHigh = pseudoRandom < 0 ? risk * 0.4 : risk * 0.2;
            if (k >= 5) {
              currentPrice = entryPrice + risk * 1.1;
              deltaHigh = risk * 1.2;
            }
          } else {
            // Timeout
            currentPrice = entryPrice - pseudoRandom * risk * 0.5;
            deltaHigh = Math.abs(pseudoRandom) * risk * 0.6;
            deltaLow = -Math.abs(pseudoRandom) * risk * 0.6;
          }
        }

        const open = currentPrice;
        const high = Math.max(open, currentPrice + Math.abs(deltaHigh));
        const low = Math.min(open, currentPrice - Math.abs(deltaLow));
        const close = (open + high + low) / 3;

        futureCandles.push({
          symbol,
          timeframe,
          timestamp: candleTs,
          open,
          high,
          low,
          close,
          volume: 1000 + Math.floor(Math.abs(pseudoRandom) * 500),
        });
      }

      scenarios.push(scenario);
      items.push({ scenario, futureCandles });
      scenarioCounter++;
    }

    const datasetHash = CP21DatasetGenerator.computeDatasetHash(scenarios);

    const symbolDistribution: Record<string, number> = {};
    const timeframeDistribution: Record<string, number> = {};
    const eventDistribution: Record<string, number> = {};
    const regimeDistribution: Record<string, number> = {};
    const splitDistribution: Record<DatasetSplit, number> = { EXPLORATION: 0, SELECTION: 0, HOLDOUT: 0 };

    for (const s of scenarios) {
      symbolDistribution[s.symbol] = (symbolDistribution[s.symbol] || 0) + 1;
      timeframeDistribution[s.timeframe] = (timeframeDistribution[s.timeframe] || 0) + 1;
      eventDistribution[s.eventType] = (eventDistribution[s.eventType] || 0) + 1;
      regimeDistribution[s.volatilityRegime] = (regimeDistribution[s.volatilityRegime] || 0) + 1;
      splitDistribution[s.split] = (splitDistribution[s.split] || 0) + 1;
    }

    const dataset: ScenarioDataset = {
      datasetId: 'DATASET-CP21-ISOLATED-01',
      datasetHash,
      createdAt: baseTimestamp,
      symbolDistribution,
      timeframeDistribution,
      eventDistribution,
      regimeDistribution,
      splitDistribution,
      scenarios,
    };

    return { dataset, items };
  }
}
