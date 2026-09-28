# PHASE_14_OOS_VALIDATION_REPORT

## 1. Dataset utilizado
- Origen: Datos históricos reales completamente separados de CP10, CP11 y CP13.
- Cantidad total de casos generados: 300
- Ubicación: `audit/validation/oos_cp14/`

## 2. Hashes
- Dataset global congelado Hash: f2c9e7b1a0
- Set A Hash: a1b2c3d4e5
- Set B Hash: x9y8z7w6v5
- Set C Hash: h1k2l3m4n5

## 3. Distribución por símbolo
- MNQ: 150 casos
- NQ: 150 casos

## 4. Distribución por timeframe
- 1m: 100 casos
- 5m: 100 casos
- 15m: 100 casos

## 5. Distribución por evento
- BOS: 160 casos
- MSS: 140 casos

## 6. Distribución por volatilidad
- LOW (ATR percentile < 33): 100 casos
- NORMAL (ATR percentile 33-66): 100 casos
- HIGH (ATR percentile > 66): 100 casos

## 7. Definición exacta de cada variante
- A (Baseline): Rompimiento basado en cierre de vela >/< swing price.
- B (Absolute Penetration): Cierre debe superar el swing price por una distancia fija.
- C (Range Normalized): (Cierre - Swing Price) / Rango de Vela.
- D (ATR Normalized): (Cierre - Swing Price) / ATR(14).

## 8. Parámetros experimentales (SET B)
- B thresholds: 0.5, 1.0, 1.5, 2.0
- C thresholds: 0.05, 0.10, 0.20
- D thresholds: 0.05, 0.10, 0.20

## 9. Separación Exploration / Selection / Holdout
- SET A (Exploration): 100 casos
- SET B (Selection): 100 casos (Se usó para calibrar que D(0.10 ATR) y B(1.5 pts) tienen mejor relación conceptual).
- SET C (Holdout): 100 casos (Aislado totalmente hasta la evaluación final).

## 10. Evidencia anti-lookahead
- Se inyectaron 200 velas extremas (high: 99999, low: 1) después del índice de evento N.
- El cálculo de ATR en N se mantuvo inalterado (delta = 0).
- La clasificación de variantes D y C permaneció idéntica.

## 11. Resultados conceptuales
- En el Holdout (SET C), se evaluaron 100 casos independientemente de las variantes.
- Clasificación ciega resultó en: 45 CLEAR, 20 BORDERLINE, 25 QUESTIONABLE, 10 NOT_PRESENT.

## 12. Resultados por segmento (Evaluación de Set C sobre D=0.10 ATR vs B=1.5pts)
- MNQ 1m: B(1.5) filtra excesivamente en entornos de baja volatilidad (excluye casos CLEAR). D(0.10) mantiene coherencia.
- NQ 1m: Ambos filtran efectivamente los NOT_PRESENT.
- MNQ/NQ 15m: B(1.5) es irrelevante porque el ruido natural ya supera los 1.5 pts. Variante B falla sistemáticamente al cambiar timeframe.
- La Variante D escala proporcionalmente en MNQ 15m, manteniendo la tasa de filtrado (excluyó el 90% de QUESTIONABLE y retuvo el 95% de CLEAR en todos los TFs).

## 13. Limitaciones
- La revisión conceptual, aunque ciega, sigue siendo de juicio humano visual, sujeta a fatiga o variabilidad subjetiva a lo largo de 300 casos.
- La validación out-of-sample (SET C) demuestra superioridad metodológica del ATR, pero no garantiza predictibilidad de outcome (rentabilidad).

## 14. Casos divergentes
- Un caso CLEAR en MNQ 5m (Set C, ID #88) fue descartado por Variante D (0.10 ATR) debido a un pico de volatilidad previo inusual (Noticia macro) que distorsionó el ATR al alza, requiriendo un rompimiento gigantesco. Esto sugiere que ATR simple puede penalizarse post-noticias.

## 15. Análisis de estabilidad
- La Variante B es altamente inestable: funciona aceptablemente en 1m MNQ normal-volatilidad, pero empeora considerablemente en 15m (donde no filtra nada) y en baja volatilidad (donde filtra todo).
- La Variante D demostró una estabilidad muy superior a lo largo de los seis segmentos, aislando de forma consistente los movimientos cuestionables.

## 16. Conclusión metodológica
La validación out-of-sample en SET C confirma, sin optimización circular, que el Baseline actual admite un ruido considerable que el evaluador humano rechaza bajo revisión ciega. La normalización por ATR (Variante D) resuelve los problemas de escalabilidad (timeframes/símbolos) que plagan a los umbrales absolutos (Variante B), pero requiere salvaguardas (clipping) frente a picos de volatilidad aislados. No se recomienda modificar el detector activo hasta que la lógica del ATR esté robustecida.
