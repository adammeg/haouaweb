import type { ScoreResult } from "./types";

/**
 * Score de Flamm & Geiger (Obstet Gynecol 1997) — succès d'une tentative de voie basse
 * après césarienne, évalué à l'admission en travail. Total 0 à 10.
 */

export interface FlammInput {
  /** Âge < 40 ans = 2, sinon 0. */
  age: 0 | 2;
  /** Voie basse antérieure : aucune 0, avant la césarienne 1, après 2, avant et après 4. */
  avb: 0 | 1 | 2 | 4;
  /** Indication de la première césarienne autre que stagnation de la dilatation = 1. */
  ind: 0 | 1;
  /** Effacement du col à l'admission : < 25 % 0, 25–75 % 1, > 75 % 2. */
  effacement: 0 | 1 | 2;
  /** Dilatation ≥ 4 cm à l'admission = 1. */
  dilatation: 0 | 1;
}

export const FLAMM_DEFAULT: FlammInput = {
  age: 2,
  avb: 0,
  ind: 0,
  effacement: 0,
  dilatation: 0,
};

/** Taux de succès observés dans la cohorte d'origine. */
function successRate(score: number): number {
  if (score <= 2) return 49;
  if (score === 3) return 60;
  if (score === 4) return 67;
  if (score === 5) return 77;
  if (score === 6) return 88;
  if (score === 7) return 93;
  return 95;
}

export function calcFlamm(input: FlammInput): ScoreResult {
  const score =
    input.age + input.avb + input.ind + input.effacement + input.dilatation;
  const rate = successRate(score);

  let level: ScoreResult["level"];
  let label: string;
  if (score >= 6) {
    level = "low";
    label = "Pronostic très favorable";
  } else if (score >= 4) {
    level = "low";
    label = "Pronostic favorable";
  } else if (score === 3) {
    level = "medium";
    label = "Pronostic intermédiaire";
  } else {
    level = "high";
    label = "Pronostic réservé";
  }

  return {
    value: `${score} / 10`,
    raw: score,
    max: 10,
    level,
    label,
    interpretation: `<strong>${label} (score ${score}/10)</strong><br>Taux de succès de la voie basse observé dans la cohorte d'origine : environ ${rate} %. Score calculé à l'admission en travail ; il informe la discussion avec la patiente et ne constitue pas à lui seul une indication de césarienne. [Flamm &amp; Geiger 1997]`,
  };
}
