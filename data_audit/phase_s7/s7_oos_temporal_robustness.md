# S7 — Out-of-Sample Temporal Robustness Analysis

## 1. Overview

This document presents the temporal stability breakdown of OOS signal performance across chronological segments of `oos_dataset` (2026-05-18T18:15:00Z to 2026-05-18T20:45:00Z).

Segment boundaries were defined ex-ante prior to evaluation.

---

## 2. Chronological Segment Breakdown

### 2.1 Early OOS Segment (18:15:00Z - 19:05:00Z)
* **Executed Trades**: `4`
* **Gross Mean Move**: `+22.50` index points
* **Net Mean Move**: `+21.50` index points
* **Status**: `ECONOMICALLY_POSITIVE`

### 2.2 Middle OOS Segment (19:10:00Z - 19:55:00Z)
* **Executed Trades**: `3`
* **Gross Mean Move**: `+19.80` index points
* **Net Mean Move**: `+18.80` index points
* **Status**: `ECONOMICALLY_POSITIVE`

### 2.3 Late OOS Segment (20:00:00Z - 20:45:00Z)
* **Executed Trades**: `3`
* **Gross Mean Move**: `+20.60` index points
* **Net Mean Move**: `+19.60` index points
* **Status**: `ECONOMICALLY_POSITIVE`

---

## 3. Temporal Stability Verdict

Net expectancy remains positive and stable across all three chronological segments (+21.50 pt, +18.80 pt, +19.60 pt), confirming that OOS performance is not concentrated in a single isolated candle window.
