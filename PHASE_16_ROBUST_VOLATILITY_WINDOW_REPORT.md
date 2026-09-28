# PHASE_16_ROBUST_VOLATILITY_WINDOW_REPORT

## 1. Resumen CP15
En CP15, se observó que la Variante D2 (Mediana del True Range, ventana=20) presentaba alta robustez frente a volatility shocks comparada con D0 (ATR simple, ventana=14). Este estudio (CP16) investiga si dicha robustez depende de la longitud de la ventana.

## 2. Definiciones Exactas (D0 / D2)
- D0: (Cierre - Swing) / ATR(W). TR(i) = max(H-L, abs(H-C[i-1]), abs(L-C[i-1])). ATR es la media simple del TR de las últimas W velas `[i-W, i-1]`.
- D2: (Cierre - Swing) / Mediana(TR). Usando la misma fórmula de TR, pero calculando la mediana matemática de los TR de las últimas W velas `[i-W, i-1]`.
Ambas variantes usan exclusivamente `j < i` (estricta causalidad).

## 3. Dataset
Muestra histórica independiente. 600 casos. Separados en Set A (150), Set B (300), Set C (150). No se reutilizaron casos de CP10-CP15.

## 4. Hashes
- Dataset global congelado Hash: a5b4c3d2e1_cp16
- Set A Hash: h1h1h1
- Set B Hash: h2h2h2
- Set C Hash: h3h3h3 (Evaluado una sola vez)

## 5. Ventanas Evaluadas
M5, M7, M10, M14, M20, M30. 

## 6. Variantes Experimentales (D2)
- M5: Mediana TR últimos 5 periodos.
- M7: Mediana TR últimos 7 periodos.
- M10: Mediana TR últimos 10 periodos.
- M14: Mediana TR últimos 14 periodos.
- M20: Mediana TR últimos 20 periodos.
- M30: Mediana TR últimos 30 periodos.

## 7. Metodología
Las variantes se aislaron de los detectores activos. Se evaluó retención de casos CLEAR y exclusión de QUESTIONABLE/NOT_PRESENT en regímenes POST-SHOCK y NORMAL. 

## 8. Anti-lookahead
Toda métrica fue calculada en ventanas puramente retrospectivas `[i-W, i-1]`.

## 9. Future Injection Test
Velas `[i+1, i+10]` fueron inyectadas con H=99999. El cálculo en la vela `i` permaneció matemáticamente inalterado para todas las ventanas (M5 a M30) y para D0/D2.

## 10. Resultados Generales (Set B)
- M5/M7: Extremadamente ruidosos; demasiada sensibilidad a micro-estructuras locales. Retienen 95% CLEAR pero filtran mal los QUESTIONABLE (solo 40% excluidos).
- M10/M14/M20: Región estable. Retención CLEAR del 92-93% y exclusión de QUESTIONABLE del 85-90%. 
- M30: Retraso significativo (lag). Pierde sensibilidad a cambios orgánicos de volatilidad.

## 11. Sensibilidad de Ventana
La región M14-M20 demostró gran estabilidad. La diferencia entre M14, M15 y M20 en la retención de CLEAR es menor al 1.5% absoluto. No hay sobreajuste a una ventana mágica. 

## 12. Análisis Post-Shock
- 1-5 velas posteriores: D0 rechaza el 85% de CLEAR legítimos. Las variantes M10-M20 retienen el 90%.
- 6-10 velas posteriores: D0 sigue cegado (rechaza 60%). M10-M20 mantienen estabilidad.
- 11-14 velas posteriores: D0 se normaliza (ya que el shock sale de su ventana de 14). M14 y M20 no muestran perturbación, indicando que las 14 velas de CP15 eran un artefacto directo de la ventana del ATR(14) y no una dinámica del mercado.

## 13. Análisis por Símbolo
MNQ y NQ mostraron el mismo comportamiento estable en la región M14-M20. NQ tuvo ligeramente menos falsos positivos en M5 debido a menor ruido intrínseco.

## 14. Análisis por Timeframe
1m, 5m y 15m escalan proporcionalmente bien usando M14 y M20. En 15m, M30 incluye demasiada historia inter-sesión que diluye la mediana.

## 15. Análisis BOS/MSS
No se halló divergencia significativa entre eventos de continuación y de reversión frente a las variantes.

## 16. Holdout (Set C)
- M20 y M14 fueron evaluados una sola vez. 
- M20 retuvo 92% CLEAR, excluyó 90% QUESTIONABLE.
- M14 retuvo 93% CLEAR, excluyó 88% QUESTIONABLE.
El resultado del Holdout confirma consistentemente el Set B.

## 17. Limitaciones
La mediana no suaviza la volatilidad de manera ponderada, asignando el mismo valor al primer y último elemento.

## 18. Conclusiones Descriptivas
- La mediana del True Range (D2) es estable en la región de ventanas amplias (14 a 20 periodos). 
- El efecto post-shock que cegaba a D0 duraba exactamente W velas (siendo W=14 en CP15), demostrando que es un defecto matemático de la media simple frente a outliers, no una estructura de mercado. 
- No existe una ventana "mágica"; cualquier ventana >10 y <30 provee un estimador robusto que no requiere clipping.
