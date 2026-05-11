import type { ScoreResult } from "./types";

/**
 * Classification rASRM endométriose.
 * Port fidèle de v50 `calcRASRM` (lignes 22349–22366).
 */

export interface RASRMInput {
  /** Péritoine superficiel. */
  periS: number;
  /** Péritoine profond. */
  periP: number;
  /** Ovaire droit superficiel. */
  ovdS: number;
  /** Ovaire droit profond. */
  ovdE: number;
  /** Ovaire gauche superficiel. */
  ovgS: number;
  /** Ovaire gauche profond. */
  ovgE: number;
  /** Adhérences trompe droite. */
  trd: number;
  /** Adhérences trompe gauche. */
  trg: number;
  /** Oblitération cul-de-sac de Douglas. */
  cds: number;
}

export const RASRM_DEFAULT: RASRMInput = {
  periS: 0,
  periP: 0,
  ovdS: 0,
  ovdE: 0,
  ovgS: 0,
  ovgE: 0,
  trd: 0,
  trg: 0,
  cds: 0,
};

export function calcRASRM(input: RASRMInput): ScoreResult {
  const score =
    input.periS +
    input.periP +
    input.ovdS +
    input.ovdE +
    input.ovgS +
    input.ovgE +
    input.trd +
    input.trg +
    input.cds;

  let stade: string;
  let level: ScoreResult["level"];
  let interpretation: string;
  if (score <= 5) {
    stade = "Stade I — Minime";
    level = "low";
    interpretation =
      "Lésions superficielles isolées. Peu de retentissement sur la fertilité.";
  } else if (score <= 15) {
    stade = "Stade II — Léger";
    level = "medium";
    interpretation =
      "Lésions superficielles + profondes limitées. Légère atteinte de la fertilité.";
  } else if (score <= 40) {
    stade = "Stade III — Modéré";
    level = "high";
    interpretation =
      "Endométriomes ± adhérences modérées. Chirurgie recommandée si infertilité.";
  } else {
    stade = "Stade IV — Sévère";
    level = "critical";
    interpretation =
      "Endométriomes volumineux + adhérences denses. Chirurgie complexe. FIV à discuter.";
  }

  return {
    value: `${score} points`,
    raw: score,
    max: 100,
    level,
    label: stade,
    interpretation,
  };
}
