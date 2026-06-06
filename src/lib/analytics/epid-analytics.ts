/**
 * Analytics épidémiologiques (port v50 « ANALYTICS ÉPIDÉMIOLOGIQUES »).
 * Fonctions pures : reçoivent la cohorte de patientes et renvoient un résultat
 * normalisé (chart + insights + lignes brutes pour export).
 */

import type { PatientSnapshot } from "@/types/domain";

export type AnalyticType =
  | "pyramide"
  | "prevalence"
  | "age_patho"
  | "activite"
  | "tendance"
  | "specs"
  | "imc"
  | "dg_terme"
  | "parite"
  | "ta_age";

export type ChartKind = "bar" | "line" | "donut";

export type AnalyticChart = {
  kind: ChartKind;
  labels: string[];
  values: number[];
  colors: string[];
  axisTitle?: string;
  /** Affiche une moyenne en pointillés (age_patho). */
  refLine?: { value: number; label: string; max: number };
  /** Plafond de l'axe Y (age_patho fixe 60). */
  maxOverride?: number;
};

export type AnalyticResult = {
  type: AnalyticType;
  title: string;
  badges: string[];
  insight: string;
  chart: AnalyticChart | null;
  raw: Record<string, string | number>[];
};

export const ANALYTIC_CHIPS: { type: AnalyticType; label: string }[] = [
  { type: "pyramide", label: "👥 Pyramide des âges" },
  { type: "prevalence", label: "📊 Top pathologies" },
  { type: "age_patho", label: "🔗 Âge × pathologie" },
  { type: "activite", label: "📅 Activité mensuelle" },
  { type: "specs", label: "🥧 Par spécialité" },
  { type: "imc", label: "⚖️ IMC distribution" },
  { type: "dg_terme", label: "🍬 DG par terme" },
  { type: "parite", label: "🤰 Distribution parité" },
  { type: "ta_age", label: "💉 HTA par âge" },
  { type: "tendance", label: "📈 Tendances 12 mois" },
];

const ANALYTIC_KEYWORDS: { keys: string[]; type: AnalyticType }[] = [
  { keys: ["pyramide", "age", "âge", "tranches", "répartition age"], type: "pyramide" },
  { keys: ["pathologi", "diagnostic", "prevalence", "prévalence", "maladie", "top", "fréquent", "motif"], type: "prevalence" },
  { keys: ["age pathol", "âge pathol", "croisement", "profil"], type: "age_patho" },
  { keys: ["activité", "mensuel", "mois", "temporel", "timeline"], type: "activite" },
  { keys: ["tendance", "12 mois", "progression", "croissance", "trend", "évolution"], type: "tendance" },
  { keys: ["spécialité", "spec", "service", "secteur"], type: "specs" },
  { keys: ["imc", "poids", "obésité", "surpoids", "corpulence"], type: "imc" },
  { keys: ["diabète", "dg", "gestationnel", "glycémie", "glucose", "trimestre", "terme"], type: "dg_terme" },
  { keys: ["parité", "gestité", "multipare", "primipare", "nullipare"], type: "parite" },
  { keys: ["hta", "hypertension", "tension", "ta élevée"], type: "ta_age" },
];

export function matchAnalyticQuery(query: string): AnalyticType | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;
  const match = ANALYTIC_KEYWORDS.find((k) => k.keys.some((kw) => q.includes(kw)));
  return match ? match.type : null;
}

const YEAR_MS = 31557600000;

function ageOf(p: PatientSnapshot, now: number): number | null {
  if (!p.ddn) return null;
  const t = new Date(p.ddn).getTime();
  if (Number.isNaN(t)) return null;
  const a = Math.floor((now - t) / YEAR_MS);
  return a >= 0 && a < 130 ? a : null;
}

function savedDate(p: PatientSnapshot): number {
  return new Date(p.lastSaved || p.updatedAt || 0).getTime();
}

function pct(n: number, d: number): number {
  return d ? Math.round((n / d) * 100) : 0;
}

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

