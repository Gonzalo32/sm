# CP50 REPLACEMENT & CORRECTION AUDIT

## 1. SCOPE & TESTED SCENARIOS (V01–V06)

- **V01 — Open candle update**: Multiple ticks for the same open candle update OHLC values in-place without duplicating candle identity.
- **V02 — Candle correction**: Ingesting updated tick values for active candle replaces current values cleanly (`high: 18010 -> 18020`).
- **V03 — ICT re-evaluation**: Re-evaluating identical candle sequences reproduces identical ICT event representations.
- **V04 — CandidateContext replacement**: Active candidate context is updated when higher-priority confirmation events arrive.
- **V05 — MTF replacement**: MTF relation updates dynamically when HTF context is confirmed.
- **V06 — Visual regeneration**: Visual overlays adapt instantly to domain context updates without retaining stale visual objects.

---

## 2. VERDICT

All replacement and correction paths preserve correct identity relationships and do not produce duplicate authoritative entries.
