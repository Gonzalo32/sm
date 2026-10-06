# CP51 APPLICABILITY MATRIX

```text
SERIALIZATION_MECHANISMS = 2
SNAPSHOT_MECHANISMS = 2
CLONING_MECHANISMS = 2
PERSISTENCE_MECHANISMS = 1
RECONSTRUCTION_MECHANISMS = 1
HYDRATION_MECHANISMS = 1
RESTORATION_MECHANISMS = 1
```

| Mechanism Category | Implementation Status | Applicability Classification |
| --- | --- | --- |
| JSON Serialization / Deserialization | `ValidationLabEngine.toJSON / fromJSON` | VERIFIED |
| Frame Data Parsing | `pageBridge.ts JSON.parse` | VERIFIED |
| Detection Snapshot | `ValidationLabEngine.buildDetectionSnapshot` | VERIFIED |
| Replay Slice Snapshot | `ReplayEngine.getCurrentSlice` | VERIFIED |
| Candle Store Array Cloning | `CandleStore.getCandles` | VERIFIED |
| Case Metadata Cloning | `ValidationLabEngine.loadCases` | VERIFIED |
| Web Storage / IndexedDB | Absent from codebase | NOT_APPLICABLE |
| Multi-thread Worker Messaging | Absent from codebase | NOT_APPLICABLE |
