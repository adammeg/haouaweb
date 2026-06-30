/** Normalisation texte pour recherche médicaments (accents, casse). */

export function normalizeMedQuery(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9+./\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tokens significatifs d'un nom commercial */
export function tokenizeNom(nom: string): string[] {
  return normalizeMedQuery(nom)
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

/** Extrait une dose probable depuis le nom commercial */
export function extractDoseFromNom(nom: string): string {
  const m = nom.match(
    /(\d+(?:[.,]\d+)?\s*(?:mg|g|mcg|µg|ui|u\.?i\.?|ml|cl|%)(?:\s*\/\s*\d+(?:[.,]\d+)?\s*(?:mg|ml))?)/i,
  );
  return m ? m[1]!.replace(/\s+/g, " ").trim() : "";
}

/** Nom court pour affichage (première partie avant forme galénique) */
export function shortNomCommercial(nom: string): string {
  const cleaned = nom.replace(/\s+/g, " ").trim();
  const cut = cleaned.search(
    /\b(comp|gel|gél|pdre|susp|sol|inj|sachet|bt|fl|amp|supp|efferv|caps|creme|pommade)\b/i,
  );
  if (cut > 4) return cleaned.slice(0, cut).trim();
  return cleaned.length > 48 ? cleaned.slice(0, 45) + "…" : cleaned;
}
