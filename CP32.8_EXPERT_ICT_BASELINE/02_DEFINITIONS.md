# CP32.8 — CONCEPT DEFINITIONS: INDEPENDENT EXPERT ICT/SMC BASELINE

> **Baseline Identifier**: `CP32.8-EXPERT-ICT-BASELINE-V1`  
> **Document Status**: Official Conceptual Baseline  

---

## INTRODUCCIÓN

Este documento contiene la especificación formal e independiente de los 22 conceptos fundamentales de ICT/SMC para la versión V1. Cada concepto está documentado utilizando estrictamente la estructura reglamentaria de 13 secciones obligatorias.

---

### CONCEPT-01: SWING HIGH

#### 1. CONCEPT ID
`CONCEPT-01`

#### 2. NOMBRE
Swing High (Pivote Alcista / Máximo Relativo)

#### 3. DEFINICIÓN
Un Swing High es un patrón de máximos en el cual una vela central presenta el máximo más alto de una secuencia, flanqueada por al menos $N$ velas consecutivas a la izquierda y $N$ velas consecutivas a la derecha con máximos estrictamente menores.

#### 4. EVIDENCIA NECESARIA
- Serie temporal de velas con precios High ($H_t$).
- Confirmación de $N$ velas previas y $N$ velas posteriores completas (cerradas) sin que ningún $H$ supere al pivote.

#### 5. CONDICIONES NECESARIAS
- $H_t > H_{t-i}$ para todo $i \in \{1, \dots, N\}$.
- $H_t > H_{t+j}$ para todo $j \in \{1, \dots, N\}$.
- La vela pivote debe estar totalmente cerrada.

#### 6. CONDICIONES INSUFICIENTES
- Un incremento repentino de volumen sin confirmación geométrica de máximos descendentes flanqueantes.
- Un máximo alcanzado por una vela en formación (live candle) aún no cerrada.

#### 7. CONTRAEJEMPLOS
- Un máximo donde la vela siguiente ($t+1$) empata exactamente en precio ($H_{t+1} = H_t$) forma un *Equal High* o doble techo local, no un Swing High aislado simple de $N=2$.

#### 8. INTERPRETACIONES ALTERNATIVAS
- **Interpretación A (Fractal Estándar)**: $N=2$ (Patrón clásico Williams / ICT de 5 velas).
- **Interpretación B (Estructura Mayor)**: $N=3$ o $N=5$ para identificar pivotes de mayor rango o swing estructural.

#### 9. AMBIGÜEDADES
- Comportamiento en mechas idénticas al mismo nivel exacto (Equal Highs vs Swing High desplazado).

#### 10. REGLA OPERATIVA PROPUESTA
Para este indicador se adopta la definición operativa de fractal $N=2$: Una vela $k$ es Swing High si $H_k > H_{k-2}, H_k > H_{k-1}, H_k > H_{k+1}$ y $H_k > H_{k+2}$.

#### 11. IMPACTO EN EL INDICADOR
Sirve como el punto de referencia superior para mapear estructura de mercado, trazar Premium/Discount y definir niveles de Buy Side Liquidity (BSL).

#### 12. FUENTES
- ICT Core Content Month 2 (Market Structure & Fractals).
- Williams Fractal Indicator Specifications.

#### 13. NIVEL DE CONFIANZA
Alto (Consenso en la comunidad técnico-financiera).

---

### CONCEPT-02: SWING LOW

#### 1. CONCEPT ID
`CONCEPT-02`

#### 2. NOMBRE
Swing Low (Pivote Bajista / Mínimo Relativo)

#### 3. DEFINICIÓN
Un Swing Low es un patrón de mínimos en el cual una vela central presenta el mínimo más bajo de una secuencia, flanqueada por al menos $N$ velas a la izquierda y $N$ velas a la derecha con mínimos estrictamente mayores.

#### 4. EVIDENCIA NECESARIA
- Serie temporal de precios Low ($L_t$).
- Confirmación geométrica de $N$ velas anteriores y posteriores cerradas con mínimos más altos.

#### 5. CONDICIONES NECESARIAS
- $L_t < L_{t-i}$ para todo $i \in \{1, \dots, N\}$.
- $L_t < L_{t+j}$ para todo $j \in \{1, \dots, N\}$.

#### 6. CONDICIONES INSUFICIENTES
- Vela alcista de fuerte rango sin que la estructura previa y posterior confirme el valle.

#### 7. CONTRAEJEMPLOS
- Dos velas consecutivas con el mismo mínimo ($L_t = L_{t+1}$), constituyendo *Equal Lows*.

#### 8. INTERPRETACIONES ALTERNATIVAS
- **Interpretación A**: $N=2$ (Fractal 5 velas).
- **Interpretación B**: $N=3$ o mayor para análisis estructural macro.

#### 9. AMBIGÜEDADES
- Tratamiento de mechas de volatilidad en noticias macroeconómicas.

#### 10. REGLA OPERATIVA PROPUESTA
Para este indicador se adopta la definición operativa de fractal $N=2$: Vela $k$ con $L_k < L_{k-2}, L_{k-1}, L_{k+1}, L_{k+2}$.

#### 11. IMPACTO EN EL INDICADOR
Utilizado para establecer soportes estructurales, medir zonas Discount y ubicar Sell Side Liquidity (SSL).

#### 12. FUENTES
- ICT Core Content Month 2.

#### 13. NIVEL DE CONFIANZA
Alto.

---

### CONCEPT-03: MARKET STRUCTURE

#### 1. CONCEPT ID
`CONCEPT-03`

#### 2. NOMBRE
Market Structure (Estructura de Mercado / Flujo de Estructura)

#### 3. DEFINICIÓN
La alineación secuencial de Swing Highs y Swing Lows que determina la dirección prevaleciente del mercado en una tendencia alcista (Higher Highs + Higher Lows), bajista (Lower Highs + Lower Lows) o rango/consolidación.

