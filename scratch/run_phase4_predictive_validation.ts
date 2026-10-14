/**
 * Scratch - Phase 4 Isolated Predictive Validation Runner
 * Strictly read-only, causal, non-overlapping evaluation of TradeSea Market Analyst
 * on genuine historical CME Databento 1-minute datasets (MNQ and NQ).
 */

import fs from 'fs';
import path from 'path';
import { Candle, Timeframe } from '../core/market/Candle';
import { CandleValidator } from '../core/market/CandleValidator';
import { ICTEngine } from '../core/ict/engine/ICTEngine';
import { ConfluenceEngine } from '../core/ict/confluence/ConfluenceEngine';
import { SetupEngine } from '../core/ict/setups/SetupEngine';
import { CandidateContextEngine } from '../core/ict/context/CandidateContextEngine';
import { MarketAnalystEngine } from '../core/analyst/MarketAnalystEngine';
import { MarketAnalystValidator } from '../core/analyst/MarketAnalystValidator';
import { MarketAnalysis, MarketRiskFilterConfig } from '../core/analyst/MarketAnalystTypes';
import { ForecastOutcomeRecord, ForecastOutcomeStatus } from '../extension/analyst/MarketAnalystJournal';

interface RawDatabentoCandle {
  symbol?: string;
  contract_symbol?: string;
  timestamp_utc?: string;
  source_timestamp?: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  source?: string;
  dataset?: string;
  schema?: string;
}

interface EvaluatedForecastResult {
  instrument: string;
  contract: string;
  analysisId: string;
  forecastTimestampMs: number;
  forecastTimestampIso: string;
  referencePrice: number;
  direction: 'BULLISH' | 'BEARISH';
  nearbyTargetPrice: number;
  extendedTargetPrice?: number;
  invalidationPrice: number;
  riskDistance: number;
  estimatedGrossMove: number;
  estimatedNetMove: number;
  estimatedRR: number;
  outcomeStatus: ForecastOutcomeStatus;
  barsToResolution: number;
  resolutionTimestampMs?: number;
  resolutionPrice?: number;
  realizedGrossPoints: number;
  realizedNetBaselinePoints: number; // 1.00 pt friction
  realizedNetStressPoints: number;   // 1.75 pt friction
  maxFavorableExcursion: number;
  maxAdverseExcursion: number;
  notes: string;
}

function loadAndNormalizeCandles(filePath: string, expectedSymbol: string): { candles: Candle[]; contract: string } {
  const rawData: RawDatabentoCandle[] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const contract = rawData.length > 0 ? (rawData[0].contract_symbol || rawData[0].symbol || expectedSymbol) : expectedSymbol;

  const candles: Candle[] = [];
  for (const r of rawData) {
    const tsStr = r.timestamp_utc || r.source_timestamp;
    if (!tsStr) continue;
    const timestamp = new Date(tsStr).getTime();

    // Validate OHLC geometry
    const candle: Candle = {
      timestamp,
      open: r.open,
      high: r.high,
      low: r.low,
      close: r.close,
      volume: r.volume,
      symbol: expectedSymbol,
      timeframe: '1m',
    };

    const val = CandleValidator.validateCandle(candle);
    if (!val.isValid) {
      console.warn(`[Data Exclusion] Invalid candle geometry at ${tsStr}:`, val.errors);
      continue;
    }

    candles.push(candle);
  }

  // Sort ascending by timestamp
  candles.sort((a, b) => a.timestamp - b.timestamp);

  // Filter out any duplicates
  const deduped: Candle[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i === 0 || candles[i].timestamp > candles[i - 1].timestamp) {
      deduped.push(candles[i]);
    }
  }

  return { candles: deduped, contract };
}

