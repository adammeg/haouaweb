import type { LearningReview } from "@/types/ai-learning";

export type LearningFeedbackInput = { generationId: string; patientId: string; revision: string; verdict: LearningReview["verdict"]; outcome: LearningReview["outcome"]; confirmedDiagnosis: string; correctedResponse: string; rationale: string; confirmedByClinician: boolean };
export function parseLearningFeedback(value: unknown): LearningFeedbackInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Retour invalide");
  const o = value as Record<string, unknown>;
  const text = (key: string, max: number, required = false) => {
    if (o[key] == null && !required) return "";
    if (typeof o[key] !== "string" || (o[key] as string).length > max || (required && !(o[key] as string).trim())) throw new Error(`Champ ${key} invalide`);
    return (o[key] as string).trim();
  };
  if (typeof o.verdict !== "string" || !["helpful", "rejected", "corrected"].includes(o.verdict)) throw new Error("Avis invalide");
  if (o.outcome != null && (typeof o.outcome !== "string" || !["pending", "confirmed"].includes(o.outcome))) throw new Error("Statut clinique invalide");
  const corrected = o.verdict === "corrected";
  const generationId = text("generationId", 80, true), patientId = text("patientId", 160, true), revision = text("revision", 64, true);
  if (!/^learn_[a-zA-Z0-9_-]+$/.test(generationId) || !/^[a-f0-9]{64}$/.test(revision)) throw new Error("Référence de génération invalide");
  const confirmed = o.outcome === "confirmed";
  if (confirmed && (!corrected || o.confirmedByClinician !== true)) throw new Error("Un cas confirmé nécessite une correction et une validation clinique explicite");
  return { generationId, patientId, revision, verdict: o.verdict as LearningReview["verdict"], outcome: confirmed ? "confirmed" : "pending", confirmedDiagnosis: text("confirmedDiagnosis", 240, corrected), correctedResponse: text("correctedResponse", 4000, corrected), rationale: text("rationale", 1200, corrected), confirmedByClinician: o.confirmedByClinician === true };
}
