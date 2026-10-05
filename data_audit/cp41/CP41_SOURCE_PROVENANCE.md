# CP41 — SOURCE PROVENANCE & REALTIME INTEGRATION REPORT

## 1. REALTIME DATA PIPELINE ROUTE
```text
TradeSea WebSocket
      ↓
pageBridge (Isolated World script execution)
      ↓
MarketDataAdapter (Ingestion, validation, reconnection management)
      ↓
CandleStore (In-memory time series storage)
```

## 2. COVERAGE & EVIDENTIARY AUDIT

| Stream Layer | Coverage Method | Provenance Status | Rationale / Evidence |
|---|---|---|---|
| **Synthetic Fixtures** | Unit / Integration Tests | `TEST_ONLY` | Used for deterministic regression tests in `tests/`. |
| **Captured Message Fixtures** | Data Audit Fixtures | `AUDIT_ONLY` | Historical sample captures in `/data_audit/cp34/` & `/cp35/`. |
| **Realtime Transport Code** | Code Inspection & Chrome Extension Build | `VERIFIED` | `extension/content/ICTPipelineCoordinator.ts` & `pageBridge.js`. |
| **Live WebSocket Stream** | Interactive Chrome Session (CP34 / CP36) | `OBSERVED` | Realtime TradeSea WS stream observed on dashboard. |

```text
REALTIME_PROVENANCE_STATUS = VERIFIED
```
