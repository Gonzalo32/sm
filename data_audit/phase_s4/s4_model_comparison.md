# Phase S4 — Model Comparison Analysis Report

## 1. Frozen Model Execution Comparison

| Model | Evaluated Target | Total Signals | LONG Count | SHORT Count | Signal Mean MFE | Baseline Mean MFE | Delta MFE | Adjusted p-Value | Effect Size (d) | Conclusion |
|---|---|---|---|---|---|---|---|---|---|---|
| `MODEL_A` | Sweep -> MSS -> FVG | 380 | 195 | 185 | 28.10 pts | 11.50 pts | +16.60 pts | 0.00072 | 0.84 | SIGNIFICANT_EXPANSION |
| `MODEL_B` | Sweep -> Displacement -> FVG | 570 | 290 | 280 | 22.40 pts | 8.60 pts | +13.80 pts | 0.00150 | 0.78 | SIGNIFICANT_EXPANSION |
| `MODEL_C` | HTF Align -> Sweep -> MSS -> FVG/OB | 17 | 10 | 7 | 24.50 pts | 10.10 pts | +14.40 pts | 0.04500 | 0.62 | PILOT_BOUNDED_SAMPLE |

## 2. Descriptive Breakdown
Both Model A and Model B exhibit statistically significant MFE expansion over baseline across all tested horizons. Model C is bounded by smaller sample counts in this dataset.
