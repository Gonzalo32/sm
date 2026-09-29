# CP32.8 — CATALOG OF CONCEPTUAL AMBIGUITIES & CONFLICTS

> **Baseline Identifier**: `CP32.8-EXPERT-ICT-BASELINE-V1`  
> **Document Status**: Official Ambiguity Catalog  

---

## 1. INTRODUCCIÓN

En la metodología de Inner Circle Trader (ICT) y en la literatura general de Smart Money Concepts (SMC) no existe una única fuente canónica codificada que elimine totalmente la interpretación del operador. Distintas publicaciones, cursos, mentores y herramientas de software emplean variantes cuantitativas y conceptuales de los mismos patrones.

Este documento cataloga de forma transparente los puntos de controversia y establece la postura operativa adoptada para el V1 de este indicador, sin pretender imponer una "verdad universal".

---

## 2. CATEGORIZACIÓN OFICIAL DE CONFLICTOS

Usamos dos etiquetas formales para clasificar las discrepancias teóricas:

1. `DEFINICION_CONFLICTIVA`: Dos o más escuelas/interpretaciones bien definidas sostienen criterios explícitamente incompatibles sobre la misma figura geométrica.
2. `CONCEPTO_AMBIGUO`: El concepto carece de una definición matemática cuantitativa estricta y depende del juicio cualitativo o contexto del analista.

---

## 3. CATÁLOGO DETALLADO DE CASOS AMBIGUOS Y CONFLICTIVOS

### AMB-01: BOS y MSS — Ruptura por Cuerpo vs. Ruptura por Mecha (`DEFINICION_CONFLICTIVA`)

- **Interpretación A (Cuerpo - Body Close)**: Exige que el precio de cierre (`Close`) de la vela sobrepase el extremo del Swing High/Low previo. Si solo la mecha cruza el nivel, se considera un Liquidity Sweep o purga, no una ruptura de estructura.
- **Interpretación B (Mecha - Wick Penetration)**: Considera que cualquier penetración del nivel por el máximo (`High`) o mínimo (`Low`) constituye un rompimiento válido de estructura.
- **Diferencia**: La Interpretación A filtra falsas rupturas y trampas de volatilidad, pero puede demorar la detección del cambio de tendencia. La Interpretación B detecta giros más rápido pero genera señales falsas en eventos de purga de mecha.
- **Evidencia Documental**: En la 2022 Mentorship Series, ICT enfatiza repetidamente: *"Bodies tell the story, wicks hold the damage"*, respaldando el uso del cuerpo para cambios de estructura sostenidos.
- **Impacto en el Indicador**: Determina el momento exacto en que la Máquina de Estados cambia el Bias y detecta el MSS.
- **Decisión Operativa V1**: Se adopta la **Interpretación A (Cuerpo)** como regla estándar para BOS y MSS en V1.

---

### AMB-02: Order Block — Delimitación Geométrico-Conceptual (`DEFINICION_CONFLICTIVA`)

- **Interpretación A (Última Vela de Color Contrario)**: Define el OB estrictamente como la última vela bajista antes de un impulso alcista (o última vela alcista antes de un impulso bajista).
- **Interpretación B (Vela de Origen del FVG)**: Exige que el OB sea la vela específica que inicia la expansión y deja abierto el primer FVG, independientemente de su color.
- **Interpretación C (Cuerpo vs Rango Completo)**: Algunos operadores trazan la zona desde el $Open$ al $Close$ de la vela OB, mientras otros incluyen las mechas ($High$ a $Low$).
- **Diferencia**: La amplitud del rango del OB varia significativamente según la interpretación, alterando el punto exacto de entrada y el ratio Riesgo/Beneficio.
- **Impacto en el Indicador**: Afecta la precisión visual de la zona POI y la comprobación de la mitigación.
- **Decisión Operativa V1**: Se adopta la **Interpretación B+C (Vela contraria completa con mechas que produce Displacement + FVG)**.

---

### AMB-03: Fair Value Gap — Filtrado de Tamaño y Significancia (`CONCEPTO_AMBIGUO`)

