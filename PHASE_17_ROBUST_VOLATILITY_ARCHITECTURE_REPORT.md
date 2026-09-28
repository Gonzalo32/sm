# PHASE_17_ROBUST_VOLATILITY_ARCHITECTURE_REPORT

## 1. Arquitectura de Volatilidad
Se diseñó e integró un componente `VolatilityEstimator` abstracto e independiente del navegador. Este permite calcular métricas de volatilidad de manera causal, determinista y auditable sin interferir con la lógica de detección activa.

## 2. Interfaz
Se definió `VolatilityEstimator` y el tipo de respuesta `VolatilityEstimate`. Ambas estructuras aíslan el cálculo de volatilidad del estado de Setup, MarketContext o de componentes visuales (Canvas/HUD).

## 3. Baseline (RollingMeanTR)
La métrica históricamente referida como D0 o ATR se ha refactorizado conceptualmente (sin alterar su matemática original) bajo el nombre exacto de `RollingMeanTR`. Representa la media simple móvil del True Range. 

## 4. MedianTR
Se implementó `MedianTR` como estimador robusto alternativo. Este componente extrae la mediana del True Range en ventanas específicas.

## 5. Ventanas Experimentales
El sistema permite instanciar estimadores con cualquier ventana. En esta fase experimental se instanciaron `M10`, `M14` y `M20` en modo de análisis paralelo. CP16 encontró evidencia consistente con una mayor robustez de MedianTR frente a outliers, y las ventanas 10–20 mostraron estabilidad en el dataset evaluado. No se asume ninguna de estas como universalmente superior.

## 6. Shadow Mode
`VolatilityShadowEvaluator` ejecuta simultáneamente `RollingMeanTR(14)`, `MedianTR(10)`, `MedianTR(14)` y `MedianTR(20)`. Mantiene absoluta inmutabilidad sobre `ICTEvent` (BOS/MSS/Displacement) y no altera el flujo principal.

## 7. LIVE Integration
`VolatilityShadowEvaluator` puede recibir candles del flujo LIVE. Su salida es estrictamente de diagnóstico y genera objetos `VolatilityShadowResult` que no se propagan como señales de trading, ni se conectan al HUD operativo actual.

## 8. REPLAY Integration
El `ReplayEngine` se amplió para alimentar paralelamente al `VolatilityShadowEvaluator`. Se confirmó la estricta equivalencia matemática entre Batch Detection y Replay Detection.

## 9. Causalidad
Toda estimación depende únicamente de información disponible hasta el momento `N` (`j < i`).

## 10. Future Injection
Se verificó mediante pruebas de inyección (`[0...N]` + velas futuras artificiales extremas) que ni `RollingMeanTR` ni `MedianTR` sufren modificaciones retrospectivas.

## 11. Warmup Handling
Cuando `sampleCount < window`, los estimadores marcan `ready = false`. Se evita estrictamente rellenar con datos futuros o inventar muestras iniciales, respetando la asimetría temporal del arranque.

## 12. Performance
El cálculo de medianas incluye rutinas incrementales ordenadas mediante inserción/eliminación. Su impacto en memoria y tiempo por candle (`~O(log W)` para ventana W) es imperceptible en tiempo real y no afecta el loop del motor.

## 13. Tests
Se incorporaron pruebas automatizadas cubriendo el determinismo del estimador, la exactitud del cálculo de True Range, manejo de gaps/duplicados, y protección del detector activo frente a mutaciones. Todo el test suite histórico de CP1 a CP16 sigue en `PASS`.

## 14. Limitaciones
La integración en LIVE se hace exclusivamente "por debajo" (background logs o developer console), requiriendo posterior instrumentación si el equipo decidiera promover esta lógica al HUD.
