# TradeSea Market Analyst — Phase 1 Read-Only Repository Audit & Implementation Plan

**Audit Date:** October 14, 2026  
**System Local Time:** 2026-10-14T09:42:00-03:00 (ART, UTC-3)  
**Target Feature:** TradeSea Market Analyst (`Analizar mercado`)  
**Scope:** Strictly Read-Only Architecture Inspection & Implementation Plan (Phase 1)  
**Baseline Git Commit:** `57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a`  
**Current Git HEAD:** `eb4ccf7b8e873cafae9b88ba9cd48fc4e6dc8acd`  
**Working Tree State:** Clean (Zero production modifications, 0 uncommitted changes)  

---

## 1. Executive Summary & Verification Findings

An exhaustive read-only audit of the repository was conducted to assess existing architecture, data flow, chart integration, model interfaces, test conventions, and safety barriers prior to implementing the **TradeSea Market Analyst** feature.

### 1.1 Baseline and Cryptographic Integrity Checks

| Verification Target | Expected Baseline Value | Verified Actual Value | Status |
|:---|:---|:---|:---:|
| **Baseline Git Commit** | `57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a` | `57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a` | **`PASS`** |
| **Current Git HEAD** | Current branch tip | `eb4ccf7b8e873cafae9b88ba9cd48fc4e6dc8acd` | **`PASS`** |
| **Working Tree Cleanliness** | 0 uncommitted source edits | Clean (only previous audit markdown reports untracked) | **`PASS`** |
| **`core/ict/` Diff** | 0 diff lines against baseline | `git diff 57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a core/ict/` = 0 lines | **`PASS (100% Frozen)`** |
| **S10 Manifest SHA-256** | `744720e2b930550d1d7bb76654459b9277c094302b595051fad8323cba7f7107` | `744720e2b930550d1d7bb76654459b9277c094302b595051fad8323cba7f7107` | **`PASS (Exact)`** |
| **S10 Protocol v1.1.0 SHA-256** | `d8c4e83cbce2a303c2fd947cac424822d6d6885a4d5800ff234ef5e348317220` | `d8c4e83cbce2a303c2fd947cac424822d6d6885a4d5800ff234ef5e348317220` | **`PASS (Exact)`** |
| **TypeScript Typecheck** | 0 errors | `npx tsc --noEmit` exited with code 0 | **`PASS`** |
| **Automated Test Suite** | 100% passing tests | 157 test files, 1,566 passed, 0 failed | **`PASS`** |
| **Session 002 Preservation** | `INVALID_INCOMPLETE` | Verified sealed in `s10_session_002_summary.json` | **`PASS`** |

---

## 2. Relevant Files and Architecture Inventory

The repository is structured as a high-integrity, zero-external-runtime-dependency TypeScript codebase packaged as a Manifest V3 Chrome Extension for TradeSea (`https://app.tradesea.ai/trade`):

```
sm/
├── core/
│   ├── ict/                  # STRICTLY FROZEN: Models A/B/C, Setups, Confluences, Structure
│   │   ├── engine/ICTEngine.ts
│   │   ├── models/PredefinedModels.ts
│   │   ├── setups/SetupEngine.ts
│   │   ├── context/MarketContextEngine.ts
│   │   └── context/CandidateContextEngine.ts
│   └── market/               # Market Data Layer: Candle, CandleStore, CandleValidator
│       ├── Candle.ts
│       ├── CandleStore.ts
│       ├── CandleValidator.ts
│       └── MarketDataAdapter.ts
├── extension/
│   ├── content/              # Browser Integration Layer
│   │   ├── pageBridge.ts     # MAIN World: WebSocket interception, context/viewport polling
│   │   ├── contentScript.ts  # ISOLATED World: Coordinator, HUD mounting, canvas overlay
│   │   ├── ICTPipelineCoordinator.ts # Central orchestration pipeline
│   │   ├── ReadOnlyPreflightGuard.ts # Fail-closed trading controls neutralizer
│   │   └── TradeSeaPassiveRecorder.ts# Passive recorder for S10 prospective capture
│   └── visual/               # Chart Overlay & Rendering Engine
│       ├── CanvasRenderer.ts # High-DPI 60 FPS HTML5 Canvas renderer
│       ├── CoordinateTranslator.ts # Translates (price, index/timestamp) -> (X, Y) pixels
│       ├── OverlayCanvasManager.ts # Manages #ict-canvas-overlay, ResizeObserver, DPR
│       ├── VisualAdapter.ts  # Maps ICT market state/setups to VisualObject[]
│       ├── VisualTypes.ts    # MARKER, LINE, RECTANGLE primitive interfaces
│       └── ICTHUD.ts         # Fixed floating HUD with context narrative and controls
└── tests/                    # 157 deterministic Vitest test suites (1,566 tests)
```

