# ICT ASSISTANT — TRADESEA
## Especificación técnica para Antigravity

### 1. OBJETIVO

Desarrollar una extensión de Google Chrome llamada provisionalmente `ICT Assistant`.

La extensión debe funcionar sobre la plataforma web TradeSea y proporcionar análisis visual basado en conceptos ICT/SMC.

El sistema NO debe ejecutar operaciones.

Su única función es:
- analizar datos de mercado disponibles;
- identificar estructuras y posibles setups;
- dibujar las estructuras sobre el gráfico;
- mostrar posibles zonas de entrada;
- calcular Entry / Stop Loss / Take Profit;
- mostrar las confluencias detectadas;
- permitir al usuario decidir manualmente si realiza una operación.

La extensión debe ser completamente asistida.

NO implementar:
- envío automático de órdenes;
- clicks automáticos sobre Buy/Sell;
- ejecución de operaciones;
- gestión automática de posiciones;
- conexión a una cuenta para operar.

---

# 2. OBJETIVO DEL DESARROLLO

El proyecto se desarrollará por etapas. NO intentar construir todo de una sola vez.

Orden:
1. Investigación de TradeSea.
2. Acceso a datos del gráfico.
3. Overlay visual.
4. Motor de estructura de mercado.
5. Liquidez.
6. FVG.
7. Sesiones.
8. Modelo de entrada.
9. Panel.
10. Backtesting/histórico.
11. Modo tiempo real.
12. Optimización.

---

# 3. PRIMERA TAREA OBLIGATORIA — INVESTIGACIÓN DE TRADESEA

Antes de escribir el motor ICT, INVESTIGAR CÓMO FUNCIONA REALMENTE EL GRÁFICO DE TRADESEA.

Determinar:
- framework utilizado;
- estructura DOM;
- canvas/SVG utilizados;
- WebSockets;
- requests XHR/fetch;
- endpoints;
- datos OHLC;
- datos de volumen si están disponibles;
- símbolo;
- timeframe;
- timestamps;
- historial disponible;
- forma en que cambia el gráfico al cambiar timeframe;
- posibilidad de obtener datos históricos;
- forma de detectar nuevas velas.

NO asumir que TradeSea posee una API pública.
NO inventar endpoints.
NO depender de coordenadas de pantalla si existe una forma estructurada de acceder a los datos.

Crear una prueba mínima que permita demostrar:
1. símbolo actual;
2. timeframe actual;
3. OHLC de las velas;
4. timestamp;
5. llegada de nuevas velas en tiempo real.

Entregar un informe de esta investigación antes de continuar.

---

# 4. ARQUITECTURA

Separar el proyecto en:

/extension
    /content
    /background
    /popup
    /panel
    /overlay
    /storage

/core
    /market
    /structure
    /liquidity
    /fvg
    /orderblocks
    /sessions
    /setups
    /risk
    /backtest

/tests

El motor ICT debe ser independiente de TradeSea.

Debe ser posible alimentar el motor con un array de velas OHLC sin necesidad de abrir TradeSea.

Esto permitirá realizar backtesting y tests unitarios.

---

# 5. TECNOLOGÍAS

Preferencias:
- TypeScript
- Chrome Extension Manifest V3
- Vite
- arquitectura modular
- tipado estricto
- ESLint
- tests automatizados

No introducir dependencias innecesarias.
Documentar cualquier dependencia externa.

---

# 6. DATOS DE MERCADO

Definir una estructura estándar:

Candle:
{
    timestamp,
    open,
    high,
    low,
    close,
    volume?
}

El timestamp debe utilizar una zona horaria consistente.
No mezclar hora local del navegador con hora de mercado.

El sistema debe poder trabajar con:
- 1m
- 3m
- 5m
- 15m
- 30m
- 1H
- 4H
- 1D

y cualquier timeframe adicional que TradeSea permita obtener.

La selección debe ser configurable.

---

# 7. HISTORIAL DE HASTA 60 DÍAS

La extensión debe intentar analizar hasta 60 días de historial disponible.

IMPORTANTE:
60 días NO significa que siempre deban existir exactamente 60 días de datos.

El sistema debe:
1. solicitar/obtener el máximo historial disponible;
2. limitar el análisis a los últimos 60 días cuando corresponda;
3. informar cuántas velas fueron realmente analizadas;
4. informar el período exacto;
5. no inventar datos faltantes.

Ejemplo:

Historical analysis
Period:
2026-07-27 → 2026-09-25

Candles:
86,400

Timeframe:
1m

---

# 8. MULTI-TIMEFRAME

Las temporalidades deben ser configurables.

No asumir inicialmente una única combinación.

La configuración debe permitir algo como:

Context TF:
1H

Structure TF:
15M

Entry TF:
1M

Pero también:

Context:
4H
Structure:
15M
Entry:
5M

o:

Context:
15M
Structure:
5M
Entry:
1M

El motor debe poder analizar diferentes temporalidades simultáneamente.

---

# 9. MOTOR DE ESTRUCTURA

Primera versión:

Detectar:
- swing highs;
- swing lows;
- HH;
- HL;
- LH;
- LL;
- BOS;
- MSS.

No utilizar simplemente máximos/mínimos de una vela.

Crear un algoritmo configurable de swing detection.

Parámetros:
- swingLength
- confirmationBars
- minimumDisplacement

Evitar repainting cuando sea posible.

Diferenciar claramente:
CONFIRMED
y
POTENTIAL

Nunca presentar una estructura potencial como confirmada.

---

# 10. LIQUIDITY

Detectar posibles:
- Buy Side Liquidity;
- Sell Side Liquidity;
- Equal Highs;
- Equal Lows;
- previous day high;
- previous day low;
- previous session high;
- previous session low;
- swing liquidity.

Representación:

BSL:
línea/zona horizontal sobre máximos relevantes.

SSL:
línea/zona horizontal sobre mínimos relevantes.

Equal highs/lows deben utilizar tolerancia configurable.

---

# 11. LIQUIDITY SWEEP

Detectar cuando el precio:
1. alcanza una zona de liquidez;
2. la supera;
3. posteriormente vuelve a cerrar dentro o produce desplazamiento contrario.

Diferenciar:
Potential Sweep
Confirmed Sweep

Registrar:
- liquidity level;
- candle;
- sweep high/low;
- close;
- displacement posterior.

---

# 12. FAIR VALUE GAP

Detectar FVG de tres velas.

Bullish FVG:
low[Candle 3] > high[Candle 1]

Bearish FVG:
high[Candle 3] < low[Candle 1]

Guardar:
- high;
- low;
- timestamp;
- dirección;
- timeframe;
- mitigated;
- partially mitigated;
- fully mitigated.

Dibujar el FVG como rectángulo.

Permitir configurar:
- mostrar todos;
- mostrar solamente no mitigados;
- mostrar solamente FVG recientes;
- mínimo tamaño relativo.

---

# 13. ORDER BLOCKS

No implementar Order Blocks complejos en la primera versión.

Primero construir:
- FVG;
- liquidity;
- structure;
- displacement.

Después agregar Order Blocks.

El Order Block debe requerir criterios explícitos y configurables.

No llamar "Order Block" simplemente a cualquier vela contraria antes de un movimiento.

---

# 14. SESIONES

Implementar configuración de sesiones.

Inicialmente:
- Asia
- London
- New York

También:
- London Kill Zone
- New York Kill Zone

Las horas deben ser configurables.

NO hardcodear horarios sin considerar timezone.

Mostrar:
Session:
New York

Kill Zone:
ACTIVE

---

# 15. MODELO DE ENTRY

NO definir todavía un único modelo definitivo.

Crear un sistema modular de Setup Rules.

Ejemplo provisional:

LONG:
1. contexto HTF bullish;
2. precio alcanza SSL;
3. SSL sweep;
4. MSS bullish;
5. displacement;
6. FVG bullish;
7. precio vuelve al FVG;
8. entry dentro de FVG;
9. SL debajo del sweep;
10. TP hacia liquidez opuesta.

SHORT:
1. contexto HTF bearish;
2. precio alcanza BSL;
3. BSL sweep;
4. MSS bearish;
5. displacement;
6. FVG bearish;
7. retrace hacia FVG;
8. entry;
9. SL encima del sweep;
10. TP hacia liquidez opuesta.

ESTO ES SOLAMENTE EL MODELO INICIAL.

Debe quedar preparado para modificarlo posteriormente.

---

# 16. SISTEMA DE CONFLUENCIAS

No utilizar inicialmente una "IA" que invente señales.

Construir primero un sistema determinístico.

Ejemplo:

Liquidity sweep       +1
MSS                    +1
Displacement           +1
FVG                    +1
HTF alignment          +1
Kill Zone              +1
Target liquidity       +1

