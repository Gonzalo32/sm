/**
 * Checkpoint 32 - Blind Pack & Hidden Record Generator
 * Generates 300 randomized, blinded cases for human conceptual review.
 * Strictly separates CP32_REVIEW_PACK from CP32_HIDDEN_ENGINE_RECORD.
 */

import fs from 'fs';
import path from 'path';
import { CP27DatasetGenerator } from '../core/ict/backtest/CP27DatasetGenerator';
import { ICTEngine } from '../core/ict/engine/ICTEngine';
import { SetupEngine } from '../core/ict/setups/SetupEngine';
import { MarketContextEngine } from '../core/ict/context/MarketContextEngine';
import { Candle } from '../core/market/Candle';

// Seed for 100% reproducible sampling
const SEED = 'CP32-SEED-20260928-8849201';

function pseudoRandom(seedStr: string): number {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const x = Math.sin(hash++) * 10000;
  return x - Math.floor(x);
}

export interface ReviewPackCase {
  caseId: string;
  symbol: string;
  timeframe: string;
  contextTimestamp: number;
  candles: Array<{
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  }>;
  dealingRangeContext?: {
    high: number;
    low: number;
    equilibrium: number;
  };
}

export interface HiddenEngineRecord {
  caseId: string;
  originalScenarioId: string;
  symbol: string;
  timeframe: string;
  detectedEvents: Array<{
    type: string;
    direction?: string;
    timestamp: number;
    candleIndex: number;
  }>;
  activeTrend: string;
  activeDealingRangeZone: string;
  setups: Array<{
    modelId: string;
    direction: string;
    status: string;
    fulfilledConditions: string[];
    missingConditions: string[];
  }>;
  hasDisplacement: boolean;
  activeFvgCount: number;
  activeObCount: number;
}

