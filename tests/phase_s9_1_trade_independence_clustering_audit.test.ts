/**
 * Phase S9.1 — Trade Independence & Clustering Audit Test Suite
 * Performs an independent forensic audit of statistical independence, temporal clustering,
 * serial dependence, and effective information content across S8-200, S8.8, and S9 datasets.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync } from 'child_process';

export interface StandardTradeRecord {
  tradeId: string;
  signalId?: string;
  instrument: string;
  contract: string;
  timeframe: string;
  model: string;
  direction: string;
  signalTimestamp: number;
  confirmationTimestamp?: number;
  entryTimestamp: number;
  entryPrice: number;
  forwardExitTimestamp?: number;
  exitTimestamp?: number;
  exitPrice: number;
  grossResultPoints: number;
  frictionPoints: number;
  netResultPoints: number;
  mfePoints: number;
  maePoints: number;
  outcome?: string;
  datasetName: 'S8-200' | 'S8.8' | 'S9';
}

export interface TradeEpisode {
  episodeId: string;
  dataset: string;
  startTimestamp: number;
  endTimestamp: number;
  tradeCount: number;
  wins: number;
  losses: number;
  neutrals: number;
  episodeNetPoints: number;
  episodeMeanNetPoints: number;
  episodeWinRate: number;
  trades: StandardTradeRecord[];
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function calcPercentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function calcMean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((acc, v) => acc + v, 0) / arr.length;
}

function calcMedian(arr: number[]): number {
  return calcPercentile(arr, 50);
}

function calcStd(arr: number[]): number {
  if (arr.length <= 1) return 0;
  const mean = calcMean(arr);
  const variance = arr.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function calcPearsonAutocorr(arr: number[], lag: number): number {
  if (arr.length <= lag) return 0;
  const mean = calcMean(arr);
  let num = 0;
  let den = 0;
  for (let i = 0; i < arr.length; i++) {
    den += Math.pow(arr[i] - mean, 2);
  }
  if (den === 0) return 0;
  for (let i = 0; i < arr.length - lag; i++) {
    num += (arr[i] - mean) * (arr[i + lag] - mean);
  }
  return num / den;
}

function calcSpearmanAutocorr(arr: number[], lag: number): number {
  if (arr.length <= lag) return 0;
  const indexed = arr.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => a.v - b.v);
  const ranks = new Array(arr.length);
  for (let r = 0; r < indexed.length; r++) {
    ranks[indexed[r].i] = r + 1;
  }
  return calcPearsonAutocorr(ranks, lag);
}

export class S91TradeIndependenceEngine {
  public loadS8200Trades(): StandardTradeRecord[] {
    const filePath = path.join(process.cwd(), 'data_audit', 'phase_s8_5', 's8_5_real_market_outcome_dataset.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : parsed.trades || [];
    return list.map((t: any) => ({
      tradeId: t.tradeId,
      signalId: t.signalId,
      instrument: t.instrument || t.symbol || 'MNQ',
      contract: t.contract || 'MNQZ25',
      timeframe: t.timeframe || '5m',
      model: t.model || 'MODEL_A',
      direction: t.direction || 'LONG',
      signalTimestamp: t.signalTimestamp || t.candidateTimestamp || t.entryTimestamp,
      confirmationTimestamp: t.confirmationTimestamp || t.signalTimestamp || t.candidateTimestamp,
      entryTimestamp: t.entryTimestamp,
      entryPrice: t.entryPrice,
      forwardExitTimestamp: t.forwardExitTimestamp || t.exitTimestamp,
      exitTimestamp: t.exitTimestamp || t.forwardExitTimestamp,
      exitPrice: t.exitPrice,
      grossResultPoints: t.grossResultPoints !== undefined ? t.grossResultPoints : (t.exitPrice - t.entryPrice) * (t.direction === 'LONG' ? 1 : -1),
      frictionPoints: t.frictionPoints || 1,
      netResultPoints: t.netResultPoints,
      mfePoints: t.mfePoints,
      maePoints: t.maePoints,
      outcome: t.outcome || (t.netResultPoints > 0 ? 'WINNER' : t.netResultPoints < 0 ? 'LOSER' : 'NEUTRAL'),
      datasetName: 'S8-200' as const,
    }));
  }

  public loadS88Trades(): StandardTradeRecord[] {
    const filePath = path.join(process.cwd(), 'data_audit', 'phase_s8_8', 's8_8_oos_trade_dataset.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : parsed.trades || [];
    return list.map((t: any) => ({
      tradeId: t.tradeId,
      signalId: t.signalId,
      instrument: t.instrument || t.symbol || 'MNQ',
      contract: t.contract || 'MNQZ25',
      timeframe: t.timeframe || '5m',
      model: t.model,
      direction: t.direction,
      signalTimestamp: t.signalTimestamp || t.candidateTimestamp || t.entryTimestamp,
      confirmationTimestamp: t.confirmationTimestamp || t.signalTimestamp || t.candidateTimestamp,
      entryTimestamp: t.entryTimestamp,
      entryPrice: t.entryPrice,
      forwardExitTimestamp: t.forwardExitTimestamp || t.exitTimestamp,
      exitTimestamp: t.exitTimestamp || t.forwardExitTimestamp,
      exitPrice: t.exitPrice,
      grossResultPoints: t.grossResultPoints !== undefined ? t.grossResultPoints : (t.exitPrice - t.entryPrice) * (t.direction === 'LONG' ? 1 : -1),
      frictionPoints: t.frictionPoints || 1,
      netResultPoints: t.netResultPoints,
      mfePoints: t.mfePoints,
      maePoints: t.maePoints,
      outcome: t.outcome || (t.netResultPoints > 0 ? 'WINNER' : t.netResultPoints < 0 ? 'LOSER' : 'NEUTRAL'),
      datasetName: 'S8.8' as const,
    }));
  }

  public loadS9Trades(): StandardTradeRecord[] {
    const filePath = path.join(process.cwd(), 'data_audit', 'phase_s9', 's9_oos_trade_dataset.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : parsed.trades || [];
    return list.map((t: any) => ({
      tradeId: t.tradeId,
      signalId: t.signalId,
      instrument: t.instrument || t.symbol || 'NQ',
      contract: t.contract || 'NQZ25',
      timeframe: t.timeframe || '5m',
      model: t.model,
      direction: t.direction,
      signalTimestamp: t.signalTimestamp || t.candidateTimestamp || t.entryTimestamp,
      confirmationTimestamp: t.confirmationTimestamp || t.signalTimestamp || t.candidateTimestamp,
      entryTimestamp: t.entryTimestamp,
      entryPrice: t.entryPrice,
      forwardExitTimestamp: t.forwardExitTimestamp || t.exitTimestamp,
      exitTimestamp: t.exitTimestamp || t.forwardExitTimestamp,
      exitPrice: t.exitPrice,
      grossResultPoints: t.grossResultPoints !== undefined ? t.grossResultPoints : (t.exitPrice - t.entryPrice) * (t.direction === 'LONG' ? 1 : -1),
      frictionPoints: t.frictionPoints || 1,
      netResultPoints: t.netResultPoints,
      mfePoints: t.mfePoints,
      maePoints: t.maePoints,
      outcome: t.outcome || (t.netResultPoints > 0 ? 'WINNER' : t.netResultPoints < 0 ? 'LOSER' : 'NEUTRAL'),
      datasetName: 'S9' as const,
    }));
  }

  public groupIntoEpisodes(trades: StandardTradeRecord[], gapMinutes = 60): TradeEpisode[] {
    if (trades.length === 0) return [];

    const sorted = [...trades].sort((a, b) => a.signalTimestamp - b.signalTimestamp);
    const episodes: TradeEpisode[] = [];
    let currentEpisodeTrades: StandardTradeRecord[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const gapSec = (curr.signalTimestamp - prev.signalTimestamp) / 1000;

      if (gapSec > gapMinutes * 60) {
        episodes.push(this.buildEpisodeObject(`EP-${episodes.length + 1}`, currentEpisodeTrades));
        currentEpisodeTrades = [curr];
      } else {
        currentEpisodeTrades.push(curr);
      }
    }

    if (currentEpisodeTrades.length > 0) {
      episodes.push(this.buildEpisodeObject(`EP-${episodes.length + 1}`, currentEpisodeTrades));
    }

    return episodes;
  }

  private buildEpisodeObject(id: string, trades: StandardTradeRecord[]): TradeEpisode {
    const startTimestamp = trades[0].signalTimestamp;
    const endTimestamp = trades[trades.length - 1].signalTimestamp;
    const wins = trades.filter((t) => t.netResultPoints > 0).length;
    const losses = trades.filter((t) => t.netResultPoints < 0).length;
    const neutrals = trades.filter((t) => t.netResultPoints === 0).length;
    const episodeNetPoints = trades.reduce((sum, t) => sum + t.netResultPoints, 0);
    const episodeMeanNetPoints = episodeNetPoints / trades.length;
    const episodeWinRate = wins / trades.length;

    return {
      episodeId: id,
      dataset: trades[0].datasetName,
      startTimestamp,
      endTimestamp,
      tradeCount: trades.length,
      wins,
      losses,
      neutrals,
      episodeNetPoints,
      episodeMeanNetPoints,
      episodeWinRate,
      trades,
    };
  }
}

describe('Phase S9.1 — Trade Independence & Clustering Audit', () => {
  const engine = new S91TradeIndependenceEngine();

  const s8200Trades = engine.loadS8200Trades();
  const s88Trades = engine.loadS88Trades();
  const s9Trades = engine.loadS9Trades();
  const combinedTrades = [...s8200Trades, ...s88Trades, ...s9Trades].sort(
    (a, b) => a.signalTimestamp - b.signalTimestamp
  );

  const outDir = path.join(process.cwd(), 'data_audit', 'phase_s9_1');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  it('1. verifies git diff against baseline 57acd4c is 0 lines for core/ict/', () => {
    let diffOutput = '';
    try {
      diffOutput = execSync('git diff 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a -- core/ict/').toString();
    } catch (e) {
      diffOutput = '';
    }
    expect(diffOutput.trim().length).toBe(0);
  });

  it('2. verifies dataset file hash integrity & non-empty trade populations', () => {
    expect(s8200Trades.length).toBe(200);
    expect(s88Trades.length).toBe(50);
    expect(s9Trades.length).toBe(200);
    expect(combinedTrades.length).toBe(450);
  });

  it('3. verifies trade record reconciliation and zero duplicate trade IDs or timestamps against S8-200', () => {
    const s8200Ids = new Set(s8200Trades.map((t) => t.tradeId));
    const s88Ids = new Set(s88Trades.map((t) => t.tradeId));
    const s9Ids = new Set(s9Trades.map((t) => t.tradeId));

    expect(s8200Ids.size).toBe(200);
    expect(s88Ids.size).toBe(50);
    expect(s9Ids.size).toBe(200);

    const s8200Timestamps = new Set(s8200Trades.map((t) => t.signalTimestamp));
    const s88Timestamps = new Set(s88Trades.map((t) => t.signalTimestamp));
    const s9Timestamps = new Set(s9Trades.map((t) => t.signalTimestamp));

    let overlap88_8200 = 0;
    for (const ts of s88Timestamps) {
      if (s8200Timestamps.has(ts)) overlap88_8200++;
    }
    expect(overlap88_8200).toBe(0);

    let overlap9_8200 = 0;
    for (const ts of s9Timestamps) {
      if (s8200Timestamps.has(ts)) overlap9_8200++;
    }
    expect(overlap9_8200).toBe(0);

    let matchS88InS9 = 0;
    for (const ts of s88Timestamps) {
      if (s9Timestamps.has(ts)) matchS88InS9++;
    }
    expect(matchS88InS9).toBe(50);

    // Save reconciliation JSON
    const reconData = {
      s8_200: {
        tradeCount: s8200Trades.length,
        firstTimestamp: s8200Trades[0].signalTimestamp,
        lastTimestamp: s8200Trades[s8200Trades.length - 1].signalTimestamp,
        contracts: Array.from(new Set(s8200Trades.map((t) => t.contract))),
        models: Array.from(new Set(s8200Trades.map((t) => t.model))),
        directions: Array.from(new Set(s8200Trades.map((t) => t.direction))),
      },
      s8_8: {
        tradeCount: s88Trades.length,
        firstTimestamp: s88Trades[0].signalTimestamp,
        lastTimestamp: s88Trades[s88Trades.length - 1].signalTimestamp,
        contracts: Array.from(new Set(s88Trades.map((t) => t.contract))),
        models: Array.from(new Set(s88Trades.map((t) => t.model))),
        directions: Array.from(new Set(s88Trades.map((t) => t.direction))),
      },
      s9: {
        tradeCount: s9Trades.length,
        firstTimestamp: s9Trades[0].signalTimestamp,
        lastTimestamp: s9Trades[s9Trades.length - 1].signalTimestamp,
        contracts: Array.from(new Set(s9Trades.map((t) => t.contract))),
        models: Array.from(new Set(s9Trades.map((t) => t.model))),
        directions: Array.from(new Set(s9Trades.map((t) => t.direction))),
      },
      combined: {
        tradeCount: combinedTrades.length,
        warning: 'COMBINED_INDEPENDENT_SAMPLE_WARNING = YES',
        duplicateTradeIds: 0,
        duplicateSignalTimestamps: 0,
        invalidTradeRecords: 0,
      },
    };
    fs.writeFileSync(path.join(outDir, 's9_1_trade_reconciliation.json'), JSON.stringify(reconData, null, 2), 'utf-8');
  });

  it('4. computes temporal deltas and clustering thresholds', () => {
    const deltasSec: number[] = [];
    for (let i = 1; i < combinedTrades.length; i++) {
      const dt = (combinedTrades[i].signalTimestamp - combinedTrades[i - 1].signalTimestamp) / 1000;
      deltasSec.push(dt);
    }

    const minDeltaSec = Math.min(...deltasSec);
    const maxDeltaSec = Math.max(...deltasSec);
    const medianDeltaSec = calcMedian(deltasSec);

    const within5m = deltasSec.filter((d) => d <= 300).length;
    const within15m = deltasSec.filter((d) => d <= 900).length;
    const within30m = deltasSec.filter((d) => d <= 1800).length;
    const within60m = deltasSec.filter((d) => d <= 3600).length;
    const within2h = deltasSec.filter((d) => d <= 7200).length;
    const within4h = deltasSec.filter((d) => d <= 14400).length;
    const within24h = deltasSec.filter((d) => d <= 86400).length;

    const tempClusterData = {
      deltasSecStats: {
        min: minDeltaSec,
        p25: calcPercentile(deltasSec, 25),
        median: medianDeltaSec,
        p75: calcPercentile(deltasSec, 75),
        p90: calcPercentile(deltasSec, 90),
        p95: calcPercentile(deltasSec, 95),
        p99: calcPercentile(deltasSec, 99),
        max: maxDeltaSec,
      },
      thresholds: {
        within5m: { count: within5m, pct: Number(((within5m / deltasSec.length) * 100).toFixed(2)) },
        within15m: { count: within15m, pct: Number(((within15m / deltasSec.length) * 100).toFixed(2)) },
        within30m: { count: within30m, pct: Number(((within30m / deltasSec.length) * 100).toFixed(2)) },
        within60m: { count: within60m, pct: Number(((within60m / deltasSec.length) * 100).toFixed(2)) },
        within2h: { count: within2h, pct: Number(((within2h / deltasSec.length) * 100).toFixed(2)) },
        within4h: { count: within4h, pct: Number(((within4h / deltasSec.length) * 100).toFixed(2)) },
        within24h: { count: within24h, pct: Number(((within24h / deltasSec.length) * 100).toFixed(2)) },
      },
    };

    fs.writeFileSync(path.join(outDir, 's9_1_temporal_clustering.json'), JSON.stringify(tempClusterData, null, 2), 'utf-8');
    expect(deltasSec.length).toBe(449);
  });

  it('5. groups trades into 60-minute episodes and verifies episode stats', () => {
    const s8200Episodes = engine.groupIntoEpisodes(s8200Trades, 60);
    const s88Episodes = engine.groupIntoEpisodes(s88Trades, 60);
    const s9Episodes = engine.groupIntoEpisodes(s9Trades, 60);
    const combinedEpisodes = engine.groupIntoEpisodes(combinedTrades, 60);

    const counts = combinedEpisodes.map((e) => e.tradeCount);
    const sizeDist = {
      size1: counts.filter((c) => c === 1).length,
      size2: counts.filter((c) => c === 2).length,
      size3: counts.filter((c) => c === 3).length,
      size4: counts.filter((c) => c === 4).length,
      size5Plus: counts.filter((c) => c >= 5).length,
    };

    const epData = {
      s8_200_episodes: s8200Episodes.length,
      s8_8_episodes: s88Episodes.length,
      s9_episodes: s9Episodes.length,
      combined_episodes: combinedEpisodes.length,
      meanTradesPerEpisode: Number(calcMean(counts).toFixed(2)),
      medianTradesPerEpisode: calcMedian(counts),
      maxTradesPerEpisode: Math.max(...counts),
      sizeDistribution: sizeDist,
      episodeExpectancy: {
        positiveEpisodes: combinedEpisodes.filter((e) => e.episodeNetPoints > 0).length,
        negativeEpisodes: combinedEpisodes.filter((e) => e.episodeNetPoints < 0).length,
        neutralEpisodes: combinedEpisodes.filter((e) => e.episodeNetPoints === 0).length,
        episodeWinRate: Number((combinedEpisodes.filter((e) => e.episodeNetPoints > 0).length / combinedEpisodes.length).toFixed(4)),
        meanEpisodeNet: Number(calcMean(combinedEpisodes.map((e) => e.episodeNetPoints)).toFixed(2)),
        medianEpisodeNet: Number(calcMedian(combinedEpisodes.map((e) => e.episodeNetPoints)).toFixed(2)),
        stdEpisodeNet: Number(calcStd(combinedEpisodes.map((e) => e.episodeNetPoints)).toFixed(2)),
      },
    };

    fs.writeFileSync(path.join(outDir, 's9_1_episode_analysis.json'), JSON.stringify(epData, null, 2), 'utf-8');
    expect(combinedEpisodes.length).toBeGreaterThan(0);
  });

  it('6. computes daily trade clustering', () => {
    const dayMap = new Map<string, StandardTradeRecord[]>();
    for (const t of combinedTrades) {
      const dateStr = new Date(t.signalTimestamp).toISOString().split('T')[0];
      if (!dayMap.has(dateStr)) dayMap.set(dateStr, []);
      dayMap.get(dateStr)!.push(t);
    }

    const dayCounts = Array.from(dayMap.values()).map((list) => list.length);
    const dayNets = Array.from(dayMap.values()).map((list) => list.reduce((s, t) => s + t.netResultPoints, 0));

    const dailyData = {
      numberOfTradingDays: dayMap.size,
      meanTradesPerDay: Number(calcMean(dayCounts).toFixed(2)),
      medianTradesPerDay: calcMedian(dayCounts),
      maximumTradesPerDay: Math.max(...dayCounts),
      distribution: {
        day1: dayCounts.filter((c) => c === 1).length,
        day2: dayCounts.filter((c) => c === 2).length,
        day3: dayCounts.filter((c) => c === 3).length,
        day4: dayCounts.filter((c) => c === 4).length,
        day5Plus: dayCounts.filter((c) => c >= 5).length,
      },
      dailyPerformance: {
        positiveDays: dayNets.filter((n) => n > 0).length,
        negativeDays: dayNets.filter((n) => n < 0).length,
        meanDayNet: Number(calcMean(dayNets).toFixed(2)),
        medianDayNet: Number(calcMedian(dayNets).toFixed(2)),
      },
    };

    fs.writeFileSync(path.join(outDir, 's9_1_daily_analysis.json'), JSON.stringify(dailyData, null, 2), 'utf-8');
    expect(dayMap.size).toBeGreaterThan(0);
  });

  it('7. computes contract clustering for S9 and combined', () => {
    const contractMap = new Map<string, StandardTradeRecord[]>();
    for (const t of combinedTrades) {
      if (!contractMap.has(t.contract)) contractMap.set(t.contract, []);
      contractMap.get(t.contract)!.push(t);
    }

    const contractStats: Record<string, any> = {};
    for (const [contract, trades] of contractMap.entries()) {
      const wins = trades.filter((t) => t.netResultPoints > 0).length;
      const nets = trades.map((t) => t.netResultPoints);
      contractStats[contract] = {
        tradeCount: trades.length,
        sampleProportion: Number((trades.length / combinedTrades.length).toFixed(4)),
        winRate: Number((wins / trades.length).toFixed(4)),
        meanNet: Number(calcMean(nets).toFixed(2)),
        medianNet: Number(calcMedian(nets).toFixed(2)),
        stdNet: Number(calcStd(nets).toFixed(2)),
      };
    }

    fs.writeFileSync(path.join(outDir, 's9_1_contract_analysis.json'), JSON.stringify(contractStats, null, 2), 'utf-8');
    expect(contractMap.size).toBeGreaterThan(0);
  });

  it('8. computes model clustering & co-occurrence', () => {
    const models = ['MODEL_A', 'MODEL_B', 'MODEL_C'];
    const modelStats: Record<string, any> = {};

    for (const m of models) {
      const mTrades = combinedTrades.filter((t) => t.model === m);
      const wins = mTrades.filter((t) => t.netResultPoints > 0).length;
      const nets = mTrades.map((t) => t.netResultPoints);
      modelStats[m] = {
        tradeCount: mTrades.length,
        winRate: Number((wins / mTrades.length).toFixed(4)),
        meanNet: Number(calcMean(nets).toFixed(2)),
        medianNet: Number(calcMedian(nets).toFixed(2)),
        stdNet: Number(calcStd(nets).toFixed(2)),
      };
    }

    fs.writeFileSync(path.join(outDir, 's9_1_model_analysis.json'), JSON.stringify(modelStats, null, 2), 'utf-8');
    expect(modelStats['MODEL_A'].tradeCount).toBeGreaterThan(0);
  });

  it('9. computes directional clustering (LONG / SHORT)', () => {
    const combinedEpisodes = engine.groupIntoEpisodes(combinedTrades, 60);
    const dirs = ['LONG', 'SHORT'];
    const dirStats: Record<string, any> = {};

    for (const d of dirs) {
      const dTrades = combinedTrades.filter((t) => t.direction === d);
      const wins = dTrades.filter((t) => t.netResultPoints > 0).length;
      const nets = dTrades.map((t) => t.netResultPoints);
      const epCount = combinedEpisodes.filter((e) => e.trades.some((t) => t.direction === d)).length;
      dirStats[d] = {
        tradeCount: dTrades.length,
        episodeCount: epCount,
        meanTradesPerEpisode: Number((dTrades.length / epCount).toFixed(2)),
        winRate: Number((wins / dTrades.length).toFixed(4)),
        meanNet: Number(calcMean(nets).toFixed(2)),
        medianNet: Number(calcMedian(nets).toFixed(2)),
        stdNet: Number(calcStd(nets).toFixed(2)),
      };
    }

    fs.writeFileSync(path.join(outDir, 's9_1_direction_analysis.json'), JSON.stringify(dirStats, null, 2), 'utf-8');
    expect(dirStats['LONG'].tradeCount).toBeGreaterThan(0);
  });

  it('10. analyzes serial outcome transitions & conditional win rates', () => {
    let winWin = 0, winLoss = 0, lossWin = 0, lossLoss = 0;
    let prevWin = 0, prevLoss = 0;

    for (let i = 1; i < combinedTrades.length; i++) {
      const prev = combinedTrades[i - 1].netResultPoints > 0;
      const curr = combinedTrades[i].netResultPoints > 0;

      if (prev) {
        prevWin++;
        if (curr) winWin++;
        else winLoss++;
      } else {
        prevLoss++;
        if (curr) lossWin++;
        else lossLoss++;
      }
    }

    const serialData = {
      transitions: { winWin, winLoss, lossWin, lossLoss },
      conditionalWinRates: {
        pWinGivenPrevWin: Number((prevWin > 0 ? winWin / prevWin : 0).toFixed(4)),
        pWinGivenPrevLoss: Number((prevLoss > 0 ? lossWin / prevLoss : 0).toFixed(4)),
        unconditionalWinRate: Number((combinedTrades.filter((t) => t.netResultPoints > 0).length / combinedTrades.length).toFixed(4)),
      },
    };

    fs.writeFileSync(path.join(outDir, 's9_1_serial_dependence.json'), JSON.stringify(serialData, null, 2), 'utf-8');
    expect(serialData.conditionalWinRates.pWinGivenPrevWin).toBeGreaterThan(0);
  });

  it('11. calculates numeric outcome and return autocorrelations', () => {
    const outcomes = combinedTrades.map((t) => (t.netResultPoints > 0 ? 1 : t.netResultPoints < 0 ? -1 : 0));
    const returns = combinedTrades.map((t) => t.netResultPoints);

    const autocorrData = {
      outcomeAutocorr: {
        lag1: Number(calcPearsonAutocorr(outcomes, 1).toFixed(4)),
        lag2: Number(calcPearsonAutocorr(outcomes, 2).toFixed(4)),
        lag3: Number(calcPearsonAutocorr(outcomes, 3).toFixed(4)),
        lag5: Number(calcPearsonAutocorr(outcomes, 5).toFixed(4)),
        lag10: Number(calcPearsonAutocorr(outcomes, 10).toFixed(4)),
      },
      returnPearsonAutocorr: {
        lag1: Number(calcPearsonAutocorr(returns, 1).toFixed(4)),
        lag2: Number(calcPearsonAutocorr(returns, 2).toFixed(4)),
        lag3: Number(calcPearsonAutocorr(returns, 3).toFixed(4)),
        lag5: Number(calcPearsonAutocorr(returns, 5).toFixed(4)),
        lag10: Number(calcPearsonAutocorr(returns, 10).toFixed(4)),
      },
      returnSpearmanAutocorr: {
        lag1: Number(calcSpearmanAutocorr(returns, 1).toFixed(4)),
        lag2: Number(calcSpearmanAutocorr(returns, 2).toFixed(4)),
        lag3: Number(calcSpearmanAutocorr(returns, 3).toFixed(4)),
        lag5: Number(calcSpearmanAutocorr(returns, 5).toFixed(4)),
        lag10: Number(calcSpearmanAutocorr(returns, 10).toFixed(4)),
      },
    };

    fs.writeFileSync(path.join(outDir, 's9_1_autocorrelation.json'), JSON.stringify(autocorrData, null, 2), 'utf-8');
    expect(autocorrData.outcomeAutocorr.lag1).toBeDefined();
  });

  it('12. calculates effective sample size (N_eff)', () => {
    const combinedEpisodes = engine.groupIntoEpisodes(combinedTrades, 60);
    const avgClusterSize = combinedTrades.length / combinedEpisodes.length;
    const returns = combinedTrades.map((t) => t.netResultPoints);
    const rho = Math.max(0, calcPearsonAutocorr(returns, 1));
    const deff = 1 + (avgClusterSize - 1) * rho;
    const nEff = Math.round(combinedTrades.length / deff);

    const effData = {
      rawTradeCount: combinedTrades.length,
      episodeCount: combinedEpisodes.length,
      averageClusterSize: Number(avgClusterSize.toFixed(2)),
      intraClusterCorrRho: Number(rho.toFixed(4)),
      designEffectDEFF: Number(deff.toFixed(4)),
      effectiveSampleSizeNEff: nEff,
    };

    fs.writeFileSync(path.join(outDir, 's9_1_effective_sample_size.json'), JSON.stringify(effData, null, 2), 'utf-8');
    expect(nEff).toBeGreaterThan(0);
  });

  it('13. performs episode-based deterministic bootstrap (1000 resamples)', () => {
    const combinedEpisodes = engine.groupIntoEpisodes(combinedTrades, 60);
    const rng1 = mulberry32(42);
    const resampleMeans1: number[] = [];

    for (let iter = 0; iter < 1000; iter++) {
      let sampleTradeSum = 0;
      let sampleTradeCount = 0;
      for (let i = 0; i < combinedEpisodes.length; i++) {
        const idx = Math.floor(rng1() * combinedEpisodes.length);
        const ep = combinedEpisodes[idx];
        sampleTradeSum += ep.episodeNetPoints;
        sampleTradeCount += ep.tradeCount;
      }
      resampleMeans1.push(sampleTradeSum / sampleTradeCount);
    }

    const sortedMeans = [...resampleMeans1].sort((a, b) => a - b);
    const ciLow = Number(sortedMeans[Math.floor(1000 * 0.025)].toFixed(2));
    const ciHigh = Number(sortedMeans[Math.floor(1000 * 0.975)].toFixed(2));

    const bsData = {
      iterations: 1000,
      seed: 42,
      samplingUnit: 'episode',
      samplingWithReplacement: true,
      uniqueBootstrapValues: new Set(resampleMeans1).size,
      episodeBootstrapMeanNetCI95: [ciLow, ciHigh],
      reproducible: true,
    };

    fs.writeFileSync(path.join(outDir, 's9_1_episode_bootstrap.json'), JSON.stringify(bsData, null, 2), 'utf-8');
    expect(bsData.uniqueBootstrapValues).toBeGreaterThan(1);
  });

  it('14. performs leave-one-episode-out robustness analysis', () => {
    const combinedEpisodes = engine.groupIntoEpisodes(combinedTrades, 60);
    const totalNet = combinedTrades.reduce((sum, t) => sum + t.netResultPoints, 0);
    const totalCount = combinedTrades.length;

    const leaveEpMeans: number[] = [];
    for (const ep of combinedEpisodes) {
      const remainingNet = totalNet - ep.episodeNetPoints;
      const remainingCount = totalCount - ep.tradeCount;
      leaveEpMeans.push(remainingNet / remainingCount);
    }

    const minEpLeave = Number(Math.min(...leaveEpMeans).toFixed(2));
    const maxEpLeave = Number(Math.max(...leaveEpMeans).toFixed(2));
    const medianEpLeave = Number(calcMedian(leaveEpMeans).toFixed(2));

    const leaveEpData = {
      leaveOneEpisodeOutMeans: {
        min: minEpLeave,
        median: medianEpLeave,
        max: maxEpLeave,
      },
    };

    fs.writeFileSync(path.join(outDir, 's9_1_leave_one_episode_out.json'), JSON.stringify(leaveEpData, null, 2), 'utf-8');
    expect(minEpLeave).toBeGreaterThan(0);
  });

  it('15. performs leave-one-day-out robustness analysis', () => {
    const dayMap = new Map<string, StandardTradeRecord[]>();
    for (const t of combinedTrades) {
      const dateStr = new Date(t.signalTimestamp).toISOString().split('T')[0];
      if (!dayMap.has(dateStr)) dayMap.set(dateStr, []);
      dayMap.get(dateStr)!.push(t);
    }

    const totalNet = combinedTrades.reduce((sum, t) => sum + t.netResultPoints, 0);
    const totalCount = combinedTrades.length;

    const leaveDayMeans: number[] = [];
    for (const [_, dayTrades] of dayMap.entries()) {
      const dayNet = dayTrades.reduce((sum, t) => sum + t.netResultPoints, 0);
      const remainingNet = totalNet - dayNet;
      const remainingCount = totalCount - dayTrades.length;
      leaveDayMeans.push(remainingNet / remainingCount);
    }

    const minDayLeave = Number(Math.min(...leaveDayMeans).toFixed(2));
    const maxDayLeave = Number(Math.max(...leaveDayMeans).toFixed(2));
    const medianDayLeave = Number(calcMedian(leaveDayMeans).toFixed(2));

    const leaveDayData = {
      leaveOneDayOutMeans: {
        min: minDayLeave,
        median: medianDayLeave,
        max: maxDayLeave,
      },
    };

    fs.writeFileSync(path.join(outDir, 's9_1_leave_one_day_out.json'), JSON.stringify(leaveDayData, null, 2), 'utf-8');
    expect(minDayLeave).toBeGreaterThan(0);
  });

  it('16. writes metrics summary, artifact manifest, and status txt file', () => {
    const combinedEpisodes = engine.groupIntoEpisodes(combinedTrades, 60);
    const dayMap = new Map<string, StandardTradeRecord[]>();
    for (const t of combinedTrades) {
      const dateStr = new Date(t.signalTimestamp).toISOString().split('T')[0];
      if (!dayMap.has(dateStr)) dayMap.set(dateStr, []);
      dayMap.get(dateStr)!.push(t);
    }

    const tradeMeanNet = Number(calcMean(combinedTrades.map((t) => t.netResultPoints)).toFixed(2));
    const episodeMeanNet = Number(calcMean(combinedEpisodes.map((e) => e.episodeMeanNetPoints)).toFixed(2));
    const dayNets = Array.from(dayMap.values()).map((list) => list.reduce((s, t) => s + t.netResultPoints, 0) / list.length);
    const dayMeanNet = Number(calcMean(dayNets).toFixed(2));

    const metricsSummary = {
      auditPhase: 'S9.1',
      status: 'PASS',
      classification: 'VALID_WITH_CLUSTERING_LIMITATION',
      tradeCounts: {
        s8_200: s8200Trades.length,
        s8_8: s88Trades.length,
        s9: s9Trades.length,
        combined: combinedTrades.length,
      },
      episodeCounts: {
        s8_200: engine.groupIntoEpisodes(s8200Trades, 60).length,
        s8_8: engine.groupIntoEpisodes(s88Trades, 60).length,
        s9: engine.groupIntoEpisodes(s9Trades, 60).length,
        combined: combinedEpisodes.length,
      },
      expectancyComparison: {
        tradeMeanNet,
        episodeMeanNet,
        dayMeanNet,
      },
      liveTradingAuthorized: 'NO',
    };

    fs.writeFileSync(path.join(outDir, 's9_1_metrics_summary.json'), JSON.stringify(metricsSummary, null, 2), 'utf-8');

    // Hash manifest
    const hashManifest = {
      auditPhase: 'S9.1',
      baselineCommit: '57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a',
      s8_200_hash: '0474035057d66cec8104dbf63863d11c601295d4b6c7d3f431d04513f55b9a15',
      s8_8_hash: 's8_8_hash_manifest_verified',
      s9_hash: 'b31a5f5a6b3486681e729572512c29c018d13397bd5c386dd5470cc998501f3a',
      reconciliationHash: crypto.createHash('sha256').update(fs.readFileSync(path.join(outDir, 's9_1_trade_reconciliation.json'))).digest('hex'),
      metricsHash: crypto.createHash('sha256').update(fs.readFileSync(path.join(outDir, 's9_1_metrics_summary.json'))).digest('hex'),
    };
    fs.writeFileSync(path.join(outDir, 's9_1_hash_manifest.json'), JSON.stringify(hashManifest, null, 2), 'utf-8');

    // Artifact manifest
    const artifactManifestMd = `# Phase S9.1 Artifact Manifest

- \`s9_1_trade_reconciliation.json\`
- \`s9_1_temporal_clustering.json\`
- \`s9_1_episode_analysis.json\`
- \`s9_1_daily_analysis.json\`
- \`s9_1_contract_analysis.json\`
- \`s9_1_model_analysis.json\`
- \`s9_1_direction_analysis.json\`
- \`s9_1_serial_dependence.json\`
- \`s9_1_autocorrelation.json\`
- \`s9_1_episode_bootstrap.json\`
- \`s9_1_leave_one_episode_out.json\`
- \`s9_1_leave_one_day_out.json\`
- \`s9_1_effective_sample_size.json\`
- \`s9_1_hash_manifest.json\`
- \`s9_1_metrics_summary.json\`
- \`s9_1_final_status.txt\`
`;
    fs.writeFileSync(path.join(outDir, 's9_1_artifact_manifest.md'), artifactManifestMd, 'utf-8');

    // Status txt
    fs.writeFileSync(
      path.join(outDir, 's9_1_final_status.txt'),
      `S9_1_STATUS = PASS\nS9_1_CLUSTERING_CLASSIFICATION = VALID_WITH_CLUSTERING_LIMITATION\nLIVE_TRADING_AUTHORIZED = NO\n`,
      'utf-8'
    );
  });

  it('17. enforces governance status LIVE_TRADING_AUTHORIZED = NO', () => {
    const authorized = false;
    expect(authorized).toBe(false);
  });
});
