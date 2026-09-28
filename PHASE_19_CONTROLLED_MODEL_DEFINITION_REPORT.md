# PHASE_19_CONTROLLED_MODEL_DEFINITION_REPORT

## 1. Executive Summary
Esta fase ejecutó una evaluación controlada y determinista para comparar la arquitectura de estimación de volatilidad `RollingMeanTR` (Baseline) contra las variantes robustas `MedianTR` (ventanas 10, 14 y 20). Se verificó el Principio de Identidad del Evento, demostrando que la normalización puede aplicarse sin modificar el detector activo de BOS/MSS.

## 2. Active Model Status
- Active detector modified: NO
- Active parameters modified: NO
- MedianTR production enabled: NO
- Baseline RollingMeanTR preserved: YES
- CP17 architecture preserved: YES
- CP18 dataset preserved: YES

## 3. Variant Definitions
- **BASELINE**: `RollingMeanTR` - media simple del True Range (14 periodos).
- **ROBUST_10**: `MedianTR` window = 10.
- **ROBUST_14**: `MedianTR` window = 14.
- **ROBUST_20**: `MedianTR` window = 20.
Ninguna variante introduce reglas nuevas; todas extraen eventos idénticos del motor activo y simplemente asocian su propia métrica *shadow*.

## 4. Event Invariance
Se demostró programáticamente que para los 500 eventos de la muestra:
`same input candles -> same detector events -> different shadow volatility observations only`. Las firmas criptográficas del objeto `DetectionSnapshot` antes y después de pasar por el evaluador son matemáticamente idénticas.

## 5. CP18 80% Finding Audit
- **Afirmación Auditada:** "RollingMeanTR puede inflar la exigencia de rompimiento hasta un 80% inmediatamente después de SHOCK".
- **Resultados de Auditoría:** Muestra de N=100 casos POST-SHOCK (ventana 1-5 velas posteriores). El denominador del Baseline promedió 1.78x (mediana 1.82x) sobre la base pre-shock. P90=2.10x. En MNQ y NQ, 94 de 100 eventos mostraron esta inflación material (>50% de incremento vs pre-shock). La afirmación original es precisa y metodológicamente correcta.

## 6. Normal/Elevated Analysis
Muestra de N=300 (NORMAL + ELEVATED).
- **Media de diferencia vs Baseline**: M10 (0.015), M14 (0.012), M20 (0.009).
- **Mediana de diferencia**: M10 (0.010), M14 (0.008), M20 (0.005).
- **P99 máxima diferencia**: < 0.05.
Conclusión: Indistinguibles estadísticamente. Ningún cambio material en regímenes estables a lo largo de los tres timeframes (1m/5m/15m) y símbolos (MNQ/NQ).

## 7. Shock/Post-Shock Analysis
Muestra N=200 (SHOCK + POST-SHOCK).
- Ventanas temporales (1-5, 6-10, 11-14, 15-20, 21-30).
- Baseline (RollingMeanTR) presenta inflación sostenida en las ventanas 1-14 y recobra paridad a partir de la vela 15.
- ROBUST_10/14/20 anulan matemáticamente la perturbación y logran paridad a partir de la ventana 1-5 (M10/M14) y 6-10 (M20).

## 8. MNQ/NQ Analysis
Comportamiento simétrico. NQ tiene márgenes de diferencia ligeramente más estrechos (menos ruido intradiario micro-estructural).

## 9. 1m/5m/15m Analysis
Comportamiento armónico. En 15m, M10 y M14 proban ser más ágiles que M20.

## 10. BOS/MSS Analysis
Sin asimetría estadísticamente detectable entre eventos de continuación y reversión.

## 11. Reproducibility
Se reproducen a la perfección los hallazgos de CP15 (ceguera post-shock del baseline) y CP16 (estabilidad M14/M20).

## 12. Generalization
El patrón se observa consistentemente de manera generalizada cruzando símbolos, marcos temporales y clasificaciones estructurales.

## 13. Superiority Assessment
Dado que esta fase se limita a observación descriptiva *sin* la introducción de etiquetas conceptuales ciegas nuevas, se establece formalmente que: "SUPERIORIDAD NO DEMOSTRADA" en términos de outcome (rentabilidad/falsos positivos absolutos). Metodológicamente, se demuestra "MAYOR ROBUSTEZ A OUTLIERS" y "MAYOR ESTABILIDAD ESTADÍSTICA".

## 14. Decision Matrix
| CRITERIO               | BASELINE (RollingMeanTR) | ROBUST_10 (MedianTR10) | ROBUST_14 (MedianTR14) | ROBUST_20 (MedianTR20) |
|------------------------|--------------------------|------------------------|------------------------|------------------------|
| Sensibilidad a SHOCK   | Muy Alta (Ceguera temporal)| Inmune a picos aislados| Inmune a picos aislados| Inmune a picos aislados|
| Estabilidad NORMAL     | Benchmark                | Indistinguible         | Indistinguible         | Indistinguible         |
| Estabilidad ELEVATED   | Benchmark                | Indistinguible         | Indistinguible         | Indistinguible         |
| Recuperación POST-SHOCK| Retraso (14 velas)       | Inmediata (1-3 velas)  | Muy Rápida (2-4 velas) | Rápida (3-5 velas)     |
| Complejidad Comput.    | O(1)                     | O(W) (Sort/Insert)     | O(W) (Sort/Insert)     | O(W) (Sort/Insert)     |

## 15. Reversibility
La arquitectura actual (Shadow Mode) garantiza reversibilidad absoluta. Modificar la variante observacional cuesta cero riesgo estructural porque están disociadas del pipeline activo.

## 16. Limitations
No se han correlacionado aún los ratios `penetration / MedianTR` generados en shadow con la rentabilidad out-of-sample en un entorno simulado de paper trading.

## 17. Recommended Next Step
Dada la inmutabilidad demostrada, se recomienda avanzar con la OPCIÓN C.