// ── Pyramide des âges ──
function pyramide(pts: PatientSnapshot[]): AnalyticResult {
  const now = Date.now();
  const groups = ["<20", "20-24", "25-29", "30-34", "35-39", "40-44", "45-49", "≥50"];
  const counts = new Array(groups.length).fill(0);
  const ages: number[] = [];
  for (const p of pts) {
    const a = ageOf(p, now);
    if (a == null) continue;
    ages.push(a);
    const i = a < 20 ? 0 : a < 25 ? 1 : a < 30 ? 2 : a < 35 ? 3 : a < 40 ? 4 : a < 45 ? 5 : a < 50 ? 6 : 7;
    counts[i]++;
  }
  const peak = counts.indexOf(Math.max(...counts, 0));
  const mean = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;
  const colors = ["#a78bfa", "#818cf8", "#38bdf8", "#34d399", "#0d6e6e", "#1a9a9a", "#d97706", "#f87171"];
  return {
    type: "pyramide",
    title: "👥 Pyramide des âges de la patientèle",
    badges: [`${pts.length} patientes`, `Âge moyen ${mean || "—"} ans`, `Pic : ${groups[peak] ?? "—"}`],
    insight: `Tranche dominante : ${groups[peak] ?? "—"} ans (${counts[peak] ?? 0} patientes · ${pct(counts[peak] ?? 0, pts.length)}%) · Âge moyen : ${mean || "—"} ans · N avec DDN : ${ages.length}/${pts.length}`,
    chart: { kind: "bar", labels: groups, values: counts, colors, axisTitle: "Distribution par tranche d'âge (5 ans)" },
    raw: groups.map((g, i) => ({ tranche: g, count: counts[i] })),
  };
}

// ── Prévalence pathologies ──
function prevalence(pts: PatientSnapshot[]): AnalyticResult {
  const map: Record<string, number> = {};
  for (const p of pts) {
    const m = (p.motif || "Non précisé").trim() || "Non précisé";
    map[m] = (map[m] || 0) + 1;
  }
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const labels = sorted.map(([k]) => (k.length > 18 ? k.slice(0, 17) + "…" : k));
  const values = sorted.map(([, v]) => v);
  const pal = ["#0d4f4f", "#0d6e6e", "#1a9a9a", "#21c5c5", "#34d9d9", "#47eded", "#5af0f0", "#6df3f3", "#80f6f6", "#93f9f9"];
  const top3 = sorted.slice(0, 3).map(([m, n]) => `${m} (${n} · ${pct(n, pts.length)}%)`).join(" · ");
  return {
    type: "prevalence",
    title: "📊 Top 10 pathologies / motifs",
    badges: [`${pts.length} dossiers`, `${sorted.length} motifs distincts`, `1er : ${sorted[0]?.[0] ?? "—"}`],
    insight: top3 ? `Top 3 : ${top3}` : "Aucun motif renseigné.",
    chart: { kind: "bar", labels, values, colors: pal, axisTitle: "Fréquence des motifs de consultation" },
    raw: sorted.map(([m, n]) => ({ motif: m, count: n, pct: pct(n, pts.length) + "%" })),
  };
}

// ── Âge × pathologie ──
function agePatho(pts: PatientSnapshot[]): AnalyticResult {
  const now = Date.now();
  const motifCount: Record<string, number> = {};
  for (const p of pts) {
    const m = p.motif || "Non précisé";
    motifCount[m] = (motifCount[m] || 0) + 1;
  }
  const top5 = Object.entries(motifCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([m]) => m);
  const ageByMotif: Record<string, number[]> = {};
  top5.forEach((m) => (ageByMotif[m] = []));
  for (const p of pts) {
    const m = p.motif || "Non précisé";
    const a = ageOf(p, now);
    if (!top5.includes(m) || a == null) continue;
    ageByMotif[m].push(a);
  }
  const labels = top5.map((m) => (m.length > 16 ? m.slice(0, 15) + "…" : m));
  const means = top5.map((m) => (ageByMotif[m].length ? Math.round(ageByMotif[m].reduce((a, b) => a + b, 0) / ageByMotif[m].length) : 0));
  const ns = top5.map((m) => ageByMotif[m].length);
  const allAges = pts.map((p) => ageOf(p, now)).filter((a): a is number => a != null);
  const overall = allAges.length ? Math.round(allAges.reduce((a, b) => a + b, 0) / allAges.length) : 0;
  const colors = ["#7c3aed", "#0d6e6e", "#d97706", "#0369a1", "#dc2626"];
  return {
    type: "age_patho",
    title: "🔗 Âge moyen par pathologie (Top 5)",
    badges: [`${allAges.length} dossiers avec DDN`, `Top : ${top5[0] ?? "—"}`],
    insight: top5.map((m, i) => `${m} ${means[i]} ans (n=${ns[i]})`).join(" · ") + (overall ? ` · Âge moyen global : ${overall} ans` : ""),
    chart: {
      kind: "bar",
      labels,
      values: means,
      colors,
      axisTitle: "Âge moyen (années) par pathologie",
      maxOverride: 60,
      refLine: overall ? { value: overall, label: "Moy. globale " + overall + " ans", max: 60 } : undefined,
    },
    raw: top5.map((m, i) => ({ motif: m, n: ns[i], age_moyen: means[i] })),
  };
}

