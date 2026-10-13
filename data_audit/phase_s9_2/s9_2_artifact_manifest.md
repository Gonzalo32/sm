# S9.2 Artifact Manifest

| File | Type | Description |
| :--- | :--- | :--- |
| `s9_2_timestamp_reconciliation.json` | Data | Full raw and parsed timestamp forensic table for all 450 trades |
| `s9_2_dataset_ranges.json` | Data | Time range, span, first/last timestamps for S8-200, S8.8, and S9 |
| `s9_2_contract_ranges.json` | Data | S9 contract-by-contract timestamp range analysis |
| `s9_2_gap_distribution.json` | Data | Complete gap distributions (percentiles and count ranges) |
| `s9_2_episode_reconciliation.json` | Data | Corrected episode reconstructions with dataset & contract boundaries |
| `s9_2_autocorrelation.json` | Data | Return and outcome serial autocorrelations for lags 1, 2, 3, 5, 10 |
| `s9_2_effective_sample_size.json` | Data | Effective sample size reassessment and design effect calculations |
| `s9_2_bootstrap_reassessment.json` | Data | Cluster bootstrap & leave-one-out eligibility assessment |
| `s9_2_timestamp_sample_crosscheck.json` | Data | Verification of trade timestamps against source candle provenance |
| `s9_2_metrics_summary.json` | Summary | Final key-value metrics summary for Phase S9.2 |
| `s9_2_hash_manifest.json` | Verification | SHA-256 cryptographic hashes of all S9.2 JSON artifacts |
