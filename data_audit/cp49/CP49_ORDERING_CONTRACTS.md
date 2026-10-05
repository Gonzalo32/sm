# CP49 ORDERING CONTRACTS

## 1. RUNTIME ORDERING CONTRACT DEFINITIONS

1. **Timestamp Ordering**:
   - `CandleStore` enforces strict timestamp monotonicity (`candle.timestamp > lastTimestamp`).
   - Out-of-order past ticks are rejected with `success: false`.

2. **Arrival Ordering**:
   - Ticks arriving for the active open candle update the high/low/close of the active candle in arrival sequence.
   - Closed candles cannot be updated retroactively.

3. **Confirmation Ordering**:
   - CandidateContext transitions from `CONTEXT_FORMING` to `CONTEXT_CONFIRMED` upon receiving confirming ICT events.
   - Downstream context engines reject contexts where `status !== 'CONTEXT_CONFIRMED'`.

4. **Temporal Causality Ordering**:
   - MultiTimeframeContextEngine enforces `T_conf^HTF <= T_ev^LTF`.
   - HTF confirmation timestamps in the future relative to the LTF event timestamp produce `causal: false`.

5. **Context Identity Ordering**:
   - State updates are scoped strictly by `symbol` + `timeframe`.
   - Operations from context `NQ 1m` cannot mutate context `MNQ 1m` or `NQ 5m`.

---

## 2. VERDICT

All identified ordering contracts are strictly respected during concurrent and interleaved execution.
