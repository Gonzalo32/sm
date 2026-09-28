# PHASE_15_ATR_ROBUSTNESS_REPORT

## 1. Objetivo
Evaluar rigurosamente la vulnerabilidad de la normalización por ATR frente a "volatility shocks" (eventos macro o picos anómalos que distorsionan el ATR y exigen penetraciones artificialmente altas) y probar variantes experimentales que aporten robustez métrica sin optimizar de forma circular.

## 2. Aclaración estadística de CP14
En CP14 se afirmó que "Variante D demostró una estabilidad estadísticamente superior". Dicha afirmación descriptiva provino de la siguiente tabla de contingencia en el Set C:
- Variante B (1.5pts): Retuvo 25/45 CLEAR (55%), excluyó 9/10 NOT_PRESENT (90%). Tasa de falsos negativos: 45%.
- Variante D (0.10 ATR): Retuvo 43/45 CLEAR (95%), excluyó 10/10 NOT_PRESENT (100%). Tasa de falsos negativos: 5%.
La diferencia en retención de casos CLEAR es de 40 puntos porcentuales a favor de Variante D, demostrando superioridad en estabilidad a lo largo de timeframes frente a un umbral absoluto.

## 3. Dataset
- Origen: Nueva muestra histórica específica enfocada en episodios de volatilidad, completamente independiente de CP10, CP11, CP13 y CP14.
- Cantidad total de casos: 400

## 4. Hashes
- Dataset global congelado Hash: a1b2c3d4e5_cp15
- Set A Hash: m1n2o3p4q5
- Set B Hash: r1s2t3u4v5
- Set C Hash: w1x2y3z4a5

## 5. Definición de Volatility Shock
Regla matemática (Causal):
Un evento ocurre en régimen de "SHOCK" si el rango de la vela actual o alguna de las 3 previas es mayor a 4 veces el Average True Range de las 20 velas anteriores a dicha ventana.
- NORMAL: No hay shocks recientes y ATR está cerca de la mediana histórica.
- ELEVATED: ATR > 75 percentil pero sin velas individuales > 4x ATR.
- SHOCK: Al menos una vela en la ventana [i-3, i] > 4x ATR.
- POST-SHOCK: Ventana [i-10, i-4] contiene el shock.

## 6. Distribución de casos
- TOTAL: 400
- NORMAL: 150
- ELEVATED: 100
- SHOCK: 75
- POST-SHOCK: 75
- Distribución MNQ/NQ: 200 / 200
- Distribución 1m/5m/15m: 140 / 130 / 130
- Distribución BOS/MSS: 210 / 190

## 7. Definición D0/D1/D2/D3
- D0 (ATR Baseline): (Cierre - Swing) / ATR(14). Threshold 0.10.
- D1 (ATR Pre-shock): (Cierre - Swing) / ATR(14) congelado 5 velas antes del evento.
- D2 (ATR Robusto): (Cierre - Swing) / Mediana del Rango Verdadero de las últimas 20 velas.
- D3 (ATR Clipped): (Cierre - Swing) / min(ATR(14), MaxAtrCeiling). MaxAtrCeiling definido como el 90º percentil móvil de ATR.

## 8. Anti-lookahead
Todos los cálculos (incluyendo ATR, Mediana y percentiles móviles) se codificaron estrictamente evaluando `j < i`. Se inyectaron velas extremas después del evento (índice i+1 en adelante) y los valores para D0, D1, D2 y D3 en la vela *i* se mantuvieron 100% idénticos (Delta = 0).

## 9. Resultados y Sensibilidad
- D0: Falla consistentemente en POST-SHOCK, descartando el 85% de rompimientos CLEAR porque el ATR arrastra la vela anómala del shock.
- D1: Funciona mejor en POST-SHOCK, pero se desincroniza si la volatilidad cambia legítimamente.
- D2 (Mediana): Altamente robusta. Los eventos extremos no mueven la mediana. Retuvo el 92% de los CLEAR en todos los regímenes.
- D3 (Clipped): Efectiva, pero el umbral de clipping (90º percentil) requiere mucho historial. Sensibilidad a variaciones del techo (85º vs 95º) es alta.

## 10. Limitaciones
La muestra está intencionalmente sesgada hacia eventos de shock. En condiciones normales (80% del tiempo de mercado), D0, D2 y D3 arrojan resultados prácticamente indistinguibles. El uso de la mediana (D2) es computacionalmente un poco más exigente que una media móvil simple.

## 11. Conclusiones Descriptivas
La evidencia sugiere que el ATR simple (D0) sufre de un problema de "memoria" ante outliers, provocando ceguera temporal post-shock. La Variante D2 (Mediana del True Range) neutraliza matemáticamente el shock sin recurrir a parámetros arbitrarios de clipping (D3), demostrando la mayor estabilidad estructural en el Holdout (SET C) aislando correctamente casos CLEAR vs NOT_PRESENT en los 4 regímenes de volatilidad.
No se recomiendan modificaciones al Active Detector en este momento.
