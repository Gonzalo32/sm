/**
 * ICT Setup System - Typed Models & State Machine
 */

import { Timeframe } from '../../market/Candle';
import { ConfluenceType } from '../confluence/ConfluenceTypes';

export type SetupDirection = 'LONG' | 'SHORT';

export type SetupStatus =
  | 'WATCHING'     // Market in zone, watching for sweep / structure
  | 'FORMING'      // Sweep or MSS occurred, setup is forming
  | 'CONFIRMED'    // All mandatory confluences present (MSS + FVG/OB + Sweep)
  | 'INVALIDATED'  // Opposite structure break or invalidating condition occurred
  | 'COMPLETED'    // Target liquidity level reached
  | 'EXPIRED';     // Setup expired without confirmation

export interface ICTSetup {
  id: string;
  symbol: string;
  timeframe: Timeframe;
  direction: SetupDirection;
  status: SetupStatus;
  activatedTimestamp: number;
  confirmedTimestamp?: number;
  invalidatedTimestamp?: number;
  completedTimestamp?: number;
  mandatoryConfluences: ConfluenceType[];
  fulfilledConfluences: ConfluenceType[];
  missingConfluences: ConfluenceType[];
  invalidatingConditions: string[];
  evidence: string[];
}
