# OOS Dataset Acquisition Report

**Dataset ID**: `OOS_VALIDATION_DATASET_V1`  
**Dataset Version**: `1.0.0`  
**Date**: October 1, 2026  

---

## 1. Source Inventory & Data Provenance

| Instrument | Timeframe | Start Timestamp | End Timestamp | Candle Count | Source | Endpoint / Method |
| :--- | :---: | :---: | :---: | ---: | :--- | :--- |
| **NQ** | 5m | `1779128100000` | `1779137100000` | 31 | TradeSea WebSocket | `wss://app.tradesea.ai/ws` (`timescale_update`) |
| **MNQ** | 5m | Economically Equivalent | Economically Equivalent | N/A | TradeSea WebSocket | Underlying Nasdaq-100 index |

---

## 2. Historical Data Source Limitation Forensic Audit

```text
HISTORICAL_DATA_SOURCE_LIMITATION = CONFIRMED
```

* **Observed Real Depth**: 31 real NQ 5m candles (`1779128100000` $\rightarrow$ `1779137100000`, 2.5 hours span).
* **Native Client Capabilities**: Native TradeSea web client does NOT emit REST requests, pagination commands, or multi-week historical backfill frames.
* **Audit Discipline**: No synthetic candles, fake fallback, or unverified endpoints were introduced.

---

## 3. Timestamp Normalization

* Canonical standard: **Unix milliseconds (UTC)**.
* Timezone: UTC.
* Ordering: Strict chronological ascending (`timestamp[i] < timestamp[i+1]`).
* OHLC values preserved 100% untouched during normalization.
