import { describe, it, expect } from 'vitest';
import { MarketRiskFilter } from '../core/analyst/MarketRiskFilter';
import { MarketScenario } from '../core/analyst/MarketAnalystTypes';

describe('TradeSea Market Analyst — Market Risk Filter Unit Tests', () => {
  const filter = new MarketRiskFilter({
    minRewardRiskRatio: 1.2,
    baselineFrictionAssumptionPts: 1.0,
    maxStructuralRiskDistancePts: 80.0,
  });

  it('1. Rejects invalid invalidation geometry (bullish invalidation above ref price)', () => {
    const scenario: MarketScenario = {
      direction: 'BULLISH',
      referencePrice: 20000,
      nearbyTarget: { price: 20050, rationale: 'BSL', structuralSource: 'LIQUIDITY_POOL' },
      invalidationLevel: 20010, // Invalid: above reference price!
      supportingEvidence: ['Trend is bullish', 'Discount zone'],
      conflictingEvidence: [],
      conditionsRequired: [],
      confidenceLabel: 'MODERATE',
      targetAccessibilityNotes: [],
    };

    const res = filter.evaluateScenarioViability(scenario);
    expect(res.viable).toBe(false);
    expect(res.rejectionReasons.some((r) => r.includes('Invalid invalidation geometry'))).toBe(true);
  });

  it('2. Rejects invalid target geometry (bearish target above ref price)', () => {
    const scenario: MarketScenario = {
      direction: 'BEARISH',
      referencePrice: 20000,
      nearbyTarget: { price: 20050, rationale: 'Above price', structuralSource: 'LIQUIDITY_POOL' }, // Invalid for bearish!
      invalidationLevel: 20030,
      supportingEvidence: ['Trend is bearish', 'Premium zone'],
      conflictingEvidence: [],
      conditionsRequired: [],
      confidenceLabel: 'MODERATE',
      targetAccessibilityNotes: [],
    };

    const res = filter.evaluateScenarioViability(scenario);
    expect(res.viable).toBe(false);
    expect(res.rejectionReasons.some((r) => r.includes('Invalid target geometry'))).toBe(true);
  });

  it('3. Computes gross and net move applying benchmark friction assumption note', () => {
    const scenario: MarketScenario = {
      direction: 'BULLISH',
      referencePrice: 20000,
      nearbyTarget: { price: 20060, rationale: 'BSL target', structuralSource: 'LIQUIDITY_POOL' },
      invalidationLevel: 19960, // Risk: 40 pts. Gross: 60 pts. Net: 59 pts. RR: 59/40 = 1.475
      supportingEvidence: ['Trend is bullish', 'Discount zone'],
      conflictingEvidence: [],
      conditionsRequired: [],
      confidenceLabel: 'MODERATE',
      targetAccessibilityNotes: [],
    };

    const res = filter.evaluateScenarioViability(scenario);
    expect(res.viable).toBe(true);
    expect(scenario.estimatedGrossMove).toBe(60.0);
    expect(scenario.estimatedNetMove).toBe(59.0); // 60 - 1.00 pt friction
    expect(scenario.riskDistance).toBe(40.0);
    expect(scenario.estimatedRewardRiskRatio).toBe(1.48);
    expect(scenario.frictionAssumptionNote).toContain('1.00 pt benchmark friction baseline');
  });

  it('4. Rejects scenario with inadequate reward/risk ratio (< 1.2)', () => {
    const scenario: MarketScenario = {
      direction: 'BULLISH',
      referencePrice: 20000,
      nearbyTarget: { price: 20030, rationale: 'Small BSL target', structuralSource: 'LIQUIDITY_POOL' },
      invalidationLevel: 19960, // Risk: 40 pts. Gross: 30 pts. Net: 29 pts. RR: 29/40 = 0.725 (< 1.2)
      supportingEvidence: ['Trend is bullish', 'Discount zone'],
      conflictingEvidence: [],
      conditionsRequired: [],
      confidenceLabel: 'MODERATE',
      targetAccessibilityNotes: [],
    };

    const res = filter.evaluateScenarioViability(scenario);
    expect(res.viable).toBe(false);
    expect(res.rejectionReasons.some((r) => r.includes('Inadequate estimated reward/risk ratio'))).toBe(true);
  });

  it('5. Rejects scenario with excessive structural risk distance (> 80 pts)', () => {
    const scenario: MarketScenario = {
      direction: 'BULLISH',
      referencePrice: 20000,
      nearbyTarget: { price: 20150, rationale: 'Huge target', structuralSource: 'LIQUIDITY_POOL' },
      invalidationLevel: 19910, // Risk: 90 pts (> 80 pt threshold)
      supportingEvidence: ['Trend is bullish', 'Discount zone'],
      conflictingEvidence: [],
      conditionsRequired: [],
      confidenceLabel: 'MODERATE',
      targetAccessibilityNotes: [],
    };

    const res = filter.evaluateScenarioViability(scenario);
    expect(res.viable).toBe(false);
    expect(res.rejectionReasons.some((r) => r.includes('Excessive structural risk distance'))).toBe(true);
  });

  it('6. Rejects scenario when conflicting evidence heavily outweighs weak supporting evidence', () => {
    const scenario: MarketScenario = {
      direction: 'BULLISH',
      referencePrice: 20000,
      nearbyTarget: { price: 20080, rationale: 'BSL target', structuralSource: 'LIQUIDITY_POOL' },
      invalidationLevel: 19960,
      supportingEvidence: ['Minor discount'], // Only 1 supporting factor
      conflictingEvidence: [
        'Bearish trend',
        'Bearish MSS confirmed',
        'Recent BSL sweep exhaust',
      ], // 3 conflicting factors
      conditionsRequired: [],
      confidenceLabel: 'LOW',
      targetAccessibilityNotes: [],
    };

    const res = filter.evaluateScenarioViability(scenario);
    expect(res.viable).toBe(false);
    expect(res.rejectionReasons.some((r) => r.includes('Conflicting structural evidence'))).toBe(true);
  });

  it('7. selectPreferredScenario returns NO_CLEAR_OPPORTUNITY when neither scenario is viable', () => {
    const bull: MarketScenario = {
      direction: 'BULLISH',
      referencePrice: 20000,
      supportingEvidence: [],
      conflictingEvidence: [],
      conditionsRequired: [],
      confidenceLabel: 'LOW',
      targetAccessibilityNotes: [],
    };
    const bear: MarketScenario = {
      direction: 'BEARISH',
      referencePrice: 20000,
      supportingEvidence: [],
      conflictingEvidence: [],
      conditionsRequired: [],
      confidenceLabel: 'LOW',
      targetAccessibilityNotes: [],
    };

    const res = filter.selectPreferredScenario(bull, bear);
    expect(res.status).toBe('NO_CLEAR_OPPORTUNITY');
    expect(res.preferredDirection).toBe('INDETERMINATE');
    expect(res.selectedScenario).toBeUndefined();
  });

  it('8. selectPreferredScenario selects winning scenario when one has decisive net confluence', () => {
    const bull: MarketScenario = {
      direction: 'BULLISH',
      referencePrice: 20000,
      nearbyTarget: { price: 20070, rationale: 'BSL', structuralSource: 'LIQUIDITY_POOL' },
      invalidationLevel: 19960, // Gross: 70, Net: 69, Risk: 40 -> RR = 1.725
      supportingEvidence: ['Trend is bullish', 'Discount zone', 'SSL sweep', 'Active FVG'], // 4
      conflictingEvidence: [], // 0 -> Score = +4
      conditionsRequired: [],
      confidenceLabel: 'HIGH',
      targetAccessibilityNotes: [],
    };

    const bear: MarketScenario = {
      direction: 'BEARISH',
      referencePrice: 20000,
      nearbyTarget: { price: 19930, rationale: 'SSL', structuralSource: 'LIQUIDITY_POOL' },
      invalidationLevel: 20040, // Gross: 70, Net: 69, Risk: 40 -> RR = 1.725
      supportingEvidence: ['Bearish FVG', 'Minor swing'], // 2
      conflictingEvidence: ['Trend is bullish'], // 1 -> Score = +1
      conditionsRequired: [],
      confidenceLabel: 'LOW',
      targetAccessibilityNotes: [],
    };

    const res = filter.selectPreferredScenario(bull, bear);
    expect(res.status).toBe('ANALYSIS_READY');
    expect(res.preferredDirection).toBe('BULLISH');
    expect(res.selectedScenario).toBe(bull);
    expect(res.explanation).toContain('Bullish scenario preferred due to superior net confluence score (+4 vs +1)');
  });
});
