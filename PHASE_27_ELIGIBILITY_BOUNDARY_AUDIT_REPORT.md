# PHASE 27 — ELIGIBILITY BOUNDARY AND NEAR-THRESHOLD AUDIT REPORT

> **Protocol Mode**: `FILTERED_EXPERIMENT` / `PURE_SHADOW`  
> **Qualification Threshold Ratio**: `0.8` (FROZEN)  
> **Production Status**: `MedianTR PRODUCTION = OFF`  
> **Scope Constraints**: Zero active detector changes, zero active parameter modifications, zero base scenario alterations, zero synthetic case manipulation.

---

## 1. DATASET & FREEZE HASH

A brand-new, independent, multi-timeframe dataset was generated specifically to perform a controlled audit of scenarios around the qualification boundary (`Risk / Volatility = 0.8`). The dataset consists of natural market structure scenarios generated deterministically without post-hoc selection or artificial parameter tuning.

- **Dataset Identifier**: `DATASET-CP27-ISOLATED-01`
- **Dataset Hash**: `HASH-CP27-3AF23381-FROZEN`
- **Total Scenarios**: 600
- **Creation Timestamp**: May 1, 2026 (1777516800000)
- **Data Integrity**: Pre-registered and frozen prior to audit execution. Zero synthetic scenario modification.

---

## 2. DATASET DISTRIBUTION

| Dimension | Category | Scenario Count | Percentage |
| :--- | :--- | :--- | :--- |
| **Instrument** | MNQ | 300 | 50.0% |
| | NQ | 300 | 50.0% |
| **Timeframe** | 1m | 200 | 33.3% |
| | 5m | 200 | 33.3% |
| | 15m | 200 | 33.3% |
| **Event Type** | BOS | 300 | 50.0% |
| | MSS | 300 | 50.0% |
| **Regime** | NORMAL | 150 | 25.0% |
| | ELEVATED | 150 | 25.0% |
| | SHOCK | 150 | 25.0% |
| | POST-SHOCK | 150 | 25.0% |
| **Split** | EXPLORATION | 120 | 20.0% |
| | SELECTION | 240 | 40.0% |
| | HOLDOUT | 240 | 40.0% |

---

## 3. PROXIMITY BANDS DISTRIBUTION

Proximity bands measure the descriptive distribution of the `Risk / Volatility` ratio across all four volatility estimators relative to the `0.8` threshold. These bands are purely descriptive and do not constitute new qualification thresholds.

| Proximity Band | Baseline (`RollingMeanTR`) | Robust 10 (`MedianTR10`) | Robust 14 (`MedianTR14`) | Robust 20 (`MedianTR20`) |
| :--- | :--- | :--- | :--- | :--- |
| **< 0.75** | 200 | 92 | 86 | 78 |
| **0.75 – 0.77** | 18 | 8 | 8 | 8 |
| **0.77 – 0.79** | 16 | 8 | 8 | 8 |
| **0.79 – 0.80** | 6 | 4 | 4 | 4 |
| **0.80 – 0.81** | 9 | 4 | 2 | 2 |
| **0.81 – 0.83** | 16 | 6 | 8 | 8 |
| **0.83 – 0.85** | 13 | 7 | 7 | 7 |
| **> 0.85** | 322 | 471 | 477 | 485 |
| **TOTAL** | **600** | **600** | **600** | **600** |

---

## 4. COMPLETE NEAR-THRESHOLD SCENARIOS TABLE (`0.795 <= ratio <= 0.805`)

A total of **16 natural scenarios** fell inside the near-threshold boundary region (`0.795 <= ratio <= 0.805`) for at least one volatility estimator:

