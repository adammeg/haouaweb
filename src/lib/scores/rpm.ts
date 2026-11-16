import type { ScoreResult } from "./types";

/** Rupture prématurée des membranes — CNGOF 2018 (avant terme), ACOG CO 712 (infection intra-amniotique). */

export type RpmTest = "positif" | "negatif" | "nonfait";
/** Quantité de liquide amniotique à l'échographie ; "absent" = non évaluée. */
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
  sa: 0,
  nitrazine: "nonfait",
  fern: "nonfait",
  la: "absent",
  temp: 37,
  tachyMaternal: false,
  tachyFetal: false,
  uterusTender: false,
  laOdor: false,
};

function conduite(sa: number): string {
  if (sa < 24) {
    return `RPM avant 24 SA (${sa} SA) : pronostic réservé, prise en charge individualisée après information du couple, en lien avec un centre de niveau adapté.`;
  }
  if (sa < 34) {
    return `RPM à ${sa} SA : hospitalisation initiale, antibioprophylaxie (amoxicilline, céphalosporine de 3e génération ou érythromycine, 7 jours — CNGOF 2018 ; pas d'amoxicilline-acide clavulanique), corticothérapie anténatale, sulfate de magnésium si naissance imminente avant 32 SA, transfert in utero si nécessaire. Expectative en l'absence d'infection, de travail ou d'anomalie du RCF. Surveillance clinique, biologique et du RCF.`;
  }
  if (sa < 37) {
    return `RPM à ${sa} SA : antibioprophylaxie ; expectative jusqu'à 37 SA en l'absence d'infection ou de complication (CNGOF 2018), naissance sans délai en cas d'infection intra-utérine, d'anomalie du RCF ou d'HRP.`;
  }
  return `RPM à terme (${sa} SA) : expectative courte ou déclenchement selon le protocole du service ; antibioprophylaxie en cas de portage de streptocoque B ou de rupture prolongée.`;
}

export function calcRPM(input: RPMInput): ScoreResult | null {
  const { sa } = input;
  if (!sa || sa < 1) return null;

  const testPositif = input.nitrazine === "positif" || input.fern === "positif";
  const laDiminue = input.la === "oligo" || input.la === "anhydr";
  const statut: "confirmee" | "suspectee" | "non" = testPositif
    ? "confirmee"
    : laDiminue
      ? "suspectee"
      : "non";

  const fievre = input.temp >= 38;
  const autresSignes = [
    input.tachyMaternal,
    input.tachyFetal,
    input.uterusTender,
    input.laOdor,
  ].filter(Boolean).length;
  const infection = fievre && autresSignes >= 1;

  let interpretation: string;
  if (statut === "confirmee") {
    interpretation = conduite(sa);
  } else if (statut === "suspectee") {
    interpretation =
      "Oligoamnios ou anamnios sans test positif : RPM possible mais non confirmée. Compléter par un examen au spéculum et un test biochimique (IGFBP-1 ou PAMG-1) ; rechercher les autres causes d'oligoamnios.";
  } else {
    interpretation =
      "Aucun argument pour une RPM avec les éléments saisis. En cas de doute clinique persistant : examen au spéculum et test biochimique (IGFBP-1 ou PAMG-1).";
  }

  if (infection) {
    interpretation = `Infection intra-utérine suspectée (fièvre ≥ 38 °C + ${autresSignes} signe(s) associé(s)) : antibiothérapie intraveineuse et naissance sans délai, quelle que soit la voie adaptée. ${statut === "confirmee" ? "" : interpretation}`.trim();
  } else if (fievre) {
    interpretation = `Fièvre maternelle isolée : rechercher une infection intra-utérine et les autres causes. ${interpretation}`;
  }

  const level: ScoreResult["level"] = infection
    ? "critical"
    : statut === "confirmee"
      ? sa < 34
        ? "high"
        : "medium"
      : statut === "suspectee" || fievre
        ? "medium"
        : "low";

  const value =
    statut === "confirmee"
      ? "RPM confirmée"
      : statut === "suspectee"
        ? "RPM suspectée"
        : "RPM non confirmée";

  return {
    value,
    raw: (fievre ? 1 : 0) + autresSignes,
    max: 5,
    level,
    label: infection ? "Infection intra-utérine suspectée" : value,
    interpretation,
    details: [
      { label: "Diagnostic RPM", value: statut === "confirmee" ? "Test positif" : statut === "suspectee" ? "À confirmer" : "Non" },
      { label: "Signes infectieux", value: `${fievre ? "fièvre + " : ""}${autresSignes} signe(s)` },
    ],
  };
}
