# CP43 — UPDATE & REPLACEMENT AUDIT

## 1. UPDATE & REPLACEMENT AUDIT LOG

This audit tested state entity behaviors during in-place updates, candle expansion, duplicate message ingestion, and progressive recalculations.

| Test Case | Entity | Operation | Expected Contract | Observed Behavior | Status |
|---|---|---|---|---|---|
| **UPD-01** | Candle | Ingest identical tick | Update active bar in-place | Store size = 1, timestamp unchanged | `VERIFIED` |
| **UPD-02** | Candle | Ingest tick with higher high | Expand `high` property in-place | Store size = 1, `high` updated | `VERIFIED` |
| **UPD-03** | CandidateContext | Re-evaluate on tick update | Refresh status & timestamps | Single active context, updated ts | `VERIFIED` |
| **UPD-04** | MTF Relation | Re-evaluate on LTF tick | Recalculate causal relationship | Single active MTF relation | `VERIFIED` |
| **UPD-05** | VisualObject | Re-derive on snapshot | Transform active state | Derived array generated dynamically | `VERIFIED` |

---

## 2. SUMMARY

In-place mutations on active candles preserve single entity instances in `CandleStore`. Duplicate messages do not duplicate store records or trigger duplicate downstream contexts.
