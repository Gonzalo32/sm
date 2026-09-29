# CP32.8 — CONCEPTUAL DECISION LOG

> **Baseline Identifier**: `CP32.8-EXPERT-ICT-BASELINE-V1`  
> **Document Status**: Official Decision Log  

---

## 1. REGISTRO DE DECISIONES DE GOBERNANZA CONCEPTUAL

| ID Decisión | Fecha | Principio / Materia | Decisión Adoptada | Justificación / Restricción |
| :--- | :--- | :--- | :--- | :--- |
| `DEC-32.8-01` | 2026-09-29 | Autoridad Conceptual del Usuario | **Usuario = Product Owner únicamente** | El usuario determina UX, preferencias, alcance y visualización, pero NO valida la definición técnica de conceptos ICT/SMC. |
| `DEC-32.8-02` | 2026-09-29 | Autoridad Conceptual del Asistente | **Antigravity = Implementador & Auditor únicamente** | Antigravity no puede ser juez de sus propias definiciones. La verdad conceptual proviene de fuentes documentadas independientes. |
| `DEC-32.8-03` | 2026-09-29 | Congelación de Código Productivo | **PRODUCCIÓN CONGELADA (Code Freeze)** | Prohibido modificar cualquier archivo en `core/ict/` o componentes del engine durante el desarrollo del CP32.8. |
| `DEC-32.8-04` | 2026-09-29 | Congelación de Parámetros | **PARÁMETROS CONGELADOS (Parameter Freeze)** | Prohibido alterar `bodyRatio`, `rangeMultiplier`, `thresholds`, `windows`, `ATR`, `volatility` o `filters`. |
| `DEC-32.8-05` | 2026-09-29 | Prohibición de Señales Financieras | **CERO SEÑALES FINANCIERAS** | Prohibida la emisión o introducción de señales BUY/SELL, órdenes Entry, Stop-Loss (SL), Take-Profit (TP) o Risk/Reward (RR). |
| `DEC-32.8-06` | 2026-09-29 | Prohibición de Métricas de Rentabilidad | **CERO MÉTRICAS DE RENTABILIDAD** | Prohibido realizar backtesting de rentabilidad, win-rate, profit factor o curve fitting durante este checkpoint. |
| `DEC-32.8-07` | 2026-09-29 | Postura Operativa BOS/MSS | **Ruptura por Cierre de Cuerpo** | Se exige cierre de cuerpo (`Close > Swing High` / `Close < Swing Low`) para confirmar BOS y MSS en V1. |
| `DEC-32.8-08` | 2026-09-29 | Postura Operativa Order Block | **Vela Completa previa a FVG** | Se define OB como la vela opuesta completa ($High$-$Low$) que precede al movimiento con desbalance FVG y ruptura estructural. |
| `DEC-32.8-09` | 2026-09-29 | Protocolo de Auditoría Ciega | **Blind Case Review obligatorio** | Las futuras evaluaciones de casos se realizarán sin conocimiento previo de la salida del motor informático. |

---

## 2. FIRMA Y ESTADO DE ADOPCIÓN DE LA LÍNEA DE BASE

El baseline conceptual CP32.8 queda formalmente **ESTABLECIDO Y CONGELADO**. Todos los desarrollos, auditorías y pruebas posteriores deberán referenciarse contra los documentos `01` al `07` contenidos en la carpeta `CP32.8_EXPERT_ICT_BASELINE/`.
