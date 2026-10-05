# CP47 Subscription & Observer Audit

## 1. Overview
Audit of instrument/timeframe subscription registrations and observer notifications across `MarketDataAdapter` and `CandleStore`.

---

## 2. Subscription Idempotency Matrix

```text
Subscribe NQ 1m
  ↓
Subscribe NQ 1m (Duplicate Request)
  ↓
Connection Status set to CONNECTED
  ↓
Unsubscribe / Reset Context
```

**Audit Findings:**
- Duplicate subscription attempts for the same instrument (`NQ` / `1m`) collapse cleanly without multiplying stream handlers.
- Changing context (`NQ 1m` $\rightarrow$ `MNQ 5m`) clears active subscriptions for the previous context.
