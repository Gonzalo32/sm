# CP47 Resource Category Inventory

## 1. Resource Categories Audited (R01..R18)

| Code | Resource Category | Implementation Component | Creator | Owner | Lifetime | Cleanup Mechanism | Authoritative? | Status |
|---|---|---|---|---|---|---|---|---|
| **R01** | Event listeners | DOM `CustomEvent` / pageBridge | `pageBridge` | `pageBridge` | Page lifetime | `removeEventListener` | No | **VERIFIED** |
| **R02** | WebSocket listeners | WebSocket message event handlers | `MarketDataAdapter` | `MarketDataAdapter` | Socket lifetime | `ws.close()` / teardown | Yes | **VERIFIED** |
| **R03** | Subscriptions | Symbol/Timeframe subscriptions | `MarketDataAdapter` | `MarketDataAdapter` | Active session | `setConnectionStatus` | Yes | **VERIFIED** |
| **R04** | Timers / intervals | Debounce/throttling timers | Pipeline coordinator | `ICTPipelineCoordinator` | Scoped task | `clearTimeout` / reset | No | **VERIFIED** |
| **R05** | Callbacks | State change notification callbacks | Market engine | `MarketDataAdapter` | Invocation scope | Direct invocation | No | **VERIFIED** |
| **R06** | Observer registrations | Market state observer | Market store | `CandleStore` | Ingestion scope | Re-init / clear | No | **VERIFIED** |
| **R07** | EventEmitter | Internal message bus | Content script | `ICTPipelineCoordinator` | Content script lifetime | Listener removal | No | **VERIFIED** |
| **R08** | Caches / Maps / Sets | In-memory candle array / map | `CandleStore` | `CandleStore` | Context lifetime | `store.clear()` | Yes | **VERIFIED** |
| **R09** | CandleStore references | Time-series candle store | `ICTPipelineCoordinator` | Coordinator | Active context | Context re-creation | Yes | **VERIFIED** |
| **R10** | CandidateContext references | Active CandidateContext | `CandidateContextEngine` | Engine | Active detection | Status expiration | Yes | **VERIFIED** |
| **R11** | MTF references | Higher-timeframe context refs | `MultiTimeframeEngine` | Engine | Alignment eval | Context clear | Yes | **VERIFIED** |
| **R12** | VisualObject references | Derived visual overlays | `VisualAdapter` | `VisualAdapter` | Frame render | Deterministic map | No | **VERIFIED** |
| **R13** | Derived collections | FVG / BOS / Liquidity arrays | `ICTEngine` | `CandidateContext` | Evaluation cycle | Invalidation / purge | Yes | **VERIFIED** |
| **R14** | DOM/visual resources | Visual canvas / overlay DOM | `VisualAdapter` | Browser extension | Render frame | Detach / re-render | No | **VERIFIED** |
| **R15** | Runtime sessions | Instrument session state | `MarketDataAdapter` | Adapter | Active connection | `setConnectionStatus` | Yes | **VERIFIED** |
| **R16** | Reconnect handlers | Reconnect state machine | `MarketDataAdapter` | Adapter | Connection drop | Status reset | Yes | **VERIFIED** |
| **R17** | Reset handlers | Pipeline reset handler | `ICTPipelineCoordinator` | Coordinator | Triggered reset | `setContext()` / clear | Yes | **VERIFIED** |
| **R18** | Async task handles | Ingestion promises | Engine pipeline | Engine | Promise resolve | Native GC | No | **VERIFIED** |

---

## 2. Resource Classification Summary
All 18 resource categories have explicitly identified creators, owners, lifetimes, and cleanup mechanisms. Zero resources are unowned or untraceable.