---

## 3. Existing Data Flow & Chart Architecture

1. **Market Data Interception (`extension/content/pageBridge.ts`):**
   * Injected into the TradeSea page (`MAIN` world).
   * Intercepts `window.WebSocket` to capture real-time market data in TradingView format (`~m~len~m~json` or JSON OHLC frames).
   * Emits `ICT_CANDLE_UPDATE`, `ICT_CANDLE_CLOSE`, and `ICT_NEW_CANDLE` via `window.postMessage`.
   * Passively inspects active symbol/timeframe (`currentSymbol = 'MNQ'`, `currentTimeframe = '1m'`) and visible price range via `chart.getVisiblePriceRange()`, posting `ICT_VIEWPORT_CHANGED`.

2. **Pipeline Coordination (`extension/content/ICTPipelineCoordinator.ts`):**
   * Listens to postMessages in the `ISOLATED` world.
   * Feeds candles into `CandleStore`, which enforces strict OHLC validation via `CandleValidator`.
   * On candle arrival or viewport change, executes:
     `ICTEngine.process()` $\rightarrow$ `ConfluenceEngine` $\rightarrow$ `SetupEngine` $\rightarrow$ `MarketContextEngine` / `CandidateContextEngine` $\rightarrow$ `VisualAdapter` $\rightarrow$ `CanvasRenderer.updateVisuals()`.

3. **Chart Overlay Rendering (`extension/visual/CanvasRenderer.ts`):**
   * Uses a transparent `<canvas id="ict-canvas-overlay">` positioned above the chart container with `pointer-events: none` and `z-index: 9999`.
   * `CoordinateTranslator` maps price to Y coordinates (`priceToY`) and candle index/timestamp to X coordinates (`indexToX`).
   * Renders `MARKER` (Triangles, Circles, Crosses), `LINE` (Solid, Dashed, Dotted), and `RECTANGLE` (Entry zones, FVGs, Order blocks).
   * Fail-closed safeguard: `setFailClosedOnUnsyncedViewport(true)` suppresses drawings when viewport coordinates are unsynchronized.

4. **HUD Interface (`extension/visual/ICTHUD.ts`):**
   * Floating HUD (`#ict-assistant-hud`) with backdrop blur, displaying context summary, active trend, dealing range zone, and checklist.

---

## 4. Existing A/B/C Model Interfaces & Frozen Boundaries

### 4.1 Frozen Models Specification (`core/ict/models/PredefinedModels.ts`)
* **Model A (`MODEL_A_LONG` / `MODEL_A_SHORT`):**
  * Silver Bullet style. Required: `LIQUIDITY_SWEEP` $\rightarrow$ `MSS_CONFIRMED` $\rightarrow$ `FVG_CONFLUENCE`. Optional: `ORDER_BLOCK_CONFLUENCE`. Max bars: 25.
* **Model B (`MODEL_B_LONG` / `MODEL_B_SHORT`):**
  * Displacement focused. Required: `LIQUIDITY_SWEEP` $\rightarrow$ `DISPLACEMENT` $\rightarrow$ `FVG_CONFLUENCE`. Max bars: 20.
* **Model C (`MODEL_C_LONG` / `MODEL_C_SHORT`):**
  * Multi-timeframe aligned. Required: `LIQUIDITY_SWEEP` $\rightarrow$ `MSS_CONFIRMED` $\rightarrow$ `FVG_CONFLUENCE`. Optional: `ORDER_BLOCK_CONFLUENCE`. Max bars: 30.

