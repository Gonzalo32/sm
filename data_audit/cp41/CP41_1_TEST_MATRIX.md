# CP41.1 — CP40 TEST MATRIX RECONCILIATION REPORT

## 1. COMPLETE 15-TEST RECONCILIATION MATRIX (`tests/checkpoint40_causal_lineage.test.ts`)

| Test # | File & Line Range | Real Component Executed | Mocks / Stubs Used | Test Data Input | Verified Assertion | Coverage Limitations |
|---|---|---|---|---|---|---|
| 1 | `checkpoint40_causal_lineage.test.ts:L62-73` | `CandleStore` | None | `makeCandle(100000, 18000, 18010, 17990, 18005)` | Identity key format `symbol\|timeframe\|marketTimestamp` equals `'NQ\|1m\|100000'` | Asserts identity key for 1m timeframe. |
| 2 | `checkpoint40_causal_lineage.test.ts:L76-83` | `ICTPipelineCoordinator` | Synthetic candle input | Single candle `(100000, 18000, 18050, 17950, 18040)` | `engineResult` exists and `candidateContext.eventTimestamp` equals `100000` | Single bar slice evaluation. |
| 3 | `checkpoint40_causal_lineage.test.ts:L86-99` | `ICTEngine` | Synthetic candle slice | 2 candles `[100000, 160000]` | ICT event timestamps $\ge 100000$ and type defined | Minimal multi-bar slice. |
| 4 | `checkpoint40_causal_lineage.test.ts:L102-106` | `CandidateContext` payload | Mock CandidateContext | `makeMockCandidateContext('NQ', '15m', 100000, 160000)` | Temporal ordering: `sourceCandleTs <= eventTs <= confTs` | Mock payload representation. |
| 5 | `checkpoint40_causal_lineage.test.ts:L109-114` | `CandidateContextEngine` | Mock CandidateContext | `makeMockCandidateContext('NQ', '15m', 100000, 160000)` | `supportingEvents` and `sourceCandleTimestamps` contain `100000` | String format verification. |
| 6 | `checkpoint40_causal_lineage.test.ts:L117-122` | `CandidateContextEngine` | Mock CandidateContext | `makeMockCandidateContext('NQ', '15m', 100000, 160000)` | CandidateContext `id === 'ctx_NQ_15m_100000'` and `expirationStatus === 'NOT_DEFINED'` | Default status snapshot. |
| 7 | `checkpoint40_causal_lineage.test.ts:L125-135` | `MultiTimeframeContextEngine` | Mock CandidateContexts | HTF 15m (100000, 160000) & LTF 5m (170000, 175000) | MTF payload retains `15m` source, `5m` target, and `sourceEventIds` | Synthetic context input. |
| 8 | `checkpoint40_causal_lineage.test.ts:L138-147` | `MultiTimeframeContextEngine` | Mock CandidateContexts | HTF 15m (100000, 300000) & LTF 5m (170000, 175000) | Future HTF confirmation ($300000 > 170000$) returns `causal = false`, `NO_CONTEXT` | Timestamp math logic. |
| 9 | `checkpoint40_causal_lineage.test.ts:L150-158` | `MultiTimeframeContextEngine` | Mock CandidateContexts | HTF NQ 15m & LTF MNQ 5m | Symbol mismatch returns `causal = false`, `SYMBOL_MISMATCH` | String equality check. |
| 10 | `checkpoint40_causal_lineage.test.ts:L161-173` | `MultiTimeframeContextEngine` | Mock CandidateContexts | HTF 15m & LTF 5m vs LTF 1m | Target timeframes strictly isolated (`5m` vs `1m`, `mtf5m.id !== mtf1m.id`) | Target timeframe keying. |
| 11 | `checkpoint40_causal_lineage.test.ts:L176-186` | `VisualAdapter` | Mock CandidateContext | Mock state + Mock CandidateContext | Visual object badge created with ID `VIS-ctx_NQ_1m_100000` | Marker shape formatting. |
| 12 | `checkpoint40_causal_lineage.test.ts:L189-204` | `MarketDataAdapter` | Synthetic candles | Ingest -> Disconnect -> Reconnect missing slice | `handleReconnection` returns `success = true`, store preserves candles | In-memory gap fill. |
| 13 | `checkpoint40_causal_lineage.test.ts:L207-215` | `CandleStore` | Synthetic candles | Ingest T0, T1, then late T0 tick (90000) | Late tick returns `success = false`, closed candle immutable | Store order validation. |
| 14 | `checkpoint40_causal_lineage.test.ts:L218-228` | `CandleStore` | Synthetic candles | Ingest identical tick (100000) 3 times | Candle count stays 1, timestamp deduplicated | In-place tick update. |
| 15 | `checkpoint40_causal_lineage.test.ts:L231-255` | `ICTPipelineCoordinator` + `VisualAdapter` | Synthetic candle + mock HTF | Ingest candle (170000) with HTF context (100000, 160000) | End-to-end chain: `Candle -> Event -> Context -> MTF -> Visual` verified | Single bar step. |

```text
CP40_TEST_MATRIX_STATUS = RECONCILED
```
