import type { ScoreResult } from "./types";

/**
 * Score de Bishop — maturité cervicale.
 * Port fidèle de v50 `calcBishop` (lignes 13254–13269).
 */

export interface BishopInput {
  /** Dilatation : 0..3. */
  dil: 0 | 1 | 2 | 3;
  /** Effacement : 0..3. */
  eff: 0 | 1 | 2 | 3;
  /** Consistance : 0..2. */
  cons: 0 | 1 | 2;
  /** Position : 0..2. */
  pos: 0 | 1 | 2;
  /** Hauteur de la présentation : 0..3. */
  haut: 0 | 1 | 2 | 3;
}

export const BISHOP_DEFAULT: BishopInput = {
  dil: 0,
  eff: 0,
  cons: 0,
  pos: 0,
  haut: 0,
};

export function calcBishop(input: BishopInput): ScoreResult {
  const score = input.dil + input.eff + input.cons + input.pos + input.haut;
  let level: ScoreResult["level"];
  let label: string;
  let interpretation: string;
  if (score >= 9) {
    level = "low";
    label = "Col très favorable";
    interpretation = `<strong>Col très favorable ✅ (${score}/13)</strong><br>Déclenchement du travail très probable de succès. Ocytocine seule suffisante.`;
  } else if (score >= 7) {
    level = "low";
    label = "Col favorable";
    interpretation = `<strong>Col favorable ✅ (${score}/13)</strong><br>Déclenchement du travail recommandable. Bon taux de succès attendu.`;
  } else if (score >= 5) {
    level = "medium";
    label = "Col moyennement favorable";
    interpretation = `<strong>Col moyennement favorable ⚠️ (${score}/13)</strong><br>Maturation cervicale préalable conseillée (prostaglandines / ballonnet).`;
  } else {
    level = "high";
    label = "Col défavorable";
    interpretation = `<strong>Col défavorable ❌ (${score}/13)</strong><br>Maturation cervicale indispensable avant déclenchement. Risque élevé d'échec sans préparation.`;
  }
  return {
    value: `${score} / 13`,
    raw: score,
    max: 13,
    level,
    label,
    interpretation,
  };
}
