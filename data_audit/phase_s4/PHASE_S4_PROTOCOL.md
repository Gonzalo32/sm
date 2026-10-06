# Phase S4 — Predictive Model Execution & Robustness Protocol Specification

## 1. OBJECTIVE & EXECUTIVE SCOPE
Execute the frozen Phase S3 predictive evaluation protocol on the expanded analytical population of 967 historical market observations across symbols (`MNQ`, `NQ`) and timeframes (`1m`, `5m`, `15m`), evaluating directional excursion behavior against the unconditional matched-timestamp baseline while enforcing zero logic tuning or parameter optimization.

---

## 2. EXCURSION & CLASSIFICATION FORMULAS
- **Reference Price ($P_{ref}$)**: Candle close price at `confirmationTimestamp`.
- **Directional Move Formulas**:
  - `LONG`: $\text{MFE} = \max(P_{high} - P_{ref}, 0)$, $\text{MAE} = \max(P_{ref} - P_{low}, 0)$, $\Delta P = P_{end} - P_{ref}$.
  - `SHORT`: $\text{MFE} = \max(P_{ref} - P_{low}, 0)$, $\text{MAE} = \max(P_{high} - P_{ref}, 0)$, $\Delta P = P_{ref} - P_{end}$.
- **Noise Threshold**: $\text{NEUTRAL\_THRESHOLD} = 0.50 \text{ points}$.

---

## 3. STATISTICAL EVALUATION & SENSITIVITY METHODOLOGY
- **Primary Statistical Tests**: Two-sample t-test and Mann-Whitney U test with Bonferroni-Holm multiple comparison adjustments.
- **Session Clustering**: Clustered standard errors grouped by trading session (`CLUSTERED_STANDARD_ERRORS_BY_SESSION`).
- **Overlap Handling**: Retains all legitimate candidate signals while flagging overlapping groups (`RETAIN_ALL_WITH_SENSITIVITY_CLUSTER_FLAGGING`).
- **Data Snooping Audit**: Strictly verifies zero post-hoc parameter tuning, zero model selection bias, and zero removal of poor signals (`DATA_SNOOPING_VIOLATIONS = 0`).
