# CP36 — VISUAL INTELLIGENCE & CHART UX AUDIT

## 0. MISIÓN Y CONTEXTO

El objetivo de Checkpoint 36 es transformar el `CandidateContext` validado en CP35 en una experiencia visual clara, estable y legible directamente sobre el gráfico de **TradeSea**, estructurando los objetos de mercado en una jerarquía visual de 5 niveles sin saturar la pantalla ni interferir en la lectura del precio.

CP36 es un checkpoint de **PRESENTACIÓN E INTEGRACIÓN VISUAL**. No introduce nuevas reglas ICT, ni parámetros predictivos, ni recomendaciones operativas.

---

# 1. RESTRICCIONES ABSOLUTAS Y CONGELAMIENTO

Se ha auditado y verificado el cumplimiento estricto del congelamiento:

* Parámetros ICT congelados intactos:
  - `minBodyToRangeRatio = 0.60`
  - `minRangeMultiplier = 1.50`
  - `fvgMinSizePoints = 0.25`
  - `lookbackCandles = 5`
* `core/ict/` sin modificaciones en la lógica de detección de producción.
* Datasets CP33.7 y `/oos_dataset/` intactos.
* Sin recomendaciones ni términos de trading (`BUY`, `SELL`, `LONG`, `SHORT`, `ENTRY`, `SL`, `TP`, `RR`, `win-rate`, `P&L`, predicciones o scoring).

---

# 2. JERARQUÍA VISUAL DE 5 NIVELES

Los elementos gráficos se organizan determinísticamente en 5 niveles descriptivos:

```text
┌──────────────────────────────────────────────────────────────────┐
│ NIVEL 5: CONTEXTO       [Insignia CandidateContext & Status]    │
├──────────────────────────────────────────────────────────────────┤
│ NIVEL 4: INEFICIENCIA   [Cajas FVG con estado ACTIVE/MITIGATED]  │
├──────────────────────────────────────────────────────────────────┤
│ NIVEL 3: DISPLACEMENT   [Vela destacada + BodyRatio & Multiplier]│
├──────────────────────────────────────────────────────────────────┤
│ NIVEL 2: LIQUIDEZ       [Niveles BSL/SSL & Marcadores Sweep]     │
├──────────────────────────────────────────────────────────────────┤
│ NIVEL 1: ESTRUCTURA     [Líneas BOS/MSS & Swings High/Low]       │
└──────────────────────────────────────────────────────────────────┘
```

1. **Nivel 1 — Estructura**:
   - `BOS`: Línea continua (`SOLID`) con etiqueta `BOS (BULLISH/BEARISH)`.
   - `MSS`: Línea discontinua (`DASHED`) con etiqueta `MSS (BULLISH/BEARISH)`.
   - `Swings`: Marcadores `TRIANGLE_DOWN` (Swing High) y `TRIANGLE_UP` (Swing Low).
2. **Nivel 2 — Liquidez**:
   - `BSL` / `SSL`: Líneas continuas/punteadas con color distintivo (Rojo/Verde).
   - `Sweeps`: Marcador `CROSS` púrpura en el precio extremo con etiqueta `SWEEP`.
3. **Nivel 3 — Displacement**:
   - Marcador en la vela de desplazamiento con etiqueta descriptiva `DISP (BULL/BEAR bodyRatio)`.
4. **Nivel 4 — Ineficiencia (FVG & OB)**:
   - Rectángulos de FVG delimitados por su límite superior e inferior reales, con opacidad translúcida y etiqueta de estado (`ACTIVE` vs `FULLY_MITIGATED`).
5. **Nivel 5 — Contexto**:
   - Marcador circular superior de `CandidateContext` indicando `CONTEXT_FORMING` o `CONTEXT_CONFIRMED`.

---

# 3. CANVAS CONTRACT & VISUAL LIFECYCLE

Cada objeto renderizable responde al contrato `VisualObject`:

