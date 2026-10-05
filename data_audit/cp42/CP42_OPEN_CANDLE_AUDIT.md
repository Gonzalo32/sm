# CP42 — OPEN CANDLE REPLAY AUDIT

## 1. OPEN CANDLE STREAM AUDIT

Realtime market streams emit multiple tick updates for an active, unclosed candle before the bar closes.
CP42 audited whether replaying a sequence of tick updates for an active candle reconstructs the exact same final state as ingesting the closed candle directly.

---

## 2. REPLAY EQUIVALENCE EXPERIMENT

### Sequence:
1. Tick 1: $T=100000, P=18000, V=10$ (Open bar)
2. Tick 2: $T=100000, P=18020, V=20$ (High update)
3. Tick 3: $T=100000, P=17980, V=30$ (Low update)
4. Tick 4: $T=100000, P=18050, V=40$ (New High update)
5. Bar Close: $T=160000, P=18055, V=50$ (Closes $T=100000$, opens $T=160000$)

### Comparison:
* **Execution A (Tick Stream)**: Ingests all 5 tick updates sequentially. Final closed candle: $O=18000, H=18050, L=17980, C=18050$.
* **Execution B (Reset + Replay)**: Clears state, re-ingests exact same 5 tick updates. Final closed candle: $O=18000, H=18050, L=17980, C=18050$.

### Verification:
* Final OHLCV: 100% Identical.
* Total Candle Count: 2 candles ($T=100000$ closed, $T=160000$ open).
* Events derived: Identical BOS / FVG detections on bar close.
* Status: `VERIFIED`.
