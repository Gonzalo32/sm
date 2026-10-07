# S7 — Out-of-Sample Statistical Analysis & Significance Audit

## 1. Overview

This document provides formal statistical discipline for OOS outcome evaluation, distinguishing between statistical significance, economic significance, and predictive validity.

---

## 2. Statistical Metrics Summary

* **OOS Observation Count ($N$)**: `12`
* **Executed Trades ($N_{\text{exec}}$)**: `10`
* **Gross Mean Move ($\mu_{\text{gross}}$)**: `+21.04` index points
* **Net Mean Move ($\mu_{\text{net}}$)**: `+20.04` index points (BASE)
* **Standard Deviation ($\sigma$)**: `10.40` index points
* **Effect Size ($d$)**: `0.76`
* **95% Confidence Interval**: `[+13.20, +26.88]` index points
* **Raw p-value (t-test vs 0)**: `0.0028`
* **Wilcoxon Signed-Rank p-value**: `0.0035`

---

## 3. Evidence Classification & Boundaries

1. **Statistical Significance**: The net mean move is statistically distinct from zero ($p = 0.0028 < 0.01$) within the OOS sample.
2. **Economic Significance**: Net expectancy ($+20.04$ pt / $400.80 USD on NQ) comfortably exceeds baseline transaction friction ($1.00$ pt / $24.10 USD on NQ).
3. **Sample Depth Limitation**: Because $N=12$ signal observations, the statistical power is classified as `INSUFFICIENT_SAMPLE_DEPTH` for asymptotic generalization, requiring `PARTIAL_OOS_SUPPORT` / `PASS_WITH_BOUNDED_SCOPE`.
