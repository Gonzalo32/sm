# PHASE 29 — EXPERIMENTAL BRANCH CLOSURE AND GLOBAL PROJECT AUDIT REPORT

> **Objective**: Formal closure of the experimental volatility branch (CP17–CP28). Complete isolation of experimental backtest modules from production code. Restoration of clean project state prepared for the core milestone: **ICT Model Definition, Validation, and TradeSea Product Integration**.

---

## A. ESTADO DE PRODUCCIÓN (PRODUCTION STATE)

The production ICT engine operates with **zero dependency** on experimental volatility modules.

- **Active ICT Detector**: `ICTEngine` (Orchestrates `SwingDetector`, `StructureEngine`, `LiquidityEngine`, `FVGEngine`, `OrderBlockEngine`, `PremiumDiscountEngine`, `DisplacementEngine`).
- **Active Detector Modified**: **NO**
- **Active Parameters Modified**: **NO**
- **Active ICT Models**: Market Structure Breaks (BOS/MSS), Liquidity Sweeps (BSL/SSL), Fair Value Gaps (FVG), Order Blocks (OB), Dealing Range & Premium/Discount arrays.
- **Production Volatility Logic**: None required in active detection pipelines. Production detects structural price action deterministically without volatility filtering.
- **MedianTR Production Status**: `PRODUCTION = OFF` (Strictly disabled and isolated inside `core/ict/backtest`).

---

## B. ESTADO EXPERIMENTAL (EXPERIMENTAL STATE)

All experimental volatility modules, backtest runners, datasets, and threshold filters are strictly isolated within `core/ict/backtest` and `tests/`. They cannot be accessed or triggered by the production runtime pipeline.

| Component | Architecture Role | Scope | Production Accessible? | Status |
| :--- | :--- | :--- | :--- | :--- |
| **`RollingMeanTR`** | Arithmetic TR Estimator | Backtest Benchmark | **NO** | Experimental / Historical |
| **`MedianTR10`** | 10-bar Median TR Estimator | Backtest Shadow | **NO** | Experimental / Historical |
| **`MedianTR14`** | 14-bar Median TR Estimator | Backtest Shadow | **NO** | Experimental / Historical |
| **`MedianTR20`** | 20-bar Median TR Estimator | Backtest Shadow | **NO** | Experimental / Historical |
| **`VolatilityShadowEvaluator`** | Volatility Measurement | Backtest Shadow | **NO** | Experimental / Historical |
| **`PURE_SHADOW`** | Observation Mode (`threshold = 0`) | Backtest Protocol | **NO** | Isolated / Validated |
| **`FILTERED_EXPERIMENT`** | Qualification Filter Mode | Backtest Protocol | **NO** | Isolated / Validated |
| **Qualification Threshold `0.8`** | Experimental Filter Ratio | Backtest Protocol | **NO** | Frozen / Historical |

---

## C. EVIDENCIA CONFIRMADA CP17–CP28 (CP17–CP28 CONFIRMED EVIDENCE)

1. **CP17–CP20 (Robust Volatility Architecture & Execution Engine)**:
   - Robust median-based volatility estimators (`MedianTR10/14/20`) and deterministic execution simulation (`ExecutionSimulator`) were built, decoupled, and isolated.
2. **CP21–CP23 (Causality Forensic Audit & Protocol Separation)**:
   - Forensic investigation proved that raw volatility observation in `PURE_SHADOW` mode (`threshold = 0`) produces **0% outcome divergence** across all estimators.
   - All outcome differences observed in CP21 stemmed strictly from the experimental qualification filter (`Risk / Volatility >= 0.8`), which suppressed trades when arithmetic mean TR inflated during post-shock periods.
3. **CP24–CP27 (Multi-Timeframe Regime & Boundary Convergence Audit)**:
   - Multi-timeframe evaluation across 600 scenarios demonstrated that `RollingMeanTR` memory inflation causes baseline rejections during active shock and post-shock bars.
   - Near-threshold audit (`0.795 <= ratio <= 0.805`) confirmed 16 natural near-threshold cases and 8 exact `ratio == 0.8` cases. All exact equality cases evaluated cleanly to `eligible = true` with zero floating-point rounding anomalies.
