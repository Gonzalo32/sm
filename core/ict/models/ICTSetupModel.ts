/**
 * ICT Configurable Model Architecture
 * Defines declarative model interfaces so new setup models can be registered without modifying engine logic.
 */

import { ConfluenceType } from '../confluence/ConfluenceTypes';
import { SetupDirection } from '../setups/SetupTypes';

export type ExtendedConditionType = ConfluenceType | 'DISPLACEMENT';
export type ConditionCategory = 'REQUIRED' | 'OPTIONAL' | 'CONTEXT' | 'INVALIDATING';
export type EvaluationSequenceMode = 'ORDERED' | 'UNORDERED';

export interface ModelCondition {
  id: string;
  type: ExtendedConditionType;
  category: ConditionCategory;
  description: string;
  maxOffsetBars?: number; // Optional bar offset constraint relative to previous condition
}

export interface ICTSetupModel {
  id: string;
  name: string;
  description: string;
  direction: SetupDirection;
  sequenceMode: EvaluationSequenceMode;
  maxBarsBetweenConditions: number; // Maximum allowed bars between consecutive required conditions
  conditions: ModelCondition[];
}
