# PHASE 2 REPORT — DETERMINISTIC ICT ENGINE DESIGN & SPECIFICATION

**Stage:** Checkpoint 2 (Deterministic ICT Engine)  
**Date:** 2026-09-25  
**Project:** ICT Assistant — TradeSea Platform  
**Architecture Status:** 100% Decoupled TypeScript Engine (Node.js & Browser Compatible)

---

## 1. ARQUITECTURA GENERAL DEL MOTOR ICT

El motor determinístico vive íntegramente en la carpeta `core/ict/` y no posee ninguna dependencia de `window`, `DOM`, `Chrome Extension APIs`, `WebSocket`, `Canvas` ni `TradingView`.

```
core/
  market/
    Candle.ts
    CandleStore.ts
    CandleValidator.ts
  ict/
    types/
      ICTConfig.ts          # Parámetros centralizados configurables
      SwingPoint.ts         # Modelo de Swing High / Low
      Liquidity.ts          # BSL, SSL, Equal Highs, Equal Lows, Sweeps
      FVG.ts                # Modelo de Fair Value Gap
      OrderBlock.ts         # Modelo de Order Block
      PDArrays.ts           # Dealing Range y Premium/Discount
      ICTEvent.ts           # Discriminated Unions de Eventos ICT
      MarketState.ts        # Snapshot tipado del estado del mercado
    structure/
      SwingDetector.ts      # Detector determinístico de peaks
      StructureEngine.ts    # Evaluador de Trend, BOS y MSS
    liquidity/
      LiquidityEngine.ts    # Evaluador de BSL, SSL y Barridos (Sweeps)
    fvg/
      FVGEngine.ts          # Evaluador de 3 velas FVG y mitigaciones
    orderblocks/
      OrderBlockDefinition.md # Documento comparativo de reglas de OB
      OrderBlockEngine.ts   # Evaluador de Order Blocks y estado
    pdarrays/
      PremiumDiscountEngine.ts # Calculador de Equilibrium y rangos
    engine/
      ICTEngine.ts          # Orquestador maestro (Candle[] -> State + Events)
```

---

## 2. DEFINICIÓN MATEMÁTICA Y REGLAS DE CADA CONCEPTO

### A. Swing Points (`SwingDetector.ts`)
- **Swing High**: Una vela `Candle[i]` donde `Candle[i].high > Candle[i - l].high` para todo `l` en `[1..swingLeftBars]` y `Candle[i].high > Candle[i + r].high` para todo `r` en `[1..swingRightBars]`.
- **Swing Low**: Una vela `Candle[i]` donde `Candle[i].low < Candle[i - l].low` para todo `l` en `[1..swingLeftBars]` y `Candle[i].low < Candle[i + r].low` para todo `r` en `[1..swingRightBars]`.
- **Confirmación**: Se confirma en el índice `i + swingRightBars`. Si aparece un extremo mayor antes de la confirmación, la vela candidata se invalida.

### B. Break of Structure - BOS (`StructureEngine.ts`)
- **Regla**: Continuación de tendencia existente.
- **Bullish BOS**: Si la tendencia actual es `BULLISH`, y el precio de la vela actual (según `bosBreakMode`: `close` o `high`) supera el precio del último `SWING_HIGH` confirmado y no roto.
- **Bearish BOS**: Si la tendencia actual es `BEARISH`, y el precio de la vela actual (según `bosBreakMode`: `close` o `low`) quiebra por debajo del último `SWING_LOW` confirmado y no roto.

### C. Market Structure Shift - MSS (`StructureEngine.ts`)
- **Regla**: Reversión de tendencia.
- **Bullish MSS**: La tendencia previa era `BEARISH`. La vela actual quiebra por encima del último `SWING_HIGH` confirmado. La tendencia cambia a `BULLISH`.
- **Bearish MSS**: La tendencia previa era `BULLISH`. La vela actual quiebra por debajo del último `SWING_LOW` confirmado. La tendencia cambia a `BEARISH`.

### D. Liquidez & Sweeps (`LiquidityEngine.ts`)
- **BSL (Buy Side Liquidity)**: Zona de liquidez acumulada sobre un `SWING_HIGH` o un grupo de `EQUAL_HIGHS` (distancia `< liquidityTolerancePoints`).
- **SSL (Sell Side Liquidity)**: Zona de liquidez acumulada debajo de un `SWING_LOW` o un grupo de `EQUAL_LOWS`.
- **Liquidity Sweep**: Se produce cuando `Candle.high >= BSL.price + sweepMinPenetrationPoints` (o `Candle.low <= SSL.price - sweepMinPenetrationPoints`) y la vela cierra dentro de la zona o produce un cambio de dirección opuesto.

