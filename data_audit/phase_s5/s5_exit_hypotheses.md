# S5 — Exit Hypotheses Audit

## 1. Objective

Audit the feasibility, determinism, and lookahead compliance of candidate exit hypotheses for closing hypothetical execution positions.

---

## 2. Predefined Exit Hypotheses

### X1 — Fixed Forward Horizon
* **Definition**: Exit position exactly $H$ candles after entry confirmation, where $H \in \{1, 2, 3, 5, 10, 20\}$.
* **Exit Price**: Closing price of candle at index $T_{\text{entry}} + H$.
* **Status**: `AVAILABLE`.
* **Purpose**: Fixed horizon evaluation (non-optimized baseline).
* **Determinism**: Fully deterministic.

### X2 — Fixed Symmetric Risk / Reward
* **Definition**: Exit position at Take-Profit ($TP$) or Stop-Loss ($SL$) based on structural risk distance ($R$).
  * $SL = \text{entryPrice} - R$ (for LONG), $\text{entryPrice} + R$ (for SHORT).
  * $TP = \text{entryPrice} + R$ (for LONG), $\text{entryPrice} - R$ (for SHORT) — $1:1$ RR symmetric.
  * $R = |\text{entryPrice} - \text{RiskReferencePrice}|$.
* **Status**: `AVAILABLE_FROM_CANDIDATE_CONTEXT`.
* **Purpose**: Non-optimized symmetric baseline evaluation.
* **Determinism**: Fully deterministic.

### X3 — Signal-Reversal / Opposing Condition
* **Definition**: Exit open position immediately upon confirmation of an opposing candidate signal (`SHORT_CANDIDATE` for open LONG, `LONG_CANDIDATE` for open SHORT).
* **Exit Price**: Confirmation candle close of opposing candidate signal.
* **Status**: `AVAILABLE_FROM_FROZEN_EVENT_STREAM`.
* **Purpose**: Dynamic structural reversal exit.
* **Determinism**: Fully deterministic.

---

## 3. Summary Table

| Exit Hypothesis | Status | Horizon / Parameters | Optimization Status | Determinism |
| :--- | :--- | :--- | :--- | :--- |
| **X1 (Fixed Forward Horizon)** | `AVAILABLE` | $H \in \{1, 2, 3, 5, 10, 20\}$ | Unoptimized | Deterministic |
| **X2 (Fixed Symmetric RR)** | `AVAILABLE_FROM_CANDIDATE_CONTEXT` | $1:1$ Symmetric RR | Unoptimized | Deterministic |
| **X3 (Opposing Signal)** | `AVAILABLE_FROM_FROZEN_EVENT_STREAM` | Reversal on opposing event | Unoptimized | Deterministic |
