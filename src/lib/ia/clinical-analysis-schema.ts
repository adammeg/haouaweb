export type ClinicalConfidence =
  | "strongly_supported"
  | "plausible"
  | "must_exclude"
  | "insufficient_information";

export type ClinicalUrgency = "none" | "routine" | "rapid" | "immediate";

export interface ClinicalAiCitation {
  source: string;
  year: number | null;
  title: string;
}

export interface ClinicalAiHypothesis {
  label: string;
  confidence: ClinicalConfidence;
  supportingFacts: string[];
  limitingFacts: string[];
  citations: ClinicalAiCitation[];
}

export interface ClinicalAiRedFlag {
  label: string;
  urgency: ClinicalUrgency;
  rationale: string;
  citations: ClinicalAiCitation[];
}

export interface ClinicalAiAnalysis {
  schemaVersion: "clinical-analysis-v1";
  summary: string[];
  hypotheses: ClinicalAiHypothesis[];
  redFlags: ClinicalAiRedFlag[];
  missingInformation: string[];
  suggestedInvestigations: string[];
  followUp: string[];
  citations: ClinicalAiCitation[];
  limitations: string[];
}

const CONFIDENCE = new Set<ClinicalConfidence>([
  "strongly_supported",
  "plausible",
  "must_exclude",
  "insufficient_information",
]);
const URGENCY = new Set<ClinicalUrgency>(["none", "routine", "rapid", "immediate"]);

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("objet attendu");
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string, max = 1_200): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} invalide`);
  return value.trim().slice(0, max);
}

function texts(value: unknown, label: string, maxItems = 12): string[] {
  if (!Array.isArray(value)) throw new Error(`${label} doit être une liste`);
  return value.slice(0, maxItems).map((v, i) => text(v, `${label}[${i}]`, 600));
}

function citation(value: unknown): ClinicalAiCitation {
  const o = object(value);
  const year = o.year == null ? null : Number(o.year);
  return {
    source: text(o.source, "citation.source", 160),
    year: year != null && Number.isInteger(year) && year >= 1900 && year <= 2100 ? year : null,
    title: text(o.title, "citation.title", 240),
  };
}

function citations(value: unknown): ClinicalAiCitation[] {
  if (!Array.isArray(value)) throw new Error("citations doit être une liste");
  return value.slice(0, 12).map(citation);
}

export function validateClinicalAiAnalysis(value: unknown): ClinicalAiAnalysis {
  const o = object(value);
  if (o.schemaVersion !== "clinical-analysis-v1") {
    throw new Error("version de schéma incorrecte");
  }
  if (!Array.isArray(o.hypotheses) || !Array.isArray(o.redFlags)) {
    throw new Error("hypotheses/redFlags doivent être des listes");
  }

  return {
    schemaVersion: "clinical-analysis-v1",
    summary: texts(o.summary, "summary", 8),
    hypotheses: o.hypotheses.slice(0, 10).map((entry, i) => {
      const h = object(entry);
      if (typeof h.confidence !== "string" || !CONFIDENCE.has(h.confidence as ClinicalConfidence)) {
        throw new Error(`hypotheses[${i}].confidence invalide`);
      }
      return {
        label: text(h.label, `hypotheses[${i}].label`, 240),
        confidence: h.confidence as ClinicalConfidence,
        supportingFacts: texts(h.supportingFacts, `hypotheses[${i}].supportingFacts`, 8),
        limitingFacts: texts(h.limitingFacts, `hypotheses[${i}].limitingFacts`, 8),
        citations: citations(h.citations),
      };
    }),
    redFlags: o.redFlags.slice(0, 10).map((entry, i) => {
      const f = object(entry);
      if (typeof f.urgency !== "string" || !URGENCY.has(f.urgency as ClinicalUrgency)) {
        throw new Error(`redFlags[${i}].urgency invalide`);
      }
      return {
        label: text(f.label, `redFlags[${i}].label`, 240),
        urgency: f.urgency as ClinicalUrgency,
        rationale: text(f.rationale, `redFlags[${i}].rationale`, 600),
        citations: citations(f.citations),
      };
    }),
    missingInformation: texts(o.missingInformation, "missingInformation"),
    suggestedInvestigations: texts(o.suggestedInvestigations, "suggestedInvestigations"),
    followUp: texts(o.followUp, "followUp"),
    citations: citations(o.citations),
    limitations: texts(o.limitations, "limitations", 8),
  };
}

export function parseClinicalAiAnalysis(raw: string): ClinicalAiAnalysis {
  const cleaned = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("JSON clinique absent");
  return validateClinicalAiAnalysis(JSON.parse(cleaned.slice(start, end + 1)));
}

export function clinicalAnalysisToText(a: ClinicalAiAnalysis): string {
  const hypotheses = a.hypotheses.map((h) => `- ${h.label} (${h.confidence})`).join("\n");
  const redFlags = a.redFlags.map((f) => `- ${f.label} [${f.urgency}] — ${f.rationale}`).join("\n");
  return [
    "SYNTHÈSE CLINIQUE",
    ...a.summary.map((x) => `- ${x}`),
    "\nHYPOTHÈSES",
    hypotheses || "- Aucune hypothèse structurée",
    "\nSIGNAUX D'ALERTE",
    redFlags || "- Aucun signal d'alerte identifié par le modèle",
    "\nDONNÉES MANQUANTES",
    ...a.missingInformation.map((x) => `- ${x}`),
    "\nEXAMENS À DISCUTER",
    ...a.suggestedInvestigations.map((x) => `- ${x}`),
    "\nSUIVI",
    ...a.followUp.map((x) => `- ${x}`),
  ].join("\n");
}
