/**
 * Recherche intelligente médicaments VEI.
 * « doli » → Doliprane, Codoliprane… ; « para » → Paracétamol (DCI).
 */

import { normalizeMedQuery, tokenizeNom } from "./normalize";
import type { MedicamentSearchHit, MedicamentVei } from "./types";

type IndexedMed = MedicamentVei & {
  nomNorm: string;
  dciNorm: string;
  tokens: string[];
};

let index: IndexedMed[] | null = null;

export function buildMedicamentIndex(list: MedicamentVei[]): IndexedMed[] {
  return list.map((med) => ({
    ...med,
    nomNorm: normalizeMedQuery(med.nom),
    dciNorm: normalizeMedQuery(med.dci),
    tokens: tokenizeNom(med.nom),
  }));
}

export function setMedicamentIndex(list: MedicamentVei[]): void {
  index = buildMedicamentIndex(list);
}

function scoreEntry(q: string, entry: IndexedMed): MedicamentSearchHit | null {
  if (!q) return null;

  const { nomNorm, dciNorm, tokens } = entry;

  // Correspondance exacte début nom commercial
  if (nomNorm.startsWith(q)) {
    return { med: entry, score: 100, matchField: "nom" };
  }

  // Début DCI
  if (dciNorm.startsWith(q)) {
    return { med: entry, score: 95, matchField: "dci" };
  }

  // Mot du nom commercial commence par la requête (ex. DOLIPRANE dans "DOLIPRANE Comp …")
  for (const tok of tokens) {
    if (tok.startsWith(q)) {
      return { med: entry, score: 92 - (tok.length - q.length) * 0.5, matchField: "nom" };
    }
  }

  // Sous-chaîne au début d'un mot
  for (const tok of tokens) {
    const idx = tok.indexOf(q);
    if (idx === 0 || (idx > 0 && q.length >= 3)) {
      return { med: entry, score: 78 - idx, matchField: "nom" };
    }
  }

  // Contient la requête dans le nom
  if (nomNorm.includes(q)) {
    return { med: entry, score: 70, matchField: "nom" };
  }

  // Contient dans DCI
  if (dciNorm.includes(q)) {
    return { med: entry, score: 65, matchField: "dci" };
  }

  // Sous-séquence floue (d-o-l-i → doliprane)
  if (q.length >= 3 && isSubsequence(q, nomNorm)) {
    return { med: entry, score: 55, matchField: "nom" };
  }
  if (q.length >= 4 && isSubsequence(q, dciNorm)) {
    return { med: entry, score: 50, matchField: "dci" };
  }

  return null;
}

function isSubsequence(needle: string, hay: string): boolean {
  let i = 0;
  for (const c of hay) {
    if (c === needle[i]) i++;
    if (i === needle.length) return true;
  }
  return false;
}

/**
 * Recherche les médicaments correspondant à la requête.
 * @param query Texte saisi (ex. « doli »)
 * @param list Liste complète (ou index pré-construit)
 * @param limit Nombre max de résultats
 */
export function searchMedicaments(
  query: string,
  list: MedicamentVei[],
  limit = 20,
): MedicamentSearchHit[] {
  const q = normalizeMedQuery(query);
  if (!q) return [];

  const pool = index ?? buildMedicamentIndex(list);
  const hits: MedicamentSearchHit[] = [];

  for (const entry of pool) {
    const hit = scoreEntry(q, entry);
    if (hit) hits.push(hit);
  }

  hits.sort((a, b) => b.score - a.score || a.med.nom.localeCompare(b.med.nom, "fr"));

  // Dédupliquer par nom+DCI proches
  const seen = new Set<string>();
  const out: MedicamentSearchHit[] = [];
  for (const h of hits) {
    const key = h.med.dci + "|" + h.med.nom.slice(0, 24);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(h);
    if (out.length >= limit) break;
  }
  return out;
}
