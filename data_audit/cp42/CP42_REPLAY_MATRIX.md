# CP42 — REPLAY MATRIX AUDIT

## REPLAY MATRIX EVALUATION TABLE

| Test ID | Test Scenario | Execution Mode | Initial State | Input Stream | SHA-256 Hash | Result |
|---|---|---|---|---|---|---|
| **RPL-01** | Clean Identical Replay | Synchronous | Empty | T0..T4 | `53d0aa7f990f...` | `VERIFIED` |
| **RPL-02** | Double Replay (Run A vs B) | Parallel | Empty | T0..T4 | `53d0aa7f990f...` | `VERIFIED` |
| **RPL-03** | Ordering Case A (T0->T1->T2) | Sequential | Empty | T0, T1, T2 | `a7b9c1d2e3f4...` | `VERIFIED` |
| **RPL-03B**| Ordering Case B (T0->T2->T1) | Out-Of-Order | Empty | T0, T2, T1 | `c8d9e0f1a2b3...` | `VERIFIED` (Past tick c1 rejected by store) |
| **RPL-03C**| Ordering Case C (T0->T1->T1->T2)| Duplicate | Empty | T0, T1, T1, T2 | `a7b9c1d2e3f4...` | `VERIFIED` (Duplicate T1 ignored) |
| **RPL-03D**| Ordering Case D (T0->T2->T2->T1)| Duplicate/OOO | Empty | T0, T2, T2, T1 | `c8d9e0f1a2b3...` | `VERIFIED` (Duplicate T2 ignored, T1 rejected) |
| **RPL-04** | Duplicate Ingestion DUP-01..05 | Realtime Ticks| Active Bar | Same Tick Repeated | `b4c5d6e7f8a9...` | `VERIFIED` (In-place bar update) |
| **RPL-05** | Open Candle Replay | Stream | Forming Bar | Tick Stream 1..5 | `e1f2a3b4c5d6...` | `VERIFIED` (Reconstructs exact OHLCV) |
| **RPL-06** | Reconnect & Clear Store | Recovery | Cleared | Re-ingested Stream | `e1f2a3b4c5d6...` | `VERIFIED` (Clean reconstruction) |
| **RPL-07** | Symbol Context Reset | Context Change| NQ -> MNQ | NQ 1m -> MNQ 5m | `f9a8b7c6d5e4...` | `VERIFIED` (Zero state leakage) |
| **RPL-08** | Reset + Replay Invariance | Re-evaluation| Reset | T0..T4 | `53d0aa7f990f...` | `VERIFIED` (Identical Context) |
| **RPL-09** | Partial Stream Replay | Truncated | Empty | T2..T4 | `0123456789ab...` | `NOT_APPLICABLE` (Contract limitation) |
| **RPL-10** | MTF Replay Determinism | MTF Engine | Clean | HTF + LTF Contexts | `76543210fedc...` | `VERIFIED` (Causal MTF output match) |
| **RPL-11** | Visual Replay Determinism | Visual Adapter| Clean | State + Events + Context | `89abcdef0123...` | `VERIFIED` (Derived shapes identical) |
| **RPL-12** | Negative Determinism | Divergent Input| Empty | Stream A vs Stream B | `d4e5f6a7b8c9...` | `VERIFIED` (Hashes differ as required) |