```typescript
export interface VisualObject {
  id: string;
  type: 'MARKER' | 'LINE' | 'RECTANGLE';
  symbol: string;
  timeframe: string;
  startTimestamp: number;
  endTimestamp?: number;
  price?: number;
  highPrice?: number;
  lowPrice?: number;
  label?: string;
  color: string;
  fillColor?: string;
  opacity?: number;
  zIndex: number;
}
```

### Ciclo de Vida Visual:
* `CREATED`: Inserción al detectarse el evento original.
* `UPDATED`: Extensión horizontal durante velas abiertas.
* `MITIGATED`: Cambio de opacidad o finalización de extensión al tocar la zona.
* `REMOVED`: Desaparición visual al superar el límite de presentación.

---

# 4. EVENT INSPECTOR & HISTORIAL EN HUD

* **Event Inspector**: Al seleccionar un evento en `ICTHUD`, se visualizan sus marcas de tiempo (`eventTimestamp`, `confirmationTimestamp`), velas fuente, eventos de soporte y estado de anti-lookahead.
* **Historial Cronológico**: El HUD despliega una bitácora lineal de eventos ordenados estrictamente por tiempo, manteniendo 100% de coherencia con el motor.

---

# 5. LIMPIEZA DEL GRÁFICO & PRESENTATION CAPPING

Para evitar la saturación visual en gráficos de larga duración:
* Se implementa un límite de presentación `maxVisibleObjects = 100`.
* **Regla Fundamental**:
  $$\text{Historia Lógica} \neq \text{Historia Visual}$$
  La limitación gráfica en pantalla jamás elimina ni altera un evento del registro lógico en `CandleStore` o `ICTEngine`.

---

# 6. SCROLL, ZOOM Y COORDINATE TRANSLATOR

* El renderizado en canvas utiliza **exclusivamente** la clase `CoordinateTranslator`.
* Ante eventos de desplazamiento horizontal o zoom (cambio de `firstCandleIndex`, `lastCandleIndex`, `minPrice`, `maxPrice`), `CoordinateTranslator` recalcula dinámicamente el ancho de barra (`barWidth`) y escala los puntos ($T, P$) a coordenadas ($X, Y$) sin duplicar lógica de transformación.

---

# 7. AISLAMIENTO MULTI-TIMEFRAME Y RECONEXIÓN

* **Aislamiento**: Todo `VisualObject` está firmado por `symbol` y `timeframe`. Las series de `NQ 1m`, `NQ 5m`, `NQ 15m`, `MNQ 1m`, `MNQ 5m`, `MNQ 15m` no contaminan sus capas gráficas.
* **Deduplicación Visual**: En caso de ticks en vela abierta o reconexión de WebSocket, el objeto visual existente actualiza sus coordenadas en lugar de duplicar figuras geométricas en el canvas.

---

# 8. CLASIFICACIÓN RIGUROSA DE EVIDENCIA (REGLA 23)

### OBSERVED
* Renderizado fluido en `CanvasRenderer` de elementos de los 5 niveles gráficos sobre el gráfico.
* Inspección interactiva de eventos en el panel `ICTHUD`.

### VERIFIED
* **15/15 tests pasando** en [`tests/checkpoint36_visual_ux.test.ts`](file:///c:/Users/Administrador/Desktop/sm/tests/checkpoint36_visual_ux.test.ts).
* **80 test files / 889 tests pasando** en la suite global (100% pass rate).
* Compilación limpia con `npm run build` (exit code 0).
* `core/ict/` sin modificaciones en la lógica de detección (`git diff -- core/ict/` limpio).

### IMPLEMENTED
* `VisualAdapter`, `CanvasRenderer`, `CoordinateTranslator`, `ICTHUD`.

### NOT_TESTED
* Despliegue en pantallas de ultra alta resolución (8K) con más de 10,000 objetos concurrentes.

### NOT_IMPLEMENTED
* Recomendaciones de entrada/salida (BUY/SELL), cálculo de SL/TP, Machine Learning.

---

# 9. VEREDICTO FINAL

```text
CP36_VISUAL_INTELLIGENCE_AUDIT = PASS
```
