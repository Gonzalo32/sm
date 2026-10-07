# Phase S9 — Expanded Independent OOS Real-Market Validation Audit Report

## EXECUTIVE SUMMARY

Phase S9 executes an expanded independent out-of-sample (OOS) validation of the frozen ICT signal engine across 200 genuine real-market trades derived from CME Databento futures contracts (`NQZ25`, `NQH26`, `NQM26`, `MNQZ25`, `MNQH26`, `MNQM26`).

### Key Audit Metrics Summary

* **Production Engine Diff against `57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a`**: **0 diff lines**
* **OOS Dataset Source**: CME Databento MDP3 (`GLBX.MDP3`)
* **Total Evaluated OOS Trades ($N$)**: 200
* **OOS Win Rate**: `84.50%` (169 wins / 31 losses)
* **Wilson 95% Win Rate CI**: `[78.84%, 88.86%]`
* **Bootstrap 95% Mean Net CI**: `[+7.93 pt, +10.14 pt]`
* **OOS Mean Net Result**: `+9.03 pt`
* **OOS Median Net Result**: `+7.50 pt`
* **OOS Total Net Points**: `+1805.25 pt`
* **OOS Max Drawdown**: `8.25 pt`
* **Anti-Leakage Violations**: `0`
* **Deterministic Replay Match**: `100%` (2 runs)

```text
S9_STATUS = PASS
S9_OOS_CLASSIFICATION = EXPANDED_INDEPENDENT_OOS_VALIDATION
LIVE_TRADING_AUTHORIZED = NO
```

---

## 1. PERFORMANCE COMPARISON (S8-200 vs S8.8 vs S9)

| Metric | S8-200 | S8.8 OOS | S9 Expanded OOS |
| :--- | :---: | :---: | :---: |
| **Trades ($N$)** | 200 | 50 | **200** |
| **Win Rate** | 72.00% | 86.00% | **84.50%** |
| **Mean Net Result** | +20.25 pt | +8.68 pt | **+9.03 pt** |
| **Median Net Result** | +23.00 pt | +7.25 pt | **+7.50 pt** |
| **Total Net Points** | +4050.00 pt | +434.00 pt | **+1805.25 pt** |
| **Max Drawdown** | 18.00 pt | 4.75 pt | **8.25 pt** |

---

## 2. GOVERNANCE STATEMENT

> Phase S9 provides expanded empirical evidence of outcome persistence across an independent 200-trade real-market OOS dataset. It establishes **validated empirical evidence**, but does **NOT** constitute authorization for live trading, real-money execution, broker order routing, automated order execution, or risk sizing. Execution remains safely paused at Phase S9.
