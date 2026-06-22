import type { ScoreResult } from "./types";

export type CtgVaria = "5_25" | "lt5" | "sinusoidal";
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
  dureeVariaLt5: number;
  accel: CtgAccel;
  decel: CtgDecel;
}

export const CTG_DEFAULT: CTGInput = {
  fcf: 140,
  varia: "5_25",
  dureeVariaLt5: 0,
  accel: "presentes",
  decel: "aucune",
};

export function calcCTG(input: CTGInput): ScoreResult | null {
  const anomalies: string[] = [];
  const { fcf, varia, dureeVariaLt5, accel, decel } = input;

  if (fcf > 0) {
    if (fcf < 110) anomalies.push(`Bradycardie ${fcf} bpm`);
    else if (fcf > 160) anomalies.push(`Tachycardie ${fcf} bpm`);
  }
  if (varia === "sinusoidal") {
    anomalies.push("Tracé sinusoïdal (anémie fœtale sévère ?)");
  } else if (varia === "lt5" && dureeVariaLt5 > 40) {
    anomalies.push(`Variabilité < 5 bpm depuis ${dureeVariaLt5} min`);
  }
  if (accel === "absentes") anomalies.push("Absence d'accélérations");

  const decelGraves = ["tardives", "variables_severes", "prolongees"] as const;
  if (decelGraves.includes(decel as (typeof decelGraves)[number])) {
    anomalies.push(`Décélérations ${decel} (grave)`);
  } else if (decel === "variables_legeres") {
    anomalies.push("Décélérations variables légères");
  }

  let level: ScoreResult["level"];
  let label: string;
  let interpretation: string;

  if (anomalies.length === 0) {
    level = "low";
    label = "NORMAL";
    interpretation =
      "Poursuite surveillance standard. CTG toutes 30 min si travail actif. [FIGO 2015]";
  } else if (
    anomalies.length === 1 &&
    !decelGraves.includes(decel as (typeof decelGraves)[number]) &&
    varia !== "sinusoidal"
  ) {
    level = "medium";
    label = "SUSPECT";
    interpretation =
      "Corriger la cause : décubitus latéral gauche, vérifier TA et hydratation, arrêter ocytociques, recontroler dans 15 min. [FIGO 2015]";
  } else {
    level = "critical";
    label = "PATHOLOGIQUE";
    interpretation =
      "Intervention immédiate [FIGO 2015] : décubitus latéral gauche, O₂ 10 L/min, arrêt ocytociques, remplissage SSI 500 mL, tocolyse IV si intrapartum, extraction si persistance > 20 min.";
  }

  const details =
    anomalies.length > 0
      ? anomalies.map((a) => ({ label: "Anomalie", value: a }))
      : undefined;

  return {
    value: label,
    raw: anomalies.length,
    max: 5,
    level,
    label,
    interpretation,
    details,
  };
}
