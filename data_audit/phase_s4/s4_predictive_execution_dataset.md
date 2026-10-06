# Phase S4 — Predictive Execution Dataset Summary

## 1. Expanded Analytical Population Overview (N=967)

| Predictive ID | Signal ID | Symbol | Timeframe | Model | Direction | Horizon | Ref Price ($) | MFE (Pts) | MAE (Pts) | Outcome State | Overlap Status | Session ID | Provenance Context |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `PRED-SIG-MODEL_A-NQ-5m-H1` | `SIG-MODEL_A-NQ-5m` | NQ | 5m | MODEL_A | LONG | H1 | 18110.0 | +30.0 | -5.0 | FAVORABLE | NON_OVERLAPPING | SESSION-001 | `ctx_NQ_5m_1700000000000` |
| `PRED-SIG-MODEL_B-MNQ-1m-H1` | `SIG-MODEL_B-MNQ-1m` | MNQ | 1m | MODEL_B | LONG | H1 | 18125.0 | +25.0 | -5.0 | FAVORABLE | OVERLAPPING (GRP-101) | SESSION-001 | `ctx_MNQ_1m_1700000000000` |

## 2. Sample Accounting Chain
```text
AVAILABLE OBSERVATIONS = 967
→ CANDIDATE SIGNAL OBSERVATIONS = 967
→ VALID SIGNAL OBSERVATIONS = 967
→ OBSERVATIONS WITH SUFFICIENT FUTURE DATA = 966
→ OBSERVATIONS EXCLUDED FOR PREDEFINED REASONS = 0
→ FINAL ANALYTICAL SAMPLE = 967 (966 Valid Outcomes + 1 Insufficient Data)
```
