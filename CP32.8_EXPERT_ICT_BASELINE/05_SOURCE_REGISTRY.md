# CP32.8 — DOCUMENTARY SOURCE REGISTRY

> **Baseline Identifier**: `CP32.8-EXPERT-ICT-BASELINE-V1`  
> **Document Status**: Official Source Registry  

---

## 1. PRINCIPIOS DE DOCUMENTACIÓN Y REFERENCIACIÓN

Para evitar la invención de definiciones o la auto-referenciación del sistema (donde el código fuente intentaría justificarse a sí mismo), este registro consolida las fuentes documentales oficiales de la metodología Inner Circle Trader (ICT) y las extensiones reconocidas de Smart Money Concepts (SMC).

### Reglas Estrictas de Fuentes
1. **Prohibición de Autovalidación**: Los archivos de salida del motor (`ICTEngine`, `StructureEngine`, etc.) o los registros de ejecución del proyecto **NO** constituyen fuente teórica.
2. **Prohibición de Invención**: Ninguna definición puede ser atribuida a "consenso general" si no cuenta con respaldo documental en las fuentes registradas.
3. **Reconocimiento de Versiones**: Las enseñanzas de ICT han evolucionado desde su Core Content (2016-2017) hasta las mentorías recientes (2022-2023). Cuando existen discrepancias entre versiones del mismo autor, se registra la evolución.

---

## 2. REGISTRO DE FUENTES PRIMARIAS (OFICIALES ICT)

### [SRC-01] ICT Core Content (2016 - 2017)
- **Autor**: Michael J. Huddleston (Inner Circle Trader)
- **Formato**: Serie de video-conferencias y módulos educativos (Meses 1 al 12).
- **Módulos Relevantes**:
  - *Month 1-2*: Institutional Order Flow, Market Structure, Fractals, Premium vs Discount.
  - *Month 3*: Liquidity Pools (BSL/SSL), Equal Highs/Lows, Stop Runs.
  - *Month 4*: Order Block Definition, Change in State of Delivery, Mean Threshold.
  - *Month 6*: Fair Value Gaps (BISI/SIBI), Liquidity Voids.

### [SRC-02] ICT 2022 YouTube Mentorship
- **Autor**: Michael J. Huddleston
- **Formato**: 41 Episodios teóricos y prácticos sobre modelos de ejecución intradía.
- **Módulos Relevantes**:
  - *Episodios 1-3*: Core 2022 Model (Sweep + Displacement + MSS + FVG).
  - *Episodio 4*: Market Structure Shift (MSS) vs Break of Structure (BOS).
  - *Episodio 12*: Silver Bullet Time Windows & Model A Mechanics.

### [SRC-03] ICT 2023 Mentorship & Charter Lectures
- **Autor**: Michael J. Huddleston
- **Formato**: Clases avanzadas sobre algoritmia de entrega de precio (IPDA - Interbank Price Delivery Algorithm).
- **Temas**: IPDA Data Ranges (20, 40, 60 días), AMD (Accumulation, Manipulation, Distribution) y Power of 3.

---

## 3. REGISTRO DE FUENTES SECUNDARIAS (SMC & INSTITUTIONAL ANALYSIS)

### [SRC-04] Smart Money Concepts Community Standards
- **Formato**: Documentación técnica consolidada por comunidades de desarrollo e investigación cuantitativa (ej. LuxAlgo SMC, TradingView Open Source SMC Implementations).
- **Aporte**: Definiciones algorítmicas discretas para computación en software de pivotes de estructura y mapas de calor de liquidez.

### [SRC-05] Market Microstructure & Order Flow Literature
- **Formato**: Publicaciones académicas y profesionales sobre microestructura de mercados financieros, desbalances de libros de órdenes y dinámica de ejecuciones de liquidez.

---

## 4. MAPEO DE FUENTES A CONCEPTOS BASELINE (`CONCEPT-01` a `CONCEPT-22`)

| Concepto ID | Nombre | Fuentes Primarias Directas | Fuentes Secundarias |
| :--- | :--- | :--- | :--- |
| `CONCEPT-01` | Swing High | `[SRC-01]` Month 2; `[SRC-04]` | Williams Fractals Paper |
| `CONCEPT-02` | Swing Low | `[SRC-01]` Month 2; `[SRC-04]` | Williams Fractals Paper |
| `CONCEPT-03` | Market Structure | `[SRC-01]` Month 2; `[SRC-02]` Ep 4 | `[SRC-04]` |
| `CONCEPT-04` | BOS | `[SRC-02]` Ep 4; `[SRC-03]` | `[SRC-04]` |
| `CONCEPT-05` | MSS | `[SRC-02]` Ep 1, 2, 4 | `[SRC-04]` |
| `CONCEPT-06` | BSL | `[SRC-01]` Month 3; `[SRC-02]` Ep 3 | `[SRC-05]` |
| `CONCEPT-07` | SSL | `[SRC-01]` Month 3; `[SRC-02]` Ep 3 | `[SRC-05]` |
| `CONCEPT-08` | Liquidity Level | `[SRC-01]` Month 3; `[SRC-03]` | `[SRC-04]` |
| `CONCEPT-09` | Liquidity Sweep | `[SRC-01]` Month 3; `[SRC-02]` Ep 2 | `[SRC-05]` |
| `CONCEPT-10` | Breakout | Classical Technical Analysis | `[SRC-04]` |
| `CONCEPT-11` | False Sweep | `[SRC-02]` Ep 15; `[SRC-03]` | `[SRC-04]` |
| `CONCEPT-12` | Displacement | `[SRC-02]` Ep 2 | `[SRC-04]` |
| `CONCEPT-13` | Fair Value Gap | `[SRC-01]` Month 2; `[SRC-02]` Ep 2 | `[SRC-04]` |
| `CONCEPT-14` | Order Block | `[SRC-01]` Month 4; `[SRC-02]` Ep 3 | `[SRC-04]` |
| `CONCEPT-15` | Premium | `[SRC-01]` Month 2 | `[SRC-04]` |
| `CONCEPT-16` | Discount | `[SRC-01]` Month 2 | `[SRC-04]` |
| `CONCEPT-17` | HTF Alignment | `[SRC-01]` Month 2 & 8; `[SRC-02]` | `[SRC-04]` |
| `CONCEPT-18` | Liquidity Target | `[SRC-01]` Month 3; `[SRC-02]` Ep 5 | `[SRC-04]` |
| `CONCEPT-19` | Model A | `[SRC-02]` Ep 12 (Silver Bullet) | `[SRC-04]` |
| `CONCEPT-20` | Model B | `[SRC-01]` Month 4 (AMD / Judas) | `[SRC-04]` |
| `CONCEPT-21` | Model C | `[SRC-02]` Ep 1-3 | `[SRC-04]` |
| `CONCEPT-22` | Setup State | Software Architecture Standards | `[SRC-04]` |