// ── Activité mensuelle ──
function activite(pts: PatientSnapshot[]): AnalyticResult {
  const byMonth: Record<string, number> = {};
  for (const p of pts) {
    const d = new Date(savedDate(p));
    const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    byMonth[key] = (byMonth[key] || 0) + 1;
  }
  const months = Object.keys(byMonth).sort();
  if (!months.length) {
    return { type: "activite", title: "📅 Activité mensuelle", badges: [], insight: "Aucune donnée sur cette période.", chart: null, raw: [] };
  }
  const values = months.map((m) => byMonth[m]);
  const labels = months.map((m) => {
    const [y, mo] = m.split("-");
    return MONTHS[parseInt(mo, 10) - 1] + "'" + y.slice(2);
  });
  const total = values.reduce((a, b) => a + b, 0);
  const mean = Math.round(total / months.length);
  const peakI = values.indexOf(Math.max(...values));
  const lowI = values.indexOf(Math.min(...values));
  return {
    type: "activite",
    title: "📅 Activité mensuelle du service",
    badges: [`${total} consultations`, `Moy. ${mean}/mois`, `${months.length} mois`],
    insight: `Total : ${total} · Moyenne : ${mean}/mois · Pic : ${months[peakI]} (${values[peakI]}) · Creux : ${months[lowI]} (${values[lowI]})`,
    chart: { kind: "bar", labels, values, colors: ["#1a9a9a"], axisTitle: "Consultations par mois" },
    raw: months.map((m, i) => ({ mois: m, consultations: values[i] })),
  };
}

// ── Tendance 12 mois ──
function tendance(pts: PatientSnapshot[]): AnalyticResult {
  const now = new Date();
  const keys: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"));
  }
  const counts: Record<string, number> = {};
  keys.forEach((k) => (counts[k] = 0));
  for (const p of pts) {
    const d = new Date(savedDate(p));
    const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    if (counts[key] !== undefined) counts[key]++;
  }
  const values = keys.map((k) => counts[k]);
  const labels = keys.map((k) => MONTHS[parseInt(k.split("-")[1], 10) - 1]);
  const total = values.reduce((a, b) => a + b, 0);
  const n = 12;
  const sumX = (n * (n - 1)) / 2;
  const sumY = total;
  const sumXY = values.reduce((s, v, i) => s + i * v, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  const denom = n * sumX2 - sumX * sumX;
  const slope = denom ? (n * sumXY - sumX * sumY) / denom : 0;
  const trend = slope > 0.3 ? "📈 En hausse" : slope < -0.3 ? "📉 En baisse" : "➡️ Stable";
  return {
    type: "tendance",
    title: "📈 Tendance d'activité — 12 derniers mois",
    badges: [`${total} consultations`, `Moy. ${Math.round(total / 12)}/mois`],
    insight: `Tendance : ${trend} (pente ${slope > 0 ? "+" : ""}${slope.toFixed(1)}/mois) · Cumul 12 mois : ${total} consultations`,
    chart: { kind: "line", labels, values, colors: ["#0d6e6e"], axisTitle: "Évolution de l'activité — 12 mois glissants" },
    raw: keys.map((k, i) => ({ mois: k, consultations: values[i] })),
  };
}

