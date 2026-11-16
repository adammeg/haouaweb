import type { ScoreResult } from "./types";

/**
 * Estimation simplifiée du risque de malignité d'une masse annexielle.
 * Ce n'est PAS le modèle IOTA ADNEX (multinomial, 9 variables, 5 catégories) : équation binaire
 * héritée du prototype, sans validation publiée. Résultat indicatif uniquement.
 */

export interface ADNEXInput {
  age: number;
  ca125: number;
  cystMaxMm: number;
  solidPct: number;
  papillaryProjections: number;
  acousticShadows: boolean;
  ascites: boolean;
  oncologyCenter: boolean;
}

export const ADNEX_DEFAULT: ADNEXInput = {
  age: 0,
  ca125: 0,
  cystMaxMm: 0,
  solidPct: 0,
  papillaryProjections: 0,
  acousticShadows: false,
  ascites: false,
  oncologyCenter: false,
};

const DISCLAIMER =
  "<br><em>Estimation simplifiée non validée — ce n'est pas le modèle IOTA ADNEX. Confirmer avec le calculateur officiel IOTA ADNEX avant toute décision.</em>";

export function calcADNEX(input: ADNEXInput): ScoreResult | null {
  const { age, ca125, cystMaxMm } = input;
  if (!age || age <= 0 || !ca125 || !cystMaxMm || ca125 <= 0 || cystMaxMm <= 0) return null;

  const ca125Log = Math.log(Math.max(1, ca125) + 1);
  const diamLog = Math.log(Math.max(1, cystMaxMm) + 1);
  const solid = (input.solidPct || 0) / 100;
  const pap = Math.min(4, input.papillaryProjections || 0);
  const papCoefficient = pap >= 4 ? 0.6144 : pap >= 1 ? 0.3166 : 0;
  const shadow = input.acousticShadows ? 1 : 0;
  const ascite = input.ascites ? 1 : 0;
  const center = input.oncologyCenter ? 1 : 0;

  const logit =
    -5.3718 +
    0.0222 * age +
    0.4809 * ca125Log +
    0.545 * diamLog +
    1.2945 * solid +
    papCoefficient -
    0.5628 * shadow +
    0.8698 * ascite +
    0.4342 * center;

  const prob = 1 / (1 + Math.exp(-logit));
  const pct = prob * 100;
  const pctStr = pct.toFixed(1);
  const details = [{ label: "Estimation", value: `${pctStr}%` }];

  if (prob >= 0.1) {
    return {
      value: `${pctStr}%`,
      raw: pct,
      max: 100,
      level: prob >= 0.3 ? "high" : "medium",
      label: prob >= 0.3 ? "Risque estimé élevé" : "Risque estimé ≥ 10 %",
      interpretation: `Risque de malignité estimé à <strong>${pctStr}%</strong> (≥ 10 %, seuil d'orientation habituel). Échographie de référence et/ou IRM, avis d'oncologie gynécologique.${DISCLAIMER}`,
      details,
    };
  }
  return {
    value: `${pctStr}%`,
    raw: pct,
    max: 100,
    level: "ok",
    label: "Risque estimé faible",
    interpretation: `Risque de malignité estimé à <strong>${pctStr}%</strong> (&lt; 10 %). La conduite repose sur l'aspect échographique (règles simples IOTA, O-RADS).${DISCLAIMER}`,
    details,
  };
}
