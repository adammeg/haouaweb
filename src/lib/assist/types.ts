/** Hawae Assist Engine v2.2 — types (port HTML v49). */

export const RISK = {
  LOW: "low",
  INTERMEDIATE: "intermediate",
  HIGH: "high",
  CRITICAL: "critical",
  UNKNOWN: "unknown",
} as const;

export type RiskLevel = (typeof RISK)[keyof typeof RISK];

export const RISK_NUM: Record<RiskLevel, number> = {
  low: 1,
  intermediate: 2,
  high: 3,
  critical: 4,
  unknown: 0,
};

export const DOMAIN = {
  OBS: "obstetrics",
  GYN: "gynecology",
  PMA: "pma",
  CROSS: "cross_domain",
} as const;

export type ClinicalDomain = (typeof DOMAIN)[keyof typeof DOMAIN];

export interface ScoreOutput {
  score_name: string;
  domain: ClinicalDomain;
  value: string | number | null;
  risk_level: RiskLevel;
  interpretation: string;
  confidence: string;
  recommended_actions: string[];
  missing_inputs?: string[];
  metadata?: Record<string, unknown>;
  disclaimer?: string;
}

export interface Contradiction {
  rule_id: string;
  severity: "error" | "warning" | "info";
  message: string;
  scores_involved: string[];
  suggestion: string;
}

export interface AssistQuestion {
  id: string;
  type: string;
  text: string;
  unit: string | null;
  format: string;
  options?: string[] | null;
  required_for: string[];
  priority: number;
}

export interface MetaRisk {
  overall: RiskLevel;
  critical_count: number;
  high_count: number;
  domains: Record<string, RiskLevel>;
}

export interface AssistReport {
  summary: string;
  priority_actions: string[];
  domain_reports: Record<
    string,
    { score: string; value: unknown; risk: RiskLevel; summary: string }[]
  >;
  contradictions_warnings: string[];
  disclaimer: string;
}

export interface AssistAssessment {
  score_name: string;
  status: "ok" | "incomplete" | "not_applicable" | "error";
  missing_inputs: string[];
  error_code?: string;
}

export interface AssistRunResult {
  engine_version?: string;
  assessments?: AssistAssessment[];
  executed: ScoreOutput[];
  alerts: ScoreOutput[];
  contradictions: Contradiction[];
  questions_needed: AssistQuestion[];
  meta_risk: MetaRisk;
  report: AssistReport;
}

/** Profil unifié pour les calculateurs (mappé depuis PatientSnapshot). */
export interface AssistProfile {
  patient_id?: string;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  bmi: number | null;
  bmi_computed?: number | null;
  ethnicity?: string;
  smoking?: boolean | null;

  is_pregnant?: boolean | null;
  is_infertility?: boolean | null;
  is_prolapse?: boolean | null;
  is_oncology?: boolean | null;
  is_endometriosis?: boolean | null;
  is_postmenopause?: boolean | null;

  gestational_age_weeks: number | null;
  parity: number | null;
  gravidity: number | null;
  previous_cs: number | null;
  conception_method: string | null;
  multiple_pregnancy?: boolean | null;

  previous_pe?: boolean | null;
  chronic_hypertension?: boolean | null;
  diabetes_type1?: boolean | null;
  diabetes_type2?: boolean | null;
  sle?: boolean | null;
  antiphospholipid?: boolean | null;
  previous_preterm?: boolean | null;
  previous_vte?: boolean | null;
  thrombophilia_high?: boolean | null;
  thrombophilia_low?: boolean | null;
  chronic_kidney_disease?: boolean | null;

  sbp_mmhg: number | null;
  dbp_mmhg: number | null;
  map_mmhg: number | null;
  dipstick_protein: string | null;
  headache_visual?: boolean | null;
  epigastric_pain?: boolean | null;
  chest_pain_dyspnoea?: boolean | null;
  vaginal_bleeding_abdominal_pain?: boolean | null;

  nt_mm: number | null;
  papp_a_mom: number | null;
  free_bhcg_mom: number | null;
  plgf_mom: number | null;
  nasal_bone: boolean | null;
  ductus_venosus: string | null;
  tricuspid_regurgitation?: boolean | null;
  uterine_artery_pi_left: number | null;
  uterine_artery_pi_right: number | null;

  cervical_length_mm: number | null;
  efw_grams: number | null;
  bpd_mm: number | null;
  hc_mm: number | null;
  ac_mm: number | null;
  fl_mm: number | null;
  umbilical_artery_pi: number | null;
  umbilical_artery_edf: string | null;
  mca_pi: number | null;
  ductus_venosus_pi: number | null;

  bpp_nst: boolean | null;
  bpp_breathing: boolean | null;
  bpp_movement: boolean | null;
  bpp_tone: boolean | null;
  bpp_afi_normal: boolean | null;

  amh_ngml: number | null;
  amh_pmol: number | null;
  amh_normalized_pmol?: number | null;
  afc: number | null;
  ca125: number | null;
  he4: number | null;
  fsh_iu?: number | null;

  ogtt_fasting: number | null;
  ogtt_1h: number | null;
  ogtt_2h: number | null;

  cyst_max_diameter_mm: number | null;
  cyst_solid_pct?: number | null;
  cyst_papillary_projections?: number | null;
  cyst_acoustic_shadows?: boolean | null;
  cyst_ascites?: boolean | null;
  oncology_center?: boolean | null;

  vte_current_infection?: boolean | null;
  vte_immobility?: boolean | null;
  vte_surgical?: boolean | null;

  previous_ivf_attempts: number | null;
  previous_oocytes?: number | null;
  previous_poor_response?: boolean | null;
  previous_ohss?: boolean | null;
  sperm_quality?: string | null;
  infertility_cause?: string | null;

  popq_aa?: number | null;
  popq_ba?: number | null;
  popq_c?: number | null;
  popq_d?: number | null;
  popq_ap?: number | null;
  popq_bp?: number | null;
  popq_gh?: number | null;
  popq_pb?: number | null;
  popq_tvl?: number | null;

  pfdi20_items?: number[] | null;
}
