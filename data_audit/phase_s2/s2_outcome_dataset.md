# Phase S2 — Outcome Dataset Summary

## 1. Outcome Records Overview

| Outcome ID | Signal ID | Symbol | Timeframe | Model | Direction | Horizon | Ref Price ($) | Max Price ($) | Min Price ($) | Outcome State | Delta (Pts) | Provenance Context |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `OUTCOME-SIG-MODEL_A-NQ-5m-H1` | `SIG-MODEL_A-NQ-5m` | NQ | 5m | MODEL_A | LONG | H1 | 18110.0 | 18140.0 | 18105.0 | FAVORABLE | +30.0 | `ctx_NQ_5m_1700000000000` |
| `OUTCOME-SIG-MODEL_B-MNQ-1m-H1` | `SIG-MODEL_B-MNQ-1m` | MNQ | 1m | MODEL_B | LONG | H1 | 18125.0 | 18150.0 | 18120.0 | FAVORABLE | +25.0 | `ctx_MNQ_1m_1700000000000` |
| `OUTCOME-SIG-NO_SIGNAL-MNQ-15m-H1` | `SIG-NO_SIGNAL-MNQ-15m` | MNQ | 15m | UNATTRIBUTED | NEUTRAL | H1 | 18002.0 | 18002.0 | 18002.0 | INSUFFICIENT_DATA | 0.0 | `ctx_MNQ_15m_empty` |

## 2. Integrity & Selection Bias Invariants
- **100% Provenance Linkage**: Every outcome connects directly back to its S1 CandidateContext.
- **Zero Profitability Claims**: No win rates as trading strategy, P&L, stop loss, take profit, or risk-reward ratios are evaluated.
- **Strict Anti-Lookahead**: All outcome candle windows start strictly at `timestamp > confirmationTimestamp`.
