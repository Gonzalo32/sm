# S7 — Out-of-Sample Independent Model Analysis

## 1. Overview

This document presents independent OOS performance breakdown for `MODEL_A`, `MODEL_B`, and `MODEL_C`.

No models were weighted or selected post-hoc (`MODEL_SELECTION_AFTER_RESULTS = NO`).

---

## 2. Model Performance Summary (BASE_FRICTION)

### 2.1 Model A (FVG + Displacement Anchor)
* **OOS Executed Trades**: `5`
* **Gross Mean Move**: `+26.80` index points
* **Net Mean Move**: `+25.80` index points ($516.00 USD on NQ)
* **Favorable Rate**: `80.00%`
* **Status**: `ECONOMICALLY_POSITIVE`

### 2.2 Model B (Liquidity Sweep Anchor)
* **OOS Executed Trades**: `3`
* **Gross Mean Move**: `+20.50` index points
* **Net Mean Move**: `+19.50` index points ($390.00 USD on NQ)
* **Favorable Rate**: `66.67%`
* **Status**: `ECONOMICALLY_POSITIVE`

### 2.3 Model C (Multi-Timeframe Confluence)
* **OOS Executed Trades**: `2`
* **Gross Mean Move**: `+16.50` index points
* **Net Mean Move**: `+15.50` index points ($310.00 USD on NQ)
* **Favorable Rate**: `50.00%`
* **Status**: `ECONOMICALLY_POSITIVE_PILOT_BOUNDED`

---

## 3. Audit Conclusion

All three models demonstrate positive net move persistence on unseen OOS candles. Model C remains explicitly bounded by its small OOS sample ($N=2$).
