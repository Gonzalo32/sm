# CP56 — Reset Integrity Report

## 1. Summary
Evaluates reset behavior on `CandleStore` (`clear()`) and `ReplayEngine` (`reset()`).

## 2. Findings
- **Store Reset**: `store.clear()` purges stored candle arrays completely while preserving instance configuration (`symbol`, `timeframe`, lookback days).
- **Replay Reset**: `replayEngine.reset()` resets dataset position pointers and slice indices to clean zero state.
- **Reset Counters**: `RESET_STATE_VIOLATIONS = 0`, `RESET_PROVENANCE_LEAKS = 0`.
