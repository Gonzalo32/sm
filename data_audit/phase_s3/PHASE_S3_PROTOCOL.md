# Phase S3 — Predictive Validation Protocol Specification

## 1. OBJECTIVE & SCOPE
Define the predictive evaluation protocol to determine whether frozen ICT candidate signals (`LONG_CANDIDATE`, `SHORT_CANDIDATE`) exhibit statistically measurable directional behavior relative to an unconditional baseline, preserving 100% data immutability and anti-lookahead causality.

---

## 2. FORMULAS & MATHEMATICAL SPECIFICATIONS

### Excursion Metrics
For reference price $P_{ref}$ (confirmation candle close) and forward horizon window candles $C_1 \dots C_N$:

#### Bullish Candidates (`LONG_CANDIDATE`):
- **Maximum Favorable Excursion (MFE)**: $\text{MFE} = \max(0, \max(P_{high}) - P_{ref})$
- **Maximum Adverse Excursion (MAE)**: $\text{MAE} = \max(0, P_{ref} - \min(P_{low}))$
- **Final Directional Move**: $\Delta P = P_{end} - P_{ref}$

#### Bearish Candidates (`SHORT_CANDIDATE`):
- **Maximum Favorable Excursion (MFE)**: $\text{MFE} = \max(0, P_{ref} - \min(P_{low}))$
- **Maximum Adverse Excursion (MAE)**: $\text{MAE} = \max(0, \max(P_{high}) - P_{ref})$
- **Final Directional Move**: $\Delta P = P_{ref} - P_{end}$

### Predefined Neutral Threshold
- **Noise Floor**: $\text{NEUTRAL\_THRESHOLD} = 0.50 \text{ points}$.
- If $\text{MFE} > 0.50$ and $\text{MFE} > \text{MAE} \implies \text{FAVORABLE}$.
- If $\text{MAE} > 0.50$ and $\text{MAE} > \text{MFE} \implies \text{ADVERSE}$.
- Otherwise $\implies \text{NEUTRAL}$.

---

## 3. PRIMARY BASELINE METHODOLOGY
- **Sampling Method**: `UNCONDITIONAL_MATCHED_TIMESTAMP_NON_SIGNAL_OBSERVATIONS`.
- Non-signal candle observations matched at identical session timestamps are evaluated across identical horizons ($H1 \dots H20$) to construct the unconditioned market movement distribution.

---

## 4. STATISTICAL TESTS & DEPENDENCE POLICIES
- **Primary Statistical Tests**: Two-sample t-test (parametric) and Mann-Whitney U test (non-parametric).
- **Multiple Comparison Policy**: Bonferroni-Holm adjustment across evaluated horizons and models.
- **Dependence / Overlap Policy**: Clustered standard errors by trading session; retains all legitimate signals while flagging overlap groups for sensitivity analysis.
- **Sample Selection Rule**: Untouched chronological stream expansion without post-hoc date or signal filtering.

---

## 5. INTERPRETATION BOUNDARIES
Even if statistically significant directional differences are observed, results MUST NOT be interpreted as trading profitability, strategy performance, or execution guarantees.
