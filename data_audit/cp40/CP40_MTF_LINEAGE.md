# CP40 — MULTI-TIMEFRAME (MTF) LINEAGE REPORT

## 1. MTF CAUSAL LINEAGE PROPAGATION
```text
HTF Event
   ↓
HTF CandidateContext (id = ctx_NQ_15m_100000)
   ↓
MultiTimeframeContextEngine.evaluateMTFContext()
   ↓
MultiTimeframeContext (id = mtf_NQ_15m_to_5m_170000)
   ↓
LTF CandidateContext (id = ctx_NQ_5m_170000)
```

## 2. LINEAGE ATTRIBUTES & ISOLATION
* `sourceTimeframe`: Higher timeframe (e.g. `15m` or `5m`).
* `targetTimeframe`: Lower timeframe (e.g. `5m` or `1m`).
* `sourceEventIds`: Contains HTF CandidateContext ID and supporting HTF event IDs.
* `sourceCandleTimestamps`: Contains union of HTF and LTF candle timestamps.
* `causal`: `true` iff $\text{HTF.confTs} \le \text{LTF.evTs}$.
* `symbol`: Strictly isolated (`NQ` vs `MNQ`).
