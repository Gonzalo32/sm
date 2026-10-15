/**
 * SessionClassifier.ts
 *
 * ICT Pure Temporal Session Classifier.
 * Deterministic session and time-window classification based on UTC epoch-millisecond
 * candle timestamps converted to IANA timezone 'America/New_York' (ET).
 *
 * Scope: On-demand visual analysis only. NOT an automated trading system.
 *
 * Requirements:
 * - Pure, deterministic temporal classification
 * - Uses IANA 'America/New_York' timezone (immune to local host clock / timezone)
 * - Start-inclusive and end-exclusive [start, end) interval semantics
 * - Explicit trade-date / session-date mapping based on CME 18:00 ET rollover
 * - Unresolved London Session Range S2 represented explicitly without throwing
 * - Strict timestamp validation (fail-closed, no silent fallback to plausible classes)
 */

export interface LondonSessionRangeS2Status {
  status: 'UNRESOLVED';
  supported: false;
  reason: string;
}

export interface EtTimeBreakdown {
  year: number;
  month: number;       // 1 - 12
  day: number;         // 1 - 31
  hour: number;        // 0 - 23
  minute: number;      // 0 - 59
  second: number;      // 0 - 59
  millisecond: number; // 0 - 999
  timeZoneName: 'EST' | 'EDT' | string;
  isDst: boolean;
  timeOfDayMs: number; // Milliseconds from ET midnight [0, 86400000)
  formattedIso: string; // e.g. "2024-10-15T09:30:00.000-04:00"
}

export interface SessionClassificationResult {
  timestamp: number;
  et: EtTimeBreakdown;
  tradeDate: string; // "YYYY-MM-DD" based on CME 18:00 ET session rollover

  // Approved window predicates
  isInAsianWindow: boolean;
  isInLondonKillzone: boolean;
  isInNyAmKillzone: boolean;
  isInNyPmKillzone: boolean;
  isNyCashOpen: boolean;
  isInNyLunchAvoidance: boolean;
  isInLondonSilverBullet: boolean;
  isInNyAmSilverBullet: boolean;
  isInNyPmSilverBullet: boolean;

  // London Session Range S2 representation
  londonSessionRangeS2: LondonSessionRangeS2Status;
  isInLondonSessionRangeS2: boolean;
}

/**
 * Millisecond boundaries from midnight for approved ET windows:
 * Interval semantics: [startMs, endMs) start-inclusive, end-exclusive.
 */
const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;

const ASIA_START_MS = 20 * MS_PER_HOUR;                 // 20:00:00.000 (72,000,000)
const ASIA_END_MS = 24 * MS_PER_HOUR;                   // 24:00:00.000 (86,400,000)

const LONDON_KZ_START_MS = 2 * MS_PER_HOUR;             // 02:00:00.000 (7,200,000)
const LONDON_KZ_END_MS = 5 * MS_PER_HOUR;               // 05:00:00.000 (18,000,000)

const LONDON_SB_START_MS = 3 * MS_PER_HOUR;             // 03:00:00.000 (10,800,000)
const LONDON_SB_END_MS = 4 * MS_PER_HOUR;               // 04:00:00.000 (14,400,000)

const NY_AM_KZ_START_MS = 8 * MS_PER_HOUR + 30 * MS_PER_MINUTE; // 08:30:00.000 (30,600,000)
const NY_AM_KZ_END_MS = 11 * MS_PER_HOUR;              // 11:00:00.000 (39,600,000)

const NY_CASH_OPEN_START_MS = 9 * MS_PER_HOUR + 30 * MS_PER_MINUTE; // 09:30:00.000 (34,200,000)
const NY_CASH_OPEN_END_MS = 9 * MS_PER_HOUR + 31 * MS_PER_MINUTE;   // 09:31:00.000 (34,260,000)

