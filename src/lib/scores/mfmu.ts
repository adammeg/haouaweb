import type { ScoreResult } from "./types";

/**
 * Score MFMU AVAC — Maternal-Fetal Medicine Units Network.
 * Modèle logistique simplifié porté de v50 `calcMFMU` (lignes 13204–13233).
 */

export interface MFMUInput {
  age: number;
  imc: number;
  ethnie: "autre" | "noire" | "hispanique";
  /** Antécédent AVB : 'non' | 'avant' (avant césarienne) | 'apres' (après césarienne). */
  avb: "non" | "avant" | "apres";
  /** Indication de la précédente césarienne : 'autre' | 'dfcp' (disproportion). */
  indication: "autre" | "dfcp";
  terme: number;
}

export const MFMU_DEFAULT: MFMUInput = {
  age: 34,
  imc: 24,
  ethnie: "autre",
  avb: "non",
  indication: "autre",
  terme: 38,
};

export function calcMFMU(input: MFMUInput): ScoreResult {
  let logit = 3.341;
  logit += -0.054 * input.age;
  logit += -0.06 * input.imc;
  if (input.ethnie === "noire") logit -= 0.45;
  if (input.ethnie === "hispanique") logit -= 0.3;
  if (input.avb === "avant") logit += 0.89;
  if (input.avb === "apres") logit += 1.2;
  if (input.indication === "dfcp") logit -= 0.65;

  const prob = Math.round(100 / (1 + Math.exp(-logit)));
  const clamped = Math.max(5, Math.min(97, prob));

  let level: ScoreResult["level"];
  let label: string;
  let interpretation: string;
  if (clamped >= 70) {
    level = "low";
    label = "Pronostic favorable";
    interpretation =
      "<strong>Pronostic favorable ✅</strong><br>Probabilité élevée de succès d'AVB. L'épreuve du travail est recommandée sous surveillance adaptée.";
  } else if (clamped >= 50) {
    level = "medium";
    label = "Pronostic intermédiaire";
    interpretation =
      "<strong>Pronostic intermédiaire ⚠️</strong><br>Succès possible mais incertain. Discuter avec la patiente et adapter la surveillance. Consentement éclairé nécessaire.";
  } else {
    level = "high";
    label = "Pronostic défavorable";
    interpretation =
      "<strong>Pronostic défavorable ❌</strong><br>Risque élevé d'échec de l'épreuve du travail. La césarienne programmée peut être préférable. Décision collégiale recommandée.";
  }

  return {
    value: `${clamped} %`,
    raw: clamped,
    max: 100,
    level,
    label,
    interpretation,
  };
}
