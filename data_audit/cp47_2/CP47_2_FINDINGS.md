# CP47.2 Findings Log

## Summary of Findings

| Finding ID | Severity | Category | Component | Status | Description |
|---|---|---|---|---|---|
| FIND-CP47.2-01 | INFO | Category Re-classification | R03 Subscriptions | VERIFIED | Re-classified from VERIFIED to NOT_APPLICABLE. Architecture uses connection status state machine (`sourceContract`), no subscription registry object. |
| FIND-CP47.2-02 | INFO | Category Re-classification | R06 Observers | VERIFIED | Re-classified from VERIFIED to NOT_APPLICABLE. `CandleStore.loadHistory()` stores candle data arrays, not observer callbacks. |
| FIND-CP47.2-03 | INFO | Category Re-classification | R07 EventEmitter | VERIFIED | Re-classified from VERIFIED to NOT_APPLICABLE. Content bridge uses browser DOM CustomEvent dispatching, no Node EventEmitter instance. |
| FIND-CP47.2-04 | INFO | Category Re-classification | R18 Async Handles | VERIFIED | Re-classified from VERIFIED to NOT_APPLICABLE. Promises resolve synchronously inline, no retained timer/async handles requiring teardown. |

---

## Detailed Breakdown

### FIND-CP47.2-01: R03 Subscriptions Re-classification (INFO)
- **Observation:** `MarketDataAdapter` tracks connection status metadata via `setConnectionStatus()`. No active stream subscription registry object exists.
- **Verification:** Verified in `tests/checkpoint47_2_resource_category_reconciliation.test.ts`.

### FIND-CP47.2-02: R06 Observer Registrations Re-classification (INFO)
- **Observation:** `CandleStore.loadHistory()` performs time series data ingestion into `candles: Candle[]`. It does not store observer callbacks.
- **Verification:** Verified in R06 code inspection test suite.

### FIND-CP47.2-03: R07 EventEmitter Re-classification (INFO)
- **Observation:** Page bridge and content script use DOM `CustomEvent` messaging (covered under R01 Event listeners). No EventEmitter instance exists.
- **Verification:** Verified in R07 code inspection test suite.

### FIND-CP47.2-04: R18 Async Handles Re-classification (INFO)
- **Observation:** Realtime candle ingestion and coordinator pipeline operations resolve synchronously inline without creating cancellable timer handles.
- **Verification:** Verified in R18 code inspection test suite.
