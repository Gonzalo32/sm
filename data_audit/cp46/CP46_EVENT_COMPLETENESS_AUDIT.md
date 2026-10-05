# CP46 ICT Event Completeness Audit

## 1. Overview
Audit of ICT Event detection states (`PROVISIONAL`, `CONFIRMED`, `INVALIDATED`, `EXPIRED`) and premature derivation protection.

---

## 2. Event State Transition Verification

```text
PROVISIONAL Event (Unconfirmed)
       ↓ (Confirmation parameter arrives / candle closes)
CONFIRMED Event (Authoritative)
       ↓ (Upstream candle revision / displacement invalidation)
INVALIDATED Event (Context Expiration / Purge)
```

- **Anti-Premature-Derivation:** An event generated from an unclosed or partial candle remains flagged as `PROVISIONAL`. It does not populate downstream `CONTEXT_CONFIRMED` candidate contexts.
- **Confirmation Threshold:** Only upon explicit confirmation ($T_{\text{conf}} \ge T_{\text{event}}$) is the event promoted to `CONFIRMED`.
- **Invalidation Cleanup:** When an upstream candle revision invalidates a previously confirmed event, `CandidateContext` transitions the event status to `INVALIDATED` and moves it to `invalidatedEvents`, preventing stale active references.

---

## 3. Audit Matrix

| Test Case | Scenario Description | Contract Expectation | Audit Result | Status |
|---|---|---|---|---|
| **EVT-01** | Provisional event detection | `isConfirmed = false` | Unconfirmed event registered | **VERIFIED** |
| **EVT-02** | Confirmation parameters arrive | `isConfirmed = true`, `confirmationTime` set | Promoted to confirmed | **VERIFIED** |
| **EVT-03** | Late confirmation arrival | Confirmation timestamp validated | Accepted if $T_{\text{conf}} \ge T_{\text{event}}$ | **VERIFIED** |
| **EVT-04** | Supporting candle update | Event recalculated or updated | Recalculated cleanly | **VERIFIED** |
| **EVT-05** | Supporting candle replacement | Event invalidated if criteria fail | Moved to `invalidatedEvents` | **VERIFIED** |
| **EVT-06** | Invalidated event references | Excluded from active context queries | Excluded successfully | **VERIFIED** |
