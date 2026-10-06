# CP53 — Data Contract Inventory Report

## 1. Executive Summary
This document inventories all runtime data contracts connecting the TradeSea end-to-end pipeline:
`pageBridge → MarketDataAdapter → Candle → ICT Event → CandidateContext → MTF Relation → VisualObject → Diagnostics`.

## 2. Inventory of Repository Contracts

| Contract | Producer | Consumer | Required Fields | Optional Fields | Types | Enums / Constrained Domains | Identity Fields |
|---|---|---|---|---|---|---|---|
| `Candle` | WebSocket / REST / File | `CandleStore` | `timestamp`, `open`, `high`, `low`, `close` | `volume` | `number` | N/A | `timestamp` |
| `MarketDataSourceContract` | System configuration | `MarketDataAdapter` | `source`, `instrument`, `timeframe` | `timezone`, `isSynthetic` | `string`, `boolean` | `instrument`: NQ/MNQ, `timeframe`: 1m/5m/15m | N/A |
| `AdapterIngestionResult` | `MarketDataAdapter` | Caller / Controller | `success`, `status` | `loadedHistoryCount`, `skippedCount`, `prunedCount`, `error` | `boolean`, `string`, `number` | `status`: LOADED, INGESTED, RECONNECTED, DATA_REJECTED, etc. | N/A |
| `ICTMarketState` | `ICTEngine` | Context & Visual Adapters | `symbol`, `timeframe`, `lastUpdatedTimestamp`, `lastCandleIndex`, `trend`, `swings`, `liquidityLevels`, `fairValueGaps`, `orderBlocks` | `activeSwingHigh`, `activeSwingLow`, `dealingRange` | `string`, `number`, arrays | `trend`: BULLISH/BEARISH/SIDEWAYS | N/A |
| `ICTEvent` | `ICTEngine` | CandidateContextEngine | `id`, `type`, `timestamp`, `symbol`, `timeframe` | `price`, `candleIndex`, `metadata` | `string`, `number`, `object` | `type`: BOS, MSS, FVG, SWEEP, etc. | `id` |
| `CandidateContext` | `CandidateContextEngine` | MTF & Visual Adapters | `id`, `symbol`, `timeframe`, `eventTimestamp`, `confirmationTimestamp`, `structure`, `liquidity`, `displacement`, `fvg`, `pdArray`, `supportingEvents`, `sourceCandleTimestamps`, `status`, `expirationStatus` | N/A | `string`, `number`, `object`, arrays | `status`: CONTEXT_FORMING, CONTEXT_CONFIRMED, etc. | `id` |
| `MultiTimeframeContext` | `MultiTimeframeContextEngine` | Coordinator / HUD | `id`, `symbol`, `targetTimeframe`, `sourceTimeframe`, `eventTimestamp`, `confirmationTimestamp`, `sourceEventIds`, `sourceCandleTimestamps`, `structure`, `liquidity`, `displacement`, `fvg`, `pdArray`, `status`, `causal`, `validityWindow` | N/A | `string`, `number`, `boolean`, `object` | `status`: CONFIRMED, STALE, etc. | `id` |
| `VisualObject` | `VisualAdapter` | HUD / CanvasRenderer | `id`, `type`, `symbol`, `timeframe` | `price`, `timestamp`, `color`, `label`, `shape`, `coordinates`, `zIndex` | `string`, `number`, `object` | `type`: MARKER, LINE, ZONE | `id` |
| `RuntimeProvenanceMetadataPayload` | `MarketDataAdapter` | Diagnostics / HUD | `source`, `instrument`, `timeframe`, `timezone`, `requestedLookbackDays`, `actualAvailableLookbackDays`, `firstTimestamp`, `lastTimestamp`, `candleCount`, `connectionStatus`, `syntheticBlocked` | N/A | `string`, `number`, `boolean` | `connectionStatus`: DISCONNECTED/CONNECTED/etc. | N/A |

## 3. Schema Classification
- `FORMAL_SCHEMA_PRESENT`: NO (No JSON Schema / Protobuf schemas defined)
- `IMPLICIT_TYPESCRIPT_CONTRACT`: YES (Strict TypeScript interface definitions)
- `RUNTIME_VALIDATED_CONTRACT`: YES (`CandleValidator` validates incoming Candle objects)
- `MIXED_CONTRACT`: YES
- `NO_FORMAL_VERSIONING`: YES (TypeScript interface versioning without runtime protocol negotiation)
