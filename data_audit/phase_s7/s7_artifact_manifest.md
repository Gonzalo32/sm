# S7 — Artifact Manifest

## 1. Overview

This document records the complete inventory of files generated for Phase S7 Out-of-Sample & Robustness Validation Protocol.

---

## 2. File Inventory (`data_audit/phase_s7/`)

1. `PHASE_S7_PROTOCOL.md` — Phase S7 Protocol Definition.
2. `PHASE_S7_AUDIT_REPORT.md` — Complete Phase S7 Audit Report.
3. `PHASE_S7_FINAL_STATUS.md` — Key-value Status Report for Phase S7.
4. `oos_dataset_manifest.json` — Out-of-Sample Dataset Sealing Manifest & SHA256 Hashes.
5. `s7_oos_signal_dataset.json` — Structured JSON Dataset of OOS Signal Observations.
6. `s7_oos_signal_dataset.md` — Documentation of OOS Signal Dataset Schema & Provenance.
7. `s7_oos_outcome_statistics.md` — Summary Outcome Statistics (MFE, MAE, Directional Move) on OOS Data.
8. `s7_oos_execution_dataset.json` — Structured JSON Dataset of OOS Hypothetical Executions.
9. `s7_oos_execution_dataset.md` — Documentation of OOS Execution Dataset & Determinism.
10. `s7_oos_sensitivity_matrix.md` — Complete Predefined Sensitivity Matrix on OOS Data.
11. `s7_oos_model_analysis.md` — Independent Model Performance Analysis on OOS Data (A, B, C).
12. `s7_oos_direction_analysis.md` — Independent Directional Performance Analysis on OOS Data (LONG, SHORT).
13. `s7_oos_symbol_timeframe_analysis.md` — OOS Performance Breakdown by Symbol (NQ, MNQ) and Timeframe (5m).
14. `s7_oos_temporal_robustness.md` — Chronological Segment Breakdown & Temporal Stability Analysis.
15. `s7_oos_regime_analysis.md` — Market Regime Performance Breakdown (RTH vs Post-RTH).
16. `s7_oos_drawdown_analysis.md` — Out-of-Sample Drawdown Analysis.
17. `s7_oos_statistical_analysis.md` — Statistical Significance & Power Audit.
18. `s7_oos_contamination_audit.md` — Forensic Isolation & Zero-Contamination Verification Report.
19. `s7_oos_test_matrix_validation.md` — Test Suite Matrix & Invariant Validation Report.
20. `s7_artifact_manifest.md` — File Inventory & Verification Record (this file).

---

## 3. Test Suite Artifacts

* `tests/phase_s7_ict_oos_validation.test.ts` — Executable Vitest test suite for Phase S7.

---

## 4. Integrity Statement

All Phase S7 artifacts have been produced in strict compliance with the frozen baseline, zero parameter optimization, zero data contamination, zero post-hoc selection, and zero live execution claims.
