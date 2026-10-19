/**
 * Extension Visual Layer - Visual Object Types
 * Pure graphical representation decoupled from ICT calculation logic.
 */

import { Timeframe } from '../../core/market/Candle';
import { SetupDirection, SetupStatus } from '../../core/ict/setups/SetupTypes';

export type VisualObjectType =
  | 'MARKER'
  | 'LINE'
  | 'RECTANGLE'
  | 'TEXT_LABEL';

export interface BaseVisualObject {
  id: string;
  type: VisualObjectType;
  symbol: string;
  timeframe: Timeframe;
  color: string;
  fillColor?: string;
  lineWidth?: number;
  opacity?: number;
  zIndex: number;
  setupId?: string;
  setupStatus?: SetupStatus;
}

export interface VisualMarker extends BaseVisualObject {
  type: 'MARKER';
  shape: 'CIRCLE' | 'TRIANGLE_UP' | 'TRIANGLE_DOWN' | 'CROSS';
  candleIndex: number;
  timestamp: number;
  price: number;
  label?: string;
}

export interface VisualLine extends BaseVisualObject {
  type: 'LINE';
  price: number;
  startCandleIndex: number;
  endCandleIndex?: number; // If undefined, extends to right edge of chart
  startTimestamp: number;
  endTimestamp?: number;
  lineStyle: 'SOLID' | 'DASHED' | 'DOTTED';
  label?: string;
}

export interface VisualRectangle extends BaseVisualObject {
  type: 'RECTANGLE';
  highPrice: number;
  lowPrice: number;
  startCandleIndex: number;
  endCandleIndex?: number; // If undefined, extends to right edge of chart
  startTimestamp: number;
  endTimestamp?: number;
  label?: string;
}

export type VisualObject = VisualMarker | VisualLine | VisualRectangle;

export type SetupVisualType = 'BUY_SETUP' | 'SELL_SETUP';

export interface SetupVisualAnnotation {
  setupId: string;
  modelId: string;
  direction: SetupDirection;
  status: SetupStatus;
  visualType: SetupVisualType;
  symbol: string;
  timeframe: Timeframe;
  timestamp: number;
  entryPrice?: number;
  invalidationPrice?: number;
  targetPrice?: number;
  entryZone?: {
    highPrice: number;
    lowPrice: number;
    startCandleIndex: number;
    endCandleIndex?: number;
    startTimestamp: number;
    endTimestamp?: number;
  };
  reasonCodes: string[];
  visualObjects: VisualObject[];
}

export interface VisualAdapterConfig {
  debugMode: boolean;
  failClosedOnUnsyncedViewport?: boolean;
  hideInvalidated?: boolean;
  colorScheme: {
    swingHigh: string;
    swingLow: string;
    bosLine: string;
    mssLine: string;
    bslLine: string;
    sslLine: string;
    sweepMarker: string;
    bullishFvg: string;
    bearishFvg: string;
    bullishOb: string;
    bearishOb: string;
    buySetupMarker: string;
    sellSetupMarker: string;
    invalidationLine: string;
    targetLine: string;
    entryZoneBullish: string;
    entryZoneBearish: string;
  };
}

export const DEFAULT_VISUAL_CONFIG: VisualAdapterConfig = {
  debugMode: true,
  hideInvalidated: true,
  colorScheme: {
    swingHigh: '#f43f5e',
    swingLow: '#10b981',
    bosLine: '#38bdf8',
    mssLine: '#f59e0b',
    bslLine: '#ef4444',
    sslLine: '#22c55e',
    sweepMarker: '#a855f7',
    bullishFvg: 'rgba(34, 197, 94, 0.25)',
    bearishFvg: 'rgba(239, 68, 68, 0.25)',
    bullishOb: 'rgba(56, 189, 248, 0.3)',
    bearishOb: 'rgba(245, 158, 11, 0.3)',
    buySetupMarker: '#22c55e',
    sellSetupMarker: '#ef4444',
    invalidationLine: '#f43f5e',
    targetLine: '#38bdf8',
    entryZoneBullish: 'rgba(34, 197, 94, 0.20)',
    entryZoneBearish: 'rgba(239, 68, 68, 0.20)',
  },
};

