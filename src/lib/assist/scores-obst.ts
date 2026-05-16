import { Norm, CPR_P5, UA_P95 } from "./norm";
import { insufficient, scoreOut } from "./helpers";
import type { AssistProfile, RiskLevel } from "./types";
import { DOMAIN, RISK } from "./types";

export function scoreFMFT21(p: AssistProfile) {
  const REQ = [
    "age",
    "nt_mm",
    "gestational_age_weeks",
    "papp_a_mom",
    "free_bhcg_mom",
  ] as const;
  const missing = REQ.filter((f) => p[f] == null);
  if (missing.length)
    return insufficient("FMF_T21_Combined", DOMAIN.OBS, [...missing]);
  if (
    !p.is_pregnant ||
    p.gestational_age_weeks == null ||
    p.gestational_age_weeks < 11 ||
    p.gestational_age_weeks > 14
  )
    return insufficient("FMF_T21_Combined", DOMAIN.OBS, [
      "gestational_age_weeks (11-14 SA requis)",
    ]);

  const eth = p.ethnicity || "caucasian";
  const bmi = p.bmi_computed ?? p.bmi;
  const ntMom = Norm.ntMom(p.nt_mm!, p.gestational_age_weeks!);
  const pappaC = Norm.correctMoM(p.papp_a_mom!, "papp_a", eth, bmi);
  const bhcgC = Norm.correctMoM(p.free_bhcg_mom!, "free_bhcg", eth);

  const bgRisk = Norm.t21BackgroundRisk(p.age!);
  let lr =
    Norm.gaussLR(ntMom, 2.0, 0.55, 1.0, 0.26) *
    Norm.log10LR(pappaC, -0.83, 0.47, 0.0, 0.28) *
    Norm.log10LR(bhcgC, 0.51, 0.44, 0.0, 0.28);

  if (p.nasal_bone === false) lr *= 23.0;
  if (p.ductus_venosus === "reversed") lr *= 7.8;
  if (p.ductus_venosus === "absent") lr *= 3.5;
  if (p.tricuspid_regurgitation) lr *= 7.6;

  const post = (bgRisk * lr) / (bgRisk * lr + (1 - bgRisk));
  const oneIn = Math.max(1, Math.round(1 / post));
  const [ciLo, ciHi] = Norm.ci95(post, 5000);
  const ci = `1/${ciHi > 0 ? Math.round(1 / ciHi) : 99999}–1/${ciLo > 0 ? Math.round(1 / ciLo) : 99999}`;
  const ethNote = eth !== "caucasian" ? ` [MoM corrigés: ${eth}]` : "";
  const bmiNote = bmi && bmi > 25 ? ` [PAPP-A corrigé IMC ${bmi}]` : "";

  if (post >= 1 / 100) {
    return scoreOut(
      "FMF_T21_Combined",
      DOMAIN.OBS,
      `1/${oneIn}`,
      RISK.HIGH,
      `⛔ RISQUE ÉLEVÉ T21 — 1/${oneIn} (IC95: ${ci})${ethNote}${bmiNote}`,
      "high",
      [
        "Proposer CVS ou amniocentèse — RDV génétique urgent",
        "DPNI en option pré-invasive si refus",
        "Consultation génétique dans les 48h",
      ],
      [],
      {
        background_risk: `1/${Math.round(1 / bgRisk)}`,
        posterior: +post.toFixed(6),
        ci95_1in: ci,
      },
    );
  }
  if (post >= 1 / 1000) {
    return scoreOut(
      "FMF_T21_Combined",
      DOMAIN.OBS,
      `1/${oneIn}`,
      RISK.INTERMEDIATE,
      `⚠️ Risque intermédiaire T21 — 1/${oneIn} (IC95: ${ci})${ethNote}`,
      "high",
      ["Proposer DPNI (ADN fœtal libre)", "Suivi écho T2 renforcé"],
    );
  }
  return scoreOut(
    "FMF_T21_Combined",
    DOMAIN.OBS,
    `1/${oneIn}`,
    RISK.LOW,
    `✅ Risque faible T21 — 1/${oneIn}`,
    "high",
    ["Suivi prénatal standard"],
  );
}

