# Phase S2 — Outcome Evaluation Protocol & Protocol Specification

## 1. PURPOSE & SCOPE
Define the mathematical, temporal, and structural protocol for evaluating the statistical directional behavior of candidate signals generated in Phase S1 (`LONG_CANDIDATE`, `SHORT_CANDIDATE`, `NO_SIGNAL`) relative to post-confirmation market price movement.

This protocol operates strictly after signal confirmation time and forbids any adaptation or tuning of frozen production ICT models.

---

## 2. EVALUATION HORIZONS
Statistical forward evaluation is conducted across six predefined candle-based horizons:
- `H1`: 1 candle forward from `confirmationTimestamp`.
- `H2`: 2 candles forward from `confirmationTimestamp`.
- `H3`: 3 candles forward from `confirmationTimestamp`.
- `H5`: 5 candles forward from `confirmationTimestamp`.
- `H10`: 10 candles forward from `confirmationTimestamp`.
- `H20`: 20 candles forward from `confirmationTimestamp`.

---

## 3. REFERENCE PRICE & DIRECTIONAL STATES

### Reference Price ($P_{ref}$)
The close price of the candle at `confirmationTimestamp`.

### Outcome Classifications
1. **`LONG_CANDIDATE` Evaluation**:
   - `FAVORABLE`: $P_{max\_horizon} > P_{ref}$ (Price achieved bullish expansion).
   - `ADVERSE`: $P_{max\_horizon} \le P_{ref}$ AND $P_{min\_horizon} < P_{ref}$ (Price moved strictly against signal).
   - `NEUTRAL`: $P_{max\_horizon} = P_{ref} = P_{min\_horizon}$.
2. **`SHORT_CANDIDATE` Evaluation**:
   - `FAVORABLE`: $P_{min\_horizon} < P_{ref}$ (Price achieved bearish expansion).
   - `ADVERSE`: $P_{min\_horizon} \ge P_{ref}$ AND $P_{max\_horizon} > P_{ref}$ (Price moved strictly against signal).
   - `NEUTRAL`: $P_{min\_horizon} = P_{ref} = P_{max\_horizon}$.
3. **`INSUFFICIENT_DATA`**:
   - Assigned whenever the available post-confirmation candle stream has fewer candles than the required horizon count $H_N$, or for `NO_SIGNAL` baseline records.

---

## 4. TEMPORAL INTEGRITY & ANTI-LOOKAHEAD
- Outcome evaluation window starts strictly at `T_window_start > confirmationTimestamp`.
- No candle preceding or including `confirmationTimestamp` is used to determine outcome state.
- `LOOKAHEAD_VIOLATIONS = 0`.

---

## 5. SELECTION BIAS PROTECTION & PROVENANCE
- 100% of candidate signals are evaluated without excluding poor or inconvenient observations.
- Each outcome record retains full provenance pointers (`signalId`, `candidateContextId`, `sourceEventIds`, `mtfContextId`).
- Zero trading strategy, P&L, win rate, or execution claims are permitted in S2.
