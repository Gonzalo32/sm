# S5 — Entry Hypotheses Audit

## 1. Objective

Audit the feasibility, determinism, and lookahead compliance of candidate entry hypotheses for converting ICT candidate signals into hypothetical execution events.

---

## 2. Predefined Entry Hypotheses

### E1 — Confirmation Close
* **Definition**: `entryPrice = confirmation candle close`
* **Execution Timestamp**: Timestamp of confirmation candle completion ($T_{\text{conf}}$).
* **Availability**: `AVAILABLE` across all models (A, B, C) and directions (LONG, SHORT).
* **Determinism**: Fully deterministic; uses historical closing price of confirmed candle.
* **Lookahead Risk**: ZERO. Confirmation occurs strictly at candle close.

### E2 — Next Candle Open
* **Definition**: `entryPrice = first candle open after confirmation`
* **Execution Timestamp**: Timestamp of next candle open ($T_{\text{conf} + 1}$).
* **Availability**: `AVAILABLE` across all models and directions.
* **Determinism**: Fully deterministic; uses opening price of immediate subsequent candle.
* **Lookahead Risk**: ZERO. Follows confirmation sequentially in time.

### E3 — FVG / Displacement Retracement
* **Definition**: `entryPrice = FVG boundary price from CandidateContext`
  * For LONG: Top boundary of bullish FVG (or lower displacement bound).
  * For SHORT: Bottom boundary of bearish FVG (or upper displacement bound).
* **Execution Timestamp**: First bar timestamp where market price touches or penetrates the FVG boundary post-confirmation.
* **Availability**: `AVAILABLE_FROM_CANDIDATE_CONTEXT`. FVG boundary prices are preserved in frozen `CandidateContext`.
* **Determinism**: Fully deterministic based on immutable context parameters.
* **Lookahead Risk**: ZERO. Entry triggers strictly after candidate signal confirmation.

---

## 3. Summary Table

| Entry Hypothesis | Status | Lookahead Violations | Lookback Violations | Determinism |
| :--- | :--- | :--- | :--- | :--- |
| **E1 (Confirmation Close)** | `AVAILABLE` | 0 | 0 | Deterministic |
| **E2 (Next Candle Open)** | `AVAILABLE` | 0 | 0 | Deterministic |
| **E3 (FVG Retracement)** | `AVAILABLE_FROM_CANDIDATE_CONTEXT` | 0 | 0 | Deterministic |
