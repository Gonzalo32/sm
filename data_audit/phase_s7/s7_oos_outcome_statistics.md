# S7 — Out-of-Sample Outcome Statistics

## 1. Overview

This document presents the primary outcome metrics (MFE, MAE, Directional Move) measured on OOS candidate signals using the frozen S2 outcome protocol.

---

## 2. OOS Outcome Metrics Summary (Horizon H1 to H20)

* **OOS Observations**: `12`
* **Mean MFE**: `+22.40` index points ($44.80 USD on MNQ / $448.00 USD on NQ)
* **Median MFE**: `+20.50` index points
* **Mean MAE**: `6.10` index points ($12.20 USD on MNQ / $122.00 USD on NQ)
* **Median MAE**: `5.20` index points
* **Mean Directional Move**: `+19.80` index points
* **Favorable Outcome Rate**: `75.00%` ($N=9$)
* **Adverse Outcome Rate**: `16.67%` ($N=2$)
* **Neutral Outcome Rate**: `8.33%` ($N=1$)

---

## 3. Comparison with In-Sample (S4.1) Baseline

| Metric | S4.1 In-Sample Baseline (N=967) | S7 Out-of-Sample Result (N=12) | Persistence Status |
| :--- | :--- | :--- | :--- |
| **Mean MFE** | $+25.10$ pt | $+22.40$ pt | `PERSISTENT` |
| **Mean MAE** | $6.00$ pt | $6.10$ pt | `STABLE` |
| **Mean Directional Move** | $+21.50$ pt | $+19.80$ pt | `PERSISTENT` |
| **Favorable Rate** | $74.23\%$ | $75.00\%$ | `STABLE` |

---

## 4. Statistical Power Statement

```text
OOS_STATISTICAL_POWER = INSUFFICIENT_SAMPLE_DEPTH
```

While directional price expansion persists on OOS candles (+19.80 pt mean move), the OOS sample size ($N=12$ observations) is small. Results provide directional persistence support but cannot claim independent asymptotic statistical significance.
