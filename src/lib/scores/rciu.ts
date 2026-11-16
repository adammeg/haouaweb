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

/** Hadlock 1991 : écart-type ≈ 12,7 % du poids médian (P10 = P50 − 1,28 ET, P3 = P50 − 1,88 ET…). */
const HADLOCK_RATIOS = {
  p3: 0.76,
  p5: 0.79,
  p10: 0.84,
  p25: 0.91,
  p50: 1.0,
  p75: 1.09,
  p90: 1.16,
  p95: 1.21,
  p97: 1.24,
};

/** P50 interpolé linéairement entre deux semaines entières. */
function hadlockP50(sa: number): number | null {
  if (!Number.isFinite(sa) || sa < 20 || sa > 42) return null;
  const lo = Math.floor(sa);
  const hi = Math.min(42, lo + 1);
  const a = HADLOCK_P50[lo]!;
  const b = HADLOCK_P50[hi]!;
  return Math.round(a + (b - a) * (sa - lo));
}

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
  sa: 0,
  pfe: 0,
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
  const p50 = hadlockP50(sa);
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
  return { pc: ">90e", label: "> 90e percentile", severity: 0 };
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

  const p50 = hadlockP50(sa);
  const perc = hadlockPercentile(sa, pfe);
  if (!p50 || !perc) return null;

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

  const corticoides = sa < 34 ? " Corticothérapie anténatale si une naissance avant 34 SA est envisagée." : "";

  if (dopSev >= 3) {
    // Diastole ombilicale nulle/inversée ou ductus venosus anormal : urgence quel que soit le percentile.
    const signe =
      dopOmb === "reverse"
        ? "diastole ombilicale inversée"
        : dopOmb === "absent"
          ? "diastole ombilicale nulle"
          : "ductus venosus anormal";
    diagnosis =
      perc.severity >= 2
        ? `RCIU avec ${signe}`
        : `Doppler critique (${signe}) — PFE ${perc.label}`;
    diagnosisDesc =
      "Altération hémodynamique sévère : le Doppler prime sur le percentile du poids estimé.";
    conduite = `URGENCE : évaluation hospitalière immédiate en maternité de niveau adapté, contrôle du Doppler, RCF, avis spécialisé.${corticoides} Terme de naissance selon le stade (ISUOG 2020).`;
    urgence = "urgent";
    level = "critical";
  } else if (perc.severity === 0) {
    if (dopSev > 0 || laAnormal) {
      diagnosis = "PFE normal avec Doppler ou liquide anormal";
      diagnosisDesc = `PFE ${perc.label} pour ${sa} SA, mais ${dopSev > 0 ? "anomalie Doppler" : "liquide amniotique diminué"}.`;
      conduite =
        "Contrôle du Doppler et de la quantité de liquide, recherche d'une rupture des membranes et d'une cassure de la courbe de croissance. Surveillance rapprochée.";
      urgence = "planifie";
      level = "medium";
    } else if (perc.pc === ">90e") {
      diagnosis = "PFE > 90e percentile";
      diagnosisDesc =
        "Fœtus gros pour l'âge gestationnel (la macrosomie se définit par un poids ≥ 4 000 g).";
      conduite =
        "Rechercher un diabète gestationnel. Contrôle biométrique. Voie d'accouchement à discuter si PFE > 4 500 g (4 250 g en cas de diabète).";
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
    diagnosis = "PFE entre le 10e et le 25e percentile";
    diagnosisDesc = "Au-dessus du seuil de PAG ; à interpréter avec la dynamique de croissance.";
    conduite =
      dopSev > 0 || laAnormal
        ? "Doppler ou liquide anormal : contrôle sous 1 semaine (biométrie à 2 semaines d'intervalle), surveillance rapprochée."
        : "Doppler normaux : contrôle biométrique à 2–3 semaines pour vérifier l'absence de cassure de la courbe.";
    urgence = "planifie";
    level = "medium";
  } else if (perc.severity === 2 || perc.severity === 3) {
    const tranche = perc.severity === 2 ? "5e–10e" : "3e–5e";
    if (dopSev >= 1 || laAnormal) {
      diagnosis = `RCIU probable (PFE ${tranche} pc avec Doppler ou liquide anormal)`;
      diagnosisDesc = "PFE < 10e percentile associé à un critère Doppler : restriction de croissance (critères Delphi).";
      conduite = `Surveillance rapprochée (Doppler et RCF au moins hebdomadaires, plus si résistances ombilicales élevées), avis spécialisé.${corticoides} Naissance à discuter à partir de 36–37 SA selon le Doppler (ISUOG 2020).`;
      urgence = "urgent";
      level = "high";
    } else {
      diagnosis = `PAG (PFE ${tranche} pc), Doppler normaux`;
      diagnosisDesc = "Petit poids pour l'âge gestationnel sans critère de restriction avec les éléments saisis.";
      conduite =
        "Doppler (ombilical, cérébral, utérines) et biométrie de contrôle à 2 semaines. Naissance à envisager à partir de 38 SA, sans dépasser 39 SA (ISUOG 2020).";
      urgence = "planifie";
      level = "medium";
    }
  } else {
    diagnosis = "RCIU (PFE < 3e percentile)";
    diagnosisDesc = "Un PFE < 3e percentile suffit au diagnostic de restriction de croissance (critères Delphi).";
    conduite =
      dopSev >= 1 || laAnormal
        ? `Doppler ou liquide anormal : surveillance au moins bihebdomadaire, avis spécialisé, hospitalisation à discuter.${corticoides} Terme de naissance selon le Doppler (ISUOG 2020).`
        : `Doppler normaux : surveillance hebdomadaire (Doppler, RCF), recherche étiologique.${corticoides} Naissance à envisager vers 37 SA.`;
    urgence = dopSev >= 1 ? "urgent" : "planifie";
    level = "high";
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
