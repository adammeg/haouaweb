/**
 * Formules Hadlock 1985 — estimation du poids fœtal (PFE).
 * log10(PFE) selon les paramètres disponibles.
 */

/** Formule complète 4 paramètres (BIP + PC + PA + LF) — Hadlock 1985 */
export function hadlockPfe4(
  bipMm: number,
  pcMm: number,
  paMm: number,
  lfMm: number,
): number {
  const b = bipMm / 10;
  const h = pcMm / 10;
  const a = paMm / 10;
  const f = lfMm / 10;
  const logEfw =
    1.3596 -
    0.00386 * a * f +
    0.0064 * h +
    0.00061 * b * a +
    0.0424 * a +
    0.174 * f;
  return Math.round(10 ** logEfw);
}

/** Formule 3 paramètres (BIP + PA + LF) — Hadlock 1984 */
export function hadlockPfe3(
  bipMm: number,
  paMm: number,
  lfMm: number,
): number {
  const b = bipMm / 10;
  const a = paMm / 10;
  const f = lfMm / 10;
  const logEfw =
    1.335 - 0.0034 * a * f + 0.0316 * b + 0.0457 * a + 0.1623 * f;
  return Math.round(10 ** logEfw);
}

/**
 * Calcule le PFE selon les mesures disponibles.
 * Priorité : 4 paramètres > 3 paramètres (BIP+PA+LF).
 */
export function computePfeFromBiometry(
  bip?: number,
  pa?: number,
  lf?: number,
  pc?: number,
): number | null {
  if (bip && pa && lf && pc) return hadlockPfe4(bip, pc, pa, lf);
  if (bip && pa && lf) return hadlockPfe3(bip, pa, lf);
  return null;
}
