# PHASE_26_ELIGIBILITY_MARGIN_CONVERGENCE_AUDIT_REPORT

## 1. Dataset y Hash
- **Dataset Hash Global Congelado**: `HASH-CP26-4ECA26F2-FROZEN`
- **Tamaño Total**: 600 escenarios
- **Independencia**: Dataset nuevo e inmutable generado exclusivamente para CP26. No se reutilizaron datos de CP10-CP19, CP21-CP25.

## 2. Distribución Completa
- **Símbolos**: MNQ (300 escenarios), NQ (300 escenarios).
- **Timeframes**: 1m (200 escenarios), 5m (200 escenarios), 15m (200 escenarios).
- **Eventos**: BOS (300 escenarios), MSS (300 escenarios).
- **Regímenes**: NORMAL (150), ELEVATED (150), SHOCK (150), POST-SHOCK (150).
- **Splits**: EXPLORATION (120 - 20%), SELECTION (240 - 40%), HOLDOUT (240 - 40%).

## 3. Fórmula Exacta de Elegibilidad
- **Fórmula de Elegibilidad**: `eligible` = `risk / volatility >= 0.8000`
- **Métricas de Margen**:
  - `riskVolatilityRatio` = `risk / volatility`
  - `eligibilityMargin` = `riskVolatilityRatio - 0.8000`
  - `absoluteMargin` = `risk - (0.8000 * volatility)`
- **Verificación de Control**: Para todo escenario, `eligibilityMargin >= 0.0000` equivale exactamente a `eligible = true`.

## 4. Denominadores y Totales
- **Total de Escenarios Auditados**: 600 escenarios.
- **Total de Escenarios Evaluados por Estimador**: 2,400 evaluaciones (600 x 4 estimadores).

## 5. Histogramas / Tablas de Margen (Distribución por Bandas de Ratio)
| Banda de Ratio | BASELINE (`RollingMeanTR`) | ROBUST_10 (`MedianTR10`) | ROBUST_14 (`MedianTR14`) | ROBUST_20 (`MedianTR20`) |
| :--- | :---: | :---: | :---: | :---: |
| `< 0.70` | 40 | 0 | 0 | 0 |
| `0.70 - 0.75` | 20 | 0 | 0 | 0 |
| `0.75 - 0.80` | 15 | 0 | 0 | 0 |
| `0.80 - 0.85` | 30 | 0 | 0 | 0 |
| `0.85 - 0.90` | 20 | 0 | 0 | 0 |
| `>= 0.90` | 475 | 600 | 600 | 600 |

## 6. Casos Cercanos al Umbral (Top 10 Closest Cases to Threshold 0.8)
| Index | Scenario ID | Estimador | Ratio | Margen (`eligibilityMargin`) | Elegible | Símbolo | Timeframe | Evento | Régimen |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| 1 | `CP26-SCEN-NQ-1m-MSS-0348` | `RollingMeanTR` | 0.8013 | +0.0013 | true | NQ | 1m | MSS | POST-SHOCK |
| 2 | `CP26-SCEN-NQ-5m-MSS-0408` | `RollingMeanTR` | 0.8013 | +0.0013 | true | NQ | 5m | MSS | POST-SHOCK |
| 3 | `CP26-SCEN-NQ-5m-MSS-0468` | `RollingMeanTR` | 0.8013 | +0.0013 | true | NQ | 5m | MSS | POST-SHOCK |
| 4 | `CP26-SCEN-NQ-15m-MSS-0528` | `RollingMeanTR` | 0.8013 | +0.0013 | true | NQ | 15m | MSS | POST-SHOCK |
| 5 | `CP26-SCEN-NQ-15m-MSS-0588` | `RollingMeanTR` | 0.8013 | +0.0013 | true | NQ | 15m | MSS | POST-SHOCK |
| 6 | `CP26-SCEN-NQ-1m-BOS-0339` | `RollingMeanTR` | 0.8019 | +0.0019 | true | NQ | 1m | BOS | SHOCK |
| 7 | `CP26-SCEN-NQ-1m-BOS-0399` | `RollingMeanTR` | 0.8019 | +0.0019 | true | NQ | 1m | BOS | SHOCK |
| 8 | `CP26-SCEN-NQ-5m-BOS-0459` | `RollingMeanTR` | 0.8019 | +0.0019 | true | NQ | 5m | BOS | SHOCK |
| 9 | `CP26-SCEN-NQ-15m-BOS-0519` | `RollingMeanTR` | 0.8019 | +0.0019 | true | NQ | 15m | BOS | SHOCK |
| 10 | `CP26-SCEN-NQ-15m-BOS-0579` | `RollingMeanTR` | 0.8019 | +0.0019 | true | NQ | 15m | BOS | SHOCK |

- **Caso más cercano al umbral**: `CP26-SCEN-NQ-1m-MSS-0348` con Ratio = **0.8013** y Margen = **+0.0013**.

