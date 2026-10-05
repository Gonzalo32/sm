# CP41.1 — REALTIME PROVENANCE CLASSIFICATION MATRIX

## 1. PROVENANCE CATEGORIZATION TABLE

| Data Feed / Subsystem Layer | Classification Category | Evidence Source / File Path | Validation Details |
|---|---|---|---|
| **Live WebSocket Feed** | `OBSERVED LIVE` | Realtime TradeSea WS stream capture | Observed live streaming ticks on dashboard during CP34/CP36 session audit. |
| **Captured Message Fixtures** | `CAPTURED/FIXTURE` | `/data_audit/cp34/` & `/data_audit/cp35/` | JSON trace files recording captured WebSocket frame payloads. |
| **Synthetic Realtime Stream** | `SYNTHETIC` | `tests/checkpoint38_realtime_stability.test.ts` & `tests/checkpoint40_causal_lineage.test.ts` | Deterministic synthetic candle streams used for 100% reproducible test suites. |
| **Realtime Transport Code** | `CODE INSPECTION` | `extension/content/ICTPipelineCoordinator.ts` & `pageBridge.js` | Source code analysis verifying isolated world listener setup and payload parsing. |
| **Rithmic Direct WS Driver** | `NOT TESTED` | N/A | Rithmic direct socket connection was not executed in live environment. |

```text
PROVENANCE_CLASSIFICATION_SUMMARY:
- OBSERVED LIVE       : TradeSea WebSocket Dashboard Stream
- CAPTURED/FIXTURE    : CP34/CP35 JSON trace files
- SYNTHETIC           : Vitest suite synthetic streams
- CODE INSPECTION     : Chrome extension pipeline bridge
- NOT TESTED          : Rithmic direct driver
```
Code inspection is strictly classified under `CODE INSPECTION` and is NOT treated as `OBSERVED LIVE`.