#### 4. EVIDENCIA NECESARIA
- Secuencia cronológica de Swing Highs y Swing Lows confirmados.

#### 5. CONDICIONES NECESARIAS
- Tendencia Alcista: Serie continua donde cada nuevo Swing High supera al anterior y cada Swing Low es superior al previo.
- Tendencia Bajista: Serie continua donde cada nuevo Swing Low perfora al anterior y cada Swing High es inferior al previo.

#### 6. CONDICIONES INSUFICIENTES
- Movimiento de una sola vela en una dirección sin romper pivotes clave preexistentes.

#### 7. CONTRAEJEMPLOS
- Movimiento lateral dentro de un rango sin superar ni romper los pivotes exteriores de la estructura.

#### 8. INTERPRETACIONES ALTERNATIVAS
- **Estructura Interna (Minor Structure)**: Evaluada en temporalidades menores (LTF).
- **Estructura Swing (Major Structure)**: Evaluada en temporalidades superiores (HTF).

#### 9. AMBIGÜEDADES
- Determinación de cuál pivote específico define la estructura principal cuando existen múltiples sub-pivotes dentro de una leg.

#### 10. REGLA OPERATIVA PROPUESTA
Para este indicador se adopta esta definición operativa: La estructura se mantiene alcista mientras el último Swing Low estructural no sea roto por la acción del precio posterior, y bajista mientras el último Swing High no sea superado.

#### 11. IMPACTO EN EL INDICADOR
Es la columna vertebral que dicta la dirección del sesgo (Bias) y filtra la validez de los setups.

#### 12. FUENTES
- ICT Core Content Month 2 & 2022 Mentorship Episode 1-5.

#### 13. NIVEL DE CONFIANZA
Alto.

---

### CONCEPT-04: BOS (BREAK OF STRUCTURE)

#### 1. CONCEPT ID
`CONCEPT-04`

#### 2. NOMBRE
BOS (Break of Structure / Ruptura Estructural de Continuación)

#### 3. DEFINICIÓN
La vulneración de un Swing High previo (en tendencia alcista) o de un Swing Low previo (en tendencia bajista) que confirma la continuidad de la tendencia prevaleciente.

#### 4. EVIDENCIA NECESARIA
- Un Swing High / Low estructural previamente identificado.
- Vela posterior cuyo precio cruza el nivel de dicho Swing.

#### 5. CONDICIONES NECESARIAS
- La ruptura debe ocurrir en la misma dirección de la estructura existente.

#### 6. CONDICIONES INSUFICIENTES
- Penetración temporal de una mecha que se retrae y cierra dentro del rango previo (clasificado en su lugar como Liquidity Sweep).

#### 7. CONTRAEJEMPLOS
- Ruptura del pivote en sentido contrario a la tendencia (clasificado como MSS, no BOS).

#### 8. INTERPRETACIONES ALTERNATIVAS (`DEFINICION_CONFLICTIVA`)
- **Interpretación A (Estricta ICT)**: Requiere cierre de cuerpo (`Close > Swing High` o `Close < Swing Low`).
- **Interpretación B (SMC Permisiva)**: Considera ruptura con cualquier mecha (`High > Swing High` o `Low < Swing Low`).

#### 9. AMBIGÜEDADES
- Divergencia cuando una mecha excede el pivote por menos de 1 pip pero el cuerpo cierra dentro.

#### 10. REGLA OPERATIVA PROPUESTA
Para este indicador se adopta esta definición operativa: Se requiere cierre de cuerpo de la vela (`Close`) por encima del Swing High previo para BOS Alcista, o por debajo del Swing Low previo para BOS Bajista.

#### 11. IMPACTO EN EL INDICADOR
Reconfirma la validez del sesgo tendencial y actualiza los límites del rango operativo (Trading Range).

#### 12. FUENTES
- ICT 2022 Mentorship; Smart Money Concepts Literature.

#### 13. NIVEL DE CONFIANZA
Medio (Debido al debate Cuerpo vs Mecha).

---

### CONCEPT-05: MSS (MARKET STRUCTURE SHIFT)

#### 1. CONCEPT ID
`CONCEPT-05`

#### 2. NOMBRE
MSS (Market Structure Shift / Cambio de Estructura de Mercado)

#### 3. DEFINICIÓN
El primer rompimiento de un Swing Low relevante en una tendencia alcista, o de un Swing High relevante en una tendencia bajista, acompañado típicamente de desplazamiento, señalando una posible inversión de la tendencia.

#### 4. EVIDENCIA NECESARIA
- Existencia de una estructura definida previa.
- Ruptura del pivote opuesto clave con fuerte vela de expansión.

#### 5. CONDICIONES NECESARIAS
- En tendencia alcista previo: Cierre de vela por debajo del Swing Low que originó el último máximo.
- En tendencia bajista previo: Cierre de vela por encima del Swing High que originó el último mínimo.

#### 6. CONDICIONES INSUFICIENTES
- Una mecha rápida que toma la liquidez del pivote y retrocede inmediatamente cerrando por encima (Sweep).

#### 7. CONTRAEJEMPLOS
- Ruptura de un sub-pivote interno menor que no representa el punto de inflexión estructural de la leg.

#### 8. INTERPRETACIONES ALTERNATIVAS (`DEFINICION_CONFLICTIVA`)
- **Interpretación A (ICT Standard)**: Exige cierre de cuerpo + desplazamiento que genera Fair Value Gap.
- **Interpretación B**: Considera MSS cualquier penetración de mecha en LTF.

#### 9. AMBIGÜEDADES
- Selección del Swing Low/High exacto que actúa como "nivel de invalidación de estructura" cuando hay valles múltiples.