function isRTH(timestampMs: number): boolean {
  // Convert UTC ms to New York time
  const d = new Date(timestampMs);
  // Get UTC hour and minute
  const utcHours = d.getUTCHours();
  const utcMins = d.getUTCMinutes();
  const totalUtcMinutes = utcHours * 60 + utcMins;

  // CME RTH: 09:30 - 16:00 New York.
  // In EDT (UTC-4): 13:30 - 20:00 UTC -> 810 to 1200 mins.
  // In EST (UTC-5): 14:30 - 21:00 UTC -> 870 to 1260 mins.
  // To be conservative and capture active liquidity across DST, accept 13:30 - 20:00 UTC
  return totalUtcMinutes >= 810 && totalUtcMinutes <= 1200;
}

async function runValidationOnDataset(
  filePath: string,
  instrumentName: 'MNQ' | 'NQ',
  analystConfig: Partial<MarketRiskFilterConfig> = {}
): Promise<{
  contract: string;
  totalCandles: number;
  rthCandles: number;
  evaluatedForecasts: EvaluatedForecastResult[];
  abstainedCount: number;
  staleCount: number;
  insufficientCount: number;
  conflictingCount: number;
}> {
  const { candles, contract } = loadAndNormalizeCandles(filePath, instrumentName);

  const ictEngine = new ICTEngine();
  const confluenceEngine = new ConfluenceEngine();
  const setupEngine = new SetupEngine();
  const candidateEngine = new CandidateContextEngine();
  const analystEngine = new MarketAnalystEngine(analystConfig);
  const validator = new MarketAnalystValidator();

  const evaluatedForecasts: EvaluatedForecastResult[] = [];
  let abstainedCount = 0;
  let staleCount = 0;
  let insufficientCount = 0;
  let conflictingCount = 0;

  const minLookback = 30;
  const maxHorizon = 60;

  let i = minLookback;
  while (i < candles.length - 1) {
    const currentCandle = candles[i];

    // Filter to RTH
    if (!isRTH(currentCandle.timestamp)) {
      i++;
      continue;
    }

    // Rolling lookback slice up to 120 bars
    const startIdx = Math.max(0, i - 120);
    const lookbackSlice = candles.slice(startIdx, i + 1);

    // Current simulation timestamp: 60s after candle close (strictly within 90-120s tolerance)
    const currentSimTimestampMs = currentCandle.timestamp + 60000;

    const engineResult = ictEngine.process(lookbackSlice, instrumentName, '1m');
    const confluences = confluenceEngine.evaluateConfluences(engineResult.state, engineResult.events);
    const setups = setupEngine.evaluateSetups(engineResult.state, engineResult.events, confluences);
    const candidateContext = candidateEngine.buildCandidateContext(engineResult.state, engineResult.events);

    const analysis = analystEngine.analyze(
      lookbackSlice,
      engineResult.state,
      engineResult.events,
      setups,
      candidateContext,
      currentSimTimestampMs
    );

    if (analysis.status === 'NO_CLEAR_OPPORTUNITY') {
      abstainedCount++;
      i++;
      continue;
    }
    if (analysis.status === 'CONFLICTING_EVIDENCE') {
      conflictingCount++;
      i++;
      continue;
    }
    if (analysis.status === 'STALE_MARKET_DATA') {
      staleCount++;
      i++;
      continue;
    }
    if (analysis.status === 'INSUFFICIENT_DATA') {
      insufficientCount++;
      i++;
      continue;
    }

    if (analysis.status === 'ANALYSIS_READY' && analysis.selectedScenario) {
      const scenario = analysis.selectedScenario;
      const futureCandles = candles.slice(i + 1, i + 1 + maxHorizon);

      if (futureCandles.length === 0) {
        i++;
        continue;
      }

      // Evaluate outcome causally
      const outcome = validator.evaluateOutcome(analysis, futureCandles, {
        maxEvaluationCandles: maxHorizon,
        baselineFrictionAssumptionPts: 1.0,
      });

      const isBull = scenario.direction === 'BULLISH';
      const refPrice = scenario.referencePrice;
      const targetPrice = scenario.nearbyTarget?.price || refPrice;
      const invPrice = scenario.invalidationLevel || refPrice;

      let realizedGrossPoints = 0;
      let barsToRes = outcome.evaluatedCandleCount;

      if (outcome.outcomeStatus === 'TARGET_HIT' || outcome.outcomeStatus === 'EXTENDED_TARGET_HIT') {
        realizedGrossPoints = isBull ? targetPrice - refPrice : refPrice - targetPrice;
      } else if (outcome.outcomeStatus === 'INVALIDATION_HIT') {
        realizedGrossPoints = isBull ? -(refPrice - invPrice) : -(invPrice - refPrice);
      } else if (outcome.outcomeStatus === 'AMBIGUOUS_EVALUATION') {
        // Fail-closed: treated as loss of invalidation distance
        realizedGrossPoints = isBull ? -(refPrice - invPrice) : -(invPrice - refPrice);
      } else {
        // EXPIRED or UNRESOLVED: realized move at horizon bar close
        const exitCandle = futureCandles[futureCandles.length - 1];
        realizedGrossPoints = isBull ? exitCandle.close - refPrice : refPrice - exitCandle.close;
      }

      const realizedNetBaseline = realizedGrossPoints > 0
        ? Math.max(0, realizedGrossPoints - 1.0)
        : realizedGrossPoints - 1.0;

      const realizedNetStress = realizedGrossPoints > 0
        ? Math.max(0, realizedGrossPoints - 1.75)
        : realizedGrossPoints - 1.75;

      evaluatedForecasts.push({
        instrument: instrumentName,
        contract,
        analysisId: analysis.analysisId,
        forecastTimestampMs: currentCandle.timestamp,
        forecastTimestampIso: new Date(currentCandle.timestamp).toISOString(),
        referencePrice: refPrice,
        direction: scenario.direction,
        nearbyTargetPrice: targetPrice,
        extendedTargetPrice: scenario.extendedTarget?.price,
        invalidationPrice: invPrice,
        riskDistance: scenario.riskDistance || 0,
        estimatedGrossMove: scenario.estimatedGrossMove || 0,
        estimatedNetMove: scenario.estimatedNetMove || 0,
        estimatedRR: scenario.estimatedRewardRiskRatio || 0,
        outcomeStatus: outcome.outcomeStatus,
        barsToResolution: barsToRes,
        resolutionTimestampMs: outcome.targetHitTimestampMs || outcome.invalidationHitTimestampMs,
        resolutionPrice: outcome.targetHitPrice || outcome.invalidationHitPrice,
        realizedGrossPoints: Number(realizedGrossPoints.toFixed(2)),
        realizedNetBaselinePoints: Number(realizedNetBaseline.toFixed(2)),
        realizedNetStressPoints: Number(realizedNetStress.toFixed(2)),
        maxFavorableExcursion: outcome.maxFavorableExcursionPts,
        maxAdverseExcursion: outcome.maxAdverseExcursionPts,
        notes: outcome.notes,
      });

      // ENFORCE STRICTLY NON-OVERLAPPING WINDOWS
      // Advance loop index to after the resolution bar (or after horizon if expired)
      const advanceBars = Math.max(1, barsToRes);
      i += advanceBars;
    } else {
      i++;
    }
  }

  const rthCount = candles.filter((c) => isRTH(c.timestamp)).length;

  return {
    contract,
    totalCandles: candles.length,
    rthCandles: rthCount,
    evaluatedForecasts,
    abstainedCount,
    staleCount,
    insufficientCount,
    conflictingCount,
  };
}

