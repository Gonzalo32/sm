# CP55 — Provenance Identifier Inventory Report

## 1. Summary
Inventory of entity identifiers across the complete provenance chain.

| Entity | Primary ID Format | Source ID Field | Derived From | Stability |
|---|---|---|---|---|
| Source Input | N/A | `sourceContract.source` | Socket / Feed Name | Static |
| Candle | `timestamp` (e.g. `100000`) | N/A | Feed Tick | Immutable |
| ICT Event | `evt_<type>_<ts>` | `candleIndex` | Candidate Candle | Immutable |
| CandidateContext | `ctx_<symbol>_<tf>_<ts>` | `sourceCandleTimestamps` | ICT Market State & Events | Immutable |
| MTF Relation | `mtf_<symbol>_<srcTf>_<tgtTf>_<ts>` | `sourceEventIds` | HTF & LTF Contexts | Immutable |
| VisualObject | `VIS-<id>` | Event / Swing ID | ICT State Snapshot | Derived |
| Diagnostic | Provenance Metadata | Instrument & Timeframe | `MarketDataAdapter` State | Observational |
