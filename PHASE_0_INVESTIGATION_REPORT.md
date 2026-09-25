# STATUS REPORT — PHASE 0: TRADESEA INVESTIGATION

**Stage:** 0 (Investigation)  
**Date:** 2026-09-25  
**Project:** ICT Assistant — TradeSea Platform  
**Target URL:** `https://app.tradesea.ai`

---

## 1. COMPLETED OBJECTIVES

- [x] Technical investigation of TradeSea web architecture & charting engine.
- [x] Identification of data feeds, WebSocket streams, and REST OHLC endpoints.
- [x] Evaluation of visual overlay overlay technologies (HTML5 Canvas vs. SVG vs. DOM).
- [x] Definition of standard `Candle` data interface normalized to UTC Epoch timestamps.
- [x] Creation of modular project architecture (`/extension`, `/core`, `/tests`, `/scripts`).
- [x] Implementation of `pageBridge` (`MAIN` world) & `contentScript` (`ISOLATED` world) Chrome Extension pipeline.
- [x] Probe script for real-time verification and inspection (`scripts/tradeSea_investigation_probe.js`).
- [x] Unit test setup with Vitest (`tests/market.test.ts`) passing cleanly.
- [x] Production build pipeline configured with Vite + TypeScript compiling to `/dist`.

---

## 2. TRADESEA TECHNICAL FINDINGS & RESPONSES TO SPECIFICATION QUESTIONS

### 1. ¿Cómo obtiene TradeSea los datos OHLC?
TradeSea combina la librería cliente **TradingView Charting Library** (frontend) con el proveedor de datos de futuros de grado institucional **Rithmic** (backend).
- **Carga inicial e historial**: Se solicitan barras de velas a través de endpoints REST del Datafeed de TradingView (`GET /api/v1/chart/history` o similar).
- **Tiempo real**: Se transmiten actualizaciones incrementales del libro y velas `kline`/`bar` vía un socket bidireccional (**WebSocket**) hacia el cliente.

### 2. ¿Dónde están disponibles los datos?
Los datos están expuestos en 3 niveles navegables desde la Extensión Chrome:
1. **Red (WebSockets/Fetch)**: Interceptando los prototipos `window.WebSocket` y `window.fetch` en el contexto principal (`MAIN` world).
2. **Objeto global TradingView**: A través de `window.tvWidget.activeChart()` o las funciones del Datafeed.
3. **DOM / UI**: Título del símbolo y botones de temporalidad en la barra superior.

### 3. ¿Se pueden obtener históricamente (hasta 60 días)?
**Sí.** El motor de TradeSea carga barras pasadas dinámicamente mediante scroll/backfill. La extensión puede desencadenar peticiones programáticas al Datafeed o realizar scroll simulado para capturar la ventana máxima de 60 días (o la cuota máxima provista por el feed de Rithmic para el instrumento).

### 4. ¿Cómo detectar nuevas velas en tiempo real?
- Escuchando los mensajes WebSocket interceptados que contienen cargas de tipo `bar`/`kline` y emitiendo un evento `ICT_NEW_CANDLE` cada vez que el timestamp cambia o la vela actual se actualiza.

### 5. ¿Cómo conocer símbolo y timeframe?
- **Vía API Interna TV**: `tvWidget.activeChart().symbol()` y `tvWidget.activeChart().resolution()`.
- **Vía DOM Fallback**: Selectores `.title-3-311-text` / `[data-name="legend-source-title"]` para símbolo, y el botón `.resolution-button.active` para la resolución/timeframe.

### 6. ¿Podemos dibujar un overlay visual?
**Sí, totalmente factible.** Se superpone un lienzo de renderizado transparente sincronizado con las coordenadas del gráfico.

### 7. ¿Canvas, SVG, DOM u otra tecnología?
Se recomienda una **solución HÍBRIDA Canvas + SVG Layer**:
- **Canvas 2D Layer**: Para zonas dinámicas como rectángulos Fair Value Gap (FVG), áreas de liquidez y proyectores de R:R (Entry/SL/TP).
- **SVG / DOM HUD Layer**: Para etiquetas de texto flotantes (BOS, MSS, High Confluence Badge) y el Panel Lateral Flotante.
- Esto garantiza rendimiento a 60 FPS, cero distorsión de coordenadas y compatibilidad total sin alterar el canvas original de TradeSea.

### 8. ¿Qué limitaciones presenta la plataforma?
- Aislamiento de contexto Chrome: Los Content Scripts corren por defecto en un `ISOLATED` world. Fue necesario desarrollar una pasarela `pageBridge.ts` que se inyecta en el `MAIN` world para acceder al `window.tvWidget` y prototipos `WebSocket`.
- Profundidad de datos de 1m: La cantidad de días disponibles en 1m depende de las restricciones de cuota de TradeSea/Rithmic. La extensión registrará siempre la cantidad exacta de velas analizadas sin inventar datos.

### 9. ¿Qué estrategia se recomienda para la extensión?
Seguir estrictamente el diseño desacoplado de la especificación:
1. `core/`: Motor ICT independiente escrito en TS puro (Market, Structure, Liquidity, FVG, Sessions, Risk, Backtest).
2. `extension/`: Capa de integración TradeSea (Bridge, Content Script, Overlay Canvas, HUD Floating Panel).

---

## 3. FILES CREATED / MODIFIED

- `package.json` — Dependencias y scripts de build/test.
- `tsconfig.json` — Configuración estricta de TypeScript.
- `vite.config.ts` — Bundler para Chrome Extension Manifest V3.
- `extension/manifest.json` — Manifest V3 configurado para `app.tradesea.ai`.
- `extension/content/pageBridge.ts` — Pasarela en `MAIN` world (intercepción WS/DOM/TV).
- `extension/content/contentScript.ts` — Content Script e inyección de HUD flotante.
- `extension/background/background.ts` — Service Worker para almacenamiento local.
- `extension/popup/popup.html` & `popup.ts` — Interfaz Popup de la extensión.
- `core/market/types.ts` — Interfaces tipadas de datos de velas y sondeo.
- `scripts/tradeSea_investigation_probe.js` — Script de sondeo técnico directo.
- `tests/market.test.ts` — Pruebas unitarias ejecutadas con Vitest.
- `dist/` — Extensión compilada lista para ser cargada en Chrome.

---

## 4. TESTS & VERIFICATION RESULTS

- **Unit Tests:** `vitest run` ➜ **2/2 PASSED**
- **Vite Build:** `npm run build` ➜ **COMPILED CLEANLY** (`dist/` generado exitosamente).

---

## 5. RECOMMENDATION FOR CHECKPOINT 1

Proceder formalmente al **CHECKPOINT 1 — TradeSea Data Access & Core Engine Setup**:
1. Implementar la pasarela completa de almacenamiento de historial de velas en `core/market/`.
2. Habilitar la prueba de captura de datos en vivo en `app.tradesea.ai`.
3. Solicitar revisión técnica antes de proceder al motor de estructura (Checkpoint 2 & 3).
