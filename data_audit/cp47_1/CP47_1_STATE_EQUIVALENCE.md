# CP47.1 State Equivalence Audit

## 1. Overview & Reconciliation of `===` Assertion

CP47 originally reported state equivalence between fresh initialization (Path A) and 10-cycle long-run execution (Path B).

However, JavaScript reference equality (`storeA.getCandles() === storeB.getCandles()`) compares array references in memory rather than element content.

CP47.1 updated the verification to use deep structural comparison (`toEqual`):

```ts
expect(snapshotA.candles).toEqual(snapshotB.candles);
expect(snapshotA).toEqual(snapshotB);
```

---

## 2. Structural Field Comparison Summary

| State Component | Path A (Fresh Init) | Path B (10-Cycle Long Run) | Structural Comparison | Result |
|---|---|---|---|---|
| Candle Count | 1 | 1 | `1 === 1` | **MATCH** |
| Candle OHLCV | `[18000, 18050, 17950, 18040, 300]` | `[18000, 18050, 17950, 18040, 300]` | `toEqual` | **MATCH** |
| CandidateContext Symbol/TF | `"NQ"` / `"1m"` | `"NQ"` / `"1m"` | `toEqual` | **MATCH** |
| MTF Alignment | `causal = true`, `status = 'CONFIRMED'` | `causal = true`, `status = 'CONFIRMED'` | `toEqual` | **MATCH** |
| Visual Objects | `[{ id: 'VIS-sw1', type: 'SWING', price: 18050 }]` | `[{ id: 'VIS-sw1', type: 'SWING', price: 18050 }]` | `toEqual` | **MATCH** |
| Resource Collection Counts | `{ candleCount: 1, visualCount: 1 }` | `{ candleCount: 1, visualCount: 1 }` | `toEqual` | **MATCH** |

---

## 3. Conclusions
Fresh vs long-run authoritative state is 100% structurally equivalent. Reference inequality (`stateA !== stateB`) does NOT represent state divergence.
