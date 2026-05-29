import type { ScoreLevel, ScoreResult } from "./types";

/** Poids médian (50e percentile) par SA — grammes (Hadlock 1991). */
export const HADLOCK_P50: Record<number, number> = {
  20: 331,
  21: 399,
  22: 478,
  23: 568,
  24: 670,
  25: 785,
  26: 913,
  27: 1055,
  28: 1210,
  29: 1379,
  30: 1559,
  31: 1751,
  32: 1953,
  33: 2162,
  34: 2377,
  35: 2595,
  36: 2813,
  37: 3028,
  38: 3236,
  39: 3435,
  40: 3619,
  41: 3787,
  42: 3932,
};

const HADLOCK_RATIOS = {
  p3: 0.72,
  p5: 0.75,
  p10: 0.8,
  p25: 0.88,
  p50: 1.0,
  p75: 1.13,
  p90: 1.22,
  p95: 1.28,
  p97: 1.32,
};

export type DopOmb = "normal" | "eleve" | "absent" | "reverse";
export type DopAcm = "normal" | "bas";
export type DopRcp = "normal" | "bas";
export type DopDv = "normal" | "anormal";
export type LaStatus = "normal" | "oligo" | "anhydr";

export interface RCIUInput {
  sa: number;
  pfe: number;
  dopOmb: DopOmb;
  dopAcm: DopAcm;
  rcp: DopRcp;
  dopDv: DopDv;
  la: LaStatus;
}

export const RCIU_DEFAULT: RCIUInput = {
  sa: 32,
  pfe: 1800,
  dopOmb: "normal",
  dopAcm: "normal",
  rcp: "normal",
  dopDv: "normal",
  la: "normal",
};

export interface PercentileInfo {
  pc: string;
  label: string;
  severity: number;
}

export function hadlockPercentile(sa: number, pfe: number): PercentileInfo | null {
  const p50 = HADLOCK_P50[sa];
  if (!p50) return null;
  const ratio = pfe / p50;
  if (ratio <= HADLOCK_RATIOS.p3) {
    return { pc: "<3e", label: "< 3e percentile", severity: 4 };
  }
  if (ratio <= HADLOCK_RATIOS.p5) {
    return { pc: "3–5e", label: "3e–5e percentile", severity: 3 };
  }
  if (ratio <= HADLOCK_RATIOS.p10) {
    return { pc: "5–10e", label: "5e–10e percentile", severity: 2 };
  }
  if (ratio <= HADLOCK_RATIOS.p25) {
    return { pc: "10–25e", label: "10e–25e percentile", severity: 1 };
  }
  if (ratio <= HADLOCK_RATIOS.p75) {
    return { pc: "25–75e", label: "25e–75e percentile — Normal", severity: 0 };
  }
  if (ratio <= HADLOCK_RATIOS.p90) {
    return { pc: "75–90e", label: "75e–90e percentile", severity: 0 };
  }
  return { pc: ">90e", label: "> 90e percentile — Macrosomie probable", severity: 0 };
}

export interface RCIUFullResult extends ScoreResult {
  sa: number;
  pfe: number;
  p50: number;
  percentile: PercentileInfo;
  diagnosis: string;
  diagnosisDesc: string;
  conduite: string;
  urgence: "surveillance" | "planifie" | "urgent";
  dopSummary: { label: string; text: string; ok: boolean }[];
  growthBars: { label: string; poids: number }[];
  pfeMarkerPct: number;
}

