# Phase S3 — Baseline Dataset Summary

## 1. Unconditional Market Baseline Observations

| Baseline ID | Symbol | Timeframe | Horizon | Session Timestamp | Ref Price ($) | Baseline MFE (Pts) | Baseline MAE (Pts) | Baseline Net Delta | Sampling Methodology |
|---|---|---|---|---|---|---|---|---|---|
| `BASE-NQ-5m-1700000240000-H1` | NQ | 5m | H1 | 1700000240000 | 18110.0 | +12.0 | -10.0 | +2.0 | Unconditional Matched Timestamp |
| `BASE-MNQ-1m-1700000180000-H1` | MNQ | 1m | H1 | 1700000180000 | 18125.0 | +8.0 | -8.0 | 0.0 | Unconditional Matched Timestamp |

## 2. Sampling Discipline
- Baseline observations are sampled at identical session timestamps without selecting convenient non-signal periods.
- Prevents control group bias.
