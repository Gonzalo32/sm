# CP55 — Negative Lineage Cases Report

## 1. Summary
Evaluates negative lineage scenarios P01 through P15 (wrong source ID, wrong candle timestamp, wrong symbol, wrong timeframe, unlinked event, unlinked context, unlinked MTF, unlinked visual, unlinked diagnostic, stale derived entity, stale reset provenance, cross-context leak, invalid causal timestamp, rejected source, duplicate lineage).

## 2. Findings
All negative lineage corruption scenarios P01..P15 pass cleanly:
- `SOURCE_CANDLE_MISMATCHES = 0`
- `EVENT_LINEAGE_MISMATCHES = 0`
- `CONTEXT_LINEAGE_MISMATCHES = 0`
- `MTF_LINEAGE_MISMATCHES = 0`
- `VISUAL_LINEAGE_MISMATCHES = 0`
- `DIAGNOSTIC_LINEAGE_MISMATCHES = 0`
- `CAUSAL_TIMESTAMP_VIOLATIONS = 0`
