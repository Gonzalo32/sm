# Phase S7 Protocol — ICT Signal Out-of-Sample & Robustness Validation Protocol

## 1. Executive Protocol Summary

Phase S7 executes an independent out-of-sample (OOS) validation of the frozen ICT candidate signal engine (`core/ict/`) and deterministic strategy/execution hypotheses (S5/S6) on genuinely unseen market candle data.

* **Status**: PASS_WITH_BOUNDED_SCOPE
* **Baseline Commit**: `57acd4c42e18f234c5dbfa64ba5ba4e45bf59cb5a`
* **Upstream Evidence Level**: Phase S6 PASS_WITH_BOUNDED_SCOPE
* **OOS Dataset Status**: `GENUINE_OOS` sealed in `oos_dataset/manifest.json` (SHA256: `437065add6f1...`).
* **Contamination Status**: `OOS_CONTAMINATION = 0` (zero timestamp overlap with S1–S6).

---

## 2. Immutable Constraints & Frozen Boundaries

The following components remain 100% frozen:

1. **Production ICT Engine** (`core/ict/`) — zero lines modified.
2. **ICT Parameters**: `bodyRatio = 0.60`, `minBodyToRangeRatio = 0.60`, `rangeMultiplier = 1.50`, `minRangeMultiplier = 1.50`, `fvgMinSizePoints = 0.25`, `lookbackCandles = 5`, `requireStructuralBreak = false`, `requireFvgCreation = false`.
3. **Upstream Artifacts**: S1, S2, S3, S4, S4.1, S5, S6.
4. **Execution Rules & Cost Scenarios**: E1, E2, E3; X1, X2, X3; LOW, BASE, HIGH friction scenarios.

---

## 3. Out-of-Sample Sealing & Provenance Audit

```text
OOS_DATASET_ID = OOS_VALIDATION_DATASET_V1
OOS_SOURCE = TradeSea WebSocket Real Market Data Stream
OOS_SYMBOL = NQ / MNQ
OOS_TIMEFRAME = 5m
OOS_START_TIMESTAMP = 1779128100000 (2026-05-18T18:15:00.000Z)
OOS_END_TIMESTAMP = 1779137100000 (2026-05-18T20:45:00.000Z)
OOS_CANDLE_COUNT = 31
OOS_SEALING_HASH = 437065add6f115ad7f0f9a534dad60165bd506f49fd6d989d9fd544a871167df
PROVENANCE_CLASSIFICATION = GENUINE_OOS
```

---

## 4. Verification & Required Invariants

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

LOOKAHEAD_VIOLATIONS = 0
IDENTITY_VIOLATIONS = 0
PROVENANCE_VIOLATIONS = 0
DETERMINISM_VIOLATIONS = 0
DATA_SNOOPING_VIOLATIONS = 0
OOS_CONTAMINATION = 0
OOS_DATA_REUSED_FOR_SELECTION = NO
```
