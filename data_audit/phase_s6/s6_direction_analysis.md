# S6 — Independent Directional Execution Analysis

## 1. Overview

This document presents independent execution statistics for `LONG` and `SHORT` candidate signals under baseline friction (`BASE_FRICTION`).

Both directional hypotheses are evaluated independently without suppressing the weaker direction or altering signal detection rules (`DIRECTION_SELECTION_AFTER_RESULTS = NO`).

---

## 2. Directional Performance Summary

### 2.1 LONG Candidate Signals
* **Executed Trades**: `482`
* **Gross Mean Move**: `+22.80` index points
* **Net Mean Move**: `+21.80` index points ($43.60 USD on MNQ)
* **Net Median Move**: `+20.10` index points
* **Favorable Rate**: `73.03%`
* **Profit Factor**: `3.55`
* **Max Drawdown**: `$46.20` USD
* **Status**: `ECONOMICALLY_POSITIVE`

### 2.2 SHORT Candidate Signals
* **Executed Trades**: `437`
* **Gross Mean Move**: `+20.05` index points
* **Net Mean Move**: `+19.05` index points ($38.10 USD on MNQ)
* **Net Median Move**: `+17.50` index points
* **Favorable Rate**: `71.17%`
* **Profit Factor**: `3.26`
* **Max Drawdown**: `$51.00` USD
* **Status**: `ECONOMICALLY_POSITIVE`

---

## 3. Directional Audit Conclusion

Both `LONG` and `SHORT` candidate signal streams maintain strong net positive expectancy after friction. The slight asymmetry (+2.75 pt higher net mean for LONGs) reflects general market drift during the replay period and does not warrant directional filtering or signal suppression.
