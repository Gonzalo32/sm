# CP47 Ownership Matrix Audit

## 1. Ownership Classification Matrix

| Component | Resource Held | Ownership Type | Teardown Authority | Lifecycle Policy | Status |
|---|---|---|---|---|---|
| `CandleStore` | `candles: Candle[]` | `SINGLE_OWNER` | `CandleStore.clear()` | Purged on reset / context switch | **VERIFIED** |
| `MarketDataAdapter` | `store: CandleStore` | `SINGLE_OWNER` | `MarketDataAdapter` | Re-initialized on reconnect | **VERIFIED** |
| `ICTPipelineCoordinator` | `CandidateContext` | `SINGLE_OWNER` | `setContext()` | Purged on symbol/timeframe switch | **VERIFIED** |
| `MultiTimeframeEngine` | `MTFRelation` | `DERIVED` | Neutral evaluation | Ephemeral evaluation output | **VERIFIED** |
| `VisualAdapter` | `VisualObject[]` | `DERIVED` | `adaptStateToVisuals()` | Pure function projection from state | **VERIFIED** |

---

## 2. Ownership Rules Summary
- **Single Ownership:** Every stateful resource (`CandleStore`, `CandidateContext`) has exactly one owner responsible for teardown.
- **Derived Projections:** Derived objects (`MTFRelation`, `VisualObject`) are unowned pure function derivations that do not maintain authoritative independent state stores.
