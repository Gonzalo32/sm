/**
 * ReadOnlyPreflightGuard.ts
 *
 * Narrowly scoped, deterministic safety guard for TradeSea prospective capture preflight.
 * Enforces zero-order-exposure and prevents accidental or automated interactions
 * with order pads, DOM trading controls, Buy/Sell buttons, and position execution paths.
 *
 * MANDATORY SAFETY BOUNDARIES:
 * - LIVE_TRADING_AUTHORIZED is strictly FALSE.
 * - All order-entry, DOM, Buy, Sell, Close, and Flatten controls are neutralized in passive mode.
 * - Preflight inspections are strictly READ-ONLY (no click, focus, or synthetic events).
 * - Zero modifications to production ICT logic in core/ict/.
 */

export interface PreflightInspectionState {
  symbol: string;
  timeframe: string;
  isStreaming: boolean;
  hasOpenPositions: boolean;
  hasPendingOrders: boolean;
  readOnlyGuardActive: boolean;
  liveTradingAuthorized: boolean;
  orderPadNeutralized: boolean;
}

export class TradingDisabledViolationError extends Error {
  constructor(action: string) {
    super(`[ReadOnlyPreflightGuard] VIOLATION: Attempted trading action '${action}' while LIVE_TRADING_AUTHORIZED is NO.`);
    this.name = 'TradingDisabledViolationError';
  }
}

export class ActivePositionDetectedError extends Error {
  constructor(message: string) {
    super(`[ReadOnlyPreflightGuard] STOP: Active position or pending order detected: ${message}. Requires manual operator remediation.`);
    this.name = 'ActivePositionDetectedError';
  }
}

export class ReadOnlyPreflightGuard {
  public static readonly BLOCKED_SELECTORS = [
    'button[class*="buy"]',
    'button[class*="sell"]',
    'button[class*="close"]',
    'button[class*="flatten"]',
    '[data-testid*="order"]',
    '[data-testid*="buy"]',
    '[data-testid*="sell"]',
    '[data-testid*="close"]',
    '[data-testid*="flatten"]',
    '.dom-order-pad',
    '.trading-panel',
    'button.buy-button',
    'button.sell-button',
  ];

  public static readonly BLOCKED_TEXT_PATTERNS = [
    /\b(buy|sell|market\s*order|limit\s*order|flatten\s*all|close\s*position)\b/i,
  ];

  private isGuardArmed: boolean = false;
  private readonly liveTradingAuthorized: boolean = false;

  constructor() {
    this.liveTradingAuthorized = false;
  }

  /**
   * Asserts that live trading is unauthorized.
   * Throws immediately if any operation attempts to claim live trading authorization.
   */
  public assertLiveTradingUnauthorized(): void {
    if (this.liveTradingAuthorized) {
      throw new TradingDisabledViolationError('assertLiveTradingUnauthorized check failed');
    }
  }

  /**
   * Validates whether a proposed interaction target is safe or violates the read-only boundary.
   */
  public isInteractionAllowed(elementInfo: { tagName?: string; text?: string; className?: string; testId?: string }): boolean {
    const text = (elementInfo.text || '').trim();
    const className = (elementInfo.className || '').toLowerCase();
    const testId = (elementInfo.testId || '').toLowerCase();

    // Any match on blocked text patterns is rejected
    for (const pattern of ReadOnlyPreflightGuard.BLOCKED_TEXT_PATTERNS) {
      if (pattern.test(text)) {
        return false;
      }
    }

    // Any match on class or testId containing order/trading terms is rejected
    if (className.includes('order') || className.includes('trade') || className.includes('buy') || className.includes('sell')) {
      return false;
    }

    if (testId.includes('order') || testId.includes('trade') || testId.includes('buy') || testId.includes('sell')) {
      return false;
    }

    return true;
  }

  /**
   * Enforces that no trading command can be executed.
   */
  public blockTradingAction(actionName: string): never {
    throw new TradingDisabledViolationError(actionName);
  }

  /**
   * Attaches capturing-phase event listeners to document/window to intercept and block
   * any click, mousedown, or keydown event destined for order-entry controls.
   */
  public armDomNeutralizer(doc: Document | null): boolean {
    if (!doc) return false;

    const blockHandler = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const targetText = target.innerText || target.textContent || '';
      const targetClass = target.className || '';
      const targetTestId = target.getAttribute?.('data-testid') || '';

      const isAllowed = this.isInteractionAllowed({
        tagName: target.tagName,
        text: targetText,
        className: typeof targetClass === 'string' ? targetClass : '',
        testId: targetTestId,
      });

      if (!isAllowed) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        console.warn(`[ReadOnlyPreflightGuard] Intercepted and blocked interaction with trading control: "${targetText}"`);
      }
    };

    try {
      doc.addEventListener('click', blockHandler, true);
      doc.addEventListener('mousedown', blockHandler, true);
      doc.addEventListener('keydown', blockHandler, true);

      // Programmatically neutralize pointer events on any existing trading controls
      for (const selector of ReadOnlyPreflightGuard.BLOCKED_SELECTORS) {
        try {
          doc.querySelectorAll(selector).forEach((el) => {
            (el as HTMLElement).style.pointerEvents = 'none';
          });
        } catch {
          // Ignore invalid selector in custom environments
        }
      }

      this.isGuardArmed = true;
      return true;
    } catch {
      return false;
    }
  }

  public isArmed(): boolean {
    return this.isGuardArmed;
  }

  /**
   * Evaluates the preflight readiness state passively without triggering any DOM events.
   */
  public evaluatePassivePreflight(state: {
    symbol: string;
    expectedSymbol: string;
    timeframe: string;
    expectedTimeframe: string;
    currentTimeArt: string; // "HH:MM:SS"
    rthStartArt: string; // "10:30:00"
    humanConfirmedNoPosition: boolean;
    humanConfirmedNoPendingOrders: boolean;
    streamActive: boolean;
  }): {
    ready: boolean;
    blockers: string[];
  } {
    const blockers: string[] = [];

    // 1. Symbol check
    if (state.symbol.toUpperCase() !== state.expectedSymbol.toUpperCase()) {
      blockers.push(`SYMBOL_MISMATCH: Active symbol '${state.symbol}' does not match expected '${state.expectedSymbol}'`);
    }

    // 2. Timeframe check
    if (state.timeframe !== state.expectedTimeframe) {
      blockers.push(`TIMEFRAME_MISMATCH: Active timeframe '${state.timeframe}' does not match expected '${state.expectedTimeframe}'`);
    }

    // 3. RTH Timing check
    if (state.currentTimeArt < state.rthStartArt) {
      blockers.push(`PRE_RTH_WINDOW: Current time ${state.currentTimeArt} ART is before RTH open ${state.rthStartArt} ART`);
    }

    // 4. Position & Order remediation check (requires explicit human confirmation)
    if (!state.humanConfirmedNoPosition) {
      blockers.push('POSITION_UNCONFIRMED: Human operator has not confirmed that all positions are closed/flattened');
    }

    if (!state.humanConfirmedNoPendingOrders) {
      blockers.push('PENDING_ORDERS_UNCONFIRMED: Human operator has not confirmed that zero pending orders exist');
    }

    // 5. Data stream check
    if (!state.streamActive) {
      blockers.push('STREAM_INACTIVE: TradeSea live candle stream is not active or not receiving updates');
    }

    return {
      ready: blockers.length === 0,
      blockers,
    };
  }
}
