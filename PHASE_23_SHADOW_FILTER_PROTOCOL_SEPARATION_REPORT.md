# PHASE_23_SHADOW_FILTER_PROTOCOL_SEPARATION_REPORT

## 1. Executive Summary
Se formalizó y concretó la separación arquitectónica y metodológica entre dos conceptos que coexistían en el pipeline experimental: **PURE SHADOW OBSERVATION** (`PURE_SHADOW`) y **EXPERIMENTAL VOLATILITY FILTER** (`FILTERED_EXPERIMENT`). El experimento demostró de manera definitiva que cuando la volatilidad se utiliza exclusivamente en modo Shadow (observación sin filtro), **las variantes BASELINE, ROBUST_10, ROBUST_14 y ROBUST_20 producen exactamente los mismos 167 TARGET / 333 STOP (0% de divergencia de outcome)**. Por el contrario, la divergencia observada en CP21/CP22 proviene exclusivamente de la aplicación del filtro experimental de elegibilidad (`qualificationThresholdRatio = 0.8`). No se modificaron detectores activos ni se promovieron modelos a producción.

## 2. CP22 Root Cause
- La auditoría de CP22 identificó que los 50 casos `NO_EXECUTION` generados por el Baseline no fueron causados por cambios en la estructura del escenario ni por diferencias en las reglas de simulación de ejecuciones, sino por la regla explícita de elegibilidad `Risk / Volatility >= 0.8`.
- Dado que `RollingMeanTR` sufre inflación por memoria ante shocks de volatilidad, el ratio del Baseline cayó por debajo del umbral de 0.8 en 50 escenarios. `MedianTR` anuló la perturbación y mantuvo el ratio `>= 0.8`.

## 3. Pure Shadow Definition
- **Concepto**: `PURE_SHADOW`
- La métrica Shadow observa, calcula, registra, visualiza y audita la volatilidad, pero **NO puede intervenir** en la decisión de ejecutar o ignorar un escenario.
- Regla causal inmutable: `ShadowVolatility --X--> ExecutionDecision`.

## 4. Experimental Filter Definition
- **Concepto**: `FILTERED_EXPERIMENT` (`VOLATILITY_FILTER`)
- Regla experimental explicita que evalúa la elegibilidad del escenario previa a la simulación hipotética (`ELIGIBLE` vs `NO_ELIGIBLE` / `FILTER_REJECTED_BASELINE`).
- Debe especificarse de forma transparente mediante el tipo de modo de protocolo (`ProtocolMode`) y el parámetro explicito `qualificationThresholdRatio`.

## 5. Architecture
La arquitectura del pipeline experimental se estructuró formalmente en tres niveles disociados:
1. `Detection Layer` (`ICTEngine` → `ICTEvent`)
2. `Scenario & Eligibility Layer` (`BaseScenario` + `EligibilityDecision`)
3. `Execution Simulation Layer` (`ExecutionSimulator` → `ExecutionTrace`)

## 6. BaseScenario
- Representa el escenario estructural puro e independiente de la volatilidad:
  - `scenarioId`, `eventId`, `symbol`, `timeframe`, `eventType`, `direction`, `eventTimestamp`, `confirmationTimestamp`, `referencePrice`, `entryPrice`, `stopPrice`, `targetPrice`, `risk`, `targetDistance`.
- Es **100% inmutable** e insensible al modo de protocolo o al filtro de volatilidad aplicado.

## 7. EligibilityDecision
- Objeto de auditoría independiente creado previo a la simulación:
  - `scenarioId`, `protocolMode`, `variant`, `estimator`, `volatility`, `risk`, `riskVolatilityRatio`, `threshold`, `eligible`, `reason`.
- Permite registrar exactamente si un escenario fue descartado por elegibilidad sin alterar la definición del escenario base.

## 8. Pure Shadow Results
- **Modo**: `PURE_SHADOW` (`qualificationThresholdRatio = 0`)
- **Dataset**: `HASH-CP21-7DCF0593-FROZEN` (500 escenarios)
- **Resultados**:
  - `BASELINE`: 167 TARGET (33.4%) / 333 STOP (66.6%) / 0 NO_EXECUTION (0.0%)
  - `ROBUST_10`: 167 TARGET (33.4%) / 333 STOP (66.6%) / 0 NO_EXECUTION (0.0%)
  - `ROBUST_14`: 167 TARGET (33.4%) / 333 STOP (66.6%) / 0 NO_EXECUTION (0.0%)
  - `ROBUST_20`: 167 TARGET (33.4%) / 333 STOP (66.6%) / 0 NO_EXECUTION (0.0%)
- **Divergencia de Outcome**: **0.00%** (Cero divergencia).

## 9. Filtered Results
- **Modo**: `FILTERED_EXPERIMENT` (`qualificationThresholdRatio = 0.8`)
- **Dataset**: `HASH-CP21-7DCF0593-FROZEN` (500 escenarios)
- **Resultados**:
  - `BASELINE`: 151 TARGET (30.2%) / 299 STOP (59.8%) / 50 NO_EXECUTION (10.0%)
  - `ROBUST_10`: 167 TARGET (33.4%) / 333 STOP (66.6%) / 0 NO_EXECUTION (0.0%)
  - `ROBUST_14`: 167 TARGET (33.4%) / 333 STOP (66.6%) / 0 NO_EXECUTION (0.0%)
  - `ROBUST_20`: 167 TARGET (33.4%) / 333 STOP (66.6%) / 0 NO_EXECUTION (0.0%)
