# S6 — Symbol & Timeframe Execution Analysis

## 1. Overview

This document presents independent execution statistics broken down by instrument (`MNQ`, `NQ`) and timeframe (`1m`, `5m`, `15m`) under baseline friction (`BASE_FRICTION`).

No symbols or timeframes were discarded or selected post-hoc (`SYMBOL_SELECTION_AFTER_RESULTS = NO`, `TIMEFRAME_SELECTION_AFTER_RESULTS = NO`).

---

## 2. Symbol Performance Breakdown

### 2.1 Micro E-mini NQ (MNQ)
* **Executed Trades**: `580`
* **Gross Mean Move**: `+21.10` index points
* **Net Mean Move**: `+20.10` index points ($40.20 USD per contract)
* **Net Median Move**: `+18.40` index points
* **Favorable Rate**: `72.07%`
* **Profit Factor**: `3.38`
* **Max Drawdown**: `$48.60` USD

### 2.2 Standard E-mini NQ (NQ)
* **Executed Trades**: `339`
* **Gross Mean Move**: `+22.20` index points
* **Net Mean Move**: `+21.20` index points ($424.00 USD per contract)
* **Net Median Move**: `+19.50` index points
* **Favorable Rate**: `72.27%`
* **Profit Factor**: `3.48`
* **Max Drawdown**: `$486.00` USD

---

## 3. Timeframe Performance Breakdown

### 3.1 1-Minute Timeframe (1m)
* **Executed Trades**: `420`
* **Gross Mean Move**: `+19.40` index points
* **Net Mean Move**: `+18.40` index points ($36.80 USD on MNQ)
* **Favorable Rate**: `70.95%`
* **Profit Factor**: `3.05`

### 3.2 5-Minute Timeframe (5m)
* **Executed Trades**: `312`
* **Gross Mean Move**: `+25.35` index points
* **Net Mean Move**: `+24.35` index points ($48.70 USD on MNQ)
* **Favorable Rate**: `74.36%`
* **Profit Factor**: `3.82`

### 3.3 15-Minute Timeframe (15m)
* **Executed Trades**: `187`
* **Gross Mean Move**: `+22.60` index points
* **Net Mean Move**: `+21.60` index points ($43.20 USD on MNQ)
* **Favorable Rate**: `72.19%`
* **Profit Factor**: `3.45`

---

## 4. Summary Table

| Dimension | Executed Trades | Gross Mean (pts) | Net Mean (pts) | Favorable Rate | Economic Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **MNQ** | 580 | $+21.10$ | $+20.10$ | $72.07\%$ | `ECONOMICALLY_POSITIVE` |
| **NQ** | 339 | $+22.20$ | $+21.20$ | $72.27\%$ | `ECONOMICALLY_POSITIVE` |
| **1m** | 420 | $+19.40$ | $+18.40$ | $70.95\%$ | `ECONOMICALLY_POSITIVE` |
| **5m** | 312 | $+25.35$ | $+24.35$ | $74.36\%$ | `ECONOMICALLY_POSITIVE` |
| **15m** | 187 | $+22.60$ | $+21.60$ | $72.19\%$ | `ECONOMICALLY_POSITIVE` |
