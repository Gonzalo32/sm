# CP45 — BOUNDARY CONTRACT MATRIX AUDIT

## ARCHITECTURAL BOUNDARY CONTRACT MATRIX

| Boundary ID | Boundary Interface | Source Module | Target Module | Data Invariants | Aliasing Safety | Error Contract | Audit Status |
|---|---|---|---|---|---|---|---|
| **B01** | TradeSea WS $\rightarrow$ pageBridge | WebSocket | ContentScript Bridge | Preserves raw JSON fields | `SAFE_COPY` | Drop & log malformed msg | `VERIFIED` |
| **B02** | pageBridge $\rightarrow$ Adapter | pageBridge | MarketDataAdapter | Float precision, millisecond ts | `SAFE_COPY` | Reject missing required fields | `VERIFIED` |
| **B03** | Adapter $\rightarrow$ CandleStore | MarketDataAdapter | CandleStore | In-place OHLC tick update, dedupe | `SAFE_COPY` | Reject out-of-order past ticks | `VERIFIED` |
| **B04** | CandleStore $\rightarrow$ ICT Pipeline | CandleStore | ICTEngine | Preserves historical sequence | `SAFE_COPY` | Progressive buffer reset | `VERIFIED` |
| **B05** | ICT Pipeline $\rightarrow$ Context | ICTEngine | CandidateContextEngine | Stable context ID (`ctx_NQ_1m_<ts>`) | `SAFE_COPY` | Retains `status = NO_CONTEXT` | `VERIFIED` |
| **B06** | Context $\rightarrow$ MTF Engine | CandidateContext | MultiTimeframeContextEngine | HTF confTs $\le$ LTF evTs strictly | `SAFE_COPY` | `causal = false`, `NO_CONTEXT` | `VERIFIED` |
| **B07** | MTF Engine $\rightarrow$ Visual | MTF Engine | VisualAdapter | Derived visual shapes | `SAFE_COPY` | Non-authoritative output | `VERIFIED` |
| **B08** | ICT/Candidate $\rightarrow$ Visual | MarketState/Context | VisualAdapter | Shapes capped by `maxVisibleObjects` | `SAFE_COPY` | Zero domain state mutation | `VERIFIED` |

---

## FIELD CLASSIFICATION SUMMARY

* **PRESERVED**: `timestamp`, `open`, `high`, `low`, `close`, `volume`, `symbol`, `timeframe`
* **TRANSFORMED**: Raw JSON string $\rightarrow$ Structured TypeScript Object
* **GENERATED**: CandidateContext ID, MTF Relation ID, VisualObject ID
* **DROPPED**: Zero required fields dropped
* **OPTIONAL**: `timezone`, `expirationStatus`
