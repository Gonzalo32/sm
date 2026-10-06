# S6 — Execution Dataset Documentation

## 1. Executive Summary

This document describes the structure, provenance, and summary metrics of the hypothetical execution dataset generated in Phase S6.

* **Total Upstream Signal Observations**: `967`
* **Total Executed Hypothetical Trades**: `919`
* **Total Skipped Conflict Signals**: `48`
* **Dataset File**: `data_audit/phase_s6/s6_execution_dataset.json`

---

## 2. Dataset Schema

Each record in `s6_execution_dataset.json` contains:

```json
{
  "dimensionKey": "MNQ_5m_MODEL_A_LONG_E1_X1_H1_BASE",
  "symbol": "MNQ",
  "timeframe": "5m",
  "model": "MODEL_A",
  "direction": "LONG",
  "entryRule": "E1_CONFIRMATION_CLOSE",
  "exitRule": "X1_H1",
  "frictionLevel": "BASE_FRICTION",
  "executedTradeCount": 312,
  "grossMeanPoints": 28.45,
  "grossMedianPoints": 26.50,
  "netMeanPoints": 27.45,
  "netMedianPoints": 25.50,
  "netMeanUSD": 54.90,
  "stdDevPoints": 12.40,
  "favorableRate": 0.7423,
  "adverseRate": 0.1827,
  "neutralRate": 0.0750,
  "cumulativeNetUSD": 17128.80,
  "maxDrawdownUSD": 48.60,
  "profitFactor": 3.85,
  "breakEvenFrictionPoints": 28.45,
  "economicRobustness": "ECONOMICALLY_POSITIVE"
}
```

---

## 3. Data Integrity & Provenance Verification

1. **Upstream Alignment**: All 919 executed hypothetical trades correspond strictly to confirmed candidate signals from the frozen ICT engine (`core/ict/`).
2. **Conflict Resolution**: The 48 skipped signals were suppressed strictly per the ex-ante S5 `SINGLE_POSITION_PER_SYMBOL_TIMEFRAME` first-confirmed priority rule.
3. **Immutability**: Zero signal timestamps or price levels were altered post-hoc.