// ── Répartition par spécialité (donut) ──
function specs(pts: PatientSnapshot[]): AnalyticResult {
  const s = { gyn: 0, obst: 0, inf: 0, other: 0 };
  for (const p of pts) {
    const key = (p.specialite || "other") as keyof typeof s;
    if (key in s) s[key]++;
    else s.other++;
  }
  const labels = ["Gynécologie", "Obstétrique", "Infertilité", "Non classifié"];
  const values = [s.gyn, s.obst, s.inf, s.other];
  const colors = ["#0d6e6e", "#7c3aed", "#d97706", "#9ca3af"];
  const total = values.reduce((a, b) => a + b, 0);
  const top = labels[values.indexOf(Math.max(...values))];
  return {
    type: "specs",
    title: "🥧 Répartition par spécialité",
    badges: [`${total} dossiers`, `Dominant : ${top}`],
    insight: labels.map((l, i) => `${l} : ${values[i]} (${pct(values[i], total)}%)`).join(" · "),
    chart: { kind: "donut", labels, values, colors },
    raw: labels.map((l, i) => ({ specialite: l, count: values[i], pct: pct(values[i], total) + "%" })),
  };
}

// ── IMC ──
function imc(pts: PatientSnapshot[]): AnalyticResult {
  const labels = ["<18.5", "18.5–25", "25–30", "30–35", "≥35"];
  const counts = [0, 0, 0, 0, 0];
  let n = 0;
  for (const p of pts) {
    const poids = parseFloat(p.ec_poids || p.o_poids || "");
    const taille = parseFloat(p.ec_taille || "") / 100;
    if (!poids || !taille || taille < 1) continue;
    const v = poids / (taille * taille);
    n++;
    const i = v < 18.5 ? 0 : v < 25 ? 1 : v < 30 ? 2 : v < 35 ? 3 : 4;
    counts[i]++;
  }
  const colors = ["#38bdf8", "#34d399", "#f59e0b", "#f97316", "#ef4444"];
  if (!n) {
    return { type: "imc", title: "⚖️ Distribution IMC", badges: [], insight: "⚠️ Données IMC insuffisantes — renseignez poids et taille dans l'examen clinique.", chart: null, raw: [] };
  }
  return {
    type: "imc",
    title: "⚖️ Distribution IMC de la patientèle",
    badges: [`${n} patientes avec IMC`, `Surpoids+obésité : ${pct(counts[2] + counts[3] + counts[4], n)}%`],
    insight: `Normal : ${pct(counts[1], n)}% · Surpoids : ${pct(counts[2], n)}% · Obésité : ${pct(counts[3] + counts[4], n)}% · N=${n}`,
    chart: { kind: "bar", labels, values: counts, colors, axisTitle: "Répartition par IMC (kg/m²)" },
    raw: labels.map((g, i) => ({ groupe_imc: g, count: counts[i] })),
  };
}

// ── DG par terme ──
function dgTerme(pts: PatientSnapshot[]): AnalyticResult {
  const obst = pts.filter((p) => p.specialite === "obst");
  const labels = ["< 14 SA", "14–22 SA", "23–28 SA", "29–32 SA", "≥ 33 SA"];
  const counts = [0, 0, 0, 0, 0];
  let nTerme = 0;
  for (const p of obst) {
    const terme = parseInt(p.o_terme || "", 10);
    if (!terme) continue;
    nTerme++;
    const i = terme < 14 ? 0 : terme < 23 ? 1 : terme < 29 ? 2 : terme < 33 ? 3 : 4;
    counts[i]++;
  }
  const colors = ["#38bdf8", "#34d399", "#0d6e6e", "#7c3aed", "#f97316"];
  const peak = labels[counts.indexOf(Math.max(...counts, 0))];
  return {
    type: "dg_terme",
    title: "🍬 Consultations obstétricales par terme",
    badges: [`${obst.length} dossiers obstétrique`, `${nTerme} avec terme`],
    insight: `Terme le plus consulté : ${peak} (${Math.max(...counts, 0)} cas) · Total obstétrique : ${obst.length} dossiers`,
    chart: { kind: "bar", labels, values: counts, colors, axisTitle: "Répartition par terme de grossesse" },
    raw: labels.map((g, i) => ({ terme: g, count: counts[i] })),
  };
}

