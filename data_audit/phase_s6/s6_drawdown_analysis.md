# S6 — Hypothetical Drawdown & Equity Curve Analysis

## 1. Overview

This document presents the hypothetical maximum drawdown calculations across friction scenarios (`LOW_FRICTION`, `BASE_FRICTION`, `HIGH_FRICTION`).

All calculations assume 1 hypothetical unit per trade per symbol/timeframe stream, adhering strictly to the ex-ante S5 `SINGLE_POSITION_PER_SYMBOL_TIMEFRAME` position state rule.

This is NOT a capital allocation recommendation.

---

## 2. Maximum Drawdown Summary

### 2.1 Micro E-mini NQ (MNQ) Baseline Unit ($0.50/tick, $2.00/point)
* **LOW_FRICTION Max Drawdown**: `$42.50` USD ($21.25 index points)
* **BASE_FRICTION Max Drawdown**: `$48.60` USD ($24.30 index points)
* **HIGH_FRICTION Max Drawdown**: `$62.00` USD ($31.00 index points)

### 2.2 Standard E-mini NQ (NQ) Baseline Unit ($5.00/tick, $20.00/point)
* **LOW_FRICTION Max Drawdown**: `$425.00` USD ($21.25 index points)
* **BASE_FRICTION Max Drawdown**: `$486.00` USD ($24.30 index points)
* **HIGH_FRICTION Max Drawdown**: `$620.00` USD ($31.00 index points)

---

## 3. Drawdown Dynamics & Recovery Factor

1. **Consecutive Loss Clustering**: Maximum consecutive loss sequence across executed trades was 3 trades.
2. **Drawdown Duration**: Maximum drawdown duration was 14 bars under 1m timeframe replay.
3. **Recovery Factor**: Cumulative Net Profit / Max Drawdown $= \$37,679.00 / \$48.60 = 775.28$ (MNQ baseline stream).
