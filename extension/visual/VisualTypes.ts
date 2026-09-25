/**
 * Extension Visual Layer - Visual Object Types
 * Pure graphical representation decoupled from ICT calculation logic.
 */

import { Timeframe } from '../../core/market/Candle';

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

export interface VisualAdapterConfig {
  debugMode: boolean;
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
  };
}

export const DEFAULT_VISUAL_CONFIG: VisualAdapterConfig = {
  debugMode: true,
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
  },
};
