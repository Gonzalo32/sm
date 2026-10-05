# CP40 — EVENT LINEAGE & TIMING AUDIT REPORT

## 1. ICT EVENT CATEGORY LINEAGE INVENTORY

| Event Type | Event ID Format | Source Candle Timestamps | Confirmation Timestamp Rule |
|---|---|---|---|
| `STRUCTURE_UPDATE` | `EVT_STRUCT_<sym>_<tf>_<ts>` | Active Swing High / Low | Immediate on candle evaluation |
| `BOS_CONFIRMED` | `EVT_BOS_<sym>_<tf>_<ts>` | Break candle timestamp | Confirmed on candle close |
| `MSS_CONFIRMED` | `EVT_MSS_<sym>_<tf>_<ts>` | Shift candle timestamp | Confirmed on candle close |
| `DISPLACEMENT` | `EVT_DISP_<sym>_<tf>_<ts>` | Displacement candle timestamp | Confirmed on candle close |
| `FVG_DETECTED` | `EVT_FVG_<sym>_<tf>_<ts>` | 3-bar gap sequence (`[c1, c2, c3]`) | Confirmed on 3rd bar close |
| `LIQUIDITY_EVENT` | `EVT_LIQ_<sym>_<tf>_<ts>` | Level creation & sweep candle | Confirmed on sweep penetration |
| `PD_ARRAY_CONTEXT` | `EVT_PD_<sym>_<tf>_<ts>` | Dealing range swing boundaries | Immediate snapshot |

## 2. EVENT TEMPORAL INTEGRITY
For all events:
$$\text{sourceCandleTimestamp} \le \text{eventTimestamp} \le \text{confirmationTimestamp}$$
Events with `confirmationTimestamp = null` represent unconfirmed open bar events and cannot seed causal MTF context.
