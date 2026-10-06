# CP54 — Configuration & Environment Inventory Report

## 1. Executive Summary
This document inventories all runtime configuration mechanisms, default options, build-time settings, connection settings, feature flags, and environment dependencies present in the TradeSea architecture.

## 2. Configuration Inventory

| ID | Configuration Mechanism | Owner | Consumer | Default Value | Override Mechanism | Runtime / Build-time | Authority Level |
|---|---|---|---|---|---|---|---|
| CFG-01 | `MarketDataSourceContract` | System Config | `MarketDataAdapter` | `{ source: 'TradeSea_WS', instrument: 'NQ', timeframe: '1m' }` | Constructor Options | Runtime | Derived |
| CFG-02 | Memory Window Lookback Days | System Config | `CandleStore` | `60` (Days) | Constructor Parameter | Runtime | Derived |
| CFG-03 | Visual Adapter Color Scheme | Visual Config | `VisualAdapter` | `DEFAULT_VISUAL_CONFIG.colorScheme` | Constructor Options | Runtime | Derived |
| CFG-04 | Pipeline Coordinator Options | Coordinator | `ICTPipelineCoordinator` | `{ debug: true, mode: 'LIVE' }` | Options Payload | Runtime | Derived |
| CFG-05 | Synthetic Source Block Flag | Provenance | `MarketDataAdapter` | `requireRealRuntime: false` | Constructor Flag | Runtime | Authoritative |
| CFG-06 | Frozen ICT Thresholds | Production ICT | ICT Engines | `bodyRatio=0.60`, `minRangeMultiplier=1.50`, `fvgMinSizePoints=0.25`, `lookbackCandles=5` | Immutable Constants | Build-time | Authoritative |
