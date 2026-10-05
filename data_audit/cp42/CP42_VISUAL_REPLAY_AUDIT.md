# CP42 — VISUAL REPLAY DETERMINISM AUDIT

## 1. VISUAL ADAPTER REPLAY AUDIT

`VisualAdapter` transforms `ICTMarketState`, `ICTEvent[]`, and `CandidateContext` into pure `VisualObject[]` records for canvas rendering.

---

## 2. AUDIT VERIFICATION

### Verification Requirements:
1. **Derivation Pureness**: VisualObjects are derived strictly from input state/events without mutating domain objects.
2. **ID Stability**: VisualObject IDs map directly to source event IDs (`VIS-SH`, `VIS-SL`, `VIS-BOS`, `VIS-FVG`).
3. **Capping & Deduplication**: Visual object count is deterministically capped by `maxVisibleObjects`.
4. **Replay Invariance**: Replaying identical inputs produces 100% identical VisualObjects array.

### Observed Results:
* Replay A vs Replay B Visual Object count: Identical.
* Visual Object IDs: Identical.
* SHA-256 structural hash of output array: Identical match.
* Status: `VERIFIED`.
