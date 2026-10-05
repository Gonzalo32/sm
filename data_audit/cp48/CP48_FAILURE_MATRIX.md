# CP48 FAILURE MATRIX

| ID | Failure | Expected behavior | Observed behavior | State corrupted? | Recovery | Status |
| --- | --- | --- | --- | --- | --- | --- |
| F01 | malformed WS | reject | returns `{ success: false }`, store size 0 | NO | accepts next valid frame | PASS |
| F02 | malformed event | reject | returns `{ success: false }`, no dispatch | NO | accepts next valid event | PASS |
| F03 | invalid OHLCV | reject | returns `{ success: false }` for NaN/Infinity/Low>High | NO | store remains unmodified | PASS |
| F04 | missing candle field | reject | returns `{ success: false }` for missing open/high/low/close | NO | store remains unmodified | PASS |
| F05 | invalid timestamp | reject | returns `{ success: false }` for timestamp <= 0 | NO | store remains unmodified | PASS |
| F06 | invalid symbol | reject/isolate | rejected or scoped strictly to target symbol | NO | alternative symbols unaffected | PASS |
| F07 | invalid timeframe | reject/isolate | rejected or scoped strictly to target timeframe | NO | alternative timeframes unaffected | PASS |
| F08 | duplicate | contract-defined | returns `{ success: false }`, store size invariant | NO | no duplicate state created | PASS |
| F09 | stale input | contract-defined | returns `{ success: false }`, store size invariant | NO | latest candle preserved | PASS |
| F10 | ICT rejection | no authoritative event | detector returns empty active FVG list | NO | status `NO_CONTEXT` / `CONTEXT_FORMING` | PASS |
| F11 | malformed event | reject | ignored or flagged as unconfirmed | NO | state remains neutral | PASS |
| F12 | context rejection | expire/reject | `confirmationTimestamp` remains `null` | NO | non-authoritative candidate | PASS |
| F13 | invalid MTF | reject | `mtfEngine` yields `causal: false` | NO | state remains unaligned | PASS |
| F14 | MTF causality failure | reject | yields `causal: false` for `T_conf^HTF > T_ev^LTF` | NO | state remains unaligned | PASS |
| F15 | visual rejection | ignore/reject | VisualAdapter yields `[]` on invalid inputs | NO | core ICT state untouched | PASS |
| F16 | component exception | isolate/recover | exception caught by handler, returns failure object | NO | store/pipeline untouched | PASS |
| F17 | reset during failure | clean reset | `reset()` clears store back to size 0 | NO | pristine state re-established | PASS |
| F18 | reconnect after failure | clean recovery | reconnect re-initializes adapter safely | NO | store length invariant | PASS |
| F19 | valid input after failure | accepted | returns `{ success: true }`, canonical state identical | NO | system fully recovered | PASS |
| F20 | cross-context failure | isolate | NQ failure does not alter MNQ store | NO | 100% symbol context isolation | PASS |
