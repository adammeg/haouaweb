import type { ExamEntry, PatientSnapshot } from "@/types/domain";
import { O_EDF, O_GRP, O_RUBEO, O_TOXO } from "@/lib/dossier/anamnese-config";
import { appendSocleLog } from "@/lib/dossier/socle";
import { computeBiometryPercentile, type SalomonKey } from "@/lib/t2-echo/salomon";

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
  /** Texte libre (description) plutôt qu'une valeur numérique. */
  text?: boolean;
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

const PRESENT_ABSENT: Option[] = [
  { value: "presente", label: "Présente" },
  { value: "absente", label: "Absente" },
];
const BPP = (normal: string, abnormal: string): Option[] => [
  { value: "1", label: `${normal} (2)` },
  { value: "0", label: `${abnormal} (0)` },
];

/**
 * Mesures échographiques. Les champs cibles sont ceux que lisent déjà les scores ; une mesure sans
 * cible est conservée dans l'examen et affichée, sans alimenter de calcul.
 */
export const ECHO_MEASURES: Record<string, Analyte> = {
  localisation: {
    id: "localisation",
    label: "Localisation",
    options: [
      { value: "intra", label: "Intra-utérine" },
      { value: "extra", label: "Extra-utérine suspectée" },
      { value: "indet", label: "Indéterminée" },
    ],
    targets: [],
  },
  nb_embryons: {
    id: "nb_embryons",
    label: "Nombre d'embryons",
    options: [
      { value: "1", label: "Unique" },
      { value: "2", label: "Gémellaire" },
      { value: "3", label: "Trois ou plus" },
    ],
    targets: [],
  },
  sac: { id: "sac", label: "Sac gestationnel", unit: "mm", targets: [] },
  lcc: { id: "lcc", label: "LCC", unit: "mm", targets: ["o_lcc"] },
  activite_cardiaque: { id: "activite_cardiaque", label: "Activité cardiaque", options: PRESENT_ABSENT, targets: [] },
  bip: { id: "bip", label: "BIP", unit: "mm", targets: ["o_bip"] },
  pc: { id: "pc", label: "PC", unit: "mm", targets: ["o_pc"] },
  ca: { id: "ca", label: "CA", unit: "mm", targets: ["o_ca"] },
  lf: { id: "lf", label: "LF", unit: "mm", targets: ["o_lf"] },
  pfe: { id: "pfe", label: "PFE", unit: "g", targets: ["o_pfe"] },
  liquide: {
    id: "liquide",
    label: "Liquide amniotique",
    options: [
      { value: "normal", label: "Normal" },
      { value: "oligo", label: "Oligoamnios" },
      { value: "hydra", label: "Hydramnios" },
    ],
    targets: [],
  },
  placenta: { id: "placenta", label: "Placenta (localisation)", text: true, targets: [] },
  presentation: {
    id: "presentation",
    label: "Présentation",
    options: [
      { value: "Céphalique", label: "Céphalique" },
      { value: "Siège complet", label: "Siège complet" },
      { value: "Siège décomplété", label: "Siège décomplété" },
      { value: "Transverse", label: "Transverse" },
    ],
    // Pas de recopie : la présentation change, une ancienne écho ne doit pas faire foi à la consultation.
    targets: [],
  },
  col: { id: "col", label: "Longueur du col", unit: "mm", targets: ["o_col"] },
  ip_ao: { id: "ip_ao", label: "IP artère ombilicale", targets: ["o_ip_ao"] },
  edf: { id: "edf", label: "Diastole ombilicale", options: O_EDF.filter((o) => o.value), targets: ["o_edf"] },
  ip_acm: { id: "ip_acm", label: "IP artère cérébrale moyenne", targets: ["o_ip_acm"] },
  bpp_nst: { id: "bpp_nst", label: "BPP : RCF", options: BPP("Réactif", "Non réactif"), targets: ["o_bpp_nst"] },
  bpp_resp: { id: "bpp_resp", label: "BPP : mouvements respiratoires", options: BPP("Présents", "Absents"), targets: ["o_bpp_resp"] },
  bpp_mvt: { id: "bpp_mvt", label: "BPP : mouvements actifs", options: BPP("≥ 3", "< 3"), targets: ["o_bpp_mvt"] },
  bpp_tonus: { id: "bpp_tonus", label: "BPP : tonus", options: BPP("Normal", "Absent"), targets: ["o_bpp_tonus"] },
  bpp_la: { id: "bpp_la", label: "BPP : liquide amniotique", options: BPP("Normal", "Oligoamnios"), targets: ["o_bpp_la"] },
  uterus: { id: "uterus", label: "Utérus (taille, position)", text: true, targets: [] },
  endometre: { id: "endometre", label: "Endomètre", unit: "mm", targets: [] },
  myomes: { id: "myomes", label: "Myomes (taille, type FIGO)", text: true, targets: [] },
  ovaire_d: { id: "ovaire_d", label: "Ovaire droit", text: true, targets: [] },
  ovaire_g: { id: "ovaire_g", label: "Ovaire gauche", text: true, targets: [] },
  masse: { id: "masse", label: "Masse annexielle, plus grand diamètre", unit: "mm", targets: ["g_kyste_diam", "i_kyste_diam"] },
  orads: {
    id: "orads",
    label: "O-RADS",
    options: ["1", "2", "3", "4", "5"].map((v) => ({ value: v, label: `O-RADS ${v}` })),
    targets: [],
  },
  cfa_d: { id: "cfa_d", label: "CFA ovaire droit", targets: [] },
  cfa_g: { id: "cfa_g", label: "CFA ovaire gauche", targets: [] },
  cfa: { id: "cfa", label: "CFA total", targets: ["i_cfa"] },
  jour_stim: { id: "jour_stim", label: "Jour de stimulation", targets: [] },
  foll_d: { id: "foll_d", label: "Follicules ovaire droit (mm)", text: true, placeholder: "18, 16, 12", targets: [] },
  foll_g: { id: "foll_g", label: "Follicules ovaire gauche (mm)", text: true, placeholder: "17, 14", targets: [] },
  e2_jour: { id: "e2_jour", label: "E2 du jour", unit: "pg/mL", targets: [] },
  lh_jour: { id: "lh_jour", label: "LH du jour", unit: "UI/L", targets: [] },
};

