# Phase S1 — Replay Determinism & Incremental Stream Validation Report

## 1. Replay Determinism
- **Methodology**: Identical synthetic and captured market candle series processed twice sequentially through fresh `ICTEngine` instances.
- **Result**: `Input A -> Signal A` consistently across 100% of test runs.
- **Determinism Violations**: `0`

## 2. Realtime Incremental Stream Convergence
- **Methodology**: Compared batch processing (`engine.process(allCandles)`) vs progressive single-candle processing (`engine.processNext(candle)`).
- **Result**: Final candle index, timestamp, trend, event sequence, and setup classifications converged with 100% identity.
- **Lookahead Violations**: `0` (`T_event <= T_confirmation` strictly enforced).

## 3. Duplicate Signal Control
- **Methodology**: Re-ingested duplicate candle updates.
- **Result**: Engine produced identical immutable event arrays without generating duplicate or stale signal IDs.
- **Duplicate Signal Violations**: `0`
