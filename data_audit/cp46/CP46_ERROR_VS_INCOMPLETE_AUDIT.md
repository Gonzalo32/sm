# CP46 Error vs Incomplete Data Audit

## 1. Overview
Audit distinguishing malformed invalid fields (`NaN`, `null` required values) from missing optional fields (`volume`).

---

## 2. Classification Matrix

| Input Condition | Classification | Contract Action | Verification Result |
|---|---|---|---|
| Missing `volume` field | **INCOMPLETE (Optional)** | Default to `0` volume | Accepted & normalized cleanly |
| Price = `NaN` | **INVALID (Malformed)** | Input rejection (`success = false`) | Ingestion rejected immediately |
| Price = `null` | **INVALID (Malformed)** | Input rejection (`success = false`) | Ingestion rejected immediately |
| Missing `timestamp` | **INVALID (Malformed)** | Input rejection | Ingestion rejected immediately |
| Unconfirmed HTF event | **INCOMPLETE (Provisional)** | Deferred MTF relation evaluation | Withheld cleanly |
