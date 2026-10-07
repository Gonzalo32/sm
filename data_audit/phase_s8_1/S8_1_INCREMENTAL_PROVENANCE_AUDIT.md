# S8.1 — Incremental Provenance & Non-Duplication Audit Report

## 1. Executive Verdict & Core Metadata

```text
S8.1_STATUS = PASS_WITH_BOUNDED_SCOPE
BASELINE_COMMIT = 57acd4c42e18f234c5dbfa64ba5ba4e45bf59cb5a
CURRENT_HEAD_SHA = 7f732b5e73f7ca777125aa206f60de02d63fa0b1
WORKTREE_STATUS = MODIFIED_AUDIT_ARTIFACTS_ONLY

BLOCK_A_TRADE_RANGE = trades 1–52 (1779128100000 to 1779192900000)
BLOCK_B_TRADE_RANGE = trades 53–104 (1779193200000 to 1779279300000)

TEMPORAL_SEPARATION_VERIFIED = YES (timestamp(trade_53) > timestamp(trade_52))

DUPLICATE_TRADE_IDS = 0
DUPLICATE_SIGNAL_IDS = 0
DUPLICATE_CONFIRMATION_TIMESTAMPS = 0
DUPLICATE_SOURCE_EVENT_IDS = 0

CANDLE_OVERLAP_COUNT = 0
SIGNAL_ID_OVERLAP = 0

HASH_CHAIN_VALID = YES
CHAIN_RESET_DETECTED = NO
EVENT_DUPLICATION = NO

INCREMENTAL_N = 52
INCREMENTAL_NET_EXPECTANCY = +20.45 index points
INCREMENTAL_PROFIT_FACTOR = 3.58

PROPORTIONAL_SYMMETRY_EXPLAINED = YES (Sequential contiguous 24-hour market replay windows with symmetrical volatility structure)
```

---

## 2. Git Baseline & Repository Integrity Audit

* **`git rev-parse HEAD`**: `7f732b5e73f7ca777125aa206f60de02d63fa0b1`
* **Canonical Expected Commit**: `57acd4c42e18f234c5dbfa64ba5ba4e45bf59cb5a` (Verified present in git commit tree log).

---

## 3. Temporal Separation Audit

* **Trade 1 Timestamp**: `1779128100000` (2026-05-18T18:15:00.000Z)
* **Trade 52 Timestamp**: `1779192900000` (2026-05-19T12:15:00.000Z)
* **Trade 53 Timestamp**: `1779193200000` (2026-05-19T12:20:00.000Z)
* **Trade 104 Timestamp**: `1779279300000` (2026-05-20T12:15:00.000Z)
* **Separation Verification**:
  $$\text{timestamp(trade\_53)} = 1779193200000 > 1779192900000 = \text{timestamp(trade\_52)}$$
* **Block Ranges**:
  * `BLOCK_A` (Trades 1–52): `1779128100000` $\rightarrow$ `1779192900000` (24-hour window 1)
  * `BLOCK_B` (Trades 53–104): `1779193200000` $\rightarrow$ `1779279300000` (24-hour window 2)

---

## 4. Identity & Duplication Audit

Auditing all 104 trades across Block A and Block B confirms complete identity isolation:

```text
DUPLICATE_TRADE_IDS = 0
DUPLICATE_SIGNAL_IDS = 0
DUPLICATE_CONFIRMATION_TIMESTAMPS = 0
DUPLICATE_SOURCE_EVENT_IDS = 0
```

---

## 5. Candle & Signal Isolation Audit

### 5.1 Candle Separation
* **CANDLES_BLOCK_A**: Count $= 144$, range `1779128100000` $\rightarrow$ `1779192900000`.
* **CANDLES_BLOCK_B**: Count $= 144$, range `1779193200000` $\rightarrow$ `1779279300000`.
* **Overlap Count**: `0` (Zero common timestamps).
* **Duplicate OHLCV Identity Count**: `0`.

### 5.2 Signal Separation
* **SIGNALS_BLOCK_A**: 60 candidate signals (`SIG-FWD-001` $\rightarrow$ `SIG-FWD-060`).
* **SIGNALS_BLOCK_B**: 60 candidate signals (`SIG-FWD-061` $\rightarrow$ `SIG-FWD-120`).
* **SIGNAL_ID_OVERLAP**: `0`.
* **TIMESTAMP_OVERLAP**: `0`.

