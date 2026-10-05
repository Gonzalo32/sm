# CP38 — RECONNECT & RECOVERY AUDIT REPORT

## 1. RECONNECT RECOVERY CYCLE
* **BEFORE_DISCONNECT**: Connection state `CONNECTED`, `CandleStore` active, subscribers registered.
* **AFTER_DISCONNECT**: Connection state transitions to `DISCONNECTED`. Subscribers and store state preserved in memory.
* **RECONNECT_GAP_FILL**: MarketDataAdapter transitions to `RECONNECTING` and ingests missing segment. Missing candles with `timestamp >= lastTimestamp` are processed; duplicates are updated or skipped cleanly.
* **AFTER_RECONNECT**: Connection state returns to `CONNECTED`. Zero double subscription or listener multiplication observed.

## 2. RECONNECT WITH OPEN CANDLE (T0)
* **Pre-disconnect**: Candle `T0` is `OPEN`.
* **Post-reconnect**: Tick update for `T0` mutates `high`, `low`, `close` on the existing `T0` object.
* **Bar Boundary**: When `T1` arrives post-reconnect, `T0` closes cleanly (`ICT_CANDLE_CLOSE`) and `T1` becomes `OPEN` (`ICT_NEW_CANDLE`). Zero duplicate `T0` objects created.
