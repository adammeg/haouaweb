import type { ClinicalDomain, RiskLevel, ScoreOutput } from "./types";
import { RISK } from "./types";

export function scoreOut(
  name: string,
  domain: ClinicalDomain,
  value: string | number | null,
  risk: RiskLevel,
  interpretation: string,
  confidence: string,
  actions: string[],
  missing: string[] = [],
  meta: Record<string, unknown> = {},
  disclaimer = "",
): ScoreOutput {
  const heuristics = ["HAWAE_IVF_Prognosis", "OHSS_Risk", "ADNEX_Simplified", "FGR_Staging", "VTE_RCOG"];
  const heuristic = heuristics.includes(name);
  return {
    score_name: name,
    domain,
    value,
    risk_level: risk,
    interpretation,
    confidence: name === "HAWAE_IVF_Prognosis" ? "low" : heuristic && confidence === "high" ? "moderate" : confidence,
    recommended_actions: actions,
    missing_inputs: missing,
    metadata: heuristic ? { validation_status: "heuristic", ...meta } : meta,
    ...(disclaimer || heuristic ? { disclaimer: disclaimer || "Évaluation locale indicative ; modèle et applicabilité à confirmer avec le référentiel et le spécialiste." } : {}),
  };
}

export function insufficient(
  name: string,
  domain: ClinicalDomain,
  missing: string[],
): ScoreOutput {
  return scoreOut(
    name,
    domain,
    null,
    RISK.UNKNOWN,
    "Données insuffisantes",
    "low",
    [],
    missing,
  );
}
