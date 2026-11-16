import type { ScoreResult } from "./types";

/** ROMA (Moore 2009). Les seuils dépendent de la technique de dosage HE4/CA-125. */

export type RomaAssay = "roche" | "abbott" | "fujirebio";

export const ROMA_THRESHOLDS: Record<RomaAssay, { label: string; pre: number; post: number }> = {
  roche: { label: "Roche Elecsys", pre: 11.4, post: 29.9 },
  abbott: { label: "Abbott Architect", pre: 7.4, post: 25.3 },
  fujirebio: { label: "Fujirebio EIA", pre: 13.1, post: 27.7 },
};

export interface ROMAInput {
  ca125: number;
  he4: number;
  postmenopause: boolean;
  /** Technique de dosage ; Roche Elecsys par défaut. */
  assay?: RomaAssay;
}

export const ROMA_DEFAULT: ROMAInput = {
  ca125: 0,
  he4: 0,
  postmenopause: true,
  assay: "roche",
};

export function calcROMA(input: ROMAInput): ScoreResult | null {
  const { ca125, he4, postmenopause } = input;
  if (!ca125 || !he4 || ca125 <= 0 || he4 <= 0) return null;

  const pi = postmenopause
    ? -8.09 + 1.04 * Math.log(he4) + 0.732 * Math.log(ca125)
    : -12.0 + 2.38 * Math.log(he4) + 0.0626 * Math.log(ca125);
  const roma = (Math.exp(pi) / (1 + Math.exp(pi))) * 100;
  const assay = ROMA_THRESHOLDS[input.assay ?? "roche"];
  const thr = postmenopause ? assay.post : assay.pre;
  const mnm = postmenopause ? "post" : "pré";
  const high = roma >= thr;

  return {
    value: `${roma.toFixed(1)}%`,
    raw: roma,
    max: 100,
    level: high ? "high" : "ok",
    label: high ? "ROMA élevé" : "ROMA faible",
    interpretation: high
      ? `ROMA <strong>${roma.toFixed(1)}%</strong> ≥ seuil ${thr}% (${mnm}-ménopause, ${assay.label}).<br>Risque élevé de cancer épithélial de l'ovaire : avis d'oncologie gynécologique, à confronter à l'échographie (IOTA) et à l'IRM.`
      : `ROMA <strong>${roma.toFixed(1)}%</strong> &lt; seuil ${thr}% (${mnm}-ménopause, ${assay.label}).<br>Risque faible selon les marqueurs ; n'exclut pas une tumeur borderline, mucineuse ou non épithéliale. La conduite repose sur l'échographie.`,
    details: [
      { label: "Seuil", value: `${thr}% (${assay.label})` },
      { label: "CA-125", value: `${ca125} U/mL` },
      { label: "HE4", value: `${he4} pmol/L` },
    ],
  };
}
