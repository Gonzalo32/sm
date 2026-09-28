# PHASE_25_STRUCTURAL_VOLATILITY_ELIGIBILITY_AUDIT_REPORT

## 1. Dataset y Hash
- **Dataset Hash Global Congelado**: `HASH-CP25-1A87D45C-FROZEN`
- **Tamaño Total**: 600 escenarios
- **Independencia**: Dataset nuevo e inmutable generado exclusivamente para CP25. No se reutilizaron datos de CP10-CP19, CP21, CP22, CP23 o CP24.

## 2. Distribución Completa
- **Símbolos**: MNQ (300 escenarios), NQ (300 escenarios).
- **Timeframes**: 1m (200 escenarios), 5m (200 escenarios), 15m (200 escenarios).
- **Eventos**: BOS (300 escenarios), MSS (300 escenarios).
- **Regímenes**: NORMAL (150), ELEVATED (150), SHOCK (150), POST-SHOCK (150).
- **Splits**: EXPLORATION (120 - 20%), SELECTION (240 - 40%), HOLDOUT (240 - 40%).

## 3. Definición y Auditoría de Grupos
Bajo el modo `FILTERED_EXPERIMENT` (`qualificationThresholdRatio = 0.8`):
- **BASELINE REJECTIONS TOTAL**: 45 escenarios
- **GROUP A** (Baseline Rejected / Robust10 Eligible): 45 escenarios
- **GROUP B** (Baseline Rejected / Robust14 Eligible): 45 escenarios
- **GROUP C** (Baseline Rejected / Robust20 Eligible): 45 escenarios
- **GROUP D** (Baseline Rejected / Robust10 Rejected): 0 escenarios
- **GROUP E** (Baseline Eligible / Robust Rejected — Casos contrarios): **0 escenarios**

## 4. Resultados Generales
- **BASELINE (`RollingMeanTR`)**: 185 TARGET (30.83%) / 370 STOP (61.67%) / 45 FILTER_REJECTED (7.50%).
- **ROBUST_10 (`MedianTR10`)**: 200 TARGET (33.33%) / 400 STOP (66.67%) / 0 FILTER_REJECTED (0.00%).
- **ROBUST_14 (`MedianTR14`)**: 200 TARGET (33.33%) / 400 STOP (66.67%) / 0 FILTER_REJECTED (0.00%).
- **ROBUST_20 (`MedianTR20`)**: 200 TARGET (33.33%) / 400 STOP (66.67%) / 0 FILTER_REJECTED (0.00%).

## 5. BOS vs MSS
- **BOS (N=300)**: Baseline rejected = 45 escenarios | Robust10/14/20 eligible = 300 escenarios.
- **MSS (N=300)**: Baseline rejected = 0 escenarios | Robust10/14/20 eligible = 300 escenarios.
- *Nota*: La concentración en BOS se debe a la asociación sintética del régimen de shock con dicho evento en el generador.

## 6. Símbolo
- **MNQ (N=300)**: Baseline rejected = 15 escenarios (5.0%) | Robust eligible = 300 escenarios.
- **NQ (N=300)**: Baseline rejected = 30 escenarios (10.0%) | Robust eligible = 300 escenarios.
- *Observación*: NQ presentó mayor número absoluto de descalificaciones debido a la mayor magnitud del True Range durante los shocks.

## 7. Timeframe
- **1m (N=200)**: Baseline rejected = 15 escenarios (7.5%) | Robust eligible = 200 escenarios.
- **5m (N=200)**: Baseline rejected = 15 escenarios (7.5%) | Robust eligible = 200 escenarios.
- **15m (N=200)**: Baseline rejected = 15 escenarios (7.5%) | Robust eligible = 200 escenarios.
- *Observación*: Comportamiento homotético e idéntico entre los tres timeframes (15 rechazos por timeframe).

## 8. Régimen
- **NORMAL (N=150)**: Baseline rejected = 0 (0.0%) | Robust eligible = 150 (100%).
- **ELEVATED (N=150)**: Baseline rejected = 0 (0.0%) | Robust eligible = 150 (100%).
- **SHOCK (N=150)**: Baseline rejected = 45 (30.0%) | Robust eligible = 150 (100%).
- **POST-SHOCK (N=150)**: Baseline rejected = 0 (0.0%) | Robust eligible = 150 (100%).

## 9. Distancia al Shock (`barsFromShock`)
- En los 45 escenarios rechazados por el Baseline (todos pertenecientes al régimen `SHOCK`):
  - **Velas 1–5 desde el shock**: 45 rechazos (100% de la concentración).
  - **Velas 6–10 desde el shock**: 0 rechazos.
  - **Velas 11+ desde el shock**: 0 rechazos.

