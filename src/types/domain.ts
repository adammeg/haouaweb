/** Aligné sur la logique HawaeMD (spécialités + dossier clinique). */

export type Specialty = "gyn" | "obst" | "inf";

export const SPECIALTY_LABELS: Record<Specialty, string> = {
  gyn: "Gynécologie",
  obst: "Obstétrique",
  inf: "Infertilité / AMP",
};

export type UserRole =
  | "chef"
  | "medecin"
  | "secretaire"
  | "resident"
  | "intern";

export const ROLE_LABELS: Record<UserRole, string> = {
  chef: "Chef de service",
  medecin: "Médecin",
  secretaire: "Secrétaire",
  resident: "Résident(e)",
  intern: "Interne",
};

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  color: string;
  initials: string;
}

export interface OrdoLine {
  id: string;
  dci: string;
  dose: string;
  posologie: string;
  duree: string;
  boites?: number;
  cat?: string;
}

/** Entrée d’historique assistant Hawae stockée sur le dossier patient. */
export interface HawaeIaExchange {
  id: string;
  at: string;
  mode: "diagnostic" | "question";
  /** Saisie médecin si mode === "question" */
  question?: string;
  reply: string;
  /**
   * Empreinte clinique (sans historique IA ni timestamps) au moment de la génération ;
   * permet de réafficher la dernière analyse sans rappeler l’API si le dossier n’a pas bougé.
   */
  contextKeyAtGeneration?: string;
}

/** Snapshot dossier — champs optionnels pour évolution sans migration lourde. */
export interface PatientSnapshot {
  id: string;
  specialite: Specialty | "";
  nom?: string;
  prenom?: string;
  ddn?: string;
  tel?: string;
  profession?: string;
  cin?: string;
  motif?: string;
  symptomes?: string;
  debut?: string;
  hta?: string;
  diabete?: string;
  thyroide?: string;
  atcdMed?: string;
  chir?: string;
  tabac?: string;
  traitements?: string;
  imc?: string;
  allergies?: string;
  eva?: string;
  g_ddr?: string;
  g_cycle?: string;
  g_regles?: string;
  g_reg?: string;
  g_dysmen?: string;
  g_abond?: string;
  g_metro?: string;
  g_leuco?: string;
  g_menarche?: string;
  g_meno?: string;
  g_sex?: string;
  g_dysp?: string;
  g_contra?: string;
  g_fcv?: string;
  g_fcv_res?: string;
  g_ist?: string;
  g_patho?: string;
  g_gest?: string;
  g_par?: string;
  g_abort?: string;
  o_gest?: string;
  o_par?: string;
  o_abort?: string;
  o_ddr?: string;
  o_terme?: string;
  o_dpa?: string;
  o_type?: string;
  o_concept?: string;
  o_suivi?: string;
  o_grp?: string;
  o_rai?: string;
  o_toxo?: string;
  o_rubeo?: string;
  o_hbv?: string;
  o_vih?: string;
  o_ecbu?: string;
  o_hb?: string;
  o_gly?: string;
  o_hu?: string;
  o_pres?: string;
  o_bcf?: string;
  o_ta?: string;
  o_poids?: string;
  o_ncs?: string;
  o_indcs?: string;
  o_atcd_gross?: string;
  o_complic?: string;
  i_duree?: string;
  i_type?: string;
  i_ddr?: string;
  i_cycle?: string;
  ec_ta?: string;
  ec_pouls?: string;
  ec_temp?: string;
  ec_poids?: string;
  ec_taille?: string;
  ec_hu?: string;
  ec_presentation?: string;
  ec_bcf?: string;
  ec_dil?: string;
  ec_eff?: string;
  ec_cons?: string;
  ec_hpres?: string;
  ec_conclusion?: string;
  lastSaved?: string;
  updatedAt?: string;

  /** Ordonnance liée au dossier (persistée localement / synchro workspace). */
  ordonnanceLines?: OrdoLine[];
  ordonnanceNote?: string;
  ordonnanceValidite?: string;

  /** Historique des analyses et questions Hawae (persisté sur le dossier). */
  hawaeIaHistory?: HawaeIaExchange[];
}

export interface ConsultationEntry {
  id: string;
  date: string;
  specialite: Specialty | "";
  motif: string;
  symptomes: string;
  terme?: string;
  data: PatientSnapshot;
}

export interface OrdoSuggestion {
  dci: string;
  dose: string;
  posologie: string;
  duree: string;
  boites?: number;
  cat?: string;
}

export interface OrdoTemplate {
  id: string;
  name: string;
  spec: Specialty | "all";
  icon: string;
  lignes: Omit<OrdoSuggestion, "cat">[];
}
