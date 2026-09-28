# CHECKPOINT 32 — PROTOCOLO DE REVISIÓN CONCEPTUAL BLINDADA

## 1. PRINCIPIO FUNDAMENTAL Y REGLA DE ORO

```text
ANTIGRAVITY PREPARA.
GONZALO REVISA.
ANTIGRAVITY COMPARA DESPUÉS.
```

El presente protocolo define las reglas estrictas de aislamiento y cegado para la evaluación conceptual del **ICT Model V1** implementado en CP31 respecto a la especificación conceptual formal de CP30.

---

## 2. ARQUITECTURA DE AISLAMIENTO

Para prevenir cualquier sesgo o contaminación de la evaluación humana, el sistema mantiene dos artefactos estrictamente separados:

### A. REVIEW PACK (`CP32_REVIEW_PACK/`)
Material exclusivo entregado al revisor humano (**Gonzalo**).
Contiene:
- `cases.json`: 300 casos con identificadores aleatorios anonimizados (`CASE-XXXXXXXX`), datos OHLC, contexto HTF/CTF/LTF y timestamps necesarios.
- `CP32_HUMAN_REVIEW_FORM.csv`: Formulario para completar las clasificaciones.
- `INSTRUCTIONS.md`: Guía metodológica para la clasificación conceptual.

**PROHIBIDO EN REVIEW PACK**:
- Clasificación del detector (`expected`, `predicted`, `model match`, `result`).
- Puntuación (`score`, `confidence`, `probability`).
- Estado de setup (`MODEL_A`, `MODEL_B`, `MODEL_C`, `activation`, `confirmation`).
- Señales comerciales (`BUY`, `SELL`, `SL`, `TP`, `RR`, `win rate`, `profitability`).

### B. HIDDEN ENGINE RECORD (`CP32_HIDDEN_ENGINE_RECORD/`)
Archivo interno con las detecciones generadas por el motor de producción:
- `engine_records.json`: Contiene las salidas reales producidas por los motores de CP31 para cada `caseId`.

---

## 3. CATEGORÍAS DE CLASIFICACIÓN DEL REVISOR HUMANO

Para cada caso y concepto evaluado, el revisor deberá seleccionar exactamente una de las siguientes opciones:

1. **`CLEAR`**: La evidencia visual y contextual es clara y cumple sin ambigüedad la especificación CP30.
2. **`BORDERLINE`**: Existe evidencia razonable, pero se presenta ambigüedad o sutileza conceptual.
3. **`QUESTIONABLE`**: La presencia del concepto es difícil de justificar bajo CP30 o existen dudas estructurales.
4. **`NOT_PRESENT`**: El concepto no está presente en la situación observada.
5. **`CONCEPTO_NO_DETERMINISTA`**: La especificación CP30 no provee una regla operacional determinista suficiente para decidir el caso de forma reproducible.

---

## 4. PROCESO DE SELLADO Y FASE POSTERIOR

1. **Completado**: Gonzalo completa `CP32_HUMAN_REVIEW_FORM.csv` de forma independiente sin asistencia ni sugerencias de Antigravity.
2. **Sellado**: Al finalizar la revisión, se genera `CP32_HUMAN_REVIEW_SEALED.json` congelando las respuestas con su respectivo hash criptográfico.
3. **Comparación Posterior**: Únicamente tras el sellado, Antigravity cargará el formulario sellado y el `HIDDEN_ENGINE_RECORD` para generar `CP32_COMPARISON_REPORT.md`.

---

## 5. REGLAS DE SEGURIDAD Y CERO OPTIMIZACIÓN

- Queda prohibido modificar el código de producción, parámetros o thresholds durante o después de la validación.
- Las discrepancias identificadas se clasificarán cualitativamente sin alterar retroactivamente las respuestas del revisor ni forzar la coincidencia del detector.
