/**
 * Checkpoint 105 — Controlled SessionClassifier Integration Tests
 *
 * Scope: On-demand visual chart analysis and decision support only. NOT an automated trading system.
 *
 * Requirements:
 * 1. Classifier is invoked ONLY through explicit user-requested analysis path (runMarketAnalysis).
 * 2. Correct session context across representative ET and DST cases.
 * 3. Session context alone CANNOT confirm a setup or generate buy/sell signals.
 * 4. Non-READY and invalid-data states fail safely.
 * 5. Zero recorder calls or persistence to IndexedDB introduced.
 * 6. Existing coordinator, replay, and setup lifecycle behavior remains intact.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ICTPipelineCoordinator } from '../extension/content/ICTPipelineCoordinator';
import { SessionClassifier } from '../core/ict/time/SessionClassifier';
import { Candle } from '../core/market/Candle';
import { ICTHUD } from '../extension/visual/ICTHUD';

function makeCandle(
  timestamp: number,
  open: number,
  high: number,
  low: number,
  close: number,
  volume: number = 100
): Candle {
  return { timestamp, open, high, low, close, volume };
}

describe('CP105 — Controlled SessionClassifier Integration', () => {
  let coordinator: ICTPipelineCoordinator;
  const interval = 60000; // 1m

  beforeEach(() => {
    coordinator = new ICTPipelineCoordinator('MNQ', '1m', { debug: false });
  });

  // 1. Invocation Scope: Only on explicit user request, never per-tick
  describe('1. Explicit User-Requested Invocation Boundary', () => {
    it('1.1. Ingesting streaming or batch candles does NOT invoke SessionClassifier', () => {
      const baseTime = 1728999000000; // Oct 15, 2024 ~13:30 UTC (09:30 EDT)
      const candles: Candle[] = [];
      for (let i = 0; i < 35; i++) {
        candles.push(makeCandle(baseTime + i * interval, 20100 + i, 20110 + i, 20090 + i, 20105 + i));
      }

      // Spy on SessionClassifier.classify
      const classifySpy = vi.spyOn(SessionClassifier, 'classify');

      // Ingest batch
      coordinator.ingestCandles(candles);

      // Verify SessionClassifier was NEVER called during candle ingestion
      expect(classifySpy).not.toHaveBeenCalled();
      expect(coordinator.getLastSessionContext()).toBeNull();

      // Ingest single realtime candle
      coordinator.ingestCandle(makeCandle(baseTime + 35 * interval, 20135, 20140, 20130, 20138));

      // Still must NOT be called per-tick
      expect(classifySpy).not.toHaveBeenCalled();
      expect(coordinator.getLastSessionContext()).toBeNull();

      classifySpy.mockRestore();
    });

    it('1.2. Explicit runMarketAnalysis() invokes SessionClassifier on the confirmed latest closed candle', async () => {
      const baseTime = 1728999000000; // Oct 15, 2024 ~13:30 UTC (09:30 EDT)
      const candles: Candle[] = [];
      for (let i = 0; i < 35; i++) {
        candles.push(makeCandle(baseTime + i * interval, 20100 + i, 20110 + i, 20090 + i, 20105 + i));
      }
      coordinator.ingestCandles(candles);

      const classifySpy = vi.spyOn(SessionClassifier, 'classify');

      // User explicitly triggers market analysis
      const analysis = await coordinator.runMarketAnalysis();

      expect(classifySpy).toHaveBeenCalledTimes(1);

      // Must be invoked with the timestamp of the latest CLOSED candle (index 33, since store has 35 and final is forming)
      const eligible = coordinator.getAnalysisEligibleCandles();
      const expectedLatestClosedTs = eligible[eligible.length - 1].timestamp;
      expect(classifySpy).toHaveBeenCalledWith(expectedLatestClosedTs);

      // Context must be attached to analysis and accessible on coordinator
      expect(coordinator.getLastSessionContext()).not.toBeNull();
      expect(coordinator.getLastSessionContext()?.timestamp).toBe(expectedLatestClosedTs);
      expect(analysis.sessionContext).toBeDefined();
      expect(analysis.sessionContext?.timestamp).toBe(expectedLatestClosedTs);

      classifySpy.mockRestore();
    });
  });

  // 2. Accuracy across representative ET and DST cases
  describe('2. Representative ET and DST Window Verification', () => {
    it('2.1. Summer / EDT Case: NY Cash Open & AM Killzone (Oct 15, 2024 09:30 EDT = 13:30 UTC)', async () => {
      // 2024-10-15T13:30:00.000Z = 1729000200000 (09:30:00 EDT)
      const nyOpenUtc = Date.UTC(2024, 9, 15, 13, 30, 0, 0);
      const candles: Candle[] = [];
      const start = nyOpenUtc - 33 * interval;
      for (let i = 0; i <= 34; i++) {
        candles.push(makeCandle(start + i * interval, 20100, 20105, 20095, 20100));
      }
      // Index 33 has timestamp nyOpenUtc, index 34 has nyOpenUtc + 1m (so index 33 is the confirmed closed bar)
      coordinator.ingestCandles(candles);

      const analysis = await coordinator.runMarketAnalysis();
      const s = analysis.sessionContext;

      expect(s).toBeDefined();
      expect(s?.et.timeZoneName).toBe('EDT');
      expect(s?.et.isDst).toBe(true);
      expect(s?.et.hour).toBe(9);
      expect(s?.et.minute).toBe(30);
      expect(s?.isNyCashOpen).toBe(true);
      expect(s?.isInNyAmKillzone).toBe(true);
      expect(s?.tradeDate).toBe('2024-10-15');
    });

    it('2.2. Winter / EST Case: NY AM Silver Bullet (Jan 15, 2025 10:15 EST = 15:15 UTC)', async () => {
      // 2025-01-15T15:15:00.000Z = 1736954100000 (10:15:00 EST)
      const nySbUtc = Date.UTC(2025, 0, 15, 15, 15, 0, 0);
      const candles: Candle[] = [];
      const start = nySbUtc - 33 * interval;
      for (let i = 0; i <= 34; i++) {
        candles.push(makeCandle(start + i * interval, 20100, 20105, 20095, 20100));
      }
      coordinator.ingestCandles(candles);

      const analysis = await coordinator.runMarketAnalysis();
      const s = analysis.sessionContext;

      expect(s).toBeDefined();
      expect(s?.et.timeZoneName).toBe('EST');
      expect(s?.et.isDst).toBe(false);
      expect(s?.et.hour).toBe(10);
      expect(s?.et.minute).toBe(15);
      expect(s?.isInNyAmKillzone).toBe(true);
      expect(s?.isInNyAmSilverBullet).toBe(true);
      expect(s?.tradeDate).toBe('2025-01-15');
    });

    it('2.3. CME Rollover Case: Asian Window belongs to NEXT trade date (Oct 15, 2024 20:30 EDT = Oct 16 00:30 UTC)', async () => {
      // 2024-10-16T00:30:00.000Z = Oct 15, 2024 20:30 EDT (Asia open session)
      const asiaUtc = Date.UTC(2024, 9, 16, 0, 30, 0, 0);
      const candles: Candle[] = [];
      const start = asiaUtc - 33 * interval;
      for (let i = 0; i <= 34; i++) {
        candles.push(makeCandle(start + i * interval, 20100, 20105, 20095, 20100));
      }
      coordinator.ingestCandles(candles);

      const analysis = await coordinator.runMarketAnalysis();
      const s = analysis.sessionContext;

      expect(s).toBeDefined();
      expect(s?.et.hour).toBe(20);
      expect(s?.et.minute).toBe(30);
      expect(s?.isInAsianWindow).toBe(true);
      // Because ET hour >= 18, trade date rolls to 2024-10-16
      expect(s?.tradeDate).toBe('2024-10-16');
    });

    it('2.4. London Session Range S2 remains explicitly UNRESOLVED and does not throw', async () => {
      const baseTime = Date.now() - 35 * interval;
      const candles: Candle[] = [];
      for (let i = 0; i < 35; i++) {
        candles.push(makeCandle(baseTime + i * interval, 20100, 20105, 20095, 20100));
      }
      coordinator.ingestCandles(candles);

      const analysis = await coordinator.runMarketAnalysis();
      const s = analysis.sessionContext;

      expect(s).toBeDefined();
      expect(s?.londonSessionRangeS2.status).toBe('UNRESOLVED');
      expect(s?.londonSessionRangeS2.supported).toBe(false);
      expect(s?.isInLondonSessionRangeS2).toBe(false);
      expect(s?.londonSessionRangeS2.reason).toContain('unresolved in project specifications');
    });
  });

  // 3. Safety: Session context alone cannot confirm a setup or generate signals
  describe('3. Decision-Support Boundary (No Autonomous Trading)', () => {
    it('3.1. Session context alone CANNOT confirm a setup when market structure is neutral', async () => {
      // 1. Summer EDT Case: neutral consolidation during peak NY Cash Open (09:30 EDT)
      const nyOpenUtc = Date.UTC(2024, 9, 15, 13, 30, 0, 0);
      const candles: Candle[] = [];
      const start = nyOpenUtc - 33 * interval;
      for (let i = 0; i <= 34; i++) {
        candles.push(makeCandle(start + i * interval, 20100, 20101, 20099, 20100));
      }
      coordinator.ingestCandles(candles);

      const analysisHistorical = await coordinator.runMarketAnalysis();

      // Session context is valid and confirms NY Cash Open
      expect(analysisHistorical.sessionContext?.isNyCashOpen).toBe(true);

      // BUT market analysis status must NOT be CONFIRMED or ANALYSIS_READY
      expect(analysisHistorical.status).not.toBe('ANALYSIS_READY');
      expect(analysisHistorical.preferredDirection).toBe('INDETERMINATE');
      expect(analysisHistorical.selectedScenario).toBeUndefined();

      // 2. Fresh real-time candle series with neutral consolidation (proves NO_CLEAR_OPPORTUNITY)
      const freshCoord = new ICTPipelineCoordinator('MNQ', '1m', { debug: false });
      const now = Date.now();
      const freshStart = now - 34 * interval;
      const freshCandles: Candle[] = [];
      for (let i = 0; i <= 34; i++) {
        freshCandles.push(makeCandle(freshStart + i * interval, 20100, 20101, 20099, 20100));
      }
      freshCoord.ingestCandles(freshCandles);
      const analysisFresh = await freshCoord.runMarketAnalysis();

      expect(analysisFresh.status).toBe('NO_CLEAR_OPPORTUNITY');
      expect(analysisFresh.preferredDirection).toBe('INDETERMINATE');
      expect(analysisFresh.selectedScenario).toBeUndefined();
      expect(analysisFresh.sessionContext).toBeDefined();
    });
  });

  // 4. Robustness: Non-READY and invalid-data states
  describe('4. Fail-Safe Handling of Non-READY & Invalid Data', () => {
    it('4.1. Handles insufficient candle history (< 2 candles) safely without throwing', async () => {
      // 0 candles
      const analysis0 = await coordinator.runMarketAnalysis();
      expect(analysis0.status).toBe('INSUFFICIENT_DATA');
      expect(coordinator.getLastSessionContext()).toBeNull();
      expect(analysis0.sessionContext).toBeUndefined();

      // 1 candle (unconfirmed closure)
      coordinator.ingestCandle(makeCandle(1729000200000, 20100, 20105, 20095, 20100));
      const analysis1 = await coordinator.runMarketAnalysis();
      expect(analysis1.status).toBe('INSUFFICIENT_DATA');
      expect(coordinator.getLastSessionContext()).toBeNull();
      expect(analysis1.sessionContext).toBeUndefined();
    });

    it('4.2. Handles corrupt or invalid candle data fail-closed without unhandled exceptions', async () => {
      // When incoming series has corrupt or insufficient data, coordinator fails closed
      const corruptCoord = new ICTPipelineCoordinator('MNQ', '1m', { debug: false });
      const now = Date.now();
      const freshStart = now - 15 * interval; // Only 15 candles (< 30 minimum required)
      const candles: Candle[] = [];
      for (let i = 0; i < 15; i++) {
        candles.push(makeCandle(freshStart + i * interval, 20100, 20105, 20095, 20100));
      }
      corruptCoord.ingestCandles(candles);

      const analysis = await corruptCoord.runMarketAnalysis();
      expect(analysis).toBeDefined();
      expect(analysis.status).toBe('INSUFFICIENT_DATA');
      expect(analysis.preferredDirection).toBe('INDETERMINATE');
    });

    it('4.3. Handles stale historical market data safely while recording session breakdown', async () => {
      // Ancient historical timestamp from 2023 (> maxStaleDataMs threshold of 5 minutes)
      const staleStart = 1680000000000;
      const candles: Candle[] = [];
      for (let i = 0; i < 35; i++) {
        candles.push(makeCandle(staleStart + i * interval, 20100, 20105, 20095, 20100));
      }
      coordinator.ingestCandles(candles);

      const analysis = await coordinator.runMarketAnalysis();

      expect(analysis.status).toBe('STALE_MARKET_DATA');
      expect(analysis.preferredDirection).toBe('INDETERMINATE');
      // Historical session context is recorded accurately for the historical bar
      expect(analysis.sessionContext).toBeDefined();
      expect(analysis.sessionContext?.timestamp).toBe(staleStart + 33 * interval);
    });
  });

  // 5. Zero-contamination: No recorder or persistence calls
  describe('5. Zero Contamination of S10 Recorder and Persistent Storage', () => {
    it('5.1. Default manual analysis executes transiently without touching MarketAnalystJournal', async () => {
      const baseTime = 1728999000000;
      const candles: Candle[] = [];
      for (let i = 0; i < 35; i++) {
        candles.push(makeCandle(baseTime + i * interval, 20100, 20105, 20095, 20100));
      }
      coordinator.ingestCandles(candles);

      const journalSpy = vi.spyOn(coordinator.getMarketAnalystJournal(), 'recordForecast');

      await coordinator.runMarketAnalysis();

      // Forecast journal MUST NOT be called
      expect(journalSpy).not.toHaveBeenCalled();

      journalSpy.mockRestore();
    });
  });

  // 6. Visual reversibility and HUD integration
  describe('6. Visual Reversibility and Lifecycle State', () => {
    it('6.1. HUD clear analyst overlay resets session context cleanly', async () => {
      const mockHud = new ICTHUD();
      const coordWithHud = new ICTPipelineCoordinator('MNQ', '1m', { debug: false, hud: mockHud });

      const baseTime = 1728999000000;
      const candles: Candle[] = [];
      for (let i = 0; i < 35; i++) {
        candles.push(makeCandle(baseTime + i * interval, 20100, 20105, 20095, 20100));
      }
      coordWithHud.ingestCandles(candles);

      await coordWithHud.runMarketAnalysis();
      expect(coordWithHud.getLastSessionContext()).not.toBeNull();

      // Trigger clear on HUD callback
      mockHud.onClearAnalystOverlay?.();

      expect(coordWithHud.getLastSessionContext()).toBeNull();
      expect(coordWithHud.getLastAnalysis()).toBeNull();
    });
  });
});