const NY_AM_SB_START_MS = 10 * MS_PER_HOUR;             // 10:00:00.000 (36,000,000)
const NY_AM_SB_END_MS = 11 * MS_PER_HOUR;               // 11:00:00.000 (39,600,000)

const NY_LUNCH_START_MS = 12 * MS_PER_HOUR;             // 12:00:00.000 (43,200,000)
const NY_LUNCH_END_MS = 13 * MS_PER_HOUR;               // 13:00:00.000 (46,800,000)

const NY_PM_KZ_START_MS = 13 * MS_PER_HOUR + 30 * MS_PER_MINUTE; // 13:30:00.000 (48,600,000)
const NY_PM_KZ_END_MS = 16 * MS_PER_HOUR;              // 16:00:00.000 (57,600,000)

const NY_PM_SB_START_MS = 14 * MS_PER_HOUR;             // 14:00:00.000 (50,400,000)
const NY_PM_SB_END_MS = 15 * MS_PER_HOUR;               // 15:00:00.000 (54,000,000)

const CME_SESSION_ROLLOVER_HOUR = 18;                   // 18:00 ET starts next trade date

const LONDON_S2_UNRESOLVED: LondonSessionRangeS2Status = {
  status: 'UNRESOLVED',
  supported: false,
  reason: 'London Session Range S2 definition remains unresolved in project specifications (no consensus on 02:00-05:00 vs 03:00-08:00 vs 03:00-11:30 boundaries).',
};

// Reusable cached DateTimeFormat instance configured for IANA America/New_York
const NY_DATE_TIME_FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZoneName: 'short',
});

/**
 * Validates that an input is a finite, positive epoch millisecond timestamp.
 */
export function isValidTimestamp(timestamp: unknown): timestamp is number {
  return typeof timestamp === 'number' && Number.isFinite(timestamp) && timestamp > 0;
}

/**
 * Extracts New York timezone breakdown for a UTC epoch timestamp.
 * Throws TypeError if the timestamp is invalid.
 */
export function getEtBreakdown(timestamp: number): EtTimeBreakdown {
  if (!isValidTimestamp(timestamp)) {
    throw new TypeError(`[SessionClassifier] Invalid epoch timestamp: ${timestamp}`);
  }

  const parts = NY_DATE_TIME_FORMAT.formatToParts(new Date(timestamp));
  let yearStr = '';
  let monthStr = '';
  let dayStr = '';
  let hourStr = '';
  let minuteStr = '';
  let secondStr = '';
  let tzStr = '';

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    switch (p.type) {
      case 'year':
        yearStr = p.value;
        break;
      case 'month':
        monthStr = p.value;
        break;
      case 'day':
        dayStr = p.value;
        break;
      case 'hour':
        hourStr = p.value;
        break;
      case 'minute':
        minuteStr = p.value;
        break;
      case 'second':
        secondStr = p.value;
        break;
      case 'timeZoneName':
        tzStr = p.value;
        break;
    }
  }

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const second = parseInt(secondStr, 10);
  const millisecond = ((timestamp % 1000) + 1000) % 1000;

  const isDst = tzStr === 'EDT' || tzStr.includes('Daylight');

  const timeOfDayMs = ((hour * 60 + minute) * 60 + second) * 1000 + millisecond;

  // Compute exact offset between local ET representation and UTC
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
  const offsetMinutes = Math.round((localAsUtc - timestamp) / 60000);
  const offsetSign = offsetMinutes >= 0 ? '+' : '-';
  const absOffsetMinutes = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absOffsetMinutes / 60)).padStart(2, '0');
  const offsetMins = String(absOffsetMinutes % 60).padStart(2, '0');
  const offsetFormatted = `${offsetSign}${offsetHours}:${offsetMins}`;

  const formattedIso = `${yearStr}-${monthStr}-${dayStr}T${hourStr}:${minuteStr}:${secondStr}.${String(millisecond).padStart(3, '0')}${offsetFormatted}`;

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    millisecond,
    timeZoneName: tzStr,
    isDst,
    timeOfDayMs,
    formattedIso,
  };
}

