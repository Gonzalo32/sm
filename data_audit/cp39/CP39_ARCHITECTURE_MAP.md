# CP39 — ARCHITECTURE MAP & INVENTORY REPORT

## 1. COMPONENT CATEGORIZATION INVENTORY

| File / Component | Category | Imports | Imported By | Production Relevance |
|---|---|---|---|---|
| `core/ict/structure/StructureEngine.ts` | PRODUCTION_DETECTION_LOGIC | Types, Candle | `ICTEngine` | CORE DETECTION |
| `core/ict/fvg/FVGEngine.ts` | PRODUCTION_DETECTION_LOGIC | Types, Candle | `ICTEngine` | CORE DETECTION |
| `core/ict/displacement/DisplacementEngine.ts` | PRODUCTION_DETECTION_LOGIC | Types, Candle | `ICTEngine` | CORE DETECTION |
| `core/ict/liquidity/LiquidityEngine.ts` | PRODUCTION_DETECTION_LOGIC | Types, Candle | `ICTEngine` | CORE DETECTION |
| `core/ict/pdarrays/PDArrayEngine.ts` | PRODUCTION_DETECTION_LOGIC | Types, Candle | `ICTEngine` | CORE DETECTION |
| `core/ict/models/ModelEngine.ts` | PRODUCTION_DETECTION_LOGIC | Types, Setups | `ICTEngine` | CORE DETECTION |
| `core/ict/engine/ICTEngine.ts` | PRODUCTION_DETECTION_LOGIC | Core Detectors | `ICTPipelineCoordinator` | CORE ORCHESTRATION |
| `core/market/CandleStore.ts` | REALTIME_INFRASTRUCTURE | Candle, Validator | `MarketDataAdapter`, Pipeline | MARKET STATE STORE |
| `core/market/MarketDataAdapter.ts` | REALTIME_INFRASTRUCTURE | CandleStore, Types | Pipeline, WebSockets | DATA ADAPTER |
| `core/ict/context/CandidateContextEngine.ts` | CONTEXT_ORCHESTRATION | MarketState, ICTEvent | `ICTPipelineCoordinator` | CONTEXTUAL SUMMARY |
| `core/ict/context/MultiTimeframeContextEngine.ts` | CONTEXT_ORCHESTRATION (MTF) | CandidateContext | `ICTPipelineCoordinator` | MTF PROPAGATION |
| `extension/visual/VisualAdapter.ts` | VISUAL_PRESENTATION | VisualTypes, Context | Pipeline | DERIVED VISUALS |
| `extension/visual/CanvasRenderer.ts` | VISUAL_PRESENTATION | HTML5 Canvas API | Content Script | PRESENTATION RENDER |
| `extension/visual/ICTHUD.ts` | VISUAL_PRESENTATION | DOM API | Content Script | HUD PRESENTATION |
| `tests/*.test.ts` | TESTS | Core, Market, Visual | None | VALIDATION SUITE |
| `data_audit/*` | AUDIT_ARTIFACTS | Markdown, JSON | None | EVIDENTIARY AUDIT |

## 2. DIRECTION OF DEPENDENCIES
```text
DATA SOURCE (TradeSea WS / Mock Stream)
     ↓
REALTIME / DATA ADAPTER (MarketDataAdapter)
     ↓
CANDLE STATE (CandleStore)
     ↓
ICT ENGINE (ICTEngine -> BOS/MSS/FVG/Displacement/Liquidity/PDArrays)
     ↓
ICT EVENTS (ICTEvent[])
     ↓
CONTEXT / MTF (CandidateContextEngine -> MultiTimeframeContextEngine)
     ↓
PRESENTATION (VisualAdapter -> CanvasRenderer / ICTHUD)
```
Zero upward or reverse dependencies detected.
