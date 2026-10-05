# CP47 Derived Object Cleanup Audit

## 1. Overview
Audit of derived domain structures (ICT Events, CandidateContexts, MTF Relations, VisualObjects) across state transitions.

---

## 2. Derived Cleanup Matrix

| Derived Object | Primary Authoritative Source | Replacement Trigger | Cleanup Mechanism | Status |
|---|---|---|---|---|
| ICT FVG / BOS | `CandleStore` time-series | Candle revision / displacement | Invalidation move to `invalidatedEvents` | **VERIFIED** |
| `CandidateContext` | ICT Engine Events | Context switch / symbol change | Re-initialized in coordinator | **VERIFIED** |
| `MTFRelation` | HTF + LTF Contexts | Timestamp progression / reset | Evaluated per frame | **VERIFIED** |
| `VisualObject` | CandidateContext + State | Frame render trigger | Functional projection re-creation | **VERIFIED** |

---

## 3. Conclusions
Derived objects do not persist as independent authoritative state stores when their underlying source state is reset or replaced.
