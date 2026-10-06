# S5 — Signal Conflict & Position State Policy

## 1. Overview

This document specifies the deterministic, ex-ante rules for resolving trade conflicts and maintaining position state across multiple signals, models, timeframes, and directions.

All conflict resolution rules are strictly non-discretionary and fixed prior to performance evaluation.

---

## 2. Predefined Conflict Rules

### Case 1: Same-Direction Overlapping Signal
* **Rule**: `IGNORE_IF_POSITION_OPEN` (First-Confirmed Priority).
* **Behavior**: If a position in direction $D$ on symbol $S$ and timeframe $TF$ is currently OPEN, subsequent candidate signals in direction $D$ on the same symbol and timeframe are ignored until the existing position is CLOSED.
* **Selection Bias Prevention**: Selecting multiple overlapping positions or stacking entries without explicit risk rules is prohibited.

### Case 2: Opposite-Direction Signal
* **Rule**: `CLOSE_EXISTING_AND_REVERSE` (or `IGNORE_IF_POSITION_OPEN` under X1/X2 variants).
* **Behavior**: Under exit rule `X3_OPPOSING_SIGNAL`, an opposite-direction confirmed signal closes the active position at confirmation candle close and enters the new direction. Under `X1`/`X2`, the active position remains open until its predefined exit condition is reached.

### Case 3: Candidate Signal While Position Open
* **Rule**: Controlled strictly by `POSITION_STATE_RULE = SINGLE_POSITION_PER_SYMBOL_TIMEFRAME`.
* **Behavior**: Max 1 position per symbol and timeframe per model instance.

### Case 4: Multiple Models Triggering Simultaneously
* **Rule**: `INDEPENDENT_MODEL_STREAMS`.
* **Behavior**: `MODEL_A`, `MODEL_B`, and `MODEL_C` operate as 3 completely separate, isolated state engines. They are never merged, averaged, or scored together.

### Case 5: Multiple Timeframes Triggering Simultaneously
* **Rule**: `INDEPENDENT_TIMEFRAME_STREAMS`.
* **Behavior**: 1m, 5m, and 15m timeframes maintain separate position state objects.

---

## 3. Policy Verification

```text
POSITION_STATE_RULE = SINGLE_POSITION_PER_SYMBOL_TIMEFRAME
SIGNAL_CONFLICT_RULE = DETERMINISTIC_FIRST_CONFIRMED_PRIORITY
MODEL_ISOLATION = STRICT_INDEPENDENT_STREAMS
```
