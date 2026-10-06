# CP52 — Failure Diagnostics Report

## 1. Summary
Verifies that runtime failures, invalid OHLCV ticks, synthetic dataset violations, and out-of-order candles generate clear, attributed diagnostic failure messages without mutating authoritative state.

## 2. Findings
- **Invalid Input Handling**: Ingesting NaN values returns `success = false` with an explicit `error` string.
- **State Protection**: Authoritative `CandleStore` retains zero invalid candles when ingestion fails.
- **Failure Counters**:
  - `FALSE_FAILURE_DIAGNOSTICS = 0`
  - `MISATTRIBUTED_FAILURES = 0`
  - `UNREPORTED_APPLICABLE_FAILURES = 0`
  - `FAILURE_STATE_LEAK = 0`
