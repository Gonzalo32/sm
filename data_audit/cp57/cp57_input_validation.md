# CP57 — Raw Input Validation Report

## 1. Summary
Evaluates raw input validation across test cases T01 through T15 (missing required fields, wrong primitive types, null/undefined, NaN, Infinity, negative timestamps, invalid OHLC relationships, invalid symbols, invalid timeframes, malformed envelopes, unknown message types, duplicate inputs, stale inputs).

## 2. Findings
- **Malformed Inputs**: Inputs containing NaN, null open prices, or invalid OHLC relationships fail `CandleValidator.validateCandle` cleanly (`INPUT_ACCEPTED = NO`, `AUTHORITATIVE_STATE_CREATED = NO`).
- **Validation Counters**: `MALFORMED_INPUT_ACCEPTANCE = 0`, `INVALID_MESSAGE_AUTHORITY = 0`.