export function scoreFMFPE(p: AssistProfile) {
  const REQ = [
    "age",
    "weight_kg",
    "gestational_age_weeks",
    "sbp_mmhg",
    "dbp_mmhg",
    "uterine_artery_pi_left",
    "uterine_artery_pi_right",
  ] as const;
  const missing = REQ.filter((f) => p[f] == null);
  if (missing.length)
    return insufficient("FMF_PE_FirstTrimester", DOMAIN.OBS, [...missing]);

  const eth = p.ethnicity || "caucasian";
  const bmi = p.bmi_computed ?? p.bmi;
  const plgfC = p.plgf_mom
    ? Norm.correctMoM(p.plgf_mom, "plgf", eth)
    : null;
  const papC = p.papp_a_mom
    ? Norm.correctMoM(p.papp_a_mom, "papp_a", eth, bmi)
    : null;
  const uta =
    (p.uterine_artery_pi_left! + p.uterine_artery_pi_right!) / 2;

  let lo = -5.5932;
  lo += 2.667 * Math.log(Math.max(0.01, uta / 1.6));
  lo += 3.282 * Math.log(Math.max(0.01, Norm.map(p.sbp_mmhg!, p.dbp_mmhg!) / 85));
  if (papC) lo += -0.664 * Math.log(Math.max(0.01, papC));
  if (plgfC) lo += -0.506 * Math.log(Math.max(0.01, plgfC));
  if (p.previous_pe) lo += 1.341;
  if (p.chronic_hypertension) lo += 0.672;
  if (p.diabetes_type1 || p.diabetes_type2) lo += 0.47;
  if (p.parity === 0) lo += 0.179;
  if (["IVF", "ICSI"].includes((p.conception_method || "").toUpperCase()))
    lo += 0.179;
  if ((eth || "").toLowerCase().includes("afro")) lo += 0.479;
  if (p.sle || p.antiphospholipid) lo += 0.741;

  const risk = 1 / (1 + Math.exp(-lo));
  const pct = (risk * 100).toFixed(1);
  const ethNote = eth !== "caucasian" ? ` [corrigé: ${eth}]` : "";
  const conf = plgfC && papC ? "high" : "moderate";

  if (risk >= 0.1)
    return scoreOut(
      "FMF_PE_FirstTrimester",
      DOMAIN.OBS,
      `${pct}%`,
      RISK.HIGH,
      `🔴 RISQUE ÉLEVÉ PE<34 SA — ${pct}% (seuil ASPRE: 10%)${ethNote}`,
      conf,
      [
        "🔴 ASPIRINE 150 mg/soir dès 11–14 SA — ASPRE",
        "Surveillance TA + BU toutes les 2–3 semaines",
        "Consultation médecine maternofœtale urgente",
      ],
    );
  if (risk >= 0.05)
    return scoreOut(
      "FMF_PE_FirstTrimester",
      DOMAIN.OBS,
      `${pct}%`,
      RISK.INTERMEDIATE,
      `⚠️ Risque intermédiaire PE — ${pct}%${ethNote}`,
      conf,
      ["Aspirine 100–150 mg/soir (CNGOF Grade B)", "TA mensuelle + BU"],
    );
  return scoreOut(
    "FMF_PE_FirstTrimester",
    DOMAIN.OBS,
    `${pct}%`,
    RISK.LOW,
    `✅ Risque faible PE<34 SA — ${pct}%`,
    conf,
    ["Suivi prénatal standard"],
  );
}

