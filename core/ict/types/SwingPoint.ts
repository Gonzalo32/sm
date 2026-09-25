/**
 * ICT Engine - Swing Point Data Model
 */

import { Timeframe } from '../../market/Candle';

export type SwingType = 'SWING_HIGH' | 'SWING_LOW';
export type SwingClassification = 'INTERNAL' | 'EXTERNAL';

export interface SwingPoint {
  id: string;
  symbol: string;
  timeframe: Timeframe;
  candleIndex: number;          // Peak candle index
  timestamp: number;            // Peak candle timestamp (eventTimestamp)
  eventTimestamp: number;       // Peak candle timestamp
  confirmationTimestamp: number;// Timestamp when rightBars confirmed the peak
  price: number;
  type: SwingType;
  strength: number;              // Left + right confirmation bars used
  confirmed: boolean;            // True when rightBars are fully completed
  classification: SwingClassification;
  broken: boolean;               // True if broken by subsequent BOS or MSS
  brokenTimestamp?: number;
}
