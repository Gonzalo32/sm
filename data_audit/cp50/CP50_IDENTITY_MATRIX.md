# CP50 ENTITY IDENTITY MATRIX

| Entity | Primary ID | Secondary Keys | Source ID | Symbol | Timeframe | Timestamp | Versioning | Identity Rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Candle | `timestamp` | `symbol`, `timeframe` | `TradeSea_WS` | Yes | Yes | `timestamp` | Monotonic TS | Single entry per timestamp in CandleStore |
| ICT Event | `id` | `type`, `timestamp` | `candle.timestamp` | Yes | Yes | `timestamp` | Progressive buffer | Unique event ID per detected setup |
| CandidateContext | `id` | `symbol`, `timeframe`, `eventTs` | `event.id` | Yes | Yes | `eventTimestamp` | Status state machine | `ctx_{symbol}_{tf}_{ts}` |
| MTF Relation | Composite | `ltfContext`, `htfContext` | `candidateContext.id` | Yes | Yes | `ltfEventAt`, `htfConfirmedAt` | Anti-lookahead causal | Unique LTF/HTF alignment evaluation |
| VisualObject | `id` | `type`, `layer` | `candidateContext.id` | Yes | Yes | `timestamp` | Derived overlay | Derived read-only render element |
