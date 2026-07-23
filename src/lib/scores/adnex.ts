import type { ScoreResult } from "./types";

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
  age: 45,
  ca125: 35,
  cystMaxMm: 40,
  solidPct: 0,
  papillaryProjections: 0,
  acousticShadows: false,
  ascites: false,
  oncologyCenter: false,
};

export function calcADNEX(input: ADNEXInput): ScoreResult | null {
  const { age, ca125, cystMaxMm } = input;
  if (!ca125 || !cystMaxMm || ca125 <= 0 || cystMaxMm <= 0) return null;

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
    0.0222 * (age || 50) +
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

  if (prob >= 0.3) {
    return {
      value: `${pctStr}%`,
      raw: pct,
      max: 100,
      level: "high",
      label: "Risque élevé",
      interpretation: `ADNEX simplifié (IOTA) : risque de malignité <strong>${pctStr}%</strong> (seuil &gt; 30%).<br>RCP oncogynécologique urgente. IRM pelvienne.`,
      details: [{ label: "Probabilité", value: `${pctStr}%` }],
    };
  }
  if (prob >= 0.1) {
    return {
      value: `${pctStr}%`,
      raw: pct,
      max: 100,
      level: "medium",
      label: "Risque intermédiaire",
      interpretation: `Risque intermédiaire <strong>${pctStr}%</strong>. Centre de référence oncogynécologie.`,
      details: [{ label: "Probabilité", value: `${pctStr}%` }],
    };
  }
  return {
    value: `${pctStr}%`,
    raw: pct,
    max: 100,
    level: "ok",
    label: "Risque faible",
    interpretation: `Risque faible <strong>${pctStr}%</strong>. Suivi échographique à 3 mois.<br><em>Score simplifié IOTA — confirmer sur calculateur officiel si besoin.</em>`,
    details: [{ label: "Probabilité", value: `${pctStr}%` }],
  };
}
