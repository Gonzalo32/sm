# S10 Prospective Protocol v1.1.0 Proposal Document

## Executive Overview

This document presents the formal **S10 Protocol v1.1.0 Proposal**, defining the prospective out-of-sample evaluation framework for frozen ICT Models A/B/C using the live TradeSea real-time WebSocket feed (`TradeSea_WSS_Realtime_Feed`) in place of CME Databento MDP3 market data.

Protocol v1.0.0 and Protocol v1.1.0 remain preserved as immutable historical artifacts (`5b9187b8f20731de86bdca2ff0c26dfc8df1426a9f1fdc023b6dd33abbfc2cdd`). This proposal establishes full technical equivalency, integrity rules, and session invalidation criteria before official 40-session data capture begins.

---

## 1. Data Provenance & Architecture Shift

| Dimension | Protocol v1.0.1 (Baseline) | Protocol v1.1.0 Proposal |
| :--- | :--- | :--- |
| **Primary Data Provider** | CME Databento MDP3 | TradeSea WSS Realtime Feed |
| **Transport Protocol** | Institutional MDP3 Binary / Parquet | TradingView WS Protocol (`~m~len~m~json`) |
| **Storage Engine** | Raw File System Parquet/JSON | **IndexedDB** (`TradeSeaPassiveDataDB`) |
| **Data Capture Mode** | Post-Session API Pull | Live Passive Browser Recorder (`TradeSeaPassiveRecorder`) |
| **Execution Credentials** | Databento API Key | None (Passive Browser Event Stream) |
| **Order Placement** | Disabled / Unauthorized | **Disabled / Unauthorized** |

---

## 2. December 2026 Rollover Calendar Forensic Verification

### 2.1 Date Audit
* **3rd Friday of December 2026**: `2026-12-18`
* **8th Calendar Day Prior to Expiration Rule**: `2026-12-10` (Thursday)
* **Thursday Prior to Expiration Week Rule**: `2026-12-17` (Thursday)
* **CP64 Assertion Correction**: CP64 originally cited Thursday Dec 10 as the 8-day prior date. Dec 10 is indeed 8 calendar days before Dec 18 (and is a Thursday). If using the Thursday-before-expiration-week rule, the date is Dec 17.

### 2.2 Impact on Frozen S10 40-Session Manifest
* All 40 preregistered sessions in `s10_session_manifest.json` run from **October 12, 2026 to December 07, 2026**.
* **Verdict**: Dec 07 terminates **prior** to both Dec 10 and Dec 17. **100% of the 40 manifest sessions strictly fall under contract `NQZ6` / `MNQZ6` (Q4 2026) with zero contract rollover discontinuity**.

---

## 3. Feed Limitations, Integrity & Session Rejection Criteria

1. **Volume & Depth Limitations**:
   * OHLCV 1m/5m candle data carries interval volume. Tick count and L2 orderbook depth are absent.
   * Model execution relies exclusively on OHLCV price action, which is 100% supported.
2. **Active Tab & Background Throttling Rules**:
   * Chrome desynchronizes WebSockets/timers when tabs are backgrounded. The operator must maintain the TradeSea chart tab active and visible during live session recording.
3. **Historical Backfill vs. Prospective Live Separation**:
   * Initial chart load bars are tagged `IS_HISTORICAL_INITIAL` and excluded from prospective live results.
   * Only real-time closed candles received during RTH session hours (`09:30 - 16:00 America/New_York`) tagged `IS_PROSPECTIVE_LIVE=true` enter the prospective ledger.
4. **Session Invalidation Thresholds**:
   * **Invalid Gap Rule**: Any session with an unrecoverable data gap exceeding **15 contiguous minutes** OR **>30% total missing candles** is automatically marked `INVALID_INCOMPLETE` and excluded from statistical scoring.
   * **Deduplication Rule**: Handled via composite key `[symbol, timeframe, timestamp]`. Duplicate ticks are safely discarded without ledger corruption.

---

## 4. Governance & Version Control Statement

Protocol v1.1.0 remains a proposal pending formal team/operator review. Official prospective session capture and signal evaluation remain paused (`LIVE_TRADING_AUTHORIZED = NO`).
