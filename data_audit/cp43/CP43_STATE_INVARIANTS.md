# CP43 — STATE INVARIANTS AUDIT

## 1. STATE INVARIANT LOG

The following 9 explicit state invariants were evaluated against direct empirical test evidence:

| Invariant ID | Statement | Verified Scope | Evidence / Test | Status |
|---|---|---|---|---|
| **I1** | Every downstream reference points to a valid source entity. | CandidateContext & MTF relations | `tests/checkpoint43_state_lifecycle.test.ts` (LC-05) | `VERIFIED` |
| **I2** | No authoritative collection contains duplicate logical identities. | `CandleStore` time series | `tests/checkpoint43_state_lifecycle.test.ts` (LC-02) | `VERIFIED` |
| **I3** | Context-specific objects do not cross symbol/timeframe boundaries. | NQ $\leftrightarrow$ MNQ, 1m $\leftrightarrow$ 5m | `tests/checkpoint43_state_lifecycle.test.ts` (LC-09, LC-10) | `VERIFIED` |
| **I4** | Reset removes all session-local state from memory cleanly. | `store.clear()`, `setContext()` | `tests/checkpoint43_state_lifecycle.test.ts` (LC-04, LC-07) | `VERIFIED` |
| **I5** | Stream re-ingestion after reset does not retain stale references. | Reconnect stream recovery | `tests/checkpoint43_state_lifecycle.test.ts` (LC-08) | `VERIFIED` |
| **I6** | Active candle tick update does not create duplicate entity records. | In-place OHLC tick updates | `tests/checkpoint43_state_lifecycle.test.ts` (LC-02, LC-03) | `VERIFIED` |
| **I7** | Re-evaluated CandidateContext updates to newest event timestamp. | Pipeline re-evaluation | `tests/checkpoint43_state_lifecycle.test.ts` (LC-06) | `VERIFIED` |
| **I8** | `VisualAdapter` derives visual shapes without mutating domain entities. | Pure visual derivation | `tests/checkpoint43_state_lifecycle.test.ts` (LC-12) | `VERIFIED` |
| **I9** | MTF relations enforce anti-lookahead causality ($T_{\text{conf}}^{\text{HTF}} \le T_{\text{ev}}^{\text{LTF}}$). | `MultiTimeframeContextEngine` | `tests/checkpoint43_state_lifecycle.test.ts` (LC-11) | `VERIFIED` |
