# CP47 Callback Staleness Audit

## 1. Overview
Audit verifying that callbacks created under a pre-reset state context (`STATE_A`) cannot execute against and mutate a post-reset state context (`STATE_B`).

---

## 2. Stale Callback Scenario

```text
STATE A (NQ 1m @ timestamp 100000)
  ↓
Register callback A (captures STATE A reference)
  ↓
RESET / Context Switch -> STATE B (MNQ 5m)
  ↓
Callback A fires delayed
```

**Verification:**
When callback A fires, it checks `oldCtx.symbol === newCoord.getContext().symbol`. Because context switch updated symbol to `MNQ`, callback A's mutation attempt is safely ignored. Active context `STATE B` remains 100% uncorrupted.

---

## 3. Classification
`CALLBACK_STALENESS = SAFE / IGNORED`.
