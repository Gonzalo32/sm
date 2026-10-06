# CP55 — Symbol & Timeframe Provenance Report

## 1. Summary
Verifies symbol and timeframe attribution lineage from raw input through CandleStore, ICT engines, CandidateContext, MTF context, VisualAdapter, and diagnostics.

## 2. Findings
- **Symbol Provenance**: NQ input produces NQ candles, NQ events, NQ candidate contexts, and NQ visuals exclusively.
- **Timeframe Provenance**: 1m input produces 1m contexts exclusively. MTF relationships explicitly link `sourceTimeframe` (e.g. 15m) and `targetTimeframe` (e.g. 5m) without conflation.
- **Counters**:
  - `SYMBOL_PROVENANCE_LOSSES = 0`
  - `TIMEFRAME_PROVENANCE_LOSSES = 0`
  - `CROSS_SYMBOL_CONTAMINATION = 0`
  - `CROSS_TIMEFRAME_CONTAMINATION = 0`
