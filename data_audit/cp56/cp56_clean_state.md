# CP56 — Clean State Definition Report

## 1. Executive Summary
This document establishes the canonical clean initialization state snapshot (`CLEAN_STATE_SNAPSHOT`) for the audited TradeSea runtime architecture.

## 2. Component Clean State Baseline

| Component | Initial State Value | Structural Verification Method |
|---|---|---|
| `CandleStore` | Empty Array (`[]`), 0 candles | `getCandles().length === 0` |
| `MarketDataAdapter` | `DISCONNECTED`, 0 rejected candles | `getConnectionStatus() === 'DISCONNECTED'` |
| `ICTPipelineCoordinator` | `LIVE` mode, zero store history | `getMode() === 'LIVE'` |
| `CandidateContextEngine` | Empty context (`CONTEXT_FORMING` / `NO_CONTEXT`) | `status` enum check |
| `MultiTimeframeContextEngine` | Empty MTF context | `causal === false` |
| `VisualAdapter` | Empty visual objects list | `adaptStateToVisuals(...) === []` |
| `ReplayEngine` | Unloaded dataset | `getState().candles.length === 0` |