| scenarioId | symbol | timeframe | eventType | regime | risk | Baseline TR | Base ratio | Base margin | Base elig | M10 TR | M10 ratio | M10 margin | M10 elig | M14 TR | M14 ratio | M14 margin | M14 elig | M20 TR | M20 ratio | M20 margin | M20 elig |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `CP27-SCEN-MNQ-1m-MSS-0026` | MNQ | 1m | MSS | ELEVATED | 6.09 | 8.13 | 0.7500 | -0.0500 | false | 7.63 | 0.7992 | -0.0008 | false | 7.32 | 0.8329 | 0.0329 | true | 7.01 | 0.8692 | 0.0692 | true |
| `CP27-SCEN-MNQ-1m-BOS-0031` | MNQ | 1m | BOS | SHOCK | 12.50 | 15.63 | 0.8000 | 0.0000 | true | 8.75 | 1.4286 | 0.6286 | true | 8.06 | 1.5509 | 0.7509 | true | 7.50 | 1.6660 | 0.8660 | true |
| `CP27-SCEN-MNQ-5m-MSS-0112` | MNQ | 5m | MSS | POST-SHOCK | 9.25 | 11.56 | 0.8000 | 0.0000 | true | 6.75 | 1.3704 | 0.5704 | true | 6.32 | 1.4627 | 0.6627 | true | 6.03 | 1.5348 | 0.7348 | true |
| `CP27-SCEN-MNQ-5m-MSS-0182` | MNQ | 5m | MSS | ELEVATED | 5.61 | 8.13 | 0.6900 | -0.1100 | false | 7.63 | 0.7352 | -0.0648 | false | 7.32 | 0.7663 | -0.0337 | false | 7.01 | 0.7996 | -0.0004 | false |
| `CP27-SCEN-MNQ-5m-BOS-0193` | MNQ | 5m | BOS | NORMAL | 5.00 | 6.25 | 0.8000 | 0.0000 | true | 6.25 | 0.8000 | 0.0000 | true | 6.20 | 0.8065 | 0.0065 | true | 6.15 | 0.8130 | 0.0130 | true |
| `CP27-SCEN-MNQ-15m-MSS-0266` | MNQ | 15m | MSS | ELEVATED | 5.85 | 8.13 | 0.7200 | -0.0800 | false | 7.63 | 0.7672 | -0.0328 | false | 7.32 | 0.7996 | -0.0004 | false | 7.01 | 0.8344 | 0.0344 | true |
| `CP27-SCEN-MNQ-15m-BOS-0273` | MNQ | 15m | BOS | NORMAL | 4.94 | 6.25 | 0.7900 | -0.0100 | false | 6.25 | 0.7900 | -0.0100 | false | 6.20 | 0.7964 | -0.0036 | false | 6.15 | 0.8028 | 0.0028 | true |
| `CP27-SCEN-MNQ-15m-MSS-0274` | MNQ | 15m | MSS | ELEVATED | 6.50 | 8.13 | 0.8000 | 0.0000 | true | 7.63 | 0.8525 | 0.0525 | true | 7.32 | 0.8885 | 0.0885 | true | 7.01 | 0.9271 | 0.1271 | true |
| `CP27-SCEN-NQ-1m-MSS-0350` | NQ | 1m | MSS | ELEVATED | 24.38 | 32.50 | 0.7500 | -0.0500 | false | 30.50 | 0.7992 | -0.0008 | false | 29.26 | 0.8329 | 0.0329 | true | 28.04 | 0.8692 | 0.0692 | true |
| `CP27-SCEN-NQ-1m-BOS-0355` | NQ | 1m | BOS | SHOCK | 50.00 | 62.50 | 0.8000 | 0.0000 | true | 35.00 | 1.4286 | 0.6286 | true | 32.24 | 1.5509 | 0.7509 | true | 30.01 | 1.6660 | 0.8660 | true |
| `CP27-SCEN-NQ-5m-MSS-0436` | NQ | 5m | MSS | POST-SHOCK | 37.00 | 46.25 | 0.8000 | 0.0000 | true | 27.00 | 1.3704 | 0.5704 | true | 25.30 | 1.4627 | 0.6627 | true | 24.11 | 1.5348 | 0.7348 | true |
| `CP27-SCEN-NQ-15m-MSS-0506` | NQ | 15m | MSS | ELEVATED | 22.42 | 32.50 | 0.6900 | -0.1100 | false | 30.50 | 0.7352 | -0.0648 | false | 29.26 | 0.7663 | -0.0337 | false | 28.04 | 0.7996 | -0.0004 | false |
| `CP27-SCEN-NQ-15m-BOS-0517` | NQ | 15m | BOS | NORMAL | 20.00 | 25.00 | 0.8000 | 0.0000 | true | 25.00 | 0.8000 | 0.0000 | true | 24.80 | 0.8065 | 0.0065 | true | 24.60 | 0.8130 | 0.0130 | true |
| `CP27-SCEN-NQ-15m-MSS-0590` | NQ | 15m | MSS | ELEVATED | 23.40 | 32.50 | 0.7200 | -0.0800 | false | 30.50 | 0.7672 | -0.0328 | false | 29.26 | 0.7996 | -0.0004 | false | 28.04 | 0.8344 | 0.0344 | true |
| `CP27-SCEN-NQ-15m-BOS-0597` | NQ | 15m | BOS | NORMAL | 19.75 | 25.00 | 0.7900 | -0.0100 | false | 25.00 | 0.7900 | -0.0100 | false | 24.80 | 0.7964 | -0.0036 | false | 24.60 | 0.8028 | 0.0028 | true |
| `CP27-SCEN-NQ-15m-MSS-0598` | NQ | 15m | MSS | ELEVATED | 26.00 | 32.50 | 0.8000 | 0.0000 | true | 30.50 | 0.8525 | 0.0525 | true | 29.26 | 0.8885 | 0.0885 | true | 28.04 | 0.9271 | 0.1271 | true |

