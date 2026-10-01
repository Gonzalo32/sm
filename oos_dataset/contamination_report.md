# OOS Dataset Contamination & Isolation Report

**Dataset ID**: `OOS_VALIDATION_DATASET_V1`  

---

## 1. Calibration Exclusion Protocol Audit

| Check | Protocol Description | Observed Result | Status |
| :--- | :--- | :---: | :---: |
| **Exact Timestamp Overlap** | Zero common timestamps with CP32 calibration cases | 0 Overlaps | **PASS** |
| **Same Candle Overlap** | Zero identical candle references | 0 Overlaps | **PASS** |
| **Detector Blindness** | Extraction performed without running ICTEngine | 0 Detector Invocations | **PASS** |
| **Label Independence** | Labels generated independently of engine output | `PENDING_FUTURE_DOUBLE_BLIND_REVIEW` | **PASS** |
| **Parameter Tuning Exclusion** | Zero parameter modifications during extraction | `PARAMETERS_MODIFIED=NO` | **PASS** |

```text
CALIBRATION_CONTAMINATION_STATUS = PASS
CASE_INDEPENDENCE_STATUS = PASS
```
