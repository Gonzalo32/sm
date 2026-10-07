# Phase S8.7 — Artifact Manifest

## Audit Artifacts & Data Files

| Artifact File Path | Description | Format | Status |
| :--- | :--- | :--- | :--- |
| `S8_7_INDEPENDENT_SIGNAL_PROVENANCE_AUDIT.md` | Full forensic signal provenance and anti-leakage audit report | Markdown | Verified |
| `PHASE_S8_7_AUDIT_REPORT.md` | Executive audit report for Phase S8.7 | Markdown | Verified |
| `PHASE_S8_7_FINAL_STATUS.md` | Final audit status and governance classification | Markdown | Verified |
| `data_audit/phase_s8_7/s8_7_signal_provenance_metrics.json` | Machine-readable anti-leakage audit metrics | JSON | Verified |
| `data_audit/phase_s8_7/s8_7_trade_provenance_manifest.json` | Trade-by-trade anti-leakage audit manifest (200 trades) | JSON | Verified |
| `data_audit/phase_s8_7/s8_7_final_status.txt` | Single-line audit status declaration | Text | Verified |
| `tests/phase_s8_7_signal_provenance_audit.test.ts` | Vitest automated test suite (12 tests passing) | TypeScript | Verified |

## Verification Details

* **Canonical Baseline**: `57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a`
* **`core/ict/` Diff Lines**: `0`
