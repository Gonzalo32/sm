# CP46 Stale Data Audit

## 1. Overview
Audit of stale data handling, including out-of-order past ticks, pre-reset updates, and delayed messages.

---

## 2. Stale Update Scenarios

- **STALE-01: Past Timestamp Update:** An update for a timestamp earlier than the latest closed candle in `CandleStore` is rejected by `MarketDataAdapter` (`success = false`).
- **STALE-02: Pre-Reset Updates:** When `CandleStore.clear()` or `reset()` is invoked, subsequent incoming ticks treat the store as clean, preventing pre-reset state resurrection.
- **STALE-03: Stale Visual Objects:** Reset or context switches trigger visual buffer clears, preventing stale rendering objects from persisting.

---

## 3. Audit Summary
Stale state cannot silently overwrite current authoritative state. Reset and clear operations reliably purge obsolete memory references.
