# CP56 — Derived-State Recovery Report

## 1. Summary
Evaluates reconstruction of `CandidateContext`, `MultiTimeframeContext`, `VisualObject`, and diagnostic outputs following restart or store reset.

## 2. Findings
- **Reconstruction Integrity**: Derived entities are generated purely from authoritative `CandleStore` and `ICTMarketState` snapshots. Following store reset and history reload, derived entities rebuild deterministically.
- **Counters**: `STALE_DERIVED_STATE_AFTER_RECOVERY = 0`, `ORPHAN_DERIVED_STATE_AFTER_RECOVERY = 0`.
