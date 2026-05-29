import type { ScoreResult } from "./types";

export interface ROMAInput {
  ca125: number;
  he4: number;
  postmenopause: boolean;
}

export const ROMA_DEFAULT: ROMAInput = {
  ca125: 35,
  he4: 70,
  postmenopause: true,
};

export function calcROMA(input: ROMAInput): ScoreResult | null {
  const { ca125, he4, postmenopause } = input;
  if (!ca125 || !he4 || ca125 <= 0 || he4 <= 0) return null;

  const pi = postmenopause
    ? -8.09 + 1.04 * Math.log(he4) + 0.732 * Math.log(ca125)
    : -12.0 + 2.38 * Math.log(he4) + 0.0626 * Math.log(ca125);
  const roma = (Math.exp(pi) / (1 + Math.exp(pi))) * 100;
  const thr = postmenopause ? 25.3 : 11.4;
  const mnm = postmenopause ? "post" : "pré";

  if (roma >= thr) {
    return {
      value: `${roma.toFixed(1)}%`,
      raw: roma,
      max: 100,
      level: "high",
      label: "ROMA élevé",
      interpretation: `ROMA <strong>${roma.toFixed(1)}%</strong> ≥ seuil ${thr}% (${mnm}-ménopause).<br>RCP oncologique dans les 2 semaines. IRM pelvienne si non faite.`,
      details: [
        { label: "Seuil", value: `${thr}%` },
        { label: "CA-125", value: `${ca125} U/mL` },
        { label: "HE4", value: `${he4} pmol/L` },
      ],
    };
  }

  return {
    value: `${roma.toFixed(1)}%`,
    raw: roma,
    max: 100,
    level: "ok",
    label: "ROMA faible",
    interpretation: `ROMA <strong>${roma.toFixed(1)}%</strong> &lt; seuil ${thr}% (${mnm}-ménopause).<br>Suivi échographique à 3 mois.`,
    details: [
      { label: "Seuil", value: `${thr}%` },
      { label: "CA-125", value: `${ca125} U/mL` },
      { label: "HE4", value: `${he4} pmol/L` },
    ],
  };
}
