export type ClinicalConfidence =
  | "strongly_supported"
  | "plausible"
  | "must_exclude"
  | "insufficient_information";

export type ClinicalUrgency = "none" | "routine" | "rapid" | "immediate";

export interface ClinicalAiCitation {
  chunkId?: string;
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
  if (value.trim().length > max) throw new Error(`${label} trop long`);
  return value.trim();
}

function texts(value: unknown, label: string, maxItems = 12): string[] {
  if (!Array.isArray(value)) throw new Error(`${label} doit être une liste`);
  if (value.length > maxItems) throw new Error(`${label} trop de valeurs`);
  return value.map((v, i) => text(v, `${label}[${i}]`, 600));
}

type CitationEvidence = { id: string; source: string; year: number; title: string };
function citation(value: unknown, evidence: readonly CitationEvidence[]): ClinicalAiCitation {
  const o = object(value);
  const match = evidence.find((c) => c.id === o.chunkId);
  if (!match) throw new Error("Citation absente des extraits fournis");
  return {
    chunkId: match.id,
    source: match.source,
    year: match.year,
    title: match.title,
  };
}

function citations(value: unknown, evidence: readonly CitationEvidence[]): ClinicalAiCitation[] {
  if (!Array.isArray(value)) throw new Error("citations doit être une liste");
  if (value.length > 12) throw new Error("Trop de citations");
  return value.map((entry) => citation(entry, evidence));
}

export function validateClinicalAiAnalysis(value: unknown, evidence: readonly CitationEvidence[] = []): ClinicalAiAnalysis {
  const o = object(value);
  if (o.schemaVersion !== "clinical-analysis-v1") {
    throw new Error("version de schéma incorrecte");
  }
  if (!Array.isArray(o.hypotheses) || !Array.isArray(o.redFlags)) {
    throw new Error("hypotheses/redFlags doivent être des listes");
  }
  if (o.hypotheses.length > 10 || o.redFlags.length > 10) throw new Error("Trop d'hypothèses ou d'alertes");
  if (!Array.isArray(o.summary) || !o.summary.length || !Array.isArray(o.limitations) || !o.limitations.length) throw new Error("Synthèse et limites requises");

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
        citations: citations(h.citations, evidence),
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
        citations: citations(f.citations, evidence),
      };
    }),
    missingInformation: texts(o.missingInformation, "missingInformation"),
    suggestedInvestigations: texts(o.suggestedInvestigations, "suggestedInvestigations"),
    followUp: texts(o.followUp, "followUp"),
    citations: citations(o.citations, evidence),
    limitations: texts(o.limitations, "limitations", 8),
  };
}

export function parseClinicalAiAnalysis(raw: string, evidence: readonly CitationEvidence[] = []): ClinicalAiAnalysis {
  const cleaned = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("JSON clinique absent");
  return validateClinicalAiAnalysis(JSON.parse(cleaned.slice(start, end + 1)), evidence);
}

export function clinicalAnalysisToText(a: ClinicalAiAnalysis): string {
  const hypotheses = a.hypotheses.map((h) => `- ${h.label} (${h.confidence})\n  En faveur: ${h.supportingFacts.join(" ; ")}\n  Limites: ${h.limitingFacts.join(" ; ")}\n  Références: ${h.citations.map((c) => c.chunkId).join(", ")}`).join("\n");
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
    "\nLIMITES",
    ...a.limitations.map((x) => `- ${x}`),
    "\nRÉFÉRENCES FOURNIES",
    ...[...a.citations, ...a.hypotheses.flatMap((h) => h.citations), ...a.redFlags.flatMap((f) => f.citations)].map((c) => `- [${c.chunkId}] ${c.source} — ${c.title}`),
  ].join("\n");
}
