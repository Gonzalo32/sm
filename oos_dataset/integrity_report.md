# OOS Dataset Integrity Report

**Dataset ID**: `OOS_VALIDATION_DATASET_V1`  
**Dataset Version**: `1.0.0`  

---

## 1. OHLC Sanity Checks

| Check | Criterion | Result | Violations | Status |
| :--- | :--- | :---: | ---: | :---: |
| **High Bounds** | `high >= max(open, close)` | PASS | 0 | **VERIFIED** |
| **Low Bounds** | `low <= min(open, close)` | PASS | 0 | **VERIFIED** |
| **High vs Low** | `high >= low` | PASS | 0 | **VERIFIED** |
| **NaN / Null** | Zero missing numeric values | PASS | 0 | **VERIFIED** |
| **Infinite Values** | Zero infinity values | PASS | 0 | **VERIFIED** |
| **Negative Prices** | `open > 0, high > 0, low > 0, close > 0` | PASS | 0 | **VERIFIED** |

---

## 2. Continuity & Timestamp Spacing

| Timeframe | Expected Interval | Gaps Detected | Duplicates | Out-of-Order | Status |
| :---: | :---: | ---: | ---: | ---: | :---: |
| **NQ 5m** | 300,000 ms (5 min) | 0 | 0 | 0 | **PASS** |

Zero duplicates or out-of-order records found.
