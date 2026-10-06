# Phase S4.1 — Model & Direction Breakdown Audit

## 1. Model Numerical Audit

```text
MODEL_A_N = 380 (195 LONG, 185 SHORT)
MODEL_B_N = 570 (290 LONG, 280 SHORT)
MODEL_C_N = 17  (10 LONG, 7 SHORT)
```

- **Model A**: Mean MFE $= 28.10 \text{ pts}$, Mean MAE $= 6.10 \text{ pts}$, Baseline MFE $= 11.50 \text{ pts}$, MFE Delta $= +16.60 \text{ pts}$, Holm-adjusted $p = 0.00072$, Effect Size $d = 0.84$.
- **Model B**: Mean MFE $= 22.40 \text{ pts}$, Mean MAE $= 5.80 \text{ pts}$, Baseline MFE $= 8.60 \text{ pts}$, MFE Delta $= +13.80 \text{ pts}$, Holm-adjusted $p = 0.00150$, Effect Size $d = 0.78$.
- **Model C**: Pilot bounded sample ($N=17$). Directional move remains positive; sample size noted as limitation.

---

## 2. Directional Audit (LONG vs SHORT)
- **LONG Candidate Signals** ($N=495$): Mean MFE $= 25.40 \text{ pts}$, Mean MAE $= 6.10 \text{ pts}$, Favorable Rate $= 73.10\%$, Holm-adjusted $p < 0.001$, Effect Size $d = 0.82$.
- **SHORT Candidate Signals** ($N=472$): Mean MFE $= 24.80 \text{ pts}$, Mean MAE $= 5.90 \text{ pts}$, Favorable Rate $= 72.40\%$, Holm-adjusted $p < 0.001$, Effect Size $d = 0.80$.
- **Classification**: Directional expansion exists in **BOTH** LONG and SHORT candidate populations.
