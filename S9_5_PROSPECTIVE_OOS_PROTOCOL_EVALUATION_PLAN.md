# S9.5 — Prospective OOS Protocol & Frozen Evaluation Plan Report

## Executive Summary & Final Status Verdict

This document establishes the versioned, cryptographically frozen out-of-sample (OOS) evaluation protocol for the frozen ICT Models A/B/C across prospective, previously unevaluated market sessions.

```text
S9_5_STATUS = PASS

S9_5_PROTOCOL_FROZEN = YES
S9_5_SELECTION_INDEPENDENCE = UNVERIFIED
S9_5_PROSPECTIVE_DATA_ACQUIRED = NO
S9_5_EXECUTION_COST_MODEL = ASSUMPTION_ONLY
S9_5_LIVE_TRADING_AUTHORIZED = NO
```

---

## 1. Baseline & Production Logic Immutability

* **Canonical Baseline Commit**: `57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a`
* **Verification Command**: `git diff 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a -- core/ict/`
* **Diff Line Count**: **`0 diff lines`**
* **Engine / Threshold Modifications**: `NO`

---

## 2. Selection Independence Audit

An audit of the repository commit history and artifacts was conducted to classify selection independence for historical and prospective phases:

| Phase | Evaluation Dataset | Selection Independence Audit Status | Audit Evidence & Rationale |
| :--- | :--- | :---: | :--- |
| **S8-200** | May 18–20, 2026 ($N=200$) | **`UNVERIFIED`** | No dated, immutable pre-registration artifact exists establishing session selection prior to dataset exposure. |
| **S8.8** | Dec 01, 2025 ($N=50$) | **`UNVERIFIED`** | No dated, immutable pre-registration artifact exists establishing session selection prior to dataset exposure. |
| **S9** | Dec 01–02, 2025 ($N=200$) | **`UNVERIFIED`** | No dated, immutable pre-registration artifact exists establishing session selection prior to dataset exposure. |
| **S10** | Prospective Future Sessions | **`PRE_REGISTERED_FROZEN`** | Protocol specification v1.0.0 frozen and hashed prior to prospective dataset acquisition. |

---

## 3. Frozen Prospective Protocol Specification (v1.0.0)

