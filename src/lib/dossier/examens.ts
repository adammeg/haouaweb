import type { ExamEntry, PatientSnapshot } from "@/types/domain";
import { O_GRP, O_RUBEO, O_TOXO } from "@/lib/dossier/anamnese-config";
import { appendSocleLog } from "@/lib/dossier/socle";

/**
 * Examens datés (étape 2 de la refonte, docs/refonte-dossier-etape-2-examens-dates.md).
 * Un examen garde sa date et ses valeurs ; la valeur la plus récente de chaque analyse est recopiée
 * dans les champs historiques du dossier pour que scores, alertes, Hawae et PDF restent inchangés.
 */

type Key = keyof PatientSnapshot & string;
type Option = { value: string; label: string };

export type Analyte = {
  id: string;
  label: string;
  unit?: string;
  options?: Option[];
  /** Champs du dossier qui reçoivent la valeur la plus récente (tous les doublons, pour qu'aucun ne reste périmé). */
  targets: Key[];
  placeholder?: string;
};

const NEG_POS: Option[] = [
  { value: "neg", label: "Négatif" },
  { value: "pos", label: "Positif" },
];

export const ANALYTES: Record<string, Analyte> = {
  groupe: { id: "groupe", label: "Groupe / Rhésus", options: O_GRP, targets: ["o_grp"] },
  rai: {
    id: "rai",
    label: "RAI",
    options: [...NEG_POS, { value: "nd", label: "Non dosée" }],
    targets: ["o_rai"],
  },
  toxo: { id: "toxo", label: "Toxoplasmose", options: O_TOXO, targets: ["o_toxo"] },
  rubeole: { id: "rubeole", label: "Rubéole", options: O_RUBEO, targets: ["o_rubeo"] },
  hbs: { id: "hbs", label: "Ag HBs", options: NEG_POS, targets: ["o_hbv"] },
  vih: { id: "vih", label: "VIH", options: [...NEG_POS, { value: "nd", label: "Non dosé" }], targets: ["o_vih"] },
  syphilis: { id: "syphilis", label: "Syphilis (TPHA/VDRL)", options: NEG_POS, targets: ["bio_syphilis"] },
  ecbu: {
    id: "ecbu",
    label: "ECBU",
    options: [
      { value: "norm", label: "Stérile / normal" },
      { value: "pos", label: "Positif" },
    ],
    targets: ["o_ecbu"],
  },
  sgb: { id: "sgb", label: "Prélèvement vaginal (strepto B)", options: NEG_POS, targets: ["bio_sgb"] },
  hb: { id: "hb", label: "Hémoglobine", unit: "g/dL", targets: ["bio_hb", "o_hb"], placeholder: "11.8" },
  vgm: { id: "vgm", label: "VGM", unit: "fL", targets: ["bio_vgm"] },
  gb: { id: "gb", label: "Globules blancs", unit: "G/L", targets: ["bio_gb"] },
  plq: { id: "plq", label: "Plaquettes", unit: "G/L", targets: ["bio_plq"] },
  ferritine: { id: "ferritine", label: "Ferritine", unit: "µg/L", targets: ["bio_ferritine"] },
  gly: { id: "gly", label: "Glycémie à jeun", unit: "g/L", targets: ["bio_gly", "o_gly"], placeholder: "0.85" },
  hgpo0: { id: "hgpo0", label: "HGPO 75 g : à jeun", unit: "g/L", targets: ["bio_gly", "o_gly"] },
  hgpo1: { id: "hgpo1", label: "HGPO 75 g : 1 h", unit: "g/L", targets: ["bio_hgpo1", "o_hgpo_t1"] },
  hgpo2: { id: "hgpo2", label: "HGPO 75 g : 2 h", unit: "g/L", targets: ["bio_hgpo2", "o_hgpo_t2"] },
  hba1c: { id: "hba1c", label: "HbA1c", unit: "%", targets: ["bio_hba1c"] },
  asat: { id: "asat", label: "ASAT", unit: "UI/L", targets: ["bio_asat"] },
  alat: { id: "alat", label: "ALAT", unit: "UI/L", targets: ["bio_alat"] },
  creat: { id: "creat", label: "Créatinine", unit: "mg/L", targets: ["bio_creatinine"] },
  urique: { id: "urique", label: "Acide urique", unit: "mg/L", targets: ["bio_urique"] },
  proteinurie: { id: "proteinurie", label: "Protéinurie des 24 h", unit: "g/24 h", targets: ["bio_proteinurie"] },
  sflt: { id: "sflt", label: "Rapport sFlt-1/PlGF", targets: ["bio_sflt_plgf"] },
  crp: { id: "crp", label: "CRP", unit: "mg/L", targets: ["bio_crp"] },
  tp: { id: "tp", label: "TP", unit: "%", targets: ["bio_tp"] },
  tca: { id: "tca", label: "TCA (ratio)", targets: ["bio_tca"] },
  fibri: { id: "fibri", label: "Fibrinogène", unit: "g/L", targets: ["bio_fibri"] },
  ddimeres: { id: "ddimeres", label: "D-dimères", unit: "µg/L", targets: ["bio_ddimeres"] },
  fsh: { id: "fsh", label: "FSH", unit: "UI/L", targets: ["bio_fsh"] },
  lh: { id: "lh", label: "LH", unit: "UI/L", targets: ["bio_lh"] },
  e2: { id: "e2", label: "Estradiol (E2)", unit: "pg/mL", targets: ["bio_e2"] },
  amh: { id: "amh", label: "AMH", unit: "ng/mL", targets: ["bio_amh", "i_amh_ngml"] },
  prl: { id: "prl", label: "Prolactine", unit: "mUI/L", targets: ["bio_prl"] },
  prog: { id: "prog", label: "Progestérone", unit: "ng/mL", targets: ["bio_prog"] },
  testo: { id: "testo", label: "Testostérone", unit: "ng/mL", targets: ["bio_testo"] },
  dheas: { id: "dheas", label: "DHEAS", unit: "µg/dL", targets: ["bio_dheas"] },
  tsh: { id: "tsh", label: "TSH", unit: "mUI/L", targets: ["bio_tsh"] },
  t4l: { id: "t4l", label: "T4 libre", unit: "pmol/L", targets: ["bio_t4l"] },
  bhcg: { id: "bhcg", label: "βhCG", unit: "UI/L", targets: ["bio_bhcg"] },
  ca125: { id: "ca125", label: "CA-125", unit: "UI/mL", targets: ["bio_ca125", "i_ca125"] },
  he4: { id: "he4", label: "HE4", unit: "pmol/L", targets: ["bio_he4", "g_he4", "i_he4_inf"] },
};

