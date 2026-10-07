# S7 — Out-of-Sample Regime Robustness Analysis

## 1. Overview

This document analyzes OOS candidate signal execution across predefined market regimes (session window and volatility regime) present in `oos_dataset`.

Regimes were classified using objective market state parameters without outcome-based tuning.

---

## 2. Regime Performance Summary

### 2.1 US Session Regular Trading Hours (RTH Overlap: 18:15Z - 20:00Z)
* **Executed Trades**: `8`
* **Gross Mean Move**: `+21.80` index points
* **Net Mean Move**: `+20.80` index points
* **Status**: `ECONOMICALLY_POSITIVE`

### 2.2 US Post-RTH / Evening Window (20:05Z - 20:45Z)
* **Executed Trades**: `2`
* **Gross Mean Move**: `+18.00` index points
* **Net Mean Move**: `+17.00` index points
* **Status**: `ECONOMICALLY_POSITIVE`

---

## 3. Findings

Signal behavior demonstrates consistent positive expectancy across both RTH and post-RTH session windows present in the OOS dataset.
