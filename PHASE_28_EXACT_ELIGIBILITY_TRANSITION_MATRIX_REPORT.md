# PHASE 28 — EXACT ELIGIBILITY TRANSITION MATRIX AUDIT REPORT

> **Protocol Mode**: `FILTERED_EXPERIMENT` / `PURE_SHADOW`  
> **Qualification Threshold Ratio**: `0.8` (FROZEN)  
> **Dataset Hash**: `HASH-CP27-3AF23381-FROZEN` (VERIFIED & UNTOUCHED)  
> **Production Status**: `MedianTR PRODUCTION = OFF`  
> **Scope Constraints**: Zero active detector changes, zero active parameter modifications, zero dataset modifications, zero synthetic scenario manipulation.

---

## 1. DATASET HASH VERIFICATION

Audit conducted exclusively on frozen dataset `DATASET-CP27-ISOLATED-01`.

- **Dataset Hash Expected**: `HASH-CP27-3AF23381-FROZEN`
- **Dataset Hash Actual**: `HASH-CP27-3AF23381-FROZEN`
- **Hash Integrity Verification**: **PASS (100% INVARIANT)**
- **Total Scenarios Evaluated**: 600

---

## 2. TOTAL CLASSIFICATION COUNTS

Under `FILTERED_EXPERIMENT` (`qualificationThresholdRatio = 0.8`):

| Volatility Estimator | Eligible Count | Eligible % | Filter Rejected Count | Filter Rejected % | Total Scenarios |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Baseline (`RollingMeanTR`)** | 360 | 60.0% | 240 | 40.0% | 600 |
| **Robust 10 (`MedianTR10`)** | 488 | 81.3% | 112 | 18.7% | 600 |
| **Robust 14 (`MedianTR14`)** | 494 | 82.3% | 106 | 17.7% | 600 |
| **Robust 20 (`MedianTR20`)** | 502 | 83.7% | 98 | 16.3% | 600 |

---

## 3. PAIRWISE TRANSITION MATRIX: BASELINE VS ROBUST 10 (`MedianTR10`)

| Baseline State | Robust 10 State | Scenario Count | Percentage of Total |
| :--- | :--- | :--- | :--- |
| **ELIGIBLE** | **ELIGIBLE** | 360 | 60.0% |
| **ELIGIBLE** | **REJECTED** | 0 | 0.0% |
| **REJECTED** | **ELIGIBLE** | 128 | 21.3% |
| **REJECTED** | **REJECTED** | 112 | 18.7% |
| **TOTAL** | | **600** | **100.0%** |

---

## 4. PAIRWISE TRANSITION MATRIX: BASELINE VS ROBUST 14 (`MedianTR14`)

| Baseline State | Robust 14 State | Scenario Count | Percentage of Total |
| :--- | :--- | :--- | :--- |
| **ELIGIBLE** | **ELIGIBLE** | 360 | 60.0% |
| **ELIGIBLE** | **REJECTED** | 0 | 0.0% |
| **REJECTED** | **ELIGIBLE** | 134 | 22.3% |
| **REJECTED** | **REJECTED** | 106 | 17.7% |
| **TOTAL** | | **600** | **100.0%** |

---

## 5. PAIRWISE TRANSITION MATRIX: BASELINE VS ROBUST 20 (`MedianTR20`)

| Baseline State | Robust 20 State | Scenario Count | Percentage of Total |
| :--- | :--- | :--- | :--- |
| **ELIGIBLE** | **ELIGIBLE** | 360 | 60.0% |
| **ELIGIBLE** | **REJECTED** | 0 | 0.0% |
| **REJECTED** | **ELIGIBLE** | 142 | 23.7% |
| **REJECTED** | **REJECTED** | 98 | 16.3% |
| **TOTAL** | | **600** | **100.0%** |

---

## 6. PAIRWISE TRANSITION MATRIX: ROBUST 10 VS ROBUST 14

| Robust 10 State | Robust 14 State | Scenario Count | Percentage of Total |
| :--- | :--- | :--- | :--- |
| **ELIGIBLE** | **ELIGIBLE** | 488 | 81.3% |
| **ELIGIBLE** | **REJECTED** | 0 | 0.0% |
| **REJECTED** | **ELIGIBLE** | 6 | 1.0% |
| **REJECTED** | **REJECTED** | 106 | 17.7% |
| **TOTAL** | | **600** | **100.0%** |

---

## 7. PAIRWISE TRANSITION MATRIX: ROBUST 14 VS ROBUST 20

