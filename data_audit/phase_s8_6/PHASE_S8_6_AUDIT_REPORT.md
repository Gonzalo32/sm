# Phase S8.6 — Independent Real-Market Outcome Distribution & Statistical Robustness Audit Report

## EXECUTIVE SUMMARY

Phase S8.6 performs an independent statistical and temporal robustness audit of the 200 real-market trade outcomes established in Phase S8.5.

### Key Audit Metrics Summary

* **Production Engine Diff against `57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a`**: **0 diff lines** (`core/ict/` frozen)
* **Dataset Hash (SHA-256)**: `0474035057d66cec8104dbf63863d11c601295d4b6c7d3f431d04513f55b9a15`
* **Dataset Field Mismatches**: `0`
* **Temporal Stability**: Win rate across 4 chronological blocks ranges between **82.00% and 84.00%**
* **First Half vs Second Half Net**: First half mean net = `+19.16 pt`, Second half mean net = `+19.29 pt` ($\Delta = +0.13\text{ pt}$)
* **Outlier Sensitivity**: Mean excluding top 5% outcomes = `+18.56 pt` (vs full mean `+19.23 pt`), confirming edge is not driven by outliers
* **Statistical Significance**:
  * Mean Net $> 0$: $t = 18.46$ ($p < 0.001$)
  * Win Rate $> 50\%$: $z = 9.48$ ($p < 0.001$)
* **Trade Independence**: `0` consecutive entry overlaps, `0` forward window overlaps
* **Clustering Analysis**: 100 clusters at 15m window (98% positive clusters), 40 clusters at 60m window (100% positive clusters)

```text
S8_6_STATUS = PASS
S8_6_ROBUSTNESS_CLASSIFICATION = ROBUST_WITHIN_TESTED_SCOPE
```

---

## 1. TEMPORAL STABILITY

| Block | Trade Range | Wins / Losses | Win Rate | Mean Net (pt) | Median Net (pt) | Mean MFE (pt) | Mean MAE (pt) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Block 1** | Trades 1–50 | 41 / 9 | 82.00% | +18.79 | +24.75 | +26.77 | -7.48 |
| **Block 2** | Trades 51–100 | 42 / 8 | 84.00% | +19.54 | +26.00 | +27.59 | -7.55 |
| **Block 3** | Trades 101–150 | 42 / 8 | 84.00% | +19.01 | +24.75 | +26.85 | -7.34 |
| **Block 4** | Trades 151–200 | 42 / 8 | 84.00% | +19.57 | +25.00 | +27.49 | -7.42 |

---

## 2. OUTLIER DIAGNOSTICS & EXPECTANCY

* **Full Dataset Net Mean**: `+19.23 pt`
* **Trimmed Net Mean (Excluding Top 5%)**: `+18.56 pt`
* **Trimmed Net Mean (Excluding Bottom 5%)**: `+21.08 pt`
* **Average Win**: `+25.26 pt`
* **Average Loss**: `-11.29 pt`
* **Expectancy per Trade**: `+19.23 pt`
* **Max Drawdown**: `18.00 pt`
* **Max Loss Streak**: `2` (vs expected IID Bernoulli `2.84`)

---

## 3. MODEL & DIRECTION BREAKDOWN

### Model Performance

* **Model A** ($N=67$): Win Rate `83.58%`, Mean Net `+20.28 pt`, 95% CI `[72.94%, 90.58%]`
* **Model B** ($N=67$): Win Rate `83.58%`, Mean Net `+19.22 pt`, 95% CI `[72.94%, 90.58%]`
* **Model C** ($N=66$): Win Rate `83.33%`, Mean Net `+18.17 pt`, 95% CI `[72.57%, 90.43%]`

### Directional Symmetry

* **LONG** ($N=100$): Win Rate `83.00%`, Mean Net `+19.16 pt`
* **SHORT** ($N=100$): Win Rate `84.00%`, Mean Net `+19.29 pt`

---

## 4. GOVERNANCE STATEMENT

> S8.6 evaluates the statistical and temporal robustness of the observed S8.5 real-market outcome sample. It does not establish future profitability, live execution performance, or generalization beyond the tested dataset.
