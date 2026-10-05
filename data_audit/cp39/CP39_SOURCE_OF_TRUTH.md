# CP39 — SOURCE OF TRUTH & DERIVED STATE MAP

## 1. SOURCE OF TRUTH TABLE

| Domain | Source of Truth | Derived State | Lifetime / Mutability |
|---|---|---|---|
| **Candles** | `CandleStore` | `Candle[]` snapshot | Open candle mutable in-place; Closed candles 100% immutable |
| **ICT Events** | `ICTEngine` | `ICTEngineResult` (`ICTEvent[]`) | Deterministic calculation per candle slice |
| **CandidateContext** | `CandidateContextEngine` | `CandidateContext` payload | Persistent contextual state; non-operational |
| **MTF Context** | `MultiTimeframeContextEngine` | `MultiTimeframeContext` payload | Derived from causally confirmed HTF + LTF CandidateContexts |
| **Visual Overlay** | `VisualAdapter` | `VisualObject[]` | Capped via `maxVisibleObjects`; pure presentation layer |
| **Connection State** | `MarketDataAdapter` | Connection status string | State machine (`DISCONNECTED` / `CONNECTED` / `RECONNECTING`) |
| **Subscription State** | `CandleStore` | Listener `Set<CandleEventListener>` | Explicit subscription lifecycle (`subscribe()` / `unsubscribe()`) |

```text
SOURCE_OF_TRUTH_STATUS = PASS
```
