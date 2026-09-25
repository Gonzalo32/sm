# SPECIFICATION & COMPARISON OF ICT ORDER BLOCK DEFINITIONS

**File:** `core/ict/orderblocks/OrderBlockDefinition.md`  
**Date:** 2026-09-25  
**Project:** ICT Assistant — Deterministic Engine

---

## 1. INTRODUCCIÓN

En la teoría ICT (Inner Circle Trader) y Smart Money Concepts (SMC), el término **Order Block (OB)** se utiliza para identificar zonas institucionales donde los participantes de gran escala acumularon posiciones antes de una expansión drástica de precio.

Existen diversas interpretaciones técnicas y criterios matemáticos sobre qué constituye un Order Block válido. Este documento compara formalmente las tres variantes principales para permitir que el motor determinístico de la extensión configure y alterne entre reglas de identificación sin hardcodear definiciones arbitrarias.

---

## 2. COMPARATIVA DE VARIANTES DE REGLES DE ORDER BLOCK

### VARIANTE A: "Vela Contraria Clásica pre-Desplazamiento"
- **Definición**: La **última vela bajista** previa a un movimiento alcista fuerte (Bullish OB) o la **última vela alcista** previa a un movimiento bajista fuerte (Bearish OB).
- **Criterios de Identificación**:
  1. Identificar la vela opuesta previa a la ruptura.
  2. La vela siguiente debe causar ruptura de estructura (BOS o MSS).
- **Ventajas**: Algoritmo sencillo de implementar y muy popular en la literatura SMC inicial.
- **Desventajas**: Genera una cantidad excesiva de Order Blocks (falsos positivos) en mercados en rango sin desplazamiento real.

---

### VARIANTE B: "Order Block con Confluencia FVG (ICT Standard)"
- **Definición**: La última vela alcista/bajista que inicia el impulso y que genera inmediatamente un **Fair Value Gap (FVG)** en las siguientes 2 velas.
- **Criterios de Identificación**:
  1. Presencia de la vela de acumulación.
  2. Creación obligatoria de un **Bullish/Bearish FVG** adyacente (`Candle[1]` y `Candle[3]`).
  3. Desplazamiento confirmado con cierre por encima/debajo del rango inicial.
- **Ventajas**: Elimina más del 70% de falsos positivos. Alineado con la metodología estricta de Michael J. Huddleston (ICT).
- **Desventajas**: Menor frecuencia de ocurrencia.

---

### VARIANTE C: "Order Block de Barrido de Liquidez (Liquidity Sweep OB)"
- **Definición**: La vela que realiza un **barrido de liquidez** (un sweep sobre un Swing High/Low previo) y posteriormente genera un cambio de estructura (MSS).
- **Criterios de Identificación**:
  1. La vela toma liquidez BSL o SSL previo (mecha de barrido).
  2. Inmediatamente le sigue un desplazamiento opuesto y un cambio de estructura MSS.
- **Ventajas**: La zona con mayor tasa de reacción observada en estudios estadísticos.
- **Desventajas**: Requiere que la liquidez previa ya haya sido barrida de forma confirmada.

---

## 3. CICLO DE VIDA DE UN ORDER BLOCK EN EL MOTOR

Independientemente de la variante configurada, todo Order Block registrado por el motor transita por 4 estados estrictos:

```
[ UNTESTED ]  ---> (El precio toca el límite superior/inferior del OB) ---> [ TESTED ]
      |                                                                            |
      +---> (El precio penetra > 50% de la zona o mitigación completa) ----------> [ MITIGATED ]
      |                                                                            |
      +---> (El precio cierra por encima/debajo del extremo del OB) -------------> [ INVALIDATED ]
```

1. **UNTESTED**: Creado pero el precio no ha vuelto a reingresar a la zona del cuerpo/mecha de la vela.
2. **TESTED**: El precio reingresa a la zona del Order Block sin invalidarlo.
3. **MITIGATED**: El precio penetra el 50% o más del bloque (Mean Threshold / Consequent Encroachment).
4. **INVALIDATED**: El precio **cierra por completo** fuera del extremo opuesto del Order Block (inválido como zona de soporte/resistencia).

---

## 4. PARÁMETROS CONFIGURABLES PROPUESTOS EN `ICTConfig`

```typescript
export interface OrderBlockConfig {
  obVariant: 'CLASSIC' | 'FVG_CONFLUENCE' | 'LIQUIDITY_SWEEP';
  obZoneDefinition: 'FULL_CANDLE' | 'BODY_ONLY' | 'WICK_ONLY';
  obMitigationMode: 'TOUCH' | 'MEAN_THRESHOLD' | 'FULL_CLOSE';
  obRequireBOS: boolean;
}
```

---

## 5. RECOMENDACIÓN PARA EL MOTOR DETERMINÍSTICO

Se selecciona como configuración por defecto la **VARIANTE B (ICT Standard - FVG Confluence)** debido a su alto determinismo matemático y su directa integración con la detección de Fair Value Gaps desarrollada en la sección 6.
