import { Norm } from "./norm";
import { scoreOut } from "./helpers";
import type { AssistProfile } from "./types";
import { DOMAIN, RISK } from "./types";

export function scoreBMI(p: AssistProfile) {
  if (!p.weight_kg || !p.height_cm) return null;
  const bmi = Norm.bmi(p.weight_kg, p.height_cm);
  if (bmi < 18.5)
    return scoreOut(
      "BMI_Classification",
      DOMAIN.CROSS,
      `${bmi}kg/m²`,
      RISK.INTERMEDIATE,
      `Sous-poids — IMC ${bmi}`,
      "high",
      ["Bilan nutritionnel"],
    );
  if (bmi < 25)
    return scoreOut(
      "BMI_Classification",
      DOMAIN.CROSS,
      `${bmi}kg/m²`,
      RISK.LOW,
      `Poids normal — IMC ${bmi}`,
      "high",
      ["Folates 0.4mg/j préconceptionnel"],
    );
  if (bmi < 30)
    return scoreOut(
      "BMI_Classification",
      DOMAIN.CROSS,
      `${bmi}kg/m²`,
      RISK.LOW,
      `Surpoids — IMC ${bmi}`,
      "high",
      ["Conseils diététiques"],
    );
  if (bmi < 35)
    return scoreOut(
      "BMI_Classification",
      DOMAIN.CROSS,
      `${bmi}kg/m²`,
      RISK.INTERMEDIATE,
      `Obésité Cl.I — IMC ${bmi}`,
      "high",
      ["Aspirine prophylactique 12 SA", "HGPO dès T1+24-28 SA"],
    );
  if (bmi < 40)
    return scoreOut(
      "BMI_Classification",
      DOMAIN.CROSS,
      `${bmi}kg/m²`,
      RISK.HIGH,
      `Obésité Cl.II — IMC ${bmi}`,
      "high",
      ["PEC multidisciplinaire"],
    );
  return scoreOut(
    "BMI_Classification",
    DOMAIN.CROSS,
    `${bmi}kg/m²`,
    RISK.HIGH,
    `Obésité morbide — IMC ${bmi}`,
    "high",
    ["PEC URGENTE multidisciplinaire"],
  );
}

export function scoreGDM(p: AssistProfile) {
  if (!p.is_pregnant) return null;
  const criteria: string[] = [];
  if (p.ogtt_fasting != null) {
    if (p.ogtt_fasting >= 7.0) {
      criteria.push("Glycémie jeûn ≥ 7.0 = DT2 manifeste");
    } else if (p.ogtt_fasting >= 5.1) {
      criteria.push(`Jeûn ${p.ogtt_fasting} ≥ 5.1 mmol/L (IADPSG)`);
    }
    if (p.ogtt_1h && p.ogtt_1h >= 10.0) {
      criteria.push(`H1 ${p.ogtt_1h} ≥ 10.0`);
    }
    if (p.ogtt_2h && p.ogtt_2h >= 8.5) {
      criteria.push(`H2 ${p.ogtt_2h} ≥ 8.5`);
    }
  }
  let riskScore = 0;
  const riskFactors: string[] = [];
  const bmi = p.bmi_computed ?? p.bmi;
  if (bmi && bmi >= 30) {
    riskScore += 2;
    riskFactors.push(`IMC ${bmi}`);
  }
  if (p.age && p.age >= 35) {
    riskScore += 1;
    riskFactors.push(`Âge ${p.age}a`);
  }
  if (p.previous_cs && p.previous_cs > 0) {
    riskScore += 1;
    riskFactors.push("ATCD césarienne");
  }

  if (criteria.length)
    return scoreOut(
      "GDM_IADPSG",
      DOMAIN.CROSS,
      "DG=OUI",
      RISK.HIGH,
      `🔴 DIABÈTE GESTATIONNEL — ${criteria.join("; ")}`,
      "high",
      [
        "Autosurveillance glycémique 4×/jour",
        "Consultation diabétologie+diéticien urgent",
      ],
    );

  if (riskScore >= 3 && p.ogtt_fasting == null)
    return scoreOut(
      "GDM_IADPSG",
      DOMAIN.CROSS,
      "HGPO requise",
      RISK.INTERMEDIATE,
      `⚠️ Facteurs de risque DG (${riskFactors.join(", ")})`,
      "low",
      ["HGPO 75g si non faite", "HGPO à 24–28 SA"],
    );

  if (p.ogtt_fasting == null)
    return scoreOut(
      "GDM_IADPSG",
      DOMAIN.CROSS,
      "Non testé",
      RISK.UNKNOWN,
      `HGPO non disponible — facteurs: ${riskScore}/6`,
      "low",
      ["Prescrire HGPO 75g à 24–28 SA"],
      ["ogtt_fasting"],
    );

  return scoreOut(
    "GDM_IADPSG",
    DOMAIN.CROSS,
    "DG=NON",
    RISK.LOW,
    "✅ HGPO normale — Pas de diabète gestationnel",
    "high",
    ["Suivi standard"],
  );
}

