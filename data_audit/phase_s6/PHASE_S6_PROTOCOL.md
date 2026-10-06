# Phase S6 Protocol — ICT Signal Execution Sensitivity & Friction Evaluation

## 1. Executive Protocol Summary

Phase S6 evaluates the economic sensitivity and friction robustness of the frozen ICT candidate signals (`LONG_CANDIDATE`, `SHORT_CANDIDATE`) using the deterministic S5 strategy specification across three predefined transaction cost scenarios (`LOW_FRICTION`, `BASE_FRICTION`, `HIGH_FRICTION`).

* **Status**: PASS_WITH_BOUNDED_SCOPE
* **Baseline Commit**: `57acd4c42e18f234c5dbfa64ba5ba4e45bf59cb5a`
* **Upstream Status**: Phase S5 PASS_WITH_BOUNDED_SCOPE
* **Primary Scope**: Hypothetical historical execution simulation. Zero parameter optimization, zero post-hoc selection, zero live trading claims.

---

## 2. Immutable Constraints & Frozen Boundaries

The following components remain strictly frozen:

1. **Production ICT Engine** (`core/ict/`) — 0 lines modified.
2. **Parameters**: `bodyRatio = 0.60`, `minBodyToRangeRatio = 0.60`, `rangeMultiplier = 1.50`, `minRangeMultiplier = 1.50`, `fvgMinSizePoints = 0.25`, `lookbackCandles = 5`, `requireStructuralBreak = false`, `requireFvgCreation = false`.
3. **Upstream Artifacts**: S1, S2, S3, S4, S4.1, S5.

---

## 3. Predefined Cost Scenarios

| Scenario | Symbol | Round-Turn Commission (USD) | Spread (Ticks) | Slippage (Ticks) | Friction Points | Total Friction (USD) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **LOW_FRICTION** | MNQ | $1.24 | 0.5 | 0.5 | 0.50 pt | $2.24 |
| **BASE_FRICTION** | MNQ | $1.24 | 1.0 | 1.0 | 1.00 pt | $3.24 |
| **HIGH_FRICTION** | MNQ | $2.00 | 2.0 | 2.0 | 2.00 pt | $6.00 |
| **LOW_FRICTION** | NQ | $4.10 | 0.5 | 0.5 | 0.50 pt | $14.10 |
| **BASE_FRICTION** | NQ | $4.10 | 1.0 | 1.0 | 1.00 pt | $24.10 |
| **HIGH_FRICTION** | NQ | $5.00 | 2.0 | 2.0 | 2.00 pt | $45.00 |

---

## 4. Execution Simulation Methodology

Every candidate signal ($N=967$) is evaluated through the deterministic S5 single-position state engine. Overlapping signals ($N=48$) are skipped per the first-confirmed priority rule, yielding $N=919$ executed hypothetical trades.

Gross moves and net moves after friction are recorded independently for every cell in the sensitivity matrix (3 Entry Rules $\times$ 8 Exit Rules $\times$ 3 Friction Scenarios).

---

## 5. Verification & Invariants

```text
ICT_PRODUCTION_LOGIC_MODIFIED = NO
PARAMETERS_MODIFIED = NO
MODELS_MODIFIED = NO

S1_DATASET_MUTATION = NO
S2_DATASET_MUTATION = NO
S3_PROTOCOL_MUTATION = NO
S4_RESULT_MUTATION = NO
S4_1_RESULT_MUTATION = NO
S5_SPECIFICATION_MUTATION = NO

ENTRY_SELECTION_AFTER_RESULTS = NO
EXIT_SELECTION_AFTER_RESULTS = NO
COST_SELECTION_AFTER_RESULTS = NO
MODEL_SELECTION_AFTER_RESULTS = NO
DIRECTION_SELECTION_AFTER_RESULTS = NO
TIMEFRAME_SELECTION_AFTER_RESULTS = NO
SYMBOL_SELECTION_AFTER_RESULTS = NO

LOOKAHEAD_VIOLATIONS = 0
IDENTITY_VIOLATIONS = 0
PROVENANCE_VIOLATIONS = 0
DETERMINISM_VIOLATIONS = 0
DATA_SNOOPING_VIOLATIONS = 0
```
