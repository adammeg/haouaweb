import type { ScoreResult } from "./types";

/**
 * Score risque HPP (Hémorragie du Post-Partum).
 * Port fidèle de v50 `calcHPP` (lignes 22240–22261).
 */

export interface HPPInput {
  cicat: 0 | 1 | 2;
  multi: 0 | 1;
  /** Macrosomie ou gémellité (0/1/2). */
  macro: 0 | 1 | 2;
  placenta: 0 | 1 | 2;
  coag: 0 | 1;
  anemie: 0 | 1;
  travail: 0 | 1;
  atcd: 0 | 1;
  infection: 0 | 1;
}

export const HPP_DEFAULT: HPPInput = {
  cicat: 0,
  multi: 0,
  macro: 0,
  placenta: 0,
  coag: 0,
  anemie: 0,
  travail: 0,
  atcd: 0,
  infection: 0,
};

export function calcHPP(input: HPPInput): ScoreResult {
  const score =
    input.cicat +
    input.multi +
    input.macro +
    input.placenta +
    input.coag +
    input.anemie +
    input.travail +
    input.atcd +
    input.infection;

  let level: ScoreResult["level"];
  let label: string;
  let interpretation: string;
  if (score === 0) {
    level = "low";
    label = "Risque habituel";
    interpretation =
      "Prise en charge standard. Ocytocine systématique à la délivrance.";
  } else if (score <= 2) {
    level = "medium";
    label = "Risque modéré";
    interpretation =
      "Voie veineuse à l'admission. Commande de CG. Présence pédiatre si nécessaire.";
  } else if (score <= 4) {
    level = "high";
    label = "Risque élevé";
    interpretation =
      "2 VVP. Bilan pré-op. Commande CG + PFC. Anesthésiste prévenu. Ocytocine augmentée.";
  } else {
    level = "critical";
    label = "Risque très élevé";
    interpretation =
      "Équipe chirurgicale en alerte. CEC / artère utérine à anticiper. Réa obstétricale.";
  }

  return {
    value: `${score} point${score > 1 ? "s" : ""}`,
    raw: score,
    max: 11,
    level,
    label,
    interpretation,
  };
}
