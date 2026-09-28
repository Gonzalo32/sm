/**
 * CP27 Dataset Generator - Generates a brand-new, isolated multi-timeframe dataset for CP27
 * Specifically structured to audit near-threshold scenarios around qualification threshold ratio = 0.8.
 * Natural scenario parameters covering full range of proximity bands and exact ratio conditions.
 */

import { Candle, Timeframe } from '../../market/Candle';
import { BacktestScenario, ScenarioDataset, DatasetSplit, VolatilityRegime, ScenarioType, ScenarioDirection } from './BacktestTypes';

export interface CP27DatasetItem {
  scenario: BacktestScenario;
  futureCandles: Candle[];
}

export class CP27DatasetGenerator {
  /**
   * Computes a stable hash string for the generated dataset.
   */
  public static computeDatasetHash(scenarios: BacktestScenario[]): string {
    let combinedStr = '';
    for (const s of scenarios) {
      combinedStr += `${s.scenarioId}:${s.symbol}:${s.timeframe}:${s.eventType}:${s.volatilityRegime}:${s.referencePrice}:${s.stopPrice}:${s.targetPrice}:${s.shadowVolatility.baseline}:${s.shadowVolatility.robust14};`;
    }
    let hash = 0;
    for (let i = 0; i < combinedStr.length; i++) {
      const char = combinedStr.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `HASH-CP27-${Math.abs(hash).toString(16).toUpperCase()}-FROZEN`;
  }

  /**
   * Generates deterministic synthetic candle data and backtest scenarios for CP27.
   * Total scenarios = 600 (100 per Symbol x Timeframe pair: MNQ 1m, MNQ 5m, MNQ 15m, NQ 1m, NQ 5m, NQ 15m).
   */
  public static generateCP27Dataset(): { dataset: ScenarioDataset; items: CP27DatasetItem[] } {
    const items: CP27DatasetItem[] = [];
    const scenarios: BacktestScenario[] = [];

    const symbolTimeframePairs: Array<{ symbol: string; timeframe: Timeframe }> = [
      { symbol: 'MNQ', timeframe: '1m' },
      { symbol: 'MNQ', timeframe: '5m' },
      { symbol: 'MNQ', timeframe: '15m' },
      { symbol: 'NQ', timeframe: '1m' },
      { symbol: 'NQ', timeframe: '5m' },
      { symbol: 'NQ', timeframe: '15m' },
    ];

    const eventTypes: ScenarioType[] = ['BOS', 'MSS'];
    const regimes: VolatilityRegime[] = ['NORMAL', 'ELEVATED', 'SHOCK', 'POST-SHOCK'];

    let scenarioCounter = 1;
    const baseTimestamp = 1777516800000; // May 1, 2026

    // Generate 100 scenarios per Symbol/Timeframe pair -> Total 600
    for (let pairIdx = 0; pairIdx < symbolTimeframePairs.length; pairIdx++) {
      const { symbol, timeframe } = symbolTimeframePairs[pairIdx];

      for (let k = 0; k < 100; k++) {
        const globalIdx = pairIdx * 100 + k;
        const eventType = eventTypes[globalIdx % eventTypes.length];
        const volatilityRegime = regimes[globalIdx % regimes.length];
        const direction: ScenarioDirection = globalIdx % 2 === 0 ? 'LONG_SCENARIO' : 'SHORT_SCENARIO';

        // Assign split: 20% EXPLORATION (0..119), 40% SELECTION (120..359), 40% HOLDOUT (360..599)
        let split: DatasetSplit = 'HOLDOUT';
        if (globalIdx < 120) split = 'EXPLORATION';
        else if (globalIdx < 360) split = 'SELECTION';

        const stepMs = timeframe === '15m' ? 900000 : timeframe === '5m' ? 300000 : 60000;
        const eventTs = baseTimestamp + globalIdx * 3600000;
        const confTs = eventTs + stepMs;

        const basePrice = symbol === 'NQ' ? 19800 + (globalIdx % 50) * 10 : 1980 + (globalIdx % 50) * 2;

        // Base Volatility values per instrument
        let baseVol = symbol === 'NQ' ? 25.0 : 6.25;

        // Shadow Volatility Values based on Regime with realistic variations across estimators
        let baselineTR = baseVol;
        let robust10TR = baseVol;
        let robust14TR = baseVol * 0.992;
        let robust20TR = baseVol * 0.984;

        if (volatilityRegime === 'SHOCK') {
          baselineTR *= 2.50;
          robust10TR *= 1.40;
          robust14TR *= 1.30;
          robust20TR *= 1.22;
        } else if (volatilityRegime === 'POST-SHOCK') {
          baselineTR *= 1.85; // Baseline TR stays inflated due to moving average memory of shock
          robust10TR *= 1.08; // M10 adjusts fast
          robust14TR *= 1.02; // M14 recovers
          robust20TR *= 0.98; // M20 holds slightly lower median
        } else if (volatilityRegime === 'ELEVATED') {
          baselineTR *= 1.30;
          robust10TR *= 1.22;
          robust14TR *= 1.18;
          robust20TR *= 1.14;
        }

        // Distance from shock
        let barsFromShock: number | undefined = undefined;
        if (volatilityRegime === 'SHOCK') {
          barsFromShock = (globalIdx % 5) + 1; // 1 to 5
        } else if (volatilityRegime === 'POST-SHOCK') {
          barsFromShock = (globalIdx % 10) + 6; // 6 to 15
        }

        // Generate risk points continuously covering ratios from 0.50 to 1.30 relative to baseline volatility
        // Ratios will naturally fall across all proximity bands including 0.795 - 0.805 and exact 0.8000
        const ratioMultiplier = 0.50 + (globalIdx % 81) * 0.01;
        const riskPoints = baselineTR * ratioMultiplier;

        const entryPrice = basePrice;
        const stopPrice = direction === 'LONG_SCENARIO' ? entryPrice - riskPoints : entryPrice + riskPoints;
        const targetPrice = direction === 'LONG_SCENARIO' ? entryPrice + 2 * riskPoints : entryPrice - 2 * riskPoints;
        const risk = Math.abs(entryPrice - stopPrice);
        const targetDistance = 2 * risk;

        const brokenLevel = stopPrice;
        const penetrationAbsolute = Math.abs(entryPrice - brokenLevel);
        const priorStructureState = direction === 'LONG_SCENARIO' ? 'BULLISH' : 'BEARISH';

        const scenarioId = `CP27-SCEN-${symbol}-${timeframe}-${eventType}-${scenarioCounter.toString().padStart(4, '0')}`;
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
          brokenLevel,
          penetrationAbsolute,
          priorStructureState,
          barsFromShock,
        };

        // Generate 20 future candles deterministically
        const futureCandles: Candle[] = [];
        let currentPrice = entryPrice;

        for (let bar = 0; bar < 20; bar++) {
          const candleTs = confTs + (bar + 1) * stepMs;
          const pseudoRandom = Math.sin(globalIdx * 100 + bar * 17);

          let deltaHigh = 0;
          let deltaLow = 0;

          if (direction === 'LONG_SCENARIO') {
            if (globalIdx % 3 === 0) {
              deltaHigh = pseudoRandom > 0 ? risk * 0.4 : risk * 0.1;
              deltaLow = pseudoRandom < 0 ? -risk * 0.15 : -risk * 0.05;
              if (bar >= 6) {
                currentPrice = entryPrice + risk * 2.1;
                deltaHigh = risk * 2.2;
              }
            } else if (globalIdx % 3 === 1) {
              deltaHigh = pseudoRandom > 0 ? risk * 0.1 : 0;
              deltaLow = pseudoRandom < 0 ? -risk * 0.4 : -risk * 0.2;
              if (bar >= 5) {
                currentPrice = entryPrice - risk * 1.1;
                deltaLow = -risk * 1.2;
              }
            } else {
              currentPrice = entryPrice + pseudoRandom * risk * 0.5;
              deltaHigh = Math.abs(pseudoRandom) * risk * 0.6;
              deltaLow = -Math.abs(pseudoRandom) * risk * 0.6;
            }
          } else {
            if (globalIdx % 3 === 0) {
              deltaLow = pseudoRandom > 0 ? -risk * 0.4 : -risk * 0.1;
              deltaHigh = pseudoRandom < 0 ? risk * 0.15 : risk * 0.05;
              if (bar >= 6) {
                currentPrice = entryPrice - risk * 2.1;
                deltaLow = -risk * 2.2;
              }
            } else if (globalIdx % 3 === 1) {
              deltaLow = pseudoRandom > 0 ? -risk * 0.1 : 0;
              deltaHigh = pseudoRandom < 0 ? risk * 0.4 : risk * 0.2;
              if (bar >= 5) {
                currentPrice = entryPrice + risk * 1.1;
                deltaHigh = risk * 1.2;
              }
            } else {
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
    }

    const datasetHash = CP27DatasetGenerator.computeDatasetHash(scenarios);

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
      datasetId: 'DATASET-CP27-ISOLATED-01',
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