| Robust 14 State | Robust 20 State | Scenario Count | Percentage of Total |
| :--- | :--- | :--- | :--- |
| **ELIGIBLE** | **ELIGIBLE** | 494 | 82.3% |
| **ELIGIBLE** | **REJECTED** | 0 | 0.0% |
| **REJECTED** | **ELIGIBLE** | 8 | 1.3% |
| **REJECTED** | **REJECTED** | 98 | 16.3% |
| **TOTAL** | | **600** | **100.0%** |

---

## 8. PAIRWISE TRANSITION MATRIX: ROBUST 10 VS ROBUST 20

| Robust 10 State | Robust 20 State | Scenario Count | Percentage of Total |
| :--- | :--- | :--- | :--- |
| **ELIGIBLE** | **ELIGIBLE** | 488 | 81.3% |
| **ELIGIBLE** | **REJECTED** | 0 | 0.0% |
| **REJECTED** | **ELIGIBLE** | 14 | 2.3% |
| **REJECTED** | **REJECTED** | 98 | 16.3% |
| **TOTAL** | | **600** | **100.0%** |

---

## 9. THE 14 DIVERGENT SCENARIOS (`MedianTR10 != MedianTR20`)

The 14 scenarios where `MedianTR10` and `MedianTR20` produce different eligibility decisions:

| scenarioId | eventId | symbol | timeframe | eventType | regime | M10 TR | M10 ratio | M10 elig | M14 TR | M14 ratio | M14 elig | M20 TR | M20 ratio | M20 elig |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `CP27-SCEN-MNQ-1m-MSS-0022` | `EVT-MNQ-1m-1777592400000` | MNQ | 1m | MSS | ELEVATED | 7.63 | 0.7566 | false | 7.32 | 0.7885 | false | 7.01 | 0.8228 | true |
| `CP27-SCEN-MNQ-1m-MSS-0026` | `EVT-MNQ-1m-1777606800000` | MNQ | 1m | MSS | ELEVATED | 7.63 | 0.7992 | false | 7.32 | 0.8329 | true | 7.01 | 0.8692 | true |
| `CP27-SCEN-MNQ-5m-MSS-0102` | `EVT-MNQ-5m-1777880400000` | MNQ | 5m | MSS | ELEVATED | 7.63 | 0.7459 | false | 7.32 | 0.7774 | false | 7.01 | 0.8112 | true |
| `CP27-SCEN-MNQ-5m-MSS-0106` | `EVT-MNQ-5m-1777894800000` | MNQ | 5m | MSS | ELEVATED | 7.63 | 0.7885 | false | 7.32 | 0.8218 | true | 7.01 | 0.8576 | true |
| `CP27-SCEN-MNQ-5m-MSS-0186` | `EVT-MNQ-5m-1778182800000` | MNQ | 5m | MSS | ELEVATED | 7.63 | 0.7779 | false | 7.32 | 0.8107 | true | 7.01 | 0.8460 | true |
| `CP27-SCEN-MNQ-15m-MSS-0266` | `EVT-MNQ-15m-1778470800000` | MNQ | 15m | MSS | ELEVATED | 7.63 | 0.7672 | false | 7.32 | 0.7996 | false | 7.01 | 0.8344 | true |
| `CP27-SCEN-MNQ-15m-BOS-0273` | `EVT-MNQ-15m-1778496000000` | MNQ | 15m | BOS | NORMAL | 6.25 | 0.7900 | false | 6.20 | 0.7964 | false | 6.15 | 0.8028 | true |
| `CP27-SCEN-NQ-1m-MSS-0346` | `EVT-NQ-1m-1778758800000` | NQ | 1m | MSS | ELEVATED | 30.50 | 0.7566 | false | 29.26 | 0.7885 | false | 28.04 | 0.8228 | true |
| `CP27-SCEN-NQ-1m-MSS-0350` | `EVT-NQ-1m-1778773200000` | NQ | 1m | MSS | ELEVATED | 30.50 | 0.7992 | false | 29.26 | 0.8329 | true | 28.04 | 0.8692 | true |
| `CP27-SCEN-NQ-5m-MSS-0426` | `EVT-NQ-5m-1779046800000` | NQ | 5m | MSS | ELEVATED | 30.50 | 0.7459 | false | 29.26 | 0.7774 | false | 28.04 | 0.8112 | true |
| `CP27-SCEN-NQ-5m-MSS-0430` | `EVT-NQ-5m-1779061200000` | NQ | 5m | MSS | ELEVATED | 30.50 | 0.7885 | false | 29.26 | 0.8218 | true | 28.04 | 0.8576 | true |
| `CP27-SCEN-NQ-15m-MSS-0510` | `EVT-NQ-15m-1779349200000` | NQ | 15m | MSS | ELEVATED | 30.50 | 0.7779 | false | 29.26 | 0.8107 | true | 28.04 | 0.8460 | true |
| `CP27-SCEN-NQ-15m-MSS-0590` | `EVT-NQ-15m-1779637200000` | NQ | 15m | MSS | ELEVATED | 30.50 | 0.7672 | false | 29.26 | 0.7996 | false | 28.04 | 0.8344 | true |
| `CP27-SCEN-NQ-15m-BOS-0597` | `EVT-NQ-15m-1779662400000` | NQ | 15m | BOS | NORMAL | 25.00 | 0.7900 | false | 24.80 | 0.7964 | false | 24.60 | 0.8028 | true |

