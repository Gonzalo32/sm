# CP51 SNAPSHOT MATRIX (S01–S15)

| ID | Mechanism | Applicable | Test | Expected | Observed | Status |
| --- | --- | ---: | --- | --- | --- | --- |
| S01 | Snapshot | YES | `buildDetectionSnapshot` | Frozen detection snapshot created | Frozen snapshot created | PASS |
| S02 | Structural equivalence | YES | `toEqual` check | Original == snapshot structure | `toEqual` matches 100% | PASS |
| S03 | Snapshot determinism | YES | Repeated snapshot | Deterministic output | Identical frozen object | PASS |
| S04 | Serialization round-trip | YES | `toJSON` -> `fromJSON` | Round-trip identity match | Lossless round-trip | PASS |
| S05 | Clone isolation | YES | Modify imported case | Original state unmutated | Zero mutation leak | PASS |
| S06 | Identity preservation | YES | `caseId` / `event.id` | Identity retained | Retained cleanly | PASS |
| S07 | Timestamp preservation | YES | `eventTimestamp`, `confirmationTimestamp` | Anti-lookahead `T_conf^HTF <= T_ev^LTF` | Causality preserved | PASS |
| S08 | Symbol/TF isolation | YES | NQ vs MNQ, 1m vs 5m | 100% context isolation | Zero cross-contamination | PASS |
| S09 | Derived-state reconstruction | YES | VisualAdapter on hydrated state | Non-authoritative visuals derived | Visuals derived read-only | PASS |
| S10 | Partial snapshot | YES | Malformed JSON | Exception thrown / rejected | Exception thrown cleanly | PASS |
| S11 | Unknown fields | YES | Extra JSON fields | Safely ignored or preserved | Preserved without error | PASS |
| S12 | Reset/reconstruction | YES | `replayEngine.reset()` | Slice reset to initial index | Reset back cleanly | PASS |
| S13 | Cardinality | YES | Array length check | `BEFORE == AFTER` | `BEFORE == AFTER` | PASS |
| S14 | Canonical hash | YES | JSON state hash | Deterministic hash match | `hashA === hashB` | PASS |
| S15 | Negative corruption cases | YES | Negative timestamp tick | Rejected by store | Rejected (`success: false`) | PASS |
