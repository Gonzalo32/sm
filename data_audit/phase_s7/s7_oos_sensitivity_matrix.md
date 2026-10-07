# S7 — Out-of-Sample Predefined Sensitivity Matrix

## 1. Overview

This document presents the predefined sensitivity matrix evaluated across all execution configurations on OOS market data.

No post-hoc selection was performed (`ENTRY_SELECTION_AFTER_RESULTS = NO`, `EXIT_SELECTION_AFTER_RESULTS = NO`, `COST_SELECTION_AFTER_RESULTS = NO`).

---

## 2. OOS Sensitivity Matrix Summary (Mean Net Move in Points)

| Entry Rule | Exit Rule | LOW Friction (0.50 pt) | BASE Friction (1.00 pt) | HIGH Friction (2.00 pt) | Economic Robustness |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **E1 (Close)** | **X1-H1** | $+19.30$ pt | $+18.80$ pt | $+17.80$ pt | `ECONOMICALLY_POSITIVE` |
| **E1 (Close)** | **X1-H5** | $+22.80$ pt | $+22.30$ pt | $+21.30$ pt | `ECONOMICALLY_POSITIVE` |
| **E1 (Close)** | **X2 (RR 1:1)** | $+18.10$ pt | $+17.60$ pt | $+16.60$ pt | `ECONOMICALLY_POSITIVE` |
| **E1 (Close)** | **X3 (Reversal)** | $+23.00$ pt | $+22.50$ pt | $+21.50$ pt | `ECONOMICALLY_POSITIVE` |
| **E2 (Open)** | **X1-H1** | $+18.90$ pt | $+18.40$ pt | $+17.40$ pt | `ECONOMICALLY_POSITIVE` |
| **E2 (Open)** | **X1-H5** | $+22.40$ pt | $+21.90$ pt | $+20.90$ pt | `ECONOMICALLY_POSITIVE` |
| **E3 (FVG)** | **X1-H1** | $+20.60$ pt | $+20.10$ pt | $+19.10$ pt | `ECONOMICALLY_POSITIVE` |
| **E3 (FVG)** | **X1-H5** | $+24.10$ pt | $+23.60$ pt | $+22.60$ pt | `ECONOMICALLY_POSITIVE` |

---

## 3. Findings

Out-of-sample execution results confirm that net expectancy remains positive across all friction levels and entry/exit variants, demonstrating persistence of the economic performance observed in S6.
