# CP41.1 — GIT INTEGRITY & TEST COUNT RECONCILIATION REPORT

## 1. BASELINE AND FINAL COMMIT VERIFICATION
* **BASELINE_COMMIT**: `57acd4c`
* **FINAL_COMMIT**: `57acd4c`
* **BRANCH**: `main`

## 2. TEST COUNT RECONCILIATION
* **CP40 Baseline**: `84 test files / 957 tests`
* **CP41 Current**: `85 test files / 967 tests`

### Demonstration of the +10 Tests Added:
* **New File Added**: [`tests/checkpoint41_adversarial_lineage.test.ts`](file:///c:/Users/Administrador/Desktop/sm/tests/checkpoint41_adversarial_lineage.test.ts) (+1 file).
* **New Tests Added**: Exactly 10 adversarial unit/integration tests within `checkpoint41_adversarial_lineage.test.ts`:
  1. `1. should resolve multiple simultaneous events on the same timestamp into distinct indexed descriptors`
  2. `2. should strictly reject future HTF confirmation timestamps (HTF confTs > LTF evTs)`
  3. `3. should accept exact temporal boundary HTF confirmation (HTF confTs === LTF evTs)`
  4. `4. should reject unconfirmed HTF open bar (HTF confirmationTimestamp = null)`
  5. `5. should handle out-of-order HTF confirmation updates deterministically when re-evaluated`
  6. `6. should maintain CandidateContext & MTF ID invariants during duplicate tick streams`
  7. `7. should reject late past ticks and preserve closed candle immutability`
  8. `8. should reset store and prevent cross-contamination when changing symbol or timeframe`
  9. `9. should resolve visual object ID VIS-ctx_NQ_1m_100000 back to CandidateContext and candle timestamp`
  10. `10. should verify core ICT logic purity and zero parameter alterations`

All +10 tests correspond 100% exclusively to CP41 adversarial audit scenarios.

## 3. GIT STATUS & DIFF RECONCILIATION
* `git status --short`: Shows untracked audit artifacts in `data_audit/cp41/` and `tests/checkpoint41_adversarial_lineage.test.ts`.
* `git diff -- core/ict`: Clean (0 tracked modifications to core ICT detection logic).
* Production code: 0 modifications to detectors, thresholds, or models.
