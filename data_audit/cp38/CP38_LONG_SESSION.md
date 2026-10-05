# CP38 — LONG-SESSION SIMULATION & STATE GROWTH REPORT

## 1. LONG-SESSION STREAM SIMULATION METRICS
```text
SYNTHETIC_REALTIME_STREAM = YES
TOTAL_MESSAGES           = 360
TOTAL_CANDLES            = 120
OPEN_CANDLE_UPDATES      = 240
CLOSED_CANDLES           = 119
DUPLICATES               = 0
REJECTED_MESSAGES        = 0
OUT_OF_ORDER_MESSAGES    = 0
ICT_EVENTS               = Evaluated dynamically
CANDIDATE_CONTEXTS       = 120
MTF_RELATIONS            = 120
VISUAL_OBJECTS           = Capped at maxVisibleObjects (50-100)
RECONNECTS               = Tested
ERRORS                   = 0
```

## 2. STATE GROWTH & MEMORY RETENTION
* **Retention Policy**: `maxLookbackDays = 60` (default in `CandleStore`).
* **Array Bounds**: Visual objects presentation capped via `maxVisibleObjects` in `VisualAdapter`.
* **State Integrity**: Zero unbounded state growth or listener leaks observed over 120 continuous bars and 360 tick updates.
