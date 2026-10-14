/**
 * Core Analyst - Market Risk Filter & Directional Decider
 * Conservative decision-support filter that evaluates scenario viability,
 * checks conflicting structural evidence, calculates reward-to-risk with transparent friction assumptions,
 * and defaults fail-closed to NO_CLEAR_OPPORTUNITY or CONFLICTING_EVIDENCE when conditions are inadequate.
 */

import {
  MarketScenario,
  MarketAnalysisStatus,
  MarketDirection,
  MarketRiskFilterConfig,
  DEFAULT_RISK_FILTER_CONFIG,
} from './MarketAnalystTypes';

export interface ScenarioViabilityEvaluation {
  viable: boolean;
  rejectionReasons: string[];
  netRewardRiskRatio?: number;
}

export class MarketRiskFilter {
  private config: MarketRiskFilterConfig;

  constructor(config: Partial<MarketRiskFilterConfig> = {}) {
    this.config = { ...DEFAULT_RISK_FILTER_CONFIG, ...config };
  }

  public getConfig(): MarketRiskFilterConfig {
    return { ...this.config };
  }

  /**
   * Evaluates the structural viability of an individual scenario.
   */
  public evaluateScenarioViability(scenario: MarketScenario): ScenarioViabilityEvaluation {
    const reasons: string[] = [];

    // 1. Invalidation Level Check
    if (scenario.invalidationLevel === undefined || !isFinite(scenario.invalidationLevel)) {
      reasons.push('Missing structural invalidation level: scenario risk cannot be defined');
    } else {
      if (scenario.direction === 'BULLISH' && scenario.invalidationLevel >= scenario.referencePrice) {
        reasons.push(
          `Invalid invalidation geometry: bullish invalidation (${scenario.invalidationLevel}) is at or above reference price (${scenario.referencePrice})`
        );
      } else if (scenario.direction === 'BEARISH' && scenario.invalidationLevel <= scenario.referencePrice) {
        reasons.push(
          `Invalid invalidation geometry: bearish invalidation (${scenario.invalidationLevel}) is at or below reference price (${scenario.referencePrice})`
        );
      }
    }

    // 2. Target Check
    if (!scenario.nearbyTarget || !isFinite(scenario.nearbyTarget.price)) {
      reasons.push('Missing structural nearby target: scenario objective cannot be identified');
    } else {
      if (scenario.direction === 'BULLISH' && scenario.nearbyTarget.price <= scenario.referencePrice) {
        reasons.push(
          `Invalid target geometry: bullish target (${scenario.nearbyTarget.price}) is at or below reference price (${scenario.referencePrice})`
        );
      } else if (scenario.direction === 'BEARISH' && scenario.nearbyTarget.price >= scenario.referencePrice) {
        reasons.push(
          `Invalid target geometry: bearish target (${scenario.nearbyTarget.price}) is at or above reference price (${scenario.referencePrice})`
        );
      }
    }

    // 3. Risk Distance and Reward/Risk Calculation
    let netRewardRiskRatio: number | undefined = undefined;
    if (reasons.length === 0 && scenario.invalidationLevel !== undefined && scenario.nearbyTarget !== undefined) {
      const riskDistance = Math.abs(scenario.referencePrice - scenario.invalidationLevel);
      const grossMove = Math.abs(scenario.nearbyTarget.price - scenario.referencePrice);
      const netMove = Math.max(0, grossMove - this.config.baselineFrictionAssumptionPts);

      scenario.riskDistance = Number(riskDistance.toFixed(2));
      scenario.estimatedGrossMove = Number(grossMove.toFixed(2));
      scenario.estimatedNetMove = Number(netMove.toFixed(2));
      scenario.frictionAssumptionNote = `Net move assumes ${this.config.baselineFrictionAssumptionPts.toFixed(
        2
      )} pt benchmark friction baseline (spread/slippage/commissions). Actual transaction costs vary with broker and market liquidity.`;

      if (riskDistance > this.config.maxStructuralRiskDistancePts) {
        reasons.push(
          `Excessive structural risk distance (${riskDistance.toFixed(2)} pts > threshold ${
            this.config.maxStructuralRiskDistancePts
          } pts)`
        );
      }

      if (riskDistance > 0) {
        netRewardRiskRatio = Number((netMove / riskDistance).toFixed(2));
        scenario.estimatedRewardRiskRatio = netRewardRiskRatio;

        if (netRewardRiskRatio < this.config.minRewardRiskRatio) {
          reasons.push(
            `Inadequate estimated reward/risk ratio (${netRewardRiskRatio.toFixed(
              2
            )} < required minimum ${this.config.minRewardRiskRatio})`
          );
        }
      } else {
        reasons.push('Zero risk distance detected; reward/risk is undefined');
      }
    }

    // 4. Conflicting Structural Evidence Weight
    if (scenario.conflictingEvidence.length > scenario.supportingEvidence.length && scenario.supportingEvidence.length < 2) {
      reasons.push(
        `Conflicting structural evidence (${scenario.conflictingEvidence.length} factors) outweighs weak supporting evidence (${scenario.supportingEvidence.length} factors)`
      );
    }

    return {
      viable: reasons.length === 0,
      rejectionReasons: reasons,
      netRewardRiskRatio,
    };
  }

