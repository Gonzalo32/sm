# CP57 — Silent Coercion Audit Report

## 1. Summary
Audits runtime handling for silent semantic coercions (string to number, string to timestamp, unknown enum to default, null to default value, invalid symbol to fallback).

## 2. Findings
- **Coercion Resistance**: Primitive types must match explicit interface expectations. Invalid types or NaNs are rejected without silent coercion into dummy zero values.
- **Coercion Counters**:
  - `SILENT_TYPE_COERCIONS = 0`
  - `SILENT_TIMESTAMP_COERCIONS = 0`
  - `SILENT_SYMBOL_COERCIONS = 0`
  - `SILENT_TIMEFRAME_COERCIONS = 0`
  - `SILENT_ENUM_COERCIONS = 0`
  - `SILENT_DEFAULT_SUBSTITUTIONS = 0`
