# CP49.1 ORDERING RECONCILIATION

## 1. RECONCILED ORDERING MECHANISMS

1. **Timestamp Monotonicity**: Enforced by `CandleStore` (`ts > lastTs`).
2. **Arrival Order Idempotency**: Duplicate timestamps are ignored cleanly.
3. **Confirmation Status**: CandidateContext requires status `'CONTEXT_CONFIRMED'`.
4. **Temporal Causality**: Enforced by `MultiTimeframeContextEngine` (`T_conf^HTF <= T_ev^LTF`).
5. **Context Identity**: Scoped by `symbol` and `timeframe`.

---

## 2. VERDICT

All ordering contracts are supported by implementation evidence in the TradeSea runtime.
