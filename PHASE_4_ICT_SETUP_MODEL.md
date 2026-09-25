# PHASE 4 — SPECIFICATION OF THE ICT SETUP & CONFLUENCE DATA MODEL

**Stage:** Checkpoint 4 (Setup Concept & Confluence Data Model)  
**Date:** 2026-09-25  
**Project:** ICT Assistant — TradeSea Platform  
**Model Status:** 100% Deterministic Typed Data Model (No arbitrary win rate % or numeric scores)

---

## 1. OBJETIVO Y PRINCIPIOS

El objetivo del modelo de datos de Checkpoint 4 es estructurar formalmente las relaciones entre **Eventos Objetivos**, **Contexto de Mercado**, **Confluencias Tipadas** y la **Máquina de Estados de Setups**, manteniendo una separación limpia de responsabilidades antes de desarrollar componentes gráficos finales.

### Principio de Separación de Capas

```
        [ EVENTOS OBJETIVOS ]
  (BOS, MSS, Sweep, FVG, OB, Swings)
                 │
                 ▼
       [ CONTEXTO DE MERCADO ]
  (HTF/LTF Trend, Target Liquidity, PD Array)
                 │
                 ▼
       [ CONFLUENCIAS TIPADAS ]
  (Status: PRESENT / ABSENT / INVALIDATED)
                 │
                 ▼
      [ MÁQUINA DE ESTADOS SETUP ]
  (WATCHING -> FORMING -> CONFIRMED -> INVALIDATED)
```

---

## 2. DIVERGENCIA CON MODELOS NUMÉRICOS ARBITRARIOS

El sistema **NO UTILIZA** ni utilizará puntajes arbitrarios tipo `87/100` ni probabilidades ficticias como `BUY = 82%` o `SELL = 74%`.

En su lugar, toda confluencia es una entidad objetiva tipada:
```typescript
export interface ICTConfluence {
  id: string;
  type: ConfluenceType;
  status: 'PRESENT' | 'ABSENT' | 'INVALIDATED' | 'UNKNOWN';
  timestamp: number;
  timeframe: Timeframe;
  evidence: string[];
}
```

---

## 3. MÁQUINA DE ESTADOS DE UN SETUP (`SetupTypes.ts`)

Todo setup ICT transita por una máquina de estados determinística:

```
[ WATCHING ]  ---> (Barrido o MSS detectado) ------------> [ FORMING ]
     │                                                          │
     │                                        (Todas las confluencias obligatorias presentes)
     │                                                          │
     ▼                                                          ▼
[ INVALIDATED ] <--- (Ruptura de estructura contraria) --- [ CONFIRMED ]
```

1. **`WATCHING`**: El mercado está en una zona de interés, buscando barridos o estructura preliminar.
2. **`FORMING`**: Se ha producido un barrido de liquidez o un MSS preliminar; el setup se encuentra en desarrollo.
3. **`CONFIRMED`**: Todas las confluencias obligatorias (`LIQUIDITY_SWEEP` + `MSS_CONFIRMED` + `FVG_CONFLUENCE`) se encuentran presentes simultáneamente.
4. **`INVALIDATED`**: Se ha producido una condición invalidante (ejemplo: quiebre de estructura en sentido opuesto).
5. **`COMPLETED`**: El precio ha alcanzado el nivel de liquidez objetivo.
6. **`EXPIRED`**: El setup expiró sin confirmación tras un número determinado de velas.

---

## 4. PREVENCIÓN DE SESGO FUTURO (LOOK-AHEAD PREVENTION)

Todo setup evalúa sus condiciones utilizando únicamente la información disponible hasta la vela actual de evaluación:

- **`eventTimestamp`**: Momento en que ocurrió el patrón (ej. vela peak del swing).
- **`confirmationTimestamp`**: Momento en que el motor confirmó el patrón sin sesgo futuro.
- **`evaluationTimestamp`**: Momento en que el evaluador revisa el estado del setup.

Ningún FVG o MSS descubierto en la vela `N+k` puede modificar retrospectivamente el estado de un setup en la vela `N`.

---

## 5. MODELO DE DATOS PARA EL PANEL DE INFORMACIÓN (`MarketContextEngine.ts`)

Se diseñó la interfaz tipada `ICTMarketContext` que alimenta directamente al Panel Flotante HUD:

```typescript
export interface ICTMarketContext {
  symbol: string;
  htfTimeframe: Timeframe;
  ltfTimeframe: Timeframe;

  structure: {
    trend: string;
    lastBOS?: string;
    lastMSS?: string;
    structureState: string;
  };

  liquidity: {
    bslCount: number;
    sslCount: number;
    lastSweep?: string;
    nearestTarget?: string;
  };

  pdArray: {
    zone: string;
    equilibrium: number;
    activeFvgCount: number;
    activeObCount: number;
  };

  setup: {
    status: string;
    fulfilledConditions: string[];
    missingConditions: string[];
  };

  confluences: ICTConfluence[];
  setups: ICTSetup[];
}
```

---

## 6. ELEMENTOS NO IMPLEMENTADOS (RESTRICCIÓN CUMPLIDA)

En estricto cumplimiento de los requisitos del Checkpoint 4, **NO se implementaron**:
- ❌ Botones o señales de `BUY` / `SELL`.
- ❌ Puntos de entrada operativos (`Entry`), Stop Loss o Take Profit.
- ❌ Cálculo operativo de Ratio Riesgo/Beneficio (R:R).
- ❌ Alertas de trading o ejecuciones de órdenes.
- ❌ Automatización ni conexión con la cuenta del usuario.