/** Toutes les mesures, biologiques et échographiques, par identifiant. */
export const MEASURES: Record<string, Analyte> = { ...ANALYTES, ...ECHO_MEASURES };

export type BioPanel = { id: string; label: string; analytes: string[]; kind?: "bio" | "echo" };

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

/** Types d'échographie datée. La T1 avec dépistage et la Morpho T2 restent pour l'instant des modules à part. */
export const ECHO_PANELS: BioPanel[] = [
  {
    id: "echo_datation",
    label: "Écho de datation précoce",
    kind: "echo",
    analytes: ["localisation", "nb_embryons", "sac", "lcc", "activite_cardiaque"],
  },
  {
    id: "echo_croissance",
    label: "Écho de croissance",
    kind: "echo",
    analytes: ["bip", "pc", "ca", "lf", "pfe", "liquide", "placenta", "presentation", "col"],
  },
  {
    id: "echo_doppler_bpp",
    label: "Doppler et score biophysique",
    kind: "echo",
    analytes: ["ip_ao", "edf", "ip_acm", "bpp_nst", "bpp_resp", "bpp_mvt", "bpp_tonus", "bpp_la"],
  },
  { id: "echo_col", label: "Cervicométrie", kind: "echo", analytes: ["col"] },
  {
    id: "echo_pelvienne",
    label: "Écho pelvienne",
    kind: "echo",
    analytes: ["uterus", "endometre", "myomes", "ovaire_d", "ovaire_g", "masse", "orads"],
  },
  {
    id: "echo_infertilite",
    label: "Écho de bilan d'infertilité",
    kind: "echo",
    analytes: ["cfa_d", "cfa_g", "cfa", "endometre", "uterus", "ovaire_d", "ovaire_g", "masse"],
  },
  {
    id: "echo_monitorage",
    label: "Monitorage folliculaire",
    kind: "echo",
    analytes: ["jour_stim", "foll_d", "foll_g", "endometre", "e2_jour", "lh_jour"],
  },
];

export const panelById = (id?: string) => [...BIO_PANELS, ...ECHO_PANELS].find((p) => p.id === id);

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
      const a = MEASURES[id];
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
    for (const t of MEASURES[aid]?.targets ?? []) {
      if (patch[t] === undefined && str(d[t]) === str(raw)) patch[t] = "";
    }
  }
  return patch as Partial<PatientSnapshot>;
}

/** Terme en semaines décimales (« 27 SA + 5 j » → 27,71). */
export function termeWeeks(terme?: string): number | null {
  const m = (terme ?? "").match(/(\d+)\s*SA(?:\s*\+\s*(\d+))?/);
  return m ? Number(m[1]) + Number(m[2] ?? 0) / 7 : null;
}

const BIOMETRY: SalomonKey[] = ["bip", "pc", "ca", "lf", "pfe"];

/** Percentile de chaque biométrie au terme de l'examen (tables Salomon déjà utilisées par la Morpho T2). */
export function biometryPercentiles(e: ExamEntry): Record<string, string> {
  const ga = termeWeeks(e.terme);
  const out: Record<string, string> = {};
  if (!ga) return out;
  for (const k of BIOMETRY) {
    const v = parseFloat(str(e.values[k]));
    const r = Number.isFinite(v) ? computeBiometryPercentile(k, ga, v) : null;
    if (r) out[k] = r.result.txt;
  }
  return out;
}

/** Résumé d'un examen pour la frise : les valeurs saisies, dans l'ordre du bilan. */
export function examSummary(e: ExamEntry): string {
  const ids = panelById(e.panel)?.analytes ?? Object.keys(e.values);
  const pct = biometryPercentiles(e);
  return ids
    .filter((id) => str(e.values[id]) && MEASURES[id])
    .map((id) => {
      const base = `${MEASURES[id].label} ${analyteDisplay(MEASURES[id], str(e.values[id]))}`;
      return pct[id] ? `${base} (${pct[id]} p.)` : base;
    })
    .join(" · ");
}