export function generateCP32Pack() {
  const rootDir = process.cwd();
  const reviewPackDir = path.join(rootDir, 'CP32_REVIEW_PACK');
  const hiddenRecordDir = path.join(rootDir, 'CP32_HIDDEN_ENGINE_RECORD');

  if (!fs.existsSync(reviewPackDir)) fs.mkdirSync(reviewPackDir, { recursive: true });
  if (!fs.existsSync(hiddenRecordDir)) fs.mkdirSync(hiddenRecordDir, { recursive: true });

  // Save Seed
  fs.writeFileSync(path.join(rootDir, 'CP32_REVIEW_SEED.txt'), SEED, 'utf-8');

  // Load CP27 Dataset (600 scenarios: MNQ/NQ x 1m/5m/15m)
  const { items } = CP27DatasetGenerator.generateCP27Dataset();

  // Create engines
  const ictEngine = new ICTEngine();
  const setupEngine = new SetupEngine();
  const contextEngine = new MarketContextEngine();

  const indexedItems = items.map((item, idx) => ({
    item,
    rand: pseudoRandom(`${SEED}-item-${idx}-${item.scenario.scenarioId}`),
  }));

  // Stratify items by (symbol, timeframe) and take 50 of each bucket for perfect 150/150 and 100/100/100 balance
  const buckets: Record<string, typeof indexedItems> = {};
  for (const item of indexedItems) {
    const key = `${item.item.scenario.symbol}-${item.item.scenario.timeframe}`;
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(item);
  }

  // Sort each bucket using deterministic seed
  for (const key of Object.keys(buckets)) {
    buckets[key].sort((a, b) => a.rand - b.rand);
  }

  const selected: typeof indexedItems = [];
  for (const key of Object.keys(buckets)) {
    selected.push(...buckets[key].slice(0, 50));
  }

  // Shuffle selected cases deterministically for review pack order
  selected.sort((a, b) => pseudoRandom(`${SEED}-final-${a.item.scenario.scenarioId}`) - pseudoRandom(`${SEED}-final-${b.item.scenario.scenarioId}`));



  const reviewCases: ReviewPackCase[] = [];
  const hiddenRecords: HiddenEngineRecord[] = [];

  for (let i = 0; i < selected.length; i++) {
    const { item } = selected[i];
    const s = item.scenario;

    // Compute anonymized caseId
    const rawHash = pseudoRandom(`${SEED}-caseId-${i}-${s.scenarioId}`);
    const caseId = `CASE-${Math.abs(Math.floor(rawHash * 100000000)).toString(16).toUpperCase().padStart(8, '0')}`;

    const stepMs = s.timeframe === '15m' ? 900000 : s.timeframe === '5m' ? 300000 : 60000;
    // Stochastic Jump-Diffusion Market Process (Realistic Financial Time Series)
    const isLong = s.direction === 'LONG_SCENARIO';
    const dir = isLong ? 1 : -1;
    const baseP = s.referencePrice;
    const risk = Math.max(s.risk, 12);
    const pastCandles: Candle[] = [];

    // Scenario-specific stochastic parameters (Full chart window coverage: far left, left, center, right, far right)
    const eventStartIdx = Math.floor(pseudoRandom(`${SEED}-evStart-${i}`) * 26) + 2; // Event index between 2 and 27
    const eventDuration = Math.floor(pseudoRandom(`${SEED}-evDur-${i}`) * 3) + 1; // 1 to 3 candles
    const priorTrendDir = (pseudoRandom(`${SEED}-pTrend-${i}`) - 0.5) * 2; // -1 to +1 continuous trend slope
    const postTrendDir = (pseudoRandom(`${SEED}-postTrend-${i}`) - 0.5) * 2; // -1 to +1 continuous post trend slope

    let currentPrice = baseP - dir * risk * (pseudoRandom(`${SEED}-startP-${i}`) * 2.0 - 1.0);

    for (let k = 30; k >= 0; k--) {
      const cTs = s.confirmationTimestamp - k * stepMs;
      const r1 = pseudoRandom(`${SEED}-r1-${i}-${k}`);
      const r2 = pseudoRandom(`${SEED}-r2-${i}-${k}`);
      const r3 = pseudoRandom(`${SEED}-r3-${i}-${k}`);

      let stepChange = 0;
      let isJump = false;

      // Check if current candle is within the Jump (Displacement) event
      if (k <= eventStartIdx && k > eventStartIdx - eventDuration) {
        // Jump Process: Large explosive expansion candle in direction of scenario!
        stepChange = dir * risk * (0.5 + r1 * 0.8);
        isJump = true;
      } else if (k === eventStartIdx + 1) {
        // Order Block Candle (often opposite direction right before jump)
        stepChange = -dir * risk * (0.15 + r1 * 0.35);
      } else if (k > eventStartIdx + 1) {
        // Prior Market Action: Random walk + prior trend
        stepChange = priorTrendDir * risk * (r1 - 0.45) * 0.4 + (r2 - 0.5) * risk * 0.35;
      } else {
        // Post Event Action: Organic retracement, continuation, or range
        stepChange = postTrendDir * risk * (r1 - 0.45) * 0.4 + (r3 - 0.5) * risk * 0.35;
      }


      const open = currentPrice;
      const close = open + stepChange;
      const bodyMax = Math.max(open, close);
      const bodyMin = Math.min(open, close);

      const wickUpper = bodyMax + r2 * risk * (isJump ? 0.15 : 0.25);
      const wickLower = bodyMin - r3 * risk * (isJump ? 0.15 : 0.25);

      currentPrice = close;

      pastCandles.push({
        timestamp: cTs,
        open,
        high: wickUpper,
        low: wickLower,
        close,
        volume: isJump ? 3000 + Math.floor(r1 * 1500) : 800 + Math.floor(r1 * 600),
      });
    }





    // Run engine internally to build hidden engine record
    const { state, events } = ictEngine.process(pastCandles, s.symbol, s.timeframe);
    const setups = setupEngine.evaluateSetups(state, events, []);
    const context = contextEngine.buildContext(state, events, [], setups);

    // Build Review Pack Case (Strictly Blinded)
    const reviewCase: ReviewPackCase = {
      caseId,
      symbol: s.symbol,
      timeframe: s.timeframe,
      contextTimestamp: s.confirmationTimestamp,
      candles: pastCandles.map(c => ({
        timestamp: c.timestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      })),
      dealingRangeContext: state.dealingRange
        ? {
            high: state.dealingRange.rangeHigh,
            low: state.dealingRange.rangeLow,
            equilibrium: state.dealingRange.equilibrium,
          }
        : undefined,
    };

    // Build Hidden Engine Record (Internal System Ground Truth)
    const hiddenRecord: HiddenEngineRecord = {
      caseId,
      originalScenarioId: s.scenarioId,
      symbol: s.symbol,
      timeframe: s.timeframe,
      detectedEvents: events.map(e => ({
        type: e.type,
        direction: (e as any).direction,
        timestamp: e.eventTimestamp,
        candleIndex: e.candleIndex,
      })),
      activeTrend: state.trend,
      activeDealingRangeZone: context.pdArray.zone,
      setups: setups.map(st => ({
        modelId: st.evidence[0]?.replace('Model: ', '') || 'MODEL_A',
        direction: st.direction,
        status: st.status,
        fulfilledConditions: st.fulfilledConfluences,
        missingConditions: st.missingConfluences,
      })),
      hasDisplacement: context.displacement.state === 'PRESENT',
      activeFvgCount: context.pdArray.activeFvgCount,
      activeObCount: context.pdArray.activeObCount,
    };

    reviewCases.push(reviewCase);
    hiddenRecords.push(hiddenRecord);
  }

  // Save Review Pack cases.json
  fs.writeFileSync(path.join(reviewPackDir, 'cases.json'), JSON.stringify(reviewCases, null, 2), 'utf-8');

  // Save Review Pack Instructions
  const instructionsMd = `# CP32 BLIND HUMAN REVIEW INSTRUCTIONS

> **Reviewer**: Gonzalo  
> **Protocol**: Blind Independent Conceptual Validation (CP32)  
> **Total Cases**: 300

---

## INSTRUCCIONES DE REVISIÓN

1. Para cada \`caseId\` en \`cases.json\`, evalúe conceptualmente la evidencia visual en el gráfico/velas.
2. Complete la tabla en \`CP32_HUMAN_REVIEW_FORM.csv\` asignando una de las siguientes 5 clasificaciones:
   - **CLEAR**: La evidencia visual/estructural es clara y responde al concepto ICT definido en CP30.
   - **BORDERLINE**: Existe evidencia razonable pero hay ambigüedad menor.
   - **QUESTIONABLE**: La presencia del concepto es difícil de justificar bajo CP30.
   - **NOT_PRESENT**: El concepto no está presente en la muestra.
   - **CONCEPTO_NO_DETERMINISTA**: La definición de CP30 no permite decidir de forma objetiva.
3. No intente adivinar la clasificación interna del sistema.
4. Al finalizar los 300 casos, envíe el archivo \`CP32_HUMAN_REVIEW_FORM.csv\` completado para su sellado final.
`;
  fs.writeFileSync(path.join(reviewPackDir, 'INSTRUCTIONS.md'), instructionsMd, 'utf-8');

  // Generate CSV Review Form Template
  let csvContent = 'caseId,concept,classification,comment\n';
  const concepts = [
    'MARKET_STRUCTURE',
    'LIQUIDITY',
    'DISPLACEMENT',
    'FVG',
    'ORDER_BLOCK',
    'PREMIUM_DISCOUNT',
    'MODEL_EVALUATION',
  ];

  for (const rc of reviewCases) {
    for (const c of concepts) {
      csvContent += `${rc.caseId},${c},,\n`;
    }
  }

  fs.writeFileSync(path.join(reviewPackDir, 'CP32_HUMAN_REVIEW_FORM.csv'), csvContent, 'utf-8');

  // Save Hidden Engine Records (DO NOT TRANSMIT TO REVIEWER)
  fs.writeFileSync(path.join(hiddenRecordDir, 'engine_records.json'), JSON.stringify(hiddenRecords, null, 2), 'utf-8');

  console.log(`[PASS] Generated 300 blind review cases in CP32_REVIEW_PACK/`);
  console.log(`[PASS] Generated matching records in CP32_HIDDEN_ENGINE_RECORD/`);
}

if (process.argv[1] && process.argv[1].endsWith('generate_cp32_pack.ts')) {
  generateCP32Pack();
}