export function scoreVTE(p: AssistProfile) {
  if (!p.is_pregnant) return null;
  let score = 0;
  const factors: string[] = [];
  if (p.previous_vte) {
    score += 4;
    factors.push("ATCD TVP/EP (4pts)");
  }
  if (p.thrombophilia_high) {
    score += 3;
    factors.push("Thrombophilie haut risque (3pts)");
  }
  if (p.sle || p.antiphospholipid) {
    score += 3;
    factors.push("SLE/APL (3pts)");
  }
  if (p.chronic_kidney_disease) {
    score += 3;
    factors.push("Néphropathie (3pts)");
  }
  if (p.chronic_hypertension) {
    score += 1;
    factors.push("HTA chronique (1pt)");
  }
  if (p.thrombophilia_low) {
    score += 1;
    factors.push("Thrombophilie basse (1pt)");
  }
  const bmi = p.bmi_computed ?? p.bmi;
  if (bmi && bmi >= 40) {
    score += 2;
    factors.push("IMC≥40 (2pts)");
  } else if (bmi && bmi >= 30) {
    score += 1;
    factors.push("IMC 30-40 (1pt)");
  }
  if (p.parity && p.parity >= 3) {
    score += 1;
    factors.push("Parité ≥3 (1pt)");
  }
  if (p.smoking) {
    score += 1;
    factors.push("Tabagisme (1pt)");
  }
  if (p.multiple_pregnancy) {
    score += 1;
    factors.push("Grossesse multiple (1pt)");
  }
  if (p.previous_ohss) {
    score += 4;
    factors.push("OHSS (4pts)");
  }
  if (p.vte_current_infection) {
    score += 1;
    factors.push("Infection (1pt)");
  }
  if (p.vte_immobility) {
    score += 1;
    factors.push("Immobilisation (1pt)");
  }
  if (p.vte_surgical) {
    score += 3;
    factors.push("Chirurgie (3pts)");
  }
  if (p.previous_cs && p.previous_cs >= 1) {
    score += 1;
    factors.push("ATCD césarienne (1pt)");
  }

  if (score >= 4)
    return scoreOut(
      "VTE_RCOG",
      DOMAIN.CROSS,
      `Score ${score}`,
      RISK.HIGH,
      `🔴 RISQUE VTE ÉLEVÉ — score ${score} → HBPM T1`,
      "high",
      ["🔴 HBPM PROPHYLACTIQUE dès T1", "Bas de contention classe 2"],
      [],
      { score, factors },
    );
  if (score === 3)
    return scoreOut(
      "VTE_RCOG",
      DOMAIN.CROSS,
      `Score ${score}`,
      RISK.INTERMEDIATE,
      `⚠️ Risque VTE intermédiaire → HBPM à 28 SA`,
      "high",
      ["HBPM prophylactique dès 28 SA"],
    );
  return scoreOut(
    "VTE_RCOG",
    DOMAIN.CROSS,
    `Score ${score}`,
    RISK.LOW,
    `✅ Risque VTE faible — score ${score}`,
    "high",
    ["Mobilisation précoce", "Hydratation"],
  );
}
