# Phase S9 — Artifact Manifest

## Audit Artifacts & Data Files

| Artifact File Path | Description | Format | Status |
| :--- | :--- | :--- | :--- |
| `S9_EXPANDED_INDEPENDENT_OOS_VALIDATION_AUDIT.md` | Full forensic expanded out-of-sample real-market validation audit report | Markdown | Verified |
| `PHASE_S9_AUDIT_REPORT.md` | Executive audit report for Phase S9 | Markdown | Verified |
| `PHASE_S9_FINAL_STATUS.md` | Final audit status and governance classification | Markdown | Verified |
| `data_audit/phase_s9/s9_oos_trade_dataset.json` | Complete machine-readable OOS trade dataset (200 trade objects) | JSON | Verified |
| `data_audit/phase_s9/s9_oos_candle_provenance.json` | Machine-readable Databento CME OOS candle provenance | JSON | Verified |
| `data_audit/phase_s9/s9_hash_manifest.json` | Complete dataset SHA-256 hashes manifest | JSON | Verified |
| `data_audit/phase_s9/s9_metrics_summary.json` | Aggregated OOS performance distribution metrics | JSON | Verified |
| `data_audit/phase_s9/s9_bootstrap_results.json` | Non-parametric bootstrap resampling results (1,000 resamples) | JSON | Verified |
| `data_audit/phase_s9/s9_final_status.txt` | Single-line audit status declaration | Text | Verified |
| `tests/phase_s9_expanded_oos_validation_audit.test.ts` | Vitest automated test suite (31 tests passing) | TypeScript | Verified |

## Verification Details

* **Canonical Baseline**: `57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a`
* **`core/ict/` Diff Lines**: `0`
* **Live Trading Authorized**: `NO`