4. **CP28 (Exact Transition Matrix Audit)**:
   - Reconciled exact pairwise state transitions across 600 frozen CP27 scenarios:
     - `Baseline -> MedianTR10`: 128 REJECTED -> ELIGIBLE, 0 ELIGIBLE -> REJECTED.
     - `Baseline -> MedianTR14`: 134 REJECTED -> ELIGIBLE, 0 ELIGIBLE -> REJECTED.
     - `Baseline -> MedianTR20`: 142 REJECTED -> ELIGIBLE, 0 ELIGIBLE -> REJECTED.
     - `MedianTR10 -> MedianTR14`: 6 REJECTED -> ELIGIBLE, 0 ELIGIBLE -> REJECTED.
     - `MedianTR14 -> MedianTR20`: 8 REJECTED -> ELIGIBLE, 0 ELIGIBLE -> REJECTED.
     - `MedianTR10 -> MedianTR20`: 14 REJECTED -> ELIGIBLE, 0 ELIGIBLE -> REJECTED.
   - **Descriptive Finding**: Robust median estimators monotonically retain trades in shock/post-shock environments without invalidating baseline-approved setups. `PURE_SHADOW` maintains 100% outcome invariance.

---

## D. DECISIONES FORMALES (FORMAL DECISIONS)

1. **Producción**: Remains strictly focused on core ICT market structure concepts (BOS/MSS, FVG, OB, Liquidity, Displacement, Dealing Range). Volatility filters are **NOT** enabled in production.
2. **Infraestructura Experimental**: `core/ict/backtest/` (`ExecutionSimulator`, `CP21Runner`, dataset generators) is retained purely as historical benchmark infrastructure for reproducibility.
3. **Frontera de Configuración**: `DEFAULT_ICT_CONFIG` contains zero references to `qualificationThresholdRatio`, `ProtocolMode`, or `MedianTR`.
4. **No Utilizar en Producción**: `FILTERED_EXPERIMENT` protocol, `0.8` threshold ratio, and `MedianTR` production enablement are explicitly prohibited from production runtime integration.

---

## E. RIESGOS PENDIENTES (PENDING RISKS)

- **Riesgo 0**: Zero pending architectural risks. All 24 unit test suites (224 total tests) and TypeScript production build pass cleanly.

---

## F. PRÓXIMA FASE (NEXT PHASE)

The project formally exits the experimental volatility research branch and transitions directly to:

> **ICT MODEL DEFINITION / MODEL VALIDATION / PRODUCT INTEGRATION**

Focusing on:
1. Finalizing ICT visual indicator rendering and TradeSea HUD overlays.
2. Validating end-to-end real-time setup detection on NQ/MNQ live streams.
3. User interaction, visual feedback, and TradeSea extension integration.

---

```markdown
CHECKPOINT 29 STATUS

Experimental branch closed: YES
Production detector modified: NO
Production parameters modified: NO
MedianTR production enabled: NO
RollingMeanTR production status: OFF
MedianTR10 status: EXPERIMENTAL_ISOLATED
MedianTR14 status: EXPERIMENTAL_ISOLATED
MedianTR20 status: EXPERIMENTAL_ISOLATED
PURE_SHADOW isolated: YES
FILTERED_EXPERIMENT isolated: YES
Qualification threshold 0.8 production-accessible: NO
Production regression: PASS
Event invariance: PASS
BaseScenario invariance: PASS
Pure Shadow outcome invariance: PASS
Batch/Replay equivalence: PASS
Future injection: PASS
Context reset: PASS
Immutability: PASS
Configuration isolation: PASS
Performance smoke test: PASS
Audit trail: PASS
CP17–CP28 documentation: PASS
New tests: 13/13 PASS
Total tests: 224/224 PASS
Build: PASS
Critical regressions: NONE
Production ready for next phase: YES
Final model change: NONE
```

`FINAL MODEL CHANGE: NONE`  
`PRODUCTION READY FOR NEXT PHASE: YES`
