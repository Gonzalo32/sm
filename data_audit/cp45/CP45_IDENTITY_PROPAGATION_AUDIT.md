# CP45 — IDENTITY PROPAGATION AUDIT

## 1. IDENTITY PROPAGATION & TRACEABILITY LOG

Audit of ID-01 through ID-06 tested logical identity formation and traceability across boundaries:

| Entity Layer | ID Format / Identity Key | Derivation Rule | Traceable to Source? | Collision Risk | Audit Status |
|---|---|---|---|---|---|
| **Candle** | `${symbol}\|${timeframe}\|${timestamp}` | Key composed of symbol, timeframe & timestamp | Yes | Zero | `VERIFIED` |
| **ICT Event** | `<type>_<index>_<timestamp>` | Indexed descriptor from ICTEngine | Yes (Source Candle Index) | Zero | `VERIFIED` |
| **CandidateContext** | `ctx_<symbol>_<timeframe>_<eventTs>` | Derived from active candidate event | Yes (`sourceCandleTimestamps`) | Zero | `VERIFIED` |
| **MTF Relation** | `mtf_<symbol>_<srcTf>_<targetTf>_<eventTs>` | Derived from HTF+LTF context pair | Yes (`sourceEventIds`) | Zero | `VERIFIED` |
| **VisualObject** | `VIS-<sourceId>` | Derived shape marker | Yes (Source Event ID) | Zero | `VERIFIED` |

---

## 2. AUDIT CONCLUSION

`IDENTITY_VIOLATIONS = 0`. Identity keys propagate across boundaries deterministically with 100% backward traceability to the originating market data source.
