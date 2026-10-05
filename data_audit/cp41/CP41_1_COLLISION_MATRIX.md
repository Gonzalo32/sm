# CP41.1 — EVENT ID COLLISION AUDIT MATRIX

## 1. AUDIT OF EVENT IDENTITY COLLISION SCENARIOS

| Collision Test Scenario | Inputs Tested | Identity Key Formats Evaluated | Result | Collision Outcome | Architectural Classification |
|---|---|---|---|---|---|
| **Same Type + Symbol + TF + Timestamp** | 2 FVGs on same candle (`NQ 1m @ 100000`) | `EVT_FVG_NQ_1m_100000` & `supportingEvents` | `supportingEvents[0]`, `supportingEvents[1]` | **No collision** | `b) Evita colisión mediante estructura externa` (indexed descriptors in CandidateContext) |
| **Different Candle Source** | Candle `c1 (100000)` vs Candle `c2 (160000)` | `ctx_NQ_1m_100000` vs `ctx_NQ_1m_160000` | Distinct IDs generated | **No collision** | `a) Garantiza unicidad por timestamp` |
| **Recalculated Event on Active Tick** | Tick 1 vs Tick 2 on active bar `100000` | `ctx_NQ_1m_100000` | Single context object updated in-place | **No collision** | `a) Garantiza unicidad por in-place mutation` |
| **Same Apparent ID + Different Payload** | `ctx_NQ_1m_100000` payload update | `ctx_NQ_1m_100000` | Updated `supportingEvents` array | **No collision** | `b) Evita colisión mediante estructura externa` |

```text
EVENT_ID_COLLISION_CLASSIFICATION = b) Evita colisión mediante estructura externa (y a) por timestamp de vela)
```
No ID collisions observed across all tested scenarios.