/**
 * Computes CME trading date (session date) for a given ET breakdown.
 * In CME US Index Futures (MNQ/NQ/ES/MES):
 * - The trading session begins at 18:00 ET the preceding evening.
 * - Candlesticks from 18:00:00.000 to 23:59:59.999 ET belong to the NEXT calendar day's trade date.
 * - Candlesticks from 00:00:00.000 to 17:59:59.999 ET belong to the CURRENT calendar day's trade date.
 * Rollovers across month-ends, year-ends, and leap years are strictly handled using Date.UTC calendar math.
 */
export function computeTradeDate(year: number, month: number, day: number, hour: number): string {
  if (hour >= CME_SESSION_ROLLOVER_HOUR) {
    const nextDayUtc = new Date(Date.UTC(year, month - 1, day + 1));
    const nextY = nextDayUtc.getUTCFullYear();
    const nextM = String(nextDayUtc.getUTCMonth() + 1).padStart(2, '0');
    const nextD = String(nextDayUtc.getUTCDate()).padStart(2, '0');
    return `${nextY}-${nextM}-${nextD}`;
  } else {
    const yStr = String(year);
    const mStr = String(month).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    return `${yStr}-${mStr}-${dStr}`;
  }
}

/**
 * Pure SessionClassifier class exposing static and instance predicates and classification methods.
 */
export class SessionClassifier {
  /**
   * Complete classification of a candle timestamp.
   * Throws TypeError if the timestamp is not a finite positive number.
   */
  public static classify(timestamp: number): SessionClassificationResult {
    const et = getEtBreakdown(timestamp);
    const tradeDate = computeTradeDate(et.year, et.month, et.day, et.hour);

    const isInAsianWindow = et.timeOfDayMs >= ASIA_START_MS && et.timeOfDayMs < ASIA_END_MS;
    const isInLondonKillzone = et.timeOfDayMs >= LONDON_KZ_START_MS && et.timeOfDayMs < LONDON_KZ_END_MS;
    const isInLondonSilverBullet = et.timeOfDayMs >= LONDON_SB_START_MS && et.timeOfDayMs < LONDON_SB_END_MS;
    const isInNyAmKillzone = et.timeOfDayMs >= NY_AM_KZ_START_MS && et.timeOfDayMs < NY_AM_KZ_END_MS;
    const isNyCashOpen = et.timeOfDayMs >= NY_CASH_OPEN_START_MS && et.timeOfDayMs < NY_CASH_OPEN_END_MS;
    const isInNyAmSilverBullet = et.timeOfDayMs >= NY_AM_SB_START_MS && et.timeOfDayMs < NY_AM_SB_END_MS;
    const isInNyLunchAvoidance = et.timeOfDayMs >= NY_LUNCH_START_MS && et.timeOfDayMs < NY_LUNCH_END_MS;
    const isInNyPmKillzone = et.timeOfDayMs >= NY_PM_KZ_START_MS && et.timeOfDayMs < NY_PM_KZ_END_MS;
    const isInNyPmSilverBullet = et.timeOfDayMs >= NY_PM_SB_START_MS && et.timeOfDayMs < NY_PM_SB_END_MS;

    return {
      timestamp,
      et,
      tradeDate,
      isInAsianWindow,
      isInLondonKillzone,
      isInNyAmKillzone,
      isInNyPmKillzone,
      isNyCashOpen,
      isInNyLunchAvoidance,
      isInLondonSilverBullet,
      isInNyAmSilverBullet,
      isInNyPmSilverBullet,
      londonSessionRangeS2: LONDON_S2_UNRESOLVED,
      isInLondonSessionRangeS2: false,
    };
  }