export function scoreMiniPIERS(p: AssistProfile) {
  if (
    !p.is_pregnant ||
    !p.sbp_mmhg ||
    p.sbp_mmhg < 140 ||
    !p.dipstick_protein
  )
    return null;
  const REQ = ["gestational_age_weeks", "sbp_mmhg", "dipstick_protein"] as const;
  const missing = REQ.filter((f) => p[f] == null);
  if (missing.length) return insufficient("miniPIERS", DOMAIN.OBS, [...missing]);

  const gaDays = Math.max(0, (p.gestational_age_weeks! - 20) * 7);
  const dip2plus = ["2+", "3+", "4+"].includes(p.dipstick_protein!) ? 1 : 0;
  const logit =
    -7.49 +
    0.01 * gaDays +
    0.6 * dip2plus +
    0.16 * (p.headache_visual ? 1 : 0) +
    0.17 * (p.epigastric_pain ? 1 : 0) +
    0.038 * p.sbp_mmhg!;
  const risk = 1 / (1 + Math.exp(-logit));
  const pct = (risk * 100).toFixed(1);

  if (risk >= 0.25)
    return scoreOut(
      "miniPIERS",
      DOMAIN.OBS,
      `${pct}%`,
      RISK.CRITICAL,
      `⛔ miniPIERS CRITIQUE — risque issue défavorable ${pct}% à 48h`,
      "high",
      [
        "⛔ Hospitalisation immédiate",
        "Sulfate de magnésium IV — Magpie",
        "Antihypertenseurs IV si PAS ≥ 160",
      ],
    );
  if (risk >= 0.1)
    return scoreOut(
      "miniPIERS",
      DOMAIN.OBS,
      `${pct}%`,
      RISK.HIGH,
      `🔴 miniPIERS ÉLEVÉ — risque ${pct}%`,
      "high",
      ["Hospitalisation maternité niveau II/III", "Bilan biologique complet"],
    );
  if (risk >= 0.05)
    return scoreOut(
      "miniPIERS",
      DOMAIN.OBS,
      `${pct}%`,
      RISK.INTERMEDIATE,
      `⚠️ miniPIERS intermédiaire — ${pct}%`,
      "high",
      ["TA toutes les 4h", "Bilan biologique 24–48h"],
    );
  return scoreOut(
    "miniPIERS",
    DOMAIN.OBS,
    `${pct}%`,
    RISK.LOW,
    `🟢 miniPIERS rassurant — ${pct}%`,
    "high",
    ["Surveillance standard PE légère"],
  );
}

export function scoreCPR(p: AssistProfile) {
  if (!p.is_pregnant || (p.gestational_age_weeks ?? 0) < 24) return null;
  if (!p.mca_pi || !p.umbilical_artery_pi)
    return insufficient("CPR", DOMAIN.OBS, ["mca_pi", "umbilical_artery_pi"]);
  const cpr = p.mca_pi / p.umbilical_artery_pi;
  const p5 =
    Norm._interp(CPR_P5, p.gestational_age_weeks!) || 1.08;
  if (cpr < p5)
    return scoreOut(
      "CPR",
      DOMAIN.OBS,
      +cpr.toFixed(3),
      RISK.HIGH,
      `🔴 CPR ABAISSÉ (${cpr.toFixed(2)}) < P5 (${p5.toFixed(2)})`,
      "high",
      ["FGR avec redistribution — Staging FIGO OBLIGATOIRE", "Doppler 2×/semaine"],
    );
  if (cpr < 1.0)
    return scoreOut(
      "CPR",
      DOMAIN.OBS,
      +cpr.toFixed(3),
      RISK.INTERMEDIATE,
      `⚠️ CPR borderline (${cpr.toFixed(2)})`,
      "high",
      ["Doppler hebdomadaire", "Écho croissance 2 semaines"],
    );
  return scoreOut(
    "CPR",
    DOMAIN.OBS,
    +cpr.toFixed(3),
    RISK.LOW,
    `✅ CPR normal (${cpr.toFixed(2)})`,
    "high",
    ["Suivi Doppler standard"],
  );
}

