type EvaluationCase = { caseId: string; split: "train" | "validation" | "test"; target: { confirmedDiagnosis: string } };
type Prediction = { caseId: string; model: string; reply: string; humanReview?: { diagnosisCorrect: boolean; unsafeAdvice: boolean } };
const normalized = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/** Offline comparison only. Text matching is a coverage proxy, never diagnostic validation. */
export function evaluateLearningPredictions(dataset: EvaluationCase[], rawPredictions: unknown[]) {
  const cases = new Map<string, EvaluationCase>();
  for (const row of dataset) {
    if (!row || typeof row.caseId !== "string" || !["train", "validation", "test"].includes(row.split) || typeof row.target?.confirmedDiagnosis !== "string") throw new Error("Invalid evaluation dataset");
    if (cases.has(row.caseId)) throw new Error("Duplicate dataset case");
    cases.set(row.caseId, row);
  }
  const models = new Map<string, Prediction[]>();
  const seen = new Set<string>();
  for (const value of rawPredictions) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid prediction");
    const row = value as Prediction;
    if (typeof row.caseId !== "string" || typeof row.model !== "string" || !row.model.trim() || typeof row.reply !== "string") throw new Error("Invalid prediction fields");
    const source = cases.get(row.caseId);
    if (!source || source.split === "train") throw new Error("Predictions must reference held-out cases only");
    const key = `${row.model}:${row.caseId}`;
    if (seen.has(key)) throw new Error("Duplicate model/case prediction");
    seen.add(key);
    if (row.humanReview && (typeof row.humanReview.diagnosisCorrect !== "boolean" || typeof row.humanReview.unsafeAdvice !== "boolean")) throw new Error("Invalid human review");
    const entries = models.get(row.model) ?? []; entries.push(row); models.set(row.model, entries);
  }
  const heldOutCases = [...cases.values()].filter((r) => r.split !== "train").length;
  return {
    heldOutCases, automaticModelPromotion: false,
    metrics: [...models].map(([model, predictions]) => {
      const reviewed = predictions.filter((p) => p.humanReview);
      const labelMentions = predictions.filter((p) => normalized(p.reply).includes(normalized(cases.get(p.caseId)!.target.confirmedDiagnosis))).length;
      return { model, submittedCases: predictions.length, completionRate: predictions.length ? predictions.filter((p) => p.reply.trim()).length / predictions.length : null,
        datasetCoverage: heldOutCases ? predictions.length / heldOutCases : null,
        lexicalDiagnosisCoverage: predictions.length ? labelMentions / predictions.length : null,
        humanReviewedCases: reviewed.length,
        reportedHumanDiagnosticAccuracy: reviewed.length ? reviewed.filter((p) => p.humanReview!.diagnosisCorrect).length / reviewed.length : null,
        reportedUnsafeAdviceRate: reviewed.length ? reviewed.filter((p) => p.humanReview!.unsafeAdvice).length / reviewed.length : null,
      };
    }),
    limitations: ["Lexical diagnosis coverage measures a label mention, not diagnostic correctness.", "Human-review values are supplied by the evaluator; this script cannot verify reviewer credentials.", "Compare candidates on the same independent cases and have clinicians adjudicate correctness before deployment."],
  };
}