Score:
0-2:
NO SETUP

3-4:
WATCH

5:
POSSIBLE SETUP

6-7:
HIGH CONFLUENCE

IMPORTANTE:
Estos números son configurables y NO representan una probabilidad estadística.

No mostrar:
"85% chance"
si no existe evidencia estadística que lo respalde.

---

# 17. ENTRY

Cuando se cumplan las condiciones:

dibujar:
- ENTRY ZONE
- SL
- TP1
- TP2
- TP3 si corresponde.

Ejemplo:

LONG

Entry:
21,452.00

SL:
21,442.00

TP1:
21,472.00

TP2:
21,490.00

RR TP1:
2.0

RR TP2:
3.8

Los valores anteriores son solamente ejemplos.

---

# 18. PANEL

Crear un panel lateral flotante.

Debe poder minimizarse.

Contenido:

ICT ASSISTANT

Symbol:
MNQ

Context:
BULLISH

Structure:
BULLISH

Liquidity:
SSL SWEPT

MSS:
CONFIRMED

FVG:
21,450 - 21,455

Session:
NY KILL ZONE

Setup:
LONG

Entry:
21,452

SL:
21,442

TP:
21,472

RR:
2.0

Confluences:
6/7

Status:
WATCH
POSSIBLE ENTRY
o
NO SETUP

---

# 19. DIBUJOS

El overlay debe poder mostrar:
- BSL
- SSL
- EQH
- EQL
- BOS
- MSS
- FVG
- Sweep
- Entry
- SL
- TP
- Session
- Kill Zone

Cada elemento debe poder activarse/desactivarse.

No saturar el gráfico.
Agregar filtros de visualización.

---

# 20. HISTORICAL SCANNER

Agregar una función:

SCAN 60 DAYS

Debe analizar retrospectivamente el historial.

Para cada setup encontrado guardar:
- timestamp
- symbol
- timeframe
- direction
- entry
- SL
- TP
- setup type
- confluences
- result
- MFE
- MAE
- session
- liquidity target
- FVG
- MSS
- sweep

Esto permitirá estudiar los setups.

NO modificar parámetros basándose automáticamente en resultados.

Primero recopilar datos.

---

# 21. BACKTEST

Implementar posteriormente un backtester independiente.

Reglas:
- No utilizar información futura.
- Cada vela solamente puede utilizar información que habría estado disponible en ese momento.
- Evitar look-ahead bias.
- Evitar survivorship bias.

Distinguir:
- Signal time
- Entry time
- Exit time
- Maximum Favorable Excursion
- Maximum Adverse Excursion

Resultado:
- WIN
- LOSS
- BREAKEVEN
- NO ENTRY

---

# 22. REPLAY MODE

Agregar posteriormente:

Replay

Permitir avanzar vela por vela.

El usuario debe poder observar cómo el motor habría detectado:
- liquidity
- sweep
- MSS
- FVG
- entry
- SL
- TP

Esto será importante para validar visualmente la lógica ICT.

---

# 23. CONFIGURACIÓN

Crear página de settings.

Opciones:
- Symbol
- Context timeframe
- Structure timeframe
- Entry timeframe
- Swing length
- FVG minimum size
- Equal High/Low tolerance
- Session timezone
- Sessions
- Kill Zones
- Minimum confluence score
- Risk/Reward target
- Historical days
- Mostrar mitigated FVG
- Mostrar historical setups
- Mostrar weak setups

---

# 24. MODOS

Implementar:

LIVE
HISTORICAL
REPLAY

LIVE:
analiza las velas nuevas.

HISTORICAL:
escanea hasta 60 días.

REPLAY:
reproduce el mercado vela por vela.

---

# 25. SEGURIDAD

La extensión:
NO debe:
- ejecutar órdenes;
- hacer click en Buy;
- hacer click en Sell;
- enviar formularios de trading;
- modificar posiciones;
- cerrar posiciones;
- colocar Stop Loss real;
- colocar Take Profit real.

Debe ser estrictamente un asistente visual.

---

# 26. LOGGING

Implementar logging interno.

Ejemplo:

[07:42:12]
New candle received

[07:42:13]
SSL detected

[07:42:14]
SSL swept

[07:42:15]
Bullish MSS confirmed

[07:42:16]
Bullish FVG detected

[07:42:17]
Potential LONG setup

Los logs deben poder exportarse.

---

# 27. EXPORTACIÓN

