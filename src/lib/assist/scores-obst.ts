import { Norm, CPR_P5, UA_P95 } from "./norm";
import { insufficient, scoreOut } from "./helpers";
import type { AssistProfile, RiskLevel } from "./types";
import { DOMAIN, RISK } from "./types";

export function scoreFMFT21(p: AssistProfile) {
  if (!p.is_pregnant || (p.gestational_age_weeks != null && (p.gestational_age_weeks < 11 || p.gestational_age_weeks >= 14))) return null;
  const missing = (["age", "nt_mm", "gestational_age_weeks", "papp_a_mom", "free_bhcg_mom"] as const).filter((f) => p[f] == null);
  return scoreOut("FMF_T21_Combined", DOMAIN.OBS, null, RISK.UNKNOWN,
    "Calcul FMF T21 non disponible : utiliser le resultat du laboratoire ou un calculateur FMF verifie", "low", [], [...missing], { validation_status: "unavailable" },
    "L'approximation locale n'est pas le modele FMF valide. Les MoM et mesures restent disponibles dans le dossier.");
}

export function scoreFMFPE(p: AssistProfile) {
  if (!p.is_pregnant || (p.gestational_age_weeks != null && (p.gestational_age_weeks < 11 || p.gestational_age_weeks >= 14))) return null;
  const missing = (["age", "weight_kg", "gestational_age_weeks", "sbp_mmhg", "dbp_mmhg", "uterine_artery_pi_left", "uterine_artery_pi_right"] as const).filter((f) => p[f] == null);
  return scoreOut("FMF_PE_FirstTrimester", DOMAIN.OBS, null, RISK.UNKNOWN,
    "Risque FMF non calculé : utiliser un calculateur FMF vérifié", "low", ["Évaluer les facteurs maternels et utiliser le calculateur FMF officiel"], [...missing],
    { validation_status: "unavailable", source_url: "https://fetalmedicine.org/research/assess/preeclampsia" },
    "L'ancienne formule locale ne correspondait pas au modèle FMF publié. Aucun pourcentage ni seuil thérapeutique n'est déduit de cette approximation.");
}

/** Payne et al., PLOS Medicine 2014, doi:10.1371/journal.pmed.1001589. Natural logs; GA in weeks. */
export function scoreMiniPIERS(p: AssistProfile) {
  if (!p.is_pregnant || ((p.sbp_mmhg ?? 0) < 140 && (p.dbp_mmhg ?? 0) < 90 && p.chronic_hypertension !== true)) return null;
  const required = ["gestational_age_weeks", "parity", "sbp_mmhg", "dipstick_protein", "headache_visual", "chest_pain_dyspnoea", "vaginal_bleeding_abdominal_pain"] as const;
  const missing = required.filter((f) => p[f] == null);
  if (missing.length) return insufficient("miniPIERS", DOMAIN.OBS, [...missing]);
  const dip = p.dipstick_protein!;
  if (!["neg", "negative", "negatif", "0", "trace", "1+", "2+", "3+", "4+"].includes(dip)) return insufficient("miniPIERS", DOMAIN.OBS, ["dipstick_protein"]);
  const ga = p.gestational_age_weeks!;
  if (ga <= 0 || p.sbp_mmhg! <= 0) return insufficient("miniPIERS", DOMAIN.OBS, ["gestational_age_weeks", "sbp_mmhg"]);
  const logit = -5.77 - 0.298 * (p.parity! > 0 ? 1 : 0) - 1.07 * Math.log(ga) + 1.34 * Math.log(p.sbp_mmhg!)
    + (dip === "2+" ? -0.218 : dip === "3+" ? 0.424 : dip === "4+" ? 0.512 : 0)
    + 1.18 * (p.vaginal_bleeding_abdominal_pain ? 1 : 0) + 0.422 * (p.headache_visual ? 1 : 0) + 0.847 * (p.chest_pain_dyspnoea ? 1 : 0);
  const risk = 1 / (1 + Math.exp(-logit));
  const positive = risk >= 0.25;
  return scoreOut("miniPIERS", DOMAIN.OBS, (100 * risk).toFixed(1) + "%", positive ? RISK.HIGH : RISK.INTERMEDIATE,
    positive ? "miniPIERS : seuil de triage >=25% franchi" : "miniPIERS : sous le seuil de triage, complication non exclue", "moderate",
    [positive ? "Evaluation obstetricale urgente et orientation adaptee" : "Surveillance du trouble hypertensif selon l'etat clinique"], [],
    { probability: risk, source_url: "https://doi.org/10.1371/journal.pmed.1001589" },
    "Modele publie pour les troubles hypertensifs de grossesse : utiliser les mesures de l'admission et verifier la calibration locale. Ne remplace pas l'evaluation clinique.");
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
  ].every((v) => typeof v === "boolean");
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
    { stage, efw_pct: efwPct, bpp_complete: bppAvailable },
    "Stadification locale indicative à confirmer en centre spécialisé ; un BPP incomplet ne permet pas de calculer un total.",
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
