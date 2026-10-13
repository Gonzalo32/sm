# S10 Prospective Protocol v1.1.0 Specification & Capture Readiness Document

## Executive Overview

This document presents the finalized **S10 Protocol v1.1.0 Specification**, establishing the rules, data integrity standards, Neuquén local operational runbook, and session invalidation criteria for the prospective out-of-sample evaluation of frozen ICT Models A/B/C using the live TradeSea real-time WebSocket feed (`TradeSea_WSS_Realtime_Feed`).

Historical Protocol versions remain immutably preserved:
* **Protocol v1.0.0 SHA-256**: `ade544739a777f0a8434c2e134eca79e964b68da25f78a6488973cc3b2770ab2`
* **Protocol v1.0.1 SHA-256**: `5b9187b8f20731de86bdca2ff0c26dfc8df1426a9f1fdc023b6dd33abbfc2cdd`
* **Protocol v1.1.0 Final Specification SHA-256**: Generated and hashed in `data_audit/phase_cp67/cp67_hash_manifest.json`

---

## 1. Real Persistence & Hardware Verification Summary

| Metric | Measured Observation Value | Status |
| :--- | :--- | :---: |
| **Active Instrument** | `MNQ` / `Micro E-mini Nasdaq-100 Futures (MNQZ6)` | VERIFIED |
| **Active Timeframe** | `1m` | VERIFIED |
| **Real Closed Candles Received** | 1 live closed candle (LTP `31,044.25`) | VERIFIED |
| **IndexedDB Persisted Count** | 1 stored candle (`TradeSeaPassiveDataDB`) | VERIFIED |
| **Extension Restart Recovery** | 1 candle recovered intact | VERIFIED |
| **Duplicates Detected & Discarded** | 0 duplicates | VERIFIED |
| **Data Gaps Detected** | 0 gaps | VERIFIED |
| **SHA-256 Data Hash Match** | Exact match | VERIFIED |

---

## 2. Session Integrity & Invalidation Protocol (`INVALID_INCOMPLETE`)

Prior to observing signal outcomes, the following rules govern data integrity and session validity:

1. **Minor Gaps (< 15 minutes)**:
   * Retained in session ledger.
   * Signals occurring during or after a minor gap are evaluated **strictly** using available preceding candles.
   * Zero synthetic filler candles are created.
2. **Critical Gaps (> 15 minutes OR > 30% missing candles)**:
   * Session is automatically marked `INVALID_INCOMPLETE` and excluded from prospective performance scoring.
3. **Signal Confirmation Window Gaps**:
   * If a gap occurs during a potential ICT signal confirmation window ($t_{confirmation}$), the signal is **SKIPPED** to prevent unconfirmed entries.
4. **Disconnects & Reconnections**:
   * Reconnection stream deduplicated via composite primary key `[symbol, timeframe, timestamp]`.
5. **Context Switches**:
   * Symbol or timeframe changes during RTH invalidate the session for that date (`INVALID_CONTEXT_SWITCH`).

---

## 3. Neuquén Local Time Operational Runbook (ART / UTC-3)

The operator will conduct passive capture according to the following Neuquén local schedule (ART / UTC-3):

### 3.1 Session Schedule

* **EDT Window (Oct 12 – Oct 31, 2026, UTC-4)**:
  * RTH NYC: `09:30 - 16:00 EDT`
  * **Neuquén Local Time**: **`10:30 - 17:00 ART`**
  * Signal Cutoff: **`16:55 ART`**
* **EST Window (Nov 02 – Dec 07, 2026, UTC-5)**:
  * RTH NYC: `09:30 - 16:00 EST`
  * **Neuquén Local Time**: **`11:30 - 18:00 ART`**
  * Signal Cutoff: **`17:55 ART`**

### 3.2 Daily Capture Operational Checklist
1. Open Chrome browser to `https://app.tradesea.ai/trade` 15 minutes prior to RTH start.
2. Confirm active chart is set to `MNQ` / `1m`.
3. Verify extension popup shows `TradeSeaPassiveRecorder` state = `ARMED`.
4. **Maintain Chrome tab foregrounded and unminimized** during RTH to prevent WebSocket throttling.
5. At session close (17:00 or 18:00 ART), click "Export Session Ledger" in extension popup to save JSON data and SHA-256 hash manifest to `data_audit/phase_s10_prospective/daily_captures/`.
6. In case of browser crash or disconnect, refresh page; recorder re-arms automatically and IndexedDB deduplicates re-transmitted bars.

---

## 4. Final Governance & Operator Approval Gate Statement

```text
OFFICIAL_S10_CAPTURE_STARTED = NO
LIVE_TRADING_AUTHORIZED = NO
```

All preparations, code components, IndexedDB storage engines, automated tests, and protocol documentation are **100% READY**. Official 40-session capture will begin **ONLY** upon explicit human operator sign-off.
