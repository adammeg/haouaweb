import type { PatientSnapshot, Specialty } from "@/types/domain";

export function getPatientDisplayName(p: PatientSnapshot): string {
  const n = `${p.prenom ?? ""} ${p.nom ?? ""}`.trim();
  return n || "Patiente";
}

export function patientAgeYears(ddn?: string): number | null {
  if (!ddn) return null;
  const b = new Date(ddn);
  if (Number.isNaN(b.getTime())) return null;
  const diff = Date.now() - b.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

/** Champs conservés après « Nouvelle consultation » (logique template). */
export function extractIdentitySnapshot(
  data: PatientSnapshot,
): Partial<PatientSnapshot> {
  return {
    nom: data.nom,
    prenom: data.prenom,
    ddn: data.ddn,
    tel: data.tel,
    profession: data.profession,
    cin: data.cin,
    specialite: data.specialite,
    hta: data.hta,
    diabete: data.diabete,
    thyroide: data.thyroide,
    atcdMed: data.atcdMed,
    chir: data.chir,
    tabac: data.tabac,
    traitements: data.traitements,
    imc: data.imc,
    o_gest: data.o_gest,
    o_par: data.o_par,
    o_abort: data.o_abort,
    o_grp: data.o_grp,
    o_ncs: data.o_ncs,
  };
}

export function emptyConsultFields(): Partial<PatientSnapshot> {
  return {
    motif: "",
    symptomes: "",
    debut: "",
    allergies: "",
    eva: "0",
    g_ddr: "",
    g_cycle: "",
    g_regles: "",
    g_reg: "",
    g_dysmen: "",
    g_abond: "",
    g_metro: "",
    g_leuco: "",
    g_menarche: "",
    g_meno: "",
    g_sex: "",
    g_dysp: "",
    g_contra: "",
    g_fcv: "",
    g_fcv_res: "",
    g_ist: "",
    g_patho: "",
    g_gest: "",
    g_par: "",
    g_abort: "",
    o_ddr: "",
    o_terme: "",
    o_dpa: "",
    o_type: "",
    o_concept: "",
    o_suivi: "",
    o_rai: "",
    o_toxo: "",
    o_rubeo: "",
    o_hbv: "",
    o_vih: "",
    o_ecbu: "",
    o_hb: "",
    o_gly: "",
    o_hu: "",
    o_pres: "",
    o_bcf: "",
    o_ta: "",
    o_poids: "",
    o_indcs: "",
    o_atcd_gross: "",
    o_complic: "",
    i_duree: "",
    i_type: "",
    i_ddr: "",
    i_cycle: "",
    ec_ta: "",
    ec_pouls: "",
    ec_temp: "",
    ec_poids: "",
    ec_taille: "",
    ec_hu: "",
    ec_presentation: "",
    ec_bcf: "",
    ec_dil: "",
    ec_eff: "",
    ec_cons: "",
    ec_hpres: "",
    ec_conclusion: "",
  };
}

const ANAM_KEYS: (keyof PatientSnapshot)[] = [
  "motif",
  "symptomes",
  "debut",
  "atcdMed",
  "chir",
  "traitements",
  "imc",
  "allergies",
  "g_ddr",
  "g_cycle",
  "o_terme",
  "o_dpa",
  "i_duree",
];

function specKeys(spec: Specialty | ""): (keyof PatientSnapshot)[] {
  if (spec === "obst") {
    return [
      "o_gest",
      "o_par",
      "o_ddr",
      "o_terme",
      "o_dpa",
      "o_grp",
      "o_hb",
      "o_gly",
    ];
  }
  if (spec === "inf") {
    return ["i_duree", "i_type", "i_ddr", "i_cycle"];
  }
  return ["g_ddr", "g_cycle", "g_contra", "g_gest", "g_par"];
}

/** Complétude approximative du dossier (0–100). */
export function computeCompleteness(p: PatientSnapshot): number {
  const keys = [...ANAM_KEYS, ...specKeys(p.specialite as Specialty | "")];
  const filled = keys.filter((k) => {
    const v = p[k];
    return v !== undefined && v !== null && String(v).trim() !== "";
  }).length;
  return keys.length === 0 ? 0 : Math.min(100, Math.round((filled / keys.length) * 100));
}
