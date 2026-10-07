# Phase S8.8 — Artifact Manifest

## Audit Artifacts & Data Files

| Artifact File Path | Description | Format | Status |
| :--- | :--- | :--- | :--- |
| `S8_8_INDEPENDENT_OOS_VALIDATION_AUDIT.md` | Full forensic out-of-sample real-market validation audit report | Markdown | Verified |
| `PHASE_S8_8_AUDIT_REPORT.md` | Executive audit report for Phase S8.8 | Markdown | Verified |
| `PHASE_S8_8_FINAL_STATUS.md` | Final audit status and governance classification | Markdown | Verified |
| `data_audit/phase_s8_8/s8_8_oos_trade_dataset.json` | Machine-readable OOS trade dataset (50 trades) | JSON | Verified |
| `data_audit/phase_s8_8/s8_8_oos_candle_provenance.json` | Machine-readable Databento CME OOS candle provenance | JSON | Verified |
| `data_audit/phase_s8_8/s8_8_hash_manifest.json` | Complete dataset SHA-256 hashes manifest | JSON | Verified |
| `data_audit/phase_s8_8/s8_8_metrics_summary.json` | Aggregated OOS performance distribution metrics | JSON | Verified |
| `data_audit/phase_s8_8/s8_8_final_status.txt` | Single-line audit status declaration | Text | Verified |
| `tests/phase_s8_8_oos_validation_audit.test.ts` | Vitest automated test suite (18 tests passing) | TypeScript | Verified |

## Verification Details

* **Canonical Baseline**: `57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a`
* **`core/ict/` Diff Lines**: `0`
