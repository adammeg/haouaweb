import type { ScoreResult } from "./types";

/**
 * Score Flamm & Geiger — prédiction succès AVAC.
 * Port fidèle de v50 `calcFlamm` (lignes 13236–13251).
 */

export interface FlammInput {
  /** Âge < 40 ans = 2, sinon 0. */
  age: 0 | 2;
  /** AVB antérieur = 2 si oui, 0 sinon. */
  avb: 0 | 2;
  /** Indication précédente césarienne (autre que dystocie) : 0 ou 1. */
  ind: 0 | 1;
  /** Effacement col à l'admission : 0..2. */
  col: 0 | 1 | 2;
  /** Travail spontané : 0 ou 1. */
  travail: 0 | 1;
}

export const FLAMM_DEFAULT: FlammInput = {
  age: 2,
  avb: 0,
  ind: 0,
  col: 0,
  travail: 0,
};

export function calcFlamm(input: FlammInput): ScoreResult {
  const score =
    input.age + input.avb + input.ind + input.col + input.travail;

  let level: ScoreResult["level"];
  let label: string;
  let interpretation: string;
  if (score >= 5) {
    level = "low";
    label = "Excellent pronostic";
    interpretation = `<strong>Excellent pronostic ✅ (score ${score}/7)</strong><br>Probabilité de succès >80%. L'AVAC est fortement recommandé.`;
  } else if (score === 4) {
    level = "low";
    label = "Bon pronostic";
    interpretation =
      "<strong>Bon pronostic ✅ (score 4/7)</strong><br>Probabilité de succès ~70-80%. L'épreuve du travail est recommandée.";
  } else if (score === 3) {
    level = "medium";
    label = "Pronostic réservé";
    interpretation =
      "<strong>Pronostic réservé ⚠️ (score 3/7)</strong><br>Probabilité de succès ~50-60%. Décision individualisée, information de la patiente.";
  } else {
    level = "high";
    label = "Pronostic défavorable";
    interpretation = `<strong>Pronostic défavorable ❌ (score ${score}/7)</strong><br>Probabilité de succès <50%. Césarienne programmée à discuter sérieusement.`;
  }

  return {
    value: `${score} / 7`,
    raw: score,
    max: 7,
    level,
    label,
    interpretation,
  };
}
