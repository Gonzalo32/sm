# PHASE_24_MULTI_TIMEFRAME_REGIME_PROTOCOL_REPORT

## 1. Executive Summary
Se completó la validación pre-registrada e independiente del comportamiento de **PURE SHADOW OBSERVATION** (`PURE_SHADOW`) y **EXPERIMENTAL VOLATILITY FILTER** (`FILTERED_EXPERIMENT`) a través de un dataset multitemporal nuevo de 600 escenarios abarcando `MNQ` y `NQ` en `1m`, `5m` y `15m` cruzados con los cuatro regímenes de volatilidad (`NORMAL`, `ELEVATED`, `SHOCK`, `POST-SHOCK`). La evaluación confirmó con 100% de reproducibilidad que en modo **PURE SHADOW**, las cuatro variantes (`BASELINE`, `ROBUST_10`, `ROBUST_14`, `ROBUST_20`) producen **exactamente los mismos 200 TARGET / 400 STOP (0.00% divergencia de outcome)**. En modo **FILTERED EXPERIMENT** (threshold = 0.8), el Baseline rechaza 45 escenarios (7.5% global, 30.0% en régimen SHOCK) debido a la inflación por memoria del `RollingMeanTR`, mientras que las variantes MedianTR mantienen 0 rechazos. No se modificó el detector activo ni se promovieron parámetros a producción.

## 2. Dataset Hash & Distribution
- **Dataset Hash Global Congelado**: `HASH-CP24-D4C74BE-FROZEN`
- **Tamaño Total**: 600 escenarios
- **Distribución de Splits**:
  - `EXPLORATION`: 120 escenarios (20%)
  - `SELECTION`: 240 escenarios (40%)
  - `HOLDOUT`: 240 escenarios (40%)

## 3. Symbols & Timeframes
Distribución balanceada e inmutable (100 escenarios por combinación):
- `MNQ 1m`: 100 escenarios
- `MNQ 5m`: 100 escenarios
- `MNQ 15m`: 100 escenarios
- `NQ 1m`: 100 escenarios
- `NQ 5m`: 100 escenarios
- `NQ 15m`: 100 escenarios

## 4. Events & Regimes
- **Eventos**: BOS (300 escenarios), MSS (300 escenarios).
- **Regímenes**: NORMAL (150 escenarios), ELEVATED (150 escenarios), SHOCK (150 escenarios), POST-SHOCK (150 escenarios).

## 5. Pure Shadow Results
- **Modo**: `PURE_SHADOW` (`qualificationThresholdRatio = 0`)
- **Resultados de las 4 Variantes**:
  - `BASELINE`: 200 TARGET (33.33%) / 400 STOP (66.67%) / 0 NO_EXECUTION (0.00%)
  - `ROBUST_10`: 200 TARGET (33.33%) / 400 STOP (66.67%) / 0 NO_EXECUTION (0.00%)
  - `ROBUST_14`: 200 TARGET (33.33%) / 400 STOP (66.67%) / 0 NO_EXECUTION (0.00%)
  - `ROBUST_20`: 200 TARGET (33.33%) / 400 STOP (66.67%) / 0 NO_EXECUTION (0.00%)
- **Divergencias de Outcome**: **0 de 600 (0.00%)**.

## 6. Filtered Experiment Results
- **Modo**: `FILTERED_EXPERIMENT` (`qualificationThresholdRatio = 0.8`)
- **Resultados por Variante**:
  - `BASELINE`: 185 TARGET (30.83%) / 370 STOP (61.67%) / 45 NO_EXECUTION (7.50%)
  - `ROBUST_10`: 200 TARGET (33.33%) / 400 STOP (66.67%) / 0 NO_EXECUTION (0.00%)
  - `ROBUST_14`: 200 TARGET (33.33%) / 400 STOP (66.67%) / 0 NO_EXECUTION (0.00%)
  - `ROBUST_20`: 200 TARGET (33.33%) / 400 STOP (66.67%) / 0 NO_EXECUTION (0.00%)

## 7. Multi-Timeframe Matrix
| Símbolo | Timeframe | Variante | Total | Target | Stop | Rejected | Rejection Rate |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| MNQ | 1m | BASELINE | 100 | 32 | 63 | 5 | 5.0% |
| MNQ | 1m | ROBUST_10/14/20 | 100 | 34 | 66 | 0 | 0.0% |
| MNQ | 5m | BASELINE | 100 | 32 | 63 | 5 | 5.0% |
| MNQ | 5m | ROBUST_10/14/20 | 100 | 33 | 67 | 0 | 0.0% |
| MNQ | 15m | BASELINE | 100 | 31 | 64 | 5 | 5.0% |
| MNQ | 15m | ROBUST_10/14/20 | 100 | 33 | 67 | 0 | 0.0% |
| NQ | 1m | BASELINE | 100 | 31 | 59 | 10 | 10.0% |
| NQ | 1m | ROBUST_10/14/20 | 100 | 34 | 66 | 0 | 0.0% |
| NQ | 5m | BASELINE | 100 | 30 | 60 | 10 | 10.0% |
| NQ | 5m | ROBUST_10/14/20 | 100 | 33 | 67 | 0 | 0.0% |
| NQ | 15m | BASELINE | 100 | 29 | 61 | 10 | 10.0% |
| NQ | 15m | ROBUST_10/14/20 | 100 | 33 | 67 | 0 | 0.0% |

