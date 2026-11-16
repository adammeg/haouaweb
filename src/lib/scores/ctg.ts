import type { ScoreResult } from "./types";

/** Classification CTG intrapartum — FIGO 2015 (Ayres-de-Campos). */

export type CtgVaria = "5_25" | "lt5" | "gt25" | "sinusoidal";
export type CtgAccel = "presentes" | "absentes";
export type CtgDecel =
  | "aucune"
  | "variables_legeres"
  | "variables_severes"
  | "tardives"
  | "prolongees";

export interface CTGInput {
  fcf: number;
  varia: CtgVaria;
  /** Durée en minutes de l'anomalie de variabilité (< 5 bpm ou > 25 bpm). */
  dureeVariaLt5: number;
  accel: CtgAccel;
  decel: CtgDecel;
}

export const CTG_DEFAULT: CTGInput = {
  fcf: 0,
  varia: "5_25",
  dureeVariaLt5: 0,
  accel: "presentes",
  decel: "aucune",
};

export function calcCTG(input: CTGInput): ScoreResult | null {
  const { fcf, varia, dureeVariaLt5, accel, decel } = input;
  if (!fcf || fcf <= 0) return null;

  const pathologiques: string[] = [];
  const suspects: string[] = [];

  if (fcf < 100) pathologiques.push(`Rythme de base ${fcf} bpm (< 100)`);
  else if (fcf < 110) suspects.push(`Rythme de base ${fcf} bpm (100–109)`);
  else if (fcf > 160) suspects.push(`Tachycardie ${fcf} bpm (> 160)`);

  if (varia === "sinusoidal") {
    pathologiques.push("Tracé sinusoïdal");
  } else if (varia === "lt5") {
    if (dureeVariaLt5 > 50) pathologiques.push(`Variabilité < 5 bpm depuis ${dureeVariaLt5} min (> 50 min)`);
    else suspects.push(`Variabilité < 5 bpm${dureeVariaLt5 ? ` depuis ${dureeVariaLt5} min` : ""}`);
  } else if (varia === "gt25") {
    if (dureeVariaLt5 > 30) pathologiques.push(`Variabilité > 25 bpm depuis ${dureeVariaLt5} min (> 30 min)`);
    else suspects.push(`Variabilité > 25 bpm${dureeVariaLt5 ? ` depuis ${dureeVariaLt5} min` : ""}`);
  }

  if (decel === "tardives") pathologiques.push("Décélérations tardives répétées");
  else if (decel === "prolongees") pathologiques.push("Décélération prolongée");
  else if (decel === "variables_severes") pathologiques.push("Décélérations variables sévères répétées");
  else if (decel === "variables_legeres") suspects.push("Décélérations variables");

  let level: ScoreResult["level"];
  let label: string;
  let interpretation: string;

  if (pathologiques.length > 0) {
    level = "critical";
    label = "PATHOLOGIQUE";
    interpretation =
      "Action immédiate [FIGO 2015] : corriger les causes réversibles (arrêt de l'ocytocine et tocolyse d'urgence si hypercinésie, changement de position, correction d'une hypotension maternelle). Naissance rapide si le tracé ne se normalise pas ; naissance immédiate en cas d'événement aigu (procidence du cordon, rupture utérine, HRP). Critères de durée FIGO : décélérations tardives ou prolongées répétées > 30 min (> 20 min si variabilité réduite), ou une décélération > 5 min.";
  } else if (suspects.length > 0) {
    level = "medium";
    label = "SUSPECT";
    interpretation =
      "Rechercher et corriger une cause réversible (position maternelle, hypercinésie, hypotension, fièvre), surveillance rapprochée ou méthode de seconde ligne. [FIGO 2015]";
  } else {
    level = "low";
    label = "NORMAL";
    interpretation = "Pas d'hypoxie ni d'acidose fœtale suspectée. Poursuite de la surveillance. [FIGO 2015]";
  }

  const details = [...pathologiques, ...suspects].map((a, i) => ({ label: `Anomalie ${i + 1}`, value: a }));
  if (accel === "absentes") {
    details.push({
      label: "Accélérations",
      value: "Absentes — signification incertaine pendant le travail (non comptées)",
    });
  }

  return {
    value: label,
    raw: pathologiques.length + suspects.length,
    max: 5,
    level,
    label,
    interpretation,
    details: details.length > 0 ? details : undefined,
  };
}