#### 10. REGLA OPERATIVA PROPUESTA
Para este indicador se adopta esta definición operativa: MSS ocurre cuando el precio cierra con cuerpo (`Close`) superando el pivote estructural opuesto más reciente, validado si existe desplazamiento contiguo.

#### 11. IMPACTO EN EL INDICADOR
Desencadena el cambio de estado en la máquina de setups (transición de neutral a alcista/bajista).

#### 12. FUENTES
- ICT 2022 Mentorship Model.

#### 13. NIVEL DE CONFIANZA
Alto en presencia de desplazamiento; Medio sin él.

---

### CONCEPT-06: BSL (BUY SIDE LIQUIDITY)

#### 1. CONCEPT ID
`CONCEPT-06`

#### 2. NOMBRE
BSL (Buy Side Liquidity / Liquidez de Compradores)

#### 3. DEFINICIÓN
Concentración de órdenes de compra en forma de Stop-Loss de posiciones cortas (Buy Stops) o Buy Stop orders colocadas por encima de máximos clave (Swing Highs, Equal Highs, Máximos Diarios/Semanales).

#### 4. EVIDENCIA NECESARIA
- Niveles de precios identificados por encima de picos o máximos de sesión.

#### 5. CONDICIONES NECESARIAS
- Existencia de un Swing High previo no penetrado o un conjunto de máximos al mismo nivel.

#### 6. CONDICIONES INSUFICIENTES
- Zonas de precios arbitrarias dentro de una vela sin máximos de referencia previos.

#### 7. CONTRAEJEMPLOS
- Precios por debajo de mínimos del mercado (eso es SSL).

#### 8. INTERPRETACIONES ALTERNATIVAS
- **Interpretación A**: Solo considera Swing Highs formales.
- **Interpretación B**: Incluye cualquier máximo intradía de sesión (Asian High, London High).

#### 9. AMBIGÜEDADES
- Tolerancia exacta en pips para considerar dos máximos como "Equal Highs" (EQH).

#### 10. REGLA OPERATIVA PROPUESTA
Para este indicador se adopta esta definición operativa: Todo Swing High no mitigado o grupo de máximos con diferencia $\le \text{tolerance}$ genera un pool de BSL.

#### 11. IMPACTO EN EL INDICADOR
Proporciona imanes de atracción de precio (Price Magnets) y objetivos para tomas de beneficios.

#### 12. FUENTES
- ICT Core Content Month 3 (Liquidity Pools).

#### 13. NIVEL DE CONFIANZA
Alto.

---

### CONCEPT-07: SSL (SELL SIDE LIQUIDITY)

#### 1. CONCEPT ID
`CONCEPT-07`

#### 2. NOMBRE
SSL (Sell Side Liquidity / Liquidez de Vendedores)

#### 3. DEFINICIÓN
Concentración de órdenes de venta en forma de Stop-Loss de posiciones largas (Sell Stops) o Sell Stop orders situables por debajo de mínimos clave (Swing Lows, Equal Lows, Mínimos Diarios/Semanales).

#### 4. EVIDENCIA NECESARIA
- Niveles de precios identificados por debajo de valles o mínimos de sesión.

#### 5. CONDICIONES NECESARIAS
- Existencia de Swing Low previo no penetrado o grupo de mínimos alineados.

#### 6. CONDICIONES INSUFICIENTES
- Zonas por encima de la acción del precio actual.

#### 7. CONTRAEJEMPLOS
- Órdenes de stop de posiciones cortas ubicables por encima de máximos (BSL).

#### 8. INTERPRETACIONES ALTERNATIVAS
- Igual a BSL pero enfocado en el límite inferior del mercado.

#### 9. AMBIGÜEDADES
- Filtro de antigüedad del mínimo (si mínimos de hace meses siguen vigentes como pool primario).

#### 10. REGLA OPERATIVA PROPUESTA
Para este indicador se adopta esta definición operativa: Todo Swing Low no mitigado o grupo de mínimos con tolerancia ajustada define un pool de SSL.

#### 11. IMPACTO EN EL INDICADOR
Establece zonas objetivo a la baja y desencadenantes de setups de reversión (Turtle Soup bajista a alcista).

#### 12. FUENTES
- ICT Core Content Month 3.

#### 13. NIVEL DE CONFIANZA
Alto.

---

### CONCEPT-08: LIQUIDITY LEVEL

#### 1. CONCEPT ID
`CONCEPT-08`

#### 2. NOMBRE
Liquidity Level (Nivel de Liquidez Identificado)

#### 3. DEFINICIÓN
Un nivel horizontal de precio específico (como Equal Highs, Equal Lows, PMH - Previous Month High, PDH - Previous Day High, PDL - Previous Day Low) donde se presupone una acumulación significativa de liquidez institucional.

#### 4. EVIDENCIA NECESARIA
- Puntos de precio exactos donde el mercado reaccionó múltiples veces o extremos temporales clave.

#### 5. CONDICIONES NECESARIAS
- Mínimo 2 toques al mismo nivel o extremos de sesiones pasadas.

#### 6. CONDICIONES INSUFICIENTES
- Niveles Fibonacci sin convergencia estructural previa.

#### 7. CONTRAEJEMPLOS
- Un pivote aislado en mitad del rango sin alineación temporal ni coincidencia con otros picos.

#### 8. INTERPRETACIONES ALTERNATIVAS
- Varios algoritmos SMC usan tolerancias en porcentaje del ATR para definir "Equal Highs/Lows".

#### 9. AMBIGÜEDADES
- Ajuste de tolerancia en activos de diferente volatilidad (FX vs Crypto vs Índices).

#### 10. REGLA OPERATIVA PROPUESTA
Para este indicador se adopta esta definición operativa: Se definen Niveles de Liquidez en: PDH, PDL, EQH ($\le 0.05\%$ diff), EQL ($\le 0.05\%$ diff).

