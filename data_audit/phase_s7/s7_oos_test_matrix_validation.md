# S7 — Out-of-Sample Test Matrix & Invariant Validation Report

## 1. Overview

Automated verification of Phase S7 out-of-sample evaluation was performed via the dedicated test suite:

`tests/phase_s7_ict_oos_validation.test.ts`

---

## 2. Automated Test Suite Execution Results

* **Test File**: `tests/phase_s7_ict_oos_validation.test.ts`
* **Test Duration**: ~722ms
* **Total Tests Executed**: 5
* **Passed**: 5
* **Failed**: 0

### Individual Test Verification:
1. `PASS`: Verify frozen baseline and production ICT engine (`core/ict/`) zero code modifications.
2. `PASS`: Validate OOS dataset sealing and SHA256 integrity hash verification (`oos_dataset/manifest.json`).
3. `PASS`: Verify zero timestamp contamination/overlap between OOS and S1–S6 datasets (`OOS_CONTAMINATION = 0`).
4. `PASS`: Verify execution sensitivity and cost scenario calculations on OOS data.
5. `PASS`: Confirm zero violations across all required invariants.

---

## 3. Global Project Regression Suite Results

* **Total Test Files**: 114
* **Total Tests**: 1,179
* **Pass Rate**: 100%
* **Typecheck (`npx tsc --noEmit`)**: Pass (0 errors)
* **Production Build (`npm run build`)**: Pass (0 errors)

---

## 4. Required Invariants Verification

```text
ICT_PRODUCTION_LOGIC_MODIFIED = NO
PARAMETERS_MODIFIED = NO
MODELS_MODIFIED = NO

S1_DATASET_MUTATION = NO
S2_DATASET_MUTATION = NO
S3_PROTOCOL_MUTATION = NO
S4_RESULT_MUTATION = NO
S4_1_RESULT_MUTATION = NO
S5_SPECIFICATION_MUTATION = NO
S6_RESULT_MUTATION = NO

LOOKAHEAD_VIOLATIONS = 0
IDENTITY_VIOLATIONS = 0
PROVENANCE_VIOLATIONS = 0
DETERMINISM_VIOLATIONS = 0
DATA_SNOOPING_VIOLATIONS = 0
OOS_CONTAMINATION = 0
OOS_DATA_REUSED_FOR_SELECTION = NO
```
