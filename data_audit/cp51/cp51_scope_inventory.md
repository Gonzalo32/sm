# CP51 SCOPE INVENTORY

## 1. INVENTORIED RUNTIME MECHANISMS

| Mechanism | Description | Location in Codebase |
| --- | --- | --- |
| Validation Lab Export / Import | `ValidationLabEngine.toJSON()` and `fromJSON(jsonStr)` | `core/ict/validation/ValidationLabEngine.ts` |
| Detection Snapshot Builder | `ValidationLabEngine.buildDetectionSnapshot()` | `core/ict/validation/ValidationLabEngine.ts` |
| Replay State & Slice Snapshot | `ReplayEngine.loadDataset()`, `reset()`, `getCurrentSlice()` | `core/ict/replay/ReplayEngine.ts` |
| CandleStore Array Cloning | `CandleStore.getCandles()` returns `[...this.candles]` | `core/market/CandleStore.ts` |
| PageBridge WS Frame JSON Parsing | `JSON.parse(event.data)` | `extension/content/pageBridge.ts` |
| VisualAdapter Presentation Layer | `VisualAdapter.adaptStateToVisuals()` | `extension/visual/VisualAdapter.ts` |

---

## 2. NON-APPLICABLE MECHANISMS

- `localStorage` / `sessionStorage` (No persistent web storage utilized in core runtime)
- `IndexedDB` (No browser IndexedDB engine used)
- `structuredClone` (In-memory spread cloning used instead)
- `WebWorker postMessage` (No WebWorkers present in domain loop)
