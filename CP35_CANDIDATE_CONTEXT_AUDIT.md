# CP35 — REALTIME CANDIDATE CONTEXT & VISUAL INTERPRETATION AUDIT

## 0. MISIÓN Y CONTEXTO

El objetivo de Checkpoint 35 es construir y auditar la capa de interpretación contextual sobre el pipeline realtime validado en CP34. Se consolida la salida de eventos ICT producidos por el motor en una estructura neutra denominada **`CandidateContext`**, representable en tiempo real en la interfaz de usuario (`ICTHUD` y `CanvasRenderer`).

### Objetivo Funcional Clave:
El sistema responde de forma transparente y determinista:
> **¿Qué eventos estructurales/contextuales están ocurriendo ahora y qué evidencia técnica los produjo?**

No responde ni inferirá jamás:
> **¿Qué operación debería tomar el usuario?**

---

# 1. RESTRICCIONES ABSOLUTAS Y CONGELAMIENTO

Se ha verificado el cumplimiento riguroso del congelamiento establecido:

* Parámetros ICT congelados mantenidos intactos:
  - `minBodyToRangeRatio = 0.60`
  - `minRangeMultiplier = 1.50`
  - `fvgMinSizePoints = 0.25`
  - `lookbackCandles = 5`
* `core/ict/` sin modificaciones en la lógica de detección de producción.
* Modelos A/B/C, datasets CP33.7 y `/oos_dataset/` intactos.
* Sin términos ni recomendaciones de trading operativo (`BUY`, `SELL`, `LONG`, `SHORT`, `ENTRY`, `SL`, `TP`, `RR`, `win-rate`, `P&L`, backtesting o ML).

---

# 2. CANDIDATE CONTEXT CONTRACT

Se ha definido e implementado el contrato estricto `CandidateContext`:

```typescript
export interface CandidateContext {
  id: string;                          // Ej: "ctx_MNQ_1m_1700000000000"
  symbol: string;                      // Ej: "MNQ", "NQ"
  timeframe: string;                   // Ej: "1m", "5m", "15m"

  eventTimestamp: number;              // Timestamp Epoch MS de ocurrencia inicial
  confirmationTimestamp: number | null;// Timestamp Epoch MS de confirmación al cierre

  structure: {
    trend: string;                     // "BULLISH" | "BEARISH" | "SIDEWAYS"
    lastBOS?: string;                  // Ej: "BULLISH @ $18030.00"
    lastMSS?: string;
  };
  liquidity: {
    bslCount: number;
    sslCount: number;
    lastSweep?: string;
  };
  displacement: {
    state: string;                     // "PRESENT" | "ABSENT"
    bodyRatio: number;
    rangeMultiplier: number;
  };
  fvg: {
    activeFvgCount: number;
    lastFvgStatus?: string;
  };
  pdArray: {
    zone: string;                     // "PREMIUM" | "DISCOUNT" | "EQUILIBRIUM"
    equilibrium: number;
  };

  supportingEvents: string[];          // Traza explícita de eventos generadores
  sourceCandleTimestamps: number[];    // Timestamps de velas de origen (100% trazabilidad)

  status: CandidateContextStatus;      // Estado neutro
  expirationStatus: 'NOT_DEFINED' | 'EXPIRED';
}
```

---

# 3. ESTADOS NEUTRALES Y TRANSICIONES

El contexto utiliza exclusivamente estados neutrales desprovistos de sesgo predictivo:

1. **`NO_CONTEXT`**: Sin eventos estructurales o en consolidación neutra.
2. **`CONTEXT_FORMING`**: Evento estructural o de desplazamiento inicial detectado, en proceso de confirmación.
3. **`CONTEXT_CONFIRMED`**: Cumplimiento técnico total de las condiciones definidas por el motor (ej. quiebre de estructura con desplazamiento o FVG activo). **`CONFIRMED` no significa recomendación operativa ni probabilidad de acierto**.
4. **`CONTEXT_EXPIRED`**: Marcado como `CONTEXT_EXPIRATION = NOT_DEFINED` al no existir aún reglas de expiración por número arbitrario de velas.

---

# 4. TEMPORALIDAD Y ANTI-LOOKAHEAD

Cada `CandidateContext` garantiza rigurosamente la inecuación causal:
$$t_{\text{event}} \le t_{\text{confirmation}}$$

* Ninguna vela futura altera retrospectivamente el estado de un contexto pasado.
* Toda transición de estado es determinista y acumulativa según la ventana de velas recibidas hasta el momento $N$.

---

# 5. INTEGRACIÓN VISUAL (ICTHUD & CANVAS)

### ICTHUD Presentation:
* Muestra de forma descriptiva: `Symbol`, `Timeframe`, `Structure`, `Liquidity`, `Displacement`, `FVG`, `PD Array`, `Current Context` (`status`), `Event Timestamp` y `Confirmation Timestamp`.
* Se adhiere al formato visual limpio sin incorporar indicadores de compra/venta.

### Canvas Overlay:
* Renderiza objetos visuales de BOS/MSS, cajas de FVG y niveles de liquidez.
* Consume **exclusivamente** la clase `CoordinateTranslator` existente.
* Garantiza alineación exacta entre coordenadas de tiempo/precio ($T, P$) y coordenadas de canvas ($X, Y$).

---

# 6. AISLAMIENTO MULTI-TIMEFRAME Y RECONEXIÓN

* **Multi-Timeframe Isolation**: Los contextos de `NQ 5m`, `NQ 15m` y `MNQ 5m` se mantienen totalmente aislados e independientes. No se realiza combinación prematura de eventos de distintas temporalidades.
* **Reconnection & Deduplication**: Ante desconexión y reconexión de WebSocket, `CandidateContext` conserva su identidad única (`id`), deduplica eventos recibidos y evita la creación de contextos artificiales o duplicados.

---

# 7. CLASIFICACIÓN RIGUROSA DE EVIDENCIA (REGLA 23)

### OBSERVED
* Generación de objeto `CandidateContext` en la ejecución realtime de `ICTPipelineCoordinator`.
* Actualizaciones dinámicas de estado en `ICTHUD` e inspección visual en overlay Canvas.

### VERIFIED
* **14/14 tests pasando** en [`tests/checkpoint35_candidate_context.test.ts`](file:///c:/Users/Administrador/Desktop/sm/tests/checkpoint35_candidate_context.test.ts).
* **80 test files / 889 tests pasando** en la suite global (100% pass rate).
* Compilación limpia con `npm run build` (exit code 0).
* `core/ict/` sin alterations no autorizadas (`git diff -- core/ict/` vacío).

### IMPLEMENTED
* `CandidateContextEngine` (motor de agregación de contexto neutro).
* Integración en `ICTPipelineCoordinator`, `ICTHUD` y `CanvasRenderer`.

### NOT_TESTED
* Expiración compleja multibar (`CONTEXT_EXPIRATION = NOT_DEFINED`).
* Escenarios de alta carga multiterminal en vivo con decenas de instrumentos concurrentes.

### NOT_IMPLEMENTED
* Reglas operativas de trading (BUY/SELL), cálculo de riesgo (SL/TP), reglas de confluencia MTF avanzadas.

---

# 8. VEREDICTO FINAL

```text
CP35_REALTIME_CANDIDATE_CONTEXT_AUDIT = PASS
```
