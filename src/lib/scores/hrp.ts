import type { ScoreResult } from "./types";

export type HrpFoetal = "normal" | "bradycardie" | "mfiu";

export interface HRPInput {
  foetal: HrpFoetal;
  fibrinogen: number;
  platelets: number;
  tp: number;
}

export const HRP_DEFAULT: HRPInput = {
  foetal: "normal",
  fibrinogen: 4,
  platelets: 250,
  tp: 100,
};

export function calcHRP(input: HRPInput): ScoreResult | null {
  const civd =
    input.fibrinogen < 2 ||
    input.platelets < 100 ||
    input.tp < 50;

  let grade: string;
  let level: ScoreResult["level"];
  let interpretation: string;

  if (input.foetal === "mfiu" && civd) {
    grade = "3b";
    level = "critical";
    interpretation =
      "Grade 3b — HRP avec mort fœtale et coagulopathie. Urgence maternelle : réanimation, correction de la coagulopathie (fibrinogène, plasma, plaquettes, acide tranexamique). Voie basse privilégiée si l'état maternel le permet ; césarienne en cas d'instabilité ou d'hémorragie non contrôlée. Risque élevé d'hémorragie du post-partum. [Classification de Sher]";
  } else if (input.foetal === "mfiu") {
    grade = "3a";
    level = "critical";
    interpretation =
      "Grade 3a — HRP avec mort fœtale, sans coagulopathie. Voie basse privilégiée si l'état maternel le permet ; bilan d'hémostase répété (la coagulopathie peut apparaître secondairement) ; prévention de l'hémorragie du post-partum. [Classification de Sher]";
  } else if (input.foetal === "bradycardie") {
    grade = "2";
    level = "high";
    interpretation =
      "Grade 2 — HRP avec anomalies du RCF, fœtus vivant. Naissance en urgence, le plus souvent par césarienne. Bilan d'hémostase en urgence, 2 voies veineuses. [Classification de Sher]";
  } else {
    grade = "1";
    level = "medium";
    interpretation =
      "Grade 1 — HRP léger ou suspicion. Hospitalisation, repos, CTG continu 2–4 h, écho, NFS/TP/fibrinogène. Corticothérapie si < 34 SA.";
  }

  return {
    value: `Grade ${grade}${civd ? " + CIVD" : ""}`,
    raw: Number(grade.replace("b", "").replace("a", "")),
    max: 3,
    level,
    label: `HRP grade ${grade.toUpperCase()}`,
    interpretation,
    details: civd ? [{ label: "CIVD", value: "Présente" }] : undefined,
  };
}
