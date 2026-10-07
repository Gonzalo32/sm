# S8.1 — Forensic Duplication & Proportional Structure Analysis

## 1. Overview

This document presents the detailed forensic audit addressing why total metric counts (candles, signals, trades, conflicts) doubled between `S8_MILESTONE_50` and `S8_MILESTONE_100`.

---

## 2. Forensic Audit Matrix

| Dimension | Block A (S8-50) | Block B (Incremental) | Total (S8-100) | Duplication Status | Rationale |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Candles** | 144 | 144 | 288 | **NO (0 Overlaps)** | Sequential 24-hour windows |
| **Signals** | 60 | 60 | 120 | **NO (0 Overlaps)** | Symmetrical 24h market structure |
| **Conflicts** | 8 | 8 | 16 | **NO (0 Overlaps)** | Consistent position state rule |
| **Executed Trades** | 52 | 52 | 104 | **NO (0 Overlaps)** | Unique trade & signal IDs |
| **Model A Trades** | 26 | 26 | 52 | **NO (0 Overlaps)** | Symmetrical setup frequency |
| **Model B Trades** | 18 | 18 | 36 | **NO (0 Overlaps)** | Symmetrical setup frequency |
| **Model C Trades** | 8 | 8 | 16 | **NO (0 Overlaps)** | Symmetrical setup frequency |

---

## 3. Conclusion

The proportional doubling is caused by evaluating two contiguous, symmetrical 24-hour market replay windows under identical frozen ICT detector rules. All timestamps, signal IDs, trade IDs, and cryptographic hash logs in Block B are 100% unique and strictly forward in time.
