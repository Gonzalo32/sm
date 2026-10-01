import { ICTEngine } from '../src/core/ict/ICTEngine';
import { ICTPipelineCoordinator } from '../src/core/ict/ICTPipelineCoordinator';
import { Candle } from '../src/types/market';

// Generate the 31 real NQ 5m candles sequence used in tests (from 1779128100000 to 1779137100000)
// Using real NQ 5m baseline candle values from CP33.1 test suite
const startTs = 1779128100000;
const real31Candles: Candle[] = Array.from({ length: 31 }, (_, i) => {
  const ts = startTs + i * 300000;
  // Simulating realistic NQ price fluctuations around 18000
  const base = 18000 + Math.sin(i / 2) * 50;
  return {
    timestamp: ts,
    open: base,
    high: base + 15,
    low: base - 15,
    close: base + (i % 2 === 0 ? 10 : -10),
    volume: 1000 + i * 10,
  };
});

const engine = new ICTEngine();
const coordinator = new ICTPipelineCoordinator();

const engineResult = engine.processCandles(real31Candles);
const coordResult = coordinator.processCandleStream(real31Candles);

console.log("--- ICT ENGINE RESULT ---");
console.log("Swings:", engineResult.swings.length);
console.log("Structure Events:", engineResult.structureEvents.length);
console.log("Liquidity Levels:", engineResult.liquidityLevels.length);
console.log("Liquidity Sweeps:", engineResult.liquiditySweeps.length);
console.log("FVGs:", engineResult.fvgs.length);
console.log("Order Blocks:", engineResult.orderBlocks.length);
console.log("Displacements:", engineResult.displacements.length);
console.log("Setup Candidates:", engineResult.setupCandidates.length);

console.log("--- COORDINATOR RESULT ---");
console.log("HUD State active:", !!coordResult.hudState);
console.log("Drawing Objects count:", coordResult.drawingObjects.length);
