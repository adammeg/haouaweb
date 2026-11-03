import { getDb } from "./mongo";
import type { DoctorAiTrainingSettings } from "@/types/training";
import { AI_TRAINING_CONSENT_VERSION } from "@/types/training";
import { nanoid } from "nanoid";

const COL = "doctor_settings";

const DEFAULT_AI: DoctorAiTrainingSettings = {
  enabled: false,
  consentedAt: null,
  consentVersion: null,
};

export async function getDoctorAiTrainingSettings(
  doctorId: string,
): Promise<DoctorAiTrainingSettings> {
  const db = await getDb();
  const doc = await db.collection(COL).findOne({ doctorId });
  if (!doc?.aiTraining) return { ...DEFAULT_AI };
  const t = doc.aiTraining as DoctorAiTrainingSettings;
  return {
    enabled: Boolean(t.enabled),
    consentedAt:
      typeof t.consentedAt === "string" ? t.consentedAt : null,
    consentVersion:
      typeof t.consentVersion === "string" ? t.consentVersion : null,
    learningEpoch: typeof t.learningEpoch === "string" ? t.learningEpoch : null,
  };
}

export async function setDoctorAiTrainingConsent(
  doctorId: string,
  enabled: boolean,
): Promise<DoctorAiTrainingSettings> {
  const db = await getDb();
  const now = new Date().toISOString();
  const aiTraining: DoctorAiTrainingSettings = enabled
    ? {
        enabled: true,
        consentedAt: now,
        consentVersion: AI_TRAINING_CONSENT_VERSION,
        learningEpoch: `consent_${nanoid(18)}`,
      }
    : {
        enabled: false,
        consentedAt: null,
        consentVersion: null,
        learningEpoch: null,
      };

  await db.collection(COL).updateOne(
    { doctorId },
    {
      $set: {
        doctorId,
        aiTraining,
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );
  return aiTraining;
}
