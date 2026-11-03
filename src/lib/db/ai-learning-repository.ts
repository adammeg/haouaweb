import { getDb } from "./mongo";
import { getDoctorAiTrainingSettings } from "./doctor-settings-repository";
import type { AiLearningRecord, AiLearningCase, LearningReview, LearningStatus } from "@/types/ai-learning";
import { isConfirmedCase, learningKeyVersion } from "@/lib/training/learning-features";
import { buildReviewedDataset } from "@/lib/training/learning-dataset";

const COL = "ai_reviewed_learning";
export async function currentLearningConsent(doctorId: string): Promise<string | null> {
  const settings = await getDoctorAiTrainingSettings(doctorId);
  return settings.enabled && settings.consentedAt ? `${settings.learningEpoch ?? settings.consentedAt}:${learningKeyVersion()}` : null;
}
export async function insertLearningGeneration(record: AiLearningRecord): Promise<boolean> {
  if (await currentLearningConsent(record.doctorId) !== record.consentToken) return false;
  const db = await getDb();
  await db.collection<AiLearningRecord>(COL).insertOne(record);
  // If withdrawal happened while the write was in flight, remove this late write too.
  if (await currentLearningConsent(record.doctorId) !== record.consentToken) {
    await db.collection(COL).deleteOne({ doctorId: record.doctorId, id: record.id });
    return false;
  }
  return true;
}
export async function getLearningGeneration(doctorId: string, id: string): Promise<AiLearningRecord | null> {
  const token = await currentLearningConsent(doctorId);
  if (!token) return null;
  const db = await getDb();
  return db.collection<AiLearningRecord>(COL).findOne({ doctorId, id, consentToken: token }, { projection: { _id: 0 } });
}
export async function updateLearningReview(record: AiLearningRecord, review: LearningReview): Promise<boolean> {
  if (await currentLearningConsent(record.doctorId) !== record.consentToken) return false;
  const db = await getDb();
  const updated = await db.collection(COL).updateOne({ doctorId: record.doctorId, id: record.id, consentToken: record.consentToken }, { $set: { review } });
  if (await currentLearningConsent(record.doctorId) !== record.consentToken) {
    await db.collection(COL).deleteOne({ doctorId: record.doctorId, id: record.id });
    return false;
  }
  return updated.matchedCount === 1;
}
export async function listLearningRecords(doctorId: string, options: { confirmedOnly?: boolean; memoryOnly?: boolean; limit?: number } = {}): Promise<AiLearningCase[]> {
  const token = await currentLearningConsent(doctorId);
  if (!token) return [];
  const db = await getDb();
  return db.collection<AiLearningCase>(COL).find({ doctorId, consentToken: token,
    ...(options.confirmedOnly || options.memoryOnly ? { "review.verdict": "corrected", "review.outcome": "confirmed", "review.confirmedByClinician": true } : {}),
    ...(options.memoryOnly ? { split: "train" } : {}),
  }, { projection: { _id: 0, generatedResponse: 0 } }).sort({ createdAt: -1 }).limit(Math.min(5000, options.limit ?? 200)).toArray();
}
export async function getLearningStatus(doctorId: string): Promise<LearningStatus> {
  const token = await currentLearningConsent(doctorId);
  const empty: LearningStatus = { enabled: Boolean(token), captured: 0, reviewed: 0, confirmed: 0, memoryEligible: 0, rejected: 0, helpfulRatings: 0, validationCases: 0, testCases: 0, evaluationReady: false };
  if (!token) return empty;
  const db = await getDb();
  const base = { doctorId, consentToken: token };
  const confirmed = { ...base, "review.verdict": "corrected", "review.outcome": "confirmed", "review.confirmedByClinician": true };
  const col = db.collection(COL);
  const [captured, reviewed, confirmedCount, memoryEligible, rejected, helpfulRatings, trainingPatients, validationPatients, testPatients] = await Promise.all([
    col.countDocuments(base), col.countDocuments({ ...base, review: { $ne: null } }), col.countDocuments(confirmed), col.countDocuments({ ...confirmed, split: "train" }),
    col.countDocuments({ ...base, "review.verdict": "rejected" }), col.countDocuments({ ...base, "review.verdict": "helpful" }),
    col.distinct("patientRef", { ...confirmed, split: "train" }),
    col.distinct("patientRef", { ...confirmed, split: "validation" }), col.distinct("patientRef", { ...confirmed, split: "test" }),
  ]);
  const dataset = buildReviewedDataset(await listLearningRecords(doctorId, { confirmedOnly: true, limit: 5000 }));
  const enoughUniqueCases = dataset.filter((r) => r.split === "train").length >= 20 && dataset.filter((r) => r.split === "validation").length >= 10 && dataset.filter((r) => r.split === "test").length >= 10;
  return { enabled: true, captured, reviewed, confirmed: confirmedCount, memoryEligible, rejected, helpfulRatings, validationCases: validationPatients.length, testCases: testPatients.length, evaluationReady: enoughUniqueCases && trainingPatients.length >= 20 && validationPatients.length >= 10 && testPatients.length >= 10 };
}
export async function deleteLearningRecordsForDoctor(doctorId: string): Promise<number> {
  const db = await getDb();
  return (await db.collection(COL).deleteMany({ doctorId })).deletedCount;
}
export { isConfirmedCase };
