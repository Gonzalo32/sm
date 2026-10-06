# Phase S1 — Signal Dataset Summary

## 1. Generated Candidate Signal Records

| Signal ID | Symbol | Timeframe | Model | Direction | Signal State | Confirmation Timestamp | Candidate Context ID | Source Event IDs | Signal Reasons | Validation Status |
|---|---|---|---|---|---|---|---|---|---|---|
| `SIG-MODEL_A-NQ-5m-1700000240000` | NQ | 5m | MODEL_A | LONG | LONG_CANDIDATE | 1700000240000 | `ctx_NQ_5m_1700000000000` | `EVT-SWEEP`, `EVT-MSS`, `EVT-FVG` | SSL Sweep, Bullish MSS, Bullish FVG | VALID |
| `SIG-MODEL_B-MNQ-1m-1700000180000` | MNQ | 1m | MODEL_B | LONG | LONG_CANDIDATE | 1700000180000 | `ctx_MNQ_1m_1700000000000` | `EVT-SWEEP`, `EVT-DISP`, `EVT-FVG` | SSL Sweep, Displacement, Bullish FVG | VALID |
| `SIG-NO_SIGNAL-MNQ-15m-1700000120000` | MNQ | 15m | UNATTRIBUTED | NEUTRAL | NO_SIGNAL | 1700000120000 | `ctx_MNQ_15m_empty` | None | No ICT model conditions met | VALID |

## 2. Dataset Constraints
- **Zero Profitability / Prediction Fields**: Excludes P&L, win rate, stop loss, take profit, risk-reward, or trade execution.
- **Explicit Candidate Terminology**: Uses `LONG_CANDIDATE`, `SHORT_CANDIDATE`, and `NO_SIGNAL`.
