# CP55 — End-to-End Provenance Model Report

## 1. Executive Summary
This document defines the end-to-end provenance model discovered across the TradeSea runtime pipeline:
`Source Input → Candle → ICT Event → CandidateContext → MTF Relation → VisualObject → Diagnostics`.

## 2. Pipeline Provenance Classification

| Stage | Entity Type | Authoritative / Derived | ID Field | Parent Linkage Field |
|---|---|---|---|---|
| 1. Source Input | Raw WS / REST Frame | Authoritative | N/A | Origin Connection Contract |
| 2. Candle | `Candle` | Authoritative | `timestamp` | `CandleStore` symbol/timeframe |
| 3. ICT Event | `ICTEvent` | Derived | `id` | `candleIndex` & `timestamp` |
| 4. CandidateContext | `CandidateContext` | Derived | `id` | `sourceCandleTimestamps` & `supportingEvents` |
| 5. MTF Relation | `MultiTimeframeContext` | Derived | `id` | `sourceEventIds` & `sourceCandleTimestamps` |
| 6. VisualObject | `VisualObject` | Derived | `id` | Originating Event / Swing ID |
| 7. Diagnostics | `RuntimeProvenanceMetadataPayload` | Observational | N/A | `MarketDataAdapter` / `CandleStore` |
