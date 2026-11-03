import { nanoid } from "nanoid";
import type { PatientSnapshot } from "@/types/domain";
import type { AiLearningRecord, ReviewedCaseExample } from "@/types/ai-learning";
import { LEARNING_VERSION } from "@/types/ai-learning";
import { currentLearningConsent, insertLearningGeneration, listLearningRecords } from "@/lib/db/ai-learning-repository";
import { featureHash, learningFeatures, learningPatientRef, patientSplit, scrubLearningText, selectReviewedCases } from "./learning-features";

export type LearningPlan = { id: string; doctorId: string; consentToken: string; patientRef: string; features: AiLearningRecord["features"]; examples: ReviewedCaseExample[] };
export async function prepareLearningPlan(doctorId: string, patient: PatientSnapshot): Promise<LearningPlan | null> {
  const token = await currentLearningConsent(doctorId);
  if (!token) return null;
  const patientRef = learningPatientRef(doctorId, patient.id);
  const features = learningFeatures(patient);
  const records = await listLearningRecords(doctorId, { memoryOnly: true, limit: 200 });
  return { id: `learn_${nanoid(18)}`, doctorId, consentToken: token, patientRef, features, examples: selectReviewedCases(records, { doctorId, patientRef, consentToken: token, features }) };
}

export async function captureLearningGeneration(plan: LearningPlan, input: {
  patient: PatientSnapshot; revision: string; mode: AiLearningRecord["mode"]; question: string; reply: string;
  provider: string; model: string; promptVersion: string; knowledgeVersion: string; evidenceIds: string[];
}): Promise<boolean> {
  const record: AiLearningRecord = {
    id: plan.id, doctorId: plan.doctorId, consentToken: plan.consentToken, patientRef: plan.patientRef,
    schemaVersion: LEARNING_VERSION, revision: input.revision, mode: input.mode, question: scrubLearningText(input.question, input.patient),
    features: plan.features, featureHash: featureHash(plan.features), split: patientSplit(plan.patientRef),
    generatedResponse: scrubLearningText(input.reply, input.patient).slice(0, 24_000), provider: input.provider, model: input.model,
    promptVersion: input.promptVersion, knowledgeVersion: input.knowledgeVersion, evidenceIds: input.evidenceIds,
    usedCaseIds: plan.examples.map((example) => example.id), createdAt: new Date().toISOString(), review: null,
  };
  return insertLearningGeneration(record);
}

export function reviewedCasesBlock(examples: ReviewedCaseExample[]): string {
  return `<CAS_REVUS>\n${JSON.stringify({ kind: "historical_clinician_reviewed_examples", cases: examples }).replace(/</g, "\\u003c")}\n</CAS_REVUS>`;
}

/** Capture only successfully completed responses. Cancellation/errors never flush into training. */
export function learningCaptureStream(stream: ReadableStream<Uint8Array>, save: (text: string) => Promise<unknown>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  let text = "";
  let tooLarge = false;
  return stream.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      const part = decoder.decode(chunk, { stream: true });
      if (text.length + part.length > 24_000) tooLarge = true;
      if (!tooLarge) text += part;
      controller.enqueue(chunk);
    },
    async flush() {
      text += decoder.decode();
      if (text.trim() && !tooLarge) await save(text).catch(() => {});
    },
  }));
}