// Statistical Helper Functions
function computeAutocorrelation(values: number[], lag: number = 1): number {
  if (values.length <= lag + 1) return 0;
  const n = values.length;
  const mean = values.reduce((s, x) => s + x, 0) / n;
  let num = 0;
  let den = 0;

  for (let i = 0; i < n; i++) {
    den += Math.pow(values[i] - mean, 2);
  }
  for (let i = 0; i < n - lag; i++) {
    num += (values[i] - mean) * (values[i + lag] - mean);
  }

  return den > 0 ? Number((num / den).toFixed(4)) : 0;
}

function computeBlockBootstrapCI(
  data: number[],
  statisticFn: (arr: number[]) => number,
  iterations: number = 2000,
  blockLength: number = 5
): { mean: number; lower95: number; upper95: number } {
  if (data.length === 0) return { mean: 0, lower95: 0, upper95: 0 };
  const n = data.length;
  const numBlocks = Math.ceil(n / blockLength);
  const bootstrapEstimates: number[] = [];

  for (let b = 0; b < iterations; b++) {
    const resampled: number[] = [];
    for (let k = 0; k < numBlocks; k++) {
      const startIdx = Math.floor(Math.random() * (n - blockLength + 1));
      for (let j = 0; j < blockLength && resampled.length < n; j++) {
        resampled.push(data[startIdx + j]);
      }
    }
    bootstrapEstimates.push(statisticFn(resampled));
  }

  bootstrapEstimates.sort((a, b) => a - b);
  const lowerIdx = Math.floor(iterations * 0.025);
  const upperIdx = Math.floor(iterations * 0.975);
  const sampleMean = statisticFn(data);

  return {
    mean: Number(sampleMean.toFixed(4)),
    lower95: Number(bootstrapEstimates[lowerIdx].toFixed(4)),
    upper95: Number(bootstrapEstimates[upperIdx].toFixed(4)),
  };
}

