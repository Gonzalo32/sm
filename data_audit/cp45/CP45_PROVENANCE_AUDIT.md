# CP45 — SOURCE PROVENANCE & LINEAGE AUDIT

## 1. END-TO-END PROVENANCE LINEAGE TRACE

Reconstructed full lineage trace across all 8 boundaries:

```text
TradeSea WebSocket Payload (NQ, 1m, timestamp=160000)
       ↓ [B01 - pageBridge Message Extraction]
Raw Candle Object ({ timestamp: 160000, open: 18015, high: 18080, low: 18000, close: 18070 })
       ↓ [B02 - MarketDataAdapter Normalization]
Adapter Ingestion Result (success = true)
       ↓ [B03 - CandleStore Ingestion]
CandleStore Time Series Key: NQ|1m|160000
       ↓ [B04 - ICTEngine Evaluation]
ICT Event: BOS BULLISH @ 160000
       ↓ [B05 - CandidateContextEngine Evaluation]
CandidateContext ID: ctx_NQ_1m_160000 (sourceCandleTimestamps = [160000])
       ↓ [B06 - MultiTimeframeContextEngine Evaluation]
MultiTimeframeContext ID: mtf_NQ_15m_1m_160000 (sourceEventIds = ['BOS BULLISH @ 160000'])
       ↓ [B07/B08 - VisualAdapter Derivation]
VisualObject ID: VIS-sw1 / VIS-BOS (symbol = NQ, timeframe = 1m, timestamp = 160000)
```

---

## 2. PROVENANCE VERIFICATION CONCLUSION

`PROVENANCE_VIOLATIONS = 0`. An independent auditor can trace any renderable `VisualObject` or `MultiTimeframeContext` back through `CandidateContext` and `ICTEvent` directly to the originating market data timestamp.
