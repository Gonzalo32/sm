# Phase S3 — Predictive Dataset Summary

## 1. Predictive Observations

| Predictive ID | Signal ID | Symbol | Timeframe | Model | Direction | Horizon | Ref Price ($) | MFE (Pts) | MAE (Pts) | Final Move (Pts) | Classification | Provenance Context |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `PRED-SIG-MODEL_A-NQ-5m-H1` | `SIG-MODEL_A-NQ-5m` | NQ | 5m | MODEL_A | LONG | H1 | 18110.0 | +30.0 | -5.0 | +25.0 | FAVORABLE | `ctx_NQ_5m_1700000000000` |
| `PRED-SIG-MODEL_B-MNQ-1m-H1` | `SIG-MODEL_B-MNQ-1m` | MNQ | 1m | MODEL_B | LONG | H1 | 18125.0 | +25.0 | -5.0 | +20.0 | FAVORABLE | `ctx_MNQ_1m_1700000000000` |

## 2. Integrity Invariants
- **S1 and S2 Unmodified**: Read-only source consumption.
- **100% Provenance Linkage**: Fully traceable to CandidateContext and source events.
- **No Profitability Claims**: Excursions are pure price delta measurements.
