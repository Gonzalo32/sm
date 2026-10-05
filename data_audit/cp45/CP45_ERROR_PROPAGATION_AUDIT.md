# CP45 — ERROR & REJECTION PROPAGATION AUDIT

## 1. ERROR & REJECTION MATRIX

Cases ERR-01 through ERR-08 were evaluated to verify error boundary isolation:

| Case ID | Input Condition | Upstream Boundary (B01-B03) | Store Action | Downstream Impact | Unauthorized State Created? | Status |
|---|---|---|---|---|---|---|
| **ERR-01** | Malformed WS Message | `pageBridge` | Log & Drop | No pipeline trigger | `NO` | `VERIFIED` |
| **ERR-02** | Missing Required Field | `MarketDataAdapter` | Return `success = false` | Store untouched | `NO` | `VERIFIED` |
| **ERR-03** | Invalid Timestamp (`NaN`) | `CandleValidator` | Validation Error | Store untouched | `NO` | `VERIFIED` |
| **ERR-04** | Invalid Price (`open = NaN`) | `CandleValidator` | Validation Error | Store untouched | `NO` | `VERIFIED` |
| **ERR-05** | Synthetic Dataset (Real Runtime) | `MarketDataAdapter` | Blocked & Error state | Adapter disconnected | `NO` | `VERIFIED` |
| **ERR-07** | Duplicate Message | `CandleStore` | In-place OHLC update | Active bar updated | `NO` | `VERIFIED` |
| **ERR-08** | Out-of-Order Past Candle | `CandleStore` | Reject out-of-order ts | Store count unchanged | `NO` | `VERIFIED` |

---

## 2. ERROR BOUNDARY ISOLATION CONCLUSION

`ERROR_PROPAGATION_VIOLATIONS = 0`. Rejections at B01/B02/B03 prevent corrupted data from leaking into `CandleStore` or triggering unauthorized downstream ICT events.