---

## 5. BASELINE VS ROBUST DIVERGENCES

Under `FILTERED_EXPERIMENT` (`qualificationThresholdRatio = 0.8`):

- **BASELINE Filter Rejections**: 240 / 600 scenarios (40.0%)
- **ROBUST_10 Filter Rejections**: 112 / 600 scenarios (18.7%)
- **ROBUST_14 Filter Rejections**: 106 / 600 scenarios (17.7%)
- **ROBUST_20 Filter Rejections**: 98 / 600 scenarios (16.3%)
- **BASELINE = FILTER_REJECTED, ROBUST_14 = ELIGIBLE**: **134 scenarios**
- **BASELINE = ELIGIBLE, ROBUST_14 = FILTER_REJECTED**: **0 scenarios**

### Analysis of Asymmetry
In elevated volatility regimes and post-shock periods, `RollingMeanTR` remains inflated due to extreme outlier bars in its arithmetic averaging window. Consequently, `RollingMeanTR` produces a lower ratio (`risk / volatility`), triggering 134 filter rejections for trades that robust median estimators deem eligible. Conversely, robust median estimators filter out extreme shock outliers without holding long memory distortion, resulting in zero instances where baseline passes but robust rejects.

---

## 6. DIVERGENCES AMONG ROBUST ESTIMATORS (`MedianTR10`, `MedianTR14`, `MedianTR20`)

Comparing the three robust window lengths against each other:

- **MedianTR10 != MedianTR14 Eligibility**: **6 scenarios**
- **MedianTR14 != MedianTR20 Eligibility**: **8 scenarios**
- **MedianTR10 != MedianTR20 Eligibility**: **14 scenarios**

### Descriptive Window Distances

| Metric | Value |
| :--- | :--- |
| Average `volatility(Baseline) - volatility(MedianTR10)` | +7.6172 pts |
| Average `volatility(Baseline) - volatility(MedianTR14)` | +8.5391 pts |
| Average `volatility(Baseline) - volatility(MedianTR20)` | +9.2947 pts |
| Average `ratio(Baseline) - ratio(MedianTR10)` | -0.346509 |
| Average `ratio(Baseline) - ratio(MedianTR14)` | -0.417705 |
| Average `ratio(Baseline) - ratio(MedianTR20)` | -0.482079 |
| Average `volatility(MedianTR10) - volatility(MedianTR14)` | +0.9219 pts |
| Average `volatility(MedianTR14) - volatility(MedianTR20)` | +0.7556 pts |
| Average `volatility(MedianTR10) - volatility(MedianTR20)` | +1.6775 pts |