async function main() {
  console.log('=================================================================');
  console.log('TRADESEA MARKET ANALYST — PHASE 4 ISOLATED PREDICTIVE VALIDATION');
  console.log('=================================================================\n');

  const mnqFiles = [
    'data_audit/cp33_7/normalized/mnq_mnqz25_normalized.json',
    'data_audit/cp33_7/normalized/mnq_mnqh26_normalized.json',
    'data_audit/cp33_7/normalized/mnq_mnqm26_normalized.json',
    'data_audit/cp33_6/normalized/mnq_1m_reconciled_normalized.json',
  ];

  const nqFiles = [
    'data_audit/cp33_7/normalized/nq_nqz25_normalized.json',
    'data_audit/cp33_7/normalized/nq_nqh26_normalized.json',
    'data_audit/cp33_7/normalized/nq_nqm26_normalized.json',
    'data_audit/cp33_6/normalized/nq_1m_reconciled_normalized.json',
  ];

  const allMnqForecasts: EvaluatedForecastResult[] = [];
  const allNqForecasts: EvaluatedForecastResult[] = [];

  console.log('--- 1. Processing MNQ Datasets ---');
  for (const f of mnqFiles) {
    if (!fs.existsSync(f)) {
      console.warn(`File missing: ${f}`);
      continue;
    }
    const res = await runValidationOnDataset(f, 'MNQ');
    console.log(`[MNQ] Contract ${res.contract} (${path.basename(f)}): ${res.totalCandles} bars (${res.rthCandles} RTH) -> ${res.evaluatedForecasts.length} non-overlapping forecasts, ${res.abstainedCount} abstained, ${res.conflictingCount} conflicting.`);
    allMnqForecasts.push(...res.evaluatedForecasts);
  }

  console.log('\n--- 2. Processing NQ Datasets ---');
  for (const f of nqFiles) {
    if (!fs.existsSync(f)) {
      console.warn(`File missing: ${f}`);
      continue;
    }
    const res = await runValidationOnDataset(f, 'NQ');
    console.log(`[NQ] Contract ${res.contract} (${path.basename(f)}): ${res.totalCandles} bars (${res.rthCandles} RTH) -> ${res.evaluatedForecasts.length} non-overlapping forecasts, ${res.abstainedCount} abstained, ${res.conflictingCount} conflicting.`);
    allNqForecasts.push(...res.evaluatedForecasts);
  }

  console.log('\n--- 3. Aggregated Performance & Preregistered Criteria Evaluation ---\n');

  function analyzeInstrument(forecasts: EvaluatedForecastResult[], name: string) {
    console.log(`========================================`);
    console.log(`RESULTS FOR ${name} (N = ${forecasts.length})`);
    console.log(`========================================`);

    if (forecasts.length === 0) {
      console.log('No forecasts evaluated.');
      return;
    }

    const n = forecasts.length;
    const targetHits = forecasts.filter((f) => f.outcomeStatus === 'TARGET_HIT' || f.outcomeStatus === 'EXTENDED_TARGET_HIT').length;
    const invalidations = forecasts.filter((f) => f.outcomeStatus === 'INVALIDATION_HIT').length;
    const ambiguous = forecasts.filter((f) => f.outcomeStatus === 'AMBIGUOUS_EVALUATION').length;
    const expired = forecasts.filter((f) => f.outcomeStatus === 'EXPIRED').length;

    const hitRate = targetHits / n;
    const invRate = invalidations / n;
    const ambRate = ambiguous / n;
    const expRate = expired / n;

    // Returns under 3 friction tiers
    const grossPts = forecasts.map((f) => f.realizedGrossPoints);
    const netBasePts = forecasts.map((f) => f.realizedNetBaselinePoints);
    const netStressPts = forecasts.map((f) => f.realizedNetStressPoints);

    const sumGross = grossPts.reduce((s, x) => s + x, 0);
    const sumNetBase = netBasePts.reduce((s, x) => s + x, 0);
    const sumNetStress = netStressPts.reduce((s, x) => s + x, 0);

    const winBase = netBasePts.filter((x) => x > 0);
    const lossBase = netBasePts.filter((x) => x <= 0);
    const avgWin = winBase.length > 0 ? winBase.reduce((s, x) => s + x, 0) / winBase.length : 0;
    const avgLoss = lossBase.length > 0 ? Math.abs(lossBase.reduce((s, x) => s + x, 0) / lossBase.length) : 0;
    const realizedRR = avgLoss > 0 ? avgWin / avgLoss : 0;

    // Directional Accuracy (excluding ambiguous and expired)
    const directionalTotal = targetHits + invalidations;
    const directionalAcc = directionalTotal > 0 ? targetHits / directionalTotal : 0;

    // Autocorrelation of net returns
    const rho1 = computeAutocorrelation(netBasePts, 1);
    const rho2 = computeAutocorrelation(netBasePts, 2);
    const rho3 = computeAutocorrelation(netBasePts, 3);

    // Block Bootstrap 95% CIs
    const hitRateCI = computeBlockBootstrapCI(
      forecasts.map((f) => (f.outcomeStatus === 'TARGET_HIT' || f.outcomeStatus === 'EXTENDED_TARGET_HIT' ? 1 : 0)),
      (arr) => arr.reduce((s, x) => s + x, 0) / arr.length
    );

    const netPointsCI = computeBlockBootstrapCI(
      netBasePts,
      (arr) => arr.reduce((s, x) => s + x, 0) / arr.length
    );

    // MFE and MAE
    const avgMFE = forecasts.reduce((s, f) => s + f.maxFavorableExcursion, 0) / n;
    const avgMAE = forecasts.reduce((s, f) => s + f.maxAdverseExcursion, 0) / n;

    console.log(`- Evaluated Scenarios (Non-Overlapping): ${n}`);
    console.log(`- Target Hits: ${targetHits} (${(hitRate * 100).toFixed(1)}%) [95% CI: ${(hitRateCI.lower95 * 100).toFixed(1)}% - ${(hitRateCI.upper95 * 100).toFixed(1)}%]`);
    console.log(`- Invalidation Hits: ${invalidations} (${(invRate * 100).toFixed(1)}%)`);
    console.log(`- Ambiguous Evaluations (Same-Bar Touch): ${ambiguous} (${(ambRate * 100).toFixed(1)}%)`);
    console.log(`- Expired at 60-Bar Horizon: ${expired} (${(expRate * 100).toFixed(1)}%)`);
    console.log(`- Directional Accuracy (Target Hits / (Target + Invalidation)): ${(directionalAcc * 100).toFixed(1)}%`);
    console.log(`- Average Realized Win (1.00 pt friction): +${avgWin.toFixed(2)} pts`);
    console.log(`- Average Realized Loss (1.00 pt friction): -${avgLoss.toFixed(2)} pts`);
    console.log(`- Realized Net Reward/Risk Ratio: ${realizedRR.toFixed(2)}`);
    console.log(`- Average MFE: ${avgMFE.toFixed(2)} pts | Average MAE: ${avgMAE.toFixed(2)} pts`);
    console.log(`\nFriction Sensitivity:`);
    console.log(`  * Gross Realized Move (0.00 pt friction): ${sumGross >= 0 ? '+' : ''}${sumGross.toFixed(2)} pts (avg: ${(sumGross / n).toFixed(2)} pts/trade)`);
    console.log(`  * Baseline Realized Move (1.00 pt friction): ${sumNetBase >= 0 ? '+' : ''}${sumNetBase.toFixed(2)} pts (avg: ${(sumNetBase / n).toFixed(2)} pts/trade) [95% CI: ${netPointsCI.lower95.toFixed(2)} to ${netPointsCI.upper95.toFixed(2)} pts]`);
    console.log(`  * Stress Realized Move (1.75 pt friction): ${sumNetStress >= 0 ? '+' : ''}${sumNetStress.toFixed(2)} pts (avg: ${(sumNetStress / n).toFixed(2)} pts/trade)`);
    console.log(`\nSerial Dependence & Autocorrelation Diagnostics:`);
    console.log(`  * Lag-1 Return Autocorrelation (rho_1): ${rho1}`);
    console.log(`  * Lag-2 Return Autocorrelation (rho_2): ${rho2}`);
    console.log(`  * Lag-3 Return Autocorrelation (rho_3): ${rho3}`);

    console.log(`\nPreregistered Pass/Fail Criteria Evaluation:`);
    const c1 = hitRate >= 0.52;
    const c2 = realizedRR >= 1.25;
    const c3 = ambRate <= 0.08;
    const c4 = Math.abs(rho1) <= 0.15;

    console.log(`  1. Target Hit Rate >= 52.0%: ${(hitRate * 100).toFixed(1)}% -> ${c1 ? 'PASS' : 'FAIL'}`);
    console.log(`  2. Realized Net R:R >= 1.25: ${realizedRR.toFixed(2)} -> ${c2 ? 'PASS' : 'FAIL'}`);
    console.log(`  3. Ambiguity Rate <= 8.0%: ${(ambRate * 100).toFixed(1)}% -> ${c3 ? 'PASS' : 'FAIL'}`);
    console.log(`  4. |Lag-1 Autocorrelation| <= 0.15: ${Math.abs(rho1)} -> ${c4 ? 'PASS' : 'FAIL'}`);
    console.log(`\n`);
  }

  analyzeInstrument(allMnqForecasts, 'MNQ (Micro E-mini Nasdaq-100)');
  analyzeInstrument(allNqForecasts, 'NQ (E-mini Nasdaq-100)');

  // Save detailed evaluation records to scratch for documentation
  const summaryDump = {
    evaluatedAt: new Date().toISOString(),
    totalMnqForecasts: allMnqForecasts.length,
    totalNqForecasts: allNqForecasts.length,
    mnqForecasts: allMnqForecasts,
    nqForecasts: allNqForecasts,
  };
  fs.writeFileSync('scratch/phase4_validation_results.json', JSON.stringify(summaryDump, null, 2));
  console.log('Validation results saved to scratch/phase4_validation_results.json');
}

main().catch(console.error);
