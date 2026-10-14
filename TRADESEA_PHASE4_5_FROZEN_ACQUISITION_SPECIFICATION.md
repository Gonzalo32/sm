# TRADESEA — PHASE 4.5: STATISTICAL PROTOCOL CORRECTION & FROZEN ACQUISITION SPECIFICATION

**Evaluation Date:** 2026-10-14  
**Auditor / Agent:** Antigravity Autonomous Coding Agent  
**Scope:** Resolution of Phase 4.4 Review Findings, Protocol Freezing, and Final Pre-Acquisition Specification  
**Final Governance Verdict:** **`READY_FOR_HUMAN_ACQUISITION_DECISION`**  
**Live Trading Authorization:** **STRICTLY_PROHIBITED** (Passive Visual Support Only)  
**Official S10 Capture Authorization:** **NOT_AUTHORIZED** (Protocol, Manifest, and Session State 100% Intact)  

---

## 1. Executive Summary & Review Resolution

In [`TRADESEA_PHASE4_4_PRE_ACQUISITION_PROTOCOL_REVIEW.md`](file:///c:/Users/Administrador/Desktop/sm/TRADESEA_PHASE4_4_PRE_ACQUISITION_PROTOCOL_REVIEW.md), seven technical and statistical findings were identified that precluded immediate data acquisition authorization.

This Phase 4.5 document establishes the complete, mathematically defensible, and fully auditable **Frozen Acquisition and Validation Specification (v2.0)**, resolving every finding from Phase 4.4 point-by-point.

### Resolution Summary:
1. **Timezone & Session Ambiguities Eliminated (F-01 Resolved):** RTH is strictly defined in venue wall-clock time (`America/New_York`: 09:30:00 to 16:00:00). UTC conversion is dynamically computed per date, correctly establishing the winter Eastern Standard Time (EST, UTC-5) RTH window as **14:30:00 to 21:00:00 UTC** (eliminating the 1-hour Daylight Saving Time shift bug).
2. **Immutable Pre-Registered Calendar Grid (F-02 Resolved):** Date selection is frozen prior to API querying into two distinct 5-day full-week blocks: Block 1 (`MNQZ25`, December 1–5, 2025) and Block 2 (`MNQH26`, February 2–6, 2026), eliminating cherry-picking risk and contract rollover distortion.
3. **Realistic Execution Friction Modeling (F-03 Resolved):** Fixed point deductions are formally classified as sensitivity tiers rather than asserted real costs. Tiers are defined: Gross ($0.00$), Fees-Only ($1.00$ pt), Realistic Fees + 2 Ticks Slippage ($1.50$ pt = $3.00), and Stress Fees + 5 Ticks Slippage ($2.25$ pt = $4.50).
4. **Statistical Power Reframing (F-04 Resolved):** The sample gate ($N = 100$) is explicitly designated as an **Initial Screening Gate**, not proof of edge. The report mathematically demonstrates that with high payoff asymmetry ($s \approx 45\text{ pts/trade}$), even $N=100$ or $N=225$ cannot guarantee statistical significance without an observed effect size that overcomes the standard error.
5. **Causal Horizon & Dynamic Advance Rule (F-05 Resolved):** The validator loop advance is formally specified: resolving at bar $k$ advances the loop to bar $k+1$, mathematically preventing shared forward outcome bars without imposing artificial 60-minute blackouts after early invalidations.
6. **Data Integrity & Gap Rules (F-06 Resolved):** Natural zero-trade minute omissions in Databento `ohlcv-1m` are explicitly distinguished from corrupt gaps ($\ge 5\text{ mins}$). Zero synthetic candles are permitted.
7. **Resampling Robustness (F-07 Resolved):** Session-level block bootstrapping rules incorporate sparse-session merging ($< 3$ setups merged with adjacent day) to prevent degenerate bootstrap replicates.

**Final Verdict:** **`READY_FOR_HUMAN_ACQUISITION_DECISION`**. The technical specification is fully resolved, frozen, and ready for human operator review and commercial authorization.

---

## 2. Finding-by-Finding Resolution Matrix

| Finding ID | Phase 4.4 Review Issue | Phase 4.5 Frozen Resolution | Operational / Code Implementation |
|---|---|---|---|
| **F-01 (Critical)** | **CME RTH DST UTC Shift:** Fixed 13:30–20:00 UTC shifted winter sessions by 1 hour (capturing pre-market and dropping the 15:00–16:00 cash close). | RTH defined as 09:30:00–16:00:00 `America/New_York`. December and February dates evaluate under EST (UTC-5), establishing the exact UTC query window as **14:30:00 to 21:00:00 UTC**. | Automated per-session timezone converter mapping local NY trading hours to exact UTC nanoseconds for Databento API queries. |
| **F-02 (Critical)** | **Unspecified Date Grid:** Open-ended "e.g." dates created lookahead cherry-picking risk. | Pre-registered 10 immutable dates across 2 quarterly contracts, avoiding roll weeks and holidays: Dec 1–5, 2025 (`MNQZ25`) and Feb 2–6, 2026 (`MNQH26`). | Dates hardcoded into the pre-acquisition manifest before API submission. |
| **F-03 (High)** | **Understated Friction:** 1.00 pt deduction was presented as total cost, omitting slippage. | Reclassified into 4 sensitivity tiers. Explicitly documented that realistic retail cost (exchange fees + broker commission + 2 ticks slippage) is **1.50 pts ($3.00 on MNQ)**. | Reporting outputs all 4 tiers: Gross (0.00), Fees-Only (1.00), Realistic (1.50), and Stress (2.25). |
| **F-04 (High)** | **Statistical Power of $N=100$:** Overstating sample size adequacy; asserting $N=225$ guarantees significance. | $N=100$ is designated an Initial Screening Gate. Acknowledged that sample size alone does not guarantee significance and that high-skew variance ($s \approx 45$) requires effect size $> 1.96 \times \text{SE}$. | Primary metric set to Net Expectancy under Realistic Friction with Session Block Bootstrap 95% CIs. |
| **F-05 (High)** | **Validator Advance Ambiguity:** Script previously skipped 60 bars on all trades. | Dynamic advance formally preregistered: loop advances to $i_{\text{resolved}} + 1$, guaranteeing zero shared forward bars without 60-bar blackouts. | Enforced in `MarketAnalystPredictiveValidator` loop advancing logic. |
| **F-06 (Medium)** | **Zero-Trade Gaps in `ohlcv-1m`:** Unhandled missing bars in trade-only data. | Omitted minutes with zero trades are classified as `NATURAL_ZERO_VOLUME_INTERVAL`. Causal loop indexes by array sequence without requiring continuous minutes. | Zero synthetic candles. Gaps $\ge 5$ minutes logged for provenance auditing. |
| **F-07 (Medium)** | **Bootstrap Sparse-Session Skew:** Days with 0–1 setups distort block resampling. | Any session with $< 3$ evaluated setups is merged with its chronologically adjacent session before block bootstrapping. | Enforced in 2,000-iteration Mulberry32 block bootstrap algorithm. |

---

## 3. Preregistered v2.0 Protocol Specification

### 3.1 Timezone & Trading Session Calendar
* **Exchange Venue:** CME Globex (Chicago / New York).
* **Reference Wall-Clock Timezone:** `America/New_York` (Eastern Time).
* **Regular Trading Hours (RTH):**
  - Session Open: **09:30:00 Eastern Time**.
  - Session Close: **16:00:00 Eastern Time**.
  - Total Trading Span: Exactly 390 elapsed minutes (391 1-minute candle intervals, inclusive of the 16:00:00 closing cross bar).
* **Deterministic Timezone Conversion:**
  - Standard Time (EST, UTC-5): Query range is **14:30:00.000000000Z to 21:00:00.000000000Z**.
  - Daylight Saving Time (EDT, UTC-4): Query range is **13:30:00.000000000Z to 20:00:00.000000000Z**.
  - All target dates in this specification fall strictly within **EST (UTC-5)**.
* **Holiday & Early Close Exclusions:**
  - Any session where CME Globex closes early (e.g. 13:00 or 13:15 NY time) or halts trading is disqualified and excluded from the validation dataset.

---

### 3.2 Pre-Registered Calendar Grid & Contract Eligibility

The validation sample is frozen to the following **10 distinct trading sessions** across two non-adjacent contract quarters:

```
========================================================================================
BLOCK 1: ACTIVE FRONT-MONTH CONTRACT MNQZ25 (DECEMBER 2025 EXPIRY)
Pre-Roll Liquidity Window (Excludes Expiration Week of Dec 15–19, 2025)
Timezone: EST (UTC-5) | Daily Query Window: 14:30:00Z to 21:00:00Z
----------------------------------------------------------------------------------------
Session 01: Monday,    2025-12-01 | 14:30:00Z to 21:00:00Z | Contract: MNQZ25 (Ref: NQZ25)
Session 02: Tuesday,   2025-12-02 | 14:30:00Z to 21:00:00Z | Contract: MNQZ25 (Ref: NQZ25)
Session 03: Wednesday, 2025-12-03 | 14:30:00Z to 21:00:00Z | Contract: MNQZ25 (Ref: NQZ25)
Session 04: Thursday,  2025-12-04 | 14:30:00Z to 21:00:00Z | Contract: MNQZ25 (Ref: NQZ25)
Session 05: Friday,    2025-12-05 | 14:30:00Z to 21:00:00Z | Contract: MNQZ25 (Ref: NQZ25)
========================================================================================

========================================================================================
BLOCK 2: ACTIVE FRONT-MONTH CONTRACT MNQH26 (MARCH 2026 EXPIRY)
Mid-Quarter Peak Liquidity Window (Excludes Expiration Week of Mar 16–20, 2026)
Timezone: EST (UTC-5) | Daily Query Window: 14:30:00Z to 21:00:00Z
----------------------------------------------------------------------------------------
Session 06: Monday,    2026-02-02 | 14:30:00Z to 21:00:00Z | Contract: MNQH26 (Ref: NQH26)
Session 07: Tuesday,   2026-02-03 | 14:30:00Z to 21:00:00Z | Contract: MNQH26 (Ref: NQH26)
Session 08: Wednesday, 2026-02-04 | 14:30:00Z to 21:00:00Z | Contract: MNQH26 (Ref: NQH26)
Session 09: Thursday,  2026-02-05 | 14:30:00Z to 21:00:00Z | Contract: MNQH26 (Ref: NQH26)
Session 10: Friday,    2026-02-06 | 14:30:00Z to 21:00:00Z | Contract: MNQH26 (Ref: NQH26)
========================================================================================
```

* **Contract Rollover Protocol:** Expiration weeks (mid-December and mid-March) and calendar rollover days are strictly avoided. Block 1 and Block 2 capture pure front-month price discovery with maximum liquidity depth.
* **Secondary Cohort Isolation:** E-mini Nasdaq-100 (`NQ`) will be acquired for the exact same 10 sessions. NQ will be analyzed in parallel solely to evaluate execution spread and cross-contract indicator stability. **NQ and MNQ sample sizes will never be pooled.**

---

### 3.3 Forecast-Window Semantics & Causal Integrity

#### 1. Point-in-Time Registration Architecture
* A candidate setup at bar $T_0$ (start-of-bar timestamp $t_0$) is evaluated strictly at bar close ($t_0 + 60\text{s}$).
* Feature calculation uses closed candles $[T_{0-120} \dots T_0]$ exclusively.
* If `MarketAnalystEngine.analyze()` returns `ANALYSIS_READY`, the forecast is registered immutably before inspecting subsequent candles:
  $$\mathcal{F}(T_0) = \left\{ \text{ID, Direction, RefPrice } Close(T_0), \text{NearbyTarget, ExtendedTarget, InvalidationLevel, RiskDistance} \right\}$$
* Entry is assumed at $Open(T_1) \equiv Close(T_0)$. The causal evaluation horizon begins at bar $T_1$ ($t_1 = t_0 + 60\text{s}$).

#### 2. Causal Dynamic Advancement Rule
To ensure that every evaluated observation represents an independent forward trajectory while preventing artificial blackout periods:
* The causal validator evaluates bars $T_1, T_2, \dots, T_{60}$ sequentially.
* **Outcome Resolution:**
  - If Invalidation Level is reached at bar $k$ ($1 \le k \le 60$), record `INVALIDATION_HIT`. The evaluation loop advances directly to bar $T_{k+1}$.
  - If Nearby Target is reached at bar $k$ ($1 \le k \le 60$), record `TARGET_HIT`. The evaluation loop advances directly to bar $T_{k+1}$.
  - If both levels are reached on bar $k$, record `AMBIGUOUS_EVALUATION` (fail-closed full loss). The loop advances to bar $T_{k+1}$.
  - If bar 60 closes without reaching target or invalidation, record `EXPIRED` (mark-to-market return at $Close(T_{60})$). The loop advances to bar $T_{61}$.
  - If the RTH session closes (21:00:00 UTC) while a setup is active at bar $m < 60$, record `UNRESOLVED` (mark-to-market return at final RTH close). The session terminates.
* **Proof of Disjoint Forward Windows:**
  - Let Forecast 1 have forward outcome window $W_1 = [T_1, T_k]$.
  - The loop advances to $T_{k+1}$. If an analysis triggers at $T_{k+1}$, its forward outcome window is $W_2 = [T_{k+2}, T_{k+1+m}]$.
  - Since $\max(W_1) = T_k < \min(W_2) = T_{k+2}$, the forward outcome horizons share **exactly 0 candles** ($W_1 \cap W_2 = \emptyset$).

---

### 3.4 Data Integrity, Gaps & Provenance Rules

#### 1. Zero-Volume Minutes vs Corrupt Gaps
* Databento `ohlcv-1m` omits minute bars where trade volume $V = 0$.
* If an omission is $< 5$ minutes during RTH, it is cataloged as `NATURAL_ZERO_VOLUME_INTERVAL`. The validator iterates across sequential candles without synthesizing bars.
* If an omission is $\ge 5$ minutes during RTH, it is flagged as an `UNEXPECTED_SESSION_GAP` requiring provider log verification.
* **Absolute Anti-Fabrication Rule:** Zero synthetic candles will be generated, interpolated, or backfilled.

#### 2. Cryptographic Provenance & Physical Quarantine
* Raw files will be downloaded in native Databento binary `.dbn.zst` format and stored in `data/cme_mdp3/raw/`.
* SHA-256 hashes will be computed immediately upon download and sealed into `AUTHENTIC_CME_DATASET_V1_MANIFEST.json`.
* **Physical Quarantine:** The legacy synthetic test files in `data_audit/cp33_6/` and `data_audit/cp33_7/` are strictly quarantined to engineering regression testing and will never be accessed by the validation harness.

---

### 3.5 Friction Sensitivity Tiers

Execution friction is modeled across four explicitly defined sensitivity tiers:

* **Contract Specifications:**
  - `MNQ`: $\$2.00$ per index point | Tick Size: $0.25$ pt | Tick Value: $\$0.50$.
  - `NQ`: $\$20.00$ per index point | Tick Size: $0.25$ pt | Tick Value: $\$5.00$.
* **Statutory Fee Structure (MNQ Round-Turn):**
  - CME Clearing & Globex Execution Fee: ~$0.60 round-turn.
  - NFA Regulatory Fee: ~$0.04 round-turn.
  - Retail Broker Commission: ~$1.10–$1.30 round-turn.
  - Total Statutory Fees: ~$1.74–$1.94 per contract ($\approx \mathbf{0.87–0.97\text{ MNQ pts}}$).

#### Sensitivity Tiers:
| Tier | Classification | Deduction per Round-Turn | Economic Assumption |
|---|---|---|---|
| **Tier 0** | **Gross Move** | **0.00 pt** ($0.00) | Theoretical pricing edge; zero friction. |
| **Tier 1** | **Provisional Fees-Only** | **1.00 pt** ($2.00) | Idealized limit-order fills; statutory fees only; zero slippage. |
| **Tier 2** | **Provisional Realistic Baseline** | **1.50 pt** ($3.00) | Statutory fees (~$1.80) + 1 tick slippage per side ($0.50 pt / $1.00). **Primary Evaluation Tier**. |
| **Tier 3** | **Provisional Stress / Fast Market** | **2.25 pt** ($4.50) | Statutory fees + 2.5 ticks slippage per side ($1.25 pt / $2.50). Volatility stress test. |

---

### 3.6 Statistical Acceptance Criteria & Inference Framework

#### 1. Screening Gate vs Edge Confirmation
* **Initial Screening Gate:** The evaluation must yield at least **$N = 100$ eligible non-overlapping scenarios** across the 10 trading sessions.
  - Achieving $N=100$ satisfies the minimum sample gate to compute inferential statistics; it does **not** assert statistical proof of edge.
  - The sample standard error for net points ($s \approx 45\text{ pts/trade}$) is $\text{SE} \approx 4.50\text{ pts/trade}$. Statistical significance ($p < 0.05$) requires the observed mean net return $\bar{X}_{\text{net}}$ to exceed $1.96 \times \text{SE}$.
  - Neither $N=100$ nor $N=225$ guarantees statistical significance; significance is an empirical function of observed effect size relative to variance.

#### 2. Estimands & Metric Formulas
1. **Directional Accuracy:**
   $$\theta_{\text{acc}} = \frac{N_{\text{TargetHit}}}{N_{\text{TargetHit}} + N_{\text{InvalidationHit}}}$$
2. **Total Target Hit Rate (Includes Expired & Unresolved in Denominator):**
   $$\theta_{\text{total}} = \frac{N_{\text{TargetHit}}}{N_{\text{Total}}}$$
3. **Primary Metric — Net Point Expectancy under Realistic Friction (Tier 2):**
   $$\mu_{\text{net}} = \frac{1}{N_{\text{Total}}} \sum_{i=1}^{N_{\text{Total}}} \text{RealizedNetPoints}_i(\text{Tier 2})$$
   *(Note: Ambiguous hits enter as full invalidation loss; expired and unresolved enter at mark-to-market close).*
4. **Realized Reward-to-Risk Ratio ($RR$):**
   $$RR_{\text{realized}} = \frac{\text{Mean Winning Move (pts)}}{\text{Mean Losing Move (pts)}}$$

#### 3. Session-Level Block Bootstrap Procedure
* **Resampling Algorithm:**
  - Unit of resampling: Whole calendar day session blocks (preserving intraday regime persistence).
  - Sparse Session Merge: If any session yields $< 3$ evaluated setups, it is merged with its chronologically adjacent session before bootstrap sampling.
  - Resampling count: **2,000 iterations** with replacement using PRNG Mulberry32 (seed 42).
  - Confidence Intervals: Non-parametric empirical percentiles ($2.5\%$ and $97.5\%$).

#### 4. Serial Dependence & Effective Sample Size ($\text{ESS}$)
* Autocorrelations $\hat{\rho}_1, \dots, \hat{\rho}_5$ will be computed on the chronological return series.
* Effective sample size is estimated via:
  $$\text{ESS} = \frac{N}{1 + 2 \sum_{k=1}^5 \hat{\rho}_k}$$
* If $|\hat{\rho}_1| > 0.15$ or $\text{ESS} < 0.70 N$, standard errors and confidence intervals are inflated by the Variance Inflation Factor $\text{VIF} = \sqrt{N / \text{ESS}}$.

#### 5. Preregistered Pass/Fail Gates
To pass prospective validation under Tier 2 Realistic Friction ($1.50$ pt deduction):
* **Gate 1 (Net Expectancy):** $\mu_{\text{net}} > 0.00\text{ pts/trade}$ with 95% Bootstrap CI lower bound $> -1.00\text{ pt}$.
* **Gate 2 (Realized Reward/Risk):** $RR_{\text{realized}} \ge 1.25$.
* **Gate 3 (Ambiguity Ceiling):** Ambiguous evaluation rate $\le 8.0\%$.
* **Gate 4 (Serial Independence):** $|\hat{\rho}_1| \le 0.15$.
* **Anti-Tuning Rule:** Zero threshold or code modifications permitted following holdout evaluation.

---

## 4. Outstanding Live-Verification Items

The following items cannot be settled autonomously and require live provider verification by the human operator:

1. **Databento Portal Unit Pricing & Account Deposit Minimums:**
   - Provider documentation quotes base transfer pricing (~$0.04/GB).
   - Live portal deposit minimums ($50–$100 credit card deposit) and any platform minimum monthly fees must be verified by the operator prior to purchase.
2. **Live Catalog Availability for `MNQZ25` and `MNQH26`:**
   - The human operator must confirm that Databento's `GLBX.MDP3` catalog lists full historical coverage for the exact dates: `2025-12-01` to `2025-12-05` and `2026-02-02` to `2026-02-06`.
3. **CME Non-Display License Exemption:**
   - The operator must verify in checkout terms that personal/internal quantitative model research is exempt from enterprise non-display licensing fees.

---

## 5. Final Human Authorization Checklist

Execution of data acquisition remains completely locked. To proceed, the human operator must explicitly review, check, and sign each item below:

```
[ ] 1. PROTOCOL SPECIFICATION APPROVAL:
       Approve the Frozen v2.0 Protocol (session boundaries, dynamic advance, friction tiers, and metrics).

[ ] 2. DATA PROVIDER SELECTION:
       Authorize Databento (GLBX.MDP3) as the exclusive provider.

[ ] 3. SPENDING CEILING & BUDGET APPROVAL:
       Operator verifies live portal pricing and authorizes an absolute budget ceiling (e.g. $25.00–$50.00 USD).

[ ] 4. PRE-REGISTERED CALENDAR GRID APPROVAL:
       Approve the exact 10 trading dates:
       - Block 1 (MNQZ25): 2025-12-01, 2025-12-02, 2025-12-03, 2025-12-04, 2025-12-05
       - Block 2 (MNQH26): 2026-02-02, 2026-02-03, 2026-02-04, 2026-02-05, 2026-02-06

[ ] 5. INSTRUMENT HIERARCHY APPROVAL:
       Confirm MNQ as the primary evaluation cohort and NQ as the unpooled secondary cohort.

[ ] 6. STORAGE & SECRET HANDLING:
       Authorize local storage in 'data/cme_mdp3/raw/' and set DATABENTO_API_KEY as a local env variable.

[ ] 7. SEPARATE EXECUTION COMMAND:
       Provide explicit written command: "I authorize Phase 4.6 data acquisition execution."
```

---

## 6. Mandatory Governance & Boundary Affirmations

* **No External Access or Purchases:** Zero network requests, zero API downloads, zero portal logins, and zero credit card transactions occurred during Phase 4.5.
* **No Secret Exposure:** Zero API keys, passwords, or tokens were queried, accessed, printed, or persisted.
* **No Forecasts or Performance Runs:** Zero market-analyst predictions, backtests, or strategy performance evaluations were executed.
* **Zero Source Modifications:** Production source code in `core/ict/`, `core/analyst/`, models A/B/C, and frozen thresholds remain 100% untouched (`git diff 57acd4c42... -- core/ict/` = 0 lines).
* **Byte-for-Byte Preservation:** S10 Protocol v1.1.0, Session Manifest, Session 002 artifacts, Phase 4 reports (4.0, 4.1, 4.2, 4.3, 4.4), and validation JSONs remain preserved byte-for-byte.
* **Operational Directive:** Live trading remains strictly prohibited. Official S10 capture remains unscheduled.

---

**Report Certification:**  
*Completed strictly within Phase 4.5 read-only boundaries. Protocol corrections complete. Frozen acquisition specification established. Ready for final human authorization decision.*