---

## 7. FLOATING-POINT AUDIT & EXACT THRESHOLD EQUALITY

### Floating-Point Audit Findings
1. **IEEE 754 Representation**: The float literal `0.8` is represented in standard IEEE 754 double precision as `0.800000000000000044408920985006`.
2. **Comparison Operator**: The code uses strict `>=` evaluation (`ratio >= thresholdRatio`).
3. **NaN & Infinity Audit**:
   - Total NaN values detected: **0**
   - Total Infinity values detected: **0**
   - Total accidental rounding misclassifications: **0**

### Exact Threshold Equality Rule
- Total scenarios evaluated at exactly `ratio == 0.8`: **8 scenarios**
- Implemented rule: `eligible == true` when `ratio >= 0.8`.
- Audit result: All 8 scenarios evaluated to `eligible = true` with `reason = 'ELIGIBLE_ABOVE_THRESHOLD'`. Zero classification anomalies occurred.

---

## 8. SHOCK & POST-SHOCK BREAKDOWN

| Regime | Total Scenarios | Baseline Eligible | Robust14 Eligible | Baseline Rejections | Robust14 Rejections |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **NORMAL** | 150 | 90 (60.0%) | 90 (60.0%) | 60 | 60 |
| **ELEVATED** | 150 | 90 (60.0%) | 104 (69.3%) | 60 | 46 |
| **SHOCK** | 150 | 90 (60.0%) | 150 (100.0%) | 60 | 0 |
| **POST-SHOCK** | 150 | 90 (60.0%) | 150 (100.0%) | 60 | 0 |

### Bars From Shock Analysis (`barsFromShock`)

| Shock / Post-Shock Group | Total Scenarios | Baseline Eligible | Robust14 Eligible |
| :--- | :--- | :--- | :--- |
| **1 – 5 bars (SHOCK)** | 150 | 90 (60.0%) | 150 (100.0%) |
| **6 – 10 bars (POST-SHOCK early)** | 60 | 34 (56.7%) | 60 (100.0%) |
| **11+ bars (POST-SHOCK late)** | 90 | 56 (62.2%) | 90 (100.0%) |

---

## 9. BOS VS MSS BREAKDOWN

| Event Type | Total Scenarios | Baseline Eligible | Robust14 Eligible | M10 vs M14 Divergences | M14 vs M20 Divergences |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BOS** | 300 | 180 (60.0%) | 240 (80.0%) | 0 | 2 |
| **MSS** | 300 | 180 (60.0%) | 254 (84.7%) | 6 | 6 |

---

## 10. MULTI-TIMEFRAME BREAKDOWN

Exact denominators: 100 scenarios per Symbol/Timeframe pair.

| Symbol / Timeframe | Total | Baseline Eligible | Robust10 Eligible | Robust14 Eligible | Robust20 Eligible |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **MNQ 1m** | 100 | 51 (51.0%) | 76 (76.0%) | 77 (77.0%) | 78 (78.0%) |
| **MNQ 5m** | 100 | 59 (59.0%) | 82 (82.0%) | 84 (84.0%) | 85 (85.0%) |
| **MNQ 15m** | 100 | 70 (70.0%) | 86 (86.0%) | 86 (86.0%) | 88 (88.0%) |
| **NQ 1m** | 100 | 70 (70.0%) | 85 (85.0%) | 86 (86.0%) | 87 (87.0%) |
| **NQ 5m** | 100 | 56 (56.0%) | 80 (80.0%) | 81 (81.0%) | 82 (82.0%) |
| **NQ 15m** | 100 | 54 (54.0%) | 79 (79.0%) | 80 (80.0%) | 82 (82.0%) |
| **TOTAL** | **600** | **360 (60.0%)** | **488 (81.3%)** | **494 (82.3%)** | **502 (83.7%)** |