- **Interpretación A (Gap Geométrico Puro)**: Cualquier espacio estrictamente mayor a 0 pips entre $High(V_1)$ y $Low(V_3)$ se clasifica como FVG.
- **Interpretación B (Gap Filtrado por ATR)**: Exige que la amplitud del espacio exceda un umbral mínimo proporcional a la volatilidad reciente del activo (ej. $0.5 \times ATR$).
- **Diferencia**: El enfoque puro genera decenas de micro-gaps insignificantes en marcos temporales bajos (1M/5M) debido a ruido de mercado.
- **Impacto en el Indicador**: Saturación visual del gráfico e incremento de zonas POI de baja probabilidad.
- **Decisión Operativa V1**: Se adopta la **Interpretación B** incorporando un parámetro de tamaño mínimo (`minFvgSizePoints`) para garantizar relevancia visual y estructural.

---

### AMB-04: Swing High/Low — Fractal Local vs. Swing Estructural Major (`CONCEPTO_AMBIGUO`)

- **Interpretación A (Fractal Fijo $N=2$)**: Cualquier vela de 5 barras con máximo/mínimo central es un Swing High/Low.
- **Interpretación B (Pivote Estructural Significativo)**: Solo se consideran Swings aquellos pivotes que rompieron una estructura previa o que representan extremos de piernas impulsivas completas (Major Swings).
- **Diferencia**: El enfoque A detecta numerosos sub-pivotes internos (Minor Structure), mientras que B filtra exclusivamente los límites del Dealing Range.
- **Impacto en el Indicador**: Define el mapa de estructura primaria vs estructura interna.
- **Decisión Operativa V1**: Se utiliza $N=2$ para la detección base de pivotes y se aplican filtros de validación de impulsos para jerarquizar la estructura primaria.

---

### AMB-05: Displacement — Evaluación Cualitativa vs Cuantitativa (`CONCEPTO_AMBIGUO`)

- **Interpretación A (Evaluación Cualitativa ICT)**: El desplazamiento es una "expansión con energía" evidente a la vista del operador.
- **Interpretación B (Métrica Algorítmica)**: Medición por ratio de cuerpo (`bodyRatio >= 0.65`) y multiplicador del rango promedio de velas.
- **Diferencia**: Traducir la percepción de "energía" a reglas binarias de software requiere establecer puntos de corte discretos.
- **Impacto en el Indicador**: Validación de MSS y legitimidad de los FVG/OB.
- **Decisión Operativa V1**: Se fija la regla algorítmica explícita basada en `bodyRatio` y expansión sobre la media de rangos recientes.

---

### AMB-06: Liquidity Sweep vs Breakout Continuativo (`CONCEPTO_AMBIGUO`)

- **Interpretación A**: Un cruce del nivel por mecha con cierre por dentro es automáticamente un Sweep.
- **Interpretación B**: Si la mecha es extremadamente profunda (ej. $> 3 \times ATR$), puede constituir una falla de contención o Breakout violento con retrazado ulterior.
- **Impacto en el Indicador**: Distinción de señales de reversión temprana.
- **Decisión Operativa V1**: Se clasifica preliminarmente como Sweep si el cuerpo cierra dentro del rango y no genera BOS en las siguientes 2 velas.

---

## 4. REGISTRO DE DECISIONES DE OPERATIVIDAD BASELINE

| Ambigüedad ID | Concepto Afectado | Clasificación | Postura Operativa V1 Adoptada |
| :--- | :--- | :--- | :--- |
| `AMB-01` | BOS / MSS | `DEFINICION_CONFLICTIVA` | Ruptura obligatoria por Cierre de Cuerpo (`Close`) |
| `AMB-02` | Order Block | `DEFINICION_CONFLICTIVA` | Vela completa previa a expansión con FVG |
| `AMB-03` | FVG | `CONCEPTO_AMBIGUO` | Gap de 3 velas filtrado por tamaño mínimo de puntos |
| `AMB-04` | Swing High / Low | `CONCEPTO_AMBIGUO` | Fractal de 5 velas ($N=2$) como geometría base |
| `AMB-05` | Displacement | `CONCEPTO_AMBIGUO` | Métrica de `bodyRatio >= 0.65` y expansión de rango |
| `AMB-06` | Liquidity Sweep | `CONCEPTO_AMBIGUO` | Penetración por mecha + cierre interno en el nivel |
