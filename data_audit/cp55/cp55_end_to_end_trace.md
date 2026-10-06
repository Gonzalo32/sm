# CP55 — End-to-End Traceability Table Report

## 1. Complete Canonical Trace TRACE-01

| Stage | Entity ID | Source ID | Symbol | TF | Timestamp | Authority | Status |
|---|---|---|---|---|---|---|---|
| Source Input | `TradeSea_WS` | N/A | NQ | 1m | 100000 | Authoritative | INGESTED |
| Candle | `100000` | `TradeSea_WS` | NQ | 1m | 100000 | Authoritative | ACTIVE |
| ICT Event | `evt_BOS_100000` | `100000` | NQ | 1m | 100000 | Derived | VERIFIED |
| CandidateContext | `ctx_NQ_1m_100000` | `100000` | NQ | 1m | 100000 | Derived | CONTEXT_CONFIRMED |
| MTF | `mtf_NQ_15m_5m_100000` | `ctx_NQ_15m_100000` | NQ | 5m | 160000 | Derived | CONFIRMED |
| Visual | `VIS-sw_1` | `ctx_NQ_1m_100000` | NQ | 1m | 100000 | Derived | RENDERED |
| Diagnostic | Metadata Payload | `MarketDataAdapter` | NQ | 1m | 100000 | Observational | CONNECTED |
