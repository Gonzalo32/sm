# CP40 — END-TO-END CAUSAL TRACE REPORT

## 1. END-TO-END LINEAGE CHAIN ARCHITECTURE
```text
SOURCE DATA (TradeSea WS / Data Adapter)
      ↓
CANDLE (CandleStore: key = symbol|timeframe|marketTimestamp)
      ↓
ICT EVENT (ICTEngine: id = EVT_<TYPE>_<symbol>_<tf>_<timestamp>)
      ↓
EVENT IDENTITY (sourceCandleTimestamp <= eventTimestamp <= confirmationTimestamp)
      ↓
CandidateContext (CandidateContextEngine: id = ctx_<symbol>_<tf>_<firstEventTs>)
      ↓
MTF RELATION (MultiTimeframeContextEngine: id = mtf_<symbol>_<src>_to_<tgt>_<eventTs>)
      ↓
VISUAL OBJECT (VisualAdapter: id = VIS-<ContextID|EventID>)
```

## 2. DETERMINISTIC TRACE VERIFICATION
* **Source Data**: Unique provenance metadata payload (`source`, `instrument`, `timeframe`, `timestamp`).
* **Candle Identity**: Stable key `symbol|timeframe|marketTimestamp`. Open candle mutates in-place; closed candle is immutable.
* **ICT Event**: Unique ID `EVT_<TYPE>_<symbol>_<tf>_<timestamp>` with source candle timestamps attached.
* **CandidateContext**: Traces 100% of supporting events and unique source candle timestamps.
* **MultiTimeframeContext**: Verifies causal availability ($\text{HTF.confTs} \le \text{LTF.evTs}$) and traces HTF/LTF context IDs.
* **VisualObject**: ID formatted as `VIS-<SourceID>` ensuring zero untraceable overlay shapes.
