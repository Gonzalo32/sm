# CP42 — DUPLICATE INPUT AUDIT

## 1. DUPLICATE INPUT AUDIT MATRIX

Five specific duplicate conditions (DUP-01 through DUP-05) were evaluated to verify contract integrity:

| ID | Test Scenario | Behavior Defined by Contract | Observed Behavior | Duplicate Records Created? | Classification |
|---|---|---|---|---|---|
| **DUP-01** | Identical tick/candle repeated | Active candle updated in-place | Store count remains 1, active candle updated | `NO` | `VERIFIED` |
| **DUP-02** | Same timestamp, different content (higher high) | High expanded, close updated | Store count = 1, `high` updated to max value | `NO` | `VERIFIED` |
| **DUP-03** | Identical open candle tick update | `ICT_CANDLE_UPDATE` event emitted | Active bar updated in-place | `NO` | `VERIFIED` |
| **DUP-04** | Varied open candle tick update | `high`/`low` updated continuously | In-place OHLC expansion | `NO` | `VERIFIED` |
| **DUP-05** | Reconnect tick repeat | Re-ingestion absorbed cleanly | In-place bar match, store size invariant | `NO` | `VERIFIED` |

---

## 2. INVARIANT SUMMARY

Across all duplicate variants:
* `CandleStore.candles.length` increases **only** when `candle.timestamp > lastCandle.timestamp`.
* Duplicate inputs do **not** generate duplicate ICT Events, duplicate CandidateContexts, or duplicate VisualObjects.