#### 11. IMPACTO EN EL INDICADOR
Genera líneas de referencia en el gráfico e indicadores visuales de atracción.

#### 12. FUENTES
- ICT Institutional Order Flow Concepts.

#### 13. NIVEL DE CONFIANZA
Alto.

---

### CONCEPT-09: LIQUIDITY SWEEP

#### 1. CONCEPT ID
`CONCEPT-09`

#### 2. NOMBRE
Liquidity Sweep (Barrido o Purga de Liquidez)

#### 3. DEFINICIÓN
El evento donde la acción del precio penetra temporalmente un nivel clave de BSL o SSL (extrayendo las órdenes stop) e inmediatamente rechaza/revierte hacia el interior del rango previo.

#### 4. EVIDENCIA NECESARIA
- Penetración del nivel BSL/SSL por mecha o de corta duración.
- Cierre de la vela dentro o rápidamente seguido por una vela de rechazo en sentido opuesto.

#### 5. CONDICIONES NECESARIAS
- $High > BSL$ pero $Close \le BSL$ (en barrido de altos), o $Low < SSL$ pero $Close \ge SSL$ (en barrido de bajos).

#### 6. CONDICIONES INSUFICIENTES
- Vela marubozu con fuerte cuerpo que cierra holgadamente por encima del nivel y continúa la tendencia (eso es un Breakout/BOS).

#### 7. CONTRAEJEMPLOS
- Avance continuo de varias velas cerrando progresivamente más arriba sin retorno (Expansión alcista).

#### 8. INTERPRETACIONES ALTERNATIVAS
- **Interpretación A**: Requiere rechazo en la misma vela de penetración.
- **Interpretación B**: Acepta penetración de hasta 1-3 velas siempre que el cierre final retorne al rango.

#### 9. AMBIGÜEDADES
- Medición de la profundidad aceptable del barrido antes de considerarlo ruptura fallida o continuación.

#### 10. REGLA OPERATIVA PROPUESTA
Para este indicador se adopta esta definición operativa: Penetración con mecha del nivel BSL/SSL donde el cuerpo de la vela o la vela subsiguiente cierra de regreso dentro del rango.

#### 11. IMPACTO EN EL INDICADOR
Catalizador primario para setups de reversión (Turtle Soup, Model A).

#### 12. FUENTES
- ICT 2022 Mentorship & Turtle Soup Strategy Documents.

#### 13. NIVEL DE CONFIANZA
Alto.

---

### CONCEPT-10: BREAKOUT

#### 1. CONCEPT ID
`CONCEPT-10`

#### 2. NOMBRE
Breakout (Ruptura Direccional con Continuidad)

#### 3. DEFINICIÓN
El paso decisivo del precio a través de una zona de contención o estructura con cuerpos de vela firmes que se sostienen por fuera del nivel roto.

#### 4. EVIDENCIA NECESARIA
- Cierre claro por encima de la resistencia o por debajo del soporte con aumento de rango de vela.

#### 5. CONDICIONES NECESARIAS
- $Close > Level$ en Breakout alcista.
- Continuidad en la vela siguiente.

#### 6. CONDICIONES INSUFICIENTES
- Penetración mechada con reversión instantánea (Sweep).

#### 7. CONTRAEJEMPLOS
- Liquidity Sweep.

#### 8. INTERPRETACIONES ALTERNATIVAS
- SMC tradicional prefiere llamar a esto BOS cuando está alineado a la estructura.

#### 9. AMBIGÜEDADES
- Distinción temprana entre Breakout real y Fakeout (Falso barrido).

#### 10. REGLA OPERATIVA PROPUESTA
Para este indicador se adopta esta definición operativa: Cierre de vela por fuera del nivel con continuidad direccional comprobable en la siguiente vela.

#### 11. IMPACTO EN EL INDICADOR
Confirma fases de expansión de mercado.

#### 12. FUENTES
- Classical Technical Analysis & SMC Principles.

#### 13. NIVEL DE CONFIANZA
Medio.

---

### CONCEPT-11: FALSE SWEEP

#### 1. CONCEPT ID
`CONCEPT-11`

#### 2. NOMBRE
False Sweep (Falso Barrido / Sweep Incompleto o Trampa de Ruptura)

#### 3. DEFINICIÓN (`CONCEPTO_AMBIGUO`)
Un escenario ambiguo donde el precio penetra un nivel de liquidez dando apariencia de rechazo (Sweep), pero carece del desplazamiento opuesto posterior necesario para confirmar la reversión, derivando finalmente en la reanudación de la ruptura.

#### 4. EVIDENCIA NECESARIA
- Ruptura inicial del nivel.
- Retracción parcial insuficiente sin generar MSS ni FVG en sentido opuesto.
- Continuación posterior en dirección de la ruptura original.

#### 5. CONDICIONES NECESARIAS
- Ausencia de desplazamiento estructural opuesto tras el barrido.

#### 6. CONDICIONES INSUFICIENTES
- Rechazo violento con desplazamiento (eso confirma un Sweep real).

#### 7. CONTRAEJEMPLOS
- Liquidity Sweep de libro con MSS inmediato.

#### 8. INTERPRETACIONES ALTERNATIVAS
- Considerado por algunos autores como "Judas Swing extendido" y por otros simplemente como "Breakout con retesteo".

#### 9. AMBIGÜEDADES
- `CONCEPTO_AMBIGUO`: No existe consenso cuantitativo universal para delimitar el tiempo máximo de reversión post-barrido.

#### 10. REGLA OPERATIVA PROPUESTA
Para este indicador se adopta esta definición operativa: Se marca como `CONCEPTO_AMBIGUO`. Requiere invalidación si el precio no genera MSS opuesto en un plazo de $M$ velas post-barrido.

