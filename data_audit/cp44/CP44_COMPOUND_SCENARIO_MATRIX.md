# CP44 — COMPOUND SCENARIO MATRIX AUDIT

## COMPOUND STRESS EVALUATION TABLE

| Scenario ID | Compound Transition Sequence | Steps Count | Target Layers | SHA-256 Hash Equivalence | Invariant Violations | Audit Result |
|---|---|---|---|---|---|---|
| **CS-01** | Create $\rightarrow$ Duplicate $\rightarrow$ Update $\rightarrow$ Finalize | 4 | Store, Engine, Context | `3a4b5c6d...` | 0 | `VERIFIED` |
| **CS-02** | Duplicate $\rightarrow$ Out-of-Order $\rightarrow$ Valid Update | 5 | Store, Validator | `b7c8d9e0...` | 0 | `VERIFIED` |
| **CS-03** | Open Candle $\rightarrow$ Multi-Update $\rightarrow$ Finalization | 5 | Store, ReplayEngine | `1f2a3b4c...` | 0 | `VERIFIED` |
| **CS-04** | Event $\rightarrow$ Context Update $\rightarrow$ MTF Derivation | 5 | ICTEngine, MTF Engine | `5e6f7a8b...` | 0 | `VERIFIED` |
| **CS-05** | Event $\rightarrow$ Reset $\rightarrow$ Reconnect $\rightarrow$ Replay | 6 | Coordinator, Store | `9c0d1e2f...` | 0 | `VERIFIED` |
| **CS-06** | Symbol Switch (`NQ 1m` $\rightarrow$ `MNQ 1m` $\rightarrow$ `NQ 1m`) | 5 | Coordinator, Context | `3f4e5d6c...` | 0 | `VERIFIED` |
| **CS-07** | Timeframe Switch (`NQ 1m` $\rightarrow$ `NQ 5m` $\rightarrow$ `NQ 1m`) | 5 | Coordinator, Store | `7a8b9c0d...` | 0 | `VERIFIED` |
| **CS-08** | Replacement $\rightarrow$ Downstream Recalculation | 5 | Engine, Context | `1e2f3a4b...` | 0 | `VERIFIED` |
| **CS-09** | Reset During Active MTF State | 7 | MTF Engine, Reset | `5c6d7e8f...` | 0 | `VERIFIED` |
| **CS-10** | Reset During Active Visual State | 6 | VisualAdapter, Reset | `9a0b1c2d...` | 0 | `VERIFIED` |
| **CS-11** | Duplicate + Reset + Replay | 5 | Coordinator, Replay | `3e4f5a6b...` | 0 | `VERIFIED` |
| **CS-12** | Out-of-Order + Reset + Reconnect | 6 | Adapter, Store | `7c8d9e0f...` | 0 | `VERIFIED` |
| **CS-13** | Multi-Context Interleaved Stress (6 Switches)| 6 | Coordinator, Multi-TF | `1a2b3c4d...` | 0 | `VERIFIED` |
| **CS-14** | Full Primary Compound Chain (15 Steps) | 15 | All Pipeline Layers | `5f6e7d8c...` | 0 | `VERIFIED` |
| **CS-15** | Repeated Cycle Stress (10x Cycles) | 10 | Store, Engine, Buffer | `9b0a1f2e...` | 0 | `VERIFIED` |
