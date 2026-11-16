import type { ScoreResult } from "./types";

/**
 * Stratification du risque d'hémorragie du post-partum à l'admission.
 * Niveaux inspirés de la grille CMQCC (faible / moyen / élevé) ; ce n'est pas un score chiffré validé.
 * Les valeurs numériques des champs ne servent qu'à distinguer les modalités.
 */

export interface HPPInput {
  cicat: 0 | 1 | 2;
  multi: 0 | 1;
  /** Macrosomie (1) ou gémellité (2). */
  macro: 0 | 1 | 2;
  /** Placenta bas inséré (2) ou prævia (3). */
  placenta: 0 | 2 | 3;
  coag: 0 | 2;
  /** Hb 8–10 g/dL (1) ou < 8 g/dL (2). */
  anemie: 0 | 1 | 2;
  travail: 0 | 1 | 2;
  atcd: 0 | 1 | 2;
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
  const majeurs: string[] = [];
  if (input.placenta > 0) majeurs.push(input.placenta === 3 ? "placenta prævia" : "placenta bas inséré");
  if (input.coag > 0) majeurs.push("trouble de la coagulation");
  if (input.anemie === 2) majeurs.push("anémie sévère (Hb < 8 g/dL)");

  const intermediaires: string[] = [];
  if (input.cicat > 0) intermediaires.push("utérus cicatriciel");
  if (input.multi > 0) intermediaires.push("grande multiparité");
  if (input.macro === 1) intermediaires.push("macrosomie");
  if (input.macro === 2) intermediaires.push("grossesse gémellaire");
  if (input.anemie === 1) intermediaires.push("anémie (Hb 8–10 g/dL)");
  if (input.travail > 0) intermediaires.push("travail prolongé");
  if (input.atcd > 0) intermediaires.push("antécédent d'HPP");
  if (input.infection > 0) intermediaires.push("chorioamniotite / fièvre");

  const total = majeurs.length + intermediaires.length;
  const details = [...majeurs, ...intermediaires].map((f, i) => ({
    label: `Facteur ${i + 1}`,
    value: f,
  }));

  let level: ScoreResult["level"];
  let label: string;
  let interpretation: string;
  if (majeurs.length > 0 || intermediaires.length >= 2) {
    level = "high";
    label = "Risque élevé";
    interpretation =
      "Accouchement dans une maternité disposant des moyens adaptés (placenta prævia ou suspicion d'accreta : centre expert). Deux voies veineuses, groupe et RAI valides, produits sanguins disponibles, anesthésiste et obstétricien prévenus, matériel d'HPP prêt. Prévention par ocytocine à la délivrance.";
  } else if (intermediaires.length === 1) {
    level = "medium";
    label = "Risque intermédiaire";
    interpretation =
      "Voie veineuse fonctionnelle, groupe et RAI valides, vigilance renforcée à la délivrance et dans les 2 heures suivantes. Prévention par ocytocine à la délivrance.";
  } else {
    level = "low";
    label = "Pas de facteur de risque identifié";
    interpretation =
      "Prévention standard : ocytocine à la délivrance et surveillance des 2 heures du post-partum. La majorité des HPP surviennent sans facteur de risque identifiable : la vigilance reste la règle.";
  }

  return {
    value: label,
    raw: Math.min(total, 3),
    max: 3,
    level,
    label: `${total} facteur${total > 1 ? "s" : ""} de risque`,
    interpretation: `${interpretation}<br><em>Stratification inspirée de la grille CMQCC ; outil d'anticipation non validé localement. Conduite en cas d'HPP : CNGOF/HAS 2014.</em>`,
    details: details.length ? details : undefined,
  };
}