#### 11. IMPACTO EN EL INDICADOR
Evita falsos gatillos de reversión y protege los setups de capturas prematuras.

#### 12. FUENTES
- ICT Mentorship Discussions on Judgement & Market Context.

#### 13. NIVEL DE CONFIANZA
Medio-Bajo.

---

### CONCEPT-12: DISPLACEMENT

#### 1. CONCEPT ID
`CONCEPT-12`

#### 2. NOMBRE
Displacement (Desplazamiento / Expansión Institucional)

#### 3. DEFINICIÓN
Un movimiento impulsivo, rápido y de gran amplitud en el precio, caracterizado por velas de cuerpo largo con mechas cortas, que demuestra una clara presencia e intención compradora o vendedora institucional.

#### 4. EVIDENCIA NECESARIA
- Vela o secuencia de 2-3 velas cuyo rango cuerpo/total y tamaño absoluto superan holgadamente el promedio reciente (ej. ATR).
- Generación concomitante de uno o varios Fair Value Gaps (FVG).

#### 5. CONDICIONES NECESARIAS
- Rango del cuerpo $\ge 70\%$ del rango total de la vela (`bodyRatio >= 0.7`).
- Rango total de la vela mayor que el rango promedio de las últimas $K$ velas.

#### 6. CONDICIONES INSUFICIENTES
- Una vela larga compuesta principalmente por mechas (alta volatilidad sin intención direccional).

#### 7. CONTRAEJEMPLOS
- Avance lento y serpenteante (consolidación / movimiento correctivo).

#### 8. INTERPRETACIONES ALTERNATIVAS
- **Interpretación A**: Medición absoluta por múltiplos de ATR.
- **Interpretación B**: Medición relativa de porcentaje de cuerpo respecto a mechas.

#### 9. AMBIGÜEDADES
- Ajuste del umbral para diferentes sesiones (ej. sesión de Asia vs London Open).

#### 10. REGLA OPERATIVA PROPUESTA
Para este indicador se adopta esta definición operativa: Vela o par de velas consecutivas con `bodyRatio >= 0.65` y tamaño de cuerpo superior a $1.5 \times$ la media de 10 velas anteriores, produciendo un FVG.

#### 11. IMPACTO EN EL INDICADOR
Requisito indispensable para validar un MSS y para confirmar la calidad de un Order Block o FVG.

#### 12. FUENTES
- ICT 2022 Mentorship Episode 2.

#### 13. NIVEL DE CONFIANZA
Alto.

---

### CONCEPT-13: FAIR VALUE GAP (FVG)

#### 1. CONCEPT ID
`CONCEPT-13`

#### 2. NOMBRE
Fair Value Gap (FVG / Desbalance de 3 Velas)

#### 3. DEFINICIÓN
Un desbalance en la entrega de precio representado por un patrón de 3 velas consecutivas donde existe un espacio desocupado (gap) entre la mecha superior de la primera vela y la mecha inferior de la tercera vela (en FVG alcista), o entre la mecha inferior de la primera vela y la mecha superior de la tercera (en FVG bajista).

#### 4. EVIDENCIA NECESARIA
- Secuencia de 3 velas: $V_1, V_2, V_3$.
- Alcista: $Low(V_3) > High(V_1)$. Espacio de gap = $[High(V_1), Low(V_3)]$.
- Bajista: $High(V_3) < Low(V_1)$. Espacio de gap = $[High(V_3), Low(V_1)]$.

#### 5. CONDICIONES NECESARIAS
- Amplitud del gap $> 0$ pips (o mayor al umbral mínimo del instrumento).
- $V_2$ debe ser una vela de expansión (Displacement).

#### 6. CONDICIONES INSUFICIENTES
- Superposición entre $High(V_1)$ y $Low(V_3)$ (sin espacio libre).

#### 7. CONTRAEJEMPLOS
- Gap de apertura de fin de semana en el gráfico de precios (eso es un Liquidity Void / Runaway Gap, no FVG clásico de 3 velas intradía).

#### 8. INTERPRETACIONES ALTERNATIVAS
- **BISI (Buyside Imbalance Sellside Inefficiency)**: FVG alcista.
- **SIBI (Sellside Imbalance Buyside Inefficiency)**: FVG bajista.
- **Inversión FVG (IFVG)**: FVG violado que cambia de polaridad.

#### 9. AMBIGÜEDADES
- Determinación de mitigación: Si un toque de 1 pip mitiga el FVG o si requiere alcanzar la consecuente mediana (Consequent Encroachment - CE).

#### 10. REGLA OPERATIVA PROPUESTA
Para este indicador se adopta esta definición operativa: FVG Alcista si $Low(V_3) - High(V_1) \ge \text{minFvgSize}$; FVG Bajista si $Low(V_1) - High(V_3) \ge \text{minFvgSize}$. Mitigado si el precio futuro penetra la zona.

#### 11. IMPACTO EN EL INDICADOR
Zona clave de entrada y entrada de retroceso (POI - Point of Interest).

#### 12. FUENTES
- ICT Core Content Month 2 & 2022 Mentorship.

#### 13. NIVEL DE CONFIANZA
Alto (Consenso total en la metodología).

---

### CONCEPT-14: ORDER BLOCK (OB)

#### 1. CONCEPT ID
`CONCEPT-14`

#### 2. NOMBRE
Order Block (OB / Bloque de Órdenes Institucional)

#### 3. DEFINICIÓN (`DEFINICION_CONFLICTIVA`)
Una vela o grupo de velas específicas que preceden a un movimiento impulsivo de desplazamiento con ruptura de estructura. Representa la zona donde las instituciones acumularon o distribuyeron posiciones antes de la expansión.