export function calcRCIU(input: RCIUInput): RCIUFullResult | null {
  const { sa, pfe, dopOmb, dopAcm, rcp, dopDv, la } = input;
  if (!sa || !pfe || sa < 20 || sa > 42 || pfe < 100) return null;

  const clampedSa = Math.min(42, Math.max(20, sa));
  const p50 = HADLOCK_P50[sa] ?? HADLOCK_P50[clampedSa]!;
  const perc = hadlockPercentile(sa, pfe);
  if (!perc) return null;

  const dopSev =
    dopOmb === "reverse"
      ? 4
      : dopOmb === "absent"
        ? 3
        : dopDv === "anormal"
          ? 3
          : dopOmb === "eleve"
            ? 2
            : rcp === "bas" || dopAcm === "bas"
              ? 1
              : 0;

  const laAnormal = la !== "normal";

  let diagnosis = "";
  let diagnosisDesc = "";
  let conduite = "";
  let urgence: RCIUFullResult["urgence"] = "surveillance";
  let level: ScoreLevel = "ok";

  if (perc.severity === 0) {
    if (perc.pc.includes("90") || perc.pc.includes(">90")) {
      diagnosis = "Macrosomie suspectée";
      diagnosisDesc =
        "PFE au-dessus du 90e percentile. Risque de dystocie des épaules.";
      conduite =
        "Vérifier DG. Surveillance biométries à 2 semaines. Discuter voie accouchement si PFE > 4 500 g.";
      urgence = "planifie";
      level = "medium";
    } else {
      diagnosis = "Croissance normale";
      diagnosisDesc = `PFE ${perc.label} pour ${sa} SA.`;
      conduite = "Surveillance échographique habituelle selon terme.";
      urgence = "surveillance";
      level = "ok";
    }
  } else if (perc.severity === 1) {
    diagnosis = "PFE modérément bas (10e–25e pc)";
    diagnosisDesc = "Peut être constitutionnel ou début RCIU.";
    conduite =
      dopSev > 0 || laAnormal
        ? "Dopplers anormaux : surveillance rapprochée J7. Hospitalisation si aggravation."
        : "Dopplers normaux : contrôle biométries à 2 semaines. Surveillance MAF.";
    urgence = dopSev > 0 ? "urgent" : "planifie";
    level = "medium";
  } else if (perc.severity === 2) {
    diagnosis = "RCIU modéré (5e–10e pc)";
    diagnosisDesc = "RCIU probable — évaluation Doppler indispensable.";
    conduite =
      dopSev >= 3
        ? "Dopplers sévères : hospitalisation urgente, corticothérapie si < 34 SA, discuter extraction."
        : dopSev >= 1
          ? "Surveillance hospitalière ou ambulatoire renforcée. CTG biquotidien. Corticothérapie si < 34 SA."
          : "Contrôle biométries + Dopplers à 1 semaine. Surveillance MAF quotidienne.";
    urgence = dopSev >= 3 ? "urgent" : "planifie";
    level = "high";
  } else if (perc.severity === 3) {
    diagnosis = "RCIU sévère (3e–5e pc)";
    diagnosisDesc = "RCIU sévère — prise en charge active nécessaire.";
    conduite =
      dopSev >= 3
        ? "URGENCE : hospitalisation immédiate. Corticothérapie avant 34 SA. Extraction selon terme et Dopplers."
        : "Hospitalisation recommandée. Dopplers + CTG quotidien. Corticothérapie si < 34 SA. RCP obligatoire.";
    urgence = "urgent";
    level = "high";
  } else {
    diagnosis = "RCIU très sévère (< 3e pc)";
    diagnosisDesc = "Urgence obstétricale.";
    conduite =
      "URGENCE ABSOLUE : hospitalisation immédiate. Corticothérapie obligatoire avant 34 SA. Transfert niveau III si < 32 SA.";
    urgence = "urgent";
    level = "critical";
  }

  const growthBars = [
    { label: "3e", poids: Math.round(p50 * HADLOCK_RATIOS.p3) },
    { label: "10e", poids: Math.round(p50 * HADLOCK_RATIOS.p10) },
    { label: "50e", poids: p50 },
    { label: "90e", poids: Math.round(p50 * HADLOCK_RATIOS.p90) },
    { label: "97e", poids: Math.round(p50 * HADLOCK_RATIOS.p97) },
  ];
  const maxPoids = growthBars[growthBars.length - 1]!.poids;
  const pfeMarkerPct = Math.min(100, Math.round((pfe / maxPoids) * 100));

  const dopSummary = [
    {
      label: "Doppler ombilicale",
      ok: dopOmb === "normal",
      text:
        dopOmb === "reverse"
          ? "Reverse flow — urgence"
          : dopOmb === "absent"
            ? "Diastole absente"
            : dopOmb === "eleve"
              ? "Résistances élevées"
              : "Normal",
    },
    {
      label: "Doppler ACM",
      ok: dopAcm === "normal",
      text: dopAcm === "bas" ? "Vasodilatation cérébrale" : "Normal",
    },
    {
      label: "Ratio RCP",
      ok: rcp === "normal",
      text: rcp === "bas" ? "Redistribution cérébrale (RCP ≤ 1.0)" : "Normal (> 1.0)",
    },
    {
      label: "Ductus venosus",
      ok: dopDv === "normal",
      text: dopDv === "anormal" ? "Onde a anormale" : "Normal",
    },
    {
      label: "Liquide amniotique",
      ok: la === "normal",
      text:
        la === "anhydr" ? "Anhydramnios" : la === "oligo" ? "Oligoamnios" : "Normal",
    },
  ];

  return {
    value: perc.pc,
    raw: perc.severity,
    max: 4,
    level,
    label: diagnosis,
    interpretation: `${diagnosisDesc}<br><br><strong>Conduite :</strong> ${conduite}`,
    details: [
      { label: "SA", value: `${sa}` },
      { label: "PFE", value: `${pfe} g` },
      { label: "P50 attendu", value: `${p50} g` },
    ],
    sa,
    pfe,
    p50,
    percentile: perc,
    diagnosis,
    diagnosisDesc,
    conduite,
    urgence,
    dopSummary,
    growthBars,
    pfeMarkerPct,
  };
}
