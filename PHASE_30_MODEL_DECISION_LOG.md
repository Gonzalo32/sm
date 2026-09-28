# PHASE 30 — ICT MODEL V1 DECISION LOG

> **Document Status**: `FORMAL CONCEPTUAL DECISION LOG`  
> **Associated Specification**: `PHASE_30_ICT_MODEL_V1_SPECIFICATION.md`  
> **Scope**: Record of explicit design decisions for ICT Model V1

---

## DECISION LOG SUMMARY

| Decision ID | Topic | Selected Option | Status | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **DEC-001** | Structural Break Definition | **CLOSE ONLY** (Cuerpo de vela por encima/debajo del swing) | **FROZEN** | Eliminación de falsos BOS por mecha |
| **DEC-002** | Sweep vs Breakout Separation | **Wick Sweep / Close Inside** | **FROZEN** | Definición estricta de Liquidity Sweep |
| **DEC-003** | Order Block Definition | **Variant B (ICT Standard)** | **FROZEN** | Requiere FVG y BOS confluente |
| **DEC-004** | Displacement Parameters | **`bodyRatio >= 0.60`, `rangeMult >= 1.50`** | **FROZEN** | Parámetros congelados sin optimización |
| **DEC-005** | Premium / Discount Role | **Pure Context Attribute** | **FROZEN** | No genera disparadores automáticos |
| **DEC-006** | Trading Signals Prohibition | **Strictly No `BUY`/`SELL` Signals** | **FROZEN** | El indicador es 100% analítico y visual |
| **DEC-007** | Deferred ICT Concepts | **Breaker Blocks & Mitigation Blocks Deferred** | **FROZEN** | Diferidos a versión V2 para evitar complejidad |
| **DEC-008** | Setup State Machine | **6-State Transition Model** | **FROZEN** | `WATCHING`, `FORMING`, `CONFIRMED`, `INVALIDATED`, `COMPLETED`, `EXPIRED` |
| **DEC-009** | Multi-Timeframe Causality | **Strict Confirmation Timestamp** | **FROZEN** | Ninguna vela HTF abierta propaga eventos |
| **DEC-010** | Non-Deterministic Concepts | **`CONCEPTO_NO_DETERMINISTA` Tag** | **FROZEN** | Sin reglas inventadas para subjetividades |

---

## DETAILED DECISION RECORDS

### DEC-001: Break of Structure (BOS) — Close vs. Wick
- **Decision**: Un Break of Structure (BOS) requiere **obligatoriamente el cierre del cuerpo de la vela** por encima del Swing High (Bullish) o por debajo del Swing Low (Bearish).
- **Rationale**: Evita falsos rompimientos generados por mechas expansivas momentáneas. Una mecha que atraviesa un swing pero cierra por dentro se clasifica como `LIQUIDITY_SWEEP`.

---

### DEC-002: Liquidity Sweep Operational Rule
- **Decision**: Se clasifica como `LIQUIDITY_SWEEP` cuando el máximo/mínimo de una vela supera un nivel BSL/SSL activo pero el cierre de dicha vela ocurre por dentro de la estructura previa.
- **Rationale**: Captura la toma de liquidez institucional sin asumir continuación de tendencia.

---

### DEC-003: Order Block Model Freeze (Variant B)
- **Decision**: El modelo V1 adopta exclusivamente `Variant B (ICT Standard)` para la identificación de Order Blocks. Un Order Block es la última vela de color contrario previa a la aceleración que rompe estructura y deja un FVG activo.
- **Rationale**: Es la variante más robusta comprobada en los checkpoints históricos y evita la acumulación excesiva de cajas de OB inactivas en pantalla.

---

### DEC-004: Displacement Thresholds Freeze
- **Decision**: Los parámetros de desplazamiento quedan congelados en `bodyRatio >= 0.60` y `rangeMultiplier >= 1.50`.
- **Rationale**: Mantener estabilidad operacional sin realizar sobre-optimización de parámetros (curve fitting).

---

### DEC-005: Role of Premium / Discount & Dealing Range
- **Decision**: Las zonas Premium, Discount y Equilibrium se tratan estrictamente como **contexto de fondo**.
- **Rationale**: Garantiza que el usuario comprenda el estado del mercado sin convertir una zona de descuento en un disparador automático de compra.

---

### DEC-006: Complete Prohibition of Trade Signals & Instructions
- **Decision**: El sistema V1 no mostrará palabras `BUY`, `SELL`, ni sugerirá niveles de entrada/salida de trading execution.
- **Rationale**: Preservar la naturaleza analítica del indicador TradeSea y evitar responsabilidades de asesoría o ejecución automática.

---

### DEC-007: Deferral of Complex Concepts to V2
- **Decision**: Breaker Blocks, Mitigation Blocks, Inversion FVGs (IFVG) y Balanced Price Ranges (BPR) quedan clasificados como `DEFERRED_TO_V2`.
- **Rationale**: Concentrar V1 en el subconjunto mínimo coherente de alta precisión y determinismo.

---

### DEC-008: Setup State Machine Transitions
- **Decision**: Los setups de Modelos A, B y C transicionan deterministamente por los estados `WATCHING` -> `FORMING` -> `CONFIRMED` -> `INVALIDATED` / `COMPLETED` / `EXPIRED`.
- **Rationale**: Proporciona un ciclo de vida claro para el rastreador de modelos y el HUD UI.

---

### DEC-009: Anti-Lookahead Multi-Timeframe Policy
- **Decision**: La información de temporalidades superiores (HTF) sólo está disponible para el motor una vez alcanzado el `confirmationTimestamp` de la vela HTF correspondiente.
- **Rationale**: Previene cualquier sesgo de anticipación o modificación retroactiva en simulaciones Replay y tiempo real.

---

### DEC-010: Handling of Non-Deterministic ICT Concepts
- **Decision**: Cualquier concepto de ICT que no posea una regla determinista basada en precio/tiempo se marca como `CONCEPTO_NO_DETERMINISTA`.
- **Rationale**: Evita la introducción de sesgos o invención de algoritmos arbitrarios que desvirtúen la metodología ICT.
