import type { PatientSnapshot } from "@/types/domain";
import { patientAgeYears } from "@/lib/patient-utils";
import type { AssistProfile } from "./types";
import { clinicalNumber as num, clinicalInteger, clinicalBoolean, bloodPressure, gestationalWeeks } from "@/lib/clinical/parse";

/** g/L → mmol/L (glucose). */
function glyToMmol(gPerL: number | null): number | null {
  if (gPerL == null) return null;
  return +(gPerL * 5.555).toFixed(2);
}

function radio(v: string | undefined): boolean | null {
  return clinicalBoolean(v);
}

function bppVal(v: string | undefined): boolean | null {
  if (v == null || v === "") return null;
  return clinicalBoolean(v);
}

/**
 * Construit le profil Hawae Assist depuis le snapshot dossier (équivalent fromHawaeForm HTML).
 */
export function profileFromSnapshot(d: PatientSnapshot): AssistProfile {
  const spec = d.specialite || "";
  const isObs = spec === "obst";
  const isPMA = spec === "inf";

  const age = patientAgeYears(d.ddn);
  const bp = bloodPressure(d.o_ta) ?? bloodPressure(d.ec_ta);
  const poids =
    num(d.ec_poids) ?? num(d.o_poids) ?? null;
  const taille = num(d.ec_taille) ?? null;
  const imc =
    poids && taille ? poids / (taille / 100) ** 2 : num(d.imc);

  return {
    patient_id: d.id,
    age,
    weight_kg: poids,
    height_cm: taille,
    bmi: imc ? +imc.toFixed(1) : null,
    ethnicity: d.ethnie || "caucasian",
    smoking: radio(d.tabac),

    is_pregnant: isObs,
    is_infertility: isPMA,
    is_prolapse: radio(d.g_prolapsus),
    is_oncology: radio(d.g_oncologie),
    is_endometriosis: radio(d.g_endometriose),
    is_postmenopause: clinicalBoolean(d.g_meno),

    gestational_age_weeks: gestationalWeeks(d.o_terme),
    parity: clinicalInteger(d.o_par, 0, 30),
    gravidity: clinicalInteger(d.o_gest, 0, 40),
    previous_cs: clinicalInteger(d.o_ncs, 0, 20),
    conception_method: d.o_concept || null,
    multiple_pregnancy:
      d.o_type ? (d.o_type.toLowerCase().includes("mellaire") ||
        d.o_type.toLowerCase().includes("tripl")) : null,

    previous_pe: radio(d.o_atcd_pe),
    chronic_hypertension:
      d.hta === "traite" ? true : clinicalBoolean(d.hta),
    diabetes_type1: d.diabete ? d.diabete === "t1" : null,
    diabetes_type2: d.diabete ? d.diabete === "t2" : null,
    sle: radio(d.o_led),
    antiphospholipid: radio(d.o_apl),
    previous_preterm: radio(d.o_atcd_prematurite),
    previous_vte: radio(d.o_atcd_vte),
    thrombophilia_high: d.o_thrombophilie ? d.o_thrombophilie === "haute" : null,
    thrombophilia_low: d.o_thrombophilie ? d.o_thrombophilie === "basse" : null,

    sbp_mmhg: bp?.systolic ?? null,
    dbp_mmhg: bp?.diastolic ?? null,
    map_mmhg: num(d.o_map),
    dipstick_protein: d.o_bandelette || null,
    headache_visual: radio(d.o_cephalees),
    epigastric_pain: radio(d.o_epigastre),
    chest_pain_dyspnoea: clinicalBoolean(d.o_thorax_dyspnee),
    vaginal_bleeding_abdominal_pain: clinicalBoolean(d.o_saignement_douleur),

    nt_mm: num(d.o_nt),
    papp_a_mom: num(d.o_papp_a_mom),
    free_bhcg_mom: num(d.o_bhcg_mom),
    plgf_mom: num(d.o_plgf_mom),
    nasal_bone:
      d.o_os_nasal != null && d.o_os_nasal !== ""
        ? d.o_os_nasal === "present"
        : null,
    ductus_venosus: d.o_dv_flux || null,

    uterine_artery_pi_left: num(d.o_uta_ip_g),
    uterine_artery_pi_right: num(d.o_uta_ip_d),

    cervical_length_mm: num(d.o_col) ?? num(d.t2_col),
    efw_grams: num(d.o_pfe) ?? num(d.t2_pfe),
    bpd_mm: num(d.o_bip) ?? num(d.t2_bip),
    hc_mm: num(d.o_pc) ?? num(d.t2_pc),
    ac_mm: num(d.o_ca) ?? num(d.t2_ca),
    fl_mm: num(d.o_lf) ?? num(d.t2_lf),

    umbilical_artery_pi: num(d.o_ip_ao) ?? num(d.t2_ip_ao),
    umbilical_artery_edf: d.o_edf || null,
    mca_pi: num(d.o_ip_acm) ?? num(d.t2_ip_acm),
    ductus_venosus_pi: num(d.o_ip_dv),

    bpp_nst: bppVal(d.o_bpp_nst),
    bpp_breathing: bppVal(d.o_bpp_resp),
    bpp_movement: bppVal(d.o_bpp_mvt),
    bpp_tone: bppVal(d.o_bpp_tonus),
    bpp_afi_normal: bppVal(d.o_bpp_la),

    amh_ngml: num(d.i_amh_ngml) ?? num(d.bio_amh),
    amh_pmol: num(d.i_amh_pmol),
    afc: clinicalInteger(d.i_cfa, 0, 200),
    ca125: num(d.i_ca125) ?? num(d.bio_ca125),
    he4: num(d.i_he4_inf) ?? num(d.bio_he4) ?? num(d.g_he4),

    ogtt_fasting:
      glyToMmol(num(d.o_gly)) ??
      glyToMmol(num(d.bio_gly)),
    ogtt_1h:
      glyToMmol(num(d.o_hgpo_t1)) ??
      glyToMmol(num(d.bio_hgpo1)),
    ogtt_2h:
      glyToMmol(num(d.o_hgpo_t2)) ??
      glyToMmol(num(d.bio_hgpo2)),

    cyst_max_diameter_mm:
      num(d.i_kyste_diam) ?? num(d.g_kyste_diam),

    vte_current_infection: radio(d.o_vte_inf),
    vte_immobility: radio(d.o_vte_immob),
    vte_surgical: radio(d.o_vte_chir),

    previous_ivf_attempts: clinicalInteger(d.i_tentatives_fiv, 0, 100),
    previous_oocytes: clinicalInteger(d.i_ovocytes_precedents, 0, 200),
    previous_poor_response: radio(d.i_mauvaise_reponse),
    previous_ohss: d.i_atcd_ohss ? ["mod", "sev", "modéré", "sévère"].includes(d.i_atcd_ohss) : null,
    sperm_quality: spermQuality(d.i_spermo_res),
    infertility_cause: infertilityCause(d.i_cause_inf),

    popq_aa: num(d.popq_aa, -20, 20),
    popq_ba: num(d.popq_ba, -20, 20),
    popq_c: num(d.popq_c, -20, 20),
    popq_d: num(d.popq_d, -20, 20),
    popq_ap: num(d.popq_ap, -20, 20),
    popq_bp: num(d.popq_bp, -20, 20),
    popq_gh: num(d.popq_gh),
    popq_pb: num(d.popq_pb),
    popq_tvl: num(d.popq_tvl),

    pfdi20_items: d.pfdi20_items,
  };
}

function infertilityCause(value?: string): string | null {
  if (!value) return null;
  return ({ tubaire: "tubal", endometriose: "endo", masculine: "male", inexpliquee: "unexplained" } as Record<string, string>)[value] ?? "other";
}

function spermQuality(value?: string): string | null {
  if (!value || value === "Non réalisé") return null;
  const v = value.toLowerCase();
  if (v === "normo" || v.startsWith("normal")) return "normal";
  if (v.includes("sévère") || v.includes("severe") || v.includes("azoosperm") || v === "azoo" || v.includes("oat")) return "severe";
  return "mild";
}
