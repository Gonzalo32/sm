# CP32.6 — INSTRUCCIONES DE REVISIÓN HUMANA REDUCIDA (50 CASOS)

> **Revisor**: Gonzalo  
> **Muestra**: 50 Casos Estratificados (MNQ / NQ x 1m, 5m, 15m)  
> **Organización**: 5 Tandas de 10 casos  

---

## OBJETIVO Y REGLAS DE EVALUACIÓN

1. Evalúe conceptualmente la evidencia visual en las velas para cada `case_id`.
2. Para cada caso, asigne exactamente una de las siguientes 5 categorías oficiales en `CP32.6_HUMAN_REVIEW_FORM.csv`:
   - **CLEAR**: La evidencia visual/estructural es clara y satisface la definición conceptual de CP30.
   - **BORDERLINE**: Existe evidencia razonable pero hay ambigüedad o sutileza.
   - **QUESTIONABLE**: La presencia del concepto es difícil de justificar bajo CP30.
   - **NOT_PRESENT**: El concepto no está presente en la situación observada.
   - **CONCEPTO_NO_DETERMINISTA**: CP30 no proporciona una regla operacional determinista suficiente para decidir.
3. Complete la columna `reviewer_note` (opcional) si desea registrar alguna duda o detalle visual.
4. No intente adivinar qué detectó el indicador en producción.

---

## REVISIÓN POR TANDAS (10 CASOS POR TANDA)

- **Tanda 1**: Casos 1 a 10
- **Tanda 2**: Casos 11 a 20
- **Tanda 3**: Casos 21 a 30
- **Tanda 4**: Casos 31 a 40
- **Tanda 5**: Casos 41 a 50

Puede visualizar cada tanda abriendo el visor estático local `viewer.html` en el navegador o revisando `cases.json`.
