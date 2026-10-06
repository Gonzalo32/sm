# CP51 NEGATIVE CASES AUDIT (N01–N10)

| ID | Case Description | Tested Action | Expected Result | Observed Result | Status |
| --- | --- | --- | --- | --- | --- |
| N01 | Corrupted serialized state | `ValidationLabEngine.fromJSON(malformed)` | Throws SyntaxError | SyntaxError thrown cleanly | PASS |
| N02 | Missing canonical identity | Ingest candle missing timestamp | Rejected (`success: false`) | Rejected by store | PASS |
| N03 | Invalid timestamp | Ingest candle timestamp = -100 | Rejected (`success: false`) | Rejected by store | PASS |
| N04 | Invalid symbol | Ingest tick into isolated store | Scoped to target symbol | Isolated to NQ store | PASS |
| N05 | Invalid timeframe | Ingest tick into isolated timeframe | Scoped to target timeframe | Isolated to 1m store | PASS |
| N06 | Broken source linkage | CandidateContext without source TS | Evaluates status `NO_CONTEXT` | Evaluates `NO_CONTEXT` | PASS |
| N07 | Invalid causal metadata | `T_conf^HTF > T_ev^LTF` | Returns `causal: false` | Returns `causal: false` | PASS |
| N08 | Duplicated entity identity | Ingest duplicate tick at T=100000 | Collapsed to single candle | Single candle stored | PASS |
| N09 | Stale derived entity | VisualAdapter on unconfirmed context | Non-authoritative visuals | Derived read-only overlay | PASS |
| N10 | Cross-context reconstruction | Reconstruct NQ case in MNQ engine | Scoped strictly to target | Zero cross-contamination | PASS |
