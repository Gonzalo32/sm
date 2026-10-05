# CP41.1 — CP41 ADVERSARIAL MTF MATRIX REPORT

## 1. MANDATORY ADVERSARIAL CASES MATRIX (CASES A THROUGH K)

| Case ID | Case Description | Input Timestamps | Event Timestamp | Confirmation Timestamp | Arrival Order | Expected Contract | Observed Result | Causal | Relation Status | Evidence Reference |
|---|---|---|---|---|---|---|---|---|---|---|
| **A** | HTF Confirmed < LTF Event | HTF 100000 / LTF 170000 | 100000 | 160000 | In-order | Causal relation available | Relation created with HTF parameters | `true` | `CONFIRMED` | `tests/checkpoint41_adversarial_lineage.test.ts:L68-77` |
| **B** | HTF Confirmed == LTF Event | HTF 100000 / LTF 150000 | 100000 | 150000 | Boundary | Boundary ($\le$) allowed | Relation created at exact boundary | `true` | `CONFIRMED` | `tests/checkpoint41_adversarial_lineage.test.ts:L80-87` |
| **C** | HTF Confirmed > LTF Event | HTF 100000 / LTF 150000 | 100000 | 300000 | Lookahead | Future HTF rejected | `causal = false`, reason `NON_CAUSAL_LOOKAHEAD` | `false` | `NO_CONTEXT` | `tests/checkpoint41_adversarial_lineage.test.ts:L68-77` |
| **D** | HTF Event Without Confirmation | HTF 100000 / LTF 105000 | 100000 | `null` | Open bar | Unconfirmed HTF rejected | `causal = false`, unconfirmed bar blocked | `false` | `NO_CONTEXT` | `tests/checkpoint41_adversarial_lineage.test.ts:L90-98` |
| **E** | HTF Messages Out-Of-Order | HTF 100000 / LTF 200000 | 100000 | `null` $\rightarrow$ 160000 | Out-of-order | Causal on confirmation arrival | First `false`, then `true` upon confirmation | `true` | `CONFIRMED` | `tests/checkpoint41_adversarial_lineage.test.ts:L101-114` |
| **F** | Late HTF Update | HTF 100000 / LTF 200000 | 100000 | 160000 (Late update) | Re-evaluated | Update re-evaluated causally | Relation updated with confirmed status | `true` | `CONFIRMED` | `tests/checkpoint41_adversarial_lineage.test.ts:L101-114` |
| **G** | Duplicate Identical Message | Candle 170000 | 170000 | 170000 | Repeated | Identical tick stream deduplicated | Context ID `ctx_NQ_1m_170000` remains invariant | `true` | `CONFIRMED` | `tests/checkpoint41_adversarial_lineage.test.ts:L117-127` |
| **H** | Duplicate Message With Changed Content | Active Candle 170000 | 170000 | 170000 | Tick update | In-place high/low/close update | In-place candle mutation, open price preserved | `true` | `AVAILABLE` | `tests/checkpoint38_realtime_stability.test.ts:L61-79` |
| **I** | Open Candle Update | Active Candle 100000 | 100000 | Active | Realtime stream | High/low/close update | High/low expanded, open price preserved | `true` | `AVAILABLE` | `tests/checkpoint38_realtime_stability.test.ts:L61-79` |
| **J** | T0, T2, T1 Out-Of-Order Sequence | T0 (100k), T2 (220k), T1 (160k) | 160000 | 160000 | T0 $\rightarrow$ T2 $\rightarrow$ T1 | Past out-of-order T1 rejected | T1 rejected by active candle guard (`160k < 220k`) | `false` | `DATA_REJECTED` | `tests/checkpoint38_realtime_stability.test.ts:L137-147` |
| **K** | Reconnect / Open Candle Repetition | T0 Open $\rightarrow$ Disconnect $\rightarrow$ T0 Update | 100000 | 100000 | Reconnect | Open T0 preserved, closed on T1 | T0 updated post-reconnect, closed on T1 arrival | `true` | `CONFIRMED` | `tests/checkpoint38_realtime_stability.test.ts:L241-259` |

```text
CP41_MTF_MATRIX_STATUS = COMPLETE
```