#### 4. EVIDENCIA NECESARIA
- Vela con dirección opuesta al impulso posterior.
- Impulso posterior inmediato que genera BOS/MSS y crea FVG.

#### 5. CONDICIONES NECESARIAS
- En OB Alcista: Última vela alcista o bajista antes del impulso ascendente violento.
- En OB Bajista: Última vela alcista antes del impulso descendente violento.
- El impulso posterior DEBE romper estructura previa y DEBE dejar un FVG.

#### 6. CONDICIONES INSUFICIENTES
- Cualquier vela contraria en medio de una consolidación que no produce desbalance ni rompe estructura.

#### 7. CONTRAEJEMPLOS
- Una vela previa al impulso cuya mecha ya fue totalmente cubierta por velas posteriores antes de la expansión.

#### 8. INTERPRETACIONES ALTERNATIVAS (`DEFINICION_CONFLICTIVA`)
- **Interpretación A (Cuerpo del OB)**: La zona es solo el cuerpo de la vela ($Open$ a $Close$).
- **Interpretación B (Vela Completa)**: La zona incluye las mechas ($High$ a $Low$).
- **Interpretación C (OB de Cambio)**: La vela de mayor volumen dentro del impulso de origen.

#### 9. AMBIGÜEDADES
- Si una serie de 3 velas rojas preceden el impulso, ¿cuál de las 3 es el OB exacto? (ICT suele tomar la vela de mayor rango o el grupo entero).

#### 10. REGLA OPERATIVA PROPUESTA
Para este indicador se adopta esta definición operativa: La última vela opuesta completa ($High$-$Low$) previa al desplazamiento que genera MSS + FVG se registra como Order Block.

#### 11. IMPACTO EN EL INDICADOR
Zona principal de soporte/resistencia institucional para entradas de retesteo.

#### 12. FUENTES
- ICT Core Content Month 4 (Order Blocks); Smart Money Concepts.

#### 13. NIVEL DE CONFIANZA
Medio-Alto.

---

### CONCEPT-15: PREMIUM

#### 1. CONCEPT ID
`CONCEPT-15`

#### 2. NOMBRE
Premium Zone (Zona Premium / Zona de Sobreprecio)

#### 3. DEFINICIÓN
La mitad superior ($> 50\%$) del rango operativo actual (Dealing Range) comprendido entre el Swing Low estructural y el Swing High estructural.

#### 4. EVIDENCIA NECESARIA
- Rango estructural definido ($Low_{swing}, High_{swing}$).
- Nivel de Equilibrio ($EQ = (High_{swing} + Low_{swing}) / 2$).

#### 5. CONDICIONES NECESARIAS
- Precio actual $P > EQ$.

#### 6. CONDICIONES INSUFICIENTES
- Evaluar el precio sin haber determinado un rango de negociación claro y activo.

#### 7. CONTRAEJEMPLOS
- Precios situados en el $48\%$ del rango (eso es zona Discount).

#### 8. INTERPRETACIONES ALTERNATIVAS
- Uso de niveles OTE (Optimal Trade Entry: $62\%, 70.5\%, 79\%$) dentro de la zona Premium.

#### 9. AMBIGÜEDADES
- Elección del rango de referencia en gráficos con múltiples escalas temporales (HTF vs LTF Dealing Range).

#### 10. REGLA OPERATIVA PROPUESTA
Para este indicador se adopta esta definición operativa: Zona Premium = $[EQ, High_{swing}]$ donde $EQ = Low_{swing} + 0.5 \times (High_{swing} - Low_{swing})$.

#### 11. IMPACTO EN EL INDICADOR
Zona adecuada para buscar únicamente ejecuciones de Venta (Shorts).

#### 12. FUENTES
- ICT Core Content Month 2 (Dealing Ranges & Equilibrium).

#### 13. NIVEL DE CONFIANZA
Alto.

---

### CONCEPT-16: DISCOUNT

#### 1. CONCEPT ID
`CONCEPT-16`

#### 2. NOMBRE
Discount Zone (Zona Discount / Zona de Descuento)

#### 3. DEFINICIÓN
La mitad inferior ($< 50\%$) del rango operativo actual (Dealing Range) delimitado por el Swing Low y Swing High estructurales.

#### 4. EVIDENCIA NECESARIA
- Swing Low y Swing High que establecen el rango.
- Nivel de Equilibrio $EQ$.

#### 5. CONDICIONES NECESARIAS
- Precio actual $P < EQ$.

#### 6. CONDICIONES INSUFICIENTES
- Lectura de precio bajo sin marco de referencia de Dealing Range.

#### 7. CONTRAEJEMPLOS
- Precios por encima del $50\%$ del rango.

#### 8. INTERPRETACIONES ALTERNATIVAS
- Zonas OTE de compra ($62\% - 79\%$ de descuento).

#### 9. AMBIGÜEDADES
- Ajuste del rango cuando el precio crea un nuevo pico sin haber confirmado el pivote.

#### 10. REGLA OPERATIVA PROPUESTA
Para este indicador se adopta esta definición operativa: Zona Discount = $[Low_{swing}, EQ]$.

#### 11. IMPACTO EN EL INDICADOR
Zona exclusiva para buscar compras (Longs).

#### 12. FUENTES
- ICT Core Content Month 2.

#### 13. NIVEL DE CONFIANZA
Alto.

---

### CONCEPT-17: HTF ALIGNMENT

#### 1. CONCEPT ID
`CONCEPT-17`

#### 2. NOMBRE
HTF Alignment (Alineación con Temporalidad Superior)

#### 3. DEFINICIÓN
La concordancia técnica entre el sesgo estructural/direccional de una temporalidad superior (HTF, ej. 4H/1D) y el setup detectado en la temporalidad de ejecución o intermedia (LTF/ITF, ej. 15M/5M).