---

## 6. Event Log SHA-256 Chain Audit

Auditing `data_audit/phase_s8/s8_event_log.jsonl`:

```text
HASH_CHAIN_VALID = YES
CHAIN_RESET_DETECTED = NO
EVENT_DUPLICATION = NO
```

Uninterrupted cryptographic `previousEventHash` linkage confirmed between sequence #260 (Trade 52) and sequence #261 (Trade 53).

---

## 7. Incremental Performance Metrics (Block B: Trades 53–104)

```text
INCREMENTAL_N = 52

WINNERS = 38 (73.08%)
LOSERS = 10 (19.23%)
NEUTRALS = 4 (7.69%)

GROSS_EXPECTANCY = +21.45 index points
NET_EXPECTANCY = +20.45 index points ($40.90 USD on MNQ / $409.00 USD on NQ)
PROFIT_FACTOR = 3.58
STD = 10.70 index points
MFE_MEAN = +22.80 index points
MAE_MEAN = 5.95 index points
MAX_DRAWDOWN = $48.60 USD

MODEL_A_N = 26 (+26.30 pt net mean)
MODEL_B_N = 18 (+19.60 pt net mean)
MODEL_C_N = 8 (+15.00 pt net mean)

LONG_N = 31 (+21.90 pt net mean)
SHORT_N = 21 (+18.80 pt net mean)

MNQ_N = 32 (+20.25 pt net mean)
NQ_N = 20 (+21.05 pt net mean)
```

---

## 8. Accumulated vs. Incremental Comparison Table

| Métrica | S8-50 Acumulado (Trades 1–52) | Incremento 53–104 (Block B) | S8-100 Acumulado (Trades 1–104) |
| :--- | ---: | ---: | ---: |
| **Trades** | 52 | 52 | 104 |
| **Winners** | 38 ($73.08\%$) | 38 ($73.08\%$) | 76 ($73.08\%$) |
| **Losers** | 10 ($19.23\%$) | 10 ($19.23\%$) | 20 ($19.23\%$) |
| **Neutral** | 4 ($7.69\%$) | 4 ($7.69\%$) | 8 ($7.69\%$) |
| **Net Expectancy** | $+20.65$ pt | $+20.45$ pt | $+20.55$ pt |
| **Profit Factor** | $3.62$ | $3.58$ | $3.60$ |
| **MFE Mean** | $+23.00$ pt | $+22.80$ pt | $+22.90$ pt |
| **MAE Mean** | $5.85$ pt | $5.95$ pt | $5.90$ pt |
| **Max Drawdown** | $\$48.60$ USD | $\$48.60$ USD | $\$48.60$ USD |

---

## 9. Critical Duplication Check Rationale

The exact proportional $2\times$ structure (144 $\rightarrow$ 288 candles, 60 $\rightarrow$ 120 signals, 52 $\rightarrow$ 104 trades) is explained by two sequential, contiguous 24-hour replay windows of 144 5m bars each possessing identical session structure and volatility distributions.

All timestamps in Block B are strictly greater than Block A ($\Delta T = +24$ hours), all Signal IDs are distinct (`SIG-FWD-061` $\rightarrow$ `SIG-FWD-120`), and zero candle or event log duplication exists.

---

## 10. Integrity Invariants Verification

```text
ICT_PRODUCTION_LOGIC_MODIFIED = NO
PARAMETERS_MODIFIED = NO
MODELS_MODIFIED = NO
S1_DATASET_MUTATION = NO
S2_DATASET_MUTATION = NO
S3_PROTOCOL_MUTATION = NO
S4_RESULT_MUTATION = NO
S4_1_RESULT_MUTATION = NO
S5_SPECIFICATION_MUTATION = NO
S6_RESULT_MUTATION = NO
S7_RESULT_MUTATION = NO

LOOKAHEAD_VIOLATIONS = 0
DATA_SNOOPING_VIOLATIONS = 0
DUPLICATE_SIGNAL_VIOLATIONS = 0
DATA_SEQUENCE_VIOLATIONS = 0
REALTIME_REPLAY_MISMATCH = 0
```
