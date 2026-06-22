import type { ScoreResult } from "./types";

export type RpmTest = "positif" | "negatif" | "nonfait";
export type RpmLa = "absent" | "normal" | "oligo" | "anhydr";

export interface RPMInput {
  sa: number;
  nitrazine: RpmTest;
  fern: RpmTest;
  la: RpmLa;
  temp: number;
  tachyMaternal: boolean;
  tachyFetal: boolean;
  uterusTender: boolean;
  laOdor: boolean;
}

export const RPM_DEFAULT: RPMInput = {
  sa: 32,
  nitrazine: "nonfait",
  fern: "nonfait",
  la: "absent",
  temp: 37,
  tachyMaternal: false,
  tachyFetal: false,
  uterusTender: false,
  laOdor: false,
};

export function calcRPM(input: RPMInput): ScoreResult | null {
  const { sa } = input;
  if (!sa || sa < 1) return null;

  const rpmDiag =
    input.nitrazine === "positif" ||
    input.fern === "positif" ||
    input.la !== "absent";

  const scoreCA = [
    input.temp >= 37.8,
    input.tachyMaternal,
    input.tachyFetal,
    input.uterusTender,
    input.laOdor,
  ].filter(Boolean).length;

  const chorioamniotite = scoreCA >= 2;

  let interpretation: string;
  if (sa < 24) {
    interpretation =
      `RPM avant viabilité (${sa} SA) — prise en charge individualisée. Pronostic très réservé < 23 SA.`;
  } else if (sa < 28) {
    interpretation = `RPM ${sa} SA — prise en charge active : corticothérapie, ATB (érythromycine), transfert niveau III, MgSO₄ si < 32 SA.`;
  } else if (sa < 34) {
    interpretation = `RPM ${sa} SA : corticothérapie si non faite, ATB amoxicilline 7j, expectative si pas d'infection. Surveillance T°, CRP, CTG.`;
  } else if (sa <= 36) {
    interpretation = `RPM ${sa} SA (près du terme) : ATB prophylaxie + déclenchement si infection ou SFA ou ≥ 37 SA.`;
  } else {
    interpretation = `RPM à terme (${sa} SA) : déclenchement recommandé (risque infection).`;
  }

  if (chorioamniotite) {
    interpretation =
      `Chorioamnionite suspectée (${scoreCA}/5 critères). ${interpretation} Extraction urgente si signes sévères.`;
  }

  const level: ScoreResult["level"] = chorioamniotite
    ? "critical"
    : rpmDiag
      ? sa < 34
        ? "high"
        : "medium"
      : "low";

  return {
    value: rpmDiag ? "RPM confirmée" : "RPM non confirmée",
    raw: scoreCA,
    max: 5,
    level,
    label: chorioamniotite ? "Chorioamnionite suspectée" : rpmDiag ? "RPM" : "Examen négatif",
    interpretation,
    details: [
      { label: "Diagnostic RPM", value: rpmDiag ? "Oui" : "Non" },
      { label: "Score chorioamniotite", value: `${scoreCA}/5` },
    ],
  };
}
