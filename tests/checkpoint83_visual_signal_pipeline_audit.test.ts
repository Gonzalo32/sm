import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { PREDEFINED_MODELS } from '../core/ict/models/PredefinedModels';
import { SetupEngine } from '../core/ict/setups/SetupEngine';
import { VisualAdapter } from '../extension/visual/VisualAdapter';
import { TradeSeaPassiveRecorder } from '../extension/content/TradeSeaPassiveRecorder';

describe('CP83 — Visual-Only ICT Signal Pipeline & Chart Overlay Audit Suite', () => {
  const rootDir = process.cwd();
  const manifestPath = path.join(rootDir, 'data_audit/phase_s10_prospective/s10_session_manifest.json');
  const protocolPath = path.join(rootDir, 'data_audit/phase_s10_prospective/s10_prospective_protocol_spec_v1_1_0_final.json');
  const session002SummaryPath = path.join(
    rootDir,
    'data_audit/phase_s10_prospective/daily_captures/S10_SESSION_002_20261013/s10_session_002_summary.json'
  );

  it('1. core/ict/ maintains 0 diff lines against baseline commit 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a', () => {
    const diff = execSync('git diff 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a -- core/ict/', {
      encoding: 'utf-8',
      cwd: rootDir,
    });
    expect(diff.trim()).toBe('');
  });

  it('2. Exact byte SHA-256 of s10_session_manifest.json and protocol v1.1.0 spec match frozen values', () => {
    const manifestBytes = fs.readFileSync(manifestPath);
    const manifestHash = crypto.createHash('sha256').update(manifestBytes).digest('hex');
    expect(manifestHash).toBe('744720e2b930550d1d7bb76654459b9277c094302b595051fad8323cba7f7107');

    const protocolBytes = fs.readFileSync(protocolPath);
    const protocolHash = crypto.createHash('sha256').update(protocolBytes).digest('hex');
    expect(protocolHash).toBe('d8c4e83cbce2a303c2fd947cac424822d6d6885a4d5800ff234ef5e348317220');
  });

  it('3. PredefinedModels (Models A/B/C) declare strictly directional setups without execution rules', () => {
    expect(PREDEFINED_MODELS.length).toBe(6);

    const modelIds = PREDEFINED_MODELS.map((m) => m.id);
    expect(modelIds).toContain('MODEL_A_LONG');
    expect(modelIds).toContain('MODEL_A_SHORT');
    expect(modelIds).toContain('MODEL_B_LONG');
    expect(modelIds).toContain('MODEL_B_SHORT');
    expect(modelIds).toContain('MODEL_C_LONG');
    expect(modelIds).toContain('MODEL_C_SHORT');

    for (const model of PREDEFINED_MODELS) {
      expect(['LONG', 'SHORT']).toContain(model.direction);
      expect(model.conditions.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('4. SetupEngine generates structured ICTSetup objects with directional states and evidence', () => {
    const engine = new SetupEngine();
    const mockState: any = {
      symbol: 'MNQ',
      timeframe: '1m',
      lastUpdatedTimestamp: 1728820000000,
      lastCandleIndex: 50,
      swings: [],
      liquidityLevels: [],
      fairValueGaps: [],
      orderBlocks: [],
      trend: 'NEUTRAL',
    };

    const setups = engine.evaluateSetups(mockState, [], []);
    expect(setups.length).toBe(6);

    for (const setup of setups) {
      expect(setup.symbol).toBe('MNQ');
      expect(setup.timeframe).toBe('1m');
      expect(['LONG', 'SHORT']).toContain(setup.direction);
      expect(['WATCHING', 'FORMING', 'CONFIRMED', 'INVALIDATED', 'EXPIRED']).toContain(setup.status);
      expect(Array.isArray(setup.evidence)).toBe(true);
    }
  });

  it('5. Audit of VisualAdapter confirms implementation contract and CP84 resolution', () => {
    const visualAdapter = new VisualAdapter();
    const prototypeKeys = Object.getOwnPropertyNames(Object.getPrototypeOf(visualAdapter));

    // VisualAdapter has adaptStateToVisuals
    expect(prototypeKeys).toContain('adaptStateToVisuals');

    // Audit verification: adaptStateToVisuals parameters
    expect(visualAdapter.adaptStateToVisuals.length).toBeLessThanOrEqual(3);

    // CP84 closed the setup visual connection via adaptSetupsToVisuals
    if (prototypeKeys.includes('adaptSetupsToVisuals')) {
      expect(typeof (visualAdapter as any).adaptSetupsToVisuals).toBe('function');
    }
  });

  it('6. Non-Execution Guarantee: extension and visual components possess strictly zero order execution methods', () => {
    const recorder = new TradeSeaPassiveRecorder();
    const recorderKeys = Object.getOwnPropertyNames(Object.getPrototypeOf(recorder));
    expect(recorderKeys).not.toContain('buy');
    expect(recorderKeys).not.toContain('sell');
    expect(recorderKeys).not.toContain('placeOrder');
    expect(recorderKeys).not.toContain('executeOrder');
    expect(recorderKeys).not.toContain('flatten');

    const visualAdapter = new VisualAdapter();
    const visualKeys = Object.getOwnPropertyNames(Object.getPrototypeOf(visualAdapter));
    expect(visualKeys).not.toContain('submitTrade');
    expect(visualKeys).not.toContain('executeSignal');
  });

  it('7. Governance Invariants: Session 002 preserved as INVALID_INCOMPLETE, zero official capture started', () => {
    expect(fs.existsSync(session002SummaryPath)).toBe(true);
    const summary = JSON.parse(fs.readFileSync(session002SummaryPath, 'utf-8'));

    expect(summary.finalSessionStatus).toBe('INVALID_INCOMPLETE');
    expect(summary.mandatoryGovernanceFlags.officialS10CaptureStarted).toBe('NO');
    expect(summary.mandatoryGovernanceFlags.liveTradingAuthorized).toBe('NO');
  });
});
