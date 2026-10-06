# Phase S1 — Positive & Negative Case Validation Report

## 1. Positive Cases

### Positive Case 1: Model A Bullish (`LONG_CANDIDATE`)
- **Model**: `MODEL_A_LONG` (Sweep -> MSS -> FVG)
- **Input Candles**: 5-candle series containing Swing Low at 17900, Sweep to 17890, and strong upward expansion to 18070.
- **Relevant ICT Events**: `SWING_LOW`, `LIQUIDITY_SWEEP` (SSL), `MSS` (Bullish), `FVG_CREATED` (Bullish).
- **Expected Direction**: `LONG`
- **Actual Direction**: `LONG_CANDIDATE`
- **Confirmation Timestamp**: 1700000240000
- **CandidateContext Status**: `CONTEXT_CONFIRMED`
- **Visual Output**: Distinct visual indicator overlay linked to candidate context.

### Positive Case 2: Model B Bullish (`LONG_CANDIDATE`)
- **Model**: `MODEL_B_LONG` (Sweep -> Displacement -> FVG)
- **Input Candles**: 4-candle series containing Liquidity Sweep followed by high-volume Displacement candle (body ratio > 0.60, range multiplier > 1.50).
- **Relevant ICT Events**: `LIQUIDITY_SWEEP`, `DISPLACEMENT`, `FVG_CREATED`.
- **Expected Direction**: `LONG`
- **Actual Direction**: `LONG_CANDIDATE`
- **Confirmation Timestamp**: 1700000180000
- **CandidateContext Status**: `CONTEXT_CONFIRMED`
- **Visual Output**: Distinct visual indicator overlay linked to candidate context.

---

## 2. Negative Cases

### Negative Case 1: Incomplete ICT Conditions (`NO_SIGNAL`)
- **Scenario**: Sideways low-volatility candle series without liquidity sweep, market structure shift, or FVG.
- **Expected Result**: `NO_SIGNAL`
- **Actual Result**: `NO_SIGNAL` (0 setups confirmed).

### Negative Case 2: Opposing Trend Invalidation (`NO_SIGNAL`)
- **Scenario**: Bullish setup conditions attempting to form during an active Bearish Market Structure Break (BOS).
- **Expected Result**: `INVALIDATED` / `NO_SIGNAL`
- **Actual Result**: `NO_SIGNAL` (Setups marked INVALIDATED / NO_SIGNAL).

## 3. Conclusion
Positive and negative cases behave in 100% strict alignment with frozen ICT model conditions.
