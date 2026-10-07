# Phase S8 Protocol — Forward Paper Trading & Real-Time Signal Integrity

## 1. Executive Protocol Summary

Phase S8 establishes a forward, real-time paper-trading validation environment for the frozen ICT candidate signal engine (`core/ict/`) and deterministic strategy/execution hypotheses (S5/S6).

* **Status**: PASS_WITH_BOUNDED_SCOPE (Forward Validation Active / Milestone 25 Completed)
* **Baseline Commit**: `57acd4c42e18f234c5dbfa64ba5ba4e45bf59cb5a`
* **Realtime Infrastructure**: TradeSea WebSocket Real-Time Stream
* **Paper Execution Protocol**: Entry E1 (Confirmation Close), Exit X1 (Fixed Horizon), Cost Model BASE_FRICTION ($1.00 pt / $3.24 USD MNQ round turn).
* **Conflict Resolution**: Single position state per symbol/timeframe, first-confirmed priority rule.
* **Capital Risk**: STRICTLY ZERO REAL MONEY.

---

## 2. Immutable Constraints & Frozen Parameters

1. **Production ICT Engine** (`core/ict/`) — 0 lines modified.
2. **Parameters**: `bodyRatio = 0.60`, `minBodyToRangeRatio = 0.60`, `rangeMultiplier = 1.50`, `minRangeMultiplier = 1.50`, `fvgMinSizePoints = 0.25`, `lookbackCandles = 5`, `requireStructuralBreak = false`, `requireFvgCreation = false`.
3. **Upstream Artifacts**: S1, S2, S3, S4, S4.1, S5, S6, S7.

---

## 3. Real-Time Signal Lifecycle & Event Log Architecture

Every real-time confirmed candidate signal transitions through mandatory, deterministic lifecycle states:

```text
SIGNAL_CONFIRMED → PAPER_ENTRY_PENDING → PAPER_ENTRY_FILLED → PAPER_EXIT_PENDING → PAPER_EXIT_FILLED → PAPER_COMPLETED
```

All state transitions and market updates are recorded to an append-only, SHA256 hash-chained event log:

`data_audit/phase_s8/s8_event_log.jsonl`

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
S7_RESULT_MUTATION = NO

LOOKAHEAD_VIOLATIONS = 0
IDENTITY_VIOLATIONS = 0
PROVENANCE_VIOLATIONS = 0
DETERMINISM_VIOLATIONS = 0
DATA_SNOOPING_VIOLATIONS = 0
REALTIME_REPLAY_MISMATCH = 0
DUPLICATE_SIGNAL_VIOLATIONS = 0
DATA_SEQUENCE_VIOLATIONS = 0
```
