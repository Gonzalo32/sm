# CP32.8 — OPERATIONAL RULES & DISCREPANCY TAXONOMY

> **Baseline Identifier**: `CP32.8-EXPERT-ICT-BASELINE-V1`  
> **Document Status**: Official Operational Rules  

---

## 1. PRINCIPIOS DE FORMULACIÓN OPERATIVA

Las reglas operativas especificadas en este documento actúan como el puente entre la definición conceptual pura (documentada en `02_DEFINITIONS.md`) y la futura validación o evaluación de cualquier detector.

### Reglas de Separación
1. **Independencia del Código**: Ninguna regla operativa puede apelar a nombres de clases, métodos, variables o resultados de ejecución del proyecto (`ICTEngine`, `StructureEngine`, etc.).
2. **Determinismo Geométrico**: Toda regla debe expresarse en función de elementos observables de la serie de tiempo de velas: $Open_t, High_t, Low_t, Close_t, Volume_t, Timestamp_t$.
3. **Congelación de Parámetros**: No se introducen valores numéricos arbitrarios ni optimizaciones en la producción. Los valores citados representan la especificación operativa adoptada para V1.

---

## 2. REGLAS OPERATIVAS DETALLADAS POR CONCEPTO

### OP-01: Swing High ($N=2$)
Una vela en el índice $k$ se declara **Swing High** si y solo si:
$$\begin{cases} 
High_k > High_{k-1} \quad \text{y} \quad High_k > High_{k-2} \\
High_k > High_{k+1} \quad \text{y} \quad High_k > High_{k+2} 
\end{cases}$$
*Nota*: Requiere que la vela $k+2$ esté completamente cerrada.

### OP-02: Swing Low ($N=2$)
Una vela en el índice $k$ se declara **Swing Low** si y solo si:
$$\begin{cases} 
Low_k < Low_{k-1} \quad \text{y} \quad Low_k < Low_{k-2} \\
Low_k < Low_{k+1} \quad \text{y} \quad Low_k < Low_{k+2} 
\end{cases}$$

### OP-03: Market Structure Bias
- **Bias Alcista**: Inicializado cuando ocurre un MSS Alcista o BOS Alcista. Se invalida únicamente cuando ocurre un MSS Bajista.
- **Bias Bajista**: Inicializado cuando ocurre un MSS Bajista o BOS Bajista. Se invalida únicamente cuando ocurre un MSS Alcista.

### OP-04: BOS (Break of Structure)
- **BOS Alcista**: Ocurre en la vela $t$ si la estructura actual es Alcista y $Close_t > High_{swing\_previo}$.
- **BOS Bajista**: Ocurre en la vela $t$ si la estructura actual es Bajista y $Close_t < Low_{swing\_previo}$.

### OP-05: MSS (Market Structure Shift)
- **MSS Alcista**: Ocurre en la vela $t$ en un contexto previo Bajista o Neutral cuando $Close_t > High_{swing\_bajista\_clave}$.
- **MSS Bajista**: Ocurre en la vela $t$ en un contexto previo Alcista o Neutral cuando $Close_t < Low_{swing\_alcista\_clave}$.

### OP-06: BSL (Buy Side Liquidity)
Se ubica una zona BSL horizontal en el nivel $P_{BSL} = High_{swing}$ para todo Swing High que no haya sido penetrado por el $High$ de ninguna vela posterior.

### OP-07: SSL (Sell Side Liquidity)
Se ubica una zona SSL horizontal en el nivel $P_{SSL} = Low_{swing}$ para todo Swing Low que no haya sido penetrado por el $Low$ de ninguna vela posterior.

### OP-08: Liquidity Level (EQH / EQL)
- **Equal Highs (EQH)**: Ocurre si dos Swing Highs $H_A$ y $H_B$ cumplen $\frac{|H_A - H_B|}{\min(H_A, H_B)} \le 0.0005$ ($0.05\%$).
- **Equal Lows (EQL)**: Ocurre si dos Swing Lows $L_A$ y $L_B$ cumplen $\frac{|L_A - L_B|}{\min(L_A, L_B)} \le 0.0005$.

### OP-09: Liquidity Sweep
- **Sweep de BSL**: En la vela $t$, si $High_t > P_{BSL}$ y $Close_t \le P_{BSL}$.
- **Sweep de SSL**: En la vela $t$, si $Low_t < P_{SSL}$ y $Close_t \ge P_{SSL}$.

### OP-10: Breakout
En la vela $t$, se registra Breakout si $Close_t > P_{nivel}$ (alcista) o $Close_t < P_{nivel}$ (bajista) con $Range_{cuerpo} \ge 0.60 \times Range_{total}$ y la vela $t+1$ confirma sosteniendo el precio fuera del nivel.

### OP-11: False Sweep (`CONCEPTO_AMBIGUO`)
Se clasifica como False Sweep si tras detectarse un Liquidity Sweep en la vela $t$, el precio no genera un MSS ni un FVG en sentido opuesto en las siguientes $M=5$ velas y posteriormente rompe con cuerpo el extremo del barrido.

### OP-12: Displacement
Una vela $t$ se define con Desplazamiento si:
1. $Body_t = |Close_t - Open_t| \ge 0.65 \times (High_t - Low_t)$
2. $(High_t - Low_t) > 1.5 \times \text{SMA}(High - Low, 10)_t$
3. Genera o participa en la creación de un FVG en la secuencia $t-1, t, t+1$.

