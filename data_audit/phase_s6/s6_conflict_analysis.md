# S6 — Signal Conflict & Overlap Analysis

## 1. Overview

This document documents the application of the deterministic S5 signal conflict and position state rules across the $N=967$ total candidate signal observations.

Conflict resolution rules were defined ex-ante in S5 (`POSITION_STATE_RULE = SINGLE_POSITION_PER_SYMBOL_TIMEFRAME`, `SIGNAL_CONFLICT_RULE = DETERMINISTIC_FIRST_CONFIRMED_PRIORITY`) and enforced strictly without outcome-based filtering.

---

## 2. Signal Population Reconciliation

```text
TOTAL_SIGNAL_OBSERVATIONS = 967
TOTAL_EXECUTED_HYPOTHETICAL_TRADES = 919
TOTAL_SKIPPED_CONFLICT_SIGNALS = 48
TOTAL_OVERLAPPING_SIGNALS = 48
```

---

## 3. Breakdown of Skipped Signals

The 48 skipped signals fall into two deterministic categories:

1. **Same-Direction Overlapping Signals ($N=34$)**: A candidate signal in direction $D$ was generated while an existing position in direction $D$ on the same symbol/timeframe was already OPEN. Under the S5 first-confirmed priority rule, the second signal was skipped.
2. **Multi-Timeframe / Cross-Model Overlapping Signals ($N=14$)**: Overlapping signals occurring within the same candle timestamp boundary across adjacent timeframes.

---

## 4. Conflict Policy Audit Statement

All 48 skipped signals were logged, preserved in the dataset audit record (`s6_execution_dataset.json`), and suppressed strictly via ex-ante rules. No signal was skipped or selected based on historical trade profitability.
