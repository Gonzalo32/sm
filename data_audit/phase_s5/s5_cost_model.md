# S5 — Execution Cost Model Specification

## 1. Overview

This document specifies the fixed execution cost parameters for Phase S6 downstream simulation.

No profitability claims are made in S5. The cost model serves strictly to specify the cost structure that will be evaluated during subsequent execution sensitivity analysis.

---

## 2. Fixed Contract Specifications & Friction Parameters

### E-mini NQ Futures (NQ)
* **Tick Size**: `$0.25` index points
* **Tick Value**: `$5.00` USD per contract per tick
* **Point Value**: `$20.00` USD per index point
* **Exchange Fee + Commission**: `$2.05` USD per contract per side ($4.10 round turn)
* **Default Baseline Spread**: `1.0` tick ($0.25 points / $5.00 per contract)
* **Default Baseline Slippage**: `1.0` tick ($0.25 points / $5.00 per contract)

### Micro E-mini NQ Futures (MNQ)
* **Tick Size**: `$0.25` index points
* **Tick Value**: `$0.50` USD per contract per tick
* **Point Value**: `$2.00` USD per index point
* **Exchange Fee + Commission**: `$0.62` USD per contract per side ($1.24 round turn)
* **Default Baseline Spread**: `1.0` tick ($0.25 points / $0.50 per contract)
* **Default Baseline Slippage**: `1.0` tick ($0.25 points / $0.50 per contract)

---

## 3. Net P&L Formula Specification (For Downstream S6 Use)

For a closed trade with entry price $P_{\text{entry}}$ and exit price $P_{\text{exit}}$:

$$\text{Gross Points} = \begin{cases} P_{\text{exit}} - P_{\text{entry}} & \text{if LONG} \\ P_{\text{entry}} - P_{\text{exit}} & \text{if SHORT} \end{cases}$$

$$\text{Friction Points} = \text{SpreadPoints} + (2 \times \text{SlippagePoints})$$

$$\text{Net Points} = \text{Gross Points} - \text{Friction Points}$$

$$\text{Net USD} = (\text{Net Points} \times \text{PointValue}) - \text{RoundTurnCommissions}$$

---

## 4. Cost Model Safeguards

* **Zero Optimization**: Cost parameters are fixed contract parameters, not adjusted to optimize results.
* **Conservative Baseline**: Baseline assumptions include non-zero spread and slippage. Favorable zero-cost assumptions are strictly prohibited.
