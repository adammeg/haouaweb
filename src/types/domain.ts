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
  g_endometriose?: string;
  g_prolapsus?: string;
  g_oncologie?: string;
  g_kyste_diam?: string;
  g_he4?: string;
  ethnie?: string;
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
  o_maf?: string;
  o_cu?: string;
  o_oed?: string;
  o_pdstot?: string;
  o_nt?: string;
  o_papp_a_raw?: string;
  o_papp_a_unit?: string;
  o_papp_a_mom?: string;
  o_bhcg_raw?: string;
  o_bhcg_unit?: string;
  o_bhcg_mom?: string;
  o_plgf_raw?: string;
  o_plgf_mom?: string;
  o_os_nasal?: string;
  o_dv_flux?: string;
  o_uta_ip_g?: string;
  o_uta_ip_d?: string;
  o_map?: string;
  o_bip?: string;
  o_pc?: string;
  o_ca?: string;
  o_lf?: string;
  o_pfe?: string;
  o_col?: string;
  o_ip_ao?: string;
  o_edf?: string;
  o_ip_acm?: string;
  o_ip_dv?: string;
  o_bpp_nst?: string;
  o_bpp_resp?: string;
  o_bpp_mvt?: string;
  o_bpp_tonus?: string;
  o_bpp_la?: string;
  o_hgpo_t1?: string;
  o_hgpo_t2?: string;
  o_atcd_pe?: string;
  o_atcd_prematurite?: string;
  o_atcd_vte?: string;
  o_thrombophilie?: string;
  o_led?: string;
  o_apl?: string;
  o_vte_immob?: string;
  o_vte_inf?: string;
  o_vte_chir?: string;
  o_bandelette?: string;
  o_cephalees?: string;
  o_epigastre?: string;
  i_duree?: string;
  i_type?: string;
  i_ddr?: string;
  i_cycle?: string;
  i_reg?: string;
  i_dysmen?: string;
  i_dysp?: string;
  i_sopk?: string;
  i_menarche?: string;
  i_contra?: string;
  i_hormones?: string;
  i_cfa?: string;
  i_amh_ngml?: string;
  i_amh_pmol?: string;
  i_hsg?: string;
  i_hystero?: string;
  i_coelio?: string;
  i_amp?: string;
  i_tentatives_fiv?: string;
  i_mauvaise_reponse?: string;
  i_atcd_ohss?: string;
  i_cause_inf?: string;
  i_ca125?: string;
  i_he4_inf?: string;
  i_kyste_diam?: string;
  i_age_h?: string;
  i_spermo?: string;
  i_spermo_res?: string;
  i_ist?: string;
  i_homme_note?: string;
  i_gest?: string;
  i_par?: string;
  i_abort?: string;
  bio_hb?: string;
  bio_vgm?: string;
  bio_gb?: string;
  bio_plq?: string;
  bio_ferritine?: string;
  bio_crp?: string;
  bio_tp?: string;
  bio_tca?: string;
  bio_fibri?: string;
  bio_ddimeres?: string;
  bio_creatinine?: string;
  bio_urique?: string;
  bio_proteinurie?: string;
  bio_asat?: string;
  bio_alat?: string;
  bio_tsh?: string;
  bio_fsh?: string;
  bio_lh?: string;
  bio_e2?: string;
  bio_prog?: string;
  bio_prl?: string;
  bio_testo?: string;
  bio_dheas?: string;
  bio_amh?: string;
  bio_gly?: string;
  bio_hgpo1?: string;
  bio_hgpo2?: string;
  bio_hba1c?: string;
  bio_bhcg?: string;
  bio_ca125?: string;
  bio_he4?: string;
  bio_rai?: string;
  bio_groupe?: string;
  bio_toxo?: string;
  bio_rubeole?: string;
  bio_ecbu?: string;
  bio_infect?: string;
  t2_date?: string;
  t2_ag?: string;
  t2_operateur?: string;
  t2_machine?: string;
  t2_qualite?: string;
  t2_position?: string;
  t2_bip?: string;
  t2_pc?: string;
  t2_ca?: string;
  t2_lf?: string;
  t2_pfe?: string;
  t2_col?: string;
  t2_ip_ao?: string;
  t2_edf?: string;
  t2_ip_acm?: string;
  t2_uta_g?: string;
  t2_uta_d?: string;
  t2_la?: string;
  t2_ila?: string;
  t2_encoche?: string;
  t2_placenta_loc?: string;
  t2_placenta_grade?: string;
  t2_dist_col?: string;
  t2_placenta_asp?: string;
  t2_csp?: string;
  t2_cerv?: string;
  t2_cist_magna?: string;
  t2_atrium?: string;
  t2_profil?: string;
  t2_levres?: string;
  t2_situs?: string;
  t2_4cav?: string;
  t2_vej?: string;
  t2_3vt?: string;
  t2_fcf?: string;
  t2_rythme?: string;
  t2_poumons?: string;
  t2_estomac?: string;
  t2_paroi?: string;
  t2_reins?: string;
  t2_pyelon?: string;
  t2_vessie?: string;
  t2_rachis?: string;
  t2_membres?: string;
  t2_sexe?: string;
  t2_notes?: string;
  t2_ia_conclusion?: string;
  popq_aa?: string;
  popq_ba?: string;
  popq_c?: string;
  popq_d?: string;
  popq_ap?: string;
  popq_bp?: string;
  popq_gh?: string;
  popq_pb?: string;
  popq_tvl?: string;
  pfdi20_items?: number[];
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

  /** Dernier résultat Hawae Assist (JSON sérialisé). */
  hawaeAssistResultJson?: string;
  hawaeAssistAt?: string;
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
