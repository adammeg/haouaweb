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
      "Grade 3b — HRP massif + MFIU + CIVD. Urgence absolue : fibrinogène, PFC, plaquettes, acide tranexamique. CS en urgence si fœtus viable. [Sher 1985]";
  } else if (input.foetal === "mfiu") {
    grade = "3a";
    level = "critical";
    interpretation =
      "Grade 3a — HRP + MFIU sans CIVD. Extraction à discuter. Surveillance biologique rapprochée. [Sher 1985]";
  } else if (input.foetal === "bradycardie") {
    grade = "2";
    level = "high";
    interpretation =
      "Grade 2 — HRP avec SFA. Césarienne en urgence. Bilan CIVD en STAT + 2 VVP. [Sher 1985]";
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
