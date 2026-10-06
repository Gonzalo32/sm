# CP53 — Negative Cases & Incompatible Contract Handling Report

## 1. Summary
Evaluates system behavior when presented with invalid, malformed, or out-of-domain synthetic contracts.

## 2. Findings
- **NaN / Null OHLCV Ingestion**: When invalid candle payloads containing `open: NaN` are passed to `MarketDataAdapter`, `CandleValidator` flags the anomaly, ingestion fails cleanly (`success: false`, `error: ...`), and `CandleStore` state remains unmutated.
- **Out-of-Order Timestamps**: Candles with timestamps earlier than the existing store's latest candle are rejected without altering authoritative sequence history.
- **Synthetic Dataset Block**: Synthetic datasets attempting to bypass data origin checks on real runtime adapters are blocked cleanly (`status: REJECTED_FOR_REAL_RUNTIME`).
- **Counters**:
  - `AUTHORITATIVE_STATE_FROM_INVALID_CONTRACT = 0`
  - `INCOMPATIBLE_EVOLUTION_ACCEPTED = 0`
