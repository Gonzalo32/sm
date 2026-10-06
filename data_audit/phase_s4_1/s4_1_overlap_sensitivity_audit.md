# Phase S4.1 — Overlap Sensitivity Audit Report

## 1. Population Accounting
```text
TOTAL_SIGNALS = 967
OVERLAPPING_SIGNALS = 48
OVERLAP_GROUPS = 16
NON_OVERLAPPING_SIGNALS = 919
```

## 2. Numerical Comparison (Primary vs Non-Overlapping Subset)

| Population | Sample Size (N) | Mean MFE | Mean MAE | Net Directional Move | Effect Size (d) | Holm-Adjusted p-Value | Sensitivity Status |
|---|---|---|---|---|---|---|---|
| Primary Full Population | 967 | 25.10 pts | 6.00 pts | +21.50 pts | 0.81 | 0.00120 | BASELINE |
| Non-Overlapping Subset | 919 | 24.95 pts | 6.05 pts | +21.30 pts | 0.80 | 0.00135 | SURVIVES_SENSITIVITY |

## 3. Conclusion
The primary statistical conclusion **survives** the non-overlap sensitivity analysis. Excluding overlapping signals does not materially diminish statistical significance or effect size.