- **Divergencia de Elegibilidad**: **SÍ** (50 rechazos en Baseline vs 0 en variantes Robust).

## 10. 50 Case Audit
- Los 50 escenarios rechazados por el Baseline en modo filtrado se clasificaron formal e imparcialmente como: `FILTER_REJECTED_BASELINE` (motivo: `Risk / RollingMeanTR < 0.8`).
- Queda prohibida la clasificación como "WINNERS", "LOSERS", "GOOD TRADES" o "BAD TRADES". La etiqueta es puramente descriptiva del mecanismo de filtrado.

## 11. Shock/Post-Shock
- Desglose de rechazos por régimen bajo `FILTERED_EXPERIMENT` (0.8):
  - **NORMAL (N=125)**: Baseline 0/125 (0.0%) | Robust 0/125 (0.0%)
  - **ELEVATED (N=125)**: Baseline 0/125 (0.0%) | Robust 0/125 (0.0%)
  - **SHOCK (N=125)**: Baseline 25/125 (20.0%) | Robust 0/125 (0.0%)
  - **POST-SHOCK (N=125)**: Baseline 25/125 (20.0%) | Robust 0/125 (0.0%)

## 12. Detection Invariance
- Se comprobó programáticamente que alternar entre `PURE_SHADOW` y `FILTERED_EXPERIMENT` o modificar `qualificationThresholdRatio` de 0 a 0.8 posee un delta de **0.00** sobre la capa de detección (`ICTEvent`, `eventTimestamp`, `confirmationTimestamp`, `DetectionSnapshot`).

## 13. Batch/Replay
- **Equivalencia Batch vs Replay**:
  - `Batch Pure Shadow == Replay Pure Shadow` (100% hash match, 500/500 scenarios)
  - `Batch Filtered == Replay Filtered` (100% hash match, 500/500 scenarios)

## 14. Simulated Live
- Se implementó `SimulatedLive` para streaming vela a vela.
- **Equivalencia**:
  - `Simulated Live Pure Shadow == Batch Pure Shadow` (100% match)
  - `Simulated Live Filtered == Batch Filtered` (100% match)

## 15. Future Injection
- La inyección de velas extremas en `k >= 1` altera el resultado del `ExecutionTrace` pero **mantiene 100% inalterada la `EligibilityDecision`** tomada en `confirmationTimestamp`.

## 16. Configuration Isolation
- Se aisló la configuración mediante el tipo `ProtocolMode` (`PURE_SHADOW` vs `FILTERED_EXPERIMENT`), eliminando booleanos ambiguos como `useVolatility`.

## 17. Audit Trail
- Cada traza de ejecución incorpora un objeto de auditoría completo correlacionando: `scenarioId` + `protocolMode` + `variant` + `estimator` + `volatility` + `risk` + `riskVolatilityRatio` + `threshold` + `eligible` + `reason`.

## 18. Limitations
- Este checkpoint se limitó estrictamente a la formalización y separación de los protocolos en la infraestructura de backtest. No realiza optimizaciones de umbrales ni promueve cambios al sistema de producción.

## 19. Conclusions
- **PREGUNTA 1**: "¿MedianTR cambia el outcome cuando solamente se observa?"
  - **Respuesta**: **NO**. En modo `PURE_SHADOW` (filtro deshabilitado), Baseline y MedianTR producen idénticos 167 TARGET / 333 STOP.
- **PREGUNTA 2**: "¿MedianTR cambia qué escenarios cumplen un filtro experimental de elegibilidad?"
  - **Respuesta**: **SÍ**. Con `qualificationThresholdRatio = 0.8`, `RollingMeanTR` sufre distorsión post-shock descartando el 20% de los escenarios en regímenes de shock, mientras que `MedianTR` mantiene estabilidad.

## 20. Next Step
- Registrar la formalización de CP23. Proceder con CP24 para evaluar el diseño de protocolos de régimen sin alterar la detección activa de producción.

---

```
CHECKPOINT 23 STATUS

Active detector modified: NO
Active parameters modified: NO
MedianTR production enabled: NO

Pure Shadow isolated: PASS
Experimental Filter isolated: PASS
BaseScenario immutable: PASS
EligibilityDecision isolated: PASS
Pure Shadow outcome invariance: PASS
Filtered experiment reproduction: PASS
50-case reproduction: PASS
Shock/Post-Shock attribution: PASS
Detection invariance: PASS
Batch/Replay equivalence: PASS
Simulated-Live equivalence: PASS
Future injection: PASS
Configuration isolation: PASS
Audit trail: PASS
Tests: 154/154
Build: PASS

PURE SHADOW OUTCOME DIFFERENCE: NO

FILTERED ELIGIBILITY DIFFERENCE: YES

FILTER THRESHOLD: 0.8

50 BASELINE REJECTIONS: 50

ROBUST_10 REJECTIONS: 0

ROBUST_14 REJECTIONS: 0

ROBUST_20 REJECTIONS: 0

FINAL MODEL CHANGE: NONE

## NEXT STEP: Proceed to CP24 for multi-timeframe regime protocol formulation without mutating active detector.
```
