import type { ScoreResult } from "./types";

/**
 * Modèle MFMU de succès d'une tentative de voie basse après césarienne — Grobman et al., Obstet Gynecol 2007.
 * Variables recueillies à la première consultation prénatale.
 * Le MFMU a publié en 2021 un modèle sans variable ethnique : à intégrer après vérification de ses coefficients.
 */

export interface MFMUInput {
  age: number;
  /** IMC à la première consultation prénatale. */
  imc: number;
  ethnie: "autre" | "noire" | "hispanique";
  /** Voie basse antérieure : aucune, avant la césarienne seulement, ou après la césarienne. */
  avb: "non" | "avant" | "apres";
  /** Indication de la césarienne antérieure : récurrente (arrêt de dilatation ou de descente) ou autre. */
  indication: "autre" | "dfcp";
}

export const MFMU_DEFAULT: MFMUInput = {
  age: 0,
  imc: 0,
  ethnie: "autre",
  avb: "non",
  indication: "autre",
};

export function calcMFMU(input: MFMUInput): ScoreResult | null {
  if (!input.age || !input.imc || input.age <= 0 || input.imc <= 0) return null;

  let logit = 3.766;
  logit += -0.039 * input.age;
  logit += -0.06 * input.imc;
  if (input.ethnie === "noire") logit -= 0.671;
  if (input.ethnie === "hispanique") logit -= 0.68;
  if (input.avb !== "non") logit += 0.888;
  if (input.avb === "apres") logit += 1.003;
  if (input.indication === "dfcp") logit -= 0.632;

  const prob = Math.round(100 / (1 + Math.exp(-logit)));

  let level: ScoreResult["level"];
  let label: string;
  if (prob >= 70) {
    level = "low";
    label = "Probabilité de succès élevée";
  } else if (prob >= 50) {
    level = "medium";
    label = "Probabilité de succès intermédiaire";
  } else {
    level = "high";
    label = "Probabilité de succès faible";
  }

  return {
    value: `${prob} %`,
    raw: prob,
    max: 100,
    level,
    label,
    interpretation: `<strong>${label}</strong><br>Probabilité estimée de succès de la voie basse : ${prob} % (modèle MFMU, Grobman 2007). Outil d'information pour la décision partagée : il ne constitue pas à lui seul une indication de césarienne. La version 2021 du modèle n'utilise plus de variable ethnique.`,
  };
}
