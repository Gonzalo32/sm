# CP49.1 CONCURRENCY CLASSIFICATION MATRIX

| ID | Scenario | CP49 Classification | Reconciled Classification | Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| C01 | same-candle updates | CONTROLLED_INTERLEAVING | CONTROLLED_INTERLEAVING | Interleaved tick updates to same open candle | PASS |
| C02 | interleaved candles | CONTROLLED_INTERLEAVING | CONTROLLED_INTERLEAVING | Sequential tick updates with out-of-order timestamps | PASS |
| C03 | update/finalization | CONTROLLED_INTERLEAVING | CONTROLLED_INTERLEAVING | Tick arriving for closed candle | PASS |
| C04 | update/duplicate | CONTROLLED_INTERLEAVING | CONTROLLED_INTERLEAVING | Identical tick payload repeated | PASS |
| C05 | update/stale | CONTROLLED_INTERLEAVING | CONTROLLED_INTERLEAVING | Tick with timestamp <= lastClosed | PASS |
| C06 | ICT/state update | SYNCHRONOUS_SIMULATION | SYNCHRONOUS_SIMULATION | In-memory coordinator evaluation | PASS |
| C07 | context replacement | CONTROLLED_INTERLEAVING | CONTROLLED_INTERLEAVING | Candidate context timestamp replacement | PASS |
| C08 | MTF/HTF update | CONTROLLED_INTERLEAVING | CONTROLLED_INTERLEAVING | Interleaved HTF/LTF context evaluation | PASS |
| C09 | LTF/HTF completion | CONTROLLED_INTERLEAVING | CONTROLLED_INTERLEAVING | LTF event after confirmed HTF context | PASS |
| C10 | visual/context replacement | CONTROLLED_INTERLEAVING | CONTROLLED_INTERLEAVING | Visual derivation on active context | PASS |
| C11 | reset/update | CONTROLLED_INTERLEAVING | CONTROLLED_INTERLEAVING | `store.clear()` during update sequence | PASS |
| C12 | reset/callback | CONTROLLED_INTERLEAVING | CONTROLLED_INTERLEAVING | `store.clear()` post-ingestion reset | PASS |
| C13 | reconnect/data | CONTROLLED_INTERLEAVING | CONTROLLED_INTERLEAVING | Connection status `RECONNECTING -> CONNECTED` | PASS |
| C14 | reconnect/old callback | CONTROLLED_INTERLEAVING | CONTROLLED_INTERLEAVING | Reconnect status reset isolation | PASS |
| C15 | symbol switch | CONTROLLED_INTERLEAVING | CONTROLLED_INTERLEAVING | NQ / MNQ store isolation | PASS |
| C16 | timeframe switch | CONTROLLED_INTERLEAVING | CONTROLLED_INTERLEAVING | 1m / 5m store isolation | PASS |
| C17 | multiple contexts | CONTROLLED_INTERLEAVING | CONTROLLED_INTERLEAVING | Concurrent NQ / MNQ ingestion stream | PASS |
| C18 | repeated interleaving | CONTROLLED_INTERLEAVING | CONTROLLED_INTERLEAVING | 100 consecutive interleaved cycles | PASS |
