# CP50 SOURCE-TO-DERIVED TRACE MATRIX

## 1. PHYSICAL TRACE TABLE

| Context | Candle TS | ICT Event ID | CandidateContext ID | MTF Relation | VisualObject ID |
| --- | --- | --- | --- | --- | --- |
| NQ 1m | `100000` | `fvg_NQ_1m_100000` | `ctx_NQ_1m_100000` | Causal (`htfConfirmedAt: 95000`) | `vis_fvg_NQ_1m_100000` |
| NQ 5m | `100000` | `fvg_NQ_5m_100000` | `ctx_NQ_5m_100000` | HTF Context (`15m`) | `vis_fvg_NQ_5m_100000` |
| NQ 15m | `100000` | `fvg_NQ_15m_100000` | `ctx_NQ_15m_100000` | HTF Context (`60m`) | `vis_fvg_NQ_15m_100000` |
| MNQ 1m | `100000` | `fvg_MNQ_1m_100000` | `ctx_MNQ_1m_100000` | Causal (`htfConfirmedAt: 95000`) | `vis_fvg_MNQ_1m_100000` |

---

## 2. VERDICT

Source-to-derived lineage is physical, explicit, and unambiguous across all tested symbol and timeframe contexts.
