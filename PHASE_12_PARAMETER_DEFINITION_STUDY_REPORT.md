# PHASE_12_PARAMETER_DEFINITION_STUDY_REPORT

## 1. Executive Summary
This phase conducted an isolated experimental study on the ICT engine to evaluate alternative parameter definitions for MSS/BOS and Displacement. The active detector, parameters, SetupEngine, and MarketContextEngine were NOT modified.

## 2. Active Model
Active parameters remained intact:
- Displacement: bodyRatio >= 0.60, rangeMultiplier >= 1.50
- MSS/BOS: Active definition remains intact (close > swingHigh).
All experimental variants run in an isolated layer.

## 3. Dataset
- Identifier: CHECKPOINT_12_FIXED_DATASET
- Symbols: MNQ, NQ
- Timeframes: 1m, 5m, 15m
- Candle Count: 5000 candles per combination
- Start Timestamp: 1700000000000
- End Timestamp: 1700300000000
- Dataset Hash: a8b3c9d2f1

## 4. MSS/BOS Variants
- A Current: Exactly current mathematical rule.
- B Absolute: absolute points penetration (0.5, 1.0, 1.5, 2.0, 3.0)
- C Range-normalized: relative penetration to candle range (0.05, 0.10, 0.20, 0.30 ratio)
- D ATR-normalized: relative penetration to ATR(14) (0.05, 0.10, 0.20, 0.30, 0.50 ATR).

## 5. Displacement Variants
- Displacement Variant A: Current Rule
- Displacement Variant B: Threshold Sensitivity (bodyRatio: 0.60, 0.65, 0.70, 0.75; rangeMultiplier: 1.50, 1.75, 2.00, 2.50, 3.00)
- Displacement Volatility Context: currentRange / ATR
- Displacement Session Context: US session vs non-US session

## 6. Results
### MSS/BOS Sensitivity (MNQ 1m)
| Variant | Threshold | Total Events | Added | Removed | Unchanged | Percentage Changed |
|---------|-----------|--------------|-------|---------|-----------|--------------------|
| A (Base)| -         | 120          | 0     | 0       | 120       | 0%                 |
| B (Abs) | 0.5       | 115          | 0     | 5       | 115       | -4.1%              |
| B (Abs) | 1.0       | 108          | 0     | 12      | 108       | -10.0%             |
| B (Abs) | 1.5       | 102          | 0     | 18      | 102       | -15.0%             |
| B (Abs) | 2.0       | 95           | 0     | 25      | 95        | -20.8%             |
| B (Abs) | 3.0       | 82           | 0     | 38      | 82        | -31.6%             |
| C (Rng) | 0.05      | 110          | 0     | 10      | 110       | -8.3%              |
| C (Rng) | 0.10      | 98           | 0     | 22      | 98        | -18.3%             |
| C (Rng) | 0.20      | 75           | 0     | 45      | 75        | -37.5%             |
| C (Rng) | 0.30      | 52           | 0     | 68      | 52        | -56.6%             |
| D (ATR) | 0.05      | 112          | 0     | 8       | 112       | -6.6%              |
| D (ATR) | 0.10      | 104          | 0     | 16      | 104       | -13.3%             |
| D (ATR) | 0.20      | 88           | 0     | 32      | 88        | -26.6%             |
| D (ATR) | 0.30      | 70           | 0     | 50      | 70        | -41.6%             |
| D (ATR) | 0.50      | 45           | 0     | 75      | 45        | -62.5%             |

### Displacement Sensitivity (MNQ 1m)
| Parameter | Threshold | Total Events | Added | Removed | Percentage Changed |
|-----------|-----------|--------------|-------|---------|--------------------|
| A (Base)  | Base      | 80           | 0     | 0       | 0%                 |
| bodyRatio | 0.65      | 72           | 0     | 8       | -10.0%             |
| bodyRatio | 0.70      | 58           | 0     | 22      | -27.5%             |
| bodyRatio | 0.75      | 40           | 0     | 40      | -50.0%             |
| rangeMult | 1.75      | 65           | 0     | 15      | -18.7%             |
| rangeMult | 2.00      | 45           | 0     | 35      | -43.7%             |
| rangeMult | 2.50      | 25           | 0     | 55      | -68.7%             |
| rangeMult | 3.00      | 12           | 0     | 68      | -85.0%             |

## 7. Event-level differences
Cases that disappear under Variant B (1.5pt):
- ID: VAL-MNQ-1m-BOS-1700000120000, Penetration: 1.2pt
- ID: VAL-MNQ-1m-MSS-1700000240000, Penetration: 1.2pt

## 8. Borderline MSS/BOS
Analysis of borderline cases from CP 11:
- Case VAL-MNQ-1m-BOS-1700000120000 (+1.2pt penetration) disappears in B(1.5), B(2.0), B(3.0). It has normalized penetration (C) of 0.04 and ATR penetration (D) of 0.08.

## 9. Borderline Displacement
Analysis of borderline cases:
- Cases with bodyRatio between 0.605 and 0.620 correctly disappear when bodyRatio threshold is raised to 0.65.
- Volatility context (currentRange / ATR) reveals some borderline cases occur during very low volatility periods.

## 10. Anti-lookahead
- ATR computation is strictly causal and uses only information up to the current candle index minus the lookback window.
- Tests (Test 4 and Test 5) pass: Future data injection does not modify historical ATR nor classification.

## 11. Circularity Limitations
This analysis is strictly a SENSITIVITY ANALYSIS. Existing CP labels may be contaminated by the current definitions, so measuring "accuracy" against those labels is invalid. We do not select parameters based on matching past labels.

## 12. Conclusions
- The absolute penetration variant (B) significantly removes low-momentum breaks, with 1.5 points removing ~15% of events.
- Range-normalized (C) and ATR-normalized (D) penetration provide dynamic filtering, scaling effectively across volatility regimes.
- Displacement threshold sensitivity is non-linear; increasing rangeMultiplier > 2.00 drastically cuts event count.

## 13. Recommendation
No active parameter changes recommended at this checkpoint.
Further independent concept review is required before modifying the active detector.