### E. Fair Value Gap - FVG (`FVGEngine.ts`)
- **Bullish FVG**: Secuencia de 3 velas donde `Candle[1].high < Candle[3].low`. Zona = `[Candle[1].high, Candle[3].low]`.
- **Bearish FVG**: Secuencia de 3 velas donde `Candle[1].low > Candle[3].high`. Zona = `[Candle[3].high, Candle[1].low]`.
- **Mitigación**: `ACTIVE` (0% llenado), `PARTIALLY_MITIGATED` (reingreso del precio), `FULLY_MITIGATED` (100% llenado o >= 50% según configuración).

### F. Order Block (`OrderBlockEngine.ts`)
- **Regla Estándar ICT (Variante B)**: La vela de acumulación inmediatamente previa al impulso que genera un FVG.
- **Bullish OB**: Vela bajista anterior a un Bullish FVG.
- **Bearish OB**: Vela alcista anterior a un Bearish FVG.

### G. Premium / Discount (`PremiumDiscountEngine.ts`)
- **Equilibrium**: `(rangeHigh + rangeLow) / 2` sobre la ventana `dealingRangeLookbackBars`.
- **Premium**: `currentPrice > equilibrium`.
- **Discount**: `currentPrice < equilibrium`.

---

## 3. PARÁMETROS CONFIGURABLES (`ICTConfig.ts`)

No existen valores hardcodeados en los algoritmos. Todos los parámetros se configuran centralizadamente:

```typescript
export interface ICTConfig {
  swingLeftBars: number;            // Velas a la izquierda para Swing (default: 2)
  swingRightBars: number;           // Velas a la derecha para confirmación (default: 2)
  swingMinDisplacementPoints: number;
  bosBreakMode: 'CLOSE' | 'WICK';   // Exigir cierre o mecha para BOS (default: CLOSE)
  mssBreakMode: 'CLOSE' | 'WICK';   // Exigir cierre o mecha para MSS (default: CLOSE)
  liquidityTolerancePoints: number; // Tolerancia para Equal Highs/Lows (default: 0.5)
  sweepMinPenetrationPoints: number;
  fvgMinSizePoints: number;         // Tamaño mínimo de FVG en puntos (default: 0.25)
  fvgMitigationMode: 'TOUCH' | 'FILL_50' | 'FILL_100';
  dealingRangeLookbackBars: number; // Ventana para Dealing Range (default: 50)
}
```

---

## 4. DECISIONES TOMADAS VS. DECISIONES ABIERTAS

### ✅ Decisiones Tomadas:
1. **Tipado Estricto con Discriminated Unions**: Todos los eventos ICT (`SWING_HIGH`, `BOS`, `MSS`, `BSL`, `SSL`, `LIQUIDITY_SWEEP`, `FVG_CREATED`, `FVG_FILLED`, `ORDER_BLOCK_CREATED`, `ORDER_BLOCK_INVALIDATED`) son tipos disjuntos fuertemente validados en TypeScript.
2. **Requisito de Cierre para BOS/MSS por Defecto**: Se exige cierre de cuerpo de vela sobre el nivel para confirmar el quiebre de estructura, evitando falsas señales por mechas.
3. **Ejecución 100% Offline**: El motor es instanciable con `const engine = new ICTEngine(config); const result = engine.process(candles);`.

### ❓ Decisiones Abiertas para Revisión del Supervisor:
1. **Elección final de variante de Order Block**: Actualmente se utiliza la Variante B (confluencia con FVG). Puede cambiarse en el futuro mediante `ICTConfig`.

---

## 5. EJEMPLO DE USO COMPATIBLE CON BACKTESTING

```typescript
import { ICTEngine } from './core/ict';
import { Candle } from './core/market';

const candles: Candle[] = [ ... ]; // Array de velas cargadas de archivo o WebSocket

const engine = new ICTEngine({
  swingLeftBars: 2,
  swingRightBars: 2,
  bosBreakMode: 'CLOSE',
  fvgMinSizePoints: 0.25
});

const { state, events } = engine.process(candles, 'MNQ', '1m');

console.log('Tendencia actual:', state.trend);
console.log('Fair Value Gaps activos:', state.fairValueGaps.filter(f => f.status === 'ACTIVE'));
console.log('Eventos generados:', events);
```

---

## 6. PRUEBAS EJECUTADAS & RESULTADOS

- **Suite de Pruebas**: 18 tests distribuidos en 3 archivos (`market.test.ts`, `checkpoint1.test.ts`, `synthetic_scenarios.test.ts`).
- **Resultado `vitest`**: **18/18 PASSED** (100% de éxito).
- **Resultado `npm run build`**: **0 ERRORS** (Compilación a producción limpia).

---

## 7. CONCEPTOS AÚN NO IMPLEMENTADOS (Fuera del Checkpoint 2)

De acuerdo con las instrucciones de la supervisión, los siguientes elementos **NO se han construido todavía**:
- ❌ Capa de renderizado visual / Canvas / Overlay sobre el gráfico.
- ❌ Generación de señales de compra/venta o alertas.
- ❌ Puntuación de confluencia (*Confluence Scoring*).
- ❌ Recomendaciones de entrada, Stop Loss o Take Profit.
- ❌ Conexión o ejecución de órdenes de trading.
