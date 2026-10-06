# CP57 — Authority Model Report

## 1. Summary
Reconciles authoritative runtime entities vs derived representations across all trust boundaries.

## 2. Model Authority Rules
- `UNTRUSTED_INPUT != AUTHORITATIVE_STATE`: Incoming raw WS frames or REST objects must pass `CandleValidator` before entering `CandleStore`.
- `DERIVED_STATE != SOURCE_OF_TRUTH`: `ICTEvent`, `CandidateContext`, and `MultiTimeframeContext` remain derived representations.
- `VISUAL_STATE != AUTHORITATIVE_STATE`: `VisualObject` renderables do not alter `CandleStore` arrays under any circumstances.
- `DIAGNOSTICS != AUTHORITATIVE_STATE`: Provenance metadata payloads are purely observational snapshots.
