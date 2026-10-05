# CP46 Partial Candle Lifecycle Audit

## 1. Multi-Tick Candle Evolution Audit

The progressive lifecycle of a candle receiving continuous real-time updates was audited across `MarketDataAdapter` and `CandleStore`.

```text
Tick T0 (Open):  [O: 18000, H: 18010, L: 17990, C: 18005, Vol: 50]  -> Partial state registered in CandleStore
Tick T1 (Mid):   [O: 18000, H: 18025, L: 17990, C: 18020, Vol: 100] -> Updated in-place in CandleStore (Count: 1)
Tick T2 (Close): [O: 18000, H: 18030, L: 17985, C: 18015, Vol: 150] -> Finalized candle state (Count: 1)
```

---

## 2. Test Verification Matrix

| Test Case | Scenario Description | Expected Outcome | Observed Result | Status |
|---|---|---|---|---|
| **CND-01** | Single initial candle tick observation | Partial candle added to `CandleStore` | 1 candle stored with initial prices | **VERIFIED** |
| **CND-02** | In-progress tick update to same timestamp | Updates existing candle entity in-place | High/Close updated, count remains 1 | **VERIFIED** |
| **CND-03** | Multiple progressive updates to same candle | Maintains single entity identity without duplication | Entity mutated in-place | **VERIFIED** |
| **CND-04** | Final closed candle update | Stores authoritative closed candle | Closed candle stored correctly | **VERIFIED** |
| **CND-05** | Late tick update after candle close | Updates or rejects according to timestamp contract | Out-of-order past candle rejected | **VERIFIED** |
| **CND-06** | Duplicate final candle payload | Duplicate tick collapsed in-place | Store count remains unchanged | **VERIFIED** |
| **CND-07** | Missing optional volume field | Defaults volume to 0 gracefully | Accepted cleanly with `volume = 0` | **VERIFIED** |
| **CND-08** | Invalid NaN numeric price field | Rejects malformed update immediately | Rejected without store modification | **VERIFIED** |

---

## 3. Conclusions
`CandleStore` correctly maintains single entity identity across progressive tick updates and prevents entity duplication.
