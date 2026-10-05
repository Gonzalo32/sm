# CP45 — DATA PROPAGATION AUDIT

## 1. RAW INPUT TO NORMALIZED DATA AUDIT

Tested data propagation across representative test cases DATA-01 through DATA-08:

| Case ID | Scenario | Input OHLCV | Stored OHLCV | Pipeline OHLCV | Field Mismatch | Data Loss | Status |
|---|---|---|---|---|---|---|---|
| **DATA-01** | Normal Candle | 18000/18050/17950/18040/100 | Identical | Identical | 0 | None | `VERIFIED` |
| **DATA-02** | Open Candle Update | 18000/18060/17950/18055/150 | Identical (In-place update)| Identical | 0 | None | `VERIFIED` |
| **DATA-03** | Duplicate Candle | 18000/18050/17950/18040/100 | Identical (Collapsed) | Identical | 0 | None | `VERIFIED` |
| **DATA-04** | Out-Of-Order Candle | 18000/18010/17990/18000/100 | Rejected at Store Boundary | N/A | 0 | None | `VERIFIED` |
| **DATA-05** | Symbol Switch (`MNQ`) | `MNQ` 1m | `MNQ` 1m | `MNQ` 1m | 0 | None | `VERIFIED` |
| **DATA-06** | Timeframe Switch (`5m`) | `NQ` 5m | `NQ` 5m | `NQ` 5m | 0 | None | `VERIFIED` |
| **DATA-07** | Boundary Timestamp | `1700000000000` | `1700000000000` | `1700000000000` | 0 | None | `VERIFIED` |
| **DATA-08** | Edge Volume (0 Volume) | `volume = 0` | `volume = 0` | `volume = 0` | 0 | None | `VERIFIED` |

---

## 2. OHLCV CONSERVATION EQUALITY

Across all non-rejected candles:
$$\text{open}_{\text{source}} == \text{open}_{\text{store}} == \text{open}_{\text{pipeline}}$$
$$\text{high}_{\text{source}} == \text{high}_{\text{store}} == \text{high}_{\text{pipeline}}$$
$$\text{low}_{\text{source}} == \text{low}_{\text{store}} == \text{low}_{\text{pipeline}}$$
$$\text{close}_{\text{source}} == \text{close}_{\text{store}} == \text{close}_{\text{pipeline}}$$
$$\text{volume}_{\text{source}} == \text{volume}_{\text{store}} == \text{volume}_{\text{pipeline}}$$
