# CP53 — Contract Audit Matrix

## 1. Test Scenario Results

| ID | Scenario | Boundary | Expected Behavior | Observed Behavior | Status |
|---|---|---|---|---|---|
| C01 | Field-presence compatibility | B01-B08 | Required fields present across boundaries | Clean field presence | PASS |
| C02 | Field-type compatibility | B01-B08 | Primitive and object types match interface contracts | Types match 100% | PASS |
| C03 | Optional/nullability compatibility | B01-B08 | Optional fields (volume, confirmationTimestamp) default safely | Defaults handled safely | PASS |
| C04 | Enum/value-domain compatibility | B01-B08 | Constrained values (NQ/MNQ, 1m/5m/15m) strictly matched | Enum domains respected | PASS |
| C05 | Timestamp semantic compatibility | B01-B08 | `eventTimestamp` vs `confirmationTimestamp` preserved | Anti-lookahead preserved | PASS |
| C06 | Symbol/timeframe compatibility | B01-B08 | Symbol and timeframe preserved without silent swap | Attribution preserved | PASS |
| C07 | Source-linkage compatibility | B01-B08 | Entity IDs and source candle timestamps preserved | Traceability intact | PASS |
| C08 | Status/state compatibility | B01-B08 | Status domains (CONTEXT_CONFIRMED, CONNECTED) aligned | Domain states aligned | PASS |
| C09 | MTF relation contract compatibility | B05 | Target vs source timeframe causality enforced | Causality logic verified | PASS |
| C10 | Visual contract compatibility | B06 | `VisualObject` derived cleanly from ICT state/context | Visual objects derived | PASS |
| C11 | Diagnostic contract compatibility | B07 | Provenance metadata returns accurate pipeline status | Metadata contract intact | PASS |
| C12 | Update/replacement compatibility | B02-B06 | Forming bar updates replace existing candle without duplicates | Update contract verified | PASS |
| C13 | Backward-compatible fixture | B01-B08 | Older fixture contracts handled cleanly | NOT_DEFINED | NOT_DEFINED |
| C14 | Forward-compatible unknown field | B02 | Extra synthetic fields ignored safely without error | Extra fields ignored | PASS |
| C15 | Schema-drift detection | B01-B08 | Type definitions and interface contracts checked | Interfaces type-checked | PASS |
| C16 | Silent coercion/truncation detection | B01-B08 | No silent conversion or field dropping | Zero silent coercion | PASS |
| C17 | Incompatible contract handling | B02 | Invalid OHLCV rejected cleanly without creating state | Invalid contract rejected | PASS |
| C18 | End-to-end contract consistency | B08 | End-to-end pipeline operates deterministically | End-to-end chain verified | PASS |