---

## 10. RECONCILIATION OF THE 134 BASELINE VS ROBUST DIVERGENCES

The figure of 134 reported in CP27 represents **specifically** the count of scenarios where:
`BASELINE = FILTER_REJECTED` AND `ROBUST_14 = ELIGIBLE`.

### Exact Breakdown Across All Estimator Pairs

| Estimator Pair | `REJECTED -> ELIGIBLE` | `ELIGIBLE -> REJECTED` | Net Difference |
| :--- | :--- | :--- | :--- |
| **BASELINE vs ROBUST_10** | **128** | **0** | +128 |
| **BASELINE vs ROBUST_14** | **134** | **0** | +134 |
| **BASELINE vs ROBUST_20** | **142** | **0** | +142 |
| **ROBUST_10 vs ROBUST_14** | **6** | **0** | +6 |
| **ROBUST_14 vs ROBUST_20** | **8** | **0** | +8 |
| **ROBUST_10 vs ROBUST_20** | **14** | **0** | +14 |

---

## 11. DIVERGENCE DIRECTIONALITY AUDIT

Across all 6 pairwise estimator comparisons, **`ELIGIBLE -> REJECTED` IS EXACTLY 0**.

- `BASELINE ELIGIBLE -> ROBUST_10 REJECTED`: **0**
- `BASELINE ELIGIBLE -> ROBUST_14 REJECTED`: **0**
- `BASELINE ELIGIBLE -> ROBUST_20 REJECTED`: **0**
- `ROBUST_10 ELIGIBLE -> ROBUST_14 REJECTED`: **0**
- `ROBUST_14 ELIGIBLE -> ROBUST_20 REJECTED`: **0**
- `ROBUST_10 ELIGIBLE -> ROBUST_20 REJECTED`: **0**

### Mathematical Cause
`RollingMeanTR` (Baseline) incorporates extreme True Range spikes into its window, inflating volatility and depressing the `Risk / Volatility` ratio. Median estimators filtering out outlier spikes produce lower volatility estimates, increasing the ratio. Consequently, robust estimators monotonically expand the set of eligible trades in high-volatility/post-shock environments without disqualifying any trade that passed baseline.

---

## 12. MARGEN AUDIT

For the 134 `BASELINE REJECTED -> ROBUST_14 ELIGIBLE` divergences:

- Divergences occurring inside near-threshold region (`0.795 <= ratio <= 0.805`): **0 scenarios**
- Divergences occurring outside near-threshold region: **134 scenarios**

### Conclusion on Margin
The 134 baseline-to-robust divergences are not fragile boundary artifacts near 0.8. They are structural shifts driven by shock-memory inflation in arithmetic mean TR.

---

## 13. SHOCK & POST-SHOCK TRANSITION BREAKDOWN

| Regime | Total Scenarios | `BASELINE REJECTED -> ROBUST_14 ELIGIBLE` | `ROBUST_10 -> ROBUST_20 DIVERGENCES` |
| :--- | :--- | :--- | :--- |
| **NORMAL** | 150 | 0 (0.0%) | 2 |
| **ELEVATED** | 150 | 14 (9.3%) | 12 |
| **SHOCK** | 150 | 60 (40.0%) | 0 |
| **POST-SHOCK** | 150 | 60 (40.0%) | 0 |

### Breakdown by Bars From Shock (`barsFromShock`)

| Shock / Post-Shock Group | Total Scenarios | `BASELINE REJECTED -> ROBUST_14 ELIGIBLE` |
| :--- | :--- | :--- |
| **1 – 5 bars (SHOCK)** | 150 | 60 (40.0%) |
| **6 – 10 bars (POST-SHOCK early)** | 60 | 26 (43.3%) |
| **11+ bars (POST-SHOCK late)** | 90 | 34 (37.8%) |

---

## 14. BOS VS MSS TRANSITION BREAKDOWN

| Event Type | Total Scenarios | `BASELINE REJECTED -> ROBUST_14 ELIGIBLE` | `ROBUST_10 -> ROBUST_20 DIVERGENCES` |
| :--- | :--- | :--- | :--- |
| **BOS** | 300 | 60 (20.0%) | 2 |
| **MSS** | 300 | 74 (24.7%) | 12 |

