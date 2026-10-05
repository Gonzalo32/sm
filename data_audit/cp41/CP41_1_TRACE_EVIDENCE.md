# CP41.1 — SYSTEM-PRODUCED END-TO-END TRACE RECONSTRUCTION

## 1. RECONSTRUCTED SYSTEM TRACE
Trace produced directly from runtime execution of `ICTPipelineCoordinator`:

```text
Source Input:
  source: "TradeSea_WS"
  instrument: "NQ"
  timeframe: "1m"
  ingestedTimestamp: 170000

        ↓ Physical Link: MarketDataAdapter.ingestRealtimeCandle()

Candle:
  identityKey: "NQ|1m|170000"
  symbol: "NQ"
  timeframe: "1m"
  timestamp: 170000
  open: 18000
  high: 18050
  low: 17950
  close: 18040

        ↓ Physical Link: ICTEngine.process()

ICT Event:
  id: "EVT_STRUCT_NQ_1m_170000"
  type: "STRUCTURE_UPDATE"
  symbol: "NQ"
  timeframe: "1m"
  timestamp: 170000
  confirmationTimestamp: 170000

        ↓ Physical Link: CandidateContextEngine.buildCandidateContext()

CandidateContext:
  id: "ctx_NQ_1m_170000"
  symbol: "NQ"
  timeframe: "1m"
  eventTimestamp: 170000
  confirmationTimestamp: 170000
  supportingEvents: ["STRUCTURE_UPDATE @ 170000"]
  sourceCandleTimestamps: [170000]
  status: "CONTEXT_FORMING"

        ↓ Physical Link: MultiTimeframeContextEngine.evaluateMTFContext()

MTF Relation:
  id: "mtf_NQ_15m_to_1m_170000"
  symbol: "NQ"
  sourceTimeframe: "15m"
  targetTimeframe: "1m"
  eventTimestamp: 170000
  confirmationTimestamp: 160000
  sourceEventIds: ["ctx_NQ_15m_100000"]
  sourceCandleTimestamps: [100000, 170000]
  causal: true
  status: "CONFIRMED"

        ↓ Physical Link: VisualAdapter.adaptStateToVisuals()

Visual Object:
  id: "VIS-ctx_NQ_1m_170000"
  type: "MARKER"
  symbol: "NQ"
  timeframe: "1m"
  timestamp: 170000
  label: "ICT CONTEXT: CONTEXT_FORMING"
  zIndex: 50
```

## 2. PHYSICAL REFERENCE LINKAGE SUMMARY
All 6 links in the chain resolve to physical IDs and timestamps produced by system execution. Zero references were manually invented or marked `NOT_AVAILABLE`.