### OP-13: Fair Value Gap (FVG)
- **FVG Alcista**: En el triplete de velas $(t-2, t-1, t)$, si $Low_t - High_{t-2} \ge \text{minFvgSize}$. Zona gap: $[High_{t-2}, Low_t]$.
- **FVG Bajista**: En el triplete $(t-2, t-1, t)$, si $Low_{t-2} - High_t \ge \text{minFvgSize}$. Zona gap: $[High_t, Low_{t-2}]$.

### OP-14: Order Block (OB) (`DEFINICION_CONFLICTIVA`)
- **OB Alcista**: La última vela con $Close < Open$ previa al movimiento de Desplazamiento que genera un MSS Alcista y un FVG Alcista. Rango: $[Low_{ob}, High_{ob}]$.
- **OB Bajista**: La última vela con $Close > Open$ previa al movimiento de Desplazamiento que genera un MSS Bajista y un FVG Bajista. Rango: $[Low_{ob}, High_{ob}]$.

### OP-15: Premium Zone
Dada una leg estructural definida entre $Low_{swing}$ y $High_{swing}$:
$$\text{Equilibrio } (EQ) = Low_{swing} + 0.5 \times (High_{swing} - Low_{swing})$$
$$\text{Zona Premium} = \{ P \mid EQ \le P \le High_{swing} \}$$

### OP-16: Discount Zone
$$\text{Zona Discount} = \{ P \mid Low_{swing} \le P \le EQ \}$$

### OP-17: HTF Alignment
Regla de coincidencia:
$$\text{HTF\_Aligned} = \begin{cases} 
\text{true} & \text{si Bias}_{HTF} == \text{Direction}_{Setup\_LTF} \\
\text{false} & \text{en caso contrario}
\end{cases}$$

### OP-18: Liquidity Target
- Para Setup Alcista: El nivel BSL o Swing High no mitigado más cercano en la dirección alcista.
- Para Setup Bajista: El nivel SSL o Swing Low no mitigado más cercano en la dirección bajista.

### OP-19: Model A (Silver Bullet / Reversion)
Secuencia temporal estricta en el gráfico:
1. $t_1$: `Liquidity Sweep` de BSL o SSL.
2. $t_2 > t_1$: `MSS` en dirección opuesta al barrido.
3. $t_3 \ge t_2$: `FVG` creado durante el desplazamiento del MSS.

### OP-20: Model B (Judas Swing / Open Expansion)
Secuencia temporal estricta:
1. $t_1$: Rango estrecho de acumulación (Asian Range).
2. $t_2$: Falsa ruptura (Judas Swing) rompiendo el máximo/mínimo del Asian Range hacia un POI HTF.
3. $t_3$: `MSS` + `FVG` de reversión expandiendo en dirección contraria a la manipulación.

### OP-21: Model C (BOS + FVG/OB Continuation)
Secuencia temporal estricta:
1. $t_1$: Ruptura de estructura `BOS` o `MSS` con `Displacement`.
2. $t_2$: Identificación de `FVG` o `Order Block` activo.
3. $t_3$: `Retest` (el precio toca la zona del FVG o OB en zona Discount para compras o Premium para ventas).

### OP-22: Setup State Machine
Reglas formales de transición de la Máquina de Estados:
- `NONE` $\rightarrow$ `FORMING`: Cuando se detecta el primer evento constitutivo (Sweep o BOS).
- `FORMING` $\rightarrow$ `READY`: Cuando se confirma el MSS y existe un FVG/OB activo pendiente de retesteo.
- `READY` $\rightarrow$ `ACTIVE`: En la vela donde $Low_t \le High_{POI}$ (para compra en POI) o $High_t \ge Low_{POI}$ (para venta en POI).
- `ACTIVE` $\rightarrow$ `COMPLETED`: Si el precio alcanza el `Liquidity Target` antes de invalidez.
- `ACTIVE` | `READY` $\rightarrow$ `INVALIDATED`: Si el precio vulnera el nivel de invalidación (ej. rompe la raíz del OB o el Swing origin).

---

## 3. TAXONOMÍA OFICIAL DE DISCREPANCIAS

Toda diferencia o divergencia observada en auditorías conceptuales futuras entre la expectativa teórica y los resultados observados DEBE clasificarse obligatoriamente bajo una de las siguientes 6 categorías:

| Código | Categoría | Descripción y Criterio de Asignación |
| :--- | :--- | :--- |
| **A** | **Implementación Incorrecta** | El motor de código no ejecuta correctamente la regla operativa adoptada (bug de lógica o software). |
| **B** | **Definición Operativa Incorrecta** | La regla operativa adoptada contiene un fallo de especificación técnica o geométrica que requiere revisión. |
| **C** | **Ambigüedad Conceptual Real** | El caso cae en una zona gris teórica documentada donde existen múltiples interpretaciones válidas sin consenso único (`CONCEPTO_AMBIGUO`). |
| **D** | **Datos Insuficientes** | La serie temporal o el histórico de velas es incompleto para evaluar con certeza el cumplimiento de la regla. |
| **E** | **Fuera del Alcance V1** | El comportamiento observado pertenece a una variante avanzada de ICT/SMC no incluida en la especificación V1. |
| **F** | **Diferencia de Interpretación ICT/SMC** | Discrepancia legítima entre la corriente estricta ICT y otras escuelas SMC (ej. Cuerpo vs Mecha en BOS). |

*Ninguna discrepancia se atribuirá automáticamente al usuario ni se usará para alterar la producción de forma no controlada.*