Permitir exportar setups históricos a:
- CSV
- JSON

Ejemplo:

timestamp,direction,entry,sl,tp,score,result,...

Esto permitirá posteriormente analizar los resultados con Python.

---

# 28. TESTS

Crear tests unitarios para:
- swing detection;
- BOS;
- MSS;
- FVG;
- liquidity;
- sweep;
- session;
- setup;
- risk/reward;
- historical scanner.

Crear datasets sintéticos.

Ejemplo:

Candle[]

y resultado esperado:

MSS = bullish
FVG = true
Sweep = true

---

# 29. PRINCIPIO FUNDAMENTAL

No intentar hacer una "IA trader" inmediatamente.

Primera etapa:
REGLAS DETERMINÍSTICAS

Después:
ESTADÍSTICA

Después:
posiblemente ML.

La herramienta debe permitir determinar si el modelo ICT realmente produce setups con características repetibles antes de agregar Machine Learning.

---

# 30. INFORMES OBLIGATORIOS PARA EL DESARROLLO

Al finalizar cada etapa, entregar un reporte.

Formato:

## STATUS REPORT

Stage:
3

Completed:
...

Not completed:
...

Files changed:
...

Tests:
...

Passed:
...

Failed:
...

TradeSea findings:
...

Known limitations:
...

Next recommended step:
...

No avanzar silenciosamente sobre problemas importantes.

---

# 31. CHECKPOINTS

Solicitar revisión antes de pasar a:

CHECKPOINT 1
TradeSea data access

CHECKPOINT 2
Overlay working

CHECKPOINT 3
Structure detection

CHECKPOINT 4
Liquidity + FVG

CHECKPOINT 5
First setup model

CHECKPOINT 6
60-day historical scanner

CHECKPOINT 7
Backtesting

CHECKPOINT 8
Live mode

En cada checkpoint mostrar evidencia funcional.

---

# 32. REGLA PARA LA SUPERVISIÓN

Si existe una decisión de arquitectura que pueda afectar significativamente al proyecto:

NO asumir.

Presentar:
- Opción A
- Opción B
- Ventajas
- Desventajas
- Recomendación técnica

y esperar revisión.

---

# 33. ESTADO INICIAL

Comenzar exclusivamente con:

PHASE 0 — INVESTIGATION

Investigar TradeSea.

No construir todavía el modelo ICT completo.

El primer entregable debe responder:

1. ¿Cómo obtiene TradeSea los datos OHLC?
2. ¿Dónde están disponibles?
3. ¿Se pueden obtener históricamente?
4. ¿Cómo detectar nuevas velas?
5. ¿Cómo conocer símbolo y timeframe?
6. ¿Podemos dibujar un overlay?
7. ¿Canvas, SVG, DOM u otra tecnología?
8. ¿Qué limitaciones presenta la plataforma?
9. ¿Qué estrategia recomienda para la extensión?

Después de este informe se decidirá la arquitectura definitiva.

---

# 34. PRINCIPIO DEL PROYECTO

El usuario toma todas las decisiones de trading.

ICT Assistant solamente:

OBSERVA → ANALIZA → DIBUJA → INFORMA

Nunca:

OBSERVA → ANALIZA → OPERA

---

# 35. INSTRUCCIONES DE TRABAJO PARA ANTIGRAVITY

Actuar como desarrollador ejecutor del proyecto.

No completar etapas futuras por iniciativa propia si una etapa previa tiene incertidumbres técnicas.

Cuando una tarea dependa de información de TradeSea que no esté confirmada:
- investigar;
- documentar;
- probar;
- informar;
- no inventar.

Priorizar siempre una implementación verificable sobre una implementación grande.

Al terminar cada checkpoint, detenerse y generar el STATUS REPORT solicitado.

El usuario enviará los reportes a un supervisor externo para revisión técnica antes de autorizar la siguiente etapa.

No implementar trading automático bajo ninguna circunstancia.

---

# 36. PRIMER COMANDO

Comenzar ahora con:

PHASE 0 — INVESTIGATION

Objetivo exclusivo:
determinar técnicamente cómo interactuar con TradeSea desde una extensión Chrome.

Entregar:

1. STATUS REPORT.
2. Evidencia de las pruebas realizadas.
3. Capturas si son útiles.
4. Archivos creados/modificados.
5. Limitaciones encontradas.
6. Arquitectura propuesta.
7. Recomendación para CHECKPOINT 1.

NO implementar todavía el motor ICT.