export type BioPanel = { id: string; label: string; analytes: string[] };

/** Bilans proposés : seules les analyses du bilan choisi sont affichées à la saisie. */
export const BIO_PANELS: BioPanel[] = [
  {
    id: "prenatal_t1",
    label: "Bilan prénatal du 1er trimestre",
    analytes: ["groupe", "rai", "toxo", "rubeole", "hbs", "vih", "syphilis", "hb", "plq", "gly", "ecbu"],
  },
  { id: "hgpo", label: "Dépistage du diabète gestationnel (HGPO 75 g)", analytes: ["hgpo0", "hgpo1", "hgpo2"] },
  { id: "t2_t3", label: "Bilan des 2e et 3e trimestres", analytes: ["hb", "plq", "rai", "toxo", "sgb"] },
  {
    id: "pre_eclampsie",
    label: "Bilan de pré-éclampsie",
    analytes: ["hb", "plq", "asat", "alat", "creat", "urique", "proteinurie", "sflt"],
  },
  { id: "hormonal", label: "Bilan hormonal (J2-J4)", analytes: ["fsh", "lh", "e2", "amh", "prl", "tsh", "testo", "dheas", "prog"] },
  { id: "thyroide", label: "Bilan thyroïdien", analytes: ["tsh", "t4l"] },
  { id: "marqueurs", label: "Marqueurs tumoraux", analytes: ["ca125", "he4"] },
  { id: "preop", label: "Bilan préopératoire", analytes: ["hb", "plq", "tp", "tca", "fibri", "groupe", "rai"] },
  { id: "nfs", label: "NFS, fer, inflammation", analytes: ["hb", "vgm", "gb", "plq", "ferritine", "crp"] },
  { id: "grossesse", label: "βhCG", analytes: ["bhcg"] },
  { id: "metabolique", label: "Bilan métabolique", analytes: ["gly", "hba1c", "creat"] },
];

export const panelById = (id?: string) => BIO_PANELS.find((p) => p.id === id);

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export function analyteDisplay(a: Analyte, raw: string): string {
  if (a.options) return a.options.find((o) => o.value === raw)?.label ?? raw;
  return a.unit ? `${raw} ${a.unit}` : raw;
}

