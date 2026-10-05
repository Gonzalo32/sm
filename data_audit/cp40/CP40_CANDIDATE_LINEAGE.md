# CP40 — CANDIDATE CONTEXT LINEAGE REPORT

## 1. CANDIDATE CONTEXT LINEAGE ATTRIBUTES
`CandidateContext` aggregates all detected ICT events into a neutral summary payload:
* `id`: `ctx_<symbol>_<timeframe>_<firstEventTs>`
* `supportingEvents`: Array of event descriptors (`"<TYPE> @ <ts> (Confirmed: <confTs>)"`).
* `sourceCandleTimestamps`: Array of unique deduplicated candle timestamps seeding the events.
* `eventTimestamp`: Timestamp of the earliest supporting event.
* `confirmationTimestamp`: Maximum confirmation timestamp across supporting events.
* `status`: `'NO_CONTEXT' | 'CONTEXT_FORMING' | 'CONTEXT_CONFIRMED'`.
* `expirationStatus`: `'NOT_DEFINED'`.

## 2. RECONSTRUCTION VERIFICATION
Given any `CandidateContext`, its origin can be reconstructed back to the exact list of supporting ICT events (`supportingEvents`) and exact source candles (`sourceCandleTimestamps`).
