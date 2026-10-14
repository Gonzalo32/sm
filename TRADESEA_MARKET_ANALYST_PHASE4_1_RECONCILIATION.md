# TRADESEA MARKET ANALYST — PHASE 4.1: FORENSIC RESULTS RECONCILIATION

**Evaluation Date:** 2026-10-14  
**Auditor / Agent:** Antigravity Autonomous Coding Agent  
**Scope:** Strictly Read-Only Forensic Reconciliation of [`TRADESEA_MARKET_ANALYST_PHASE4_PREDICTIVE_VALIDATION_REPORT.md`](file:///c:/Users/Administrador/Desktop/sm/TRADESEA_MARKET_ANALYST_PHASE4_PREDICTIVE_VALIDATION_REPORT.md) and [`scratch/phase4_validation_results.json`](file:///c:/Users/Administrador/Desktop/sm/scratch/phase4_validation_results.json)  
**Governance Verdict:** **`RECONCILED_WITH_LIMITATIONS`**  
**Live Trading Authorization:** **STRICTLY_PROHIBITED** (Passive Visual Support Only)  
**Official S10 Capture Authorization:** **NOT_AUTHORIZED** (Protocol, Manifest, and Session State Intact)  

---

## 1. Executive Summary & Forensic Verdict

A strictly read-only forensic audit was performed on the Phase 4 predictive validation results and reporting artifacts. Every calculation, formula, metric, and outcome record was audited against the raw granular records in [`scratch/phase4_validation_results.json`](file:///c:/Users/Administrador/Desktop/sm/scratch/phase4_validation_results.json) and the underlying normalized market datasets.

### Final Governance Verdict: `RECONCILED_WITH_LIMITATIONS`

The arithmetical point totals reported in Phase 4 (+175.75 gross points, +150.75 baseline net points, +132.00 stress net points) reconcile directly with the 25 underlying forecast records. However, the audit revealed four substantial reporting discrepancies, one significant statistical formula discrepancy, and two fundamental dataset limitations that constrain the validity of the sample:

1. **Trade #25 Erroneously Pooled into Average Win Calculation:** The Phase 4 report states an Average Winning Move of **+89.25 pts** and a Realized Reward/Risk of **6.04**. Forensic inspection reveals that the validation script pooled Trade #25 (an `UNRESOLVED` boundary trade that ended at +17.50 pts) into the winning trades array (`netBasePts.filter(x => x > 0)`). Calculated strictly on genuine `TARGET_HIT` outcomes ($N = 4$), the true Average Win is **+107.19 pts** ($428.75 / 4$) and the true Realized Net R:R is **7.25** ($107.1875 / 14.775$).
2. **Formula Defect in Random-Walk Section 7 Net Expectancy:** Section 7 calculated theoretical empirical expectancy as $E[\text{Net}] = (0.160 \times 89.25) - (0.800 \times 14.78) = \mathbf{+2.46\text{ pts/trade}}$, omitting the $4.0\%$ probability weight of the unresolved trade ($0.160 + 0.800 = 0.960 \ne 1.000$). This calculation implies an aggregate net return of only $+61.40$ pts across 25 trades, creating an unexplained internal divergence from the empirical sample mean of **+6.03 pts/trade** ($+150.75$ pts).
3. **Synthetic Constant-Shift Data Replication in Historical Files (`cp33_7`):** The three CME contracts ingested from `data_audit/cp33_7/normalized/` (`mnqz25`, `mnqh26`, `mnqm26`) are not independent market periods. `mnqh26` was constructed by adding exactly **+400.00 points** to every OHLC bar of `mnqz25`, and `mnqm26` by adding exactly **+800.00 points** to every bar (with identical volumes). Consequently, Trades 1–6, Trades 7–12, and Trades 13–18 are three identical clones of the same market trajectory, artificially duplicating a single +117.75 pt winning trade three times ($353.25$ pts, or **79.2%** of all gross winning points).
4. **Zero Price Variance Between MNQ and NQ Datasets:** The 25 evaluated forecasts reported for MNQ and the 25 evaluated forecasts reported for NQ were executed on datasets with **0.00 price variance** across all 1,440 candles. The reported $N=25$ does not represent two distinct 25-trade samples totaling $N=50$; it represents the exact same 25 market episodes evaluated under two different ticker labels.
5. **Inverted Chronological Concatenation in Autocorrelation Analysis:** Due to array concatenation order in [`scratch/run_phase4_predictive_validation.ts`](file:///c:/Users/Administrador/Desktop/sm/scratch/run_phase4_predictive_validation.ts#L173), Trade #18 (from June 2026) was followed by Trade #19 (from March 2026), creating an inverted time jump of $-78$ days. Recomputing lag-1 autocorrelation in strict chronological order yields $\hat{\rho}_1 = -0.2511$ (compared to reported unsorted $-0.2426$).
6. **60-Bar Forced Advance Window:** The validator advanced the evaluation loop by `maxEvaluationCandles` (60 bars) rather than the actual bar of resolution. While this strictly guaranteed zero forward horizon overlap, it introduced an artificial 60-minute refractory period regardless of whether a setup resolved in 1 minute.

---

## 2. Check-by-Check Forensic Audit & Reconciliation

### Check 1: Instrument Sample Separation (MNQ vs NQ)
* **Question:** Does the reported $N=25$ refer to each instrument separately or to a combined sample?
* **Report Claim:** Section 4.1 presents parallel columns for MNQ ($N=25$) and NQ ($N=25$). The Executive Summary states $N=25$ non-overlapping scenarios across 4 sessions.
* **Forensic Finding:** In [`scratch/phase4_validation_results.json`](file:///c:/Users/Administrador/Desktop/sm/scratch/phase4_validation_results.json), `mnqForecasts` contains 25 records and `nqForecasts` contains 25 records. However, comparing the underlying data files:
  - `data_audit/cp33_7/normalized/mnq_mnqz25_normalized.json` vs `nq_nqz25_normalized.json`: **0 price differences** across 1,440 bars.
  - `data_audit/cp33_7/normalized/mnq_mnqh26_normalized.json` vs `nq_nqh26_normalized.json`: **0 price differences** across 1,440 bars.
  - `data_audit/cp33_7/normalized/mnq_mnqm26_normalized.json` vs `nq_nqm26_normalized.json`: **0 price differences** across 1,440 bars.
  - `data_audit/cp33_6/normalized/mnq_1m_reconciled_normalized.json` vs `nq_1m_reconciled_normalized.json`: **0 price differences** across 1,440 bars.
* **Conclusion:** The report claims independent evaluations, but because the input price series are 100% identical, the two samples are perfectly collinear clones. The total independent sample size is $N = 25$, **not** $N = 50$.

---

### Check 2: Recomputation of Outcomes for MNQ and NQ Separately
* **Method:** Every forecast in `scratch/phase4_validation_results.json` was parsed and grouped by `instrument`.
* **Empirical Granular Results (MNQ):**
  - Total records: 25
  - `TARGET_HIT`: 4 records (+117.75, +117.75, +117.75, +75.50 pts)
  - `INVALIDATION_HIT`: 20 records (losses ranging from -1.75 to -33.25 pts)
  - `UNRESOLVED`: 1 record (Trade #25, +17.50 pts)
  - `AMBIGUOUS_EVALUATION`: 0 records
  - `EXPIRED`: 0 records
* **Empirical Granular Results (NQ):**
  - Exactly identical to MNQ down to every timestamp, price, tick, and point excursion.
* **Verdict:** Recomputed granular outcomes match the reported totals across both instruments identically.

---

### Check 3: Reconciliation of Forecast Counts & State Classifications
Reconciliation of all discrete forecast counts against the report:

| State / Category | Granular JSON Count | Report Claim | Reconciled Status | Forensic Notes |
|---|---|---|---|---|
| **Evaluated Scenarios ($N$)** | 25 | 25 | **EXACT MATCH** | 24 resolved, 1 unresolved |
| **Target Hits (`TARGET_HIT`)** | 4 | 4 (16.0%) | **EXACT MATCH** | Trades #5, #11, #17, #21 |
| **Invalidation Hits (`INVALIDATION_HIT`)** | 20 | 20 (80.0%) | **EXACT MATCH** | 20 stop outs |
| **Ambiguous Hits (`AMBIGUOUS_EVALUATION`)** | 0 | 0 (0.0%) | **EXACT MATCH** | Zero intrabar target/stop collisions |
| **Expired Horizons (`EXPIRED`)** | 0 | 0 (0.0%) | **EXACT MATCH** | Zero 60-bar expirations without hit |
| **Unresolved Boundary Records** | 1 | 1 (4.0%) | **EXACT MATCH** | Trade #25 at session boundary (bar 9) |
| **Directional Accuracy ($Hits / (Hits + Inval)$)** | 4 / 24 = 16.67% | 16.7% | **EXACT MATCH** | Rounded to 1 decimal place |
| **Abstained Analyses (`NO_CLEAR_OPPORTUNITY`)** | 133 | 133 | **EXACT MATCH** | Verified across all 4 sessions |
| **Excluded Off-Hours Candles** | 8,392 | 8,392 | **EXACT MATCH** | 11,520 raw - 3,128 RTH = 8,392 |

---

### Check 4: Recalculation of Gross and Net Points under 0.00, 1.00, and 1.75 Pt Friction
* **Cost Convention:**
  - Gross Move: $0.00$ pt deduction.
  - Baseline Friction: $1.00$ pt deduction ($4 \times 0.25$ pt ticks per round turn).
  - Stress Friction: $1.75$ pt deduction ($7 \times 0.25$ pt ticks per round turn).
* **Mathematical Verification:**
  - **Gross Points:**
    $$\sum \text{Wins (4)} = 118.75 + 118.75 + 118.75 + 76.50 = +432.75\text{ pts}$$
    $$\sum \text{Losses (20)} = -275.50\text{ pts}$$
    $$\sum \text{Unresolved (1)} = +18.50\text{ pts}$$
    $$\text{Total Gross} = 432.75 - 275.50 + 18.50 = \mathbf{+175.75\text{ pts}}$$
    $$\text{Average Gross} = \frac{175.75}{25} = \mathbf{+7.03\text{ pts/trade}}$$
  - **Baseline Net Points (1.00 pt deduction per trade):**
    $$\text{Total Net Base} = 175.75 - (25 \times 1.00) = \mathbf{+150.75\text{ pts}}$$
    $$\text{Average Net Base} = \frac{150.75}{25} = \mathbf{+6.03\text{ pts/trade}}$$
  - **Stress Net Points (1.75 pt deduction per trade):**
    $$\text{Total Net Stress} = 175.75 - (25 \times 1.75) = 175.75 - 43.75 = \mathbf{+132.00\text{ pts}}$$
    $$\text{Average Net Stress} = \frac{132.00}{25} = \mathbf{+5.28\text{ pts/trade}}$$
* **Verdict:** Recomputations confirm that $+175.75$, $+150.75$, and $+132.00$ points are arithmetically exact.

---

### Check 5: Verification of Average Win, Average Loss, Realized R:R & Discrepancy Trace
* **Discrepancy Discovered:** The Phase 4 report states:
  - Average Winning Move: **+89.25 pts**
  - Average Losing Move: **-14.78 pts**
  - Realized Net Reward/Risk Ratio: **6.04**
* **Forensic Audit of Source Code:** In [`scratch/run_phase4_predictive_validation.ts`](file:///c:/Users/Administrador/Desktop/sm/scratch/run_phase4_predictive_validation.ts#L330):
  ```typescript
  const winBase = netBasePts.filter(x => x > 0);
  const lossBase = netBasePts.filter(x => x < 0);
  const avgWinBase = winBase.length > 0 ? winBase.reduce((a, b) => a + b, 0) / winBase.length : 0;
  const avgLossBase = lossBase.length > 0 ? Math.abs(lossBase.reduce((a, b) => a + b, 0) / lossBase.length) : 0;
  const realizedRR = avgLossBase > 0 ? avgWinBase / avgLossBase : 0;
  ```
  - The script filtered `netBasePts.filter(x => x > 0)`.
  - Trade #25 (`outcomeStatus: 'UNRESOLVED'`) had realized net baseline points of `+17.50`.
  - Consequently, `winBase` contained **5 elements**: $[+117.75, +117.75, +117.75, +75.50, +17.50]$.
  - Sum $= 446.25\text{ pts}$.
  - Reported Average Win $= 446.25 / 5 = \mathbf{+89.25\text{ pts}}$.
  - Reported Realized R:R $= 89.25 / 14.775 = \mathbf{6.04}$.
* **Rigorous Categorical Recalculation (Strictly on `TARGET_HIT` Trades):**
  - Target Hit Trades ($N = 4$): $[+117.75, +117.75, +117.75, +75.50]$
  - Sum of Target Hits $= 428.75\text{ pts}$.
  - **True Categorical Average Win:** $428.75 / 4 = \mathbf{+107.1875\text{ pts}} \approx \mathbf{+107.19\text{ pts}}$.
  - Invalidation Hit Trades ($N = 20$): Sum $= -295.50\text{ pts}$.
  - **True Categorical Average Loss:** $-295.50 / 20 = \mathbf{-14.775\text{ pts}} \approx \mathbf{-14.78\text{ pts}}$.
  - **True Categorical Realized R:R:** $\frac{107.1875}{14.775} = \mathbf{7.2546} \approx \mathbf{7.25}$.
* **Impact Assessment:** Pooling the unresolved terminal trade into the average winning move diluted the average win by $-17.94$ pts (from $+107.19$ down to $+89.25$) and reduced realized R:R from $7.25$ down to $6.04$. While both values surpass the preregistered threshold ($\ge 1.25$), reporting $+89.25$ as "Average Winning Move" when 4 of the 5 trades were $75.50$ to $117.75$ and the 5th was an unresolved mark-to-market exit is an accounting flaw.

---

### Check 6: Recalculation of Target-Hit Rate and 95% Confidence Intervals
* **Point Estimates:**
  - Full Sample ($N=25$): $4 / 25 = \mathbf{16.0\%}$ ($0.1600$).
  - Resolved Sample ($N=24$): $4 / 24 = \mathbf{16.67\%}$ ($0.1667$).
* **Recomputation of Confidence Intervals:**
  1. **Block Bootstrap (as reported in Phase 4):**
     - Reported: $[12.0\%, 24.0\%]$.
     - Derivation: With $N=25$, resampling generates integer hit counts of 3, 4, 5, or 6 hits ($3/25 = 12\%$, $6/25 = 24\%$).
  2. **Wilson Score Interval (Standard Analytical Method for Binomial Proportions):**
     - $k = 4, n = 25, z = 1.96$:
       $$\text{Center} = \frac{4 + \frac{1.96^2}{2}}{25 + 1.96^2} = \frac{5.9208}{28.8416} \approx 0.2053$$
       $$\text{Margin} = \frac{1.96}{28.8416}\sqrt{\frac{4 \times 21}{25} + \frac{1.96^2}{4}} \approx 0.1412$$
       $$\text{95% Wilson CI} = [\mathbf{6.41\%}, \mathbf{34.65\%}]$$
  3. **Clopper-Pearson Exact Binomial Interval (Conservative):**
     - For $k = 4, n = 25$:
       $$\text{95% Clopper-Pearson CI} = [\mathbf{4.54\%}, \mathbf{36.08\%}]$$
* **Verdict:** Regardless of the confidence interval methodology employed (Bootstrap $[12\%, 24\%]$, Wilson $[6.4\%, 34.7\%]$, or Clopper-Pearson $[4.5\%, 36.1\%]$), the upper bound remains far below the preregistered threshold of $\ge 52.0\%$. Criterion 1 definitively fails.

---

### Check 7: Verification of +150.75 Baseline Net Points and +6.03 Points per Trade
* **Complete Trade-by-Trade Summation (from `scratch/phase4_validation_results.json`):**

| # | Record Analysis ID | Contract | Direction | Status | Gross Pts | Net Base Pts | Cumulative Net Base |
|---|---|---|---|---|---|---|---|
| 1 | `ANL_MNQ_1m_1764614340000` | `MNQZ25` | `BEARISH` | `INVALIDATION_HIT` | -2.25 | -3.25 | -3.25 |
| 2 | `ANL_MNQ_1m_1764617940000` | `MNQZ25` | `BULLISH` | `INVALIDATION_HIT` | -12.50 | -13.50 | -16.75 |
| 3 | `ANL_MNQ_1m_1764682260000` | `MNQZ25` | `BULLISH` | `INVALIDATION_HIT` | -32.25 | -33.25 | -50.00 |
| 4 | `ANL_MNQ_1m_1764686820000` | `MNQZ25` | `BULLISH` | `INVALIDATION_HIT` | -1.75 | -2.75 | -52.75 |
| **5** | `ANL_MNQ_1m_1764619440000` | `MNQZ25` | `BEARISH` | **`TARGET_HIT`** | **+118.75** | **+117.75** | **+65.00** |
| 6 | `ANL_MNQ_1m_1764694020000` | `MNQZ25` | `BULLISH` | `INVALIDATION_HIT` | -31.00 | -32.00 | +33.00 |
| 7 | `ANL_MNQ_1m_1772390340000` | `MNQH26` | `BEARISH` | `INVALIDATION_HIT` | -2.25 | -3.25 | +29.75 |
| 8 | `ANL_MNQ_1m_1772393940000` | `MNQH26` | `BULLISH` | `INVALIDATION_HIT` | -12.50 | -13.50 | +16.25 |
| 9 | `ANL_MNQ_1m_1772458260000` | `MNQH26` | `BULLISH` | `INVALIDATION_HIT` | -32.25 | -33.25 | -17.00 |
| 10 | `ANL_MNQ_1m_1772462820000` | `MNQH26` | `BULLISH` | `INVALIDATION_HIT` | -1.75 | -2.75 | -19.75 |
| **11** | `ANL_MNQ_1m_1772390640000` | `MNQH26` | `BEARISH` | **`TARGET_HIT`** | **+118.75** | **+117.75** | **+98.00** |
| 12 | `ANL_MNQ_1m_1772470020000` | `MNQH26` | `BULLISH` | `INVALIDATION_HIT` | -31.00 | -32.00 | +66.00 |
| 13 | `ANL_MNQ_1m_1780339140000` | `MNQM26` | `BEARISH` | `INVALIDATION_HIT` | -2.25 | -3.25 | +62.75 |
| 14 | `ANL_MNQ_1m_1780342740000` | `MNQM26` | `BULLISH` | `INVALIDATION_HIT` | -12.50 | -13.50 | +49.25 |
| 15 | `ANL_MNQ_1m_1780407060000` | `MNQM26` | `BULLISH` | `INVALIDATION_HIT` | -32.25 | -33.25 | +16.00 |
| 16 | `ANL_MNQ_1m_1780411620000` | `MNQM26` | `BULLISH` | `INVALIDATION_HIT` | -1.75 | -2.75 | +13.25 |
| **17** | `ANL_MNQ_1m_1780339440000` | `MNQM26` | `BEARISH` | **`TARGET_HIT`** | **+118.75** | **+117.75** | **+131.00** |
| 18 | `ANL_MNQ_1m_1780418820000` | `MNQM26` | `BULLISH` | `INVALIDATION_HIT` | -31.00 | -32.00 | +99.00 |
| 19 | `ANL_MNQ_1m_1773599580000` | `MNQH26` | `BEARISH` | `INVALIDATION_HIT` | -3.00 | -4.00 | +95.00 |
| 20 | `ANL_MNQ_1m_1773603180000` | `MNQH26` | `BULLISH` | `INVALIDATION_HIT` | -26.25 | -27.25 | +67.75 |
| **21** | `ANL_MNQ_1m_1773693480000` | `MNQH26` | `BEARISH` | **`TARGET_HIT`** | **+76.50** | **+75.50** | **+143.25** |
| 22 | `ANL_MNQ_1m_1773671460000` | `MNQH26` | `BULLISH` | `INVALIDATION_HIT` | -0.75 | -1.75 | +141.50 |
| 23 | `ANL_MNQ_1m_1773676260000` | `MNQH26` | `BEARISH` | `INVALIDATION_HIT` | -1.00 | -2.00 | +139.50 |
| 24 | `ANL_MNQ_1m_1773679860000` | `MNQH26` | `BULLISH` | `INVALIDATION_HIT` | -5.25 | -6.25 | +133.25 |
| 25 | `ANL_MNQ_1m_1773687000000` | `MNQH26` | `BEARISH` | `UNRESOLVED` | +18.50 | +17.50 | **+150.75** |

* **Verification:** Final cumulative baseline net points equal **+150.75 pts**. Average points per trade equal $+150.75 / 25 = \mathbf{+6.03\text{ pts/trade}}$. Confirmed exact.

---

### Check 8: Investigation of the +132.00 Stress Friction Result
* **Verification:**
  - Stress friction deduction $= 1.75\text{ pts}$ per trade.
  - Across 25 trades, total stress friction $= 25 \times 1.75 = 43.75\text{ pts}$.
  - Subtracting from gross points: $+175.75 - 43.75 = \mathbf{+132.00\text{ pts}}$.
  - Alternatively, delta from baseline: $1.75 - 1.00 = 0.75\text{ pt}$ incremental deduction per trade.
  - Total incremental deduction $= 25 \times 0.75 = 18.75\text{ pts}$.
  - Total Stress Net $= 150.75 - 18.75 = \mathbf{+132.00\text{ pts}}$.
  - Stress Average per Trade $= 132.00 / 25 = \mathbf{+5.28\text{ pts/trade}}$.
* **Verdict:** The stress result uses the exact same 25 observations and applies a consistent, uniform friction deduction.

---

### Check 9: Inspection of Random-Walk Benchmark Calculation & Assumptions
* **Theoretical Model:** The benchmark models price as a continuous martingale random walk (Brownian motion without drift) bounded by two absorbing barriers: Target ($+T$) and Stop ($-S$).
  $$P(\text{Hit Target}) = \frac{S}{T + S}$$
  Using the report's inputs ($T = 89.25\text{ pts}, S = 14.78\text{ pts}$):
  $$P(\text{Hit Target}) = \frac{14.78}{89.25 + 14.78} = \frac{14.78}{104.03} \approx \mathbf{14.208\%} \approx 14.2\%$$
  Post-friction net payoff:
  - If Target hit: $+89.25 - 1.00 = +88.25\text{ pts}$
  - If Stop hit: $-(14.78 + 1.00) = -15.78\text{ pts}$
  - Expected Net Return:
    $$E[\text{Net}_{\text{RW}}] = (0.14208 \times 88.25) - (0.85792 \times 15.78) = 12.5386 - 13.5380 = \mathbf{-0.999\text{ pts/trade}} \approx \mathbf{-1.00\text{ pt/trade}}$$
* **Discrepancy in Section 7 Empirical Expectancy:**
  - Section 7 presented:
    $$E[\text{Net}] = (0.160 \times 89.25) - (0.800 \times 14.78) = 14.28 - 11.82 = \mathbf{+2.46\text{ pts/trade}}$$
  - **Forensic Errors:**
    1. Sum of weights $0.160 + 0.800 = 0.960 \ne 1.000$. The $4.0\%$ weight of the unresolved trade (+17.50 pts) was dropped.
    2. Multiplying $+2.46$ by 25 trades implies a total net gain of only $+61.40\text{ pts}$, contradicting the actual $+150.75\text{ pts}$ sample total.
    3. The author applied the pooled average win ($89.25$) which already included Trade #25, but weighted it by $0.16$ (representing only 4 trades), effectively throwing away $89.25$ points of gains from the numerator.
  - **Corrected Formulation for Sample Mean:**
    $$E[\text{Net}] = \left(\frac{4}{25} \times 107.1875\right) + \left(\frac{20}{25} \times (-14.775)\right) + \left(\frac{1}{25} \times 17.50\right) = 17.15 - 11.82 + 0.70 = \mathbf{+6.03\text{ pts/trade}}$$
    Or on resolved trades only ($N=24$):
    $$E[\text{Net}_{\text{Resolved}}] = \left(\frac{4}{24} \times 107.1875\right) - \left(\frac{20}{24} \times 14.775\right) = 17.8646 - 12.3125 = \mathbf{+5.55\text{ pts/trade}}$$

---

### Check 10: Autocorrelation Analysis, Inverted Ordering & Window Overlap

#### 10.1 Non-Overlapping Horizon Verification
The validator in [`scratch/run_phase4_predictive_validation.ts`](file:///c:/Users/Administrador/Desktop/sm/scratch/run_phase4_predictive_validation.ts#L279) executed:
```typescript
const advanceBars = Math.max(1, barsToRes);
i += advanceBars;
```
Because `MarketAnalystValidator.evaluateOutcome` set `evaluatedCandleCount: futureCandles.length` ($60$ bars), `advanceBars` was 60 on all trades.
* **Audit of Horizon Timestamps:**
  - Trade 1: Forecast 18:38, Invalidation hit 18:39. Next Forecast: 19:38 (60 mins later).
  - Trade 2: Forecast 19:38, Invalidation hit 20:27. Next Forecast: 13:30 next day.
  - Trade 5 (Big Win): Forecast 15:46, Target hit 16:25. Next Forecast: 16:46 (60 mins later).
* **Finding:** Zero forward bars were shared across any two trades. The non-overlapping constraint was 100% satisfied. The collapse of autocorrelation from $+0.7414$ (in S9.3) to negative values confirmed that S9.3's extreme positive serial correlation was purely a rolling-window overlap artifact.

#### 10.2 Inverted Chronological Concatenation Discrepancy
* In `scratch/run_phase4_predictive_validation.ts`, files were concatenated in this array order:
  1. `mnq_mnqz25_normalized.json` (Dec 1–2, 2025) $\to$ Trades 1–6
  2. `mnq_mnqh26_normalized.json` (Mar 1–2, 2026) $\to$ Trades 7–12
  3. `mnq_mnqm26_normalized.json` (Jun 1–2, 2026) $\to$ Trades 13–18
  4. `mnq_1m_reconciled_normalized.json` (Mar 15–16, 2026) $\to$ Trades 19–25
* **Inversion:** Trade 18 occurred on **2026-06-02T16:46:00Z**, followed immediately by Trade 19 on **2026-03-15T18:32:00Z**. This introduced a **$-78$ day backward time jump** in the series.
* **Autocorrelation Recomputation:**
  - **Reported (Unsorted Array Order):** $\hat{\rho}_1 = \mathbf{-0.2426}$, $\hat{\rho}_2 = -0.2201$, $\hat{\rho}_3 = -0.1817$.
  - **True Chronological Order:** Sorting trades strictly by `forecastTimestampMs`:
    $$\hat{\rho}_1 = \mathbf{-0.2511}, \quad \hat{\rho}_2 = -0.2167, \quad \hat{\rho}_3 = -0.1731$$
* **Impact:** Both values are within $\pm 0.20$ standard error ($\text{SE} \approx 1/\sqrt{25} = 0.20$). The qualitative conclusion stands: positive autocorrelation is eliminated, but negative serial correlation remains indistinguishable from zero noise on this sample size.

---

## 3. Forensic Discrepancy Register

| # | Item / Field | Report Value | Granular / Recomputed Value | Exact Records Involved | Impact on Governance Verdict |
|---|---|---|---|---|---|
| **D1** | **Average Winning Move** | `+89.25 pts` | `+107.19 pts` (Target Hits only) | `ANL_MNQ_1m_1773687000000` (Trade #25) erroneously pooled with Trades #5, #11, #17, #21 | Moderate: Understates average win by 17.94 pts and masks categorical purity |
| **D2** | **Realized Reward/Risk** | `6.04` | `7.25` (Target Hits vs Inval Hits) | Trades #1–#25 | Minor: Both 6.04 and 7.25 exceed criterion ($\ge 1.25$) |
| **D3** | **Section 7 Empirical Expectancy** | `+2.46 pts/trade` | `+6.03 pts/trade` (Sample Mean) | All 25 trades | High: Formula omitted 4% weight of Trade #25, causing internal mathematical contradiction |
| **D4** | **Instrument Sample Distinctness** | MNQ ($N=25$) & NQ ($N=25$) | Identical prices (0 variance) | All records | Critical: Sample size is $N=25$, not $N=50$ |
| **D5** | **Historical Contract Independence** | 4 distinct contract periods | 2 unique periods (Z25 replicated with +400 and +800 shifts) | `mnqz25`, `mnqh26`, `mnqm26` in `data_audit/cp33_7/` | Critical: 3 of 4 sessions are synthetic vertical translations; replicates single +117.75 win 3 times |
| **D6** | **Time Series Chronology** | Concatenated array order | Inverted jump (-78 days) between Trade 18 and 19 | Trades #18 $\to$ #19 | Minor: Lag-1 shifts slightly from $-0.2426$ to $-0.2511$ |
| **D7** | **Resolution Bar Recording** | `barsToResolution: 60` on all resolved trades | Bar 1 to 30 | Trades #1–#24 | Minor: `evaluatedCandleCount` recorded horizon length rather than event bar |

---

## 4. Deep Dive: Synthetic Data Contamination in CP33.7

The most serious finding of this forensic audit is that **three of the four historical datasets are synthetic price translations of one another**:

### Proof of Synthetic Constant Shifts
A candle-by-candle comparison between `data_audit/cp33_7/normalized/mnq_mnqz25_normalized.json`, `mnq_mnqh26_normalized.json`, and `mnq_mnqm26_normalized.json` reveals:
```typescript
h_candle.open  === z_candle.open  + 400.00
h_candle.high  === z_candle.high  + 400.00
h_candle.low   === z_candle.low   + 400.00
h_candle.close === z_candle.close + 400.00
h_candle.volume === z_candle.volume // Exactly 0 difference

m_candle.open  === z_candle.open  + 800.00
m_candle.high  === z_candle.high  + 800.00
m_candle.low   === z_candle.low   + 800.00
m_candle.close === z_candle.close + 800.00
m_candle.volume === z_candle.volume // Exactly 0 difference
```
* **Sample Replication Impact:**
  - Because ICT indicators (liquidity sweeps, FVGs, order blocks) are scale-invariant to constant price shifts, the exact same setups were triggered at the exact same bar indices across all three files:
    - Trades 1–6 (from `mnqz25`): Net points = `[-3.25, -13.50, -33.25, -2.75, +117.75, -32.00]`
    - Trades 7–12 (from `mnqh26`): Net points = `[-3.25, -13.50, -33.25, -2.75, +117.75, -32.00]`
    - Trades 13–18 (from `mnqm26`): Net points = `[-3.25, -13.50, -33.25, -2.75, +117.75, -32.00]`
  - Trade #5 was a single massive short sweep on 2025-12-02 that made $+117.75$ net points.
  - This single trade was repeated as Trade #11 and Trade #17 due to the $+400$ and $+800$ point shifts.
  - Total net points from this single market event: $3 \times 117.75 = \mathbf{+353.25\text{ pts}}$.
  - The entire 25-trade sample produced $+150.75$ baseline net points. Without this duplicated event, the remaining sample net points would be $+150.75 - 235.50 = \mathbf{-84.75\text{ pts}}$ (negative return).

---

## 5. Dataset Suitability for Further Validation

* **Question:** Is the current dataset suitable for further validation?
* **Forensic Finding:** **`NOT_SUITABLE`**.
* **Rationale:**
  1. **Effective Degrees of Freedom:** The repository contains only two distinct price paths: the 2025-12-01 session and the 2026-03-15 session. This yields an effective sample size of approximately $N \approx 13$ independent market decisions across 2 days, far below the $N \ge 100$ across 10 days standard.
  2. **Collinear Duplication:** Evaluating MNQ and NQ separately provides zero independent verification because the underlying price series are identical.
  3. **Synthetic Shift Artifacts:** Evaluating models against synthetic $+400$ and $+800$ point shifts creates an illusion of cross-contract validation while measuring the identical market trajectory three times.
* **Prerequisite for Further Validation:** Genuine validation requires acquiring at least 10 independent, unshifted, full-day CME Databento GLBX MDP3 RTH sessions across distinct trading weeks.

---

## 6. Positive Expectancy Evaluation

* **Question:** Is the original positive-expectancy claim supported by the granular records?
* **Verdict:** **Supported Arithmetically on the Existing Records, but Structurally and Statistically Fragile**.
* **Analysis:**
  - On the raw data in `scratch/phase4_validation_results.json`, positive expectancy is mathematically present: $+150.75$ points total, $+6.03$ points per trade, surviving both baseline ($1.00$ pt) and stress ($1.75$ pt) friction.
  - However, because $+353.25$ points of the $+428.75$ gross winning points were generated by replicating one single winning move three times via synthetic $+400$ and $+800$ shifts, the positive expectancy cannot be claimed as statistically robust or representative of live performance.
  - In an un-duplicated sample (Session 1 and Session 4 only), the strategy generated 1 win (+117.75) and 5 losses (-84.75) in Session 1 (net +33.00), and 1 win (+75.50), 5 losses (-42.25), and 1 unresolved (+17.50) in Session 4 (net +50.75). Both independent sessions were positive, but with only two independent winning events, the sample variance is too wide to reject random chance.

---

## 7. Final Governance Sign-Off

* **Verdict:** **`RECONCILED_WITH_LIMITATIONS`**
* **Repository State:** 100% Preserved. Zero production code edits. Zero modifications to `core/ict/`, models A/B/C, S10 protocol/manifest, or Session 002.
* **Operational Directive:** Live trading remains strictly prohibited. Official S10 capture remains unscheduled. No trading decisions or risk capital should be deployed based on the CP33.7 dataset.
