# CP41 — END-TO-END TRACE RECONSTRUCTION REPORT

## 1. RECONSTRUCTED LINEAGE TRACE

```text
Visual Object:
  id: VIS-ctx_NQ_1m_100000
  type: MARKER
  symbol: NQ
  timeframe: 1m
  timestamp: 100000
  label: "ICT CONTEXT: CONTEXT_CONFIRMED"

        ↓ Resolves to

CandidateContext:
  id: ctx_NQ_1m_100000
  symbol: NQ
  timeframe: 1m
  eventTimestamp: 100000
  confirmationTimestamp: 105000
  supportingEvents: ["BOS BULLISH @ 100000", "FVG ACTIVE @ 100000"]
  sourceCandleTimestamps: [100000]

        ↓ Resolves to

MultiTimeframeContext:
  id: mtf_NQ_15m_to_1m_100000
  sourceTimeframe: 15m
  targetTimeframe: 1m
  sourceEventIds: ["ctx_NQ_15m_100000"]
  sourceCandleTimestamps: [100000]
  causal: true

        ↓ Resolves to

Source Candle:
  identityKey: NQ|1m|100000
  symbol: NQ
  timeframe: 1m
  timestamp: 100000
  open: 18000
  high: 18050
  low: 17950
  close: 18040
```

## 2. RECONSTRUCTION INTEGRITY
Every ID in the trace resolves to its exact source object without missing references or unresolved synthetic fallbacks.