#### 4. EVIDENCIA NECESARIA
- Estructura y POIs identificables en HTF.
- Setup formándose en LTF en la misma dirección que el impulso esperado de HTF.

#### 5. CONDICIONES NECESARIAS
- Si HTF está en expansión alcista saliendo de un Discount POI, solo se aceptan setups alcistas en LTF.

#### 6. CONDICIONES INSUFICIENTES
- Setup perfecto en 1M contra la estructura clara de 4H.

#### 7. CONTRAEJEMPLOS
- Operar un contratendencia en 5M hacia un POI de HTF sin confirmación de marco mayor.

#### 8. INTERPRETACIONES ALTERNATIVAS
- Matriz de triple marco temporal: HTF (Diario) -> ITF (1H) -> LTF (5M).

#### 9. AMBIGÜEDADES
- Definición formal de la jerarquía de temporalidades aplicable a scalping vs swing trading.

#### 10. REGLA OPERATIVA PROPUESTA
Para este indicador se adopta esta definición operativa: `HTF_Alignment = true` si el sesgo de HTF coincide exactamente con la dirección proyectada por el setup de LTF.

#### 11. IMPACTO EN EL INDICADOR
Filtro de alta probabilidad para la activación o descarte de setups.

#### 12. FUENTES
- ICT Multiple Timeframe Analysis Principles.

#### 13. NIVEL DE CONFIANZA
Alto.

---

### CONCEPT-18: LIQUIDITY TARGET

#### 1. CONCEPT ID
`CONCEPT-18`

#### 2. NOMBRE
Liquidity Target (Objetivo de Liquidez / Target de Salida)

#### 3. DEFINICIÓN
El pool de liquidez opuesto (BSL o SSL) o nivel estructural no mitigado hacia el cual se prevé que el algoritmo institucional entregará el precio tras la activación de un setup.

#### 4. EVIDENCIA NECESARIA
- Identificación de un pool no limpiado (Unswept High/Low, EQH/EQL, FVG HTF) en la dirección del trade.

#### 5. CONDICIONES NECESARIAS
- Estar ubicado en la dirección del movimiento validado por el MSS.

#### 6. CONDICIONES INSUFICIENTES
- Puntos de precio arbitrarios basados únicamente en ratios de beneficio fijos sin sustento de liquidez.

#### 7. CONTRAEJEMPLOS
- Fijar objetivo en un nivel que ya fue profundamente mitigado y purgado previamente.

#### 8. INTERPRETACIONES ALTERNATIVAS
- Target 1: FVG más cercano; Target 2: BSL/SSL mayor.

#### 9. AMBIGÜEDADES
- Evaluación de si el precio alcanzará el primer objetivo interno o el objetivo externo del rango.

#### 10. REGLA OPERATIVA PROPUESTA
Para este indicador se adopta esta definición operativa: `LiquidityTarget` es el BSL/SSL no mitigado más próximo en la dirección del setup.

#### 11. IMPACTO EN EL INDICADOR
Define las proyecciones visuales de llegada de precio en la interfaz.

#### 12. FUENTES
- ICT Core Content Month 3 (Targets & Exit Strategies).

#### 13. NIVEL DE CONFIANZA
Alto.

---

### CONCEPT-19: MODEL A

#### 1. CONCEPT ID
`CONCEPT-19`

#### 2. NOMBRE
ICT Model A (Silver Bullet / Turtle Soup Model)

#### 3. DEFINICIÓN
Modelo de setup basado en la purga inicial de un nivel de liquidez previo (Sweep), seguido de una reversión con desplazamiento que crea MSS y un FVG en una ventana horaria específica (Killzone).

#### 4. EVIDENCIA NECESARIA
1. Liquidity Sweep de BSL o SSL.
2. MSS inmediato en temporalidad de ejecución.
3. Formación de FVG dentro de la leg de desplazamiento.
4. Ocurrencia dentro de una ventana de tiempo predefinida (ej. 10:00 - 11:00 NY Time).

#### 5. CONDICIONES NECESARIAS
- Cumplimiento secuencial estricto: $\text{Sweep} \rightarrow \text{MSS} \rightarrow \text{FVG}$.

#### 6. CONDICIONES INSUFICIENTES
- Formación de FVG sin previo barrido de liquidez.

#### 7. CONTRAEJEMPLOS
- Ruptura de continuación directa (BOS) sin barrido previo del extremo.

#### 8. INTERPRETACIONES ALTERNATIVAS
- Variación de Silver Bullet AM vs PM Session.

#### 9. AMBIGÜEDADES
- Grado de tolerancia a entradas que se producen minutos fuera de la Killzone oficial.

#### 10. REGLA OPERATIVA PROPUESTA
Para este indicador se adopta esta definición operativa: Model A = `Sweep(BSL/SSL) + MSS + FVG` en secuencia cronológica válida.

#### 11. IMPACTO EN EL INDICADOR
Constituye una de las 3 arquitecturas de setup detectables por la máquina de estados.

#### 12. FUENTES
- ICT 2022 Mentorship & Silver Bullet Model Specifications.

#### 13. NIVEL DE CONFIANZA
Alto.

---

### CONCEPT-20: MODEL B

#### 1. CONCEPT ID
`CONCEPT-20`

#### 2. NOMBRE
ICT Model B (Judas Swing / London Open Expansion Model)

#### 3. DEFINICIÓN
Modelo de setup caracterizado por una falsa maniobra inicial en la apertura de sesión (Judas Swing) que manipula el precio hacia un POI HTF (o nivel de liquidez clave), para luego revertir fuertemente y expandir en la dirección del sesgo verdadero del día.

#### 4. EVIDENCIA NECESARIA
1. Consolidación previa en sesión de Asia.
2. Manipulación inicial (Judas Swing) en London Open / NY Open hacia una zona Discount/Premium HTF.
3. Desplazamiento de retorno con MSS + FVG.

