import type { PatientSnapshot, Specialty } from "@/types/domain";

export type EpidemiologyStats = {
  total: number;
  bySpecialty: Record<string, number>;
  ageBands: { label: string; count: number }[];
  obstRisks: {
    peHistory: number;
    vteHistory: number;
    gdmSuspect: number;
    t2Anomalies: number;
  };
  infertility: {
    fivAttempts: number;
    lowAmh: number;
    sopk: number;
  };
  monthlyActivity: { month: string; count: number }[];
};

function num(v?: string): number | null {
  if (!v) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function ageFromDdn(ddn?: string): number | null {
  if (!ddn) return null;
  const d = new Date(ddn);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 && age < 120 ? age : null;
}

function hasT2Anomaly(p: PatientSnapshot): boolean {
  const flags = [
    p.t2_csp === "absent",
    p.t2_cerv === "anormal",
    p.t2_situs === "anormal",
    p.t2_placenta_loc === "praevia",
    p.t2_paroi === "defect",
  ];
  const atr = num(p.t2_atrium);
  if (atr && atr >= 10) return true;
  return flags.some(Boolean);
}

export function computeEpidemiology(
  patients: PatientSnapshot[],
): EpidemiologyStats {
  const bySpecialty: Record<string, number> = {};
  const ageCounts = { "<25": 0, "25-34": 0, "35-39": 0, "40+": 0, nd: 0 };
  let peHistory = 0;
  let vteHistory = 0;
  let gdmSuspect = 0;
  let t2Anomalies = 0;
  let fivAttempts = 0;
  let lowAmh = 0;
  let sopk = 0;
  const monthMap: Record<string, number> = {};

  for (const p of patients) {
    const spec = p.specialite || "—";
    bySpecialty[spec] = (bySpecialty[spec] ?? 0) + 1;

    const age = ageFromDdn(p.ddn);
    if (age == null) ageCounts.nd++;
    else if (age < 25) ageCounts["<25"]++;
    else if (age <= 34) ageCounts["25-34"]++;
    else if (age <= 39) ageCounts["35-39"]++;
    else ageCounts["40+"]++;

    if (p.o_atcd_pe === "oui") peHistory++;
    if (p.o_atcd_vte === "oui") vteHistory++;
    const gly = num(p.o_gly) ?? num(p.bio_gly);
    if (gly && gly >= 0.92) gdmSuspect++;
    if (hasT2Anomaly(p)) t2Anomalies++;

    const tent = num(p.i_tentatives_fiv);
    if (tent && tent > 0) fivAttempts++;
    const amh = num(p.i_amh_ngml) ?? num(p.bio_amh);
    if (amh && amh < 1.1) lowAmh++;
    if (p.i_sopk === "oui") sopk++;

    if (p.lastSaved) {
      const m = p.lastSaved.slice(0, 7);
      monthMap[m] = (monthMap[m] ?? 0) + 1;
    }
  }

  const monthlyActivity = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, count]) => ({ month, count }));

  return {
    total: patients.length,
    bySpecialty,
    ageBands: [
      { label: "< 25 ans", count: ageCounts["<25"] },
      { label: "25–34 ans", count: ageCounts["25-34"] },
      { label: "35–39 ans", count: ageCounts["35-39"] },
      { label: "≥ 40 ans", count: ageCounts["40+"] },
      { label: "Âge inconnu", count: ageCounts.nd },
    ],
    obstRisks: { peHistory, vteHistory, gdmSuspect, t2Anomalies },
    infertility: { fivAttempts, lowAmh, sopk },
    monthlyActivity,
  };
}

export function specialtyLabel(k: string): string {
  const map: Record<Specialty, string> = {
    gyn: "Gynécologie",
    obst: "Obstétrique",
    inf: "Infertilité / AMP",
  };
  return map[k as Specialty] ?? (k === "—" ? "Sans spécialité" : k);
}