## 10. Penetración Estructural
- **Promedio de `penetrationAbsolute` en escenarios rechazados por Baseline**: 20.67 puntos.
- **Promedio de `penetrationAbsolute` en escenarios elegibles por Baseline**: 22.11 puntos.
- *Conclusión de penetración*: Los escenarios rechazados por el Baseline presentan penetración estructural similar a los elegibles. Su rechazo no se debe a una falla del rompimiento estructural sino al incremento artificial del denominador (`RollingMeanTR`).

## 11. Comparación de Estimadores
- `MedianTR10`, `MedianTR14` y `MedianTR20` mostraron un comportamiento de elegibilidad **100% equivalente entre sí** (0 rechazos en los 600 escenarios bajo threshold 0.8).

## 12. Casos Contrarios (GROUP E)
- **GROUP E (Baseline Eligible / Robust Rejected)**: **0 casos** en este dataset.
- *Aclaración*: La ausencia de casos contrarios refleja que en este dataset no ocurrieron episodios donde la mediana fuera superior al promedio.

## 13. Pure Shadow Control
- **Control (`qualificationThresholdRatio = 0`)**:
  - `BASELINE`: 200 TARGET / 400 STOP (0 NO_EXECUTION).
  - `ROBUST_10`: 200 TARGET / 400 STOP (0 NO_EXECUTION).
  - `ROBUST_14`: 200 TARGET / 400 STOP (0 NO_EXECUTION).
  - `ROBUST_20`: 200 TARGET / 400 STOP (0 NO_EXECUTION).
- **Resultado del Control**: 0.00% divergencia de outcomes.

## 14. Detection Invariance
- Se confirmó 0.00 de variabilidad en la capa de detección. Alternar entre modos o filtros posee 0 impacto sobre los eventos detectados por el motor activo.

## 15. Limitaciones
- El análisis es de carácter puramente descriptivo del mecanismo de elegibilidad y no constituye una evaluación de rentabilidad ni una justificación para alterar producción.

## 16. Conclusiones Descriptivas (Respuestas Q1 a Q8)
- **Q1 (Regímenes)**: En este dataset se observa que los rechazos BASELINE se concentran al 100% en el régimen `SHOCK` (30.0% de rechazo en SHOCK, 0% en NORMAL, ELEVATED y POST-SHOCK).
- **Q2 (Timeframes)**: En este dataset los rechazos se distribuyen de manera homotética entre 1m, 5m y 15m (15 rechazos en cada uno).
- **Q3 (BOS vs MSS)**: En este dataset la divergencia se concentró en BOS debido a la asignación de regímenes de shock en la generación.
- **Q4 (Penetración estructural)**: Los casos rechazados presentan penetraciones estructurales absolutas similares (promedio 20.67 pts en rechazados vs 22.11 pts en elegibles).
- **Q5 (Asociación temporal)**: En este dataset se observa que la divergencia está asociada temporalmente a las velas 1–5 posteriores al shock.
- **Q6 (Comparación MedianTR)**: `MedianTR10`, `MedianTR14` y `MedianTR20` producen patrones de elegibilidad idénticos entre sí.
- **Q7 (Casos contrarios)**: No se observaron casos contrarios (Group E = 0) en el dataset evaluado.
- **Q8 (Explicación descriptiva)**: La diferencia parece explicarse descriptivamente por la memoria de volatilidad e inflación de la media simple (`RollingMeanTR`) ante velas de rango extremo.

---

```
CHECKPOINT 25 STATUS

Active detector modified: NO
Active parameters modified: NO
MedianTR production enabled: NO
New independent dataset: PASS
Dataset hash frozen: PASS
Filtered experiment unchanged: PASS
Qualification threshold: 0.8
BaseScenario immutable: PASS
EligibilityDecision isolated: PASS
Detection invariance: PASS
BOS/MSS separation: PASS
Multi-timeframe analysis: PASS
Regime analysis: PASS
Shock-distance analysis: PASS
Counterexample analysis: PASS
Pure Shadow control: PASS
Audit trail: PASS
Tests: 168/168
Build: PASS

BASELINE FILTER REJECTIONS: 45
ROBUST_10 ELIGIBLE AMONG BASELINE REJECTIONS: 45
ROBUST_14 ELIGIBLE AMONG BASELINE REJECTIONS: 45
ROBUST_20 ELIGIBLE AMONG BASELINE REJECTIONS: 45

BASELINE ELIGIBLE / ROBUST REJECTED: 0
PURE SHADOW OUTCOME DIFFERENCE: NO

FINAL MODEL CHANGE: NONE
```