## 8. Regime Matrix
| Régimen | Estimador | Total | Elegibles | Rechazados | Tasa de Rechazo |
| :--- | :--- | :---: | :---: | :---: | :---: |
| NORMAL | RollingMeanTR / MedianTR10/14/20 | 150 | 150 | 0 | 0.0% |
| ELEVATED | RollingMeanTR / MedianTR10/14/20 | 150 | 150 | 0 | 0.0% |
| SHOCK | RollingMeanTR (Baseline) | 150 | 105 | 45 | 30.0% |
| SHOCK | MedianTR10 / MedianTR14 / MedianTR20 | 150 | 150 | 0 | 0.0% |
| POST-SHOCK | RollingMeanTR / MedianTR10/14/20 | 150 | 150 | 0 | 0.0% |

## 9. Shock / Post-Shock Analysis
- En el régimen `SHOCK` (N=150), `RollingMeanTR` sufrió picos anómalos repentinos que inflaron el denominador hasta 2.5x sobre la base.
- Consecuentemente, 45 de los 150 escenarios de shock (30.0%) tuvieron un ratio `Risk / RollingMeanTR < 0.8` y fueron rechazados por elegibilidad.
- Las variantes `MedianTR10`, `MedianTR14` y `MedianTR20` aislaron los picos aislados, manteniendo los ratios de los 150 escenarios de shock por encima de 0.8 (0.0% de rechazo).

## 10. Divergencias Auditadas
- **En Pure Shadow**: **0 de 600** divergencias. Se verifica inmovilidad total del simulador.
- **En Filtered Experiment**: **45 rechazos en Baseline** (concentrados 100% en el régimen `SHOCK`), cero rechazos en variantes `MedianTR`.

## 11. Detection Invariance
- Se comprobó que alternar entre `PURE_SHADOW` y `FILTERED_EXPERIMENT` o modificar el filtro a 0.8 mantiene **0.00 de variabilidad** sobre `Detection Events`, `eventTimestamp`, `confirmationTimestamp`, `detectionSnapshot` y `BaseScenario`.

## 12. Batch / Replay Equivalence
- `Batch Pure Shadow == Replay Pure Shadow` (600/600, 100% match)
- `Batch Filtered == Replay Filtered` (600/600, 100% match)

## 13. Simulated Live Streaming Equivalence
- `Simulated Live Pure Shadow == Batch Pure Shadow` (600/600, 100% match)
- `Simulated Live Filtered == Batch Filtered` (600/600, 100% match)

## 14. Future-Data Injection Asymmetry
- Inyectar velas extremas en `k >= 1` altera la trayectoria futura del `ExecutionTrace`, pero mantiene **100% inalteradas la `EligibilityDecision` y la firma de `BaseScenario`** evaluadas en `confirmationTimestamp`.

## 15. Limitaciones
- El estudio es estrictamente descriptivo del comportamiento del filtro experimental frente al estimador Shadow. No evalúa métricas de rentabilidad ni promueve cambios al motor en vivo.

## 16. Conclusiones Descriptivas
1. `PURE_SHADOW`: La métrica observacional NO altera outcomes (0 divergencias en los 600 escenarios).
2. `FILTERED_EXPERIMENT`: Con `qualificationThresholdRatio = 0.8`, `RollingMeanTR` sufre supresión del 30.0% de escenarios en régimen `SHOCK` (45 rechazos), mientras que `MedianTR` mantiene estabilidad across all 6 timeframes/symbols.

---

```
CHECKPOINT 24 STATUS

Active detector modified: NO
Active parameters modified: NO
MedianTR production enabled: NO
New independent dataset: PASS
Dataset hash frozen: PASS
Pure Shadow outcome invariance: PASS
Filtered experiment isolated: PASS
Multi-timeframe coverage: PASS
Regime isolation: PASS
Detection invariance: PASS
Batch/Replay equivalence: PASS
Simulated-Live equivalence: PASS
Future injection: PASS
Configuration isolation: PASS
Audit trail: PASS
Tests: 160/160
Build: PASS

PURE SHADOW OUTCOME DIFFERENCE: NO
FILTERED ELIGIBILITY DIFFERENCE: YES
FILTER THRESHOLD: 0.8
BASELINE REJECTIONS: 45
ROBUST_10 REJECTIONS: 0
ROBUST_14 REJECTIONS: 0
ROBUST_20 REJECTIONS: 0

FINAL MODEL CHANGE: NONE

## NEXT STEP: Maintain frozen active engine state and report completion of CP24 multi-timeframe validation.
```
