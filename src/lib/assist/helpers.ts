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
  return {
    score_name: name,
    domain,
    value,
    risk_level: risk,
    interpretation,
    confidence,
    recommended_actions: actions,
    missing_inputs: missing,
    metadata: meta,
    ...(disclaimer ? { disclaimer } : {}),
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
