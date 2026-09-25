# PHASE 5 — SPECIFICATION OF CONFIGURABLE ICT MODELS & DISPLACEMENT ENGINE

**Stage:** Checkpoint 5 (Configurable ICT Setup Models & Displacement)  
**Date:** 2026-09-25  
**Project:** ICT Assistant — TradeSea Platform  
**Architecture Status:** 100% Declarative Model Engine (No hardcoded setup rules)

---

## 1. OBJETIVO Y ARQUITECTURA GENERAL

El objetivo de la Fase 5 es reemplazar la regla rígida del motor de setups por un sistema de **Modelos ICT Configurables** declarativos (`ICTSetupModel`). El motor principal evalúa cualquier modelo registrado sin requerir cambios en el código fuente del orquestador.

```
                  [ CONFLUENCIAS Y EVENTOS ]
                               │
                               ▼
        ┌─────────────────────────────────────────────┐
        │  ICTSetupModel Declarativo                  │
        ├─────────────────────────────────────────────┤
        │ - sequenceMode: 'ORDERED' | 'UNORDERED'    │
        │ - maxBarsBetweenConditions: N              │
        │ - conditions: [REQUIRED, OPTIONAL, ...]     │
        └─────────────────────────────────────────────┘
                               │
                               ▼
               [ SetupEngine State Machine ]
      (WATCHING -> FORMING -> CONFIRMED -> EXPIRED/INVALIDATED)
```

---

## 2. DEFINICIÓN CUANTIFICABLE DE DISPLACEMENT (`DisplacementEngine.ts`)

Para eliminar cualquier lenguaje subjetivo ("vela grande", "desplazamiento fuerte"), el motor define **Displacement** mediante una fórmula matemática reproducible:

1. **Relación Cuerpo / Rango (`bodyRatio`)**:
   $$\text{bodyRatio} = \frac{|\text{close} - \text{open}|}{\text{high} - \text{low}} \ge 0.60 \quad (60\% \text{ o más del rango es cuerpo})$$

2. **Multiplicador de Rango sobre Promedio (`rangeMultiplier`)**:
   $$\text{rangeMultiplier} = \frac{\text{high} - \text{low}}{\text{Promedio Rango de } N \text{ velas previas}} \ge 1.50 \quad (1.5\text{x o superior al promedio})$$

Cuando una vela cumple ambas condiciones, el motor emite determinísticamente el evento `DISPLACEMENT`.

---

## 3. CLASIFICACIÓN DE CONDICIONES Y SECUENCIA DE EVALUACIÓN

Toda condición asociada a un `ICTSetupModel` pertenece a una de las siguientes categorías:

- **`REQUIRED`**: Obligatoria. Si falta una condición requerida, el setup NO puede pasar a `CONFIRMED`.
- **`OPTIONAL`**: Opcional. Su ausencia NO bloquea la confirmación del setup.
- **`INVALIDATING`**: Invalidante. Si ocurre, transiciona el setup a `INVALIDATED`.
- **`CONTEXT`**: Contextual (ej. alineación de tendencia HTF).

### Reglas de Secuencia de Evaluación:
- **`ORDERED`**: Exige que las condiciones requeridas ocurran en estricto orden cronológico ascendente ($\text{timestamp}_{C1} \le \text{timestamp}_{C2} \le \text{timestamp}_{C3}$).
- **`UNORDERED`**: Permite que las condiciones requeridas ocurran en cualquier orden temporal.
- **`maxBarsBetweenConditions`**: Define la cantidad máxima permitida de velas de separación entre el primer y último evento requerido. Si el span de velas supera el umbral, el setup transiciona a `EXPIRED`.

---

## 4. MODELOS PREDEFINIDOS DE EJEMPLO (`PredefinedModels.ts`)

Se construyeron 4 modelos declarativos de prueba para validar la arquitectura:

- **`MODEL_A_LONG` / `MODEL_A_SHORT`**: Liquidity Sweep ➔ MSS ➔ FVG (`ORDERED`, `maxBars: 25`).
- **`MODEL_B_LONG`**: Liquidity Sweep ➔ Displacement ➔ FVG (`ORDERED`, `maxBars: 20`).
- **`MODEL_C_LONG`**: HTF Align ➔ Sweep ➔ MSS ➔ FVG / OB ➔ Target (`UNORDERED`, `maxBars: 50`).

---

## 5. RESTRICCIÓN CUMPLIDA (LO QUE NO SE IMPLEMENTA AÚN)

En estricto cumplimiento de los requisitos del Checkpoint 5, **NO se implementaron**:
- ❌ Botones ni señales de `BUY` / `SELL`.
- ❌ Puntos de entrada operativos (`Entry`), Stop Loss o Take Profit.
- ❌ Cálculo operativo de Ratio Riesgo/Beneficio (R:R).
- ❌ Alertas de trading o ejecuciones de órdenes.
- ❌ Puntajes numéricos de probabilidad o porcentaje de acierto.
- ❌ Interfaz visual HUD definitiva.
