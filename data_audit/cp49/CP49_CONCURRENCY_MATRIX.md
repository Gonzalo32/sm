# CP49 CONCURRENCY MATRIX

| ID | Scenario | Concurrency type | Ordering rule | Expected result | Observed result | Status |
| --- | --- | --- | --- | --- | --- | --- |
| C01 | same-candle updates | CONTROLLED_INTERLEAVING | timestamp ordering | latest tick updates candle OHLC | OHLC updated without duplication | PASS |
| C02 | interleaved candles | CONTROLLED_INTERLEAVING | timestamp ordering | strictly sorted timestamps | timestamps sorted ascending | PASS |
| C03 | update/finalization | CONTROLLED_INTERLEAVING | status transition | finalized closed candle invariant | late open update rejected | PASS |
| C04 | update/duplicate | CONTROLLED_INTERLEAVING | arrival idempotency | duplicate tick collapsed | single candle stored | PASS |
| C05 | update/stale | CONTROLLED_INTERLEAVING | timestamp monotonicity | stale past tick rejected | rejected cleanly (`success: false`) | PASS |
| C06 | ICT/state update | SYNCHRONOUS_SIMULATION | snapshot isolation | snapshot evaluated deterministically | snapshot evaluated cleanly | PASS |
| C07 | context replacement | CONTROLLED_INTERLEAVING | confirmation timestamp | newer context active | stale context completion ignored | PASS |
| C08 | MTF/HTF update | CONTROLLED_INTERLEAVING | temporal causality | `T_conf^HTF <= T_ev^LTF` | future HTF rejected (`causal: false`) | PASS |
| C09 | LTF/HTF completion | CONTROLLED_INTERLEAVING | temporal causality | valid HTF aligned | aligned (`causal: true`) | PASS |
| C10 | visual/context replacement | CONTROLLED_INTERLEAVING | layer boundary | visual read-only derivation | visuals derived, context unmutated | PASS |
| C11 | reset/update | CONTROLLED_INTERLEAVING | explicit clear | store cleared back to 0 | store cleared cleanly | PASS |
| C12 | reset/callback | CONTROLLED_INTERLEAVING | explicit clear | no zombie state resurrection | pristine clean state | PASS |
| C13 | reconnect/data | CONTROLLED_INTERLEAVING | session generation | state connection reset | reconnect handled without leaks | PASS |
| C14 | reconnect/old callback | CONTROLLED_INTERLEAVING | session generation | old callback discarded | old callback isolated | PASS |
| C15 | symbol switch | CONTROLLED_INTERLEAVING | context identity | NQ/MNQ isolated | NQ completion cannot alter MNQ | PASS |
| C16 | timeframe switch | CONTROLLED_INTERLEAVING | context identity | 1m/5m isolated | 1m completion cannot alter 5m | PASS |
| C17 | multiple contexts | CONTROLLED_INTERLEAVING | context identity | 100% symbol context isolation | 100% isolation across NQ & MNQ | PASS |
| C18 | repeated interleaving | CONTROLLED_INTERLEAVING | memory stability | 100 iterations linear store growth | exactly 101 candles stored per context | PASS |
