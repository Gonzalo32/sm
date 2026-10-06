# CP55 — Replacement & Invalidation Provenance Report

## 1. Summary
Evaluates provenance lineage behavior during candle updates (forming bar updates) and candidate context invalidations.

## 2. Findings
- **Forming Bar Replacement**: Ingesting a forming bar tick with an existing timestamp replaces the active candle in `CandleStore` without leaving duplicate or stale bar records.
- **Context Invalidation**: Obsolete candidate contexts do not remain active or authoritative.
- **Counters**:
  - `STALE_PROVENANCE = 0`
  - `ORPHAN_PROVENANCE = 0`
  - `RESURRECTED_PROVENANCE = 0`
  - `DUPLICATE_AUTHORITATIVE_PROVENANCE = 0`
