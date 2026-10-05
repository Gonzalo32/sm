# CP42 — ORDERING ADVERSARIAL AUDIT

## 1. ADVERSARIAL ARRIVAL ORDERING EVALUATION

The pipeline contract specifies how out-of-order and duplicate ticks are handled by `CandleStore` and `MarketDataAdapter`.

### Order Definitions:
* **Event Timestamp**: The market time recorded on the candle/tick.
* **Arrival Order**: Physical sequence of message arrival at the adapter.
* **Processing Timestamp**: Local clock execution time.

---

## 2. ADVERSARIAL CASE RESULTS

### Case A: Orderly Sequence ($T_0 \rightarrow T_1 \rightarrow T_2$)
* **Expected Contract**: Ingest all 3 candles in sequence. Store count = 3.
* **Observed Result**: 3 candles ingested, full ICT event detection executed.
* **Status**: `VERIFIED`

### Case B: Out-of-Order Sequence ($T_0 \rightarrow T_2 \rightarrow T_1$)
* **Expected Contract**: $T_2$ sets latest store timestamp. Late candle $T_1$ ($T_1 < T_2$) is rejected by `CandleStore.ingestCandle()` with `Out of order timestamp received`.
* **Observed Result**: Store contains 2 candles ($T_0, T_2$). $T_1$ rejected cleanly without corrupting memory or back-updating state.
* **Status**: `VERIFIED`

### Case C: Duplicate Sequence ($T_0 \rightarrow T_1 \rightarrow T_1 \rightarrow T_2$)
* **Expected Contract**: Duplicate $T_1$ updates existing active candle in-place without creating a 4th record. Store count = 3.
* **Observed Result**: Store contains 3 candles ($T_0, T_1, T_2$). No duplicate events or orphaned contexts created.
* **Status**: `VERIFIED`

### Case D: Duplicate & Out-of-Order ($T_0 \rightarrow T_2 \rightarrow T_2 \rightarrow T_1$)
* **Expected Contract**: Duplicate $T_2$ updates active bar in-place; past $T_1$ rejected. Store count = 2.
* **Observed Result**: Store contains 2 candles ($T_0, T_2$). Zero false triggers.
* **Status**: `VERIFIED`