#### 5. CONDICIONES NECESARIAS
- La manipulación debe ocurrir durante el cambio de sesión o Killzone definida.

#### 6. CONDICIONES INSUFICIENTES
- Movimiento impulsivo en medio de la sesión sin acumulación previa ni contexto de Killzone.

#### 7. CONTRAEJEMPLOS
- Tendencia limpia y directa sin maniobra de manipulación previa en la apertura.

#### 8. INTERPRETACIONES ALTERNATIVAS
- Power of 3 (AMD: Accumulation, Manipulation, Distribution).

#### 9. AMBIGÜEDADES
- Delimitación exacta del rango de acumulación asiática (Asian Range High/Low).

#### 10. REGLA OPERATIVA PROPUESTA
Para este indicador se adopta esta definición operativa: Model B = `Asian Accumulation + Judas Manipulation to POI + MSS + FVG`.

#### 11. IMPACTO EN EL INDICADOR
Permite identificar la estructura de manipulación previa al movimiento direccional del día.

#### 12. FUENTES
- ICT Core Content Month 4 & AMD Model.

#### 13. NIVEL DE CONFIANZA
Medio-Alto.

---

### CONCEPT-21: MODEL C

#### 1. CONCEPT ID
`CONCEPT-21`

#### 2. NOMBRE
ICT Model C (Continuation / Market Structure Shift + Retest Model)

#### 3. DEFINICIÓN
Modelo clásico de continuación o reacondicionamiento estructural donde el precio rompe una estructura previa (BOS/MSS) dejando un Order Block y/o FVG, y el setup se confirma al producirse el primer retroceso ordenado (Retest) hacia dicho desbalance o bloque.

#### 4. EVIDENCIA NECESARIA
1. Ruptura limpia de estructura (BOS o MSS) con desplazamiento.
2. Identificación de FVG y/o Order Block en la pierna impulsiva.
3. Retroceso (Mitigation return) hacia la zona FVG/OB dentro de zona Premium/Discount.

#### 5. CONDICIONES NECESARIAS
- El retroceso no debe invalidar la raíz del Order Block (no cerrar más allá del extremo del OB).

#### 6. CONDICIONES INSUFICIENTES
- Retorno a la zona sin que haya existido un desplazamiento previo con ruptura estructural.

#### 7. CONTRAEJEMPLOS
- Caída violenta del precio que atraviesa completamente el FVG y el OB rompiendo el swing estructural de origen.

#### 8. INTERPRETACIONES ALTERNATIVAS
- SMC Standard Setup (BOS + OB + FVG Entry).

#### 9. AMBIGÜEDADES
- Si la entrada debe colocarse en el borde superior del FVG, en el 50% (CE), o en la entrada del Order Block.

#### 10. REGLA OPERATIVA PROPUESTA
Para este indicador se adopta esta definición operativa: Model C = `Structure Break (BOS/MSS) + Displacement FVG/OB + Price Retest to FVG/OB`.

#### 11. IMPACTO EN EL INDICADOR
Modelo estándar de mayor frecuencia de detección en el motor.

#### 12. FUENTES
- ICT Core Content & General SMC Literature.

#### 13. NIVEL DE CONFIANZA
Alto.

---

### CONCEPT-22: SETUP STATE

#### 1. CONCEPT ID
`CONCEPT-22`

#### 2. NOMBRE
Setup State (Máquina de Estados de Setup / Ciclo de Vida del Setup)

#### 3. DEFINICIÓN
El estado de progreso en el que se encuentra un patrón o setup de negociación en un instante $t$, transitando a lo largo de un ciclo formal de vida: desde su detección inicial hasta su resolución final.

#### 4. EVIDENCIA NECESARIA
- Registro de eventos secuenciales del mercado (Sweep, Displacement, FVG Creation, Retest, Target Hit, Invalidation).

#### 5. CONDICIONES NECESARIAS
- El setup debe pertenecer a uno de los estados formalmente definidos en el sistema:
  - `NONE`: Sin estructura de setup activa.
  - `FORMING`: Requisitos iniciales detectados (ej. Sweep + Displacement en proceso).
  - `READY`: Setup completamente formado con POI (FVG/OB) pendiente de mitigación.
  - `ACTIVE`: El precio ha entrado en la zona POI y se encuentra testeando el setup.
  - `INVALIDATED`: El precio superó el nivel de anulación (Stop Level / Swing origin) anulando el setup.
  - `COMPLETED`: El precio alcanzó el `Liquidity Target` proyectado.

#### 6. CONDICIONES INSUFICIENTES
- Etiquetar un setup como "ACTIVE" antes de que la acción del precio toque el POI validado.

#### 7. CONTRAEJEMPLOS
- Mantener un setup en estado "READY" de forma indefinida tras transcurrir un número excesivo de velas (expiración).

#### 8. INTERPRETACIONES ALTERNATIVAS
- Sistemas alternativos que prescinden del estado `FORMING` y pasan directamente de invalidez a señal.

#### 9. AMBIGÜEDADES
- Criterios de expiración por tiempo/velas para un setup `READY` que nunca es alcanzado por el precio.

#### 10. REGLA OPERATIVA PROPUESTA
Para este indicador se adopta esta definición operativa: Máquina de estados determinista basada en eventos: `NONE` $\rightarrow$ `FORMING` $\rightarrow$ `READY` $\rightarrow$ `ACTIVE` $\rightarrow$ (`COMPLETED` | `INVALIDATED`).

#### 11. IMPACTO EN EL INDICADOR
Controla el flujo de pintado visual, alertas y renderizado en el HUD del usuario.

#### 12. FUENTES
- System Architecture Design for Automated Technical Analysis & State Machine Theory.

#### 13. NIVEL DE CONFIANZA
Alto.
