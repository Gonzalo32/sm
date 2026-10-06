# S6 — Cost Break-Even Friction Analysis

## 1. Overview

This document presents the descriptive cost break-even calculation.

Break-even friction ($F_{\text{be}}$) represents the maximum total round-turn transaction friction (price spread + slippage + commission equivalent) that the historical gross movement can tolerate before net expectancy drops to exactly zero ($\text{Net Expectancy} = 0$).

This calculation is purely descriptive and was NOT used to tune execution parameters (`COST_SELECTION_AFTER_RESULTS = NO`).

---

## 2. Break-Even Formula & Numerical Results

For a scenario with gross mean move $\mu_{\text{gross}}$:

$$F_{\text{be}} = \mu_{\text{gross}}$$

### Aggregate Execution Stream:
* **Gross Mean Move ($\mu_{\text{gross}}$)**: `+21.50` index points ($43.00 USD on MNQ / $430.00 USD on NQ)
* **Break-Even Friction Points ($F_{\text{be}}$)**: `21.50` index points (86 ticks)
* **Break-Even Friction USD (MNQ)**: `$43.00` USD per round turn
* **Break-Even Friction USD (NQ)**: `$430.00` USD per round turn

---

## 3. Comparison with Baseline Market Friction

| Scenario | Total Friction Points | Total Friction USD (MNQ) | Total Friction USD (NQ) | Break-Even Multiplier ($F_{\text{be}} / F_{\text{scenario}}$) |
| :--- | :--- | :--- | :--- | :--- |
| **LOW_FRICTION** | $0.50$ pt | $\$2.24$ | $\$14.10$ | $43.0 \times$ |
| **BASE_FRICTION** | $1.00$ pt | $\$3.24$ | $\$24.10$ | $21.5 \times$ |
| **HIGH_FRICTION** | $2.00$ pt | $\$6.00$ | $\$45.00$ | $10.75 \times$ |

---

## 4. Break-Even Robustness Conclusion

The historical gross movement can tolerate up to **$21.50$ index points** ($86$ ticks) of total round-turn friction before net expectancy is eliminated. Because realistic baseline friction is **$1.00$ index point** ($4$ ticks) and high friction is **$2.00$ index points** ($8$ ticks), the strategy hypothesis is **economically robust** and not fragile to execution friction.
