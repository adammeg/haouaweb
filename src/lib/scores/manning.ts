import type { ScoreResult } from "./types";

/**
 * Score de Manning — bien-être fœtal.
 * Port fidèle de v50 `calcManning` (lignes 13272–13287).
 */

export interface ManningInput {
  rcf: 0 | 2;
  resp: 0 | 2;
  mov: 0 | 2;
  tonus: 0 | 2;
  la: 0 | 2;
}

export const MANNING_DEFAULT: ManningInput = {
  rcf: 2,
  resp: 2,
  mov: 2,
  tonus: 2,
  la: 2,
};

export function calcManning(input: ManningInput): ScoreResult {
  const score = input.rcf + input.resp + input.mov + input.tonus + input.la;
  let level: ScoreResult["level"];
  let label: string;
  let interpretation: string;
  if (score === 10) {
    level = "low";
    label = "Bien-être excellent";
    interpretation =
      "<strong>Bien-être fœtal excellent ✅ (10/10)</strong><br>Risque d'asphyxie inférieur à 1/1000. Surveillance standard.";
  } else if (score >= 8) {
    level = "low";
    label = "Bien-être satisfaisant";
    interpretation = `<strong>Bien-être fœtal satisfaisant ✅ (${score}/10)</strong><br>Risque d'asphyxie faible (<1%). Réévaluation dans 1 semaine ou selon contexte.`;
  } else if (score === 6) {
    level = "medium";
    label = "Équivoque";
    interpretation =
      "<strong>Équivoque ⚠️ (6/10)</strong><br>Zone suspecte. Réévaluation dans 24h. Envisager déclenchement si terme ≥36 SA.";
  } else if (score === 4) {
    level = "high";
    label = "Suspicion de souffrance fœtale";
    interpretation =
      "<strong>Suspicion de souffrance fœtale ❌ (4/10)</strong><br>Prise en charge active recommandée. Extraction selon terme et contexte clinique.";
  } else {
    level = "critical";
    label = "Souffrance fœtale probable";
    interpretation = `<strong>Souffrance fœtale probable 🚨 (${score}/10)</strong><br>Indication d'extraction fœtale urgente. Ne pas différer.`;
  }
  return {
    value: `${score} / 10`,
    raw: score,
    max: 10,
    level,
    label,
    interpretation,
  };
}
