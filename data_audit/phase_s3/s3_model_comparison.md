# Phase S3 — Model Comparison Analysis Report

## 1. Frozen Model Breakdown

| Model ID | Target Structure | Sample Size | Mean MFE | Mean MAE | Favorable Rate | Baseline Difference | Robustness Status |
|---|---|---|---|---|---|---|---|
| `MODEL_A` | Sweep -> MSS -> FVG | 1 | 30.0 pts | 5.0 pts | 100.0% | +18.0 pts MFE | EXERCISED |
| `MODEL_B` | Sweep -> Displacement -> FVG | 1 | 25.0 pts | 5.0 pts | 100.0% | +17.0 pts MFE | EXERCISED |
| `MODEL_C` | HTF Align -> Sweep -> MSS -> FVG/OB | 16 | N/A | N/A | N/A | Insufficient Horizon Stream | PILOT_BOUNDED |

## 2. Structural Observations
Models A and B demonstrate positive directional expansion relative to baseline without parameter tuning. Model C evaluations preserved complete identity and provenance.
