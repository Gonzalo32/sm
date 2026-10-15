import { describe, it, expect } from 'vitest';
import {
  SessionClassifier,
  sessionClassifier,
  isValidTimestamp,
  computeTradeDate,
  getEtBreakdown,
} from '../core/ict/time/SessionClassifier';

/**
 * Checkpoint 103 — Stage 3: Pure Session Classifier Test Suite
 *
 * Verifies pure, deterministic temporal classification in America/New_York (ET).
 * Tests cover:
 * 1. Every approved window's start boundary (start-inclusive)
 * 2. Every approved window's exclusive end boundary (end-exclusive)
 * 3. Asia window crossing midnight & CME trade date rollover
 * 4. Overlapping predicates (Silver Bullets inside Killzones)
 * 5. Cash-open instant classification (09:30 ET minute)
 * 6. NY lunch avoidance boundaries (12:00-13:00 ET)
 * 7. Both EST and EDT dates for representative windows
 * 8. DST transition dates (Spring forward and Fall back)
 * 9. Invalid timestamps (fail-closed, no silent fallback) and unresolved S2 behavior
 * 10. Independence from host machine's local timezone
 */

describe('CP103 — Stage 3: Pure Session Classifier', () => {
  // Helper to construct exact UTC epoch timestamp from known ET components
  function makeEtTimestamp(
    year: number,
    month: number, // 1 - 12
    day: number,   // 1 - 31
    hour: number,  // 0 - 23
    minute: number,
    second: number = 0,
    millisecond: number = 0,
    isDst: boolean = true // EDT = UTC-4, EST = UTC-5
  ): number {
    const offsetHours = isDst ? 4 : 5;
    return Date.UTC(year, month - 1, day, hour + offsetHours, minute, second, millisecond);
  }

  // 1. Every approved window's start boundary (start-inclusive)
  describe('1. Approved windows start boundaries (start-inclusive)', () => {
    // Representative EDT date: 2024-06-12
    const y = 2024;
    const m = 6;
    const d = 12;

    it('1.1. Asia window starts exactly at 20:00:00.000 ET (inclusive)', () => {
      // Asia window for 2024-06-12 trade date begins on 2024-06-11 20:00:00 ET
      const exactStart = makeEtTimestamp(2024, 6, 11, 20, 0, 0, 0, true);
      const justBefore = exactStart - 1;

      expect(SessionClassifier.isInAsianWindow(justBefore)).toBe(false);
      expect(SessionClassifier.isInAsianWindow(exactStart)).toBe(true);
      expect(SessionClassifier.isInAsianWindow(exactStart + 1)).toBe(true);
    });

    it('1.2. London Killzone starts exactly at 02:00:00.000 ET (inclusive)', () => {
      const exactStart = makeEtTimestamp(y, m, d, 2, 0, 0, 0, true);
      const justBefore = exactStart - 1;

      expect(SessionClassifier.isInLondonKillzone(justBefore)).toBe(false);
      expect(SessionClassifier.isInLondonKillzone(exactStart)).toBe(true);
      expect(SessionClassifier.isInLondonKillzone(exactStart + 1)).toBe(true);
    });

    it('1.3. London Silver Bullet starts exactly at 03:00:00.000 ET (inclusive)', () => {
      const exactStart = makeEtTimestamp(y, m, d, 3, 0, 0, 0, true);
      const justBefore = exactStart - 1;

      expect(SessionClassifier.isInLondonSilverBullet(justBefore)).toBe(false);
      expect(SessionClassifier.isInLondonSilverBullet(exactStart)).toBe(true);
      expect(SessionClassifier.isInLondonSilverBullet(exactStart + 1)).toBe(true);
    });

    it('1.4. NY AM Killzone starts exactly at 08:30:00.000 ET (inclusive)', () => {
      const exactStart = makeEtTimestamp(y, m, d, 8, 30, 0, 0, true);
      const justBefore = exactStart - 1;

      expect(SessionClassifier.isInNyAmKillzone(justBefore)).toBe(false);
      expect(SessionClassifier.isInNyAmKillzone(exactStart)).toBe(true);
      expect(SessionClassifier.isInNyAmKillzone(exactStart + 1)).toBe(true);
    });

    it('1.5. NY Cash Open starts exactly at 09:30:00.000 ET (inclusive)', () => {
      const exactStart = makeEtTimestamp(y, m, d, 9, 30, 0, 0, true);
      const justBefore = exactStart - 1;

      expect(SessionClassifier.isNyCashOpen(justBefore)).toBe(false);
      expect(SessionClassifier.isNyCashOpen(exactStart)).toBe(true);
      expect(SessionClassifier.isNyCashOpen(exactStart + 1)).toBe(true);
    });

    it('1.6. NY AM Silver Bullet starts exactly at 10:00:00.000 ET (inclusive)', () => {
      const exactStart = makeEtTimestamp(y, m, d, 10, 0, 0, 0, true);
      const justBefore = exactStart - 1;

      expect(SessionClassifier.isInNyAmSilverBullet(justBefore)).toBe(false);
      expect(SessionClassifier.isInNyAmSilverBullet(exactStart)).toBe(true);
      expect(SessionClassifier.isInNyAmSilverBullet(exactStart + 1)).toBe(true);
    });

    it('1.7. NY Lunch Avoidance starts exactly at 12:00:00.000 ET (inclusive)', () => {
      const exactStart = makeEtTimestamp(y, m, d, 12, 0, 0, 0, true);
      const justBefore = exactStart - 1;

      expect(SessionClassifier.isInNyLunchAvoidance(justBefore)).toBe(false);
      expect(SessionClassifier.isInNyLunchAvoidance(exactStart)).toBe(true);
      expect(SessionClassifier.isInNyLunchAvoidance(exactStart + 1)).toBe(true);
    });

    it('1.8. NY PM Killzone starts exactly at 13:30:00.000 ET (inclusive)', () => {
      const exactStart = makeEtTimestamp(y, m, d, 13, 30, 0, 0, true);
      const justBefore = exactStart - 1;

      expect(SessionClassifier.isInNyPmKillzone(justBefore)).toBe(false);
      expect(SessionClassifier.isInNyPmKillzone(exactStart)).toBe(true);
      expect(SessionClassifier.isInNyPmKillzone(exactStart + 1)).toBe(true);
    });

    it('1.9. NY PM Silver Bullet starts exactly at 14:00:00.000 ET (inclusive)', () => {
      const exactStart = makeEtTimestamp(y, m, d, 14, 0, 0, 0, true);
      const justBefore = exactStart - 1;

      expect(SessionClassifier.isInNyPmSilverBullet(justBefore)).toBe(false);
      expect(SessionClassifier.isInNyPmSilverBullet(exactStart)).toBe(true);
      expect(SessionClassifier.isInNyPmSilverBullet(exactStart + 1)).toBe(true);
    });
  });

  // 2. Every approved window's exclusive end boundary (end-exclusive)
  describe('2. Approved windows exclusive end boundaries (end-exclusive)', () => {
    const y = 2024;
    const m = 6;
    const d = 12;

    it('2.1. Asia window ends exactly at 24:00:00.000 ET / 00:00:00.000 ET (exclusive)', () => {
      // 23:59:59.999 ET is inside; 00:00:00.000 ET is outside
      const lastInside = makeEtTimestamp(2024, 6, 11, 23, 59, 59, 999, true);
      const exactEnd = makeEtTimestamp(2024, 6, 12, 0, 0, 0, 0, true);

      expect(SessionClassifier.isInAsianWindow(lastInside)).toBe(true);
      expect(SessionClassifier.isInAsianWindow(exactEnd)).toBe(false);
      expect(SessionClassifier.isInAsianWindow(exactEnd + 1)).toBe(false);
    });

    it('2.2. London Killzone ends exactly at 05:00:00.000 ET (exclusive)', () => {
      const lastInside = makeEtTimestamp(y, m, d, 4, 59, 59, 999, true);
      const exactEnd = makeEtTimestamp(y, m, d, 5, 0, 0, 0, true);

      expect(SessionClassifier.isInLondonKillzone(lastInside)).toBe(true);
      expect(SessionClassifier.isInLondonKillzone(exactEnd)).toBe(false);
      expect(SessionClassifier.isInLondonKillzone(exactEnd + 1)).toBe(false);
    });

    it('2.3. London Silver Bullet ends exactly at 04:00:00.000 ET (exclusive)', () => {
      const lastInside = makeEtTimestamp(y, m, d, 3, 59, 59, 999, true);
      const exactEnd = makeEtTimestamp(y, m, d, 4, 0, 0, 0, true);

      expect(SessionClassifier.isInLondonSilverBullet(lastInside)).toBe(true);
      expect(SessionClassifier.isInLondonSilverBullet(exactEnd)).toBe(false);
      expect(SessionClassifier.isInLondonSilverBullet(exactEnd + 1)).toBe(false);
    });

    it('2.4. NY AM Killzone ends exactly at 11:00:00.000 ET (exclusive)', () => {
      const lastInside = makeEtTimestamp(y, m, d, 10, 59, 59, 999, true);
      const exactEnd = makeEtTimestamp(y, m, d, 11, 0, 0, 0, true);

      expect(SessionClassifier.isInNyAmKillzone(lastInside)).toBe(true);
      expect(SessionClassifier.isInNyAmKillzone(exactEnd)).toBe(false);
      expect(SessionClassifier.isInNyAmKillzone(exactEnd + 1)).toBe(false);
    });

    it('2.5. NY Cash Open ends exactly at 09:31:00.000 ET (exclusive)', () => {
      const lastInside = makeEtTimestamp(y, m, d, 9, 30, 59, 999, true);
      const exactEnd = makeEtTimestamp(y, m, d, 9, 31, 0, 0, true);

      expect(SessionClassifier.isNyCashOpen(lastInside)).toBe(true);
      expect(SessionClassifier.isNyCashOpen(exactEnd)).toBe(false);
      expect(SessionClassifier.isNyCashOpen(exactEnd + 1)).toBe(false);
    });

    it('2.6. NY AM Silver Bullet ends exactly at 11:00:00.000 ET (exclusive)', () => {
      const lastInside = makeEtTimestamp(y, m, d, 10, 59, 59, 999, true);
      const exactEnd = makeEtTimestamp(y, m, d, 11, 0, 0, 0, true);

      expect(SessionClassifier.isInNyAmSilverBullet(lastInside)).toBe(true);
      expect(SessionClassifier.isInNyAmSilverBullet(exactEnd)).toBe(false);
      expect(SessionClassifier.isInNyAmSilverBullet(exactEnd + 1)).toBe(false);
    });

    it('2.7. NY Lunch Avoidance ends exactly at 13:00:00.000 ET (exclusive)', () => {
      const lastInside = makeEtTimestamp(y, m, d, 12, 59, 59, 999, true);
      const exactEnd = makeEtTimestamp(y, m, d, 13, 0, 0, 0, true);

      expect(SessionClassifier.isInNyLunchAvoidance(lastInside)).toBe(true);
      expect(SessionClassifier.isInNyLunchAvoidance(exactEnd)).toBe(false);
      expect(SessionClassifier.isInNyLunchAvoidance(exactEnd + 1)).toBe(false);
    });

    it('2.8. NY PM Killzone ends exactly at 16:00:00.000 ET (exclusive)', () => {
      const lastInside = makeEtTimestamp(y, m, d, 15, 59, 59, 999, true);
      const exactEnd = makeEtTimestamp(y, m, d, 16, 0, 0, 0, true);

      expect(SessionClassifier.isInNyPmKillzone(lastInside)).toBe(true);
      expect(SessionClassifier.isInNyPmKillzone(exactEnd)).toBe(false);
      expect(SessionClassifier.isInNyPmKillzone(exactEnd + 1)).toBe(false);
    });

    it('2.9. NY PM Silver Bullet ends exactly at 15:00:00.000 ET (exclusive)', () => {
      const lastInside = makeEtTimestamp(y, m, d, 14, 59, 59, 999, true);
      const exactEnd = makeEtTimestamp(y, m, d, 15, 0, 0, 0, true);

      expect(SessionClassifier.isInNyPmSilverBullet(lastInside)).toBe(true);
      expect(SessionClassifier.isInNyPmSilverBullet(exactEnd)).toBe(false);
      expect(SessionClassifier.isInNyPmSilverBullet(exactEnd + 1)).toBe(false);
    });
  });

  // 3. Asia window crossing midnight & CME trade date rollover
  describe('3. Asia window crossing midnight and CME trade-date rollover', () => {
    it('3.1. Asia window (20:00-00:00 ET) transitions correctly across midnight', () => {
      const t1959 = makeEtTimestamp(2024, 6, 11, 19, 59, 59, 999, true);
      const t2000 = makeEtTimestamp(2024, 6, 11, 20, 0, 0, 0, true);
      const t2200 = makeEtTimestamp(2024, 6, 11, 22, 0, 0, 0, true);
      const t2359 = makeEtTimestamp(2024, 6, 11, 23, 59, 59, 999, true);
      const t0000 = makeEtTimestamp(2024, 6, 12, 0, 0, 0, 0, true);
      const t0001 = makeEtTimestamp(2024, 6, 12, 0, 1, 0, 0, true);

      expect(SessionClassifier.isInAsianWindow(t1959)).toBe(false);
      expect(SessionClassifier.isInAsianWindow(t2000)).toBe(true);
      expect(SessionClassifier.isInAsianWindow(t2200)).toBe(true);
      expect(SessionClassifier.isInAsianWindow(t2359)).toBe(true);
      expect(SessionClassifier.isInAsianWindow(t0000)).toBe(false);
      expect(SessionClassifier.isInAsianWindow(t0001)).toBe(false);
    });

    it('3.2. CME trade date assigns Asia window on June 11 evening to June 12 trade date', () => {
      const t2000 = makeEtTimestamp(2024, 6, 11, 20, 0, 0, 0, true);
      const t2359 = makeEtTimestamp(2024, 6, 11, 23, 59, 59, 999, true);
      const t0000 = makeEtTimestamp(2024, 6, 12, 0, 0, 0, 0, true);
      const t0930 = makeEtTimestamp(2024, 6, 12, 9, 30, 0, 0, true);

      expect(SessionClassifier.getTradeDate(t2000)).toBe('2024-06-12');
      expect(SessionClassifier.getTradeDate(t2359)).toBe('2024-06-12');
      expect(SessionClassifier.getTradeDate(t0000)).toBe('2024-06-12');
      expect(SessionClassifier.getTradeDate(t0930)).toBe('2024-06-12');
    });

    it('3.3. CME trade date handles month-end, year-end, and leap-year rollovers', () => {
      // Month-end rollover: Oct 31 20:00 ET -> trade date Nov 1
      const oct31 = makeEtTimestamp(2024, 10, 31, 20, 0, 0, 0, true);
      expect(SessionClassifier.getTradeDate(oct31)).toBe('2024-11-01');

      // Year-end rollover: Dec 31 20:00 ET -> trade date Jan 1
      const dec31 = makeEtTimestamp(2024, 12, 31, 20, 0, 0, 0, false);
      expect(SessionClassifier.getTradeDate(dec31)).toBe('2025-01-01');

      // Leap year rollover: Feb 28 2024 20:00 ET -> trade date Feb 29 2024
      const feb28Leap = makeEtTimestamp(2024, 2, 28, 20, 0, 0, 0, false);
      expect(SessionClassifier.getTradeDate(feb28Leap)).toBe('2024-02-29');

      // Direct helper unit check
      expect(computeTradeDate(2024, 10, 31, 20)).toBe('2024-11-01');
      expect(computeTradeDate(2024, 10, 31, 9)).toBe('2024-10-31');
    });
  });

  // 4. Overlapping predicates
  describe('4. Overlapping session and Silver Bullet predicates', () => {
    const y = 2024;
    const m = 6;
    const d = 12;

    it('4.1. London Silver Bullet (03:00-04:00) is strictly contained in London Killzone (02:00-05:00)', () => {
      const t0230 = makeEtTimestamp(y, m, d, 2, 30, 0, 0, true);
      const t0330 = makeEtTimestamp(y, m, d, 3, 30, 0, 0, true);
      const t0430 = makeEtTimestamp(y, m, d, 4, 30, 0, 0, true);

      // 02:30: In KZ, NOT in SB
      expect(SessionClassifier.isInLondonKillzone(t0230)).toBe(true);
      expect(SessionClassifier.isInLondonSilverBullet(t0230)).toBe(false);

      // 03:30: In KZ AND in SB
      expect(SessionClassifier.isInLondonKillzone(t0330)).toBe(true);
      expect(SessionClassifier.isInLondonSilverBullet(t0330)).toBe(true);

      // 04:30: In KZ, NOT in SB
      expect(SessionClassifier.isInLondonKillzone(t0430)).toBe(true);
      expect(SessionClassifier.isInLondonSilverBullet(t0430)).toBe(false);
    });

    it('4.2. NY AM Silver Bullet (10:00-11:00) is strictly contained in NY AM Killzone (08:30-11:00)', () => {
      const t0900 = makeEtTimestamp(y, m, d, 9, 0, 0, 0, true);
      const t1015 = makeEtTimestamp(y, m, d, 10, 15, 0, 0, true);
      const t1100 = makeEtTimestamp(y, m, d, 11, 0, 0, 0, true);

      // 09:00: In NY AM KZ, NOT in NY AM SB
      expect(SessionClassifier.isInNyAmKillzone(t0900)).toBe(true);
      expect(SessionClassifier.isInNyAmSilverBullet(t0900)).toBe(false);

      // 10:15: In NY AM KZ AND in NY AM SB
      expect(SessionClassifier.isInNyAmKillzone(t1015)).toBe(true);
      expect(SessionClassifier.isInNyAmSilverBullet(t1015)).toBe(true);

      // 11:00: End of both (exclusive)
      expect(SessionClassifier.isInNyAmKillzone(t1100)).toBe(false);
      expect(SessionClassifier.isInNyAmSilverBullet(t1100)).toBe(false);
    });

    it('4.3. NY PM Silver Bullet (14:00-15:00) is strictly contained in NY PM Killzone (13:30-16:00)', () => {
      const t1345 = makeEtTimestamp(y, m, d, 13, 45, 0, 0, true);
      const t1430 = makeEtTimestamp(y, m, d, 14, 30, 0, 0, true);
      const t1530 = makeEtTimestamp(y, m, d, 15, 30, 0, 0, true);

      // 13:45: In PM KZ, NOT in PM SB
      expect(SessionClassifier.isInNyPmKillzone(t1345)).toBe(true);
      expect(SessionClassifier.isInNyPmSilverBullet(t1345)).toBe(false);

      // 14:30: In PM KZ AND in PM SB
      expect(SessionClassifier.isInNyPmKillzone(t1430)).toBe(true);
      expect(SessionClassifier.isInNyPmSilverBullet(t1430)).toBe(true);

      // 15:30: In PM KZ, NOT in PM SB
      expect(SessionClassifier.isInNyPmKillzone(t1530)).toBe(true);
      expect(SessionClassifier.isInNyPmSilverBullet(t1530)).toBe(false);
    });
  });

  // 5. Cash-open instant classification
  describe('5. Cash-open instant classification', () => {
    const y = 2024;
    const m = 6;
    const d = 12;

    it('5.1. Classifies 09:30 ET candle instant accurately across seconds and milliseconds', () => {
      const t0929_59 = makeEtTimestamp(y, m, d, 9, 29, 59, 999, true);
      const t0930_00 = makeEtTimestamp(y, m, d, 9, 30, 0, 0, true);
      const t0930_30 = makeEtTimestamp(y, m, d, 9, 30, 30, 0, true);
      const t0930_59 = makeEtTimestamp(y, m, d, 9, 30, 59, 999, true);
      const t0931_00 = makeEtTimestamp(y, m, d, 9, 31, 0, 0, true);

      expect(SessionClassifier.isNyCashOpen(t0929_59)).toBe(false);
      expect(SessionClassifier.isNyCashOpen(t0930_00)).toBe(true);
      expect(SessionClassifier.isNyCashOpen(t0930_30)).toBe(true);
      expect(SessionClassifier.isNyCashOpen(t0930_59)).toBe(true);
      expect(SessionClassifier.isNyCashOpen(t0931_00)).toBe(false);
    });

    it('5.2. At 09:30 cash open, NY AM Killzone is active, but Silver Bullet and Lunch are inactive', () => {
      const t0930 = makeEtTimestamp(y, m, d, 9, 30, 0, 0, true);
      const res = SessionClassifier.classify(t0930);

      expect(res.isNyCashOpen).toBe(true);
      expect(res.isInNyAmKillzone).toBe(true);
      expect(res.isInNyAmSilverBullet).toBe(false);
      expect(res.isInNyLunchAvoidance).toBe(false);
      expect(res.isInNyPmKillzone).toBe(false);
    });
  });

  // 6. NY lunch avoidance boundaries
  describe('6. NY lunch avoidance boundaries (12:00-13:00 ET)', () => {
    const y = 2024;
    const m = 6;
    const d = 12;

    it('6.1. NY lunch avoidance operates strictly within [12:00, 13:00) ET', () => {
      const t1159 = makeEtTimestamp(y, m, d, 11, 59, 59, 999, true);
      const t1200 = makeEtTimestamp(y, m, d, 12, 0, 0, 0, true);
      const t1230 = makeEtTimestamp(y, m, d, 12, 30, 0, 0, true);
      const t1259 = makeEtTimestamp(y, m, d, 12, 59, 59, 999, true);
      const t1300 = makeEtTimestamp(y, m, d, 13, 0, 0, 0, true);

      expect(SessionClassifier.isInNyLunchAvoidance(t1159)).toBe(false);
      expect(SessionClassifier.isInNyLunchAvoidance(t1200)).toBe(true);
      expect(SessionClassifier.isInNyLunchAvoidance(t1230)).toBe(true);
      expect(SessionClassifier.isInNyLunchAvoidance(t1259)).toBe(true);
      expect(SessionClassifier.isInNyLunchAvoidance(t1300)).toBe(false);
    });

    it('6.2. Neither AM nor PM Killzone is active during Lunch Avoidance', () => {
      const t1230 = makeEtTimestamp(y, m, d, 12, 30, 0, 0, true);
      const res = SessionClassifier.classify(t1230);

      expect(res.isInNyLunchAvoidance).toBe(true);
      expect(res.isInNyAmKillzone).toBe(false);
      expect(res.isInNyPmKillzone).toBe(false);
      expect(res.isNyCashOpen).toBe(false);
    });
  });

  // 7. Both EST and EDT dates for representative windows
  describe('7. Verification on both EDT (summer) and EST (winter) dates', () => {
    it('7.1. Evaluates all sessions on EDT date (2024-06-12, UTC-4)', () => {
      // 09:30 EDT = 13:30 UTC
      const tsEdtCashOpen = makeEtTimestamp(2024, 6, 12, 9, 30, 0, 0, true);
      const resEdt = SessionClassifier.classify(tsEdtCashOpen);

      expect(resEdt.et.year).toBe(2024);
      expect(resEdt.et.month).toBe(6);
      expect(resEdt.et.day).toBe(12);
      expect(resEdt.et.hour).toBe(9);
      expect(resEdt.et.minute).toBe(30);
      expect(resEdt.et.isDst).toBe(true);
      expect(resEdt.et.timeZoneName).toBe('EDT');
      expect(resEdt.isNyCashOpen).toBe(true);
      expect(resEdt.isInNyAmKillzone).toBe(true);
      expect(resEdt.tradeDate).toBe('2024-06-12');

      const breakdown = getEtBreakdown(tsEdtCashOpen);
      expect(breakdown.hour).toBe(9);
      expect(breakdown.minute).toBe(30);
    });

    it('7.2. Evaluates all sessions on EST date (2024-01-17, UTC-5)', () => {
      // 09:30 EST = 14:30 UTC
      const tsEstCashOpen = makeEtTimestamp(2024, 1, 17, 9, 30, 0, 0, false);
      const resEst = SessionClassifier.classify(tsEstCashOpen);

      expect(resEst.et.year).toBe(2024);
      expect(resEst.et.month).toBe(1);
      expect(resEst.et.day).toBe(17);
      expect(resEst.et.hour).toBe(9);
      expect(resEst.et.minute).toBe(30);
      expect(resEst.et.isDst).toBe(false);
      expect(resEst.et.timeZoneName).toBe('EST');
      expect(resEst.isNyCashOpen).toBe(true);
      expect(resEst.isInNyAmKillzone).toBe(true);
      expect(resEst.tradeDate).toBe('2024-01-17');
    });
  });

  // 8. DST transition dates
  describe('8. DST transition dates (Spring Forward and Fall Back)', () => {
    it('8.1. Spring Forward (March 10, 2024): correctly recognizes EDT on Monday March 11', () => {
      // Monday March 11, 2024 is the first session following Spring Forward
      // 09:30 EDT = 13:30 UTC
      const monMar11CashOpen = Date.UTC(2024, 2, 11, 13, 30, 0, 0);
      const res = SessionClassifier.classify(monMar11CashOpen);

      expect(res.et.hour).toBe(9);
      expect(res.et.minute).toBe(30);
      expect(res.et.timeZoneName).toBe('EDT');
      expect(res.et.isDst).toBe(true);
      expect(res.isNyCashOpen).toBe(true);
      expect(res.tradeDate).toBe('2024-03-11');
    });

    it('8.2. Fall Back (November 3, 2024): correctly recognizes EST on Monday November 4', () => {
      // Monday November 4, 2024 is the first session following Fall Back
      // 09:30 EST = 14:30 UTC
      const monNov4CashOpen = Date.UTC(2024, 10, 4, 14, 30, 0, 0);
      const res = SessionClassifier.classify(monNov4CashOpen);

      expect(res.et.hour).toBe(9);
      expect(res.et.minute).toBe(30);
      expect(res.et.timeZoneName).toBe('EST');
      expect(res.et.isDst).toBe(false);
      expect(res.isNyCashOpen).toBe(true);
      expect(res.tradeDate).toBe('2024-11-04');
    });

    it('8.3. Handles London Killzone on DST transition trading days', () => {
      // Monday March 11: 02:00 EDT = 06:00 UTC
      const springLondon = Date.UTC(2024, 2, 11, 6, 0, 0, 0);
      expect(SessionClassifier.isInLondonKillzone(springLondon)).toBe(true);

      // Monday November 4: 02:00 EST = 07:00 UTC
      const fallLondon = Date.UTC(2024, 10, 4, 7, 0, 0, 0);
      expect(SessionClassifier.isInLondonKillzone(fallLondon)).toBe(true);
    });
  });

  // 9. Invalid timestamps and unsupported/unresolved S2 behavior
  describe('9. Invalid timestamps (fail-closed) and unresolved London S2 behavior', () => {
    it('9.1. London Session Range S2 returns unresolved status without throwing', () => {
      const validTs = makeEtTimestamp(2024, 6, 12, 3, 0, 0, 0, true);

      expect(SessionClassifier.isInLondonSessionRangeS2(validTs)).toBe(false);
      expect(isValidTimestamp(validTs)).toBe(true);

      const status = SessionClassifier.getLondonSessionRangeS2Status();
      expect(status.status).toBe('UNRESOLVED');
      expect(status.supported).toBe(false);
      expect(typeof status.reason).toBe('string');
      expect(status.reason.length).toBeGreaterThan(10);
    });

    it('9.2. Predicates fail-closed (return false) for invalid timestamps', () => {
      const invalidTimestamps = [
        NaN,
        -1,
        -1000000,
        0,
        Infinity,
        -Infinity,
        null as unknown as number,
        undefined as unknown as number,
        '2024-06-12' as unknown as number,
        {} as unknown as number,
      ];

      for (const inv of invalidTimestamps) {
        expect(SessionClassifier.isInAsianWindow(inv)).toBe(false);
        expect(SessionClassifier.isInLondonKillzone(inv)).toBe(false);
        expect(SessionClassifier.isInLondonSilverBullet(inv)).toBe(false);
        expect(SessionClassifier.isInNyAmKillzone(inv)).toBe(false);
        expect(SessionClassifier.isNyCashOpen(inv)).toBe(false);
        expect(SessionClassifier.isInNyAmSilverBullet(inv)).toBe(false);
        expect(SessionClassifier.isInNyLunchAvoidance(inv)).toBe(false);
        expect(SessionClassifier.isInNyPmKillzone(inv)).toBe(false);
        expect(SessionClassifier.isInNyPmSilverBullet(inv)).toBe(false);
        expect(SessionClassifier.isInLondonSessionRangeS2(inv)).toBe(false);
      }
    });

    it('9.3. classify() and getTradeDate() throw TypeError on invalid timestamps', () => {
      expect(() => SessionClassifier.classify(NaN)).toThrow(TypeError);
      expect(() => SessionClassifier.classify(-100)).toThrow(TypeError);
      expect(() => SessionClassifier.classify(0)).toThrow(TypeError);
      expect(() => SessionClassifier.classify(Infinity)).toThrow(TypeError);
      expect(() => SessionClassifier.getTradeDate(NaN)).toThrow(TypeError);
      expect(() => SessionClassifier.getTradeDate(-500)).toThrow(TypeError);
    });
  });

  // 10. Independence from host machine's local timezone
  describe('10. Independence from host machine timezone', () => {
    it('10.1. Uses America/New_York regardless of local host timezone', () => {
      // 09:30 EDT is always 13:30:00.000 UTC
      const utcTs = Date.UTC(2024, 5, 12, 13, 30, 0, 0); // 2024-06-12 13:30 UTC
      const res = SessionClassifier.classify(utcTs);

      // In America/New_York, this must be 09:30 EDT
      expect(res.et.hour).toBe(9);
      expect(res.et.minute).toBe(30);
      expect(res.et.second).toBe(0);
      expect(res.et.timeZoneName).toBe('EDT');
      expect(res.isNyCashOpen).toBe(true);

      // Verify that local host methods (new Date().getHours()) are bypassed
      const localHostHour = new Date(utcTs).getHours();
      expect(typeof localHostHour).toBe('number');
      // If host is not EDT (e.g. UTC-3 in Argentina or UTC), localHostHour != 9
      // The classifier returns 9 regardless
      expect(res.et.hour).toBe(9);
    });

    it('10.2. Validates instance methods match static methods', () => {
      const utcTs = Date.UTC(2024, 5, 12, 13, 30, 0, 0);

      expect(sessionClassifier.isNyCashOpen(utcTs)).toBe(SessionClassifier.isNyCashOpen(utcTs));
      expect(sessionClassifier.isInNyAmKillzone(utcTs)).toBe(SessionClassifier.isInNyAmKillzone(utcTs));
      expect(sessionClassifier.getTradeDate(utcTs)).toBe(SessionClassifier.getTradeDate(utcTs));
      expect(sessionClassifier.getLondonSessionRangeS2Status()).toEqual(
        SessionClassifier.getLondonSessionRangeS2Status()
      );
    });
  });
});