---

## 11. PURE SHADOW CONTROL INVARIANCE

When evaluated under `PURE_SHADOW` protocol mode (`qualificationThresholdRatio = 0`), execution outcomes across all 600 scenarios were **100% identical**:

| Volatility Variant | Target Reached | Stop Reached | Timeout | Ambiguous | Outcome Divergence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BASELINE** | 200 | 400 | 0 | 0 | **BASELINE REFERENCE** |
| **ROBUST_10** | 200 | 400 | 0 | 0 | **0% (NONE)** |
| **ROBUST_14** | 200 | 400 | 0 | 0 | **0% (NONE)** |
| **ROBUST_20** | 200 | 400 | 0 | 0 | **0% (NONE)** |

---

## 12. DETECTION INVARIANCE

All detection parameters (`eventId`, `eventTimestamp`, `confirmationTimestamp`, `eventType`, `detectionSnapshot`, `BaseScenario`) remained 100% invariant across variants. The only field that varies when `qualificationThresholdRatio > 0` is `EligibilityDecision`.

---

## 13. LIMITATIONS

1. **Synthetic Deterministic Dataset**: While CP27 uses natural scenario parameters covering realistic ATRs and stop sizes across NQ/MNQ 1m/5m/15m, it is a pre-registered simulation dataset.
2. **Fixed Threshold Ratio**: `qualificationThresholdRatio` was frozen at `0.8`. No other threshold values were evaluated.
3. **No Strategy Selection**: This audit measures mathematical classification behavior around a boundary; it does not evaluate profitability or select an optimal estimator window.

---

## 14. DESCRIPTIVE CONCLUSIONS

1. **OBSERVED FACT**: 16 natural scenarios fell within the `0.795 <= ratio <= 0.805` boundary region, and 8 scenarios landed on exact `ratio == 0.8`.
2. **OBSERVED FACT**: All 8 exact `ratio == 0.8` cases evaluated cleanly to `eligible = true` without rounding artifacts.
3. **OBSERVED FACT**: Under `FILTERED_EXPERIMENT`, Baseline rejected 240 scenarios while Robust14 rejected 106 scenarios (134 classification divergences).
4. **INTERPRETATION**: The difference in filter rejections between arithmetic mean and median volatility estimators stems from memory inflation during post-shock periods rather than floating-point ambiguity around 0.8.

---

```markdown
CHECKPOINT 27 STATUS

Active detector modified: NO
Active parameters modified: NO
MedianTR production enabled: NO
New independent dataset: PASS
Dataset hash frozen: PASS
Qualification threshold: 0.8
Natural near-threshold cases: PASS
Synthetic case modification: PASS
Eligibility formula: PASS
Floating-point audit: PASS
Baseline/Robust divergences: PASS
Robust10/14/20 divergences: PASS
Shock/Post-Shock audit: PASS
BOS/MSS audit: PASS
Multi-timeframe audit: PASS
Pure Shadow outcome invariance: PASS
Detection invariance: PASS
Audit trail: PASS
Tests: 191/191 PASS
Build: PASS

CASES 0.795–0.805: 16

BASELINE FILTER REJECTIONS: 240
ROBUST_10 FILTER REJECTIONS: 112
ROBUST_14 FILTER REJECTIONS: 106
ROBUST_20 FILTER REJECTIONS: 98

BASELINE → ROBUST ELIGIBILITY DIVERGENCES: 134

ROBUST ESTIMATOR CLASSIFICATION DIVERGENCES: 14

EXACT 0.8 CASES: 8

PURE SHADOW OUTCOME DIFFERENCE: NO

FINAL MODEL CHANGE: NONE
```