// ── Parité ──
function parite(pts: PatientSnapshot[]): AnalyticResult {
  const obst = pts.filter((p) => p.specialite === "obst" || p.g_par || p.o_par);
  const labels = ["P0", "P1", "P2–3", "P4+"];
  const counts = [0, 0, 0, 0];
  let n = 0;
  for (const p of obst) {
    const par = parseInt(p.o_par || p.g_par || "", 10);
    if (Number.isNaN(par)) continue;
    n++;
    const i = par === 0 ? 0 : par === 1 ? 1 : par <= 3 ? 2 : 3;
    counts[i]++;
  }
  const colors = ["#38bdf8", "#34d399", "#0d6e6e", "#7c3aed"];
  if (!n) {
    return { type: "parite", title: "🤰 Distribution de la parité", badges: [], insight: "⚠️ Données de parité insuffisantes.", chart: null, raw: [] };
  }
  return {
    type: "parite",
    title: "🤰 Distribution de la parité",
    badges: [`${n} patientes avec parité`, `Nullipares : ${pct(counts[0], n)}%`, `Multipares : ${pct(counts[3], n)}%`],
    insight: labels.map((l, i) => `${l} : ${counts[i]} (${pct(counts[i], n)}%)`).join(" · ") + ` · N=${n}`,
    chart: { kind: "bar", labels, values: counts, colors, axisTitle: "Distribution de la parité (P0 → P4+)" },
    raw: labels.map((g, i) => ({ parite: g, count: counts[i] })),
  };
}

// ── HTA par âge ──
function taAge(pts: PatientSnapshot[]): AnalyticResult {
  const now = Date.now();
  const labels = ["<25", "25–34", "35–44", "≥45"];
  const totals = [0, 0, 0, 0];
  const htas = [0, 0, 0, 0];
  for (const p of pts) {
    const a = ageOf(p, now);
    if (a == null) continue;
    const i = a < 25 ? 0 : a < 35 ? 1 : a < 45 ? 2 : 3;
    totals[i]++;
    const syst = parseInt((p.ec_ta || p.o_ta || "").split("/")[0], 10);
    if (syst >= 140) htas[i]++;
  }
  const rates = labels.map((_, i) => pct(htas[i], totals[i]));
  const colors = ["#38bdf8", "#34d399", "#f59e0b", "#ef4444"];
  const nTotal = totals.reduce((a, b) => a + b, 0);
  const nHta = htas.reduce((a, b) => a + b, 0);
  return {
    type: "ta_age",
    title: "💉 Prévalence HTA par tranche d'âge",
    badges: [`${nTotal} patientes`, `HTA globale : ${pct(nHta, nTotal)}%`],
    insight: labels.map((l, i) => `${l} : ${rates[i]}% (${htas[i]}/${totals[i]})`).join(" · "),
    chart: { kind: "bar", labels, values: rates, colors, axisTitle: "Taux d'HTA (TA syst. ≥ 140) par âge (%)", maxOverride: 100 },
    raw: labels.map((g, i) => ({ tranche: g, htas: htas[i], total: totals[i], taux: rates[i] + "%" })),
  };
}

const DISPATCH: Record<AnalyticType, (pts: PatientSnapshot[]) => AnalyticResult> = {
  pyramide,
  prevalence,
  age_patho: agePatho,
  activite,
  tendance,
  specs,
  imc,
  dg_terme: dgTerme,
  parite,
  ta_age: taAge,
};

export function runAnalytic(type: AnalyticType, pts: PatientSnapshot[]): AnalyticResult {
  return (DISPATCH[type] || prevalence)(pts);
}

export function filterByPeriod(
  pts: PatientSnapshot[],
  period: number | "all",
): PatientSnapshot[] {
  if (period === "all") return pts;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - period);
  const c = cutoff.getTime();
  return pts.filter((p) => savedDate(p) >= c);
}
