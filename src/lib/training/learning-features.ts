import { createHash, createHmac } from "node:crypto";
import { profileFromSnapshot } from "@/lib/assist/profile";
import type { PatientSnapshot } from "@/types/domain";
import type { AiLearningRecord, AiLearningCase, LearningFeatures, LearningSplit, ReviewedCaseExample } from "@/types/ai-learning";

const NUMBERS = new Set("bmi gestational_age_weeks parity gravidity previous_cs sbp_mmhg dbp_mmhg map_mmhg nt_mm papp_a_mom free_bhcg_mom plgf_mom uterine_artery_pi_left uterine_artery_pi_right cervical_length_mm efw_grams bpd_mm hc_mm ac_mm fl_mm umbilical_artery_pi mca_pi ductus_venosus_pi amh_ngml amh_pmol afc ca125 he4 ogtt_fasting ogtt_1h ogtt_2h cyst_max_diameter_mm previous_ivf_attempts previous_oocytes".split(" "));
const BOOLEANS = new Set("smoking is_pregnant is_infertility is_prolapse is_oncology is_endometriosis is_postmenopause multiple_pregnancy previous_pe chronic_hypertension diabetes_type1 diabetes_type2 sle antiphospholipid previous_preterm previous_vte thrombophilia_high thrombophilia_low headache_visual epigastric_pain chest_pain_dyspnoea vaginal_bleeding_abdominal_pain nasal_bone bpp_nst bpp_breathing bpp_movement bpp_tone bpp_afi_normal vte_current_infection vte_immobility vte_surgical previous_poor_response previous_ohss".split(" "));
const CATEGORIES: Record<string, Set<string>> = {
  sperm_quality: new Set(["normal", "mild", "severe"]),
  infertility_cause: new Set(["tubal", "endo", "male", "unexplained", "other"]),
  dipstick_protein: new Set(["neg", "trace", "1+", "2+", "3+", "4+"]),
  umbilical_artery_edf: new Set(["normal", "absent", "reversed"]),
  ductus_venosus: new Set(["normal", "absent", "reversed"]),
};
const CLINICAL_TERMS: Record<string, string[]> = {
  bleeding: ["saignement", "metrorragie", "menorragie"], pelvic_pain: ["douleur pelvienne", "algie pelvienne"], amenorrhea: ["amenorrhee"],
  dysmenorrhea: ["dysmenorrhee"], dyspareunia: ["dyspareunie"], discharge: ["leucorrhee"], infertility: ["infertilite"],
  endometriosis: ["endometriose"], fibroid: ["myome", "fibrome"], ovarian_cyst: ["kyste ovarien", "masse annexielle"],
  fever: ["fievre", "febrile"], hypertension: ["hypertension", "hta"], preeclampsia: ["preeclampsie", "pre eclampsie"],
  growth_restriction: ["rciu", "restriction de croissance"], contractions: ["contraction"], menopause: ["menopause"], prolapse: ["prolapsus"],
};

/** Explicit allowlist: never turn arbitrary app notes or model output into retrieval features. */
export function learningFeatures(patient: PatientSnapshot): LearningFeatures {
  const profile = profileFromSnapshot(patient);
  const values: LearningFeatures["values"] = {};
  if (profile.age != null) values.age_band_start = Math.floor(profile.age / 5) * 5;
  for (const [key, value] of Object.entries(profile)) {
    if (NUMBERS.has(key) && typeof value === "number" && Number.isFinite(value)) values[key] = +value.toFixed(2);
    else if (BOOLEANS.has(key) && typeof value === "boolean") values[key] = value;
    else if (typeof value === "string" && CATEGORIES[key]?.has(value)) values[key] = value;
  }
  if (values.amh_ngml == null && typeof values.amh_pmol === "number") values.amh_ngml = +(values.amh_pmol / 7.14).toFixed(2);
  delete values.amh_pmol;
  // Store vocabulary concepts rather than raw notes. "mentioned" does not assert clinical presence.
  const notes = [patient.motif, patient.symptomes, patient.g_patho, patient.o_complic, patient.ec_conclusion].filter(Boolean).join(" ").slice(0, 12_000).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [concept, words] of Object.entries(CLINICAL_TERMS)) {
    const states = words.flatMap((word) => [...notes.matchAll(new RegExp(`\\b${word}\\w*`, "g"))].map((match) => /(?:pas de|sans|absence de|nie|aucun)\s+$/.test(notes.slice(Math.max(0, match.index! - 24), match.index)) ? "negated" : "mentioned"));
    if (states.length) values[`mention_${concept}`] = new Set(states).size === 1 ? states[0] : "conflicting";
  }
  return { specialty: ["gyn", "obst", "inf"].includes(patient.specialite) ? patient.specialite : "", values: Object.fromEntries(Object.entries(values).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) };
}

