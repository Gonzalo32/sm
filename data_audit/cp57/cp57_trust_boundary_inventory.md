# CP57 — Trust Boundary Inventory Report

## 1. Executive Summary
This document inventories all trust boundaries where external, semi-trusted, or structurally untrusted data enters the TradeSea runtime architecture.

## 2. Trust Boundary Classification Matrix

| Boundary ID | Source | Destination | Data Type | Validation Point | Trust Level | Authoritative After Validation | Rejection Behavior | Evidence Class |
|---|---|---|---|---|---|---|---|---|
| B01 | WebSocket / REST | `MarketDataAdapter` | Raw JSON / WS Frame | `CandleValidator.validateCandle` | Untrusted | YES | `DATA_REJECTED` | CAPTURED_FIXTURE |
| B02 | `pageBridge` | `ICTPipelineCoordinator` | DOM Event / Message | Contract Validation | Semi-trusted | YES | Error Return | SYNTHETIC |
| B03 | CustomEvent | N/A | DOM Event | N/A | Untrusted | NOT_APPLICABLE | N/A | NOT_APPLICABLE |
| B04 | Extension Script | `ICTPipelineCoordinator` | Pipeline Config | Option Schema | Semi-trusted | NO | Safe Default | CODE_INSPECTION |
| B05 | `MarketDataAdapter` | `CandleStore` | `Candle` Payload | Range & Type Check | Trusted | YES | Ingestion Error | OBSERVED_LIVE |
| B06 | `CandleStore` | `ICTEngine` | Canonical `Candle` | Internal Range Check | Fully Trusted | YES | N/A | CODE_INSPECTION |
| B07 | `ICTEngine` | `CandidateContextEngine` | `ICTEvent` Array | Detection Validator | Fully Trusted | NO (Derived) | N/A | CODE_INSPECTION |
| B08 | `CandidateContextEngine` | `MultiTimeframeContextEngine` | `CandidateContext` | Status & Causality | Derived | NO (Derived) | Expiration Flag | CODE_INSPECTION |
| B09 | `MultiTimeframeContextEngine` | `VisualAdapter` | `MultiTimeframeContext` | Causal Verification | Derived | NO (Derived) | `causal: false` | CODE_INSPECTION |
| B10 | `VisualAdapter` | `ICTHUD` / Canvas | `VisualObject` Array | Config Color Mapper | Derived | NO (Observational) | N/A | CODE_INSPECTION |
| B11 | Diagnostic Endpoint | HUD | Provenance Metadata | Snapshot Exporter | Observational | NO (Observational) | N/A | CODE_INSPECTION |
| B12 | Runtime Config Payload | `MarketDataAdapter` | `MarketDataSourceContract` | Precedence Normalizer | Config | NO (Configuration) | Default Fallback | CODE_INSPECTION |
