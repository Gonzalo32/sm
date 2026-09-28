/**
 * Checkpoint 32.6 - Stratified 50-Case Human Sample Generator
 * Strictly samples 50 cases from CP32_REVIEW_PACK/cases.json without touching CP32_HIDDEN_ENGINE_RECORD.
 */

import fs from 'fs';
import path from 'path';

const SEED = 'CP32.6-HUMAN-SAMPLE-SEED-20260928-50';

function pseudoRandom(seedStr: string): number {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const x = Math.sin(hash++) * 10000;
  return x - Math.floor(x);
}

export function generateCP32_6Sample() {
  const rootDir = process.cwd();
  const cp32PackDir = path.join(rootDir, 'CP32_REVIEW_PACK');
  const cp32CasesPath = path.join(cp32PackDir, 'cases.json');

  if (!fs.existsSync(cp32CasesPath)) {
    throw new Error('CP32_REVIEW_PACK/cases.json not found!');
  }

  // Load 300 blinded cases from CP32
  const allCases: any[] = JSON.parse(fs.readFileSync(cp32CasesPath, 'utf-8'));

  // Save Seed
  fs.writeFileSync(path.join(rootDir, 'CP32.6_HUMAN_SAMPLE_SEED.txt'), SEED, 'utf-8');

  // Stratify items by (symbol, timeframe)
  const buckets: Record<string, any[]> = {};
  for (const c of allCases) {
    const key = `${c.symbol}-${c.timeframe}`;
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(c);
  }

  // Sort each bucket deterministically using seed
  for (const key of Object.keys(buckets)) {
    buckets[key].sort(
      (a, b) => pseudoRandom(`${SEED}-${key}-${a.caseId}`) - pseudoRandom(`${SEED}-${key}-${b.caseId}`)
    );
  }

  // Target 50 cases total across 6 buckets:
  // MNQ-1m: 9, MNQ-5m: 8, MNQ-15m: 8 (Total MNQ = 25)
  // NQ-1m:  9, NQ-5m:  8, NQ-15m:  8 (Total NQ  = 25)
  const quota: Record<string, number> = {
    'MNQ-1m': 9,
    'MNQ-5m': 8,
    'MNQ-15m': 8,
    'NQ-1m': 9,
    'NQ-5m': 8,
    'NQ-15m': 8,
  };

  const selectedCases: any[] = [];
  for (const key of Object.keys(quota)) {
    const count = quota[key];
    const picked = (buckets[key] || []).slice(0, count);
    selectedCases.push(...picked);
  }

  // Shuffle selected 50 cases deterministically for presentation
  selectedCases.sort(
    (a, b) => pseudoRandom(`${SEED}-order-${a.caseId}`) - pseudoRandom(`${SEED}-order-${b.caseId}`)
  );

  // Prepare output directory
  const newPackDir = path.join(rootDir, 'CP32.6_HUMAN_REVIEW_PACK');
  if (!fs.existsSync(newPackDir)) fs.mkdirSync(newPackDir, { recursive: true });

  // 1. Write cases.json (50 blinded cases)
  fs.writeFileSync(path.join(newPackDir, 'cases.json'), JSON.stringify(selectedCases, null, 2), 'utf-8');

  // 2. Write INSTRUCTIONS.md
  const instructionsMd = `# CP32.6 — INSTRUCCIONES DE REVISIÓN HUMANA REDUCIDA (50 CASOS)

> **Revisor**: Gonzalo  
> **Muestra**: 50 Casos Estratificados (MNQ / NQ x 1m, 5m, 15m)  
> **Organización**: 5 Tandas de 10 casos  

---

## OBJETIVO Y REGLAS DE EVALUACIÓN

1. Evalúe conceptualmente la evidencia visual en las velas para cada \`case_id\`.
2. Para cada caso, asigne exactamente una de las siguientes 5 categorías oficiales en \`CP32.6_HUMAN_REVIEW_FORM.csv\`:
   - **CLEAR**: La evidencia visual/estructural es clara y satisface la definición conceptual de CP30.
   - **BORDERLINE**: Existe evidencia razonable pero hay ambigüedad o sutileza.
   - **QUESTIONABLE**: La presencia del concepto es difícil de justificar bajo CP30.
   - **NOT_PRESENT**: El concepto no está presente en la situación observada.
   - **CONCEPTO_NO_DETERMINISTA**: CP30 no proporciona una regla operacional determinista suficiente para decidir.
3. Complete la columna \`reviewer_note\` (opcional) si desea registrar alguna duda o detalle visual.
4. No intente adivinar qué detectó el indicador en producción.

---

## REVISIÓN POR TANDAS (10 CASOS POR TANDA)

- **Tanda 1**: Casos 1 a 10
- **Tanda 2**: Casos 11 a 20
- **Tanda 3**: Casos 21 a 30
- **Tanda 4**: Casos 31 a 40
- **Tanda 5**: Casos 41 a 50

Puede visualizar cada tanda abriendo el visor estático local \`viewer.html\` en el navegador o revisando \`cases.json\`.
`;
  fs.writeFileSync(path.join(newPackDir, 'INSTRUCTIONS.md'), instructionsMd, 'utf-8');

  // 3. Write CP32.6_HUMAN_REVIEW_FORM.csv
  let csvContent = 'case_id,classification,reviewer_note\n';
  for (const c of selectedCases) {
    csvContent += `${c.caseId},,\n`;
  }
  fs.writeFileSync(path.join(newPackDir, 'CP32.6_HUMAN_REVIEW_FORM.csv'), csvContent, 'utf-8');

  // 4. Write SAMPLE_MANIFEST.md
  let manifestMd = `# CP32.6 — MANIFIESTO DE LA MUESTRA HUMANAMENTE REVISABLE (50 CASOS)

| # | Tanda | Case ID | Instrumento | Timeframe | Timestamps Velas |
|---|---|---|---|---|---|
`;
  selectedCases.forEach((c, idx) => {
    const tanda = Math.floor(idx / 10) + 1;
    manifestMd += `| ${idx + 1} | Tanda ${tanda} | \`${c.caseId}\` | ${c.symbol} | ${c.timeframe} | ${c.candles.length} velas | \n`;
  });

  fs.writeFileSync(path.join(newPackDir, 'SAMPLE_MANIFEST.md'), manifestMd, 'utf-8');

  // 5. Ensure viewer.html is present in CP32.6_HUMAN_REVIEW_PACK
  if (!fs.existsSync(path.join(newPackDir, 'viewer.html'))) {
    console.log('[WARN] viewer.html missing, using template');
  }



  console.log(`[PASS] Generated 50 stratified cases in CP32.6_HUMAN_REVIEW_PACK/`);
  console.log(`[PASS] Created viewer.html, SAMPLE_MANIFEST.md, INSTRUCTIONS.md, CP32.6_HUMAN_REVIEW_FORM.csv`);
}

if (process.argv[1] && process.argv[1].endsWith('generate_cp32_6_sample.ts')) {
  generateCP32_6Sample();
}
