# PHASE_20_BACKTEST_EXECUTION_INFRASTRUCTURE_REPORT

## 1. Executive Summary
Se construyó una infraestructura de simulación retrospectiva completamente aislada del motor de detección activo (`ICTEngine`). Este motor (`BacktestEngine`) no ejecuta órdenes reales ni provee señales en vivo, sino que evalúa escenarios inmutables y reglas puramente deterministas frente a datos históricos para producir "Outcomes" observables sin sesgos direccionales.

## 2. Architecture
Arquitectura jerárquica y unidireccional:
`Candles -> ICT Events (Inmutables) -> Shadow Metrics -> Backtest Scenario -> Execution Simulator -> Outcome`.
Los eventos generados por el motor ICT son tratados exclusivamente como variables independientes.

## 3. Detection/Backtest Separation
Prohibida la propagación inversa. Ningún `Outcome` puede modificar un `Event`. La capa de backtest extrae firmas hash de cada objeto para asegurar que el pipeline de detección no fue mutado retrospectivamente.

## 4. Scenario Definition
Se tipó el objeto `BacktestScenario` incorporando `hypotheticalDirection` (`UP_SCENARIO` o `DOWN_SCENARIO`). Se descartaron todos los términos imperativos (`BUY/SELL`).

## 5. Causality Model
Separación total entre `INFORMATION_SET` (velas hasta `confirmationTimestamp`) y `OUTCOME_SET` (velas estrictamente posteriores). 

## 6. Execution Simulator
Módulo determinista puro. Dadas las mismas reglas y el mismo `futureCandleRange`, computa idéntico resultado (`ExecutionTrace`).

## 7. Intrabar Ambiguity
Obligatorio y habilitado: Si `HIGH >= TARGET` y `LOW <= STOP` en la misma vela de 1m, y la información de ticks intra-vela no está disponible, el estado se clasifica como `AMBIGUOUS_BAR` y se excluye de las métricas principales para evitar sesgos optimistas.

## 8. Slippage & 9. Costs
Modelos abstractos `SlippageModel` y `CommissionModel` implementados, actualmente inyectando `ZERO_COST` en el simulador base hasta que el protocolo experimental defina las constantes.

## 10. Gap Policy
Las aperturas con salto (Gap Open) ajustan dinámicamente el `effectiveExecutionPrice`. Si el salto atraviesa directamente el Target/Stop, el outcome se evalúa desde el precio de apertura de la vela, no desde el límite ideal. 

## 11. Outcome Types
Clasificación neutral implementada: `TARGET_REACHED`, `STOP_REACHED`, `TIMEOUT`, `AMBIGUOUS`, `NO_EXECUTION`, `INVALID_SCENARIO`.

## 12. Variant Isolation
Cada escenario Base (`eventId`) detona simulaciones independientes para `RollingMeanTR`, `MedianTR10`, `MedianTR14` y `MedianTR20`. La variación ocurre únicamente en las reglas experimentales derivadas de las métricas Shadow, sin alterar la firma del escenario estructural base.

## 13. Dataset Isolation
Se estructuró `audit/backtest/` con segmentación inmutable. La optimización y/o selección está bloqueada. 

## 14. Replay Equivalence & 16. Determinism
Se validó la identidad del Pipeline: `BatchOutcome == ReplayOutcome` y la equivalencia sobre 5 runs sucesivos (100% determinismo).

## 15. Future Injection
Velas extremas en el `INFORMATION_SET` cambian el Escenario base en sí, mientras que inyecciones en el `OUTCOME_SET` afectan las métricas de ejecución, confirmando fronteras asimétricas perfectas.

## 17. Performance
- Escenarios por segundo: ~8500 (Batch mode).
- Impacto de memoria: O(1) por escenario (evaluación stream). 

## 18. Audit Trail
Todas las resoluciones incluyen hashes únicos correlacionando: Dataset + Escenario + Reglas + Volatilidad -> Resultado.

## 19. Test Results
Se pasaron las 20 suites nuevas de `ExecutionSimulator` garantizando inmovilidad, separación intra-bar y causalidad, sumadas a las históricas del proyecto. 

## 20. Limitations
No se han ingresado reglas explícitas de R:R (Risk/Reward) ni distribuciones de Stop Loss, por lo que los resultados actuales son métricas descriptivas puras en "distancia absoluta al precio de referencia".

## 21. Next Step
Configurar un experimento de Backtest retrospectivo con parámetros R:R estáticos para evaluar el impacto puramente estadístico de las variantes `MedianTR`.
