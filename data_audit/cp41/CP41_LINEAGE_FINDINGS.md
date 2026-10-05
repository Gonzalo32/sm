# CP41 — LINEAGE AUDIT FINDINGS & CLASSIFICATION REPORT

## 1. ADVERSARIAL AUDIT FINDINGS REGISTRY

| Finding ID | Component | Reproducible Evidence | Expected Result | Observed Result | Severity | Status |
|---|---|---|---|---|---|---|
| `F-CP41-01` | `MultiTimeframeContextEngine` | Future HTF confirmation ($t_{\text{conf}} > t_{\text{ev}}$) | Reject relation (`causal = false`, `NO_CONTEXT`) | Rejected strictly (`causal = false`, `NO_CONTEXT`) | `HIGH` | **VERIFIED** |
| `F-CP41-02` | `MultiTimeframeContextEngine` | Exact boundary HTF confirmation ($t_{\text{conf}} === t_{\text{ev}}$) | Accept relation (`causal = true`) | Accepted strictly (`causal = true`) | `INFO` | **VERIFIED** |
| `F-CP41-03` | `CandidateContextEngine` | Simultaneous events on same timestamp | Indexed supporting events without collision | Supporting events array populated without ID collision | `MEDIUM` | **VERIFIED** |
| `F-CP41-04` | `CandleStore` | Ingestion of late past tick | Reject out-of-order tick, preserve closed bar | Returned `success = false`, closed bar unmodified | `HIGH` | **VERIFIED** |
| `F-CP41-05` | `CandleStore` | Duplicate tick stream for active candle | In-place update, constant array size | Array length constant, open price preserved | `MEDIUM` | **VERIFIED** |
| `F-CP41-06` | `CandleStore` | Symbol / Timeframe context switch | Clear store memory, prevent cross-leakage | Memory cleared (`candleCount = 0`) | `HIGH` | **VERIFIED** |
| `F-CP41-07` | `VisualAdapter` | Visual object presentation | Presentation capping via `maxVisibleObjects` | Array capped to `maxVisibleObjects` | `MEDIUM` | **VERIFIED** |

```text
CRITICAL_DEFECTS_FOUND = 0
HIGH_DEFECTS_FOUND     = 0
MEDIUM_DEFECTS_FOUND   = 0
LOW_DEFECTS_FOUND      = 0
```
All tested adversarial conditions match expected system behavior under existing contracts.
