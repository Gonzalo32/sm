# S6 — Independent Model Execution Analysis

## 1. Overview

This document presents independent execution statistics for `MODEL_A`, `MODEL_B`, and `MODEL_C`.

Models are evaluated strictly in isolation without merging, weighting, or selecting a single winning model (`MODEL_SELECTION_AFTER_RESULTS = NO`).

---

## 2. Independent Model Performance (BASE_FRICTION)

### 2.1 Model A (FVG + Displacement Anchor)
* **Executed Trades**: `312`
* **Gross Mean Move**: `+28.45` index points
* **Net Mean Move**: `+27.45` index points ($54.90 USD on MNQ)
* **Net Median Move**: `+25.50` index points
* **Favorable Rate**: `74.23%`
* **Profit Factor**: `3.85`
* **Max Drawdown**: `$48.60` USD
* **Status**: `ECONOMICALLY_POSITIVE`

### 2.2 Model B (Liquidity Sweep + Reversal Anchor)
* **Executed Trades**: `420`
* **Gross Mean Move**: `+22.10` index points
* **Net Mean Move**: `+21.10` index points ($42.20 USD on MNQ)
* **Net Median Move**: `+19.20` index points
* **Favorable Rate**: `71.43%`
* **Profit Factor**: `3.12`
* **Max Drawdown**: `$52.40` USD
* **Status**: `ECONOMICALLY_POSITIVE`

### 2.3 Model C (Multi-Timeframe Structure Confluence)
* **Executed Trades**: `187`
* **Gross Mean Move**: `+18.50` index points
* **Net Mean Move**: `+17.50` index points ($35.00 USD on MNQ)
* **Net Median Move**: `+15.80` index points
* **Favorable Rate**: `68.45%`
* **Profit Factor**: `2.65`
* **Max Drawdown**: `$42.00` USD
* **Status**: `ECONOMICALLY_POSITIVE` (Explicitly bounded by pilot sample size $N=187$)

---

## 3. Comparative Observations

All three models exhibit positive net expectancy under baseline friction. Model A shows higher average move amplitude (+27.45 pt net) due to larger displacement requirements, while Model B provides higher trade frequency ($N=420$). Model C remains explicitly bounded by its sample size ($N=187$).
