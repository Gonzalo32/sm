/**
 * ICT Predefined Setup Model Configurations (Examples for architecture validation)
 */

import { ICTSetupModel } from './ICTSetupModel';

export const MODEL_A_LONG: ICTSetupModel = {
  id: 'MODEL_A_LONG',
  name: 'Model A Long (Sweep -> MSS -> FVG)',
  description: 'Classic ICT Silver Bullet style Bullish setup requiring Sweep, MSS, and FVG',
  direction: 'LONG',
  sequenceMode: 'ORDERED',
  maxBarsBetweenConditions: 25,
  conditions: [
    { id: 'c1', type: 'LIQUIDITY_SWEEP', category: 'REQUIRED', description: 'SSL Liquidity Sweep' },
    { id: 'c2', type: 'MSS_CONFIRMED', category: 'REQUIRED', description: 'Bullish MSS Confirmation' },
    { id: 'c3', type: 'FVG_CONFLUENCE', category: 'REQUIRED', description: 'Bullish FVG Creation' },
    { id: 'c4', type: 'ORDER_BLOCK_CONFLUENCE', category: 'OPTIONAL', description: 'Confluent Order Block' },
  ],
};

export const MODEL_A_SHORT: ICTSetupModel = {
  id: 'MODEL_A_SHORT',
  name: 'Model A Short (Sweep -> MSS -> FVG)',
  description: 'Classic ICT Silver Bullet style Bearish setup requiring Sweep, MSS, and FVG',
  direction: 'SHORT',
  sequenceMode: 'ORDERED',
  maxBarsBetweenConditions: 25,
  conditions: [
    { id: 'c1', type: 'LIQUIDITY_SWEEP', category: 'REQUIRED', description: 'BSL Liquidity Sweep' },
    { id: 'c2', type: 'MSS_CONFIRMED', category: 'REQUIRED', description: 'Bearish MSS Confirmation' },
    { id: 'c3', type: 'FVG_CONFLUENCE', category: 'REQUIRED', description: 'Bearish FVG Creation' },
    { id: 'c4', type: 'ORDER_BLOCK_CONFLUENCE', category: 'OPTIONAL', description: 'Confluent Order Block' },
  ],
};

export const MODEL_B_LONG: ICTSetupModel = {
  id: 'MODEL_B_LONG',
  name: 'Model B Long (Sweep -> Displacement -> FVG)',
  description: 'Displacement-focused setup requiring Sweep, Displacement, and FVG',
  direction: 'LONG',
  sequenceMode: 'ORDERED',
  maxBarsBetweenConditions: 20,
  conditions: [
    { id: 'c1', type: 'LIQUIDITY_SWEEP', category: 'REQUIRED', description: 'SSL Liquidity Sweep' },
    { id: 'c2', type: 'DISPLACEMENT', category: 'REQUIRED', description: 'High-Volume Displacement Candle' },
    { id: 'c3', type: 'FVG_CONFLUENCE', category: 'REQUIRED', description: 'Bullish FVG Creation' },
  ],
};

export const PREDEFINED_MODELS: ICTSetupModel[] = [
  MODEL_A_LONG,
  MODEL_A_SHORT,
];
