# CP39 — EVENT IDENTITY & IMMUTABILITY REPORT

## 1. IDENTITY KEYS & LIFETIME INVENTORY

| Domain Entity | Identity Key Format | Lifetime / Scope | Mutability | Deduplication Rule |
|---|---|---|---|---|
| **Candle** | `symbol\|timeframe\|timestamp` | Time series slot | Open: Mutable; Closed: Immutable | Timestamp uniqueness in `CandleStore` |
| **ICT Event** | `EVT_<TYPE>_<symbol>_<tf>_<timestamp>` | Single candle slice | Immutable snapshot | Unique ID per event calculation |
| **Candidate Context** | `ctx_<symbol>_<tf>_<firstEventTs>` | Pipeline evaluation cycle | Persistent context state | Unique ID per context event timestamp |
| **MTF Relation** | `mtf_<symbol>_<src>_to_<tgt>_<eventTs>` | Pipeline evaluation cycle | Derived contextual relation | Source/target timeframe & timestamp key |
| **Visual Object** | `VIS-<EntityID>` | Canvas render frame | Derived presentation shape | Filtered & capped by `maxVisibleObjects` |
| **Subscription** | Listener function reference | Coordinator lifecycle | Active listener in `Set` | `Set.add()` / `Set.delete()` |

```text
EVENT_IDENTITY_STATUS = PASS
IMMUTABILITY_BOUNDARY_STATUS = PASS
```
