# CP42 — STATE RESET & RECONNECTION AUDIT

## 1. RECONNECTION & CONTEXT SWITCHING AUDIT

This audit evaluated component behavior during simulated reconnections and symbol/timeframe context switches.

---

## 2. RECONNECTION EXPERIMENT (RESET CANDLESTORE)

### Sequence:
1. Ingest candles $T_0, T_1$. Store size = 2.
2. Trigger `store.clear()`. Store size = 0.
3. Re-ingest candles $T_0, T_1$. Store size = 2.

### Observed Behavior:
* Store state clears completely without retaining stale references.
* Re-ingested candles rebuild exact time series.
* Orphaned candidate contexts or visual markers: `NONE`.
* Status: `VERIFIED`.

---

## 3. CONTEXT SWITCH EXPERIMENT (NQ $\leftrightarrow$ MNQ, 1m $\leftrightarrow$ 5m)

### Sequence:
1. Initialize `ICTPipelineCoordinator('NQ', '1m')`. Ingest NQ 1m candle. Store count = 1.
2. Call `setContext('MNQ', '5m')`.
3. Check context & store: Symbol = `MNQ`, Timeframe = `5m`, Store count = 0.
4. Call `setContext('NQ', '1m')`. Store count = 0.

### Observed Behavior:
* Changing context creates a fresh `CandleStore` for the target symbol/timeframe.
* Engine progressive buffer is reset (`ictEngine.resetProgressiveBuffer()`).
* Zero state leakage between NQ and MNQ or 1m and 5m.
* Status: `VERIFIED`.