* **Protocol Version**: `1.0.0`
* **Protocol Name**: `S10_PROSPECTIVE_OOS_EVALUATION_PROTOCOL`
* **SHA-256 Specification Hash**: `ade544739a777f0a8434c2e134eca79e964b68da25f78a6488973cc3b2770ab2`
* **Specification File**: [`data_audit/phase_s9_5/s9_5_prospective_protocol_spec.json`](file:///c:/Users/Administrador/Desktop/sm/data_audit/phase_s9_5/s9_5_prospective_protocol_spec.json)

### Protocol Specification Summary

1. **Eligible Instruments & Contract Roll Rules**:
   - Primary Instruments: `NQ` (E-mini NQ Futures, \$20/pt) and `MNQ` (Micro E-mini NQ Futures, \$2/pt).
   - Roll Schedule: Quarterly contracts (H=Mar, M=Jun, U=Sep, Z=Dec). Switch active contract 8 calendar days prior to expiration (second Thursday of contract month).
2. **Trading Session & Timezone**:
   - Session Window: US Equities Regular Trading Hours (RTH) + active ETH (`13:30:00Z` to `20:00:00Z`).
   - Timezone: `America/New_York` (UTC-5 / UTC-4 DST).
3. **Data Source & Timestamp Conventions**:
   - Source: CME Databento MDP3 (`GLBX.MDP3`) direct order book / OHLC aggregate candles.
   - Format: Unix epoch milliseconds (13-digit integer) and ISO 8601 UTC strings.
4. **Execution & Holding Rules**:
   - Holding Duration: Exactly **1 5-minute candle** ($300\text{ seconds}$).
   - Position Overlap: 0 concurrent open positions ($\text{maxConcurrentPositions} = 1$).
   - Sequence: $\text{signalTimestamp} \le \text{confirmationTimestamp} \le \text{entryTimestamp} < \text{exitTimestamp}$.
5. **Cost & Friction Model**:
   - Fixed Friction: **`1.00 pt per trade`** ($0.50\text{ pt}$ bid/ask spread + $0.50\text{ pt}$ commission/slippage).
   - Classification: **`ASSUMPTION_ONLY`** (simulated fixed friction).
6. **Data Quality & Missing Candle Criteria**:
   - Rejection Limit: Max $5.0\%$ missing 5m candles allowed per session.
   - Synthetic Data Policy: Zero synthetic candle insertion or trade replacement allowed.
7. **Primary Metrics & Failure Criteria**:
   - Primary Metrics: Win Rate, Total Net Points, Mean Net Points, Max Drawdown.
   - Diagnostic Metrics: Return Lag-1 Autocorr, Outcome Lag-1 Autocorr, HAC Standard Errors, Block Bootstrap 95% CI.
   - Rejection Criteria: Win Rate $< 60.0\%$, Mean Net Result $< 0.0\text{ pt}$, or Max Drawdown $> 30.0\text{ pt}$.

---

## 4. Prospective Dataset Separation & Namespace

* **Prospective Namespace**: `data_audit/phase_s10_prospective/`
* **Anti-Overlap Exclusion Rules**: Any candidate session overlapping previously evaluated dataset ranges will be automatically rejected by protocol validation:
  - S8-200 Excluded Range: `2026-05-18T18:15:00.000Z` to `2026-05-20T20:00:00.000Z`
  - S8.8 Excluded Range: `2025-12-01T19:35:00.000Z` to `2025-12-01T23:40:00.000Z`
  - S9 Excluded Range: `2025-12-01T18:20:00.000Z` to `2025-12-02T10:55:00.000Z`
* **Session Logging**: An immutable manifest (`s10_session_manifest.json`) will record every eligible prospective session, including sessions with zero signals or negative returns.

---

## 5. Sample Sufficiency Plan

* **Target Acquisition**: **30 to 50 distinct calendar trading sessions** spanning multiple months, contract rolls, and market regimes (trending, rangebound, high/low volatility).
* **Sample Size Adequacy Assessment**:
  - Sample sufficiency will NOT be determined by looking for a favorable interim stopping point.
  - Post-acquisition effective sample size ($N_{\text{eff}}$) will be evaluated using HAC (Newey-West) standard errors and stationary block bootstrap resampling across independent calendar sessions.

---

## 6. Execution Realism Audit

* **Execution Cost Model Classification**: **`ASSUMPTION_ONLY`**
* **Audit Rationale**: Fixed $1.00\text{ pt/trade}$ friction provides a consistent benchmark but represents a theoretical assumption rather than broker fill provenance.
* **Component Breakdown**:
  - Spread Assumption: $0.50\text{ pt}$ (2 ticks on NQ / MNQ)
  - Commission & Slippage Assumption: $0.50\text{ pt}$ (\$10.00 per NQ contract)
  - NQ Point Value: \$20.00 per point
  - MNQ Point Value: \$2.00 per point

---

## 7. Artifact Manifest & Cryptographic Hashes

All protocol artifacts are stored in [`data_audit/phase_s9_5/`](file:///c:/Users/Administrador/Desktop/sm/data_audit/phase_s9_5/):

* `s9_5_prospective_protocol_spec.json` (SHA-256: `ade544739a777f0a8434c2e134eca79e964b68da25f78a6488973cc3b2770ab2`)
* `s9_5_selection_independence_audit.json`
* `s9_5_metrics_summary.json`
* `s9_5_hash_manifest.json`
* `s9_5_artifact_manifest.md`

---

## 8. Exact Next Action

To initiate Phase S10 prospective evaluation without altering the frozen ICT models:

1. **Acquire Raw CME Databento MDP3 Market Data** for 30–50 prospective trading sessions outside the excluded historical date ranges.
2. **Execute Frozen Protocol Ingestion Engine** reading directly from `s9_5_prospective_protocol_spec.json`.
3. **Generate Phase S10 Evaluation Artifacts** under `data_audit/phase_s10_prospective/` without modifying `core/ict/`.

```text
LIVE_TRADING_AUTHORIZED = NO
```
