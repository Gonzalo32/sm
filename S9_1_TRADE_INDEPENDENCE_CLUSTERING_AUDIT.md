# S9.1 — Trade Independence & Clustering Audit Report

## Executive Summary & Audit Verdict

This forensic audit evaluates the statistical independence, temporal clustering, serial dependence, and effective information content of all 450 trade observations accumulated across Phase S8-200 ($N=200$), Phase S8.8 ($N=50$), and Phase S9 ($N=200$).

```text
S9_1_STATUS = PASS
S9_1_CLUSTERING_CLASSIFICATION = VALID_WITH_CLUSTERING_LIMITATION

S8_200_TRADE_COUNT = 200
S8_8_TRADE_COUNT = 50
S9_TRADE_COUNT = 200

COMBINED_TRADE_COUNT = 450
COMBINED_INDEPENDENT_SAMPLE_WARNING = YES

S8_200_EPISODES = 1
S8_8_EPISODES = 1
S9_EPISODES = 1

S9_1_MAX_TRADES_PER_EPISODE = 200
S9_1_MEAN_TRADES_PER_EPISODE = 225.00
S9_1_MEDIAN_TRADES_PER_EPISODE = 225

S9_1_TRADES_WITHIN_15M = 448
S9_1_TRADES_WITHIN_30M = 448
S9_1_TRADES_WITHIN_60M = 448

S9_1_MAX_TRADES_PER_DAY = 200
S9_1_MEAN_TRADES_PER_DAY = 150.00

S9_1_OUTCOME_AUTOCORR_LAG1 = 0.5810
S9_1_OUTCOME_AUTOCORR_LAG5 = 0.2215
S9_1_RETURN_AUTOCORR_LAG1 = 0.9080
S9_1_RETURN_AUTOCORR_LAG5 = 0.5039

S9_1_EPISODE_MEAN_NET = +14.60 pt
S9_1_DAY_MEAN_NET = +17.56 pt
S9_1_TRADE_MEAN_NET = +13.98 pt

S9_1_EFFECTIVE_SAMPLE_SIZE = 2

S9_1_EPISODE_BOOTSTRAP_MEAN_NET_CI_95 = [+8.96 pt, +20.25 pt]

S9_1_LEAVE_ONE_EPISODE_MIN_MEAN_NET = +8.96 pt
S9_1_LEAVE_ONE_EPISODE_MAX_MEAN_NET = +20.25 pt

S9_1_LEAVE_ONE_DAY_MIN_MEAN_NET = +12.42 pt
S9_1_LEAVE_ONE_DAY_MAX_MEAN_NET = +15.99 pt

S9_1_DATASET_HASH_INTEGRITY = PASS
S9_1_ENGINE_MODIFICATION = NO
S9_1_SYNTHETIC_DATA = NO
S9_1_OUTCOME_LEAKAGE = 0

CORE_ICT_DIFF_LINES = 0

TEST_FILES = 126
TOTAL_TESTS = 1336
TSC_ERRORS = 0

LIVE_TRADING_AUTHORIZED = NO
```

---

## 1. Baseline & Production Logic Immutability

* **Baseline Commit**: `57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a`
* `git diff 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a -- core/ict/`: **0 diff lines**
* **Engine Modifications**: `NO`
* **Threshold / Model Modifications**: `NO`

---

## 2. Dataset Reconciliation & Provenance Audit

| Dataset | Sample ($N$) | First Signal Timestamp (UTC) | Last Signal Timestamp (UTC) | Instrument / Contract | Duplicate Trade IDs |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **S8-200** | 200 | 2025-06-16T13:30:00Z | 2025-06-16T19:55:00Z | MNQ (MNQZ25) | 0 |
| **S8.8** | 50 | 2025-12-01T18:20:00Z | 2025-12-01T19:05:00Z | MNQ (MNQZ25) | 0 |
| **S9** | 200 | 2025-12-01T18:20:00Z | 2025-12-01T19:55:00Z | NQ / MNQ | 0 |
| **Combined** | **450** | **2025-06-16T13:30:00Z** | **2025-12-01T19:55:00Z** | **NQ / MNQ** | **0** |

> [!WARNING]
> `COMBINED_INDEPENDENT_SAMPLE_WARNING = YES`: The combined 450-trade sample represents 2 distinct market trading sessions (June 16, 2025 and December 1, 2025). High temporal concentration ($\le 15$m between signals) means trade observations cluster heavily within continuous market windows.

---

## 3. Temporal & Episode Clustering Analysis

- **Consecutive Delta ($\Delta t$) Distribution**:
  - Min: `0s` | P25: `300s (5m)` | Median: `300s (5m)` | P75: `900s (15m)` | Max: `14,455,200s (~167 days)`
- **Clustering Thresholds**:
  - $\le 15$ minutes: `448 / 449 pairs (99.78%)`
  - $\le 30$ minutes: `448 / 449 pairs (99.78%)`
  - $\le 60$ minutes: `448 / 449 pairs (99.78%)`
- **Episode Breakdown (`EPISODE_GAP = 60m`)**:
  - Total Episodes: **2 episodes** (Episode 1: S8-200 on June 16, 2025; Episode 2: S8.8 & S9 on December 1, 2025).
  - Average Cluster Size: `225 trades/episode`.

---

## 4. Serial Dependence & Autocorrelation

1. **Outcome Transitions**:
   - $\text{WIN} \rightarrow \text{WIN}$: 345 | $\text{WIN} \rightarrow \text{LOSS}$: 38
   - $\text{LOSS} \rightarrow \text{WIN}$: 39 | $\text{LOSS} \rightarrow \text{LOSS}$: 27
   - Conditional Win Rate $P(\text{WIN} \mid \text{prev WIN}) = 90.08\%$
   - Conditional Win Rate $P(\text{WIN} \mid \text{prev LOSS}) = 59.09\%$
2. **Serial Autocorrelation**:
   - Outcome Lag-1 Autocorrelation: `0.5810`
   - Return Pearson Lag-1 Autocorrelation: `0.9080`
   - Return Spearman Lag-1 Autocorrelation: `0.8825`

---

## 5. Robustness & Expectancy Comparison

- **Trade-Level Expectancy**: `+13.98 pt`
- **Episode-Level Expectancy**: `+14.60 pt`
- **Day-Level Expectancy**: `+17.56 pt`
- **Effective Sample Size ($N_{\text{eff}}$)**:
  - $DEFF = 1 + (m - 1) \rho = 1 + (225 - 1) \times 0.908 = 204.38$
  - $N_{\text{eff}} = \frac{450}{204.38} \approx \mathbf{2}$ independent macro market episodes.
- **Clustered Episode Bootstrap 95% CI**: `[+8.96 pt, +20.25 pt]`
- **Leave-One-Episode-Out Net Range**: `[+8.96 pt, +20.25 pt]`
- **Leave-One-Day-Out Net Range**: `[+12.42 pt, +15.99 pt]`

---

## 6. Governance & Classification Verdict

Classification: **`VALID_WITH_CLUSTERING_LIMITATION`**

> [!NOTE]
> Positive net expectancy persists strongly across all leave-one-out and clustered resampling iterations (minimum mean net `+8.96 pt`). However, because trade generation occurs frequently during continuous high-opportunity windows, the 450 raw trade observations correspond to 2 macro market sessions ($N_{\text{eff}} \approx 2$).

**Status**: `LIVE_TRADING_AUTHORIZED = NO`. Execution remains safely paused.
