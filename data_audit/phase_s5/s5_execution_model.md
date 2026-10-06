# S5 — Execution Model Abstraction

## 1. Overview

This document specifies the data structures and runtime semantics of the deterministic hypothetical execution model used to record entry and exit events generated from ICT candidate signals.

This is a pure statistical/analytical abstraction. There is NO order execution, NO broker connection, and NO real-money trading.

---

## 2. Core Execution Interface

```typescript
export interface HypotheticalExecutionEvent {
  executionId: string;           // Unique UUID v4 execution event ID
  signalId: string;              // Deterministic reference to source candidate signal
  candidateContextId: string;    // Deterministic reference to source candidate context
  symbol: string;                // e.g. "NQ", "MNQ"
  timeframe: string;             // e.g. "1m", "5m", "15m"
  model: 'MODEL_A' | 'MODEL_B' | 'MODEL_C';
  direction: 'LONG' | 'SHORT';
  
  // Entry Details
  entryRule: 'E1_CONFIRMATION_CLOSE' | 'E2_NEXT_CANDLE_OPEN' | 'E3_FVG_RETRACEMENT';
  entryTimestamp: number;        // Epoch millis timestamp of entry trigger
  entryPrice: number;            // Hypothetical entry price
  
  // Exit Details
  exitRule: 'X1_FIXED_HORIZON' | 'X2_STRUCTURAL_RR' | 'X3_OPPOSING_SIGNAL';
  exitTimestamp: number;         // Epoch millis timestamp of exit trigger
  exitPrice: number;             // Hypothetical exit price
  
  // Execution Context
  status: 'OPEN' | 'CLOSED' | 'EXPIRED';
  quantity: number;              // Standardized contract size (default 1 contract)
}
```

---

## 3. Operational Rules

1. **Deterministic Timestamps**: Entry and exit timestamps match exact historical bar close/open timestamps from replayed candles.
2. **Deterministic Pricing**: Entry and exit prices match exact historical bar prices (close, open, or limit touch price).
3. **No Execution Realism Over-Claims**: Fills are assumed at historical price points without claiming live order book queue priority or discretionary fill improvement.