export function learningPatientRef(doctorId: string, patientId: string): string {
  const secret = process.env.AI_LEARNING_SECRET || process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) throw new Error("Learning identity key unavailable");
  return createHmac("sha256", secret).update(`${doctorId}:${patientId}`).digest("hex");
}
export function learningKeyVersion(): string {
  const secret = process.env.AI_LEARNING_SECRET || process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) throw new Error("Learning identity key unavailable");
  return createHash("sha256").update(secret).digest("hex").slice(0, 16);
}
export function featureHash(features: LearningFeatures): string {
  return createHash("sha256").update(JSON.stringify(features)).digest("hex");
}
export function patientSplit(patientRef: string): LearningSplit {
  const bucket = Number.parseInt(createHash("sha256").update(patientRef).digest("hex").slice(0, 8), 16) % 10;
  return bucket < 6 ? "train" : bucket < 8 ? "validation" : "test";
}

export function scrubLearningText(text: string, patient?: PatientSnapshot): string {
  let result = text;
  for (const identifier of [patient?.nom, patient?.prenom, patient?.cin, patient?.tel, patient?.ddn, patient?.id]) {
    if (identifier && identifier.trim().length >= 3) result = result.replace(new RegExp(identifier.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "[identité retirée]");
  }
  return result.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[email retiré]")
    .replace(/\b\d{4}-\d{2}-\d{2}\b|\b\d{2}[/.]\d{2}[/.]\d{4}\b/g, "[date retirée]")
    .replace(/(?:\+\d[\d ()-]{7,}\d|\b\d{8,}\b)/g, "[numéro retiré]");
}

export function isConfirmedCase(record: Pick<AiLearningRecord, "review">): boolean {
  const r = record.review;
  return Boolean(r?.verdict === "corrected" && r.outcome === "confirmed" && r.confirmedByClinician && r.confirmedDiagnosis && r.correctedResponse && r.rationale);
}

const DEMOGRAPHICS = new Set(["age_band_start", "bmi", "parity", "gravidity", "previous_cs", "is_pregnant", "is_infertility"]);
const SAFETY = new Set(["is_pregnant", "multiple_pregnancy", "is_postmenopause", "previous_vte", "previous_pe", "chest_pain_dyspnoea", "vaginal_bleeding_abdominal_pain", "umbilical_artery_edf"]);

/** Conservative case similarity, not a diagnostic probability. */
export function caseSimilarity(current: LearningFeatures, candidate: LearningFeatures): number {
  if (!current.specialty || current.specialty !== candidate.specialty) return 0;
  const a = current.values, b = candidate.values;
  for (const key of SAFETY) if (a[key] != null && b[key] != null && a[key] !== b[key]) return 0;
  if (typeof a.gestational_age_weeks === "number" && typeof b.gestational_age_weeks === "number" && Math.abs(a.gestational_age_weeks - b.gestational_age_weeks) > 2) return 0;
  let matched = 0, total = 0, clinicalMatches = 0;
  for (const [key, value] of Object.entries(a)) {
    const other = b[key];
    if (other == null) continue;
    const weight = DEMOGRAPHICS.has(key) || value === false ? 0.25 : 1;
    total += weight;
    const equivalent = typeof value === "number" && typeof other === "number" ? Math.abs(value - other) <= Math.max(0.1, Math.abs(value) * 0.12) : value === other;
      if (equivalent) { matched += weight; if (!DEMOGRAPHICS.has(key) && value !== false && value !== "conflicting") clinicalMatches++; }
  }
  return clinicalMatches >= 3 && total >= 3 && matched / total >= 0.8 ? matched / total : 0;
}

export function selectReviewedCases(records: AiLearningCase[], input: { doctorId: string; patientRef: string; consentToken: string; features: LearningFeatures }): ReviewedCaseExample[] {
  const seenPatients = new Set<string>();
  const seenFeatures = new Set<string>();
  const eligible = records.filter((r) => r.doctorId === input.doctorId && r.patientRef !== input.patientRef && r.consentToken === input.consentToken && r.split === "train" && isConfirmedCase(r));
  const labels = new Map<string, Set<string>>();
  for (const r of eligible) { const values = labels.get(r.featureHash) ?? new Set(); values.add(r.review!.confirmedDiagnosis.trim().toLocaleLowerCase("fr")); labels.set(r.featureHash, values); }
  return eligible.filter((r) => labels.get(r.featureHash)!.size === 1)
    .map((record) => ({ record, similarity: caseSimilarity(input.features, record.features) }))
    .filter((r) => r.similarity > 0).sort((a, b) => b.similarity - a.similarity || b.record.createdAt.localeCompare(a.record.createdAt))
    .filter(({ record }) => {
      if (seenPatients.has(record.patientRef) || seenFeatures.has(record.featureHash)) return false;
      seenPatients.add(record.patientRef); seenFeatures.add(record.featureHash); return true;
    }).slice(0, 2).map(({ record, similarity }) => ({ id: record.id, features: record.features, confirmedDiagnosis: record.review!.confirmedDiagnosis, correctedResponse: record.review!.correctedResponse.slice(0, 1500), rationale: record.review!.rationale, similarity }));
}
