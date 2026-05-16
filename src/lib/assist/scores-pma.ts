import { Norm } from "./norm";
import { insufficient, scoreOut } from "./helpers";
import type { AssistProfile } from "./types";
import { DOMAIN, RISK } from "./types";

export function scorePOSEIDON(p: AssistProfile) {
  if (!p.is_infertility) return null;
  if (p.age == null || p.afc == null)
    return insufficient(
      "POSEIDON",
      DOMAIN.PMA,
      ["age", "afc"].filter((f) => p[f as keyof AssistProfile] == null),
    );
  const amh = p.amh_normalized_pmol;
  const lowRO = p.afc < 5 || (amh != null && amh < 1.2);
  const por = p.previous_poor_response;
  if (!lowRO && !por)
    return scoreOut(
      "POSEIDON",
      DOMAIN.PMA,
      "Normal",
      RISK.LOW,
      "POSEIDON Normal — bonne réponse attendue",
      "high",
      ["Protocole FIV standard"],
      [],
      { group: "Normal" },
    );
  if (!lowRO && por) {
    const g = p.age < 35 ? "1a" : "1b";
    return scoreOut(
      "POSEIDON",
      DOMAIN.PMA,
      `Groupe ${g}`,
      RISK.INTERMEDIATE,
      `POSEIDON ${g} — mauvaise réponse inattendue`,
      "high",
      ["Modifier protocole", "DuoStim à discuter"],
      [],
      { group: g },
    );
  }
  if (lowRO && por) {
    const g = p.age < 35 ? "2a" : "2b";
    return scoreOut(
      "POSEIDON",
      DOMAIN.PMA,
      `Groupe ${g}`,
      RISK.HIGH,
      `POSEIDON ${g} — réserve diminuée + mauvaise réponse antérieure`,
      "high",
      ["Antagoniste+FSHr max dose", "Don d'ovocytes si AFC<3+âge>40"],
      [],
      { group: g },
    );
  }
  const g = p.age < 35 ? "3" : "4";
  return scoreOut(
    "POSEIDON",
    DOMAIN.PMA,
    `Groupe ${g}`,
    RISK.HIGH,
    `POSEIDON ${g} — réserve diminuée (AFC=${p.afc})`,
    "high",
    ["Antagoniste+FSHr haute dose", "Accumulation multi-cycles"],
    [],
    { group: g },
  );
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
  const lo = Math.max(1, +(lbr - 8).toFixed(1));
  const hi = Math.min(65, +(lbr + 8).toFixed(1));
  if (lbr >= 35)
    return scoreOut(
      "HAWAE_IVF_Prognosis",
      DOMAIN.PMA,
      `LBR ~${lbr}%/cycle`,
      RISK.LOW,
      `Bon pronostic FIV — LBR ~${lbr}% (IC95: ${lo}–${hi}%)`,
      "moderate",
      ["Protocole FIV standard", "SET recommandé"],
    );
  if (lbr >= 18)
    return scoreOut(
      "HAWAE_IVF_Prognosis",
      DOMAIN.PMA,
      `LBR ~${lbr}%/cycle`,
      RISK.INTERMEDIATE,
      `Pronostic intermédiaire — LBR ~${lbr}%`,
      "moderate",
      ["Optimiser protocole", "Counseling réaliste 2–3 cycles"],
    );
  return scoreOut(
    "HAWAE_IVF_Prognosis",
    DOMAIN.PMA,
    `LBR ~${lbr}%/cycle`,
    RISK.HIGH,
    `Pronostic réservé — LBR ~${lbr}%`,
    "moderate",
    ["Don d'ovocytes si âge>40+RO basse", "Accompagnement psychologique"],
  );
}
