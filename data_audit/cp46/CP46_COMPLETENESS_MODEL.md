# CP46 Information Completeness Model

## 1. Domain Object Completeness Taxonomy

| Object | Required Information | Optional Information | Partial State | Authoritative Condition | Finalization Condition | Status |
|---|---|---|---|---|---|---|
| **Candle** | `timestamp`, `open`, `high`, `low`, `close` | `volume` | Open candle tick updates | Ingested candle with valid OHLC prices | Closed tick flag (`isClosed = true`) or period boundary transition | **VERIFIED** |
| **ICT Event** | `id`, `type`, `symbol`, `timeframe`, `timestamp` | `priceHigh`, `priceLow`, `confirmationTime` | Provisional/unconfirmed event detection | Explicit confirmation (`isConfirmed = true`) | Event closed / committed to context | **VERIFIED** |
| **CandidateContext** | `id`, `symbol`, `timeframe`, `eventTimestamp` | `confirmationTimestamp`, `supportingEvents` | `PROVISIONAL` context | `CONTEXT_CONFIRMED` status with non-null confirmation time | Replaced or expired cleanly | **VERIFIED** |
| **MTF Relation** | `htfContext`, `ltfContext`, `causal` flag | `htfConfirmedTime` | Unconfirmed HTF alignment | `causal = true` AND `status = 'CONFIRMED'` ($T_{\text{conf}}^{\text{HTF}} \le T_{\text{ev}}^{\text{LTF}}$) | Context switch / clear | **VERIFIED** |
| **VisualObject** | `id`, `type`, `price`, `timestamp` | `metadata` | Rendered from provisional context | Read-only visual rendering (`isAuthoritative = false`) | Removed upon context replacement | **VERIFIED** |

---

## 2. Invariant Rules Defined
- **Rule M01:** Incomplete/provisional objects are NEVER promoted to authoritative status without satisfying explicit confirmation conditions.
- **Rule M02:** Optional fields (such as volume) default gracefully to neutral baseline (0) without failing validation.
- **Rule M03:** Malformed required fields (e.g. `NaN` prices) trigger immediate input rejection without producing downstream partial state.