  /**
   * Safe predicate helper. Returns false for invalid timestamps without throwing.
   */
  private static safeTimeOfDayMs(timestamp: number): number | null {
    if (!isValidTimestamp(timestamp)) {
      return null;
    }
    try {
      const et = getEtBreakdown(timestamp);
      return et.timeOfDayMs;
    } catch {
      return null;
    }
  }

  /**
   * Asia/Tokyo range: 20:00–00:00 ET [20:00:00.000, 24:00:00.000)
   * Start boundary: 20:00:00.000 ET (inclusive)
   * End boundary: 24:00:00.000 / 00:00:00.000 ET (exclusive)
   */
  public static isInAsianWindow(timestamp: number): boolean {
    const ms = SessionClassifier.safeTimeOfDayMs(timestamp);
    if (ms === null) return false;
    return ms >= ASIA_START_MS && ms < ASIA_END_MS;
  }

  /**
   * London Killzone: 02:00–05:00 ET [02:00:00.000, 05:00:00.000)
   * Start boundary: 02:00:00.000 ET (inclusive)
   * End boundary: 05:00:00.000 ET (exclusive)
   */
  public static isInLondonKillzone(timestamp: number): boolean {
    const ms = SessionClassifier.safeTimeOfDayMs(timestamp);
    if (ms === null) return false;
    return ms >= LONDON_KZ_START_MS && ms < LONDON_KZ_END_MS;
  }

  /**
   * London Silver Bullet: 03:00–04:00 ET [03:00:00.000, 04:00:00.000)
   * Start boundary: 03:00:00.000 ET (inclusive)
   * End boundary: 04:00:00.000 ET (exclusive)
   * Nested inside London Killzone.
   */
  public static isInLondonSilverBullet(timestamp: number): boolean {
    const ms = SessionClassifier.safeTimeOfDayMs(timestamp);
    if (ms === null) return false;
    return ms >= LONDON_SB_START_MS && ms < LONDON_SB_END_MS;
  }

  /**
   * NY AM Killzone: 08:30–11:00 ET [08:30:00.000, 11:00:00.000)
   * Start boundary: 08:30:00.000 ET (inclusive)
   * End boundary: 11:00:00.000 ET (exclusive)
   */
  public static isInNyAmKillzone(timestamp: number): boolean {
    const ms = SessionClassifier.safeTimeOfDayMs(timestamp);
    if (ms === null) return false;
    return ms >= NY_AM_KZ_START_MS && ms < NY_AM_KZ_END_MS;
  }

  /**
   * NY Cash Open: 09:30 ET instant [09:30:00.000, 09:31:00.000)
   * Covers the 09:30 candle open minute.
   */
  public static isNyCashOpen(timestamp: number): boolean {
    const ms = SessionClassifier.safeTimeOfDayMs(timestamp);
    if (ms === null) return false;
    return ms >= NY_CASH_OPEN_START_MS && ms < NY_CASH_OPEN_END_MS;
  }

  /**
   * NY AM Silver Bullet: 10:00–11:00 ET [10:00:00.000, 11:00:00.000)
   * Start boundary: 10:00:00.000 ET (inclusive)
   * End boundary: 11:00:00.000 ET (exclusive)
   * Nested inside NY AM Killzone.
   */
  public static isInNyAmSilverBullet(timestamp: number): boolean {
    const ms = SessionClassifier.safeTimeOfDayMs(timestamp);
    if (ms === null) return false;
    return ms >= NY_AM_SB_START_MS && ms < NY_AM_SB_END_MS;
  }

  /**
   * NY Lunch Avoidance: 12:00–13:00 ET [12:00:00.000, 13:00:00.000)
   * Start boundary: 12:00:00.000 ET (inclusive)
   * End boundary: 13:00:00.000 ET (exclusive)
   */
  public static isInNyLunchAvoidance(timestamp: number): boolean {
    const ms = SessionClassifier.safeTimeOfDayMs(timestamp);
    if (ms === null) return false;
    return ms >= NY_LUNCH_START_MS && ms < NY_LUNCH_END_MS;
  }

