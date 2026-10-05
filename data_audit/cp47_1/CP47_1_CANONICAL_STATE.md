# CP47.1 Canonical State Snapshot Specification

## 1. Canonical State Structure

```json
{
  "candles": [
    {
      "timestamp": 500000,
      "open": 18000,
      "high": 18050,
      "low": 17950,
      "close": 18040,
      "volume": 300
    }
  ],
  "candidateContext": {
    "symbol": "NQ",
    "timeframe": "1m",
    "eventTimestamp": 500000,
    "confirmationTimestamp": 500060,
    "status": "CONTEXT_CONFIRMED"
  },
  "mtfResult": {
    "causal": true,
    "status": "CONFIRMED"
  },
  "visualObjects": [
    {
      "id": "VIS-sw1",
      "type": "SWING",
      "price": 18050
    }
  ],
  "resourceCounts": {
    "candleCount": 1,
    "visualCount": 1
  }
}
```

---

## 2. Normalization Rules
No fields were normalized or excluded during comparison. All domain fields evaluated with 100% exact equality.
