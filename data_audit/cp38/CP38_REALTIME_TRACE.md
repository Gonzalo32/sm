# CP38 — REALTIME TRACE & OPEN/CLOSED CANDLE AUDIT REPORT

## 1. OPEN CANDLE MUTATION
When streaming ticks for the active candle key (`symbol|timeframe|marketTimestamp`):
* `open`: Immutable once initialized for active candle slot.
* `high`: Dynamically updated via `Math.max(lastCandle.high, tick.high)`.
* `low`: Dynamically updated via `Math.min(lastCandle.low, tick.low)`.
* `close`: Updated to latest tick close.
* `volume`: Accumulated incrementally.
* `eventType`: Emits `ICT_CANDLE_UPDATE`.
* `objectIdentity`: Single candle object mutated in-place; array length remains constant.

## 2. CLOSED CANDLE IMMUTABILITY
When a new candle `T1` arrives (`T1.timestamp > T0.timestamp`):
1. `CandleStore` emits `ICT_CANDLE_CLOSE` for `T0`.
2. `T0` is marked as CLOSED and finalized.
3. `T1` is appended and emits `ICT_NEW_CANDLE`.
4. Any subsequent attempt to ingest a late tick for `T0` (`timestamp === T0.timestamp < T1.timestamp`) returns `success = false`, error `Out of order timestamp received`, and leaves `T0` completely untouched.

## 3. EVENT ORDERING & DEDUPLICATION TRACE
* **In-Order Ticks**: Processed sequentially without corrupting memory or duplicating events.
* **Duplicate Ticks**: Re-evaluations for identical tick payloads do not create duplicate candles or redundant context entries.
* **Out-Of-Order Ticks**: Out-of-order past ticks are safely rejected by the strict sequential active candle guard (`timestamp < lastCandle.timestamp`).
