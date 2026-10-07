# S7 — Out-of-Sample Drawdown Analysis

## 1. Overview

This document presents hypothetical maximum drawdown calculations across friction scenarios (`LOW`, `BASE`, `HIGH`) for the 10 executed OOS trades under the single-position state rule.

All values assume 1 baseline unit per position.

---

## 2. OOS Drawdown Summary

### 2.1 Micro E-mini NQ (MNQ) Unit ($0.50/tick, $2.00/point)
* **LOW_FRICTION Max Drawdown**: `$35.00` USD ($17.50 index points)
* **BASE_FRICTION Max Drawdown**: `$42.00` USD ($21.00 index points)
* **HIGH_FRICTION Max Drawdown**: `$54.00` USD ($27.00 index points)

### 2.2 Standard E-mini NQ (NQ) Unit ($5.00/tick, $20.00/point)
* **LOW_FRICTION Max Drawdown**: `$350.00` USD ($17.50 index points)
* **BASE_FRICTION Max Drawdown**: `$420.00` USD ($21.00 index points)
* **HIGH_FRICTION Max Drawdown**: `$540.00` USD ($27.00 index points)

---

## 3. Findings

Maximum consecutive loss sequence on OOS data was 1 trade. Peak-to-trough drawdown remains strictly bounded and within the parameters observed in S6.
