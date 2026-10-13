# S9.3 — Out-of-Sample Robustness & Dependence Audit Report

## Executive Audit Summary & Verdict

This audit evaluates whether the positive out-of-sample (OOS) results reported in Phase S9 remain statistically credible under serial dependence, temporal structure, market-regime variation, and realistic evaluation constraints across the 200 canonical S9 trade records.

```text
S9_3_STATUS = PASS_WITH_LIMITATIONS

S9_3_CANONICAL_REPRODUCTION = VERIFIED
S9_3_DEPENDENCE_RISK = MATERIAL
S9_3_SELECTION_INDEPENDENCE = UNVERIFIED
S9_3_INDEPENDENT_MARKET_SAMPLE = INSUFFICIENT
S9_3_LIVE_TRADING_AUTHORIZED = NO
```

---

## 1. Absolute Baseline & Production Engine Immutability

* **Canonical Baseline Commit**: `57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a`
* **Verification Command**: `git diff 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a -- core/ict/`
* **Diff Line Count**: **`0 diff lines`**
* **Engine / Model Changes**: `NO`

---

## 2. Canonical S9 Dataset Reproduction Audit

The exact sealed dataset [`data_audit/phase_s9/s9_oos_trade_dataset.json`](file:///c:/Users/Administrador/Desktop/sm/data_audit/phase_s9/s9_oos_trade_dataset.json) was re-loaded and evaluated without altering, filtering, or modifying any records.

### Reproduction Results Table

| Metric | Published S9 Report | S9.3 Re-evaluated Audit | Reproduction Match |
| :--- | :---: | :---: | :---: |
| **Total Evaluated Trades ($N$)** | 200 | 200 | EXACT MATCH |
| **Winning Trades ($N_{\text{win}}$)** | 169 | 169 | EXACT MATCH |
| **Losing Trades ($N_{\text{loss}}$)** | 31 | 31 | EXACT MATCH |
| **Win Rate ($\%$)** | $84.50\%$ | $84.50\%$ | EXACT MATCH |
| **Total Net Points ($\text{pt}$)** | $+1805.25\text{ pt}$ | $+1805.25\text{ pt}$ | EXACT MATCH |
| **Mean Net Result ($\text{pt}$)** | $+9.03\text{ pt}$ | $+9.03\text{ pt}$ | EXACT MATCH |
| **Median Net Result ($\text{pt}$)** | $+7.50\text{ pt}$ | $+7.50\text{ pt}$ | EXACT MATCH |
| **Mean Gross Result ($\text{pt}$)** | $+10.03\text{ pt}$ | $+10.03\text{ pt}$ | EXACT MATCH |
| **Median Gross Result ($\text{pt}$)** | $+8.50\text{ pt}$ | $+8.50\text{ pt}$ | EXACT MATCH |
| **Standard Deviation Net ($\text{pt}$)** | $8.02\text{ pt}$ | $8.02\text{ pt}$ | EXACT MATCH |
| **Mean MFE ($\text{pt}$)** | $+12.68\text{ pt}$ | $+12.68\text{ pt}$ | EXACT MATCH |
| **Median MFE ($\text{pt}$)** | $+11.00\text{ pt}$ | $+11.00\text{ pt}$ | EXACT MATCH |
| **Mean MAE ($\text{pt}$)** | $-2.52\text{ pt}$ | $-2.52\text{ pt}$ | EXACT MATCH |
| **Median MAE ($\text{pt}$)** | $-2.50\text{ pt}$ | $-2.50\text{ pt}$ | EXACT MATCH |
| **Max Drawdown ($\text{pt}$)** | $8.25\text{ pt}$ | $8.25\text{ pt}$ | EXACT MATCH |
| **Primary Instrument / Contract** | `NQZ25` | `NQZ25` | EXACT MATCH |
| **Evaluation Timeframe** | `5m` | `5m` | EXACT MATCH |
| **Fixed Per-Trade Friction** | $1.00\text{ pt}$ | $1.00\text{ pt}$ | EXACT MATCH |

* Status: **`S9_3_CANONICAL_REPRODUCTION = VERIFIED`** (100% deterministic match of all published metrics).

---

## 3. Serial Dependence & Autocorrelation Audit

### A. Autocorrelation Function (ACF) Lags 1–20

Autocorrelation functions were computed for both **Net Returns** ($\text{pt}$) and **Binary Outcomes** ($\text{WIN}=+1, \text{LOSS}=-1$) across lags 1 to 20. The asymptotic 95% confidence bounds under independence are $\pm \frac{1.96}{\sqrt{200}} = \mathbf{\pm 0.1386}$.

| Lag | Net Return Autocorr ($r$) | Net Return 95% CI | Binary Outcome Autocorr ($r$) | Binary Outcome 95% CI | Significance Status |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | **`+0.7414`** | $[\pm 0.1386]$ | **`+0.0447`** | $[\pm 0.1386]$ | Return: SIGNIFICANT / Outcome: Non-sig |
| **2** | `+0.4988` | $[\pm 0.1386]$ | `+0.0076` | $[\pm 0.1386]$ | Return: SIGNIFICANT / Outcome: Non-sig |
| **3** | `+0.2796` | $[\pm 0.1386]$ | `-0.0270` | $[\pm 0.1386]$ | Return: SIGNIFICANT / Outcome: Non-sig |
| **4** | `+0.0827` | $[\pm 0.1386]$ | `-0.0617` | $[\pm 0.1386]$ | Non-significant |
| **5** | `-0.0911` | $[\pm 0.1386]$ | `-0.0963` | $[\pm 0.1386]$ | Non-significant |
| **10** | `-0.4357` | $[\pm 0.1386]$ | `-0.1415` | $[\pm 0.1386]$ | Return: SIGNIFICANT (Mean Reverting) |
| **15** | `-0.2483` | $[\pm 0.1386]$ | `-0.0805` | $[\pm 0.1386]$ | Return: SIGNIFICANT |
| **20** | `+0.0074` | $[\pm 0.1386]$ | `-0.0381` | $[\pm 0.1386]$ | Non-significant |

> [!WARNING]
> **Material Return Serial Autocorrelation ($r = 0.7414$ at Lag-1)**: Net returns exhibit strong positive serial autocorrelation up to lag 3. This is driven by continuous 5-minute candle evaluation during high-momentum price moves in a single session.

### B. Runs Test for Binary Outcome Independence (Wald-Wolfowitz)

* **Total Observed Runs ($R$)**: $51$
* **Expected Runs ($E[R]$)**: $53.39$
* **Variance of Runs ($Var(R)$)**: $13.53$
* **Standardized $Z$-Score**: **`-0.6498`**
* **Two-Tailed $p$-value**: **`0.5158`**
* **Longest Win Streak**: 9 trades
* **Longest Loss Streak**: 2 trades

* **Interpretation**: The binary WIN/LOSS outcome sequences do not reject the null hypothesis of randomness ($p = 0.5158$). However, return magnitude dependence remains high ($r=0.7414$).

### C. Return Quantiles & Outlier Concentration Risk

* **Quantiles of Net Return**:
  - Min: `-14.00 pt` | P10: `-1.00 pt` | P25: `+3.50 pt` | **Median**: `+7.50 pt` | P75: `+14.50 pt` | P90: `+21.00 pt` | Max: `+21.50 pt`
* **Winner Concentration Analysis**:
  - Total Net Return: `+1805.25 pt`
  - Top 1 Largest Winner (+21.50 pt): **`1.19%`** of total net return
  - Top 5 Largest Winners (+107.50 pt): **`5.95%`** of total net return
  - Top 10 Largest Winners (+214.25 pt): **`11.87%`** of total net return

* **Verdict on Concentration Risk**: LOW. Positive net return is distributed broadly across the 169 winning trades rather than being concentrated in a few outlier gains.

---

## 4. Chronological Non-Overlapping Block Partitioning

The 200 S9 trades were partitioned chronologically into **4 non-overlapping blocks of 50 trades each** without shuffling:

| Block ID | Trade Range | Start Timestamp (UTC) | End Timestamp (UTC) | Contract | Trades ($N$) | Win Rate | Total Net ($\text{pt}$) | Mean Net ($\text{pt}$) | Max Drawdown |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Block 1** | 1 – 50 | `2025-12-01T18:20:00Z` | `2025-12-01T22:25:00Z` | `NQZ25` | 50 | $84.0\%$ | $+430.75\text{ pt}$ | $+8.62\text{ pt}$ | $5.25\text{ pt}$ |
| **Block 2** | 51 – 100 | `2025-12-01T22:30:00Z` | `2025-12-02T02:35:00Z` | `NQZ25` | 50 | $84.0\%$ | $+459.00\text{ pt}$ | $+9.18\text{ pt}$ | $6.75\text{ pt}$ |
| **Block 3** | 101 – 150 | `2025-12-02T02:40:00Z` | `2025-12-02T06:45:00Z` | `NQZ25` | 50 | $84.0\%$ | $+398.25\text{ pt}$ | $+7.96\text{ pt}$ | $8.25\text{ pt}$ |
| **Block 4** | 151 – 200 | `2025-12-02T06:50:00Z` | `2025-12-02T10:55:00Z` | `NQZ25` | 50 | $86.0\%$ | $+517.25\text{ pt}$ | $+10.35\text{ pt}$ | $5.75\text{ pt}$ |

> [!NOTE]
> **Interpretation**: Performance across all 4 blocks is remarkably steady (win rate $84.0\% - 86.0\%$, mean net $+7.96\text{ pt}$ to $+10.35\text{ pt}$). However, because all 4 blocks belong to a single continuous 16.58-hour session replay (`NQZ25` on Dec 1–2, 2025), these blocks are **descriptive only** and cannot be treated as independent market regimes.

---

## 5. Dependence-Aware Uncertainty & Sample Sufficiency

1. **Valid Inference Methods**:
   - **Stationary / Circular Block Bootstrap**: Requires block size $b \ge 20$ trades to preserve lag 1–3 return dependence.
   - **Heteroskedasticity & Autocorrelation Consistent (HAC) Standard Errors**: Newey-West variance estimation.
   - **AR(1) Pre-Whitening Filter**: Fitting $r_t = \rho r_{t-1} + \epsilon_t$ prior to calculating standard error bounds.
2. **Invalid Inference Methods**:
   - **Standard i.i.d. Resampling**: Ignores lag-1 autocorrelation ($r = 0.7414$), resulting in understated variance.
   - **Episode Bootstrap & Leave-One-Episode-Out**: Invalid because $N_{\text{episodes}} = 1$.
3. **Sample Sufficiency Verdict**:
   - **`S9_3_INDEPENDENT_MARKET_SAMPLE = INSUFFICIENT`**
   - S9 represents 1 single continuous 16.58-hour market session replay. Cross-session variance cannot be established without multiple independent market days.

---

## 6. Out-of-Sample Provenance & Selection Independence Audit

* **Data Provenance**: Verified genuine real-market Databento CME futures data (`GLBX.MDP3`, `NQZ25`).
* **Selection Independence**: **`UNVERIFIED`**
* **Audit Statement**: Repository artifacts contain no timestamped pre-registration proof demonstrating that the Dec 1–2, 2025 evaluation session was chosen prior to inspecting market outcomes. While data records are real, selection independence remains unverified.

---

## 7. Artifact Manifest & Cryptographic Verification

All audit output artifacts are saved in [`data_audit/phase_s9_3/`](file:///c:/Users/Administrador/Desktop/sm/data_audit/phase_s9_3/):

* `s9_3_canonical_reproduction.json`
* `s9_3_return_dependence.json`
* `s9_3_temporal_blocks.json`
* `s9_3_uncertainty_audit.json`
* `s9_3_provenance_audit.json`
* `s9_3_metrics_summary.json`
* `s9_3_hash_manifest.json`
* `s9_3_artifact_manifest.md`

---

## 8. Final Governance Statement & Future Guidance

### Summary of What the Evidence Supports
1. **Flawless Mathematical Reproducibility**: The 200 S9 trade outcomes are 100% deterministically reproducible.
2. **Robust Point Distribution**: Net returns are not driven by outlier trades (top 10 winners contribute only $11.87\%$ of total net return).
3. **Internal Intra-Session Consistency**: All 4 sub-session blocks demonstrate steady positive expectancy ($+7.96\text{ pt}$ to $+10.35\text{ pt}$).

### Summary of What Remains Unproven
1. **Cross-Session Generalizability**: S9 covers only 1 continuous 16.58-hour session. Generalizability across varying volatility regimes, FOMC events, trend vs range days, and multi-month periods is unproven.
2. **Selection Independence**: Pre-registration proof of evaluation period selection is absent in repository artifacts.

### Minimum Guidance for Next Phase
Before live trading can be considered, the engine must be evaluated across **at least 30 to 50 independent calendar trading sessions** spanning multiple months, contract rolls, and market regimes, with pre-registered session boundaries.

```text
LIVE_TRADING_AUTHORIZED = NO
```
