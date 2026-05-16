import type { PatientSnapshot } from "@/types/domain";
import { patientAgeYears } from "@/lib/patient-utils";
import type { AssistProfile } from "./types";

function num(v: string | undefined): number | null {
  if (v == null || v === "") return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function parseSBP(ta?: string): number | null {
  if (!ta) return null;
  const p = ta.split("/");
  return p[0] ? parseFloat(p[0]) : null;
}

function parseDBP(ta?: string): number | null {
  if (!ta) return null;
  const p = ta.split("/");
  return p[1] ? parseFloat(p[1]) : null;
}

/** g/L → mmol/L (glucose). */
function glyToMmol(gPerL: number | null): number | null {
  if (gPerL == null) return null;
  return +(gPerL * 5.555).toFixed(2);
}

function radio(v: string | undefined, yes: string): boolean {
  return v === yes || v === "oui" || v === "1" || v === "yes";
}

function bppVal(v: string | undefined): boolean | null {
  if (v == null || v === "") return null;
  return v === "1";
}

/**
 * Construit le profil Hawae Assist depuis le snapshot dossier (équivalent fromHawaeForm HTML).
 */
export function profileFromSnapshot(d: PatientSnapshot): AssistProfile {
  const spec = d.specialite || "";
  const isObs = spec === "obst";
  const isPMA = spec === "inf";

  const age = patientAgeYears(d.ddn);
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
    smoking: radio(d.tabac, "oui"),

    is_pregnant: isObs,
    is_infertility: isPMA,
    is_prolapse: radio(d.g_prolapsus, "oui"),
    is_oncology: radio(d.g_oncologie, "oui"),
    is_endometriosis: radio(d.g_endometriose, "oui"),
    is_postmenopause: d.g_meno === "oui",

    gestational_age_weeks: num(d.o_terme),
    parity: num(d.o_par) != null ? parseInt(d.o_par!, 10) : null,
    gravidity: num(d.o_gest) != null ? parseInt(d.o_gest!, 10) : null,
    previous_cs: num(d.o_ncs) != null ? parseInt(d.o_ncs!, 10) : null,
    conception_method: d.o_concept || null,
    multiple_pregnancy:
      !!d.o_type &&
      (d.o_type.toLowerCase().includes("mellaire") ||
        d.o_type.toLowerCase().includes("tripl")),

    previous_pe: radio(d.o_atcd_pe, "oui"),
    chronic_hypertension:
      d.hta === "oui" || d.hta === "traite",
    diabetes_type1: d.diabete === "t1",
    diabetes_type2: d.diabete === "t2",
    sle: radio(d.o_led, "oui"),
    antiphospholipid: radio(d.o_apl, "oui"),
    previous_preterm: radio(d.o_atcd_prematurite, "oui"),
    previous_vte: radio(d.o_atcd_vte, "oui"),
    thrombophilia_high: d.o_thrombophilie === "haute",
    thrombophilia_low: d.o_thrombophilie === "basse",

    sbp_mmhg: parseSBP(d.o_ta) ?? parseSBP(d.ec_ta),
    dbp_mmhg: parseDBP(d.o_ta) ?? parseDBP(d.ec_ta),
    map_mmhg: num(d.o_map),
    dipstick_protein: d.o_bandelette || null,
    headache_visual: radio(d.o_cephalees, "oui"),
    epigastric_pain: radio(d.o_epigastre, "oui"),

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
    afc: num(d.i_cfa) != null ? parseInt(d.i_cfa!, 10) : null,
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

    vte_current_infection: radio(d.o_vte_inf, "oui"),
    vte_immobility: radio(d.o_vte_immob, "oui"),
    vte_surgical: radio(d.o_vte_chir, "oui"),

    previous_ivf_attempts:
      num(d.i_tentatives_fiv) != null
        ? parseInt(d.i_tentatives_fiv!, 10)
        : null,
    previous_poor_response: radio(d.i_mauvaise_reponse, "oui"),
    previous_ohss:
      d.i_atcd_ohss === "mod" ||
      d.i_atcd_ohss === "sev" ||
      d.i_atcd_ohss === "modéré" ||
      d.i_atcd_ohss === "sévère",
    sperm_quality: d.i_spermo || null,
    infertility_cause: d.i_cause_inf || null,

    popq_aa: num(d.popq_aa),
    popq_ba: num(d.popq_ba),
    popq_c: num(d.popq_c),
    popq_d: num(d.popq_d),
    popq_ap: num(d.popq_ap),
    popq_bp: num(d.popq_bp),
    popq_gh: num(d.popq_gh),
    popq_pb: num(d.popq_pb),
    popq_tvl: num(d.popq_tvl),

    pfdi20_items: d.pfdi20_items,
  };
}