export interface ChartViewportUpdate {
  source: 'TRADINGVIEW_WIDGET_API' | 'PASSIVE_CANDLE_STREAM' | 'MANUAL_TEST';
  symbol: string;
  timeframe: Timeframe;
  width: number;
  height: number;
  minPrice: number;
  maxPrice: number;
  firstCandleIndex: number;
  lastCandleIndex: number;
  barWidth?: number;
  timestamp: number;
}

export function validateViewportUpdate(
  data: unknown,
  expectedSymbol?: string,
  expectedTimeframe?: string,
  maxStalenessMs: number = 30000
): { valid: boolean; error?: string; viewport?: ChartViewportUpdate } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Viewport payload must be a non-null object' };
  }

  const p = data as Record<string, unknown>;

  if (p.source !== 'TRADINGVIEW_WIDGET_API' && p.source !== 'PASSIVE_CANDLE_STREAM' && p.source !== 'MANUAL_TEST') {
    return { valid: false, error: `Invalid viewport source: ${String(p.source)}` };
  }

  if (typeof p.symbol !== 'string' || !p.symbol.trim()) {
    return { valid: false, error: 'Viewport symbol must be a non-empty string' };
  }

  if (typeof p.timeframe !== 'string' || !p.timeframe.trim()) {
    return { valid: false, error: 'Viewport timeframe must be a non-empty string' };
  }

  if (expectedSymbol && p.symbol !== expectedSymbol) {
    return { valid: false, error: `Viewport symbol mismatch: received ${p.symbol}, expected ${expectedSymbol}` };
  }

  if (expectedTimeframe && p.timeframe !== expectedTimeframe) {
    return { valid: false, error: `Viewport timeframe mismatch: received ${p.timeframe}, expected ${expectedTimeframe}` };
  }

  const numFields: Array<{ name: keyof ChartViewportUpdate; min: number; strictlyPositive?: boolean }> = [
    { name: 'width', min: 1, strictlyPositive: true },
    { name: 'height', min: 1, strictlyPositive: true },
    { name: 'minPrice', min: 0, strictlyPositive: true },
    { name: 'maxPrice', min: 0, strictlyPositive: true },
    { name: 'firstCandleIndex', min: 0 },
    { name: 'lastCandleIndex', min: 0 },
    { name: 'timestamp', min: 1, strictlyPositive: true },
  ];

  for (const field of numFields) {
    const val = p[field.name];
    if (typeof val !== 'number' || !isFinite(val) || isNaN(val)) {
      return { valid: false, error: `Viewport field ${field.name} must be a finite number` };
    }
    if (field.strictlyPositive && val <= 0) {
      return { valid: false, error: `Viewport field ${field.name} must be strictly positive` };
    }
    if (val < field.min) {
      return { valid: false, error: `Viewport field ${field.name} must be >= ${field.min}` };
    }
  }

  const minPrice = p.minPrice as number;
  const maxPrice = p.maxPrice as number;
  if (maxPrice <= minPrice) {
    return { valid: false, error: `maxPrice (${maxPrice}) must be greater than minPrice (${minPrice})` };
  }

  const firstCandleIndex = p.firstCandleIndex as number;
  const lastCandleIndex = p.lastCandleIndex as number;
  if (lastCandleIndex < firstCandleIndex) {
    return { valid: false, error: `lastCandleIndex (${lastCandleIndex}) must be >= firstCandleIndex (${firstCandleIndex})` };
  }

  const timestamp = p.timestamp as number;
  const now = Date.now();
  if (now - timestamp > maxStalenessMs) {
    return { valid: false, error: `Viewport update is stale (${now - timestamp}ms old, max allowed: ${maxStalenessMs}ms)` };
  }

  return {
    valid: true,
    viewport: {
      source: p.source as ChartViewportUpdate['source'],
      symbol: p.symbol as string,
      timeframe: p.timeframe as Timeframe,
      width: p.width as number,
      height: p.height as number,
      minPrice,
      maxPrice,
      firstCandleIndex,
      lastCandleIndex,
      barWidth: typeof p.barWidth === 'number' && isFinite(p.barWidth) && p.barWidth > 0 ? p.barWidth : undefined,
      timestamp,
    },
  };
}
