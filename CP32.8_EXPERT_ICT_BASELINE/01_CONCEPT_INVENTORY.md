# CP32.8 — CONCEPT INVENTORY: INDEPENDENT EXPERT ICT/SMC BASELINE

> **Baseline Identifier**: `CP32.8-EXPERT-ICT-BASELINE-V1`  
> **Authority Level**: Independent Conceptual Baseline (User = Product Owner / Antigravity = Implementer & Auditor)  
> **Status**: FROZEN / CONCEPTUAL REFERENCE  

---

## 1. INTRODUCCIÓN Y ARQUITECTURA DE VALIDACIÓN

El propósito del Checkpoint 32.8 es establecer un baseline conceptual de ICT (Inner Circle Trader) y SMC (Smart Money Concepts) totalmente independiente de la implementación en código y del juicio directo del usuario o del asistente de IA.

### 1.1 Separación de Responsabilidades
- **Usuario (Product Owner)**: Decide prioridades de producto, experiencia de usuario (UX), componentes visuales, colores, interfaz de usuario (HUD), temporalidades deseadas y alcance funcional general. **NO** actúa como autoridad para validar si la lógica conceptual de ICT/SMC es correcta o incorrecta.
- **Antigravity (Implementador & Auditor)**: Responsable del desarrollo de código, ejecución de pruebas automáticas, generación de datasets, rejuegues históricos (replay), auditoría mecánica e integridad de la compilación. **NO** se constituye en juez ni autorreferencia de la validez de sus propias definiciones.
- **Línea de Base Conceptual Independiente**: Proporciona las definiciones formales, evidencia necesaria, reglas operativas, ambigüedades documentadas y literatura de referencia previa a cualquier evaluación del motor (`ICTEngine`).

### 1.2 Flujo de Dominio ObligatorIO
```
CONCEPTO
  ↓
DEFINICIÓN
  ↓
REGLA OPERATIVA
  ↓
EVIDENCIA
  ↓
IMPLEMENTACIÓN (FUTURA)
  ↓
VALIDACIÓN
```
*Queda expresamente prohibido evaluar la corrección de un concepto a partir de la salida del propio motor.*

---

## 2. INVENTARIO COMPLETO DE CONCEPTOS (22 CONCEPTOS V1)

A continuación se detalla la lista oficial de los 22 conceptos fundamentales de ICT/SMC documentados de forma exhaustiva en este baseline:

| ID | Concepto | Nombre Oficial | Estado Baseline | Categoría | Nivel de Confianza |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `CONCEPT-01` | Swing High | Swing High / Pivote Alcista | Definido | Estructura / Geometría | Alto (Consenso) |
| `CONCEPT-02` | Swing Low | Swing Low / Pivote Bajista | Definido | Estructura / Geometría | Alto (Consenso) |
| `CONCEPT-03` | Market Structure | Estructura de Mercado | Definido / Regla Operativa | Estructura | Alto (Consenso) |
| `CONCEPT-04` | BOS | Break of Structure | Conflictivo (Cuerpo vs Mecha) | Estructura | Medio (Doble Interpretación) |
| `CONCEPT-05` | MSS | Market Structure Shift | Conflictivo (Cuerpo vs Mecha) | Transición Estructural | Medio (Doble Interpretación) |
| `CONCEPT-06` | BSL | Buy Side Liquidity | Definido | Liquidez | Alto (Consenso) |
| `CONCEPT-07` | SSL | Sell Side Liquidity | Definido | Liquidez | Alto (Consenso) |
| `CONCEPT-08` | Liquidity Level | Nivel de Liquidez / Equal Highs-Lows | Definido | Liquidez | Alto (Consenso) |
| `CONCEPT-09` | Liquidity Sweep | Barrido de Liquidez | Definido / Regla Operativa | Liquidez / Dinámica | Alto (Consenso) |
| `CONCEPT-10` | Breakout | Ruptura de Continuación | Definido / Ambiguo | Dinámica | Medio |
| `CONCEPT-11` | False Sweep | Falso Barrido / Falsa Ruptura | Ambiguo (`CONCEPTO_AMBIGUO`) | Dinámica | Medio |
| `CONCEPT-12` | Displacement | Desplazamiento / Expansión | Definido / Regla Operativa | Impulso | Medio (Parámetros) |
| `CONCEPT-13` | Fair Value Gap | Fair Value Gap (FVG) / Desbalance | Definido / Regla Operativa | Ineficiencia | Alto (Consenso) |
| `CONCEPT-14` | Order Block | Order Block (OB) / Bloque de Órdenes | Conflictivo (`DEFINICION_CONFLICTIVA`) | Zona Institucional | Medio (Múltiples Variantes) |
| `CONCEPT-15` | Premium | Zona Premium | Definido | Rango Fibo / Precio | Alto (Consenso) |
| `CONCEPT-16` | Discount | Zona Discount | Definido | Rango Fibo / Precio | Alto (Consenso) |
| `CONCEPT-17` | HTF Alignment | Alineación Multi-Timeframe (HTF) | Definido | Contexto Macro | Alto (Consenso) |
| `CONCEPT-18` | Liquidity Target | Objetivo de Liquidez / TP Objetivo | Definido | Proyección / Objetivo | Alto (Consenso) |
| `CONCEPT-19` | Model A | ICT Model A (Silver Bullet / Turtle Soup) | Definido / Regla Operativa | Modelo de Setup | Medio (Sujeto a Horarios) |
| `CONCEPT-20` | Model B | ICT Model B (Judas Swing / Expansion) | Definido / Regla Operativa | Modelo de Setup | Medio (Sujeto a Sesiones) |
| `CONCEPT-21` | Model C | ICT Model C (MSS + FVG + OB Retest) | Definido / Regla Operativa | Modelo de Setup | Alto (Estándar SMC) |
| `CONCEPT-22` | Setup State | Estado de Setup (Ciclo de Vida) | Definido | Máquina de Estados | Alto (Consenso Sistémico) |

---

## 3. RESUMEN DE CLASIFICACIÓN DE CONFLICTOS Y AMBIGÜEDADES

1. **Definiciones Conflictivas (`DEFINICION_CONFLICTIVA`)**:
   - `CONCEPT-04` (BOS) y `CONCEPT-05` (MSS): Ruptura por cierre de cuerpo (`Body Close`) vs. Penetración por mecha (`Wick Sweep`).
   - `CONCEPT-14` (Order Block): Última vela contraria previa al impulso vs. Toda la zona de consolidación vs. Vela específica que origina un FVG.

2. **Conceptos Ambiguos (`CONCEPTO_AMBIGUO`)**:
   - `CONCEPT-11` (False Sweep): Distinción entre un barrido legitimo de trampa (Turtle Soup) y un desbordamiento por alta volatilidad sin reversión instantánea.
   - `CONCEPT-10` (Breakout): Frontera técnica entre un Breakout genuino y un barrido de liquidez de temporalidad superior.

---

## 4. DOCUMENTOS ASOCIADOS EN CP32.8

- `01_CONCEPT_INVENTORY.md` (Este documento): Matriz y resumen general de conceptos.
- `02_DEFINITIONS.md`: Documentación detallada de los 22 conceptos bajo la plantilla estricta de 13 secciones.
- `03_OPERATIONAL_RULES.md`: Reglas algorítmicas independientes de implementación y taxonomía de discrepancias (A-F).
- `04_AMBIGUITIES.md`: Catálogo profundo de controversias y decisiones tomadas.
- `05_SOURCE_REGISTRY.md`: Registro de fuentes documentales oficiales de ICT/SMC.
- `06_CASE_REVIEW.md`: Protocolo de Blind Review y metodología de auditoría independiente.
- `07_DECISION_LOG.md`: Registro histórico de decisiones del baseline CP32.8.
