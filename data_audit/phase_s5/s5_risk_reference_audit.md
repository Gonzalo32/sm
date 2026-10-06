# S5 — Risk Reference Audit

## 1. Objective

Audit whether the frozen candidate context contains deterministic structural reference levels suitable for defining initial invalidation levels without inventing new structural rules or tuning stop distances.

---

## 2. Examination of Frozen Candidate Context

The frozen candidate signal engine (`core/ict/`) produces candidate signals accompanied by immutable `CandidateContext` objects.

### Structural Risk Reference Candidates:
1. **Sweep Extreme Price**:
   * For `LONG_CANDIDATE`: Lowest price of liquidity sweep low bar prior to displacement/confirmation.
   * For `SHORT_CANDIDATE`: Highest price of liquidity sweep high bar prior to displacement/confirmation.
2. **FVG Boundary Price**:
   * For `LONG_CANDIDATE`: Lower boundary price of fair value gap.
   * For `SHORT_CANDIDATE`: Upper boundary price of fair value gap.
3. **Displacement Bar Extreme Price**:
   * For `LONG_CANDIDATE`: Low of displacement bar.
   * For `SHORT_CANDIDATE`: High of displacement bar.

---

## 3. Audit Determination

* **Status**: `DETERMINISTIC_STRUCTURAL_LEVEL`
* **Findings**:
  * Frozen `CandidateContext` includes exact structural levels (`sweepExtremePrice`, `fvgBoundaryPrice`, `displacementBarExtreme`).
  * Risk reference distance $R = |\text{entryPrice} - \text{RiskReferencePrice}|$ is unambiguously computed without discretionary choice or stop distance optimization.
  * No new structural rules were manufactured or added to `core/ict/`.

---

## 4. Verification

```text
RISK_REFERENCE_STATUS = DETERMINISTIC_STRUCTURAL_LEVEL
INVENTED_NEW_RULES = NO
OPTIMIZED_STOP_DISTANCE = NO
```
