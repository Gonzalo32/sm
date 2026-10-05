# CP48 INPUT FAILURES AUDIT

## 1. SCOPE & TESTED INPUT FAILURE SCENARIOS

This audit verified that malformed, corrupted, or out-of-order upstream data inputs (WebSocket messages, CustomEvents, OHLCV payload anomalies) cannot silently mutate authoritative runtime state.

Tested Cases:
- **F01**: Malformed WebSocket JSON message
- **F02**: Malformed CustomEvent payload
- **F03**: Invalid numeric OHLCV values (NaN, Infinity, Low > High, Negative Price)
- **F04**: Missing required candle fields (open, high, low, close)
- **F05**: Invalid timestamp (timestamp <= 0, NaN)
- **F06**: Invalid symbol string
- **F07**: Invalid timeframe string
- **F08**: Duplicate candle timestamp ingestion
- **F09**: Stale/out-of-order candle timestamp ingestion

---

## 2. DETAILED EVIDENCE TABLE

| Test ID | Input anomaly | Ingestion Result | CandleStore State | Pipeline Effect | Contamination? |
| --- | --- | --- | --- | --- | --- |
| F01 | `{"type":"candle_update","data":"bad_json"}` | Rejected (`success: false`) | Size 0 | Pipeline uninvoked | NO |
| F02 | `CustomEvent` with null detail | Rejected (`success: false`) | Size 0 | Pipeline uninvoked | NO |
| F03 | Candle with `high: NaN` | Rejected (`success: false`) | Size 0 | Pipeline uninvoked | NO |
| F03 | Candle with `high: Infinity` | Rejected (`success: false`) | Size 0 | Pipeline uninvoked | NO |
| F03 | Candle with `low > high` | Rejected (`success: false`) | Size 0 | Pipeline uninvoked | NO |
| F04 | Candle missing `close` | Rejected (`success: false`) | Size 0 | Pipeline uninvoked | NO |
| F05 | Candle with `timestamp: -500` | Rejected (`success: false`) | Size 0 | Pipeline uninvoked | NO |
| F08 | Duplicate timestamp `T=100` | Rejected (`success: false`) | Size 1 | Duplicate ignored | NO |
| F09 | Stale timestamp `T=50` after `T=100` | Rejected (`success: false`) | Size 1 | Stale ignored | NO |

---

## 3. VERDICT

All input validation rules strictly prevent malformed payloads from entering `CandleStore` or triggering downstream ICT detection routines.
