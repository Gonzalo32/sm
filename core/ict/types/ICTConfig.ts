/**
 * ICT Engine - Central Configuration
 * Fully configurable parameters for all ICT deterministic algorithms.
 * NO magic values in algorithms.
 */

export interface ICTConfig {
  // Swing Detection Parameters
  swingLeftBars: number;            // Number of bars to the left required to form peak (default: 2)
  swingRightBars: number;           // Number of bars to the right required to confirm peak (default: 2)
  swingMinDisplacementPoints: number; // Minimum price displacement to confirm swing

  // Market Structure Parameters
  bosBreakMode: 'CLOSE' | 'WICK';   // Require candle close or wick break for BOS (default: CLOSE)
  mssBreakMode: 'CLOSE' | 'WICK';   // Require candle close or wick break for MSS (default: CLOSE)

  // Liquidity Parameters
  liquidityTolerancePoints: number; // Price tolerance to group Equal Highs / Lows (default: 0.5)
  sweepMinPenetrationPoints: number;// Minimum price penetration beyond liquidity level to trigger sweep

  // Fair Value Gap (FVG) Parameters
  fvgMinSizePoints: number;         // Minimum gap size in points to qualify as FVG (default: 0.25)
  fvgMitigationMode: 'TOUCH' | 'FILL_50' | 'FILL_100'; // Mitigation criteria (default: TOUCH)

  // Dealing Range / Premium & Discount
  dealingRangeLookbackBars: number; // Lookback window to define active Dealing Range (default: 50)
}

export const DEFAULT_ICT_CONFIG: ICTConfig = {
  swingLeftBars: 2,
  swingRightBars: 2,
  swingMinDisplacementPoints: 0.0,
  bosBreakMode: 'CLOSE',
  mssBreakMode: 'CLOSE',
  liquidityTolerancePoints: 0.5,
  sweepMinPenetrationPoints: 0.1,
  fvgMinSizePoints: 0.25,
  fvgMitigationMode: 'TOUCH',
  dealingRangeLookbackBars: 50,
};
