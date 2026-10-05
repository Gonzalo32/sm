# CP47.1 R01–R18 Resource Matrix

| ID | Resource Category | Applicable | Owner | Cleanup | Evidence | Status |
|---|---|---|---|---|---|---|
| **R01** | Event listeners | YES | `pageBridge` | `removeEventListener` | `pageBridge.ts` DOM listener detachment | **VERIFIED** |
| **R02** | WebSocket listeners | YES | `MarketDataAdapter` | Socket teardown | `MarketDataAdapter.ts` ws message handler | **VERIFIED** |
| **R03** | Subscriptions | YES | `MarketDataAdapter` | `setConnectionStatus()` | Instrument contract metadata | **VERIFIED** |
| **R04** | Timers / intervals | YES | `ICTPipelineCoordinator` | `clearTimeout` / reset | Coordinator reset timer purge | **VERIFIED** |
| **R05** | Callbacks | YES | `MarketDataAdapter` | Scoped invocation | In-line callback execution | **VERIFIED** |
| **R06** | Observer registrations | YES | `CandleStore` | Re-init / clear | `CandleStore.ts` loadHistory push | **VERIFIED** |
| **R07** | EventEmitter | YES | `ICTPipelineCoordinator` | Listener removal | Content script messaging | **VERIFIED** |
| **R08** | Maps/Sets/caches | YES | `CandleStore` | `store.clear()` | Time series array purge to 0 | **VERIFIED** |
| **R09** | CandleStore references | YES | `ICTPipelineCoordinator` | Re-creation | `coordinator.getStore()` reference | **VERIFIED** |
| **R10** | CandidateContext refs | YES | `CandidateContextEngine` | Status expiration | `getContext()` query | **VERIFIED** |
| **R11** | MTF references | YES | `MultiTimeframeEngine` | Frame clear | `evaluateMTFContext()` output | **VERIFIED** |
| **R12** | VisualObject references | YES | `VisualAdapter` | Frame re-render | `adaptStateToVisuals()` mapping | **VERIFIED** |
| **R13** | Derived collections | YES | `CandidateContext` | Invalidation / purge | `events` and `supportingEvents` arrays | **VERIFIED** |
| **R14** | DOM/visual resources | YES | `VisualAdapter` | Re-render detaches | Canvas overlay mapping | **VERIFIED** |
| **R15** | Runtime sessions | YES | `MarketDataAdapter` | `setConnectionStatus()` | Connection status state machine | **VERIFIED** |
| **R16** | Reconnect handlers | YES | `MarketDataAdapter` | Status reset | Reconnect state machine | **VERIFIED** |
| **R17** | Reset handlers | YES | `ICTPipelineCoordinator` | `setContext()` re-init | Coordinator re-init path | **VERIFIED** |
| **R18** | Async task handles | YES | Engine Pipeline | Ingestion resolve | Synchronous promise resolution | **VERIFIED** |
