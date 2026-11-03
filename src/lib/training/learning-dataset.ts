import type { AiLearningCase, LearningStatus } from "@/types/ai-learning";
import { isConfirmedCase } from "./learning-features";
import { createHash } from "node:crypto";

/** Clinician-authored labels only; generatedResponse is intentionally never a target. */
export function buildReviewedDataset(records: AiLearningCase[]) {
  const confirmed = records.filter(isConfirmedCase).sort((a, b) => {
    const priority = { train: 0, validation: 1, test: 2 };
    return priority[a.split] - priority[b.split] || b.createdAt.localeCompare(a.createdAt);
  });
  const trainingFeatures = new Set(confirmed.filter((r) => r.split === "train").map((r) => r.featureHash));
  const labels = new Map<string, Set<string>>();
  for (const r of confirmed) { const values = labels.get(r.featureHash) ?? new Set(); values.add(r.review!.confirmedDiagnosis.trim().toLocaleLowerCase("fr")); labels.set(r.featureHash, values); }
  const seen = new Set<string>();
  return confirmed.filter((r) => {
    if (labels.get(r.featureHash)!.size > 1) return false;
    if (r.split !== "train" && trainingFeatures.has(r.featureHash)) return false;
    const key = r.featureHash;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).map((r) => ({ caseId: "case_" + createHash("sha256").update(r.featureHash + ":" + r.review!.confirmedDiagnosis).digest("hex").slice(0, 24), schemaVersion: r.schemaVersion, split: r.split, features: r.features, question: r.question,
    target: { confirmedDiagnosis: r.review!.confirmedDiagnosis, correctedResponse: r.review!.correctedResponse, rationale: r.review!.rationale },
    provenance: { reviewedAt: r.review!.reviewedAt, originalModel: r.model, promptVersion: r.promptVersion, knowledgeVersion: r.knowledgeVersion },
  }));
}

export function learningGate(status: LearningStatus) {
  return { eligibleForEvaluation: status.evaluationReady, automaticModelPromotion: false,
    reason: status.evaluationReady ? "Independent clinical evaluation required before any model replacement" : "More independent confirmed cases are required in train, validation and test sets" };
}