export function scoreFGR(p: AssistProfile) {
  if (!p.is_pregnant || (p.gestational_age_weeks ?? 0) < 20) return null;

  const efwGrams =
    p.efw_grams ??
    (p.bpd_mm && p.hc_mm && p.ac_mm && p.fl_mm
      ? Norm.hadlockEfw(p.bpd_mm, p.hc_mm, p.ac_mm, p.fl_mm)
      : null);
  const ga = p.gestational_age_weeks!;
  const uaP95 = Norm._interp(UA_P95, ga) || 1.25;
  const uaPathDoppler =
    p.umbilical_artery_edf === "absent" ||
    p.umbilical_artery_edf === "reversed" ||
    (p.umbilical_artery_pi != null && p.umbilical_artery_pi > uaP95);
  const dvPath =
    p.ductus_venosus === "reversed" || p.ductus_venosus === "absent";

  const efwPct = efwGrams ? Norm.efwPercentile(efwGrams, ga) : null;
  const hasFGR =
    (efwPct != null && efwPct < 10) || uaPathDoppler || dvPath;
  if (!hasFGR) return null;

  const uaPi = p.umbilical_artery_pi;
  const cpr =
    p.mca_pi && uaPi ? p.mca_pi / uaPi : null;
  const uaEDF =
    p.umbilical_artery_edf === "absent" ||
    p.umbilical_artery_edf === "reversed";

  let stage = 1;
  if (efwPct != null && efwPct < 3) stage = Math.max(stage, 2);
  if (uaPi && uaPi > uaP95) stage = Math.max(stage, 2);
  if (cpr && cpr < 1.0) stage = Math.max(stage, 2);
  if (uaPi && uaPi > uaP95 * 1.5) stage = Math.max(stage, 3);
  if (uaEDF) stage = Math.max(stage, 3);
  if (dvPath) stage = Math.max(stage, 3);

  const bppTotal =
    (p.bpp_nst ? 2 : 0) +
    (p.bpp_breathing ? 2 : 0) +
    (p.bpp_movement ? 2 : 0) +
    (p.bpp_tone ? 2 : 0) +
    (p.bpp_afi_normal ? 2 : 0);
  const bppAvailable = [
    p.bpp_nst,
    p.bpp_breathing,
    p.bpp_movement,
    p.bpp_tone,
    p.bpp_afi_normal,
  ].some((v) => v !== null);
  if (bppAvailable && bppTotal <= 4) stage = 4;

  const STAGES: Record<number, [RiskLevel, string, string[]]> = {
    1: [
      RISK.LOW,
      "FGR Stade I",
      ["Suivi ambulatoire si stable", "Doppler+écho hebdomadaires"],
    ],
    2: [
      RISK.INTERMEDIATE,
      "FGR Stade II",
      ["Hospitalisation selon contexte", "Corticothérapie <34 SA"],
    ],
    3: [
      RISK.HIGH,
      "FGR Stade III — EDF ombilical absente/inversée",
      ["🚨 HOSPITALISATION IMMÉDIATE", "CTG continu"],
    ],
    4: [
      RISK.CRITICAL,
      "FGR Stade IV — BPP ≤4/10",
      ["⛔ EXTRACTION EN URGENCE", "Néonatologie niveau III"],
    ],
  };
  const [risk, label, actions] = STAGES[stage];
  const efwStr =
    efwPct != null ? ` (EPF P${efwPct.toFixed(0)})` : " (biométrie manquante)";
  return scoreOut(
    "FGR_Staging",
    DOMAIN.OBS,
    `Stage ${stage}${efwStr}`,
    risk,
    label,
    "high",
    actions,
    [],
    { stage, efw_pct: efwPct },
  );
}

export function scoreCL(p: AssistProfile) {
  if (
    !p.is_pregnant ||
    !p.gestational_age_weeks ||
    p.gestational_age_weeks < 16 ||
    p.gestational_age_weeks > 28
  )
    return null;
  if (p.cervical_length_mm == null) return null;
  const cl = p.cervical_length_mm;
  if (cl < 15)
    return scoreOut(
      "Preterm_CL_Risk",
      DOMAIN.OBS,
      `${cl}mm`,
      RISK.CRITICAL,
      `⛔ COL TRÈS COURT (${cl}mm)`,
      "high",
      ["Hospitalisation à discuter", "Progestérone vaginale 200mg/soir"],
    );
  if (cl < 25)
    return scoreOut(
      "Preterm_CL_Risk",
      DOMAIN.OBS,
      `${cl}mm`,
      RISK.HIGH,
      `🔴 Col court (${cl}mm)`,
      "high",
      ["Progestérone vaginale", "Contrôle col 2 semaines"],
    );
  if (cl < 35)
    return scoreOut(
      "Preterm_CL_Risk",
      DOMAIN.OBS,
      `${cl}mm`,
      RISK.INTERMEDIATE,
      `⚠️ Col intermédiaire (${cl}mm)`,
      "high",
      ["Surveillance CL mensuelle"],
    );
  return scoreOut(
    "Preterm_CL_Risk",
    DOMAIN.OBS,
    `${cl}mm`,
    RISK.LOW,
    `✅ Col long (${cl}mm)`,
    "high",
    ["Suivi standard"],
  );
}
