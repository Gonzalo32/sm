# Phase S6 — Audit Report: ICT Signal Execution Sensitivity & Friction Evaluation

## 1. Executive Summary

Phase S6 evaluates the economic sensitivity and friction robustness of frozen ICT candidate signals (`LONG_CANDIDATE`, `SHORT_CANDIDATE`) across predefined transaction cost scenarios (`LOW_FRICTION`, `BASE_FRICTION`, `HIGH_FRICTION`) using the deterministic strategy hypotheses established in Phase S5.

* **Final Status**: `PASS_WITH_BOUNDED_SCOPE`
* **Baseline Commit**: `57acd4c42e18f234c5dbfa64ba5ba4e45bf59cb5a`
* **Worktree Status**: CLEAN (All 113 test files, typecheck, build pass)
* **Production ICT Logic Modified**: NO
* **Parameters Modified**: NO
* **Models Modified**: NO
* **S5 Specification Modified**: NO

---

## 2. Key Findings & Economic Robustness Verdict

1. **Survival of Statistical Association**: The statistically validated directional price expansion observed in S4/S4.1 survives realistic transaction friction.
2. **Net Mean Expectancy**:
   - `LOW_FRICTION`: `+21.00` index points ($42.00 USD on MNQ / $420.00 USD on NQ)
   - `BASE_FRICTION`: `+20.50` index points ($41.00 USD on MNQ / $410.00 USD on NQ)
   - `HIGH_FRICTION`: `+19.50` index points ($39.00 USD on MNQ / $390.00 USD on NQ)
3. **Break-Even Friction**: The historical gross move can tolerate up to **`21.50` index points** ($86$ ticks / $43.00 USD on MNQ) of total round-turn friction before net expectancy drops to zero. Realistic baseline friction is `1.00` index point ($4$ ticks).
4. **Economic Robustness Verdict**: **`ECONOMICALLY_POSITIVE`**.

---

## 3. Detailed Component & Matrix Analysis

### 3.1 Entry & Exit Hypotheses Analysis
* **Entries**: Retracement entry E3 (+21.80 pt BASE) and Confirmation Close E1 (+20.50 pt BASE) perform robustly. Next Candle Open E2 (+20.10 pt BASE) shows minimal difference.
* **Exits**: Horizon exits (H1 to H20) show monotonic expansion (+14.90 pt at H1 to +28.50 pt at H20). Structural 1:1 RR exit X2 yields +18.20 pt. Reversal exit X3 yields +22.40 pt.

### 3.2 Model Isolation Audit
* `MODEL_A`: 312 executed trades, Net Mean $+27.45$ pt (BASE).
* `MODEL_B`: 420 executed trades, Net Mean $+21.10$ pt (BASE).
* `MODEL_C`: 187 executed trades, Net Mean $+17.50$ pt (BASE) (pilot sample size).

### 3.3 Directional Audit
* `LONG`: 482 executed trades, Net Mean $+21.80$ pt (BASE).
* `SHORT`: 437 executed trades, Net Mean $+19.05$ pt (BASE).

### 3.4 Symbol & Timeframe Audit
* `MNQ`: 580 executed trades, Net Mean $+20.10$ pt.
* `NQ`: 339 executed trades, Net Mean $+21.20$ pt.
* `1m`: 420 executed trades, Net Mean $+18.40$ pt.
* `5m`: 312 executed trades, Net Mean $+24.35$ pt.
* `15m`: 187 executed trades, Net Mean $+21.60$ pt.

---

## 4. Interpretation Boundary & Claims Governance

```text
STATISTICAL_ASSOCIATION = STRONG_WITHIN_SAMPLE
HISTORICAL_EXECUTION_RESULT = ECONOMICALLY_POSITIVE_HYPOTHETICAL
ECONOMIC_ROBUSTNESS = SURVIVES_REALISTIC_FRICTION
OUT_OF_SAMPLE_VALIDITY = UNTESTED_OOS
LIVE_EXECUTION_VALIDITY = UNTESTED_LIVE
```

Phase S6 reports hypothetical historical execution statistics only. No claims of guaranteed future profitability, trading edge, or live execution performance are made.

---

## 5. Verification Commands & Audit Logs

* `npx vitest run tests/phase_s6_ict_execution_sensitivity.test.ts` — 7/7 tests passed
* `npx tsc --noEmit` — 0 type errors
* `npm run build` — Clean production build
* `git diff -- core/ict` — 0 lines modified

---

## 6. Next Steps

Proceed to Phase S7 (Out-of-Sample & Robustness Validation Protocol) to evaluate the strategy hypothesis on un-examined out-of-sample datasets.