/** Terme à une date donnée, d'après la DDR de la grossesse en cours (convention 40 SA). */
export function termeAt(ddr: string | undefined, date: string): string {
  const start = new Date(str(ddr));
  const at = new Date(date);
  if (Number.isNaN(start.getTime()) || Number.isNaN(at.getTime())) return "";
  const days = Math.floor((at.getTime() - start.getTime()) / 86400000);
  if (days < 0 || days > 45 * 7) return "";
  return `${Math.floor(days / 7)} SA + ${days % 7} j`;
}

const order = (a: ExamEntry, b: ExamEntry) =>
  b.date.localeCompare(a.date) || (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");

export function sortExams(list: ExamEntry[]): ExamEntry[] {
  return [...list].sort(order);
}

/**
 * Valeur la plus récente de chaque analyse, recopiée dans les champs historiques. Une analyse
 * absente de tous les examens ne touche pas son champ (les anciennes saisies restent).
 */
export function projectLatest(list: ExamEntry[]): Partial<PatientSnapshot> {
  const patch: Record<string, string> = {};
  const done = new Set<string>();
  for (const e of sortExams(list)) {
    for (const [id, raw] of Object.entries(e.values)) {
      const v = str(raw);
      const a = ANALYTES[id];
      if (!v || !a) continue;
      for (const t of a.targets) {
        if (done.has(t)) continue;
        done.add(t);
        patch[t] = v;
      }
    }
  }
  return patch as Partial<PatientSnapshot>;
}

const SOCLE_TARGETS: Partial<Record<Key, string>> = {
  o_grp: "Groupe sanguin",
  o_toxo: "Toxoplasmose",
  o_rubeo: "Rubéole",
};

/** Correctif complet à enregistrer après ajout, modification ou suppression d'examens. */
export function examsPatch(d: PatientSnapshot, next: ExamEntry[], at = new Date()): Partial<PatientSnapshot> {
  const projected = projectLatest(next);
  const patch: Partial<PatientSnapshot> = { examens: next, ...projected };
  // Groupe, rubéole et toxoplasmose appartiennent à l'anamnèse commune : chaque changement y est tracé.
  const changes = (Object.keys(SOCLE_TARGETS) as Key[])
    .filter((k) => projected[k] !== undefined && str(projected[k]) !== str(d[k]))
    .map((k) => `${SOCLE_TARGETS[k]} : ${projected[k]}`);
  if (changes.length) {
    patch.socleLog = appendSocleLog(d, `Mis à jour par un bilan biologique : ${changes.join(", ")}`, at);
  }
  return patch;
}

export function newExamId(): string {
  return `ex_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function saveExam(d: PatientSnapshot, exam: ExamEntry, at = new Date()): Partial<PatientSnapshot> {
  const clean: ExamEntry = {
    ...exam,
    values: Object.fromEntries(Object.entries(exam.values).filter(([, v]) => str(v))),
    updatedAt: at.toISOString(),
    createdAt: exam.createdAt ?? at.toISOString(),
  };
  const list = (d.examens ?? []).filter((e) => e.id !== exam.id);
  return examsPatch(d, [...list, clean], at);
}

/**
 * Supprimer un examen retire aussi ses valeurs des champs historiques quand plus aucun examen ne
 * fournit l'analyse et que le champ contient encore la valeur supprimée (une erreur de saisie ne doit
 * pas survivre). Une valeur saisie avant les examens datés reste intacte.
 */
export function deleteExam(d: PatientSnapshot, id: string, at = new Date()): Partial<PatientSnapshot> {
  const removed = (d.examens ?? []).find((e) => e.id === id);
  const rest = (d.examens ?? []).filter((e) => e.id !== id);
  const patch = examsPatch(d, rest, at) as Record<string, unknown>;
  for (const [aid, raw] of Object.entries(removed?.values ?? {})) {
    for (const t of ANALYTES[aid]?.targets ?? []) {
      if (patch[t] === undefined && str(d[t]) === str(raw)) patch[t] = "";
    }
  }
  return patch as Partial<PatientSnapshot>;
}

/** Résumé d'un examen pour la frise : les valeurs saisies, dans l'ordre du bilan. */
export function examSummary(e: ExamEntry): string {
  const ids = panelById(e.panel)?.analytes ?? Object.keys(e.values);
  return ids
    .filter((id) => str(e.values[id]) && ANALYTES[id])
    .map((id) => `${ANALYTES[id].label} ${analyteDisplay(ANALYTES[id], str(e.values[id]))}`)
    .join(" · ");
}
