import { poseidonClassification } from "@/lib/clinical/poseidon";
import { Norm } from "./norm";
import { insufficient, scoreOut } from "./helpers";
import type { AssistProfile } from "./types";
import { DOMAIN, RISK } from "./types";

export function scorePOSEIDON(p: AssistProfile) {
  if (!p.is_infertility) return null;
  const amhNgml = p.amh_normalized_pmol != null ? Norm.amhPmolToNgml(p.amh_normalized_pmol) : p.amh_ngml;
  const pos = poseidonClassification({ age: p.age, amhNgml, afc: p.afc, previousPoorResponse: p.previous_poor_response, previousOocytes: p.previous_oocytes });
  if (p.age == null || (!pos.lowReserve && (amhNgml == null || p.afc == null))) {
    return insufficient("POSEIDON", DOMAIN.PMA, [p.age == null && "age", amhNgml == null && "amh_ngml", p.afc == null && "afc"].filter((v): v is string => !!v));
  }
  if (pos.group == null) return scoreOut("POSEIDON", DOMAIN.PMA, null, RISK.UNKNOWN,
    "Réserve préservée : groupe POSEIDON non établi sans réponse observée à la stimulation", "low", [], ["previous_oocytes"], { group: null });
  return scoreOut("POSEIDON", DOMAIN.PMA, "Groupe " + (pos.subgroup ?? pos.group), pos.lowReserve ? RISK.HIGH : RISK.INTERMEDIATE,
    "POSEIDON " + (pos.subgroup ?? pos.group) + (pos.lowReserve ? " — réserve diminuée" : " — réponse diminuée inattendue"),
    "moderate", ["Discuter la stratégie de stimulation avec le spécialiste AMP"], [], { ...pos },
    "Classification de réserve et de réponse, sans prédiction individuelle de naissance vivante.");
}

export function scoreOHSS(p: AssistProfile) {
  if (!p.is_infertility || p.afc == null) return null;
  let score = 0;
  const factors: string[] = [];
  const amh = p.amh_normalized_pmol;
  if (p.afc > 15) {
    score += 3;
    factors.push(`AFC=${p.afc}>15`);
  } else if (p.afc > 10) {
    score += 2;
    factors.push(`AFC=${p.afc}`);
  }
  if (amh) {
    const ng = Norm.amhPmolToNgml(amh);
    if (ng > 3.0) {
      score += 3;
      factors.push(`AMH=${ng.toFixed(1)}ng/mL très élevée`);
    } else if (ng > 2.0) {
      score += 1;
      factors.push(`AMH=${ng.toFixed(1)}ng/mL élevée`);
    }
  }
  if (p.age && p.age < 30) {
    score += 1;
    factors.push("Âge<30");
  }
  if (p.weight_kg && p.weight_kg < 55) {
    score += 1;
    factors.push("Poids<55kg");
  }
  if (p.previous_ohss) {
    score += 3;
    factors.push("ATCD OHSS");
  }
  if (score >= 6)
    return scoreOut(
      "OHSS_Risk",
      DOMAIN.PMA,
      score,
      RISK.HIGH,
      `🔴 OHSS RISQUE ÉLEVÉ (score ${score}/10)`,
      "moderate",
      ["🔴 PROTOCOLE ANTAGONISTE OBLIGATOIRE", "FREEZE-ALL systématique"],
      [],
      { score, factors },
      "Score heuristique Hawae — valider en cohorte locale.",
    );
  if (score >= 3)
    return scoreOut(
      "OHSS_Risk",
      DOMAIN.PMA,
      score,
      RISK.INTERMEDIATE,
      `⚠️ OHSS risque modéré (score ${score}/10)`,
      "moderate",
      ["Préférer antagoniste", "Envisager Freeze-All"],
      [],
      { score },
    );
  const missing = (["age", "weight_kg", "amh_normalized_pmol", "previous_ohss"] as const).filter((f) => p[f] == null);
  if (missing.length) return insufficient("OHSS_Risk", DOMAIN.PMA, [...missing]);
  return scoreOut(
    "OHSS_Risk",
    DOMAIN.PMA,
    score,
    RISK.LOW,
    `✅ OHSS risque faible (score ${score}/10)`,
    "moderate",
    ["Protocole standard"],
    [],
    { score },
  );
}

export function scoreIVFPrognosis(p: AssistProfile) {
  if (!p.is_infertility || p.age == null) return null;
  const missing: string[] = (["infertility_cause", "sperm_quality", "previous_ivf_attempts", "bmi"] as const).filter((f) => p[f] == null);
  if (p.amh_normalized_pmol == null && p.afc == null) missing.push("amh_normalized_pmol");
  if (missing.length) return insufficient("HAWAE_IVF_Prognosis", DOMAIN.PMA, [...missing]);
  const amh = p.amh_normalized_pmol;
  const bmi = p.bmi_computed ?? p.bmi;
  let logit = 1.05;
  logit += -0.075 * (p.age - 30);
  if (p.age > 35) logit += -0.07 * (p.age - 35);
  if (p.age > 40) logit += -0.12 * (p.age - 40);
  if (amh) logit += 0.285 * Math.log(Math.max(0.1, amh));
  else if (p.afc) logit += 0.04 * Math.min(20, p.afc);
  const causeBonus: Record<string, number> = {
    unexplained: 0.28,
    male: 0.32,
    tubal: -0.12,
    endo: -0.15,
    other: 0,
  };
  logit += causeBonus[p.infertility_cause || "other"] || 0;
  const att = p.previous_ivf_attempts || 0;
  if (att === 1) logit -= 0.22;
  else if (att === 2) logit -= 0.44;
  else if (att >= 3) logit -= 0.75;
  const spermP: Record<string, number> = { mild: -0.1, severe: -0.55 };
  logit += spermP[p.sperm_quality || "normal"] || 0;
  if (bmi) {
    if (bmi > 35) logit -= 0.25;
    else if (bmi > 30) logit -= 0.12;
    else if (bmi < 18.5) logit -= 0.1;
  }
  const lbrProb = 1 / (1 + Math.exp(-logit));
  const lbr = +Math.max(2, Math.min(62, lbrProb * 100)).toFixed(1);
  if (lbr >= 35)
    return scoreOut(
      "HAWAE_IVF_Prognosis",
      DOMAIN.PMA,
      `Estimation heuristique ~${lbr}%/cycle`,
      RISK.LOW,
      `Estimation locale FIV — LBR ~${lbr}% (heuristique non calibrée)`,
      "moderate",
      ["Protocole FIV standard", "SET recommandé"],
    );
  if (lbr >= 18)
    return scoreOut(
      "HAWAE_IVF_Prognosis",
      DOMAIN.PMA,
      `Estimation heuristique ~${lbr}%/cycle`,
      RISK.INTERMEDIATE,
      `Pronostic intermédiaire — LBR ~${lbr}%`,
      "moderate",
      ["Optimiser protocole", "Counseling réaliste 2–3 cycles"],
    );
  return scoreOut(
    "HAWAE_IVF_Prognosis",
    DOMAIN.PMA,
    `Estimation heuristique ~${lbr}%/cycle`,
    RISK.HIGH,
    `Pronostic réservé — LBR ~${lbr}%`,
    "moderate",
    ["Don d'ovocytes si âge>40+RO basse", "Accompagnement psychologique"],
  );
}
