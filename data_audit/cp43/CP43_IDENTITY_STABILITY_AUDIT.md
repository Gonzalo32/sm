# CP43 — IDENTITY STABILITY AUDIT

## 1. ENTITY IDENTITY SCHEMES

The audit inspected how unique identities are constructed and maintained across entity lifecycles:

| Entity | ID Scheme / Format | Mutability | Deterministic Invariant | Audit Status |
|---|---|---|---|---|
| **Candle** | `${symbol}\|${timeframe}\|${timestamp}` | Immutable key, OHLC updated in-place | Same market bar $\rightarrow$ Same key | `VERIFIED` |
| **ICT Event** | `<type>_<index>_<timestamp>` | Immutable upon bar close | Same candle sequence $\rightarrow$ Same event IDs | `VERIFIED` |
| **CandidateContext** | `ctx_<symbol>_<timeframe>_<eventTimestamp>` | Derived from active state | Same state $\rightarrow$ Same context ID | `VERIFIED` |
| **MTF Relation** | `mtf_<symbol>_<srcTf>_<targetTf>_<eventTimestamp>` | Re-evaluated causally | Same HTF+LTF pair $\rightarrow$ Same MTF ID | `VERIFIED` |
| **VisualObject** | `VIS-<sourceId>` | Derived on snapshot | Source ID prefix $\rightarrow$ Stable visual ID | `VERIFIED` |

---

## 2. IDENTITY INVARIANT AUDIT RESULTS

* **Repeated Ingestion Invariance**: Re-ingesting identical tick streams yields 100% identical IDs.
* **Reconnect Invariance**: Clearing state and re-ingesting yields identical candle identity keys.
* **Context Isolation**: CandidateContext IDs explicitly include symbol and timeframe (`ctx_NQ_1m_100000` vs `ctx_MNQ_1m_100000`), preventing ID collisions across symbols.
