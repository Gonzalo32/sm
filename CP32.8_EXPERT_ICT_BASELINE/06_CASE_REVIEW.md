# CP32.8 — BLIND CASE REVIEW PROTOCOL & METHODOLOGY

> **Baseline Identifier**: `CP32.8-EXPERT-ICT-BASELINE-V1`  
> **Document Status**: Official Review Protocol  

---

## 1. PRINCIPIO DE REVISIÓN CIEGA (BLIND REVIEW PROTOCOL)

Para evitar sesgos de confirmación y garantizar que la evaluación conceptual sea genuinamente independiente, se establece el Protocolo de Revisión Ciega para todas las auditorías de casos actuales y futuras.

### Regla Fundamental de Blind Review
El revisor conceptual experto evalúa las velas de mercado de forma totalmente desvinculada de los resultados del motor informático.

```
DATOS AUTORIZADOS AL REVISOR CIEGO:
┌─────────────────────────────────────────────────────────┐
│ 1. Serie temporal de velas (OHLCV + Timestamps)         │
│ 2. Contexto histórico antecedente                      │
│ 3. Timeframe del gráfico                               │
│ 4. Especificación formal (`02_DEFINITIONS.md`)          │
│ 5. Reglas operativas adoptadas (`03_OPERATIONAL_RULES`) │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
              [ REVISIÓN MANUAL INDEPENDIENTE ]
                           │
                           ▼
               [ ANOTACIÓN EXPERTA CIEGA ]
```

```
DATOS STRICTAMENTE PROHIBIDOS AL REVISOR CIEGO DURANTE LA EVALUACIÓN:
❌ Salida o logs del motor (`ICTEngine`, `StructureEngine`, etc.)
❌ Etiquetas o visualizaciones generadas por el sistema
❌ Clasificación automática de setups
❌ Resultados esperados pre-generados por el asistente de IA
```

---

## 2. ETAPAS DEL PROCESO DE EVALUACIÓN CIEGA

### Etapa 1: Ingesta Ciega de Datos
Se extrae una muestra de precios $S = \{ (Timestamp_t, Open_t, High_t, Low_t, Close_t, Volume_t) \}$ desprovista de cualquier metadato o annotation generada por el software.

### Etapa 2: Anotación Manual Independiente
El experto analiza la muestra aplicando exclusivamente las reglas de `03_OPERATIONAL_RULES.md` y marca manualmente:
- Swings High / Low
- Estructura y BOS / MSS
- Niveles de BSL / SSL y Liquidity Sweeps
- Presencia de FVG y Order Blocks
- Estado del Setup (si aplica)

### Etapa 3: Cruzamiento Auditor (Forensic Matching)
Solo una vez finalizada y sellada la anotación ciega independiente, un script o protocolo auditor compara la anotación del experto contra la salida generada por el motor informático.

### Etapa 4: Clasificación de Discrepancias
Cada divergencia entre la anotación del experto y el resultado del motor se clasifica usando la Taxonomía Oficial de Discrepancias:
- **A**: Implementación incorrecta (Bug en código).
- **B**: Definición operativa incorrecta (Ajuste de regla).
- **C**: Ambigüedad conceptual real (`CONCEPTO_AMBIGUO`).
- **D**: Datos insuficientes.
- **E**: Fuera del alcance V1.
- **F**: Diferencia entre interpretaciones ICT/SMC.

---

## 3. PLANTILLA ESTÁNDAR PARA REPORTE DE CASOS AUDITADOS

Cada caso revisado bajo este protocolo debe registrarse con la siguiente estructura:

```markdown
### CASO AUDITADO # [ID]
- **Instrumento / Par**: [ej. EURUSD]
- **Timeframe**: [ej. 15M]
- **Rango de Fechas / Timestamps**: [Start - End]
- **Anotación Experta Ciega**: [BOS Alcista / FVG / Model A]
- **Salida del Motor**: [Detalle de lo detectado por ICTEngine]
- **Resultado del Cruzamiento**: [COINCIDENCIA / DISCREPANCIA]
- **Clasificación de Discrepancia**: [A / B / C / D / E / F] (si aplica)
- **Justificación Técnica**: [Análisis detallado basado en 02_DEFINITIONS.md]
```

---

## 4. INTEGRIDAD Y REPRODUCIBILIDAD

- Todos los archivos de anotaciones ciegas se guardan con sellado de integridad (checksum / timestamp) antes de realizar la comparación con el motor.
- Antigravity no puede modificar las anotaciones del experto tras conocer el resultado del motor.
