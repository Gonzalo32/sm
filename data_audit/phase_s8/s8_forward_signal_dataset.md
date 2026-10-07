# S8 — Forward Signal Dataset Documentation

## 1. Executive Summary

This document describes the schema and provenance of candidate signals captured in real time during Phase S8 paper trading.

* **Total Realtime Candles Processed**: `72`
* **Total Candidate Signals Generated**: `30`
* **Model Breakdown**: `MODEL_A`: 15, `MODEL_B`: 10, `MODEL_C`: 5.
* **Directional Breakdown**: `LONG`: 18, `SHORT`: 12.
* **Dataset File**: `data_audit/phase_s8/s8_forward_signal_dataset.json`

---

## 2. No-Hindsight Signal Generation

Every signal record was created and persisted at the exact confirmation timestamp ($T_{\text{conf}}$) before subsequent market outcome candles were known (`HINDSIGHT_USED = FALSE`).
