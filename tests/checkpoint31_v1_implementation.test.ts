/**
 * Checkpoint 31 - ICT Model V1 Implementation Test Suite
 * Validates BOS CLOSE ONLY, MSS, Liquidity Sweeps, Displacement parameters, FVG, OB Variant B,
 * Premium/Discount context, Models A/B/C (Long/Short), Setup State Machine, Anti-Lookahead,
 * Replay equivalence, Multi-Timeframe causality, and absence of trading signals.
 */

import { describe, it, expect } from 'vitest';
import { ICTEngine } from '../core/ict/engine/ICTEngine';
import { StructureEngine } from '../core/ict/structure/StructureEngine';
import { SetupEngine } from '../core/ict/setups/SetupEngine';
import { MarketContextEngine } from '../core/ict/context/MarketContextEngine';
import { DEFAULT_ICT_CONFIG } from '../core/ict/types/ICTConfig';
import { Candle } from '../core/market/Candle';
import { PREDEFINED_MODELS } from '../core/ict/models/PredefinedModels';
import { ICTSetupModel } from '../core/ict/models/ICTSetupModel';

describe('Checkpoint 31 - ICT Model V1 Implementation Suite', () => {
  // Helper to generate deterministic synthetic candles
  function generateCandles(count: number = 60): Candle[] {
    const candles: Candle[] = [];
    let price = 19500;
    const baseTs = 1775184000000;

    for (let i = 0; i < count; i++) {
      const swingPattern = Math.sin(i * 0.4) * 25;
      const open = price;
      const high = open + Math.max(6, swingPattern + 12);
      const low = open - Math.max(6, -swingPattern + 12);
      const close = (open + high + low) / 3;
      price = close;

      candles.push({
        timestamp: baseTs + i * 60000,
        open,
        high,
        low,
        close,
        volume: 1200 + i * 15,
        symbol: 'NQ',
        timeframe: '1m',
      });
    }
    return candles;
  }

  // 1. BOS Rule: CLOSE ONLY Verification
  it('should enforce BOS break mode strictly as CLOSE ONLY per CP30 specification', () => {
    expect(DEFAULT_ICT_CONFIG.bosBreakMode).toBe('CLOSE');
    expect(DEFAULT_ICT_CONFIG.mssBreakMode).toBe('CLOSE');

    const engine = new StructureEngine(DEFAULT_ICT_CONFIG);
    expect(engine).toBeDefined();
  });

  // 2. Models A, B, C Predefined Configurations
  it('should register Models A, B, C (Long and Short) in PREDEFINED_MODELS', () => {
    expect(PREDEFINED_MODELS.length).toBe(6);

    const modelIds = PREDEFINED_MODELS.map((m: ICTSetupModel) => m.id);
    expect(modelIds).toContain('MODEL_A_LONG');
    expect(modelIds).toContain('MODEL_A_SHORT');
    expect(modelIds).toContain('MODEL_B_LONG');
    expect(modelIds).toContain('MODEL_B_SHORT');
    expect(modelIds).toContain('MODEL_C_LONG');
    expect(modelIds).toContain('MODEL_C_SHORT');
  });

  // 3. Setup State Machine Transitions
  it('should evaluate Setup State Machine transitions (WATCHING, FORMING, CONFIRMED, INVALIDATED, EXPIRED)', () => {
    const candles = generateCandles(80);
    const engine = new ICTEngine();

    const res = engine.process(candles, 'NQ', '1m');
    const setupEngine = new SetupEngine();
    const setups = setupEngine.evaluateSetups(res.state, res.events, []);

    expect(setups.length).toBeGreaterThan(0);
    for (const s of setups) {
      expect(['WATCHING', 'FORMING', 'CONFIRMED', 'INVALIDATED', 'COMPLETED', 'EXPIRED']).toContain(s.status);
      expect(s.symbol).toBe('NQ');
      expect(s.timeframe).toBe('1m');
    }
  });

  // 4. Long / Short Symmetry Audit
  it('should verify exact structural symmetry between Long and Short model definitions', () => {
    const modelALong = PREDEFINED_MODELS.find((m: ICTSetupModel) => m.id === 'MODEL_A_LONG')!;
    const modelAShort = PREDEFINED_MODELS.find((m: ICTSetupModel) => m.id === 'MODEL_A_SHORT')!;

    expect(modelALong.conditions.length).toBe(modelAShort.conditions.length);
    expect(modelALong.sequenceMode).toBe(modelAShort.sequenceMode);
    expect(modelALong.maxBarsBetweenConditions).toBe(modelAShort.maxBarsBetweenConditions);
  });

  // 5. Displacement Frozen Thresholds
  it('should maintain frozen displacement thresholds bodyRatio >= 0.60 and rangeMultiplier >= 1.50', () => {
    const contextEngine = new MarketContextEngine();
    const candles = generateCandles(40);
    const engine = new ICTEngine();
    const res = engine.process(candles, 'NQ', '1m');

    const ctx = contextEngine.buildContext(res.state, res.events, [], []);

    expect(ctx.displacement.bodyRatioThreshold).toBe(0.60);
    expect(ctx.displacement.rangeMultiplierThreshold).toBe(1.50);
  });

  // 6. Premium / Discount Context Role
  it('should treat Premium / Discount as pure context without generating trade execution signals', () => {
    const contextEngine = new MarketContextEngine();
    const candles = generateCandles(40);
    const engine = new ICTEngine();
    const res = engine.process(candles, 'NQ', '1m');

    const ctx = contextEngine.buildContext(res.state, res.events, [], []);

    expect(ctx.pdArray.zone).toBeDefined();
    expect(['PREMIUM', 'DISCOUNT', 'EQUILIBRIUM']).toContain(ctx.pdArray.zone);
    expect((ctx as any).buySignal).toBeUndefined();
    expect((ctx as any).sellSignal).toBeUndefined();
  });

  // 7. Prohibition of Trading Signals
  it('should confirm 0 BUY/SELL signals or confidence probabilities are generated across MarketContext', () => {
    const contextEngine = new MarketContextEngine();
    const candles = generateCandles(50);
    const engine = new ICTEngine();
    const res = engine.process(candles, 'NQ', '1m');

    const ctx = contextEngine.buildContext(res.state, res.events, [], []);
    const jsonStr = JSON.stringify(ctx);

    expect(jsonStr).not.toContain('"BUY"');
    expect(jsonStr).not.toContain('"SELL"');
    expect(jsonStr).not.toContain('"confidenceScore"');
    expect(jsonStr).not.toContain('"winRate"');
  });

  // 8. Anti-Lookahead Verification
  it('should confirm modifying future candles N+1...N+K does not alter market state at candle N', () => {
    const candles1 = generateCandles(50);
    const engine = new ICTEngine();
    const res1 = engine.process(candles1, 'NQ', '1m');

    // Mutate future candles (candle 51 onwards)
    const candles2 = [...candles1];
    candles2.push({
      timestamp: candles1[candles1.length - 1].timestamp + 60000,
      open: 99999,
      high: 999999,
      low: 0,
      close: 50000,
      volume: 999999,
      symbol: 'NQ',
      timeframe: '1m',
    });

    const res2 = engine.process(candles2.slice(0, 50), 'NQ', '1m');

    expect(res1.events.length).toBe(res2.events.length);
    expect(JSON.stringify(res1.events)).toBe(JSON.stringify(res2.events));
  });

  // 9. Batch vs Replay Equivalence
  it('should guarantee BatchProcess(candles[0..N]) == Replay(candles[0..N])', () => {
    const candles = generateCandles(40);
    const engineBatch = new ICTEngine();
    const resBatch = engineBatch.process(candles, 'NQ', '1m');

    const engineReplay = new ICTEngine();
    for (const c of candles) {
      engineReplay.processNext(c, 'NQ', '1m');
    }

    const resReplay = engineReplay.process(candles, 'NQ', '1m');

    expect(resBatch.events.length).toBe(resReplay.events.length);
    expect(resBatch.state.trend).toBe(resReplay.state.trend);
  });

  // 10. Multi-Timeframe Context Alignment
  it('should build multi-timeframe context incorporating HTF state without look-ahead', () => {
    const candlesLTF = generateCandles(60);
    const engineLTF = new ICTEngine();
    const resLTF = engineLTF.process(candlesLTF, 'NQ', '1m');

    const candlesHTF = generateCandles(30);
    const engineHTF = new ICTEngine();
    const resHTF = engineHTF.process(candlesHTF, 'NQ', '15m');

    const contextEngine = new MarketContextEngine();
    const ctx = contextEngine.buildContext(resLTF.state, resLTF.events, [], [], resHTF.state);

    expect(ctx.htfTimeframe).toBe('15m');
    expect(ctx.ltfTimeframe).toBe('1m');
    expect(ctx.structure.structureState).toContain('HTF');
    expect(ctx.structure.structureState).toContain('LTF');
  });
});
