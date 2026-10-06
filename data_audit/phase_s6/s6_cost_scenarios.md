# S6 — Cost Scenarios Rationale & Specification

## 1. Overview

This document specifies the empirical rationale, contract parameters, and friction calculations for the three predefined transaction-cost scenarios evaluated in Phase S6 (`LOW_FRICTION`, `BASE_FRICTION`, `HIGH_FRICTION`).

All cost scenarios were defined prior to calculating strategy performance. No cost parameters were selected post-hoc or adjusted to optimize historical net results.

---

## 2. Micro E-mini NQ Futures (MNQ) Cost Scenarios

Contract Specifications: `$0.25` tick size, `$0.50` USD tick value ($2.00 per index point).

### 2.1 LOW_FRICTION Scenario (MNQ)
* **Rationale**: Top-tier institutional or high-volume retail broker rate with tight liquid order book conditions.
* **Commission + Exchange Fees**: `$1.24` USD round-turn ($0.62 per side).
* **Spread**: `0.5` ticks ($0.125 index points / $0.25 USD).
* **Slippage**: `0.5` ticks ($0.125 index points / $0.25 USD).
* **Total Friction Points**: `0.50` index points ($0.125 spread + 2 $\times$ 0.125 slippage equivalent + fee equiv).
* **Total Friction USD**: `$2.24` USD per round-turn contract ($1.00 USD price friction + $1.24 USD fees).

### 2.2 BASE_FRICTION Scenario (MNQ)
* **Rationale**: Standard retail futures broker commission with normal bid-ask spread during regular trading hours (RTH).
* **Commission + Exchange Fees**: `$1.24` USD round-turn ($0.62 per side).
* **Spread**: `1.0` tick ($0.25 index points / $0.50 USD).
* **Slippage**: `1.0` tick ($0.25 index points / $0.50 USD).
* **Total Friction Points**: `1.00` index point ($0.25 spread + 2 $\times$ 0.25 slippage + fee equiv).
* **Total Friction USD**: `$3.24` USD per round-turn contract ($2.00 USD price friction + $1.24 USD fees).

### 2.3 HIGH_FRICTION Scenario (MNQ)
* **Rationale**: High-friction retail broker rate, wider overnight spreads, or fast market conditions with execution slippage.
* **Commission + Exchange Fees**: `$2.00` USD round-turn ($1.00 per side).
* **Spread**: `2.0` ticks ($0.50 index points / $1.00 USD).
* **Slippage**: `2.0` ticks ($0.50 index points / $1.00 USD).
* **Total Friction Points**: `2.00` index points ($0.50 spread + 2 $\times$ 0.50 slippage + fee equiv).
* **Total Friction USD**: `$6.00` USD per round-turn contract ($4.00 USD price friction + $2.00 USD fees).

---

## 3. Standard E-mini NQ Futures (NQ) Cost Scenarios

Contract Specifications: `$0.25` tick size, `$5.00` USD tick value ($20.00 per index point).

### 3.1 LOW_FRICTION Scenario (NQ)
* **Commission + Exchange Fees**: `$4.10` USD round-turn.
* **Spread**: `0.5` ticks ($0.125 points / $2.50 USD).
* **Slippage**: `0.5` ticks ($0.125 points / $2.50 USD).
* **Total Friction USD**: `$14.10` USD per round-turn contract ($10.00 USD price friction + $4.10 USD fees).

### 3.2 BASE_FRICTION Scenario (NQ)
* **Commission + Exchange Fees**: `$4.10` USD round-turn.
* **Spread**: `1.0` tick ($0.25 points / $5.00 USD).
* **Slippage**: `1.0` tick ($0.25 points / $5.00 USD).
* **Total Friction USD**: `$24.10` USD per round-turn contract ($20.00 USD price friction + $4.10 USD fees).

### 3.3 HIGH_FRICTION Scenario (NQ)
* **Commission + Exchange Fees**: `$5.00` USD round-turn.
* **Spread**: `2.0` ticks ($0.50 points / $10.00 USD).
* **Slippage**: `2.0` ticks ($0.50 points / $10.00 USD).
* **Total Friction USD**: `$45.00` USD per round-turn contract ($40.00 USD price friction + $5.00 USD fees).

---

## 4. Safeguards & Transparency

No zero-cost assumptions were permitted. All cost scenarios reflect explicit empirical fee schedules and bid-ask spread realities for CME futures contracts.