### 4.2 Setup State Lifecycle (`core/ict/setups/SetupTypes.ts`)
* Statuses: `WATCHING` $\rightarrow$ `FORMING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `COMPLETED` / `INVALIDATED` / `EXPIRED`.
* Setup Object outputs: `direction` (`LONG` | `SHORT`), `status`, `mandatoryConfluences`, `fulfilledConfluences`, `missingConfluences`, `evidence`.

### 4.3 Frozen Boundary Invariant
* `core/ict/` is **strictly frozen** (baseline commit `57acd4c42e18f234c5dbfa64ba5b4e45bf59cb5a`).
* The **TradeSea Market Analyst** must consume `ICTMarketState`, `ICTEvent[]`, `ICTSetup[]`, and `CandidateContext` purely as a read-only client through a separate adapter.

---

## 5. Available Historical & Real-Time Market Data

* **Current Instruments:** `MNQ` / `MNQZ6` (primary), `NQ` / `NQZ6` (reference).
* **Current Timeframes:** Primary continuous stream is `1m`. Multi-timeframe engine supports `5m` and `15m` when data is available.
* **Candle Representation:** Strict `Candle` interface (`timestamp`, `open`, `high`, `low`, `close`, `volume`, `source`, `isClosed`).
* **Validation:** `CandleValidator.validateCandle()` checks positive finite numbers, non-zero timestamp, and OHLC geometric rules (`high >= max(open, close)`, `low <= min(open, close)`, `high >= low`).
* **Series Integrity:** `CandleValidator.validateSeries()` checks monotonicity, duplicate timestamps, and gaps.

---

## 6. Existing Persistence and Test Infrastructure

* **Current Persistence (`extension/content/PassiveRecorderStorage.ts`):**
  * Uses browser IndexedDB with database `TradeSeaPassiveDataDB` (`candles` store with composite key `[symbol, timeframe, timestamp]`, and `sessions` store).
  * Generates SHA-256 data integrity hashes.
* **Persistence for Market Analyst:**
  * Must be **strictly isolated** from `TradeSeaPassiveDataDB` so analyst records are never confused with official S10 capture evidence.
  * Recommended architecture: Dedicated IndexedDB database `TradeSeaMarketAnalystDB` with object stores:
    1. `forecasts`: Immutable records of point-in-time analyses (`analysisId`, timestamp, inputs, bullish/bearish scenarios, targets, invalidation, risk/reward).
    2. `outcomes`: Evaluation append records tracking subsequent price behavior (target hit, invalidation hit, expired).
* **Test Infrastructure:**
  * Vitest 2.1.9, TypeScript 5.5.
  * Fast, deterministic in-memory execution (< 16 seconds for all 1,566 tests).
  * Standard test fixture generators in `tests/` create synthetic OHLCV series for comprehensive scenario coverage.

---

## 7. Security and Governance Constraints

1. **Zero Order Execution:**
   * No trading endpoints, order execution APIs, or broker credentials exist in the codebase.
   * `ReadOnlyPreflightGuard` is armed in `contentScript.ts`, actively intercepting click, mousedown, and keydown events targeting order buttons and setting `pointer-events: none`.
   * The Market Analyst must be strictly decoupled from any execution pathway.
2. **Official S10 Isolation:**
   * Session 002 remains sealed as `INVALID_INCOMPLETE`.
   * Official capture must not be initiated or affected by the Market Analyst.
   * Forecast records must be tagged `DECISION_SUPPORT_ANALYST` and stored in a separate database.
3. **Conservative Decision Support:**
   * When evidence is weak, contradictory, or data is stale, the engine must return `NO_CLEAR_OPPORTUNITY` or `CONFLICTING_EVIDENCE`.

---

## 8. Proposed Architecture for TradeSea Market Analyst

```
┌────────────────────────────────────────────────────────────────────────┐
│                        USER TRIGGER INTERFACE                          │
│        Button in ICTHUD: "Analizar mercado" (#btn-analizar-mercado)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ triggers point-in-time analysis
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   MarketAnalystEngine (core/analyst/)                   │
│  - Validates data freshness, lookback, and candle series integrity     │
│  - Inspects ICTMarketState (FVGs, OBs, Liquidity, Swings, DealingRange)│
│  - Inspects SetupEngine results (Models A, B, C LONG & SHORT states)   │
│  - Evaluates Bullish and Bearish scenarios independently               │
│  - Derives factual Nearby Targets (first structural liquidity/FVG)     │
│  - Derives factual Extended Targets (secondary swing/major pool)       │
│  - Derives structural Invalidation Level (sweep extreme / swing low/hi)│
│  - Computes Gross Move, Net Move (1.00 pt friction), Risk, and R:R     │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│  MarketRiskFilter (core/analyst/)    │  │ MarketAnalystJournal         │
│  - Enforces minimum data freshness   │  │ (extension/analyst/)         │
│  - Rejects excessive structural risk │  │ - IndexedDB persistence      │
│  - Filters contradictory confluences │  │   (TradeSeaMarketAnalystDB)  │
│  - Emits: ANALYSIS_READY,            │  │ - Stores immutable forecast  │
│    NO_CLEAR_OPPORTUNITY,             │  │ - Appends subsequent outcome │
│    CONFLICTING_EVIDENCE, etc.        │  │   evaluations                │
└───────────────────┬──────────────────┘  └──────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             MarketAnalystVisualAdapter (extension/analyst/)             │
│  - Maps selected scenario to VisualObject[] (MARKER, LINE, RECTANGLE)  │
│  - Tags drawings with unique analysisId                                │
│  - Renders Reference Price, Target Lines/Zones, and Invalidation Line  │
│  - Provides Show/Hide/Clear controls without deleting journal record   │
│  - Updates ICTHUD with structured scenario breakdown and rationale     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Implementation Plan: Proposed Files to Create & Modify

### 9.1 New Modules to Create (Phase 2)

| File Path | Responsibility | Decoupling / Safety Guarantee |
|:---|:---|:---|
| [`core/analyst/MarketAnalystTypes.ts`](file:///c:/Users/Administrador/Desktop/sm/core/analyst/MarketAnalystTypes.ts) | Domain interfaces: `MarketAnalysis`, `MarketScenario`, `PriceTarget`, `MarketAnalysisStatus`, `MarketDirection`. | Pure types, zero dependencies. |
| [`core/analyst/MarketAnalystEngine.ts`](file:///c:/Users/Administrador/Desktop/sm/core/analyst/MarketAnalystEngine.ts) | Pure deterministic scenario evaluator. Analyzes bullish/bearish evidence from `ICTMarketState` and `ICTSetup[]`. | Non-invasive reader of frozen ICT types. No side effects. |
| [`core/analyst/MarketRiskFilter.ts`](file:///c:/Users/Administrador/Desktop/sm/core/analyst/MarketRiskFilter.ts) | Conservative risk filter. Enforces structural viability, R:R calculation, friction accounting, and conflicting evidence rejection. | Isolated component with configurable, tested rules. |
| [`core/analyst/MarketAnalystValidator.ts`](file:///c:/Users/Administrador/Desktop/sm/core/analyst/MarketAnalystValidator.ts) | Time-ordered evaluation harness to evaluate historical forecasts against subsequent candles without lookahead. | Strictly causal; handles ambiguous intrabar sequences fail-closed. |
| [`extension/analyst/MarketAnalystJournal.ts`](file:///c:/Users/Administrador/Desktop/sm/extension/analyst/MarketAnalystJournal.ts) | Dedicated IndexedDB persistence engine (`TradeSeaMarketAnalystDB`). | Completely isolated from `TradeSeaPassiveDataDB`. |
| [`extension/analyst/MarketAnalystVisualAdapter.ts`](file:///c:/Users/Administrador/Desktop/sm/extension/analyst/MarketAnalystVisualAdapter.ts) | Translates `MarketAnalysis` scenarios into `VisualObject[]` for `CanvasRenderer`. Handles show/hide and clear. | Reuses existing visual primitives (`MARKER`, `LINE`, `RECTANGLE`). |
| [`tests/market_analyst_data_integrity.test.ts`](file:///c:/Users/Administrador/Desktop/sm/tests/market_analyst_data_integrity.test.ts) | Tests candle ordering, stale data, gaps, duplicate timestamps, and lookback checks. | Vitest deterministic suite. |
| [`tests/market_analyst_scenario_evaluation.test.ts`](file:///c:/Users/Administrador/Desktop/sm/tests/market_analyst_scenario_evaluation.test.ts) | Tests bullish vs. bearish evaluation, target derivation, invalidation levels, and `NO_CLEAR_OPPORTUNITY`. | Vitest deterministic suite. |
| [`tests/market_analyst_risk_filter.test.ts`](file:///c:/Users/Administrador/Desktop/sm/tests/market_analyst_risk_filter.test.ts) | Tests risk thresholds, friction calculation, conflicting signals, and qualitative confidence labels. | Vitest deterministic suite. |
| [`tests/market_analyst_visualization.test.ts`](file:///c:/Users/Administrador/Desktop/sm/tests/market_analyst_visualization.test.ts) | Tests visual object generation, analysisId tagging, hide, and clear operations. | Vitest deterministic suite. |
| [`tests/market_analyst_persistence.test.ts`](file:///c:/Users/Administrador/Desktop/sm/tests/market_analyst_persistence.test.ts) | Tests immutable forecast saving, outcome appending, and database isolation. | Vitest deterministic suite. |
| [`tests/market_analyst_security_isolation.test.ts`](file:///c:/Users/Administrador/Desktop/sm/tests/market_analyst_security_isolation.test.ts) | Verifies zero order execution capability, zero broker API calls, and preflight guard integrity. | Vitest deterministic suite. |

### 9.2 Existing Files Proposed for Non-Breaking Extension

| File Path | Proposed Modification | Rationale |
|:---|:---|:---|
| [`extension/visual/ICTHUD.ts`](file:///c:/Users/Administrador/Desktop/sm/extension/visual/ICTHUD.ts) | Add button `"Analizar mercado"` (`#btn-analizar-mercado`), analyst section rendering the selected scenario (preferred direction, targets, invalidation, rationale), and clear/hide overlay controls. | Provides the user trigger and displays points of interest on the existing HUD. |
| [`extension/content/ICTPipelineCoordinator.ts`](file:///c:/Users/Administrador/Desktop/sm/extension/content/ICTPipelineCoordinator.ts) | Add `runMarketAnalysis()` method that retrieves current `CandleStore` candles and `ICTEngineResult`, invokes `MarketAnalystEngine`, stores the forecast in `MarketAnalystJournal`, and passes visual objects to `CanvasRenderer`. | Central non-invasive coordinator hook. |
| [`extension/content/contentScript.ts`](file:///c:/Users/Administrador/Desktop/sm/extension/content/contentScript.ts) | Wire the click event of `#btn-analizar-mercado` to `coordinator.runMarketAnalysis()`. | Standard event connection. |

### 9.3 Inviolable Files (Strictly Unmodified)
* **`core/ict/*`:** 100% frozen. Zero lines modified.
* **`data_audit/*`:** S10 protocol, manifest, and session records remain untouched.
* **`extension/content/ReadOnlyPreflightGuard.ts`:** Safety guard remains unchanged.

---

## 10. Risks, Missing Dependencies, and Unresolved Questions

1. **Lookahead Protection in Scenario Evaluation:**
   * *Risk:* Ensuring that scenarios derive targets only from structures that were confirmed at or before the evaluation candle.
   * *Mitigation:* `MarketAnalystEngine` will only read structural elements (`swings`, `fairValueGaps`, `liquidityLevels`) present in the current `ICTMarketState` and `ICTEvent[]` slices, matching the causal guarantee established in `CandidateContextEngine`.
2. **Ambiguous Intrabar Outcomes in Validation:**
   * *Risk:* If a single subsequent 1m candle hits both the nearby target and the invalidation level, the exact sequence cannot be known from 1m OHLC bars alone.
   * *Mitigation:* `MarketAnalystValidator` will flag same-bar hits explicitly as `AMBIGUOUS_EVALUATION` and conservatively treat them as unconfirmed or adverse, rather than assuming favorable intrabar sequencing.
3. **Carry-Forward Statistical Limitation (S9.3):**
   * *Risk:* Users might interpret analysis scenarios as high-confidence statistical predictions.
   * *Mitigation:* The HUD and report will clearly label scenarios as *qualitative decision support*, explicitly citing the unresolved S9.3 return autocorrelation ($r = +0.7414$) and stating that visual integration does not constitute proof of profitability.
4. **Dependencies:**
   * Zero new npm dependencies required. All functionality will be built with native TypeScript and existing test tools.

---

## 11. Audit Conclusion and Next Step

Phase 1 Read-Only Repository Audit is complete. The repository architecture is verified, clean, and fully capable of hosting the **TradeSea Market Analyst** feature via non-invasive adapter patterns with zero impact on frozen ICT models or S10 capture protocols.

**Immediate Next Step:** Await explicit human operator approval of this Phase 1 Implementation Plan before initiating Phase 2 source code and test creation.