  /**
   * NY PM Killzone: 13:30–16:00 ET [13:30:00.000, 16:00:00.000)
   * Start boundary: 13:30:00.000 ET (inclusive)
   * End boundary: 16:00:00.000 ET (exclusive)
   */
  public static isInNyPmKillzone(timestamp: number): boolean {
    const ms = SessionClassifier.safeTimeOfDayMs(timestamp);
    if (ms === null) return false;
    return ms >= NY_PM_KZ_START_MS && ms < NY_PM_KZ_END_MS;
  }

  /**
   * NY PM Silver Bullet: 14:00–15:00 ET [14:00:00.000, 15:00:00.000)
   * Start boundary: 14:00:00.000 ET (inclusive)
   * End boundary: 15:00:00.000 ET (exclusive)
   * Nested inside NY PM Killzone.
   */
  public static isInNyPmSilverBullet(timestamp: number): boolean {
    const ms = SessionClassifier.safeTimeOfDayMs(timestamp);
    if (ms === null) return false;
    return ms >= NY_PM_SB_START_MS && ms < NY_PM_SB_END_MS;
  }

  /**
   * London Session Range S2 remains unresolved in project specifications.
   * Returns false without throwing.
   */
  public static isInLondonSessionRangeS2(_timestamp: number): boolean {
    return false;
  }

  /**
   * Returns explicit metadata regarding the unresolved London Session Range S2 definition.
   */
  public static getLondonSessionRangeS2Status(): LondonSessionRangeS2Status {
    return LONDON_S2_UNRESOLVED;
  }

  /**
   * Returns the CME trade date (session date) for a valid timestamp.
   * Throws TypeError if the timestamp is invalid.
   */
  public static getTradeDate(timestamp: number): string {
    const et = getEtBreakdown(timestamp);
    return computeTradeDate(et.year, et.month, et.day, et.hour);
  }

  // Instance methods for flexibility
  public classify(timestamp: number): SessionClassificationResult {
    return SessionClassifier.classify(timestamp);
  }

  public isInAsianWindow(timestamp: number): boolean {
    return SessionClassifier.isInAsianWindow(timestamp);
  }

  public isInLondonKillzone(timestamp: number): boolean {
    return SessionClassifier.isInLondonKillzone(timestamp);
  }

  public isInLondonSilverBullet(timestamp: number): boolean {
    return SessionClassifier.isInLondonSilverBullet(timestamp);
  }

  public isInNyAmKillzone(timestamp: number): boolean {
    return SessionClassifier.isInNyAmKillzone(timestamp);
  }

  public isNyCashOpen(timestamp: number): boolean {
    return SessionClassifier.isNyCashOpen(timestamp);
  }

  public isInNyAmSilverBullet(timestamp: number): boolean {
    return SessionClassifier.isInNyAmSilverBullet(timestamp);
  }

  public isInNyLunchAvoidance(timestamp: number): boolean {
    return SessionClassifier.isInNyLunchAvoidance(timestamp);
  }

  public isInNyPmKillzone(timestamp: number): boolean {
    return SessionClassifier.isInNyPmKillzone(timestamp);
  }

  public isInNyPmSilverBullet(timestamp: number): boolean {
    return SessionClassifier.isInNyPmSilverBullet(timestamp);
  }

  public isInLondonSessionRangeS2(timestamp: number): boolean {
    return SessionClassifier.isInLondonSessionRangeS2(timestamp);
  }

  public getLondonSessionRangeS2Status(): LondonSessionRangeS2Status {
    return SessionClassifier.getLondonSessionRangeS2Status();
  }

  public getTradeDate(timestamp: number): string {
    return SessionClassifier.getTradeDate(timestamp);
  }
}

// Export default singleton instance as well
export const sessionClassifier = new SessionClassifier();