  /**
   * Compares bullish and bearish scenarios and determines the overall analysis status and preferred direction.
   */
  public selectPreferredScenario(
    bullish?: MarketScenario,
    bearish?: MarketScenario
  ): {
    status: MarketAnalysisStatus;
    preferredDirection: MarketDirection;
    selectedScenario?: MarketScenario;
    explanation: string;
  } {
    const bullEval = bullish ? this.evaluateScenarioViability(bullish) : { viable: false, rejectionReasons: ['No bullish scenario generated'] };
    const bearEval = bearish ? this.evaluateScenarioViability(bearish) : { viable: false, rejectionReasons: ['No bearish scenario generated'] };

    // Case 1: Both scenarios fail structural viability
    if (!bullEval.viable && !bearEval.viable) {
      const allRejections = [
        ...bullEval.rejectionReasons.map((r) => `Bullish: ${r}`),
        ...bearEval.rejectionReasons.map((r) => `Bearish: ${r}`),
      ];
      return {
        status: 'NO_CLEAR_OPPORTUNITY',
        preferredDirection: 'INDETERMINATE',
        explanation: `No viable directional scenario identified. Criteria not satisfied: ${allRejections.join('; ')}`,
      };
    }

    // Case 2: Both scenarios are structurally viable (Conflicting Evidence)
    if (bullEval.viable && bearEval.viable) {
      const bullScore = (bullish?.supportingEvidence.length || 0) - (bullish?.conflictingEvidence.length || 0);
      const bearScore = (bearish?.supportingEvidence.length || 0) - (bearish?.conflictingEvidence.length || 0);

      const bullRR = bullEval.netRewardRiskRatio || 0;
      const bearRR = bearEval.netRewardRiskRatio || 0;

      // If scores and RR are very close, declare conflicting evidence
      if (Math.abs(bullScore - bearScore) <= 1 && Math.abs(bullRR - bearRR) < 0.5) {
        return {
          status: 'CONFLICTING_EVIDENCE',
          preferredDirection: 'INDETERMINATE',
          explanation:
            'Both Bullish and Bearish scenarios exhibit comparable structural plausibility and risk/reward profiles. Market exhibits equilibrium or conflicting multi-timeframe pressures; no unambiguous directional edge exists.',
        };
      }

      // Stronger score wins preference
      if (bullScore > bearScore || (bullScore === bearScore && bullRR > bearRR)) {
        return {
          status: 'ANALYSIS_READY',
          preferredDirection: 'BULLISH',
          selectedScenario: bullish,
          explanation: `Bullish scenario preferred due to superior net confluence score (+${bullScore} vs +${bearScore}) and reward/risk profile (${bullRR} vs ${bearRR}).`,
        };
      } else {
        return {
          status: 'ANALYSIS_READY',
          preferredDirection: 'BEARISH',
          selectedScenario: bearish,
          explanation: `Bearish scenario preferred due to superior net confluence score (+${bearScore} vs +${bullScore}) and reward/risk profile (${bearRR} vs ${bullRR}).`,
        };
      }
    }

    // Case 3: Only Bullish is viable
    if (bullEval.viable && !bearEval.viable) {
      return {
        status: 'ANALYSIS_READY',
        preferredDirection: 'BULLISH',
        selectedScenario: bullish,
        explanation: `Bullish scenario satisfies all structural criteria and risk filters. Bearish scenario was rejected: ${bearEval.rejectionReasons.join(
          '; '
        )}`,
      };
    }

    // Case 4: Only Bearish is viable
    return {
      status: 'ANALYSIS_READY',
      preferredDirection: 'BEARISH',
      selectedScenario: bearish,
      explanation: `Bearish scenario satisfies all structural criteria and risk filters. Bullish scenario was rejected: ${bullEval.rejectionReasons.join(
        '; '
      )}`,
    };
  }
}
