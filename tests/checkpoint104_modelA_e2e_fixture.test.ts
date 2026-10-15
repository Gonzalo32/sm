import { describe, it, expect } from 'vitest';
import { Candle } from '../core/market/Candle';
import { ICTEngine } from '../core/ict/engine/ICTEngine';
import { SetupEngine } from '../core/ict/setups/SetupEngine';
import { ConfluenceEngine } from '../core/ict/confluence/ConfluenceEngine';
import { MarketRiskFilter } from '../core/analyst/MarketRiskFilter';
import { MarketDataIntegrityValidator } from '../core/analyst/MarketDataIntegrityValidator';
import { MarketAnalystEngine } from '../core/analyst/MarketAnalystEngine';
import { MarketScenario } from '../core/analyst/MarketAnalystTypes';
import { MODEL_A_LONG, MODEL_A_SHORT } from '../core/ict/models/PredefinedModels';
import { DEFAULT_ICT_CONFIG } from '../core/ict/types/ICTConfig';

function makeCandle(
  timestamp: number,
  open: number,
  high: number,
  low: number,
  close: number,
  volume: number = 100
): Candle {
  return { timestamp, open, high, low, close, volume };
}

describe('CP104 — Stage 4: Model A End-to-End Offline Fixture Verification', () => {
  const interval = 60000;
  const t0 = 1728800000000;

  /**
   * Builds the primary 31-candle deterministic fixture for Model A Long.
   *
   * Candle breakdown:
   * - Indices 0..2: Initial baseline around 20100
   * - Indices 3..7: Major Swing High at index 5 (high 20400) -> creates unswept BSL target pool at 20400
   * - Indices 8..13: Consolidation around 20100
   * - Indices 14..18: Move down and form SL0 at index 16 (low 20020)
   * - Index 19: Bearish BOS breaking SL0 (20020) on close (19995 < 20020) -> establishes BEARISH trend
   * - Indices 20..23: Retrace up to form Swing High 1 (SH1) at index 21 (high 20050)
   * - Indices 24..26: Drop down to form Swing Low 1 (SL1) at index 24 (low 19930) -> registers SSL level
   * - Index 27: Condition 1 - LIQUIDITY SWEEP of SSL (19930) with low 19920, close 19950, high 19985
   * - Index 28: FVG Candle 1 (c1) with high 19990, low 19948
   * - Index 29: Condition 2 - BULLISH MSS closing at 20065 (> SH1 20050) from BEARISH trend
   *   (low 19980 <= candle 27 high 19985, preventing premature FVG at index 29)
   * - Index 30: Condition 3 - BULLISH FVG CREATION with low 20010 (> c1 high 19990, gap = 20 pts)
   */
  function buildDeterministicFixture(baseTime: number = t0): Candle[] {
    const candles: Candle[] = [];

    // 0 - 2: Baseline candles
    candles.push(makeCandle(baseTime + 0 * interval, 20100, 20105, 20095, 20100));
    candles.push(makeCandle(baseTime + 1 * interval, 20100, 20105, 20095, 20100));
    candles.push(makeCandle(baseTime + 2 * interval, 20100, 20105, 20095, 20100));

    // 3 - 7: Major Swing High at index 5 (high 20400) -> registers unswept BSL target pool at 20400
    // Wicks overlap across consecutive alternating candles to prevent early FVG formation
    candles.push(makeCandle(baseTime + 3 * interval, 20100, 20200, 20095, 20180));
    candles.push(makeCandle(baseTime + 4 * interval, 20180, 20300, 20100, 20280));
    candles.push(makeCandle(baseTime + 5 * interval, 20280, 20400, 20190, 20350)); // Major SH at 20400
    candles.push(makeCandle(baseTime + 6 * interval, 20350, 20350, 20170, 20250));
    candles.push(makeCandle(baseTime + 7 * interval, 20250, 20250, 20160, 20180)); // Confirms Major SH

    // 8 - 13: Neutral baseline candles at 20100 with overlapping wicks
    candles.push(makeCandle(baseTime + 8 * interval, 20180, 20180, 20095, 20120));
    candles.push(makeCandle(baseTime + 9 * interval, 20120, 20170, 20095, 20105));
    for (let i = 10; i <= 13; i++) {
      candles.push(makeCandle(baseTime + i * interval, 20105, 20110, 20095, 20100));
    }

    // 14 - 18: Move down and form SL0 at index 16 (low 20020)
    candles.push(makeCandle(baseTime + 14 * interval, 20100, 20105, 20070, 20075));
    candles.push(makeCandle(baseTime + 15 * interval, 20075, 20100, 20050, 20055));
    candles.push(makeCandle(baseTime + 16 * interval, 20055, 20075, 20020, 20025)); // SL0 candidate (20020)
    candles.push(makeCandle(baseTime + 17 * interval, 20025, 20055, 20025, 20045));
    candles.push(makeCandle(baseTime + 18 * interval, 20045, 20050, 20025, 20035)); // Confirms SL0

    // 19: Bearish BOS: breaks SL0 (20020) on close (19995 < 20020) -> establishes BEARISH trend
    candles.push(makeCandle(baseTime + 19 * interval, 20035, 20035, 19990, 19995));

    // 20 - 23: Retrace up to form Swing High 1 (SH1) at index 21 (high 20050)
    candles.push(makeCandle(baseTime + 20 * interval, 19995, 20030, 19990, 20025));
    candles.push(makeCandle(baseTime + 21 * interval, 20025, 20050, 19990, 20045)); // SH1 candidate (20050)
    candles.push(makeCandle(baseTime + 22 * interval, 20045, 20045, 19990, 20020));
    candles.push(makeCandle(baseTime + 23 * interval, 20020, 20025, 19960, 20010)); // Confirms SH1 -> activeHigh = 20050

    // 24 - 26: Drop down to form Swing Low 1 (SL1) at index 24 (low 19930) -> generates SSL level
    candles.push(makeCandle(baseTime + 24 * interval, 20010, 20010, 19930, 19935)); // SL1 candidate (19930)
    candles.push(makeCandle(baseTime + 25 * interval, 19935, 19970, 19932, 19965)); // Valid OHLC (low <= min(open, close))
    candles.push(makeCandle(baseTime + 26 * interval, 19965, 20015, 19940, 19970)); // Confirms SL1 -> SSL at 19930

    // 27: CONDITION 1 - LIQUIDITY SWEEP of SSL (19930)
    // Low 19920 sweeps below 19930; close 19950 confirms liquidity absorption
    // High 19985 overlaps with candle 29 low (19980) so no premature FVG is created at index 29
    candles.push(makeCandle(baseTime + 27 * interval, 19970, 19985, 19920, 19950));

    // 28: FVG candle 1 (c1) with high 19990
    candles.push(makeCandle(baseTime + 28 * interval, 19950, 19990, 19948, 19985));

    // 29: CONDITION 2 - BULLISH MSS
    // Displacement candle closes at 20065 (> active SH1 20050) -> Bullish MSS confirmed!
    // Low is 19980 (<= candle 27 high 19985 -> no FVG at index 29)
    candles.push(makeCandle(baseTime + 29 * interval, 19985, 20070, 19980, 20065));

    // 30: CONDITION 3 - BULLISH FVG CREATION
    // Candle 3 low 20010 > candle 1 high 19990 -> FVG [19990, 20010] size 20.0 pts >= 0.25
    candles.push(makeCandle(baseTime + 30 * interval, 20065, 20120, 20010, 20110));

    return candles;
  }

  // 1. Positive Verification: Real Detectors & SetupEngine
  describe('1. Positive Model A Long Confirmation (End-to-End)', () => {
    it('1.1. Detects complete Sweep -> MSS -> FVG sequence and confirms MODEL_A_LONG', () => {
      const candles = buildDeterministicFixture();
      expect(candles.length).toBe(31);

      const engine = new ICTEngine(DEFAULT_ICT_CONFIG);
      const setupEngine = new SetupEngine([MODEL_A_LONG]);
      const confluenceEngine = new ConfluenceEngine();

      const { state, events } = engine.process(candles, 'MNQ', '1m');

      // 1. Trend progression check: starts sideways, flips to bearish on BOS, then flips to bullish on MSS
      expect(state.trend).toBe('BULLISH');

      // 2. Verify Liquidity Sweep of SSL at index 27
      const sslSweep = events.find(
        (e) => e.type === 'LIQUIDITY_SWEEP' && (e as any).sweep?.liquidityType === 'SSL' && e.candleIndex === 27
      );
      expect(sslSweep).toBeDefined();
      expect(sslSweep?.candleIndex).toBe(27);
      expect((sslSweep as any)?.sweep?.extremePrice).toBe(19920);

      // 3. Verify Bullish MSS at index 29
      const mssEvent = events.find((e) => e.type === 'MSS' && (e as any).direction === 'BULLISH');
      expect(mssEvent).toBeDefined();
      expect(mssEvent?.candleIndex).toBe(29);
      expect((mssEvent as any)?.breakPrice).toBe(20065);
      expect((mssEvent as any)?.priorTrend).toBe('BEARISH');

      // 4. Verify Bullish FVG at index 30
      const fvgEvent = events.find(
        (e) => e.type === 'FVG_CREATED' && (e as any)?.fvg?.direction === 'BULLISH' && e.candleIndex === 30
      );
      expect(fvgEvent).toBeDefined();
      expect(fvgEvent?.candleIndex).toBe(30);
      expect((fvgEvent as any)?.fvg?.lowPrice).toBe(19990);
      expect((fvgEvent as any)?.fvg?.highPrice).toBe(20010);
      expect((fvgEvent as any)?.fvg?.gapSize).toBe(20);

      // 5. Verify SetupEngine Evaluation
      const confluences = confluenceEngine.evaluateConfluences(state, events);
      const setups = setupEngine.evaluateSetups(state, events, confluences);

      const modelASetup = setups.find((s) => s.id.includes('MODEL_A_LONG'));
      expect(modelASetup).toBeDefined();
      expect(modelASetup?.status).toBe('CONFIRMED');
      expect(modelASetup?.fulfilledConfluences).toEqual(['LIQUIDITY_SWEEP', 'MSS_CONFIRMED', 'FVG_CONFLUENCE']);
      expect(modelASetup?.missingConfluences).toEqual([]);
      expect(modelASetup?.invalidatingConditions).toEqual([]);
      expect(modelASetup?.confirmedTimestamp).toBe(candles[30].timestamp);
    });
  });

  // 2. Negative Controls: Missing or Malformed Setup Conditions
  describe('2. Negative Controls (Real Production Detectors)', () => {
    it('2.1. Fails to confirm when no qualifying liquidity sweep occurs', () => {
      const candles = buildDeterministicFixture();

      // Modify candle 27 so low (19935) does NOT penetrate SSL (19930)
      candles[27] = makeCandle(candles[27].timestamp, 19970, 19985, 19935, 19950);

      const engine = new ICTEngine(DEFAULT_ICT_CONFIG);
      const { events } = engine.process(candles, 'MNQ', '1m');

      // Verify SSL sweep at index 27 is absent
      const sslSweep = events.find(
        (e) => e.type === 'LIQUIDITY_SWEEP' && (e as any).sweep?.liquidityType === 'SSL' && e.candleIndex === 27
      );
      expect(sslSweep).toBeUndefined();
    });

    it('2.2. Fails to confirm when no valid MSS occurs (price fails to break swing high)', () => {
      const candles = buildDeterministicFixture();

      // Modify candle 29 and 30 so price remains strictly below all prior swing highs (20015 and 20050)
      candles[29] = makeCandle(candles[29].timestamp, 19985, 20005, 19975, 19980);
      candles[30] = makeCandle(candles[30].timestamp, 19980, 20010, 19975, 19990);

      const engine = new ICTEngine(DEFAULT_ICT_CONFIG);
      const setupEngine = new SetupEngine([MODEL_A_LONG]);
      const confluenceEngine = new ConfluenceEngine();

      const { state, events } = engine.process(candles, 'MNQ', '1m');

      // Verify Bullish MSS is NOT emitted anywhere
      const mssEvent = events.find((e) => e.type === 'MSS' && (e as any).direction === 'BULLISH');
      expect(mssEvent).toBeUndefined();

      const confluences = confluenceEngine.evaluateConfluences(state, events);
      const setups = setupEngine.evaluateSetups(state, events, confluences);
      const modelASetup = setups.find((s) => s.id.includes('MODEL_A_LONG'));

      expect(modelASetup).toBeDefined();
      expect(modelASetup?.status).not.toBe('CONFIRMED');
      expect(modelASetup?.missingConfluences).toContain('MSS_CONFIRMED');
    });

    it('2.3. Fails to confirm when no qualifying FVG forms (overlap prevents gap)', () => {
      const candles = buildDeterministicFixture();

      // Modify candle 30 so low (19980) overlaps c1 high (19990) -> no gap created
      candles[30] = makeCandle(candles[30].timestamp, 20065, 20120, 19980, 20110);

      const engine = new ICTEngine(DEFAULT_ICT_CONFIG);
      const setupEngine = new SetupEngine([MODEL_A_LONG]);
      const confluenceEngine = new ConfluenceEngine();

      const { state, events } = engine.process(candles, 'MNQ', '1m');

      // Verify FVG is NOT created at index 30
      const fvgEvent = events.find((e) => e.type === 'FVG_CREATED' && e.candleIndex === 30);
      expect(fvgEvent).toBeUndefined();

      const confluences = confluenceEngine.evaluateConfluences(state, events);
      const setups = setupEngine.evaluateSetups(state, events, confluences);
      const modelASetup = setups.find((s) => s.id.includes('MODEL_A_LONG'));

      expect(modelASetup?.status).not.toBe('CONFIRMED');
      expect(modelASetup?.missingConfluences).toContain('FVG_CONFLUENCE');
    });

    it('2.4. Fails to confirm when condition spacing exceeds maxBarsBetweenConditions (25 bars)', () => {
      // In the base fixture, Sweep is at index 27 and MSS is at index 29.
      // Insert 26 neutral spacer candles between MSS (index 29) and FVG (now at index 58).
      const baseCandles = buildDeterministicFixture();
      const extendedCandles: Candle[] = [];

      // Add candles 0..29 (up through the Bullish MSS)
      for (let i = 0; i <= 29; i++) {
        extendedCandles.push(baseCandles[i]);
      }

      // Add 26 neutral spacer candles oscillating at 20010 (below SH1 20050, above SL1 19930)
      const mssTs = baseCandles[29].timestamp;
      for (let s = 1; s <= 26; s++) {
        extendedCandles.push(makeCandle(mssTs + s * interval, 20010, 20015, 20005, 20010));
      }

      // Now add 3 candles at the end that form an FVG:
      // c1: index 56 (high 20020)
      // c2: index 57 (displacement candle open 20015, close 20045, high 20050)
      // c3: index 58 (low 20030 > 20020 -> FVG created at index 58 without breaking 20070 or 19920)
      const postSpacerTs = mssTs + 27 * interval;
      extendedCandles.push(makeCandle(postSpacerTs, 20010, 20020, 20005, 20015)); // c1
      extendedCandles.push(makeCandle(postSpacerTs + 1 * interval, 20015, 20050, 20010, 20045)); // c2
      extendedCandles.push(makeCandle(postSpacerTs + 2 * interval, 20045, 20060, 20030, 20055)); // c3 (FVG)

      const engine = new ICTEngine(DEFAULT_ICT_CONFIG);
      const setupEngine = new SetupEngine([MODEL_A_LONG]);
      const confluenceEngine = new ConfluenceEngine();

      const { state, events } = engine.process(extendedCandles, 'MNQ', '1m');
      const confluences = confluenceEngine.evaluateConfluences(state, events);
      const setups = setupEngine.evaluateSetups(state, events, confluences);

      const modelASetup = setups.find((s) => s.id.includes('MODEL_A_LONG'));
      expect(modelASetup).toBeDefined();

      // Since the bar span between Sweep (idx 27) and FVG (idx 58) is 31 bars (> max 25), status is EXPIRED
      expect(modelASetup?.status).toBe('EXPIRED');
      expect(modelASetup?.invalidatingConditions).toContain('Max bars between conditions exceeded');
    });

    it('2.5. Rejects setup when conditions occur in the wrong order', () => {
      // In SetupEngine, when sequenceMode === 'ORDERED', each condition's timestamp must be >= previous condition
      const unorderedModel = {
        ...MODEL_A_LONG,
        id: 'MODEL_A_REVERSED_ORDER',
        conditions: [
          { id: 'c1', type: 'FVG_CONFLUENCE' as const, category: 'REQUIRED' as const, description: 'FVG first' },
          { id: 'c2', type: 'LIQUIDITY_SWEEP' as const, category: 'REQUIRED' as const, description: 'Sweep second' },
          { id: 'c3', type: 'MSS_CONFIRMED' as const, category: 'REQUIRED' as const, description: 'MSS third' },
        ],
      };

      const candles = buildDeterministicFixture();
      const engine = new ICTEngine(DEFAULT_ICT_CONFIG);
      const customSetupEngine = new SetupEngine([unorderedModel]);
      const confluenceEngine = new ConfluenceEngine();

      const { state, events } = engine.process(candles, 'MNQ', '1m');
      const confluences = confluenceEngine.evaluateConfluences(state, events);
      const setups = customSetupEngine.evaluateSetups(state, events, confluences);

      const reversedSetup = setups.find((s) => s.id.includes('MODEL_A_REVERSED_ORDER'));
      expect(reversedSetup).toBeDefined();
      // Because FVG happened at index 30, and Sweep at index 27, when FVG is required first, order is violated -> EXPIRED
      expect(reversedSetup?.status).toBe('EXPIRED');
      expect(reversedSetup?.invalidatingConditions).toContain('Sequence order violated');
    });
  });

  // 3. Causality & Step-by-Step Progression (No Lookahead)
  describe('3. Causality and Temporal Lookahead Checks', () => {
    it('3.1. Progressive slices show causal state transition from INVALIDATED (bearish trend) to FORMING to CONFIRMED', () => {
      const candles = buildDeterministicFixture();
      const engine = new ICTEngine(DEFAULT_ICT_CONFIG);
      const setupEngine = new SetupEngine([MODEL_A_LONG]);
      const confluenceEngine = new ConfluenceEngine();

      // Slice 1: Up through Sweep (index 27)
      // Prior trend is BEARISH with a bearish BOS, so LONG setup is INVALIDATED by opposing trend
      const slice28 = candles.slice(0, 28);
      const res1 = engine.process(slice28, 'MNQ', '1m');
      const conf1 = confluenceEngine.evaluateConfluences(res1.state, res1.events);
      const setups1 = setupEngine.evaluateSetups(res1.state, res1.events, conf1);
      const setupAtSweep = setups1.find((s) => s.id.includes('MODEL_A_LONG'));

      expect(setupAtSweep?.status).toBe('INVALIDATED');
      expect(setupAtSweep?.invalidatingConditions).toContain('Opposing BOS trend break');

      // Slice 2: Up through MSS (index 29)
      // The Bullish MSS flips trend to BULLISH, lifting the opposing trend invalidation.
      // Status becomes FORMING (Sweep and MSS fulfilled, FVG pending).
      const slice30 = candles.slice(0, 30);
      const res2 = engine.process(slice30, 'MNQ', '1m');
      const conf2 = confluenceEngine.evaluateConfluences(res2.state, res2.events);
      const setups2 = setupEngine.evaluateSetups(res2.state, res2.events, conf2);
      const setupAtMss = setups2.find((s) => s.id.includes('MODEL_A_LONG'));

      expect(setupAtMss?.status).toBe('FORMING');
      expect(setupAtMss?.fulfilledConfluences).toContain('LIQUIDITY_SWEEP');
      expect(setupAtMss?.fulfilledConfluences).toContain('MSS_CONFIRMED');
      expect(setupAtMss?.missingConfluences).toEqual(['FVG_CONFLUENCE']);

      // Slice 3: Full sequence including FVG (index 30)
      // All 3 required conditions fulfilled in order -> CONFIRMED
      const slice31 = candles.slice(0, 31);
      const res3 = engine.process(slice31, 'MNQ', '1m');
      const conf3 = confluenceEngine.evaluateConfluences(res3.state, res3.events);
      const setups3 = setupEngine.evaluateSetups(res3.state, res3.events, conf3);
      const setupAtFvg = setups3.find((s) => s.id.includes('MODEL_A_LONG'));

      expect(setupAtFvg?.status).toBe('CONFIRMED');
      expect(setupAtFvg?.missingConfluences).toEqual([]);
    });

    it('3.2. Timestamps are strictly monotonic and causal', () => {
      const candles = buildDeterministicFixture();
      for (let i = 1; i < candles.length; i++) {
        expect(candles[i].timestamp).toBeGreaterThan(candles[i - 1].timestamp);
      }
    });
  });

  // 4. Risk Filter and Market Analyst Integration
  describe('4. Risk Filter and Market Analyst Path Integration', () => {
    it('4.1. Data integrity validator passes on 31 contiguous candles with fresh timestamps', () => {
      const now = Date.now();
      const freshStart = now - 32 * interval;
      const candles = buildDeterministicFixture(freshStart);

      const validator = new MarketDataIntegrityValidator({
        minLookbackCandles: 30,
        maxStaleDataMs: 300000,
      });

      const res = validator.validate(candles, '1m', now);
      expect(res.valid).toBe(true);
      expect(res.candleCount).toBe(31);
      expect(res.stale).toBe(false);
      expect(res.errors).toEqual([]);
    });

    it('4.2. MarketRiskFilter evaluates scenario viability and enforces reward/risk ratio', () => {
      const filter = new MarketRiskFilter({
        minRewardRiskRatio: 1.2,
        baselineFrictionAssumptionPts: 1.0,
        maxStructuralRiskDistancePts: 200.0,
      });

      // Viable scenario with R:R = (240 - 1) / 180 = 1.327 >= 1.2
      const viableScenario: MarketScenario = {
        direction: 'BULLISH',
        referencePrice: 20110,
        invalidationLevel: 19920, // 190 pts risk
        nearbyTarget: { price: 20380, rationale: 'BSL target', structuralSource: 'LIQUIDITY_POOL' }, // 270 pts gross
        supportingEvidence: ['Confirmed Model Setup (MODEL_A_LONG)'],
        conflictingEvidence: [],
        conditionsRequired: [],
        confidenceLabel: 'HIGH',
        targetAccessibilityNotes: [],
      };

      const resViable = filter.evaluateScenarioViability(viableScenario);
      expect(resViable.viable).toBe(true);
      expect(resViable.netRewardRiskRatio).toBeGreaterThanOrEqual(1.2);

      // Inadequate R:R scenario: Target too close (20200 -> gross 90 pts, risk 190 pts, R:R = 0.46 < 1.2)
      const poorScenario: MarketScenario = {
        ...viableScenario,
        nearbyTarget: { price: 20200, rationale: 'Close target', structuralSource: 'LIQUIDITY_POOL' },
      };

      const resPoor = filter.evaluateScenarioViability(poorScenario);
      expect(resPoor.viable).toBe(false);
      expect(resPoor.rejectionReasons.some((r) => r.includes('Inadequate estimated reward/risk ratio'))).toBe(true);
    });

    it('4.3. MarketAnalystEngine produces ANALYSIS_READY when Model A confirmed and scenario viable', () => {
      const now = Date.now();
      const freshStart = now - 32 * interval;
      const candles = buildDeterministicFixture(freshStart);

      const engine = new ICTEngine(DEFAULT_ICT_CONFIG);
      const setupEngine = new SetupEngine([MODEL_A_LONG, MODEL_A_SHORT]);
      const confluenceEngine = new ConfluenceEngine();
      const analyst = new MarketAnalystEngine({
        minLookbackCandles: 30,
        maxStaleDataMs: 300000,
        minRewardRiskRatio: 1.2,
        maxStructuralRiskDistancePts: 350.0, // Risk is 190 pts (20110 - 19920), fits within threshold
      });

      const { state, events } = engine.process(candles, 'MNQ', '1m');
      const confluences = confluenceEngine.evaluateConfluences(state, events);
      const setups = setupEngine.evaluateSetups(state, events, confluences);

      // Verify that Model A Long is confirmed in this real-time timestamp window
      const modelA = setups.find((s) => s.id.includes('MODEL_A_LONG'));
      expect(modelA?.status).toBe('CONFIRMED');

      const analysis = analyst.analyze(candles, state, events, setups, undefined, now);

      expect(analysis.status).toBe('ANALYSIS_READY');
      expect(analysis.preferredDirection).toBe('BULLISH');
      expect(analysis.selectedScenario?.direction).toBe('BULLISH');
      expect(analysis.selectedScenario?.supportingEvidence.some((ev) => ev.includes('Confirmed Model Setup'))).toBe(true);
      expect(analysis.selectedScenario?.nearbyTarget?.price).toBe(20400); // Target derived from major SH
    });
  });
});
