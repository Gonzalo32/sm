# TRADESEA — PHASE 4.4: PRE-ACQUISITION PROTOCOL REVIEW & AUTHORIZATION READINESS REPORT

**Evaluation Date:** 2026-10-14  
**Auditor / Agent:** Antigravity Autonomous Coding Agent  
**Scope:** Strictly Read-Only Independent Review of [`TRADESEA_PHASE4_3_DATA_ACQUISITION_AND_EVIDENCE_REMEDIATION.md`](file:///c:/Users/Administrador/Desktop/sm/TRADESEA_PHASE4_3_DATA_ACQUISITION_AND_EVIDENCE_REMEDIATION.md)  
**Executive Governance Verdict:** **`BLOCKED_PENDING_PROTOCOL_CLARIFICATIONS`**  
**Live Trading Authorization:** **STRICTLY_PROHIBITED** (Passive Visual Support Only)  
**Official S10 Capture Authorization:** **NOT_AUTHORIZED** (Protocol, Manifest, and Session State 100% Intact)  

---

## 1. Executive Summary & Review Verdict

### Final Governance Verdict: `BLOCKED_PENDING_PROTOCOL_CLARIFICATIONS`

An independent technical and statistical audit of the Phase 4.3 data acquisition plan and preregistered v2.0 validation protocol was conducted. 

While Phase 4.3 successfully achieved the historical evidence remediation and retirement of contaminated synthetic claims, the proposed data acquisition and validation protocol contains **two Critical, three High, and two Medium protocol ambiguities** that directly impact the exact API query parameters, date selection rules, timezone boundaries, friction assumptions, and statistical inference.

Authorizing external data purchase or download before resolving these ambiguities risks querying incorrect market hours (the Daylight Saving Time UTC bug), cherry-picking historical dates, underestimating real-world execution friction, or misinterpreting the statistical power of the initial sample gate.

**The authorization gate is `BLOCKED` until the human operator reviews and adopts the exact recommended resolutions detailed in this report.**

---

## 2. Findings Classification Matrix

| Finding ID | Classification | Dimension | Description of Ambiguity / Defect | Governance & Technical Impact |
|---|---|---|---|---|
| **F-01** | **`CRITICAL`** | Protocol Completeness | **CME RTH Daylight Saving Time (DST) UTC Shift:** Fixed 13:30–20:00 UTC window assumes Eastern Daylight Time (EDT, UTC-4). During Eastern Standard Time (EST, UTC-5), RTH is **14:30–21:00 UTC**. | Requesting 13:30–20:00 UTC in winter captures 1 hour of illiquid pre-market (08:30–09:30 NY) and drops the final hour of trading (15:00–16:00 NY). |
| **F-02** | **`CRITICAL`** | Statistical Validity | **Absence of Pre-Registered Calendar Date Grid:** Phase 4.3 proposed "e.g. 5 days in Dec 2025, 5 in Feb 2026" without freezing the exact 10 calendar dates. | Post-hoc date selection introduces selection bias and cherry-picking of favorable trending regimes. |
| **F-03** | **`HIGH`** | Cost & Friction | **Understated Real-World Execution Friction:** Fixed 1.00 pt ($2.00) baseline friction covers round-turn exchange/broker fees ($1.60–$2.00) but assumes **zero slippage**. | Realistic retail execution cost on market orders is 1.50–2.25 pts ($3.00–$4.50). Baseline scenario is optimistic. |
| **F-04** | **`HIGH`** | Statistical Validity | **Statistical Power Limitation of $N=100$:** With high payoff skew (6:1 R:R, 16% hit rate), sample return standard error is $\text{SE} \approx \pm 4.5\text{ pts}$. | An observed mean of $+6.00$ pts has a 95% CI of $[-2.82, +14.82]$ pts; $N=100$ cannot statistically reject zero return ($p > 0.05$). |
| **F-05** | **`HIGH`** | Protocol Completeness | **Validator Loop Advance Mechanism Ambiguity:** Phase 4 code advanced by 60 bars regardless of event bar. Phase 4.3 does not specify dynamic vs block advance. | Forces a 60-minute artificial trading blackout after every setup even if invalidated on minute 1. |
| **F-06** | **`MEDIUM`** | Data Integrity | **Omitted Zero-Volume Gaps in Trade-Only Minute Bars:** Databento `ohlcv-1m` omits minutes without trades. | Causal evaluation loops assuming $T_{i+1} = T_i + 60\text{s}$ will fail on thin-liquidity intervals. |
| **F-07** | **`MEDIUM`** | Statistical Validity | **Bootstrap Distortion on Sparse Sessions:** Resampling sessions with 0 or 1 setup can produce degenerate bootstrap replicates. | Skews confidence interval estimations. Requires minimum trade density or stationary block bootstrap. |

---

## 3. Detailed Review & Ambiguity Audit

### 3.1 Protocol Completeness (Review Requirement 1)

#### 1. Exact MNQ Contract and Date-Selection Rules (Finding F-02 — `CRITICAL`)
* **Phase 4.3 Proposal:** *"At least 10 distinct CME Globex trading sessions spanning at least 2 distinct calendar months (e.g., 5 sessions from December 2025, 5 sessions from February 2026)."*
* **Ambiguity:** Leaving date selection open as an "e.g." allows the human operator or automated script to inspect market history first and choose dates that happened to experience clean directional trends, introducing severe lookahead selection bias.
* **Recommended Resolution:** The 10 trading dates and active contract symbols must be frozen into an immutable pre-registered array **before issuing the API query**:
  - Sample Block 1 (December 2025 contract `MNQZ25`): Active trading days `2025-12-08` through `2025-12-12` (5 full sessions, avoiding roll week).
  - Sample Block 2 (March 2026 contract `MNQH26`): Active trading days `2026-02-09` through `2026-02-13` (5 full sessions, mid-quarter liquidity).

#### 2. CME RTH Session Boundaries & DST Handling (Finding F-01 — `CRITICAL`)
* **Phase 4.3 Proposal:** *"CME Regular Trading Hours (RTH, 13:30 to 20:00 UTC / 09:30 to 16:00 EDT)."*
* **Defect:** CME Globex equity index futures trade according to US Eastern Time (New York):
  - **EDT (Daylight Saving Time, UTC-4):** RTH is **13:30:00 to 20:00:00 UTC**.
  - **EST (Standard Time, UTC-5):** RTH is **14:30:00 to 21:00:00 UTC**.
  - December and February operate under **EST (UTC-5)**!
  - If a static query for 13:30–20:00 UTC is executed on December or February data, the dataset captures 08:30–15:00 local NY time. This captures 1 hour of illiquid pre-market and completely misses the final, highly volatile cash close hour (15:00–16:00 NY / 20:00–21:00 UTC).
* **Recommended Resolution:** Define session boundaries in local wall-clock time (`America/New_York`: 09:30:00 to 16:00:00) and convert dynamically to UTC per date. For December 2025 and February 2026, the query window must be **14:30:00 to 21:00:00 UTC**. Exclude half-days (e.g. day after Thanksgiving) and CME holidays.

#### 3. Candle Timestamp Conventions & Zero-Trade Gaps (Finding F-06 — `MEDIUM`)
* **Specification:** Databento `ohlcv-1m` records `ts_event` in nanoseconds UTC representing the **start of the minute interval**.
* **Zero-Trade Omission:** In `ohlcv-1m` trade aggregates, minutes with zero matched trades emit no record.
* **Recommended Resolution:**
  - Standardize all timestamps to Unix milliseconds UTC representing start-of-bar.
  - Causal validator must index candles by array sequence rather than assuming $Timestamp[i+1] = Timestamp[i] + 60,000\text{ ms}$.
  - Gaps longer than 1 minute within RTH must be logged as `NATURAL_ZERO_VOLUME_INTERVAL`.

#### 4. Forecast Creation Time & Information Access
* **Causal Anti-Lookahead Lock:**
  - An analysis for bar $T_0$ is generated at bar close ($T_0 + 60,000\text{ ms}$).
  - All features ($Close(T_0)$, swing highs, swing lows, FVG boundaries) are computed strictly from closed bars $[T_{0-120} \dots T_0]$.
  - The entry assumption is evaluated at $Open(T_1) \equiv Close(T_0)$.
  - Forward causal evaluation strictly inspects bars where $Timestamp \ge T_1$.

#### 5. Non-Overlapping Window Advance Mechanism (Finding F-05 — `HIGH`)
* **Audit Finding from Phase 4.1:** The Phase 4 harness advanced the loop by `advanceBars = Math.max(1, barsToRes)`. Because `barsToRes` was set to the horizon length (60) rather than the event bar, the loop skipped 60 minutes after every setup, even if invalidated in 1 minute.
* **Recommended Resolution:** Formally preregister the advance rule:
  - If a setup resolves at bar $k$ ($1 \le k \le 60$), the evaluation loop advances to bar $k+1$.
  - If a setup reaches bar 60 without resolution, the loop advances to bar 61.
  - This preserves strictly non-overlapping causal trajectories without artificially suppressing trading for 59 minutes after an early stop.

#### 6. Outcome Classification, Expiries & Denominators
* **Formulas:**
  - `TARGET_HIT`: Candle High (bullish) or Low (bearish) reaches nearby target before invalidation.
  - `INVALIDATION_HIT`: Candle Low (bullish) or High (bearish) reaches invalidation level before nearby target.
  - `AMBIGUOUS_EVALUATION`: Both levels touched on the same 1m candle (evaluated fail-closed as full invalidation loss).
  - `EXPIRED`: 60 bars elapsed without touch (evaluated at $Close(T_{60})$).
  - `UNRESOLVED`: RTH boundary (16:00 NY) reached while setup is active (evaluated at final RTH close).
* **Dual Hit-Rate Reporting:**
  $$\text{TargetHitRate}_{\text{Total}} = \frac{N_{\text{TargetHit}}}{N_{\text{Total}}} \quad (\text{Includes unreached/expired in denominator})$$
  $$\text{DirectionalAccuracy} = \frac{N_{\text{TargetHit}}}{N_{\text{TargetHit}} + N_{\text{InvalidationHit}}} \quad (\text{Resolved directional accuracy})$$

#### 7. Friction Modeling & Fee Realism (Finding F-03 — `HIGH`)
* **Audit of Real-World MNQ Execution Costs:**
  - CME exchange fee: $0.25–$0.35 per side ($0.50–$0.70 round-turn).
  - NFA fee: $0.02 per side ($0.04 round-turn).
  - Retail broker commission (e.g. NinjaTrader/Tradovate/Interactive Brokers): $0.50–$0.60 per side ($1.00–$1.20 round-turn).
  - **Fixed Fee Total:** ~$1.60–$1.94 per contract ($\approx \mathbf{0.80–1.00\text{ MNQ pts}}$).
  - **Execution Slippage on Market Orders:** Minimum 1 tick ($0.25$ pt) entry + 1 tick exit = $0.50$ pt; in fast markets, 2 ticks entry + 2 ticks exit = $1.00$ pt.
  - **Total Realistic Cost:** $0.90\text{ pt (fees)} + 0.75\text{ pt (slippage)} = \mathbf{1.65\text{ pts}}$ ($3.30 on MNQ).
* **Recommended Resolution:** Phase 4.3's "Baseline 1.00 pt" represents zero-slippage execution and must be labeled as such. Reclassify friction tiers as:
  1. **Gross:** $0.00$ pt ($0.00).
  2. **Zero-Slippage Baseline (Fees Only):** $1.00$ pt ($2.00).
  3. **Realistic Baseline (Fees + 2 Ticks Slippage):** $1.50$ pts ($3.00).
  4. **Stress Friction (Fees + 5 Ticks Slippage):** $2.25$ pts ($4.50).

---

### 3.2 Statistical Validity (Review Requirement 2)

#### 1. Statistical Power of $N=100$ Sample Size (Finding F-04 — `HIGH`)
* **Quantitative Analysis:**
  - For directional hit rate ($p \approx 0.16$), $N=100$ yields $\text{SE}(p) = \sqrt{0.16 \times 0.84 / 100} = 3.67\%$. The 95% confidence interval is $[8.8\%, 23.2\%]$, which cleanly rejects the $\ge 52.0\%$ threshold ($z = -9.81, p < 10^{-20}$).
  - **HOWEVER, for Net Point Expectancy:** Because the strategy exhibits extreme payoff asymmetry (+107 pt wins vs -15 pt losses), the sample standard deviation of net return per trade is large:
    $$s \approx 45.0\text{ pts/trade}$$
    $$\text{SE}(\bar{X}) = \frac{s}{\sqrt{N}} = \frac{45.0}{\sqrt{100}} = \mathbf{4.50\text{ pts/trade}}$$
    The 95% confidence interval around an observed $+6.00$ pt mean is:
    $$95\%\text{ CI} = 6.00 \pm 1.96 \times 4.50 = \mathbf{[-2.82, +14.82]\text{ pts/trade}}$$
* **Implication:** An observed positive return of $+6.00$ pts/trade cannot be statistically distinguished from zero ($p = 0.182$).
* **Governance Rule:** Achieving $N=100$ must be classified as an **Initial Screening Gate**, not a proof of edge. To confirm positive expectancy with 95% confidence (lower bound $> 0$), a minimum of $N \approx 225$ trades ($\text{SE} \le 3.0$) is required.

#### 2. Session-Level Block Bootstrap Design (Finding F-07 — `MEDIUM`)
* **Design:** Resample whole trading days with replacement rather than individual trades to preserve intra-session volatility clustering.
* **Sparse Session Rule:** If a session yields $< 3$ evaluated setups, it is pooled with the adjacent chronological session to prevent degenerate bootstrap replicates.
* **Bootstrap Specifications:** Minimum 2,000 resamples with fixed seed (PRNG Mulberry32, seed 42) reporting empirical percentiles ($2.5\%$ and $97.5\%$).

#### 3. Effective Sample Size ($\text{ESS}$) & Serial Dependence
* Compute sample autocorrelation up to lag 5:
  $$\hat{\rho}_k = \frac{\sum_{i=1}^{N-k} (X_i - \bar{X})(X_{i+k} - \bar{X})}{\sum_{i=1}^N (X_i - \bar{X})^2}$$
* Calculate Effective Sample Size:
  $$\text{ESS} = \frac{N}{1 + 2 \sum_{k=1}^5 \hat{\rho}_k}$$
* If $\hat{\rho}_1 > 0.15$ or $\text{ESS} < 0.70 N$, standard errors must be inflated by the variance inflation factor $\text{VIF} = \sqrt{N / \text{ESS}}$.

#### 4. Selection Bias & Holdout Contamination Controls
* Date grid must be selected by fixed algorithmic rule (e.g. second full week of Dec 2025 and Feb 2026) without inspecting historical charts.
* **One-Shot Evaluation Rule:** The 10-day dataset is an official holdout. Once evaluated, it cannot be reused for parameter tuning or iterative threshold calibration.

---

### 3.3 Data Integrity & Provenance (Review Requirement 3)

#### 1. Source Preservation & Cryptographic Sealing
* Download raw binary payload directly from Databento in native `.dbn.zst` format.
* Compute and record SHA-256 hash immediately upon file creation in `data/authentic_cme/manifests/AUTHENTIC_CME_DATASET_V1_MANIFEST.json`.
* Store provider API metadata: `job_id`, `dataset: 'GLBX.MDP3'`, `schema: 'ohlcv-1m'`, `symbols: ['MNQZ25', 'MNQH26']`, `ts_received_utc`.

#### 2. Normalization & Sanity Checks
* Parse `.dbn.zst` via official Databento Python library or CLI into standard JSON format.
* Execute [`CandleValidator.validateCandle()`](file:///c:/Users/Administrador/Desktop/sm/core/market/CandleValidator.ts#L30) (verifying $High \ge \max(Open, Close)$, $Low \le \min(Open, Close)$).
* Execute [`CandleValidator.validateSeries()`](file:///c:/Users/Administrador/Desktop/sm/core/market/CandleValidator.ts#L79) (verifying monotonic UTC timestamps).
* **Anti-Shift Sanity Check:** Verify that price differences between contracts are non-constant ($\text{Var}(\Delta P) > 0$), proving that the data is not a synthetic constant-shift clone.

#### 3. Strict Quarantining of Synthetic Fixtures
* Legacy synthetic test files in `data_audit/cp33_6/` and `data_audit/cp33_7/` must remain in `data_audit/` solely for pipeline unit tests.
* The validation harness must be hardcoded to read exclusively from `data/authentic_cme/normalized/`.

---

## 4. Final Human Authorization Checklist (Review Requirement 4)

Before the human operator signs off on acquisition execution, each of the following 8 items must be reviewed, approved, and recorded:

```
[ ] 1. DATA PROVIDER SELECTION:
       Confirm Databento (GLBX.MDP3) as the exclusive provider.

[ ] 2. BUDGET CEILING & QUOTED COST:
       Operator verifies live portal cost and sets an absolute spending ceiling (e.g. $25.00 USD).

[ ] 3. FROZEN DATE GRID & TIMEZONE APPROVAL:
       Approve the 10 exact RTH sessions with EST-adjusted UTC windows (14:30:00 to 21:00:00 UTC):
       - Block 1 (MNQZ25): 2025-12-08, 2025-12-09, 2025-12-10, 2025-12-11, 2025-12-12
       - Block 2 (MNQH26): 2026-02-09, 2026-02-10, 2026-02-11, 2026-02-12, 2026-02-13

[ ] 4. CONTRACT IDENTIFIERS:
       Authorize primary contract 'MNQ' (Micro E-mini) and parallel secondary 'NQ' (Full E-mini).

[ ] 5. FRICTION MODEL APPROVAL:
       Adopt realistic friction tiers: Gross (0.00), Fees-Only (1.00 pt), Realistic (1.50 pt), Stress (2.25 pt).

[ ] 6. STORAGE LOCATION CLEARANCE:
       Authorize local storage in 'data/authentic_cme/raw/' and 'data/authentic_cme/normalized/'.

[ ] 7. CREDENTIAL MANAGEMENT:
       Operator inputs DATABENTO_API_KEY via local environment variable (never written to disk or git).

[ ] 8. ACQUISITION EXECUTION COMMAND:
       Operator issues a separate, explicit command authorizing the agent to run the download script.
```

---

## 5. Mandatory Governance & Boundary Affirmations

* **No External Access or Purchases:** Zero network requests, zero API downloads, zero portal logins, and zero credit card transactions occurred during Phase 4.4.
* **No Secret Exposure:** Zero API keys, passwords, or tokens were queried, accessed, printed, or persisted.
* **No Forecasts or Performance Runs:** Zero market-analyst predictions, backtests, or strategy performance evaluations were executed.
* **No Source Code Modifications:** Production source code in `core/ict/`, `core/analyst/`, models A/B/C, and frozen thresholds remain 100% untouched (`git diff 57acd4c42... -- core/ict/` = 0 lines).
* **Byte-for-Byte Preservation:** S10 Protocol v1.1.0, Session Manifest, Session 002 artifacts, Phase 4 reports, Phase 4.1 report, Phase 4.2 report, Phase 4.3 report, and validation JSONs remain preserved byte-for-byte.
* **Operational Directive:** Live trading remains strictly prohibited. Official S10 capture remains unscheduled.

---

**Report Certification:**  
*Completed strictly within Phase 4.4 read-only boundaries. Protocol ambiguities identified and classified. Exact resolutions and human authorization checklist prepared. Acquisition remains paused awaiting explicit human sign-off.*