## 7. Divergencias entre Robust Estimators
- **ROBUST ESTIMATOR CLASSIFICATION DIVERGENCES**: **0** (Cero divergencias de clasificación).
- `MedianTR10`, `MedianTR14` y `MedianTR20` clasificaron de manera **100% idéntica** todos los escenarios del dataset (600/600 elegibles).
- **Métricas de Convergencia Promedio**:
  - Diferencia de volatilidad promedio (M10 vs M14): 0.5920 puntos.
  - Diferencia de volatilidad promedio (M14 vs M20): 0.3837 puntos.
  - Diferencia de ratio promedio (M10 vs M14): 0.0951.
  - Diferencia de ratio promedio (M14 vs M20): 0.0684.
- *Explicación*: Aunque los valores numéricos de volatilidad presentan leves diferencias entre ventanas de 10, 14 y 20 periodos, en los 600 escenarios todos los ratios se mantuvieron holgadamente en la banda `>= 0.90`, resultando en 0 divergencias de clasificación respecto del umbral 0.8.

## 8. Baseline vs Robust
- **Descalificaciones en Baseline (`RollingMeanTR`)**: 75 escenarios (40 en `< 0.70`, 20 en `0.70-0.75`, 15 en `0.75-0.80`).
- **Descalificaciones en Robust (`MedianTR10/14/20`)**: 0 escenarios.

## 9. Shock / Post-Shock Audit
- **NORMAL**: Baseline 0/150 rechazados | Robust 0/150 rechazados.
- **ELEVATED**: Baseline 0/150 rechazados | Robust 0/150 rechazados.
- **SHOCK**: Baseline 45/150 rechazados (30.0%) | Robust 0/150 rechazados.
- **POST-SHOCK**: Baseline 30/150 rechazados (20.0%) | Robust 0/150 rechazados.
- *Conclusión*: Las 75 descalificaciones del Baseline se distribuyen exclusivamente en `SHOCK` (45 casos) y `POST-SHOCK` (30 casos) en las velas 1 a 10 posteriores al evento anómalo.

## 10. Pure Shadow Control
- **Control (`qualificationThresholdRatio = 0`)**:
  - `BASELINE`: 200 TARGET / 400 STOP (0 NO_EXECUTION).
  - `ROBUST_10`: 200 TARGET / 400 STOP (0 NO_EXECUTION).
  - `ROBUST_14`: 200 TARGET / 400 STOP (0 NO_EXECUTION).
  - `ROBUST_20`: 200 TARGET / 400 STOP (0 NO_EXECUTION).
- **Resultado del Control**: 0.00% divergencia de outcomes.

## 11. Detection Invariance
- Se comprobó 0.00 de variabilidad en la capa de detección (`ICTEvent`, `eventTimestamp`, `confirmationTimestamp`, `DetectionSnapshot`).

## 12. Mathematical Control & Edge Cases
- **Precisión Flotante**: Verificada. Ratios dentro de `1e-9` se evalúan consistentemente.
- **Warmup Insuficiente / Volatilidad Nula (`volatility <= 0`)**: Manejado de forma segura retornando `eligible = false` con motivo `INVALID_SCENARIO` sin generar excepciones numéricas (NaN/Infinity).

## 13. Limitaciones
- El estudio es estrictamente descriptivo de la convergencia matemática y márgenes de elegibilidad bajo el filtro experimental 0.8. No constituye una optimización de ventanas ni un ranking operativo.

## 14. Conclusiones Descriptivas
1. La convergencia de clasificación entre `MedianTR10`, `MedianTR14` y `MedianTR20` en este dataset es del 100% (0 divergencias), debido a que los ratios de las tres variantes robustas se mantienen holgadamente por encima del umbral de 0.8 en la banda `>= 0.90`.
2. Las descalificaciones del Baseline se concentran en regímenes de shock y post-shock debido a la memoria de la media simple.
3. El caso más cercano al umbral de 0.8 en la muestra fue `CP26-SCEN-NQ-1m-MSS-0348` con un margen positivo de `+0.0013`.

---

```
CHECKPOINT 26 STATUS

Active detector modified: NO
Active parameters modified: NO
MedianTR production enabled: NO
New independent dataset: PASS
Dataset hash frozen: PASS
Qualification threshold: 0.8
Eligibility formula verified: PASS
Floating-point behavior verified: PASS
Warmup behavior verified: PASS
Estimator convergence audit: PASS
Robust classification divergences: 0
Baseline/Robust divergence audit: PASS
Shock/Post-Shock audit: PASS
Pure Shadow outcome invariance: PASS
Detection invariance: PASS
Audit trail: PASS
Tests: 176/176
Build: PASS

BASELINE FILTER REJECTIONS: 75
ROBUST_10 FILTER REJECTIONS: 0
ROBUST_14 FILTER REJECTIONS: 0
ROBUST_20 FILTER REJECTIONS: 0

ROBUST ESTIMATOR CLASSIFICATION DIVERGENCES: 0

CLOSEST CASE TO THRESHOLD: CP26-SCEN-NQ-1m-MSS-0348 (Ratio: 0.8013, Margin: +0.0013)

PURE SHADOW OUTCOME DIFFERENCE: NO

FINAL MODEL CHANGE: NONE
```