---

## 15. TIMEFRAME TRANSITION BREAKDOWN

Exact denominators: 100 scenarios per Symbol/Timeframe pair.

| Symbol / Timeframe | Total | `BASELINE REJECTED -> ROBUST_14 ELIGIBLE` | `ROBUST_10 -> ROBUST_20 DIVERGENCES` |
| :--- | :--- | :--- | :--- |
| **MNQ 1m** | 100 | 26 (26.0%) | 2 |
| **MNQ 5m** | 100 | 25 (25.0%) | 3 |
| **MNQ 15m** | 100 | 16 (16.0%) | 2 |
| **NQ 1m** | 100 | 16 (16.0%) | 2 |
| **NQ 5m** | 100 | 25 (25.0%) | 2 |
| **NQ 15m** | 100 | 26 (26.0%) | 3 |
| **TOTAL** | **600** | **134 (22.3%)** | **14 (2.3%)** |

---

## 16. NEAR-THRESHOLD DIVERGENCE ANALYSIS

- Total near-threshold scenarios (`0.795 <= ratio <= 0.805`): **16 scenarios**
- Divergences among robust estimators (`M10 != M20`) within near-threshold region: **6 scenarios**
- Divergences among robust estimators (`M10 != M20`) outside near-threshold region: **8 scenarios**

---

## 17. PURE SHADOW CONTROL INVARIANCE

Under `PURE_SHADOW` (`qualificationThresholdRatio = 0`), execution traces across all 600 scenarios remain **100% identical**:

- **Baseline Outcome**: 200 TARGET, 400 STOP
- **Robust 10 Outcome**: 200 TARGET, 400 STOP
- **Robust 14 Outcome**: 200 TARGET, 400 STOP
- **Robust 20 Outcome**: 200 TARGET, 400 STOP
- **Pure Shadow Outcome Difference**: **0 (NONE)**

---

## 18. DETECTION INVARIANCE

All detection parameters (`eventId`, `eventTimestamp`, `confirmationTimestamp`, `eventType`, `detectionSnapshot`, `BaseScenario`) remain 100% invariant across all transition evaluations.

---

## 19. REPRODUCIBILITY

- **2-Pass Transition Matrix Calculation**: Pass 1 == Pass 2 (100% Identical)
- **Dataset Modification**: Zero files modified. Dataset hash verified before and after audit.

---

## 20. LIMITATIONS

1. **Frozen Dataset**: Audit is constrained to `DATASET-CP27-ISOLATED-01` (`HASH-CP27-3AF23381-FROZEN`).
2. **Descriptive Audit**: The matrices document exact mathematical transitions; they do not recommend changing active production code or selecting optimal parameters.

---

```markdown
CHECKPOINT 28 STATUS

CP27 hash verified: PASS
Dataset modified: NO
Qualification threshold: 0.8
Active detector modified: NO
Active parameters modified: NO
MedianTR production enabled: NO
Baseline/M10 matrix: PASS
Baseline/M14 matrix: PASS
Baseline/M20 matrix: PASS
M10/M14 matrix: PASS
M14/M20 matrix: PASS
M10/M20 matrix: PASS
Divergence accounting: PASS
134-case reconciliation: PASS
Near-threshold analysis: PASS
Shock/Post-Shock analysis: PASS
BOS/MSS analysis: PASS
Multi-timeframe analysis: PASS
Pure Shadow outcome difference: NO
Detection invariance: PASS
Reproducibility: PASS
Audit trail: PASS
Tests: 211/211 PASS
Build: PASS

BASELINE REJECTED: 240
ROBUST_10 REJECTED: 112
ROBUST_14 REJECTED: 106
ROBUST_20 REJECTED: 98

BASELINE → ROBUST_10: 128 REJECTED → ELIGIBLE, 0 ELIGIBLE → REJECTED
BASELINE → ROBUST_14: 134 REJECTED → ELIGIBLE, 0 ELIGIBLE → REJECTED
BASELINE → ROBUST_20: 142 REJECTED → ELIGIBLE, 0 ELIGIBLE → REJECTED

ROBUST_10 → ROBUST_14: 6 REJECTED → ELIGIBLE, 0 ELIGIBLE → REJECTED
ROBUST_14 → ROBUST_20: 8 REJECTED → ELIGIBLE, 0 ELIGIBLE → REJECTED
ROBUST_10 → ROBUST_20: 14 REJECTED → ELIGIBLE, 0 ELIGIBLE → REJECTED

EXACT DIVERGENCE COUNTS: PASS

FINAL MODEL CHANGE: NONE
```
